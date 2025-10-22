import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Cleanup a partially created user
 * POST with { "email": "user@example.com" }
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    console.log('[Cleanup] Starting cleanup for:', email);

    // Find the auth user
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    const authUser = users?.find(u => u.email === email);

    let userId: string | null = null;

    if (authUser) {
      console.log('[Cleanup] Found auth user:', authUser.id);
      userId = authUser.id;
    } else {
      console.log('[Cleanup] No auth user found, checking for orphaned profile...');
      
      // Check if there's an orphaned profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      
      if (profile) {
        console.log('[Cleanup] Found orphaned profile:', profile.id);
        userId = profile.id;
      } else {
        return NextResponse.json({ 
          message: 'No user or profile found with that email',
          cleaned: false 
        });
      }
    }

    // Delete from residents table
    const { error: residentError } = await supabase
      .from('residents')
      .delete()
      .eq('user_id', userId);
    
    if (residentError) {
      console.log('[Cleanup] Resident delete error (might not exist):', residentError.message);
    } else {
      console.log('[Cleanup] Resident record deleted');
    }

    // Delete from user_profiles table
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId);
    
    if (profileError) {
      console.log('[Cleanup] Profile delete error (might not exist):', profileError.message);
    } else {
      console.log('[Cleanup] Profile record deleted');
    }

    // Delete the auth user (if it exists)
    if (authUser) {
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId!);
      
      if (deleteAuthError) {
        console.error('[Cleanup] Auth user delete failed:', deleteAuthError);
      } else {
        console.log('[Cleanup] Auth user deleted');
      }
    }

    return NextResponse.json({
      success: true,
      message: `User ${email} completely removed. You can now register again.`,
      cleaned: true
    });
  } catch (error) {
    console.error('[Cleanup] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

