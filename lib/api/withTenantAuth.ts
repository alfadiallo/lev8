/**
 * Centralized Tenant Authentication Wrapper
 * 
 * This wrapper provides a single point of authentication, authorization,
 * and tenant context for all API routes. It handles:
 * - User authentication (cookies/bearer token)
 * - Tenant extraction from headers/referer
 * - Role-based access control
 * - Specialty-based filtering for Studio content
 * 
 * Usage:
 * ```ts
 * export const GET = withTenantAuth(async (req, ctx) => {
 *   // ctx contains user, tenant, role, and helper methods
 *   const residents = await getResidents(ctx.programId);
 *   return NextResponse.json({ residents });
 * });
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { MembershipRole } from '@/lib/types/multi-tenant';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// Service client type (any DB schema avoids 'never' on query results when no generated types)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseServiceClient = ReturnType<typeof createClient<any>>;

// Role hierarchy for permission checks
export const ROLE_HIERARCHY: Record<string, number> = {
  'super_admin': 100,
  'admin': 90,
  'program_director': 80,
  'assistant_program_director': 70,
  'clerkship_director': 60,
  'faculty': 50,
  'resident': 20,
  'viewer': 10,
};

// User type from auth
export interface AuthUser {
  id: string;
  email: string;
  role?: string;
}

// Tenant context extracted from request
export interface TenantInfo {
  orgSlug: string | null;
  deptSlug: string | null;
  healthSystemId: string | null;
  programId: string | null;
  specialty: string | null;
}

// Full context passed to handler
export interface TenantAuthContext {
  // User info
  user: AuthUser;
  role: MembershipRole;
  
  // Tenant info
  healthSystemId: string | null;
  programId: string | null;
  specialty: string | null;
  orgSlug: string | null;
  deptSlug: string | null;
  
  // Membership info
  membershipId: string | null;
  membershipRole: MembershipRole | null;
  
  // Studio creator info
  studioCreatorId: string | null;
  isStudioCreator: boolean;
  
  // Role checks
  isResident: boolean;
  isFaculty: boolean;
  isProgramLeadership: boolean;
  isAdmin: boolean;
  
  // Helper methods
  canAccessResident: (residentId: string) => Promise<boolean>;
  canAccessProgram: (targetProgramId: string) => boolean;
  canViewStudioContent: (contentSpecialty: string) => boolean;
  canPublishStudioContent: boolean;
  
  // Supabase client (service role - use for queries)
  supabase: SupabaseServiceClient;
}

// Handler type
type TenantAuthHandler = (
  request: NextRequest,
  context: TenantAuthContext
) => Promise<NextResponse>;

// Options for the wrapper
export interface TenantAuthOptions {
  allowResident?: boolean;       // Allow residents to access (default: false for analytics)
  requireTenant?: boolean;       // Require valid tenant context (default: true)
  allowUnauthenticated?: boolean; // Allow unauthenticated access (default: false)
  minimumRole?: MembershipRole;  // Minimum role required
  requiredRoles?: MembershipRole[]; // Specific roles required (OR)
}

/**
 * Extract tenant info from request headers or referer
 */
async function extractTenantFromRequest(request: NextRequest): Promise<{ orgSlug: string | null; deptSlug: string | null }> {
  // 1. Try headers first (set by middleware)
  const orgSlug = request.headers.get('x-lev8-org');
  const deptSlug = request.headers.get('x-lev8-dept');
  
  if (orgSlug && deptSlug) {
    return { orgSlug, deptSlug };
  }
  
  // 2. Fallback to Referer header
  const referer = request.headers.get('referer');
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const parts = refererUrl.pathname.split('/').filter(Boolean);
      
      // Skip known non-tenant prefixes
      const nonTenantPrefixes = ['api', 'login', 'register', 'forgot-password', 'admin', 'debug', 'studio', 'request-access', 'update-password', 'verify-2fa', '_next'];
      
      if (parts.length >= 2 && !nonTenantPrefixes.includes(parts[0])) {
        return { orgSlug: parts[0], deptSlug: parts[1] };
      }
    } catch {
      // Invalid referer URL
    }
  }
  
  return { orgSlug: null, deptSlug: null };
}

/**
 * Resolve org/dept slugs to UUIDs
 */
