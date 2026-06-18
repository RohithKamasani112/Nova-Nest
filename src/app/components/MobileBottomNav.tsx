import React from 'react';
import { Home, Search, Heart, User } from 'lucide-react';
import { motion } from 'motion/react';

interface MobileBottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isAuthenticated: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentPage,
  onNavigate,
  isAuthenticated,
}) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'properties', label: 'Search', icon: Search },
    { id: 'favorites', label: 'Saved', icon: Heart },
    {
      id: isAuthenticated ? 'profile' : 'login',
      label: isAuthenticated ? 'Profile' : 'Login',
      icon: User,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-40 safe-area-bottom shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
      <div className="grid grid-cols-4 gap-1 px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <motion.button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              whileTap={{ scale: 0.95 }}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all ${
                isActive
                  ? 'text-[#C9922A]'
                  : 'text-gray-600'
              }`}
            >
              <Icon
                size={22}
                className={`mb-1 ${isActive ? 'fill-[#FBF3E3]' : ''}`}
              />
              <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#C9922A] rounded-full"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
