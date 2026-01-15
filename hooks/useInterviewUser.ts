'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  InterviewUserContext, 
  InterviewCapabilities,
  createGuestContext,
  hasCapability,
} from '@/lib/interview/permissions';

interface UseInterviewUserReturn {
  context: InterviewUserContext | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  // Convenience methods
  isLev8User: boolean;
  isGuest: boolean;
  isFaculty: boolean;
  isProgramDirector: boolean;
  isAdmin: boolean;
  can: (capability: keyof InterviewCapabilities) => boolean;
}

/**
 * Hook to fetch and manage interview user context
 * Checks lev8 profile and returns permissions
 */
export function useInterviewUser(email: string | null): UseInterviewUserReturn {
  const [context, setContext] = useState<InterviewUserContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContext = useCallback(async () => {
    if (!email) {
      setContext(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/interview/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user context');
      }

      const data = await response.json();
      setContext(data);
    } catch (err) {
      console.error('[useInterviewUser] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user context');
      // Fall back to guest context
      setContext(createGuestContext(email));
    } finally {
      setIsLoading(false);
    }
  }, [email]);

  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  // Convenience getters
  const isLev8User = context?.isLev8User ?? false;
  const permissionLevel = context?.permission?.level ?? 'guest';

  return {
    context,
    isLoading,
    error,
    refetch: fetchContext,
    // Permission level checks
    isLev8User,
    isGuest: permissionLevel === 'guest',
    isFaculty: permissionLevel === 'faculty',
    isProgramDirector: permissionLevel === 'program_director',
    isAdmin: permissionLevel === 'admin',
    // Capability check
    can: (capability: keyof InterviewCapabilities) => hasCapability(context, capability),
  };
}

/**
 * Simple hook to just check if an email is a lev8 user
 */
export function useIsLev8User(email: string | null): {
  isLev8User: boolean;
  isLoading: boolean;
} {
  const { isLev8User, isLoading } = useInterviewUser(email);
  return { isLev8User, isLoading };
}
