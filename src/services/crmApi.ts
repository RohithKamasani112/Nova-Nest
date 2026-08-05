import axios from 'axios';
import {
  AgentCrosstabRow,
  AgentLeaderboardRow,
  AgentStats,
  CommitImportParams,
  CrmAgent,
  CrmSource,
  CrossPortalEnquiry,
  FilterOptions,
  ImportBatchSummary,
  ImportPreviewResult,
  KpiResponse,
  LeadActivity,
  LeadDetail,
  LeadInterest,
  ChipCounts,
  LeadFiltersState,
  LeadListItem,
  PersonalLeadInput,
  TodaysCallsResponse,
} from '../types/crm';

const baseURL = import.meta.env.VITE_CRM_API_BASE_URL ?? 'http://localhost:4001/api';

export const crmApi = axios.create({ baseURL });

crmApi.interceptors.request.use((config) => {
  const raw = localStorage.getItem('estate_auth_user');
  if (raw) {
    try {
      const token = JSON.parse(raw)?.accessToken;
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {
      // ignore malformed stored session
    }
  }
  return config;
});

export async function previewImport(file: File, source: CrmSource): Promise<ImportPreviewResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('source', source);
  const { data } = await crmApi.post<ImportPreviewResult>('/crm/import/preview', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function commitImport(
  params: CommitImportParams
): Promise<ImportBatchSummary | { batchId: string; status: 'processing' }> {
  const { data } = await crmApi.post('/crm/import/commit', params);
  return data;
}

export async function getBatchStatus(batchId: string): Promise<ImportBatchSummary> {
  const { data } = await crmApi.get<ImportBatchSummary>(`/crm/import/${batchId}`);
  return data;
}

export async function downloadBatchErrorsCsv(batchId: string, suggestedName: string): Promise<void> {
  const response = await crmApi.get(`/crm/import/${batchId}/errors.csv`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(response.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = suggestedName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function listImports(limit = 50, offset = 0): Promise<{ batches: ImportBatchSummary[]; total: number }> {
  const { data } = await crmApi.get('/crm/imports', { params: { limit, offset } });
  return data;
}

export async function listAgents(): Promise<CrmAgent[]> {
  const { data } = await crmApi.get<{ agents: CrmAgent[] }>('/crm/agents');
  return data.agents;
}

export async function listAgentsWithStats(includeInactive = false): Promise<AgentStats[]> {
  const { data } = await crmApi.get<{ agents: AgentStats[] }>('/crm/agents/stats', { params: { includeInactive } });
  return data.agents;
}

export async function createAgent(input: { name: string; email?: string | null; phone?: string | null }): Promise<CrmAgent> {
  const { data } = await crmApi.post<{ agent: CrmAgent }>('/crm/agents', input);
  return data.agent;
}

export async function updateAgent(
  id: string,
  input: { name?: string; email?: string | null; phone?: string | null; isActive?: boolean }
): Promise<CrmAgent> {
  const { data } = await crmApi.patch<{ agent: CrmAgent }>(`/crm/agents/${id}`, input);
  return data.agent;
}

export async function deactivateAgent(
  id: string,
  input: { reassignToAgentId?: string | null; leaveUnassigned?: boolean }
): Promise<{ reassignedCount: number }> {
  const { data } = await crmApi.post(`/crm/agents/${id}/deactivate`, input);
  return data;
}

// -------------------------------------------------------------- leads ---

function filtersToParams(filters: LeadFiltersState): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') continue;
    params[key] = Array.isArray(value) ? value.join(',') : String(value);
  }
  return params;
}

export async function listLeads(filters: LeadFiltersState): Promise<{ leads: LeadListItem[]; total: number; page: number; pageSize: number }> {
  const { data } = await crmApi.get('/crm/leads', { params: filtersToParams(filters) });
  return data;
}

export async function getLeadDetail(id: string): Promise<{ lead: LeadDetail; crossPortalEnquiries: CrossPortalEnquiry[]; activities: LeadActivity[] }> {
  const { data } = await crmApi.get(`/crm/leads/${id}`);
  return data;
}

export async function getLeadInterests(id: string): Promise<{ interests: LeadInterest[] }> {
  const { data } = await crmApi.get(`/crm/leads/${id}/interests`);
  return data;
}

export async function createPersonalLead(input: PersonalLeadInput): Promise<{ id: string }> {
  const { data } = await crmApi.post('/crm/leads', input);
  return data;
}

export async function updateLead(id: string, patch: Record<string, unknown>): Promise<{ lead: LeadDetail }> {
  const { data } = await crmApi.patch(`/crm/leads/${id}`, patch);
  return data;
}

export async function deleteLead(id: string): Promise<void> {
  await crmApi.delete(`/crm/leads/${id}`);
}

export async function bulkLeadAction(
  ids: string[],
  action: 'assign_agent' | 'change_status' | 'delete',
  payload?: { agentId?: string | null; status?: string; lostReason?: string }
): Promise<{ affected: number }> {
  const { data } = await crmApi.post('/crm/leads/bulk', { ids, action, payload });
  return data;
}

export async function checkDuplicateLead(phone?: string, email?: string): Promise<{ id: string; name: string; source: CrmSource; created_at: string } | null> {
  const { data } = await crmApi.get('/crm/leads/check-duplicate', { params: { phone, email } });
  return data.match;
}

export async function getFilterOptions(): Promise<FilterOptions> {
  const { data } = await crmApi.get('/crm/filters/options');
  return data;
}

export async function getChipCounts(): Promise<ChipCounts> {
  const { data } = await crmApi.get('/crm/leads/chip-counts');
  return data;
}

export async function getTodaysCalls(agentId?: string): Promise<TodaysCallsResponse> {
  const { data } = await crmApi.get('/crm/leads/today-calls', { params: agentId ? { agentId } : {} });
  return data;
}

export async function addLeadActivity(
  leadId: string,
  type: string,
  content: string | null,
  nextFollowUpAt?: string | null
): Promise<void> {
  await crmApi.post(`/crm/leads/${leadId}/activities`, { type, content, nextFollowUpAt });
}

// ---------------------------------------------------------------- kpis ---

export interface KpiQuery {
  from: string;
  to: string;
  dateField: 'lead_date' | 'created_at';
  agentId?: string;
  source?: string;
}

export async function getKpis(query: KpiQuery): Promise<KpiResponse> {
  const { data } = await crmApi.get('/crm/kpis', { params: query });
  return data;
}

export async function getAgentLeaderboard(query: Omit<KpiQuery, 'agentId'>): Promise<{ leaderboard: AgentLeaderboardRow[]; crosstab: AgentCrosstabRow[] }> {
  const { data } = await crmApi.get('/crm/kpis/agents', { params: query });
  return data;
}

export async function downloadLeadsExportCsv(filters: LeadFiltersState): Promise<void> {
  const response = await crmApi.get('/crm/leads/export.csv', { params: filtersToParams(filters), responseType: 'blob' });
  const url = window.URL.createObjectURL(response.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leads-export.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
