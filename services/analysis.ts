import { supabase } from '@/lib/supabase';

export interface AnalysisResult {
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

export interface VehicleTaxInfo {
  tax_due_date: string; // YYYY-MM-DD format
  rate: number; // Tax rate in pounds
}

/**
 * Analyzes extracted text using the Supabase Edge Function with Gemini AI.
 * 
 * @param text - The OCR-extracted text to analyze
 * @returns Structured analysis result with extracted fields
 * @throws Error if analysis fails
 */
export async function analyzeText(text: string): Promise<AnalysisResult> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }

  try {
    const { data, error } = await supabase.functions.invoke('analyze-doc', {
      body: { text },
    });

    if (error) {
      throw new Error(`Analysis failed: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from analysis function');
    }

    // Validate the response structure
    const result = data as AnalysisResult;

    // Basic validation
    if (!result.title || typeof result.title !== 'string') {
      throw new Error('Invalid analysis result: missing or invalid title');
    }

    const validCategories = ['insurance', 'gov', 'sub', 'warranty', 'contract'];
    if (!validCategories.includes(result.category)) {
      throw new Error(`Invalid analysis result: invalid category ${result.category}`);
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Analysis failed: ${error}`);
  }
}

/**
 * Checks vehicle tax status via DVLA Vehicle Enquiry Service.
 * For V11 Reminder documents or when a registration plate is provided.
 * 
 * @param reg - Vehicle registration plate (e.g., "AB12 CDE")
 * @returns Vehicle tax information including due date and rate
 * @throws Error if check fails
 */
export async function checkVehicleTax(reg: string): Promise<VehicleTaxInfo> {
  if (!reg || reg.trim().length === 0) {
    throw new Error('Registration plate cannot be empty');
  }

  // Normalize registration plate (remove spaces, uppercase)
  const normalizedReg = reg.replace(/\s+/g, '').toUpperCase();

  // TODO: Implement actual DVLA Vehicle Enquiry Service API call
  // The DVLA API requires:
  // - API key from DVLA
  // - POST request to https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles
  // - Request body: { "registrationNumber": "AB12CDE" }
  // 
  // For now, return mock data to allow wiring up the feature
  // This will be replaced with actual API integration later
  
  try {
    // Placeholder: Mock response for development
    // In production, this should call the DVLA API
    const mockResponse: VehicleTaxInfo = {
      tax_due_date: '2026-05-01',
      rate: 190,
    };

    // Uncomment below when ready to integrate with DVLA API:
    /*
    const DVLA_API_KEY = process.env.EXPO_PUBLIC_DVLA_API_KEY;
    if (!DVLA_API_KEY) {
      throw new Error('DVLA API key not configured');
    }

    const response = await fetch(
      'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles',
      {
        method: 'POST',
        headers: {
          'x-api-key': DVLA_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationNumber: normalizedReg,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DVLA API error: ${errorText}`);
    }

    const data = await response.json();
    
    return {
      tax_due_date: data.taxDueDate || data.taxStatus, // Adjust based on actual API response
      rate: data.rateBand || 0, // Adjust based on actual API response
    };
    */

    return mockResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Vehicle tax check failed: ${error}`);
  }
}
