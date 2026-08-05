import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, MessageCircle } from 'lucide-react';
import { Property } from '../../../types';
import { getAllProperties } from '../../../services/storageService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { DocumentPreview, captureUnscaled } from '../../../pages/billing/DocumentPreview';
import { renderNodeToPdf } from '../../../utils/pdfExport';
import { BUSINESS_PHONE } from '../../../utils/siteSettings';
import { toClientFacingRow, resolveContactNumber } from '../../../utils/propertyShareFields';
import { buildFlowItems, paginateFlowItems } from '../../../utils/propertySharePaginate';
import { A4_PORTRAIT_WIDTH_PX, A4_LANDSCAPE_WIDTH_PX } from '../../../utils/propertyShareLayout';
import { formatBhkLabel, titleCase } from '../../../utils/propertyShareFormat';
import { PropertyShareDocument } from './PropertyShareDocument';
import { recordPropertyShare } from '../../../services/propertyShareStorage';
import { addLeadActivity } from '../../../services/crmApi';

interface ShareConfigureStepProps {
  order: string[];
  properties: Map<string, Property>;
  initialClientName?: string;
  initialClientPhone?: string;
  leadId?: string; // set when opened from a CRM lead (Phase 6) — logged with the share record
  onBack: () => void;
  onShared: (summary: { propertyCount: number }) => void;
}

function suggestTitle(propertyList: Property[]): string {
  const bhks = [...new Set(propertyList.map((p) => p.bedrooms))];
  const localities = [...new Set(propertyList.map((p) => p.locality).filter(Boolean))];
  const bhkPart = bhks.length === 1 ? formatBhkLabel(bhks[0]) + ' Properties' : 'Properties';
  const localityPart = localities.length === 1 ? ` — ${localities[0]}` : '';
  return `${bhkPart}${localityPart}`;
}

function officeDefaultDigits(): string {
  return BUSINESS_PHONE.replace(/\D/g, '');
}

