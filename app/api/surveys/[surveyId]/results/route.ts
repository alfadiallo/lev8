import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

interface ResidentScore {
  resident_id: string;
  resident_name: string;
  faculty_ratings: Array<{
    faculty_email: string;
    faculty_name: string;
    eq_avg: number;
    pq_avg: number;
    iq_avg: number;
  }>;
  faculty_avg: { eq: number; pq: number; iq: number } | null;
  self_assessment: { eq: number; pq: number; iq: number } | null;
  gap_analysis: { eq: number; pq: number; iq: number } | null;
  n_faculty_raters: number;
}

/**
 * GET /api/surveys/[surveyId]/results
 * Get aggregated results for a survey.
 * For educator surveys: per-resident faculty averages + self-assessment gap analysis
 * For learner surveys: self-assessment results
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  try {
    const { surveyId } = await params;
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch survey
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select(`
        *,
        programs:program_id (id, name, specialty),
        classes:class_id (id, graduation_year, name)
      `)
      .eq('id', surveyId)
      .single();

    if (surveyError || !survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Program scope check: verify the requesting user has access to this survey's program
    if (email && survey.program_id) {
      const normalizedEmail = email.toLowerCase();

      // Check if user is super_admin
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('id, role')
        .or(`email.eq.${normalizedEmail},personal_email.eq.${normalizedEmail}`)
        .limit(1)
        .single();

      const isSuperAdmin = userProfile?.role === 'super_admin';

      if (!isSuperAdmin) {
        // Resolve user's program
        let userProgramId: string | null = null;

        if (userProfile) {
          const { data: faculty } = await supabase
            .from('faculty')
            .select('program_id')
            .or(`user_id.eq.${userProfile.id},email.eq.${normalizedEmail}`)
            .limit(1)
            .single();
          if (faculty) userProgramId = faculty.program_id;
        }

        if (!userProgramId) {
          const { data: eqpqiqRole } = await supabase
            .from('eqpqiq_user_roles')
            .select('program_id')
            .eq('user_email', normalizedEmail)
            .eq('tool', 'progress_check')
            .eq('is_active', true)
            .limit(1)
            .single();
          if (eqpqiqRole) userProgramId = eqpqiqRole.program_id;
        }

        if (userProgramId && userProgramId !== survey.program_id) {
          return NextResponse.json({ error: 'Access denied — survey is not in your program' }, { status: 403 });
        }
      }
    }

    // Fetch completion stats
    const { data: completionStats } = await supabase
      .from('survey_completion_summary')
      .select('*')
      .eq('survey_id', surveyId)
      .single();

    // Get all structured ratings linked to this survey via form_submission_id
    // (form_submission_id = survey_respondent.id)
    const { data: respondents } = await supabase
      .from('survey_respondents')
      .select('id, email, name, role, status')
      .eq('survey_id', surveyId);

    const respondentIds = (respondents || []).map(r => r.id);

    // Get all ratings linked to these respondents
    const { data: ratings } = await supabase
      .from('structured_ratings')
      .select('*, residents:resident_id (id, user_id)')
      .in('form_submission_id', respondentIds);

    // Fetch user_profiles for all residents in ratings (FK is to auth.users, not user_profiles)
    const ratingResUserIds = (ratings || [])
      .map(r => {
        const res = r.residents as unknown as { user_id: string } | null;
        return res?.user_id;
      })
      .filter(Boolean) as string[];

    const ratingProfileMap = new Map<string, string>();
    if (ratingResUserIds.length > 0) {
      const uniqueIds = [...new Set(ratingResUserIds)];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .in('id', uniqueIds);
      for (const p of profiles || []) {
        ratingProfileMap.set(p.id, p.full_name);
      }
    }

    // Build per-resident result aggregation
    const residentMap = new Map<string, ResidentScore>();

    if (ratings) {
      for (const rating of ratings) {
        const resident = rating.residents as unknown as { id: string; user_id: string } | null;
        const residentId = resident?.id || rating.resident_id;
        const residentName = (resident?.user_id ? ratingProfileMap.get(resident.user_id) : null) || 'Unknown';

        if (!residentMap.has(residentId)) {
          residentMap.set(residentId, {
            resident_id: residentId,
            resident_name: residentName,
            faculty_ratings: [],
            faculty_avg: null,
            self_assessment: null,
            gap_analysis: null,
            n_faculty_raters: 0,
          });
        }

        const entry = residentMap.get(residentId)!;

        // Find which respondent submitted this rating
        const respondent = respondents?.find(r => r.id === rating.form_submission_id);

        if (rating.rater_type === 'faculty' && respondent) {
          entry.faculty_ratings.push({
            faculty_email: respondent.email,
            faculty_name: respondent.name || respondent.email,
            eq_avg: Number(rating.eq_avg),
            pq_avg: Number(rating.pq_avg),
            iq_avg: Number(rating.iq_avg),
          });
        } else if (rating.rater_type === 'self') {
          entry.self_assessment = {
            eq: Number(rating.eq_avg),
            pq: Number(rating.pq_avg),
            iq: Number(rating.iq_avg),
          };
        }
      }
    }

    // Compute faculty averages and gap analysis
    for (const entry of residentMap.values()) {
      entry.n_faculty_raters = entry.faculty_ratings.length;

      if (entry.faculty_ratings.length > 0) {
        const avgEq = entry.faculty_ratings.reduce((s, r) => s + r.eq_avg, 0) / entry.faculty_ratings.length;
        const avgPq = entry.faculty_ratings.reduce((s, r) => s + r.pq_avg, 0) / entry.faculty_ratings.length;
        const avgIq = entry.faculty_ratings.reduce((s, r) => s + r.iq_avg, 0) / entry.faculty_ratings.length;

        entry.faculty_avg = {
          eq: Math.round(avgEq * 100) / 100,
          pq: Math.round(avgPq * 100) / 100,
          iq: Math.round(avgIq * 100) / 100,
        };

        // Gap analysis (self - faculty)
        if (entry.self_assessment) {
          entry.gap_analysis = {
            eq: Math.round((entry.self_assessment.eq - avgEq) * 100) / 100,
            pq: Math.round((entry.self_assessment.pq - avgPq) * 100) / 100,
            iq: Math.round((entry.self_assessment.iq - avgIq) * 100) / 100,
          };
        }
      }
    }

    // Sort by resident name
    const results = Array.from(residentMap.values()).sort((a, b) =>
      a.resident_name.localeCompare(b.resident_name)
    );

    // Class-level averages
    let classAverages = null;
    if (results.length > 0) {
      const withFaculty = results.filter(r => r.faculty_avg);
      if (withFaculty.length > 0) {
        classAverages = {
          eq: Math.round(
            (withFaculty.reduce((s, r) => s + (r.faculty_avg?.eq || 0), 0) / withFaculty.length) * 100
          ) / 100,
          pq: Math.round(
            (withFaculty.reduce((s, r) => s + (r.faculty_avg?.pq || 0), 0) / withFaculty.length) * 100
          ) / 100,
          iq: Math.round(
            (withFaculty.reduce((s, r) => s + (r.faculty_avg?.iq || 0), 0) / withFaculty.length) * 100
          ) / 100,
          n_residents: withFaculty.length,
        };
      }
    }

    return NextResponse.json({
      survey: {
        id: survey.id,
        title: survey.title,
        type: survey.survey_type,
        status: survey.status,
        period_label: survey.period_label,
        program: survey.programs,
        class: survey.classes,
      },
      completion: completionStats || {
        total_respondents: 0,
        completed_count: 0,
        completion_percentage: 0,
      },
      results,
      class_averages: classAverages,
    });
  } catch (error) {
    console.error('[survey-results] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
