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
    <div className="p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">{today}</p>
        </div>
        <button
          onClick={() => onNavigate('add-property')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
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
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Properties</p>
              <p className="text-3xl font-bold text-gray-900">
                {loading ? '-' : properties.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Building2 size={24} className="text-blue-600" />
            </div>
          </div>
        </motion.div>

        {/* For Sale */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">For Sale</p>
              <p className="text-3xl font-bold text-green-600">
                {loading ? '-' : forSaleCount}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <Tag size={24} className="text-green-600" />
            </div>
          </div>
        </motion.div>

        {/* For Rent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">For Rent</p>
              <p className="text-3xl font-bold text-purple-600">
                {loading ? '-' : forRentCount}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <Key size={24} className="text-purple-600" />
            </div>
          </div>
        </motion.div>

        {/* Total Leads */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Leads</p>
              <p className="text-3xl font-bold text-orange-600">
                {loading ? '-' : leads.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
              <Users size={24} className="text-orange-600" />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Properties */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Recent Properties</h2>
              <button
                onClick={() => onNavigate('manage-properties')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
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
                  <div key={prop.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50">
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Recent Leads</h2>
              <button
                onClick={() => onNavigate('leads')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
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
                      <span className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${lead.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : lead.status === 'contacted' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
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
