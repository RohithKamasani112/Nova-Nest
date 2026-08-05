import { getJsonFromS3, listS3Files, uploadJsonToS3 } from '../utils/s3Helper';

// "Recent shares" history for the Share Properties feature — same S3 bucket
// properties themselves already live in (getAllProperties/createProperty in
// storageService.ts), not a separate database. One JSON file per share in
// its own folder, filename-prefixed with a sortable ISO timestamp so
// "most recent 20" is just a key sort, no need to fetch every file's
// contents just to order them.
const FOLDER = 'property-shares';

export interface PropertyShareConfig {
  layout: 'portrait' | 'landscape';
  groupByBhk: boolean;
  showPrices: boolean;
  customMessage?: string;
}

export interface PropertyShareRecord {
  id: string;
  clientName?: string;
  clientPhone?: string;
  propertyIds: string[]; // tray order at the time of sending
  config: PropertyShareConfig;
  pdfFilename: string;
  leadId?: string; // set when shared from a CRM lead's drawer
  createdAt: string; // ISO
}

function safeKeyTimestamp(iso: string): string {
  return iso.replace(/[:.]/g, '-');
}

export async function recordPropertyShare(input: Omit<PropertyShareRecord, 'id' | 'createdAt'>): Promise<PropertyShareRecord> {
  const createdAt = new Date().toISOString();
  const id = crypto.randomUUID();
  const record: PropertyShareRecord = { ...input, id, createdAt };
  await uploadJsonToS3(record, `${FOLDER}/${safeKeyTimestamp(createdAt)}_${id}.json`);
  return record;
}

export async function getRecentPropertyShares(limit = 20): Promise<PropertyShareRecord[]> {
  const keys = await listS3Files(`${FOLDER}/`);
  // ISO-timestamp-prefixed filenames sort lexicographically = chronologically.
  const recentKeys = keys
    .filter((k) => k.endsWith('.json'))
    .sort()
    .reverse()
    .slice(0, limit);
  const records = await Promise.all(
    recentKeys.map((key) =>
      getJsonFromS3<PropertyShareRecord>(key).catch(() => null)
    )
  );
  return records.filter((r): r is PropertyShareRecord => r !== null);
}
