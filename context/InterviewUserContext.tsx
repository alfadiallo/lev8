'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

type Permission = 'guest' | 'faculty' | 'program_director' | 'admin';

interface InterviewUser {
  email: string;
  name: string | null;
  permission: Permission;
  institutionName: string | null;
  programName: string | null;
}

interface InterviewUserContextValue {
  user: InterviewUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isProgramDirector: boolean;
  isFaculty: boolean;
  login: (email: string) => Promise<boolean>;
  logout: () => void;
  can: (capability: string) => boolean;
}

const STORAGE_KEY = 'interview_user';

const PERMISSION_CAPABILITIES: Record<Permission, Record<string, boolean>> = {
  guest: {
    canCreateIndividualSession: true,
    canJoinGroupSession: false,
    canRateCandidates: true,
    canViewOwnRatings: true,
    canViewAllRatings: false,
    canViewAggregateAnalytics: false,
    canManageSessions: false,
    canExportData: false,
    canViewRankList: false,
    canViewInterviewerStats: false,
  },
  faculty: {
    canCreateIndividualSession: true,
    canJoinGroupSession: true,
    canRateCandidates: true,
    canViewOwnRatings: true,
    canViewAllRatings: false,
    canViewAggregateAnalytics: false,
    canManageSessions: false,
    canExportData: true,
    canViewRankList: false,
    canViewInterviewerStats: false,
  },
  program_director: {
    canCreateIndividualSession: true,
    canJoinGroupSession: true,
    canRateCandidates: true,
    canViewOwnRatings: true,
    canViewAllRatings: true,
    canViewAggregateAnalytics: true,
    canManageSessions: true,
    canExportData: true,
    canViewRankList: true,
    canViewInterviewerStats: true,
  },
  admin: {
    canCreateIndividualSession: true,
    canJoinGroupSession: true,
    canRateCandidates: true,
    canViewOwnRatings: true,
    canViewAllRatings: true,
    canViewAggregateAnalytics: true,
    canManageSessions: true,
    canExportData: true,
    canViewRankList: true,
    canViewInterviewerStats: true,
  },
};

const InterviewUserContext = createContext<InterviewUserContextValue | undefined>(undefined);

export function InterviewUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<InterviewUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount AND re-validate
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsedUser = JSON.parse(stored) as InterviewUser;
          // Set initial state from storage for immediate UI feedback
          setUser(parsedUser);
          
          // Re-validate with server to get updated permissions
          console.log('[InterviewUserContext] Re-validating session for:', parsedUser.email);
          const response = await fetch('/api/interview/check-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: parsedUser.email }),
          });
          
          if (response.ok) {
            const data = await response.json();
            const updatedUser: InterviewUser = {
              email: parsedUser.email,
              name: data.user?.fullName || data.name || null,
              permission: (data.permission?.level || data.permission) || 'guest',
              institutionName: data.institution?.name || null,
              programName: data.program?.name || null,
            };
            
            // Only update if something changed
            if (JSON.stringify(updatedUser) !== JSON.stringify(parsedUser)) {
              console.log('[InterviewUserContext] Updating user data from server:', updatedUser);
              setUser(updatedUser);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
            }
          }
        }
      } catch (e) {
        console.error('[InterviewUserContext] Failed to initialize:', e);
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
      const response = await fetch('/api/interview/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to check email');
      }

      const data = await response.json();
      
      const newUser: InterviewUser = {
        email: email.toLowerCase(),
        name: data.user?.fullName || data.name || null,
        permission: (data.permission?.level || data.permission) || 'guest',
        institutionName: data.institution?.name || null,
        programName: data.program?.name || null,
      };

      console.log('[InterviewUserContext] Login successful:', newUser);
      setUser(newUser);
      return true;
    } catch (error) {
      console.error('[InterviewUserContext] Login error:', error);
      // Even on error, create a guest user so navigation works
      setUser({
        email: email.toLowerCase(),
        name: null,
        permission: 'guest',
        institutionName: null,
        programName: null,
      });
      return true;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    console.log('[InterviewUserContext] Logging out...');
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    // Force a hard reload if needed, but state update should be enough
  }, []);

  const can = useCallback((capability: string): boolean => {
    if (!user) return false;
    return PERMISSION_CAPABILITIES[user.permission]?.[capability] ?? false;
  }, [user]);

  const isProgramDirector = user?.permission === 'program_director' || user?.permission === 'admin';
  const isFaculty = user?.permission === 'faculty' || isProgramDirector;

  const value: InterviewUserContextValue = {
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
    <InterviewUserContext.Provider value={value}>
      {children}
    </InterviewUserContext.Provider>
  );
}

export function useInterviewUserContext() {
  const context = useContext(InterviewUserContext);
  if (context === undefined) {
    throw new Error('useInterviewUserContext must be used within an InterviewUserProvider');
  }
  return context;
}

// Helper hook for components that just need to check if logged in
export function useRequireInterviewAuth(redirectTo: string = '/interview') {
  const { user, isLoading, isAuthenticated } = useInterviewUserContext();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = redirectTo;
    }
  }, [isLoading, isAuthenticated, redirectTo]);

  return { user, isLoading, isAuthenticated };
}
