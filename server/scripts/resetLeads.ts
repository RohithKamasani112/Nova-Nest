/**
 * One-command clean-slate for verifying real duplicate-rate numbers: wipes
 * leads, lead_duplicates and lead_import_batches (lead_activities cascades
 * with leads) without touching agents, users, or the learned column-mapping
 * registry. Re-upload the 3 sample files from sample_files/ via the UI
 * afterwards to get a clean, single-pass read on the duplicate rate.
 */
import { pool } from '../src/db/pool';

async function main() {
  await pool.query('TRUNCATE TABLE leads, lead_duplicates, lead_import_batches CASCADE');
  console.log('[reset-leads] leads, lead_duplicates, lead_import_batches truncated.');
  console.log('[reset-leads] Re-upload the 3 files from sample_files/ via the CRM import UI to get clean numbers.');
  await pool.end();
}

main().catch((err) => {
  console.error('[reset-leads] failed:', err);
  process.exit(1);
});
