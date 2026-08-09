import path from 'node:path';
import dotenv from 'dotenv';

// Secrets live in the repo-root .env (single source of truth) rather than a
// duplicate server/.env, so DATABASE_URL etc. only ever need to be set once.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var ${name} (checked repo-root .env)`);
  }
  return value;
}

export const env = {
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  port: Number(process.env.CRM_SERVER_PORT ?? 4001),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  // Import staging (server/src/lib/uploadStorage.ts): a file uploaded during
  // /preview has to still be readable during the later /commit request. On
  // Lambda those can land on two different execution environments with
  // unrelated /tmp directories, so staging goes to S3 instead of local disk.
  // Not the same bucket variable as the frontend's VITE_S3_BUCKET_NAME (that
  // one is inlined into the browser bundle at build time and isn't visible
  // to this Node process) — same underlying bucket is fine, just needs its
  // own plain env var here.
  s3BucketName: required('S3_BUCKET_NAME'),
  awsRegion: process.env.AWS_REGION ?? 'us-east-1',
};
