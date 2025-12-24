// GET /api/analytics/swot/resident/[id] - Get resident SWOT data

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireFacultyOrAbove } from '@/lib/auth/checkApiPermission';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Require faculty or above to view resident SWOT data
  const authResult = await requireFacultyOrAbove(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const { id: residentId } = await params;

    // Fetch SWOT summaries for the resident
    const { data: swotData, error } = await supabase
      .from('swot_summaries')
      .select('*')
      .eq('resident_id', residentId)
      .eq('is_current', true)
      .order('period_label', { ascending: false });

    if (error) {
      console.error('[Analytics API] SWOT fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch SWOT data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      periods: swotData || []
    });
  } catch (error) {
    console.error('[Analytics API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



