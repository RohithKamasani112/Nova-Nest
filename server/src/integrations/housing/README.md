# Housing portal — same Nova Nest integration Lambda

## Routes after updating the existing stack

| Route | Methods | Key | Response |
| --- | --- | --- | --- |
| `/api/leads/create` | GET / POST | Existing Magicbricks key | Existing plain text, unchanged |
| `/api/leads/create/magicbricks` | GET / POST | Same existing Magicbricks key | Same plain text |
| `/api/leads/create/housing` | POST | Separate Housing key | JSON status/message |

For the existing deployment in `ap-south-1`:

- Housing: `https://osz4x1qx1c.execute-api.ap-south-1.amazonaws.com/api/leads/create/housing`
- Magicbricks alias: `https://osz4x1qx1c.execute-api.ap-south-1.amazonaws.com/api/leads/create/magicbricks`
- The original Magicbricks URL continues to work. No partner must change it immediately.

The new URLs work **after** redeploying the updated package and template. The
template keeps logical IDs `Api`, `Integration` and `IntegrationKey`, so updating
the same stack preserves its existing endpoint identity and Magicbricks secret.
It adds `HousingKey`, three routes/permissions, one environment variable, scoped
secret-read permission, and Housing/Magicbricks-alias output URLs. Both routes
inherit the same API throttling settings. CORS remains absent, consistently with
the existing server-to-server API.

## Shared implementation and storage

`integrations/handler.ts` dispatches by path. Provider handlers call the same
`shared/createLeadHandler.ts`, parser, validator, constant-time key matcher and
PostgreSQL repository. Compatibility exports under `magicbricks/` preserve
existing imports/tests. No separate Housing Lambda or new database is created.

Housing writes to the existing `leads` table with source `housing`, city in
`leads.city`, and comments in `leads.message` (empty string when omitted).
`integration_lead_dedupe` and `lead_duplicates` are reused. No new migration is
needed if the existing Magicbricks migrations have already been applied.

Housing maps name/mobile/email/project to the shared internal contact/project
fields. ISD defaults to +91; it is prepended to an unprefixed 10-digit number.
Already-prefixed and trunk-zero inputs are normalized exactly once to the same
10-digit stored phone. Non-India ISD and missing/invalid phones return 400. The
existing validator also requires name and project and validates optional email.
The submitted source is always overridden to housing. JSON and URL-encoded form
bodies are accepted; the existing combined query/body limit remains 10KB.

Housing checks credentials in this order, using the first nonempty value:

1. `x-api-key` header (case-insensitive header name).
2. `api_key` query parameter.
3. `api_key` JSON/form field.

An invalid higher-priority key returns 401 even if a lower-priority key is valid.
The existing Magicbricks credential-conflict behavior is preserved. Each portal
has its own Secrets Manager JSON (`active`, `keys`) and its own 60-second cache.
Revoke/rotate Housing by editing only the Housing secret; Magicbricks is unaffected.

Housing duplicates are matched by normalized phone plus trimmed/lowercase project,
including existing CRM records from other sources. A shared transaction lock
serializes both portal writers for that pair, and the existing unique dedupe
claim ensures retries are atomic. Housing retains a claim pointing to an existing
record when it detects a duplicate. Magicbricks keeps its existing source-scoped
claim behavior. It may still create a new enquiry for a pair previously received
through another source, as before. Failed writes roll back claims and leads together.

## Responses

Success: HTTP 200, `application/json`

```json
{"status":"success","message":"Lead punched in the CRM"}
```

Duplicate: HTTP 200

```json
{"status":"failure","message":"Lead already exist"}
```

Missing/invalid key: HTTP 401, failure message `Unauthorized`.
Validation: HTTP 400, failure message such as `Phone required` or `Invalid mobile`.
Unexpected error: HTTP 500, failure message `Internal error`.

## Logging

Every Housing invocation logs an `incoming_request` JSON entry with Lambda request
ID, method, route, headers, parsed query and parsed body. API-key fields and
authorization/cookie/token/secret/password fields are redacted recursively;
supplied credential values echoed in other fields are also removed. Rejected
requests are logged as well. Oversized or malformed bodies are represented by
an omission reason and byte length instead of unsafe raw text. An outcome entry
records status/result and a masked phone. Existing Magicbricks logs stay limited
to their previous outcome metadata, with no request-body logging.

Housing request logs contain submitted lead contact details for integration
testing. They use the existing CloudWatch log group and 30-day retention.

## Deploy from Ubuntu/WSL

Use the **existing** `nova-nest-magicbricks` stack. Do not create a second stack
or delete the original one.

```bash
cd /mnt/c/Users/kamas/Documents/Projects/nova_nest/Nova-Nest/server
npm run test:portals && npm run package:portals

sam deploy \
  --template-file infra/magicbricks.yaml \
  --stack-name nova-nest-magicbricks \
  --region ap-south-1 \
  --capabilities CAPABILITY_IAM \
  --resolve-s3 \
  --parameter-overrides \
    DatabaseSecretArn=arn:aws:secretsmanager:ap-south-1:974954696514:secret:novanest/database/prod-kveQsX \
    ReservedConcurrency=-1

aws cloudformation describe-stacks \
  --stack-name nova-nest-magicbricks \
  --region ap-south-1 \
  --query 'Stacks[0].Outputs' --output table
```

Retrieve the `active` value from the **new `HousingApiKeySecretArn`** output in
Secrets Manager. Use the existing `ApiKeySecretArn` for Magicbricks. Do not put
real key values in committed scripts, screenshots or chat.

Follow the template's stack outputs if deploying a different environment/API ID.
The new bundle still uses `.magicbricks-package/index.js` and `index.handler` to
avoid changing the existing deployment artifact contract. `package:portals` is
an alias of the existing packaging command, and includes both providers.

## Postman import / curl

Replace `YOUR_HOUSING_ACTIVE_KEY` with the Housing key in Postman:

```bash
curl --location 'https://osz4x1qx1c.execute-api.ap-south-1.amazonaws.com/api/leads/create/housing' \
--header 'Content-Type: application/json' \
--header 'x-api-key: YOUR_HOUSING_ACTIVE_KEY' \
--data-raw '{"name":"Test Lead","email":"test@example.com","isd":"+91","mobile":"9999999999","project":"Housing Test Project","city":"Hyderabad"}'
```

Repeat the same request to verify the duplicate JSON response. An existing lead
from another portal with the same phone/project will also return duplicate; use
a distinct test project for the first success test. This writes a real CRM lead.

Magicbricks alias (same existing Magicbricks API key):

```bash
curl --location 'https://osz4x1qx1c.execute-api.ap-south-1.amazonaws.com/api/leads/create/magicbricks' \
--header 'Content-Type: application/json' \
--header 'x-api-key: YOUR_EXISTING_MAGICBRICKS_KEY' \
--data-raw '{"responderName":"Test Lead","responderPhone":"9999999999","responderEmail":"test@example.com","projectName":"Magicbricks Test Project","source":"magicbricks","comments":"Test lead"}'
```

Tests: `npm run test:portals` runs old Magicbricks coverage plus Housing success,
normalization, duplicate messages, missing phone, invalid keys, independent keys,
header/query/body priority, form input, redacted logs and unexpected errors.
`npm run test:magicbricks:db` with a disposable `MAGICBRICKS_TEST_DATABASE_URL`
also tests concurrent Housing inserts, existing-source duplicates, city/comment
storage and rollback with the actual shared SQL. Never point this test at production.
