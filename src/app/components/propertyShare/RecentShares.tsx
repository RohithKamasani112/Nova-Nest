import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Download, History } from 'lucide-react';
import { Button } from '../ui/button';
import { getAllProperties } from '../../../services/storageService';
import { getRecentPropertyShares, PropertyShareRecord } from '../../../services/propertyShareStorage';
import { toClientFacingRow, resolveContactNumber } from '../../../utils/propertyShareFields';
import { buildFlowItems, paginateFlowItems } from '../../../utils/propertySharePaginate';
import { A4_PORTRAIT_WIDTH_PX, A4_LANDSCAPE_WIDTH_PX } from '../../../utils/propertyShareLayout';
import { titleCase } from '../../../utils/propertyShareFormat';
import { BUSINESS_PHONE } from '../../../utils/siteSettings';
import { captureUnscaled } from '../../../pages/billing/DocumentPreview';
import { renderNodeToPdf } from '../../../utils/pdfExport';
import { PropertyShareDocument } from './PropertyShareDocument';

// Re-download regenerates the PDF from current property data + the saved
// selection/config rather than storing the PDF binary — a since-changed
// price or an off-market flip is reflected, not silently served stale. It
// is therefore NOT a byte-identical copy of what was actually sent.
export const RecentShares: React.FC = () => {
  const [shares, setShares] = useState<PropertyShareRecord[] | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const hiddenRef = useRef<HTMLDivElement>(null);
  const [pendingDoc, setPendingDoc] = useState<{
    pages: ReturnType<typeof paginateFlowItems>;
    layout: 'portrait' | 'landscape';
    title: string;
    date: string;
    cover: { clientName?: string; customMessage?: string; propertyCount: number };
    showContactNumber: boolean;
    showPrices: boolean;
    footerPhone: string;
    filename: string;
  } | null>(null);

  useEffect(() => {
    getRecentPropertyShares()
      .then(setShares)
      .catch(() => setShares([]));
  }, []);

  // Once pendingDoc is set, the hidden document renders; capture it on the
  // next paint. A small effect (rather than doing this inline in the click
  // handler) so the DOM has actually updated before html2canvas runs.
  useEffect(() => {
    if (!pendingDoc || !hiddenRef.current) return;
    (async () => {
      try {
        const blob = await captureUnscaled(hiddenRef.current!, () => renderNodeToPdf(hiddenRef.current!, pendingDoc.layout));
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = pendingDoc.filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.success('PDF regenerated and downloaded.');
      } catch (error) {
        console.error('Re-download failed:', error);
        toast.error('Could not regenerate the PDF.');
      } finally {
        setPendingDoc(null);
        setRegeneratingId(null);
      }
    })();
  }, [pendingDoc]);

  const handleRedownload = async (share: PropertyShareRecord) => {
    setRegeneratingId(share.id);
    try {
      const allProperties = await getAllProperties();
      const byId = new Map(allProperties.map((p) => [p.id, p]));
      const missing = share.propertyIds.filter((id) => !byId.has(id));
      if (missing.length > 0) {
        toast(`${missing.length} of ${share.propertyIds.length} properties from this share no longer exist — regenerating with the rest.`, { icon: '⚠️' });
      }
      const orderedProperties = share.propertyIds.map((id) => byId.get(id)).filter((p): p is NonNullable<typeof p> => !!p);
      if (orderedProperties.length === 0) {
        toast.error('None of the properties in this share still exist.');
        setRegeneratingId(null);
        return;
      }

      const officeDefault = BUSINESS_PHONE.replace(/\D/g, '');
      const rows = orderedProperties.map((p) => toClientFacingRow(p, resolveContactNumber(p.agentPhone, officeDefault)));
      const distinctNumbers = new Set(rows.map((r) => r.contactNumber));
      const showContactNumber = distinctNumbers.size > 1;
      const footerPhone = showContactNumber ? officeDefault : [...distinctNumbers][0] ?? officeDefault;
      const pageWidthPx = share.config.layout === 'portrait' ? A4_PORTRAIT_WIDTH_PX : A4_LANDSCAPE_WIDTH_PX;
      const flow = buildFlowItems(rows, share.config.layout, share.config.groupByBhk, pageWidthPx);
      const pages = paginateFlowItems(flow, share.config.layout, true);

      setPendingDoc({
        pages,
        layout: share.config.layout,
        title: share.pdfFilename.replace(/\.pdf$/i, '').replace(/_/g, ' '),
        date: new Date(share.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        cover: { clientName: share.clientName, customMessage: share.config.customMessage, propertyCount: orderedProperties.length },
        showContactNumber,
        showPrices: share.config.showPrices,
        footerPhone,
        filename: share.pdfFilename,
      });
    } catch (error) {
      console.error('Re-download prep failed:', error);
      toast.error('Could not prepare the PDF for re-download.');
      setRegeneratingId(null);
    }
  };

  if (shares === null) return null;
  if (shares.length === 0) return null;

  return (
    <div className="rounded-xl border p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <History size={14} /> Recent shares
      </div>
      <div className="divide-y">
        {shares.map((share) => (
          <div key={share.id} className="flex items-center justify-between gap-3 py-2 text-sm">
            <div className="min-w-0 flex-1">
              <span className="font-medium">{share.clientName ? titleCase(share.clientName) : 'No client name'}</span>
              <span className="text-muted-foreground"> &middot; {share.propertyIds.length} propert{share.propertyIds.length === 1 ? 'y' : 'ies'} &middot; {new Date(share.createdAt).toLocaleDateString('en-IN')}</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleRedownload(share)} disabled={regeneratingId === share.id}>
              <Download size={13} /> {regeneratingId === share.id ? 'Preparing...' : 'Re-download'}
            </Button>
          </div>
        ))}
      </div>

      {/* Off-screen — only exists long enough to be captured by renderNodeToPdf. */}
      {pendingDoc && (
        <div style={{ position: 'fixed', top: -99999, left: -99999 }}>
          <div ref={hiddenRef}>
            <PropertyShareDocument
              pages={pendingDoc.pages}
              layout={pendingDoc.layout}
              title={pendingDoc.title}
              date={pendingDoc.date}
              cover={pendingDoc.cover}
              showContactNumber={pendingDoc.showContactNumber}
              showPrices={pendingDoc.showPrices}
              footerPhone={pendingDoc.footerPhone}
            />
          </div>
        </div>
      )}
    </div>
  );
};
