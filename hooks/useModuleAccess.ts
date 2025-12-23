// Hook to check module access for current user

'use client';

import { useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { checkModuleAccess, isEducator, canCreateContent, canViewAllSessions, canViewAnalytics } from '@/lib/permissions/checkAccess';
import { getUserRole } from '@/lib/permissions/getUserRole';
import { UserRole } from '@/lib/types/modules';

export function useModuleAccess() {
  const { user } = useAuth();
  const userRole = getUserRole(user);

  // Memoize the hasModuleAccess function to prevent unnecessary re-renders
  const hasModuleAccess = useCallback(
    (availableToRoles: UserRole[]) => {
      return checkModuleAccess(userRole, availableToRoles);
    },
    [userRole]
  );

  return useMemo(
    () => ({
      userRole,
      isEducator: isEducator(userRole),
      canCreateContent: canCreateContent(userRole),
      canViewAllSessions: canViewAllSessions(userRole),
      canViewAnalytics: canViewAnalytics(userRole),
      hasModuleAccess,
    }),
    [userRole, hasModuleAccess]
  );
}


