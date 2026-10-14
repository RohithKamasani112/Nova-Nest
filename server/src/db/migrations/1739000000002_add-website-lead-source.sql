-- Up Migration

-- The public website's own contact/quote forms (Nova Nest's QuoteModal,
-- ContactForm, PropertyDetailsPage quick-enquiry buttons) now submit
-- straight into this CRM instead of the old S3 leads.json blob. None of the
-- original import sources ('housing','magicbricks','99acres','personal')
-- describe a lead that walked in through the public site, so it needs its
-- own enum value to stay distinguishable in the leads list / filters.
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'website';

-- Down Migration

-- Postgres cannot drop a single enum value in place (would need to rebuild
-- the type and every column/index using it). Down migrations for this file
-- are intentionally a no-op — rolling back past this point requires a
-- manual rebuild of the lead_source enum if it's ever truly needed.
