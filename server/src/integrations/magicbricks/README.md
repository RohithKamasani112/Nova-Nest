# Magicbricks lead push → Nova Nest CRM

This integration has a separate 10-second/256MB Lambda and HTTP API, packaged
from the existing TypeScript server. It uses **the existing CRM PostgreSQL
connection and leads table**, so accepted leads appear in CRM with source
`magicbricks`; nothing needs synchronizing from a second database. The existing
CRM Lambda, login, imports and website intake remain in place.

Future providers belong in sibling folders under `server/src/integrations/`.
Each adapter owns its parser, mapping and credentials, while reusing the database
pool and the `LeadRepository` interface. The Lambda handler itself contains no
SQL. A different repository can be injected without changing the HTTP contract.

## Architecture and deliberate adaptations

`API Gateway HTTP API → Magicbricks Lambda → existing PostgreSQL CRM`

- Uses Node.js 22 for the new function. AWS lists Node.js 20 as deprecated;
  [supported Node runtimes](https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html).
- The supplied DynamoDB schema is adapted to PostgreSQL, matching the explicit
  requirement to reuse CRM connection details. The migration adds a unique
  `(provider, dedupe_key)` claim table. Claim and lead are committed together;
  PostgreSQL's unique constraint serializes competing pushes. No DynamoDB table
  or separate indexes/IAM permissions are needed.
- `lead_id` maps to `leads.id`; `mobile` to `leads.phone`; `project` to
  `project_name`; `lead_dt` to `lead_date`. Country code, raw ISD, receive timestamp
  and sanitized original payload are in `leads.raw_data`. Existing CRM status and
  created/updated fields are reused. API keys and credential-like fields are
  removed from stored payloads.
- Default dedupe: normalized mobile + trimmed/lowercase project. Another
  project for an existing contact creates a new enquiry linked via the CRM's
  `is_duplicate`/`duplicate_of_id` convention, preserving its global phone/email
  uniqueness rules. Retry claims are retained even after a CRM soft delete.
  Changing the dedupe rule after launch requires a planned backfill; simply
  switching modes can permit previously seen leads again.
- Only payloads first seen by this integration have claims. Historical imported
  Magicbricks leads are not automatically backfilled into the claim table.
- API Gateway access logs include request ID/status/route only. Handler logs
  contain a generated/Lambda request ID, outcome and at most the last four phone
  digits. Neither raw input nor exception messages are logged. Do not enable
  external proxy/WAF request-body or query logging without credential redaction.

## Request contract

`GET` or `POST /api/leads/create`. Query, URL-encoded form, and JSON are accepted;
keys are case-insensitive. Query and form values are URL-decoded once. JSON
values are already decoded JSON strings and are not decoded again.

| Field | Aliases / rule |
| --- | --- |
| name | responderName; required, max 200 chars |
| mobile | responderPhone; required Indian 10-digit number |
| project | projectName; required, max 300 chars |
| email | responderEmail; optional, validated/lowercased |
| source | default Magic Bricks; other providers rejected on this endpoint |
| isd | default 91; nonnumeric values stored as raw_isd with country 91 |
| msg | comments; optional |
| city | City; optional |
| bhk | optional bedroom count, e.g. `2`, `3`, or `3 BHK`; `bedrooms` is an alias; saved to CRM bedrooms/configuration |
| dt | optional YYYYMMDD, strict real date |
| time | optional HHMMSS, strict real time |
| api_key | query or form/JSON credential; prefer x-api-key header |

When `dt` is present, missing time means 00:00:00 IST; a supplied time is combined
with the date as IST and stored as UTC ISO-8601. Without `dt`, receive time is
used even if a valid time was supplied. `received_at` always records UTC receipt.
Leading `91`, `0091` and trunk zero are removed from phone numbers; other
characters besides formatting punctuation are rejected, rather than silently
truncating invalid numbers. Non-India numeric ISD is rejected.

Query + decoded body must total at most 10,240 UTF-8 bytes. Repeated fields,
conflicting aliases, malformed JSON, nested input and unsupported content types
return 400. Control characters are removed from text and SQL is parameterized.
Treat stored text as untrusted: render it as text, never raw HTML.

