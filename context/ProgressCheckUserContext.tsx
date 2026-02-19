'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

type ProgressCheckPermission = 'guest' | 'resident' | 'faculty' | 'program_director' | 'admin';

interface ProgressCheckUser {
  email: string;
  name: string | null;
  permission: ProgressCheckPermission;
  institutionName: string | null;
  programId: string | null;
  programName: string | null;
  programSpecialty: string | null;
}

interface ProgressCheckUserContextValue {
  user: ProgressCheckUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isProgramDirector: boolean;
  isFaculty: boolean;
  login: (email: string) => Promise<boolean>;
  logout: () => void;
  can: (capability: string) => boolean;
}

// ============================================================================
// Permissions
// ============================================================================

const STORAGE_KEY = 'progress_check_user';

const PERMISSION_CAPABILITIES: Record<ProgressCheckPermission, Record<string, boolean>> = {
  guest: {
    canViewResidents: false,
    canViewResidentDetail: false,
    canManageSurveys: false,
    canManageSessions: false,
    canRateResidents: false,
    canSelfAssess: false,
    canViewAnalytics: false,
    canExportData: false,
  },
  resident: {
    canViewResidents: false,
    canViewResidentDetail: false,
    canManageSurveys: false,
    canManageSessions: false,
    canRateResidents: false,
    canSelfAssess: true,
    canViewAnalytics: false,
    canExportData: false,
  },
  faculty: {
    canViewResidents: true,
    canViewResidentDetail: true,
    canManageSurveys: false,
    canManageSessions: true,
    canRateResidents: true,
    canSelfAssess: false,
    canViewAnalytics: true,
    canExportData: false,
  },
  program_director: {
    canViewResidents: true,
    canViewResidentDetail: true,
    canManageSurveys: true,
    canManageSessions: true,
    canRateResidents: true,
    canSelfAssess: false,
    canViewAnalytics: true,
    canExportData: true,
  },
  admin: {
    canViewResidents: true,
    canViewResidentDetail: true,
    canManageSurveys: true,
    canManageSessions: true,
    canRateResidents: true,
    canSelfAssess: false,
    canViewAnalytics: true,
    canExportData: true,
  },
};

// ============================================================================
// Context
// ============================================================================

const ProgressCheckUserContext = createContext<ProgressCheckUserContextValue | undefined>(undefined);

export function ProgressCheckUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ProgressCheckUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage and re-validate
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsedUser = JSON.parse(stored) as ProgressCheckUser;
          setUser(parsedUser);

          // Re-validate with server
          console.log('[ProgressCheckUserContext] Re-validating session for:', parsedUser.email);
          const response = await fetch('/api/progress-check/check-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: parsedUser.email }),
          });

          if (response.ok) {
            const data = await response.json();
            const updatedUser: ProgressCheckUser = {
              email: parsedUser.email,
              name: data.user?.fullName || data.name || parsedUser.name,
              permission: data.permission?.level || 'guest',
              institutionName: data.institution?.name || null,
              programId: data.program?.id || null,
              programName: data.program?.name || null,
              programSpecialty: data.program?.specialty || null,
            };

            if (JSON.stringify(updatedUser) !== JSON.stringify(parsedUser)) {
              console.log('[ProgressCheckUserContext] Updated user data:', updatedUser);
              setUser(updatedUser);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
            }
          }
        }
      } catch (e) {
        console.error('[ProgressCheckUserContext] Failed to initialize:', e);
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    }
  }, [user]);

  const login = useCallback(async (email: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/progress-check/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to check email');
      }

      const data = await response.json();

      const newUser: ProgressCheckUser = {
        email: email.toLowerCase(),
        name: data.user?.fullName || data.name || null,
        permission: data.permission?.level || 'guest',
        institutionName: data.institution?.name || null,
        programId: data.program?.id || null,
        programName: data.program?.name || null,
        programSpecialty: data.program?.specialty || null,
      };

      console.log('[ProgressCheckUserContext] Login successful:', newUser);
      setUser(newUser);
      return true;
    } catch (error) {
      console.error('[ProgressCheckUserContext] Login error:', error);
      setUser({
        email: email.toLowerCase(),
        name: null,
        permission: 'guest',
        institutionName: null,
        programId: null,
        programName: null,
        programSpecialty: null,
      });
      return true;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    console.log('[ProgressCheckUserContext] Logging out...');
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const can = useCallback((capability: string): boolean => {
    if (!user) return false;
    return PERMISSION_CAPABILITIES[user.permission]?.[capability] ?? false;
  }, [user]);

  const isProgramDirector = user?.permission === 'program_director' || user?.permission === 'admin';
  const isFaculty = user?.permission === 'faculty' || isProgramDirector;

  const value: ProgressCheckUserContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isProgramDirector,
    isFaculty,
    login,
    logout,
    can,
  };

  return (
    <ProgressCheckUserContext.Provider value={value}>
      {children}
    </ProgressCheckUserContext.Provider>
  );
}

export function useProgressCheckUserContext() {
  const context = useContext(ProgressCheckUserContext);
  if (context === undefined) {
    throw new Error('useProgressCheckUserContext must be used within a ProgressCheckUserProvider');
  }
  return context;
}

export function useRequireProgressCheckAuth(redirectTo: string = '/progress-check') {
  const { user, isLoading, isAuthenticated } = useProgressCheckUserContext();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = redirectTo;
    }
  }, [isLoading, isAuthenticated, redirectTo]);

  return { user, isLoading, isAuthenticated };
}
