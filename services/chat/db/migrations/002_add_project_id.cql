-- Add project_id column to rooms table for project-specific channels
-- null = org-level channel/DM
-- uuid = project-specific channel

ALTER TABLE chat.rooms ADD project_id uuid;

-- Note: Existing rows will have project_id = null (org-level)
