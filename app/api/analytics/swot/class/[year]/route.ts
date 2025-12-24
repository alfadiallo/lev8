// GET /api/analytics/swot/class/[year] - Get aggregated SWOT by PGY year for class

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireFacultyOrAbove } from '@/lib/auth/checkApiPermission';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ year: string }> }
) {
  // Require faculty or above to view class SWOT data
  const authResult = await requireFacultyOrAbove(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const { year } = await params;
    const classYear = parseInt(year);

    // Fetch class-level SWOT summaries for PGY-1, PGY-2, PGY-3
    // These are stored with a special class_id identifier
    const { data: swotData, error } = await supabase
      .from('swot_summaries')
      .select('*')
      .eq('class_year', classYear)
      .is('resident_id', null) // Class-level summaries have null resident_id
      .eq('is_current', true)
      .order('period_label', { ascending: false });

    if (error) {
      console.error('[Analytics API] SWOT fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch SWOT data' },
        { status: 500 }
      );
    }

    // Return PGY-year aggregated data
    // Expected format: [{ period_label: "PGY-3", ... }, { period_label: "PGY-2", ... }, { period_label: "PGY-1", ... }]
    return NextResponse.json({
      swot: swotData || []
    });
  } catch (error) {
    console.error('[Analytics API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


