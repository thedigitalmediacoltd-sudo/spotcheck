-- Migration: Initial Schema Setup
-- Date: 2024-01-24
-- Description: Creates complete database schema for SpotCheck app
-- Includes: profiles table, items table, RLS policies, triggers, and indexes

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
-- Extends auth.users with app-specific user data
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_pro BOOLEAN DEFAULT false NOT NULL,
  scan_count INTEGER DEFAULT 0 NOT NULL,
  free_scans_limit INTEGER DEFAULT 1 NOT NULL,
  last_scan_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- ITEMS TABLE
-- ============================================================================
-- Stores user's bills, contracts, and subscriptions
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('insurance', 'gov', 'sub', 'warranty', 'contract')),
  expiry_date DATE,
  cost_monthly DECIMAL(10,2),
  renewal_price DECIMAL(10,2),
  cancellation_terms TEXT,
  
  -- Vehicle Logic Fields
  vehicle_reg TEXT,
  vehicle_make TEXT,
  is_main_dealer BOOLEAN DEFAULT false,
  
  -- Negotiation Fields
  renewal_status TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on items table
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Profiles: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Profiles: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Profiles: Users can delete their own profile
CREATE POLICY "Users can delete own profile"
  ON profiles
  FOR DELETE
  USING (auth.uid() = id);

-- Items: Users can only view their own items
CREATE POLICY "Users can view own items"
  ON items
  FOR SELECT
  USING (auth.uid() = user_id);

-- Items: Users can insert their own items
CREATE POLICY "Users can insert own items"
  ON items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Items: Users can update their own items
CREATE POLICY "Users can update own items"
  ON items
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Items: Users can delete their own items
CREATE POLICY "Users can delete own items"
  ON items
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, is_pro, scan_count, free_scans_limit)
  VALUES (
    NEW.id,
    false,
    0,
    1
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function on new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for items updated_at
CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Profiles indexes
-- Index for profile lookups (primary key already indexed, but explicit for clarity)
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- Index for scan count checks (paywall logic)
CREATE INDEX IF NOT EXISTS idx_profiles_scan_count ON profiles(scan_count);

-- Items indexes
-- Index for fetching items by user (most common query)
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);

-- Index for filtering by expiry date (urgency checks)
CREATE INDEX IF NOT EXISTS idx_items_expiry ON items(expiry_date);

-- Composite index for common query: user items sorted by expiry
CREATE INDEX IF NOT EXISTS idx_items_user_expiry ON items(user_id, expiry_date);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);

-- Composite index for category filtering with user
CREATE INDEX IF NOT EXISTS idx_items_user_category ON items(user_id, category);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE profiles IS 'User profiles extending auth.users with app-specific data';
COMMENT ON TABLE items IS 'User bills, contracts, and subscriptions';
COMMENT ON COLUMN profiles.is_pro IS 'Whether user has Pro subscription';
COMMENT ON COLUMN profiles.scan_count IS 'Number of scans used in current month';
COMMENT ON COLUMN profiles.free_scans_limit IS 'Monthly scan limit for free users';
COMMENT ON COLUMN items.is_main_dealer IS 'Whether item is from a main dealer (for savings detection)';
COMMENT ON COLUMN items.renewal_status IS 'Status of renewal negotiation (e.g., negotiating, completed)';
