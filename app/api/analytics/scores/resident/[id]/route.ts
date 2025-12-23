// GET /api/analytics/scores/resident/[id] - Get resident scores data

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireFacultyOrAbove } from '@/lib/auth/checkApiPermission';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Require faculty or above to view resident scores
  const authResult = await requireFacultyOrAbove(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const { id: residentId } = await params;

    // Fetch period scores for the resident
    const { data: scoresData, error: scoresError } = await supabase
      .from('period_scores')
      .select('*')
      .eq('resident_id', residentId)
      .eq('is_current', true)
      .order('period_label', { ascending: false });

    if (scoresError) {
      console.error('[Analytics API] Scores fetch error:', scoresError);
    }

    // Fetch ITE scores for the resident
    const { data: iteData, error: iteError } = await supabase
      .from('ite_scores')
      .select('*')
      .eq('resident_id', residentId)
      .order('test_date', { ascending: false });

    console.log('[Analytics Scores API] ITE data:', iteData);

    if (iteError) {
      console.error('[Analytics API] ITE fetch error:', iteError);
      return NextResponse.json(
        { error: 'Failed to fetch ITE data' },
        { status: 500 }
      );
    }

    // Fetch ROSH completion snapshots
    const { data: roshData, error: roshError } = await supabase
      .from('rosh_completion_snapshots')
      .select('*')
      .eq('resident_id', residentId)
      .order('snapshot_date', { ascending: false });

    if (roshError) {
      console.warn('[Analytics API] ROSH fetch error:', roshError.message);
    }

    const response = {
      periods: scoresData || [],
      ite_scores: iteData || [],
      rosh_snapshots: roshData || []
    };
    
    console.log('[Analytics Scores API] Returning response with', response.ite_scores.length, 'ITE scores');

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Analytics API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
