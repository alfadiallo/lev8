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
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [loading, setLoading] = useState(!initialUser);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      // If we already have an initial user, just sync the profile in background
      if (initialUser) {
        setLoading(false);
      }
      
      console.log('[AuthContext] Starting auth check...');
      
      try {
        // Just call getSession directly without timeout racing
        console.log('[AuthContext] Calling getSession...');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AuthContext] getSession error:', error);
          setLoading(false);
          return;
        }
        
        console.log('[AuthContext] getSession returned:', data?.session?.user?.email || 'no session');

        if (data.session?.user) {
          // Fetch user profile to get role
          console.log('[AuthContext] Fetching user profile...');
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('role, full_name, email, phone')
            .eq('id', data.session.user.id)
            .single();
          console.log('[AuthContext] Profile fetched:', profile?.email || 'error', profileError?.message || 'OK');

          if (profileError) {
            console.error('[AuthContext] Profile fetch error:', profileError);
          }

          setUser({
            id: data.session.user.id,
            email: data.session.user.email || profile?.email || '',
            role: profile?.role || undefined,
            firstName: profile?.full_name?.split(' ')[0],
            lastName: profile?.full_name?.split(' ').slice(1).join(' '),
          });
        }
      } catch (error) {
        console.error('[AuthContext] Auth check failed:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] Auth state changed:', event, session?.user?.email);
      if (session?.user) {
        // Fetch user profile to get role
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role, full_name, email, phone')
          .eq('id', session.user.id)
          .single();

        console.log('[AuthContext] onAuthStateChange profile:', profile?.role, 'error:', profileError?.message);

        setUser({
          id: session.user.id,
          email: session.user.email || profile?.email || '',
          role: profile?.role || undefined,
          firstName: profile?.full_name?.split(' ')[0],
          lastName: profile?.full_name?.split(' ').slice(1).join(' '),
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log('[AuthContext] Starting login for:', email);

      // Sign in directly with Supabase client
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message || 'Login failed');
      }

      if (data.user) {
        console.log('[AuthContext] Login successful, fetching profile...');
        
        // Try to fetch user profile, but don't block login if it fails
        let profile = null;
        try {
          const profilePromise = supabase
            .from('user_profiles')
            .select('role, full_name')
            .eq('id', data.user.id)
            .single();
          
          const profileTimeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
          );
          
          const { data: profileData } = await Promise.race([profilePromise, profileTimeout]) as any;
          profile = profileData;
          console.log('[AuthContext] Profile fetched:', profile?.full_name || 'no profile');
        } catch (profileError) {
          console.warn('[AuthContext] Profile fetch failed, continuing without profile:', profileError);
        }

        setUser({
          id: data.user.id,
          email: data.user.email || '',
          role: profile?.role || undefined,
          firstName: profile?.full_name?.split(' ')[0],
          lastName: profile?.full_name?.split(' ').slice(1).join(' '),
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
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