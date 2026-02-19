import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const EQPQIQ_FROM_EMAIL = process.env.PULSECHECK_FROM_EMAIL || 'EQ·PQ·IQ <noreply@eqpqiq.com>';
const EQPQIQ_BASE_URL = process.env.EQPQIQ_BASE_URL || 'https://eqpqiq.com';
const RESEND_API_KEY = process.env.RESEND_API_KEY;

async function sendReminderEmail(
  to: string,
  name: string,
  surveyTitle: string,
  token: string,
  deadline: string | null,
  contextMessage: string,
): Promise<boolean> {
  const surveyUrl = `${EQPQIQ_BASE_URL}/survey/${token}`;

  const deadlineText = deadline
    ? `<p style="color: #dc2626; font-weight: 600; margin: 12px 0;">
        Deadline: ${new Date(deadline).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
       </p>`
    : '';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #1a1a1a; margin: 0;">Friendly Reminder</h2>
      </div>
      
      <p style="color: #333; font-size: 16px; line-height: 1.6;">
        Hi ${name || 'there'},
      </p>
      
      <p style="color: #333; font-size: 16px; line-height: 1.6;">
        This is a reminder to complete: <strong>${surveyTitle}</strong>
      </p>
      
      <p style="color: #555; font-size: 14px; line-height: 1.6;">${contextMessage}</p>
      
      ${deadlineText}
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${surveyUrl}" 
           style="display: inline-block; padding: 14px 32px; background: #2563eb; color: white; 
                  text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
          Continue Survey
        </a>
      </div>
      
      <p style="color: #666; font-size: 13px; line-height: 1.5;">
        Your progress has been saved. Pick up right where you left off.
      </p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      
      <p style="color: #999; font-size: 12px; text-align: center;">
        EQ·PQ·IQ by <a href="https://eqpqiq.com" style="color: #999;">eqpqiq.com</a>
      </p>
    </div>
  `;

  if (!RESEND_API_KEY) {
    console.log('[survey-remind] (DEV MODE) Reminder to:', to);
    console.log('[survey-remind] Survey URL:', surveyUrl);
    return true;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EQPQIQ_FROM_EMAIL,
        to,
        subject: `Reminder: ${surveyTitle}`,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[survey-remind] Email failed:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[survey-remind] Email error:', error);
    return false;
  }
}

/**
 * POST /api/surveys/[surveyId]/remind
 * Send reminders to all non-complete respondents (or a specific respondent).
 * Body: { respondent_id?: string } -- if provided, remind only that respondent
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  try {
    const { surveyId } = await params;
    const body = await request.json().catch(() => ({}));
    const { respondent_id } = body as { respondent_id?: string };

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch survey
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', surveyId)
      .single();

    if (surveyError || !survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    if (survey.status !== 'active') {
      return NextResponse.json(
        { error: 'Can only send reminders for active surveys' },
        { status: 400 }
      );
    }

    // Fetch non-complete respondents
    let query = supabase
      .from('survey_respondents')
      .select('*')
      .eq('survey_id', surveyId)
      .neq('status', 'completed');

    if (respondent_id) {
      query = query.eq('id', respondent_id);
    }

    // Check max_reminders limit
    if (survey.max_reminders) {
      query = query.lt('reminder_count', survey.max_reminders);
    }

    const { data: respondents, error: respondentsError } = await query;

    if (respondentsError) {
      console.error('[survey-remind] Query error:', respondentsError);
      return NextResponse.json({ error: 'Failed to fetch respondents' }, { status: 500 });
    }

    if (!respondents || respondents.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No respondents need reminders',
        reminders_sent: 0,
      });
    }

    // For educator surveys, get per-faculty remaining counts
    let remainingCounts: Record<string, number> = {};
    if (survey.survey_type === 'educator_assessment') {
      const { data: progress } = await supabase
        .from('educator_survey_progress')
        .select('respondent_id, residents_remaining')
        .eq('survey_id', surveyId);

      if (progress) {
        remainingCounts = Object.fromEntries(
          progress.map(p => [p.respondent_id, p.residents_remaining])
        );
      }
    }

    // Send reminders
    let sent = 0;
    let failed = 0;

    for (const resp of respondents) {
      let contextMessage: string;

      if (survey.survey_type === 'educator_assessment') {
        const remaining = remainingCounts[resp.id] || 0;
        contextMessage = resp.status === 'started'
          ? `You have ${remaining} resident${remaining !== 1 ? 's' : ''} left to rate.`
          : 'You haven\'t started yet. It takes about 2-3 minutes per resident.';
      } else if (survey.survey_type === 'learner_self_assessment') {
        contextMessage = resp.status === 'started'
          ? 'You\'ve started your self-assessment but haven\'t finished. Your progress is saved.'
          : 'Please take a few minutes to complete your self-assessment.';
      } else {
        contextMessage = 'Please complete this survey at your earliest convenience.';
      }

      const success = await sendReminderEmail(
        resp.email,
        resp.name || '',
        survey.title,
        resp.token,
        survey.deadline,
        contextMessage,
      );

      if (success) {
        sent++;
        // Update reminder tracking
        await supabase
          .from('survey_respondents')
          .update({
            last_reminded_at: new Date().toISOString(),
            reminder_count: (resp.reminder_count || 0) + 1,
          })
          .eq('id', resp.id);
      } else {
        failed++;
      }
    }

    console.log(
      '[survey-remind] Survey',
      surveyId,
      '- Sent',
      sent,
      'reminders,',
      failed,
      'failed'
    );

    return NextResponse.json({
      success: true,
      reminders_sent: sent,
      reminders_failed: failed,
      total_incomplete: respondents.length,
    });
  } catch (error) {
    console.error('[survey-remind] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
