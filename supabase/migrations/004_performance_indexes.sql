-- Migration: Performance Indexes for Query Optimization
-- Date: 2024
-- Description: Adds indexes to frequently queried columns to dramatically improve query performance

-- Index for fetching items by user (Dashboard queries)
-- This is the most common query: SELECT * FROM items WHERE user_id = ?
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);

-- Index for filtering by expiry date (Urgency checks)
-- Used for: WHERE expiry_date <= ? AND user_id = ?
-- Speeds up "Urgent" filter and sorting by expiry
CREATE INDEX IF NOT EXISTS idx_items_expiry ON items(expiry_date);

-- Composite index for common query pattern: user_id + expiry_date
-- Optimizes: WHERE user_id = ? ORDER BY expiry_date ASC
CREATE INDEX IF NOT EXISTS idx_items_user_expiry ON items(user_id, expiry_date);

-- Index for checking scan counts (Paywall logic)
-- Used for: SELECT scan_count FROM profiles WHERE id = ?
CREATE INDEX IF NOT EXISTS idx_profiles_scan_count ON profiles(scan_count);

-- Index for profile lookups (frequent in auth flow)
-- Used for: SELECT * FROM profiles WHERE id = ?
-- Note: This might already exist as primary key index, but explicit for clarity
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- Index for filtering by category (Dashboard filter chips)
-- Used for: WHERE user_id = ? AND category = ?
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);

-- Composite index for category filtering with user
-- Optimizes: WHERE user_id = ? AND category = ? ORDER BY expiry_date
CREATE INDEX IF NOT EXISTS idx_items_user_category ON items(user_id, category);

-- Comments for documentation
COMMENT ON INDEX idx_items_user_id IS 'Speeds up fetching all items for a user (Dashboard)';
COMMENT ON INDEX idx_items_expiry IS 'Speeds up filtering by expiry date (Urgency checks)';
COMMENT ON INDEX idx_items_user_expiry IS 'Optimizes common query: user items sorted by expiry';
COMMENT ON INDEX idx_profiles_scan_count IS 'Speeds up scan count checks for paywall logic';
COMMENT ON INDEX idx_items_category IS 'Speeds up category filtering in Dashboard';
