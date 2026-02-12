'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { supabaseClient as supabase } from '@/lib/supabase-client';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  allowed_modules?: string[] | null;
}

interface OrganizationInfo {
  id: string;
  slug: string;
  name: string;
}

interface DepartmentInfo {
  id: string;
  slug: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  role: string | undefined;
  loading: boolean;
  // Tenant info (optional - set by TenantProvider)
  organization?: OrganizationInfo | null;
  department?: DepartmentInfo | null;
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  verify2FA: (token: string, trustDevice: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ 
  children, 
  initialUser,
  initialOrganization,
  initialDepartment
}: { 
  children: ReactNode;
  initialUser?: User | null;
  initialOrganization?: OrganizationInfo | null;
  initialDepartment?: DepartmentInfo | null;
}) {
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message || 'Login failed');
      }

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          role: undefined,
          firstName: undefined,
          lastName: undefined,
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (data: Record<string, unknown>) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.details || 'Registration failed');
      }

      setUser({ id: result.userId, email: result.email });
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    setLoading(true);

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/login';
    }
  };

  const verify2FA = async (token: string, trustDevice: boolean) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          token,
          trustDevice,
        }),
      });

      if (!response.ok) {
        throw new Error('2FA verification failed');
      }
    } catch (error) {
      console.error('2FA error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      role: user?.role, 
      loading, 
      organization: initialOrganization,
      department: initialDepartment,
      login, 
      register, 
      logout, 
      verify2FA 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
