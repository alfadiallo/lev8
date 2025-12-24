// GET /api/analytics/scores/class/[year] - Get class average scores

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
  // Require faculty or above to view class scores
  const authResult = await requireFacultyOrAbove(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const { year } = await params;
    const classYear = parseInt(year);

    // Get all residents in this class
    const { data: residents, error: residentsError } = await supabase
      .from('residents')
      .select('id, classes!inner(graduation_year)')
      .eq('classes.graduation_year', classYear);

    if (residentsError) {
      console.error('[Analytics API] Residents fetch error:', residentsError);
      return NextResponse.json(
        { error: 'Failed to fetch class residents' },
        { status: 500 }
      );
    }

    const residentIds = residents?.map((r: any) => r.id) || [];

    if (residentIds.length === 0) {
      return NextResponse.json({
        periods: [],
        ite_averages: [],
        class_stats: null
      });
    }

    // Fetch period scores for all residents in class
    const { data: scoresData, error: scoresError } = await supabase
      .from('period_scores')
      .select('*')
      .in('resident_id', residentIds)
      .eq('is_current', true)
      .order('period_label', { ascending: false });

    if (scoresError) {
      console.error('[Analytics API] Scores fetch error:', scoresError);
      return NextResponse.json(
        { error: 'Failed to fetch scores data' },
        { status: 500 }
      );
    }

    // Calculate class averages by period
    const periodAverages = new Map<string, any>();
    scoresData?.forEach((score: any) => {
      if (!periodAverages.has(score.period_label)) {
        periodAverages.set(score.period_label, {
          period_label: score.period_label,
          eq_sum: 0,
          pq_sum: 0,
          iq_sum: 0,
          count: 0
        });
      }
      const period = periodAverages.get(score.period_label);
      if (score.faculty_eq_avg) period.eq_sum += score.faculty_eq_avg;
      if (score.faculty_pq_avg) period.pq_sum += score.faculty_pq_avg;
      if (score.faculty_iq_avg) period.iq_sum += score.faculty_iq_avg;
      period.count += 1;
    });

    const averages = Array.from(periodAverages.values()).map(p => ({
      period_label: p.period_label,
      avg_eq: p.count > 0 ? p.eq_sum / p.count : null,
      avg_pq: p.count > 0 ? p.pq_sum / p.count : null,
      avg_iq: p.count > 0 ? p.iq_sum / p.count : null,
      n_residents: p.count
    }));

    // Fetch ITE scores for class
    const { data: iteData, error: iteError } = await supabase
      .from('ite_scores')
      .select('*')
      .in('resident_id', residentIds)
      .order('test_date', { ascending: false });

    if (iteError) {
      console.error('[Analytics API] ITE fetch error:', iteError);
    }

    return NextResponse.json({
      periods: averages,
      ite_scores: iteData || [],
      class_stats: {
        n_residents: residentIds.length,
        class_year: classYear
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



