#!/usr/bin/env node
// Updates the EXISTING main CRM Lambda. Nothing here runs a permanent server.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import archiver from 'archiver';
import dotenv from 'dotenv';

const SERVER_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(SERVER_ROOT, '../.env') });
const FUNCTION_NAME = process.env.LAMBDA_FUNCTION_NAME;
const REGION = process.env.AWS_REGION;
let temp;
const privateValues = new Set();
const redact = value => {
  let text = String(value);
  for (const [key, secret] of Object.entries(process.env)) {
    if (/SECRET|PASSWORD|DATABASE_URL|ACCESS_KEY|TOKEN|API_KEY/i.test(key) && secret && secret.length > 5) privateValues.add(secret);
  }
  for (const secret of privateValues) text = text.split(secret).join('[REDACTED]');
  return text.replace(/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g, '[REDACTED_ACCESS_KEY]')
    .replace(/postgres(?:ql)?:\/\/[^\s"']+/g, '[REDACTED_DATABASE_URL]');
};
function aws(args) {
  try {
    const data = execFileSync('aws', [...args, '--region', REGION, '--no-cli-pager', '--output', 'json'],
      { cwd: SERVER_ROOT, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
    return data ? JSON.parse(data) : null;
  } catch (error) {
    // Never print stdout: Lambda configuration responses include secret values.
    throw new Error(`AWS ${args[0]} ${args[1]} failed. ${redact(error.stderr?.toString() || 'Check AWS credentials, permissions and region.').slice(0, 1200)}`);
  }
}
function jsonFile(name, data) {
  const file = path.join(temp, name);
  fs.writeFileSync(file, JSON.stringify(data), { mode: 0o600 });
  return `file://${file}`;
}
async function zip(source, target) {
  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(target, { mode: 0o600 });
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', resolve); output.on('error', reject); archive.on('error', reject);
    archive.pipe(output); archive.directory(source, false); archive.finalize();
  });
}
async function main() {
  if (!FUNCTION_NAME || !REGION) throw new Error('Set LAMBDA_FUNCTION_NAME and AWS_REGION to the EXISTING main CRM Lambda. No default function will be created.');
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(FUNCTION_NAME)) throw new Error('LAMBDA_FUNCTION_NAME must be the existing function name, not an ARN.');
  const origins = (process.env.ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
  if (!origins.length || origins.some(value => { try { return new URL(value).origin !== value || !value.startsWith('https://'); } catch { return true; } })) {
    throw new Error('Set ALLOWED_ORIGINS to exact HTTPS Amplify/custom-domain origins, comma-separated, without trailing slashes.');
  }
  console.log(`Updating existing CRM Lambda ${FUNCTION_NAME} in ${REGION}. AWS responses and secret values are not printed.`);
  aws(['sts', 'get-caller-identity']);
  const existing = aws(['lambda', 'get-function-configuration', '--function-name', FUNCTION_NAME]);
  const url = aws(['lambda', 'get-function-url-config', '--function-name', FUNCTION_NAME]);
  if (url.AuthType !== 'NONE') throw new Error('This deployment expects the existing public Function URL with application JWT authentication.');
  const previous = existing.Environment?.Variables ?? {};
  for (const [key, value] of Object.entries(previous)) if (/SECRET|PASSWORD|DATABASE_URL|ACCESS_KEY|TOKEN|API_KEY/i.test(key) && value && value.length > 5) privateValues.add(value);
  const folder = (process.env.S3_FOLDER || previous.S3_FOLDER ||
    (process.env.VITE_IS_PRODUCTION === 'true' ? process.env.VITE_S3_FOLDER_PROD : process.env.VITE_S3_FOLDER_DUMMY) || '').replace(/^\/+|\/+$/g, '');
  const bucket = process.env.S3_BUCKET_NAME || previous.S3_BUCKET_NAME;
  if (!bucket || !/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket) || !folder || !/^[a-zA-Z0-9_./ -]+$/.test(folder) || folder.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('Set S3_BUCKET_NAME and S3_FOLDER to the existing site bucket and folder. Storage at the bucket root is prohibited.');
  const variables = { ...previous, S3_BUCKET_NAME: bucket, S3_FOLDER: folder,
    S3_REGION: process.env.S3_REGION || previous.S3_REGION || process.env.VITE_AWS_REGION || REGION,
    ALLOWED_ORIGINS: origins.join(','), CORS_AT_FUNCTION_URL: 'true', NODE_ENV: 'production' };
  for (const name of ['DATABASE_URL', 'JWT_SECRET']) {
    if (process.env[name]) variables[name] = process.env[name];
    if (!variables[name]) throw new Error(`Missing backend ${name}. Configure it in Lambda or the backend .env.`);
  }
  if (variables.JWT_SECRET.length < 32 || /REPLACE|YOUR_|CHANGE_ME/i.test(variables.JWT_SECRET)) throw new Error('Use a rotated JWT_SECRET of at least 32 characters (openssl rand -hex 32).');
  try { if (!/^postgres(?:ql)?:$/.test(new URL(variables.DATABASE_URL).protocol)) throw new Error(); }
  catch { throw new Error('Configure the rotated PostgreSQL DATABASE_URL in Lambda or the private local .env.'); }
  // Frontend-prefixed settings and static IAM keys must never be Lambda config.
  for (const name of Object.keys(variables)) if (name.startsWith('VITE_') || /^(AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY|AWS_SESSION_TOKEN)$/.test(name)) delete variables[name];
  temp = fs.mkdtempSync(path.join(os.tmpdir(), 'nova-nest-deploy-'));
  fs.chmodSync(temp, 0o700);
  console.log('Building backend…');
  execFileSync('npm', ['run', 'build'], { cwd: SERVER_ROOT, stdio: 'inherit' });
  const pkg = path.join(temp, 'package'); fs.mkdirSync(pkg);
  fs.cpSync(path.join(SERVER_ROOT, 'dist'), path.join(pkg, 'dist'), { recursive: true,
    filter: source => !path.relative(path.join(SERVER_ROOT, 'dist'), source).split(path.sep).includes('test') });
  for (const name of ['package.json', 'package-lock.json']) fs.copyFileSync(path.join(SERVER_ROOT, name), path.join(pkg, name));
  execFileSync('npm', ['ci', '--omit=dev', '--ignore-scripts'], { cwd: pkg, stdio: 'inherit' });
  const archive = path.join(temp, 'lambda.zip'); await zip(pkg, archive);
  if (fs.statSync(archive).size > 50 * 1024 * 1024) throw new Error('Package exceeds the direct Lambda upload limit. Use S3-staged deployment.');
  const roleName = existing.Role.split('/').pop();
  const policy = { Version: '2012-10-17', Statement: [
    { Effect: 'Allow', Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'], Resource: [`arn:aws:s3:::${bucket}/${folder}/*`, `arn:aws:s3:::${bucket}/crm-import-staging/*`] },
    { Effect: 'Allow', Action: ['s3:ListBucket'], Resource: [`arn:aws:s3:::${bucket}`], Condition: { StringLike: { 's3:prefix': [`${folder}/*`, 'crm-import-staging/*'] } } },
  ] };
  console.log('Applying folder-scoped S3 permissions to the existing Lambda execution role…');
  aws(['iam', 'put-role-policy', '--role-name', roleName, '--policy-name', `${FUNCTION_NAME}-storage`, '--policy-document', jsonFile('storage-policy.json', policy)]);
  aws(['lambda', 'update-function-code', '--function-name', FUNCTION_NAME, '--zip-file', `fileb://${archive}`]);
  aws(['lambda', 'wait', 'function-updated', '--function-name', FUNCTION_NAME]);
  aws(['lambda', 'update-function-configuration', '--function-name', FUNCTION_NAME,
    '--environment', jsonFile('environment.json', { Variables: variables }), '--timeout', '30', '--memory-size', '512']);
  aws(['lambda', 'wait', 'function-updated', '--function-name', FUNCTION_NAME]);
  // One CORS owner: Function URL handles browser headers; Express handles CORS
  // only for local development/API Gateway installations that do not set this flag.
  aws(['lambda', 'update-function-url-config', '--function-name', FUNCTION_NAME, '--cors', jsonFile('cors.json', {
    AllowOrigins: origins, AllowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    AllowHeaders: ['authorization', 'content-type'], AllowCredentials: false, MaxAge: 300,
  })]);
  console.log('Deployment complete. Existing function name, execution role and Function URL retained.');
  console.log(`Amplify VITE_CRM_API_BASE_URL=${url.FunctionUrl.replace(/\/$/, '')}/api`);
  console.log('Configure S3 CORS for your exact website origins before testing uploads. See AMPLIFY_LAMBDA_SECURITY.md.');
}
try { await main(); }
catch (error) { console.error(redact(error.message || 'Deployment failed.')); process.exitCode = 1; }
finally {
  if (temp && path.dirname(temp) === path.resolve(os.tmpdir()) && path.basename(temp).startsWith('nova-nest-deploy-')) fs.rmSync(temp, { recursive: true, force: true });
}
