import React, { useEffect, useState } from 'react';
import { getAllLeads, updateLeadStatus } from '../services/storageService';
import { Inquiry } from '../types';
import { motion } from 'motion/react';
import { Download, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

interface LeadsManagementPageProps {
  onNavigate: (page: string) => void;
}

const statusClass = (status: Inquiry['status']) =>
  status === 'pending'
    ? 'bg-yellow-100 text-yellow-800'
    : status === 'contacted'
    ? 'bg-[#FBF3E3] text-[#C9922A]'
    : 'bg-green-100 text-green-800';

export const LeadsManagementPage: React.FC<LeadsManagementPageProps> = () => {
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

    if (statusFilter !== 'all') filtered = filtered.filter((l) => l.status === statusFilter);
    if (typeFilter !== 'all') filtered = filtered.filter((l) => l.type === typeFilter);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.name.toLowerCase().includes(term) ||
          (l.email || '').toLowerCase().includes(term) ||
          l.phone.includes(searchTerm)
      );
    }

    setFilteredLeads(filtered);
  };

  const handleStatusChange = async (id: string, newStatus: 'pending' | 'contacted' | 'closed') => {
    try {
      await updateLeadStatus(id, newStatus);
      setLeads(leads.map((l) => (l.id === id ? { ...l, status: newStatus } : l)));
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
    <div className="max-w-7xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="mb-3 text-2xl font-bold text-gray-900 sm:text-3xl">Leads & Inquiries</h1>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
          <div className="flex items-center justify-between gap-2 rounded-lg border border-[#C9922A]/20 bg-[#FBF3E3] px-3 py-2 sm:justify-start sm:px-4">
            <span className="text-sm text-[#C9922A]">Total</span>
            <span className="font-bold text-[#C9922A]">{stats.total}</span>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 sm:justify-start sm:px-4">
            <span className="text-sm text-yellow-900">Pending</span>
            <span className="font-bold text-yellow-900">{stats.pending}</span>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-[#C9922A]/20 bg-[#FBF3E3] px-3 py-2 sm:justify-start sm:px-4">
            <span className="text-sm text-[#C9922A]">Contacted</span>
            <span className="font-bold text-[#C9922A]">{stats.contacted}</span>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 sm:justify-start sm:px-4">
            <span className="text-sm text-green-900">Closed</span>
            <span className="font-bold text-green-900">{stats.closed}</span>
          </div>
          <button
            onClick={exportCSV}
            className="col-span-2 flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 transition-colors hover:bg-gray-50 sm:col-span-1 sm:py-2"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C9922A]/30 sm:py-2"
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C9922A]/30 sm:py-2"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="contacted">Contacted</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C9922A]/30 sm:py-2"
          >
            <option value="all">All Types</option>
            <option value="contact-owner">Contact Owner</option>
            <option value="schedule-visit">Schedule Visit</option>
            <option value="request-info">Request Info</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-100 bg-white p-6 text-center text-gray-600 shadow-sm">Loading...</div>
      ) : filteredLeads.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-8 text-center text-gray-600 shadow-sm sm:p-12">
          <Filter size={44} className="mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium">No leads found</p>
          <p className="mt-1 text-sm">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filteredLeads.map((lead, index) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-semibold text-gray-900">{lead.name}</h2>
                    <p className="mt-1 break-all text-sm text-gray-600">{lead.email || '-'}</p>
                    <p className="mt-1 text-sm text-gray-600">{lead.phone}</p>
                  </div>
                  <span className={`rounded px-2.5 py-1 text-xs font-medium capitalize ${statusClass(lead.status)}`}>
                    {lead.status}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded bg-[#FBF3E3] px-2.5 py-1 text-xs font-medium capitalize text-[#C9922A]">{lead.type}</span>
                  <span className="text-xs text-gray-500">{new Date(lead.createdAt).toLocaleDateString()}</span>
                </div>

                <select
                  value={lead.status}
                  onChange={(e) => handleStatusChange(lead.id, e.target.value as 'pending' | 'contacted' | 'closed')}
                  className={`mt-4 w-full rounded-lg px-3 py-2 text-sm font-medium ${statusClass(lead.status)}`}
                >
                  <option value="pending">Pending</option>
                  <option value="contacted">Contacted</option>
                  <option value="closed">Closed</option>
                </select>
              </motion.div>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm md:block">
            <table className="w-full min-w-[860px] text-sm">
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
                      <span className="rounded bg-[#FBF3E3] px-2.5 py-1 text-xs font-medium capitalize text-[#C9922A]">{lead.type}</span>
                    </td>
                    <td className="px-6 py-3 text-gray-600">{new Date(lead.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-3">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value as 'pending' | 'contacted' | 'closed')}
                        className={`cursor-pointer rounded px-2.5 py-1 text-xs font-medium ${statusClass(lead.status)}`}
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
          </div>
        </>
      )}
    </div>
  );
};
