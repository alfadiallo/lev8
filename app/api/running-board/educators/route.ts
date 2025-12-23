// API Route: Running Board Educators
// GET /api/running-board/educators - List available educators (residents + faculty)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to calculate PGY level from graduation year
function calculatePGYLevel(graduationYear: number): number {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  
  // Academic year starts in July
  const academicYear = currentMonth >= 7 ? currentYear : currentYear - 1;
  
  // PGY level = graduation year - academic year
  const pgyLevel = graduationYear - academicYear;
  
  // Clamp between 1 and 5
  return Math.max(1, Math.min(5, pgyLevel));
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query params
    const url = new URL(request.url);
    const search = url.searchParams.get('search');

    // Fetch residents
    let residents: any[] = [];
    const { data: residentsData, error: residentsError } = await supabase
      .from('residents')
      .select(`
        id,
        user_id,
        full_name,
        anon_code,
        class_id
      `);

    if (!residentsError && residentsData) {
      residents = residentsData;
    } else {
      console.error('[RunningBoardEducators] Error fetching residents:', residentsError);
    }

    // Try to get graduation years from residents_with_pgy view
    const { data: pgyData } = await supabase
      .from('residents_with_pgy')
      .select('id, graduation_year, pgy_level');

    const pgyMap = new Map((pgyData || []).map(r => [r.id, r]));

    // Fetch faculty
    let faculty: any[] = [];
    const { data: facultyData, error: facultyError } = await supabase
      .from('faculty')
      .select(`
        id,
        user_id,
        full_name,
        credentials,
        is_active
      `)
      .eq('is_active', true);

    if (!facultyError && facultyData) {
      faculty = facultyData;
    } else {
      console.error('[RunningBoardEducators] Error fetching faculty:', facultyError);
    }

    console.log('[RunningBoardEducators] Found residents:', residents.length, 'faculty:', faculty.length);

    // Transform residents to educators format
    const residentEducators = residents.map((r: any) => {
      const pgyInfo = pgyMap.get(r.id);
      const graduationYear = pgyInfo?.graduation_year || new Date().getFullYear() + 2;
      const pgy = pgyInfo?.pgy_level || calculatePGYLevel(graduationYear);
      const name = r.full_name || r.anon_code || `Resident ${r.id?.slice(0, 8)}`;
      
      return {
        id: r.id,
        user_id: r.user_id || r.id,
        full_name: name,
        type: 'resident' as const,
        pgy_level: pgy,
      };
    });

    // Transform faculty to educators format
    const facultyEducators = faculty.map((f: any) => ({
      id: f.id,
      user_id: f.user_id || f.id,
      full_name: f.full_name,
      type: 'faculty' as const,
      credentials: f.credentials,
    }));

    // Combine and sort
    let educators = [...facultyEducators, ...residentEducators];

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      educators = educators.filter(e =>
        e.full_name.toLowerCase().includes(searchLower) ||
        (e.credentials && e.credentials.toLowerCase().includes(searchLower))
      );
    }

    // Sort: faculty first, then by name
    educators.sort((a, b) => {
      if (a.type === 'faculty' && b.type !== 'faculty') return -1;
      if (a.type !== 'faculty' && b.type === 'faculty') return 1;
      return a.full_name.localeCompare(b.full_name);
    });

    // Get recent educators (those who have facilitated recent sessions)
    const { data: recentSessions } = await supabase
      .from('running_board_sessions')
      .select('educator_id')
      .not('educator_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20);

    const recentEducatorIds = [...new Set((recentSessions || []).map(s => s.educator_id))];

    // Mark recent educators
    educators = educators.map(e => ({
      ...e,
      is_recent: recentEducatorIds.includes(e.id),
    }));

    // Sort recent to top within their groups
    educators.sort((a, b) => {
      // Faculty first
      if (a.type === 'faculty' && b.type !== 'faculty') return -1;
      if (a.type !== 'faculty' && b.type === 'faculty') return 1;
      // Then recent within same type
      if (a.is_recent && !b.is_recent) return -1;
      if (!a.is_recent && b.is_recent) return 1;
      return a.full_name.localeCompare(b.full_name);
    });

    return NextResponse.json({ educators }, { status: 200 });
  } catch (error) {
    console.error('[RunningBoardEducators] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