| Result | HTTP | Exact plain-text body |
| --- | --- | --- |
| Saved | 200 | Success: Lead punched in the CRM |
| Duplicate | 200 | Failure: Lead already exist |
| Invalid | 400 | Failure: &lt;short reason&gt; |
| Wrong/missing key | 401 | Failure: Unauthorized |
| Unexpected failure | 500 | Failure: Internal error |

Gateway throttling/platform failures may return AWS-generated 429/5xx responses
before the handler runs; ask Magicbricks to retry 429/5xx with backoff. All
duplicate and saved responses are intentionally HTTP 200 for partner compatibility.

## Environment

| Variable | Purpose |
| --- | --- |
| DATABASE_URL | Same CRM database URL; template resolves from a database secret |
| MAGICBRICKS_API_KEY_SECRET_ARN | Secrets Manager secret containing active/keys |
| MAGICBRICKS_DEDUPE_RULE | mobile_project (default) or source_mobile_project |
| DB_CONNECTION_TIMEOUT_MS | 2000 for this Lambda; existing CRM default stays 10000 |
| AWS_REGION | Provided by Lambda; set when testing AWS locally |

The API-key secret JSON has `active` (current key) and `keys` (overlap keys during
rotation). Keys must be random strings of at least 32 characters. The template
generates the first 48-character key; no credential is stored in source or stack
outputs. Secret cache TTL is 60 seconds, coalesces concurrent loads, and fails
closed on refresh errors. JWT and S3 secrets are not needed by this Lambda.

## Deploy (from server/)

1. Apply CRM migrations including `1739000000003_integration-lead-dedupe.sql`
   using the existing migration workflow: `npm run migrate:up` (or prod variant).
   Use a database owner for migrations, not the restricted runtime role.
2. Have an existing Secrets Manager secret with a `DATABASE_URL` JSON property
   containing the same PostgreSQL connection details used by CRM. Use a database
   login scoped to `SELECT, INSERT` on `leads` and `integration_lead_dedupe`, plus
   schema/type USAGE and INSERT on `lead_duplicates` for the CRM multi-interest
   badge. It needs no UPDATE, DELETE, DDL or user/auth-table privileges.
   TLS is mandatory (`rejectUnauthorized: true` in the reused pool). Configure
   database-side at-rest encryption, backup/PITR and monitoring in the existing
   PostgreSQL provider; the template does not create or alter that database.
   `infra/magicbricks-db-grants.sql` supplies optional grants for an existing
   dedicated runtime role. Reuse the CRM database host/name; do not remove
   UPDATE privileges from the existing CRM login, which still needs them.
3. Install dependencies: `npm ci`; then `npm run package:magicbricks`.
4. With AWS SAM CLI and AWS credentials configured:

```sh
sam build --template-file infra/magicbricks.yaml
sam deploy --guided --stack-name nova-nest-magicbricks
```

Supply `DatabaseSecretArn`, reserved concurrency (default -1, shared account capacity), throttle burst/rate,
and optionally an existing SNS `AlarmTopicArn`. Select the same AWS region as
the API key secret. SAM needs IAM creation capability. CloudFormation resolves
the database secret during deployment: changing its URL/password requires a
stack environment update; API-key rotation is read at runtime.

The template creates the HTTPS API, function, generated API-key secret, log groups,
restricted execution role and alarms for HTTP 5xx, Lambda errors and throttles.
Alarms need `AlarmTopicArn` to send notifications. CORS is intentionally absent.
It assumes the existing database is publicly reachable over TLS, as the current
CRM pool expects. For private RDS, add VPC subnet/security group configuration,
NAT or Secrets Manager endpoint and the necessary VPC execution permissions
before deploying. Choose concurrency to fit the database's connection limit
(at most two pooled connections per Lambda environment).

`ReservedConcurrency=-1` omits the Lambda reservation, allowing accounts with
small regional concurrency quotas to deploy. It does not provide a per-function
concurrency cap; API throttling is a request-rate limit, not a concurrency limit.
After increasing your account quota, set a positive reservation to cap this
integration's database connections. Setting 0 pauses all invocations.

If deployment is preserved in CREATE_FAILED because the account cannot reserve
concurrency, redeploy the same stack/template with `--disable-rollback` and
`--parameter-overrides ReservedConcurrency=-1` together with your existing
DatabaseSecretArn. Preserve the existing stack so its generated API-key secret
is reused; do not delete it just to retry deployment.