async function resolveTenantIds(
  supabase: SupabaseServiceClient,
  orgSlug: string | null,
  deptSlug: string | null
): Promise<{ healthSystemId: string | null; programId: string | null; specialty: string | null }> {
  if (!orgSlug) {
    return { healthSystemId: null, programId: null, specialty: null };
  }
  
  // Get health system
  const { data: org } = await supabase
    .from('health_systems')
    .select('id')
    .eq('slug', orgSlug)
    .eq('is_active', true)
    .single();
  
  if (!org) {
    return { healthSystemId: null, programId: null, specialty: null };
  }
  
  if (!deptSlug) {
    return { healthSystemId: org.id, programId: null, specialty: null };
  }
  
  // Get program
  const { data: program } = await supabase
    .from('programs')
    .select('id, specialty')
    .eq('health_system_id', org.id)
    .eq('slug', deptSlug)
    .eq('is_active', true)
    .single();
  
  return {
    healthSystemId: org.id,
    programId: program?.id || null,
    specialty: program?.specialty || null,
  };
}

/**
 * Get user's membership for the tenant
 */
async function getUserMembership(
  supabase: SupabaseServiceClient,
  userId: string,
  healthSystemId: string | null,
  programId: string | null
): Promise<{ membershipId: string | null; membershipRole: MembershipRole | null }> {
  if (!healthSystemId) {
    return { membershipId: null, membershipRole: null };
  }
  
  let query = supabase
    .from('organization_memberships')
    .select('id, role')
    .eq('user_id', userId)
    .eq('health_system_id', healthSystemId);
  
  // If program specified, match it; otherwise get any membership for the org
  if (programId) {
    query = query.eq('program_id', programId);
  }
  
  const { data: membership } = await query.limit(1).single();
  
  return {
    membershipId: membership?.id || null,
    membershipRole: membership?.role as MembershipRole || null,
  };
}

/**
 * Get user's studio creator profile
 */
async function getStudioCreator(
  supabase: SupabaseServiceClient,
  userId: string
): Promise<{ studioCreatorId: string | null; isApproved: boolean }> {
  const { data: creator } = await supabase
    .from('studio_creators')
    .select('id, status')
    .eq('user_id', userId)
    .single();
  
  return {
    studioCreatorId: creator?.id || null,
    isApproved: creator?.status === 'approved',
  };
}

/**
 * Get authenticated user from cookies or bearer token
 */
const getAuthenticatedUser = cache(async (request: NextRequest): Promise<{
  user: AuthUser | null;
  error?: string;
}> => {
  let user = null;
  let authError = null;

  // 1. Try cookies first (browser session)
  const cookieStore = await cookies();
  const supabaseCookie = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Read-only in API routes
        },
      },
    }
  );

  const { data: cookieData, error: cookieError } = await supabaseCookie.auth.getUser();
  
  if (!cookieError && cookieData.user) {
    user = cookieData.user;
  } else {
    // 2. Fallback to Bearer token
    const authHeader = request.headers.get('authorization');
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false }
      });
      const { data: tokenData, error: tokenError } = await supabaseAdmin.auth.getUser(token);
      
      if (!tokenError && tokenData.user) {
        user = tokenData.user;
      } else {
        authError = tokenError;
      }
    }
  }

  if (!user) {
    return {
      user: null,
      error: authError?.message || 'Unauthorized',
    };
  }

  // Fetch profile using service role
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });

  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('role, email')
    .eq('id', user.id)
    .single();

  return {
    user: {
      id: user.id,
      email: user.email || profile?.email || '',
      role: profile?.role || undefined,
    },
  };
});

/**
 * Main wrapper function
 * 
 * Wraps an API route handler with authentication and tenant context.
 */
