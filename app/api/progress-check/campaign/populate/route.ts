import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

interface FacultyRow {
  id: string;
  full_name: string;
  email: string;
  credentials: string | null;
  is_active: boolean;
  user_id: string;
  faculty_type: string;
  site: string | null;
}

/**
 * GET /api/progress-check/campaign/populate
 * Returns classes, faculty (with types), and residents for the campaign wizard.
 * Query params:
 *   - program_id (required)
 *   - class_id (optional) - if provided, returns residents for that class
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('program_id');
    const classId = searchParams.get('class_id');

    if (!programId) {
      return NextResponse.json({ error: 'program_id is required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch active classes for the program
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('id, graduation_year, name, is_active')
      .eq('program_id', programId)
      .eq('is_active', true)
      .order('graduation_year', { ascending: true });

    if (classesError) {
      console.error('[campaign-populate] Classes error:', classesError);
      return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
    }

    // Fetch faculty with type and site directly from faculty table
    const { data: facultyRaw, error: facultyError } = await supabase
      .from('faculty')
      .select('id, full_name, email, credentials, is_active, user_id, faculty_type, site')
      .eq('program_id', programId)
      .eq('is_active', true)
      .order('full_name');

    if (facultyError) {
      console.error('[campaign-populate] Faculty error:', facultyError);
      return NextResponse.json({ error: 'Failed to fetch faculty' }, { status: 500 });
    }

    const faculty = (facultyRaw || []).map((f: FacultyRow) => ({
      id: f.id,
      user_id: f.user_id,
      full_name: f.full_name,
      email: f.email,
      credentials: f.credentials,
      faculty_type: f.faculty_type || 'core',
      site: f.site || null,
      personal_email: null,
    }));

    // Fetch residents for a specific class (if class_id provided)
    let residents: Array<{
      id: string;
      full_name: string;
      email: string;
      personal_email: string | null;
      class_id: string;
    }> = [];

    if (classId) {
      const { data: residentsRaw, error: residentsError } = await supabase
        .from('residents')
        .select('id, class_id, user_id')
        .eq('class_id', classId)
        .eq('program_id', programId);

      if (residentsError) {
        console.error('[campaign-populate] Residents error:', residentsError);
        return NextResponse.json({ error: 'Failed to fetch residents' }, { status: 500 });
      }

      const residentUserIds = (residentsRaw || [])
        .map((r: { user_id: string }) => r.user_id)
        .filter(Boolean);

      const residentProfileMap = new Map<string, { full_name: string; email: string; personal_email: string | null }>();
      if (residentUserIds.length > 0) {
        const { data: rProfiles } = await supabase
          .from('user_profiles')
          .select('id, full_name, email, personal_email')
          .in('id', residentUserIds);
        for (const p of rProfiles || []) {
          residentProfileMap.set(p.id, p);
        }
      }

      residents = (residentsRaw || []).map((r: { id: string; class_id: string; user_id: string }) => {
        const profile = residentProfileMap.get(r.user_id);
        return {
          id: r.id,
          full_name: profile?.full_name || 'Unknown',
          email: profile?.email || '',
          personal_email: profile?.personal_email || null,
          class_id: r.class_id,
        };
      }).sort((a, b) => a.full_name.localeCompare(b.full_name));
    }

    return NextResponse.json({
      classes: classes || [],
      faculty,
      residents,
    });
  } catch (error) {
    console.error('[campaign-populate] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
