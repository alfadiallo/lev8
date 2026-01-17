import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

/**
 * GET /api/interview/season
 * Returns all candidates across all sessions for the season overview
 * Includes ranking by interview_total
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorEmail = searchParams.get('creator_email');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch all sessions (optionally filtered by creator)
    let sessionsQuery = supabase
      .from('interview_sessions')
      .select('*')
      .eq('session_type', 'group')
      .order('session_date', { ascending: true });

    if (creatorEmail) {
      sessionsQuery = sessionsQuery.eq('creator_email', creatorEmail);
    }

    const { data: sessions, error: sessionsError } = await sessionsQuery;

    if (sessionsError) {
      console.error('[season] Sessions error:', sessionsError);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({
        sessions: [],
        candidates: [],
        summary: {
          totalSessions: 0,
          totalCandidates: 0,
          avgScore: 0,
        },
      });
    }

    const sessionIds = sessions.map(s => s.id);

    // 2. Fetch all candidates from these sessions
    const { data: candidates, error: candidatesError } = await supabase
      .from('interview_candidates')
      .select('*')
      .in('session_id', sessionIds)
      .order('interview_total', { ascending: false, nullsFirst: false });

    if (candidatesError) {
      console.error('[season] Candidates error:', candidatesError);
      return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 });
    }

    // 3. Get session interviewers to identify residents
    const { data: sessionInterviewers, error: interviewersError } = await supabase
      .from('interview_session_interviewers')
      .select('session_id, interviewer_email, role')
      .in('session_id', sessionIds);
    
    // Build a map of interviewer email -> role by session
    const interviewerRoles: Record<string, Record<string, string>> = {};
    if (!interviewersError && sessionInterviewers) {
      sessionInterviewers.forEach(si => {
        if (!interviewerRoles[si.session_id]) {
          interviewerRoles[si.session_id] = {};
        }
        interviewerRoles[si.session_id][si.interviewer_email] = si.role || 'interviewer';
      });
    }
    
    // 4. Get all ratings for candidates (for expandable detail view)
    const candidateIds = (candidates || []).map(c => c.id);
    
    interface RatingData {
      candidate_id: string;
      interviewer_email: string;
      interviewer_name: string | null;
      eq_score: number | null;
      pq_score: number | null;
      iq_score: number | null;
      notes: string | null;
      is_resident: boolean;
    }
    
    // Build a map of candidate_id to session_id
    const candidateToSession: Record<string, string> = {};
    (candidates || []).forEach(c => {
      candidateToSession[c.id] = c.session_id;
    });
    
    let allRatings: RatingData[] = [];
    let ratingCounts: Record<string, number> = {};
    let ratingsByCandidate: Record<string, RatingData[]> = {};
    
    if (candidateIds.length > 0) {
      const { data: ratings, error: ratingsError } = await supabase
        .from('interview_ratings')
        .select('candidate_id, interviewer_email, interviewer_name, eq_score, pq_score, iq_score, notes')
        .in('candidate_id', candidateIds);

      if (!ratingsError && ratings) {
        allRatings = ratings.map(r => {
          const sessionId = candidateToSession[r.candidate_id];
          const role = interviewerRoles[sessionId]?.[r.interviewer_email] || 'interviewer';
          return {
            ...r,
            is_resident: role === 'resident',
          };
        });
        
        allRatings.forEach(r => {
          ratingCounts[r.candidate_id] = (ratingCounts[r.candidate_id] || 0) + 1;
          if (!ratingsByCandidate[r.candidate_id]) {
            ratingsByCandidate[r.candidate_id] = [];
          }
          ratingsByCandidate[r.candidate_id].push(r);
        });
      }
    }

    // 4. Build session lookup
    const sessionMap = new Map(sessions.map(s => [s.id, s]));

    // 6. Add ranking, session info, and ratings to candidates
    interface CandidateRating {
      interviewer_email: string;
      interviewer_name: string | null;
      eq_score: number | null;
      pq_score: number | null;
      iq_score: number | null;
      total: number | null;
      notes: string | null;
      is_resident: boolean;
    }
    
    interface CandidateWithRank {
      id: string;
      session_id: string;
      candidate_name: string;
      candidate_email: string | null;
      medical_school: string | null;
      eq_total: number | null;
      pq_total: number | null;
      iq_total: number | null;
      interview_total: number | null;
      sort_order: number;
      rank: number;
      ratingCount: number;
      ratings: CandidateRating[];
      session: {
        id: string;
        session_name: string;
        session_date: string | null;
      } | null;
    }

    let currentRank = 0;
    let lastScore: number | null = null;
    let skipCount = 0;

    const rankedCandidates: CandidateWithRank[] = (candidates || []).map((candidate) => {
      // Calculate rank with ties
      if (candidate.interview_total !== lastScore) {
        currentRank += 1 + skipCount;
        skipCount = 0;
        lastScore = candidate.interview_total;
      } else {
        skipCount++;
      }

      const session = sessionMap.get(candidate.session_id);
      const candidateRatings = ratingsByCandidate[candidate.id] || [];
      
      return {
        ...candidate,
        rank: candidate.interview_total ? currentRank : 0,
        ratingCount: ratingCounts[candidate.id] || 0,
        ratings: candidateRatings.map(r => ({
          interviewer_email: r.interviewer_email,
          interviewer_name: r.interviewer_name,
          eq_score: r.eq_score,
          pq_score: r.pq_score,
          iq_score: r.iq_score,
          total: (r.eq_score != null && r.pq_score != null && r.iq_score != null) 
            ? r.eq_score + r.pq_score + r.iq_score 
            : null,
          notes: r.notes,
          is_resident: r.is_resident,
        })),
        session: session ? {
          id: session.id,
          session_name: session.session_name,
          session_date: session.session_date,
        } : null,
      };
    });

    // 6. Calculate summary statistics
    const scoredCandidates = rankedCandidates.filter(c => c.interview_total != null);
    const avgScore = scoredCandidates.length > 0
      ? Math.round(scoredCandidates.reduce((sum, c) => sum + (c.interview_total || 0), 0) / scoredCandidates.length)
      : 0;

    // Score distribution
    const distribution = {
      exceptional: scoredCandidates.filter(c => (c.interview_total || 0) >= 255).length, // 85+ avg
      strong: scoredCandidates.filter(c => (c.interview_total || 0) >= 225 && (c.interview_total || 0) < 255).length, // 75-84 avg
      good: scoredCandidates.filter(c => (c.interview_total || 0) >= 195 && (c.interview_total || 0) < 225).length, // 65-74 avg
      average: scoredCandidates.filter(c => (c.interview_total || 0) >= 165 && (c.interview_total || 0) < 195).length, // 55-64 avg
      belowAverage: scoredCandidates.filter(c => (c.interview_total || 0) < 165).length, // <55 avg
    };

    // Medical school breakdown
    const schoolCounts: Record<string, number> = {};
    rankedCandidates.forEach(c => {
      if (c.medical_school) {
        schoolCounts[c.medical_school] = (schoolCounts[c.medical_school] || 0) + 1;
      }
    });

    const topSchools = Object.entries(schoolCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([school, count]) => ({ school, count }));

    return NextResponse.json({
      sessions: sessions.map(s => ({
        id: s.id,
        session_name: s.session_name,
        session_date: s.session_date,
        status: s.status,
      })),
      candidates: rankedCandidates,
      summary: {
        totalSessions: sessions.length,
        totalCandidates: rankedCandidates.length,
        avgScore,
        distribution,
        topSchools,
      },
    });
  } catch (error) {
    console.error('[season] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
