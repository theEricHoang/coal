-- Migration: 002_add_image_fields.sql
-- Description: Add profile_picture field to users and thumbnail field to games
-- Date: 2025-12-05

-- Add profile_picture column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(255) DEFAULT 'images/monk_pfp.png';

-- Add thumbnail column to games table
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS thumbnail VARCHAR(255);
