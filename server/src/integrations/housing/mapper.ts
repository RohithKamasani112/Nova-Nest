import { InputError } from '../shared/types';
export function mapHousingPayload(payload: Record<string, string>): Record<string, string> {
  const phone = payload.mobile ?? payload.responderphone ?? '';
  if (!phone.trim()) throw new InputError('Phone required');
  const isd = (payload.isd || '+91').replace(/[\s-]/g, '');
  if (!/^\+?91$/.test(isd)) throw new InputError('Only Indian mobile numbers supported');
  const stripped = phone.replace(/[\s+()-]/g, '');
  const mobile = /^\d{10}$/.test(stripped) ? isd + stripped : phone;
  return { ...payload,
    name: payload.name ?? payload.respondername ?? '', respondername: payload.name ?? payload.respondername ?? '',
    mobile, responderphone: mobile,
    email: payload.email ?? payload.responderemail ?? '', responderemail: payload.email ?? payload.responderemail ?? '',
    project: payload.project ?? payload.projectname ?? '', projectname: payload.project ?? payload.projectname ?? '',
    isd, source: 'housing', comments: payload.comments ?? '',
  };
}
