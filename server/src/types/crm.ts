export type CellValue = string | number | null;
export type RawRow = Record<string, CellValue>;

export interface ParsedSheet {
  headers: string[];
  rows: RawRow[];
}

export type CrmSource = 'housing' | 'magicbricks' | '99acres' | 'personal';

export interface RowWarning {
  code: string;
  field?: string;
  message: string;
}

export interface RowError {
  rowNumber: number;
  reason: string;
  raw: RawRow;
}

/** Canonical, normalized fields resolved from one source row, pre-DB-write. */
export interface MappedLead {
  name: string | null;
  nameNormalized: string | null;
  phone: string | null;
  phoneRaw: string | null;
  email: string | null;
  leadDate: Date | null;
  externalPropertyId: string | null;
  projectName: string | null;
  propertyType: string | null;
  propertyDescription: string | null;
  listingType: string | null;
  configuration: string | null;
  bedrooms: number | null;
  priceRaw: string | null;
  priceValue: number | null;
  city: string | null;
  locality: string | null;
  state: string | null;
  address: string | null;
  message: string | null;
  leadType: string | null;
  sourceStatus: string | null;
  agentNameRaw: string | null;
  rawData: Record<string, unknown>;
  warnings: RowWarning[];
}
