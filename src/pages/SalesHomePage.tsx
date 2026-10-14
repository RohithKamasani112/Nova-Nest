import React, { useEffect, useState } from 'react';

import toast from 'react-hot-toast';
import { ArrowRight } from 'lucide-react';
import { listAgents } from '../services/crmApi';
import { CrmAgent } from '../types/crm';
import { useAuth } from '../contexts/AuthContext';
import { SALES_VIEW_AGENT_KEY, SALES_VIEW_AGENT_NAME_KEY } from '../utils/salesView';
import companyLogo from '../assets/companyLogo.png';

// Landing screen for the shared sales login — "who's using this device
// right now?" Whoever picks a name only sees that agent's leads from here
// on (this device); picking "All leads" removes the filter entirely. No
// password per person — see crmVisuals/authService for why.
export const SalesHomePage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { logout } = useAuth();
  const [agents, setAgents] = useState<CrmAgent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAgents()
      .then(setAgents)
      .catch(() => toast.error('Could not load the team list.'))
      .finally(() => setLoading(false));
  }, []);

  const choose = (id: string, name: string) => {
    localStorage.setItem(SALES_VIEW_AGENT_KEY, id);
    localStorage.setItem(SALES_VIEW_AGENT_NAME_KEY, name);
    onNavigate('sales-leads');
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
      {/* Sized by height, not force-cropped into a square — see
          AdminSidebar.tsx/LoginPage.tsx for the same fix and why. */}
      <img src={companyLogo} className="mx-auto mb-6 h-14 w-auto rounded-xl" alt="Nova Nest" />
      <h1 className="text-center text-xl font-bold text-gray-900">Who's this?</h1>
      <p className="mb-6 text-center text-sm text-gray-600">Pick your name to see just your leads, or view everyone's.</p>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => choose('all', 'All leads')}
            className="tap-target flex w-full items-center justify-between rounded-xl border-2 border-primary bg-primary/5 px-4 py-3.5 text-left font-semibold text-primary"
          >
            All leads
            <ArrowRight size={18} />
          </button>
          {agents.length === 0 && (
            <p className="pt-2 text-center text-sm text-gray-500">
              No agents set up yet — ask the admin to add your name under CRM → Agents.
            </p>
          )}
          {agents.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => choose(a.id, a.name)}
              className="tap-target flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-left font-medium text-gray-900 hover:border-primary"
            >
              {a.name}
              <ArrowRight size={18} className="text-gray-400" />
            </button>
          ))}
        </div>
      )}

      <button type="button" onClick={() => logout()} className="tap-target mt-8 text-center text-sm text-gray-500 underline">
        Not you? Log out
      </button>
    </div>
  );
};
