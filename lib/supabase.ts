// Server-side Supabase client (uses SERVICE_KEY)
// For client-side use, import from '@/lib/supabase-client' instead

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

// Export a singleton instance
export const supabase = createSupabaseClient(supabaseUrl, supabaseKey);

// Export a function to create a new client (useful if we need fresh state, though less relevant for service role)
export const createClient = () => createSupabaseClient(supabaseUrl, supabaseKey);
