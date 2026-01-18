import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

/**
 * GET /api/interview/sessions/[sessionId]/summary
 * Returns a condensed summary of interview day results for discussion mode
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Get session info
    const { data: session, error: sessionError } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // 2. Get all candidates for this session
    const { data: candidates, error: candidatesError } = await supabase
      .from('interview_candidates')
      .select('*')
      .eq('session_id', sessionId)
      .order('interview_total', { ascending: false, nullsFirst: false });

    if (candidatesError) {
      console.error('[summary] Candidates error:', candidatesError);
      return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 });
    }

    // 3. Get all ratings for these candidates
    const candidateIds = (candidates || []).map(c => c.id);
    
    interface RatingData {
      id: string;
      candidate_id: string;
      interviewer_email: string;
      interviewer_name: string | null;
      eq_score: number | null;
      pq_score: number | null;
      iq_score: number | null;
      notes: string | null;
    }
    
    let allRatings: RatingData[] = [];
    
    if (candidateIds.length > 0) {
      const { data: ratings, error: ratingsError } = await supabase
        .from('interview_ratings')
        .select('id, candidate_id, interviewer_email, interviewer_name, eq_score, pq_score, iq_score, notes')
        .in('candidate_id', candidateIds);

      if (!ratingsError && ratings) {
        allRatings = ratings;
      }
    }

    // 4. Build candidate data with ratings
    const ratingsByCandidate: Record<string, RatingData[]> = {};
    allRatings.forEach(r => {
      if (!ratingsByCandidate[r.candidate_id]) {
        ratingsByCandidate[r.candidate_id] = [];
      }
      ratingsByCandidate[r.candidate_id].push(r);
    });

    // Rank candidates by interview_total
    let rank = 0;
    let lastScore: number | null = null;
    let skipCount = 0;

    const rankedCandidates = (candidates || []).map((candidate) => {
      if (candidate.interview_total !== lastScore) {
        rank += 1 + skipCount;
        skipCount = 0;
        lastScore = candidate.interview_total;
      } else {
        skipCount++;
      }

      const candidateRatings = ratingsByCandidate[candidate.id] || [];

      return {
        id: candidate.id,
        name: candidate.candidate_name,
        email: candidate.candidate_email,
        medical_school: candidate.medical_school,
        eq_total: candidate.eq_total,
        pq_total: candidate.pq_total,
        iq_total: candidate.iq_total,
        interview_total: candidate.interview_total,
        rank: candidate.interview_total ? rank : null,
        rating_count: candidateRatings.length,
        ratings: candidateRatings.map(r => ({
          interviewer_email: r.interviewer_email,
          interviewer_name: r.interviewer_name,
          eq_score: r.eq_score,
          pq_score: r.pq_score,
          iq_score: r.iq_score,
          total: (r.eq_score || 0) + (r.pq_score || 0) + (r.iq_score || 0),
          notes: r.notes,
        })),
      };
    });

    // 5. Calculate summary stats
    const scoredCandidates = rankedCandidates.filter(c => c.interview_total != null);
    const scores = scoredCandidates.map(c => c.interview_total || 0);
    
    const avgScore = scores.length > 0 
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
    
    const minScore = scores.length > 0 ? Math.min(...scores) : 0;
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;

    // Score distribution for this day
    const distribution = {
      exceptional: scoredCandidates.filter(c => (c.interview_total || 0) >= 255).length,
      strong: scoredCandidates.filter(c => (c.interview_total || 0) >= 225 && (c.interview_total || 0) < 255).length,
      good: scoredCandidates.filter(c => (c.interview_total || 0) >= 195 && (c.interview_total || 0) < 225).length,
      average: scoredCandidates.filter(c => (c.interview_total || 0) >= 165 && (c.interview_total || 0) < 195).length,
      belowAverage: scoredCandidates.filter(c => (c.interview_total || 0) < 165).length,
    };

    // Get unique interviewers
    const interviewerSet = new Set<string>();
    allRatings.forEach(r => interviewerSet.add(r.interviewer_email));

    return NextResponse.json({
      session: {
        id: session.id,
        name: session.session_name,
        date: session.session_date,
        status: session.status,
      },
      candidates: rankedCandidates,
      summary: {
        totalCandidates: candidates?.length || 0,
        candidatesRated: scoredCandidates.length,
        totalRatings: allRatings.length,
        interviewerCount: interviewerSet.size,
        avgScore,
        minScore,
        maxScore,
        distribution,
      },
    });
  } catch (error) {
    console.error('[summary] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
