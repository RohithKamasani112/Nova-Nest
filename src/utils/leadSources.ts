export const LEAD_SOURCE_OPTIONS = [
  { value: 'housing', label: 'Housing', sources: ['housing'] },
  { value: 'magicbricks', label: 'MagicBricks', sources: ['magicbricks'] },
  { value: '99acres', label: '99acres', sources: ['99acres'] },
  { value: 'custom', label: 'Custom', sources: ['website', 'personal'] },
];

export const selectedLeadSources = (scope: string[]) =>
  LEAD_SOURCE_OPTIONS.filter(option => option.sources.some(source => scope.includes(source))).map(option => option.value);

export const leadSourceLabels = (scope: string[]) =>
  LEAD_SOURCE_OPTIONS.filter(option => option.sources.some(source => scope.includes(source))).map(option => option.label).join(' + ') || 'No lead sources';
