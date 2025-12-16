-- Add role column to invitations table
ALTER TABLE invitations
ADD COLUMN role TEXT NOT NULL DEFAULT 'MEMBER';

-- Add check constraint for valid roles
ALTER TABLE invitations
ADD CONSTRAINT invitations_role_chk CHECK (role IN ('ADMIN', 'MEMBER'));
