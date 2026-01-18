import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkAccess } from '@/lib/stripe/subscription';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Generate a random share token
function generateShareToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 8; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get sessions created by this email
    const { data: sessions, error } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('creator_email', email.toLowerCase())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[sessions] GET error:', error);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('[sessions] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      session_name, 
      session_date, 
      creator_email, 
      session_type = 'individual',
      program_id = null,
    } = body;

    if (!session_name) {
      return NextResponse.json({ error: 'Session name is required' }, { status: 400 });
    }

    if (!creator_email) {
      return NextResponse.json({ error: 'Creator email is required' }, { status: 400 });
    }

    // Check access for group sessions
    if (session_type === 'group') {
      const accessResult = await checkAccess(creator_email, 'group');
      
      if (!accessResult.hasAccess) {
        return NextResponse.json(
          { 
            error: 'Subscription required',
            message: 'Group sessions require an active subscription. Start your 14-day free trial.',
            reason: accessResult.reason,
          },
          { status: 403 }
        );
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if creator is a lev8 user
    const { data: user } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', creator_email.toLowerCase())
      .single();

    // Create the session
    const { data: session, error } = await supabase
      .from('interview_sessions')
      .insert({
        session_name,
        session_date: session_date || null,
        creator_email: creator_email.toLowerCase(),
        created_by_user_id: user?.id || null,
        session_type,
        program_id,
        share_token: generateShareToken(),
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('[sessions] POST error:', error);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('[sessions] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
