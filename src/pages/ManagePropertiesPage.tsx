import React, { useEffect, useState } from 'react';
import { Property } from '../types';
import { getAllProperties, updateProperty } from '../services/storageService';
import { motion } from 'motion/react';
import { Edit2, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

interface ManagePropertiesPageProps {
  onEditProperty: (property: Property) => void;
}

const formatPrice = (price: number, status: 'buy' | 'rent'): string => {
  if (status === 'rent') return `₹${price.toLocaleString()}/month`;
  if (price >= 10000000) {
    return `₹${(price / 10000000).toFixed(2)} Cr`;
  } else if (price >= 100000) {
    return `₹${(price / 100000).toFixed(2)} L`;
  }
  return `₹${price.toLocaleString()}`;
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

    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    if (visibilityFilter !== 'all') {
      filtered = filtered.filter((p) =>
        visibilityFilter === 'active' ? p.isActive !== false : p.isActive === false
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

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

    if (!window.confirm(`Are you sure you want to ${action} this property?`)) {
      return;
    }

    try {
      await updateProperty(property.id, { isActive });
      await loadProperties();
      toast.success(isActive ? 'Property activated' : 'Property deactivated');
    } catch (error) {
      toast.error(`Failed to ${action} property`);
      console.error(`Error trying to ${action} property:`, error);
    }
  };

  const handleEdit = (property: Property) => {
    onEditProperty(property);
  };

  const handleVisibilityToggle = async (property: Property) => {
    await updatePropertyVisibility(property, property.isActive === false);
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

  return (
    <div className="p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Properties</h1>
        <p className="text-gray-600">
          {properties.length} total properties
        </p>
      </div>

      {/* Filters & Search */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-0 sm:min-w-80 relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by title or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9922A]/30"
            />
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9922A]/30"
          >
            <option value="all">All Status</option>
            <option value="buy">For Sale</option>
            <option value="rent">For Rent</option>
          </select>

          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9922A]/30"
          >
            <option value="all">All Visibility</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9922A]/30"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9922A]/30"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        {loading ? (
          <div className="p-6 text-center text-gray-600">Loading properties...</div>
        ) : filteredProperties.length === 0 ? (
          <div className="p-12 text-center text-gray-600">
            <Filter size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">No properties found</p>
            <p className="text-sm mt-1">Try adjusting your filters or search</p>
          </div>
        ) : (
          <table className="w-full min-w-[1040px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Title</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Location</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Price</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Category</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Type</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Visibility</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Featured</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Date</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Actions</th>
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
                  <td className="px-6 py-3">
                    <div className="font-medium text-gray-900 line-clamp-1">
                      {property.title}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-gray-600 line-clamp-1">
                    {property.location}
                  </td>
                  <td className="px-6 py-3 font-medium text-gray-900">
                    {formatPrice(property.price, property.status)}
                  </td>
                  <td className="px-6 py-3">
                    <span className="text-xs font-medium px-2.5 py-1 bg-[#FBF3E3] text-[#C9922A] rounded capitalize">
                      {property.category}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded ${
                        property.status === 'buy'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {property.status === 'buy' ? 'Sale' : 'Rent'}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => handleVisibilityToggle(property)}
                      className={`text-xs font-medium px-2.5 py-1 rounded transition-colors ${
                        property.isActive === false
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                      title={property.isActive === false ? 'Activate property' : 'Deactivate property'}
                    >
                      {property.isActive === false ? 'Inactive' : 'Active'}
                    </button>
                  </td>
                  <td className="px-6 py-3">
                    {property.featured && (
                      <span className="text-xs font-medium px-2.5 py-1 bg-amber-100 text-amber-800 rounded">
                        Yes
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {new Date(property.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(property)}
                        className="p-2 text-[#C9922A] hover:bg-[#FBF3E3] rounded-lg transition-colors"
                        title="Edit property"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => updatePropertyVisibility(property, property.isActive === false)}
                        className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                          property.isActive === false
                            ? 'text-green-700 bg-green-50 hover:bg-green-100'
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                        title={property.isActive === false ? 'Activate property' : 'Deactivate property'}
                      >
                        {property.isActive === false ? 'Activate' : 'Deactivate'}
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
