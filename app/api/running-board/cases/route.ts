// API Route: Running Board Cases
// GET /api/running-board/cases - List all available clinical cases

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getServiceSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Use cookie-based auth
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // Read-only
          },
        },
      }
    );

    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service client for data operations
    const supabase = await getServiceSupabaseClient();

    // Get user's institution
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('institution_id')
      .eq('id', user.id)
      .single();

    // Parse query params for filtering
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const acuity = url.searchParams.get('acuity');
    const search = url.searchParams.get('search');

    // Build query - get global cases and institution-specific cases
    let query = supabase
      .from('running_board_cases')
      .select('*')
      .eq('is_active', true)
      .or(`is_global.eq.true,institution_id.eq.${profile?.institution_id || 'null'}`);

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    if (acuity) {
      query = query.eq('acuity_level', parseInt(acuity));
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,tags.cs.{${search}}`);
    }

    const { data: cases, error } = await query.order('acuity_level', { ascending: true });

    if (error) {
      console.error('[RunningBoardCases] Error fetching cases:', error);
      return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 });
    }

    return NextResponse.json({ cases: cases || [] }, { status: 200 });
  } catch (error) {
    console.error('[RunningBoardCases] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}






