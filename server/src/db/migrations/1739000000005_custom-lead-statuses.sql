-- Up Migration
-- User-defined statuses are data, rather than changes to a PostgreSQL enum.
CREATE TABLE crm_lead_statuses (
  value text PRIMARY KEY,
  label text NOT NULL CHECK (char_length(label) BETWEEN 1 AND 60),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX crm_lead_statuses_label_unique ON crm_lead_statuses (lower(label));
INSERT INTO crm_lead_statuses (value, label) VALUES
 ('new', 'New'), ('contacted', 'Contacted'), ('follow_up', 'Follow-up'),
 ('site_visit_scheduled', 'Site visit scheduled'), ('site_visit_done', 'Site visit done'),
 ('negotiation', 'Negotiation'), ('converted', 'Converted'), ('closed_lost', 'Closed / lost'), ('junk', 'Junk'),
 ('not_answered', 'Didn''t pick up'), ('switched_off', 'Switched off'), ('number_busy', 'Number busy'),
 ('call_back_later', 'Asked to call back later'), ('not_reachable', 'Not reachable'),
 ('interested', 'Interested'), ('details_shared', 'Details shared on WhatsApp'),
 ('discussing_with_family', 'Discussing with family'), ('wrong_number', 'Wrong number'),
 ('not_interested', 'Not interested');
ALTER TABLE leads ALTER COLUMN status DROP DEFAULT;
ALTER TABLE leads ALTER COLUMN status TYPE text USING status::text;
ALTER TABLE leads ALTER COLUMN status SET DEFAULT 'new';
ALTER TABLE lead_activities ALTER COLUMN from_status TYPE text USING from_status::text;
ALTER TABLE lead_activities ALTER COLUMN to_status TYPE text USING to_status::text;
ALTER TABLE leads ADD CONSTRAINT leads_registered_status FOREIGN KEY (status) REFERENCES crm_lead_statuses(value);

-- Down Migration
-- Refuse rollback while custom statuses are in use, preserving existing records.
ALTER TABLE leads DROP CONSTRAINT leads_registered_status;
ALTER TABLE leads ALTER COLUMN status DROP DEFAULT;
ALTER TABLE leads ALTER COLUMN status TYPE lead_status USING status::lead_status;
ALTER TABLE leads ALTER COLUMN status SET DEFAULT 'new'::lead_status;
ALTER TABLE lead_activities ALTER COLUMN from_status TYPE lead_status USING from_status::lead_status;
ALTER TABLE lead_activities ALTER COLUMN to_status TYPE lead_status USING to_status::lead_status;
DROP TABLE crm_lead_statuses;
