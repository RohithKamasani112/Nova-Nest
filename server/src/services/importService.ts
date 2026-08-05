import crypto from 'node:crypto';
import { PoolClient } from 'pg';
import { pool, withTransaction } from '../db/pool';
import { CrmSource, MappedLead, RawRow } from '../types/crm';
import { parseFile, ParseFileResult, SanityGateError } from '../parsers/parseFile';
import { FieldMapping } from '../parsers/rowMapper';
import { normalizeHeaderKey } from '../lib/headerNormalize';
import { dedupeWithinFile } from '../lib/dedupe';
import { resolveAgentsBatch } from './agentService';
import { findExistingMatchesBatch, DbMatchKind } from './duplicateService';
import { findNewHeaders, upsertColumnRegistry } from './sourceColumnRegistryService';
import { loadOverrides, saveOverrides } from './mappingOverridesService';
import { storeUploadedFile, readStoredFile, deleteStoredFile } from '../lib/uploadStorage';

export { SanityGateError };

const CHUNK_SIZE = 500;
const BACKGROUND_THRESHOLD = 5000;

// ------------------------------------------------------------- preview ---

export interface PreviewResult {
  batchId: string;
  format: string;
  headers: string[];
  mapping: { header: string; headerKey: string; canonicalField: string | null; method?: string }[];
  unmapped: string[];
  newColumns: string[];
  sampleRows: Record<string, unknown>[];
  rowsRead: number;
  duplicateFileWarning?: { batchId: string; importedAt: string; fileName: string } | null;
}

function leadToPreviewRow(lead: MappedLead, error: string | null): Record<string, unknown> {
  return {
    name: lead.name,
    phone: lead.phone,
    phoneRaw: lead.phoneRaw,
    email: lead.email,
    leadDate: lead.leadDate,
    listingType: lead.listingType,
    configuration: lead.configuration,
    priceValue: lead.priceValue,
    priceRaw: lead.priceRaw,
    agentNameRaw: lead.agentNameRaw,
    error,
    warnings: lead.warnings,
  };
}

export async function previewImport(
  fileBuffer: Buffer,
  fileName: string,
  source: CrmSource,
  userId: string | null
): Promise<PreviewResult> {
  const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const client = await pool.connect();
  try {
    const dupFile = await client.query<{ id: string; created_at: Date; file_name: string }>(
      `SELECT id, created_at, file_name FROM lead_import_batches
       WHERE file_hash = $1 AND status = 'completed'
       ORDER BY created_at DESC LIMIT 1`,
      [fileHash]
    );

    const overrides = source === 'personal' ? {} : await loadOverrides(client, source);
    const parseResult = parseFile(fileBuffer, source, overrides); // throws SanityGateError -> route returns 422

    const newColumns = source === 'personal' ? [] : await findNewHeaders(client, source, parseResult.mapping);

    const batchInsert = await client.query<{ id: string }>(
      `INSERT INTO lead_import_batches
         (source, file_name, file_size, file_hash, detected_format, detected_headers, applied_mapping, rows_read, status, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'previewing',$9)
       RETURNING id`,
      [
        source,
        fileName,
        fileBuffer.length,
        fileHash,
        parseResult.format,
        JSON.stringify(parseResult.headers),
        JSON.stringify(parseResult.mapping),
        parseResult.rows.length,
        userId,
      ]
    );
    const batchId = batchInsert.rows[0].id;
    await storeUploadedFile(batchId, fileName, fileBuffer);

    return {
      batchId,
      format: parseResult.format,
      headers: parseResult.headers,
      mapping: parseResult.mapping.map((m) => ({
        header: m.header,
        headerKey: normalizeHeaderKey(m.header),
        canonicalField: m.canonicalField,
        method: m.method,
      })),
      unmapped: parseResult.mapping.filter((m) => !m.canonicalField).map((m) => m.header),
      newColumns,
      sampleRows: parseResult.rows.slice(0, 5).map((r) => leadToPreviewRow(r.lead, r.error)),
      rowsRead: parseResult.rows.length,
      duplicateFileWarning: dupFile.rows[0]
        ? { batchId: dupFile.rows[0].id, importedAt: dupFile.rows[0].created_at.toISOString(), fileName: dupFile.rows[0].file_name }
        : null,
    };
  } finally {
    client.release();
  }
}

