/**
 * Z-Score Normalization for Interview Ratings
 * 
 * This module provides functions to normalize interviewer ratings,
 * accounting for differences in how individuals rate candidates.
 * 
 * Methodology:
 * 1. Calculate each interviewer's personal mean and standard deviation
 * 2. Convert each raw score to a z-score: z = (raw - mean) / stddev
 * 3. Transform to normalized 0-100 scale: normalized = 50 + (z * 15)
 */

export interface InterviewerRating {
  interviewer_email: string;
  interviewer_name: string | null;
  eq_score: number | null;
  pq_score: number | null;
  iq_score: number | null;
  is_resident?: boolean;
}

export interface InterviewerStats {
  email: string;
  meanEq: number;
  meanPq: number;
  meanIq: number;
  stdDevEq: number;
  stdDevPq: number;
  stdDevIq: number;
  ratingCount: number;
}

export interface NormalizedRating {
  interviewer_email: string;
  interviewer_name: string | null;
  raw_eq: number | null;
  raw_pq: number | null;
  raw_iq: number | null;
  raw_total: number | null;
  normalized_eq: number | null;
  normalized_pq: number | null;
  normalized_iq: number | null;
  normalized_total: number | null;
  is_resident?: boolean;
}

export interface CandidateScores {
  candidate_id: string;
  raw_eq_total: number | null;
  raw_pq_total: number | null;
  raw_iq_total: number | null;
  raw_interview_total: number | null;
  raw_rank: number;
  normalized_eq_total: number | null;
  normalized_pq_total: number | null;
  normalized_iq_total: number | null;
  normalized_interview_total: number | null;
  normalized_rank: number;
  rank_change: number; // positive = moved up, negative = moved down
}

/**
 * Calculate mean of an array of numbers
 */
function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Calculate standard deviation of an array of numbers
 */
function calculateStdDev(values: number[]): number {
  if (values.length < 2) return 1; // Return 1 to avoid division by zero
  const mean = calculateMean(values);
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1);
  return Math.sqrt(variance) || 1; // Return 1 if stddev is 0
}

/**
 * Calculate z-score for a value given mean and standard deviation
 */
function zScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

/**
 * Transform z-score back to 0-100 scale
 * Using mean of 50 and stddev of 15 (similar to IQ scale)
 */
function normalizeZScore(z: number): number {
  const normalized = 50 + (z * 15);
  // Clamp to 0-100 range
  return Math.max(0, Math.min(100, Math.round(normalized)));
}

/**
 * Calculate statistics for each interviewer from all their ratings
 */
export function calculateInterviewerStats(
  allRatings: InterviewerRating[]
): Map<string, InterviewerStats> {
  const statsByInterviewer = new Map<string, InterviewerStats>();
  
  // Group ratings by interviewer
  const ratingsByInterviewer: Record<string, InterviewerRating[]> = {};
  
  allRatings.forEach(rating => {
    if (!ratingsByInterviewer[rating.interviewer_email]) {
      ratingsByInterviewer[rating.interviewer_email] = [];
    }
    ratingsByInterviewer[rating.interviewer_email].push(rating);
  });
  
  // Calculate stats for each interviewer
  Object.entries(ratingsByInterviewer).forEach(([email, ratings]) => {
    const validRatings = ratings.filter(
      r => r.eq_score != null && r.pq_score != null && r.iq_score != null
    );
    
    if (validRatings.length === 0) {
      statsByInterviewer.set(email, {
        email,
        meanEq: 50,
        meanPq: 50,
        meanIq: 50,
        stdDevEq: 15,
        stdDevPq: 15,
        stdDevIq: 15,
        ratingCount: 0,
      });
      return;
    }
    
    const eqScores = validRatings.map(r => r.eq_score!);
    const pqScores = validRatings.map(r => r.pq_score!);
    const iqScores = validRatings.map(r => r.iq_score!);
    
    statsByInterviewer.set(email, {
      email,
      meanEq: calculateMean(eqScores),
      meanPq: calculateMean(pqScores),
      meanIq: calculateMean(iqScores),
      stdDevEq: calculateStdDev(eqScores),
      stdDevPq: calculateStdDev(pqScores),
      stdDevIq: calculateStdDev(iqScores),
      ratingCount: validRatings.length,
    });
  });
  
  return statsByInterviewer;
}

