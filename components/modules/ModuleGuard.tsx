// RBAC guard component for module pages

'use client';

import { ReactNode, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import { UserRole } from '@/lib/types/modules';

interface ModuleGuardProps {
  children: ReactNode;
  availableToRoles: UserRole[];
  fallback?: ReactNode;
}

export default function ModuleGuard({ children, availableToRoles, fallback }: ModuleGuardProps) {
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
    availableToRoles,
  });
  
  // Memoize the access check; recompute when role or allowed list changes
  const hasAccess = useMemo(
    () => {
      const access = hasModuleAccess(availableToRoles);
      console.log('[ModuleGuard] Access check result:', access);
      return access;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hasModuleAccess result depends on userRole
    [hasModuleAccess, availableToRoles, userRole]
  );

  // Wait for auth to finish loading before checking access
  // Don't redirect until we're absolutely sure auth is loaded AND user has no access
  useEffect(() => {
    // Only redirect if:
    // 1. Auth is NOT loading (we've finished checking)
    // 2. User exists (we have auth state)
    // 3. User has a role (we've loaded their profile)
    // 4. User does NOT have access
    // 5. No fallback is provided
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
  // This prevents flashing/redirect loops
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7EC8E3]"></div>
      </div>
    );
  }

  // If no user role yet, show spinner and wait
  // Don't redirect or show children until we know the role
  // This prevents false negatives that cause redirects
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

