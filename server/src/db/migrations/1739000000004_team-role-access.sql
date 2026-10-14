-- Up Migration
ALTER TABLE users ADD COLUMN username text;
ALTER TABLE users ADD COLUMN source_scope text[] NOT NULL DEFAULT '{}';
ALTER TABLE users ADD COLUMN session_version integer NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX users_username_lower_unique ON users (lower(username)) WHERE username IS NOT NULL;
CREATE UNIQUE INDEX agents_user_unique ON agents (user_id) WHERE user_id IS NOT NULL;
ALTER TABLE users ADD CONSTRAINT users_crm_source_scope CHECK (
  source_scope <@ ARRAY['magicbricks','housing','99acres','website','personal']::text[]
);
-- Retire unrestricted shared sales credentials; admin creates scoped replacements.
UPDATE users SET is_active = false, session_version = session_version + 1 WHERE role = 'sales';

-- Down Migration
ALTER TABLE users DROP CONSTRAINT users_crm_source_scope;
DROP INDEX agents_user_unique;
DROP INDEX users_username_lower_unique;
ALTER TABLE users DROP COLUMN session_version;
ALTER TABLE users DROP COLUMN source_scope;
ALTER TABLE users DROP COLUMN username;
