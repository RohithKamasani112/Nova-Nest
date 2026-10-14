# AWS credential exposure remediation

The frontend previously initialized S3 with long-lived AWS credentials from
VITE-prefixed environment variables. Those values were compiled into public
JavaScript. A tracked deployment environment file also contained backend secrets.

The current code moves storage operations into the existing CRM Lambda. The
Lambda uses its execution role; the Amplify frontend receives listing data and
short-lived scoped upload/download URLs, never AWS secret keys. Private storage
routes require an admin session. Raw S3 data also needs appropriate bucket
permissions; application authorization does not override a public bucket policy.

Follow [Amplify + Lambda security setup](AMPLIFY_LAMBDA_SECURITY.md) for the exact
credential rotation, Lambda configuration, S3 permissions/CORS, Amplify settings,
deployment order and verification steps. No separate server is needed.

Mandatory build checks:

- `scripts/check-client-env.mjs` rejects frontend-prefixed private credentials and
  unsafe browser credential references before building.
- `scripts/check-bundle-secrets.mjs` scans generated assets and fails on exposed
  credentials without printing their values.
- `npm run build` runs both checks. `npm run scan:secrets` scans an existing build.
- `npm run test:security` validates the guards with synthetic canary secrets.

Code changes do not revoke already exposed credentials, remove downloaded copies
or resolve an AWS account restriction. Revoke the exposed IAM key and rotate the
database password/JWT signing secret. Update both the CRM and portal Lambdas when
rotating their shared database connection. Review security findings and billing.

Deployment-generated secret files and archives are untracked and ignored going
forward. Earlier Git commits still need coordinated cleanup after revocation;
history has not been rewritten or force-pushed by this change.
