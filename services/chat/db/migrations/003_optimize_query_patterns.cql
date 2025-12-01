-- Migration: Optimize schema for specific query patterns
-- This redesigns tables to support efficient queries without ALLOW FILTERING

-- ============================================================
-- 1. Main rooms table - keep for room details lookup
-- ============================================================
-- No changes needed, but adding index for project queries

-- ============================================================
-- 2. User-joined rooms lookup table
-- Query: Get all joined rooms for a user in an org
-- ============================================================

CREATE TABLE IF NOT EXISTS chat.user_rooms (
  user_id     uuid,
  org_id      uuid,
  room_id     timeuuid,
  room_type   text,        -- 'channel' or 'dm'
  room_name   text,
  is_private  boolean,
  project_id  uuid,        -- null for org-level, uuid for project-specific
  joined_at   timestamp,
  last_seen_message_id timeuuid,

  PRIMARY KEY ((user_id, org_id), room_id)
) WITH CLUSTERING ORDER BY (room_id DESC);

-- ============================================================
-- 3. User-joined rooms by project lookup table
-- Query: Get all joined rooms for a user in an org + project
-- ============================================================

CREATE TABLE IF NOT EXISTS chat.user_project_rooms (
  user_id     uuid,
  org_id      uuid,
  project_id  uuid,
  room_id     timeuuid,
  room_type   text,
  room_name   text,
  is_private  boolean,
  joined_at   timestamp,
  last_seen_message_id timeuuid,

  PRIMARY KEY ((user_id, org_id, project_id), room_id)
) WITH CLUSTERING ORDER BY (room_id DESC);

-- ============================================================
-- 4. User DMs lookup table
-- Query: Get all DMs for a user in an org
-- ============================================================

CREATE TABLE IF NOT EXISTS chat.user_dms (
  user_id     uuid,
  org_id      uuid,
  room_id     timeuuid,
  room_name   text,
  joined_at   timestamp,
  last_seen_message_id timeuuid,

  PRIMARY KEY ((user_id, org_id), room_id)
) WITH CLUSTERING ORDER BY (room_id DESC);

-- ============================================================
-- 5. Room members table - keep existing structure
-- Used for: checking membership, getting members of a room
-- ============================================================
-- Keep existing chat.room_members table as-is

-- ============================================================
-- Notes on data consistency:
-- ============================================================
-- When a user joins a room, we need to write to multiple tables:
-- 1. chat.room_members (existing)
-- 2. chat.user_rooms (new)
-- 3. chat.user_project_rooms (if project_id != null)
-- 4. chat.user_dms (if room_type = 'dm')
--
-- When updating last_seen_message_id:
-- - Update chat.room_members
-- - Update chat.user_rooms
-- - Update chat.user_project_rooms (if applicable)
-- - Update chat.user_dms (if applicable)
--
-- This is denormalization trade-off: more writes, but much faster reads
