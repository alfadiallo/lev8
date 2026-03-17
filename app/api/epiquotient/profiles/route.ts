import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getGraduationYearForPGY } from '@/lib/utils/pgy-calculator';

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
  'MS3': 0, 'MS4': 1, 'PGY 1': 2, 'PGY 2': 3, 'PGY 3': 4, 'Graduate': 5,
};

const PROGRAM_LENGTH = 3;

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

// Deterministic pseudo-random from profile ID for reproducible demo data
function seededRandom(id: string, salt: number): number {
  let hash = salt;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return Math.abs(Math.sin(hash) * 10000) % 1;
}

function seededInt(id: string, salt: number, min: number, max: number): number {
  return Math.floor(seededRandom(id, salt) * (max - min + 1)) + min;
}

function generateDemoRadar(
  id: string,
  eq: Record<string, number>,
  pq: Record<string, number>,
  iq: Record<string, number>,
  history: { period: string; composite: number; eq?: number; pq?: number; iq?: number }[],
) {
  const allScores = { ...eq, ...pq, ...iq };

  // Faculty series: slightly different from raw scores
  const facultyScores: Record<string, number> = {};
  const selfScores: Record<string, number> = {};
  let i = 0;
  for (const key of Object.keys(allScores)) {
    const base = allScores[key];
    const fDelta = seededInt(id, 100 + i, -8, 8);
    const sDelta = seededInt(id, 200 + i, -12, 12);
    facultyScores[key] = Math.max(20, Math.min(100, base + fDelta));
    selfScores[key] = Math.max(20, Math.min(100, base + sDelta));
    i++;
  }

  return {
    series: [
      { label: 'Faculty Avg', scores: facultyScores, color: '#2fe6de' },
      { label: 'Self-Assessment', scores: selfScores, color: '#6366f1' },
    ],
    timeline: generateDemoRadarTimeline(id, eq, pq, iq, history),
  };
}

const ATTR_PILLAR_MAP: Record<string, 'eq' | 'pq' | 'iq'> = {
  empathy: 'eq', adaptability: 'eq', stressMgmt: 'eq', curiosity: 'eq', communication: 'eq',
  workEthic: 'pq', integrity: 'pq', teachability: 'pq', documentation: 'pq', leadership: 'pq',
  knowledgeBase: 'iq', analyticalThinking: 'iq', learningCommit: 'iq', clinicalAdapt: 'iq', clinicalPerf: 'iq',
};

function generateDemoRadarTimeline(
  id: string,
  eq: Record<string, number>,
  pq: Record<string, number>,
  iq: Record<string, number>,
  history: { period: string; composite: number; eq?: number; pq?: number; iq?: number }[],
) {
  if (history.length < 2) return undefined;

  const allScores = { ...eq, ...pq, ...iq };
  const latestH = history[history.length - 1];
  const latestPillar = {
    eq: latestH.eq ?? avg(Object.values(eq)),
    pq: latestH.pq ?? avg(Object.values(pq)),
    iq: latestH.iq ?? avg(Object.values(iq)),
  };

  return history.map((h, hi) => {
    const pillarScores = {
      eq: h.eq ?? latestPillar.eq,
      pq: h.pq ?? latestPillar.pq,
      iq: h.iq ?? latestPillar.iq,
    };

    const facultyScores: Record<string, number> = {};
    const selfScores: Record<string, number> = {};
    let ai = 0;
    for (const key of Object.keys(allScores)) {
      const pillar = ATTR_PILLAR_MAP[key] ?? 'eq';
      const ratio = latestPillar[pillar] > 0 ? pillarScores[pillar] / latestPillar[pillar] : 1;
      const scaled = Math.round(allScores[key] * ratio);
      const fDelta = seededInt(id, 1000 + hi * 50 + ai, -6, 6);
      const sDelta = seededInt(id, 2000 + hi * 50 + ai, -10, 10);
      facultyScores[key] = Math.max(20, Math.min(100, scaled + fDelta));
      selfScores[key] = Math.max(20, Math.min(100, scaled + sDelta));
      ai++;
    }

    return {
      period: h.period,
      series: [
        { label: 'Faculty Avg', scores: facultyScores, color: '#2fe6de' },
        { label: 'Self-Assessment', scores: selfScores, color: '#6366f1' },
      ],
    };
  });
}

