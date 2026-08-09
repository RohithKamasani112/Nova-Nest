import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, ArrowLeft, Download, Loader2, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  CommissionInvoiceTemplate,
  CommissionTemplateData,
} from '../../app/components/billing/templates/CommissionInvoiceTemplate';
import { calculateCommission } from '../../utils/billingCalculations';
import { COMMISSION_DEFAULTS, gstFieldDefaults, SAC_CODE_DEFAULTS } from '../../utils/billingDefaults';
import { createBillingDoc, getNextDocNumber, uploadBillingDocPdf } from '../../services/storageService';
import { renderNodeToPdf } from '../../utils/pdfExport';
import { CommissionDoc } from '../../types';
import { inputClass, labelClass, sectionTitleClass } from './formStyles';
import { GstModeToggle } from './GstModeToggle';
import { GstFieldsSection } from './GstFieldsSection';
import { captureUnscaled, DocumentPreview } from './DocumentPreview';

type Draft = Omit<CommissionTemplateData, 'docNumber' | 'computed'>;

const buildInitialDraft = (transactionType: 'sale' | 'rental'): Draft => ({
  docType: 'commission',
  transactionType,
  clientName: '',
  clientAddress: '',
  clientEmail: '',
  clientMobile: '',
  propertyAddress: '',
  taxableAmount: 0,
  ...gstFieldDefaults(SAC_CODE_DEFAULTS.commission),
  cgstPct: COMMISSION_DEFAULTS.cgstPct,
  sgstPct: COMMISSION_DEFAULTS.sgstPct,
  paymentTerms: COMMISSION_DEFAULTS.paymentTerms,
  docDate: new Date().toISOString().slice(0, 10),
});

interface CommissionInvoiceFormProps {
  initialTransactionType: 'sale' | 'rental';
  onBack: () => void;
  onSaved: () => void;
}

