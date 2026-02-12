// Permission checking utilities for RBAC

import { UserRole } from '@/lib/types/modules';

// ----- Canonical module slugs used across UI, API, and permission checks -----

export const ALL_MODULE_SLUGS = [
  'learn',
  'reflect',
  'understand',
  'studio',
  'truths',
  'expectations',
] as const;

export type ModuleSlug = (typeof ALL_MODULE_SLUGS)[number];

/**
 * Default modules shown for each role when no per-user allowed_modules override is set.
 * Used as preset suggestions in the admin UI and as fallback in permission checks.
 */
export const ROLE_DEFAULT_MODULES: Record<string, ModuleSlug[]> = {
  resident: ['learn'],
  studio_creator: ['learn', 'studio'],
  faculty: ['learn', 'reflect', 'understand', 'truths'],
  program_director: ['learn', 'reflect', 'understand', 'truths', 'expectations'],
  assistant_program_director: ['learn', 'reflect', 'understand', 'truths', 'expectations'],
  clerkship_director: ['learn', 'reflect', 'understand', 'truths', 'expectations'],
  super_admin: [...ALL_MODULE_SLUGS],
  admin: [...ALL_MODULE_SLUGS],
};

// ----- Core permission helpers -----

/**
 * Check if a user role has access to a module based on available_to_roles array.
 * This is the original role-only check (used by ModuleGuard when no per-user list is set).
 */
export function checkModuleAccess(
  userRole: UserRole | null | undefined,
  availableToRoles: UserRole[]
): boolean {
  // If no role, deny access
  if (!userRole) {
    console.log('[checkModuleAccess] No role, denying access');
    return false;
  }
  
  // Super admins and admins always have access
  if (userRole === 'super_admin' || userRole === 'admin') {
    console.log('[checkModuleAccess] Admin role, granting access');
    return true;
  }
  
  // Check if user's role is in the available roles array
  const hasAccess = availableToRoles.includes(userRole);
  console.log('[checkModuleAccess] Role check:', { userRole, availableToRoles, hasAccess });
  return hasAccess;
}

/**
 * Unified check: can user access a specific module?
 *
 * Priority:
 *  1. super_admin / admin → always allowed
 *  2. user.allowed_modules is non-empty → slug must be in that list
 *  3. Fallback to role-based availableToRoles array
 */
export function canAccessModule(
  user: { role?: string | null; allowed_modules?: string[] | null } | null | undefined,
  moduleSlug: ModuleSlug,
  availableToRoles?: UserRole[],
): boolean {
  if (!user || !user.role) return false;

  const role = user.role as UserRole;

  // Admin/super_admin always have full access
  if (role === 'super_admin' || role === 'admin') return true;

  // If per-user allowed_modules is set, use it exclusively
  if (user.allowed_modules && user.allowed_modules.length > 0) {
    return user.allowed_modules.includes(moduleSlug);
  }

  // Fallback: if availableToRoles provided, use role check
  if (availableToRoles) {
    return availableToRoles.includes(role);
  }

  // Ultimate fallback: use role default modules
  const defaults = ROLE_DEFAULT_MODULES[role];
  return defaults ? defaults.includes(moduleSlug) : false;
}

/**
 * Check if user is an educator (faculty, program leadership, or admin)
 */
export function isEducator(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return ['faculty', 'program_director', 'assistant_program_director', 'clerkship_director', 'super_admin', 'admin'].includes(role);
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

