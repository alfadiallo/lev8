'use client';

import { useAuth } from '@/context/AuthContext';
import { useMemo } from 'react';

export type UserRole = 
  | 'resident'
  | 'faculty'
  | 'program_director'
  | 'assistant_program_director'
  | 'clerkship_director'
  | 'studio_creator'
  | 'super_admin'
  | 'admin';

export interface Permissions {
  // Role info
  role: UserRole | null;
  isResident: boolean;
  isFaculty: boolean;
  isProgramLeadership: boolean;
  isSuperAdmin: boolean;
  
  // Data access
  canViewAllResidents: boolean;
  canViewResidentDetails: (residentUserId?: string) => boolean;
  canViewSWOT: (residentUserId?: string) => boolean;
  canViewScores: (residentUserId?: string) => boolean;
  canViewCCCMeetings: boolean;
  canViewResidentNotes: boolean;
  
  // Aggregate access (all roles)
  canViewClassAggregates: boolean;
  canViewProgramAggregates: boolean;
  
  // Admin access
  canAccessAdminPortal: boolean;
  canManageUsers: boolean;
  canApproveAccessRequests: boolean;
  
  // Edit permissions
  canEditResident: (residentUserId?: string) => boolean;
  canCreateSWOT: boolean;
  canEditSWOT: boolean;
  canCreateNotes: boolean;
  canEditNotes: (authorId?: string) => boolean;
}

export function usePermissions(): Permissions {
  const { user } = useAuth();
  
  return useMemo(() => {
    const role = user?.role as UserRole | null;
    const userId = user?.id;
    
    // Role checks
    const isResident = role === 'resident';
    const isFaculty = role === 'faculty';
    const isProgramLeadership = ['program_director', 'assistant_program_director', 'clerkship_director'].includes(role || '');
    const isSuperAdmin = role === 'super_admin' || role === 'admin';
    const isFacultyOrAbove = isFaculty || isProgramLeadership || isSuperAdmin;
    
    return {
      // Role info
      role,
      isResident,
      isFaculty,
      isProgramLeadership,
      isSuperAdmin,
      
      // Data access - Faculty+ can see all, residents only their own
      canViewAllResidents: isFacultyOrAbove,
      
      canViewResidentDetails: (residentUserId?: string) => {
        if (isFacultyOrAbove) return true;
        if (isResident && residentUserId === userId) return true;
        return false;
      },
      
      canViewSWOT: (residentUserId?: string) => {
        if (isFacultyOrAbove) return true;
        if (isResident && residentUserId === userId) return true;
        return false;
      },
      
      canViewScores: (residentUserId?: string) => {
        if (isFacultyOrAbove) return true;
        if (isResident && residentUserId === userId) return true;
        return false;
      },
      
      canViewCCCMeetings: isFacultyOrAbove,
      canViewResidentNotes: isFacultyOrAbove,
      
      // Aggregate access - everyone can see
      canViewClassAggregates: true,
      canViewProgramAggregates: true,
      
      // Admin access - only super_admin
      canAccessAdminPortal: isSuperAdmin,
      canManageUsers: isSuperAdmin,
      canApproveAccessRequests: isSuperAdmin,
      
      // Edit permissions
      canEditResident: (residentUserId?: string) => {
        if (isProgramLeadership || isSuperAdmin) return true;
        if (isResident && residentUserId === userId) return true;
        return false;
      },
      
      canCreateSWOT: isFacultyOrAbove,
      canEditSWOT: isFacultyOrAbove,
      canCreateNotes: isFacultyOrAbove,
      
      canEditNotes: (authorId?: string) => {
        if (isProgramLeadership || isSuperAdmin) return true;
        if (authorId === userId) return true;
        return false;
      },
    };
  }, [user]);
}

// Utility function for server-side role checking
export function checkPermission(
  userRole: string | null,
  requiredRoles: UserRole[]
): boolean {
  if (!userRole) return false;
  return requiredRoles.includes(userRole as UserRole);
}

// Role hierarchy for easy checking
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  resident: 1,
  studio_creator: 1,
  faculty: 2,
  clerkship_director: 3,
  assistant_program_director: 4,
  program_director: 5,
  admin: 6,
  super_admin: 7,
};

export function hasMinimumRole(userRole: UserRole | null, minimumRole: UserRole): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
}

