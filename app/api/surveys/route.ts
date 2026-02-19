import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

/**
 * GET /api/surveys
 * List surveys for a program (filtered by program_id or created_by_email)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('program_id');
    const createdBy = searchParams.get('created_by');
    const status = searchParams.get('status');

    if (!programId && !createdBy) {
      return NextResponse.json(
        { error: 'program_id or created_by is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from('surveys')
      .select(`
        *,
        programs:program_id (id, name, specialty),
        classes:class_id (id, graduation_year, name)
      `)
      .order('created_at', { ascending: false });

    if (programId) {
      query = query.eq('program_id', programId);
    }
    if (createdBy) {
      query = query.eq('created_by_email', createdBy.toLowerCase());
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[surveys] List error:', error);
      return NextResponse.json({ error: 'Failed to list surveys' }, { status: 500 });
    }

    // Fetch completion stats for each survey
    const { data: completionStats } = await supabase
      .from('survey_completion_summary')
      .select('*')
      .in('survey_id', (data || []).map(s => s.id));

    const surveysWithStats = (data || []).map(survey => {
      const stats = completionStats?.find(c => c.survey_id === survey.id);
      return {
        ...survey,
        stats: stats || {
          total_respondents: 0,
          completed_count: 0,
          started_count: 0,
          pending_count: 0,
          completion_percentage: 0,
        },
      };
    });

    return NextResponse.json({ surveys: surveysWithStats });
  } catch (error) {
    console.error('[surveys] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/surveys
 * Create a new survey campaign
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      survey_type,
      title,
      description,
      program_id,
      class_id,
      period_label,
      academic_year,
      audience_filter,
      deadline,
      auto_remind,
      remind_every_days,
      max_reminders,
      created_by_email,
      settings,
    } = body;

    if (!survey_type || !title || !program_id || !created_by_email) {
      return NextResponse.json(
        { error: 'survey_type, title, program_id, and created_by_email are required' },
        { status: 400 }
      );
    }

    const validTypes = ['learner_self_assessment', 'educator_assessment', 'program_intake', 'custom'];
    if (!validTypes.includes(survey_type)) {
      return NextResponse.json(
        { error: `Invalid survey_type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: survey, error } = await supabase
      .from('surveys')
      .insert({
        survey_type,
        title,
        description,
        program_id,
        class_id: class_id || null,
        period_label: period_label || null,
        academic_year: academic_year || null,
        audience_filter: audience_filter || {},
        status: 'draft',
        deadline: deadline || null,
        auto_remind: auto_remind || false,
        remind_every_days: remind_every_days || null,
        max_reminders: max_reminders || 5,
        created_by_email: created_by_email.toLowerCase(),
        settings: settings || {},
      })
      .select()
      .single();

    if (error) {
      console.error('[surveys] Create error:', error);
      return NextResponse.json({ error: 'Failed to create survey' }, { status: 500 });
    }

    console.log('[surveys] Created survey:', survey.id, survey.title);

    return NextResponse.json({ survey }, { status: 201 });
  } catch (error) {
    console.error('[surveys] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