/**
 * Normalize a single rating using the interviewer's statistics
 */
export function normalizeRating(
  rating: InterviewerRating,
  interviewerStats: InterviewerStats
): NormalizedRating {
  let normalized_eq: number | null = null;
  let normalized_pq: number | null = null;
  let normalized_iq: number | null = null;
  
  if (rating.eq_score != null) {
    const z = zScore(rating.eq_score, interviewerStats.meanEq, interviewerStats.stdDevEq);
    normalized_eq = normalizeZScore(z);
  }
  
  if (rating.pq_score != null) {
    const z = zScore(rating.pq_score, interviewerStats.meanPq, interviewerStats.stdDevPq);
    normalized_pq = normalizeZScore(z);
  }
  
  if (rating.iq_score != null) {
    const z = zScore(rating.iq_score, interviewerStats.meanIq, interviewerStats.stdDevIq);
    normalized_iq = normalizeZScore(z);
  }
  
  const raw_total = (rating.eq_score != null && rating.pq_score != null && rating.iq_score != null)
    ? rating.eq_score + rating.pq_score + rating.iq_score
    : null;
    
  const normalized_total = (normalized_eq != null && normalized_pq != null && normalized_iq != null)
    ? normalized_eq + normalized_pq + normalized_iq
    : null;
  
  return {
    interviewer_email: rating.interviewer_email,
    interviewer_name: rating.interviewer_name,
    raw_eq: rating.eq_score,
    raw_pq: rating.pq_score,
    raw_iq: rating.iq_score,
    raw_total,
    normalized_eq,
    normalized_pq,
    normalized_iq,
    normalized_total,
    is_resident: rating.is_resident,
  };
}

/**
 * Normalize all ratings for a set of candidates
 */
export function normalizeAllRatings(
  ratings: InterviewerRating[],
  interviewerStats: Map<string, InterviewerStats>
): NormalizedRating[] {
  return ratings.map(rating => {
    const stats = interviewerStats.get(rating.interviewer_email);
    
    if (!stats) {
      // If no stats available, return raw scores as normalized
      const raw_total = (rating.eq_score != null && rating.pq_score != null && rating.iq_score != null)
        ? rating.eq_score + rating.pq_score + rating.iq_score
        : null;
        
      return {
        interviewer_email: rating.interviewer_email,
        interviewer_name: rating.interviewer_name,
        raw_eq: rating.eq_score,
        raw_pq: rating.pq_score,
        raw_iq: rating.iq_score,
        raw_total,
        normalized_eq: rating.eq_score,
        normalized_pq: rating.pq_score,
        normalized_iq: rating.iq_score,
        normalized_total: raw_total,
        is_resident: rating.is_resident,
      };
    }
    
    return normalizeRating(rating, stats);
  });
}

/**
 * Calculate candidate scores with both raw and normalized totals
 * Returns candidates sorted by raw score with rank changes
 */
