import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

interface Item {
  id: string;
  title: string;
  category: 'insurance' | 'gov' | 'sub' | 'warranty' | 'contract';
  expiry_date: string | null;
  cost_monthly: number | null;
  renewal_status: string;
  is_main_dealer: boolean | null;
}

interface ChatRequest {
  query: string;
  items: Item[];
}

const SYSTEM_PROMPT = `You are Spot, a ruthless but helpful financial auditor. You have access to the user's expense list (provided in JSON). Your goal is to identify 'Wants' (Netflix, Spotify, Gym, subscriptions) vs 'Needs' (Rent, Insurance, Tax, essential services) and suggest cuts. Be specific: calculate total savings if they cut the 'Wants'. Keep answers short and punchy (max 3-4 sentences). Be direct but friendly.`;

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
    const { query, items }: ChatRequest = await req.json();

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid query field' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!Array.isArray(items)) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid items array' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Format items for context
    const itemsContext = items.map(item => ({
      title: item.title,
      category: item.category,
      cost: item.cost_monthly,
      status: item.renewal_status,
      isMainDealer: item.is_main_dealer,
    }));

    // Construct the prompt
    const prompt = `${SYSTEM_PROMPT}

User's expenses:
${JSON.stringify(itemsContext, null, 2)}

User's question: ${query}

Provide a helpful, direct response:`;

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
                  text: prompt,
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
        JSON.stringify({ error: 'Failed to get AI response', details: errorText }),
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

    // Return the plain text response
    return new Response(
      JSON.stringify({ response: responseText.trim() }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error in chat-coach function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
