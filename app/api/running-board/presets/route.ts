// API Route: Running Board Presets
// GET /api/running-board/presets - List all preset shift configurations

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

    // Get global presets and institution-specific presets
    const { data: presets, error } = await supabase
      .from('running_board_presets')
      .select('*')
      .eq('is_active', true)
      .or(`is_global.eq.true,institution_id.eq.${profile?.institution_id || 'null'}`)
      .order('name', { ascending: true });

    if (error) {
      console.error('[RunningBoardPresets] Error fetching presets:', error);
      return NextResponse.json({ error: 'Failed to fetch presets' }, { status: 500 });
    }

    // For each preset, fetch the case details
    const presetsWithCases = await Promise.all(
      (presets || []).map(async (preset) => {
        if (preset.case_ids && preset.case_ids.length > 0) {
          const { data: cases } = await supabase
            .from('running_board_cases')
            .select('id, title, category, acuity_level, patient_profile')
            .in('id', preset.case_ids);
          
          return { ...preset, cases: cases || [] };
        }
        return { ...preset, cases: [] };
      })
    );

    return NextResponse.json({ presets: presetsWithCases }, { status: 200 });
  } catch (error) {
    console.error('[RunningBoardPresets] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}






