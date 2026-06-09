import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, LoginCredentials, SignupCredentials } from '../types';
import {
  login as authLogin,
  signup as authSignup,
  logout as authLogout,
  getCurrentAuthUser,
} from '../services/authService';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentAuthUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      const authUser = await authLogin(credentials);
      setUser(authUser);
      toast.success('Login successful!');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      throw error;
    }
  };

  const signup = async (credentials: SignupCredentials) => {
    try {
      const authUser = await authSignup(credentials);
      setUser(authUser);
      toast.success('Account created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Signup failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authLogout();
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error: any) {
      toast.error(error.message || 'Logout failed');
      throw error;
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
