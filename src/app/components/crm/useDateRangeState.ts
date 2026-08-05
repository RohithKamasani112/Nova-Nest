import { useEffect, useState } from 'react';
import { computeIstPeriod, PeriodPreset, PeriodRange } from '../../../utils/istDate';

export interface DateRangeState {
  preset: PeriodPreset;
  customFrom: string;
  customTo: string;
  dateField: 'lead_date' | 'created_at';
}

const VALID_PRESETS = new Set<PeriodPreset>([
  'today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month',
  'last_30_days', 'this_quarter', 'this_year', 'custom',
]);

function readFromUrl(): DateRangeState {
  const params = new URLSearchParams(window.location.search);
  const preset = params.get('period') as PeriodPreset;
  return {
    preset: preset && VALID_PRESETS.has(preset) ? preset : 'this_month',
    customFrom: params.get('customFrom') ?? '',
    customTo: params.get('customTo') ?? '',
    dateField: params.get('dateField') === 'created_at' ? 'created_at' : 'lead_date',
  };
}

function writeToUrl(state: DateRangeState) {
  const params = new URLSearchParams(window.location.search);
  params.set('period', state.preset);
  params.set('dateField', state.dateField);
  if (state.preset === 'custom' && state.customFrom && state.customTo) {
    params.set('customFrom', state.customFrom);
    params.set('customTo', state.customTo);
  } else {
    params.delete('customFrom');
    params.delete('customTo');
  }
  const qs = params.toString();
  window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
}

/**
 * Reads/writes the date-range preset via URL query params (`period`,
 * `dateField`, `customFrom`, `customTo`) so the Dashboard and All Leads
 * pages — separate components, no shared parent state — stay in sync when
 * the user switches between them within the same session.
 */
export function useDateRangeState(): [DateRangeState, (patch: Partial<DateRangeState>) => void, PeriodRange] {
  const [state, setState] = useState<DateRangeState>(() => readFromUrl());

  useEffect(() => {
    writeToUrl(state);
  }, [state]);

  const update = (patch: Partial<DateRangeState>) => setState((prev) => ({ ...prev, ...patch }));
  const range = computeIstPeriod(state.preset, state.customFrom, state.customTo);

  return [state, update, range];
}
