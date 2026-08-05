import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { AlertTriangle, ArrowLeft, Copy, Download, MessageCircle, Printer, Trash2 } from 'lucide-react';
import { TokenReceiptTemplate } from '../../app/components/billing/templates/TokenReceiptTemplate';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../app/components/ui/tooltip';
import { renderNodeToPdf } from '../../utils/pdfExport';
import { amountInWords } from '../../utils/numberToWords';
import { formatINRSlash, resolveBalanceDue, resolveBrokerageBalance, resolveDepositDue } from '../../utils/tokenReceiptCalculations';
import {
  MaintenanceTerm,
  MAINTENANCE_TERM_LABELS,
  PaymentMode,
  PAYMENT_MODE_LABELS,
  TokenReceiptDraft,
  TokenReceiptKind,
} from '../../utils/tokenReceiptTypes';
import { FieldIssue, validateTokenReceipt, warnTokenReceipt } from '../../utils/tokenReceiptValidation';
import {
  clearDraftStorage,
  commitReceiptCode,
  getNextReceiptCode,
  loadDraft,
  loadLastReceipt,
  saveDraft,
  saveLastReceipt,
} from '../../utils/tokenReceiptStorage';
import { inputClass, labelClass, sectionTitleClass } from './formStyles';
import { captureUnscaled, DocumentPreview } from './DocumentPreview';

const buildInitialDraft = (type: TokenReceiptKind = 'rent'): TokenReceiptDraft => ({
  type,
  serialNo: '1',
  receiptCode: getNextReceiptCode(),
  date: new Date().toISOString().slice(0, 10),
  clientName: '',
  contactNumber: '',
  email: '',
  propertyName: '',
  unitNo: '',
  bookingAmount: 0,
  ownerName: '',
  ownerContact: '',
  brokerageAmount: 0,
  brokerageReceived: 0,
  brokerageBalanceOverride: null,
  executiveName: '',
  executiveContact: '',
  paymentMode: 'cash',
  referenceNo: '',
  monthlyRent: 0,
  maintenanceTerm: 'excluding',
  deposit: 0,
  depositDueOverride: null,
  possessionDate: '',
  saleConsideration: 0,
  balanceDueOverride: null,
  agreementDate: '',
  registrationDate: '',
});

function FieldError({ issues, field }: { issues: FieldIssue[]; field: string }) {
  const issue = issues.find((i) => i.field === field);
  if (!issue) return null;
  return <p className="mt-1 text-xs text-red-600">{issue.message}</p>;
}

interface OverridableFieldProps {
  label: string;
  computed: number;
  overrideValue: number | null;
  onOverrideChange: (v: number | null) => void;
}

const OverridableField: React.FC<OverridableFieldProps> = ({ label, computed, overrideValue, onOverrideChange }) => {
  const isOverridden = overrideValue !== null;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className={labelClass}>{label}</label>
        <label className="flex items-center gap-1.5 text-xs text-gray-500">
          <input
            type="checkbox"
            checked={isOverridden}
            onChange={(e) => onOverrideChange(e.target.checked ? computed : null)}
          />
          Override
        </label>
      </div>
      <input
        type="number"
        className={inputClass}
        value={isOverridden ? overrideValue : computed}
        disabled={!isOverridden}
        onChange={(e) => onOverrideChange(Number(e.target.value))}
      />
    </div>
  );
};

interface TokenReceiptFormProps {
  onBack: () => void;
}

