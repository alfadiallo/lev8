'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Pulse Check specific roles
type PulseCheckRole = 'guest' | 'medical_director' | 'associate_medical_director' | 'assistant_medical_director' | 'regional_director' | 'admin_assistant';

interface PulseCheckUser {
  email: string;
  name: string | null;
  role: PulseCheckRole;
  directorId: string | null;
  departmentId: string | null;
  departmentName: string | null;
  siteName: string | null;
  healthsystemId: string | null;
  healthsystemName: string | null;
}

interface PulseCheckUserContextValue {
  user: PulseCheckUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isRegionalDirector: boolean;
  isMedicalDirector: boolean;
  isAdminAssistant: boolean;
  canRate: boolean;
  canViewReports: boolean;
  canManageUsers: boolean;
  login: (email: string) => Promise<boolean>;
  logout: () => void;
  can: (capability: string) => boolean;
}

const STORAGE_KEY = 'pulsecheck_user';

// Permission capabilities by role
const PERMISSION_CAPABILITIES: Record<PulseCheckRole, Record<string, boolean>> = {
  guest: {
    canViewDashboard: false,
    canRateProviders: false,
    canViewOwnRatings: false,
    canViewAllRatings: false,
    canViewReports: false,
    canManageUsers: false,
    canManageCycles: false,
    canImportProviders: false,
    canExportData: false,
  },
  medical_director: {
    canViewDashboard: true,
    canRateProviders: true,
    canViewOwnRatings: true,
    canViewAllRatings: false,
    canViewReports: false,
    canManageUsers: false,
    canManageCycles: false,
    canImportProviders: false,
    canExportData: true,
  },
  associate_medical_director: {
    canViewDashboard: true,
    canRateProviders: true,
    canViewOwnRatings: true,
    canViewAllRatings: false,
    canViewReports: false,
    canManageUsers: false,
    canManageCycles: false,
    canImportProviders: false,
    canExportData: true,
  },
  assistant_medical_director: {
    canViewDashboard: true,
    canRateProviders: true,
    canViewOwnRatings: true,
    canViewAllRatings: false,
    canViewReports: false,
    canManageUsers: false,
    canManageCycles: false,
    canImportProviders: false,
    canExportData: true,
  },
  regional_director: {
    canViewDashboard: true,
    canRateProviders: false, // Regional directors oversee, they don't rate directly
    canViewOwnRatings: false,
    canViewAllRatings: true,
    canViewReports: true,
    canManageUsers: false,
    canManageCycles: true,
    canImportProviders: false,
    canExportData: true,
  },
  admin_assistant: {
    canViewDashboard: true,
    canRateProviders: false,
    canViewOwnRatings: false,
    canViewAllRatings: true,
    canViewReports: true,
    canManageUsers: true,
    canManageCycles: true,
    canImportProviders: true,
    canExportData: true,
  },
};

const PulseCheckUserContext = createContext<PulseCheckUserContextValue | undefined>(undefined);

export function PulseCheckUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PulseCheckUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount AND re-validate
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsedUser = JSON.parse(stored) as PulseCheckUser;
          // Set initial state from storage for immediate UI feedback
          setUser(parsedUser);
          
          // Re-validate with server to get updated permissions
          console.log('[PulseCheckUserContext] Re-validating session for:', parsedUser.email);
          const response = await fetch('/api/pulsecheck/check-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: parsedUser.email }),
          });
          
          if (response.ok) {
            const data = await response.json();
            const updatedUser: PulseCheckUser = {
              email: parsedUser.email,
              name: data.director?.name || data.name || null,
              role: data.director?.role || 'guest',
              directorId: data.director?.id || null,
              departmentId: data.director?.department_id || null,
              departmentName: data.department?.name || null,
              siteName: data.site?.name || null,
              healthsystemId: data.director?.healthsystem_id || null,
              healthsystemName: data.healthsystem?.name || null,
            };
            
            // Only update if something changed
            if (JSON.stringify(updatedUser) !== JSON.stringify(parsedUser)) {
              console.log('[PulseCheckUserContext] Updating user data from server:', updatedUser);
              setUser(updatedUser);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
            }
          }
        }
      } catch (e) {
        console.error('[PulseCheckUserContext] Failed to initialize:', e);
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, []);

  // Save user to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    }
  }, [user]);

  const login = useCallback(async (email: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/pulsecheck/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to check email');
      }

      const data = await response.json();
      
      const newUser: PulseCheckUser = {
        email: email.toLowerCase(),
        name: data.director?.name || data.name || null,
        role: data.director?.role || 'guest',
        directorId: data.director?.id || null,
        departmentId: data.director?.department_id || null,
        departmentName: data.department?.name || null,
        siteName: data.site?.name || null,
        healthsystemId: data.director?.healthsystem_id || null,
        healthsystemName: data.healthsystem?.name || null,
      };

      console.log('[PulseCheckUserContext] Login successful:', newUser);
      setUser(newUser);
      return true;
    } catch (error) {
      console.error('[PulseCheckUserContext] Login error:', error);
      // Even on error, create a guest user so navigation works
      setUser({
        email: email.toLowerCase(),
        name: null,
        role: 'guest',
        directorId: null,
        departmentId: null,
        departmentName: null,
        siteName: null,
        healthsystemId: null,
        healthsystemName: null,
      });
      return true;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    console.log('[PulseCheckUserContext] Logging out...');
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const can = useCallback((capability: string): boolean => {
    if (!user) return false;
    return PERMISSION_CAPABILITIES[user.role]?.[capability] ?? false;
  }, [user]);

  // Convenience flags
  const isRegionalDirector = user?.role === 'regional_director';
  const isMedicalDirector = user?.role === 'medical_director' || 
                           user?.role === 'associate_medical_director' || 
                           user?.role === 'assistant_medical_director';
  const isAdminAssistant = user?.role === 'admin_assistant';
  const canRate = isMedicalDirector;
  const canViewReports = isRegionalDirector || isAdminAssistant;
  const canManageUsers = isAdminAssistant;

  const value: PulseCheckUserContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user && user.role !== 'guest',
    isRegionalDirector,
    isMedicalDirector,
    isAdminAssistant,
    canRate,
    canViewReports,
    canManageUsers,
    login,
    logout,
    can,
  };

  return (
    <PulseCheckUserContext.Provider value={value}>
      {children}
    </PulseCheckUserContext.Provider>
  );
}

export function usePulseCheckUserContext() {
  const context = useContext(PulseCheckUserContext);
  if (context === undefined) {
    throw new Error('usePulseCheckUserContext must be used within a PulseCheckUserProvider');
  }
  return context;
}

// Helper hook for components that just need to check if logged in
export function useRequirePulseCheckAuth(redirectTo: string = '/pulsecheck') {
  const { user, isLoading, isAuthenticated } = usePulseCheckUserContext();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = redirectTo;
    }
  }, [isLoading, isAuthenticated, redirectTo]);

  return { user, isLoading, isAuthenticated };
}
