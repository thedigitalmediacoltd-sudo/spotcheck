# SpotCheck: Bill Defender

A privacy-first admin automation app for UK users.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file in the root directory:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Start the development server:
```bash
npm start
```

## Project Structure

- `app/` - Expo Router app directory
  - `(auth)/` - Authentication screens
  - `(tabs)/` - Main app screens
- `context/` - React contexts (Auth, etc.)
- `lib/` - Utility functions and clients
- `types/` - TypeScript type definitions
