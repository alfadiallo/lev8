import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
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
    let user = null;
    let authError = null;

    // 1. Try to get user from cookies (Browser session)
    const cookieStore = await cookies();
    const supabaseCookie = createServerClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            // Read-only in API routes usually
          },
        },
      }
    );

    const { data: cookieData, error: cookieError } = await supabaseCookie.auth.getUser();
    
    if (!cookieError && cookieData.user) {
      user = cookieData.user;
    } else {
      // 2. Fallback to Bearer token (API/External access)
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
        authorized: false,
        error: 'Unauthorized',
        response: NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        ),
      };
    }

    // Create admin client for profile fetch (bypassing RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

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
