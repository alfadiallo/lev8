/**
 * Server-side authentication utilities
 * 
 * These utilities use Next.js cache() for request-level memoization,
 * ensuring auth checks and profile fetches happen only once per request.
 * 
 * Best Practices:
 * - Use getServerUser() for lightweight checks (middleware, route guards)
 * - Use getServerUserWithProfile() when you need role/permissions
 * - Use requireAuth() in server components that need authentication
 */

import { cache } from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Create a server-side Supabase client for the current request
 * Uses request-level caching to reuse the same client instance
 */
const getServerSupabaseClient = cache(async () => {
  const cookieStore = await cookies();
  
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(_cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
        // Read-only for most server components
        // Cookies are set by middleware or API routes
      },
    },
  });
});

/**
 * Get the authenticated user from cookies (lightweight, no profile)
 * 
 * Use this for:
 * - Middleware route protection
 * - Simple auth checks that don't need role/permissions
 * 
 * Cached per request using React cache()
 */
export const getServerUser = cache(async () => {
  const supabase = await getServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
});

/**
 * Get the authenticated user with their profile (role, name, etc.)
 * 
 * Use this for:
 * - Server components that need role/permissions
 * - Layout components that display user info
 * 
 * Cached per request using React cache()
 */
export const getServerUserWithProfile = cache(async () => {
  const user = await getServerUser();
  
  if (!user) {
    return null;
  }
  
  const supabase = await getServerSupabaseClient();
  
  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('role, full_name, email, phone, allowed_modules')
    .eq('id', user.id)
    .single();
  
  if (profileError) {
    console.error('[getServerUserWithProfile] Profile fetch error:', profileError);
    // Return user without profile rather than failing
    return {
      id: user.id,
      email: user.email || '',
      role: undefined,
      firstName: undefined,
      lastName: undefined,
      allowed_modules: null,
    };
  }
  
  return {
    id: user.id,
    email: user.email || profile?.email || '',
    role: profile?.role || undefined,
    firstName: profile?.full_name?.split(' ')[0],
    lastName: profile?.full_name?.split(' ').slice(1).join(' '),
    allowed_modules: profile?.allowed_modules || null,
  };
});

/**
 * Require authentication in server components
 * 
 * Throws redirect to login if user is not authenticated
 * Returns user with profile if authenticated
 * 
 * Example:
 * ```tsx
 * export default async function ProtectedPage() {
 *   const user = await requireAuth();
 *   // user is guaranteed to be non-null here
 *   return <div>Hello {user.email}</div>;
 * }
 * ```
 */
export async function requireAuth() {
  const user = await getServerUserWithProfile();
  
  if (!user) {
    redirect('/login');
  }
  
  return user;
}

/**
 * Require a specific role in server components
 * 
 * Throws redirect to dashboard if user doesn't have required role
 * 
 * Example:
 * ```tsx
 * export default async function AdminPage() {
 *   const user = await requireRole(['super_admin', 'admin']);
 *   // user is guaranteed to have one of the required roles
 * }
 * ```
 */
export async function requireRole(requiredRoles: string[]) {
  const user = await requireAuth();
  
  if (!user.role || !requiredRoles.includes(user.role)) {
    redirect('/dashboard');
  }
  
  return user;
}

