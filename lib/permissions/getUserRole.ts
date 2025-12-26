// Get user role utility functions

import { UserRole } from '@/lib/types/modules';

/**
 * Get user role from user object
 * Returns null if user is not provided or role is not available
 */
export function getUserRole(user: { role?: string } | null | undefined): UserRole | null {
  if (!user || !user.role) return null;
  
  const validRoles: UserRole[] = [
    'resident', 
    'faculty', 
    'program_director', 
    'assistant_program_director',
    'clerkship_director',
    'super_admin',
    'admin'
  ];
  if (validRoles.includes(user.role as UserRole)) {
    return user.role as UserRole;
  }
  
  return null;
}

/**
 * Validate if a string is a valid user role
 */
export function isValidRole(role: string): role is UserRole {
  const validRoles: UserRole[] = [
    'resident', 
    'faculty', 
    'program_director', 
    'assistant_program_director',
    'clerkship_director',
    'super_admin',
    'admin'
  ];
  return validRoles.includes(role as UserRole);
}

