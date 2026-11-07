# Release and recovery

This feature branch contains frontend AND backend contract changes. Push it for review; do not deploy the frontend alone.

## Release sequence

1. Run `npm ci`, `npm run check`, `npm ci --prefix server`, `npm run test:inventory --prefix server`, and browser tests (`npx playwright install chromium`, `npm run test:browser`). CI runs the same source checks.
2. Check deployment configuration. Private AWS values must not have VITE_ prefixes. Use a Lambda execution role in production. The local .env frontend credential names were changed to server-only AWS names; the file remains ignored. Review and rotate any previously exposed credentials through the account owner. Do not copy local AWS values into Amplify.
3. Take a storage snapshot, pause admin writes briefly, deploy the backend, deploy the matching frontend, and ask administrators to reload old tabs. Old collection-wide property/billing saves deliberately fail rather than silently overwriting newer records.
4. Verify a create/edit, stale-edit conflict, deactivate/reactivate, archive/restore, public enquiry, CRM dashboard, PDF share and each billing template against controlled test records. Do not use real customer contact details for testing.
5. Normalize existing locality names from Manage Properties. The action displays a confirmation count and records every update. Missing or ambiguous addresses still need an administrator to select the correct locality. No live data backfill was performed by this coding session.

## Backups and recovery

The application preserves media on archive and permanent inventory removal. This avoids deleting an asset referenced by another listing. Implement media garbage collection separately after auditing references.

The SDK helper uses credentials from the standard server/CLI environment; it never logs object contents or accepts credential arguments:

```
node scripts/storage-backup.mjs check --bucket YOUR_BUCKET --folder YOUR_FOLDER
node scripts/storage-backup.mjs snapshot --bucket YOUR_BUCKET --folder YOUR_FOLDER
node scripts/storage-backup.mjs restore --bucket YOUR_BUCKET --folder YOUR_FOLDER --snapshot SNAPSHOT_TIMESTAMP --confirm
```

Snapshot copies listing metadata, document history, server counters and sitemap to encrypted objects under FOLDER/backups/TIMESTAMP/. It is a metadata recovery tool, not a backup of CRM PostgreSQL or listing images. Enable S3 versioning, lifecycle retention and automated snapshots in infrastructure; enable managed PostgreSQL point-in-time backups separately. The helper does not change bucket policies or versioning. Confirm IAM permissions on the backups prefix before scheduling it.

For restore: pause writes, take a fresh snapshot, record the intended historical timestamp, restore, verify public/admin/billing behavior, then resume writes. Conditional writes reject concurrent changes to an individual destination object, but restoring multiple objects is not a transaction. A failed restore can be partial: keep writes paused, inspect the log, resolve the failure and restore a consistent snapshot. For a numbering rollback, reconcile issued documents before resuming billing; never reuse an already-issued invoice number.

## Observability

Backend responses include an X-Request-Id; unexpected failures return the same reference. Structured logs identify failed routes, inventory mutations and actors without logging enquiry bodies or credentials. Configure alerting on repeated 5xx errors, lead-intake failures and inventory write conflicts in the deployment's log/metrics service. Live alarms, backup schedules, S3 versioning and credential rotation were not changed by this branch.

## SEO limits

Client-side canonical/noindex metadata, archived-listing exclusion and unavailable states are implemented. A static SPA cannot set a true per-property HTTP 404/410 status or deliver per-property Open Graph HTML to non-JavaScript scrapers. That requires an approved hosting rewrite, edge renderer or server-rendered route. Do not claim an HTTP status change until it is implemented and tested on the actual hosting platform.

## Product semantics

Saved searches and shortlists are local to the browser. They do not create an account or send notifications. Compare up to three active listings. BHK is exact for 1-4; 5+ includes larger homes. Plot and commercial listings have no BHK. Verification means the listing was marked checked by the Nova Nest team, not a guarantee or a fabricated verification date. Number reservations may have gaps after abandoned PDF generation; uniqueness takes precedence over gap-free numbers.
