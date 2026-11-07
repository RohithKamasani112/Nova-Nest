import { CATEGORY_LABELS } from '../utils/propertySearchState';
import { canonicalLocality, resolveLocality } from '../utils/propertyLocalities';
import { filterInventory } from '../utils/managePropertyFilters';
import React, { useEffect, useState } from 'react';
import { Property } from '../types';
import { getAllProperties, updateProperty, deleteProperty, restoreProperty, permanentlyDeleteProperty } from '../services/storageService';
import { toTitleCase } from '../utils/format';
import { motion } from 'motion/react';
import { Edit2, Search, Filter, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import companyLogo from '../assets/companyLogo.png';

interface ManagePropertiesPageProps {
  onEditProperty: (property: Property) => void;
}

const formatPrice = (price: number, status: 'buy' | 'rent'): string => {
  if (status === 'rent') return `₹${price.toLocaleString('en-IN')}/month`;
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
  return `₹${price.toLocaleString('en-IN')}`;
};

export const ManagePropertiesPage: React.FC<ManagePropertiesPageProps> = ({
  onEditProperty,
}) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [page, setPage] = useState(1);
  const [lastSync, setLastSync] = useState('');
  const [loadError, setLoadError] = useState(false);
  const [dataQuality, setDataQuality] = useState(false);
  const pageSize = 20;
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'buy' | 'rent'>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'active' | 'inactive' | 'archived'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [bhkFilter, setBhkFilter] = useState('all');
  const [localityFilter, setLocalityFilter] = useState('all');
  const [areaMin, setAreaMin] = useState('');
  const [areaMax, setAreaMax] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price-asc' | 'price-desc'>('newest');

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    filterAndSortProperties();
  }, [properties, searchTerm, statusFilter, visibilityFilter, categoryFilter, bhkFilter, localityFilter, areaMin, areaMax, sortBy, dataQuality]);

  useEffect(() => { setPage(1); }, [searchTerm, statusFilter, visibilityFilter, categoryFilter, bhkFilter, localityFilter, areaMin, areaMax, dataQuality]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const data = await getAllProperties();
      setProperties(data); setLoadError(false); setLastSync(new Date().toLocaleTimeString('en-IN'));
    } catch (error) {
      setLoadError(true); toast.error('Failed to load properties');
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProperties = () => {
    const filtered = filterInventory(properties, { searchTerm, statusFilter, visibilityFilter, categoryFilter, bhkFilter, localityFilter, areaMin, areaMax, dataQuality });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    setFilteredProperties(filtered);
  };

  const updatePropertyVisibility = async (property: Property, isActive: boolean) => {
    if (pendingId) return;
    const action = isActive ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${action} this property?`)) return;

    try {
      setPendingId(property.id);
      const saved = await updateProperty(property.id, { isActive }, property.updatedAt || property.createdAt);
      // Reflect the acknowledged write immediately in the admin list.
      setProperties((prev) =>
        prev.map((p) => (p.id === property.id ? { ...p, ...saved, images: p.images } : p))
      );
      toast.success(isActive ? 'Property activated' : 'Property deactivated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to ${action} property`);
      console.error(`Error trying to ${action} property:`, error);
    } finally {
      setPendingId(null);
    }
  };

  const handleDeleteProperty = async (property: Property) => {
    if (!window.confirm(property.archivedAt ? `Permanently remove "${property.title}" from inventory? This cannot be undone.` : `Archive "${property.title}"? You can restore it from Archived listings.`)) return;

    try {
      if (property.archivedAt) await permanentlyDeleteProperty(property); else await deleteProperty(property.id);
      await loadProperties();
      toast.success(property.archivedAt ? 'Property permanently removed' : 'Property archived. It can be restored.');
    } catch (error) {
      toast.error('Failed to delete property');
      console.error('Error deleting property:', error);
    }
  };

  const categories: { value: string; label: string }[] = [
    { value: 'all', label: 'All Categories' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'villa', label: 'Villa' },
    { value: 'house', label: 'House' },
    { value: 'condo', label: 'Commercial' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'land', label: 'Plot / Land' },
  ];

  const normalizeLocalities = async () => {
    const candidates = properties.filter(p => !p.archivedAt && resolveLocality(p) && p.locality !== canonicalLocality(resolveLocality(p)));
    if (!candidates.length) { toast.success('All detected localities are already normalized.'); return; }
    if (!window.confirm(`Normalize locality names on ${candidates.length} listings? Only a known neighborhood found in the existing address or locality will be used. Review missing-location listings separately.`)) return;
    setLoading(true);
    let saved = 0;
    try { for (const property of candidates) { await updateProperty(property.id, { locality: canonicalLocality(resolveLocality(property)) }, property.updatedAt || property.createdAt); saved++; } toast.success(`${saved} locality names updated`); }
    catch (error) { toast.error(`${saved} updated. ${error instanceof Error ? error.message : 'Refresh and retry the remaining listings.'}`); }
    finally { await loadProperties(); }
  };

  const renderStatusBadge = (property: Property) => (
    <span
      className={`rounded px-2.5 py-1 text-xs font-medium ${
        property.status === 'buy'
          ? 'bg-green-100 text-green-800'
          : 'bg-orange-100 text-orange-800'
      }`}
    >
      {property.status === 'buy' ? 'Sale' : 'Rent'}
    </span>
  );

  return (
    <div className="w-full">
      <div className="mb-6 sm:mb-8">
        <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">Manage Properties</h1>
        <p aria-live="polite" className="text-sm text-gray-600 sm:text-base">{loading ? 'Loading properties...' : `${filteredProperties.length} ${statusFilter === 'rent' ? 'rental' : statusFilter === 'buy' ? 'sale' : 'matching'} ${filteredProperties.length === 1 ? 'property' : 'properties'} of ${properties.length} total`}</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
        <button type="button" disabled={loading} onClick={() => void loadProperties()} className="rounded-lg border bg-white px-4 py-2 font-semibold">{loading ? 'Refreshing...' : 'Refresh inventory'}</button>
        <button type="button" disabled={loading} onClick={() => void normalizeLocalities()} className="rounded-lg border bg-white px-4 py-2">Normalize locality names</button>
        <span className="text-gray-500">{lastSync ? `Last synced ${lastSync}` : 'Not synced yet'}</span>
        <label className="flex items-center gap-2"><input type="checkbox" checked={dataQuality} onChange={e => setDataQuality(e.target.checked)} />Needs location details ({properties.filter(p => !p.archivedAt && (!p.locality?.trim() || !Number.isFinite(p.latitude) || !Number.isFinite(p.longitude))).length})</label>
        <button type="button" className="font-semibold text-primary underline" onClick={() => { try { localStorage.setItem('nova-inventory-preset', JSON.stringify({ searchTerm, statusFilter, visibilityFilter, categoryFilter, bhkFilter, localityFilter, areaMin, areaMax })); toast.success('Filter preset saved on this browser'); } catch { toast.error('Browser storage is unavailable'); } }}>Save filter preset</button>
        <button type="button" className="font-semibold text-primary underline" onClick={() => { try { const p = JSON.parse(localStorage.getItem('nova-inventory-preset') || 'null'); if (!p) { toast.error('Save a preset first'); return; } setSearchTerm(p.searchTerm || ''); setStatusFilter(p.statusFilter || 'all'); setVisibilityFilter(p.visibilityFilter || 'all'); setCategoryFilter(p.categoryFilter || 'all'); setBhkFilter(p.bhkFilter || 'all'); setLocalityFilter(p.localityFilter || 'all'); setAreaMin(p.areaMin || ''); setAreaMax(p.areaMax || ''); } catch { toast.error('Could not restore preset'); } }}>Restore preset</button>
      </div>
      {loadError && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-red-800">Inventory could not be refreshed. Existing results may be out of date. Use Refresh inventory to retry.</p>}
      <div className="mb-6 space-y-4">
        <div className="relative w-full">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/30 sm:py-2"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select aria-label="Sale or rent" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30 sm:py-2">
            <option value="all">All Status</option>
            <option value="buy">For Sale</option>
            <option value="rent">For Rent</option>
          </select>

          <select aria-label="Visibility" value={visibilityFilter} onChange={(e) => setVisibilityFilter(e.target.value as any)} className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30 sm:py-2">
            <option value="all">All Visibility</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>

          <select aria-label="Category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30 sm:py-2">
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          <select aria-label="Sort properties" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30 sm:py-2">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm">BHK
            <select aria-label="BHK" value={bhkFilter} onChange={e => setBhkFilter(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 p-3">
              <option value="all">All BHK</option>
              {Array.from(new Set(properties.filter(p => p.bedrooms > 0).map(p => p.bedrooms))).sort((a,b) => a-b).map(beds => <option key={beds} value={beds}>{beds} BHK</option>)}
            </select>
          </label>
          <label className="text-sm">Locality / area
            <select aria-label="Locality or area" value={localityFilter} onChange={e => setLocalityFilter(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 p-3">
              <option value="all">All areas</option>
              {Array.from(new Set(properties.map(p => p.locality?.trim() || p.location.trim()))).filter(Boolean).sort().map(area => <option key={area} value={area}>{area}</option>)}
            </select>
          </label>
          <label className="text-sm">Min size (sq ft)<input aria-label="Minimum size in square feet" type="number" min="0" value={areaMin} onChange={e => setAreaMin(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 p-3" /></label>
          <label className="text-sm">Max size (sq ft)<input aria-label="Maximum size in square feet" type="number" min="0" value={areaMax} onChange={e => setAreaMax(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 p-3" /></label>
        </div>
        {areaMin && areaMax && Number(areaMin) > Number(areaMax) && <p role="alert" className="text-sm text-red-700">Minimum size must not exceed maximum size.</p>}
        <button type="button" onClick={() => { setSearchTerm(''); setStatusFilter('all'); setVisibilityFilter('all'); setCategoryFilter('all'); setBhkFilter('all'); setLocalityFilter('all'); setAreaMin(''); setAreaMax(''); }} className="text-sm font-semibold text-primary underline">Clear filters</button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-100 bg-white p-6 text-center text-gray-600 shadow-sm">Loading properties...</div>
      ) : filteredProperties.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-8 text-center text-gray-600 shadow-sm sm:p-12">
          <Filter size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium">No properties found</p>
          <p className="mt-1 text-sm">Try adjusting your filters or search</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filteredProperties.slice((Math.min(page, Math.max(1, Math.ceil(filteredProperties.length / pageSize))) - 1) * pageSize, Math.min(page, Math.max(1, Math.ceil(filteredProperties.length / pageSize))) * pageSize).map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index, 10) * 0.03 }}
                className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="flex gap-3">
                  <img
                    src={property.images?.[0] || companyLogo}
                    alt={property.title}
                    className="h-20 w-20 flex-shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="line-clamp-2 font-semibold text-gray-900">{toTitleCase(property.title)}</h2>
                    <p className="mt-1 line-clamp-1 text-sm text-gray-600">{toTitleCase(property.location)}</p>
                    <p className="mt-2 font-semibold text-gray-900">{formatPrice(property.price, property.status)}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded bg-primary-light px-2.5 py-1 text-xs font-medium capitalize text-primary">{CATEGORY_LABELS[property.category]}</span>
                  <span className="text-xs text-gray-600">{property.bedrooms > 0 ? `${property.bedrooms} BHK` : 'BHK: N/A'} | {property.areaSqft.toLocaleString('en-IN')} sq ft</span>
                  {renderStatusBadge(property)}
                  <button
                    disabled={Boolean(pendingId) || Boolean(property.archivedAt)}
                    onClick={() => updatePropertyVisibility(property, property.isActive === false)}
                    className={`rounded px-2.5 py-1 text-xs font-medium ${property.isActive === false ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-800'}`}
                  >
                    {property.archivedAt ? 'Archived' : property.isActive === false ? 'Inactive' : 'Active'}
                  </button>
                  {property.featured && <span className="rounded bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">Featured</span>}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button onClick={() => property.archivedAt ? void restoreProperty(property).then(loadProperties).catch(e => toast.error(e.message)) : onEditProperty(property)} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-primary-light px-3 py-2 text-sm font-semibold text-primary">
                    <Edit2 size={16} />
                    {property.archivedAt ? 'Restore' : 'Edit'}
                  </button>
                  <button
                    disabled={Boolean(pendingId) || Boolean(property.archivedAt)}
                    onClick={() => updatePropertyVisibility(property, property.isActive === false)}
                    className={`min-h-[44px] rounded-lg px-3 py-2 text-sm font-semibold ${property.isActive === false ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}
                  >
                    {property.isActive === false ? 'Activate' : 'Deactivate'}
                  </button>
                  <button
                    onClick={() => handleDeleteProperty(property)}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600"
                  >
                    <Trash2 size={16} />
                    {property.archivedAt ? 'Delete permanently' : 'Archive'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm md:block">
            <table className="w-full min-w-[1400px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="sticky left-0 z-20 w-[18%] bg-gray-50 px-4 py-3 text-left font-semibold text-gray-700">Title</th>
                  <th className="w-[13%] px-4 py-3 text-left font-semibold text-gray-700">Location</th>
                  <th className="w-[9%] px-4 py-3 text-left font-semibold text-gray-700">Price</th>
                  {/* Edit sits right after the identifying columns (title/location/price)
                      so it's reachable without scrolling right past every status column. */}
                  <th className="w-[6%] px-4 py-3 text-left font-semibold text-gray-700">Edit</th>
                  <th className="w-[9%] px-4 py-3 text-left font-semibold text-gray-700">Category</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">BHK</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Size (sq ft)</th>
                  <th className="w-[7%] px-4 py-3 text-left font-semibold text-gray-700">Type</th>
                  <th className="w-[9%] px-4 py-3 text-left font-semibold text-gray-700">Visibility</th>
                  <th className="w-[7%] px-4 py-3 text-left font-semibold text-gray-700">Featured</th>
                  <th className="w-[9%] px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                  <th className="w-[13%] px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProperties.slice((Math.min(page, Math.max(1, Math.ceil(filteredProperties.length / pageSize))) - 1) * pageSize, Math.min(page, Math.max(1, Math.ceil(filteredProperties.length / pageSize))) * pageSize).map((property, index) => (
                  <motion.tr
                    key={property.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(index, 10) * 0.03 }}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="sticky left-0 z-10 bg-white px-4 py-3">
                      <div className="line-clamp-2 break-words font-medium text-gray-900">{toTitleCase(property.title)}</div>
                      {!property.locality?.trim() && <span className="text-xs text-amber-700">Missing locality</span>}
                      {property.archivedAt && <span className="block text-xs text-gray-500">Archived {new Date(property.archivedAt).toLocaleDateString('en-IN')}</span>}
                      {property.history?.length ? <details className="mt-1 text-xs text-gray-500"><summary className="cursor-pointer">Change history ({property.history.length})</summary><ol className="mt-2 space-y-2">{property.history.slice(-5).reverse().map((entry, i) => <li key={i}>{entry.operation} on {new Date(entry.at).toLocaleString('en-IN')} by {entry.actor}<br />{Object.keys(entry.changes).join(', ')}</li>)}</ol></details> : null}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div className="line-clamp-1">{toTitleCase(property.location)}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{formatPrice(property.price, property.status)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => property.archivedAt ? void restoreProperty(property).then(loadProperties).catch(e => toast.error(e.message)) : onEditProperty(property)} className="rounded-lg p-2 text-primary transition-colors hover:bg-primary-light" title={property.archivedAt ? 'Restore property' : 'Edit property'}>
                        <Edit2 size={18} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-primary-light px-2.5 py-1 text-xs font-medium capitalize text-primary">{CATEGORY_LABELS[property.category]}</span>

                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{property.bedrooms > 0 ? `${property.bedrooms} BHK` : 'N/A'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{property.areaSqft.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">{renderStatusBadge(property)}</td>
                    <td className="px-4 py-3">
                      <button
                        disabled={Boolean(pendingId) || Boolean(property.archivedAt)}
                    onClick={() => updatePropertyVisibility(property, property.isActive === false)}
                        className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${property.isActive === false ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
                      >
                        {property.archivedAt ? 'Archived' : property.isActive === false ? 'Inactive' : 'Active'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {property.featured && <span className="rounded bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">Yes</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{new Date(property.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          disabled={Boolean(pendingId) || Boolean(property.archivedAt)}
                    onClick={() => updatePropertyVisibility(property, property.isActive === false)}
                          className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${property.isActive === false ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
                        >
                          {property.isActive === false ? 'Activate' : 'Deactivate'}
                        </button>
                        <button
                          onClick={() => handleDeleteProperty(property)}
                          className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                          title={property.archivedAt ? 'Delete permanently' : 'Archive property'}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {filteredProperties.length > pageSize && <nav aria-label="Inventory pages" className="mt-5 flex items-center justify-between gap-3 text-sm">
        <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded border bg-white px-4 py-2 disabled:opacity-40">Previous</button>
        <span>Page {Math.min(page, Math.ceil(filteredProperties.length / pageSize))} of {Math.ceil(filteredProperties.length / pageSize)}</span>
        <button type="button" disabled={page >= Math.ceil(filteredProperties.length / pageSize)} onClick={() => setPage(page + 1)} className="rounded border bg-white px-4 py-2 disabled:opacity-40">Next</button>
      </nav>}
    </div>
  );
};
