// API Route: Running Board Learners
// GET /api/running-board/learners - List available residents as learners

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
    const pgyLevel = url.searchParams.get('pgy_level');

    // Try to fetch from residents_with_pgy view first (if it exists)
    let residents: any[] = [];
    let fetchError = null;

    // Method 1: Try the view
    const { data: viewData, error: viewError } = await supabase
      .from('residents_with_pgy')
      .select('*');

    if (!viewError && viewData && viewData.length > 0) {
      residents = viewData;
      console.log('[RunningBoardLearners] Using residents_with_pgy view');
    } else {
      // Method 2: Direct query with simpler joins
      const { data: directData, error: directError } = await supabase
        .from('residents')
        .select(`
          id,
          user_id,
          full_name,
          anon_code,
          class_id
        `);

      if (directError) {
        console.error('[RunningBoardLearners] Error fetching residents:', directError);
        
        // Method 3: Try even simpler query
        const { data: simpleData, error: simpleError } = await supabase
          .from('residents')
          .select('*');
        
        if (simpleError) {
          fetchError = simpleError;
        } else {
          residents = simpleData || [];
        }
      } else {
        residents = directData || [];
      }
    }

    if (fetchError) {
      console.error('[RunningBoardLearners] All fetch methods failed:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch learners' }, { status: 500 });
    }

    console.log('[RunningBoardLearners] Found residents:', residents.length);

    // Transform residents to learners format
    let learners = residents.map((r: any) => {
      // Try to get graduation year from various possible fields
      const graduationYear = r.graduation_year || r.class_graduation_year || new Date().getFullYear() + 2;
      const pgy = r.pgy_level || calculatePGYLevel(graduationYear);
      
      // Get name from various possible fields
      const name = r.full_name || r.name || r.anon_code || `Resident ${r.id?.slice(0, 8)}`;
      
      return {
        id: r.id,
        resident_id: r.id,
        user_id: r.user_id || r.id,
        full_name: name,
        email: r.email || '',
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

    // Get recent learners (those who have been in recent sessions with this facilitator)
    const { data: recentSessions } = await supabase
      .from('running_board_sessions')
      .select('learner_id')
      .eq('facilitator_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const recentLearnerIds = [...new Set((recentSessions || []).map(s => s.learner_id))];

    // Mark recent learners and create new typed array
    const learnersWithRecent = learners.map(l => ({
      ...l,
      is_recent: recentLearnerIds.includes(l.id),
    }));

    // Sort recent learners to top
    learnersWithRecent.sort((a, b) => {
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




