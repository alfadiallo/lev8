// GET /api/analytics/swot/program - Get program-wide SWOT data

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireFacultyOrAbove } from '@/lib/auth/checkApiPermission';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(request: NextRequest) {
  // Require faculty or above to view program SWOT data
  const authResult = await requireFacultyOrAbove(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    // Fetch all SWOT summaries across the program
    const { data: swotData, error } = await supabase
      .from('swot_summaries')
      .select(`
        *,
        residents!inner(
          id,
          user_profiles!inner(full_name)
        )
      `)
      .eq('is_current', true)
      .order('period_label', { ascending: false });

    if (error) {
      console.error('[Analytics API] SWOT fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch program SWOT data' },
        { status: 500 }
      );
    }

    // TODO: Implement program-wide aggregation logic
    // For now, return all summaries
    return NextResponse.json({
      periods: swotData || [],
      stats: {
        total_residents: new Set(swotData?.map((s: any) => s.resident_id)).size,
        total_summaries: swotData?.length || 0
      }
    });
  } catch (error) {
    console.error('[Analytics API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



