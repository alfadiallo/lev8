import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { notifyUserRejected } from '@/lib/email/notifications';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/admin/requests/[id]/reject
 * Reject an access request
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { admin_notes } = body;

    // Authenticate admin
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminProfile } = await supabase
      .from('user_profiles')
      .select('id, role, full_name')
      .eq('id', authUser.id)
      .single();

    if (!adminProfile || !['super_admin', 'program_director'].includes(adminProfile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('[RejectRequest] Admin:', adminProfile.full_name, 'Request:', id);

    // Fetch the access request
    const { data: request, error: fetchError } = await supabase
      .from('access_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (request.status !== 'pending') {
      return NextResponse.json(
        { error: `Request already ${request.status}` },
        { status: 400 }
      );
    }

    // Update access request status
    await supabase
      .from('access_requests')
      .update({
        status: 'rejected',
        reviewed_by: adminProfile.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: admin_notes || null,
      })
      .eq('id', id);

    // Log admin activity
    await supabase.from('admin_activity_log').insert({
      admin_id: adminProfile.id,
      action: `Rejected access request for ${request.full_name}`,
      action_type: 'request_rejected',
      target_request_id: id,
      details: {
        email: request.personal_email,
        reason: admin_notes || 'No reason provided',
      },
    });

    // Send rejection email (optional - can be disabled)
    notifyUserRejected({
      full_name: request.full_name,
      email: request.personal_email,
      reason: admin_notes,
    }).catch((err) => {
      console.error('[RejectRequest] Email notification error:', err);
    });

    console.log('[RejectRequest] Success');

    return NextResponse.json({
      success: true,
      message: `Access request for ${request.full_name} has been rejected.`,
    });
  } catch (error) {
    console.error('[RejectRequest] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