export function calculateCandidateScores(
  candidateRatings: Map<string, NormalizedRating[]>,
  excludeResidents: boolean = false
): CandidateScores[] {
  const candidates: CandidateScores[] = [];
  
  candidateRatings.forEach((ratings, candidateId) => {
    // Filter out resident ratings if requested
    const filteredRatings = excludeResidents 
      ? ratings.filter(r => !r.is_resident)
      : ratings;
    
    if (filteredRatings.length === 0) {
      candidates.push({
        candidate_id: candidateId,
        raw_eq_total: null,
        raw_pq_total: null,
        raw_iq_total: null,
        raw_interview_total: null,
        raw_rank: 0,
        normalized_eq_total: null,
        normalized_pq_total: null,
        normalized_iq_total: null,
        normalized_interview_total: null,
        normalized_rank: 0,
        rank_change: 0,
      });
      return;
    }
    
    // Sum up scores from all interviewers
    let raw_eq = 0, raw_pq = 0, raw_iq = 0;
    let norm_eq = 0, norm_pq = 0, norm_iq = 0;
    let validRawCount = 0, validNormCount = 0;
    
    filteredRatings.forEach(r => {
      if (r.raw_eq != null && r.raw_pq != null && r.raw_iq != null) {
        raw_eq += r.raw_eq;
        raw_pq += r.raw_pq;
        raw_iq += r.raw_iq;
        validRawCount++;
      }
      if (r.normalized_eq != null && r.normalized_pq != null && r.normalized_iq != null) {
        norm_eq += r.normalized_eq;
        norm_pq += r.normalized_pq;
        norm_iq += r.normalized_iq;
        validNormCount++;
      }
    });
    
    candidates.push({
      candidate_id: candidateId,
      raw_eq_total: validRawCount > 0 ? raw_eq : null,
      raw_pq_total: validRawCount > 0 ? raw_pq : null,
      raw_iq_total: validRawCount > 0 ? raw_iq : null,
      raw_interview_total: validRawCount > 0 ? raw_eq + raw_pq + raw_iq : null,
      raw_rank: 0, // Will be calculated below
      normalized_eq_total: validNormCount > 0 ? norm_eq : null,
      normalized_pq_total: validNormCount > 0 ? norm_pq : null,
      normalized_iq_total: validNormCount > 0 ? norm_iq : null,
      normalized_interview_total: validNormCount > 0 ? norm_eq + norm_pq + norm_iq : null,
      normalized_rank: 0, // Will be calculated below
      rank_change: 0, // Will be calculated below
    });
  });
  
  // Calculate raw ranks
  const byRaw = [...candidates]
    .filter(c => c.raw_interview_total != null)
    .sort((a, b) => (b.raw_interview_total || 0) - (a.raw_interview_total || 0));
  
  let rawRank = 0;
  let lastRawScore: number | null = null;
  let rawSkipCount = 0;
  
  byRaw.forEach(c => {
    if (c.raw_interview_total !== lastRawScore) {
      rawRank += 1 + rawSkipCount;
      rawSkipCount = 0;
      lastRawScore = c.raw_interview_total;
    } else {
      rawSkipCount++;
    }
    
    const candidate = candidates.find(x => x.candidate_id === c.candidate_id);
    if (candidate) {
      candidate.raw_rank = rawRank;
    }
  });
  
  // Calculate normalized ranks
  const byNormalized = [...candidates]
    .filter(c => c.normalized_interview_total != null)
    .sort((a, b) => (b.normalized_interview_total || 0) - (a.normalized_interview_total || 0));
  
  let normRank = 0;
  let lastNormScore: number | null = null;
  let normSkipCount = 0;
  
  byNormalized.forEach(c => {
    if (c.normalized_interview_total !== lastNormScore) {
      normRank += 1 + normSkipCount;
      normSkipCount = 0;
      lastNormScore = c.normalized_interview_total;
    } else {
      normSkipCount++;
    }
    
    const candidate = candidates.find(x => x.candidate_id === c.candidate_id);
    if (candidate) {
      candidate.normalized_rank = normRank;
    }
  });
  
  // Calculate rank changes (positive = moved up with normalization)
  candidates.forEach(c => {
    if (c.raw_rank > 0 && c.normalized_rank > 0) {
      c.rank_change = c.raw_rank - c.normalized_rank;
    }
  });
  
  return candidates;
}

/**
 * Get a human-readable rank change string
 */
export function formatRankChange(change: number): string {
  if (change === 0) return '—';
  if (change > 0) return `+${change}`;
  return `${change}`;
}

/**
 * Get color for rank change display
 */
export function getRankChangeColor(change: number): string {
  if (change > 0) return '#166534'; // Green - moved up
  if (change < 0) return '#991B1B'; // Red - moved down
  return '#64748B'; // Gray - no change
}