// -------------------------------------------------------------- commit ---

export type DuplicatePolicy = 'skip' | 'enrich' | 'create_anyway';

export interface CommitParams {
  batchId: string;
  mappingOverrides: Record<string, string>;
  defaultAgentId: string | null;
  duplicatePolicy: DuplicatePolicy;
  autoCreateAgents: boolean;
  userId: string | null;
}

export interface BatchSummary {
  batchId: string;
  status: string;
  source: CrmSource;
  fileName: string;
  rowsRead: number;
  rowsImported: number;
  rowsDuplicate: number;
  rowsError: number;
  duplicateBreakdown: { phone: number; email: number; source_property_name: number; in_file: number };
  fieldWarnings: { code: string; count: number }[];
  highDuplicateRate: boolean;
  newColumns: string[];
  createdAt: string;
  completedAt: string | null;
}

export class BatchNotFoundError extends Error {
  constructor() {
    super('Import batch not found.');
    this.name = 'BatchNotFoundError';
  }
}

interface DbBatchRow {
  id: string;
  source: CrmSource;
  file_name: string;
  rows_read: number;
  rows_imported: number;
  rows_duplicate: number;
  rows_error: number;
  status: string;
  warnings: any;
  errors: any;
  new_columns: any;
  created_at: Date;
  completed_at: Date | null;
}

function toBatchSummary(row: DbBatchRow): BatchSummary {
  const warnings = row.warnings ?? {};
  return {
    batchId: row.id,
    status: row.status,
    source: row.source,
    fileName: row.file_name,
    rowsRead: row.rows_read,
    rowsImported: row.rows_imported,
    rowsDuplicate: row.rows_duplicate,
    rowsError: row.rows_error,
    duplicateBreakdown: warnings.duplicateBreakdown ?? { phone: 0, email: 0, source_property_name: 0, in_file: 0 },
    fieldWarnings: warnings.fieldWarnings ?? [],
    highDuplicateRate: warnings.highDuplicateRate ?? false,
    newColumns: row.new_columns ?? [],
    createdAt: row.created_at.toISOString(),
    completedAt: row.completed_at ? row.completed_at.toISOString() : null,
  };
}

export async function getBatchSummary(batchId: string): Promise<BatchSummary> {
  const { rows } = await pool.query<DbBatchRow>('SELECT * FROM lead_import_batches WHERE id = $1', [batchId]);
  if (!rows[0]) throw new BatchNotFoundError();
  return toBatchSummary(rows[0]);
}

