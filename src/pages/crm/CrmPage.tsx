import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useReducedMotion } from 'motion/react';
import { UploadCloud, UserPlus } from 'lucide-react';
import { Button } from '../../app/components/ui/button';
import { Badge } from '../../app/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../app/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../app/components/ui/table';
import { UploadModal } from '../../app/components/crm/UploadModal';
import { PersonalLeadForm } from '../../app/components/crm/PersonalLeadForm';
import { CrmLeadsPage } from './CrmLeadsPage';
import { CrmDashboardPage } from './CrmDashboardPage';
import { CrmAgentsPage } from './CrmAgentsPage';
import { listImports } from '../../services/crmApi';
import { ImportBatchSummary, LeadFiltersState } from '../../types/crm';

const SOURCE_LABEL: Record<string, string> = {
  housing: 'Housing',
  magicbricks: 'MagicBricks',
  '99acres': '99acres',
  personal: 'Personal',
};

function statusBadge(status: string) {
  if (status === 'completed') return <Badge variant="secondary">Completed</Badge>;
  if (status === 'processing') return <Badge>Processing</Badge>;
  if (status === 'failed') return <Badge variant="destructive">Failed</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

const ImportHistoryTab: React.FC<{ refreshKey: number }> = ({ refreshKey }) => {
  const [batches, setBatches] = useState<ImportBatchSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listImports()
      .then((r) => setBatches(r.batches))
      .catch(() => toast.error('Could not load import history.'))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;
  if (batches.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
        No imports yet. Click "Import leads" to bring in your first batch of leads.
      </div>
    );
  }

  return (
    <>
      {/* Mobile card list — below md. Lowest-traffic tab, so a simple card
          rather than the full 8-column table: source/filename, status,
          date, and the row counts as small chips (errors called out). */}
      <div className="space-y-2 md:hidden">
        {batches.map((b) => (
          <div key={b.batchId} className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">{SOURCE_LABEL[b.source] ?? b.source}</p>
                <p className="truncate text-sm text-gray-600">{b.fileName}</p>
              </div>
              <div className="shrink-0">{statusBadge(b.status)}</div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{b.rowsRead} read</span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{b.rowsImported} imported</span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{b.rowsDuplicate} duplicates</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  b.rowsError > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {b.rowsError} errors
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-500">{new Date(b.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Desktop table — md and up, unchanged. */}
      <div className="hidden overflow-x-auto rounded-xl border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>File</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Read</TableHead>
              <TableHead>Imported</TableHead>
              <TableHead>Duplicates</TableHead>
              <TableHead>Errors</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((b) => (
              <TableRow key={b.batchId}>
                <TableCell>{SOURCE_LABEL[b.source] ?? b.source}</TableCell>
                <TableCell className="max-w-xs truncate">{b.fileName}</TableCell>
                <TableCell>{statusBadge(b.status)}</TableCell>
                <TableCell>{b.rowsRead}</TableCell>
                <TableCell>{b.rowsImported}</TableCell>
                <TableCell>{b.rowsDuplicate}</TableCell>
                <TableCell>{b.rowsError}</TableCell>
                <TableCell>{new Date(b.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

interface CrmPageProps {
  onShareProperties?: (clientName: string, clientPhone: string | null, leadId: string) => void;
}

export const CrmPage: React.FC<CrmPageProps> = ({ onShareProperties }) => {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [personalFormOpen, setPersonalFormOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [leadsInitialFilters, setLeadsInitialFilters] = useState<LeadFiltersState>({});
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const navigateToLeads = (filters: LeadFiltersState) => {
    setLeadsInitialFilters(filters);
    setActiveTab('leads');
  };

  // The tab strip scrolls horizontally on narrow screens (below) instead of
  // overflowing the page — keep whichever tab is active scrolled into view,
  // both on mount and when switching tabs programmatically (e.g.
  // navigateToLeads), so an agent never has to discover a tab by swiping
  // blindly to find where they landed.
  useEffect(() => {
    const active = tabsScrollRef.current?.querySelector<HTMLElement>('[data-state="active"]');
    active?.scrollIntoView({
      inline: 'center',
      block: 'nearest',
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }, [activeTab, reduceMotion]);

  return (
    <div className="crm-workspace space-y-6">
      <div className="crm-page-header flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="crm-eyebrow mb-2">NOVA NEST · SALES WORKSPACE</p>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Customer relationships</h1>
          <p className="text-gray-600">Your leads, conversations and next steps. All in one place.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setPersonalFormOpen(true)}>
            <UserPlus size={18} />
            Add lead
          </Button>
          <Button onClick={() => setUploadOpen(true)}>
            <UploadCloud size={18} />
            Import leads
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Below sm, 4 non-wrapping tab labels don't fit a phone screen —
            scroll the strip itself instead of letting it overflow the page.
            The edge fade (mask-image) hints there's more to scroll to; the
            effect above keeps the active tab centered in view. */}
        <div
          ref={tabsScrollRef}
          className="no-scrollbar -mx-1 overflow-x-auto px-1 [mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)] sm:mx-0 sm:overflow-visible sm:px-0 sm:[mask-image:none] sm:[-webkit-mask-image:none]"
        >
          <TabsList className="crm-main-tabs">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="leads">Lead inbox</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="history">Import History</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="dashboard" className="mt-4">
          <CrmDashboardPage onDrillDown={navigateToLeads} />
        </TabsContent>
        <TabsContent value="leads" className="mt-4">
          <CrmLeadsPage
            key={`${refreshKey}-${JSON.stringify(leadsInitialFilters)}`}
            initialFilters={leadsInitialFilters}
            onUploadClick={() => setUploadOpen(true)}
            onShareProperties={onShareProperties}
          />
        </TabsContent>
        <TabsContent value="agents" className="mt-4">
          <CrmAgentsPage />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <ImportHistoryTab refreshKey={refreshKey} />
        </TabsContent>
      </Tabs>

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onImported={() => setRefreshKey((k) => k + 1)}
      />
      <PersonalLeadForm
        open={personalFormOpen}
        onClose={() => setPersonalFormOpen(false)}
        onCreated={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
};
