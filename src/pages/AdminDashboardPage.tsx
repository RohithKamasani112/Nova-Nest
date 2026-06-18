import React, { useEffect, useState } from 'react';
import { getAllProperties, getAllLeads, deleteProperty } from '../services/storageService';
import { Property, Inquiry } from '../types';
import { motion } from 'motion/react';
import {
  Building2,
  Tag,
  Key,
  Users,
  Plus,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminDashboardPageProps {
  onNavigate: (page: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  onNavigate,
}) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [leads, setLeads] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [propsData, leadsData] = await Promise.all([
        getAllProperties(),
        getAllLeads(),
      ]);
      setProperties(propsData);
      setLeads(leadsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      await deleteProperty(id);
      setProperties(properties.filter((p) => p.id !== id));
      toast.success('Property deleted successfully');
    } catch (error) {
      toast.error('Failed to delete property');
    }
  };

  const forSaleCount = properties.filter((p) => p.status === 'buy').length;
  const forRentCount = properties.filter((p) => p.status === 'rent').length;

  const recentProperties = properties.slice(0, 5);
  const recentLeads = leads.slice(0, 5);

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-['Playfair_Display'] text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">{today}</p>
        </div>
        <button
          onClick={() => onNavigate('add-property')}
          className="flex items-center gap-2 px-6 py-3 bg-[#C9922A] text-white rounded-xl font-semibold hover:bg-[#b07d20] transition-colors"
        >
          <Plus size={20} />
          Add Property
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Properties */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mt-1">Total Properties</p>
              <p className="text-3xl font-bold text-gray-900">
                {loading ? '-' : properties.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#C9922A]/10 rounded-xl flex items-center justify-center text-[#C9922A]">
              <Building2 size={24} />
            </div>
          </div>
        </motion.div>

        {/* For Sale */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mt-1">Active Listings</p>
              <p className="text-3xl font-bold text-gray-900">
                {loading ? '-' : forSaleCount}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#C9922A]/10 rounded-xl flex items-center justify-center text-[#C9922A]">
              <Tag size={24} />
            </div>
          </div>
        </motion.div>

        {/* For Rent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mt-1">Rental Listings</p>
              <p className="text-3xl font-bold text-gray-900">
                {loading ? '-' : forRentCount}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#C9922A]/10 rounded-xl flex items-center justify-center text-[#C9922A]">
              <Key size={24} />
            </div>
          </div>
        </motion.div>

        {/* Total Leads */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mt-1">Total Leads</p>
              <p className="text-3xl font-bold text-gray-900">
                {loading ? '-' : leads.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#C9922A]/10 rounded-xl flex items-center justify-center text-[#C9922A]">
              <Users size={24} />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Properties */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Recent Listings</h2>
              <button
                onClick={() => onNavigate('manage-properties')}
                className="text-[#C9922A] hover:text-[#b07d20] text-sm font-medium"
              >
                View All
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : recentProperties.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No properties yet</p>
            ) : (
              <div className="space-y-3">
                {recentProperties.map((prop) => (
                  <div key={prop.id} className="flex items-center gap-4 p-3 rounded-lg even:bg-gray-50 hover:bg-[#FBF3E3]">
                    {prop.images.length > 0 && (
                      <img src={prop.images[0]} alt={prop.title} className="w-16 h-16 rounded-lg object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 line-clamp-1">{prop.title}</div>
                      <div className="text-sm text-gray-600">{prop.location}</div>
                    </div>
                    <button
                      onClick={() => handleDeleteProperty(prop.id)}
                      className="p-1 hover:bg-red-100 rounded transition-colors"
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Leads */}
        <div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Recent Leads</h2>
              <button
                onClick={() => onNavigate('leads')}
                className="text-[#C9922A] hover:text-[#b07d20] text-sm font-medium"
              >
                View All
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : recentLeads.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No leads yet</p>
            ) : (
              <div className="space-y-3">
                {recentLeads.map((lead) => (
                  <div key={lead.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-medium text-gray-900 text-sm">{lead.name}</p>
                    <p className="text-xs text-gray-600">{lead.email}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${lead.status === 'pending' ? 'bg-amber-100 text-amber-800' : lead.status === 'contacted' ? 'bg-[#FBF3E3] text-[#C9922A]' : 'bg-green-100 text-green-800'}`}>
                        {lead.status}
                      </span>
                      <span className="text-xs text-gray-500">{new Date(lead.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