export const ShareConfigureStep: React.FC<ShareConfigureStepProps> = ({
  order,
  properties,
  initialClientName,
  initialClientPhone,
  leadId,
  onBack,
  onShared,
}) => {
  const propertyList = useMemo(() => order.map((id) => properties.get(id)).filter((p): p is Property => !!p), [order, properties]);

  const [layout, setLayout] = useState<'portrait' | 'landscape'>('portrait');
  const [groupByBhk, setGroupByBhk] = useState(true);
  const [showPrices, setShowPrices] = useState(true);
  const [clientName, setClientName] = useState(initialClientName ?? '');
  const [clientPhone, setClientPhone] = useState(initialClientPhone ?? '');
  const [customMessage, setCustomMessage] = useState('');
  const [title, setTitle] = useState(() => suggestTitle(propertyList));
  const [downloading, setDownloading] = useState(false);
  const [staleWarning, setStaleWarning] = useState<string | null>(null);

  const previewRef = useRef<HTMLDivElement>(null);

  // Edge case: a property can go off-market between selection and
  // generation. Re-check against live data once, on entering this step.
  useEffect(() => {
    let cancelled = false;
    getAllProperties().then((fresh) => {
      if (cancelled) return;
      const freshById = new Map(fresh.map((p) => [p.id, p]));
      const offMarket = propertyList.filter((p) => freshById.get(p.id)?.isActive === false || !freshById.has(p.id));
      if (offMarket.length > 0) {
        setStaleWarning(
          `${offMarket.length} selected propert${offMarket.length === 1 ? 'y is' : 'ies are'} no longer active: ${offMarket
            .map((p) => titleCase(p.title))
            .join(', ')}. They're still included below — remove them if they're actually off-market.`
        );
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const officeDefault = officeDefaultDigits();

  const rows = useMemo(
    () => propertyList.map((p) => toClientFacingRow(p, resolveContactNumber(p.agentPhone, officeDefault))),
    [propertyList, officeDefault]
  );

  // Footer logic (spec): every property resolves to the same number -> show
  // it once in the footer, suppress per-row numbers. Mixed -> footer shows
  // the office default, every row carries its own.
  const distinctNumbers = useMemo(() => new Set(rows.map((r) => r.contactNumber)), [rows]);
  const showContactNumber = distinctNumbers.size > 1;
  const footerPhone = showContactNumber ? officeDefault : [...distinctNumbers][0] ?? officeDefault;

  const pageWidthPx = layout === 'portrait' ? A4_PORTRAIT_WIDTH_PX : A4_LANDSCAPE_WIDTH_PX;
  const flow = useMemo(() => buildFlowItems(rows, layout, groupByBhk, pageWidthPx), [rows, layout, groupByBhk, pageWidthPx]);
  const pages = useMemo(() => paginateFlowItems(flow, layout, true), [flow, layout]);

  const dateLabel = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const filenameDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/\s/g, '');

  const buildFilename = () => {
    const bhks = [...new Set(propertyList.map((p) => p.bedrooms))];
    const bhkPart = bhks.length === 1 ? formatBhkLabel(bhks[0]).replace(/\s/g, '') : 'Mixed';
    const localities = [...new Set(propertyList.map((p) => p.locality).filter(Boolean))];
    const localityPart = localities.length === 1 ? `_${String(localities[0]).replace(/\s+/g, '')}` : '';
    const clientPart = clientName.trim() ? `_${clientName.trim().replace(/\s+/g, '')}` : '';
    return `NovaNest_${bhkPart}${localityPart}${clientPart}_${filenameDate}.pdf`;
  };

  const logShare = () => {
    // Best-effort: the client-facing PDF itself is already downloaded/sent
    // by this point — a failure logging the share record must never look
    // like the send itself failed.
    recordPropertyShare({
      clientName: clientName.trim() || undefined,
      clientPhone: clientPhone.trim() || undefined,
      propertyIds: order,
      config: { layout, groupByBhk, showPrices, customMessage },
      pdfFilename: buildFilename(),
      leadId,
    }).catch(() => {
      /* recent-shares history is a convenience, not the primary action */
    });

    if (leadId) {
      const names = propertyList.map((p) => titleCase(p.title)).join(', ');
      addLeadActivity(leadId, 'note', `Shared ${order.length} propert${order.length === 1 ? 'y' : 'ies'} via PDF: ${names}`).catch(() => {
        /* activity log is a convenience, not the primary action */
      });
    }
  };

  const handleDownload = async () => {
    if (!previewRef.current) return;
    setDownloading(true);
    try {
      const blob = await captureUnscaled(previewRef.current, () => renderNodeToPdf(previewRef.current!, layout));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = buildFilename();
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded.');
      logShare();
      onShared({ propertyCount: order.length });
    } catch (error) {
      console.error('Property share PDF export failed:', error);
      toast.error('Could not generate the PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleWhatsApp = () => {
    const digits = clientPhone.replace(/\D/g, '');
    if (digits.length !== 10) {
      toast.error('Enter a valid 10-digit client number first.');
      return;
    }
    const message =
      customMessage.trim() ||
      `Hi${clientName.trim() ? ` ${clientName.trim()}` : ''}, here are the ${propertyList.length} propert${
        propertyList.length === 1 ? 'y' : 'ies'
      } we discussed.`;
    window.open(`https://wa.me/91${digits}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    logShare();
    onShared({ propertyCount: order.length });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={14} /> Back to selection
        </Button>
      </div>

      {staleWarning && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">{staleWarning}</div>
      )}
      {order.length > 50 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {order.length} properties selected — the PDF will run long. Consider trimming the selection.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
        {/* Config panel */}
        <div className="space-y-4 rounded-xl border p-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Client name</label>
            <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Client WhatsApp number</label>
            <Input
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="10-digit number, for WhatsApp"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Custom message</label>
            <Textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
              placeholder={`Hi ${clientName || 'Ramesh'}, here are the properties we discussed.`}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Layout</span>
            <div className="inline-flex rounded-lg border p-0.5 text-xs">
              {(['portrait', 'landscape'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLayout(l)}
                  className={`rounded-md px-2.5 py-1 font-medium capitalize transition-colors ${
                    layout === l ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between text-sm font-medium">
            Group by BHK
            <Checkbox checked={groupByBhk} onCheckedChange={(v) => setGroupByBhk(!!v)} />
          </label>
          <label className="flex items-center justify-between text-sm font-medium">
            Show prices
            <Checkbox checked={showPrices} onCheckedChange={(v) => setShowPrices(!!v)} />
          </label>

          <div className="border-t pt-4">
            <p className="mb-2 text-xs text-muted-foreground">{order.length} properties &middot; {pages.length} page{pages.length === 1 ? '' : 's'}</p>
            <div className="flex flex-col gap-2">
              <Button onClick={handleDownload} disabled={downloading}>
                <Download size={14} /> {downloading ? 'Generating...' : 'Download PDF'}
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={handleWhatsApp}>
                    <MessageCircle size={14} /> Share via WhatsApp
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Opens WhatsApp with a message — attach the downloaded PDF manually.</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div>
          <DocumentPreview contentRef={previewRef} pageCount={pages.length}>
            <PropertyShareDocument
              pages={pages}
              layout={layout}
              title={title}
              date={dateLabel}
              cover={{ clientName: clientName.trim() || undefined, customMessage: customMessage.trim() || undefined, propertyCount: order.length }}
              showContactNumber={showContactNumber}
              showPrices={showPrices}
              footerPhone={footerPhone}
            />
          </DocumentPreview>
        </div>
      </div>
    </div>
  );
};
