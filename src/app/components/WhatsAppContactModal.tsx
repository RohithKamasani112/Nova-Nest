import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import { WhatsAppIcon } from './icons/WhatsAppIcon';

interface WhatsAppContactModalProps {
  open: boolean;
  onClose: () => void;
  /** Called with the entered mobile number once validated. The parent is
   *  responsible for saving the lead and redirecting to WhatsApp. */
  onSubmit: (phone: string) => void;
}

/**
 * Small gate shown before opening WhatsApp: asks the visitor for their mobile
 * number so we can capture it as a lead (for future follow-up calls) before
 * redirecting them to the WhatsApp chat.
 */
export const WhatsAppContactModal: React.FC<WhatsAppContactModalProps> = ({ open, onClose, onSubmit }) => {
  const reduce = useReducedMotion();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const close = () => {
    setPhone('');
    setError('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Please enter a valid mobile number');
      return;
    }
    const value = phone.trim();
    setPhone('');
    setError('');
    onSubmit(value);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            className="fixed inset-0 z-[60] bg-black/50"
          />
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 20 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 10 }}
            transition={reduce ? { duration: 0.2 } : { type: 'spring', stiffness: 280, damping: 28 }}
            className="fixed inset-0 z-[70] flex items-center justify-center px-4"
          >
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-white">
                    <WhatsAppIcon size={22} />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Chat on WhatsApp</h2>
                    <p className="text-xs text-gray-500">We'll connect with you shortly</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="mb-4 text-sm text-gray-600">
                Please share your mobile number so we can connect with you.
              </p>

              <form onSubmit={handleSubmit}>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Mobile Number *</label>
                <input
                  type="tel"
                  autoFocus
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="e.g. 90000 00000"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-[#25D366] focus:outline-none focus:ring-2 focus:ring-[#25D366]/20"
                />
                {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] font-semibold text-white transition-colors hover:bg-[#1EBE57]"
                >
                  <WhatsAppIcon size={20} />
                  Continue to WhatsApp
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
