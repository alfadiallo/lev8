// GET /api/analytics/ite/resident/[id] - Get resident ITE history

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireFacultyOrAbove } from '@/lib/auth/checkApiPermission';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Require faculty or above to view resident ITE data
  const authResult = await requireFacultyOrAbove(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const residentId = params.id;

    // Fetch ITE scores for the resident
    const { data: iteData, error } = await supabase
      .from('ite_scores')
      .select('*')
      .eq('resident_id', residentId)
      .order('test_date', { ascending: false });

    if (error) {
      console.error('[Analytics API] ITE fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch ITE data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ite_scores: iteData || []
    });
  } catch (error) {
    console.error('[Analytics API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



