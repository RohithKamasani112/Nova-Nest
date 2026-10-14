# Credential-free Amplify frontend and Lambda backend

This update uses the **existing Amplify website and existing main CRM Lambda**.
There is no separate server, new database, or new portal-capture Lambda.
The Express application is invoked through `serverless-http` inside Lambda.

## What changed

- Browser code contains no AWS access key or secret and does not initialize an S3 SDK.
- Public listings come from `GET /api/public/storage/properties`. Inactive listings,
  owner identifiers, commissions and unknown/private fields are removed.
- Listing media uses permanent Lambda redirect URLs. Lambda signs the S3 read
  for five minutes; old stored S3 image URLs are automatically handled.
- Property changes, legacy lead reads, billing documents and sharing history use
  admin-only Lambda storage endpoints. Telecallers/team members cannot use them.
- Media uploads use five-minute S3 POST policies restricted to one exact key,
  MIME type and byte count. Images: up to 10 MB; PDFs: 20 MB; videos: 50 MB.
  The upload goes directly to S3, avoiding Lambda's request-size limit.
- Billing downloads request a new authorized five-minute URL when clicked. Old
  PDF URLs remain compatible if they refer to this site's configured bucket/folder.
- Website enquiries go to the public CRM lead endpoint. On API failure, forms
  report failure rather than reading/writing a private S3 lead collection.
- Builds fail if browser-prefixed secrets are configured or generated assets
  contain AWS identifiers, database credentials or known local secret values.
- Deployment updates the existing Lambda and execution role. AWS configuration
  output is captured, never printed. Temporary secret files live outside the repo
  with restricted permissions and are removed on success and failure.

## 1. Revoke exposed credentials

In AWS IAM, deactivate the exposed long-lived access key; review CloudTrail,
security findings and billing. Do not create another key for the website.
If AWS has restricted the account, resolve the security/support case as well.

Rotate the exposed Neon database password. Update the new `DATABASE_URL` in:

1. Your private local `.env` used by migrations/deployment.
2. The **main CRM Lambda** environment.
3. The **Housing/MagicBricks integration Lambda** environment.
4. The existing database secret in Secrets Manager (`DATABASE_URL` field).

The portal SAM template resolves the database secret into a Lambda environment
variable at deployment time. Changing the secret alone does not automatically
refresh an existing function's resolved environment value. Update the integration
Lambda's DATABASE_URL explicitly or perform a configuration update that refreshes
the dynamic reference. Do not remove its Housing/MagicBricks key-ARN variables.

Generate a new JWT signing secret locally:

```bash
openssl rand -hex 32
```

Store the result as `JWT_SECRET` in the main CRM Lambda and private local `.env`.
Do not paste the value into chat, source files, Git, Amplify or build logs.
Replacing it invalidates existing CRM login tokens; everyone signs in again.
Review/reset affected user passwords if database access may have been abused.

## 2. Configure the existing Lambda deployment

Use your current bucket, region and site folder; do not move or rename stored data.
Set these in the private local `.env` or your deployment shell:

```dotenv
LAMBDA_FUNCTION_NAME=YOUR_EXISTING_MAIN_CRM_LAMBDA
AWS_REGION=YOUR_EXISTING_CRM_LAMBDA_REGION
S3_BUCKET_NAME=YOUR_EXISTING_BUCKET
S3_REGION=YOUR_BUCKET_REGION
S3_FOLDER=YOUR_EXISTING_SITE_FOLDER
ALLOWED_ORIGINS=https://novanest.co.in,https://www.novanest.co.in,https://YOUR_BRANCH.YOUR_APP_ID.amplifyapp.com
```

`AWS_REGION` is the Lambda region; `S3_REGION` is the bucket's actual region.
They may differ. `S3_FOLDER` is the exact existing prefix previously selected by
the website's production/dummy folder setting, without surrounding slashes.
Only that folder is available through the new storage API. Never set it to a
bucket root or another client's folder.

The deploy script preserves existing Lambda environment variables and updates
DATABASE_URL/JWT_SECRET from your private `.env` when present. Keep those local
values rotated and current. If you manage them directly in Lambda, remove stale
local copies before deploying so they do not overwrite the console values.

Run in Ubuntu:

```bash
cd /mnt/c/Users/kamas/Documents/Projects/nova_nest/Nova-Nest/server
npm ci
npm run test:storage
```

If the earlier Team/role migration has not succeeded, run it before deployment:

```bash
node --dns-result-order=ipv4first --no-network-family-autoselection \
  ./node_modules/node-pg-migrate/bin/node-pg-migrate.js \
  up -m src/db/migrations --envPath ../.env
```

Stop if the migration fails. Once database migrations are complete:

```bash
npm run deploy:lambda
```

This updates the configured **existing** function, retains its Function URL,
adds folder-scoped S3 permissions to its execution role, and sets the exact
Function URL CORS origins. It does not create an IAM user or access key.
The deployment identity needs Lambda update/read, IAM `PutRolePolicy` permissions
on that role, and its existing deployment permissions. IAM role permissions may
take a short time to propagate before the first storage operation succeeds.

Use a supported Node.js runtime on the existing function. If it still uses
Node.js 20 from the older deployment script, update its runtime to Node.js 22
in Lambda before the release; the deployment script retains the current runtime.
See [AWS runtime support](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html).

