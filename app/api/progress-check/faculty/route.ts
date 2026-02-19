import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

interface UserProfileJoin {
  faculty_type: string | null;
  email: string;
  full_name: string;
  personal_email: string | null;
}

/**
 * GET /api/progress-check/faculty
 * List all faculty for a program (both active and inactive).
 * Query params: program_id (required)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('program_id');

    if (!programId) {
      return NextResponse.json({ error: 'program_id is required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: facultyRaw, error } = await supabase
      .from('faculty')
      .select('id, full_name, email, credentials, is_active, user_id')
      .eq('program_id', programId)
      .order('is_active', { ascending: false })
      .order('full_name');

    if (error) {
      console.error('[progress-check/faculty] List error:', error);
      return NextResponse.json({ error: 'Failed to fetch faculty' }, { status: 500 });
    }

    const userIds = (facultyRaw || [])
      .map((f: { user_id: string | null }) => f.user_id)
      .filter(Boolean) as string[];

    const profileMap = new Map<string, UserProfileJoin>();
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, faculty_type, email, full_name, personal_email')
        .in('id', userIds);
      for (const p of profiles || []) {
        profileMap.set(p.id, p as UserProfileJoin);
      }
    }

    const faculty = (facultyRaw || []).map((f: { id: string; full_name: string; email: string; credentials: string | null; is_active: boolean; user_id: string | null }) => {
      const profile = f.user_id ? profileMap.get(f.user_id) : null;
      return {
        id: f.id,
        user_id: f.user_id,
        full_name: f.full_name,
        email: f.email,
        credentials: f.credentials,
        is_active: f.is_active,
        faculty_type: profile?.faculty_type || 'core',
      };
    });

    return NextResponse.json({ faculty });
  } catch (error) {
    console.error('[progress-check/faculty] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/progress-check/faculty
 * Update a faculty member's is_active and/or faculty_type.
 * Body: { faculty_id, is_active?, faculty_type? }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { faculty_id, is_active, faculty_type } = body;

    if (!faculty_id) {
      return NextResponse.json({ error: 'faculty_id is required' }, { status: 400 });
    }

    if (is_active === undefined && faculty_type === undefined) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    if (faculty_type !== undefined && !['core', 'teaching'].includes(faculty_type)) {
      return NextResponse.json({ error: 'faculty_type must be "core" or "teaching"' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the faculty row to get user_id
    const { data: faculty, error: fetchError } = await supabase
      .from('faculty')
      .select('id, user_id')
      .eq('id', faculty_id)
      .single();

    if (fetchError || !faculty) {
      return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });
    }

    // Update is_active on the faculty table
    if (is_active !== undefined) {
      const { error: updateError } = await supabase
        .from('faculty')
        .update({ is_active })
        .eq('id', faculty_id);

      if (updateError) {
        console.error('[progress-check/faculty] Update is_active error:', updateError);
        return NextResponse.json({ error: 'Failed to update active status' }, { status: 500 });
      }
    }

    // Update faculty_type on user_profiles
    if (faculty_type !== undefined && faculty.user_id) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ faculty_type })
        .eq('id', faculty.user_id);

      if (profileError) {
        console.error('[progress-check/faculty] Update faculty_type error:', profileError);
        return NextResponse.json({ error: 'Failed to update faculty type' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[progress-check/faculty] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
