import React, { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table';
import { UploadCloud, FileText, CheckCircle2, XCircle, AlertTriangle, Home, Building2, Loader2 } from 'lucide-react';
import {
  commitImport,
  downloadBatchErrorsCsv,
  getBatchStatus,
  listAgents,
  previewImport,
} from '../../../services/crmApi';
import {
  CrmAgent,
  CrmSource,
  DuplicatePolicy,
  ImportBatchSummary,
  ImportPreviewResult,
} from '../../../types/crm';
import { CANONICAL_FIELD_OPTIONS } from './canonicalFields';
import { AgentFormDialog } from './AgentFormDialog';

type Step = 'source' | 'upload' | 'mapping' | 'importing' | 'summary';

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
  onPickPersonal: () => void;
}

const SOURCE_CARDS: { value: CrmSource; label: string; description: string }[] = [
  { value: 'housing', label: 'Housing', description: 'Bulk upload the Housing.com leads export' },
  { value: 'magicbricks', label: 'MagicBricks', description: 'Bulk upload the MagicBricks leads export' },
  { value: '99acres', label: '99acres', description: 'Bulk upload the 99acres responses export' },
  { value: 'personal', label: 'Personal Leads', description: 'Add a single lead by hand (walk-in, referral, call...)' },
];

// Matches server/src/routes/import.ts's multer limit — kept in sync
// manually since the backend now runs on Lambda, which hard-caps
// synchronous request bodies at 6 MB regardless of this app's own config.
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_EXT = ['.xls', '.xlsx', '.csv', '.tsv'];

function formatSourceLabel(source: CrmSource): string {
  return SOURCE_CARDS.find((s) => s.value === source)?.label ?? source;
}

