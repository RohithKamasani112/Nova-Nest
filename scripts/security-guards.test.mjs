import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = (script, env = {}) => spawnSync(process.execPath, [path.join(root, script)], {
  cwd: root, encoding: 'utf8', env: { ...process.env, VITE_AWS_ACCESS_KEY_ID: '', VITE_AWS_SECRET_ACCESS_KEY: '', ...env },
});

test('client guard rejects private build variables without printing their values', () => {
  const value = 'canary-secret-that-must-never-be-printed';
  const result = run('scripts/check-client-env.mjs', { VITE_AWS_SECRET_ACCESS_KEY: value });
  assert.equal(result.status, 1);
  assert(result.stderr.includes('VITE_AWS_SECRET_ACCESS_KEY'));
  assert(!result.stderr.includes(value));
});
test('client guard accepts credential-free frontend code', () => {
  const result = run('scripts/check-client-env.mjs');
  assert.equal(result.status, 0, result.stderr);
});
test('bundle scanner rejects AWS identifiers, database passwords and known signing secrets', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nova-secret-scan-'));
  try {
    const canaries = ['AKIA' + 'A'.repeat(16), 'npg_' + 'a'.repeat(16), 'known-canary-signing-secret'];
    for (const canary of canaries) {
      fs.writeFileSync(path.join(dir, 'index.js'), JSON.stringify({ value: canary }));
      const result = run('scripts/check-bundle-secrets.mjs', { SECRET_SCAN_DIR: dir, JWT_SECRET: canaries[2] });
      assert.equal(result.status, 1);
      assert(!result.stderr.includes(canary));
    }
    fs.writeFileSync(path.join(dir, 'index.js'), 'console.log("safe bundle");');
    assert.equal(run('scripts/check-bundle-secrets.mjs', { SECRET_SCAN_DIR: dir }).status, 0);
  } finally {
    if (path.dirname(dir) === path.resolve(os.tmpdir()) && path.basename(dir).startsWith('nova-secret-scan-')) fs.rmSync(dir, { recursive: true, force: true });
  }
});
