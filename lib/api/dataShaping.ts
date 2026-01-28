/**
 * Role-Based Data Shaping Utilities
 * 
 * These utilities transform data based on the user's role:
 * - Residents see anonymized data
 * - Faculty see full data for supervised residents
 * - Leadership sees everything
 * 
 * Usage:
 * ```ts
 * const scores = await getClassScores(classYear, ctx.programId);
 * const shapedData = shapeClassScoresForRole(scores, ctx);
 * return NextResponse.json(shapedData);
 * ```
 */

import { TenantAuthContext } from './withTenantAuth';

// Types for analytics data
export interface ResidentScore {
  residentId: string;
  residentName: string;
  anonCode: string;
  pgyLevel: number;
  eqScore?: number;
  pqScore?: number;
  iqScore?: number;
  compositeScore?: number;
  percentile?: number;
}

export interface SWOTSummary {
  residentId: string;
  residentName: string;
  anonCode: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  generatedAt: string;
}

export interface ClassComparison {
  myScore?: number;
  myPercentile?: number;
  classAverage: number;
  classMedian: number;
  classMin: number;
  classMax: number;
  distribution: { bucket: string; count: number }[];
}

// Anonymized versions
export interface AnonymizedScore {
  anonCode: string;
  pgyLevel: number;
  eqScore?: number;
  pqScore?: number;
  iqScore?: number;
  compositeScore?: number;
  percentile?: number;
  isYou?: boolean; // For residents viewing their own data
}

export interface AnonymizedSWOT {
  anonCode: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  generatedAt: string;
  isYou?: boolean;
}

/**
 * Shape resident scores based on role
 * - Residents: See anonymized class data with their own highlighted
 * - Faculty: See full data for supervised residents
 * - Leadership: See everything
 */
export function shapeResidentScores(
  scores: ResidentScore[],
  ctx: TenantAuthContext,
  options?: { includeNames?: boolean }
): ResidentScore[] | AnonymizedScore[] {
  // Residents get anonymized data
  if (ctx.isResident) {
    return scores.map(score => ({
      anonCode: score.anonCode,
      pgyLevel: score.pgyLevel,
      eqScore: score.eqScore,
      pqScore: score.pqScore,
      iqScore: score.iqScore,
      compositeScore: score.compositeScore,
      percentile: score.percentile,
      isYou: score.residentId === ctx.user.id, // Mark their own data
    }));
  }
  
  // Faculty and above get full data
  if (options?.includeNames === false) {
    return scores.map(score => ({
      anonCode: score.anonCode,
      pgyLevel: score.pgyLevel,
      eqScore: score.eqScore,
      pqScore: score.pqScore,
      iqScore: score.iqScore,
      compositeScore: score.compositeScore,
      percentile: score.percentile,
    }));
  }
  
  return scores;
}

/**
 * Shape SWOT summaries based on role
 */
export function shapeSWOTSummaries(
  summaries: SWOTSummary[],
  ctx: TenantAuthContext
): SWOTSummary[] | AnonymizedSWOT[] {
  // Residents get anonymized data
  if (ctx.isResident) {
    return summaries.map(summary => ({
      anonCode: summary.anonCode,
      strengths: summary.strengths,
      weaknesses: summary.weaknesses,
      opportunities: summary.opportunities,
      threats: summary.threats,
      generatedAt: summary.generatedAt,
      isYou: summary.residentId === ctx.user.id,
    }));
  }
  
  return summaries;
}

/**
 * Create class comparison data for a resident
 * Shows where they stand relative to class without revealing others
 */
