// Property Types
export interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  description: string;
  images: string[];
  videos: string[];
  brochure?: string;
  category: 'apartment' | 'house' | 'villa' | 'condo' | 'townhouse' | 'land';
  status: 'buy' | 'rent';
  bedrooms: number;
  bathrooms: number;
  areaSqft: number;
  amenities: string[];
  featured: boolean;
  verified: boolean;
  createdAt: string;
  updatedAt?: string;
  ownerId?: string;
  yearBuilt?: number;
  parking?: number;
  floors?: number;
  furnished?: boolean;
  latitude?: number;
  longitude?: number;
  videoUrl?: string; // YouTube URL
  isDummy?: boolean; // Flag for dummy data visibility control
}

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'admin';
  favorites: string[]; // Property IDs
  createdAt: string;
  verified: boolean;
}

// Filter Types
export interface PropertyFilters {
  status?: 'buy' | 'rent';
  category?: Property['category'][];
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number[];
  bathrooms?: number[];
  areaMin?: number;
  areaMax?: number;
  amenities?: string[];
  location?: string;
  featured?: boolean;
  verified?: boolean;
  search?: string;
}

// Sort Options
export type SortOption =
  | 'price-asc'
  | 'price-desc'
  | 'newest'
  | 'oldest'
  | 'area-asc'
  | 'area-desc';

// Inquiry Types
export interface Inquiry {
  id: string;
  propertyId: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  type: 'schedule-visit' | 'contact-owner' | 'request-info';
  createdAt: string;
  status: 'pending' | 'contacted' | 'closed';
}

// Storage Types
export interface StorageConfig {
  isProduction: boolean;
  s3Config?: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucketName: string;
    folderName: string;
  };
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination Types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Auth Types
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  accessToken?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  name: string;
  phone?: string;
}
