/**
 * V2 Analytics SWOT API
 * 
 * GET /api/v2/analytics/swot - Get SWOT analysis data
 * 
 * Query params:
 * - scope: 'resident' | 'class' (required)
 * - resident_id: Required when scope='resident'
 * - class_year: Required when scope='class'
 * 
 * Role-based behavior:
 * - Residents: Can only view their own SWOT
 * - Faculty+: Can view any resident/class SWOT in their program
 */

import { NextRequest, NextResponse } from 'next/server';
import { withTenantAuth, TenantAuthContext } from '@/lib/api/withTenantAuth';
import { calculatePGYLevel } from '@/lib/utils/pgy-calculator';

type Scope = 'resident' | 'class';

async function handler(
  request: NextRequest,
  ctx: TenantAuthContext
): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope') as Scope;
  const residentId = searchParams.get('resident_id');
  const classYear = searchParams.get('class_year');

  if (!scope || !['resident', 'class'].includes(scope)) {
    return NextResponse.json(
      { error: 'Invalid scope. Must be: resident or class' },
      { status: 400 }
    );
  }

  switch (scope) {
    case 'resident':
      return handleResidentSWOT(ctx, residentId);
    case 'class':
      return handleClassSWOT(ctx, classYear);
    default:
      return NextResponse.json({ error: 'Invalid scope' }, { status: 400 });
  }
}

/**
 * Get SWOT for a single resident
 */
async function handleResidentSWOT(
  ctx: TenantAuthContext,
  residentId: string | null
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

  // Fetch SWOT summary
  const { data: swot, error } = await ctx.supabase
    .from('swot_summaries')
    .select('*')
    .eq('resident_id', residentId)
    .order('generated_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('[V2 Analytics SWOT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SWOT data' },
      { status: 500 }
    );
  }

  if (!swot) {
    return NextResponse.json({
      scope: 'resident',
      residentId,
      swot: null,
      message: 'No SWOT analysis available for this resident',
    });
  }

  return NextResponse.json({
    scope: 'resident',
    residentId,
    swot: {
      strengths: swot.strengths || [],
      weaknesses: swot.weaknesses || [],
      opportunities: swot.opportunities || [],
      threats: swot.threats || [],
      summary: swot.summary,
      generatedAt: swot.generated_at,
      periodLabel: swot.period_label,
    },
  });
}

/**
 * Get aggregated SWOT for a class year
 */
async function handleClassSWOT(
  ctx: TenantAuthContext,
  classYear: string | null
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

  // Check for class-level SWOT first
  const { data: classSWOT, error: classError } = await ctx.supabase
    .from('swot_summaries')
    .select('*')
    .eq('class_year', year)
    .is('resident_id', null)
    .order('generated_at', { ascending: false })
    .limit(1)
    .single();

  if (classSWOT) {
    return NextResponse.json({
      scope: 'class',
      classYear: year,
      pgyLevel: calculatePGYLevel(year),
      swot: {
        strengths: classSWOT.strengths || [],
        weaknesses: classSWOT.weaknesses || [],
        opportunities: classSWOT.opportunities || [],
        threats: classSWOT.threats || [],
        summary: classSWOT.summary,
        generatedAt: classSWOT.generated_at,
        periodLabel: classSWOT.period_label,
      },
      aggregatedFrom: null,
    });
  }

  // Fall back to aggregating individual SWOTs
  // Get residents in this class
  const { data: residents, error: residentsError } = await ctx.supabase
    .from('residents')
    .select(`
      id,
      classes:class_id (graduation_year)
    `)
    .eq('program_id', ctx.programId);

  if (residentsError) {
    console.error('[V2 Analytics SWOT] Residents error:', residentsError);
    return NextResponse.json(
      { error: 'Failed to fetch class residents' },
      { status: 500 }
    );
  }

  // Filter to matching class
  const classResidents = (residents || []).filter((r: Record<string, unknown>) => {
    const classInfo = r.classes as unknown as { graduation_year: number } | null;
    return classInfo?.graduation_year === year;
  });

  if (classResidents.length === 0) {
    return NextResponse.json({
      scope: 'class',
      classYear: year,
      pgyLevel: calculatePGYLevel(year),
      swot: null,
      message: 'No residents found for this class year',
    });
  }

  // Get SWOTs for all residents in class
  const residentIds = classResidents.map((r: Record<string, unknown>) => r.id as string);
  const { data: swots, error: swotsError } = await ctx.supabase
    .from('swot_summaries')
    .select('*')
    .in('resident_id', residentIds)
    .order('generated_at', { ascending: false });

  if (swotsError) {
    console.error('[V2 Analytics SWOT] SWOTs error:', swotsError);
    return NextResponse.json(
      { error: 'Failed to fetch SWOT data' },
      { status: 500 }
    );
  }

  // Get latest SWOT per resident
  const latestSwots = new Map<string, typeof swots[0]>();
  for (const swot of (swots || [])) {
    if (!latestSwots.has(swot.resident_id)) {
      latestSwots.set(swot.resident_id, swot);
    }
  }

  // Aggregate themes
  const allStrengths: string[] = [];
  const allWeaknesses: string[] = [];
  const allOpportunities: string[] = [];
  const allThreats: string[] = [];

  for (const swot of latestSwots.values()) {
    if (swot.strengths) allStrengths.push(...swot.strengths);
    if (swot.weaknesses) allWeaknesses.push(...swot.weaknesses);
    if (swot.opportunities) allOpportunities.push(...swot.opportunities);
    if (swot.threats) allThreats.push(...swot.threats);
  }

  // Count theme frequencies
  const countThemes = (items: string[]) => {
    const counts = new Map<string, number>();
    for (const item of items) {
      const normalized = item.toLowerCase().trim();
      counts.set(normalized, (counts.get(normalized) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([theme, count]) => ({ theme, count, percentage: Math.round((count / latestSwots.size) * 100) }));
  };

  return NextResponse.json({
    scope: 'class',
    classYear: year,
    pgyLevel: calculatePGYLevel(year),
    swot: {
      strengths: countThemes(allStrengths),
      weaknesses: countThemes(allWeaknesses),
      opportunities: countThemes(allOpportunities),
      threats: countThemes(allThreats),
    },
    aggregatedFrom: {
      totalResidents: classResidents.length,
      withSWOT: latestSwots.size,
    },
  });
}

// Faculty and above can access SWOT analytics
export const GET = withTenantAuth(handler, { minimumRole: 'faculty' });
