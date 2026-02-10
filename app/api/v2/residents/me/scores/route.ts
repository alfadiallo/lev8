/**
 * V2 Resident Self-Scores API
 * 
 * GET /api/v2/residents/me/scores - Get current resident's scores
 * 
 * Returns:
 * - EQ/PQ/IQ period scores
 * - ITE scores
 * - ROSH completion snapshots
 * - Class comparison data (anonymized)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withTenantAuth, TenantAuthContext } from '@/lib/api/withTenantAuth';
import { createClassComparison } from '@/lib/api/dataShaping';

async function handler(
  _request: NextRequest,
  ctx: TenantAuthContext
): Promise<NextResponse> {
  // Find resident record for current user
  // Use column-based join syntax for reliable foreign key resolution
  const { data: resident, error: residentError } = await ctx.supabase
    .from('residents')
    .select(`
      id,
      class_id,
      classes:class_id (
        graduation_year
      )
    `)
    .eq('user_id', ctx.user.id)
    .single();

  if (residentError || !resident) {
    return NextResponse.json(
      { error: 'You are not registered as a resident' },
      { status: 404 }
    );
  }

  const residentId = resident.id;
  const classInfo = resident.classes as unknown as { graduation_year: number } | null;
  const graduationYear = classInfo?.graduation_year;

  // Fetch period scores
  const { data: periodScores } = await ctx.supabase
    .from('period_scores')
    .select('*')
    .eq('resident_id', residentId)
    .order('period_label', { ascending: false });

  // Fetch ITE scores
  const { data: iteScores } = await ctx.supabase
    .from('ite_scores')
    .select('*')
    .eq('resident_id', residentId)
    .order('exam_year', { ascending: false });

  // Fetch ROSH snapshots
  const { data: roshSnapshots } = await ctx.supabase
    .from('rosh_completion_snapshots')
    .select('*')
    .eq('resident_id', residentId)
    .order('snapshot_date', { ascending: false });

  // Get class comparison data (if we have graduation year)
  let classComparison = null;
  if (graduationYear && ctx.programId) {
    // Get all residents in same class
    const { data: classmates } = await ctx.supabase
      .from('residents')
      .select(`
        id,
        anon_code,
        classes:class_id (graduation_year)
      `)
      .eq('program_id', ctx.programId);

    // Filter to same graduation year
    const sameClassResidents = (classmates || []).filter((r: Record<string, unknown>) => {
      const rClass = r.classes as unknown as { graduation_year: number } | null;
      return rClass?.graduation_year === graduationYear;
    });

    // Get latest scores for each classmate
    const classScores = await Promise.all(
      sameClassResidents.map(async (r: Record<string, unknown>) => {
        const { data: latestScore } = await ctx.supabase
          .from('period_scores')
          .select('eq_score, pq_score, iq_score, composite_score')
          .eq('resident_id', r.id)
          .order('period_label', { ascending: false })
          .limit(1)
          .single();

        return {
          residentId: r.id as string,
          residentName: '', // Not needed for comparison
          anonCode: r.anon_code as string,
          pgyLevel: 0,
          eqScore: latestScore?.eq_score,
          pqScore: latestScore?.pq_score,
          iqScore: latestScore?.iq_score,
          compositeScore: latestScore?.composite_score,
        };
      })
    );

    // Create comparison for each score type
    classComparison = {
      composite: createClassComparison(classScores, ctx, 'compositeScore'),
      eq: createClassComparison(classScores, ctx, 'eqScore'),
      pq: createClassComparison(classScores, ctx, 'pqScore'),
      iq: createClassComparison(classScores, ctx, 'iqScore'),
    };
  }

  // Transform data
  const transformedPeriodScores = (periodScores || []).map(score => ({
    id: score.id,
    periodLabel: score.period_label,
    eqScore: score.eq_score,
    pqScore: score.pq_score,
    iqScore: score.iq_score,
    compositeScore: score.composite_score,
    eqSampleSize: score.eq_sample_size,
    pqSampleSize: score.pq_sample_size,
    iqSampleSize: score.iq_sample_size,
    calculatedAt: score.calculated_at,
  }));

  const transformedIteScores = (iteScores || []).map(score => ({
    id: score.id,
    examYear: score.exam_year,
    pgyLevel: score.pgy_level,
    rawScore: score.raw_score,
    scaledScore: score.scaled_score,
    percentileRank: score.percentile_rank,
    nationalMean: score.national_mean,
    programMean: score.program_mean,
    categoryScores: score.category_scores,
  }));

  const transformedRoshSnapshots = (roshSnapshots || []).map(snapshot => ({
    id: snapshot.id,
    snapshotDate: snapshot.snapshot_date,
    totalQuestions: snapshot.total_questions,
    questionsCompleted: snapshot.questions_completed,
    percentComplete: snapshot.percent_complete,
    topicBreakdown: snapshot.topic_breakdown,
  }));

  return NextResponse.json({
    periodScores: transformedPeriodScores,
    iteScores: transformedIteScores,
    roshSnapshots: transformedRoshSnapshots,
    classComparison,
    meta: {
      residentId,
      graduationYear,
    },
  });
}

// Residents can access their own scores
export const GET = withTenantAuth(handler, { 
  allowResident: true,
  requireTenant: false,
});
