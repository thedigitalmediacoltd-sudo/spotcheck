import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

interface AnalysisResult {
  title: string;
  category: 'insurance' | 'gov' | 'sub' | 'warranty' | 'contract';
  expiry_date: string | null; // DD/MM/YYYY format
  cost_amount: number | null;
  renewal_price: number | null; // Only for insurance
  cancellation_terms: string | null;
  vehicle_reg?: string | null; // Vehicle registration plate
  vehicle_make?: string | null; // Vehicle make (e.g., BMW, Ford)
  is_main_dealer?: boolean | null; // Whether service is from main dealer
  rip_off_alert?: string | null; // Alert message for main dealer overcharging
}

const SYSTEM_PROMPT = `You are a document analysis AI for SpotCheck, a UK-based life admin app. 
Extract the following information from the provided document text and return ONLY valid JSON:

Required fields:
- title: A concise title for the document (e.g., "Car Insurance - Direct Line")
- category: One of: "insurance", "gov", "sub", "warranty", or "contract"
- expiry_date: Expiry/renewal date in DD/MM/YYYY format, or null if not found
- cost_amount: Monthly or annual cost as a number (extract the numeric value), or null if not found
- renewal_price: Renewal price for insurance documents only, or null for other categories
- cancellation_terms: Key cancellation or exit clause terms, or null if not found

Optional vehicle-specific fields:
- vehicle_reg: Vehicle registration plate (e.g., "AB12 CDE") if found in the document, or null
- vehicle_make: Vehicle make/brand (e.g., "BMW", "Ford", "Vauxhall") if found, or null
- is_main_dealer: Boolean indicating if this is a service quote from a main dealer (e.g., "BMW Park Lane", "Ford TrustFord", "Mercedes-Benz Retail"), or null if not applicable
- rip_off_alert: Alert message for main dealer service overcharging (see special rules below), or null

Special rules for Car Service Quotes:
- If the document is a Car Service Quote from a 'Main Dealer' (identify by dealer names like "BMW Park Lane", "Ford TrustFord", "Mercedes-Benz Retail", "Audi Centre", etc.), you MUST:
  1. Set is_main_dealer to true
  2. Extract the labour rate per hour from the quote
  3. Compare it to the UK Independent average (£80/hr)
  4. If the dealer rate is higher than £80/hr, calculate the potential saving: (DealerRate - 80) * Hours
  5. Set rip_off_alert to: "You are paying Main Dealer rates. Switch to an independent specialist to save approx £[Amount]." (replace [Amount] with the calculated saving, rounded to nearest pound)
  6. If dealer rate is £80/hr or less, set rip_off_alert to null

General rules:
- Return ONLY valid JSON, no markdown, no code blocks
- Dates must be in DD/MM/YYYY format (UK format)
- If a field cannot be determined, use null
- For insurance documents, extract both cost_amount (current) and renewal_price if available
- For non-insurance documents, renewal_price should always be null
- Be precise with dates and numbers
- cancellation_terms should be a brief summary of exit clauses, not the full text
- For V11 Reminder or vehicle tax documents (category: "gov"), extract vehicle_reg if present

Example response for main dealer service:
{
  "title": "BMW Service Quote - Park Lane",
  "category": "contract",
  "expiry_date": null,
  "cost_amount": 450.00,
  "renewal_price": null,
  "cancellation_terms": null,
  "vehicle_reg": "AB12 CDE",
  "vehicle_make": "BMW",
  "is_main_dealer": true,
  "rip_off_alert": "You are paying Main Dealer rates. Switch to an independent specialist to save approx £120."
}

Example response for insurance:
{
  "title": "Car Insurance Policy",
  "category": "insurance",
  "expiry_date": "15/03/2025",
  "cost_amount": 45.99,
  "renewal_price": 52.50,
  "cancellation_terms": "Can cancel within 14 days for full refund. After that, pro-rata refund minus admin fee.",
  "vehicle_reg": null,
  "vehicle_make": null,
  "is_main_dealer": null,
  "rip_off_alert": null
}`;

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get request body
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid text field' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Call Gemini API
    const geminiResponse = await fetch(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${SYSTEM_PROMPT}\n\nDocument text:\n${text}`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to analyze document', details: errorText }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      return new Response(
        JSON.stringify({ error: 'No response from Gemini API' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse JSON response (handle potential markdown code blocks)
    let parsedResult: AnalysisResult;
    try {
      // Remove markdown code blocks if present
      const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResult = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON response from AI', 
          raw_response: responseText 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate category
    const validCategories = ['insurance', 'gov', 'sub', 'warranty', 'contract'];
    if (!validCategories.includes(parsedResult.category)) {
      return new Response(
        JSON.stringify({ error: 'Invalid category returned', category: parsedResult.category }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Return the structured data
    return new Response(
      JSON.stringify(parsedResult),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error in analyze-doc function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
