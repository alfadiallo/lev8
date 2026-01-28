/**
 * V2 Analytics Scores API
 * 
 * GET /api/v2/analytics/scores - Get EQ/PQ/IQ scores
 * 
 * Query params:
 * - scope: 'resident' | 'class' | 'program' (required)
 * - resident_id: Required when scope='resident'
 * - class_year: Required when scope='class', optional filter for others
 * - include_trends: Include historical trend data (default: false)
 * 
 * Role-based behavior:
 * - Residents: Can only view their own scores, class data is anonymized
 * - Faculty+: Can view any resident/class in their program
 */

import { NextRequest, NextResponse } from 'next/server';
import { withTenantAuth, TenantAuthContext } from '@/lib/api/withTenantAuth';
import { shapeResidentScores, createClassComparison, ResidentScore } from '@/lib/api/dataShaping';
import { calculatePGYLevel } from '@/lib/utils/pgy-calculator';

type Scope = 'resident' | 'class' | 'program';

async function handler(
  request: NextRequest,
  ctx: TenantAuthContext
): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope') as Scope;
  const residentId = searchParams.get('resident_id');
  const classYear = searchParams.get('class_year');
  const includeTrends = searchParams.get('include_trends') === 'true';

  if (!scope || !['resident', 'class', 'program'].includes(scope)) {
    return NextResponse.json(
      { error: 'Invalid scope. Must be: resident, class, or program' },
      { status: 400 }
    );
  }

  // Handle different scopes
  switch (scope) {
    case 'resident':
      return handleResidentScope(ctx, residentId, includeTrends);
    case 'class':
      return handleClassScope(ctx, classYear, includeTrends);
    case 'program':
      return handleProgramScope(ctx, includeTrends);
    default:
      return NextResponse.json({ error: 'Invalid scope' }, { status: 400 });
  }
}

/**
 * Get scores for a single resident
 */
