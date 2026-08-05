import { CellValue, RawRow } from '../types/crm';

/** Keeps duplicate header text from colliding in the row dict/registry. */
export function dedupeHeaders(headers: string[]): string[] {
  const seen = new Map<string, number>();
  return headers.map((h, idx) => {
    const base = h && h.length > 0 ? h : `Column ${idx + 1}`;
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base} (${count})`;
  });
}

export function zipRow(headers: string[], values: CellValue[]): RawRow {
  const row: RawRow = {};
  headers.forEach((h, idx) => {
    const v = values[idx];
    row[h] = v === undefined ? null : v;
  });
  return row;
}
