// API Route: Running Board Learners
// GET /api/running-board/learners - List available residents as learners

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              // We don't need to set cookies in this GET request usually
            });
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query params
    const url = new URL(request.url);
    const search = url.searchParams.get('search');
    const pgyLevel = url.searchParams.get('pgy_level');

    // Fetch residents directly (simplified logic)
    const { data: residents, error: fetchError } = await supabase
      .from('residents')
      .select(`
        id,
        user_id,
        user_profiles!inner(full_name, email),
        classes(graduation_year)
      `);

    if (fetchError) {
      console.error('[RunningBoardLearners] Error fetching residents:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch learners' }, { status: 500 });
    }

    // Transform residents to learners format
    let learners = (residents || []).map((r: any) => {
      // Get graduation year
      const graduationYear = r.classes?.graduation_year || new Date().getFullYear() + 2;
      const pgy = calculatePGYLevel(graduationYear);
      
      // Get name
      const name = r.user_profiles?.full_name || `Resident ${r.id?.slice(0, 8)}`;
      
      return {
        id: r.id,
        resident_id: r.id,
        user_id: r.user_id || r.id,
        full_name: name,
        email: r.user_profiles?.email || '',
        pgy_level: pgy,
        graduation_year: graduationYear,
      };
    });

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      learners = learners.filter((l: { full_name: string; email: string }) =>
        l.full_name.toLowerCase().includes(searchLower) ||
        l.email.toLowerCase().includes(searchLower)
      );
    }

    // Apply PGY level filter
    if (pgyLevel) {
      const pgy = parseInt(pgyLevel);
      learners = learners.filter((l: { pgy_level: number }) => l.pgy_level === pgy);
    }

    // Sort by name
    learners.sort((a: { full_name: string }, b: { full_name: string }) => 
      a.full_name.localeCompare(b.full_name)
    );

    // Get recent learners
    const { data: recentSessions } = await supabase
      .from('running_board_sessions')
      .select('learner_id')
      .eq('facilitator_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const recentLearnerIds = [...new Set((recentSessions || []).map(s => s.learner_id))];

    // Mark recent learners
    const learnersWithRecent = learners.map((l: any) => ({
      ...l,
      is_recent: recentLearnerIds.includes(l.id),
    }));

    // Sort recent learners to top
    learnersWithRecent.sort((a: any, b: any) => {
      if (a.is_recent && !b.is_recent) return -1;
      if (!a.is_recent && b.is_recent) return 1;
      return a.full_name.localeCompare(b.full_name);
    });
    
    return NextResponse.json({ learners: learnersWithRecent }, { status: 200 });
  } catch (error) {
    console.error('[RunningBoardLearners] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
