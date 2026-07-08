import React, { useState } from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Building2,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import companyLogo from '../../assets/kmr-logo.svg';

interface AdminSidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'add-property', label: 'Add Property', icon: PlusCircle },
  { id: 'manage-properties', label: 'Manage Properties', icon: Building2 },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentPage,
  onNavigate,
  onLogout,
}) => {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  const go = (id: string) => {
    onNavigate(id);
    setOpen(false);
  };

  const body = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="mb-4 border-b border-white/10 p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-lg">
            <img src={companyLogo} alt="KMR Real Estates" className="h-full w-full object-cover" />
          </div>
          <div>
            <h2 className="font-bold text-white">KMR Real Estates</h2>
            <p className="text-xs text-sidebar-text">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => go(item.id)}
              whileHover={reduce ? undefined : { x: 4 }}
              whileTap={reduce ? undefined : { scale: 0.98 }}
              className={`flex min-h-[44px] w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                isActive
                  ? 'border-l-4 border-primary bg-primary/20 text-white'
                  : 'text-sidebar-text hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="truncate">{item.label}</span>
            </motion.button>
          );
        })}
      </nav>

      {/* Profile + Logout */}
      <div className="border-t border-white/10 p-4">
        <div className="mb-3 rounded-xl bg-white/5 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/30 font-semibold text-white">
              A
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Admin</div>
              <div className="text-xs text-sidebar-text">Property Manager</div>
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-sidebar-text transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger (top-left) */}
      <button
        onClick={() => setOpen(true)}
        className="fixed left-3 top-3 z-40 flex h-11 w-11 items-center justify-center rounded-xl bg-charcoal text-white shadow-lg md:hidden"
        aria-label="Open admin menu"
      >
        <Menu size={22} />
      </button>

      {/* Desktop fixed sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col bg-charcoal md:flex">
        {body}
      </aside>

      {/* Mobile slide-in drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
            />
            <motion.aside
              initial={reduce ? { opacity: 0 } : { x: '-100%' }}
              animate={reduce ? { opacity: 1 } : { x: 0 }}
              exit={reduce ? { opacity: 0 } : { x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="fixed left-0 top-0 z-50 h-screen w-72 max-w-[82%] bg-charcoal md:hidden"
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute right-3 top-4 flex h-9 w-9 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-sidebar-text hover:bg-white/10 hover:text-white"
                aria-label="Close admin menu"
              >
                <X size={22} />
              </button>
              {body}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
