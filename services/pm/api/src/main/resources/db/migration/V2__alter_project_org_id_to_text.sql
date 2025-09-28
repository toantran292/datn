ALTER TABLE project
    ALTER COLUMN org_id TYPE VARCHAR(255) USING org_id::text;