export function withTenantAuth(
  handler: TenantAuthHandler,
  options: TenantAuthOptions = {}
) {
  const {
    allowResident = false,
    requireTenant = true,
    allowUnauthenticated = false,
    minimumRole,
    requiredRoles,
  } = options;

  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // 1. Authenticate user
      const { user, error: authError } = await getAuthenticatedUser(request);
      
      if (!user && !allowUnauthenticated) {
        return NextResponse.json(
          { error: authError || 'Unauthorized' },
          { status: 401 }
        );
      }

      // Create service client for queries
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- no generated DB types; any avoids 'never' on query results
      const supabase = createClient<any>(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false }
      });

      // 2. Extract tenant context
      const { orgSlug, deptSlug } = await extractTenantFromRequest(request);
      const { healthSystemId, programId, specialty } = await resolveTenantIds(supabase, orgSlug, deptSlug);

      // 3. Check user's profile role (for super_admin bypass)
      const userProfileRole = user?.role;
      const isSuperAdmin = userProfileRole === 'super_admin';

      console.log('[withTenantAuth] User role check:', {
        userId: user?.id,
        email: user?.email,
        userProfileRole,
        isSuperAdmin,
        requireTenant,
        healthSystemId,
        orgSlug,
        deptSlug,
      });

      // 4. Check if tenant is required (super_admin can bypass)
      if (requireTenant && !healthSystemId && !isSuperAdmin) {
        console.log('[withTenantAuth] Tenant context check FAILED - returning 400');
        return NextResponse.json(
          { error: 'Tenant context required. Access via organization URL.' },
          { status: 400 }
        );
      }

      // 5. Get user's membership and role
      let membershipId: string | null = null;
      let membershipRole: MembershipRole | null = null;
      
      if (user && healthSystemId) {
        const membership = await getUserMembership(supabase, user.id, healthSystemId, programId);
        membershipId = membership.membershipId;
        membershipRole = membership.membershipRole;
      }

      // Determine effective role (membership role or profile role)
      const effectiveRole = (membershipRole || user?.role || 'viewer') as MembershipRole;

      // 5. Check role permissions
      const isResident = effectiveRole === 'resident';
      const isFaculty = ROLE_HIERARCHY[effectiveRole] >= ROLE_HIERARCHY['faculty'];
      const isProgramLeadership = ['program_director', 'assistant_program_director', 'clerkship_director', 'admin', 'super_admin'].includes(effectiveRole);
      const isAdmin = ['admin', 'super_admin'].includes(effectiveRole);

      // Block residents if not allowed
      if (isResident && !allowResident) {
        return NextResponse.json(
          { error: 'Access denied. This resource requires faculty or above.' },
          { status: 403 }
        );
      }

      // Check minimum role
      if (minimumRole) {
        const userLevel = ROLE_HIERARCHY[effectiveRole] || 0;
        const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;
        
        if (userLevel < requiredLevel) {
          return NextResponse.json(
            { error: `Access denied. Requires at least ${minimumRole} role.` },
            { status: 403 }
          );
        }
      }

      // Check required roles
      if (requiredRoles && requiredRoles.length > 0) {
        if (!requiredRoles.includes(effectiveRole)) {
          return NextResponse.json(
            { error: `Access denied. Requires one of: ${requiredRoles.join(', ')}` },
            { status: 403 }
          );
        }
      }

      // 6. Get studio creator info
      let studioCreatorId: string | null = null;
      let isStudioCreator = false;
      
      if (user) {
        const studioInfo = await getStudioCreator(supabase, user.id);
        studioCreatorId = studioInfo.studioCreatorId;
        isStudioCreator = studioInfo.isApproved;
      }

      // 7. Build context with helper methods
      const context: TenantAuthContext = {
        // User info
        user: user!,
        role: effectiveRole,
        
        // Tenant info
        healthSystemId,
        programId,
        specialty,
        orgSlug,
        deptSlug,
        
        // Membership info
        membershipId,
        membershipRole,
        
        // Studio info
        studioCreatorId,
        isStudioCreator,
        
        // Role checks
        isResident,
        isFaculty,
        isProgramLeadership,
        isAdmin,
        
        // Supabase client
        supabase,
        
        // Helper: Can access a specific resident
        canAccessResident: async (residentId: string): Promise<boolean> => {
          if (isAdmin) return true;
          if (!programId) return false;
          
          // Check if resident belongs to user's program
          const { data: resident } = await supabase
            .from('residents')
            .select('program_id, user_id')
            .eq('id', residentId)
            .single();
          
          if (!resident) return false;
          
          // Residents can only access their own data
          if (isResident) {
            return resident.user_id === user?.id;
          }
          
          // Faculty/leadership can access residents in their program
          return resident.program_id === programId;
        },
        
        // Helper: Can access a specific program
        canAccessProgram: (targetProgramId: string): boolean => {
          if (isAdmin) return true;
          return programId === targetProgramId;
        },
        
        // Helper: Can view studio content by specialty
        canViewStudioContent: (contentSpecialty: string): boolean => {
          if (isAdmin) return true;
          if (!specialty) return false;
          return specialty.toLowerCase() === contentSpecialty.toLowerCase();
        },
        
        // Helper: Can publish studio content
        canPublishStudioContent: isFaculty && isStudioCreator,
      };

      // 8. Call the handler
      return await handler(request, context);
      
    } catch (error) {
      console.error('[withTenantAuth] Error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Quick helpers for common patterns
 */
export function withFacultyAuth(handler: TenantAuthHandler) {
  return withTenantAuth(handler, { minimumRole: 'faculty' });
}

export function withLeadershipAuth(handler: TenantAuthHandler) {
  return withTenantAuth(handler, { 
    requiredRoles: ['program_director', 'assistant_program_director', 'clerkship_director', 'admin', 'super_admin'] 
  });
}

export function withAdminAuth(handler: TenantAuthHandler) {
  return withTenantAuth(handler, { 
    requiredRoles: ['admin', 'super_admin'] 
  });
}

export function withResidentAccess(handler: TenantAuthHandler) {
  return withTenantAuth(handler, { allowResident: true });
}
