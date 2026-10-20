import { randomUUID } from 'node:crypto';
import { pool } from '../db/pool';

export async function listLeadStatuses(): Promise<{ value: string; label: string }[]> {
  const { rows } = await pool.query(`SELECT value, label FROM crm_lead_statuses
    ORDER BY array_position(ARRAY['new','contacted','follow_up','site_visit_scheduled','site_visit_done',
      'negotiation','converted','closed','closed_lost','junk']::text[], value) NULLS LAST, created_at, label`);
  return rows;
}

export async function createLeadStatus(label: string, userId: string) {
  const normalized = label.trim().replace(/\s+/g, ' ');
  if (!normalized || normalized.length > 60 || /[\x00-\x1f\x7f]/.test(normalized)) throw new Error('INVALID_STATUS_LABEL');
  const { rows } = await pool.query(
    `INSERT INTO crm_lead_statuses (value, label, created_by) VALUES ($1, $2, $3)
     ON CONFLICT (lower(label)) DO UPDATE SET label = crm_lead_statuses.label
     RETURNING value, label`, ['custom_' + randomUUID(), normalized, userId]
  );
  return rows[0] as { value: string; label: string };
}

export async function isLeadStatus(value: string): Promise<boolean> {
  const { rowCount } = await pool.query('SELECT 1 FROM crm_lead_statuses WHERE value = $1', [value]);
  return !!rowCount;
}
