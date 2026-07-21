import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, ArrowLeft, Download, Loader2, Plus, Receipt, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { SaleBookingTemplate, SaleBookingTemplateData } from '../../app/components/billing/templates/SaleBookingTemplate';
import { INDIA_TDS_THRESHOLD, calculateSaleBooking, formatINR } from '../../utils/billingCalculations';
import { DEFAULT_SALE_BOOKING_TERMS, SALE_BOOKING_DEFAULTS } from '../../utils/billingDefaults';
import { createBillingDoc, getNextDocNumber, uploadBillingDocPdf } from '../../services/storageService';
import { renderNodeToPdf } from '../../utils/pdfExport';
import { SaleBookingDoc } from '../../types';
import { inputClass, labelClass, sectionTitleClass } from './formStyles';

type Draft = Omit<SaleBookingTemplateData, 'docNumber' | 'computed'>;

const buildInitialDraft = (): Draft => ({
  docType: 'sale_booking',
  purchaserName: '',
  purchaserAddress: '',
  projectName: '',
  unitNo: '',
  totalSalePrice: 0,
  tokenAmount: 0,
  saleAgreementAmount: 0,
  milestonePct: SALE_BOOKING_DEFAULTS.milestonePct,
  tdsEnabled: true,
  tdsPct: SALE_BOOKING_DEFAULTS.tdsPct,
  commissionPct: SALE_BOOKING_DEFAULTS.commissionPct,
  commissionGstPct: SALE_BOOKING_DEFAULTS.commissionGstPct,
  stampDutyPct: SALE_BOOKING_DEFAULTS.stampDutyPct,
  saleAgreementChargesPct: SALE_BOOKING_DEFAULTS.saleAgreementChargesPct,
  additionalFee: SALE_BOOKING_DEFAULTS.additionalFee,
  registrationChargesPct: SALE_BOOKING_DEFAULTS.registrationChargesPct,
  registrationIncidentCharges: 0,
  termsAndConditions: [...DEFAULT_SALE_BOOKING_TERMS],
  docDate: new Date().toISOString().slice(0, 10),
  place: SALE_BOOKING_DEFAULTS.place,
});

interface SaleBookingFormProps {
  onBack: () => void;
  onSaved: () => void;
}

