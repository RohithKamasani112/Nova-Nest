import path from 'node:path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
export function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('Missing required env var DATABASE_URL');
  return url;
}
