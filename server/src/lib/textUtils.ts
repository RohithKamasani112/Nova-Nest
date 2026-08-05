const NULL_LIKE = new Set([
  '', '-', '--', '---', 'na', 'n/a', 'null', '#n/a', 'not available', 'not provided',
]);

export function isNullLike(value: string | null | undefined): boolean {
  if (value === null || value === undefined) return true;
  return NULL_LIKE.has(value.trim().toLowerCase());
}

/** Trims a cell and maps portal placeholder values ("-", "NA", ...) to null. */
export function cleanCell(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  if (isNullLike(str)) return null;
  return str;
}

export function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);

export function stripBom(buffer: Buffer): Buffer {
  return buffer.subarray(0, 3).equals(UTF8_BOM) ? buffer.subarray(3) : buffer;
}
