# CRM team access

Website enquiries (`website`) and manually entered leads (`personal`) appear
together under the **Custom** icon/filter in the dashboard and lead inbox.
The underlying sources remain separate so the original enquiry channel is retained.
No new leads table or portal-capture Lambda is required.

## Accounts and access

| Login | Lead visibility | Assignment | Administration |
| --- | --- | --- | --- |
| Admin | All leads | Any active team member | Full admin panel, credentials, imports, team roster and deletion |
| MagicBricks telecaller | MagicBricks only | Active team members | CRM only |
| Housing + Custom telecaller | Housing, website and manual leads | Active team members | CRM only |
| 99acres telecaller | 99acres only | Active team members | CRM only |
| Team member | Leads assigned to their linked roster member, across sources | Cannot reassign | CRM only |

All roles can use notes, call outcomes, status updates, follow-ups and site visits
within their allowed leads. Dashboards, daily reminders, exports, filter options,
duplicate lookups and individual-lead requests are restricted by the API as well
as the UI. Only admins can create, edit or deactivate roster members or logins.

A lead is one shared database record. Assigning it makes it visible to the linked
team login; its portal telecaller and admin retain access. Notes, statuses and
reminders are shared rather than copied. Visible workspaces refresh in the
background every 30 seconds and when returning to the window. A lead removed
from a member's assignment is no longer accessible through their API session.

New manual leads entered by a team member are automatically assigned to that
member, and are also visible under Housing + Custom. Other portal telecallers
cannot create Custom leads. Imports and lead deletion remain admin-only.

## Activate the update

1. Back up the production database using the existing process.
2. From `Nova-Nest/server`, run `npm run migrate:up`. The migration
   `1739000000004_team-role-access` adds usernames, source scopes and session
   versions to `users`, and enforces one roster link per login.
3. Deploy the **main CRM backend** using its existing function name and region.
   The existing `npm run deploy:lambda` script uses `LAMBDA_FUNCTION_NAME` and
   `AWS_REGION`; keep these pointed at the deployed CRM backend. The Housing /
   MagicBricks SAM stack is the portal intake service, not the CRM application.
4. Build and deploy the frontend (`npm run build`) with the current
   `VITE_CRM_API_BASE_URL`, including `/api`.
5. Sign in as admin. Under **CRM → Team**, create or verify the assignment roster.
6. Open **Team logins** in the admin sidebar. Create the MagicBricks, Housing +
   Custom, and 99acres telecaller accounts. Create each individual team login
   and link it to the corresponding active roster member.
7. Share each username/password with the intended user. Everyone uses the same
   existing login page. Admin email/password sign-in continues to work.

The old unrestricted shared `sales` login is deliberately deactivated by the
migration and its management endpoints are retired. Create the replacements
before handing access back to the sales team. Passwords are hashed and never
returned to the browser. Admins reset passwords rather than retrieve them.
Saving account changes or disabling a login revokes its existing sessions.

The public website posts to `POST /api/public/leads` without a team login.
Successful requests enter CRM as `website` and appear under Custom. Its existing
S3 fallback remains a fallback only: enquiries stored there while CRM is
unavailable are not automatically imported into the CRM.

## Validation

Server build: `npm run build` from `server/`.
Portal regressions: `npm run test:portals`.
Role workflow: set `CRM_TEST_DATABASE_URL` to a dedicated test PostgreSQL database
and run `npm run test:team-access:db`. It creates and removes a randomly named
schema. Do not use the production database for tests.

The role tests exercise actual HTTP handlers and PostgreSQL: portal visibility,
conflicting filters, concurrent role requests, exports, KPI/reminder scoping,
cross-role access denial, team assignment/reassignment, shared updates, website
and manual intake, admin credential changes and session revocation.
