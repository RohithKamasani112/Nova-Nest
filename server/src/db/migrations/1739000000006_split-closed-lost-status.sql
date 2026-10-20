-- Up Migration
-- Keep the historical lost key and records intact; Closed is a separate stage.
UPDATE crm_lead_statuses SET label = 'Lost' WHERE value = 'closed_lost';
INSERT INTO crm_lead_statuses (value, label) VALUES ('closed', 'Closed');

-- Down Migration
-- The foreign key prevents removing Closed while leads still use it.
DELETE FROM crm_lead_statuses WHERE value = 'closed';
UPDATE crm_lead_statuses SET label = 'Closed / lost' WHERE value = 'closed_lost';
