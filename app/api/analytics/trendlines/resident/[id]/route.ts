/**
 * API Route: /api/analytics/trendlines/resident/[id]
 * 
 * Fetches trendline data for a specific resident, including:
 * - Resident's individual scores by period
 * - Class average scores by period
 * - Program average scores by period
 * 
 * This data is used to render linear regression trendlines on the
 * AttributeTimelineChart component.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireFacultyOrAbove } from '@/lib/auth/checkApiPermission';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// Map from ai_scores_detail keys to our attribute keys
const SCORE_KEY_MAP: Record<string, Record<string, string>> = {
  eq: {
    empathy: 'eq_empathy',
    adaptability: 'eq_adaptability',
    stress_mgmt: 'eq_stress_mgmt',
    curiosity: 'eq_curiosity',
    communication: 'eq_communication'
  },
  pq: {
    work_ethic: 'pq_work_ethic',
    integrity: 'pq_integrity',
    teachability: 'pq_teachability',
    documentation: 'pq_documentation',
    leadership: 'pq_leadership'
  },
  iq: {
    knowledge: 'iq_knowledge',
    analytical: 'iq_analytical',
    learning: 'iq_learning',
    flexibility: 'iq_flexibility',
    performance: 'iq_performance'
  }
};

interface TrendlineDataPoint {
  period: string;
  score: number;
}

interface TrendlineResponse {
  resident: Record<string, TrendlineDataPoint[]>;
  class: {
    class_year: number;
    data: Record<string, TrendlineDataPoint[]>;
  };
  program: Record<string, TrendlineDataPoint[]>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Require faculty or above to view resident trendlines
  const authResult = await requireFacultyOrAbove(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const { id: residentId } = await params;

    if (!residentId) {
      return NextResponse.json(
        { error: 'Resident ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Get resident's class year (via classes join)
    const { data: resident, error: residentError } = await supabase
      .from('residents')
      .select('id, classes(graduation_year)')
      .eq('id', residentId)
      .single();

    if (residentError || !resident) {
      console.error('[Trendlines API] Resident lookup error:', residentError?.message);
      return NextResponse.json(
        { error: 'Resident not found' },
        { status: 404 }
      );
    }

    const classYear = (resident as any).classes?.graduation_year || null;

    // Step 2: Get resident's individual scores
    const { data: periodScores, error: scoresError } = await supabase
      .from('period_scores')
      .select('period_label, ai_scores_detail')
      .eq('resident_id', residentId)
      .eq('is_current', true)
      .not('ai_scores_detail', 'is', null)
      .order('period_label', { ascending: true });

    if (scoresError) {
      console.error('[Trendlines API] Error fetching period scores:', scoresError);
      return NextResponse.json(
        { error: 'Failed to fetch resident scores' },
        { status: 500 }
      );
    }

    // Step 3: Get class averages
    const { data: classAverages, error: classError } = await supabase
      .from('attribute_period_averages')
      .select('period_label, attribute_key, avg_score')
      .eq('scope_type', 'class')
      .eq('scope_id', classYear?.toString() || '')
      .order('period_label', { ascending: true });

    if (classError) {
      console.error('[Trendlines API] Error fetching class averages:', classError);
      // Continue without class data rather than failing
    }

    // Step 4: Get program averages
    const { data: programAverages, error: programError } = await supabase
      .from('attribute_period_averages')
      .select('period_label, attribute_key, avg_score')
      .eq('scope_type', 'program')
      .order('period_label', { ascending: true });

    if (programError) {
      console.error('[Trendlines API] Error fetching program averages:', programError);
      // Continue without program data rather than failing
    }

    // Step 5: Transform data into response format
    const residentData: Record<string, TrendlineDataPoint[]> = {};
    const classData: Record<string, TrendlineDataPoint[]> = {};
    const programData: Record<string, TrendlineDataPoint[]> = {};

    // Process resident scores
    for (const ps of periodScores || []) {
      const scores = ps.ai_scores_detail;
      if (!scores) continue;

      for (const [category, attrMap] of Object.entries(SCORE_KEY_MAP)) {
        const categoryScores = scores[category as keyof typeof scores];
        if (!categoryScores) continue;

        for (const [scoreKey, attrKey] of Object.entries(attrMap)) {
          const score = categoryScores[scoreKey];
          if (typeof score !== 'number' || isNaN(score)) continue;

          if (!residentData[attrKey]) {
            residentData[attrKey] = [];
          }
          residentData[attrKey].push({
            period: ps.period_label,
            score: score
          });
        }
      }
    }

    // Process class averages
    for (const avg of classAverages || []) {
      if (!classData[avg.attribute_key]) {
        classData[avg.attribute_key] = [];
      }
      classData[avg.attribute_key].push({
        period: avg.period_label,
        score: avg.avg_score
      });
    }

    // Process program averages
    for (const avg of programAverages || []) {
      if (!programData[avg.attribute_key]) {
        programData[avg.attribute_key] = [];
      }
      programData[avg.attribute_key].push({
        period: avg.period_label,
        score: avg.avg_score
      });
    }

    const response: TrendlineResponse = {
      resident: residentData,
      class: {
        class_year: classYear || 0,
        data: classData
      },
      program: programData
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[Trendlines API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

