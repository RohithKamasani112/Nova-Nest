import React from 'react';
import { MUTED_LABEL } from './designTokens';

interface ContactLinesProps {
  email?: string;
  mobile?: string;
}

// Small, labelled email/mobile lines under a party's name and address.
// Both are optional — when neither is set, nothing renders at all (no
// orphan labels, no gap where they'd otherwise sit).
export const ContactLines: React.FC<ContactLinesProps> = ({ email, mobile }) => {
  if (!email && !mobile) return null;
  return (
    <div style={{ marginTop: 4, fontSize: 11, color: MUTED_LABEL, lineHeight: 1.6 }}>
      {email && <div>Email: {email}</div>}
      {mobile && <div>Mobile: {mobile}</div>}
    </div>
  );
};
