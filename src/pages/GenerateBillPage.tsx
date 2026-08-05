import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Download, X } from 'lucide-react';
import { Bill, BillingDoc } from '../types';
import { getAllBillingDocs, getAllBills } from '../services/storageService';
import { ServiceTile, ServiceTypePicker } from './billing/ServiceTypePicker';
import { SaleBookingForm } from './billing/SaleBookingForm';
import { CommissionInvoiceForm } from './billing/CommissionInvoiceForm';
import { ServiceInvoiceForm } from './billing/ServiceInvoiceForm';
import { TokenReceiptForm } from './billing/TokenReceiptForm';
import { inputClass, labelClass } from './billing/formStyles';

const DOC_TYPE_LABEL: Record<BillingDoc['docType'], string> = {
  sale_booking: 'Sale Booking',
  commission: 'Commission Invoice',
  service: 'Service Invoice',
};

// Unified shape for the merged history table — lets a new BillingDoc and a
// legacy Bill sit in one date-sorted, date-filterable list instead of two
// separately-sorted blocks (which would otherwise put every new document
// ahead of every legacy one regardless of actual date).
interface HistoryRow {
  key: string;
  number: string;
  typeLabel: string;
  createdAt: string;
  pdfUrl: string;
  legacy: boolean;
}

export const GenerateBillPage: React.FC = () => {
  const [activeTile, setActiveTile] = useState<ServiceTile | null>(null);
  const [docs, setDocs] = useState<BillingDoc[]>([]);
  const [legacyBills, setLegacyBills] = useState<Bill[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const [billingDocs, bills] = await Promise.all([getAllBillingDocs(), getAllBills()]);
      setDocs(billingDocs);
      setLegacyBills(bills);
    } catch (error) {
      console.error('Error loading billing history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleBack = () => setActiveTile(null);
  const handleSaved = () => {
    void loadHistory();
  };

  const historyRows: HistoryRow[] = useMemo(() => {
    const docRows: HistoryRow[] = docs.map((doc) => ({
      key: doc.id,
      number: doc.docNumber,
      typeLabel: DOC_TYPE_LABEL[doc.docType],
      createdAt: doc.createdAt,
      pdfUrl: doc.pdfUrl,
      legacy: false,
    }));
    const legacyRows: HistoryRow[] = legacyBills.map((bill) => ({
      key: bill.id,
      number: bill.receiptNo,
      typeLabel: 'Legacy Receipt',
      createdAt: bill.createdAt,
      pdfUrl: bill.pdfUrl,
      legacy: true,
    }));
    return [...docRows, ...legacyRows].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [docs, legacyBills]);

  // createdAt is an ISO timestamp ("2026-07-21T..."), so plain string
  // comparison against a "yyyy-mm-dd" date-input value works directly.
  const filteredRows = useMemo(
    () =>
      historyRows.filter((row) => {
        const rowDate = row.createdAt.slice(0, 10);
        if (dateFrom && rowDate < dateFrom) return false;
        if (dateTo && rowDate > dateTo) return false;
        return true;
      }),
    [historyRows, dateFrom, dateTo]
  );

  const hasDateFilter = !!(dateFrom || dateTo);
  const clearDateFilter = () => {
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="max-w-7xl">
      <div className="mb-6 flex flex-col gap-1 sm:mb-8">
        <h1 className="font-['Playfair_Display'] text-2xl font-bold text-gray-900 sm:text-3xl">Generate Bill</h1>
        <p className="text-sm text-gray-600 sm:text-base">
          Create a Property Sale Booking Confirmation, Sale/Rental Commission GST Invoice, or Home Maintenance
          Service Invoice.
        </p>
      </div>

      {!activeTile && <ServiceTypePicker onSelect={setActiveTile} />}

      {activeTile === 'sale_booking' && <SaleBookingForm onBack={handleBack} onSaved={handleSaved} />}
      {activeTile === 'commission_sale' && (
        <CommissionInvoiceForm initialTransactionType="sale" onBack={handleBack} onSaved={handleSaved} />
      )}
      {activeTile === 'commission_rental' && (
        <CommissionInvoiceForm initialTransactionType="rental" onBack={handleBack} onSaved={handleSaved} />
      )}
      {activeTile === 'service' && <ServiceInvoiceForm onBack={handleBack} onSaved={handleSaved} />}
      {activeTile === 'token_receipt' && <TokenReceiptForm onBack={handleBack} />}

      {/* Past Documents history — merges the new billing generator's records
          with any pre-existing legacy receipts, so nothing already generated
          becomes inaccessible after the upgrade. Legacy rows are read-only
          (download only); no create/regenerate action exists for that format
          anymore. */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6"
      >
        <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <h2 className="text-lg font-bold text-gray-900">Past Documents</h2>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className={labelClass}>From</label>
              <input
                type="date"
                className={`${inputClass} py-2`}
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>To</label>
              <input
                type="date"
                className={`${inputClass} py-2`}
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            {hasDateFilter && (
              <button
                type="button"
                onClick={clearDateFilter}
                className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                <X size={14} /> Clear
              </button>
            )}
          </div>
        </div>

        {loadingHistory ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : historyRows.length === 0 ? (
          <p className="py-8 text-center text-gray-600">No documents generated yet</p>
        ) : filteredRows.length === 0 ? (
          <p className="py-8 text-center text-gray-600">No documents in this date range</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                  <th className="py-2 pr-4 font-medium">Doc Number</th>
                  <th className="py-2 pr-4 font-medium">Type</th>
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.key} className={`border-b border-gray-100 last:border-0 ${row.legacy ? 'opacity-70' : ''}`}>
                    <td className="py-3 pr-4 font-medium text-gray-900">{row.number}</td>
                    <td className="py-3 pr-4 text-gray-700">{row.typeLabel}</td>
                    <td className="py-3 pr-4 text-gray-700">{new Date(row.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={row.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors hover:bg-primary/20"
                          aria-label={`Download ${row.number}`}
                        >
                          <Download size={16} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};
