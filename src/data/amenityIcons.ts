import {
  Baby,
  Building2,
  Car,
  Cctv,
  Dumbbell,
  Flame,
  Home,
  Landmark,
  Phone,
  ShieldCheck,
  Sparkles,
  Trees,
  Users,
  Wifi,
  Zap,
  type LucideIcon,
} from 'lucide-react';

// Shared between the admin form's amenity checklist and the public property
// page's Amenities tab, so both stay visually consistent.
export const AMENITY_ICONS: Record<string, LucideIcon> = {
  'Swimming Pool': Home,
  Gym: Dumbbell,
  'Covered Parking': Car,
  'Garden / Lawn': Trees,
  '24/7 Security': ShieldCheck,
  'Elevator / Lift': Building2,
  'Power Backup': Zap,
  Clubhouse: Users,
  "Children's Play Area": Baby,
  'Jogging Track': Users,
  'CCTV Surveillance': Cctv,
  'Gated Community': ShieldCheck,
  'Vastu Compliant': Landmark,
  'Fire Safety System': Flame,
  'High-Speed Internet': Wifi,
  '24/7 Water Supply': Home,
  'Rainwater Harvesting': Home,
  'Intercom Facility': Phone,
  'Visitor Parking': Car,
  'Maintenance Staff': Users,
};

export const getAmenityIcon = (amenity: string): LucideIcon => AMENITY_ICONS[amenity] || Sparkles;
