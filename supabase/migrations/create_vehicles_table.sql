-- Migration: Create Vehicles Table
-- Date: 2024
-- Description: Creates vehicles table for the Garage feature
-- Users can store multiple vehicles with MOT and tax expiry tracking

-- ============================================================================
-- VEHICLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  registration_number TEXT NOT NULL,
  make TEXT,
  model TEXT,
  color TEXT,
  year_of_manufacture INTEGER,
  mot_expiry_date DATE,
  tax_due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Ensure users can't have duplicate registration numbers
  UNIQUE(user_id, registration_number)
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on vehicles table
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Vehicles: Users can only view their own vehicles
CREATE POLICY "Users can view own vehicles"
  ON vehicles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Vehicles: Users can insert their own vehicles
CREATE POLICY "Users can insert own vehicles"
  ON vehicles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Vehicles: Users can update their own vehicles
CREATE POLICY "Users can update own vehicles"
  ON vehicles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Vehicles: Users can delete their own vehicles
CREATE POLICY "Users can delete own vehicles"
  ON vehicles
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for fetching vehicles by user (most common query)
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);

-- Index for registration number lookups
CREATE INDEX IF NOT EXISTS idx_vehicles_registration ON vehicles(registration_number);

-- Composite index for user + registration lookups
CREATE INDEX IF NOT EXISTS idx_vehicles_user_registration ON vehicles(user_id, registration_number);

-- Index for MOT expiry checks (urgency checks)
CREATE INDEX IF NOT EXISTS idx_vehicles_mot_expiry ON vehicles(mot_expiry_date);

-- Index for tax expiry checks (urgency checks)
CREATE INDEX IF NOT EXISTS idx_vehicles_tax_expiry ON vehicles(tax_due_date);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_vehicles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for vehicles updated_at
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_vehicles_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE vehicles IS 'User vehicles for the Garage feature';
COMMENT ON COLUMN vehicles.registration_number IS 'UK vehicle registration number (e.g., AB12 CDE)';
COMMENT ON COLUMN vehicles.mot_expiry_date IS 'MOT (Ministry of Transport) test expiry date';
COMMENT ON COLUMN vehicles.tax_due_date IS 'Vehicle Excise Duty (VED) tax due date';