export const CommissionInvoiceForm: React.FC<CommissionInvoiceFormProps> = ({
  initialTransactionType,
  onBack,
  onSaved,
}) => {
  const [draft, setDraft] = useState<Draft>(buildInitialDraft(initialTransactionType));
  const [docNumber, setDocNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedDoc, setSavedDoc] = useState<CommissionDoc | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const computed = calculateCommission(draft);
  const previewData: CommissionTemplateData = {
    ...draft,
    docNumber: savedDoc?.docNumber || docNumber || 'NN-COMM-—',
    computed,
  };

  const isRental = draft.transactionType === 'rental';
  const showGstMismatchWarning = draft.gstApplicable && draft.cgstPct !== draft.sgstPct;

  const isValid =
    draft.clientName.trim() &&
    draft.clientAddress.trim() &&
    draft.propertyAddress.trim() &&
    draft.taxableAmount > 0;

  const locked = !!savedDoc;

  const handleSave = async () => {
    if (!isValid || !previewRef.current) return;
    setSaving(true);
    try {
      const nextNumber = await getNextDocNumber('commission');
      setDocNumber(nextNumber);

      await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 50)));

      const pdfBlob = await captureUnscaled(previewRef.current, () => renderNodeToPdf(previewRef.current!));
      const pdfUrl = await uploadBillingDocPdf(pdfBlob, nextNumber);

      const doc = (await createBillingDoc({
        ...draft,
        docNumber: nextNumber,
        computed,
        pdfUrl,
      })) as CommissionDoc;

      setSavedDoc(doc);
      toast.success(`${nextNumber} saved`);
      onSaved();
    } catch (error) {
      console.error('Error saving commission invoice:', error);
      toast.error('Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const handleNew = () => {
    setSavedDoc(null);
    setDocNumber('');
    setDraft(buildInitialDraft(initialTransactionType));
  };

  return (
    <div>
      <button onClick={onBack} className="mb-4 flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900">
        <ArrowLeft size={16} /> Back to service types
      </button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6"
        >
          <fieldset disabled={locked} className="space-y-5 disabled:opacity-60">
            <GstModeToggle value={draft.gstApplicable} onChange={(v) => update('gstApplicable', v)} />

            <div>
              <label className={labelClass}>Transaction Type</label>
              <select
                className={inputClass}
                value={draft.transactionType}
                onChange={(e) => update('transactionType', e.target.value as 'sale' | 'rental')}
              >
                <option value="sale">Sale</option>
                <option value="rental">Rental</option>
              </select>
            </div>

            <div>
              <div className={sectionTitleClass}>{isRental ? 'Tenant' : 'Client'}</div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className={labelClass}>{isRental ? 'Tenant Name' : 'Client Name'}</label>
                  <input className={inputClass} value={draft.clientName} onChange={(e) => update('clientName', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>{isRental ? 'Tenant Address' : 'Client Address'}</label>
                  <textarea className={inputClass} rows={2} value={draft.clientAddress} onChange={(e) => update('clientAddress', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>{isRental ? 'Tenant Email' : 'Client Email'} (optional)</label>
                    <input type="email" className={inputClass} value={draft.clientEmail} onChange={(e) => update('clientEmail', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>{isRental ? 'Tenant Mobile' : 'Client Mobile'} (optional)</label>
                    <input type="tel" className={inputClass} value={draft.clientMobile} onChange={(e) => update('clientMobile', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>Property Address</label>
              <textarea className={inputClass} rows={2} value={draft.propertyAddress} onChange={(e) => update('propertyAddress', e.target.value)} />
            </div>

            <div>
              <div className={sectionTitleClass}>Charges</div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelClass}>Taxable / Brokerage Amount (₹)</label>
                  <input type="number" className={inputClass} value={draft.taxableAmount || ''} onChange={(e) => update('taxableAmount', Number(e.target.value))} />
                </div>
                {draft.gstApplicable && (
                  <>
                    <div>
                      <label className={labelClass}>CGST %</label>
                      <input type="number" step="0.1" className={inputClass} value={draft.cgstPct} onChange={(e) => update('cgstPct', Number(e.target.value))} />
                    </div>
                    <div>
                      <label className={labelClass}>SGST %</label>
                      <input type="number" step="0.1" className={inputClass} value={draft.sgstPct} onChange={(e) => update('sgstPct', Number(e.target.value))} />
                    </div>
                  </>
                )}
              </div>
              {showGstMismatchWarning && (
                <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>CGST and SGST are usually equal. Double-check before generating.</span>
                </div>
              )}
            </div>

            {draft.gstApplicable && (
              <GstFieldsSection value={draft} onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))} />
            )}

            <div>
              <label className={labelClass}>Payment Split Terms</label>
              <textarea className={inputClass} rows={2} value={draft.paymentTerms} onChange={(e) => update('paymentTerms', e.target.value)} />
            </div>

            <div>
              <label className={labelClass}>Invoice Date</label>
              <input type="date" className={inputClass} value={draft.docDate} onChange={(e) => update('docDate', e.target.value)} />
            </div>
          </fieldset>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {!savedDoc ? (
              <button
                onClick={handleSave}
                disabled={!isValid || saving}
                className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Receipt size={18} />}
                {saving ? 'Saving…' : 'Save & Generate'}
              </button>
            ) : (
              <>
                <a
                  href={savedDoc.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-dark"
                >
                  <Download size={18} /> Download PDF
                </a>
                <button onClick={handleNew} className="min-h-[44px] rounded-xl border border-gray-300 px-6 py-3 font-semibold text-text-primary transition-colors hover:bg-gray-50">
                  New Document
                </button>
              </>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-gray-100 bg-gray-50 p-4 shadow-sm sm:p-6"
        >
          <div className="mb-3 text-sm font-semibold text-text-primary">{locked ? 'Saved Document' : 'Live Preview'}</div>
          <DocumentPreview contentRef={previewRef}>
            <CommissionInvoiceTemplate doc={previewData} />
          </DocumentPreview>
        </motion.div>
      </div>
    </div>
  );
};
