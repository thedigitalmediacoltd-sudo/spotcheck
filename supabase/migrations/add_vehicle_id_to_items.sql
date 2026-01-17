-- Migration: Add vehicle_id to items table
-- Date: 2024
-- Description: Links subscriptions/documents to vehicles
-- Allows items to be associated with a specific vehicle in the user's garage

-- Add vehicle_id column to items table
ALTER TABLE items
ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL;

-- Add index for vehicle_id lookups (common query pattern)
CREATE INDEX IF NOT EXISTS idx_items_vehicle_id ON items(vehicle_id);

-- Add composite index for user + vehicle lookups
CREATE INDEX IF NOT EXISTS idx_items_user_vehicle ON items(user_id, vehicle_id);

-- Add comment for documentation
COMMENT ON COLUMN items.vehicle_id IS 'Links item to a specific vehicle in the user''s garage';
