CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE project (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL,
    identifier VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    project_lead UUID,
    default_assignee UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_project_identifier UNIQUE (identifier)
);

CREATE TABLE sprint (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    goal TEXT,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE issue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    sprint_id UUID REFERENCES sprint(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    description_html TEXT,
    state VARCHAR(32) NOT NULL,
    priority VARCHAR(32) NOT NULL,
    type VARCHAR(32) NOT NULL,
    point NUMERIC(5,2),
    parent_id UUID REFERENCES issue(id) ON DELETE SET NULL,
    sequence_id BIGINT,
    sort_order INTEGER,
    start_date DATE,
    target_date DATE,
    assignees_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_issue_project_id ON issue(project_id);
CREATE INDEX idx_issue_sprint_id ON issue(sprint_id);
CREATE INDEX idx_issue_parent_id ON issue(parent_id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS
$$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_project_set_updated
BEFORE UPDATE ON project
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_sprint_set_updated
BEFORE UPDATE ON sprint
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_issue_set_updated
BEFORE UPDATE ON issue
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
