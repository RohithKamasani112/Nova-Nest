export type CrmSource = 'housing' | 'magicbricks' | '99acres' | 'personal';

export interface CrmAgent {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AgentStats extends CrmAgent {
  total_leads: number;
  converted: number;
  conversion_rate: number;
  overdue_follow_ups: number;
}

export interface FieldMappingEntry {
  header: string;
  headerKey: string;
  canonicalField: string | null;
  method?: 'exact' | 'substring' | 'fuzzy';
}

export interface CrmSampleRow {
  name: string | null;
  phone: string | null;
  phoneRaw: string | null;
  email: string | null;
  leadDate: string | null;
  listingType: string | null;
  configuration: string | null;
  priceValue: number | null;
  priceRaw: string | null;
  agentNameRaw: string | null;
  error: string | null;
  warnings: { code: string; field?: string; message: string }[];
}

export interface ImportPreviewResult {
  batchId: string;
  format: 'xls' | 'xlsx' | 'csv' | 'tsv';
  headers: string[];
  mapping: FieldMappingEntry[];
  unmapped: string[];
  newColumns: string[];
  sampleRows: CrmSampleRow[];
  rowsRead: number;
  duplicateFileWarning?: { batchId: string; importedAt: string; fileName: string } | null;
}

export type DuplicatePolicy = 'skip' | 'enrich' | 'create_anyway';

export interface ImportBatchSummary {
  batchId: string;
  status: string;
  source: CrmSource;
  fileName: string;
  rowsRead: number;
  rowsImported: number;
  rowsDuplicate: number;
  rowsError: number;
  duplicateBreakdown: { phone: number; email: number; source_property_name: number; in_file: number };
  fieldWarnings: { code: string; count: number }[];
  highDuplicateRate: boolean;
  newColumns: string[];
  createdAt: string;
  completedAt: string | null;
}

export interface CommitImportParams {
  batchId: string;
  mapping: Record<string, string>;
  defaultAgentId: string | null;
  duplicatePolicy: DuplicatePolicy;
  autoCreateAgents: boolean;
}

export interface LeadListItem {
  id: string;
  source: CrmSource;
  name: string;
  phone: string | null;
  email: string | null;
  project_name: string | null;
  locality: string | null;
  city: string | null;
  property_type: string | null;
  listing_type: string | null;
  configuration: string | null;
  price_value: string | null;
  agent_id: string | null;
  agent_name: string | null;
  status: string;
  lead_date: string | null;
  next_follow_up_at: string | null;
  last_activity_at: string | null;
  last_activity_type: string | null;
  other_interest_count: number;
  updated_at: string;
}

export interface LeadInterest {
  source: CrmSource;
  createdAt: string;
  projectName: string | null;
}

export interface LeadFiltersState {
  source?: string[];
  agentId?: string[];
  status?: string[];
  city?: string[];
  locality?: string[];
  project?: string[];
  listingType?: string[];
  bhk?: number[];
  priceMin?: number;
  priceMax?: number;
  leadType?: string;
  search?: string;
  dateField?: 'lead_date' | 'created_at';
  dateFrom?: string;
  dateTo?: string;
  followUp?: 'due_today' | 'overdue' | 'this_week' | 'none';
  hasPhone?: boolean;
  hasEmail?: boolean;
  isDuplicate?: boolean;
  multiPortal?: boolean;
  neverContacted?: boolean;
  contacted?: boolean;
  noFollowUpSet?: boolean;
  batchId?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface LeadDetail {
  id: string;
  source: CrmSource;
  name: string;
  phone: string | null;
  phone_raw: string | null;
  alt_phone: string | null;
  email: string | null;
  lead_date: string | null;
  external_property_id: string | null;
  project_name: string | null;
  property_type: string | null;
  property_description: string | null;
  listing_type: string | null;
  configuration: string | null;
  bedrooms: number | null;
  price_raw: string | null;
  price_value: string | null;
  city: string | null;
  locality: string | null;
  state: string | null;
  address: string | null;
  message: string | null;
  lead_type: string | null;
  source_status: string | null;
  agent_id: string | null;
  agent_name: string | null;
  status: string;
  sub_status: string | null;
  notes: string | null;
  next_follow_up_at: string | null;
  first_contacted_at: string | null;
  converted_at: string | null;
  closed_at: string | null;
  lost_reason: string | null;
  deal_value: string | null;
  enquiry_count: number;
  is_duplicate: boolean;
  raw_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CrossPortalEnquiry {
  incoming_source: CrmSource;
  matched_on: string;
  created_at: string;
  incoming_payload: Record<string, unknown>;
}

export interface LeadActivity {
  id: string;
  type: string;
  from_status: string | null;
  to_status: string | null;
  content: string | null;
  occurred_at: string;
  created_by: string | null;
}

export interface ChipCounts {
  needsContact: number;
  contacted: number;
  dueToday: number;
  overdue: number;
  noFollowUpSet: number;
  unassigned: number;
  converted: number;
  lost: number;
}

export interface TodaysCallsResponse {
  overdue: LeadListItem[];
  dueToday: LeadListItem[];
}

export interface FilterOptionCount {
  value: string;
  count: number;
}

export interface FilterOptions {
  sources: CrmSource[];
  statuses: { value: string; label: string; count: number }[];
  agents: { id: string; name: string; count: number }[];
  cities: FilterOptionCount[];
  localities: FilterOptionCount[];
  projects: FilterOptionCount[];
  propertyTypes: FilterOptionCount[];
  bhk: string[];
  listingTypes: string[];
}

export interface KpiScorecards {
  totalLeads: number;
  newLeads: number;
  contacted: number;
  siteVisitsDone: number;
  converted: number;
  conversionRate: number;
  closedLost: number;
  lossRate: number;
  junk: number;
  duplicatesBlocked: number;
  totalDealValue: number;
  avgResponseHours: number | null;
}

export interface KpiResponse {
  scorecards: {
    current: KpiScorecards;
    deltas: Record<string, number | null>;
    followUps: { pending: number; overdue: number };
  };
  bySource: { source: CrmSource; total: number; converted: number; conversionRate: number }[];
  timeSeries: { granularity: string; series: { bucket: string; total: number }[] };
  funnel: { stage: string; count: number; dropOffPct: number }[];
  topCities: { value: string; total: number }[];
  topLocalities: { value: string; total: number }[];
  topProjects: { value: string; total: number }[];
  listingTypeSplit: { value: string; total: number }[];
  bhkDistribution: { value: number; total: number }[];
}

export interface AgentLeaderboardRow {
  agentId: string;
  agentName: string;
  total: number;
  newLeads: number;
  contacted: number;
  siteVisits: number;
  converted: number;
  conversionRate: number;
  lost: number;
  avgResponseHours: number | null;
  overdueFollowUps: number;
  dealValue: number;
}

export interface AgentCrosstabRow {
  agentId: string;
  agentName: string;
  source: CrmSource;
  total: number;
  converted: number;
}

export interface PersonalLeadInput {
  name: string;
  phone: string;
  altPhone?: string | null;
  email?: string | null;
  agentId?: string | null;
  leadDate?: string | null;
  sourceDetail?: string | null;
  listingType?: string | null;
  propertyType?: string | null;
  configuration?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
  city?: string | null;
  locality?: string | null;
  project?: string | null;
  notes?: string | null;
  nextFollowUpAt?: string | null;
  status?: string;
  overrideDuplicateReason?: string | null;
}
