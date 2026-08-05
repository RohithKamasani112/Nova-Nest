/**
 * Format detection (spec §1). Detects from magic bytes / content, never
 * from the filename/extension — the whole point is that a MagicBricks
 * ".csv" export is actually a legacy binary .xls file.
 */
import { stripBom } from '../lib/textUtils';

export class UnrecognizedFileError extends Error {
  constructor(public readonly detectedHeaders: string[] = []) {
    super('Could not read this file. Please upload the original export from the portal (.xls, .xlsx or .csv).');
    this.name = 'UnrecognizedFileError';
  }
}

export type DetectedFormat = 'xls' | 'xlsx' | 'csv' | 'tsv';

export interface FormatDetection {
  format: DetectedFormat;
  /** Only set when format is csv/tsv. */
  delimiter?: string;
}

const XLS_MAGIC = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
const XLSX_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
const DELIMITER_CANDIDATES = ['\t', ',', ';', '|'] as const;
const DELIMITER_LABEL: Record<string, DetectedFormat> = {
  '\t': 'tsv',
  ',': 'csv',
  ';': 'csv',
  '|': 'csv',
};

function sampleNonEmptyLines(text: string, max = 5): string[] {
  return text
    .split(/\r\n|\n/)
    .map((l) => l)
    .filter((l) => l.trim().length > 0)
    .slice(0, max);
}

function sniffDelimiter(sampleLines: string[]): string | null {
  if (sampleLines.length === 0) return null;
  let best: { delim: string; score: number } | null = null;

  for (const delim of DELIMITER_CANDIDATES) {
    const counts = sampleLines.map((line) => line.split(delim).length - 1);
    const first = counts[0];
    if (first === 0) continue; // must appear in the header line at all
    const consistent = counts.every((c) => c === first);
    // Heavily prefer a delimiter whose count is identical across every
    // sampled line (a real column separator) over one that merely shows up
    // somewhere in the first line (e.g. a comma inside free text).
    const score = (consistent ? 1_000_000 : 1) * first;
    if (!best || score > best.score) {
      best = { delim, score };
    }
  }
  return best?.delim ?? null;
}

export function detectFormat(buffer: Buffer): FormatDetection {
  const head = buffer.subarray(0, 8);

  if (head.subarray(0, 8).equals(XLS_MAGIC)) {
    return { format: 'xls' };
  }
  if (head.subarray(0, 4).equals(XLSX_MAGIC)) {
    return { format: 'xlsx' };
  }

  const textBuffer = stripBom(buffer);
  const text = textBuffer.toString('utf8');
  const sampleLines = sampleNonEmptyLines(text);
  const delimiter = sniffDelimiter(sampleLines);

  if (!delimiter) {
    throw new UnrecognizedFileError(sampleLines.slice(0, 1));
  }

  const headerColumnCount = sampleLines[0].split(delimiter).length;
  if (headerColumnCount < 2) {
    throw new UnrecognizedFileError(sampleLines[0].split(delimiter));
  }

  return { format: DELIMITER_LABEL[delimiter], delimiter };
}
