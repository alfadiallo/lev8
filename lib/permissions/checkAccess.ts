// Permission checking utilities for RBAC

import { UserRole } from '@/lib/types/modules';

/**
 * Check if a user role has access to a module based on available_to_roles array
 */
export function checkModuleAccess(
  userRole: UserRole | null | undefined,
  availableToRoles: UserRole[]
): boolean {
  // If no role, deny access
  if (!userRole) {
    return false;
  }
  
  // Super admins always have access
  if (userRole === 'super_admin') return true;
  
  // Check if user's role is in the available roles array
  return availableToRoles.includes(userRole);
}

/**
 * Check if user is an educator (faculty, program_director, or super_admin)
 */
export function isEducator(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return ['faculty', 'program_director', 'super_admin'].includes(role);
}

/**
 * Check if user is a learner (resident)
 */
export function isLearner(role: UserRole | null | undefined): boolean {
  return role === 'resident';
}

/**
 * Check if user can create content (educators and admins)
 */
export function canCreateContent(role: UserRole | null | undefined): boolean {
  return isEducator(role);
}

/**
 * Check if user can view all sessions (educators and admins)
 */
export function canViewAllSessions(role: UserRole | null | undefined): boolean {
  return isEducator(role);
}

/**
 * Check if user can view analytics (educators and admins)
 */
export function canViewAnalytics(role: UserRole | null | undefined): boolean {
  return isEducator(role);
}

/**
 * Check if user can manage program settings (program directors and super admins)
 */
export function canManageProgram(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return ['program_director', 'super_admin'].includes(role);
}

