/**
 * @deprecated Use /api/v2/analytics/swot?scope=resident&resident_id=[id] instead
 * GET /api/analytics/swot/resident/[id] - Get resident SWOT data
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFacultyOrAbove } from '@/lib/auth/checkApiPermission';
import { getServiceSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // DEPRECATION WARNING
  console.warn('[DEPRECATED] /api/analytics/swot/resident/[id] is deprecated. Use /api/v2/analytics/swot?scope=resident&resident_id=[id] instead.');

  // Require faculty or above to view resident SWOT data
  const authResult = await requireFacultyOrAbove(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  // Use service role client for admin analytics (bypasses RLS)
  const supabase = getServiceSupabaseClient();

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

    const response = NextResponse.json({
      periods: swotData || [],
      _deprecated: true,
      _deprecationMessage: 'Use /api/v2/analytics/swot?scope=resident&resident_id=[id] instead.',
    });
    response.headers.set('Deprecation', 'true');
    response.headers.set('Sunset', '2026-04-01');
    response.headers.set('Link', '</api/v2/analytics/swot>; rel="successor-version"');
    return response;
  } catch (error) {
    console.error('[Analytics API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



