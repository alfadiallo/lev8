/**
 * @deprecated Use /api/v2/analytics/scores?scope=resident&resident_id=[id] instead
 * GET /api/analytics/scores/resident/[id] - Get resident scores data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabaseClient } from '@/lib/supabase/server';
import { requireFacultyOrAbove } from '@/lib/auth/checkApiPermission';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // DEPRECATION WARNING
  console.warn('[DEPRECATED] /api/analytics/scores/resident/[id] is deprecated. Use /api/v2/analytics/scores?scope=resident&resident_id=[id] instead.');

  // Require faculty or above to view resident scores
  const authResult = await requireFacultyOrAbove(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  // Use service role client for admin analytics (bypasses RLS)
  const supabase = getServiceSupabaseClient();

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

    const responseData = {
      periods: scoresData || [],
      ite_scores: iteData || [],
      rosh_snapshots: roshData || [],
      _deprecated: true,
      _deprecationMessage: 'Use /api/v2/analytics/scores?scope=resident&resident_id=[id] instead.',
    };
    
    console.log('[Analytics Scores API] Returning response with', responseData.ite_scores.length, 'ITE scores');

    const response = NextResponse.json(responseData);
    response.headers.set('Deprecation', 'true');
    response.headers.set('Sunset', '2026-04-01');
    response.headers.set('Link', '</api/v2/analytics/scores>; rel="successor-version"');
    return response;
  } catch (error) {
    console.error('[Analytics API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
