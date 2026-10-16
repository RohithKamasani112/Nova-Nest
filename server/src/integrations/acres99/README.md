# Nova Nest production 99acres push integration

This adapter uses the existing production portal Lambda/API Gateway and existing
CRM `leads` table. It does not connect to or modify the client demo.

Endpoint: `POST https://osz4x1qx1c.execute-api.ap-south-1.amazonaws.com/api/leads/create/99acres`

Authentication uses a separate Secrets Manager secret referenced by
`ACRES99_API_KEY_SECRET_ARN`. Its JSON `active` field holds the current key;
`keys` holds optional overlapping rotation keys. Keys never belong in Amplify.
Credential priority: `x-api-key` header, then `api_key` query parameter, then
`api_key` JSON/form field. JSON and URL-encoded form bodies are supported.

| Provider field | CRM field |
| --- | --- |
| `name` | `name`, `name_normalized` |
| `phone` | normalized `phone`, `phone_raw` |
| `email` (optional) | `email` |
| `projectName` | `project_name` |
| `price` (optional) | `price_raw`, `price_value` in INR |
| `bedroomNum` (optional) | `bedrooms`, `configuration` |
| Source | Always `99acres` |

Names are case insensitive. Spaced/underscore forms (`project name`,
`project_name`, `price of the property`, `property_price`, `bedroom_num`) are
accepted. `mobile`, `project`, `bedrooms` and `bhk` are supported aliases.
Conflicting aliases are rejected. Ask the provider to confirm its exact sample
payload before enabling its feed; the email lists labels rather than a JSON schema.

Name, phone and project are required. Missing email, price or bedroom count does
not reject an otherwise valid lead. Prices accept numeric INR and familiar lakh/
crore formats. Bedroom count accepts a whole number or `3 BHK`; malformed values
return HTTP 400. Numbers normalize to the existing Indian ten-digit CRM format.

Same 99acres phone/project retries return HTTP 200:
`{"status":"failure","message":"Lead already exist"}`.
Success returns HTTP 200:
`{"status":"success","message":"Lead punched in the CRM"}`.
Other-source enquiries retain their source and are linked using existing CRM
duplicate-contact rules. The existing 99acres source filter and scoped telecaller
account see these leads. No new database table or migration is needed.

```bash
curl --location 'https://osz4x1qx1c.execute-api.ap-south-1.amazonaws.com/api/leads/create/99acres' \
  --header 'Content-Type: application/json' \
  --header 'x-api-key: YOUR_99ACRES_KEY' \
  --data-raw '{"name":"Test Buyer","email":"test@example.com","phone":"9876543210","projectName":"Test Project","price":8500000,"bedroomNum":3}'
```

This curl creates a real production lead; use it only when you intend to create
a test record. Do not publish or commit the actual key. Share it directly with
the authorized 99acres contact.

Deployment in Ubuntu, from the repo root:

```bash
cd server
npm ci
npm run test:portals
cd ..
node server/scripts/deploy-portals.mjs
```

The deployment script checks the database secret matches both live CRM and
portal functions, preserves existing stack parameters, reviews the change set
for removals/replacements, and checks existing function/endpoint/key identifiers
after deployment. It smoke-tests authentication and validation without inserting
a dummy production lead. Logs redact credentials using the shared portal logger.
