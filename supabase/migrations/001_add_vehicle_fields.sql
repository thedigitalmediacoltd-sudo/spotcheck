-- Migration: Add vehicle-specific fields to items table
-- Date: 2024
-- Description: Adds fields for vehicle registration, make, and main dealer flag

-- Add vehicle-specific columns
alter table items
  add column if not exists vehicle_reg text,
  add column if not exists vehicle_make text,
  add column if not exists is_main_dealer boolean;

-- Add comments for documentation
comment on column items.vehicle_reg is 'Vehicle registration plate (e.g., "AB12 CDE")';
comment on column items.vehicle_make is 'Vehicle make/brand (e.g., "BMW", "Ford")';
comment on column items.is_main_dealer is 'Whether service is from a main dealer (true) or independent (false)';