export const UploadModal: React.FC<UploadModalProps> = ({ open, onClose, onImported, onPickPersonal }) => {
  const [step, setStep] = useState<Step>('source');
  const [source, setSource] = useState<CrmSource | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [mappingOverrides, setMappingOverrides] = useState<Record<string, string>>({});
  const [agents, setAgents] = useState<CrmAgent[]>([]);
  const [defaultAgentId, setDefaultAgentId] = useState<string | null>(null);
  const [addAgentOpen, setAddAgentOpen] = useState(false);
  const [autoCreateAgents, setAutoCreateAgents] = useState(true);
  const [duplicatePolicy, setDuplicatePolicy] = useState<DuplicatePolicy>('skip');
  const [summary, setSummary] = useState<ImportBatchSummary | null>(null);
  const [progressLabel, setProgressLabel] = useState('Uploading...');

  const reset = useCallback(() => {
    setStep('source');
    setSource(null);
    setFile(null);
    setPreview(null);
    setMappingOverrides({});
    setDefaultAgentId(null);
    setAutoCreateAgents(true);
    setDuplicatePolicy('skip');
    setSummary(null);
  }, []);

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  useEffect(() => {
    if (step === 'mapping') {
      listAgents().then(setAgents).catch(() => setAgents([]));
    }
  }, [step]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handlePickSource = (value: CrmSource) => {
    if (value === 'personal') {
      handleClose();
      onPickPersonal();
      return;
    }
    setSource(value);
    setStep('upload');
  };

  const doPreview = async (selectedFile: File) => {
    if (!source) return;
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error('That file is over 5 MB. Please split it or trim it down.');
      return;
    }
    setFile(selectedFile);
    setBusy(true);
    try {
      const result = await previewImport(selectedFile, source);
      setPreview(result);
      setStep('mapping');
    } catch (err: any) {
      const message = err?.response?.data?.error ?? 'Could not read this file. Please upload the original export from the portal (.xls, .xlsx or .csv).';
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
      'text/tab-separated-values': ['.tsv'],
      'application/octet-stream': ACCEPTED_EXT,
    },
    onDrop: (accepted) => {
      if (accepted[0]) void doPreview(accepted[0]);
    },
  });

  const setRowMapping = (headerKey: string, canonicalField: string) => {
    setMappingOverrides((prev) => ({ ...prev, [headerKey]: canonicalField === '__unmapped__' ? '' : canonicalField }));
  };

  const effectiveMapping = (headerKey: string, original: string | null): string | null => {
    if (headerKey in mappingOverrides) {
      return mappingOverrides[headerKey] || null;
    }
    return original;
  };

  const handleImport = async () => {
    if (!preview) return;
    setStep('importing');
    setProgressLabel('Importing rows...');
    try {
      const cleanOverrides: Record<string, string> = {};
      for (const [k, v] of Object.entries(mappingOverrides)) {
        if (v) cleanOverrides[k] = v;
      }
      let result = await commitImport({
        batchId: preview.batchId,
        mapping: cleanOverrides,
        defaultAgentId,
        duplicatePolicy,
        autoCreateAgents,
      });

      if ('status' in result && result.status === 'processing') {
        setProgressLabel('This is a large file — importing in the background...');
        // Poll until the batch reaches a terminal status.
        // eslint-disable-next-line no-constant-condition
        while (true) {
          await new Promise((r) => setTimeout(r, 2000));
          const status = await getBatchStatus(preview.batchId);
          if (status.status === 'completed' || status.status === 'failed') {
            result = status;
            break;
          }
          setProgressLabel(`Imported ${status.rowsImported} of ${status.rowsRead} so far...`);
        }
      }

      const finalSummary = result as ImportBatchSummary;
      setSummary(finalSummary);
      setStep('summary');
      onImported();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Import failed. Please try again.');
      setStep('mapping');
    }
  };

  const unmappedCount = preview?.mapping.filter((m) => !effectiveMapping(m.headerKey, m.canonicalField)).length ?? 0;

  return (
    <>
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'source' && 'Upload New Data'}
            {step === 'upload' && `Upload ${source ? formatSourceLabel(source) : ''} file`}
            {step === 'mapping' && 'Review column mapping'}
            {step === 'importing' && 'Importing...'}
            {step === 'summary' && 'Import summary'}
          </DialogTitle>
          {step === 'upload' && (
            <DialogDescription>
              Upload the export exactly as downloaded from {source ? formatSourceLabel(source) : 'the portal'} — no need to convert it.
            </DialogDescription>
          )}
        </DialogHeader>

        {step === 'source' && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SOURCE_CARDS.map((card) => (
              <button
                key={card.value}
                onClick={() => handlePickSource(card.value)}
                className="flex flex-col items-start gap-2 rounded-xl border border-border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {card.value === 'personal' ? <Home size={20} /> : <Building2 size={20} />}
                </div>
                <div className="font-semibold">{card.label}</div>
                <div className="text-sm text-muted-foreground">{card.description}</div>
              </button>
            ))}
          </div>
        )}

        {step === 'upload' && (
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <input {...getInputProps()} />
              <UploadCloud size={36} className="text-muted-foreground" />
              {busy ? (
                <p className="text-sm text-muted-foreground">Reading file...</p>
              ) : (
                <>
                  <p className="font-medium">Drag and drop, or click to browse</p>
                  <p className="text-xs text-muted-foreground">.xls, .xlsx, .csv, .tsv — max 5 MB</p>
                </>
              )}
            </div>
            <Button variant="outline" onClick={() => setStep('source')}>
              Back
            </Button>
          </div>
        )}

        {step === 'mapping' && preview && (
          <div className="min-w-0 space-y-5">
            {preview.duplicateFileWarning && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                <span>
                  This exact file was already imported on{' '}
                  {new Date(preview.duplicateFileWarning.importedAt).toLocaleDateString()}. You can continue — matching rows
                  will be skipped as duplicates.
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {file && (
                <>
                  <span className="font-medium text-foreground">{file.name}</span>
                  <span>·</span>
                </>
              )}
              <span>{preview.rowsRead} rows read</span>
              <span>·</span>
              <span>{preview.format.toUpperCase()} detected</span>
              {preview.newColumns.length > 0 && (
                <>
                  <span>·</span>
                  <Badge variant="secondary">{preview.newColumns.length} new columns detected</Badge>
                </>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sheet column</TableHead>
                    <TableHead>CRM field</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.mapping.map((m) => {
                    const current = effectiveMapping(m.headerKey, m.canonicalField);
                    return (
                      <TableRow key={m.headerKey}>
                        <TableCell className="max-w-[220px] font-medium">
                          <span className="block truncate" title={m.header}>
                            {m.header}
                          </span>
                          {!current && (
                            <Badge variant="outline" className="mt-1">
                              Will be stored as extra data
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="min-w-[180px]">
                          <Select value={current ?? '__unmapped__'} onValueChange={(v) => setRowMapping(m.headerKey, v)}>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__unmapped__">Unmapped — store as extra data</SelectItem>
                              {CANONICAL_FIELD_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Preview (first {preview.sampleRows.length} rows, as they'll be saved)</p>
              <div className="max-h-48 overflow-x-auto overflow-y-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Lead date</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.sampleRows.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell>{row.name ?? '—'}</TableCell>
                        <TableCell>{row.phone ?? row.phoneRaw ?? '—'}</TableCell>
                        <TableCell>{row.email ?? '—'}</TableCell>
                        <TableCell>{row.leadDate ? new Date(row.leadDate).toLocaleDateString() : '—'}</TableCell>
                        <TableCell>{row.priceValue ?? row.priceRaw ?? '—'}</TableCell>
                        <TableCell>
                          {row.error ? (
                            <Badge variant="destructive">{row.error}</Badge>
                          ) : (
                            <Badge variant="secondary">OK</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 block">Default agent for this upload</Label>
                <Select
                  value={defaultAgentId ?? '__unassigned__'}
                  onValueChange={(v) => {
                    if (v === '__add_new__') { setAddAgentOpen(true); return; }
                    setDefaultAgentId(v === '__unassigned__' ? null : v);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__unassigned__">Unassigned</SelectItem>
                    {agents.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="__add_new__" className="text-primary">+ Add new agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <Checkbox id="autoCreateAgents" checked={autoCreateAgents} onCheckedChange={(v) => setAutoCreateAgents(!!v)} />
                <Label htmlFor="autoCreateAgents">Auto-create unknown agents</Label>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">On duplicate</Label>
              <RadioGroup value={duplicatePolicy} onValueChange={(v) => setDuplicatePolicy(v as DuplicatePolicy)} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="skip" id="policy-skip" />
                  <Label htmlFor="policy-skip">Skip — don't insert, log the collision</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="enrich" id="policy-enrich" />
                  <Label htmlFor="policy-enrich">Enrich — fill in missing fields on the existing lead</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="create_anyway" id="policy-create" />
                  <Label htmlFor="policy-create">Create anyway — insert flagged for manual review</Label>
                </div>
              </RadioGroup>
            </div>

            {unmappedCount > 0 && (
              <p className="text-xs text-muted-foreground">{unmappedCount} column(s) unmapped — they'll be preserved under "Additional fields from source" on each lead.</p>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button onClick={handleImport}>Import {preview.rowsRead} rows</Button>
            </DialogFooter>
          </div>
        )}

        {step === 'importing' && (
          <div className="flex flex-col items-center gap-4 py-10">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{progressLabel}</p>
          </div>
        )}

        {step === 'summary' && summary && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SummaryStat label="Rows read" value={summary.rowsRead} />
              <SummaryStat label="Imported" value={summary.rowsImported} icon={<CheckCircle2 size={16} className="text-emerald-600" />} />
              <SummaryStat label="Duplicates skipped" value={summary.rowsDuplicate} icon={<FileText size={16} className="text-amber-600" />} />
              <SummaryStat label="Errors" value={summary.rowsError} icon={<XCircle size={16} className="text-red-600" />} />
            </div>

            {summary.highDuplicateRate && (
              <div className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <p>
                  <span className="font-medium">Unusually high duplicate rate</span> — check column mapping. Over 40% of
                  this batch was blocked as a duplicate.
                </p>
              </div>
            )}

            {summary.rowsDuplicate > 0 && (
              <p className="text-sm text-muted-foreground">
                {summary.duplicateBreakdown.phone} phone, {summary.duplicateBreakdown.email} email,{' '}
                {summary.duplicateBreakdown.source_property_name} property+name, {summary.duplicateBreakdown.in_file} in-file
              </p>
            )}

            {summary.fieldWarnings.length > 0 && (
              <div>
                <p className="mb-1 text-sm font-medium">Warnings</p>
                <ul className="list-inside list-disc text-sm text-muted-foreground">
                  {summary.fieldWarnings.map((w) => (
                    <li key={w.code}>
                      {w.count} × {w.code.replace(/_/g, ' ').toLowerCase()}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {summary.newColumns.length > 0 && (
              <div>
                <p className="mb-1 text-sm font-medium">{summary.newColumns.length} new columns detected</p>
                <div className="flex flex-wrap gap-1.5">
                  {summary.newColumns.map((c) => (
                    <Badge key={c} variant="outline">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {summary.rowsError > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadBatchErrorsCsv(summary.batchId, `${summary.fileName}-errors.csv`)}
              >
                Download error CSV
              </Button>
            )}

            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
    <AgentFormDialog
      open={addAgentOpen}
      onClose={() => setAddAgentOpen(false)}
      onSaved={(newAgent) => {
        setAgents((prev) => [...prev, newAgent]);
      }}
    />
    </>
  );
};

const SummaryStat: React.FC<{ label: string; value: number; icon?: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="rounded-lg border p-3">
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {icon}
      {label}
    </div>
    <div className="text-2xl font-semibold">{value}</div>
  </div>
);
