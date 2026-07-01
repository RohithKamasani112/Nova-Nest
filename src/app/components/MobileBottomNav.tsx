import React from 'react';
import { Search } from 'lucide-react';
import { motion } from 'motion/react';

interface MobileBottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isAuthenticated: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentPage,
  onNavigate,
}) => {
  const navItems = [
    { id: 'properties', label: 'Search', icon: Search },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-border z-40 safe-area-bottom shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
      <div className="flex justify-center gap-1 px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <motion.button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              whileTap={{ scale: 0.95 }}
              className={`flex min-h-[44px] flex-col items-center justify-center py-2 px-3 rounded-lg transition-all ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              <Icon
                size={22}
                className={`mb-1 ${isActive ? 'fill-primary-light' : ''}`}
              />
              <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
