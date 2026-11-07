import type { PropertyFilters, SortOption } from '../types';
export const CATEGORY_LABELS: Record<string, string> = { apartment: 'Apartment', villa: 'Villa', house: 'House', land: 'Plot / Land', condo: 'Commercial', townhouse: 'Townhouse' };
const arrayKeys = ['category', 'bedrooms', 'bathrooms', 'amenities', 'locality', 'furnishingStatus', 'facingDirection', 'tenantPreference'] as const;
const numberKeys = ['priceMin', 'priceMax', 'areaMin', 'areaMax'] as const;
const booleanKeys = ['featured', 'verified'] as const;
const sorts: SortOption[] = ['newest', 'oldest', 'price-asc', 'price-desc', 'area-asc', 'area-desc'];
export function readPropertySearch(search: string) {
  const params = new URLSearchParams(search);
  const filters: PropertyFilters = {};
  const status = params.get('status');
  if (status === 'rent' || status === 'buy') filters.status = status;
  if (params.get('location')) filters.location = params.get('location')!.slice(0, 300);
  for (const key of numberKeys) { const raw = params.get(key); if (raw !== null && Number.isFinite(Number(raw)) && Number(raw) >= 0) filters[key] = Number(raw); }
  for (const key of booleanKeys) if (params.get(key) === '1') filters[key] = true;
  for (const key of arrayKeys) {
    const values = params.getAll(key).slice(0, 50);
    if (!values.length) continue;
    if (key === 'bedrooms' || key === 'bathrooms') filters[key] = values.map(Number).filter(n => Number.isInteger(n) && n >= 0 && n <= 20);
    else if (key === 'category') filters.category = values.filter(v => v in CATEGORY_LABELS) as PropertyFilters['category'];
    else (filters as Record<string, unknown>)[key] = values.map(v => v.slice(0, 200));
  }
  const sort = sorts.includes(params.get('sort') as SortOption) ? params.get('sort') as SortOption : 'newest';
  return { filters, query: (params.get('q') || '').slice(0, 300), sort, page: Math.min(10000, Math.max(1, Math.floor(Number(params.get('page')) || 1))) };
}
export function writePropertySearch(filters: PropertyFilters, query: string, sort: SortOption, page = 1) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (key === 'nearMe' || value === undefined || value === false || value === '') continue;
    if (Array.isArray(value)) value.forEach(v => params.append(key, String(v)));
    else params.set(key, value === true ? '1' : String(value));
  }
  if (query.trim()) params.set('q', query.trim());
  if (sort !== 'newest') params.set('sort', sort);
  if (page > 1) params.set('page', String(page));
  return params.size ? '?' + params.toString() : '';
}
export function filterRangeError(filters: PropertyFilters) {
  if ([filters.priceMin, filters.priceMax, filters.areaMin, filters.areaMax].some(value => value !== undefined && (!Number.isFinite(value) || value < 0))) return 'Price and size must be zero or greater.';
  if (filters.priceMin !== undefined && filters.priceMax !== undefined && filters.priceMin > filters.priceMax) return 'Minimum price must not exceed maximum price.';
  if (filters.areaMin !== undefined && filters.areaMax !== undefined && filters.areaMin > filters.areaMax) return 'Minimum size must not exceed maximum size.';
  return '';
}
export function matchesBhk(bedrooms: number, selected: number[]) { return selected.some(n => n === 5 ? bedrooms >= 5 : bedrooms === n); }

export function categoryFromForm(value: string): NonNullable<PropertyFilters['category']>[number] {
  if (value === 'Villa') return 'villa';
  if (value === 'Independent House') return 'house';
  if (value === 'Townhouse') return 'townhouse';
  if (value === 'Plot / Land') return 'land';
  if (['Commercial', 'Commercial Office', 'Shop / Showroom', 'Warehouse'].includes(value)) return 'condo';
  return 'apartment';
}
