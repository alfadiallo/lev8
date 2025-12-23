import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { UserRole, ROLE_HIERARCHY } from '@/lib/hooks/usePermissions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface AuthResult {
  authorized: boolean;
  userId?: string;
  role?: UserRole;
  error?: string;
  response?: NextResponse;
}

/**
 * Check if the request has valid authentication and the required role
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
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return {
        authorized: false,
        error: 'Missing or invalid authorization header',
        response: NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        ),
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return {
        authorized: false,
        error: 'Invalid token',
        response: NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        ),
      };
    }

    // Get user's role from profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return {
        authorized: false,
        error: 'User profile not found',
        response: NextResponse.json(
          { error: 'User profile not found' },
          { status: 403 }
        ),
      };
    }

    const userRole = profile.role as UserRole;

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

