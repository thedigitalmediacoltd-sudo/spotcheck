import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const DVLA_API_KEY = Deno.env.get('DVLA_API_KEY');
const DVLA_API_URL = 'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles';

interface VehicleData {
  registrationNumber: string;
  make?: string;
  model?: string;
  color?: string;
  yearOfManufacture?: number;
  motExpiryDate?: string | null;
  taxDueDate?: string | null;
}

// Mock data for TESTCAR registration
const MOCK_VEHICLE_DATA: VehicleData = {
  registrationNumber: 'TESTCAR',
  make: 'Tesla',
  model: 'Model 3',
  color: 'White',
  yearOfManufacture: 2024,
  motExpiryDate: null, // EVs don't require MOT
  taxDueDate: null, // EVs are tax-exempt
};

serve(async (req) => {
  // Handle CORS preflight
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
    // Parse request body
    const { registration_number } = await req.json();

    // Validate registration number
    if (!registration_number || typeof registration_number !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Registration number is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Normalize registration number (remove spaces, convert to uppercase)
    const normalizedReg = registration_number.replace(/\s+/g, '').toUpperCase();

    // Return mock data for TESTCAR
    if (normalizedReg === 'TESTCAR') {
      return new Response(
        JSON.stringify({
          success: true,
          data: MOCK_VEHICLE_DATA,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Call DVLA API for real registration numbers
    if (!DVLA_API_KEY) {
      return new Response(
        JSON.stringify({
          error: 'DVLA API key not configured',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Call DVLA Vehicle Enquiry API
    const dvlaResponse = await fetch(DVLA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': DVLA_API_KEY,
      },
      body: JSON.stringify({
        registrationNumber: normalizedReg,
      }),
    });

    if (!dvlaResponse.ok) {
      const errorText = await dvlaResponse.text();
      console.error('DVLA API error:', dvlaResponse.status, errorText);
      
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch vehicle data from DVLA',
          details: dvlaResponse.status === 404 
            ? 'Vehicle not found' 
            : 'DVLA API error',
        }),
        {
          status: dvlaResponse.status || 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const dvlaData = await dvlaResponse.json();

    // Transform DVLA response to our VehicleData format
    const vehicleData: VehicleData = {
      registrationNumber: normalizedReg,
      make: dvlaData.make || undefined,
      model: dvlaData.model || undefined,
      color: dvlaData.colour || undefined,
      yearOfManufacture: dvlaData.yearOfManufacture 
        ? parseInt(dvlaData.yearOfManufacture, 10) 
        : undefined,
      motExpiryDate: dvlaData.motExpiryDate || null,
      taxDueDate: dvlaData.taxDueDate || null,
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: vehicleData,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching vehicle data:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
