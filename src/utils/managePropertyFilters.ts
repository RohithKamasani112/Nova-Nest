import type { Property } from '../types';

interface InventoryFilters {
  dataQuality?: boolean;
  searchTerm: string;
  statusFilter: 'all' | 'buy' | 'rent';
  visibilityFilter: 'all' | 'active' | 'inactive' | 'archived';
  categoryFilter: string;
  bhkFilter: string;
  localityFilter: string;
  areaMin: string;
  areaMax: string;
}

export function filterInventory(properties: Property[], options: InventoryFilters): Property[] {
  const { searchTerm, statusFilter, visibilityFilter, categoryFilter, bhkFilter, localityFilter, areaMin, areaMax } = options;
  let filtered = properties.filter(p => options.visibilityFilter === 'archived' ? Boolean(p.archivedAt) : !p.archivedAt);
  if (options.dataQuality) filtered = filtered.filter(p => !p.locality?.trim() || !Number.isFinite(p.latitude) || !Number.isFinite(p.longitude));

  if (searchTerm) {
    const term = searchTerm.trim().toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        p.location.toLowerCase().includes(term) || Boolean(p.locality?.toLowerCase().includes(term))
    );
  }

  if (statusFilter !== 'all') filtered = filtered.filter((p) => p.status === statusFilter);
  if (visibilityFilter !== 'all' && visibilityFilter !== 'archived') {
    filtered = filtered.filter((p) =>
      visibilityFilter === 'active' ? p.isActive !== false : p.isActive === false
    );
  }
  if (categoryFilter !== 'all') filtered = filtered.filter((p) => p.category === categoryFilter);

  if (bhkFilter !== 'all') filtered = filtered.filter(p => p.bedrooms === Number(bhkFilter));
  if (localityFilter !== 'all') filtered = filtered.filter(p => (p.locality?.trim() || p.location.trim()) === localityFilter);
  if (areaMin) filtered = filtered.filter(p => p.areaSqft >= Number(areaMin));
  if (areaMax) filtered = filtered.filter(p => p.areaSqft <= Number(areaMax));

  return filtered;
}
