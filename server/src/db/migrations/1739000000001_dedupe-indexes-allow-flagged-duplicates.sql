-- Up Migration

-- The original unique indexes (phone / email / source+external_property_id
-- +name) apply to every non-deleted row with no exception, which makes the
-- "Create anyway (flagged)" duplicate policy (spec §5.3) impossible: it
-- explicitly wants to insert a second row sharing the same phone/email for
-- manual review, is_duplicate=true, duplicate_of_id set. Scoping the unique
-- indexes to is_duplicate = false lets exactly one "primary" lead own a
-- given phone/email/property+name at a time while still allowing flagged
-- duplicates to coexist for review.

DROP INDEX IF EXISTS leads_phone_uniq;
DROP INDEX IF EXISTS leads_email_uniq;
DROP INDEX IF EXISTS leads_src_prop_uniq;

CREATE UNIQUE INDEX leads_phone_uniq ON leads (phone)
  WHERE phone IS NOT NULL AND deleted_at IS NULL AND is_duplicate = false;
CREATE UNIQUE INDEX leads_email_uniq ON leads (lower(email))
  WHERE email IS NOT NULL AND deleted_at IS NULL AND is_duplicate = false;
CREATE UNIQUE INDEX leads_src_prop_uniq ON leads (source, external_property_id, name_normalized)
  WHERE external_property_id IS NOT NULL AND deleted_at IS NULL AND is_duplicate = false;

-- Down Migration

DROP INDEX IF EXISTS leads_phone_uniq;
DROP INDEX IF EXISTS leads_email_uniq;
DROP INDEX IF EXISTS leads_src_prop_uniq;

CREATE UNIQUE INDEX leads_phone_uniq ON leads (phone) WHERE phone IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX leads_email_uniq ON leads (lower(email)) WHERE email IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX leads_src_prop_uniq ON leads (source, external_property_id, name_normalized)
  WHERE external_property_id IS NOT NULL AND deleted_at IS NULL;
