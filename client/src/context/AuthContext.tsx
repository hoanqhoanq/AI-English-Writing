import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setAccessToken } from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, confirmPassword: string, level?: string, target?: string) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    // On first load there is no access token in memory yet (it is never persisted
    // to storage) — silently redeem the HttpOnly refresh-token cookie for a fresh
    // one. If that fails, the visitor is simply not logged in.
    const bootstrapSession = async () => {
      try {
        const res = await api.post('/auth/refresh');
        if (res.data.success && res.data.data) {
          const { user: userData, accessToken } = res.data.data;
          setAccessToken(accessToken);
          setUser(userData);
        }
      } catch (err) {
        clearSession();
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapSession();

    const handleSessionExpired = () => clearSession();
    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, [clearSession]);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { user: userData, accessToken } = res.data.data;
      setAccessToken(accessToken);
      setUser(userData);
      return userData;
    }
    throw new Error(res.data.message || 'Đăng nhập thất bại');
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    confirmPassword: string,
    level = 'B1',
    target = 'IELTS'
  ): Promise<User> => {
    const res = await api.post('/auth/register', { name, email, password, confirmPassword, level, target });
    if (res.data.success) {
      const { user: userData, accessToken } = res.data.data;
      setAccessToken(accessToken);
      setUser(userData);
      return userData;
    }
    throw new Error(res.data.message || 'Đăng ký thất bại');
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Even if the network call fails, clear local session state below.
    } finally {
      clearSession();
    }
  };

  const updateUser = async (data: Partial<User>) => {
    const res = await api.put('/users/profile', data);
    if (res.data.success && res.data.data) {
      setUser(res.data.data);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