export function createClassComparison(
  scores: ResidentScore[],
  ctx: TenantAuthContext,
  scoreField: 'eqScore' | 'pqScore' | 'iqScore' | 'compositeScore' = 'compositeScore'
): ClassComparison | null {
  if (scores.length === 0) return null;
  
  // Extract the specific score values
  const values = scores
    .map(s => s[scoreField])
    .filter((v): v is number => v !== undefined && v !== null)
    .sort((a, b) => a - b);
  
  if (values.length === 0) return null;
  
  const sum = values.reduce((a, b) => a + b, 0);
  const average = sum / values.length;
  const median = values.length % 2 === 0
    ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
    : values[Math.floor(values.length / 2)];
  
  // Find user's score and percentile (for residents)
  let myScore: number | undefined;
  let myPercentile: number | undefined;
  
  if (ctx.isResident) {
    const myData = scores.find(s => s.residentId === ctx.user.id);
    myScore = myData?.[scoreField] ?? undefined;
    
    if (myScore !== undefined) {
      const belowMe = values.filter(v => v < myScore!).length;
      myPercentile = Math.round((belowMe / values.length) * 100);
    }
  }
  
  // Create distribution buckets
  const min = values[0];
  const max = values[values.length - 1];
  const range = max - min;
  const bucketSize = range / 5 || 1;
  
  const buckets = [
    { bucket: 'Bottom 20%', count: 0 },
    { bucket: '20-40%', count: 0 },
    { bucket: '40-60%', count: 0 },
    { bucket: '60-80%', count: 0 },
    { bucket: 'Top 20%', count: 0 },
  ];
  
  for (const value of values) {
    const bucketIndex = Math.min(4, Math.floor((value - min) / bucketSize));
    buckets[bucketIndex].count++;
  }
  
  return {
    myScore,
    myPercentile,
    classAverage: Math.round(average * 100) / 100,
    classMedian: Math.round(median * 100) / 100,
    classMin: min,
    classMax: max,
    distribution: buckets,
  };
}

/**
 * Filter residents list based on role
 * - Residents: Only see themselves
 * - Faculty: See residents they supervise (or all in program)
 * - Leadership: See all
 */
export function filterResidentsByRole<T extends { residentId?: string; id?: string; user_id?: string }>(
  residents: T[],
  ctx: TenantAuthContext
): T[] {
  // Residents only see themselves
  if (ctx.isResident) {
    return residents.filter(r => 
      (r.residentId === ctx.user.id) || 
      (r.id === ctx.user.id) ||
      (r.user_id === ctx.user.id)
    );
  }
  
  // Faculty and above see all in program
  return residents;
}

/**
 * Remove sensitive fields from data for external/resident access
 */
export function sanitizeForRole<T extends Record<string, unknown>>(
  data: T,
  ctx: TenantAuthContext,
  sensitiveFields: string[] = ['notes', 'internalComments', 'facultyFeedback']
): T {
  if (ctx.isProgramLeadership || ctx.isAdmin) {
    return data;
  }
  
  const sanitized = { ...data };
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      delete sanitized[field];
    }
  }
  
  return sanitized;
}

/**
 * Shape CCC session data based on role
 * - Residents: No access (handled by auth)
 * - Faculty: See sessions they participated in
 * - Leadership: See all
 */
export function shapeCCCSessions<T extends { facilitatorId?: string; attendees?: string[] }>(
  sessions: T[],
  ctx: TenantAuthContext
): T[] {
  // Leadership sees all
  if (ctx.isProgramLeadership || ctx.isAdmin) {
    return sessions;
  }
  
  // Faculty sees sessions they facilitated or attended
  return sessions.filter(session => 
    session.facilitatorId === ctx.user.id ||
    session.attendees?.includes(ctx.user.id)
  );
}

/**
 * Add user context flags to data
 * Useful for frontend to know what actions are available
 */
export interface DataWithPermissions<T> {
  data: T;
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canPublish: boolean;
    canViewDetails: boolean;
  };
}

export function addPermissions<T extends { creatorId?: string; residentId?: string }>(
  data: T,
  ctx: TenantAuthContext
): DataWithPermissions<T> {
  const isOwner = data.creatorId === ctx.user.id || data.residentId === ctx.user.id;
  
  return {
    data,
    permissions: {
      canEdit: isOwner || ctx.isProgramLeadership || ctx.isAdmin,
      canDelete: isOwner || ctx.isAdmin,
      canPublish: ctx.isFaculty && ctx.isStudioCreator,
      canViewDetails: !ctx.isResident || isOwner,
    },
  };
}
