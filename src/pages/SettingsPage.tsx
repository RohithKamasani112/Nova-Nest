import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { KeyRound, Mail, Eye, EyeOff } from 'lucide-react';
import { getSalesAccount, updateSalesAccount } from '../services/crmApi';

const inputClass =
  'w-full min-w-0 rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-base outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 md:text-sm';

export const SettingsPage: React.FC = () => {
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSalesAccount()
      .then((r) => {
        setCurrentEmail(r.email);
        setEmail(r.email ?? '');
      })
      .catch(() => toast.error('Could not load the sales team login.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || password.trim().length < 8) {
      toast.error('Enter an email and a password of at least 8 characters.');
      return;
    }
    setSaving(true);
    try {
      const r = await updateSalesAccount(email.trim(), password);
      setCurrentEmail(r.email);
      setPassword('');
      toast.success('Sales team login updated.');
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Could not update the sales team login.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 font-['Playfair_Display'] text-2xl font-bold text-gray-900 sm:text-3xl">Settings</h1>
      <p className="mb-6 text-gray-600">Configure your application settings</p>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-1 text-lg font-bold text-gray-900">Sales Team Login</h2>
        <p className="mb-4 text-sm text-gray-600">
          One shared login for your whole sales team — whoever signs in picks their own name (or "All leads") to
          filter what they see, right on their own phone. Use the updated credentials for future sign-ins.
        </p>

        {loading ? (
          <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {currentEmail && (
              <p className="text-sm text-gray-600">
                Current login email: <span className="font-medium text-gray-900">{currentEmail}</span>
              </p>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">Email</label>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="off"
                  autoCorrect="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="sales@yourcompany.com"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">
                {currentEmail ? 'New password' : 'Password'}
              </label>
              <div className="relative">
                <KeyRound size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  autoCapitalize="off"
                  autoCorrect="off"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-10`}
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="tap-target absolute right-0 top-1/2 -translate-y-1/2 text-gray-400"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="tap-target w-full rounded-lg bg-primary px-5 font-semibold text-white transition-colors hover:bg-primary-dark disabled:bg-gray-400 sm:w-auto sm:px-6"
            >
              {saving ? 'Saving...' : currentEmail ? 'Update login' : 'Create sales login'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
