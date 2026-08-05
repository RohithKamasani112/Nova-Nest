import { AuthUser, LoginCredentials } from '../types';
import { crmApi } from './crmApi';

export const login = async (credentials: LoginCredentials): Promise<AuthUser> => {
  const { data } = await crmApi.post<{ user: { id: string; email: string; name: string }; token: string }>(
    '/auth/login',
    { email: credentials.email, password: credentials.password }
  );

  const authUser: AuthUser = {
    id: data.user.id,
    email: data.user.email,
    name: data.user.name,
    accessToken: data.token,
  };

  // Store in localStorage for persistence
  localStorage.setItem('estate_auth_user', JSON.stringify(authUser));
  return authUser;
};

// Logout
export const logout = async (): Promise<void> => {
  localStorage.removeItem('estate_auth_user');
};

// Get current user from localStorage
export const getCurrentAuthUser = async (): Promise<AuthUser | null> => {
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
