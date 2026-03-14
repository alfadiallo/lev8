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

interface HistoryRow {
  period: string;
  composite_score: number;
  eq_score: number | null;
  pq_score: number | null;
  iq_score: number | null;
}

interface ProfileRow {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  cohort_label: string;
  institution_name: string | null;
  program_name: string | null;
  archetype_id: string | null;
  archetype_confidence: number | null;
  narrative: string | null;
  epiq_profile_scores: ScoreRow[];
  epiq_profile_history: HistoryRow[];
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

const PERIOD_ORDER: Record<string, number> = {
  'MS3': 0, 'MS4': 1, 'PGY 1': 2, 'PGY 2': 3, 'PGY 3': 4, 'PGY 4': 5,
};

const ARCHETYPE_META: Record<string, { name: string; risk: string; action: string; description: string }> = {
  elite_performer: {
    name: 'Elite Performer',
    risk: 'Low',
    action: 'Invest',
    description: 'Consistently high scores. Leadership track.',
  },
  elite_late_struggle: {
    name: 'Elite → Late Struggle',
    risk: 'Moderate',
    action: 'Invest',
    description: 'Strong start with late decline.',
  },
  breakthrough_performer: {
    name: 'Breakthrough',
    risk: 'Low',
    action: 'Reinforce',
    description: 'Major improvement year-over-year.',
  },
  peak_decline: {
    name: 'Peak & Decline',
    risk: 'High',
    action: 'Investigate',
    description: 'Improved then dropped. Investigate.',
  },
  sophomore_slump_recovery: {
    name: 'Slump → Recovery',
    risk: 'Low',
    action: 'Reinforce',
    description: 'Dipped then bounced back strongly.',
  },
  late_bloomer: {
    name: 'Late Bloomer',
    risk: 'Low',
    action: 'Encourage',
    description: 'Low initial scores, positive trajectory.',
  },
  steady_climber: {
    name: 'Steady Climber',
    risk: 'Low',
    action: 'Maintain',
    description: 'Consistent, incremental gains.',
  },
  continuous_decline: {
    name: 'Continuous Decline',
    risk: 'High',
    action: 'Intervene',
    description: 'Declining trajectory across periods.',
  },
  variable: {
    name: 'Variable',
    risk: 'Moderate',
    action: 'Reinforce',
    description: 'Inconsistent pattern. Individualized approach.',
  },
};

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export async function GET(request: NextRequest) {
  try {
    const cohort = request.nextUrl.searchParams.get('cohort') || undefined;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const baseFields = `
      id, first_name, last_name, role, cohort_label,
      archetype_id, archetype_confidence, narrative,
      epiq_profile_scores (pillar, attribute_slug, attribute_label, score, display_order),
      epiq_profile_history (period, composite_score, eq_score, pq_score, iq_score)
    `;
    const extendedFields = `
      id, first_name, last_name, role, cohort_label,
      institution_name, program_name,
      archetype_id, archetype_confidence, narrative,
      epiq_profile_scores (pillar, attribute_slug, attribute_label, score, display_order),
      epiq_profile_history (period, composite_score, eq_score, pq_score, iq_score)
    `;

    let query = supabase.from('epiq_profiles').select(extendedFields).order('created_at', { ascending: true });
    if (cohort) query = query.eq('cohort_label', cohort);

    let { data, error } = await query;

    if (error?.message?.includes('institution_name') || error?.message?.includes('program_name')) {
      console.log('[epiquotient/profiles] New columns not yet available, falling back');
      let fallbackQuery = supabase.from('epiq_profiles').select(baseFields).order('created_at', { ascending: true });
      if (cohort) fallbackQuery = fallbackQuery.eq('cohort_label', cohort);
      const fallback = await fallbackQuery;
      data = fallback.data;
      error = fallback.error;
    }

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
        const hashVal = parseInt(row.id.replace(/-/g, '').slice(0, 8), 16) / 0xFFFFFFFF;
        const suffix = hashVal < 0.30 ? 'DO' : 'MD';
        name = `Dr. ${row.first_name} ${row.last_name}, ${suffix}`;
      } else {
        name = `${row.first_name} ${row.last_name}`;
      }

      const history = (row.epiq_profile_history || [])
        .sort((a, b) => (PERIOD_ORDER[a.period] ?? 99) - (PERIOD_ORDER[b.period] ?? 99))
        .map((h) => ({
          period: h.period,
          composite: h.composite_score,
        }));

      const archetypeMeta = row.archetype_id ? ARCHETYPE_META[row.archetype_id] : null;

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
        history,
        archetype: archetypeMeta
          ? {
              id: row.archetype_id!,
              ...archetypeMeta,
              confidence: row.archetype_confidence ?? 0,
            }
          : null,
        narrative: row.narrative,
      };
    });

    const firstRow = (data as unknown as ProfileRow[])[0];
    const meta = {
      institution: firstRow?.institution_name || 'Grey Sloan Memorial Hospital',
      program: firstRow?.program_name || 'Emergency Medicine Residency',
    };

    return NextResponse.json({ meta, profiles });
  } catch (error) {
    console.error('[epiquotient/profiles] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
