import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { notifyEqpqiqVisitor } from '@/lib/email/notifications';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { visitorId, email, page, isReturning } = body as {
      visitorId: string;
      email?: string;
      page: string;
      isReturning: boolean;
    };

    // Extract metadata
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const timestamp = new Date().toISOString();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let visitCount = 1;
    let visitorEmail = email || '';

    if (!isReturning && email) {
      // ----- New visitor -----
      const { error: insertError } = await supabase
        .from('eqpqiq_visitors')
        .upsert(
          {
            visitor_id: visitorId,
            email,
            ip_address: ip,
            user_agent: userAgent,
            first_visit: timestamp,
            last_visit: timestamp,
            visit_count: 1,
            first_page: page,
          },
          { onConflict: 'visitor_id' }
        );

      if (insertError) {
        console.error('[eqpqiq/track-visitor] Insert error:', insertError);
      }

      // Log the page visit
      const { error: visitError } = await supabase
        .from('eqpqiq_page_visits')
        .insert({ visitor_id: visitorId, page_path: page });

      if (visitError) {
        console.error('[eqpqiq/track-visitor] Page visit insert error:', visitError);
      }
    } else if (isReturning && visitorId) {
      // ----- Returning visitor -----
      const { data: existingVisitor } = await supabase
        .from('eqpqiq_visitors')
        .select('email, visit_count')
        .eq('visitor_id', visitorId)
        .single();

      if (existingVisitor) {
        visitCount = (existingVisitor.visit_count || 1) + 1;
        visitorEmail = existingVisitor.email || '';

        await supabase
          .from('eqpqiq_visitors')
          .update({
            last_visit: timestamp,
            visit_count: visitCount,
            ip_address: ip,
          })
          .eq('visitor_id', visitorId);
      }

      // Log the page visit
      const { error: visitError } = await supabase
        .from('eqpqiq_page_visits')
        .insert({ visitor_id: visitorId, page_path: page });

      if (visitError) {
        console.error('[eqpqiq/track-visitor] Page visit insert error:', visitError);
      }
    }

    console.log('[eqpqiq/track-visitor] Tracked:', {
      visitorId,
      email: visitorEmail || 'returning visitor',
      page,
      ip,
      isReturning,
      timestamp,
    });

    // Send email notification
    try {
      await notifyEqpqiqVisitor({
        email: visitorEmail,
        visitorId,
        page,
        ip,
        userAgent,
        isReturning,
        visitCount,
        timestamp,
      });
    } catch (emailError) {
      console.error('[eqpqiq/track-visitor] Email notification error:', emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[eqpqiq/track-visitor] Error:', error);
    return NextResponse.json(
      { error: 'Failed to track visitor' },
      { status: 500 }
    );
  }
}
