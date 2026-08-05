import React from 'react';
import { GstFields } from '../../types';
import { inputClass, labelClass, sectionTitleClass } from './formStyles';

type GstFieldsValue = Pick<
  GstFields,
  'sacCode' | 'placeOfSupplyState' | 'placeOfSupplyCode' | 'reverseCharge' | 'recipientGstin' | 'recipientStateName' | 'recipientStateCode'
>;

interface GstFieldsSectionProps {
  value: GstFieldsValue;
  onChange: (patch: Partial<GstFieldsValue>) => void;
}

// Rule 46 (CGST Rules) inputs, shown only while the form's GST toggle is on.
// Never part of form validation — a non-GST document can't be blocked by a
// missing SAC code, and these simply don't render (and aren't collected)
// when GST is off.
export const GstFieldsSection: React.FC<GstFieldsSectionProps> = ({ value, onChange }) => (
  <div>
    <div className={sectionTitleClass}>Tax Details</div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label className={labelClass}>SAC / HSN Code</label>
        <input className={inputClass} value={value.sacCode} onChange={(e) => onChange({ sacCode: e.target.value })} />
      </div>
      <div>
        <label className={labelClass}>Tax Payable on Reverse Charge</label>
        <select
          className={inputClass}
          value={value.reverseCharge ? 'yes' : 'no'}
          onChange={(e) => onChange({ reverseCharge: e.target.value === 'yes' })}
        >
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>Place of Supply — State</label>
        <input
          className={inputClass}
          value={value.placeOfSupplyState}
          onChange={(e) => onChange({ placeOfSupplyState: e.target.value })}
        />
      </div>
      <div>
        <label className={labelClass}>Place of Supply — State Code</label>
        <input
          className={inputClass}
          value={value.placeOfSupplyCode}
          onChange={(e) => onChange({ placeOfSupplyCode: e.target.value })}
        />
      </div>
      <div>
        <label className={labelClass}>Recipient GSTIN (optional)</label>
        <input
          className={inputClass}
          value={value.recipientGstin}
          onChange={(e) => onChange({ recipientGstin: e.target.value })}
          placeholder="Leave blank to show recipient's state instead"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass}>Recipient State</label>
          <input
            className={inputClass}
            value={value.recipientStateName}
            onChange={(e) => onChange({ recipientStateName: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>State Code</label>
          <input
            className={inputClass}
            value={value.recipientStateCode}
            onChange={(e) => onChange({ recipientStateCode: e.target.value })}
          />
        </div>
      </div>
    </div>
    <p className="mt-1.5 text-xs text-gray-500">
      Recipient GSTIN is optional. When left blank, the document shows the recipient's state instead — mandatory
      on a B2C document above ₹50,000.
    </p>
  </div>
);
