#!/usr/bin/env node
// Backend deployment file for AWS Lambda. Run with `npm run deploy:lambda`
// from inside server/. Builds, packages production-only dependencies,
// zips, and creates-or-updates the Lambda function + its public Function
// URL. Requires the AWS CLI installed and authenticated (`aws configure`)
// — this script shells out to it rather than re-implementing the AWS API
// calls, so its behavior matches whatever you'd get running the same `aws`
// commands by hand.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import archiver from 'archiver';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(SERVER_ROOT, '..');

dotenv.config({ path: path.join(REPO_ROOT, '.env') });

const FUNCTION_NAME = process.env.LAMBDA_FUNCTION_NAME || 'nova-nest-crm-backend';
const REGION = process.env.AWS_REGION || 'us-east-1';
const ROLE_NAME = `${FUNCTION_NAME}-role`;

function run(cmd, opts = {}) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: SERVER_ROOT, ...opts });
}

function runCapture(cmd) {
  return execSync(cmd, { cwd: SERVER_ROOT, stdio: ['pipe', 'pipe', 'pipe'] }).toString().trim();
}

function zipDirectory(sourceDir, outPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

async function main() {
  console.log('=== Nova Nest CRM backend — Lambda deploy ===');

  // 1. Preconditions
  try {
    const identity = runCapture('aws sts get-caller-identity');
    console.log(`AWS identity: ${identity}`);
  } catch (err) {
    console.error('\nAWS CLI check failed. Real error below (not swallowed) — this is what actually failed:\n');
    console.error(err.stderr?.toString() || err.stdout?.toString() || err.message);
    console.error('\nIf that says something like "command not found" (not an auth error), `aws` was found by your');
    console.error('interactive shell but not by this script — usually a PATH difference between an interactive');
    console.error('shell (reads ~/.bashrc) and a non-interactive one (does not). Try: `which aws` and `which node`');
    console.error('in the same terminal you ran this from, and confirm both paths make sense together (e.g. both');
    console.error('under WSL\'s own filesystem, not one of them resolving to a Windows .exe via WSL interop).');
    process.exit(1);
  }
  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'S3_BUCKET_NAME'];
  const missing = requiredEnvVars.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`\nMissing required variable(s) in the repo-root .env: ${missing.join(', ')}`);
    console.error('S3_BUCKET_NAME is new — see the deployment guide for what it needs to be.');
    process.exit(1);
  }

  // 2. Build
  console.log('\n--- Building TypeScript ---');
  run('npm run build');

  // 3. Package: dist/ + production-only node_modules in a clean staging dir
  console.log('\n--- Installing production dependencies for the package ---');
  const PKG_DIR = path.join(SERVER_ROOT, '.lambda-package');
  fs.rmSync(PKG_DIR, { recursive: true, force: true });
  fs.mkdirSync(PKG_DIR, { recursive: true });
  fs.cpSync(path.join(SERVER_ROOT, 'dist'), path.join(PKG_DIR, 'dist'), { recursive: true });
  fs.copyFileSync(path.join(SERVER_ROOT, 'package.json'), path.join(PKG_DIR, 'package.json'));
  fs.copyFileSync(path.join(SERVER_ROOT, 'package-lock.json'), path.join(PKG_DIR, 'package-lock.json'));
  run('npm ci --omit=dev', { cwd: PKG_DIR });

  console.log('\n--- Zipping ---');
  const ZIP_PATH = path.join(SERVER_ROOT, 'lambda-deploy.zip');
  fs.rmSync(ZIP_PATH, { force: true });
  await zipDirectory(PKG_DIR, ZIP_PATH);
  const sizeMb = (fs.statSync(ZIP_PATH).size / 1024 / 1024).toFixed(1);
  console.log(`Package size: ${sizeMb} MB`);
  if (Number(sizeMb) > 50) {
    console.warn('Package exceeds the 50 MB direct-upload limit — this script does not handle the S3-staged upload path for larger packages.');
  }

  // 4. IAM execution role (create once, reuse on every later deploy)
  console.log('\n--- IAM execution role ---');
  let roleArn;
  try {
    roleArn = runCapture(`aws iam get-role --role-name ${ROLE_NAME} --query Role.Arn --output text`);
    console.log(`Using existing role: ${roleArn}`);
  } catch {
    console.log(`Role ${ROLE_NAME} doesn't exist yet — creating it.`);
    const trustPolicyPath = path.join(SERVER_ROOT, '.lambda-trust-policy.json');
    fs.writeFileSync(
      trustPolicyPath,
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [{ Effect: 'Allow', Principal: { Service: 'lambda.amazonaws.com' }, Action: 'sts:AssumeRole' }],
      })
    );
    roleArn = runCapture(
      `aws iam create-role --role-name ${ROLE_NAME} --assume-role-policy-document file://${trustPolicyPath} --query Role.Arn --output text`
    );
    run(`aws iam attach-role-policy --role-name ${ROLE_NAME} --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole`);

    // Scoped to the import-staging prefix only — this function never needs
    // any other S3 access (property images/listings are handled entirely
    // client-side, see src/utils/s3Helper.ts, unrelated to this backend).
    const s3PolicyPath = path.join(SERVER_ROOT, '.lambda-s3-policy.json');
    fs.writeFileSync(
      s3PolicyPath,
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
            Resource: `arn:aws:s3:::${process.env.S3_BUCKET_NAME}/crm-import-staging/*`,
          },
        ],
      })
    );
    run(`aws iam put-role-policy --role-name ${ROLE_NAME} --policy-name ${ROLE_NAME}-s3 --policy-document file://${s3PolicyPath}`);
    fs.rmSync(trustPolicyPath);
    fs.rmSync(s3PolicyPath);

    console.log('Waiting ~10s for IAM role propagation before first use...');
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }

  // 5. Create or update the function
  console.log('\n--- Lambda function ---');
  const envVarsPath = path.join(SERVER_ROOT, '.lambda-env.json');
  fs.writeFileSync(
    envVarsPath,
    JSON.stringify({
      Variables: {
        DATABASE_URL: process.env.DATABASE_URL,
        JWT_SECRET: process.env.JWT_SECRET,
        S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
        NODE_ENV: 'production',
      },
    })
  );

  let functionExists = true;
  try {
    runCapture(`aws lambda get-function --function-name ${FUNCTION_NAME} --region ${REGION}`);
  } catch {
    functionExists = false;
  }

  if (!functionExists) {
    console.log(`Creating function ${FUNCTION_NAME}...`);
    run(
      `aws lambda create-function --function-name ${FUNCTION_NAME} ` +
        `--runtime nodejs20.x --handler dist/lambda.handler --role ${roleArn} ` +
        `--zip-file fileb://${ZIP_PATH} --timeout 30 --memory-size 512 ` +
        `--environment file://${envVarsPath} --region ${REGION}`
    );
    console.log('Waiting for the function to become active...');
    run(`aws lambda wait function-active --function-name ${FUNCTION_NAME} --region ${REGION}`);
  } else {
    console.log(`Updating code for ${FUNCTION_NAME}...`);
    run(`aws lambda update-function-code --function-name ${FUNCTION_NAME} --zip-file fileb://${ZIP_PATH} --region ${REGION}`);
    run(`aws lambda wait function-updated --function-name ${FUNCTION_NAME} --region ${REGION}`);
    console.log('Updating configuration...');
    run(
      `aws lambda update-function-configuration --function-name ${FUNCTION_NAME} ` +
        `--environment file://${envVarsPath} --timeout 30 --memory-size 512 --region ${REGION}`
    );
    run(`aws lambda wait function-updated --function-name ${FUNCTION_NAME} --region ${REGION}`);
  }
  fs.rmSync(envVarsPath);

  // 6. Public Function URL, with CORS the Express app's own `cors`
  // middleware doesn't need to duplicate — permissive here, actual
  // per-request CORS headers still come from the app itself.
  console.log('\n--- Function URL ---');
  let functionUrl;
  try {
    functionUrl = runCapture(
      `aws lambda get-function-url-config --function-name ${FUNCTION_NAME} --query FunctionUrl --output text --region ${REGION}`
    );
    console.log('Function URL already configured.');
  } catch {
    console.log('Creating Function URL...');
    run(
      `aws lambda create-function-url-config --function-name ${FUNCTION_NAME} ` +
        `--auth-type NONE --cors AllowOrigins=*,AllowMethods=*,AllowHeaders=*,MaxAge=86400 --region ${REGION}`
    );
    run(
      `aws lambda add-permission --function-name ${FUNCTION_NAME} --statement-id FunctionURLAllowPublicAccess ` +
        `--action lambda:InvokeFunctionUrl --principal "*" --function-url-auth-type NONE --region ${REGION}`
    );
    functionUrl = runCapture(
      `aws lambda get-function-url-config --function-name ${FUNCTION_NAME} --query FunctionUrl --output text --region ${REGION}`
    );
  }

  // Cleanup
  fs.rmSync(PKG_DIR, { recursive: true, force: true });
  fs.rmSync(ZIP_PATH, { force: true });

  console.log('\n=== Done ===');
  console.log(`Function URL:  ${functionUrl}`);
  console.log(`Frontend value for VITE_CRM_API_BASE_URL:  ${functionUrl}api`);
  console.log('\nSet that in the Amplify console → Environment variables, then trigger a redeploy so the built bundle picks it up.');
}

main().catch((err) => {
  console.error('\nDeploy failed:', err.message || err);
  process.exit(1);
});
