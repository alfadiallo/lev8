import { NextRequest, NextResponse } from 'next/server';
import { checkApiPermission } from '@/lib/auth/checkApiPermission';
import { getServiceSupabaseClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/users
 * Create a new user account (admin only)
 */
export async function POST(req: NextRequest) {
  try {
    // Require admin role
    const authResult = await checkApiPermission(req, {
      requiredRoles: ['super_admin', 'program_director']
    });
    if (!authResult.authorized) {
      return authResult.response!;
    }

    // Use service role client for admin operations (bypasses RLS)
    const supabase = getServiceSupabaseClient();

    const body = await req.json();
    const {
      full_name,
      personal_email,
      institutional_email,
      phone,
      role,
      send_invite,
    } = body;

    // Validation
    if (!full_name || !personal_email || !role) {
      return NextResponse.json(
        { error: 'Full name, personal email, and role are required' },
        { status: 400 }
      );
    }

    console.log('[CreateUser] Admin:', adminProfile.full_name, 'Creating:', personal_email);

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id')
      .or(`email.eq.${personal_email.toLowerCase()},personal_email.eq.${personal_email.toLowerCase()}`)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
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

    // Create auth user
    const tempPassword = generateTempPassword();
    
    const { data: authData, error: createAuthError } = await supabase.auth.admin.createUser({
      email: personal_email.toLowerCase(),
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name,
        role,
      },
    });

    if (createAuthError) {
      console.error('[CreateUser] Auth create error:', createAuthError);
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
        email: personal_email.toLowerCase(),
        personal_email: personal_email.toLowerCase(),
        institutional_email: institutional_email?.toLowerCase() || null,
        full_name,
        display_name: full_name.split(' ')[0],
        phone: phone || null,
        role,
        institution_id: institution.id,
        account_status: 'active',
        is_active: true,
        invited_by: adminProfile.id,
        invited_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error('[CreateUser] Profile create error:', profileError);
      // Try to clean up auth user
      await supabase.auth.admin.deleteUser(newUserId);
      return NextResponse.json(
        { error: `Failed to create profile: ${profileError.message}` },
        { status: 500 }
      );
    }

    // Create role-specific record
    const { data: programs } = await supabase
      .from('programs')
      .select('id')
      .eq('health_system_id', institution.id)
      .limit(1)
      .single();

    if (role === 'resident' && programs) {
      const { data: classes } = await supabase
        .from('classes')
        .select('id')
        .limit(1)
        .single();

      if (classes) {
        await supabase.from('residents').insert({
          user_id: newUserId,
          program_id: programs.id,
          class_id: classes.id,
        });
      }
    } else if (['faculty', 'program_director'].includes(role) && programs) {
      await supabase.from('faculty').insert({
        user_id: newUserId,
        program_id: programs.id,
        is_evaluator: true,
      });
    }

    // Log admin activity
    await supabase.from('admin_activity_log').insert({
      admin_id: adminProfile.id,
      action: `Created user account for ${full_name}`,
      action_type: 'user_created',
      target_user_id: newUserId,
      details: {
        email: personal_email,
        role,
        send_invite,
      },
    });

    // Send password reset email if requested
    if (send_invite) {
      await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: personal_email.toLowerCase(),
      });
    }

    console.log('[CreateUser] Success:', newUserId);

    return NextResponse.json({
      success: true,
      user_id: newUserId,
      message: `User ${full_name} created successfully.${send_invite ? ' Invite email sent.' : ''}`,
    });
  } catch (error) {
    console.error('[CreateUser] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/users
 * List all users (admin only)
 */
export async function GET(req: NextRequest) {
  try {
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
      .select('role')
      .eq('id', authUser.id)
      .single();

    if (!adminProfile || !['super_admin', 'program_director'].includes(adminProfile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query params
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('user_profiles')
      .select(`
        *,
        institution:health_systems(id, name)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (role) {
      query = query.eq('role', role);
    }

    if (status) {
      query = query.eq('account_status', status);
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,personal_email.ilike.%${search}%`);
    }

    const { data: users, error: fetchError } = await query;

    if (fetchError) {
      console.error('[ListUsers] Fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      users: users || [],
      limit,
      offset,
    });
  } catch (error) {
    console.error('[ListUsers] Error:', error);
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

