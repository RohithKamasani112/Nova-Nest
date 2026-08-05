import { Pool } from 'pg';
import { env } from '../env';

// Neon is serverless/connection-limited; keep the pool small and let idle
// connections close quickly rather than holding them open.
//
// The CRM's business hours are India-based; queries that use now()/
// current_date/::date (follow-up "due today"/"overdue" buckets, KPI period
// boundaries) need those to resolve in IST, not whatever UTC-ish default
// Neon's server timezone is. `options` sets it as a Postgres startup
// parameter — applied before any query can run on the connection — rather
// than a `SET` issued from a 'connect' event handler, which would race the
// pool's first real query on that same connection.
export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: { rejectUnauthorized: true },
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  options: '-c TimeZone=Asia/Kolkata',
});

pool.on('error', (err) => {
  console.error('[db] idle client error', err);
});

export async function withTransaction<T>(fn: (client: import('pg').PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
