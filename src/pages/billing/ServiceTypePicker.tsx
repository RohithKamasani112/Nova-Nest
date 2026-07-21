import React from 'react';
import { motion } from 'motion/react';
import { Building2, Home, Percent, Wrench } from 'lucide-react';
import { BillingDocType } from '../../types';

export type ServiceTile = BillingDocType | 'commission_sale' | 'commission_rental';

interface TileDef {
  id: ServiceTile;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  accent: string; // matches the category-pill color for this doc type
}

const TILES: TileDef[] = [
  {
    id: 'sale_booking',
    title: 'Property Sale',
    subtitle: 'Booking Confirmation',
    icon: Building2,
    accent: '#1b7f3f',
  },
  {
    id: 'commission_sale',
    title: 'Sale Commission',
    subtitle: 'GST Invoice',
    icon: Percent,
    accent: '#8a6a12',
  },
  {
    id: 'commission_rental',
    title: 'Rental Commission',
    subtitle: 'GST Invoice',
    icon: Home,
    accent: '#1c5cb8',
  },
  {
    id: 'service',
    title: 'Home Maintenance',
    subtitle: 'Service Invoice',
    icon: Wrench,
    accent: '#7233a8',
  },
];

interface ServiceTypePickerProps {
  onSelect: (tile: ServiceTile) => void;
}

export const ServiceTypePicker: React.FC<ServiceTypePickerProps> = ({ onSelect }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {TILES.map((tile, index) => {
      const Icon = tile.icon;
      return (
        <motion.button
          key={tile.id}
          type="button"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onSelect(tile.id)}
          className="flex flex-col items-start gap-3 rounded-2xl border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: `${tile.accent}1a`, color: tile.accent }}
          >
            <Icon size={22} />
          </div>
          <div>
            <div className="font-['Playfair_Display'] text-lg font-bold text-gray-900">{tile.title}</div>
            <div className="text-sm text-gray-600">{tile.subtitle}</div>
          </div>
        </motion.button>
      );
    })}
  </div>
);
