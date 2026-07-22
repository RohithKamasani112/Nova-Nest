import { Building2, FileCheck2, Paintbrush, type LucideIcon } from 'lucide-react';

// Nova Nest's non-listing service offerings — shown as a condensed teaser on
// the homepage (src/app/components/ServicesTeaserSection.tsx) and in full
// detail on the dedicated page (src/pages/ServicesPage.tsx). Pure content, no
// markup, so copy can be edited here without touching either component.

export interface ServiceItem {
  title: string;
  description: string;
}

export interface ServiceCategory {
  id: string;
  title: string;
  icon: LucideIcon;
  teaserSubtitle: string;
  items: ServiceItem[];
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'maintenance',
    title: 'Property Maintenance & Improvements',
    icon: Paintbrush,
    teaserSubtitle: 'Painting, repairs, and deep cleaning',
    items: [
      {
        title: 'Interior Design & Painting Solutions',
        description: 'Fresh looks, rental-ready makeovers',
      },
      {
        title: 'Carpentry, Plumbing & Electrical Repairs',
        description: 'Quick fixes, zero hassle',
      },
      {
        title: 'Deep Cleaning Services',
        description: 'Move-in / Move-out / Deep Sanitization',
      },
    ],
  },
  {
    id: 'documentation',
    title: 'Documentation & Legal Assistance',
    icon: FileCheck2,
    teaserSubtitle: 'Registration, Khata, BESCOM transfer',
    items: [
      {
        title: 'Property Registration',
        description: 'Guidance & support',
      },
      {
        title: 'Khata Transfer & E-Khata',
        description: 'BBMP / BBMP East hassle-free',
      },
      {
        title: 'BESCOM Name Change',
        description: 'Smooth utility transfer',
      },
    ],
  },
  {
    id: 'management',
    title: 'Property Management',
    icon: Building2,
    teaserSubtitle: 'Tenant checks, inspections, outstation care',
    items: [
      {
        title: 'Tenant Screening & Verification',
        description: 'Background + document checks',
      },
      {
        title: 'Regular Property Inspections',
        description: 'Keep your asset in top shape',
      },
      {
        title: 'End-to-End Management for Outstation Owners',
        description: 'Rent, maintenance, and updates from one team',
      },
    ],
  },
];