No DLQ is attached: this is a synchronous API. A Lambda asynchronous DLQ does
not capture rejected synchronous API requests. Magicbricks must retry failed
writes; their dedupe claim rolls back with the lead. Add an encrypted intake
queue only if the provider later agrees to asynchronous acceptance semantics.

The package is a small bundled `index.js` built with esbuild. Optional `pg-native`
is external; the normal JavaScript `pg` driver is bundled. The existing
`deploy:lambda` script still deploys the existing CRM function; it does **not**
deploy this separate integration. This delivery does not deploy live AWS resources.

## Account-manager handoff

After deployment, obtain `Endpoint` and `ApiKeySecretArn` from CloudFormation
stack outputs. The exact endpoint is the `Endpoint` output, in this form:

`https://<API-ID>.execute-api.<REGION>.amazonaws.com/api/leads/create`

Send that URL, supported fields, exact response messages and the API key via an
approved secure channel to the Magicbricks account manager. Prefer POST JSON
with `x-api-key: <key>`. GET with `api_key=<URL-encoded key>` is available if their
integration requires it. There is no Magicbricks-issued OAuth client ID/secret.
Only retrieve the secret in a secure terminal/secret-management UI; never put it
in screenshots, chat, committed files or URLs pasted into support logs.
Ask the account manager to confirm method, field names, success/duplicate handling
and retry policy before enabling production traffic. The sample's masked `XXX`
mobile is illustrative and must be replaced with a valid test number.

## Rotate API keys

Generate a new random key in Secrets Manager/your secret-management workflow.
Update the secret to `{ "active": "NEW_RANDOM_KEY", "keys": ["OLD_KEY"] }`.
Both keys work after at most 60 seconds. Give the new key to Magicbricks securely,
confirm successful pushes with it, then remove the old key from `keys`. Allow
another 60 seconds for cached copies to expire. Never log either value. The
Lambda role has read-only access to this secret; only operators rotate it.

## Local smoke examples

`npm run dev:magicbricks` runs an **in-memory** local endpoint on port 4010.
Set `MAGICBRICKS_TEST_KEY` to a random test-only value (>=32 characters) before
starting it. These examples use Bash-style environment expansion; PowerShell
can use `$env:MAGICBRICKS_TEST_KEY` and `curl.exe`.

```sh
# New lead, then rerun exactly this request for the duplicate response:
curl -sS -G http://127.0.0.1:4010/api/leads/create \
  -H "x-api-key: $MAGICBRICKS_TEST_KEY" \
  --data-urlencode 'source=Magic Bricks' --data-urlencode 'name=Test Visitor' \
  --data-urlencode 'mobile=9876543210' --data-urlencode 'project=Local test project' \
  --data-urlencode 'isd=Local test project' --data-urlencode 'dt=20180722' --data-urlencode 'time=145000'

# Missing project -> 400
curl -sS http://127.0.0.1:4010/api/leads/create -H "x-api-key: $MAGICBRICKS_TEST_KEY" \
  -H 'Content-Type: application/json' -d '{"responderName":"Test","responderPhone":"9876543210"}'

# Bad key -> 401
curl -sS -G http://127.0.0.1:4010/api/leads/create -H 'x-api-key: deliberately-wrong-test-key'
```

## Tests

`npm run test:magicbricks` exercises parsing, aliases, sanitization, phone/email,
IST dates, limits, key matching/rotation, exact responses, safe logs and failures.

`MAGICBRICKS_TEST_DATABASE_URL` plus `npm run test:magicbricks:db` runs real
PostgreSQL tests. Use an isolated disposable test database: the test creates and
drops its own randomly named schema and installs migration extensions. Never
point it at production. Without this variable the database test explicitly skips.
It sends 12 concurrent duplicate submissions, checks one lead/claim, checks
distinct-project/contact races and verifies failed writes leave no claim.

Validation performed locally: TypeScript build, nine unit test groups, real
PostgreSQL 18 concurrency/rollback tests, CloudFormation/SAM template lint,
existing 52 parser checks, website/sales regressions and Lambda bundle build.
Live Magicbricks delivery,
AWS deployment and provider contract confirmation remain operational steps.
