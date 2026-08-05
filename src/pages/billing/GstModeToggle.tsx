import React from 'react';

interface GstModeToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

// Two-option segmented control, always the very first thing in a billing
// form — not a checkbox buried in the middle of the field list. Drives
// gstApplicable on the document model.
export const GstModeToggle: React.FC<GstModeToggleProps> = ({ value, onChange }) => (
  <div className="mb-6 inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
    <button
      type="button"
      onClick={() => onChange(true)}
      aria-pressed={value}
      className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
        value ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      With GST
    </button>
    <button
      type="button"
      onClick={() => onChange(false)}
      aria-pressed={!value}
      className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
        !value ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      Without GST
    </button>
  </div>
);
