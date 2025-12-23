// GET /api/analytics/scores/program - Get program-wide score statistics

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireFacultyOrAbove } from '@/lib/auth/checkApiPermission';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(request: NextRequest) {
  // Require faculty or above to view program scores
  const authResult = await requireFacultyOrAbove(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    // Fetch all period scores across the program
    const { data: scoresData, error: scoresError } = await supabase
      .from('period_scores')
      .select(`
        *,
        residents!inner(
          id,
          user_profiles!inner(full_name),
          classes!inner(graduation_year)
        )
      `)
      .eq('is_current', true)
      .order('period_label', { ascending: false });

    if (scoresError) {
      console.error('[Analytics API] Scores fetch error:', scoresError);
      return NextResponse.json(
        { error: 'Failed to fetch program scores data' },
        { status: 500 }
      );
    }

    // Calculate overall program statistics
    let totalEQ = 0, totalPQ = 0, totalIQ = 0, count = 0;
    scoresData?.forEach((score: any) => {
      if (score.faculty_eq_avg) {
        totalEQ += score.faculty_eq_avg;
        count++;
      }
      if (score.faculty_pq_avg) totalPQ += score.faculty_pq_avg;
      if (score.faculty_iq_avg) totalIQ += score.faculty_iq_avg;
    });

    const programStats = {
      avg_eq: count > 0 ? totalEQ / count : null,
      avg_pq: count > 0 ? totalPQ / count : null,
      avg_iq: count > 0 ? totalIQ / count : null,
      total_residents: new Set(scoresData?.map((s: any) => s.resident_id)).size,
      total_periods: scoresData?.length || 0
    };

    // Group by class year
    const byClass = new Map<number, any>();
    scoresData?.forEach((score: any) => {
      const classYear = score.residents?.classes?.graduation_year;
      if (!classYear) return;

      if (!byClass.has(classYear)) {
        byClass.set(classYear, {
          class_year: classYear,
          eq_sum: 0,
          pq_sum: 0,
          iq_sum: 0,
          count: 0,
          residents: new Set()
        });
      }
      const cls = byClass.get(classYear);
      if (score.faculty_eq_avg) cls.eq_sum += score.faculty_eq_avg;
      if (score.faculty_pq_avg) cls.pq_sum += score.faculty_pq_avg;
      if (score.faculty_iq_avg) cls.iq_sum += score.faculty_iq_avg;
      cls.count += 1;
      cls.residents.add(score.resident_id);
    });

    const classStats = Array.from(byClass.values()).map(c => ({
      class_year: c.class_year,
      avg_eq: c.count > 0 ? c.eq_sum / c.count : null,
      avg_pq: c.count > 0 ? c.pq_sum / c.count : null,
      avg_iq: c.count > 0 ? c.iq_sum / c.count : null,
      n_residents: c.residents.size
    }));

    return NextResponse.json({
      program_stats: programStats,
      class_stats: classStats,
      periods: scoresData || []
    });
  } catch (error) {
    console.error('[Analytics API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



