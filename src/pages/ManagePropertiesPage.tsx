import React, { useEffect, useState } from 'react';
import { Property } from '../types';
import { getAllProperties, updateProperty, deleteProperty } from '../services/storageService';
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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'buy' | 'rent'>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price-asc' | 'price-desc'>('newest');

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    filterAndSortProperties();
  }, [properties, searchTerm, statusFilter, visibilityFilter, categoryFilter, sortBy]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const data = await getAllProperties();
      setProperties(data);
    } catch (error) {
      toast.error('Failed to load properties');
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProperties = () => {
    let filtered = [...properties];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          p.location.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') filtered = filtered.filter((p) => p.status === statusFilter);
    if (visibilityFilter !== 'all') {
      filtered = filtered.filter((p) =>
        visibilityFilter === 'active' ? p.isActive !== false : p.isActive === false
      );
    }
    if (categoryFilter !== 'all') filtered = filtered.filter((p) => p.category === categoryFilter);

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
    const action = isActive ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${action} this property?`)) return;

    try {
      await updateProperty(property.id, { isActive });
      // Update local state directly. Re-fetching from S3 here can read a stale
      // copy (read-after-write is not immediately consistent), which made the
      // toggle look like it "didn't work".
      setProperties((prev) =>
        prev.map((p) => (p.id === property.id ? { ...p, isActive } : p))
      );
      toast.success(isActive ? 'Property activated' : 'Property deactivated');
    } catch (error) {
      toast.error(`Failed to ${action} property`);
      console.error(`Error trying to ${action} property:`, error);
    }
  };

  const handleDeleteProperty = async (property: Property) => {
    if (!window.confirm(`Permanently delete "${property.title}"? This also removes its images and cannot be undone.`)) return;

    try {
      await deleteProperty(property.id);
      await loadProperties();
      toast.success('Property deleted');
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
    { value: 'condo', label: 'Condo' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'land', label: 'Land' },
  ];

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
        <p className="text-sm text-gray-600 sm:text-base">{properties.length} total properties</p>
      </div>

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
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30 sm:py-2">
            <option value="all">All Status</option>
            <option value="buy">For Sale</option>
            <option value="rent">For Rent</option>
          </select>

          <select value={visibilityFilter} onChange={(e) => setVisibilityFilter(e.target.value as any)} className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30 sm:py-2">
            <option value="all">All Visibility</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30 sm:py-2">
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30 sm:py-2">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
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
            {filteredProperties.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
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
                  <span className="rounded bg-primary-light px-2.5 py-1 text-xs font-medium capitalize text-primary">{property.category}</span>
                  {renderStatusBadge(property)}
                  <button
                    onClick={() => updatePropertyVisibility(property, property.isActive === false)}
                    className={`rounded px-2.5 py-1 text-xs font-medium ${property.isActive === false ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-800'}`}
                  >
                    {property.isActive === false ? 'Inactive' : 'Active'}
                  </button>
                  {property.featured && <span className="rounded bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">Featured</span>}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button onClick={() => onEditProperty(property)} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-primary-light px-3 py-2 text-sm font-semibold text-primary">
                    <Edit2 size={16} />
                    Edit
                  </button>
                  <button
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
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm md:block">
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="w-[18%] px-4 py-3 text-left font-semibold text-gray-700">Title</th>
                  <th className="w-[13%] px-4 py-3 text-left font-semibold text-gray-700">Location</th>
                  <th className="w-[9%] px-4 py-3 text-left font-semibold text-gray-700">Price</th>
                  {/* Edit sits right after the identifying columns (title/location/price)
                      so it's reachable without scrolling right past every status column. */}
                  <th className="w-[6%] px-4 py-3 text-left font-semibold text-gray-700">Edit</th>
                  <th className="w-[9%] px-4 py-3 text-left font-semibold text-gray-700">Category</th>
                  <th className="w-[7%] px-4 py-3 text-left font-semibold text-gray-700">Type</th>
                  <th className="w-[9%] px-4 py-3 text-left font-semibold text-gray-700">Visibility</th>
                  <th className="w-[7%] px-4 py-3 text-left font-semibold text-gray-700">Featured</th>
                  <th className="w-[9%] px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                  <th className="w-[13%] px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProperties.map((property, index) => (
                  <motion.tr
                    key={property.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <div className="line-clamp-2 break-words font-medium text-gray-900">{toTitleCase(property.title)}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div className="line-clamp-1">{toTitleCase(property.location)}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{formatPrice(property.price, property.status)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => onEditProperty(property)} className="rounded-lg p-2 text-primary transition-colors hover:bg-primary-light" title="Edit property">
                        <Edit2 size={18} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-primary-light px-2.5 py-1 text-xs font-medium capitalize text-primary">{property.category}</span>
                    </td>
                    <td className="px-4 py-3">{renderStatusBadge(property)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => updatePropertyVisibility(property, property.isActive === false)}
                        className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${property.isActive === false ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
                      >
                        {property.isActive === false ? 'Inactive' : 'Active'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {property.featured && <span className="rounded bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">Yes</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{new Date(property.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updatePropertyVisibility(property, property.isActive === false)}
                          className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${property.isActive === false ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
                        >
                          {property.isActive === false ? 'Activate' : 'Deactivate'}
                        </button>
                        <button
                          onClick={() => handleDeleteProperty(property)}
                          className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                          title="Delete property"
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
    </div>
  );
};
