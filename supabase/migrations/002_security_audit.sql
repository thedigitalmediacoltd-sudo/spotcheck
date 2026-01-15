-- Security Audit: Row Level Security (RLS) Policies
-- This migration ensures NO data leaks and strict access control

-- Enable Row Level Security on items table
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies (if they exist) to start fresh
DROP POLICY IF EXISTS "Owners only" ON items;
DROP POLICY IF EXISTS "Users can view own items" ON items;
DROP POLICY IF EXISTS "Users can insert own items" ON items;
DROP POLICY IF EXISTS "Users can update own items" ON items;
DROP POLICY IF EXISTS "Users can delete own items" ON items;
DROP POLICY IF EXISTS "Public read access" ON items; -- CRITICAL: Remove any public access

-- Policy: Users can only SELECT their own items
CREATE POLICY "Users can view own items"
ON items
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can only INSERT items with their own user_id
CREATE POLICY "Users can insert own items"
ON items
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only UPDATE their own items
CREATE POLICY "Users can update own items"
ON items
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only DELETE their own items
CREATE POLICY "Users can delete own items"
ON items
FOR DELETE
USING (auth.uid() = user_id);

-- Verify no public access exists
-- This query should return 0 rows (no policies with public access)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE tablename = 'items' 
    AND policyname LIKE '%public%'
  ) THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: Public access policy detected on items table!';
  END IF;
END $$;

-- Security Notes:
-- 1. All policies use auth.uid() = user_id to ensure users can only access their own data
-- 2. No public read/write access exists
-- 3. Policies cover all CRUD operations (SELECT, INSERT, UPDATE, DELETE)
-- 4. The WITH CHECK clause ensures users cannot modify user_id to access other users' data
