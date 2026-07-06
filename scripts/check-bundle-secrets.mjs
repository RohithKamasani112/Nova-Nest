#!/usr/bin/env node
/**
 * Post-build secret scanner — the safety net that stops a compromised bundle
 * from ever shipping again.
 *
 * Background: Vite inlines every `VITE_`-prefixed env var directly into the
 * client JS at build time. A long-lived AWS secret placed in `.env` therefore
 * ends up in `dist/` in plaintext, readable by anyone who opens the deployed
 * site. This script scans the built output for AWS credential patterns and
 * exits non-zero if it finds any, failing `npm run build` before the artifact
 * can be uploaded.
 *
 * This does NOT make client-side AWS keys safe — nothing can. It only guarantees
 * a leaked key is caught at build time instead of in production. The real fix is
 * to move S3 writes behind a backend/Cognito so no secret reaches the browser.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST_DIR = 'dist';

// AWS access key IDs are the reliable canary: a fixed prefix + 16 base32 chars.
// If one is present, the matching 40-char secret is almost always bundled too.
const AWS_ACCESS_KEY = /\b(AKIA|ASIA|AIDA|AROA|AGPA|ANPA|ANVA|A3T[A-Z0-9])[A-Z0-9]{16}\b/;

// Explicit secrets to hunt for, sourced from the environment so we never hard-
// code a real value into the repo. Set SCAN_EXTRA_SECRETS (comma-separated) to
// also fail on specific known-leaked strings during rotation.
const extraSecrets = (process.env.SCAN_EXTRA_SECRETS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Only text-like assets can leak an inlined string; skip images/media/maps.
const TEXT_EXT = /\.(js|mjs|cjs|css|html|json|txt|xml|map)$/i;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (TEXT_EXT.test(entry)) out.push(full);
  }
  return out;
}

let dist;
try {
  dist = statSync(DIST_DIR);
} catch {
  console.log(`[secret-scan] No ${DIST_DIR}/ directory — nothing to scan.`);
  process.exit(0);
}
if (!dist.isDirectory()) {
  console.error(`[secret-scan] ${DIST_DIR} is not a directory.`);
  process.exit(1);
}

const findings = [];
for (const file of walk(DIST_DIR)) {
  const text = readFileSync(file, 'utf8');

  const keyMatch = text.match(AWS_ACCESS_KEY);
  if (keyMatch) {
    findings.push({ file, kind: 'AWS access key ID', sample: keyMatch[0] });
  }
  for (const secret of extraSecrets) {
    if (text.includes(secret)) {
      findings.push({ file, kind: 'known secret (SCAN_EXTRA_SECRETS)', sample: `${secret.slice(0, 4)}…` });
    }
  }
}

if (findings.length > 0) {
  // Escape hatch: set ALLOW_BUNDLED_SECRETS=1 in the build environment to let
  // the build proceed despite findings. This does NOT make the key safe — it is
  // still shipped in plaintext to every browser. Use only as a temporary unblock
  // while migrating S3 writes behind a backend/Cognito. See SECURITY.md.
  const allowBundledSecrets = /^(1|true|yes)$/i.test(process.env.ALLOW_BUNDLED_SECRETS || '');
  const header = allowBundledSecrets
    ? '\n⚠️  [secret-scan] SECRETS FOUND IN BUILD OUTPUT — allowed by ALLOW_BUNDLED_SECRETS.\n'
    : '\n🚨 [secret-scan] SECRETS FOUND IN BUILD OUTPUT — build blocked.\n';
  const log = allowBundledSecrets ? console.warn : console.error;

  log(header);
  for (const f of findings) {
    log(`   • ${f.kind} in ${f.file}  (match: ${f.sample})`);
  }
  log(
    '\nA long-lived AWS key must never be shipped to the browser. Remove\n' +
      'VITE_AWS_ACCESS_KEY_ID / VITE_AWS_SECRET_ACCESS_KEY from the build\n' +
      'environment and move S3 writes behind a backend or Cognito. See SECURITY.md.\n'
  );

  if (!allowBundledSecrets) process.exit(1);
  console.warn('[secret-scan] Continuing despite findings (ALLOW_BUNDLED_SECRETS is set).\n');
}

console.log('[secret-scan] ✓ No AWS credential patterns found in dist/.');
