import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/admin/users/[id]/suspend
 * Suspend a user account
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

    // Prevent self-suspension
    if (id === adminProfile.id) {
      return NextResponse.json(
        { error: 'Cannot suspend your own account' },
        { status: 400 }
      );
    }

    // Fetch the user
    const { data: targetUser, error: fetchError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, account_status')
      .eq('id', id)
      .single();

    if (fetchError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.account_status === 'suspended') {
      return NextResponse.json(
        { error: 'User is already suspended' },
        { status: 400 }
      );
    }

    console.log('[SuspendUser] Admin:', adminProfile.full_name, 'Suspending:', targetUser.full_name);

    // Update user status
    await supabase
      .from('user_profiles')
      .update({
        account_status: 'suspended',
        is_active: false,
      })
      .eq('id', id);

    // Revoke all sessions for the user
    // Note: This requires the service key
    await supabase.auth.admin.updateUserById(id, {
      ban_duration: '876000h', // ~100 years, effectively permanent until reactivated
    });

    // Log admin activity
    await supabase.from('admin_activity_log').insert({
      admin_id: adminProfile.id,
      action: `Suspended user account: ${targetUser.full_name}`,
      action_type: 'user_suspended',
      target_user_id: id,
      details: {
        email: targetUser.email,
      },
    });

    console.log('[SuspendUser] Success');

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.full_name} has been suspended.`,
    });
  } catch (error) {
    console.error('[SuspendUser] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



