# Client demo

Live website: https://demo.dabsn60w9rjm8.amplifyapp.com

Client guide: https://demo.dabsn60w9rjm8.amplifyapp.com/demo-notes.html

The client-facing brand is **Estate CRM Demo**, including a neutral logo.
Demo builds apply this branding through a Vite plugin; production builds retain
their existing identity. Six illustrative stock property/interior photos from
Unsplash are used across three-image galleries and restored by nightly reset.
Download the assets with `node server/scripts/download-demo-photos.mjs` before
a release; `refresh-demo-photos.mjs` updates only the seeded property galleries.
Photo license: https://unsplash.com/license.

The demo runs in a separate Amplify app, Lambda, private S3 bucket and PostgreSQL
database with its own restricted login. It shares the existing Neon compute
service, but does not copy or modify production tables. It is a shared client
sandbox rather than a private environment for each visitor.

Private resource state and generated login details are in `.demo/`, which is
ignored by Git. Never commit this folder. Share `.demo/client-access.md` only
with intended demo clients. The public `/demo-notes.html` page explains the demo
without publishing its password.

## What clients can try

- Public listings, property details and website enquiries.
- Full admin CRM with 60 fictional leads across all source filters.
- Edit contacts, qualify leads, assign team members, log notes and schedule calls/visits.
- Create team logins and explore source-specific telecaller and assigned-team access.
- Add/edit properties, upload sample files and generate/download sample invoices.
- Sample logins: `demo.admin`, `demo.magicbricks`, `demo.housing`,
  `demo.99acres`, `demo.team`. Passwords are in the private access note.

No portal capture integration is connected to this environment. Calls,
WhatsApp, email and external social/share actions are intercepted in the demo UI.
This is a demonstration safeguard, not a browser security boundary: clients
should only enter fictional information and should not manually call sample numbers.
Demo analytics scripts and publicly bundled legacy storage fixtures are removed
from the published demo artifact. Search indexing is disabled.

## Reset and maintenance

EventBridge invokes `nova-nest-client-demo` daily at 21:00 UTC / 02:30 India time.
The reset restores sample accounts, leads and properties and removes uploaded
demo files and generated invoices. Existing sessions become invalid after reset.
The reset checks DEMO_MODE, database name, bucket name and prefix before writing.
It is IAM-invoked, not a public HTTP reset endpoint.

Infrastructure setup scripts are under `server/scripts/setup-demo.mjs` and
`release-demo.mjs`; they are specific to this AWS account. The initial bootstrap
temporarily uses the existing database-owner connection to create the new
database/role. Release replaces that environment with only demo credentials
before attaching a public URL. The runtime role has access to the demo bucket
only and cannot create databases or roles. The database owner retains maintenance
membership of the demo role; the demo role does not receive production membership.

Releases are manual Amplify deployments; pushing the production Git branch does
not update the demo. To update deliberately, compile the backend and run
`node server/scripts/release-demo.mjs` from the repository root in an authenticated
Ubuntu shell. Existing dummy records are retained on release until nightly reset.
Use `--frontend-only` or `--backend-only` to release one side. For maintenance,
run `node server/scripts/manage-demo.mjs reset`, `verify-isolation`, or `status`.
Isolation verification attempts a zero-row production-table query with the demo
login and requires a PostgreSQL permission denial; it never returns production data.
Do not run the production deploy script with the demo credentials.

AWS and Neon resource usage is billable. To retire the demo, disable its
EventBridge reset rule first, then remove its Amplify app, Lambda/function URL,
dedicated S3 bucket contents/bucket, execution role and demo database/role. Never
remove the production app, bucket, database or portal integration.

Validated: all five logins, source permissions, public properties, website lead
capture, lead contact edits, site visits, signed uploads and media downloads,
private raw S3 access, exact-origin CORS, production-table permission denial,
nightly reset invocation, and desktop/mobile browser flows. Frontend build,
backend compilation and secret scans passed. Browser checks found no production
API/storage requests, production analytics traffic or JavaScript exceptions.
