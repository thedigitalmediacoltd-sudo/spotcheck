# Analyze Document Edge Function

This Supabase Edge Function analyzes document text using Google Gemini 1.5 Flash API.

## Setup

1. Deploy the function:
```bash
supabase functions deploy analyze-doc
```

2. Set the Gemini API key as a secret:
```bash
supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here
```

## Environment Variables

- `GEMINI_API_KEY` - Your Google Gemini API key (required)

## Usage

The function expects a POST request with:
```json
{
  "text": "extracted OCR text here"
}
```

Returns structured JSON with:
- `title`: Document title
- `category`: One of: insurance, gov, sub, warranty, contract
- `expiry_date`: DD/MM/YYYY format or null
- `cost_amount`: Numeric value or null
- `renewal_price`: Numeric value (insurance only) or null
- `cancellation_terms`: String or null
