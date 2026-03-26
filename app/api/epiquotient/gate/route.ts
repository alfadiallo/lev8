import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { notifyEpiqGateEntry } from '@/lib/email/notifications';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

/**
 * GET /api/epiquotient/gate?ip=...
 * Check if the visitor's IP already has a gate entry — skip the popup if so.
 */
export async function GET(request: NextRequest) {
  try {
    const ip = request.nextUrl.searchParams.get('ip');
    if (!ip) {
      return NextResponse.json({ gated: false });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data } = await supabase
      .from('eqpqiq_visitors')
      .select('id, full_name, email')
      .eq('ip_address', ip)
      .not('full_name', 'is', null)
      .limit(1)
      .maybeSingle();

    if (data) {
      return NextResponse.json({ gated: true, name: data.full_name });
    }

    return NextResponse.json({ gated: false });
  } catch (error) {
    console.error('[epiquotient/gate] GET error:', error);
    return NextResponse.json({ gated: false });
  }
}

/**
 * POST /api/epiquotient/gate
 * Submit name + email for the access gate. Stores in Supabase, sends notification.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email } = body as { name: string; email: string };

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const timestamp = new Date().toISOString();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const visitorId = crypto.randomUUID();

    const { error: insertError } = await supabase
      .from('eqpqiq_visitors')
      .upsert(
        {
          visitor_id: visitorId,
          full_name: name,
          email,
          ip_address: ip,
          user_agent: userAgent,
          first_visit: timestamp,
          last_visit: timestamp,
          visit_count: 1,
          first_page: '/epiquotient',
        },
        { onConflict: 'visitor_id' }
      );

    if (insertError) {
      console.error('[epiquotient/gate] Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }

    await supabase
      .from('eqpqiq_page_visits')
      .insert({ visitor_id: visitorId, page_path: '/epiquotient' });

    console.log('[epiquotient/gate] New gate entry:', { name, email, ip, timestamp });

    try {
      await notifyEpiqGateEntry({ name, email, ip, userAgent, timestamp });
    } catch (emailError) {
      console.error('[epiquotient/gate] Email notification error:', emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[epiquotient/gate] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
