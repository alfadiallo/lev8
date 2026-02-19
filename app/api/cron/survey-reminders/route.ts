import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const CRON_SECRET = process.env.CRON_SECRET;

const EQPQIQ_FROM_EMAIL = process.env.PULSECHECK_FROM_EMAIL || 'EQ·PQ·IQ <noreply@eqpqiq.com>';
const EQPQIQ_BASE_URL = process.env.EQPQIQ_BASE_URL || 'https://eqpqiq.com';
const RESEND_API_KEY = process.env.RESEND_API_KEY;

/**
 * GET /api/cron/survey-reminders
 * Vercel Cron Job: sends automated reminders for active surveys.
 * Runs daily. For each active survey with auto_remind = true,
 * finds pending/started respondents and sends reminders if:
 *   - reminder_count < max_reminders
 *   - last_reminded_at is older than remind_every_days
 *
 * Secured via CRON_SECRET header (Vercel sets this automatically).
 */
export async function GET(request: NextRequest) {
  // Verify cron secret -- fail closed if not configured
  const authHeader = request.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    console.error('[cron-reminders] Unauthorized: missing or invalid CRON_SECRET');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const now = new Date();
  let totalSent = 0;
  let totalFailed = 0;
  let surveysProcessed = 0;

  try {
    // Fetch active surveys with auto_remind enabled
    const { data: surveys, error: surveyError } = await supabase
      .from('surveys')
      .select('id, title, survey_type, deadline, auto_remind, remind_every_days, max_reminders')
      .eq('status', 'active')
      .eq('auto_remind', true);

    if (surveyError) {
      console.error('[cron-reminders] Error fetching surveys:', surveyError);
      return NextResponse.json({ error: 'Failed to fetch surveys' }, { status: 500 });
    }

    if (!surveys || surveys.length === 0) {
      return NextResponse.json({ message: 'No active surveys with auto-remind', sent: 0 });
    }

    for (const survey of surveys) {
      // Skip if deadline has passed
      if (survey.deadline && new Date(survey.deadline) < now) {
        continue;
      }

      const remindEveryDays = survey.remind_every_days || 3;
      const maxReminders = survey.max_reminders || 5;
      const cutoff = new Date(now.getTime() - remindEveryDays * 24 * 60 * 60 * 1000);

      // Find respondents who need reminding
      const { data: pendingRespondents } = await supabase
        .from('survey_respondents')
        .select('id, email, name, token, reminder_count, last_reminded_at')
        .eq('survey_id', survey.id)
        .in('status', ['pending', 'started'])
        .lt('reminder_count', maxReminders)
        .or(`last_reminded_at.is.null,last_reminded_at.lt.${cutoff.toISOString()}`);

      if (!pendingRespondents || pendingRespondents.length === 0) continue;

      surveysProcessed++;

      for (const resp of pendingRespondents) {
        const success = await sendReminderEmail(
          resp.email,
          resp.name || '',
          survey.title,
          resp.token,
          survey.deadline,
        );

        if (success) {
          totalSent++;
          await supabase
            .from('survey_respondents')
            .update({
              reminder_count: (resp.reminder_count || 0) + 1,
              last_reminded_at: now.toISOString(),
            })
            .eq('id', resp.id);
        } else {
          totalFailed++;
        }
      }
    }

    const result = {
      success: true,
      surveys_processed: surveysProcessed,
      reminders_sent: totalSent,
      reminders_failed: totalFailed,
      timestamp: now.toISOString(),
    };

    console.log('[cron-reminders]', JSON.stringify(result));

    if (totalFailed > 0) {
      console.warn('[cron-reminders] ALERT:', totalFailed, 'email(s) failed to send');
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[cron-reminders] FATAL:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function sendReminderEmail(
  to: string,
  name: string,
  surveyTitle: string,
  token: string,
  deadline: string | null,
): Promise<boolean> {
  const surveyUrl = `${EQPQIQ_BASE_URL}/survey/${token}`;

  const deadlineText = deadline
    ? `<p style="color: #dc2626; margin: 12px 0; font-size: 14px;">
         <strong>Deadline:</strong> ${new Date(deadline).toLocaleDateString('en-US', {
           weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
         })}
       </p>`
    : '';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #1a1a1a; margin: 0;">Reminder: EQ·PQ·IQ Evaluation</h2>
      </div>
      
      <p style="color: #333; font-size: 16px; line-height: 1.6;">
        Hi ${name || 'there'},
      </p>
      
      <p style="color: #333; font-size: 16px; line-height: 1.6;">
        This is a friendly reminder to complete your evaluation: <strong>${surveyTitle}</strong>
      </p>
      
      <p style="color: #555; font-size: 14px; line-height: 1.6;">
        Your input is important for tracking resident development. 
        The survey saves your progress automatically — you can pick up where you left off.
      </p>
      
      ${deadlineText}
      
      <div style="text-align: center; margin: 28px 0;">
        <a href="${surveyUrl}" 
           style="display: inline-block; padding: 14px 32px; background: #2563eb; color: white; 
                  text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
          Continue Survey
        </a>
      </div>
      
      <p style="color: #666; font-size: 13px; line-height: 1.5;">
        This link is unique to you. If you've already completed the survey, please disregard this message.
      </p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      
      <p style="color: #999; font-size: 12px; text-align: center;">
        EQ·PQ·IQ by <a href="https://eqpqiq.com" style="color: #999;">eqpqiq.com</a>
      </p>
    </div>
  `;

  if (!RESEND_API_KEY) {
    console.log('[cron-reminders] (DEV MODE) Reminder to:', to, '| Survey:', surveyUrl);
    return true;
  }

  const MAX_RETRIES = 2;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
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

      if (response.ok) return true;

      const err = await response.json().catch(() => ({ message: response.statusText }));
      console.error('[cron-reminders] Email failed for', to, `(attempt ${attempt + 1}):`, err);

      // Don't retry 4xx errors (bad request, auth, etc.)
      if (response.status >= 400 && response.status < 500) return false;
    } catch (err) {
      console.error('[cron-reminders] Email error for', to, `(attempt ${attempt + 1}):`, err);
    }

    if (attempt < MAX_RETRIES) {
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  return false;
}
