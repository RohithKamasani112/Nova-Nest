import bcrypt from 'bcryptjs';
import { pool } from './pool';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@realestate.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME ?? 'Admin User';

const SEED_AGENTS = ['Rajesha B S', 'Priya Sharma', 'Arjun Mehta'];

function normalizeAgentName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

async function main() {
  if (!ADMIN_PASSWORD) {
    throw new Error(
      'Set ADMIN_PASSWORD in the environment before seeding (e.g. `ADMIN_PASSWORD=... npm run seed`). Refusing to seed a guessable default password.'
    );
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const userResult = await pool.query<{ id: string }>(
    `INSERT INTO users (email, password_hash, name, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id`,
    [ADMIN_EMAIL, passwordHash, ADMIN_NAME]
  );
  console.log(`[seed] admin user ready: ${ADMIN_EMAIL} (${userResult.rows[0].id})`);

  for (const name of SEED_AGENTS) {
    const nameNormalized = normalizeAgentName(name);
    const result = await pool.query(
      `INSERT INTO agents (name, name_normalized)
       VALUES ($1, $2)
       ON CONFLICT (name_normalized) DO NOTHING
       RETURNING id`,
      [name, nameNormalized]
    );
    console.log(result.rowCount ? `[seed] agent created: ${name}` : `[seed] agent already exists: ${name}`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
