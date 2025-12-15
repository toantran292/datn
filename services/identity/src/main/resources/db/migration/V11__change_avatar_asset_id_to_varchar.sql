-- Change avatar_asset_id from UUID to VARCHAR to support MongoDB ObjectId format from file-storage
ALTER TABLE users ALTER COLUMN avatar_asset_id TYPE VARCHAR(64) USING avatar_asset_id::VARCHAR;
