import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, level?: string, target?: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  quickLogin: (type: 'learner' | 'admin') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMe = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success && res.data.data) {
            setUser(res.data.data);
            setToken(storedToken);
            localStorage.setItem('user', JSON.stringify(res.data.data));
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Session check failed or offline mode:', err);
        }
      }

      // Auto-authenticate as standard demo learner if no valid session
      try {
        const res = await api.post('/auth/login', {
          email: 'user@example.com',
          password: 'User@123',
        });
        if (res.data.success && res.data.data) {
          const { user: userData, token: jwtToken } = res.data.data;
          setUser(userData);
          setToken(jwtToken);
          localStorage.setItem('token', jwtToken);
          localStorage.setItem('user', JSON.stringify(userData));
        }
      } catch (autoErr) {
        console.warn('Auto guest login notice:', autoErr);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMe();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { user: userData, token: jwtToken } = res.data.data;
      setUser(userData);
      setToken(jwtToken);
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      throw new Error(res.data.message || 'Đăng nhập thất bại');
    }
  };

  const register = async (name: string, email: string, password: string, level = 'B1', target = 'IELTS') => {
    const res = await api.post('/auth/register', { name, email, password, level, target });
    if (res.data.success) {
      const { user: userData, token: jwtToken } = res.data.data;
      setUser(userData);
      setToken(jwtToken);
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      throw new Error(res.data.message || 'Đăng ký thất bại');
    }
  };

  const quickLogin = async (type: 'learner' | 'admin') => {
    const credentials = type === 'admin' 
      ? { email: 'admin@example.com', password: 'Admin@123' }
      : { email: 'user@example.com', password: 'User@123' };

    await login(credentials.email, credentials.password);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    api.post('/auth/logout').catch(() => {});
  };

  const updateUser = async (data: Partial<User>) => {
    try {
      const res = await api.put('/users/profile', data);
      if (res.data.success && res.data.data) {
        setUser(res.data.data);
        localStorage.setItem('user', JSON.stringify(res.data.data));
      }
    } catch (err) {
      console.error('Update profile error:', err);
      // Local optimistic update
      if (user) {
        const updated = { ...user, ...data };
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        quickLogin,
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
