import React, { useEffect, useState } from 'react';
import { getAllLeads, updateLeadStatus } from '../services/storageService';
import { Inquiry } from '../types';
import { motion } from 'motion/react';
import { Download, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

interface LeadsManagementPageProps {
  onNavigate: (page: string) => void;
}

export const LeadsManagementPage: React.FC<LeadsManagementPageProps> = ({
  onNavigate,
}) => {
  const [leads, setLeads] = useState<Inquiry[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLeads();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, statusFilter, typeFilter, searchTerm]);

  const loadLeads = async () => {
    try {
      const data = await getAllLeads();
      setLeads(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLeads = () => {
    let filtered = leads;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((l) => l.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((l) => l.type === typeFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (l) =>
          l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (l.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.phone.includes(searchTerm)
      );
    }

    setFilteredLeads(filtered);
  };

  const handleStatusChange = async (id: string, newStatus: 'pending' | 'contacted' | 'closed') => {
    try {
      await updateLeadStatus(id, newStatus);
      setLeads(
        leads.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
      );
      toast.success('Lead status updated');
    } catch (error) {
      toast.error('Failed to update lead');
    }
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Type', 'Status', 'Date'];
    const rows = filteredLeads.map((lead) => [
      lead.name,
      lead.email || '',
      lead.phone,
      lead.type,
      lead.status,
      new Date(lead.createdAt).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('CSV exported');
  };

  const stats = {
    total: leads.length,
    pending: leads.filter((l) => l.status === 'pending').length,
    contacted: leads.filter((l) => l.status === 'contacted').length,
    closed: leads.filter((l) => l.status === 'closed').length,
  };

  return (
    <div className="p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Leads & Inquiries</h1>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#FBF3E3] rounded-lg border border-[#C9922A]/20">
            <span className="text-sm text-[#C9922A]">Total:</span>
            <span className="font-bold text-[#C9922A]">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 rounded-lg border border-yellow-200">
            <span className="text-sm text-yellow-900">Pending:</span>
            <span className="font-bold text-yellow-900">{stats.pending}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-[#FBF3E3] rounded-lg border border-[#C9922A]/20">
            <span className="text-sm text-[#C9922A]">Contacted:</span>
            <span className="font-bold text-[#C9922A]">{stats.contacted}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg border border-green-200">
            <span className="text-sm text-green-900">Closed:</span>
            <span className="font-bold text-green-900">{stats.closed}</span>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9922A]/30"
        />

        <div className="flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9922A]/30"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="contacted">Contacted</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9922A]/30"
          >
            <option value="all">All Types</option>
            <option value="contact-owner">Contact Owner</option>
            <option value="schedule-visit">Schedule Visit</option>
            <option value="request-info">Request Info</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        {loading ? (
          <div className="p-6 text-center text-gray-600">Loading...</div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-12 text-center text-gray-600">
            <p className="text-lg font-medium">No leads found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Email</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Phone</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Type</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Date</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead, index) => (
                <motion.tr
                  key={lead.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-6 py-3 font-medium text-gray-900">{lead.name}</td>
                  <td className="px-6 py-3 text-gray-600">{lead.email || '-'}</td>
                  <td className="px-6 py-3 text-gray-600">{lead.phone}</td>
                  <td className="px-6 py-3">
                    <span className="text-xs font-medium capitalize px-2.5 py-1 bg-[#FBF3E3] text-[#C9922A] rounded">
                      {lead.type}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3">
                    <select
                      value={lead.status}
                      onChange={(e) =>
                        handleStatusChange(
                          lead.id,
                          e.target.value as 'pending' | 'contacted' | 'closed'
                        )
                      }
                      className={`px-2.5 py-1 rounded text-xs font-medium border-0 cursor-pointer ${
                        lead.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : lead.status === 'contacted'
                          ? 'bg-[#FBF3E3] text-[#C9922A]'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="contacted">Contacted</option>
                      <option value="closed">Closed</option>
                    </select>
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
