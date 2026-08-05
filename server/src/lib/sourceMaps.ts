/**
 * Per-source canonicalField -> aliases[] registry (spec §2, §3.3).
 * Adding a new alias for a header the portal renames is a one-line change
 * here — no schema migration, no code elsewhere needs to change.
 *
 * Columns marked "-> raw_data" / "ignore" in the spec (Seller Id, Sr. No.,
 * Response From, Product Type, ...) are deliberately NOT listed as aliases
 * of anything: with no alias to match, they fall through to raw_data
 * automatically, which is exactly the desired behavior, while still being
 * recorded in source_column_registry.
 */

export type CrmSource = 'housing' | 'magicbricks' | '99acres' | 'personal';

// Every alias list across all sources should also accept these agent-column
// aliases (spec §2.4) — merged into each source map below.
export const AGENT_ALIASES = [
  'agent',
  'agent name',
  'assigned to',
  'assigned agent',
  'handled by',
  'owner',
  'executive',
  'sales agent',
];

export const HOUSING_MAP: Record<string, string[]> = {
  name: ['lead name'],
  phone_raw: ['lead phone number'],
  email: ['lead email'],
  lead_date: ['lead date'],
  listing_type: ['service type'],
  property_type: ['property type'],
  configuration: ['configuration'],
  price_raw: ['price'],
  locality: ['locality'],
  city: ['city'],
  project_name: ['building/project name', 'building project name'],
  external_property_id: ['property/project id', 'property project id'],
  address: ['address'],
  source_status: ['primary_lead_status', 'primary lead status'],
  notes: ['notes'],
  agent_name: AGENT_ALIASES,
};

export const MAGICBRICKS_MAP: Record<string, string[]> = {
  name: ['name'],
  phone_raw: ['mobile'],
  email: ['email'],
  lead_date: ['message date'],
  external_property_id: ['property id'],
  property_description: ['brief desc'],
  locality: ['locality'],
  city: ['city'],
  state: ['state'],
  project_name: ['project name'],
  lead_type: ['type of lead'],
  message: ['message details'],
  source_status: ['status'],
  price_raw: ['budget'],
  agent_name: AGENT_ALIASES,
};

export const ACRES99_MAP: Record<string, string[]> = {
  name: ['name'],
  phone_raw: ['phone no.', 'phone no'],
  email: ['email'],
  lead_date: ['date'],
  external_property_id: ['listing id'],
  listing_type: ['business segment'],
  property_type: ['property type'],
  price_raw: ['price of property'],
  city: ['city'],
  locality: ['locality'],
  configuration: ['bhk'],
  project_name: ['project'],
  agent_name: AGENT_ALIASES,
};

export const SOURCE_MAPS: Record<Exclude<CrmSource, 'personal'>, Record<string, string[]>> = {
  housing: HOUSING_MAP,
  magicbricks: MAGICBRICKS_MAP,
  '99acres': ACRES99_MAP,
};

/** Fields required for the §3 "sanity gate" (>=2 must resolve or reject). */
export const SANITY_GATE_MIN_FIELDS = 2;

/** Two hard per-row requirements (spec §3): non-empty name + (phone or email). */
export const REQUIRED_CANONICAL_FIELDS = ['name'] as const;
