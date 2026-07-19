import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Loader2, Download, MessageCircle, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
import { Bill } from '../types';
import {
  createBill,
  getAllBills,
  getNextReceiptNumber,
  uploadBillPdf,
} from '../services/storageService';
import { generateBillPdf } from '../utils/generateBillPdf';
import { BillLetterhead, BillLetterheadData } from '../app/components/BillLetterhead';

// Builds a wa.me deep link to the CLIENT's own number (not the business
// number) so sending the receipt opens a chat addressed to them. Assumes an
// Indian mobile number when no country code is present, matching how numbers
// are entered elsewhere in this admin (see ContactPage/AdminPage phone fields).
const buildWhatsappLink = (bill: Pick<Bill, 'clientName' | 'clientContact' | 'pdfUrl'>): string => {
  const digits = bill.clientContact.replace(/\D/g, '');
  const phone = digits.length === 10 ? `91${digits}` : digits;
  const message = `Hi ${bill.clientName}, here's your payment receipt from Nova Nest: ${bill.pdfUrl}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};

const inputClass =
  'w-full min-w-0 rounded-xl border border-gray-200 bg-white px-4 py-3 text-base outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 md:text-sm';
const labelClass = 'mb-1.5 block text-sm font-medium text-text-primary';

type DraftBill = BillLetterheadData;

const initialDraft: DraftBill = {
  receiptNo: '',
  clientName: '',
  clientContact: '',
  propertyTitle: '',
  propertyLocation: '',
  transactionType: 'sale',
  totalAmount: 0,
  amountPaid: 0,
  paymentMode: 'cash',
  paymentDate: new Date().toISOString().slice(0, 10),
  moveInDate: '',
  finalPaymentDueDate: '',
};

export const GenerateBillPage: React.FC = () => {
  const [draft, setDraft] = useState<DraftBill>(initialDraft);
  const [saving, setSaving] = useState(false);
  const [savedBill, setSavedBill] = useState<Bill | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [pastBills, setPastBills] = useState<Bill[]>([]);
  const [loadingBills, setLoadingBills] = useState(true);

  const loadBills = async () => {
    setLoadingBills(true);
    try {
      const bills = await getAllBills();
      setPastBills([...bills].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    } catch (error) {
      console.error('Error loading bills:', error);
    } finally {
      setLoadingBills(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, []);

  const remaining = (draft.totalAmount || 0) - (draft.amountPaid || 0);

  const update = <K extends keyof DraftBill>(key: K, value: DraftBill[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const isValid =
    draft.clientName.trim() &&
    draft.clientContact.trim() &&
    draft.propertyTitle.trim() &&
    draft.propertyLocation.trim() &&
    draft.totalAmount > 0;

  const handleSave = async () => {
    if (!isValid || !previewRef.current) return;
    setSaving(true);
    try {
      const receiptNo = await getNextReceiptNumber();
      const finalDraft: DraftBill = { ...draft, receiptNo };
      setDraft(finalDraft);

      // Wait a tick so the preview re-renders with the real receipt number
      // before it gets rasterized into the PDF.
      await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 50)));

      const pdfBlob = await generateBillPdf(previewRef.current);
      const pdfUrl = await uploadBillPdf(pdfBlob, receiptNo);

      const bill = await createBill({
        receiptNo,
        clientName: finalDraft.clientName,
        clientContact: finalDraft.clientContact,
        propertyTitle: finalDraft.propertyTitle,
        propertyLocation: finalDraft.propertyLocation,
        transactionType: finalDraft.transactionType,
        totalAmount: finalDraft.totalAmount,
        amountPaid: finalDraft.amountPaid,
        paymentMode: finalDraft.paymentMode,
        paymentDate: finalDraft.paymentDate,
        moveInDate: finalDraft.moveInDate || undefined,
        finalPaymentDueDate: finalDraft.finalPaymentDueDate || undefined,
        pdfUrl,
      });

      setSavedBill(bill);
      void loadBills();
      toast.success(`Bill ${receiptNo} saved`);
    } catch (error) {
      console.error('Error saving bill:', error);
      toast.error('Failed to save bill');
    } finally {
      setSaving(false);
    }
  };

  const handleNewBill = () => {
    setSavedBill(null);
    setDraft(initialDraft);
  };

  const whatsappHref = savedBill ? buildWhatsappLink(savedBill) : '#';

  const locked = !!savedBill;
  const previewData: DraftBill = savedBill ?? draft;

  return (
    <div className="max-w-7xl">
      <div className="mb-6 flex flex-col gap-1 sm:mb-8">
        <h1 className="font-['Playfair_Display'] text-2xl font-bold text-gray-900 sm:text-3xl">
          Generate Bill
        </h1>
        <p className="text-sm text-gray-600 sm:text-base">
          Create a standalone payment receipt — not linked to any property listing.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6"
        >
          <fieldset disabled={locked} className="space-y-5 disabled:opacity-60">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Client Full Name</label>
                <input
                  className={inputClass}
                  value={draft.clientName}
                  onChange={(e) => update('clientName', e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                />
              </div>
              <div>
                <label className={labelClass}>Client Contact Number</label>
                <input
                  className={inputClass}
                  value={draft.clientContact}
                  onChange={(e) => update('clientContact', e.target.value)}
                  placeholder="e.g. 98765 43210"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Property Name / Title</label>
                <input
                  className={inputClass}
                  value={draft.propertyTitle}
                  onChange={(e) => update('propertyTitle', e.target.value)}
                  placeholder="e.g. Prestige Lakeside Habitat"
                />
              </div>
              <div>
                <label className={labelClass}>Transaction Type</label>
                <select
                  className={inputClass}
                  value={draft.transactionType}
                  onChange={(e) => update('transactionType', e.target.value as Bill['transactionType'])}
                >
                  <option value="sale">Sale</option>
                  <option value="rent">Rent</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Property Location / Address</label>
              <input
                className={inputClass}
                value={draft.propertyLocation}
                onChange={(e) => update('propertyLocation', e.target.value)}
                placeholder="e.g. Whitefield, Bengaluru"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Total Agreed Amount (Rs.)</label>
                <input
                  type="number"
                  className={inputClass}
                  value={draft.totalAmount || ''}
                  onChange={(e) => update('totalAmount', Number(e.target.value))}
                  placeholder="e.g. 8500000"
                />
              </div>
              <div>
                <label className={labelClass}>Amount Paid (Rs.)</label>
                <input
                  type="number"
                  className={inputClass}
                  value={draft.amountPaid || ''}
                  onChange={(e) => update('amountPaid', Number(e.target.value))}
                  placeholder="e.g. 500000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Payment Mode</label>
                <select
                  className={inputClass}
                  value={draft.paymentMode}
                  onChange={(e) => update('paymentMode', e.target.value as Bill['paymentMode'])}
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Payment Date</label>
                <input
                  type="date"
                  className={inputClass}
                  value={draft.paymentDate}
                  onChange={(e) => update('paymentDate', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Move-in / Possession Date</label>
                <input
                  type="date"
                  className={inputClass}
                  value={draft.moveInDate}
                  onChange={(e) => update('moveInDate', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Final Payment Due Date</label>
                <input
                  type="date"
                  className={inputClass}
                  value={draft.finalPaymentDueDate}
                  onChange={(e) => update('finalPaymentDueDate', e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center justify-between text-sm font-semibold text-text-primary">
                <span>Remaining Balance</span>
                <span>Rs. {remaining.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </fieldset>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {!locked ? (
              <button
                onClick={handleSave}
                disabled={!isValid || saving}
                className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Receipt size={18} />}
                {saving ? 'Saving Bill…' : 'Save Bill'}
              </button>
            ) : (
              <>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 font-semibold text-white transition-colors hover:brightness-95"
                >
                  <MessageCircle size={18} />
                  Send via WhatsApp
                </a>
                <a
                  href={savedBill.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 px-6 py-3 font-semibold text-text-primary transition-colors hover:bg-gray-50"
                >
                  <Download size={18} />
                  Download PDF
                </a>
                <button
                  onClick={handleNewBill}
                  className="min-h-[44px] rounded-xl border border-gray-300 px-6 py-3 font-semibold text-text-primary transition-colors hover:bg-gray-50"
                >
                  New Bill
                </button>
              </>
            )}
          </div>
        </motion.div>

        {/* Live preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-gray-100 bg-gray-50 p-4 shadow-sm sm:p-6"
        >
          <div className="mb-3 text-sm font-semibold text-text-primary">
            {locked ? 'Saved Receipt' : 'Live Preview'}
          </div>
          <div className="overflow-x-auto rounded-xl bg-white p-4 shadow-sm">
            <BillLetterhead
              ref={previewRef}
              bill={{ ...previewData, receiptNo: previewData.receiptNo || 'NN-—' }}
            />
          </div>
        </motion.div>
      </div>

      {/* Past Bills history — independent record set, no regeneration on send/download */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6"
      >
        <h2 className="mb-4 text-lg font-bold text-gray-900">Past Bills</h2>

        {loadingBills ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : pastBills.length === 0 ? (
          <p className="py-8 text-center text-gray-600">No bills generated yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                  <th className="py-2 pr-4 font-medium">Receipt No</th>
                  <th className="py-2 pr-4 font-medium">Client Name</th>
                  <th className="py-2 pr-4 font-medium">Amount</th>
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pastBills.map((bill) => (
                  <tr key={bill.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 pr-4 font-medium text-gray-900">{bill.receiptNo}</td>
                    <td className="py-3 pr-4 text-gray-700">{bill.clientName}</td>
                    <td className="py-3 pr-4 text-gray-700">
                      Rs. {bill.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 pr-4 text-gray-700">
                      {new Date(bill.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={buildWhatsappLink(bill)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#25D366]/10 text-[#1da851] transition-colors hover:bg-[#25D366]/20"
                          aria-label={`Send ${bill.receiptNo} via WhatsApp`}
                        >
                          <MessageCircle size={16} />
                        </a>
                        <a
                          href={bill.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors hover:bg-primary/20"
                          aria-label={`Download ${bill.receiptNo}`}
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
