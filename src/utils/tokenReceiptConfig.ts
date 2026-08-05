import companyLogo from '../assets/companyLogo.png';
import { BUSINESS_ADDRESS, BUSINESS_EMAIL, BUSINESS_NAME } from './siteSettings';

// Single place to edit company identity, branding assets, and the footer
// note that appears on every Token Receipt. Pulls the same name/address/
// email already used by the other billing documents (src/utils/siteSettings.ts)
// so the letterhead stays one source of truth across the whole Generate Bill
// section — nothing here is duplicated/hardcoded independently.
export const TOKEN_RECEIPT_CONFIG = {
  companyName: BUSINESS_NAME,
  companyAddress: BUSINESS_ADDRESS,
  companyEmail: BUSINESS_EMAIL,
  logo: companyLogo,
  // No stamp/seal image asset exists in src/assets yet. Drop a file in
  // src/assets (e.g. companyStamp.png), import it above, and set this to
  // that import — the template already renders it when present.
  stampImage: null as string | null,
  watermarkText: 'NOVA NEST',
  footerNote: (clientLabel: 'Tenant' | 'Buyer') =>
    `Booking Amount will not be refunded if the booking is cancelled by the ${clientLabel}.`,
};
