import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Building2,
  Users,
  Settings,
  LogOut,
} from 'lucide-react';
import { motion } from 'motion/react';

interface AdminSidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentPage,
  onNavigate,
  onLogout,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'add-property', label: 'Add Property', icon: PlusCircle },
    { id: 'manage-properties', label: 'Manage Properties', icon: Building2 },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 z-50 flex h-16 w-full bg-[#0F1F3D] md:top-0 md:h-screen md:w-64 md:flex-col">
      {/* Logo */}
      <div className="hidden p-6 border-b border-white/10 pb-4 mb-4 md:block">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-lg bg-[#C9922A]">
            <img src="/nova-nest-logo.png" alt="Nova Nest Property Management" className="h-full w-full object-cover" />
          </div>
          <div>
            <h2 className="font-bold text-white">Nova Nest</h2>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 items-center justify-around gap-1 px-2 md:block md:space-y-1 md:px-0">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <motion.button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all text-sm md:mx-2 md:w-[calc(100%-1rem)] md:justify-start md:gap-3 md:px-4 md:py-3 ${
                isActive
                  ? 'bg-[#C9922A]/20 text-[#C9922A] font-semibold border-l-4 border-[#C9922A]'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="hidden md:inline">{item.label}</span>
            </motion.button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="hidden p-4 border-t border-white/10 md:block">
        <div className="bg-white/5 rounded-xl p-3 mx-2 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#C9922A]/20 text-[#C9922A] flex items-center justify-center font-semibold">
              A
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Admin</div>
              <div className="text-xs text-gray-400">Property Manager</div>
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-[calc(100%-1rem)] mx-2 flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all text-sm"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};
