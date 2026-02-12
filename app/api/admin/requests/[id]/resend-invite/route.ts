import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { notifyUserApproved } from '@/lib/email/notifications';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/admin/requests/[id]/resend-invite
 * Re-send the welcome/password-set email for an approved access request
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Fetch the access request
    const { data: request, error: fetchError } = await supabase
      .from('access_requests')
      .select('id, status, personal_email, full_name, created_user_id')
      .eq('id', id)
      .single();

    if (fetchError || !request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (request.status !== 'approved' || !request.created_user_id) {
      return NextResponse.json(
        { error: 'Can only resend invite for approved requests with a created user' },
        { status: 400 }
      );
    }

    // Generate new recovery link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lev8.ai';
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: request.personal_email,
      options: { redirectTo: `${appUrl}/update-password` },
    });

    if (linkError) {
      console.error('[ResendInvite] generateLink error:', linkError);
    }

    const resetLink = linkData?.properties?.action_link;

    // Send welcome/password-set email
    await notifyUserApproved({
      full_name: request.full_name,
      email: request.personal_email,
      reset_link: resetLink || undefined,
    });

    // Log activity
    await supabase.from('admin_activity_log').insert({
      admin_id: adminProfile.id,
      action: `Re-sent invite for ${request.full_name}`,
      action_type: 'password_reset',
      target_user_id: request.created_user_id,
      target_request_id: id,
      details: { email: request.personal_email },
    });

    console.log('[ResendInvite] Sent to:', request.personal_email);

    return NextResponse.json({
      success: true,
      message: `Invite re-sent to ${request.personal_email}.`,
    });
  } catch (error) {
    console.error('[ResendInvite] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
