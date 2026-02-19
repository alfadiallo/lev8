import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

/**
 * GET /api/progress-check/residents
 * List residents for a program, scoped by user's email and program.
 * Query params: email (required), programId (optional), classYear (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const programId = searchParams.get('programId');
    const classYear = searchParams.get('classYear');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const normalizedEmail = email.toLowerCase();

    // Resolve and verify program context from user's email
    let resolvedProgramId: string | null = null;

    // Always resolve the user's actual program first (source of truth)
    const { data: user } = await supabase
      .from('user_profiles')
      .select('id, role, institution_id')
      .or(`email.eq.${normalizedEmail},personal_email.eq.${normalizedEmail}`)
      .limit(1)
      .single();

    if (user) {
      // Super admin can access any program
      if (user.role === 'super_admin') {
        if (programId) {
          resolvedProgramId = programId;
        } else {
          const { data: anyPgm } = await supabase.from('programs').select('id').limit(1).single();
          resolvedProgramId = anyPgm?.id || null;
        }
      } else {
        // Check faculty
        const { data: faculty } = await supabase
          .from('faculty')
          .select('program_id')
          .or(`user_id.eq.${user.id},email.eq.${normalizedEmail}`)
          .limit(1)
          .single();

        if (faculty) {
          resolvedProgramId = faculty.program_id;
        } else {
          // Check if PD
          const { data: program } = await supabase
            .from('programs')
            .select('id')
            .eq('pgm_director_id', user.id)
            .limit(1)
            .single();
          if (program) resolvedProgramId = program.id;
        }

        // Institution fallback
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

    // Also check eqpqiq_user_roles for email-only users
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

    // If a programId was explicitly passed, verify it matches the user's program
    // (prevents cross-program data access by manipulating query params)
    if (programId && programId !== resolvedProgramId && user?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Access denied — program mismatch' }, { status: 403 });
    }

    // Fetch residents
    // When filtering by classYear, look up the class_id first to filter directly
    let classIdFilter: string | null = null;
    if (classYear) {
      const { data: cls } = await supabase
        .from('classes')
        .select('id')
        .eq('graduation_year', parseInt(classYear))
        .eq('program_id', resolvedProgramId)
        .limit(1)
        .single();
      if (cls) classIdFilter = cls.id;
    }

    // Fetch program info for the response
    const { data: programInfo } = await supabase
      .from('programs')
      .select('id, name, specialty, health_system_id, health_systems:health_system_id (name, abbreviation)')
      .eq('id', resolvedProgramId)
      .single();

    let query = supabase
      .from('residents')
      .select(`
        id, user_id, anon_code, program_id, class_id,
        classes:class_id (graduation_year, name, is_active)
      `)
      .eq('program_id', resolvedProgramId);

    if (classIdFilter) {
      query = query.eq('class_id', classIdFilter);
    }

    const { data: residents, error: resError } = await query;

    if (resError) {
      console.error('[progress-check/residents] Error fetching residents:', resError);
      return NextResponse.json({ error: 'Failed to fetch residents' }, { status: 500 });
    }

    // Fetch user_profiles for residents separately (FK is to auth.users, not user_profiles)
    const resUserIds = (residents || [])
      .map((r: { user_id: string }) => r.user_id)
      .filter(Boolean) as string[];

    const resProfileMap = new Map<string, { full_name: string; email: string }>();
    if (resUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name, email')
        .in('id', resUserIds);
      for (const p of profiles || []) {
        resProfileMap.set(p.id, p);
      }
    }

    // Compute live scores from structured_ratings (same source as detail page)
    const residentIds = (residents || []).map((r: { id: string }) => r.id);
    const scores: Record<string, { faculty_eq_avg: number | null; faculty_pq_avg: number | null; faculty_iq_avg: number | null; faculty_n_raters: number; self_eq_avg: number | null; self_pq_avg: number | null; self_iq_avg: number | null; periods: string[] }> = {};

    if (residentIds.length > 0) {
      const { data: allRatings, error: ratingsError } = await supabase
        .from('structured_ratings')
        .select('resident_id, rater_type, eq_avg, pq_avg, iq_avg, period_label, evaluation_date')
        .in('resident_id', residentIds);

      if (ratingsError) {
        console.error('[progress-check/residents] Error fetching structured_ratings:', ratingsError);
      }

      if (allRatings) {
        const avgArr = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

        for (const rid of residentIds) {
          const mine = allRatings.filter((r) => r.resident_id === rid);
          const fac = mine.filter((r) => r.rater_type === 'core_faculty' || r.rater_type === 'teaching_faculty');
          const self = mine.filter((r) => r.rater_type === 'self');

          const periods = [...new Set(
            mine
              .filter((r) => r.period_label)
              .sort((a, b) => (a.evaluation_date || '').localeCompare(b.evaluation_date || ''))
              .map((r) => r.period_label as string)
          )];

          scores[rid] = {
            faculty_eq_avg: avgArr(fac.filter((r) => r.eq_avg != null).map((r) => r.eq_avg as number)),
            faculty_pq_avg: avgArr(fac.filter((r) => r.pq_avg != null).map((r) => r.pq_avg as number)),
            faculty_iq_avg: avgArr(fac.filter((r) => r.iq_avg != null).map((r) => r.iq_avg as number)),
            faculty_n_raters: fac.length,
            self_eq_avg: avgArr(self.filter((r) => r.eq_avg != null).map((r) => r.eq_avg as number)),
            self_pq_avg: avgArr(self.filter((r) => r.pq_avg != null).map((r) => r.pq_avg as number)),
            self_iq_avg: avgArr(self.filter((r) => r.iq_avg != null).map((r) => r.iq_avg as number)),
            periods,
          };
        }
      }
    }

    // Fetch classes for grouping
    const { data: classes } = await supabase
      .from('classes')
      .select('id, graduation_year, name, is_active')
      .eq('program_id', resolvedProgramId)
      .order('graduation_year', { ascending: true });

    interface ClassInfo {
      graduation_year?: number;
      name?: string;
      is_active?: boolean;
    }
    interface ResidentRow {
      id: string;
      user_id: string;
      anon_code: string;
      program_id: string;
      class_id: string;
      classes: ClassInfo | ClassInfo[] | null;
    }

    const formattedResidents = (residents as unknown as ResidentRow[] || []).map((r) => {
      const profile = r.user_id ? resProfileMap.get(r.user_id) : null;
      const cls = Array.isArray(r.classes) ? r.classes[0] : r.classes;
      return {
        id: r.id,
        userId: r.user_id,
        anonCode: r.anon_code,
        name: profile?.full_name || r.anon_code || 'Unknown',
        email: profile?.email || null,
        classId: r.class_id,
        graduationYear: cls?.graduation_year || null,
        className: cls?.name || null,
        currentScores: scores[r.id] || null,
      };
    });

    // Shape program info
    interface HealthSystem { name?: string; abbreviation?: string; }
    const hs = programInfo?.health_systems
      ? (Array.isArray(programInfo.health_systems)
        ? (programInfo.health_systems as HealthSystem[])[0]
        : (programInfo.health_systems as HealthSystem | null))
      : null;

    return NextResponse.json({
      programId: resolvedProgramId,
      program: programInfo ? {
        id: programInfo.id,
        name: programInfo.name,
        specialty: programInfo.specialty,
        institution: hs?.name || hs?.abbreviation || null,
      } : null,
      residents: formattedResidents,
      classes: classes || [],
      total: formattedResidents.length,
    });
  } catch (error) {
    console.error('[progress-check/residents] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
