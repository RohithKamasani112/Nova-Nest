import { normalizeEmail, normalizeNameKey, normalizePrice } from '../../lib/valueNormalize';
import { InputError, NormalizedLead } from './types';

const clean = (value: string) => value.replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ').trim();
const PRIVATE_FIELDS = /api.?key|secret|password|token|authorization/i;

export function validateLead(payload: Record<string, string>, received = new Date(), provider: NormalizedLead['source'] = 'magicbricks'): NormalizedLead {
  const field = (...names: string[]) => {
    const values = names.map(name => payload[name]).filter(value => value !== undefined && value !== '');
    if (new Set(values).size > 1) throw new InputError('Conflicting fields');
    return clean(values[0] ?? '');
  };
  const name = field('name', 'respondername');
  const project = field('project', 'projectname');
  if (!name || name.length > 200) throw new InputError('Name required (max 200 characters)');
  if (!project || project.length > 300) throw new InputError('Project required (max 300 characters)');
  const isd = field('isd');
  const countryCode = !isd || !/^\+?\d+$/.test(isd) ? '91' : isd.replace(/^\+/, '');
  if (countryCode !== '91') throw new InputError('Only Indian mobile numbers supported');
  let mobile = field('mobile', 'responderphone').replace(/[\s+()-]/g, '');
  if (mobile.startsWith('0091')) mobile = mobile.slice(4);
  else if (mobile.length > 10 && mobile.startsWith('91')) mobile = mobile.slice(2);
  if (mobile.startsWith('0')) mobile = mobile.slice(1);
  if (!/^\d{10}$/.test(mobile)) throw new InputError('Invalid mobile');
  const rawEmail = field('email', 'responderemail');
  const email = rawEmail ? normalizeEmail(rawEmail).email : null;
  if (rawEmail && (!email || email.length > 254)) throw new InputError('Invalid email');
  const dt = field('dt'), time = field('time');
  let leadDate = received.toISOString();
  if ((dt && !/^\d{8}$/.test(dt)) || (time && !/^\d{6}$/.test(time))) throw new InputError('Invalid date or time');
  if (dt) {
    const year = Number(dt.slice(0, 4)), month = Number(dt.slice(4, 6)), day = Number(dt.slice(6, 8));
    const hour = Number((time || '000000').slice(0, 2)), minute = Number((time || '000000').slice(2, 4)), second = Number((time || '000000').slice(4, 6));
    const wall = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    if (year < 1900 || wall.getUTCFullYear() !== year || wall.getUTCMonth() !== month - 1 || wall.getUTCDate() !== day || hour > 23 || minute > 59 || second > 59) throw new InputError('Invalid date or time');
    leadDate = new Date(wall.getTime() - 330 * 60000).toISOString();
  } else if (time && (Number(time.slice(0, 2)) > 23 || Number(time.slice(2, 4)) > 59 || Number(time.slice(4, 6)) > 59)) throw new InputError('Invalid time');
  const source = field('source');
  if (source && normalizeNameKey(source).replace(/\s/g, '') !== provider) throw new InputError('Invalid source');
  const propertyFields: Partial<NormalizedLead> = {};
  if (provider !== '99acres') {
    const bhk = field('bhk', 'bedrooms');
    if (bhk && !/^\d{1,2}(?:\s*bhk)?$/i.test(bhk)) throw new InputError('Invalid BHK');
    propertyFields.bedrooms = bhk ? parseInt(bhk, 10) : null;
    propertyFields.configuration = bhk ? (propertyFields.bedrooms === 0 ? 'STUDIO' : `${propertyFields.bedrooms} BHK`) : null;
  }
  if (provider === '99acres') {
    const price = normalizePrice(field('price'));
    if (price.priceRaw && (price.priceValue === null || !Number.isFinite(price.priceValue) || price.priceValue < 0 || price.priceValue >= 1e12)) throw new InputError('Invalid property price');
    const bedrooms = field('bedrooms');
    if (bedrooms && !/^\d{1,2}(?:\s*bhk)?$/i.test(bedrooms)) throw new InputError('Invalid bedroom number');
    propertyFields.price_raw = price.priceRaw;
    propertyFields.price_value = price.priceValue;
    propertyFields.bedrooms = bedrooms ? parseInt(bedrooms, 10) : null;
    propertyFields.configuration = bedrooms ? (propertyFields.bedrooms === 0 ? 'STUDIO' : `${propertyFields.bedrooms} BHK`) : null;
  }
  const raw: Record<string, string> = Object.create(null);
  for (const [key, value] of Object.entries(payload)) if (!PRIVATE_FIELDS.test(key)) raw[key] = clean(value);
  return { source: provider, name, mobile, country_code: countryCode, email, project, city: field('city') || null, message: provider === 'housing' ? field('comments') : field('msg', 'comments') || null, raw_isd: isd && !/^\+?\d+$/.test(isd) ? isd : null, lead_dt: leadDate, received_at: received.toISOString(), raw_payload: raw, ...propertyFields };
}
