import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

interface RatingData {
  interviewer_email: string;
  interviewer_name: string | null;
  eq_score: number | null;
  pq_score: number | null;
  iq_score: number | null;
}

interface InterviewerStats {
  email: string;
  name: string | null;
  candidatesRated: number;
  avgEq: number;
  avgPq: number;
  avgIq: number;
  avgTotal: number;
  stdDevEq: number;
  stdDevPq: number;
  stdDevIq: number;
  stdDevTotal: number;
  deviationFromMean: number; // positive = rates higher, negative = rates lower
  deviationEq: number;
  deviationPq: number;
  deviationIq: number;
  ratingTendency: 'lenient' | 'neutral' | 'strict';
}

function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * GET /api/interview/stats
 * Returns interviewer statistics showing how each person rates compared to the group
 */
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all ratings
    const { data: ratings, error: ratingsError } = await supabase
      .from('interview_ratings')
      .select('interviewer_email, interviewer_name, eq_score, pq_score, iq_score');

    if (ratingsError) {
      console.error('[stats] Ratings error:', ratingsError);
      return NextResponse.json({ error: 'Failed to fetch ratings' }, { status: 500 });
    }

    if (!ratings || ratings.length === 0) {
      return NextResponse.json({
        interviewers: [],
        groupStats: {
          totalRatings: 0,
          avgEq: 0,
          avgPq: 0,
          avgIq: 0,
          avgTotal: 0,
        },
      });
    }

    // Calculate group statistics
    const validRatings = ratings.filter(
      r => r.eq_score != null && r.pq_score != null && r.iq_score != null
    ) as { interviewer_email: string; interviewer_name: string | null; eq_score: number; pq_score: number; iq_score: number }[];

    const groupEqScores = validRatings.map(r => r.eq_score);
    const groupPqScores = validRatings.map(r => r.pq_score);
    const groupIqScores = validRatings.map(r => r.iq_score);
    const groupTotalScores = validRatings.map(r => r.eq_score + r.pq_score + r.iq_score);

    const groupAvgEq = groupEqScores.length > 0 
      ? groupEqScores.reduce((a, b) => a + b, 0) / groupEqScores.length 
      : 0;
    const groupAvgPq = groupPqScores.length > 0 
      ? groupPqScores.reduce((a, b) => a + b, 0) / groupPqScores.length 
      : 0;
    const groupAvgIq = groupIqScores.length > 0 
      ? groupIqScores.reduce((a, b) => a + b, 0) / groupIqScores.length 
      : 0;
    const groupAvgTotal = groupTotalScores.length > 0 
      ? groupTotalScores.reduce((a, b) => a + b, 0) / groupTotalScores.length 
      : 0;

    // Group ratings by interviewer
    const ratingsByInterviewer: Record<string, RatingData[]> = {};
    const interviewerNames: Record<string, string | null> = {};

    ratings.forEach(r => {
      if (!ratingsByInterviewer[r.interviewer_email]) {
        ratingsByInterviewer[r.interviewer_email] = [];
        interviewerNames[r.interviewer_email] = r.interviewer_name;
      }
      ratingsByInterviewer[r.interviewer_email].push(r);
    });

    // Calculate per-interviewer statistics
    const interviewerStats: InterviewerStats[] = Object.entries(ratingsByInterviewer).map(
      ([email, interviewerRatings]) => {
        const valid = interviewerRatings.filter(
          r => r.eq_score != null && r.pq_score != null && r.iq_score != null
        ) as { eq_score: number; pq_score: number; iq_score: number }[];

        if (valid.length === 0) {
          return {
            email,
            name: interviewerNames[email],
            candidatesRated: interviewerRatings.length,
            avgEq: 0,
            avgPq: 0,
            avgIq: 0,
            avgTotal: 0,
            stdDevEq: 0,
            stdDevPq: 0,
            stdDevIq: 0,
            stdDevTotal: 0,
            deviationFromMean: 0,
            deviationEq: 0,
            deviationPq: 0,
            deviationIq: 0,
            ratingTendency: 'neutral' as const,
          };
        }

        const eqScores = valid.map(r => r.eq_score);
        const pqScores = valid.map(r => r.pq_score);
        const iqScores = valid.map(r => r.iq_score);
        const totalScores = valid.map(r => r.eq_score + r.pq_score + r.iq_score);

        const avgEq = eqScores.reduce((a, b) => a + b, 0) / eqScores.length;
        const avgPq = pqScores.reduce((a, b) => a + b, 0) / pqScores.length;
        const avgIq = iqScores.reduce((a, b) => a + b, 0) / iqScores.length;
        const avgTotal = totalScores.reduce((a, b) => a + b, 0) / totalScores.length;

        const deviationFromMean = avgTotal - groupAvgTotal;
        const deviationEq = avgEq - groupAvgEq;
        const deviationPq = avgPq - groupAvgPq;
        const deviationIq = avgIq - groupAvgIq;

        // Determine rating tendency based on deviation
        let ratingTendency: 'lenient' | 'neutral' | 'strict';
        if (deviationFromMean > 10) {
          ratingTendency = 'lenient';
        } else if (deviationFromMean < -10) {
          ratingTendency = 'strict';
        } else {
          ratingTendency = 'neutral';
        }

        return {
          email,
          name: interviewerNames[email],
          candidatesRated: valid.length,
          avgEq: Math.round(avgEq * 10) / 10,
          avgPq: Math.round(avgPq * 10) / 10,
          avgIq: Math.round(avgIq * 10) / 10,
          avgTotal: Math.round(avgTotal * 10) / 10,
          stdDevEq: Math.round(calculateStdDev(eqScores) * 10) / 10,
          stdDevPq: Math.round(calculateStdDev(pqScores) * 10) / 10,
          stdDevIq: Math.round(calculateStdDev(iqScores) * 10) / 10,
          stdDevTotal: Math.round(calculateStdDev(totalScores) * 10) / 10,
          deviationFromMean: Math.round(deviationFromMean * 10) / 10,
          deviationEq: Math.round(deviationEq * 10) / 10,
          deviationPq: Math.round(deviationPq * 10) / 10,
          deviationIq: Math.round(deviationIq * 10) / 10,
          ratingTendency,
        };
      }
    );

    // Sort by candidates rated (most active first)
    interviewerStats.sort((a, b) => b.candidatesRated - a.candidatesRated);

    return NextResponse.json({
      interviewers: interviewerStats,
      groupStats: {
        totalRatings: validRatings.length,
        avgEq: Math.round(groupAvgEq * 10) / 10,
        avgPq: Math.round(groupAvgPq * 10) / 10,
        avgIq: Math.round(groupAvgIq * 10) / 10,
        avgTotal: Math.round(groupAvgTotal * 10) / 10,
        stdDevTotal: Math.round(calculateStdDev(groupTotalScores) * 10) / 10,
      },
    });
  } catch (error) {
    console.error('[stats] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
