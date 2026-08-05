-- Up Migration

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TYPE lead_source   AS ENUM ('housing','magicbricks','99acres','personal');
CREATE TYPE lead_status   AS ENUM ('new','contacted','follow_up','site_visit_scheduled',
                                   'site_visit_done','negotiation','converted','closed_lost','junk');
CREATE TYPE listing_type  AS ENUM ('rent','sale','resale','pg','commercial','other');

-- Minimal real-auth table backing the admin login (replaces the previous
-- hardcoded frontend-only credential check). Not part of the user's original
-- CRM spec, but required so agents/batches/activities have a real actor id.
CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  name          text NOT NULL,
  role          text NOT NULL DEFAULT 'admin',
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE agents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  name_normalized text NOT NULL UNIQUE,   -- lower(trim(collapse_ws(name)))
  email         text,
  phone         text,
  is_active     boolean NOT NULL DEFAULT true,
  user_id       uuid REFERENCES users(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE lead_import_batches (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source            lead_source NOT NULL,
  file_name         text NOT NULL,
  file_size         bigint,
  file_hash         text,
  detected_format   text,
  detected_headers  jsonb,
  applied_mapping   jsonb,
  rows_read         int DEFAULT 0,
  rows_imported     int DEFAULT 0,
  rows_duplicate    int DEFAULT 0,
  rows_error        int DEFAULT 0,
  warnings          jsonb DEFAULT '[]',
  errors            jsonb DEFAULT '[]',
  new_columns       jsonb DEFAULT '[]',
  duplicate_policy  text DEFAULT 'skip',
  default_agent_id  uuid REFERENCES agents(id),
  status            text NOT NULL DEFAULT 'pending',
  uploaded_by       uuid REFERENCES users(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  completed_at      timestamptz
);

CREATE TABLE leads (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source               lead_source NOT NULL,
  batch_id             uuid REFERENCES lead_import_batches(id) ON DELETE SET NULL,

  name                 text NOT NULL,
  name_normalized      text NOT NULL,
  phone                text,
  phone_raw            text,
  email                text,
  alt_phone            text,

  lead_date            timestamptz,
  external_property_id text,
  project_name         text,
  property_type        text,
  property_description text,
  listing_type         listing_type,
  configuration        text,
  bedrooms             smallint,
  price_raw            text,
  price_value          numeric(14,2),
  city                 text,
  locality             text,
  state                text,
  address              text,
  message              text,
  lead_type            text,
  source_status        text,

  agent_id             uuid REFERENCES agents(id) ON DELETE SET NULL,
  status               lead_status NOT NULL DEFAULT 'new',
  sub_status           text,
  notes                text,
  next_follow_up_at    timestamptz,
  first_contacted_at   timestamptz,
  converted_at         timestamptz,
  closed_at            timestamptz,
  lost_reason          text,
  deal_value           numeric(14,2),
  enquiry_count        int NOT NULL DEFAULT 1,

  is_duplicate         boolean NOT NULL DEFAULT false,
  duplicate_of_id      uuid REFERENCES leads(id),

  raw_data             jsonb NOT NULL DEFAULT '{}',
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  deleted_at           timestamptz
);

CREATE TABLE lead_activities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type        text NOT NULL,
  from_status lead_status,
  to_status   lead_status,
  content     text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_by  uuid REFERENCES users(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE lead_duplicates (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  existing_lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  batch_id         uuid REFERENCES lead_import_batches(id) ON DELETE CASCADE,
  incoming_source  lead_source NOT NULL,
  matched_on       text NOT NULL,
  incoming_payload jsonb NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE source_column_registry (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source        lead_source NOT NULL,
  raw_header    text NOT NULL,
  normalized    text NOT NULL,
  mapped_field  text,
  sample_value  text,
  times_seen    int NOT NULL DEFAULT 1,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, normalized)
);

CREATE TABLE source_mapping_overrides (
  source        lead_source NOT NULL,
  normalized    text NOT NULL,
  mapped_field  text NOT NULL,
  updated_by    uuid REFERENCES users(id),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source, normalized)
);

-- Dedupe enforcement (spec §5.2) — done in the DB so concurrent uploads can't race.
CREATE UNIQUE INDEX leads_phone_uniq ON leads (phone) WHERE phone IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX leads_email_uniq ON leads (lower(email)) WHERE email IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX leads_src_prop_uniq ON leads (source, external_property_id, name_normalized)
  WHERE external_property_id IS NOT NULL AND deleted_at IS NULL;

-- Query-pattern indexes
CREATE INDEX leads_created_at_idx ON leads (created_at DESC);
CREATE INDEX leads_lead_date_idx ON leads (lead_date DESC);
CREATE INDEX leads_agent_status_idx ON leads (agent_id, status);
CREATE INDEX leads_source_lead_date_idx ON leads (source, lead_date);
CREATE INDEX leads_status_idx ON leads (status);
CREATE INDEX leads_next_follow_up_idx ON leads (next_follow_up_at) WHERE next_follow_up_at IS NOT NULL;
CREATE INDEX leads_city_idx ON leads (city);
CREATE INDEX leads_project_name_idx ON leads (project_name);
CREATE INDEX leads_raw_data_gin_idx ON leads USING GIN (raw_data);
CREATE INDEX leads_name_normalized_trgm_idx ON leads USING GIN (name_normalized gin_trgm_ops);

CREATE INDEX lead_activities_lead_id_idx ON lead_activities (lead_id, occurred_at DESC);
CREATE INDEX lead_duplicates_existing_lead_idx ON lead_duplicates (existing_lead_id);
CREATE INDEX lead_duplicates_batch_idx ON lead_duplicates (batch_id);
CREATE INDEX lead_import_batches_created_at_idx ON lead_import_batches (created_at DESC);

-- updated_at maintenance
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_set_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Every status change is logged automatically, even if some future code path
-- forgets to. The application sets app.current_user_id via set_config() in
-- the same transaction as the UPDATE so the trigger can attribute it;
-- if that wasn't set (e.g. a manual SQL fix), created_by is left NULL.
CREATE OR REPLACE FUNCTION log_lead_status_change()
RETURNS trigger AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO lead_activities (lead_id, type, from_status, to_status, occurred_at, created_by)
    VALUES (
      NEW.id, 'status_change', OLD.status, NEW.status, now(),
      NULLIF(current_setting('app.current_user_id', true), '')::uuid
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_log_status_change
  AFTER UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION log_lead_status_change();

-- Down Migration

DROP TRIGGER IF EXISTS leads_log_status_change ON leads;
DROP FUNCTION IF EXISTS log_lead_status_change();
DROP TRIGGER IF EXISTS leads_set_updated_at ON leads;
DROP TRIGGER IF EXISTS users_set_updated_at ON users;
DROP FUNCTION IF EXISTS set_updated_at();

DROP TABLE IF EXISTS source_mapping_overrides;
DROP TABLE IF EXISTS source_column_registry;
DROP TABLE IF EXISTS lead_duplicates;
DROP TABLE IF EXISTS lead_activities;
DROP TABLE IF EXISTS leads;
DROP TABLE IF EXISTS lead_import_batches;
DROP TABLE IF EXISTS agents;
DROP TABLE IF EXISTS users;

DROP TYPE IF EXISTS listing_type;
DROP TYPE IF EXISTS lead_status;
DROP TYPE IF EXISTS lead_source;
