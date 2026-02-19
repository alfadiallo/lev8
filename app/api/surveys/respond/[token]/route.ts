import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

interface ResidentInfo {
  id: string;
  display_order: number;
  assignment_id: string;
  assignment_status: string;
  full_name: string;
  email: string;
}

/**
 * GET /api/surveys/respond/[token]
 * Load the survey form for a respondent.
 * Returns survey info, respondent info, and (for educator surveys) the list of residents to rate.
 * No authentication required -- the token IS the authentication.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up respondent by token
    const { data: respondent, error: respondentError } = await supabase
      .from('survey_respondents')
      .select('*')
      .eq('token', token)
      .single();

    if (respondentError || !respondent) {
      return NextResponse.json(
        { error: 'Invalid or expired survey link' },
        { status: 404 }
      );
    }

    // Fetch survey details
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select(`
        id, survey_type, title, description, status, deadline,
        period_label, academic_year, settings, program_id,
        programs:program_id (id, name, specialty)
      `)
      .eq('id', respondent.survey_id)
      .single();

    if (surveyError || !survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Check if survey is still accepting responses
    if (survey.status === 'closed' || survey.status === 'archived') {
      return NextResponse.json({
        error: 'This survey is no longer accepting responses',
        survey_status: survey.status,
      }, { status: 410 });
    }

    const deadlinePassed = survey.deadline && new Date(survey.deadline) < new Date();
    const allowEditAfterSubmit = (survey.settings as Record<string, unknown>)?.allow_edit_after_submit;

    if (deadlinePassed) {
      // If respondent already completed and allow_edit_after_submit, show read-only
      if (respondent.status === 'completed' && allowEditAfterSubmit) {
        // Allow GET to proceed so we can render read-only view on the client
      } else {
        return NextResponse.json({
          error: 'This survey has passed its deadline',
          deadline: survey.deadline,
        }, { status: 410 });
      }
    }

    // For educator surveys: fetch residents to rate with completion status
    let residents: ResidentInfo[] = [];
    if (survey.survey_type === 'educator_assessment') {
      const { data: assignments } = await supabase
        .from('survey_resident_assignments')
        .select(`
          id,
          resident_id,
          status,
          display_order,
          structured_rating_id,
          residents:resident_id (id, user_id)
        `)
        .eq('respondent_id', respondent.id)
        .order('display_order', { ascending: true });

      if (assignments) {
        // Fetch user_profiles separately (FK is to auth.users, not user_profiles)
        const userIds = assignments
          .map(a => {
            const r = a.residents as unknown as { user_id: string } | null;
            return r?.user_id;
          })
          .filter(Boolean) as string[];

        const profileMap = new Map<string, { full_name: string; email: string }>();
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, full_name, email')
            .in('id', userIds);
          for (const p of profiles || []) {
            profileMap.set(p.id, p);
          }
        }

        residents = assignments.map(a => {
          const resident = a.residents as unknown as { id: string; user_id: string } | null;
          const profile = resident?.user_id ? profileMap.get(resident.user_id) : null;
          return {
            id: resident?.id || a.resident_id,
            display_order: a.display_order,
            assignment_id: a.id,
            assignment_status: a.status,
            full_name: profile?.full_name || 'Unknown',
            email: profile?.email || '',
          };
        });
      }
    }

    // Fetch existing scores for completed assignments (for post-submit editing)
    const existingScores: Record<string, Record<string, number | string | null>> = {};
    if (respondent.status === 'completed' && allowEditAfterSubmit) {
      const { data: ratings } = await supabase
        .from('structured_ratings')
        .select('*')
        .eq('form_submission_id', respondent.id);

      if (ratings && ratings.length > 0) {
        for (const rating of ratings) {
          existingScores[rating.resident_id] = {
            eq_empathy_positive_interactions: rating.eq_empathy_positive_interactions,
            eq_adaptability_self_awareness: rating.eq_adaptability_self_awareness,
            eq_stress_management_resilience: rating.eq_stress_management_resilience,
            eq_curiosity_growth_mindset: rating.eq_curiosity_growth_mindset,
            eq_effectiveness_communication: rating.eq_effectiveness_communication,
            pq_work_ethic_reliability: rating.pq_work_ethic_reliability,
            pq_integrity_accountability: rating.pq_integrity_accountability,
            pq_teachability_receptiveness: rating.pq_teachability_receptiveness,
            pq_documentation: rating.pq_documentation,
            pq_leadership_relationships: rating.pq_leadership_relationships,
            iq_knowledge_base: rating.iq_knowledge_base,
            iq_analytical_thinking: rating.iq_analytical_thinking,
            iq_commitment_learning: rating.iq_commitment_learning,
            iq_clinical_flexibility: rating.iq_clinical_flexibility,
            iq_performance_for_level: rating.iq_performance_for_level,
            comments: rating.concerns_goals,
          };
        }
      }
    }

    // For learner surveys: fetch the respondent's own resident info
    let selfResident = null;
    if (survey.survey_type === 'learner_self_assessment') {
      const { data: assignment } = await supabase
        .from('survey_resident_assignments')
        .select('id, resident_id, status, residents:resident_id (id, user_id)')
        .eq('respondent_id', respondent.id)
        .limit(1)
        .single();

      if (assignment) {
        const resident = assignment.residents as unknown as { id: string; user_id: string } | null;
        let selfName = respondent.name || 'Unknown';
        if (resident?.user_id) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('full_name')
            .eq('id', resident.user_id)
            .single();
          if (profile?.full_name) selfName = profile.full_name;
        }
        selfResident = {
          id: resident?.id || assignment.resident_id,
          assignment_id: assignment.id,
          full_name: selfName,
        };
      }
    }

    // Try to fetch the active framework for this program (Phase 1B)
    let frameworkData = null;
    if (survey.program_id) {
      const { data: framework } = await supabase
        .from('evaluation_frameworks')
        .select('id, name, version, score_min, score_max, score_step')
        .eq('program_id', survey.program_id)
        .eq('is_active', true)
        .single();

      if (framework) {
        const { data: pillars } = await supabase
          .from('framework_pillars')
          .select('id, name, slug, description, color, display_order')
          .eq('framework_id', framework.id)
          .order('display_order');

        const { data: attributes } = await supabase
          .from('framework_attributes')
          .select('id, pillar_id, name, slug, description, display_order, tags, category')
          .eq('framework_id', framework.id)
          .order('display_order');

        frameworkData = {
          ...framework,
          pillars: (pillars || []).map(p => ({
            ...p,
            attributes: (attributes || []).filter(a => a.pillar_id === p.id),
          })),
        };
      }
    }

    // Mark as started if pending
    if (respondent.status === 'pending') {
      await supabase
        .from('survey_respondents')
        .update({ status: 'started', started_at: new Date().toISOString() })
        .eq('id', respondent.id);
    }

    return NextResponse.json({
      survey: {
        id: survey.id,
        type: survey.survey_type,
        title: survey.title,
        description: survey.description,
        deadline: survey.deadline,
        period_label: survey.period_label,
        academic_year: survey.academic_year,
        program: survey.programs,
        settings: survey.settings,
      },
      respondent: {
        id: respondent.id,
        email: respondent.email,
        name: respondent.name,
        role: respondent.role,
        rater_type: respondent.rater_type || null,
        guidance_min: respondent.guidance_min || null,
        status: respondent.status === 'pending' ? 'started' : respondent.status,
        progress_data: respondent.progress_data,
      },
      residents,
      self_resident: selfResident,
      existing_scores: Object.keys(existingScores).length > 0 ? existingScores : undefined,
      framework: frameworkData,
    });
  } catch (error) {
    console.error('[survey-respond] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/surveys/respond/[token]
 * Submit survey responses (or save progress).
 * 
 * Body for save progress:
 *   { action: "save_progress", progress_data: {...} }
 * 
 * Body for submitting a single resident rating (educator survey):
 *   { action: "submit_rating", assignment_id: "...", scores: {...}, comments?: "..." }
 * 
 * Body for submitting self-assessment (learner survey):
 *   { action: "submit_self", assignment_id: "...", scores: {...}, concerns_goals?: "..." }
 * 
 * Body for final submission (mark entire survey complete):
 *   { action: "complete" }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { action } = body;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up respondent
    const { data: respondent, error: respondentError } = await supabase
      .from('survey_respondents')
      .select('*, surveys:survey_id (*)')
      .eq('token', token)
      .single();

    if (respondentError || !respondent) {
      return NextResponse.json({ error: 'Invalid survey link' }, { status: 404 });
    }

    const survey = respondent.surveys as {
      id: string;
      survey_type: string;
      status: string;
      deadline: string | null;
      period_label: string | null;
      program_id: string | null;
      class_id: string | null;
      settings: Record<string, unknown>;
    };

    // Check survey is still open
    if (survey.status === 'closed' || survey.status === 'archived') {
      return NextResponse.json({ error: 'Survey is closed' }, { status: 410 });
    }

    const postAllowEditAfterSubmit = survey.settings?.allow_edit_after_submit ?? false;
    const postDeadlinePassed = survey.deadline && new Date(survey.deadline) < new Date();

    if (respondent.status === 'completed' && action !== 'save_progress') {
      if (postAllowEditAfterSubmit && !postDeadlinePassed) {
        // Allow editing -- the submit logic below will UPDATE instead of INSERT
      } else {
        return NextResponse.json({ error: 'Survey already completed' }, { status: 409 });
      }
    }

    // Handle different actions
    switch (action) {
      case 'save_progress': {
        const { progress_data } = body;
        await supabase
          .from('survey_respondents')
          .update({
            progress_data,
            status: respondent.status === 'pending' ? 'started' : respondent.status,
            started_at: respondent.started_at || new Date().toISOString(),
          })
          .eq('id', respondent.id);

        return NextResponse.json({ success: true, message: 'Progress saved' });
      }

      case 'submit_rating': {
        // Faculty submits rating for one resident
        const { assignment_id, scores, comments } = body;

        if (!assignment_id || !scores) {
          return NextResponse.json(
            { error: 'assignment_id and scores are required' },
            { status: 400 }
          );
        }

        // Fetch assignment
        const { data: assignment } = await supabase
          .from('survey_resident_assignments')
          .select('*')
          .eq('id', assignment_id)
          .eq('respondent_id', respondent.id)
          .single();

        if (!assignment) {
          return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
        }

        // Look up faculty_id from respondent email
        const { data: faculty } = await supabase
          .from('faculty')
          .select('id')
          .eq('email', respondent.email)
          .limit(1)
          .maybeSingle();

        // Determine rater_type from respondent
        const raterType = respondent.rater_type === 'core_faculty'
          ? 'core_faculty'
          : respondent.rater_type === 'teaching_faculty'
            ? 'teaching_faculty'
            : 'faculty';

        const ratingPayload = {
          resident_id: assignment.resident_id,
          rater_type: raterType,
          faculty_id: faculty?.id || null,
          evaluation_date: new Date().toISOString().split('T')[0],
          pgy_level: scores.pgy_level || null,
          period: scores.period || null,
          period_label: survey.period_label || null,
          eq_empathy_positive_interactions: scores.eq_empathy_positive_interactions,
          eq_adaptability_self_awareness: scores.eq_adaptability_self_awareness,
          eq_stress_management_resilience: scores.eq_stress_management_resilience,
          eq_curiosity_growth_mindset: scores.eq_curiosity_growth_mindset,
          eq_effectiveness_communication: scores.eq_effectiveness_communication,
          pq_work_ethic_reliability: scores.pq_work_ethic_reliability,
          pq_integrity_accountability: scores.pq_integrity_accountability,
          pq_teachability_receptiveness: scores.pq_teachability_receptiveness,
          pq_documentation: scores.pq_documentation,
          pq_leadership_relationships: scores.pq_leadership_relationships,
          iq_knowledge_base: scores.iq_knowledge_base,
          iq_analytical_thinking: scores.iq_analytical_thinking,
          iq_commitment_learning: scores.iq_commitment_learning,
          iq_clinical_flexibility: scores.iq_clinical_flexibility,
          iq_performance_for_level: scores.iq_performance_for_level,
          concerns_goals: comments || null,
          form_submission_id: respondent.id,
        };

        // Check for existing rating (for post-submit editing)
        let rating;
        let ratingError;
        if (assignment.structured_rating_id) {
          const result = await supabase
            .from('structured_ratings')
            .update(ratingPayload)
            .eq('id', assignment.structured_rating_id)
            .select()
            .single();
          rating = result.data;
          ratingError = result.error;
        } else {
          const result = await supabase
            .from('structured_ratings')
            .insert(ratingPayload)
            .select()
            .single();
          rating = result.data;
          ratingError = result.error;
        }

        if (ratingError) {
          console.error('[survey-respond] Rating save error:', ratingError);
          return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 });
        }

        // Mark assignment as completed
        await supabase
          .from('survey_resident_assignments')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            structured_rating_id: rating.id,
          })
          .eq('id', assignment_id);

        // Check if all required assignments are complete
        let remainingQuery = supabase
          .from('survey_resident_assignments')
          .select('id')
          .eq('respondent_id', respondent.id)
          .eq('status', 'pending');

        if (respondent.rater_type === 'teaching_faculty') {
          remainingQuery = remainingQuery.eq('required', true);
        }

        const { data: remaining } = await remainingQuery;
        const allComplete = !remaining || remaining.length === 0;

        // Update respondent progress
        const progressUpdate: Record<string, unknown> = {
          status: allComplete ? 'completed' : 'started',
        };
        if (allComplete) {
          progressUpdate.completed_at = new Date().toISOString();
        }
        await supabase
          .from('survey_respondents')
          .update(progressUpdate)
          .eq('id', respondent.id);

        return NextResponse.json({
          success: true,
          rating_id: rating.id,
          all_complete: allComplete,
          remaining_count: remaining?.length || 0,
        });
      }

      case 'submit_self': {
        // Resident submits self-assessment
        const { assignment_id, scores, concerns_goals } = body;

        if (!scores) {
          return NextResponse.json({ error: 'scores are required' }, { status: 400 });
        }

        // Get resident_id from assignment or lookup
        let residentId: string | null = null;
        if (assignment_id) {
          const { data: assignment } = await supabase
            .from('survey_resident_assignments')
            .select('resident_id')
            .eq('id', assignment_id)
            .single();
          residentId = assignment?.resident_id || null;
        }

        if (!residentId) {
          // Try to find resident by email
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('id')
            .or(`email.eq.${respondent.email},personal_email.eq.${respondent.email}`)
            .limit(1)
            .maybeSingle();

          if (userProfile) {
            const { data: resident } = await supabase
              .from('residents')
              .select('id')
              .eq('user_id', userProfile.id)
              .single();
            residentId = resident?.id || null;
          }
        }

        if (!residentId) {
          return NextResponse.json(
            { error: 'Could not determine resident for self-assessment' },
            { status: 400 }
          );
        }

        const selfPayload = {
          resident_id: residentId,
          rater_type: 'self',
          evaluation_date: new Date().toISOString().split('T')[0],
          pgy_level: scores.pgy_level || null,
          period: scores.period || null,
          period_label: survey.period_label || null,
          eq_empathy_positive_interactions: scores.eq_empathy_positive_interactions,
          eq_adaptability_self_awareness: scores.eq_adaptability_self_awareness,
          eq_stress_management_resilience: scores.eq_stress_management_resilience,
          eq_curiosity_growth_mindset: scores.eq_curiosity_growth_mindset,
          eq_effectiveness_communication: scores.eq_effectiveness_communication,
          pq_work_ethic_reliability: scores.pq_work_ethic_reliability,
          pq_integrity_accountability: scores.pq_integrity_accountability,
          pq_teachability_receptiveness: scores.pq_teachability_receptiveness,
          pq_documentation: scores.pq_documentation,
          pq_leadership_relationships: scores.pq_leadership_relationships,
          iq_knowledge_base: scores.iq_knowledge_base,
          iq_analytical_thinking: scores.iq_analytical_thinking,
          iq_commitment_learning: scores.iq_commitment_learning,
          iq_clinical_flexibility: scores.iq_clinical_flexibility,
          iq_performance_for_level: scores.iq_performance_for_level,
          concerns_goals: concerns_goals || null,
          form_submission_id: respondent.id,
        };

        // Check for existing self-rating (post-submit editing)
        let rating;
        let ratingError;
        const { data: existingSelf } = await supabase
          .from('structured_ratings')
          .select('id')
          .eq('form_submission_id', respondent.id)
          .eq('resident_id', residentId)
          .limit(1)
          .single();

        if (existingSelf) {
          const result = await supabase
            .from('structured_ratings')
            .update(selfPayload)
            .eq('id', existingSelf.id)
            .select()
            .single();
          rating = result.data;
          ratingError = result.error;
        } else {
          const result = await supabase
            .from('structured_ratings')
            .insert(selfPayload)
            .select()
            .single();
          rating = result.data;
          ratingError = result.error;
        }

        if (ratingError) {
          console.error('[survey-respond] Self-assessment error:', ratingError);
          return NextResponse.json({ error: 'Failed to save self-assessment' }, { status: 500 });
        }

        // Mark assignment complete
        if (assignment_id) {
          await supabase
            .from('survey_resident_assignments')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              structured_rating_id: rating.id,
            })
            .eq('id', assignment_id);
        }

        // Mark respondent as completed
        await supabase
          .from('survey_respondents')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', respondent.id);

        return NextResponse.json({
          success: true,
          rating_id: rating.id,
          all_complete: true,
        });
      }

      case 'complete': {
        // Mark the entire survey response as complete
        await supabase
          .from('survey_respondents')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', respondent.id);

        return NextResponse.json({ success: true, message: 'Survey completed' });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Valid actions: save_progress, submit_rating, submit_self, complete` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[survey-respond] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
