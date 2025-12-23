// Hook to get user permissions

'use client';

import { useAuth } from '@/context/AuthContext';
import { getUserRole } from '@/lib/permissions/getUserRole';
import {
  isEducator,
  isLearner,
  canCreateContent,
  canViewAllSessions,
  canViewAnalytics,
  canManageProgram,
  checkModuleAccess,
} from '@/lib/permissions/checkAccess';
import { UserRole } from '@/lib/types/modules';

export function usePermissions() {
  const { user } = useAuth();
  const userRole = getUserRole(user);

  return {
    userRole,
    isEducator: isEducator(userRole),
    isLearner: isLearner(userRole),
    canCreateContent: canCreateContent(userRole),
    canViewAllSessions: canViewAllSessions(userRole),
    canViewAnalytics: canViewAnalytics(userRole),
    canManageProgram: canManageProgram(userRole),
    hasModuleAccess: (availableToRoles: UserRole[]) => {
      return checkModuleAccess(userRole, availableToRoles);
    },
  };
}