function generateDemoComparison(id: string, eqScore: number, pqScore: number, iqScore: number) {
  const fDelta = (s: number, salt: number) => Math.max(20, Math.min(100, s + seededInt(id, salt, -6, 6)));
  const sDelta = (s: number, salt: number) => Math.max(20, Math.min(100, s + seededInt(id, salt, -10, 10)));

  return {
    faculty: { eq: fDelta(eqScore, 300), pq: fDelta(pqScore, 301), iq: fDelta(iqScore, 302) },
    self: { eq: sDelta(eqScore, 310), pq: sDelta(pqScore, 311), iq: sDelta(iqScore, 312) },
    classAverages: {
      eq: seededInt(id, 320, 55, 75),
      pq: seededInt(id, 321, 55, 75),
      iq: seededInt(id, 322, 50, 70),
    },
    classLabel: 'Class Average',
    facultyCount: seededInt(id, 330, 3, 8),
    selfCount: 1,
  };
}

function generateDemoTrends(
  id: string,
  history: { period: string; composite: number; eq?: number; pq?: number; iq?: number }[],
) {
  if (history.length < 2) return undefined;
  return history.map((h, i) => ({
    period: h.period,
    facultyEq: h.eq !== undefined ? Math.max(20, Math.min(100, h.eq + seededInt(id, 400 + i, -5, 5))) : undefined,
    facultyPq: h.pq !== undefined ? Math.max(20, Math.min(100, h.pq + seededInt(id, 410 + i, -5, 5))) : undefined,
    facultyIq: h.iq !== undefined ? Math.max(20, Math.min(100, h.iq + seededInt(id, 420 + i, -5, 5))) : undefined,
    selfEq: h.eq !== undefined ? Math.max(20, Math.min(100, h.eq + seededInt(id, 430 + i, -10, 10))) : undefined,
    selfPq: h.pq !== undefined ? Math.max(20, Math.min(100, h.pq + seededInt(id, 440 + i, -10, 10))) : undefined,
    selfIq: h.iq !== undefined ? Math.max(20, Math.min(100, h.iq + seededInt(id, 450 + i, -10, 10))) : undefined,
  }));
}

const SWOT_STRENGTHS = [
  'Consistently demonstrates strong empathy with patients and families',
  'Excellent clinical reasoning under time pressure',
  'Natural leadership skills in team settings',
  'Adapts communication style to patient needs effectively',
  'Maintains composure during high-acuity resuscitations',
  'Strong documentation habits with thorough clinical notes',
  'Actively seeks feedback and applies it to practice',
  'Demonstrates intellectual curiosity and self-directed learning',
];

const SWOT_WEAKNESSES = [
  'Tendency toward self-doubt in complex clinical scenarios',
  'Documentation timeliness occasionally delayed under high volume',
  'Could improve delegation skills in team leadership situations',
  'Needs to develop more confidence in procedural skills',
  'Sometimes over-relies on senior guidance for disposition decisions',
  'Stress management under sustained high-census conditions',
];

const SWOT_OPPORTUNITIES = [
  'Strong candidate for chief resident track',
  'Would benefit from ultrasound fellowship mentorship',
  'Growing research interest could lead to academic productivity',
  'Cross-departmental collaboration on QI projects',
  'Emerging interest in medical education methodology',
  'Potential for simulation curriculum development',
];

const SWOT_THREATS = [
  'Risk of burnout given current trajectory and workload',
  'Declining ITE percentile trend warrants attention',
  'Inconsistent performance across rotation types',
  'External stressors may be impacting focus',
  'Gap between self-assessment and faculty perception widening',
];

function generateDemoSwot(id: string, composite: number) {
  const pick = (arr: string[], salt: number, count: number) => {
    const result: string[] = [];
    const used = new Set<number>();
    for (let i = 0; i < count; i++) {
      let idx = seededInt(id, salt + i * 7, 0, arr.length - 1);
      while (used.has(idx)) idx = (idx + 1) % arr.length;
      used.add(idx);
      result.push(arr[idx]);
    }
    return result;
  };

  const sCount = composite >= 70 ? 3 : 2;
  const wCount = composite < 50 ? 3 : 2;

  return {
    strengths: pick(SWOT_STRENGTHS, 500, sCount),
    weaknesses: pick(SWOT_WEAKNESSES, 520, wCount),
    opportunities: pick(SWOT_OPPORTUNITIES, 540, 2),
    threats: pick(SWOT_THREATS, 560, composite < 50 ? 2 : 1),
    periodLabel: 'Current Period',
    generatedAt: new Date().toISOString(),
  };
}

