-- UC08: Organization Status (Lock/Unlock)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS lock_reason TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES users(id);

-- Index for filtering by status
CREATE INDEX idx_organizations_status ON organizations(status);
