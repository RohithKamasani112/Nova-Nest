import * as XLSX from 'xlsx';
import { CellValue, ParsedSheet } from '../types/crm';
import { dedupeHeaders, zipRow } from './rowUtils';

/**
 * Handles both legacy OLE2/CFBF .xls (BIFF8) and modern ZIP .xlsx — SheetJS
 * auto-detects the container format from the buffer itself once we've
 * already confirmed via magic bytes that it's one of the two.
 */
export function parseXls(buffer: Buffer): ParsedSheet {
  const workbook = XLSX.read(buffer, { type: 'buffer', raw: true, cellDates: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { headers: [], rows: [] };
  const sheet = workbook.Sheets[sheetName];

  const aoa = XLSX.utils.sheet_to_json<CellValue[]>(sheet, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: false,
  });
  if (aoa.length === 0) return { headers: [], rows: [] };

  const rawHeaders = aoa[0].map((h) => (h === null || h === undefined ? '' : String(h).trim()));
  const headers = dedupeHeaders(rawHeaders);
  const rows = aoa.slice(1).map((rowArr) => zipRow(headers, rowArr));
  return { headers, rows };
}
