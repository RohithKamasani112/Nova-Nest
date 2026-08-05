import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import companyLogo from '../assets/companyLogo.png';

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login({ email, password });
      onNavigate('dashboard');
    } catch (error) {
      // Error already handled by context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal">
      {/* Back Button */}
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8">
        <button
          onClick={() => onNavigate('home')}
          className="flex min-h-[44px] items-center gap-2 text-white hover:text-gray-200 transition-colors"
        >
          <Home size={20} />
          <span className="hidden sm:inline">Back to Home</span>
        </button>
      </div>

      <div className="flex min-h-screen">
        {/* Left Panel - Desktop Only */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 text-white">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-md"
          >
            <div className="mb-8">
              <img src={companyLogo} alt="Nova Nest Property Management" className="mb-4 h-16 w-16 rounded-xl object-cover" />
              <h1 className="text-4xl font-bold mb-2">Nova Nest</h1>
              <p className="text-gray-300">Secure Admin Access</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm font-bold">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Manage Properties</h3>
                  <p className="text-sm text-gray-400">Add, edit, and manage all your listings</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm font-bold">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Track Inquiries</h3>
                  <p className="text-sm text-gray-400">Monitor leads and customer interactions</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm font-bold">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Analytics Dashboard</h3>
                  <p className="text-sm text-gray-400">View performance metrics and insights</p>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-700">
              <p className="text-xs text-gray-400">Secure admin access only</p>
            </div>
          </motion.div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center items-center px-5 py-20 sm:p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-2 sm:text-3xl">Admin Login</h2>
            <p className="text-gray-600 mb-8">Enter your secure admin details to continue</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="Email address"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full min-h-[44px] py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
