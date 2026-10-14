import { CrmSource, MappedLead, RawRow, RowWarning } from '../types/crm';
import { GENERIC_MAP, SOURCE_MAPS } from '../lib/sourceMaps';
import {
  AliasIndex,
  buildAliasIndex,
  exactMatch,
  fuzzyMatch,
  MatchMethod,
  normalizeHeaderDisplay,
  normalizeHeaderKey,
  substringMatch,
} from '../lib/headerNormalize';
import { cleanCell, collapseWhitespace } from '../lib/textUtils';
import {
  normalizeConfiguration,
  normalizeDate,
  normalizeEmail,
  normalizeListingType,
  normalizeName,
  normalizeNameKey,
  normalizePhone,
  normalizePrice,
} from '../lib/valueNormalize';

export interface FieldMapping {
  header: string;
  headerNormalized: string;
  canonicalField: string | null;
  method?: MatchMethod;
  distance?: number;
}

const aliasIndexCache = new Map<string, AliasIndex>();

// 'generic' isn't a real CrmSource — it's the cache key for GENERIC_MAP,
// used for 'personal'/'website' (see resolveMapping below), which don't have
// a portal-specific SOURCE_MAPS entry to key a real source off of.
function getAliasIndex(source: Exclude<CrmSource, 'personal' | 'website'> | 'generic'): AliasIndex {
  let index = aliasIndexCache.get(source);
  if (!index) {
    index = buildAliasIndex(source === 'generic' ? GENERIC_MAP : SOURCE_MAPS[source]);
    aliasIndexCache.set(source, index);
  }
  return index;
}

/**
 * `overrides` maps a normalized header key -> canonicalField, sourced from
 * source_mapping_overrides (spec §3, "mapping preview is mandatory... overrides
 * are saved per-source and reused as the default next time") for a real
 * portal source, or from this upload's own in-session column-mapping choices
 * for personal/website (see importService.ts — those two never persist
 * overrides as future defaults, since every personal spreadsheet is a one-off
 * with no reason to expect the same layout next time).
 *
 * personal/website still get real auto-mapping now (GENERIC_MAP, plain
 * English column names like "Name"/"Phone"/"Email") rather than leaving
 * every column unmapped — that used to mean an easy trap: importing without
 * first mapping Name by hand silently produced an all-error batch. This
 * doesn't remove that manual step for anything GENERIC_MAP doesn't
 * recognize, it just catches the common case.
 */
export function resolveMapping(
  headers: string[],
  source: CrmSource,
  overrides: Record<string, string> = {}
): FieldMapping[] {
  const index = getAliasIndex(source === 'personal' || source === 'website' ? 'generic' : source);
  const claimed = new Set<string>();
  const results: FieldMapping[] = new Array(headers.length);

  // Pass 1: explicit overrides, then exact alias matches. A field claimed
  // here can never be taken away by a looser match in pass 2.
  headers.forEach((header, i) => {
    const headerNormalized = normalizeHeaderDisplay(header);
    const key = normalizeHeaderKey(header);
    const overrideField = overrides[key];
    if (overrideField) {
      results[i] = { header, headerNormalized, canonicalField: overrideField };
      claimed.add(overrideField);
      return;
    }
    const match = exactMatch(key, index);
    if (match && !claimed.has(match.canonicalField)) {
      results[i] = { header, headerNormalized, canonicalField: match.canonicalField, method: 'exact' };
      claimed.add(match.canonicalField);
    }
  });

  // Pass 2: substring, then Levenshtein <= 2, for whatever's left — skipping
  // any canonical field already claimed in pass 1 or by an earlier header
  // in this pass (first, more-exact match always wins).
  headers.forEach((header, i) => {
    if (results[i]) return;
    const headerNormalized = normalizeHeaderDisplay(header);
    const key = normalizeHeaderKey(header);
    const match = substringMatch(key, index, claimed) ?? fuzzyMatch(key, index, claimed);
    if (match) {
      results[i] = {
        header,
        headerNormalized,
        canonicalField: match.canonicalField,
        method: match.method,
        distance: match.distance,
      };
      claimed.add(match.canonicalField);
    } else {
      results[i] = { header, headerNormalized, canonicalField: null };
    }
  });

  return results;
}

/** Sanity gate (spec §3): stop if fewer than N canonical fields resolved. */
export function countResolvedFields(mapping: FieldMapping[]): number {
  return new Set(mapping.filter((m) => m.canonicalField).map((m) => m.canonicalField)).size;
}

const SIMPLE_STRING_FIELDS = [
  'projectName',
  'propertyType',
  'propertyDescription',
  'locality',
  'city',
  'state',
  'address',
  'message',
  'leadType',
  'sourceStatus',
  'externalPropertyId',
] as const;

const CANONICAL_TO_MAPPED: Record<string, keyof MappedLead | undefined> = {
  name: 'name',
  phone_raw: undefined, // handled specially (normalizePhone)
  email: undefined,
  lead_date: undefined,
  listing_type: undefined,
  property_type: 'propertyType',
  configuration: undefined,
  price_raw: undefined,
  locality: 'locality',
  city: 'city',
  state: 'state',
  project_name: 'projectName',
  external_property_id: 'externalPropertyId',
  address: 'address',
  source_status: 'sourceStatus',
  notes: undefined, // folded into message-ish notes on the lead; handled below
  property_description: 'propertyDescription',
  lead_type: 'leadType',
  message: 'message',
  agent_name: undefined,
};

