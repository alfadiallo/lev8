import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const EQPQIQ_FROM_EMAIL = process.env.PULSECHECK_FROM_EMAIL || 'EQ·PQ·IQ <noreply@eqpqiq.com>';
const EQPQIQ_BASE_URL = process.env.EQPQIQ_BASE_URL || 'https://www.eqpqiq.com';
const RESEND_API_KEY = process.env.RESEND_API_KEY;

interface Respondent {
  email: string;
  name?: string;
  phone?: string;
  role: 'resident' | 'faculty';
  rater_type?: 'core_faculty' | 'teaching_faculty' | 'self';
  user_profile_id?: string;
  resident_id?: string;
  guidance_min?: number;
}

async function sendSurveyInviteEmail(
  to: string,
  name: string,
  surveyTitle: string,
  surveyType: string,
  token: string,
  deadline: string | null,
  extraContext?: string,
): Promise<boolean> {
  const surveyUrl = `${EQPQIQ_BASE_URL}/survey/${token}`;

  const typeLabel = surveyType === 'learner_self_assessment'
    ? 'Self-Assessment'
    : surveyType === 'educator_assessment'
      ? 'Resident Evaluation'
      : 'Survey';

  const deadlineText = deadline
    ? `<p style="margin: 16px 0;"><strong>Deadline:</strong> ${new Date(deadline).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>`
    : '';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h2 style="color: #1a1a1a; margin: 0;">EQ·PQ·IQ ${typeLabel}</h2>
      </div>
      
      <p style="color: #333; font-size: 16px; line-height: 1.6;">
        Hi ${name || 'there'},
      </p>
      
      <p style="color: #333; font-size: 16px; line-height: 1.6;">
        You've been invited to complete: <strong>${surveyTitle}</strong>
      </p>
      
      ${extraContext ? `<p style="color: #555; font-size: 14px; line-height: 1.6;">${extraContext}</p>` : ''}
      
      ${deadlineText}
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${surveyUrl}" 
           style="display: inline-block; padding: 14px 32px; background: #40916C; color: white; 
                  text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
          Open Survey
        </a>
      </div>
      
      <p style="color: #666; font-size: 13px; line-height: 1.5;">
        This link is unique to you. You can save your progress and return at any time.
      </p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      
      <p style="color: #999; font-size: 12px; text-align: center;">
        EQ·PQ·IQ by <a href="https://eqpqiq.com" style="color: #999;">eqpqiq.com</a>
      </p>
    </div>
  `;

  if (!RESEND_API_KEY) {
    console.log('[survey-distribute] (DEV MODE) Email to:', to);
    console.log('[survey-distribute] Survey URL:', surveyUrl);
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
        subject: `${typeLabel}: ${surveyTitle}`,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[survey-distribute] Email failed:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[survey-distribute] Email error:', error);
    return false;
  }
}

/**
 * POST /api/surveys/[surveyId]/distribute
 * Generate tokens for respondents and send invitation emails.
 * Body: { respondents: [{ email, name?, phone?, role, user_profile_id?, resident_id? }] }
 * 
 * For educator_assessment surveys, also creates survey_resident_assignments
 * linking each faculty to the residents they need to rate.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  try {
    const { surveyId } = await params;
    const body = await request.json();
    const { respondents, send_emails = true } = body as {
      respondents: Respondent[];
      send_emails?: boolean;
    };

    if (!respondents || !Array.isArray(respondents) || respondents.length === 0) {
      return NextResponse.json(
        { error: 'respondents array is required and must not be empty' },
        { status: 400 }
      );
    }

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

    // Resolve user_profile_id for deduplication (dual email support)
    const resolveProfileId = async (email: string): Promise<string | null> => {
      const normalizedEmail = email.toLowerCase();
      const { data } = await supabase
        .from('user_profiles')
        .select('id')
        .or(`email.eq.${normalizedEmail},personal_email.eq.${normalizedEmail},institutional_email.eq.${normalizedEmail}`)
        .limit(1)
        .single();
      return data?.id || null;
    };

    // Insert respondents (tokens auto-generated by DB default)
    const respondentRows = await Promise.all(respondents.map(async r => {
      const profileId = r.user_profile_id || await resolveProfileId(r.email);
      return {
        survey_id: surveyId,
        email: r.email.toLowerCase(),
        name: r.name || null,
        phone: r.phone || null,
        role: r.role,
        rater_type: r.rater_type || null,
        guidance_min: r.rater_type === 'teaching_faculty' ? (r.guidance_min ?? 3) : null,
        user_profile_id: profileId,
        status: 'pending' as const,
      };
    }));

    const { data: insertedRespondents, error: insertError } = await supabase
      .from('survey_respondents')
      .upsert(respondentRows, { onConflict: 'survey_id,email' })
      .select();

    if (insertError) {
      console.error('[survey-distribute] Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create respondents' }, { status: 500 });
    }

    // For educator surveys: create resident assignments
    if (survey.survey_type === 'educator_assessment' && survey.class_id) {
      const { data: residents } = await supabase
        .from('residents')
        .select('id, user_id')
        .eq('class_id', survey.class_id);

      if (residents && residents.length > 0 && insertedRespondents) {
        const facultyRespondents = insertedRespondents.filter(r => r.role === 'faculty');
        const assignments = [];

        for (const fac of facultyRespondents) {
          const isTeaching = fac.rater_type === 'teaching_faculty';
          for (let i = 0; i < residents.length; i++) {
            assignments.push({
              survey_id: surveyId,
              respondent_id: fac.id,
              resident_id: residents[i].id,
              status: 'pending' as const,
              display_order: i,
              required: !isTeaching,
            });
          }
        }

        if (assignments.length > 0) {
          const { error: assignError } = await supabase
            .from('survey_resident_assignments')
            .upsert(assignments, {
              onConflict: 'survey_id,respondent_id,resident_id',
            });

          if (assignError) {
            console.error('[survey-distribute] Assignment error:', assignError);
          }
        }

        console.log(
          '[survey-distribute] Created',
          assignments.length,
          'resident assignments for',
          facultyRespondents.length,
          'faculty across',
          residents.length,
          'residents'
        );
      }
    }

    // For learner surveys: link respondents to their own resident record
    if (survey.survey_type === 'learner_self_assessment' && insertedRespondents) {
      for (const resp of insertedRespondents) {
        if (resp.role === 'resident') {
          // Look up resident by email -> profile -> resident record
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('id')
            .or(`email.eq.${resp.email},personal_email.eq.${resp.email}`)
            .limit(1)
            .maybeSingle();

          const { data: resident } = profile?.id
            ? await supabase
                .from('residents')
                .select('id, user_id')
                .eq('user_id', profile.id)
                .maybeSingle()
            : { data: null };

          if (resident) {
            // Create a self-assignment for tracking
            await supabase
              .from('survey_resident_assignments')
              .upsert({
                survey_id: surveyId,
                respondent_id: resp.id,
                resident_id: resident.id,
                status: 'pending',
                display_order: 0,
              }, { onConflict: 'survey_id,respondent_id,resident_id' });
          }
        }
      }
    }

    // Send invitation emails
    let emailsSent = 0;
    let emailsFailed = 0;

    if (send_emails && insertedRespondents) {
      for (const resp of insertedRespondents) {
        let extraContext: string | undefined;
        if (resp.rater_type === 'self') {
          extraContext = 'Please complete your self-assessment of your Emotional Quotient (EQ), Professionalism Quotient (PQ), and Intellectual Quotient (IQ).</p><p style="color: #555; font-size: 14px; line-height: 1.6;">Thank you for taking the time to do this — it\'s extremely valuable!';
        } else if (resp.rater_type === 'core_faculty') {
          extraContext = 'Please rate each resident in the class on their Emotional Quotient (EQ), Professionalism Quotient (PQ), and Intellectual Quotient (IQ).</p><p style="color: #555; font-size: 14px; line-height: 1.6;">Thank you for taking the time to do this — it\'s extremely valuable!';
        } else if (resp.rater_type === 'teaching_faculty') {
          extraContext = 'Please rate the residents you\'ve worked with on their Emotional Quotient (EQ), Professionalism Quotient (PQ), and Intellectual Quotient (IQ).</p><p style="color: #555; font-size: 14px; line-height: 1.6;">We recommend evaluating at least 3 residents you\'ve worked with in the last 60 days.</p><p style="color: #555; font-size: 14px; line-height: 1.6;">Thank you for taking the time to do this — it\'s extremely valuable!';
        } else if (survey.survey_type === 'educator_assessment') {
          extraContext = 'Please rate each resident on their Emotional Quotient (EQ), Professionalism Quotient (PQ), and Intellectual Quotient (IQ).</p><p style="color: #555; font-size: 14px; line-height: 1.6;">Thank you for taking the time to do this — it\'s extremely valuable!';
        } else if (survey.survey_type === 'learner_self_assessment') {
          extraContext = 'Please complete your self-assessment of your Emotional Quotient (EQ), Professionalism Quotient (PQ), and Intellectual Quotient (IQ).</p><p style="color: #555; font-size: 14px; line-height: 1.6;">Thank you for taking the time to do this — it\'s extremely valuable!';
        }

        const success = await sendSurveyInviteEmail(
          resp.email,
          resp.name || '',
          survey.title,
          survey.survey_type,
          resp.token,
          survey.deadline,
          extraContext,
        );

        if (success) emailsSent++;
        else emailsFailed++;
      }
    }

    // Update survey status to active if it was draft
    if (survey.status === 'draft') {
      await supabase
        .from('surveys')
        .update({ status: 'active' })
        .eq('id', surveyId);
    }

    console.log(
      '[survey-distribute] Survey',
      surveyId,
      '- Distributed to',
      insertedRespondents?.length || 0,
      'respondents,',
      emailsSent,
      'emails sent,',
      emailsFailed,
      'failed'
    );

    return NextResponse.json({
      success: true,
      respondents_created: insertedRespondents?.length || 0,
      emails_sent: emailsSent,
      emails_failed: emailsFailed,
    });
  } catch (error) {
    console.error('[survey-distribute] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
