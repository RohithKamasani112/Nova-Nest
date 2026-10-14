-- Up Migration
CREATE TABLE integration_lead_dedupe (
  provider text NOT NULL,
  dedupe_key text NOT NULL,
  lead_id uuid NOT NULL REFERENCES leads(id) DEFERRABLE INITIALLY DEFERRED,
  received_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, dedupe_key)
);
CREATE INDEX integration_lead_dedupe_lead_idx ON integration_lead_dedupe (lead_id);

-- Down Migration
DROP TABLE integration_lead_dedupe;