export async function listBatches(limit: number, offset: number): Promise<{ batches: BatchSummary[]; total: number }> {
  const [{ rows }, countResult] = await Promise.all([
    pool.query<DbBatchRow>(
      `SELECT * FROM lead_import_batches WHERE status != 'previewing' ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
    pool.query<{ count: string }>(`SELECT count(*) FROM lead_import_batches WHERE status != 'previewing'`),
  ]);
  return { batches: rows.map(toBatchSummary), total: Number(countResult.rows[0].count) };
}

export async function getBatchErrorsCsv(batchId: string): Promise<{ fileName: string; csv: string }> {
  const { rows } = await pool.query<DbBatchRow>('SELECT * FROM lead_import_batches WHERE id = $1', [batchId]);
  if (!rows[0]) throw new BatchNotFoundError();
  const errors: { rowNumber: number; reason: string; raw: RawRow }[] = rows[0].errors ?? [];

  const headerSet = new Set<string>();
  for (const e of errors) Object.keys(e.raw).forEach((h) => headerSet.add(h));
  const headers = Array.from(headerSet);

  const csvEscape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines = [
    [...headers, '_reason'].map(csvEscape).join(','),
    ...errors.map((e) => [...headers.map((h) => e.raw[h]), e.reason].map(csvEscape).join(',')),
  ];

  return { fileName: `${rows[0].file_name}-errors.csv`, csv: lines.join('\r\n') };
}

async function insertLead(
  client: PoolClient,
  lead: MappedLead,
  source: CrmSource,
  batchId: string,
  agentId: string | null,
  isDuplicate: boolean,
  duplicateOfId: string | null
): Promise<string> {
  const { rows } = await client.query<{ id: string }>(
    `INSERT INTO leads (
       source, batch_id, name, name_normalized, phone, phone_raw, email,
       lead_date, external_property_id, project_name, property_type, property_description,
       listing_type, configuration, bedrooms, price_raw, price_value, city, locality, state,
       address, message, lead_type, source_status, agent_id, status, raw_data,
       is_duplicate, duplicate_of_id
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
       $21,$22,$23,$24,$25,'new',$26,$27,$28
     ) RETURNING id`,
    [
      source,
      batchId,
      lead.name,
      lead.nameNormalized,
      lead.phone,
      lead.phoneRaw,
      lead.email,
      lead.leadDate,
      lead.externalPropertyId,
      lead.projectName,
      lead.propertyType,
      lead.propertyDescription,
      lead.listingType,
      lead.configuration,
      lead.bedrooms,
      lead.priceRaw,
      lead.priceValue,
      lead.city,
      lead.locality,
      lead.state,
      lead.address,
      lead.message,
      lead.leadType,
      lead.sourceStatus,
      agentId,
      JSON.stringify(lead.rawData),
      isDuplicate,
      duplicateOfId,
    ]
  );
  return rows[0].id;
}

async function enrichExistingLead(client: PoolClient, existingId: string, lead: MappedLead, source: CrmSource): Promise<void> {
  await client.query(
    `UPDATE leads SET
       phone = COALESCE(phone, $1),
       phone_raw = COALESCE(phone_raw, $2),
       email = COALESCE(email, $3),
       lead_date = COALESCE(lead_date, $4),
       external_property_id = COALESCE(external_property_id, $5),
       project_name = COALESCE(project_name, $6),
       property_type = COALESCE(property_type, $7),
       property_description = COALESCE(property_description, $8),
       listing_type = COALESCE(listing_type, $9),
       configuration = COALESCE(configuration, $10),
       bedrooms = COALESCE(bedrooms, $11),
       price_raw = COALESCE(price_raw, $12),
       price_value = COALESCE(price_value, $13),
       city = COALESCE(city, $14),
       locality = COALESCE(locality, $15),
       state = COALESCE(state, $16),
       address = COALESCE(address, $17),
       message = COALESCE(message, $18),
       lead_type = COALESCE(lead_type, $19),
       source_status = COALESCE(source_status, $20),
       enquiry_count = enquiry_count + 1,
       raw_data = $21::jsonb || raw_data
     WHERE id = $22`,
    [
      lead.phone,
      lead.phoneRaw,
      lead.email,
      lead.leadDate,
      lead.externalPropertyId,
      lead.projectName,
      lead.propertyType,
      lead.propertyDescription,
      lead.listingType,
      lead.configuration,
      lead.bedrooms,
      lead.priceRaw,
      lead.priceValue,
      lead.city,
      lead.locality,
      lead.state,
      lead.address,
      lead.message,
      lead.leadType,
      lead.sourceStatus,
      JSON.stringify(lead.rawData),
      existingId,
    ]
  );
  await client.query(
    `INSERT INTO lead_activities (lead_id, type, content, occurred_at) VALUES ($1, 're_enquiry', $2, now())`,
    [existingId, `Re-enquired via ${source} on ${new Date().toISOString().slice(0, 10)}`]
  );
}

async function insertDuplicateLog(
  client: PoolClient,
  existingLeadId: string,
  batchId: string,
  source: CrmSource,
  matchedOn: DbMatchKind,
  incomingRaw: RawRow
): Promise<void> {
  await client.query(
    `INSERT INTO lead_duplicates (existing_lead_id, batch_id, incoming_source, matched_on, incoming_payload)
     VALUES ($1,$2,$3,$4,$5)`,
    [existingLeadId, batchId, source, matchedOn, JSON.stringify(incomingRaw)]
  );
}

async function processImport(params: CommitParams, source: CrmSource, fileBuffer: Buffer): Promise<void> {
  const overrideClient = await pool.connect();
  let persistedOverrides: Record<string, string>;
  try {
    persistedOverrides = source === 'personal' ? {} : await loadOverrides(overrideClient, source);
  } finally {
    overrideClient.release();
  }

  const mergedOverrides = { ...persistedOverrides, ...params.mappingOverrides };
  // Sanity gate already ran (and was accepted or bypassed) at preview time.
  const parseResult: ParseFileResult = parseFile(fileBuffer, source, mergedOverrides, { bypassSanityGate: true });

  if (source !== 'personal' && Object.keys(params.mappingOverrides).length > 0) {
    const saveClient = await pool.connect();
    try {
      await saveOverrides(saveClient, source, params.mappingOverrides, params.userId);
    } finally {
      saveClient.release();
    }
  }

  // Compute "new columns" BEFORE the registry upsert below marks them known.
  let newColumns: string[] = [];
  let firstGoodRawRow: RawRow | null = null;
  const registryClient = await pool.connect();
  try {
    if (source !== 'personal') {
      newColumns = await findNewHeaders(registryClient, source, parseResult.mapping);
    }
  } finally {
    registryClient.release();
  }

  const okRows = parseResult.rows.filter((r) => r.error === null).map((r) => ({ rowNumber: r.rowNumber, lead: r.lead }));
  const dedupe = dedupeWithinFile(okRows, source);
  const inFileDupRowNumbers = new Set(dedupe.duplicates.map((d) => d.rowNumber));

  const errorRows: { rowNumber: number; reason: string; raw: RawRow }[] = parseResult.rows
    .filter((r) => r.error !== null)
    .map((r) => ({ rowNumber: r.rowNumber, reason: r.error!, raw: r.raw }));

  const importableRows = parseResult.rows.filter((r) => r.error === null && !inFileDupRowNumbers.has(r.rowNumber));

  let rowsImported = 0;
  let dupPhone = 0;
  let dupEmail = 0;
  let dupSrcProp = 0;
  const dupInFile = inFileDupRowNumbers.size;
  const warningCounts = new Map<string, number>();

  for (let i = 0; i < importableRows.length; i += CHUNK_SIZE) {
    const chunk = importableRows.slice(i, i + CHUNK_SIZE);
    for (const row of chunk) {
      if (!firstGoodRawRow) firstGoodRawRow = row.raw;
      for (const w of row.lead.warnings) {
        warningCounts.set(w.code, (warningCounts.get(w.code) ?? 0) + 1);
      }
    }

    await withTransaction(async (client) => {
      // Two bulk lookups for the whole chunk instead of up to 5 round trips
      // per row — this is what keeps a multi-thousand-row import from
      // taking tens of minutes on Neon's per-query network latency.
      const agentNames = chunk.map((r) => r.lead.agentNameRaw).filter((n): n is string => !!n);
      const agentMap = await resolveAgentsBatch(client, agentNames, params.autoCreateAgents);
      const matchMap = await findExistingMatchesBatch(client, chunk, source);

      for (const row of chunk) {
        let agentId: string | null;
        if (row.lead.agentNameRaw) {
          const normalized = row.lead.agentNameRaw.trim().toLowerCase().replace(/\s+/g, ' ');
          agentId = agentMap.get(normalized) ?? params.defaultAgentId;
          if (!agentMap.has(normalized)) {
            warningCounts.set('AGENT_NOT_FOUND', (warningCounts.get('AGENT_NOT_FOUND') ?? 0) + 1);
          }
        } else {
          agentId = params.defaultAgentId;
        }

        const match = matchMap.get(row.rowNumber);
        if (match) {
          if (match.matchedOn === 'phone') dupPhone++;
          else if (match.matchedOn === 'email') dupEmail++;
          else dupSrcProp++;

          if (params.duplicatePolicy === 'skip') {
            await insertDuplicateLog(client, match.id, params.batchId, source, match.matchedOn, row.raw);
          } else if (params.duplicatePolicy === 'enrich') {
            await enrichExistingLead(client, match.id, row.lead, source);
            await insertDuplicateLog(client, match.id, params.batchId, source, match.matchedOn, row.raw);
          } else {
            await insertLead(client, row.lead, source, params.batchId, agentId, true, match.id);
            await insertDuplicateLog(client, match.id, params.batchId, source, match.matchedOn, row.raw);
            rowsImported++;
          }
        } else {
          await insertLead(client, row.lead, source, params.batchId, agentId, false, null);
          rowsImported++;
        }
      }
    });

    await pool.query(
      `UPDATE lead_import_batches SET rows_imported = $2, rows_duplicate = $3, rows_error = $4 WHERE id = $1`,
      [params.batchId, rowsImported, dupPhone + dupEmail + dupSrcProp + dupInFile, errorRows.length]
    );
  }

  const finalClient = await pool.connect();
  try {
    if (source !== 'personal' && firstGoodRawRow) {
      await upsertColumnRegistry(finalClient, source, parseResult.mapping, firstGoodRawRow);
    }
  } finally {
    finalClient.release();
  }

  const totalDup = dupPhone + dupEmail + dupSrcProp + dupInFile;
  const warningsPayload = {
    duplicateBreakdown: { phone: dupPhone, email: dupEmail, source_property_name: dupSrcProp, in_file: dupInFile },
    fieldWarnings: Array.from(warningCounts.entries()).map(([code, count]) => ({ code, count })),
    // Flags likely column-mapping problems (e.g. the wrong column mapped to
    // phone/email) rather than genuine repeat enquiries.
    highDuplicateRate: parseResult.rows.length > 0 && totalDup / parseResult.rows.length > 0.4,
  };

  await pool.query(
    `UPDATE lead_import_batches SET
       status = 'completed',
       completed_at = now(),
       rows_imported = $2,
       rows_duplicate = $3,
       rows_error = $4,
       warnings = $5,
       errors = $6,
       new_columns = $7,
       applied_mapping = $8
     WHERE id = $1`,
    [
      params.batchId,
      rowsImported,
      totalDup,
      errorRows.length,
      JSON.stringify(warningsPayload),
      JSON.stringify(errorRows),
      JSON.stringify(newColumns),
      JSON.stringify(parseResult.mapping),
    ]
  );
}

export async function commitImport(params: CommitParams): Promise<{ batchId: string; status: 'processing' | 'completed' }> {
  const { rows } = await pool.query<DbBatchRow>('SELECT * FROM lead_import_batches WHERE id = $1', [params.batchId]);
  const batch = rows[0];
  if (!batch) throw new BatchNotFoundError();
  if (batch.status === 'completed') return { batchId: params.batchId, status: 'completed' };

  const fileBuffer = await readStoredFile(params.batchId, batch.file_name);
  await pool.query(`UPDATE lead_import_batches SET status = 'processing' WHERE id = $1`, [params.batchId]);

  const run = async () => {
    try {
      await processImport(params, batch.source, fileBuffer);
    } catch (err) {
      console.error('[import] processing failed', params.batchId, err);
      await pool.query(`UPDATE lead_import_batches SET status = 'failed' WHERE id = $1`, [params.batchId]).catch(() => {});
    } finally {
      await deleteStoredFile(params.batchId).catch(() => {});
    }
  };

  if (batch.rows_read > BACKGROUND_THRESHOLD) {
    void run();
    return { batchId: params.batchId, status: 'processing' };
  }

  await run();
  return { batchId: params.batchId, status: 'completed' };
}
