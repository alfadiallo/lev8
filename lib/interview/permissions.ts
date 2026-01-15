/**
 * Interview Tool Permission System
 * Maps lev8 roles to eqpqiq permissions and capabilities
 */

// Permission levels for the interview tool
export type InterviewPermission = 'guest' | 'faculty' | 'program_director' | 'admin';

// Capabilities that can be granted based on permission level
export interface InterviewCapabilities {
  canCreateIndividualSession: boolean;
  canJoinGroupSession: boolean;
  canRateCandidates: boolean;
  canViewOwnRatings: boolean;
  canViewAllRatings: boolean;
  canViewAggregateAnalytics: boolean;
  canManageSessions: boolean;
  canExportData: boolean;
  canDeleteCandidates: boolean;
  canInviteInterviewers: boolean;
  canFinalizeRankings: boolean;
}

// Full user context from check-email API
export interface InterviewUserContext {
  isLev8User: boolean;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    source: string;
  } | null;
  institution: {
    id: string;
    name: string;
    abbreviation: string;
    location: string;
  } | null;
  faculty: {
    id: string;
    fullName: string;
    credentials: string;
    email: string;
    isActive: boolean;
  } | null;
  program: {
    id: string;
    name: string;
    specialty: string;
  } | null;
  permission: {
    level: InterviewPermission;
    capabilities: InterviewCapabilities;
  };
}

// Default capabilities for each permission level
export const PERMISSION_CAPABILITIES: Record<InterviewPermission, InterviewCapabilities> = {
  guest: {
    canCreateIndividualSession: true,
    canJoinGroupSession: false,
    canRateCandidates: true,
    canViewOwnRatings: true,
    canViewAllRatings: false,
    canViewAggregateAnalytics: false,
    canManageSessions: false,
    canExportData: false,
    canDeleteCandidates: true, // Own sessions only
    canInviteInterviewers: false,
    canFinalizeRankings: false,
  },
  faculty: {
    canCreateIndividualSession: true,
    canJoinGroupSession: true,
    canRateCandidates: true,
    canViewOwnRatings: true,
    canViewAllRatings: false,
    canViewAggregateAnalytics: false,
    canManageSessions: false,
    canExportData: true,
    canDeleteCandidates: true, // Own sessions only
    canInviteInterviewers: false,
    canFinalizeRankings: false,
  },
  program_director: {
    canCreateIndividualSession: true,
    canJoinGroupSession: true,
    canRateCandidates: true,
    canViewOwnRatings: true,
    canViewAllRatings: true,
    canViewAggregateAnalytics: true,
    canManageSessions: true,
    canExportData: true,
    canDeleteCandidates: true,
    canInviteInterviewers: true,
    canFinalizeRankings: true,
  },
  admin: {
    canCreateIndividualSession: true,
    canJoinGroupSession: true,
    canRateCandidates: true,
    canViewOwnRatings: true,
    canViewAllRatings: true,
    canViewAggregateAnalytics: true,
    canManageSessions: true,
    canExportData: true,
    canDeleteCandidates: true,
    canInviteInterviewers: true,
    canFinalizeRankings: true,
  },
};

/**
 * Get interview permission level from lev8 role
 */
export function getInterviewPermission(role: string | null): InterviewPermission {
  switch (role) {
    case 'super_admin':
      return 'admin';
    case 'program_director':
      return 'program_director';
    case 'faculty':
      return 'faculty';
    default:
      return 'guest';
  }
}

/**
 * Get capabilities for a permission level
 */
export function getCapabilities(permission: InterviewPermission): InterviewCapabilities {
  return PERMISSION_CAPABILITIES[permission];
}

/**
 * Check if user has a specific capability
 */
export function hasCapability(
  context: InterviewUserContext | null,
  capability: keyof InterviewCapabilities
): boolean {
  if (!context) return PERMISSION_CAPABILITIES.guest[capability];
  return context.permission.capabilities[capability];
}

/**
 * Check if user can view all ratings (PD view)
 */
export function canViewAllRatings(context: InterviewUserContext | null): boolean {
  return hasCapability(context, 'canViewAllRatings');
}

/**
 * Check if user can manage sessions (create group sessions, invite interviewers)
 */
export function canManageSessions(context: InterviewUserContext | null): boolean {
  return hasCapability(context, 'canManageSessions');
}

/**
 * Check if user can join group sessions
 */
export function canJoinGroupSession(context: InterviewUserContext | null): boolean {
  return hasCapability(context, 'canJoinGroupSession');
}

/**
 * Check if user can see aggregate analytics
 */
export function canViewAnalytics(context: InterviewUserContext | null): boolean {
  return hasCapability(context, 'canViewAggregateAnalytics');
}

/**
 * Create a default guest context
 */
export function createGuestContext(email: string): InterviewUserContext {
  return {
    isLev8User: false,
    user: null,
    institution: null,
    faculty: null,
    program: null,
    permission: {
      level: 'guest',
      capabilities: PERMISSION_CAPABILITIES.guest,
    },
  };
}

/**
 * Get display label for permission level
 */
export function getPermissionLabel(permission: InterviewPermission): string {
  switch (permission) {
    case 'admin':
      return 'Administrator';
    case 'program_director':
      return 'Program Director';
    case 'faculty':
      return 'Faculty';
    default:
      return 'Guest';
  }
}
