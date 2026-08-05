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
};
