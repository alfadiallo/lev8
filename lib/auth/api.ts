/**
 * API route authentication utilities
 * 
 * These utilities provide cached user + profile fetching for API routes.
 * Uses request-level caching to ensure auth checks happen only once per request.
 * 
 * Best Practices:
 * - Use getApiUser() at the start of every API route
 * - Pass the result to checkApiPermission() for role checking
 * - Never create Supabase clients directly in API routes
 */

import { cache } from 'react';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface ApiUser {
  id: string;
  email: string;
  role?: string;
}

/**
 * Get authenticated user + profile for API routes
 * 
 * Tries cookies first (browser sessions), then falls back to Bearer token (external API access).
 * Profile is fetched using service role to bypass RLS.
 * 
 * Cached per request using React cache()
 * 
 * Example:
 * ```ts
 * export async function GET(request: NextRequest) {
 *   const authResult = await getApiUser(request);
 *   if (!authResult.user) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   }
 *   // Use authResult.user and authResult.role
 * }
 * ```
 */
export const getApiUser = cache(async (request: NextRequest): Promise<{
  user: ApiUser | null;
  error?: string;
}> => {
  let user = null;
  let authError = null;

  // 1. Try to get user from cookies (Browser session)
  const cookieStore = await cookies();
  const supabaseCookie = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(_cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
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
      user: null,
      error: authError?.message || 'Unauthorized',
    };
  }

  // Fetch profile using service role (bypasses RLS)
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .select('role, email')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return {
      user: null,
      error: 'User profile not found',
    };
  }

  return {
    user: {
      id: user.id,
      email: user.email || profile?.email || '',
      role: profile?.role || undefined,
    },
  };
});