export const TokenReceiptForm: React.FC<TokenReceiptFormProps> = ({ onBack }) => {
  const [draft, setDraft] = useState<TokenReceiptDraft>(() => {
    const stored = loadDraft();
    return stored ? { ...buildInitialDraft(stored.type ?? 'rent'), ...stored } : buildInitialDraft();
  });
  const [touched, setTouched] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const update = <K extends keyof TokenReceiptDraft>(key: K, value: TokenReceiptDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  const isSale = draft.type === 'sale';
  const clientLabel = isSale ? 'Buyer' : 'Tenant';
  const ownerLabel = isSale ? "Seller's" : "Owner's";

  const errors = validateTokenReceipt(draft);
  const warnings = warnTokenReceipt(draft);
  const isValid = errors.length === 0;
  const visibleIssues = touched ? errors : [];

  const depositDue = resolveDepositDue(draft);
  const balanceDue = resolveBalanceDue(draft);
  const brokerageBalance = resolveBrokerageBalance(draft);
  const wordsPreview = draft.bookingAmount ? amountInWords(draft.bookingAmount) : '';

  const requireValidBeforeAction = (actionLabel: string): boolean => {
    setTouched(true);
    if (!isValid) {
      toast.error(`Please fix the highlighted fields before ${actionLabel}.`);
      return false;
    }
    return true;
  };

  const handleDownload = async () => {
    if (!requireValidBeforeAction('downloading') || !previewRef.current) return;
    setDownloading(true);
    try {
      const pdfBlob = await captureUnscaled(previewRef.current, () => renderNodeToPdf(previewRef.current!));
      const url = URL.createObjectURL(pdfBlob);
      const safeName = draft.clientName.trim().replace(/\s+/g, '_') || 'Receipt';
      const a = document.createElement('a');
      a.href = url;
      a.download = `TokenReceipt_${draft.receiptCode}_${safeName}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      commitReceiptCode(draft.receiptCode);
      saveLastReceipt(draft);
      toast.success('Receipt downloaded.');
    } catch (error) {
      console.error('Token receipt PDF export failed:', error);
      toast.error('Could not generate the PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    if (!requireValidBeforeAction('printing')) return;
    window.print();
  };

  const handleWhatsApp = () => {
    if (!requireValidBeforeAction('sharing')) return;
    const digits = draft.contactNumber.replace(/\D/g, '');
    const phone = digits.length === 10 ? `91${digits}` : digits;
    const message = `Hi ${draft.clientName}, please find your token receipt (${draft.receiptCode}) for ${draft.propertyName}${
      draft.unitNo ? ` – ${draft.unitNo}` : ''
    }. Booking amount: ${formatINRSlash(draft.bookingAmount)}.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  const handleClear = () => {
    if (!window.confirm('Clear the form? This cannot be undone.')) return;
    clearDraftStorage();
    setDraft(buildInitialDraft(draft.type));
    setTouched(false);
  };

  const handleDuplicateLast = () => {
    const last = loadLastReceipt();
    if (!last) {
      toast.error('No previous receipt to duplicate yet.');
      return;
    }
    setDraft({
      ...last,
      receiptCode: getNextReceiptCode(),
      date: new Date().toISOString().slice(0, 10),
    });
    setTouched(false);
    toast.success('Loaded the previous receipt — review the details before downloading.');
  };

  return (
    <div>
      <button onClick={onBack} className="mb-4 flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 no-print">
        <ArrowLeft size={16} /> Back to service types
      </button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="no-print rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6"
        >
          <div className="mb-6 inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => update('type', 'rent')}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
                draft.type === 'rent' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Rent
            </button>
            <button
              type="button"
              onClick={() => update('type', 'sale')}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
                draft.type === 'sale' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sale
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <div className={sectionTitleClass}>Receipt</div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelClass}>Serial No</label>
                  <input className={inputClass} value={draft.serialNo} onChange={(e) => update('serialNo', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Receipt Code</label>
                  <input className={inputClass} value={draft.receiptCode} onChange={(e) => update('receiptCode', e.target.value)} />
                  <FieldError issues={visibleIssues} field="receiptCode" />
                </div>
                <div>
                  <label className={labelClass}>Date</label>
                  <input type="date" className={inputClass} value={draft.date} onChange={(e) => update('date', e.target.value)} />
                </div>
              </div>
              <p className="mt-1.5 text-xs text-gray-500">
                Auto-filled from the last downloaded receipt — check it against your records before printing, there's no
                server enforcing uniqueness.
              </p>
            </div>

            <div>
              <div className={sectionTitleClass}>{clientLabel}</div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className={labelClass}>{clientLabel} Name</label>
                  <input className={inputClass} value={draft.clientName} onChange={(e) => update('clientName', e.target.value)} />
                  <FieldError issues={visibleIssues} field="clientName" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Contact Number</label>
                    <input type="tel" className={inputClass} value={draft.contactNumber} onChange={(e) => update('contactNumber', e.target.value)} />
                    <FieldError issues={visibleIssues} field="contactNumber" />
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <input type="email" className={inputClass} value={draft.email} onChange={(e) => update('email', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className={sectionTitleClass}>Property</div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Property Name</label>
                  <input className={inputClass} value={draft.propertyName} onChange={(e) => update('propertyName', e.target.value)} />
                  <FieldError issues={visibleIssues} field="propertyName" />
                </div>
                <div>
                  <label className={labelClass}>Unit No.</label>
                  <input className={inputClass} value={draft.unitNo} onChange={(e) => update('unitNo', e.target.value)} />
                </div>
              </div>
            </div>

            <div>
              <div className={sectionTitleClass}>Booking Amount</div>
              <input
                type="number"
                className={inputClass}
                value={draft.bookingAmount || ''}
                onChange={(e) => update('bookingAmount', Number(e.target.value))}
              />
              <FieldError issues={visibleIssues} field="bookingAmount" />
              {wordsPreview && (
                <p className="mt-1.5 text-xs italic text-gray-600">
                  Rupees {wordsPreview.replace(/^Rupees /, '')}
                </p>
              )}
            </div>

            <div>
              <div className={sectionTitleClass}>{ownerLabel === "Seller's" ? "Seller" : 'Owner'}</div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>{ownerLabel} Name</label>
                  <input className={inputClass} value={draft.ownerName} onChange={(e) => update('ownerName', e.target.value)} />
                  <FieldError issues={visibleIssues} field="ownerName" />
                </div>
                <div>
                  <label className={labelClass}>{ownerLabel} Contact</label>
                  <input type="tel" className={inputClass} value={draft.ownerContact} onChange={(e) => update('ownerContact', e.target.value)} />
                </div>
              </div>
            </div>

            {isSale ? (
              <div>
                <div className={sectionTitleClass}>Sale Details</div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Total Sale Consideration (₹)</label>
                    <input
                      type="number"
                      className={inputClass}
                      value={draft.saleConsideration || ''}
                      onChange={(e) => update('saleConsideration', Number(e.target.value))}
                    />
                  </div>
                  <OverridableField
                    label="Balance Due (₹)"
                    computed={balanceDue}
                    overrideValue={draft.balanceDueOverride}
                    onOverrideChange={(v) => update('balanceDueOverride', v)}
                  />
                  <div>
                    <label className={labelClass}>Agreement Date</label>
                    <input type="date" className={inputClass} value={draft.agreementDate} onChange={(e) => update('agreementDate', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Registration Date</label>
                    <input type="date" className={inputClass} value={draft.registrationDate} onChange={(e) => update('registrationDate', e.target.value)} />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className={sectionTitleClass}>Rent Details</div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Monthly Rent (₹)</label>
                    <input
                      type="number"
                      className={inputClass}
                      value={draft.monthlyRent || ''}
                      onChange={(e) => update('monthlyRent', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Maintenance Terms</label>
                    <select
                      className={inputClass}
                      value={draft.maintenanceTerm}
                      onChange={(e) => update('maintenanceTerm', e.target.value as MaintenanceTerm)}
                    >
                      {Object.entries(MAINTENANCE_TERM_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Deposit (₹)</label>
                    <input type="number" className={inputClass} value={draft.deposit || ''} onChange={(e) => update('deposit', Number(e.target.value))} />
                  </div>
                  <OverridableField
                    label="Deposit Due (₹)"
                    computed={depositDue}
                    overrideValue={draft.depositDueOverride}
                    onOverrideChange={(v) => update('depositDueOverride', v)}
                  />
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Possession Date</label>
                    <input type="date" className={inputClass} value={draft.possessionDate} onChange={(e) => update('possessionDate', e.target.value)} />
                    <FieldError issues={warnings} field="possessionDate" />
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className={sectionTitleClass}>Brokerage</div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Brokerage Amount (₹)</label>
                  <input
                    type="number"
                    className={inputClass}
                    value={draft.brokerageAmount || ''}
                    onChange={(e) => update('brokerageAmount', Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className={labelClass}>Brokerage Received (₹)</label>
                  <input
                    type="number"
                    className={inputClass}
                    value={draft.brokerageReceived || ''}
                    onChange={(e) => update('brokerageReceived', Number(e.target.value))}
                  />
                  <FieldError issues={visibleIssues} field="brokerageReceived" />
                </div>
                <div className="sm:col-span-2">
                  <OverridableField
                    label="Brokerage Balance (₹)"
                    computed={brokerageBalance}
                    overrideValue={draft.brokerageBalanceOverride}
                    onOverrideChange={(v) => update('brokerageBalanceOverride', v)}
                  />
                </div>
              </div>
            </div>

            <div>
              <div className={sectionTitleClass}>Executive</div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Executive Name</label>
                  <input className={inputClass} value={draft.executiveName} onChange={(e) => update('executiveName', e.target.value)} />
                  <FieldError issues={visibleIssues} field="executiveName" />
                </div>
                <div>
                  <label className={labelClass}>Executive Contact</label>
                  <input type="tel" className={inputClass} value={draft.executiveContact} onChange={(e) => update('executiveContact', e.target.value)} />
                </div>
              </div>
            </div>

            <div>
              <div className={sectionTitleClass}>Payment</div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Payment Mode</label>
                  <select className={inputClass} value={draft.paymentMode} onChange={(e) => update('paymentMode', e.target.value as PaymentMode)}>
                    {Object.entries(PAYMENT_MODE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                {draft.paymentMode !== 'cash' && (
                  <div>
                    <label className={labelClass}>Reference No.</label>
                    <input className={inputClass} value={draft.referenceNo} onChange={(e) => update('referenceNo', e.target.value)} />
                    <FieldError issues={visibleIssues} field="referenceNo" />
                  </div>
                )}
              </div>
            </div>

            {touched && errors.length > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                <span>Fix the {errors.length} highlighted field{errors.length === 1 ? '' : 's'} above before continuing.</span>
              </div>
            )}
          </div>

          {/* Actions — sticky on mobile so they stay reachable while scrolling a long form. */}
          <div className="sticky bottom-0 -mx-4 mt-6 flex flex-wrap gap-2 border-t bg-white px-4 pb-4 pt-3 sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:pb-0 lg:pt-0">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={16} /> {downloading ? 'Generating…' : 'Download PDF'}
            </button>
            <button
              onClick={handlePrint}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-gray-50"
            >
              <Printer size={16} /> Print
            </button>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleWhatsApp}
                  className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-gray-50"
                >
                  <MessageCircle size={16} /> Share
                </button>
              </TooltipTrigger>
              <TooltipContent>Opens WhatsApp with a message — attach the downloaded PDF manually.</TooltipContent>
            </Tooltip>
            <button
              onClick={handleDuplicateLast}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-gray-50"
            >
              <Copy size={16} /> Duplicate last
            </button>
            <button
              onClick={handleClear}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              <Trash2 size={16} /> Clear
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-gray-100 bg-gray-50 p-4 shadow-sm sm:p-6"
        >
          <div className="no-print mb-3 text-sm font-semibold text-text-primary">Live Preview</div>
          <div id="token-receipt-print">
            <DocumentPreview contentRef={previewRef}>
              <TokenReceiptTemplate draft={draft} />
            </DocumentPreview>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
