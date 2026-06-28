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
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-['Playfair_Display'] text-2xl font-bold text-gray-900 sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600 sm:text-base">{today}</p>
        </div>
        <button
          onClick={() => onNavigate('add-property')}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white transition-colors hover:bg-primary-dark sm:w-auto sm:px-6"
        >
          <Plus size={20} />
          Add Property
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-3 mb-6 sm:grid-cols-2 sm:gap-4 sm:mb-8 lg:grid-cols-4">
        {/* Total Properties */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 sm:p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mt-1">Total Properties</p>
              <p className="text-3xl font-bold text-gray-900">
                {loading ? '-' : properties.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Building2 size={24} />
            </div>
          </div>
        </motion.div>

        {/* For Sale */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 sm:p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mt-1">For Sale</p>
              <p className="text-3xl font-bold text-gray-900">
                {loading ? '-' : forSaleCount}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Tag size={24} />
            </div>
          </div>
        </motion.div>

        {/* For Rent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 sm:p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mt-1">Rental Listings</p>
              <p className="text-3xl font-bold text-gray-900">
                {loading ? '-' : forRentCount}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Key size={24} />
            </div>
          </div>
        </motion.div>

        {/* Total Leads */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 sm:p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mt-1">Total Leads</p>
              <p className="text-3xl font-bold text-gray-900">
                {loading ? '-' : leads.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Users size={24} />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Properties */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Recent Listings</h2>
              <button
                onClick={() => onNavigate('manage-properties')}
                className="min-h-[44px] text-primary hover:text-primary-dark text-sm font-medium"
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
                  <div key={prop.id} className="flex items-center gap-3 p-3 rounded-lg even:bg-gray-50 hover:bg-primary-light sm:gap-4">
                    {prop.images.length > 0 && (
                      <img src={prop.images[0]} alt={prop.title} className="h-14 w-14 rounded-lg object-cover sm:h-16 sm:w-16" />
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Recent Leads</h2>
              <button
                onClick={() => onNavigate('leads')}
                className="min-h-[44px] text-primary hover:text-primary-dark text-sm font-medium"
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
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${lead.status === 'pending' ? 'bg-amber-100 text-amber-800' : lead.status === 'contacted' ? 'bg-primary-light text-primary' : 'bg-green-100 text-green-800'}`}>
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
