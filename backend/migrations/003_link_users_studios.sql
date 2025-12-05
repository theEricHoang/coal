-- Migration: 003_link_users_studios.sql
-- Description: Add user_id foreign key to studios table to link studio accounts to user accounts
-- Date: 2025-12-05

-- Add user_id column to studios table
ALTER TABLE studios 
ADD COLUMN IF NOT EXISTS user_id INTEGER UNIQUE;

-- Add foreign key constraint
ALTER TABLE studios 
ADD CONSTRAINT fk_studios_user 
FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_studios_user ON studios(user_id);
