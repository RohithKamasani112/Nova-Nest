import React from 'react';
import { Phone } from 'lucide-react';
import { WhatsAppIcon } from '../icons/WhatsAppIcon';
import { telHref, whatsappUrl } from './crmVisuals';

interface LeadContactActionsProps {
  phone: string | null;
  name: string;
  onContact: () => void;
  compact?: boolean;
  showCallLabel?: boolean;
}

/** Contact controls always occupy their own layout space, even in dense rows. */
export const LeadContactActions: React.FC<LeadContactActionsProps> = ({ phone, name, onContact, compact = false, showCallLabel = false }) => {
  if (!phone) return compact ? null : <p className="crm-contact-unavailable">No phone number provided</p>;
  return (
    <div className={compact ? `crm-contact-actions crm-contact-actions--compact${showCallLabel ? ' crm-contact-actions--labelled-call' : ''}` : 'crm-contact-actions'} onClick={event => event.stopPropagation()}>
      <a className="crm-contact-button crm-contact-button--call" href={telHref(phone)} onClick={onContact} aria-label={`Call ${name}`} title={`Call ${name}`}>
        <Phone size={18} strokeWidth={1.8} aria-hidden="true" />
        {(!compact || showCallLabel) && <span>Call</span>}
      </a>
      <a className="crm-contact-button crm-contact-button--whatsapp" href={whatsappUrl(phone)} target="_blank" rel="noopener noreferrer" onClick={onContact} aria-label={`WhatsApp ${name}`} title={`WhatsApp ${name}`}>
        <WhatsAppIcon size={18} />
        {!compact && <span>WhatsApp</span>}
      </a>
    </div>
  );
};
