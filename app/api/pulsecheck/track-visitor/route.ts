import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { notifyDemoVisitor } from '@/lib/email/notifications';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { visitorId, email, isReturning } = body;

    // Get IP address from headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
    
    // Get user agent
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const timestamp = new Date().toISOString();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Store or update visitor in database
    if (!isReturning && email) {
      // New visitor - store their info
      const { error: insertError } = await supabase
        .from('pulsecheck_demo_visitors')
        .upsert({
          visitor_id: visitorId,
          email: email,
          ip_address: ip,
          user_agent: userAgent,
          first_visit: timestamp,
          last_visit: timestamp,
          visit_count: 1,
        }, {
          onConflict: 'visitor_id',
        });

      if (insertError) {
        console.error('[track-visitor] Insert error:', insertError);
      }
    } else if (isReturning && visitorId) {
      // Returning visitor - update last visit and increment count
      const { data: existingVisitor } = await supabase
        .from('pulsecheck_demo_visitors')
        .select('email, visit_count')
        .eq('visitor_id', visitorId)
        .single();

      if (existingVisitor) {
        await supabase
          .from('pulsecheck_demo_visitors')
          .update({
            last_visit: timestamp,
            visit_count: (existingVisitor.visit_count || 1) + 1,
            ip_address: ip,
          })
          .eq('visitor_id', visitorId);
      }
    }

    // Log the visit
    console.log('[track-visitor] Demo accessed:', {
      visitorId,
      email: email || 'returning visitor',
      ip,
      isReturning,
      timestamp,
    });

    // Send email notification via Resend
    try {
      await notifyDemoVisitor({
        email: email || null,
        visitorId,
        ip,
        isReturning,
        timestamp,
      });
    } catch (emailError) {
      console.error('[track-visitor] Email notification error:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[track-visitor] Error:', error);
    return NextResponse.json(
      { error: 'Failed to track visitor' },
      { status: 500 }
    );
  }
}
