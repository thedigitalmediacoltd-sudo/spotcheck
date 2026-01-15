# Chat Coach Edge Function

This Supabase Edge Function provides an AI chat coach that analyzes user expenses and provides financial advice.

## Setup

1. Deploy the function:
```bash
supabase functions deploy chat-coach
```

2. Set the Gemini API key as a secret (if not already set):
```bash
supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here
```

## Environment Variables

- `GEMINI_API_KEY` - Your Google Gemini API key (required)

## Usage

The function expects a POST request with:
```json
{
  "query": "How can I save money?",
  "items": [
    {
      "id": "uuid",
      "title": "Netflix",
      "category": "sub",
      "expiry_date": "2025-12-31",
      "cost_monthly": 10.99,
      "renewal_status": "active",
      "is_main_dealer": null
    }
  ]
}
```

Returns:
```json
{
  "response": "AI response text here"
}
```

## Features

- Analyzes user's expense list
- Identifies 'Wants' vs 'Needs'
- Calculates potential savings
- Provides direct, actionable advice
