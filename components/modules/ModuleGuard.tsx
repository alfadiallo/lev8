// RBAC guard component for module pages

'use client';

import { ReactNode, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import { UserRole } from '@/lib/types/modules';
import { canAccessModule, ModuleSlug } from '@/lib/permissions/checkAccess';

interface ModuleGuardProps {
  children: ReactNode;
  availableToRoles: UserRole[];
  /** When set, canAccessModule is used (respects per-user allowed_modules) */
  moduleSlug?: ModuleSlug;
  fallback?: ReactNode;
}

export default function ModuleGuard({ children, availableToRoles, moduleSlug, fallback }: ModuleGuardProps) {
  const { loading, user } = useAuth();
  const { hasModuleAccess, userRole } = useModuleAccess();
  const router = useRouter();
  
  // Debug logging
  console.log('[ModuleGuard] State:', {
    loading,
    hasUser: !!user,
    userEmail: user?.email,
    userRoleFromAuth: user?.role,
    userRoleFromHook: userRole,
    moduleSlug,
    allowedModules: user?.allowed_modules,
    availableToRoles,
  });
  
  // Memoize the access check; recompute when role / allowed_modules / slug changes
  const hasAccess = useMemo(
    () => {
      let access: boolean;

      if (moduleSlug && user) {
        // Use the unified canAccessModule helper (respects allowed_modules override)
        access = canAccessModule(
          { role: userRole, allowed_modules: user.allowed_modules },
          moduleSlug,
          availableToRoles,
        );
      } else {
        // Legacy path: role-only check
        access = hasModuleAccess(availableToRoles);
      }

      console.log('[ModuleGuard] Access check result:', access);
      return access;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hasModuleAccess result depends on userRole
    [hasModuleAccess, availableToRoles, userRole, moduleSlug, user?.allowed_modules]
  );

  // Wait for auth to finish loading before checking access
  // Don't redirect until we're absolutely sure auth is loaded AND user has no access
  useEffect(() => {
    if (!loading && user && userRole && !hasAccess && !fallback) {
      router.push('/dashboard');
    }
  }, [hasAccess, fallback, loading, user, userRole, router]);

  // Wait for auth to finish loading before checking access
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7EC8E3]"></div>
      </div>
    );
  }

  // If no user, don't redirect - let middleware handle it
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7EC8E3]"></div>
      </div>
    );
  }

  // If no user role yet, show spinner and wait
  if (!userRole) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7EC8E3]"></div>
      </div>
    );
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/30 text-center">
          <h2 className="text-xl font-semibold mb-2 text-neutral-800">Access Denied</h2>
          <p className="text-neutral-600">You don&apos;t have permission to access this module.</p>
          <p className="text-sm text-neutral-500 mt-2">Your role: {userRole || 'Unknown'}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
