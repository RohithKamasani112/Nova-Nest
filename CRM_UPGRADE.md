Nova Nest CRM upgrade
====================

Ported from the local Aarunya reference: mobile lead cards and detail drawer,
call outcomes and follow-up reminders, visit scheduling with a date prompt,
scheduled-visit and source filters, mobile filter sheets, agent management,
import previews/history, dashboard improvements, and website enquiries.

Admins retain Nova Nest's property management, sharing, and billing pages.
Team logins now manages individual credentials and fixed portal/assignment
access. See [CRM team access](TEAM_CRM_ACCESS.md) for the current role model and
deployment steps. The earlier shared sales login has been retired.

Before deployment
-----------------

1. Configure the existing server environment (DATABASE_URL, JWT_SECRET, storage
   settings) and frontend VITE_CRM_API_BASE_URL, including its /api suffix.
2. From server/, run `npm run migrate:up` against the intended database. The new
   migration adds the website lead-source enum. Its down migration cannot
   remove that enum value automatically.
3. If no admin exists, configure ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME and run
   `npm run seed` from server/. Existing admin credentials remain in PostgreSQL.
4. Apply the team-role migration and follow TEAM_CRM_ACCESS.md to configure
   portal telecallers and individual team logins as admin.
5. Deploy the server and rebuild/deploy the frontend together.

Website forms submit to POST /api/public/leads without a login. If that service
is unavailable or unconfigured, the existing S3 leads.json storage is retained
as fallback. Fallback enquiries remain on the legacy Leads page; they are not
automatically synchronized into CRM. Historical S3 leads are also unchanged.

Review checklist
----------------

- Admin login opens CRM; sales login opens the device's agent picker or leads.
- Sales navigation cannot render the admin workspace; logout clears selection.
- On a phone, check lead cards, filter sheet, call/WhatsApp actions and drawer.
- Schedule a site visit, choose its date, reopen the lead and filter scheduled visits.
- Submit a public enquiry and check the Website source in CRM.
- Import Housing, 99acres, MagicBricks and personal leads, then check agent filters.

Local validation: production frontend build, server TypeScript build, 52 parser
assertions and sales-account regression checks passed. Repeat the server checks
with `npm run build`, `npm run test:parsers`, and `npm run test:sales-account`.
Full frontend type checking still reports existing
errors in unrelated public/legacy files. Live database and browser interaction
checks require a configured environment; no migration or deployment was run.

CRM interface refinement
------------------------

The lead inbox and sales view now share contact controls with a recognizable
WhatsApp glyph, consistent phone icons, clear labels and reserved action space.
Desktop actions stay in their own pinned column; mobile cards place actions on
a separate row. The record drawer separates the original enquiry, follow-up,
lead fields, call outcomes and activity history. Its fixed footer keeps status
and contact actions in separate rows, with a scrollable content area above.
CRM-specific typography, neutral surfaces, compact controls and selected-row
feedback leave the public site's presentation unchanged.

Design references: Pipedrive's Leads Inbox
(https://support.pipedrive.com/en/article/leads-inbox) and HubSpot's record layout
(https://knowledge.hubspot.com/records/work-with-records).

Headless Edge checks with mock leads passed at 320, 390, 768 and 1440 pixels in
the sales view, and 390 and 1440 pixels in the admin inbox. Checks covered page
and drawer overflow, separated contact buttons, minimum 44px contact targets,
and runtime errors. Screenshots were visually reviewed. The new
`npm run test:website-lead` server check exercises the actual unauthenticated
intake route with a mocked database and verifies website source, normalized
phone, original message, property context and invalid-payload rejection.

These checks do not verify a live deployment. Website enquiries enter CRM when
the configured API and database migration are deployed; unavailable intake
still uses the existing S3 fallback described above.

Compact mobile inbox
--------------------

Mobile and tablet leads now use a single-column list of 68px rows rather than
large cards. Each row has a truncated name, phone/stage summary and dedicated
44px contact targets. Tap the name for the full record. Wider tablets also show
property and follow-up context. Long names and missing phone numbers retain the
same row height. Sales header and toolbar spacing is reduced, narrow-screen
search padding is corrected, and the admin sticky toolbar clears the menu button.

Responsive review uses 20 mock leads, including long names and missing phones,
at 320, 360, 390, 430, 520, 768, 1024 and 1440 pixels. It checks compact row height,
reserved action space, page/drawer overflow, contact targets and runtime errors.

Daily reminders review
----------------------

The dashboard and sales workspace share the updated Daily reminders panel.
Overdue calls, today's site visits and today's other follow-ups are grouped
separately. Compact rows keep Call/WhatsApp visible; the action menu offers
notes, rescheduling and completion. The panel can collapse, uses a retry state
for failed requests, and links to overdue/today/site-visit lists with the selected
agent retained. Failed requests no longer display an incorrect all-caught-up state.
Populated-dashboard browser checks cover 320, 390, 768, 1024 and 1440px, including
action requests and error feedback, using mock API data. These are in-app
reminders; this change does not add push or browser notifications.

Quick source filters
--------------------

The CRM dashboard, admin lead inbox and sales inbox now offer All leads,
MagicBricks, 99acres and Housing buttons. All leads is the default source scope
and includes website/personal enquiries as well. The provider values match the
existing CRM enum (`magicbricks`, `99acres`, `housing`), including records written
by the current Magicbricks push Lambda. Source selection resets list pagination;
dashboard chart/statistic drill-downs retain the selected source. Global status
counts are hidden while a source is selected to avoid presenting unfiltered counts
as provider-specific totals.

Fresh dashboard/inbox views default to All time and Created date. The all-time
inbox omits date bounds entirely, so missing or historical partner enquiry dates
do not hide newly received leads. Explicit date selections/bookmarked ranges
remain available. The dashboard's all-time reporting uses created timestamps
from 1900 through the end of today and hides period-comparison badges.

This is a frontend update; rebuild/redeploy the website to publish it. The
already-deployed Magicbricks Lambda needs no update for these filters. Source
request/reset checks passed with mocked API data for admin and sales views on
phone and desktop; the Ubuntu production build passed.
