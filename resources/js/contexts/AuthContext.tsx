import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  roles?: Array<{
    id: number;
    name: string;
    permissions: Array<{
      id: number;
      name: string;
    }>;
  }>;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  isSuperAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');

    if (storedToken) {
      setToken(storedToken);
      
      // Fetch fresh user data with roles and permissions
      api.get('/me')
        .then(response => {
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        })
        .catch(error => {
          console.error('Failed to fetch user data:', error);
          // Clear invalid token
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/login', { email, password });
    const { user, token } = response.data;

    setUser(user);
    setToken(token);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const register = async (name: string, email: string, password: string, passwordConfirmation: string) => {
    const response = await api.post('/register', {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    });
    const { user, token } = response.data;

    setUser(user);
    setToken(token);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Super Admin has all permissions
    if (user.roles?.some(role => role.name === 'Super Admin')) return true;
    
    // Check if user has the specific permission
    const allPermissions = user.roles?.flatMap(role => 
      role.permissions.map(p => p.name)
    ) || [];
    
    return allPermissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false;
    
    // Super Admin has all permissions
    if (user.roles?.some(role => role.name === 'Super Admin')) return true;
    
    // Check if user has any of the specified permissions
    const allPermissions = user.roles?.flatMap(role => 
      role.permissions.map(p => p.name)
    ) || [];
    
    return permissions.some(permission => allPermissions.includes(permission));
  };

  const isSuperAdmin = (): boolean => {
    if (!user) return false;
    return user.roles?.some(role => role.name === 'Super Admin') || false;
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading, hasPermission, hasAnyPermission, isSuperAdmin }}>
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
