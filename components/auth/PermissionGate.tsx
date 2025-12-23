'use client';

import { ReactNode } from 'react';
import { usePermissions, UserRole, hasMinimumRole } from '@/lib/hooks/usePermissions';
import { Lock } from 'lucide-react';

interface PermissionGateProps {
  children: ReactNode;
  /** Require one of these specific roles */
  allowedRoles?: UserRole[];
  /** Require at least this role level */
  minimumRole?: UserRole;
  /** Custom permission check using the permissions object */
  check?: (permissions: ReturnType<typeof usePermissions>) => boolean;
  /** What to show when access is denied */
  fallback?: ReactNode;
  /** If true, shows nothing when denied (default: false shows fallback) */
  hideWhenDenied?: boolean;
}

/**
 * PermissionGate - Conditionally render children based on user permissions
 * 
 * @example
 * // Allow only faculty and above
 * <PermissionGate minimumRole="faculty">
 *   <SensitiveContent />
 * </PermissionGate>
 * 
 * @example
 * // Allow specific roles
 * <PermissionGate allowedRoles={['program_director', 'super_admin']}>
 *   <AdminOnlyContent />
 * </PermissionGate>
 * 
 * @example
 * // Custom permission check
 * <PermissionGate check={(p) => p.canViewResidentDetails(residentId)}>
 *   <ResidentDetails />
 * </PermissionGate>
 */
export function PermissionGate({
  children,
  allowedRoles,
  minimumRole,
  check,
  fallback,
  hideWhenDenied = false,
}: PermissionGateProps) {
  const permissions = usePermissions();
  
  let hasAccess = false;
  
  // Check custom permission function
  if (check) {
    hasAccess = check(permissions);
  }
  // Check specific roles
  else if (allowedRoles) {
    hasAccess = permissions.role ? allowedRoles.includes(permissions.role) : false;
  }
  // Check minimum role
  else if (minimumRole) {
    hasAccess = hasMinimumRole(permissions.role, minimumRole);
  }
  // Default: allow if any check passes
  else {
    hasAccess = true;
  }
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  if (hideWhenDenied) {
    return null;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  // Default fallback
  return (
    <div 
      className="flex flex-col items-center justify-center p-8 rounded-xl"
      style={{ 
        background: 'var(--theme-surface-solid)',
        border: '1px solid var(--theme-border-solid)'
      }}
    >
      <Lock 
        className="w-12 h-12 mb-4 opacity-30"
        style={{ color: 'var(--theme-text-muted)' }}
      />
      <p 
        className="text-center font-medium"
        style={{ color: 'var(--theme-text-muted)' }}
      >
        You don't have permission to view this content
      </p>
    </div>
  );
}

/**
 * FacultyOnly - Shorthand for faculty+ access
 */
export function FacultyOnly({ 
  children, 
  fallback,
  hideWhenDenied = true 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
  hideWhenDenied?: boolean;
}) {
  return (
    <PermissionGate 
      minimumRole="faculty" 
      fallback={fallback}
      hideWhenDenied={hideWhenDenied}
    >
      {children}
    </PermissionGate>
  );
}

/**
 * LeadershipOnly - Shorthand for program leadership+ access
 */
export function LeadershipOnly({ 
  children, 
  fallback,
  hideWhenDenied = true 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
  hideWhenDenied?: boolean;
}) {
  return (
    <PermissionGate 
      allowedRoles={['program_director', 'assistant_program_director', 'clerkship_director', 'super_admin', 'admin']}
      fallback={fallback}
      hideWhenDenied={hideWhenDenied}
    >
      {children}
    </PermissionGate>
  );
}

/**
 * AdminOnly - Shorthand for super_admin access
 */
export function AdminOnly({ 
  children, 
  fallback,
  hideWhenDenied = true 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
  hideWhenDenied?: boolean;
}) {
  return (
    <PermissionGate 
      allowedRoles={['super_admin', 'admin']}
      fallback={fallback}
      hideWhenDenied={hideWhenDenied}
    >
      {children}
    </PermissionGate>
  );
}

