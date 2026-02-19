import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

/**
 * GET /api/surveys/[surveyId]
 * Get survey details with respondent list and completion stats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  try {
    const { surveyId } = await params;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch survey with program/class info
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select(`
        *,
        programs:program_id (id, name, specialty, health_system_id),
        classes:class_id (id, graduation_year, name)
      `)
      .eq('id', surveyId)
      .single();

    if (surveyError || !survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Fetch respondents
    const { data: respondents } = await supabase
      .from('survey_respondents')
      .select('*')
      .eq('survey_id', surveyId)
      .order('name', { ascending: true });

    // For educator surveys, fetch per-faculty progress
    let facultyProgress = null;
    if (survey.survey_type === 'educator_assessment') {
      const { data: progress } = await supabase
        .from('educator_survey_progress')
        .select('*')
        .eq('survey_id', surveyId);
      facultyProgress = progress;
    }

    // Fetch detailed respondent data from the campaign view
    const { data: respondentDetails } = await supabase
      .from('campaign_respondent_detail')
      .select('*')
      .eq('survey_id', surveyId)
      .order('rater_type', { ascending: true })
      .order('name', { ascending: true });

    // Compute completion stats
    const stats = {
      total_respondents: (respondents || []).length,
      completed: (respondents || []).filter(r => r.status === 'completed').length,
      started: (respondents || []).filter(r => r.status === 'started').length,
      pending: (respondents || []).filter(r => r.status === 'pending').length,
      completion_percentage: (respondents || []).length > 0
        ? Math.round(
            ((respondents || []).filter(r => r.status === 'completed').length /
              (respondents || []).length) * 100
          )
        : 0,
    };

    return NextResponse.json({
      survey,
      respondents: respondents || [],
      respondent_details: respondentDetails || [],
      faculty_progress: facultyProgress,
      stats,
    });
  } catch (error) {
    console.error('[surveys] Detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/surveys/[surveyId]
 * Update survey settings (status, deadline, reminders, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  try {
    const { surveyId } = await params;
    const body = await request.json();

    const allowedFields = [
      'title', 'description', 'status', 'deadline',
      'auto_remind', 'remind_every_days', 'max_reminders', 'settings',
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: survey, error } = await supabase
      .from('surveys')
      .update(updates)
      .eq('id', surveyId)
      .select()
      .single();

    if (error) {
      console.error('[surveys] Update error:', error);
      return NextResponse.json({ error: 'Failed to update survey' }, { status: 500 });
    }

    return NextResponse.json({ survey });
  } catch (error) {
    console.error('[surveys] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
