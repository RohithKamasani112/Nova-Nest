import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
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
        No imports yet. Click "Upload New Data" to bring in your first batch of leads.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
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

  const navigateToLeads = (filters: LeadFiltersState) => {
    setLeadsInitialFilters(filters);
    setActiveTab('leads');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CRM</h1>
          <p className="text-gray-600">Import and manage leads from every source.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPersonalFormOpen(true)}>
            <UserPlus size={18} />
            Add Personal Lead
          </Button>
          <Button onClick={() => setUploadOpen(true)}>
            <UploadCloud size={18} />
            Upload New Data
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="leads">All Leads</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="history">Import History</TabsTrigger>
        </TabsList>
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
        onPickPersonal={() => setPersonalFormOpen(true)}
      />
      <PersonalLeadForm
        open={personalFormOpen}
        onClose={() => setPersonalFormOpen(false)}
        onCreated={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
};
