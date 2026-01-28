/**
 * V2 Resident Scores API
 * 
 * GET /api/v2/residents/[id]/scores - Get all scores for a resident
 * 
 * Returns:
 * - EQ/PQ/IQ period scores
 * - ITE scores
 * - ROSH completion snapshots
 * 
 * Role-based behavior:
 * - Residents: Can only view their own scores
 * - Faculty+: Can view any resident in their program
 */

import { NextRequest, NextResponse } from 'next/server';
import { withTenantAuth, TenantAuthContext } from '@/lib/api/withTenantAuth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function handler(
  request: NextRequest,
  ctx: TenantAuthContext,
  routeCtx: RouteContext
): Promise<NextResponse> {
  const { id: residentId } = await routeCtx.params;

  // Check if user can access this resident
  const canAccess = await ctx.canAccessResident(residentId);
  if (!canAccess) {
    return NextResponse.json(
      { error: 'Access denied. You cannot view this resident\'s scores.' },
      { status: 403 }
    );
  }

  // Fetch period scores (EQ/PQ/IQ)
  const { data: periodScores, error: scoresError } = await ctx.supabase
    .from('period_scores')
    .select('*')
    .eq('resident_id', residentId)
    .order('period_label', { ascending: false });

  if (scoresError) {
    console.error('[V2 Scores API] Period scores error:', scoresError);
  }

  // Fetch ITE scores
  const { data: iteScores, error: iteError } = await ctx.supabase
    .from('ite_scores')
    .select('*')
    .eq('resident_id', residentId)
    .order('exam_year', { ascending: false });

  if (iteError) {
    console.error('[V2 Scores API] ITE scores error:', iteError);
  }

  // Fetch ROSH completion snapshots
  const { data: roshSnapshots, error: roshError } = await ctx.supabase
    .from('rosh_completion_snapshots')
    .select('*')
    .eq('resident_id', residentId)
    .order('snapshot_date', { ascending: false });

  if (roshError) {
    console.error('[V2 Scores API] ROSH snapshots error:', roshError);
  }

  // Transform period scores to consistent format
  const transformedPeriodScores = (periodScores || []).map(score => ({
    id: score.id,
    residentId: score.resident_id,
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

  // Transform ITE scores
  const transformedIteScores = (iteScores || []).map(score => ({
    id: score.id,
    residentId: score.resident_id,
    examYear: score.exam_year,
    pgyLevel: score.pgy_level,
    rawScore: score.raw_score,
    scaledScore: score.scaled_score,
    percentileRank: score.percentile_rank,
    nationalMean: score.national_mean,
    programMean: score.program_mean,
    categoryScores: score.category_scores,
  }));

  // Transform ROSH snapshots
  const transformedRoshSnapshots = (roshSnapshots || []).map(snapshot => ({
    id: snapshot.id,
    residentId: snapshot.resident_id,
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
    meta: {
      residentId,
      isOwnData: ctx.user.id === (await ctx.supabase
        .from('residents')
        .select('user_id')
        .eq('id', residentId)
        .single()
      ).data?.user_id,
    },
  });
}

// Wrap handler to pass route context
export const GET = (request: NextRequest, routeCtx: RouteContext) => {
  return withTenantAuth(
    (req, ctx) => handler(req, ctx, routeCtx),
    { allowResident: true }
  )(request);
};
