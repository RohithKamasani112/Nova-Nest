# Security — AWS credential exposure

## Summary of the incident

The app talks to AWS S3 **directly from the browser** using a long-lived IAM
access key + secret key supplied via `VITE_AWS_ACCESS_KEY_ID` /
`VITE_AWS_SECRET_ACCESS_KEY`.

Vite **inlines every `VITE_`-prefixed variable into the client JavaScript bundle
at build time.** As a result the access key and secret key were shipped inside
`dist/assets/index-*.js` in plaintext and were readable by anyone who opened the
deployed site (DevTools → Sources → search `AKIA`). This — not git, not the
build machine — is how the key was stolen. `.env` being gitignored does **not**
protect a value that gets compiled into the frontend.

**There is no configuration that makes a long-lived AWS secret safe in a
client-side app.** If browser code can read the secret, the secret is public.

## Immediate remediation (do this in AWS now)

1. **Deactivate/delete the leaked key** `AKIA6F76UB5BHOAXIOZW` in
   IAM → Users → Security credentials.
2. Review **CloudTrail** and **Billing** for unauthorized activity.
3. Do **not** paste a fresh key into `.env` and rebuild for a public deploy — it
   would be exposed again immediately.

## Guardrails added in this repo

- **`scripts/check-bundle-secrets.mjs`** — scans `dist/` after every build for
  AWS access-key patterns and **fails the build** if any are found. Wired into
  `npm run build`; also runnable standalone via `npm run scan:secrets`.
  During a rotation you can also fail on a specific string:
  `SCAN_EXTRA_SECRETS="oldSecret1,oldSecret2" npm run scan:secrets`.
- **Runtime guard** in `src/utils/s3Helper.ts` — logs a loud `[SECURITY]` error
  if a production build initializes the S3 client with a real secret embedded.
- **`.env.example`** — documents the exposure and the safe-usage rules.
- The previously-built compromised `dist/` has been deleted.

These catch the mistake; they do **not** make client-side keys safe.

## "Can I just rename the vars without `VITE_` so they aren't stolen?"

Half right. Non-`VITE_` variables are **not** inlined into the bundle, so the
secret would no longer leak. **But** the browser then cannot read them either
(`import.meta.env.THE_VAR` is `undefined` on the client), so the current
in-browser S3 code would stop working. The only place a non-`VITE_` secret can
be read is a **server-side** process. So renaming is the *first step* of the
proper fix below — not a standalone solution.

## The real fix (choose one when ready)

Both keep the secret entirely off the client:

### Option A — Serverless proxy (recommended)
- **Reads:** make the S3 objects public-read (or front them with CloudFront).
  The browser fetches JSON/images over plain HTTPS with **no credentials**.
- **Writes (admin uploads / property saves):** a small backend function
  (AWS Lambda + API Gateway, or a Vercel/Netlify function) holds the secret in a
  **non-`VITE_`** server env var and either performs the S3 write or returns a
  short-lived **pre-signed upload URL**. The browser never sees the secret.

### Option B — Cognito Identity Pool
- This app already references Cognito (`VITE_USER_POOL_ID`, etc.).
- An authenticated admin exchanges their login for **temporary, scoped AWS
  credentials** (valid ~1h) from a Cognito Identity Pool, used for the S3 write.
- No long-lived `AKIA` key exists anywhere in the app.

Until Option A or B is in place, treat any key in `.env` as **dev-only** and
never deploy a build made with a real secret.
