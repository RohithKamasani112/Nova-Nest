import React, { useState } from 'react';
import { Modal } from './Modal';
import { Download, User, Mail, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

interface LeadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyTitle: string;
  onSubmit: (data: { name: string; email: string; phone: string }) => void;
}

export const LeadCaptureModal: React.FC<LeadCaptureModalProps> = ({
  isOpen,
  onClose,
  propertyTitle,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Save lead
    onSubmit(formData);

    toast.success('Brochure download started! Check your downloads folder.');

    // Close modal
    onClose();

    // Reset form
    setFormData({ name: '', email: '', phone: '' });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-[#C99A7A]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Download size={32} className="text-[#C99A7A]" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Download Brochure
        </h2>
        <p className="text-gray-600 text-sm">
          Enter your details to download the brochure for{' '}
          <span className="font-semibold">{propertyTitle}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Full Name *
          </label>
          <div className="relative">
            <User
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter your full name"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C99A7A]/30 focus:border-[#C99A7A] outline-none"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Email Address *
          </label>
          <div className="relative">
            <Mail
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C99A7A]/30 focus:border-[#C99A7A] outline-none"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Mobile Number *
          </label>
          <div className="relative">
            <Phone
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="+91 98765 43210"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C99A7A]/30 focus:border-[#C99A7A] outline-none"
            />
          </div>
        </div>

        {/* Privacy */}
        <p className="text-xs text-gray-500 text-center">
          By submitting, you agree to receive updates about this property and
          other relevant listings.
        </p>

        {/* Submit */}
        <button
          type="submit"
          className="w-full px-6 py-3 bg-[#C99A7A] text-white rounded-lg font-semibold hover:bg-[#9C6B4E] transition-all shadow-md hover:shadow-lg"
        >
          Download Brochure
        </button>
      </form>
    </Modal>
  );
};
