# Nova Nest platform upgrade

Branch: `feat/platform-experience-upgrade`. The original six requested fixes and the repository-side follow-ups from the review are implemented. Production operations listed at the end remain separate from this code change.

## Public website

- A compact, responsive search workspace with an explicit Search action, useful area suggestions, prominent Sale/Rent and exact BHK controls, and an explicit 5+ group.
- Area chips derived from actual listing localities, with counts and case-insensitive matching. Known neighborhoods can be inferred from older addresses without inventing a location.
- Search, filters, sorting and page persist in shareable URLs. Browser Back/Forward restores them. Returning from a property restores the listing scroll position.
- Pagination, removable active filters, clear/reset controls and price/size range validation. Labels distinguish monthly rent, total sale price and square feet.
- Browser-local saved searches and shortlists; compare up to three active properties including price, size, furnishing, maintenance and deposit.
- Near Me distinguishes unsupported browsers, denied permission, timeouts and other failures, and explains listings missing coordinates.
- Open listing pages refresh on focus, same-browser changes and every 15 seconds while visible. Removed/deactivated detail pages show an unavailable state and noindex metadata.
- Property enquiries are checked against current availability by the backend. Indian mobile validation is shared across public forms; duplicate submissions are disabled and failures preserve entered details. Clicking a phone link no longer creates a fake contact-number lead.
- WhatsApp capture awaits successful intake and keeps errors recoverable. Dialogs trap focus, support Escape and restore focus. Autocomplete has combobox/listbox semantics; keyboard focus and skip links are visible.
- Recency and verification meaning are displayed without inventing a verification date. Carpet/built-up area can now be saved and shown. Category labels are consistent; Featured is no longer called New Launch.
- Standard spacing tokens are corrected, reducing excessive whitespace across the platform. Floating social links no longer cover mobile search controls.

## Admin and data integrity

- Manage Properties has BHK and size columns/mobile details, exact BHK filtering, locality and square-foot filters, accurate filtered counts, pagination, a sticky identifying column, saved presets, refresh/retry and last-sync time.
- A location-quality view identifies missing locality/coordinates. The explicit Normalize locality names action backfills only detectable known neighborhoods or normalizes existing labels. No live listings were modified during implementation.
- Per-property server mutations replace collection-wide browser writes. S3 conditional writes preserve concurrent edits to different properties; stale edits to the same property return a conflict instead of silently overwriting changes.
- Archive/restore retains media and restores as inactive. Permanent removal requires the property to be archived first. A bounded change history records actor, time and important field changes; private history is excluded from public responses.
- Property editing retains drafts in the current tab, offers explicit restoration, warns on navigation and validates required publication data. Optional fields still remain optional.
- Dashboard lead totals/previews use CRM, recent properties are sorted, and active/inactive/archived counts are explicit. Old Leads navigation opens the authoritative CRM. Refresh failures do not masquerade as a successfully loaded empty dataset.
- All four billing document types reserve numbers on the server with conditional writes. Concurrent document appends preserve each other; duplicate document numbers are rejected. Abandoned reservations may leave gaps.
- Property PDF export rechecks availability, price and revision before generating the file and blocks stale selections.
- Disabled/revoked sessions, detached agent accounts and database role changes have regression coverage; the existing server access boundaries remain authoritative.
- Request IDs and structured failure/mutation logs aid diagnosis without logging enquiry bodies or credentials. An encrypted metadata snapshot/conditional-restore helper and a recovery runbook are included.

## Maintainability and verification

- Project-wide TypeScript checking passes. Missing type declarations are installed, unsafe typing is corrected and duplicate legacy page files re-export the maintained implementations.
- Public/admin/CRM/PDF routes are lazy-loaded. The main application chunk dropped from approximately 694 KB to 179 KB gzip; heavier CRM/PDF chunks load on demand. This measures the bundle, not field Core Web Vitals.
- Local frontend-prefixed AWS credential names were changed to server-only names in ignored .env. No secret values were printed or committed. Production should use the Lambda role, and any formerly exposed credentials need account-owner review/rotation.
- Frontend and backend dependency audits report zero known vulnerabilities after compatible updates and tested backend overrides. The backend validator was upgraded and existing integration/parser regressions were rerun.
- `npm run check`: TypeScript, 14 frontend filter/search/contact regressions, refresh lifecycle checks, four security tests, production build and bundle secret scan.
- Backend: 44 existing/new test cases pass, with two PostgreSQL integration cases skipped because no isolated test database was configured. The parser suite additionally reports 52 passing assertions. Inventory/session/storage and website-lead checks are available through `npm run test:inventory --prefix server`.
- Browser acceptance tests cover desktop and mobile: explicit search, combined filters, shareable URLs, Back/Forward, shortlists/comparison, viewport fit, BHK/size counts, archive/restore and immediate draft recovery. Browser data is mocked; no production records are touched.
- CI runs source checks, the backend safety tests and browser checks. A guarded reload state handles page/chunk-load failures.

## Production actions still required

See [PLATFORM_OPERATIONS.md](PLATFORM_OPERATIONS.md) for the coordinated backend/frontend release and acceptance sequence. This branch does not deploy services, mutate live inventory, rotate credentials, configure live monitoring/backup schedules, enable S3 versioning or change PostgreSQL recovery settings.

A static SPA cannot provide true per-property HTTP 404/410 responses or property-specific Open Graph HTML for non-JavaScript scrapers. That needs a hosting/edge rendering change and production verification. Client noindex/unavailable behavior and archived sitemap exclusion are implemented here.

Live prices and locality guide ranges still require business validation; ambiguous/missing localities require administrator review. Real-device Core Web Vitals and the isolated PostgreSQL role/handoff scenarios remain release checks. These are explicit remaining operational/verification tasks, not claims of completed production work.
