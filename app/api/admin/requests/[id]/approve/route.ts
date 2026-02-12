import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { notifyUserApproved } from '@/lib/email/notifications';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/admin/requests/[id]/approve
 * Approve an access request and create user account
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { admin_notes, role: overrideRole, allowed_modules } = body;

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

    console.log('[ApproveRequest] Admin:', adminProfile.full_name, 'Request:', id);

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

    // Get institution
    const { data: institution } = await supabase
      .from('health_systems')
      .select('id')
      .limit(1)
      .single();

    if (!institution) {
      return NextResponse.json(
        { error: 'No institution configured' },
        { status: 500 }
      );
    }

    // Create auth user with temporary password
    const tempPassword = generateTempPassword();
    
    // Use admin-selected role if provided, otherwise use the applicant's requested role
    const approvedRole = overrideRole || request.requested_role;

    const { data: authData, error: createAuthError } = await supabase.auth.admin.createUser({
      email: request.personal_email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: request.full_name,
        role: approvedRole,
      },
    });

    if (createAuthError) {
      console.error('[ApproveRequest] Auth create error:', createAuthError);
      return NextResponse.json(
        { error: `Failed to create auth user: ${createAuthError.message}` },
        { status: 500 }
      );
    }

    const newUserId = authData.user!.id;

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: newUserId,
        email: request.personal_email,
        personal_email: request.personal_email,
        institutional_email: request.institutional_email,
        full_name: request.full_name,
        display_name: request.full_name.split(' ')[0],
        phone: request.phone,
        role: approvedRole,
        allowed_modules: Array.isArray(allowed_modules) && allowed_modules.length > 0 ? allowed_modules : null,
        institution_id: institution.id,
        account_status: 'active',
        is_active: true,
        invited_by: adminProfile.id,
        invited_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error('[ApproveRequest] Profile create error:', profileError);
      // Try to clean up auth user
      await supabase.auth.admin.deleteUser(newUserId);
      return NextResponse.json(
        { error: `Failed to create profile: ${profileError.message}` },
        { status: 500 }
      );
    }

    // Create role-specific record (resident or faculty)
    if (approvedRole === 'resident') {
      // Find or create a class for the resident
      const { data: classes } = await supabase
        .from('classes')
        .select('id')
        .limit(1)
        .single();

      const { data: programs } = await supabase
        .from('programs')
        .select('id')
        .eq('health_system_id', institution.id)
        .limit(1)
        .single();

      if (programs && classes) {
        await supabase.from('residents').insert({
          user_id: newUserId,
          program_id: request.program_id || programs.id,
          class_id: classes.id,
          medical_school: request.medical_school,
          specialty: request.specialty,
        });
      }
    } else if (['faculty', 'program_director', 'assistant_program_director', 'clerkship_director'].includes(approvedRole)) {
      const { data: programs } = await supabase
        .from('programs')
        .select('id')
        .eq('health_system_id', institution.id)
        .limit(1)
        .single();

      if (programs) {
        await supabase.from('faculty').insert({
          user_id: newUserId,
          program_id: request.program_id || programs.id,
          is_evaluator: true,
        });
      }
    }

    // Update access request status
    await supabase
      .from('access_requests')
      .update({
        status: 'approved',
        reviewed_by: adminProfile.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: admin_notes || null,
        created_user_id: newUserId,
      })
      .eq('id', id);

    // Log admin activity
    await supabase.from('admin_activity_log').insert({
      admin_id: adminProfile.id,
      action: `Approved access request for ${request.full_name}`,
      action_type: 'request_approved',
      target_user_id: newUserId,
      target_request_id: id,
      details: {
        email: request.personal_email,
        role: approvedRole,
        allowed_modules: allowed_modules || null,
      },
    });

    // Generate password reset link with app redirect so user lands on /update-password (avoids token/link issues)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lev8.ai';
    const redirectTo = `${appUrl}/update-password`;
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: request.personal_email,
      options: { redirectTo },
    });

    if (linkError) {
      console.error('[ApproveRequest] generateLink error:', linkError);
    }

    const resetLink = linkData?.properties?.action_link;
    if (!resetLink) {
      console.error('[ApproveRequest] No action_link in generateLink response; user should use Forgot Password on login page.');
    }

    // Send welcome email with password setup link (or fallback to login if link missing)
    notifyUserApproved({
      full_name: request.full_name,
      email: request.personal_email,
      reset_link: resetLink || undefined,
    }).catch((err) => {
      console.error('[ApproveRequest] Email notification error:', err);
    });

    console.log('[ApproveRequest] Success:', newUserId);

    return NextResponse.json({
      success: true,
      user_id: newUserId,
      message: `Account created for ${request.full_name}. Welcome email sent.`,
    });
  } catch (error) {
    console.error('[ApproveRequest] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