Function URL CORS is managed at Lambda's URL configuration. The script sets
`CORS_AT_FUNCTION_URL=true`, so Express does not emit duplicate CORS headers.
Local development uses Express CORS with explicit origins.

## 3. Configure S3 access and upload CORS

The Lambda execution role needs GetObject, PutObject and DeleteObject on the site
folder and CRM staging prefix, plus ListBucket scoped to those prefixes. The
deploy script installs this policy on the function's existing role.

In S3 → bucket → Permissions → CORS, allow your exact custom-domain and Amplify
origins with GET, HEAD and POST. `server/infra/storage-cors.example.json` is an
AWS CLI-format example; the console editor takes its `CORSRules` array.
**Merge with existing rules if this bucket serves other sites.** Do not blindly
replace another client's CORS settings. CORS does not make an object private.

Remove public read grants/ACLs on the site's raw properties JSON, customer leads,
invoices and share history, and remove public write permissions. Otherwise an
old direct S3 URL could bypass application authorization.

`server/infra/storage-private-policy.example.json` shows two explicit-deny
statements scoped to **this site's folder**. Replace every placeholder with the
correct bucket, folder, Lambda execution **role ARN**, and any approved admin
maintenance role ARNs. Merge its statements into the existing bucket policy;
do not replace unrelated statements. If you have no maintenance role, remove
that placeholder entry. Include any other legitimate backend roles that must
access this same site's files. Using the wrong ARN will deny that role access.

These statements keep raw private files readable only by approved roles and
keep all site-folder writes restricted. Lambda-generated download URLs still
work because they are signed by the approved execution role. Public listing
data is served by Lambda after filtering. Listing media is intentionally public
through the media endpoint. Review and privately protect CRM staging files too;
do not restrict a shared staging prefix without including its other legitimate roles.

For a dedicated bucket, all objects can be private and public-access blocking
enabled once public grants are removed: the Lambda media redirect still works.
For a **shared bucket**, coordinate folder-scoped permissions; do not change
other clients' public access. Bucket privacy changes are not applied by the
deploy script because the existing policy/other clients must be reviewed first.

If the bucket enforces KMS encryption or an existing bucket policy requires a
specific encryption mode, align this update's AES256 uploads and role permissions
with that policy before deployment. Do not weaken existing encryption controls.

## 4. Configure Amplify

Amplify → Hosting → Environment variables:

- Keep/set `VITE_CRM_API_BASE_URL` to the main CRM Function URL plus `/api`.
  Use the value printed at the end of backend deployment; not the MagicBricks API URL.
- Keep public settings such as VITE_SITE_URL and restricted Google Maps browser
  keys. Existing bucket/folder names are non-secret compatibility metadata.
- **Delete** VITE_AWS_ACCESS_KEY_ID and VITE_AWS_SECRET_ACCESS_KEY at both app and
  branch/preview override levels so an older preview cannot receive replacement keys.
- Remove any other manually stored AWS secret/session keys, database URLs,
  JWT secrets or portal API keys from the frontend build settings.
- Do not delete Amplify's platform-managed execution role/temporary credentials.

Remove the two VITE AWS credential lines from your local `.env` too. Keep the
rotated backend secrets private and ignored by Git. `.env.example` has the new layout.
The build intentionally fails while browser-prefixed credentials remain configured.

The repo's `amplify.yml` runs npm ci and the guarded npm run build and publishes
dist. If you already have custom Amplify build settings, preserve their extra
steps while retaining the guarded build command. Keep your existing SPA rewrite
so `/admin/crm`, `/admin/login` and other client routes resolve to index.html.

After the backend and S3 configuration are ready, publish these code changes to
the branch connected to Amplify and trigger a fresh build. Use Amplify's clear-cache
redeploy option where available. Remove old credential-bearing artifacts from any
other S3/CloudFront hosting used previously and invalidate those caches. Revocation
is essential: replacing bundles cannot remove copies already downloaded by others.

## 5. Verify

1. Logged out: listings, property images/videos/brochures and website enquiries work.
2. Admin: property creation/edit/delete, image upload, billing save/download and
   sharing history work. Old billing documents still download via authorized URLs.
3. Team/telecaller: CRM works; `/api/storage/*` returns 403.
4. Logged out: `/api/storage/*` returns 401. Direct S3 reads of private documents
   fail after the bucket policy/ACL changes.
5. Browser bundles contain no AWS credentials. Network shows Lambda requests and
   narrowly scoped signed S3 requests. Temporary signing identifiers and your own
   CRM session token can be visible; AWS secret keys and JWT_SECRET must not be.
6. `npm run scan:secrets` passes. Never disable the guard to publish a build.

## Git history and local leftovers

The secret-bearing .lambda-env.json and generated deployment archives have been
removed from Git tracking, retained locally, and ignored going forward. Delete
the local leftovers after credential rotation if no longer needed. Literal
credential examples in old documentation were redacted and marked obsolete.

Old commits still contain the earlier secrets. Rotation is mandatory even if the
repository is private. A coordinated Git history rewrite may be appropriate;
it has not been performed or force-pushed as part of this code update. Coordinate
with collaborators before rewriting branches or tags, and review GitHub secret
scanning alerts after revocation and cleanup.

Enable the local staged-secret commit check in each checkout:

```bash
npm run security:hooks
npm run test:security
```

It blocks credential-bearing staged files, private .env files and generated
deployment artifacts. The hook is enabled in the current workspace; collaborators
must enable it in their own checkouts. Hook scripts use LF line endings for WSL.
