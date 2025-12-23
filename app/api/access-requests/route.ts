import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { notifyAdminOfNewRequest, notifyUserRequestReceived } from '@/lib/email/notifications';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// Use service key for public access (no auth required for submitting requests)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/access-requests
 * Submit a new access request (public - no auth required)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      personal_email,
      institutional_email,
      full_name,
      phone,
      requested_role,
      program_id,
      medical_school,
      specialty,
      reason,
    } = body;

    console.log('[AccessRequest] New request:', { personal_email, full_name, requested_role });

    // Validation
    if (!personal_email || !full_name) {
      return NextResponse.json(
        { error: 'Personal email and full name are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(personal_email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check for existing pending request with same email
    const { data: existingRequest } = await supabase
      .from('access_requests')
      .select('id, status')
      .eq('personal_email', personal_email.toLowerCase())
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending access request. We will review it shortly.' },
        { status: 400 }
      );
    }

    // Check if user already has an account
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id, email, personal_email')
      .or(`email.eq.${personal_email.toLowerCase()},personal_email.eq.${personal_email.toLowerCase()}`)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please login instead.' },
        { status: 400 }
      );
    }

    // Create the access request
    const { data: newRequest, error: insertError } = await supabase
      .from('access_requests')
      .insert({
        personal_email: personal_email.toLowerCase(),
        institutional_email: institutional_email?.toLowerCase() || null,
        full_name,
        phone: phone || null,
        requested_role: requested_role || 'resident',
        program_id: program_id || null,
        medical_school: medical_school || null,
        specialty: specialty || null,
        reason: reason || null,
        status: 'pending',
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[AccessRequest] Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to submit request. Please try again.' },
        { status: 500 }
      );
    }

    console.log('[AccessRequest] Created:', newRequest.id);

    // Send email notifications (fire and forget - don't block the response)
    Promise.all([
      notifyAdminOfNewRequest({
        id: newRequest.id,
        full_name,
        personal_email: personal_email.toLowerCase(),
        institutional_email: institutional_email?.toLowerCase(),
        requested_role: requested_role || 'resident',
        reason,
      }),
      notifyUserRequestReceived({
        full_name,
        personal_email: personal_email.toLowerCase(),
      }),
    ]).catch((err) => {
      console.error('[AccessRequest] Email notification error:', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Your access request has been submitted. You will receive a response within 24 hours.',
      request_id: newRequest.id,
    });
  } catch (error) {
    console.error('[AccessRequest] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/access-requests
 * List access requests (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    // Check for admin auth
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['super_admin', 'program_director'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query params
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch access requests
    let query = supabase
      .from('access_requests')
      .select(`
        *,
        program:programs(id, name, specialty),
        reviewer:user_profiles!access_requests_reviewed_by_fkey(id, full_name)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: requests, error: fetchError } = await query;

    if (fetchError) {
      console.error('[AccessRequest] Fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch requests' },
        { status: 500 }
      );
    }

    // Get count
    const { count } = await supabase
      .from('access_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', status === 'all' ? undefined : status);

    return NextResponse.json({
      requests,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[AccessRequest] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

