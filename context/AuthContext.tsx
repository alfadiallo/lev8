'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabaseClient as supabase } from '@/lib/supabase-client';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  role: string | undefined;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  verify2FA: (token: string, trustDevice: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ 
  children, 
  initialUser 
}: { 
  children: ReactNode;
  initialUser?: User | null;
}) {
  // Trust server-provided initialUser - no redundant checks
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [loading, setLoading] = useState(false); // Server provides initial state, so no loading needed

  // No useEffect for auth checking - server handles it via cookies
  // Only update state on explicit login/logout actions

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Sign in with Supabase - this sets cookies automatically
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message || 'Login failed');
      }

      if (data.user) {
        // Set minimal user state - full profile will be loaded on next page navigation
        // This avoids redundant profile fetch here
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          role: undefined, // Will be loaded from server on next navigation
          firstName: undefined,
          lastName: undefined,
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      // Don't set loading to false if successful - redirect will handle it
    }
  };

  const register = async (data: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        // Throw with the actual error message from the API
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
    // 1. Clear local state immediately
    setUser(null);
    setLoading(true); // Prevent flashing content

    try {
      // 2. Call server-side logout to clear cookies
      await fetch('/api/auth/logout', { method: 'POST' });
      
      // 3. Clear client-side Supabase session
      await supabase.auth.signOut();
      
      // 4. Hard reload to clear any in-memory state and reset the app
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even on error
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

      // 2FA verified, user is fully logged in
    } catch (error) {
      console.error('2FA error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role, loading, login, register, logout, verify2FA }}>
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
