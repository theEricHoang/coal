-- Migration 004: Fix date_purchased NULL values and set default
-- This migration updates existing NULL date_purchased values and sets a default for the column

-- Update existing NULL values to created_at (or current timestamp if created_at is also NULL)
UPDATE user_games 
SET date_purchased = COALESCE(created_at, CURRENT_TIMESTAMP)
WHERE date_purchased IS NULL;

-- Set default value for future inserts
ALTER TABLE user_games 
ALTER COLUMN date_purchased SET DEFAULT CURRENT_TIMESTAMP;

-- Set NOT NULL constraint
ALTER TABLE user_games 
ALTER COLUMN date_purchased SET NOT NULL;