function emptyMappedLead(): MappedLead {
  return {
    name: null,
    nameNormalized: null,
    phone: null,
    phoneRaw: null,
    email: null,
    leadDate: null,
    externalPropertyId: null,
    projectName: null,
    propertyType: null,
    propertyDescription: null,
    listingType: null,
    configuration: null,
    bedrooms: null,
    priceRaw: null,
    priceValue: null,
    city: null,
    locality: null,
    state: null,
    address: null,
    message: null,
    leadType: null,
    sourceStatus: null,
    agentNameRaw: null,
    rawData: {},
    warnings: [],
  };
}

function warn(warnings: RowWarning[], code: string, message: string, field?: string) {
  warnings.push({ code, field, message });
}

/**
 * MagicBricks-only fallback (spec §2.2): when the dedicated columns are
 * empty, derive configuration/listing_type/property_type from Brief Desc.
 */
function applyMagicBricksDescriptionFallback(lead: MappedLead, warnings: RowWarning[]) {
  const desc = lead.propertyDescription;
  if (!desc) return;

  if (!lead.configuration) {
    const m = desc.match(/^(\d+\s*BHK)/i);
    if (m) {
      const { configuration, bedrooms } = normalizeConfiguration(m[1]);
      lead.configuration = configuration;
      lead.bedrooms = bedrooms;
    }
  }

  if (!lead.listingType) {
    const m = desc.match(/for\s+(rent|sale|resale)/i);
    if (m) {
      const { listingType } = normalizeListingType(m[1]);
      lead.listingType = listingType;
    }
  }

  if (!lead.propertyType) {
    const beforeComma = desc.split(',')[0]?.trim();
    if (beforeComma) lead.propertyType = beforeComma;
  }
}

export function mapRow(
  row: RawRow,
  mapping: FieldMapping[],
  source: CrmSource
): MappedLead {
  const lead = emptyMappedLead();

  for (const { header, canonicalField } of mapping) {
    const cellValue = row[header];

    if (!canonicalField) {
      lead.rawData[header] = cleanCell(cellValue);
      continue;
    }

    switch (canonicalField) {
      case 'name':
        lead.name = normalizeName(cellValue);
        break;
      case 'phone_raw': {
        const r = normalizePhone(cellValue);
        lead.phone = r.phone;
        lead.phoneRaw = r.phoneRaw;
        if (r.warning) warn(lead.warnings, r.warning, 'Phone number could not be normalized to a valid 10-digit mobile.', 'phone');
        break;
      }
      case 'email': {
        const r = normalizeEmail(cellValue);
        lead.email = r.email;
        if (r.warning) {
          warn(lead.warnings, r.warning, 'Email address failed validation.', 'email');
          lead.rawData.__unparsed = { ...(lead.rawData.__unparsed as object), email: r.invalidRaw };
        }
        break;
      }
      case 'lead_date': {
        const r = normalizeDate(cellValue, source as Exclude<CrmSource, 'personal' | 'website'>);
        lead.leadDate = r.leadDate;
        if (r.warning) {
          warn(lead.warnings, r.warning, `Lead date "${r.raw}" did not match any known format for this source.`, 'lead_date');
          lead.rawData.__unparsed = { ...(lead.rawData.__unparsed as object), lead_date: r.raw };
        }
        break;
      }
      case 'listing_type': {
        const r = normalizeListingType(cellValue);
        lead.listingType = r.listingType;
        if (r.rawUnmapped) {
          lead.rawData.__unparsed = { ...(lead.rawData.__unparsed as object), listing_type: r.rawUnmapped };
        }
        break;
      }
      case 'configuration': {
        const r = normalizeConfiguration(cellValue);
        lead.configuration = r.configuration;
        lead.bedrooms = r.bedrooms;
        break;
      }
      case 'price_raw': {
        const r = normalizePrice(cellValue);
        lead.priceValue = r.priceValue;
        lead.priceRaw = r.priceRaw;
        if (r.warning) {
          warn(lead.warnings, r.warning, `Price "${r.priceRaw}" could not be parsed to a number.`, 'price');
        }
        break;
      }
      case 'notes': {
        const cleaned = cleanCell(cellValue);
        if (cleaned) lead.rawData.notes = cleaned;
        break;
      }
      case 'agent_name':
        lead.agentNameRaw = cleanCell(cellValue) ? collapseWhitespace(String(cellValue)) : null;
        break;
      default: {
        const mappedKey = CANONICAL_TO_MAPPED[canonicalField];
        if (mappedKey && SIMPLE_STRING_FIELDS.includes(mappedKey as (typeof SIMPLE_STRING_FIELDS)[number])) {
          (lead as any)[mappedKey] = cleanCell(cellValue);
        }
        break;
      }
    }
  }

  if (source === 'magicbricks') {
    applyMagicBricksDescriptionFallback(lead, lead.warnings);
  }

  if (lead.name) {
    lead.nameNormalized = normalizeNameKey(lead.name);
  }

  return lead;
}

/** Two hard per-row requirements (spec §3): non-empty name + (phone or email). */
export function validateRow(lead: MappedLead): string | null {
  if (!lead.name) return 'MISSING_NAME';
  if (!lead.phone && !lead.email) return 'MISSING_CONTACT';
  return null;
}
