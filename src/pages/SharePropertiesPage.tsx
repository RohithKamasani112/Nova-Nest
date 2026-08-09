import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Search } from 'lucide-react';
import { Property, PropertyFilters } from '../types';
import { getAllProperties } from '../services/storageService';
import { Button } from '../app/components/ui/button';
import { Input } from '../app/components/ui/input';
import { Checkbox } from '../app/components/ui/checkbox';
import { SelectionTray } from '../app/components/propertyShare/SelectionTray';
import {
  EMPTY_SELECTION,
  SelectionState,
  toggleSelection,
  selectAll as selectAllPure,
  removeFromSelection,
  reorderSelection,
  clearSelection,
} from '../app/components/propertyShare/selectionState';
import { filterProperties } from '../utils/propertyShareFilters';
import { formatBhkLabel, formatCurrencyOrDash, titleCase } from '../utils/propertyShareFormat';
import { ShareConfigureStep } from '../app/components/propertyShare/ShareConfigureStep';
import { RecentShares } from '../app/components/propertyShare/RecentShares';

const BHK_OPTIONS = [0, 1, 2, 3, 4, 5];
const FURNISHING_OPTIONS: NonNullable<Property['furnishingStatus']>[] = ['Unfurnished', 'Semi-Furnished', 'Fully Furnished'];
const FACING_OPTIONS: NonNullable<Property['facingDirection']>[] = [
  'East', 'West', 'North', 'South', 'North-East', 'North-West', 'South-East', 'South-West',
];
const TENANT_PREF_OPTIONS: { value: NonNullable<Property['tenantPreference']>; label: string }[] = [
  { value: 'family', label: 'Family' },
  { value: 'bachelors', label: 'Bachelors' },
  { value: 'family_bachelors', label: 'Family/Bachelors' },
  { value: 'any', label: 'Any' },
];

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
      style={
        active
          ? { background: '#1f2430', borderColor: '#1f2430', color: '#fff' }
          : { background: '#fff', borderColor: '#e2e4e9', color: '#1f2430' }
      }
    >
      {children}
    </button>
  );
}

function toggleInArray<T>(arr: T[] | undefined, value: T): T[] {
  const current = arr ?? [];
  return current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
}

export interface SharePropertiesPageProps {
  // Pre-fill from a CRM lead (Phase 6) — both optional so the page also
  // works standalone from the sidebar.
  initialClientName?: string;
  initialClientPhone?: string;
  leadId?: string;
  onShared?: (summary: { propertyCount: number }) => void;
}

