import Papa from 'papaparse';
import { ParsedSheet } from '../types/crm';
import { stripBom } from '../lib/textUtils';
import { dedupeHeaders, zipRow } from './rowUtils';

/**
 * Parses CSV/TSV/pipe/semicolon-delimited text using a delimiter already
 * decided by formatDetect's sniff (spec §1) — papaparse only handles the
 * quote-aware row splitting for that delimiter, it doesn't get to guess.
 */
export function parseText(buffer: Buffer, delimiter: string): ParsedSheet {
  const text = stripBom(buffer).toString('utf8');
  const result = Papa.parse<string[]>(text, {
    delimiter,
    header: false,
    skipEmptyLines: true,
  });

  const aoa = result.data;
  if (aoa.length === 0) return { headers: [], rows: [] };

  const headers = dedupeHeaders(aoa[0].map((h) => (h ?? '').trim()));
  const rows = aoa.slice(1).map((r) => zipRow(headers, r));
  return { headers, rows };
}
