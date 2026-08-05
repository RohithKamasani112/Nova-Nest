import { CrmSource, MappedLead, ParsedSheet, RawRow } from '../types/crm';
import { detectFormat, DetectedFormat } from './formatDetect';
import { parseXls } from './xlsParser';
import { parseText } from './textParser';
import { countResolvedFields, FieldMapping, mapRow, resolveMapping, validateRow } from './rowMapper';
import { SANITY_GATE_MIN_FIELDS } from '../lib/sourceMaps';

export class SanityGateError extends Error {
  constructor(
    public readonly source: CrmSource,
    public readonly resolvedCount: number,
    public readonly headers: string[]
  ) {
    super(
      `This file doesn't look like a ${source} export — only ${resolvedCount} column${resolvedCount === 1 ? '' : 's'} recognised.`
    );
    this.name = 'SanityGateError';
  }
}

export interface ParsedRow {
  rowNumber: number;
  raw: RawRow;
  lead: MappedLead;
  /** null = row is importable; otherwise MISSING_NAME | MISSING_CONTACT */
  error: string | null;
}

export interface ParseFileResult {
  format: DetectedFormat;
  headers: string[];
  mapping: FieldMapping[];
  rows: ParsedRow[];
}

/**
 * Full spec §1-§3 pipeline: detect format -> parse into (header, row)
 * pairs -> resolve each header to a canonical field -> normalize each row.
 * Sanity-gates before returning so callers never build a preview/commit off
 * a file that clearly isn't the source it claims to be.
 */
export function parseFile(
  buffer: Buffer,
  source: CrmSource,
  headerOverrides: Record<string, string> = {},
  options: { bypassSanityGate?: boolean } = {}
): ParseFileResult {
  const detection = detectFormat(buffer);

  const sheet: ParsedSheet =
    detection.format === 'xls' || detection.format === 'xlsx'
      ? parseXls(buffer)
      : parseText(buffer, detection.delimiter!);

  const mapping = resolveMapping(sheet.headers, source, headerOverrides);

  if (source !== 'personal' && !options.bypassSanityGate) {
    const resolvedCount = countResolvedFields(mapping);
    if (resolvedCount < SANITY_GATE_MIN_FIELDS) {
      throw new SanityGateError(source, resolvedCount, sheet.headers);
    }
  }

  const rows: ParsedRow[] = sheet.rows.map((raw, idx) => {
    const rowNumber = idx + 2; // header occupies row 1
    let lead: MappedLead;
    let error: string | null;
    try {
      lead = mapRow(raw, mapping, source);
      error = validateRow(lead);
    } catch (err) {
      // Row-level isolation (spec §3): one malformed row can never abort
      // the batch — it just becomes an error row with the raw content kept.
      lead = mapRow({}, mapping, source);
      error = `PARSE_ERROR: ${err instanceof Error ? err.message : String(err)}`;
    }
    return { rowNumber, raw, lead, error };
  });

  return { format: detection.format, headers: sheet.headers, mapping, rows };
}
