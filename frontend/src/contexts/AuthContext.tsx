import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string;
  username: string;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string, rememberMe: boolean) => Promise<{ requiresTwoFactor?: boolean; error?: string }>;
  verify2FA: (token: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string, rememberMe: boolean) => {
    try {
      const response = await axios.post('/api/auth/login', {
        username,
        password,
        rememberMe,
      });

      if (response.data.requiresTwoFactor) {
        return { requiresTwoFactor: true };
      }

      setUser(response.data.user);
      return { requiresTwoFactor: false };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      return { error: errorMessage };
    }
  };

  const verify2FA = async (token: string) => {
    try {
      const response = await axios.post('/api/auth/verify-2fa', { token });
      setUser(response.data.user);
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || '2FA verification failed';
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Clear user even if request fails
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, verify2FA, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
