// Display formatting helpers shared across the app.

// Real-estate acronyms that should always render fully uppercase.
const ACRONYMS = new Set([
  'bhk', 'rk', 'pg', 'rera', 'nri', 'emi', 'bbmp', 'bda', 'it', 'sez', 'cbd',
]);

// Small words that stay lowercase inside a title (unless they are the first word).
const SMALL_WORDS = new Set([
  'a', 'an', 'and', 'the', 'for', 'in', 'of', 'on', 'at', 'to', 'by', 'with', 'or', 'nor',
]);

const capitalize = (word: string): string =>
  word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word;

/**
 * Convert messy user-entered text into clean Title Case for display.
 *
 * Handles the casing quirks common in property data:
 *  - "premuim 3.5bhk flat for sale" -> "Premuim 3.5BHK Flat for Sale"
 *  - "3bhk flat in whitefield"       -> "3BHK Flat in Whitefield"
 *  - "indiranagar, bangalore"        -> "Indiranagar, Bangalore"
 *
 * Note: this normalises casing for presentation only; it does not change the
 * stored value. Typos in the source data are left untouched.
 */
export const toTitleCase = (input?: string | null): string => {
  if (!input) return '';

  return input
    .trim()
    .split(/\s+/)
    .map((word, index) => {
      const lower = word.toLowerCase();

      // Whole-word acronym (e.g. "BHK", "RERA").
      if (ACRONYMS.has(lower)) return word.toUpperCase();

      // Tokens mixing digits and letters (e.g. "3bhk", "3.5bhk", "2bath").
      if (/\d/.test(word) && /[a-z]/i.test(word)) {
        return word.replace(/[a-z]+/gi, (segment) =>
          ACRONYMS.has(segment.toLowerCase()) ? segment.toUpperCase() : capitalize(segment)
        );
      }

      // Minor words stay lowercase unless they lead the string.
      if (index > 0 && SMALL_WORDS.has(lower)) return lower;

      return capitalize(word);
    })
    .join(' ');
};

/** "For Sale" / "For Rent" from a property's status. */
export const dealLabel = (status: 'buy' | 'rent'): string =>
  status === 'rent' ? 'For Rent' : 'For Sale';

/**
 * Short human summary shown beside a property name, e.g. "2 BHK · For Rent" or
 * (for plots/commercial with no bedrooms) just "For Sale". Used on listing
 * cards and in the leads table so it's clear at a glance what each listing is.
 */
export const propertyDealSummary = (property: {
  bedrooms: number;
  status: 'buy' | 'rent';
}): string => {
  const bhk = property.bedrooms > 0 ? `${property.bedrooms} BHK · ` : '';
  return `${bhk}${dealLabel(property.status)}`;
};
