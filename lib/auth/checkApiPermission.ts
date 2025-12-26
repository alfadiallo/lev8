import { NextRequest, NextResponse } from 'next/server';
import { UserRole, ROLE_HIERARCHY } from '@/lib/hooks/usePermissions';
import { getApiUser } from './api';

interface AuthResult {
  authorized: boolean;
  userId?: string;
  role?: UserRole;
  error?: string;
  response?: NextResponse;
}

/**
 * Check if the request has valid authentication and the required role
 * 
 * Now uses getApiUser() for cached user + profile fetching.
 * This eliminates redundant Supabase client creation and profile fetches.
 * 
 * Example:
 * ```ts
 * export async function GET(request: NextRequest) {
 *   const authResult = await checkApiPermission(request, { minimumRole: 'faculty' });
 *   if (!authResult.authorized) {
 *     return authResult.response;
 *   }
 *   // Use authResult.userId and authResult.role
 * }
 * ```
 */
export async function checkApiPermission(
  request: NextRequest,
  options: {
    requiredRoles?: UserRole[];
    minimumRole?: UserRole;
    allowSelf?: boolean; // Allow if accessing own data
    selfIdParam?: string; // URL param name containing the target user/resident ID
  } = {}
): Promise<AuthResult> {
  try {
    // Get user + profile (cached per request)
    const { user, error: userError } = await getApiUser(request);

    if (!user || userError) {
      return {
        authorized: false,
        error: userError || 'Unauthorized',
        response: NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        ),
      };
    }

    const userRole = user.role as UserRole | undefined;

    if (!userRole) {
      return {
        authorized: false,
        error: 'User role not found',
        response: NextResponse.json(
          { error: 'User role not found' },
          { status: 403 }
        ),
      };
    }

    // Check if user has required role
    const { requiredRoles, minimumRole, allowSelf, selfIdParam } = options;

    // Check self-access
    if (allowSelf && selfIdParam) {
      const url = new URL(request.url);
      const targetId = url.pathname.split('/').pop() || url.searchParams.get(selfIdParam);
      
      if (targetId === user.id) {
        return {
          authorized: true,
          userId: user.id,
          role: userRole,
        };
      }
    }

    // Check required roles
    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(userRole)) {
        return {
          authorized: false,
          error: `Requires one of: ${requiredRoles.join(', ')}`,
          response: NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          ),
        };
      }
    }

    // Check minimum role
    if (minimumRole) {
      const userLevel = ROLE_HIERARCHY[userRole] || 0;
      const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;
      
      if (userLevel < requiredLevel) {
        return {
          authorized: false,
          error: `Requires at least ${minimumRole} role`,
          response: NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          ),
        };
      }
    }

    return {
      authorized: true,
      userId: user.id,
      role: userRole,
    };
  } catch (error) {
    console.error('[checkApiPermission] Error:', error);
    return {
      authorized: false,
      error: 'Internal error',
      response: NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      ),
    };
  }
}

/**
 * Quick check for faculty or above
 */
export async function requireFacultyOrAbove(request: NextRequest): Promise<AuthResult> {
  return checkApiPermission(request, { minimumRole: 'faculty' });
}

/**
 * Quick check for program leadership
 */
export async function requireProgramLeadership(request: NextRequest): Promise<AuthResult> {
  return checkApiPermission(request, {
    requiredRoles: ['program_director', 'assistant_program_director', 'clerkship_director', 'super_admin', 'admin']
  });
}

/**
 * Quick check for super admin
 */
export async function requireSuperAdmin(request: NextRequest): Promise<AuthResult> {
  return checkApiPermission(request, {
    requiredRoles: ['super_admin', 'admin']
  });
}
