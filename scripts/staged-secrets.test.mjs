import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const winGit = path.join(process.env.ProgramFiles || 'C:/Program Files', 'Git/cmd/git.exe');
const git = process.platform === 'win32' && fs.existsSync(winGit) ? winGit : 'git';

test('staged secret scan blocks credentials and private files without printing values', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nova-staged-scan-'));
  try {
    execFileSync(git, ['init', '-q', dir]);
    const scan = () => spawnSync(process.execPath, [path.join(root, 'scripts/check-staged-secrets.mjs')], { encoding: 'utf8', env: { ...process.env, GIT_BIN: git, SECRET_SCAN_REPO_DIR: dir } });
    const key = 'AKIA' + 'B'.repeat(16);
    fs.writeFileSync(path.join(dir, 'code.js'), JSON.stringify(key));
    execFileSync(git, ['add', 'code.js'], { cwd: dir });
    let result = scan(); assert.equal(result.status, 1); assert(!result.stderr.includes(key));
    fs.writeFileSync(path.join(dir, 'code.js'), 'console.log("safe");');
    execFileSync(git, ['add', 'code.js'], { cwd: dir }); assert.equal(scan().status, 0);
    fs.writeFileSync(path.join(dir, '.env'), 'JWT_SECRET=private-canary-value');
    execFileSync(git, ['add', '.env'], { cwd: dir }); result = scan(); assert.equal(result.status, 1);
    assert(!result.stderr.includes('private-canary-value'));
  } finally {
    if (path.dirname(dir) === path.resolve(os.tmpdir()) && path.basename(dir).startsWith('nova-staged-scan-')) fs.rmSync(dir, { recursive: true, force: true });
  }
});
