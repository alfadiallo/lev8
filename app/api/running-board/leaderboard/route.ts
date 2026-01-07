// API Route: Running Board Leaderboard
// GET /api/running-board/leaderboard - Get top users by sessions and time

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface LeaderboardEntry {
  id: string;
  user_id: string | null;
  full_name: string;
  type: 'educator' | 'learner';
  session_count: number;
  total_time_seconds: number;
  last_activity: string;
  is_active_this_week: boolean;
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
    const limit = parseInt(url.searchParams.get('limit') || '10');

    // Get one week ago date for "active this week" calculation
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoISO = oneWeekAgo.toISOString();

    // Get all completed sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('running_board_sessions')
      .select(`
        id,
        facilitator_id,
        learner_id,
        educator_id,
        educator_name,
        educator_type,
        total_duration_seconds,
        created_at,
        status
      `)
      .in('status', ['completed', 'in_progress', 'paused']);

    if (sessionsError) {
      console.error('[RunningBoardLeaderboard] Error fetching sessions:', sessionsError);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    // Get resident names for learners
    const learnerIds = [...new Set((sessions || []).map(s => s.learner_id).filter(Boolean))];
    const { data: residents } = await supabase
      .from('residents')
      .select('id, full_name, user_id')
      .in('id', learnerIds);

    const residentMap = new Map((residents || []).map(r => [r.id, r]));

    // Get educator names for educators (those with educator_id)
    const educatorIds = [...new Set((sessions || []).map(s => s.educator_id).filter(Boolean))];
    
    // Get from residents
    const { data: educatorResidents } = await supabase
      .from('residents')
      .select('id, full_name, user_id')
      .in('id', educatorIds);

    // Get from faculty
    const { data: educatorFaculty } = await supabase
      .from('faculty')
      .select('id, full_name, user_id')
      .in('id', educatorIds);

    const educatorMap = new Map([
      ...(educatorResidents || []).map(r => [r.id, r] as [string, typeof r]),
      ...(educatorFaculty || []).map(f => [f.id, f] as [string, typeof f]),
    ]);

    // Aggregate learner stats
    const learnerStats: Record<string, {
      id: string;
      user_id: string | null;
      full_name: string;
      session_count: number;
      total_time_seconds: number;
      last_activity: string;
    }> = {};

    // Aggregate educator stats
    const educatorStats: Record<string, {
      id: string;
      user_id: string | null;
      full_name: string;
      session_count: number;
      total_time_seconds: number;
      last_activity: string;
    }> = {};

    for (const session of sessions || []) {
      // Process learner
      if (session.learner_id) {
        const resident = residentMap.get(session.learner_id);
        const key = session.learner_id;
        
        if (!learnerStats[key]) {
          learnerStats[key] = {
            id: session.learner_id,
            user_id: resident?.user_id || null,
            full_name: resident?.full_name || 'Unknown Learner',
            session_count: 0,
            total_time_seconds: 0,
            last_activity: session.created_at,
          };
        }
        
        learnerStats[key].session_count += 1;
        learnerStats[key].total_time_seconds += session.total_duration_seconds || 0;
        if (session.created_at > learnerStats[key].last_activity) {
          learnerStats[key].last_activity = session.created_at;
        }
      }

      // Process educator
      const educatorKey = session.educator_id || session.educator_name;
      if (educatorKey) {
        const educator = session.educator_id ? educatorMap.get(session.educator_id) : null;
        const name = educator?.full_name || session.educator_name || 'Unknown Educator';
        
        if (!educatorStats[educatorKey]) {
          educatorStats[educatorKey] = {
            id: session.educator_id || educatorKey,
            user_id: educator?.user_id || null,
            full_name: name,
            session_count: 0,
            total_time_seconds: 0,
            last_activity: session.created_at,
          };
        }
        
        educatorStats[educatorKey].session_count += 1;
        educatorStats[educatorKey].total_time_seconds += session.total_duration_seconds || 0;
        if (session.created_at > educatorStats[educatorKey].last_activity) {
          educatorStats[educatorKey].last_activity = session.created_at;
        }
      }
    }

    // Convert to arrays and add metadata
    const learnerEntries: LeaderboardEntry[] = Object.values(learnerStats).map(s => ({
      ...s,
      type: 'learner' as const,
      is_active_this_week: s.last_activity >= oneWeekAgoISO,
    }));

    const educatorEntries: LeaderboardEntry[] = Object.values(educatorStats).map(s => ({
      ...s,
      type: 'educator' as const,
      is_active_this_week: s.last_activity >= oneWeekAgoISO,
    }));

    // Combine and sort by session count (descending), then by total time
    const allEntries = [...learnerEntries, ...educatorEntries];
    allEntries.sort((a, b) => {
      if (b.session_count !== a.session_count) {
        return b.session_count - a.session_count;
      }
      return b.total_time_seconds - a.total_time_seconds;
    });

    // Take top N
    const topEntries = allEntries.slice(0, limit);

    // Calculate totals
    const totalSessions = (sessions || []).length;
    const totalTime = (sessions || []).reduce((sum, s) => sum + (s.total_duration_seconds || 0), 0);
    const activeThisWeek = allEntries.filter(e => e.is_active_this_week).length;

    return NextResponse.json({
      leaderboard: topEntries,
      stats: {
        total_sessions: totalSessions,
        total_time_seconds: totalTime,
        total_participants: allEntries.length,
        active_this_week: activeThisWeek,
      },
      current_user_id: user.id,
    }, { status: 200 });
  } catch (error) {
    console.error('[RunningBoardLeaderboard] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}




