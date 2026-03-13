import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

interface ScoreRow {
  pillar: string;
  attribute_slug: string;
  attribute_label: string;
  score: number;
  display_order: number;
}

interface ProfileRow {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  cohort_label: string;
  epiq_profile_scores: ScoreRow[];
}

const SLUG_TO_CAMEL: Record<string, string> = {
  empathy: 'empathy',
  adaptability: 'adaptability',
  stress_mgmt: 'stressMgmt',
  curiosity: 'curiosity',
  communication: 'communication',
  work_ethic: 'workEthic',
  teachability: 'teachability',
  integrity: 'integrity',
  documentation: 'documentation',
  leadership: 'leadership',
  knowledge_base: 'knowledgeBase',
  learning_commit: 'learningCommit',
  analytical_thinking: 'analyticalThinking',
  clinical_adapt: 'clinicalAdapt',
  clinical_perf: 'clinicalPerf',
};

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export async function GET(request: NextRequest) {
  try {
    const cohort = request.nextUrl.searchParams.get('cohort') || undefined;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from('epiq_profiles')
      .select(`
        id, first_name, last_name, role, cohort_label,
        epiq_profile_scores (pillar, attribute_slug, attribute_label, score, display_order)
      `)
      .order('created_at', { ascending: true });

    if (cohort) {
      query = query.eq('cohort_label', cohort);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[epiquotient/profiles] Query error:', error);
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }

    const profiles = (data as unknown as ProfileRow[]).map((row) => {
      const eq: Record<string, number> = {};
      const pq: Record<string, number> = {};
      const iq: Record<string, number> = {};

      for (const score of row.epiq_profile_scores) {
        const camelKey = SLUG_TO_CAMEL[score.attribute_slug] || score.attribute_slug;
        if (score.pillar === 'eq') eq[camelKey] = score.score;
        else if (score.pillar === 'pq') pq[camelKey] = score.score;
        else if (score.pillar === 'iq') iq[camelKey] = score.score;
      }

      const eqScore = avg(Object.values(eq));
      const pqScore = avg(Object.values(pq));
      const iqScore = avg(Object.values(iq));
      const composite = Math.round((eqScore + pqScore + iqScore) / 3);

      const isResident = row.role.startsWith('PGY');
      let name: string;
      if (isResident) {
        // Deterministic DO/MD split: hash the UUID to get a stable 0-1 value
        const hashVal = parseInt(row.id.replace(/-/g, '').slice(0, 8), 16) / 0xFFFFFFFF;
        const suffix = hashVal < 0.30 ? 'DO' : 'MD';
        name = `Dr. ${row.first_name} ${row.last_name}, ${suffix}`;
      } else {
        name = `${row.first_name} ${row.last_name}`;
      }

      return {
        id: row.id,
        name,
        role: row.role,
        eq,
        pq,
        iq,
        eqScore,
        pqScore,
        iqScore,
        composite,
      };
    });

    return NextResponse.json(profiles);
  } catch (error) {
    console.error('[epiquotient/profiles] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
