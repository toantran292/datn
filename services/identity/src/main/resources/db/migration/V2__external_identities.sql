CREATE TABLE IF NOT EXISTS external_identities (
   provider   TEXT    NOT NULL, -- 'google'
   subject    TEXT    NOT NULL, -- sub từ id_token
   user_id    UUID    NOT NULL, -- users.id
   email      CITEXT,
   created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
   PRIMARY KEY (provider, subject)
);

CREATE INDEX IF NOT EXISTS idx_external_by_user ON external_identities(user_id);