export const SaleBookingForm: React.FC<SaleBookingFormProps> = ({ onBack, onSaved }) => {
  const [draft, setDraft] = useState<Draft>(buildInitialDraft());
  const [docNumber, setDocNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedDoc, setSavedDoc] = useState<SaleBookingDoc | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const updateTerm = (index: number, value: string) => {
    setDraft((prev) => ({
      ...prev,
      termsAndConditions: prev.termsAndConditions.map((term, i) => (i === index ? value : term)),
    }));
  };

  const addTerm = () => setDraft((prev) => ({ ...prev, termsAndConditions: [...prev.termsAndConditions, ''] }));
  const removeTerm = (index: number) =>
    setDraft((prev) => ({
      ...prev,
      termsAndConditions: prev.termsAndConditions.filter((_, i) => i !== index),
    }));

  const computed = calculateSaleBooking(draft);
  const previewData: SaleBookingTemplateData = {
    ...draft,
    docNumber: savedDoc?.docNumber || docNumber || 'NN-SALE-—',
    computed,
  };

  const showTdsWarning = draft.tdsEnabled && draft.totalSalePrice > 0 && draft.totalSalePrice < INDIA_TDS_THRESHOLD;

  const isValid =
    draft.purchaserName.trim() &&
    draft.purchaserAddress.trim() &&
    draft.projectName.trim() &&
    draft.unitNo.trim() &&
    draft.totalSalePrice > 0;

  const locked = !!savedDoc;

  const handleSave = async () => {
    if (!isValid || !previewRef.current) return;
    setSaving(true);
    try {
      const nextNumber = await getNextDocNumber('sale_booking');
      setDocNumber(nextNumber);

      // Wait a tick so the preview re-renders with the real doc number before
      // it gets rasterized into the PDF.
      await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 50)));

      const pdfBlob = await renderNodeToPdf(previewRef.current);
      const pdfUrl = await uploadBillingDocPdf(pdfBlob, nextNumber);

      const doc = (await createBillingDoc({
        docType: 'sale_booking',
        docNumber: nextNumber,
        ...draft,
        computed,
        pdfUrl,
      })) as SaleBookingDoc;

      setSavedDoc(doc);
      toast.success(`${nextNumber} saved`);
      onSaved();
    } catch (error) {
      console.error('Error saving sale booking confirmation:', error);
      toast.error('Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const handleNew = () => {
    setSavedDoc(null);
    setDocNumber('');
    setDraft(buildInitialDraft());
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
            <div>
              <div className={sectionTitleClass}>Purchaser</div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className={labelClass}>Purchaser Name</label>
                  <input className={inputClass} value={draft.purchaserName} onChange={(e) => update('purchaserName', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Purchaser Address</label>
                  <textarea className={inputClass} rows={2} value={draft.purchaserAddress} onChange={(e) => update('purchaserAddress', e.target.value)} />
                </div>
              </div>
            </div>

            <div>
              <div className={sectionTitleClass}>Property</div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Project Name</label>
                  <input className={inputClass} value={draft.projectName} onChange={(e) => update('projectName', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Unit No.</label>
                  <input className={inputClass} value={draft.unitNo} onChange={(e) => update('unitNo', e.target.value)} />
                </div>
              </div>
            </div>

            <div>
              <div className={sectionTitleClass}>Payment</div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Total Sale Price (₹)</label>
                  <input type="number" className={inputClass} value={draft.totalSalePrice || ''} onChange={(e) => update('totalSalePrice', Number(e.target.value))} />
                </div>
                <div>
                  <label className={labelClass}>Token Amount Received (₹)</label>
                  <input type="number" className={inputClass} value={draft.tokenAmount || ''} onChange={(e) => update('tokenAmount', Number(e.target.value))} />
                </div>
                <div>
                  <label className={labelClass}>Sale Agreement Amount (₹)</label>
                  <input type="number" className={inputClass} value={draft.saleAgreementAmount || ''} onChange={(e) => update('saleAgreementAmount', Number(e.target.value))} placeholder={`Suggested: ${formatINR((draft.totalSalePrice * SALE_BOOKING_DEFAULTS.saleAgreementAmountPctOfTotal) / 100)}`} />
                </div>
                <div>
                  <label className={labelClass}>Milestone Payment %</label>
                  <input type="number" step="0.1" className={inputClass} value={draft.milestonePct} onChange={(e) => update('milestonePct', Number(e.target.value))} />
                </div>
              </div>
            </div>

            <div>
              <div className={sectionTitleClass}>TDS</div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
                  <input type="checkbox" checked={draft.tdsEnabled} onChange={(e) => update('tdsEnabled', e.target.checked)} />
                  Apply TDS
                </label>
                <input
                  type="number"
                  step="0.1"
                  className={`${inputClass} w-28`}
                  value={draft.tdsPct}
                  disabled={!draft.tdsEnabled}
                  onChange={(e) => update('tdsPct', Number(e.target.value))}
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
              {showTdsWarning && (
                <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>
                    TDS is enabled but Total Sale Price is below ₹50,00,000, where 1% TDS normally applies. Double-check
                    before generating.
                  </span>
                </div>
              )}
            </div>

            <div>
              <div className={sectionTitleClass}>Commission</div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Commission %</label>
                  <input type="number" step="0.1" className={inputClass} value={draft.commissionPct} onChange={(e) => update('commissionPct', Number(e.target.value))} />
                </div>
                <div>
                  <label className={labelClass}>Commission GST %</label>
                  <input type="number" step="0.1" className={inputClass} value={draft.commissionGstPct} onChange={(e) => update('commissionGstPct', Number(e.target.value))} />
                </div>
              </div>
            </div>

            <div>
              <div className={sectionTitleClass}>Government Charges</div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Stamp Duty %</label>
                  <input type="number" step="0.1" className={inputClass} value={draft.stampDutyPct} onChange={(e) => update('stampDutyPct', Number(e.target.value))} />
                </div>
                <div>
                  <label className={labelClass}>Sale Agreement Charges %</label>
                  <input type="number" step="0.1" className={inputClass} value={draft.saleAgreementChargesPct} onChange={(e) => update('saleAgreementChargesPct', Number(e.target.value))} />
                </div>
                <div>
                  <label className={labelClass}>Additional Fee (₹)</label>
                  <input type="number" className={inputClass} value={draft.additionalFee} onChange={(e) => update('additionalFee', Number(e.target.value))} />
                </div>
                <div>
                  <label className={labelClass}>Registration Charges %</label>
                  <input type="number" step="0.1" className={inputClass} value={draft.registrationChargesPct} onChange={(e) => update('registrationChargesPct', Number(e.target.value))} />
                </div>
                <div>
                  <label className={labelClass}>Registration Incident Charges (₹)</label>
                  <input type="number" className={inputClass} value={draft.registrationIncidentCharges} onChange={(e) => update('registrationIncidentCharges', Number(e.target.value))} />
                </div>
              </div>
            </div>

            <div>
              <div className={sectionTitleClass}>Terms &amp; Conditions</div>
              <div className="space-y-2">
                {draft.termsAndConditions.map((term, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="mt-3 text-sm text-gray-400">{index + 1}.</span>
                    <textarea className={inputClass} rows={2} value={term} onChange={(e) => updateTerm(index, e.target.value)} />
                    <button type="button" onClick={() => removeTerm(index)} className="mt-2 rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addTerm} className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark">
                  <Plus size={16} /> Add clause
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Date</label>
                <input type="date" className={inputClass} value={draft.docDate} onChange={(e) => update('docDate', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Place</label>
                <input className={inputClass} value={draft.place} onChange={(e) => update('place', e.target.value)} />
              </div>
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
          <div className="overflow-x-auto rounded-xl bg-white p-4 shadow-sm">
            <div ref={previewRef}>
              <SaleBookingTemplate doc={previewData} />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
