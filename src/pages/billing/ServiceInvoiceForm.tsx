import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, ArrowLeft, Download, Loader2, Plus, Receipt, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { ServiceInvoiceTemplate, ServiceTemplateData } from '../../app/components/billing/templates/ServiceInvoiceTemplate';
import { calculateService } from '../../utils/billingCalculations';
import { SERVICE_DEFAULTS } from '../../utils/billingDefaults';
import { createBillingDoc, getNextDocNumber, uploadBillingDocPdf } from '../../services/storageService';
import { renderNodeToPdf } from '../../utils/pdfExport';
import { ServiceDoc } from '../../types';
import { inputClass, labelClass, sectionTitleClass } from './formStyles';

type Draft = Omit<ServiceTemplateData, 'docNumber' | 'computed'>;

const buildInitialDraft = (): Draft => ({
  docType: 'service',
  customerName: '',
  customerAddress: '',
  lineItems: [{ description: '', amount: 0 }],
  gstEnabled: false,
  cgstPct: SERVICE_DEFAULTS.cgstPct,
  sgstPct: SERVICE_DEFAULTS.sgstPct,
  docDate: new Date().toISOString().slice(0, 10),
});

interface ServiceInvoiceFormProps {
  onBack: () => void;
  onSaved: () => void;
}

export const ServiceInvoiceForm: React.FC<ServiceInvoiceFormProps> = ({ onBack, onSaved }) => {
  const [draft, setDraft] = useState<Draft>(buildInitialDraft());
  const [docNumber, setDocNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedDoc, setSavedDoc] = useState<ServiceDoc | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const updateLineItem = (index: number, field: 'description' | 'amount', value: string | number) => {
    setDraft((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  };

  const addLineItem = () =>
    setDraft((prev) => ({ ...prev, lineItems: [...prev.lineItems, { description: '', amount: 0 }] }));

  const removeLineItem = (index: number) =>
    setDraft((prev) => ({ ...prev, lineItems: prev.lineItems.filter((_, i) => i !== index) }));

  const computed = calculateService(draft);
  const previewData: ServiceTemplateData = {
    ...draft,
    docNumber: savedDoc?.docNumber || docNumber || 'NN-SERV-—',
    computed,
  };

  const showGstMismatchWarning = draft.gstEnabled && draft.cgstPct !== draft.sgstPct;

  const isValid =
    draft.customerName.trim() &&
    draft.customerAddress.trim() &&
    draft.lineItems.some((item) => item.description.trim() && item.amount > 0);

  const locked = !!savedDoc;

  const handleSave = async () => {
    if (!isValid || !previewRef.current) return;
    setSaving(true);
    try {
      const nextNumber = await getNextDocNumber('service');
      setDocNumber(nextNumber);

      await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 50)));

      const pdfBlob = await renderNodeToPdf(previewRef.current);
      const pdfUrl = await uploadBillingDocPdf(pdfBlob, nextNumber);

      const doc = (await createBillingDoc({
        docType: 'service',
        docNumber: nextNumber,
        ...draft,
        computed,
        pdfUrl,
      })) as ServiceDoc;

      setSavedDoc(doc);
      toast.success(`${nextNumber} saved`);
      onSaved();
    } catch (error) {
      console.error('Error saving service invoice:', error);
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
              <div className={sectionTitleClass}>Customer</div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className={labelClass}>Customer Name</label>
                  <input className={inputClass} value={draft.customerName} onChange={(e) => update('customerName', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Customer Address</label>
                  <textarea className={inputClass} rows={2} value={draft.customerAddress} onChange={(e) => update('customerAddress', e.target.value)} />
                </div>
              </div>
            </div>

            <div>
              <div className={sectionTitleClass}>Line Items</div>
              <div className="space-y-2">
                {draft.lineItems.map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <input
                      className={inputClass}
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                    />
                    <input
                      type="number"
                      className={`${inputClass} w-32`}
                      placeholder="₹"
                      value={item.amount || ''}
                      onChange={(e) => updateLineItem(index, 'amount', Number(e.target.value))}
                    />
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      disabled={draft.lineItems.length === 1}
                      className="mt-1 rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addLineItem} className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark">
                  <Plus size={16} /> Add item
                </button>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
                <input type="checkbox" checked={draft.gstEnabled} onChange={(e) => update('gstEnabled', e.target.checked)} />
                Apply GST
              </label>
              {draft.gstEnabled && (
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>CGST %</label>
                    <input type="number" step="0.1" className={inputClass} value={draft.cgstPct} onChange={(e) => update('cgstPct', Number(e.target.value))} />
                  </div>
                  <div>
                    <label className={labelClass}>SGST %</label>
                    <input type="number" step="0.1" className={inputClass} value={draft.sgstPct} onChange={(e) => update('sgstPct', Number(e.target.value))} />
                  </div>
                </div>
              )}
              {showGstMismatchWarning && (
                <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>CGST and SGST are usually equal. Double-check before generating.</span>
                </div>
              )}
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
          <div className="overflow-x-auto rounded-xl bg-white p-4 shadow-sm">
            <div ref={previewRef}>
              <ServiceInvoiceTemplate doc={previewData} />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