function generateDemoIte(id: string, role: string) {
  const isResident = role.startsWith('PGY') || role === 'Graduate';
  if (!isResident) return undefined;

  const pgyNum = role === 'Graduate' ? 3 : parseInt(role.replace('PGY ', '')) || 1;
  const scores: { examYear: number; rawScore: number | null; percentile: number | null; nationalMean: number | null }[] = [];
  for (let y = 0; y < pgyNum; y++) {
    const basePercentile = seededInt(id, 600 + y, 25, 90);
    scores.push({
      examYear: 2024 + y,
      rawScore: seededInt(id, 610 + y, 55, 85),
      percentile: Math.max(5, Math.min(99, basePercentile + seededInt(id, 620 + y, -5, 10))),
      nationalMean: seededInt(id, 630 + y, 60, 72),
    });
  }
  if (scores.length === 0) return undefined;

  const rawScores = scores.map(s => s.rawScore).filter((v): v is number => v !== null);
  const percentiles = scores.map(s => s.percentile).filter((v): v is number => v !== null);
  const individualAvg = {
    rawScore: rawScores.length > 0 ? Math.round(rawScores.reduce((a, b) => a + b, 0) / rawScores.length) : null,
    percentile: percentiles.length > 0 ? Math.round(percentiles.reduce((a, b) => a + b, 0) / percentiles.length) : null,
  };

  const classAvg = {
    rawScore: seededInt(id, 700, 62, 78),
    percentile: seededInt(id, 710, 40, 70),
  };

  const programAvg = {
    rawScore: seededInt(id, 720, 65, 75),
    percentile: seededInt(id, 730, 45, 65),
  };

  return { scores, individualAvg, classAvg, programAvg };
}

const DEMO_COMMENTS = [
  'Strong clinical skills and excellent bedside manner. A pleasure to work with on shift.',
  'Demonstrates consistent growth in procedural competence. Ready for more independent cases.',
  'Good situational awareness but could improve handoff communication during transitions.',
  'Exceptional empathy with patients. Families consistently praise interactions.',
  'Reliable team member who takes initiative without being asked.',
  'Needs to work on time management during high-volume shifts.',
  'Shows outstanding analytical thinking when working through complex differentials.',
  'Communication with nursing staff has improved significantly this rotation.',
  'Would benefit from more structured approach to documentation.',
  'Natural teacher to medical students. Consider for education track.',
];

const FACULTY_NAMES = [
  'Dr. Sarah Mitchell', 'Dr. James Park', 'Dr. Elena Vasquez',
  'Dr. Michael Thompson', 'Dr. Aisha Patel', 'Dr. Robert Kim',
  'Dr. Linda Okafor', 'Dr. David Chen',
];