async function handleResidentScope(
  ctx: TenantAuthContext,
  residentId: string | null,
  includeTrends: boolean
): Promise<NextResponse> {
  if (!residentId) {
    return NextResponse.json(
      { error: 'resident_id required for scope=resident' },
      { status: 400 }
    );
  }

  // Check access
  const canAccess = await ctx.canAccessResident(residentId);
  if (!canAccess) {
    return NextResponse.json(
      { error: 'Access denied to this resident' },
      { status: 403 }
    );
  }

  // Fetch period scores
  const { data: periodScores, error } = await ctx.supabase
    .from('period_scores')
    .select('*')
    .eq('resident_id', residentId)
    .order('period_label', { ascending: false });

  if (error) {
    console.error('[V2 Analytics] Period scores error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scores' },
      { status: 500 }
    );
  }

  // Transform scores
  const scores = (periodScores || []).map(score => ({
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

  // Get trends if requested
  let trends = null;
  if (includeTrends && scores.length > 1) {
    trends = {
      eq: scores.map(s => ({ period: s.periodLabel, value: s.eqScore })).reverse(),
      pq: scores.map(s => ({ period: s.periodLabel, value: s.pqScore })).reverse(),
      iq: scores.map(s => ({ period: s.periodLabel, value: s.iqScore })).reverse(),
      composite: scores.map(s => ({ period: s.periodLabel, value: s.compositeScore })).reverse(),
    };
  }

  // Get latest score summary
  const latest = scores[0] || null;

  return NextResponse.json({
    scope: 'resident',
    residentId,
    latest,
    history: scores,
    trends,
  });
}

/**
 * Get aggregated scores for a class year
 */
async function handleClassScope(
  ctx: TenantAuthContext,
  classYear: string | null,
  includeTrends: boolean
): Promise<NextResponse> {
  if (!classYear) {
    return NextResponse.json(
      { error: 'class_year required for scope=class' },
      { status: 400 }
    );
  }

  const year = parseInt(classYear);
  if (isNaN(year)) {
    return NextResponse.json(
      { error: 'Invalid class_year' },
      { status: 400 }
    );
  }

  // Get residents in this class
  const { data: residents, error: residentsError } = await ctx.supabase
    .from('residents')
    .select(`
      id,
      anon_code,
      user_id,
      classes:class_id (graduation_year)
    `)
    .eq('program_id', ctx.programId);

  if (residentsError) {
    console.error('[V2 Analytics] Residents fetch error:', residentsError);
    return NextResponse.json(
      { error: 'Failed to fetch class residents' },
      { status: 500 }
    );
  }

  // Filter to matching class year
  const classResidents = (residents || []).filter((r: Record<string, unknown>) => {
    const classInfo = r.classes as { graduation_year: number } | null;
    return classInfo?.graduation_year === year;
  });

  if (classResidents.length === 0) {
    return NextResponse.json({
      scope: 'class',
      classYear: year,
      pgyLevel: calculatePGYLevel(year),
      residents: [],
      summary: null,
      comparison: null,
    });
  }

  // Get latest scores for each resident
  const residentScores: ResidentScore[] = await Promise.all(
    classResidents.map(async (r: Record<string, unknown>) => {
      const { data: latestScore } = await ctx.supabase
        .from('period_scores')
        .select('eq_score, pq_score, iq_score, composite_score')
        .eq('resident_id', r.id)
        .order('period_label', { ascending: false })
        .limit(1)
        .single();

      return {
        residentId: r.id as string,
        residentName: '', // Will be filled by data shaping if needed
        anonCode: r.anon_code as string,
        pgyLevel: calculatePGYLevel(year),
        eqScore: latestScore?.eq_score,
        pqScore: latestScore?.pq_score,
        iqScore: latestScore?.iq_score,
        compositeScore: latestScore?.composite_score,
      };
    })
  );

  // Shape data based on role (anonymize for residents)
  const shapedScores = shapeResidentScores(residentScores, ctx);

  // Create class comparison
  const comparison = {
    composite: createClassComparison(residentScores, ctx, 'compositeScore'),
    eq: createClassComparison(residentScores, ctx, 'eqScore'),
    pq: createClassComparison(residentScores, ctx, 'pqScore'),
    iq: createClassComparison(residentScores, ctx, 'iqScore'),
  };

  // Calculate class summary
  const validScores = residentScores.filter(s => s.compositeScore !== undefined);
  const summary = validScores.length > 0 ? {
    totalResidents: classResidents.length,
    withScores: validScores.length,
    averages: {
      eq: average(validScores.map(s => s.eqScore).filter(Boolean) as number[]),
      pq: average(validScores.map(s => s.pqScore).filter(Boolean) as number[]),
      iq: average(validScores.map(s => s.iqScore).filter(Boolean) as number[]),
      composite: average(validScores.map(s => s.compositeScore).filter(Boolean) as number[]),
    },
  } : null;

  // Get trends if requested
  let trends = null;
  if (includeTrends) {
    // Get class-level aggregated scores over time
    const { data: classTrends } = await ctx.supabase
      .from('class_scores')
      .select('*')
      .eq('class_year', year)
      .eq('program_id', ctx.programId)
      .order('period_label', { ascending: true });

    if (classTrends && classTrends.length > 0) {
      trends = {
        eq: classTrends.map(t => ({ period: t.period_label, value: t.avg_eq_score })),
        pq: classTrends.map(t => ({ period: t.period_label, value: t.avg_pq_score })),
        iq: classTrends.map(t => ({ period: t.period_label, value: t.avg_iq_score })),
        composite: classTrends.map(t => ({ period: t.period_label, value: t.avg_composite_score })),
      };
    }
  }

  return NextResponse.json({
    scope: 'class',
    classYear: year,
    pgyLevel: calculatePGYLevel(year),
    residents: shapedScores,
    summary,
    comparison,
    trends,
  });
}

/**
 * Get program-wide aggregated scores
 */
async function handleProgramScope(
  ctx: TenantAuthContext,
  includeTrends: boolean
): Promise<NextResponse> {
  // Get all current residents (not graduated)
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const academicYear = currentMonth >= 6 ? currentYear : currentYear - 1;

  const { data: residents, error } = await ctx.supabase
    .from('residents')
    .select(`
      id,
      anon_code,
      classes:class_id (graduation_year)
    `)
    .eq('program_id', ctx.programId);

  if (error) {
    console.error('[V2 Analytics] Program residents error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch program residents' },
      { status: 500 }
    );
  }

  // Filter to current (not graduated)
  const currentResidents = (residents || []).filter((r: Record<string, unknown>) => {
    const classInfo = r.classes as { graduation_year: number } | null;
    return classInfo && classInfo.graduation_year > academicYear;
  });

  // Group by PGY level
  const byPGY: Record<number, typeof currentResidents> = {};
  for (const r of currentResidents) {
    const classInfo = (r as Record<string, unknown>).classes as { graduation_year: number };
    const pgy = calculatePGYLevel(classInfo.graduation_year);
    if (!byPGY[pgy]) byPGY[pgy] = [];
    byPGY[pgy].push(r);
  }

  // Get average scores per PGY level
  const pgyStats = await Promise.all(
    Object.entries(byPGY).map(async ([pgy, pgyResidents]) => {
      const scores = await Promise.all(
        pgyResidents.map(async (r: Record<string, unknown>) => {
          const { data: latestScore } = await ctx.supabase
            .from('period_scores')
            .select('eq_score, pq_score, iq_score, composite_score')
            .eq('resident_id', r.id)
            .order('period_label', { ascending: false })
            .limit(1)
            .single();
          return latestScore;
        })
      );

      const validScores = scores.filter(Boolean);
      return {
        pgyLevel: parseInt(pgy),
        residentCount: pgyResidents.length,
        withScores: validScores.length,
        averages: validScores.length > 0 ? {
          eq: average(validScores.map(s => s?.eq_score).filter(Boolean) as number[]),
          pq: average(validScores.map(s => s?.pq_score).filter(Boolean) as number[]),
          iq: average(validScores.map(s => s?.iq_score).filter(Boolean) as number[]),
          composite: average(validScores.map(s => s?.composite_score).filter(Boolean) as number[]),
        } : null,
      };
    })
  );

  // Get overall program averages
  const allScores = pgyStats.flatMap(p => p.averages ? [p.averages] : []);
  const programAverages = allScores.length > 0 ? {
    eq: average(allScores.map(s => s.eq)),
    pq: average(allScores.map(s => s.pq)),
    iq: average(allScores.map(s => s.iq)),
    composite: average(allScores.map(s => s.composite)),
  } : null;

  // Get trends if requested
  let trends = null;
  if (includeTrends) {
    const { data: programTrends } = await ctx.supabase
      .from('program_scores')
      .select('*')
      .eq('program_id', ctx.programId)
      .order('period_label', { ascending: true });

    if (programTrends && programTrends.length > 0) {
      trends = {
        eq: programTrends.map(t => ({ period: t.period_label, value: t.avg_eq_score })),
        pq: programTrends.map(t => ({ period: t.period_label, value: t.avg_pq_score })),
        iq: programTrends.map(t => ({ period: t.period_label, value: t.avg_iq_score })),
        composite: programTrends.map(t => ({ period: t.period_label, value: t.avg_composite_score })),
      };
    }
  }

  return NextResponse.json({
    scope: 'program',
    programId: ctx.programId,
    totalResidents: currentResidents.length,
    byPGYLevel: pgyStats.sort((a, b) => a.pgyLevel - b.pgyLevel),
    programAverages,
    trends,
  });
}

// Helper function
function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return Math.round((numbers.reduce((a, b) => a + b, 0) / numbers.length) * 100) / 100;
}

// Faculty and above can access analytics
export const GET = withTenantAuth(handler, { minimumRole: 'faculty' });