export const SharePropertiesPage: React.FC<SharePropertiesPageProps> = ({
  initialClientName,
  initialClientPhone,
  leadId,
  onShared,
}) => {
  const [step, setStep] = useState<'select' | 'configure'>('select');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PropertyFilters>({ availableOnly: true });
  const [selection, setSelection] = useState<SelectionState>(EMPTY_SELECTION);

  useEffect(() => {
    setLoading(true);
    getAllProperties()
      .then(setProperties)
      .catch(() => toast.error('Could not load properties.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => filterProperties(properties, filters), [properties, filters]);

  const toggleOne = (property: Property) => setSelection((prev) => toggleSelection(prev, property));
  const selectAllFiltered = () => setSelection((prev) => selectAllPure(prev, filtered));
  const removeOne = (id: string) => setSelection((prev) => removeFromSelection(prev, id));
  const reorder = (nextOrder: string[]) => setSelection((prev) => reorderSelection(prev, nextOrder));

  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selection.selected.has(p.id));

  if (step === 'configure') {
    return (
      <ShareConfigureStep
        order={selection.order}
        properties={selection.selected}
        initialClientName={initialClientName}
        initialClientPhone={initialClientPhone}
        leadId={leadId}
        onBack={() => setStep('select')}
        onShared={(summary) => {
          onShared?.(summary);
          setSelection(clearSelection());
          setStep('select');
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Share Properties</h1>
        <p className="text-sm text-gray-600">
          Filter, select, and generate a clean client-facing PDF — no photos, no internal data.
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-3 rounded-xl border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={filters.search ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value || undefined }))}
              className="w-56 pl-8"
            />
          </div>
          <Input
            placeholder="Location / locality"
            value={filters.location ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value || undefined }))}
            className="w-48"
          />
          <div className="flex items-center gap-1.5">
            <Pill active={filters.status === undefined} onClick={() => setFilters((f) => ({ ...f, status: undefined }))}>
              Rent + Sale
            </Pill>
            <Pill active={filters.status === 'rent'} onClick={() => setFilters((f) => ({ ...f, status: 'rent' }))}>
              Rent
            </Pill>
            <Pill active={filters.status === 'buy'} onClick={() => setFilters((f) => ({ ...f, status: 'buy' }))}>
              Sale
            </Pill>
          </div>
          <label className="ml-auto flex items-center gap-2 text-sm">
            <Checkbox
              checked={!filters.availableOnly}
              onCheckedChange={(v) => setFilters((f) => ({ ...f, availableOnly: !v }))}
            />
            Include occupied / inactive
          </label>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">BHK</p>
          <div className="flex flex-wrap gap-1.5">
            {BHK_OPTIONS.map((b) => (
              <Pill key={b} active={!!filters.bedrooms?.includes(b)} onClick={() => setFilters((f) => ({ ...f, bedrooms: toggleInArray(f.bedrooms, b) }))}>
                {formatBhkLabel(b)}
              </Pill>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Furnishing</p>
          <div className="flex flex-wrap gap-1.5">
            {FURNISHING_OPTIONS.map((f) => (
              <Pill
                key={f}
                active={!!filters.furnishingStatus?.includes(f)}
                onClick={() => setFilters((prev) => ({ ...prev, furnishingStatus: toggleInArray(prev.furnishingStatus, f) }))}
              >
                {f}
              </Pill>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Facing</p>
          <div className="flex flex-wrap gap-1.5">
            {FACING_OPTIONS.map((f) => (
              <Pill
                key={f}
                active={!!filters.facingDirection?.includes(f)}
                onClick={() => setFilters((prev) => ({ ...prev, facingDirection: toggleInArray(prev.facingDirection, f) }))}
              >
                {f}
              </Pill>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Tenant preference</p>
          <div className="flex flex-wrap gap-1.5">
            {TENANT_PREF_OPTIONS.map((t) => (
              <Pill
                key={t.value}
                active={!!filters.tenantPreference?.includes(t.value)}
                onClick={() => setFilters((prev) => ({ ...prev, tenantPreference: toggleInArray(prev.tenantPreference, t.value) }))}
              >
                {t.label}
              </Pill>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={filters.gated === true} onCheckedChange={(v) => setFilters((f) => ({ ...f, gated: v ? true : undefined }))} />
            Gated only
          </label>
          <Input
            type="number"
            placeholder="Min price"
            value={filters.priceMin ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, priceMin: e.target.value ? Number(e.target.value) : undefined }))}
            className="w-32"
          />
          <Input
            type="number"
            placeholder="Max price"
            value={filters.priceMax ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, priceMax: e.target.value ? Number(e.target.value) : undefined }))}
            className="w-32"
          />
          <Input
            type="number"
            placeholder="Min sqft"
            value={filters.areaMin ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, areaMin: e.target.value ? Number(e.target.value) : undefined }))}
            className="w-28"
          />
          <Input
            type="number"
            placeholder="Max sqft"
            value={filters.areaMax ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, areaMax: e.target.value ? Number(e.target.value) : undefined }))}
            className="w-28"
          />
          {Object.keys(filters).length > 1 && (
            <Button variant="ghost" size="sm" onClick={() => setFilters({ availableOnly: true })}>
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Selection tray — persistent, survives filter changes and navigating
          to Configure and back. That persistence is deliberate (so mixed-BHK
          picks across filters survive), but it means an old selection can
          still be sitting here from an earlier pass — Reset is the explicit
          way to discard it and start clean. */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          {selection.order.length > 0 ? `${selection.order.length} selected` : 'No properties selected'}
        </span>
        {selection.order.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setSelection(clearSelection())}>
            Reset selection
          </Button>
        )}
      </div>
      <SelectionTray order={selection.order} properties={selection.selected} onRemove={removeOne} onReorder={reorder} />

      {/* Results list */}
      <div className="rounded-xl border">
        <div className="flex items-center justify-between border-b p-3">
          <span className="text-sm text-muted-foreground">{filtered.length} propert{filtered.length === 1 ? 'y' : 'ies'} match</span>
          <Button variant="outline" size="sm" onClick={selectAllFiltered} disabled={filtered.length === 0 || allFilteredSelected}>
            Select all filtered
          </Button>
        </div>
        <div className="max-h-[480px] divide-y overflow-y-auto">
          {loading && <p className="p-6 text-center text-sm text-muted-foreground">Loading properties...</p>}
          {!loading && filtered.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">No properties match these filters.</p>
          )}
          {!loading &&
            filtered.map((p) => {
              const isSelected = selection.selected.has(p.id);
              return (
                <label key={p.id} className="flex cursor-pointer items-center gap-3 p-3 text-sm hover:bg-muted/40">
                  <Checkbox checked={isSelected} onCheckedChange={() => toggleOne(p)} />
                  <span className="min-w-0 flex-1 truncate font-medium">{titleCase(p.title)}</span>
                  <span className="w-16 shrink-0 text-muted-foreground">{formatBhkLabel(p.bedrooms)}</span>
                  <span className="w-24 shrink-0 tabular-nums text-muted-foreground">{formatCurrencyOrDash(p.price)}</span>
                  <span className="w-32 shrink-0 truncate text-muted-foreground">{p.locality || p.location}</span>
                  {p.isActive === false && (
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">Inactive</span>
                  )}
                </label>
              );
            })}
        </div>
      </div>

      <div className="sticky bottom-4 flex justify-end">
        <Button
          size="lg"
          disabled={selection.order.length === 0}
          onClick={() => setStep('configure')}
          title={selection.order.length === 0 ? 'Select at least one property first' : undefined}
        >
          {selection.order.length === 0
            ? 'Select properties to continue'
            : `Continue with ${selection.order.length} propert${selection.order.length === 1 ? 'y' : 'ies'}`}
        </Button>
      </div>

      <RecentShares />
    </div>
  );
};
