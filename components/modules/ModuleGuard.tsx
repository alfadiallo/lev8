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
  const { loading } = useAuth();
  const { hasModuleAccess, userRole } = useModuleAccess();
  const router = useRouter();
  
  // Memoize the access check to prevent unnecessary re-renders
  const hasAccess = useMemo(
    () => hasModuleAccess(availableToRoles),
    [hasModuleAccess, availableToRoles.join(',')]
  );

  // useEffect MUST be called before any early returns to follow Rules of Hooks
  useEffect(() => {
    if (!loading && userRole && !hasAccess && !fallback) {
      router.push('/');
    }
  }, [hasAccess, fallback, loading, userRole, router]);

  // Wait for auth to finish loading before checking access
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7EC8E3]"></div>
      </div>
    );
  }

  // If no user role, allow access (for testing/development)
  // In production, you might want to redirect to login
  if (!userRole) {
    console.warn('[ModuleGuard] No user role found, allowing access for testing');
    return <>{children}</>;
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

