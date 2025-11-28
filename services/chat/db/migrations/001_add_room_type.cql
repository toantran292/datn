-- Migration: Add type field to rooms table
-- This migration adds a 'type' field to distinguish between channels and DMs

ALTER TABLE chat.rooms ADD type text;

-- Update existing rooms to be 'channel' type by default
-- Note: Cassandra doesn't support UPDATE without WHERE, so we'll handle this in application code