function generateDemoRatings(id: string, composite: number) {
  const coreCount = seededInt(id, 700, 2, 6);
  const teachingCount = seededInt(id, 710, 1, 4);
  const selfCount = seededInt(id, 720, 1, 2);
  const total = coreCount + teachingCount + selfCount;

  const recent: {
    id: string;
    evaluatorType: 'core_faculty' | 'teaching_faculty' | 'self';
    evaluatorName?: string;
    date: string;
    eqAvg: number;
    pqAvg: number;
    iqAvg: number;
    comment?: string;
  }[] = [];

  for (let i = 0; i < Math.min(total, 6); i++) {
    const type: 'core_faculty' | 'teaching_faculty' | 'self' =
      i < coreCount ? 'core_faculty' :
      i < coreCount + teachingCount ? 'teaching_faculty' : 'self';

    const hasComment = seededRandom(id, 750 + i) > 0.4;
    const commentIdx = seededInt(id, 760 + i, 0, DEMO_COMMENTS.length - 1);
    const nameIdx = seededInt(id, 770 + i, 0, FACULTY_NAMES.length - 1);

    recent.push({
      id: `${id}-rating-${i}`,
      evaluatorType: type,
      evaluatorName: type !== 'self' ? FACULTY_NAMES[nameIdx] : undefined,
      date: new Date(2026, seededInt(id, 780 + i, 0, 2), seededInt(id, 790 + i, 1, 28)).toISOString(),
      eqAvg: Math.max(20, Math.min(100, composite + seededInt(id, 800 + i, -15, 15))),
      pqAvg: Math.max(20, Math.min(100, composite + seededInt(id, 810 + i, -15, 15))),
      iqAvg: Math.max(20, Math.min(100, composite + seededInt(id, 820 + i, -15, 15))),
      comment: hasComment ? DEMO_COMMENTS[commentIdx] : undefined,
    });
  }

  return {
    coreFaculty: coreCount,
    teachingFaculty: teachingCount,
    self: selfCount,
    total,
    recent,
  };
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

    let query = supabase.from('epiq_profiles').select(extendedFields).or('narrative.is.null,narrative.neq.ARCHIVED').order('created_at', { ascending: true });
    if (cohort) query = query.eq('cohort_label', cohort);

    let result = await query;

    if (result.error?.message?.includes('institution_name') || result.error?.message?.includes('program_name')) {
      console.log('[epiquotient/profiles] New columns not yet available, falling back');
      let fallbackQuery = supabase.from('epiq_profiles').select(baseFields).or('narrative.is.null,narrative.neq.ARCHIVED').order('created_at', { ascending: true });
      if (cohort) fallbackQuery = fallbackQuery.eq('cohort_label', cohort);
      result = await fallbackQuery as typeof result;
    }

    const { data, error } = result;

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

      const isResident = row.role.startsWith('PGY') || row.role === 'Graduate';
      let name: string;
      if (isResident) {
        const hashVal = parseInt(row.id.replace(/-/g, '').slice(0, 8), 16) / 0xFFFFFFFF;
        const suffix = hashVal < 0.30 ? 'DO' : 'MD';
        name = `Dr. ${row.first_name} ${row.last_name}, ${suffix}`;
      } else {
        name = `${row.first_name} ${row.last_name}`;
      }

      // Derive graduation year from cohort_label or PGY level
      let graduationYear: number | undefined;
      const classMatch = row.cohort_label?.match(/^Class of (\d{4})$/);
      if (classMatch) {
        graduationYear = parseInt(classMatch[1], 10);
      } else {
        const pgyMatch = row.role.match(/^PGY (\d+)$/);
        if (pgyMatch) {
          const pgyLevel = parseInt(pgyMatch[1], 10);
          graduationYear = getGraduationYearForPGY(pgyLevel, new Date(), PROGRAM_LENGTH);
        }
      }

      const history = (row.epiq_profile_history || [])
        .sort((a, b) => (PERIOD_ORDER[a.period] ?? 99) - (PERIOD_ORDER[b.period] ?? 99))
        .map((h) => ({
          period: h.period,
          composite: h.composite_score,
          eq: h.eq_score ?? undefined,
          pq: h.pq_score ?? undefined,
          iq: h.iq_score ?? undefined,
        }));

      const archetypeMeta = row.archetype_id ? ARCHETYPE_META[row.archetype_id] : null;

      return {
        id: row.id,
        name,
        role: row.role,
        graduationYear,
        graduationClass: row.role === 'Graduate' && row.cohort_label?.startsWith('Class of')
          ? row.cohort_label
          : undefined,
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
        radar: generateDemoRadar(row.id, eq, pq, iq, history),
        comparison: generateDemoComparison(row.id, eqScore, pqScore, iqScore),
        trends: generateDemoTrends(row.id, history),
        swot: generateDemoSwot(row.id, composite),
        ite: generateDemoIte(row.id, row.role),
        ratings: generateDemoRatings(row.id, composite),
      };
    });

    const firstRow = (data as unknown as ProfileRow[])[0];
    const meta = {
      institution: firstRow?.institution_name || 'Grey Sloan Memorial Hospital',
      program: firstRow?.program_name || 'Emergency Medicine Residency',
      programLength: PROGRAM_LENGTH,
    };

    return NextResponse.json({ meta, profiles });
  } catch (error) {
    console.error('[epiquotient/profiles] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
