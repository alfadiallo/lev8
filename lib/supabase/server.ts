/**
 * Server-side Supabase client helpers
 * 
 * Provides reusable Supabase client instances for server-side code.
 * Uses request-level caching to avoid creating multiple clients per request.
 */

import { cache } from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Get a cookie-based Supabase client for the current request
 * 
 * Use this for:
 * - Server components
 * - Server actions
 * - Any server-side code that needs to respect RLS policies
 * 
 * Cached per request using React cache()
 */
export const getServerSupabaseClient = cache(() => {
  const cookieStore = cookies();
  
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // Read-only for most server components
        // Cookies are set by middleware or API routes
      },
    },
  });
});

/**
 * Get a service-role Supabase client (bypasses RLS)
 * 
 * Use this for:
 * - Admin operations
 * - System-level queries
 * - When you need to bypass RLS policies
 * 
 * WARNING: Only use when absolutely necessary. Prefer getServerSupabaseClient()
 * to respect RLS policies.
 * 
 * Cached per request using React cache()
 */
export const getServiceSupabaseClient = cache(() => {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
  });
});

