import { NextRequest, NextResponse } from 'next/server';
import { checkApiPermission } from '@/lib/auth/checkApiPermission';
import { getServiceSupabaseClient } from '@/lib/supabase/server';
import { notifyUserApproved } from '@/lib/email/notifications';

/**
 * POST /api/admin/users/[id]/resend-invite
 * Send a password reset / welcome email for an existing user
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authResult = await checkApiPermission(req, {
      requiredRoles: ['super_admin', 'program_director']
    });
    if (!authResult.authorized) {
      return authResult.response!;
    }

    const supabase = getServiceSupabaseClient();

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, personal_email')
      .eq('id', id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const email = profile.personal_email || profile.email;

    // Generate recovery link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lev8.ai';
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: `${appUrl}/update-password` },
    });

    if (linkError) {
      console.error('[ResendInviteUser] generateLink error:', linkError);
    }

    const resetLink = linkData?.properties?.action_link;

    // Send email
    await notifyUserApproved({
      full_name: profile.full_name || 'User',
      email,
      reset_link: resetLink || undefined,
    });

    // Log activity
    await supabase.from('admin_activity_log').insert({
      admin_id: authResult.userId!,
      action: `Sent password reset email for ${profile.full_name}`,
      action_type: 'password_reset',
      target_user_id: id,
      details: { email },
    });

    console.log('[ResendInviteUser] Sent to:', email);

    return NextResponse.json({
      success: true,
      message: `Password reset email sent to ${email}.`,
    });
  } catch (error) {
    console.error('[ResendInviteUser] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
