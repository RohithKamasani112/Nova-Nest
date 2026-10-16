import { InputError } from '../shared/types';

export function map99acresPayload(payload: Record<string, string>): Record<string, string> {
  const fields: Record<string, string> = Object.create(null);
  for (const [key, value] of Object.entries(payload)) {
    const normalized = key.replace(/[^a-z0-9]/g, '');
    if (fields[normalized] && value && fields[normalized] !== value) throw new InputError('Conflicting fields');
    fields[normalized] = value || fields[normalized] || '';
  }
  const pick = (...names: string[]) => {
    const values = names.map(name => fields[name]).filter(Boolean);
    if (new Set(values).size > 1) throw new InputError('Conflicting fields');
    return values[0] || '';
  };
  const phone = pick('phone', 'mobile', 'responderphone');
  if (!phone) throw new InputError('Phone required');
  const name = pick('name', 'respondername');
  const project = pick('projectname', 'project');
  const email = pick('email', 'responderemail');
  return { ...payload, name, respondername: name, mobile: phone, responderphone: phone,
    project, projectname: project, email, responderemail: email, source: '99acres',
    price: pick('price', 'propertyprice', 'priceoftheproperty'),
    bedrooms: pick('bedrooms', 'bedroomnum', 'bedroomnumber', 'bedroom', 'bhk'),
    comments: pick('comments', 'message'),
  };
}
