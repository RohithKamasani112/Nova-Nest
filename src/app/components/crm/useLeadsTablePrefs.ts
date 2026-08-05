import { useEffect, useState } from 'react';

// Only the 6 "off by default" extras are tracked here — Lead, Property, BHK,
// Agent, Status, Follow-up, Activity are the fixed core layout (Part C2) and
// always render, so they don't need a visibility toggle.
export type ColumnKey = 'budget' | 'city' | 'email' | 'propertyType' | 'listingType' | 'leadDate';
export type Density = 'comfortable' | 'compact';

export const OPTIONAL_COLUMNS: ColumnKey[] = ['budget', 'city', 'email', 'propertyType', 'listingType', 'leadDate'];
export const OPTIONAL_COLUMN_LABELS: Record<ColumnKey, string> = {
  budget: 'Budget',
  city: 'City',
  email: 'Email',
  propertyType: 'Property Type',
  listingType: 'Listing Type',
  leadDate: 'Lead Date',
};

// v2: the previous key stored the full core+optional visible set; the core
// set is no longer togglable, so old data would carry the wrong meaning.
const COLUMNS_STORAGE_KEY = 'crm_leads_columns_v2';
const DENSITY_STORAGE_KEY = 'crm_leads_density_v1';

function loadVisibleColumns(): Set<ColumnKey> {
  try {
    const raw = localStorage.getItem(COLUMNS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed.filter((c): c is ColumnKey => OPTIONAL_COLUMNS.includes(c as ColumnKey)));
  } catch {
    return new Set();
  }
}

function loadDensity(): Density {
  return localStorage.getItem(DENSITY_STORAGE_KEY) === 'compact' ? 'compact' : 'comfortable';
}

export function useLeadsTablePrefs() {
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(() => loadVisibleColumns());
  const [density, setDensity] = useState<Density>(() => loadDensity());

  useEffect(() => {
    localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(Array.from(visibleColumns)));
  }, [visibleColumns]);

  useEffect(() => {
    localStorage.setItem(DENSITY_STORAGE_KEY, density);
  }, [density]);

  const toggleColumn = (col: ColumnKey) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col);
      else next.add(col);
      return next;
    });
  };

  return { visibleColumns, toggleColumn, density, setDensity };
}
