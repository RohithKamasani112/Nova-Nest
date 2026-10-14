import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
test('Lambda deployment preserves configuration, scopes IAM, redacts output and cleans failed/successful packages', { skip: process.platform === 'win32' }, () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'nova-deploy-test-'));
  const bin = path.join(temp, 'bin'); fs.mkdirSync(bin);
  const log = path.join(temp, 'calls.jsonl');
  const jwt = 'canary-jwt-signing-secret-0123456789abcdef';
  const other = 'preserved-canary-backend-secret';
  const db = 'postgresql://test:canary-password@localhost/test';
  const awsStub = `#!/usr/bin/env node
const fs = require('fs');
const args = process.argv.slice(2);
const entry = {args};
if (args.includes('--environment')) {
  entry.environmentPath = args[args.indexOf('--environment')+1].slice(7);
  entry.environment = JSON.parse(fs.readFileSync(entry.environmentPath));
}
if (args.includes('--policy-document')) entry.policy = JSON.parse(fs.readFileSync(args[args.indexOf('--policy-document')+1].slice(7)));
if (args.includes('--cors')) entry.cors = JSON.parse(fs.readFileSync(args[args.indexOf('--cors')+1].slice(7)));
fs.appendFileSync(process.env.DEPLOY_TEST_LOG,JSON.stringify(entry)+'\\n');
if(args[0]==='lambda' && args[1]==='get-function-configuration') {
  if(process.env.DEPLOY_TEST_FAIL==='missing') { process.stderr.write('ResourceNotFoundException');process.exit(1); }
  console.log(JSON.stringify({Role:'arn:aws:iam::111122223333:role/test-role',Environment:{Variables:{OTHER_SECRET:${JSON.stringify(other)},VITE_AWS_SECRET_ACCESS_KEY:'old-browser-setting',AWS_SECRET_ACCESS_KEY:'old-static-key'}}}));
} else if(args[0]==='lambda' && args[1]==='get-function-url-config') console.log(JSON.stringify({AuthType:'NONE',FunctionUrl:'https://test-id.lambda-url.us-east-1.on.aws/'}));
else if(args[1]==='update-function-configuration' && process.env.DEPLOY_TEST_FAIL==='configuration') {
  process.stderr.write('Simulated failure: '+entry.environment.Variables.JWT_SECRET+' '+entry.environment.Variables.DATABASE_URL+' '+entry.environment.Variables.OTHER_SECRET);process.exit(1);
} else console.log(JSON.stringify(entry.environment || {}));
`;
  fs.writeFileSync(path.join(bin, 'aws'), awsStub, { mode: 0o700 });
  fs.writeFileSync(path.join(bin, 'npm'), '#!/bin/sh\nexit 0\n', { mode: 0o700 });
  try {
    for (const fail of ['', 'configuration', 'missing']) {
      fs.writeFileSync(log, '');
      const result = spawnSync(process.execPath, [path.join(root, 'scripts/deploy-lambda.mjs')], { cwd: root, encoding: 'utf8', env: {
        ...process.env, PATH: `${bin}:${process.env.PATH}`, DEPLOY_TEST_LOG: log, DEPLOY_TEST_FAIL: fail,
        LAMBDA_FUNCTION_NAME: 'test-lambda', AWS_REGION: 'us-east-1', S3_REGION: 'us-east-1',
        S3_BUCKET_NAME: 'test-only-bucket', S3_FOLDER: 'nova-site', ALLOWED_ORIGINS: 'https://app.testing.invalid',
        DATABASE_URL: db, JWT_SECRET: jwt,
      } });
      assert.equal(result.status, fail ? 1 : 0, result.stderr);
      for (const secret of [jwt, db, other, 'old-static-key', 'old-browser-setting']) assert(!(result.stdout + result.stderr).includes(secret), 'AWS values must never reach terminal output');
      const calls = fs.readFileSync(log, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
      assert(!calls.some(call => call.args.includes('create-function') || call.args.includes('create-role')), 'Only existing infrastructure may be updated');
      const update = calls.find(call => call.environment);
      if (fail === 'missing') { assert.equal(update, undefined); continue; }
      assert.equal(update.environment.Variables.OTHER_SECRET, other);
      assert.equal(update.environment.Variables.JWT_SECRET, jwt);
      assert(!('VITE_AWS_SECRET_ACCESS_KEY' in update.environment.Variables));
      assert(!('AWS_SECRET_ACCESS_KEY' in update.environment.Variables));
      assert.equal(fs.existsSync(update.environmentPath), false, 'Temporary secrets must be removed on success and failure');
      assert.equal(fs.existsSync(path.dirname(update.environmentPath)), false);
      const policy = calls.find(call => call.policy).policy;
      assert(policy.Statement[0].Resource.includes('arn:aws:s3:::test-only-bucket/nova-site/*'));
      assert(!JSON.stringify(policy).includes('"Resource":"*"'));
      if (!fail) assert.deepEqual(calls.find(call => call.cors).cors.AllowOrigins, ['https://app.testing.invalid']);
    }
  } finally {
    if (path.dirname(temp) === path.resolve(os.tmpdir()) && path.basename(temp).startsWith('nova-deploy-test-')) fs.rmSync(temp, { recursive: true, force: true });
  }
});
