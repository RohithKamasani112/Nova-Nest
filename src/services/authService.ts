import { AuthUser, LoginCredentials } from '../types';
import { crmApi } from './crmApi';

// Real backend login (server/src/routes/auth.ts) — replaces the old
// hardcoded ADMIN_EMAIL/ADMIN_PASSWORD check now that the CRM's Postgres
// `users` table is the actual source of truth for admin credentials.
export const login = async (credentials: LoginCredentials): Promise<AuthUser> => {
  const { data } = await crmApi.post<{ user: { id: string; email: string; name: string; role: string }; token: string }>(
    '/auth/login',
    { email: credentials.email, password: credentials.password }
  );

  const authUser: AuthUser = {
    id: data.user.id,
    email: data.user.email,
    name: data.user.name,
    role: data.user.role,
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
      const session = JSON.parse(stored) as AuthUser;
      if (!session.accessToken) { localStorage.removeItem('estate_auth_user'); return null; }
      const { data } = await crmApi.get<{ user: Omit<AuthUser, 'accessToken'> }>('/auth/me');
      const user = { ...data.user, accessToken: session.accessToken };
      localStorage.setItem('estate_auth_user', JSON.stringify(user));
      return user;
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
