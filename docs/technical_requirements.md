\# Technical Requirements Document (TRD)

\*\*Project:\*\* SpotCheck

\*\*Stack:\*\* React Native (Expo Router), TypeScript, Supabase

\*\*Target:\*\* iOS & Android

\## 1. High-Level Architecture

\* \*\*Frontend:\*\* React Native (Expo Router).

\* \*\*Backend:\*\* Supabase (PostgreSQL, Auth, Edge Functions).

\* \*\*OCR Engine:\*\* \`react-native-mlkit-ocr\` (On-Device Text Recognition).

\* \*\*Intelligence:\*\* Google Gemini 1.5 Flash (via Supabase Edge Function).

\## 2. Data Privacy Rules (STRICT)

\* \*\*Zero-Image Storage:\*\* The app must NEVER upload the scanned image file to Supabase Storage.

\* \*\*Ephemeral Processing:\*\* \`image\_uri\` must be cleared from memory immediately after OCR text extraction.

\## 3. Database Schema (Supabase SQL)

\`\`\`sql

create table items (

id uuid default gen\_random\_uuid() primary key,

user\_id uuid references auth.users not null,

title text not null,

category text check (category in ('insurance', 'gov', 'sub', 'warranty', 'contract')),

expiry\_date date,

reminder\_date date,

cost\_monthly numeric,

renewal\_status text default 'active',

ocr\_raw\_text text, -- Stored for context (metadata only)

is\_scanned boolean default false,

created\_at timestamp with time zone default now()

);

\-- Row Level Security (RLS)

alter table items enable row level security;

create policy "Users can only see own items" on items

for all using (auth.uid() = user\_id);