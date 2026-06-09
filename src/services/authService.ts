import { AuthUser, LoginCredentials } from '../types';
import toast from 'react-hot-toast';

// Simple hardcoded admin credentials
const ADMIN_EMAIL = 'admin@realestate.com';
const ADMIN_PASSWORD = 'Admin123!';

// Login with hardcoded credentials
export const login = async (credentials: LoginCredentials): Promise<AuthUser> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  if (credentials.email !== ADMIN_EMAIL || credentials.password !== ADMIN_PASSWORD) {
    throw new Error('Invalid email or password. Use admin@realestate.com / Admin123!');
  }

  const authUser: AuthUser = {
    id: 'admin_001',
    email: ADMIN_EMAIL,
    name: 'Admin User',
  };

  // Store in localStorage for persistence
  localStorage.setItem('estate_auth_user', JSON.stringify(authUser));
  return authUser;
};

// Logout
export const logout = async (): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  localStorage.removeItem('estate_auth_user');
};

// Get current user from localStorage
export const getCurrentAuthUser = async (): Promise<AuthUser | null> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  try {
    const stored = localStorage.getItem('estate_auth_user');
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  } catch (error) {
    console.error('Error retrieving auth user:', error);
    return null;
  }
};

// Unused functions (kept for compatibility)
export const signup = async (): Promise<AuthUser> => {
  throw new Error('Signup not available. Contact admin.');
};

export const confirmSignup = async (): Promise<void> => {
  throw new Error('Not implemented');
};

export const requestPasswordReset = async (): Promise<void> => {
  throw new Error('Not implemented');
};

export const confirmPasswordReset = async (): Promise<void> => {
  throw new Error('Not implemented');
};

