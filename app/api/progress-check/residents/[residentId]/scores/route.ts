import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

/**
 * Resolve a user's program_id from their email.
 * Checks: super_admin → faculty → resident → eqpqiq_user_roles → PD → institution fallback
 * Returns null if no program can be determined.
 */
interface ProgramScope {
  programId: string | null;
  isSuperAdmin: boolean;
}

/**
 * Resolve a user's program_id from their email.
 * Checks: super_admin → faculty → resident → PD → institution → eqpqiq_user_roles
 * Returns { programId, isSuperAdmin } to allow callers to skip scope checks for super admins.
 */
async function resolveUserProgram(supabase: SupabaseClient, email: string): Promise<ProgramScope> {
  // Check user_profiles
  const { data: user } = await supabase
    .from('user_profiles')
    .select('id, role, institution_id')
    .or(`email.eq.${email},personal_email.eq.${email}`)
    .limit(1)
    .single();

  // Super admin: unrestricted access
  if (user?.role === 'super_admin') {
    return { programId: null, isSuperAdmin: true };
  }

  if (user) {
    // Check faculty
    const { data: faculty } = await supabase
      .from('faculty')
      .select('program_id')
      .or(`user_id.eq.${user.id},email.eq.${email}`)
      .limit(1)
      .single();
    if (faculty) return { programId: faculty.program_id, isSuperAdmin: false };

    // Check resident
    const { data: resident } = await supabase
      .from('residents')
      .select('program_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();
    if (resident) return { programId: resident.program_id, isSuperAdmin: false };

    // Check PD
    const { data: pgmDir } = await supabase
      .from('programs')
      .select('id')
      .eq('pgm_director_id', user.id)
      .limit(1)
      .single();
    if (pgmDir) return { programId: pgmDir.id, isSuperAdmin: false };

    // Institution fallback
    if (user.institution_id) {
      const { data: instPgm } = await supabase
        .from('programs')
        .select('id')
        .eq('health_system_id', user.institution_id)
        .limit(1)
        .single();
      if (instPgm) return { programId: instPgm.id, isSuperAdmin: false };
    }
  }

  // Check eqpqiq_user_roles (email-only users without user_profiles)
  const { data: eqpqiqRole } = await supabase
    .from('eqpqiq_user_roles')
    .select('program_id')
    .eq('user_email', email)
    .eq('tool', 'progress_check')
    .eq('is_active', true)
    .limit(1)
    .single();
  if (eqpqiqRole) return { programId: eqpqiqRole.program_id, isSuperAdmin: false };

  return { programId: null, isSuperAdmin: false };
}

/**
 * GET /api/progress-check/residents/[residentId]/scores
 * Get comprehensive EQ/PQ/IQ data for a resident:
 *  - Current period scores
 *  - Historical period scores (all periods)
 *  - Structured ratings (faculty + self)
 *  - SWOT summary (current)
 *  - ITE scores
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ residentId: string }> }
) {
  try {
    const { residentId } = await params;
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const normalizedEmail = email.toLowerCase();

    // Resolve the requesting user's program for scope verification
    const { programId: userProgramId, isSuperAdmin } = await resolveUserProgram(supabase, normalizedEmail);
    if (!userProgramId && !isSuperAdmin) {
      return NextResponse.json({ error: 'No program access' }, { status: 403 });
    }

    // Fetch resident profile (separate user_profiles query — FK is to auth.users, not user_profiles)
    const { data: resident, error: resError } = await supabase
      .from('residents')
      .select(`
        id, user_id, anon_code, program_id, class_id, medical_school,
        classes:class_id (graduation_year, name)
      `)
      .eq('id', residentId)
      .single();

    if (resError || !resident) {
      return NextResponse.json({ error: 'Resident not found' }, { status: 404 });
    }

    // Fetch user_profiles separately
    let residentProfile: { full_name?: string; email?: string } | null = null;
    if (resident.user_id) {
      const { data: prof } = await supabase
        .from('user_profiles')
        .select('full_name, email')
        .eq('id', resident.user_id)
        .single();
      residentProfile = prof;
    }

    // Program scope check: verify the resident belongs to the user's program
    // Super admins bypass this check
    if (!isSuperAdmin && resident.program_id !== userProgramId) {
      return NextResponse.json({ error: 'Access denied — resident is not in your program' }, { status: 403 });
    }

    // Fetch all data in parallel
    const [
      periodScoresRes,
      ratingsRes,
      swotRes,
      iteRes,
    ] = await Promise.all([
      // All period scores (historical)
      supabase
        .from('period_scores')
        .select('*')
        .eq('resident_id', residentId)
        .order('period_label', { ascending: true }),

      // Structured ratings (avoid FK joins due to schema cache issues)
      supabase
        .from('structured_ratings')
        .select(`
          id, resident_id, rater_type, evaluation_date, faculty_id, period_label,
          eq_empathy_positive_interactions, eq_adaptability_self_awareness,
          eq_stress_management_resilience, eq_curiosity_growth_mindset,
          eq_effectiveness_communication,
          pq_work_ethic_reliability, pq_integrity_accountability,
          pq_teachability_receptiveness, pq_documentation,
          pq_leadership_relationships,
          iq_knowledge_base, iq_analytical_thinking,
          iq_commitment_learning, iq_clinical_flexibility,
          iq_performance_for_level,
          eq_avg, pq_avg, iq_avg,
          concerns_goals
        `)
        .eq('resident_id', residentId)
        .order('evaluation_date', { ascending: false }),

      // Current SWOT summary
      supabase
        .from('swot_summaries')
        .select('*')
        .eq('resident_id', residentId)
        .eq('is_current', true)
        .order('period_label', { ascending: false })
        .limit(1),

      // ITE scores
      supabase
        .from('ite_scores')
        .select('*')
        .eq('resident_id', residentId)
        .order('exam_year', { ascending: true }),
    ]);

    // Compute faculty vs self averages
    // 'core_faculty' and 'teaching_faculty' are combined as "faculty" by default
    const ratings = ratingsRes.data || [];
    const coreFacultyRatings = ratings.filter((r) => r.rater_type === 'core_faculty');
    const teachingFacultyRatings = ratings.filter((r) => r.rater_type === 'teaching_faculty');
    const facultyRatings = ratings.filter((r) => r.rater_type === 'core_faculty' || r.rater_type === 'teaching_faculty');
    const selfRatings = ratings.filter((r) => r.rater_type === 'self');

    const computeAverages = (ratingsList: typeof ratings) => {
      if (ratingsList.length === 0) return null;
      const avg = (field: string) => {
        const vals = ratingsList
          .map((r) => (r as Record<string, unknown>)[field])
          .filter((v): v is number => typeof v === 'number');
        return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
      };
      const overallAvg = () => {
        const eq = avg('eq_avg');
        const pq = avg('pq_avg');
        const iq = avg('iq_avg');
        const vals = [eq, pq, iq].filter((v): v is number => v !== null);
        return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
      };
      return {
        eq: {
          eq_empathy_positive_interactions: avg('eq_empathy_positive_interactions'),
          eq_adaptability_self_awareness: avg('eq_adaptability_self_awareness'),
          eq_stress_management_resilience: avg('eq_stress_management_resilience'),
          eq_curiosity_growth_mindset: avg('eq_curiosity_growth_mindset'),
          eq_effectiveness_communication: avg('eq_effectiveness_communication'),
          average: avg('eq_avg'),
        },
        pq: {
          pq_work_ethic_reliability: avg('pq_work_ethic_reliability'),
          pq_integrity_accountability: avg('pq_integrity_accountability'),
          pq_teachability_receptiveness: avg('pq_teachability_receptiveness'),
          pq_documentation: avg('pq_documentation'),
          pq_leadership_relationships: avg('pq_leadership_relationships'),
          average: avg('pq_avg'),
        },
        iq: {
          iq_knowledge_base: avg('iq_knowledge_base'),
          iq_analytical_thinking: avg('iq_analytical_thinking'),
          iq_commitment_learning: avg('iq_commitment_learning'),
          iq_clinical_flexibility: avg('iq_clinical_flexibility'),
          iq_performance_for_level: avg('iq_performance_for_level'),
          average: avg('iq_avg'),
        },
        overall: overallAvg(),
        count: ratingsList.length,
      };
    };

    let facultyAverages = computeAverages(facultyRatings);
    const coreFacultyAverages = computeAverages(coreFacultyRatings);
    const teachingFacultyAverages = computeAverages(teachingFacultyRatings);
    let selfAverages = computeAverages(selfRatings);

    // Trend data: aggregate structured_ratings by (period_label, rater_type)
    const periodScores = periodScoresRes.data || [];

    const periodSortKey = (label: string): number => {
      const match = label.match(/PGY\s*(\d+)\s*(Start|Fall|Spring)/i);
      if (!match) return 999;
      const pgy = parseInt(match[1]);
      const seasonMap: Record<string, number> = { start: 0, fall: 1, spring: 2 };
      const season = seasonMap[match[2].toLowerCase()] ?? 3;
      return pgy * 10 + season;
    };

    // Group ratings by period_label and rater_type, compute averages
    // Faculty = combined core_faculty + teaching_faculty
    const trendMap = new Map<string, { facultyEq: number[]; facultyPq: number[]; facultyIq: number[]; selfEq: number[]; selfPq: number[]; selfIq: number[] }>();
    for (const r of ratings) {
      const period = r.period_label as string | null;
      if (!period) continue;
      if (!trendMap.has(period)) {
        trendMap.set(period, { facultyEq: [], facultyPq: [], facultyIq: [], selfEq: [], selfPq: [], selfIq: [] });
      }
      const bucket = trendMap.get(period)!;
      const isFaculty = r.rater_type === 'core_faculty' || r.rater_type === 'teaching_faculty';
      if (r.eq_avg != null) (isFaculty ? bucket.facultyEq : bucket.selfEq).push(r.eq_avg as number);
      if (r.pq_avg != null) (isFaculty ? bucket.facultyPq : bucket.selfPq).push(r.pq_avg as number);
      if (r.iq_avg != null) (isFaculty ? bucket.facultyIq : bucket.selfIq).push(r.iq_avg as number);
    }

    const avgArr = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

    const trendData = Array.from(trendMap.entries())
      .sort((a, b) => periodSortKey(a[0]) - periodSortKey(b[0]))
      .map(([period, vals]) => ({
        period,
        facultyEq: avgArr(vals.facultyEq),
        facultyPq: avgArr(vals.facultyPq),
        facultyIq: avgArr(vals.facultyIq),
        selfEq: avgArr(vals.selfEq),
        selfPq: avgArr(vals.selfPq),
        selfIq: avgArr(vals.selfIq),
      }));

    // Fallback: if structured_ratings is empty but period_scores has data,
    // build averages from period_scores so the UI still shows scores
    const currentPeriod = periodScores.find((ps) => ps.is_current);
    if (!facultyAverages && currentPeriod?.faculty_eq_avg != null) {
      const detail = currentPeriod.faculty_ratings_detail as Record<string, number | null> | null;
      facultyAverages = {
        eq: {
          eq_empathy_positive_interactions: detail?.eq_empathy ?? null,
          eq_adaptability_self_awareness: detail?.eq_adaptability ?? null,
          eq_stress_management_resilience: detail?.eq_stress ?? null,
          eq_curiosity_growth_mindset: detail?.eq_curiosity ?? null,
          eq_effectiveness_communication: detail?.eq_communication ?? null,
          average: currentPeriod.faculty_eq_avg,
        },
        pq: {
          pq_work_ethic_reliability: detail?.pq_work_ethic ?? null,
          pq_integrity_accountability: detail?.pq_integrity ?? null,
          pq_teachability_receptiveness: detail?.pq_teachability ?? null,
          pq_documentation: detail?.pq_documentation ?? null,
          pq_leadership_relationships: detail?.pq_leadership ?? null,
          average: currentPeriod.faculty_pq_avg,
        },
        iq: {
          iq_knowledge_base: detail?.iq_knowledge ?? null,
          iq_analytical_thinking: detail?.iq_analytical ?? null,
          iq_commitment_learning: detail?.iq_learning ?? null,
          iq_clinical_flexibility: detail?.iq_flexibility ?? null,
          iq_performance_for_level: detail?.iq_performance ?? null,
          average: currentPeriod.faculty_iq_avg,
        },
        overall: currentPeriod.faculty_eq_avg && currentPeriod.faculty_pq_avg && currentPeriod.faculty_iq_avg
          ? Number(((currentPeriod.faculty_eq_avg + currentPeriod.faculty_pq_avg + currentPeriod.faculty_iq_avg) / 3).toFixed(2))
          : null,
        count: currentPeriod.faculty_n_raters || 0,
      };
    }

    if (!selfAverages && currentPeriod?.self_eq_avg != null) {
      const detail = currentPeriod.self_ratings_detail as Record<string, number | null> | null;
      selfAverages = {
        eq: {
          eq_empathy_positive_interactions: detail?.eq_empathy ?? null,
          eq_adaptability_self_awareness: detail?.eq_adaptability ?? null,
          eq_stress_management_resilience: detail?.eq_stress ?? null,
          eq_curiosity_growth_mindset: detail?.eq_curiosity ?? null,
          eq_effectiveness_communication: detail?.eq_communication ?? null,
          average: currentPeriod.self_eq_avg,
        },
        pq: {
          pq_work_ethic_reliability: detail?.pq_work_ethic ?? null,
          pq_integrity_accountability: detail?.pq_integrity ?? null,
          pq_teachability_receptiveness: detail?.pq_teachability ?? null,
          pq_documentation: detail?.pq_documentation ?? null,
          pq_leadership_relationships: detail?.pq_leadership ?? null,
          average: currentPeriod.self_pq_avg,
        },
        iq: {
          iq_knowledge_base: detail?.iq_knowledge ?? null,
          iq_analytical_thinking: detail?.iq_analytical ?? null,
          iq_commitment_learning: detail?.iq_learning ?? null,
          iq_clinical_flexibility: detail?.iq_flexibility ?? null,
          iq_performance_for_level: detail?.iq_performance ?? null,
          average: currentPeriod.self_iq_avg,
        },
        overall: currentPeriod.self_eq_avg && currentPeriod.self_pq_avg && currentPeriod.self_iq_avg
          ? Number(((currentPeriod.self_eq_avg + currentPeriod.self_pq_avg + currentPeriod.self_iq_avg) / 3).toFixed(2))
          : null,
        count: 1,
      };
    }

    // Gap analysis
    let gapAnalysis = null;
    if (facultyAverages && selfAverages) {
      const gap = (f: number | null, s: number | null) =>
        f !== null && s !== null ? Number((f - s).toFixed(2)) : null;
      gapAnalysis = {
        eq: gap(facultyAverages.eq.average, selfAverages.eq.average),
        pq: gap(facultyAverages.pq.average, selfAverages.pq.average),
        iq: gap(facultyAverages.iq.average, selfAverages.iq.average),
        overall: gap(facultyAverages.overall, selfAverages.overall),
      };
    }

    // Shape resident info
    interface ClassInfo { graduation_year?: number; name?: string; }
    const cls = Array.isArray(resident.classes)
      ? (resident.classes as ClassInfo[])[0]
      : (resident.classes as ClassInfo | null);

    // Resolve faculty names for recent ratings (separate query to avoid FK cache issues)
    const facultyIds = [...new Set(ratings.filter(r => r.faculty_id).map(r => r.faculty_id as string))];
    const facultyNameMap = new Map<string, string>();
    if (facultyIds.length > 0) {
      const { data: facRows } = await supabase
        .from('faculty')
        .select('id, user_id')
        .in('id', facultyIds);
      if (facRows && facRows.length > 0) {
        const userIds = facRows.map(f => f.user_id).filter(Boolean);
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, full_name')
          .in('id', userIds);
        const profileMap = new Map<string, string>();
        for (const p of profiles || []) {
          profileMap.set(p.id, p.full_name);
        }
        for (const f of facRows) {
          const name = profileMap.get(f.user_id);
          if (name) facultyNameMap.set(f.id, name);
        }
      }
    }

    // ── Class averages (mean of per-resident faculty averages — equal weight per resident) ──
    let classAverages: { eq: number | null; pq: number | null; iq: number | null } | null = null;
    if (resident.class_id) {
      const { data: classmates } = await supabase
        .from('residents')
        .select('id')
        .eq('class_id', resident.class_id);

      if (classmates && classmates.length > 0) {
        const classmateIds = classmates.map((c) => c.id);
        const { data: classRatings } = await supabase
          .from('structured_ratings')
          .select('resident_id, eq_avg, pq_avg, iq_avg, rater_type')
          .in('resident_id', classmateIds)
          .in('rater_type', ['core_faculty', 'teaching_faculty']);

        if (classRatings && classRatings.length > 0) {
          const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

          // First compute per-resident averages, then average across residents
          const byResident = new Map<string, { eqs: number[]; pqs: number[]; iqs: number[] }>();
          for (const r of classRatings) {
            if (!byResident.has(r.resident_id)) {
              byResident.set(r.resident_id, { eqs: [], pqs: [], iqs: [] });
            }
            const bucket = byResident.get(r.resident_id)!;
            if (r.eq_avg != null) bucket.eqs.push(r.eq_avg as number);
            if (r.pq_avg != null) bucket.pqs.push(r.pq_avg as number);
            if (r.iq_avg != null) bucket.iqs.push(r.iq_avg as number);
          }

          const residentEqs: number[] = [];
          const residentPqs: number[] = [];
          const residentIqs: number[] = [];
          for (const bucket of byResident.values()) {
            const eqAvg = avg(bucket.eqs);
            const pqAvg = avg(bucket.pqs);
            const iqAvg = avg(bucket.iqs);
            if (eqAvg != null) residentEqs.push(eqAvg);
            if (pqAvg != null) residentPqs.push(pqAvg);
            if (iqAvg != null) residentIqs.push(iqAvg);
          }

          classAverages = {
            eq: avg(residentEqs),
            pq: avg(residentPqs),
            iq: avg(residentIqs),
          };
        }
      }
    }

    return NextResponse.json({
      resident: {
        id: resident.id,
        name: residentProfile?.full_name || resident.anon_code || 'Unknown',
        email: residentProfile?.email || null,
        anonCode: resident.anon_code,
        medicalSchool: resident.medical_school,
        graduationYear: cls?.graduation_year || null,
        className: cls?.name || null,
        programId: resident.program_id,
      },
      currentScores: periodScores.find((ps) => ps.is_current) || null,
      trendData,
      facultyAverages,
      coreFacultyAverages,
      teachingFacultyAverages,
      selfAverages,
      gapAnalysis,
      classAverages,
      swot: (swotRes.data || [])[0] || null,
      iteScores: iteRes.data || [],
      ratings: {
        faculty: facultyRatings.length,
        coreFaculty: coreFacultyRatings.length,
        teachingFaculty: teachingFacultyRatings.length,
        self: selfRatings.length,
        total: ratings.length,
        recent: ratings.slice(0, 10).map((r) => ({
          id: r.id,
          evaluator_type: r.rater_type,
          evaluation_date: r.evaluation_date,
          eq_avg: r.eq_avg,
          pq_avg: r.pq_avg,
          iq_avg: r.iq_avg,
          overall_avg: r.eq_avg && r.pq_avg && r.iq_avg
            ? Number(((r.eq_avg + r.pq_avg + r.iq_avg) / 3).toFixed(2))
            : null,
          comments: r.concerns_goals,
          faculty: r.faculty_id ? {
            id: r.faculty_id,
            user_profiles: { full_name: facultyNameMap.get(r.faculty_id as string) || 'Faculty' },
          } : null,
        })),
      },
    });
  } catch (error) {
    console.error('[progress-check/residents/scores] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
