import { NextRequest, NextResponse } from 'next/server';
import { checkApiPermission } from '@/lib/auth/checkApiPermission';
import { getServiceSupabaseClient } from '@/lib/supabase/server';

/**
 * PATCH /api/admin/users/[id]
 * Update a user's profile (admin only)
 */
export async function PATCH(
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
    const body = await req.json();

    // Allowable fields for update
    const {
      full_name,
      display_name,
      personal_email,
      institutional_email,
      phone,
      role,
      allowed_modules,
      account_status,
      specialty,
    } = body;

    // Build update object with only provided fields
    const updates: Record<string, unknown> = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (display_name !== undefined) updates.display_name = display_name;
    if (personal_email !== undefined) updates.personal_email = personal_email?.toLowerCase() || null;
    if (institutional_email !== undefined) updates.institutional_email = institutional_email?.toLowerCase() || null;
    if (phone !== undefined) updates.phone = phone || null;
    if (role !== undefined) updates.role = role;
    if (allowed_modules !== undefined) {
      updates.allowed_modules = Array.isArray(allowed_modules) && allowed_modules.length > 0
        ? allowed_modules
        : null;
    }
    if (account_status !== undefined) updates.account_status = account_status;
    if (specialty !== undefined) updates.specialty = specialty;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Check user exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id, role, full_name')
      .eq('id', id)
      .single();

    if (!existingProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user_profiles
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[UpdateUser] Profile update error:', updateError);
      return NextResponse.json(
        { error: `Failed to update profile: ${updateError.message}` },
        { status: 500 }
      );
    }

    // If role changed, handle role-specific table sync
    if (role && role !== existingProfile.role) {
      await syncRoleSpecificTables(supabase, id, existingProfile.role, role);
    }

    // Log admin activity
    await supabase.from('admin_activity_log').insert({
      admin_id: authResult.userId!,
      action: `Updated profile for ${existingProfile.full_name}`,
      action_type: 'user_updated',
      target_user_id: id,
      details: {
        changes: updates,
        previous_role: existingProfile.role,
      },
    });

    console.log('[UpdateUser] Updated:', id, updates);

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('[UpdateUser] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Sync role-specific tables (residents / faculty) when role changes.
 * Creates rows in the new role table if they don't exist.
 */
async function syncRoleSpecificTables(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  oldRole: string,
  newRole: string,
) {
  try {
    // Get institution & program
    const { data: institution } = await supabase
      .from('health_systems')
      .select('id')
      .limit(1)
      .single();

    if (!institution) return;

    const { data: program } = await supabase
      .from('programs')
      .select('id')
      .eq('health_system_id', institution.id)
      .limit(1)
      .single();

    if (!program) return;

    // If moving TO resident, ensure residents row exists
    if (newRole === 'resident') {
      const { data: existing } = await supabase
        .from('residents')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!existing) {
        const { data: classes } = await supabase
          .from('classes')
          .select('id')
          .limit(1)
          .single();

        if (classes) {
          await supabase.from('residents').insert({
            user_id: userId,
            program_id: program.id,
            class_id: classes.id,
          });
        }
      }
    }

    // If moving TO faculty/PD/APD/CD, ensure faculty row exists
    if (['faculty', 'program_director', 'assistant_program_director', 'clerkship_director'].includes(newRole)) {
      const { data: existing } = await supabase
        .from('faculty')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!existing) {
        await supabase.from('faculty').insert({
          user_id: userId,
          program_id: program.id,
          is_evaluator: true,
        });
      }
    }

    console.log('[UpdateUser] Role sync:', oldRole, '->', newRole, 'for user', userId);
  } catch (err) {
    console.error('[UpdateUser] syncRoleSpecificTables error:', err);
  }
}
