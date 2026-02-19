import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

/**
 * GET /api/progress-check/data
 * Return all structured_ratings rows for a program with resident + faculty names.
 * Query params: email (required)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const normalizedEmail = email.toLowerCase();

    // ── Resolve program from email (same pattern as /api/progress-check/residents) ──
    let resolvedProgramId: string | null = null;

    const { data: user } = await supabase
      .from('user_profiles')
      .select('id, role, institution_id')
      .or(`email.eq.${normalizedEmail},personal_email.eq.${normalizedEmail}`)
      .limit(1)
      .single();

    if (user) {
      if (user.role === 'super_admin') {
        const { data: anyPgm } = await supabase.from('programs').select('id').limit(1).single();
        resolvedProgramId = anyPgm?.id || null;
      } else {
        const { data: faculty } = await supabase
          .from('faculty')
          .select('program_id')
          .or(`user_id.eq.${user.id},email.eq.${normalizedEmail}`)
          .limit(1)
          .single();
        if (faculty) {
          resolvedProgramId = faculty.program_id;
        } else {
          const { data: program } = await supabase
            .from('programs')
            .select('id')
            .eq('pgm_director_id', user.id)
            .limit(1)
            .single();
          if (program) resolvedProgramId = program.id;
        }
        if (!resolvedProgramId && user.institution_id) {
          const { data: anyPgm } = await supabase
            .from('programs')
            .select('id')
            .eq('health_system_id', user.institution_id)
            .limit(1)
            .single();
          if (anyPgm) resolvedProgramId = anyPgm.id;
        }
      }
    }

    if (!resolvedProgramId) {
      const { data: eqpqiqRole } = await supabase
        .from('eqpqiq_user_roles')
        .select('program_id')
        .eq('user_email', normalizedEmail)
        .eq('tool', 'progress_check')
        .eq('is_active', true)
        .limit(1)
        .single();
      if (eqpqiqRole) resolvedProgramId = eqpqiqRole.program_id;
    }

    if (!resolvedProgramId) {
      return NextResponse.json({ error: 'Could not determine program' }, { status: 400 });
    }

    // ── Get all residents in the program ──
    const { data: residents } = await supabase
      .from('residents')
      .select('id, user_id, anon_code, class_id')
      .eq('program_id', resolvedProgramId);

    if (!residents || residents.length === 0) {
      return NextResponse.json({ rows: [], periods: [], classes: [], total: 0 });
    }

    // ── Fetch classes for grouping / filter ──
    const { data: classes } = await supabase
      .from('classes')
      .select('id, graduation_year, name, is_active')
      .eq('program_id', resolvedProgramId)
      .order('graduation_year', { ascending: true });

    const classMap = new Map<string, number>();
    for (const c of classes || []) {
      classMap.set(c.id, c.graduation_year);
    }

    const residentClassMap = new Map<string, number | null>();
    for (const r of residents) {
      residentClassMap.set(r.id, r.class_id ? classMap.get(r.class_id) || null : null);
    }

    const residentIds = residents.map((r) => r.id);

    // ── Fetch all structured_ratings for these residents ──
    const { data: ratings, error: ratingsError } = await supabase
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
      .in('resident_id', residentIds)
      .order('evaluation_date', { ascending: false });

    if (ratingsError) {
      console.error('[progress-check/data] Error fetching ratings:', ratingsError);
      return NextResponse.json({ error: 'Failed to fetch ratings' }, { status: 500 });
    }

    // ── Resolve resident names ──
    const userIds = residents.map((r) => r.user_id).filter(Boolean);
    const { data: residentProfiles } = await supabase
      .from('user_profiles')
      .select('id, full_name')
      .in('id', userIds);

    const residentNameMap = new Map<string, string>();
    for (const r of residents) {
      const profile = (residentProfiles || []).find((p) => p.id === r.user_id);
      residentNameMap.set(r.id, profile?.full_name || r.anon_code || 'Unknown');
    }

    // ── Resolve faculty names ──
    const facultyIds = [...new Set((ratings || []).map((r) => r.faculty_id).filter(Boolean))] as string[];
    const facultyNameMap = new Map<string, string>();

    if (facultyIds.length > 0) {
      const { data: facRows } = await supabase
        .from('faculty')
        .select('id, user_id, full_name')
        .in('id', facultyIds);

      if (facRows) {
        for (const f of facRows) {
          if (f.full_name) {
            facultyNameMap.set(f.id, f.full_name);
          }
        }
        // Fallback: lookup user_profiles for any missing names
        const missingUserIds = facRows
          .filter((f) => !f.full_name && f.user_id)
          .map((f) => f.user_id);
        if (missingUserIds.length > 0) {
          const { data: facProfiles } = await supabase
            .from('user_profiles')
            .select('id, full_name')
            .in('id', missingUserIds);
          for (const f of facRows) {
            if (!facultyNameMap.has(f.id) && f.user_id) {
              const profile = (facProfiles || []).find((p) => p.id === f.user_id);
              if (profile?.full_name) facultyNameMap.set(f.id, profile.full_name);
            }
          }
        }
      }
    }

    // ── Collect unique periods for filter dropdown ──
    const periodSet = new Set<string>();
    for (const r of ratings || []) {
      if (r.period_label) periodSet.add(r.period_label as string);
    }

    // ── Shape response rows ──
    const rows = (ratings || []).map((r) => ({
      id: r.id,
      residentName: residentNameMap.get(r.resident_id) || 'Unknown',
      residentId: r.resident_id,
      graduationYear: residentClassMap.get(r.resident_id) || null,
      raterType: r.rater_type,
      evaluatorName: r.faculty_id
        ? facultyNameMap.get(r.faculty_id as string) || 'Faculty'
        : r.rater_type === 'self' ? 'Self' : '—',
      evaluationDate: r.evaluation_date,
      periodLabel: r.period_label,
      eq_empathy_positive_interactions: r.eq_empathy_positive_interactions,
      eq_adaptability_self_awareness: r.eq_adaptability_self_awareness,
      eq_stress_management_resilience: r.eq_stress_management_resilience,
      eq_curiosity_growth_mindset: r.eq_curiosity_growth_mindset,
      eq_effectiveness_communication: r.eq_effectiveness_communication,
      pq_work_ethic_reliability: r.pq_work_ethic_reliability,
      pq_integrity_accountability: r.pq_integrity_accountability,
      pq_teachability_receptiveness: r.pq_teachability_receptiveness,
      pq_documentation: r.pq_documentation,
      pq_leadership_relationships: r.pq_leadership_relationships,
      iq_knowledge_base: r.iq_knowledge_base,
      iq_analytical_thinking: r.iq_analytical_thinking,
      iq_commitment_learning: r.iq_commitment_learning,
      iq_clinical_flexibility: r.iq_clinical_flexibility,
      iq_performance_for_level: r.iq_performance_for_level,
      eqAvg: r.eq_avg,
      pqAvg: r.pq_avg,
      iqAvg: r.iq_avg,
      comments: r.concerns_goals,
    }));

    return NextResponse.json({
      rows,
      periods: Array.from(periodSet).sort(),
      classes: classes || [],
      total: rows.length,
    });
  } catch (error) {
    console.error('[progress-check/data] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
