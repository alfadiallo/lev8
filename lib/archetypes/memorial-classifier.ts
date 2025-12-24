// ============================================================
// ITE Archetype Classifier - Memorial Healthcare System
// Classifies residents based on available ITE data
// Supports 3-year (complete), 2-year, and 1-year classifications
// ============================================================

import { createClient } from '@/lib/supabase';
import { 
  MEMORIAL_ARCHETYPES, 
  TWO_YEAR_ARCHETYPES, 
  ONE_YEAR_ARCHETYPES,
  RiskLevel
} from './memorial-archetypes';

// ============================================================
// TYPES
// ============================================================

export interface ClassificationInput {
  pgy1?: number | null;
  pgy2?: number | null;
  pgy3?: number | null;
}

export interface ClassificationMetrics {
  pgy1: number | null;
  pgy2: number | null;
  pgy3: number | null;
  delta12: number | null;
  delta23: number | null;
  deltaTotal: number | null;
}

export interface ClassificationResult {
  archetypeId: string;
  archetypeName: string;
  confidence: number;
  dataYears: number;
  riskLevel: RiskLevel;
  isProvisional: boolean;
  note: string;
  description: string;
  color: string;
  recommendations: string[];
  alternatives: Array<{ archetypeId: string; archetypeName: string; confidence: number }>;
  metrics: ClassificationMetrics;
}

export interface SimilarResident {
  id: string;
  name: string;
  classYear: number;
  similarityScore: number;
  iteScores: {
    pgy1: number | null;
    pgy2: number | null;
    pgy3: number | null;
  };
  archetype?: string;
}

export interface FullClassificationResult extends ClassificationResult {
  residentId: string;
  similarResidents: SimilarResident[];
}

// ============================================================
// MAIN CLASSIFIER CLASS
// ============================================================

export class MemorialArchetypeClassifier {
  
  /**
   * Main classification method - routes to appropriate classifier based on available data
   */
  classify(input: ClassificationInput): ClassificationResult {
    const { pgy1, pgy2, pgy3 } = input;
    
    // Determine how many years of data we have
    const hasPgy1 = pgy1 !== null && pgy1 !== undefined;
    const hasPgy2 = pgy2 !== null && pgy2 !== undefined;
    const hasPgy3 = pgy3 !== null && pgy3 !== undefined;
    
    if (hasPgy1 && hasPgy2 && hasPgy3) {
      return this.classifyComplete(pgy1!, pgy2!, pgy3!);
    } else if (hasPgy1 && hasPgy2) {
      return this.classifyTwoYear(pgy1!, pgy2!);
    } else if (hasPgy1) {
      return this.classifyOneYear(pgy1!);
    } else {
      return this.noDataResult();
    }
  }

  // ============================================================
  // COMPLETE DATA CLASSIFICATION (3 years)
  // Based on Memorial Classes 2024-2025 analysis
  // ============================================================
  
  private classifyComplete(pgy1: number, pgy2: number, pgy3: number): ClassificationResult {
    const d12 = pgy2 - pgy1;
    const d23 = pgy3 - pgy2;
    const dTotal = pgy3 - pgy1;
    
    const metrics: ClassificationMetrics = {
      pgy1, pgy2, pgy3,
      delta12: d12,
      delta23: d23,
      deltaTotal: dTotal,
    };

    let archetypeId: string;
    let confidence: number;
    const alternatives: Array<{ archetypeId: string; archetypeName: string; confidence: number }> = [];

    // Check each archetype in priority order (based on ARCHETYPE_DOCUMENTATION.md)
    
    // Elite Performer: Started elite, maintained, ended above average
    if (pgy1 >= 85 && pgy2 >= 85 && pgy3 >= 50) {
      archetypeId = 'elite_performer';
      confidence = 0.95;
    }
    // Elite → Late Struggle: Elite early, dropped at PGY3
    else if (pgy1 >= 75 && pgy2 >= 80 && pgy3 < 50) {
      archetypeId = 'elite_late_struggle';
      confidence = 0.90;
    }
    // Breakthrough Performer: Big improvement that stuck
    else if (d12 >= 25 && pgy3 >= 70) {
      archetypeId = 'breakthrough_performer';
      confidence = 0.90;
    }
    // Peak & Decline: Improved then dropped significantly
    else if (d12 >= 10 && d23 <= -30) {
      archetypeId = 'peak_decline';
      confidence = 0.85;
    }
    // Sophomore Slump → Strong Recovery
    else if (d12 <= -15 && d23 >= 40) {
      archetypeId = 'sophomore_slump_recovery';
      confidence = 0.90;
    }
    // Continuous Decline
    else if (d12 < 0 && d23 < 0 && dTotal <= -20) {
      archetypeId = 'continuous_decline';
      confidence = 0.85;
    }
    // Late Bloomer: Low start, late improvement
    else if (pgy1 <= 40 && d23 >= 15 && pgy3 > pgy1) {
      archetypeId = 'late_bloomer';
      confidence = 0.85;
    }
    // Steady Climber: Consistent improvement
    else if (d12 >= 0 && d23 >= 0 && dTotal >= 10) {
      archetypeId = 'steady_climber';
      confidence = 0.80;
    }
    // Variable: Doesn't fit other patterns
    else {
      archetypeId = 'variable';
      confidence = 0.60;
      
      // Calculate alternatives for Variable cases
      this.calculateAlternatives(metrics, alternatives);
    }

    const archetype = MEMORIAL_ARCHETYPES[archetypeId];
    
    return {
      archetypeId,
      archetypeName: archetype.name,
      confidence,
      dataYears: 3,
      riskLevel: archetype.riskLevel,
      isProvisional: false,
      note: '',
      description: archetype.description,
      color: archetype.color,
      recommendations: archetype.recommendations,
      alternatives,
      metrics,
    };
  }

  // ============================================================
  // TWO-YEAR CLASSIFICATION (PGY1 + PGY2)
  // Returns provisional "Trending:" archetypes
  // ============================================================
  
  private classifyTwoYear(pgy1: number, pgy2: number): ClassificationResult {
    const d12 = pgy2 - pgy1;
    
    const metrics: ClassificationMetrics = {
      pgy1, pgy2, pgy3: null,
      delta12: d12,
      delta23: null,
      deltaTotal: null,
    };

    let archetypeId: string;
    let confidence: number;

    // Elite trajectory
    if (pgy1 >= 85 && pgy2 >= 85) {
      archetypeId = 'elite_performer';
      confidence = 0.85;
    }
    // Breakthrough trajectory
    else if (d12 >= 25 && pgy2 >= 60) {
      archetypeId = 'breakthrough_performer';
      confidence = 0.75;
    }
    // Peak trajectory (may decline based on 2024 patterns)
    else if (d12 >= 10 && pgy2 >= 60) {
      archetypeId = 'trending_peak';
      confidence = 0.70;
    }
    // Sophomore slump
    else if (d12 <= -15) {
      archetypeId = 'trending_slump';
      confidence = 0.75;
    }
    // Low trajectory
    else if (pgy1 <= 40 && pgy2 <= 40) {
      archetypeId = 'trending_late_bloomer';
      confidence = 0.70;
    }
    // Declining
    else if (d12 < -10 && pgy2 < 50) {
      archetypeId = 'trending_decline';
      confidence = 0.75;
    }
    // Stable/moderate
    else if (Math.abs(d12) <= 15) {
      archetypeId = 'trending_stable';
      confidence = 0.65;
    }
    // Default
    else {
      archetypeId = 'trending_variable';
      confidence = 0.50;
    }

    const provisional = TWO_YEAR_ARCHETYPES[archetypeId];
    
    return {
      archetypeId,
      archetypeName: provisional.name,
      confidence,
      dataYears: 2,
      riskLevel: provisional.riskLevel,
      isProvisional: true,
      note: provisional.note,
      description: provisional.description,
      color: provisional.color,
      recommendations: provisional.recommendations,
      alternatives: [],
      metrics,
    };
  }

  // ============================================================
  // ONE-YEAR CLASSIFICATION (PGY1 only)
  // Returns provisional "Potential:" archetypes
  // ============================================================
  
  private classifyOneYear(pgy1: number): ClassificationResult {
    const metrics: ClassificationMetrics = {
      pgy1, pgy2: null, pgy3: null,
      delta12: null, delta23: null, deltaTotal: null,
    };

    let archetypeId: string;
    let confidence: number;

    if (pgy1 >= 85) {
      archetypeId = 'potential_elite';
      confidence = 0.60;
    } else if (pgy1 >= 65) {
      archetypeId = 'potential_strong';
      confidence = 0.55;
    } else if (pgy1 >= 40) {
      archetypeId = 'potential_average';
      confidence = 0.50;
    } else if (pgy1 >= 20) {
      archetypeId = 'potential_below_average';
      confidence = 0.55;
    } else {
      archetypeId = 'potential_at_risk';
      confidence = 0.60;
    }

    const provisional = ONE_YEAR_ARCHETYPES[archetypeId];
    
    return {
      archetypeId,
      archetypeName: provisional.name,
      confidence,
      dataYears: 1,
      riskLevel: provisional.riskLevel,
      isProvisional: true,
      note: provisional.note,
      description: provisional.description,
      color: provisional.color,
      recommendations: provisional.recommendations,
      alternatives: [],
      metrics,
    };
  }

  // ============================================================
  // NO DATA RESULT
  // ============================================================
  
  private noDataResult(): ClassificationResult {
    return {
      archetypeId: 'awaiting_data',
      archetypeName: 'Awaiting Data',
      confidence: 0,
      dataYears: 0,
      riskLevel: 'Low',
      isProvisional: true,
      note: 'No ITE data available yet',
      description: 'Awaiting first ITE score',
      color: '#BDC3C7',
      recommendations: ['Await PGY1 ITE results'],
      alternatives: [],
      metrics: {
        pgy1: null, pgy2: null, pgy3: null,
        delta12: null, delta23: null, deltaTotal: null,
      },
    };
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  private calculateAlternatives(
    metrics: ClassificationMetrics,
    alternatives: Array<{ archetypeId: string; archetypeName: string; confidence: number }>
  ): void {
    const { pgy1, pgy2, pgy3, delta12, delta23 } = metrics;
    
    if (pgy1 === null || pgy2 === null || pgy3 === null || delta12 === null || delta23 === null) {
      return;
    }

    // Check partial fits for alternative suggestions
    if (pgy1 >= 70 && pgy3 < 50) {
      alternatives.push({ 
        archetypeId: 'elite_late_struggle', 
        archetypeName: 'Elite → Late Struggle', 
        confidence: 0.45 
      });
    }
    if (delta12 >= 5 && delta23 <= -20) {
      alternatives.push({ 
        archetypeId: 'peak_decline', 
        archetypeName: 'Peak & Decline', 
        confidence: 0.40 
      });
    }
    if (delta12 <= -10 && delta23 >= 20) {
      alternatives.push({ 
        archetypeId: 'sophomore_slump_recovery', 
        archetypeName: 'Sophomore Slump → Strong Recovery', 
        confidence: 0.35 
      });
    }

    // Sort by confidence descending
    alternatives.sort((a, b) => b.confidence - a.confidence);
    
    // Keep top 3
    alternatives.splice(3);
  }
}

// ============================================================
// FULL CLASSIFICATION WITH DATABASE INTEGRATION
// ============================================================

export async function classifyResident(
  residentId: string, 
  supabaseClient?: ReturnType<typeof createClient>
): Promise<FullClassificationResult | null> {
  const supabase = supabaseClient || createClient();
  const classifier = new MemorialArchetypeClassifier();

  // 1. Fetch Resident Scores
  const { data: scores, error } = await supabase
    .from('ite_scores')
    .select('*')
    .eq('resident_id', residentId);

  if (error) {
    console.error('[MemorialClassifier] Error fetching scores:', error);
    return null;
  }

  // 2. Extract scores by PGY level
  const getScore = (pgy: number): number | null => {
    const score = scores?.find(s => {
      const level = typeof s.pgy_level === 'string' 
        ? parseInt(s.pgy_level.replace(/\D/g, '')) 
        : s.pgy_level;
      return level === pgy;
    });
    return score?.percentile ?? null;
  };

  const pgy1 = getScore(1);
  const pgy2 = getScore(2);
  const pgy3 = getScore(3);

  // 3. Classify
  const result = classifier.classify({ pgy1, pgy2, pgy3 });

  // 4. Find similar residents
  const similarResidents = await findSimilarResidents(
    supabase,
    residentId,
    pgy1,
    pgy2,
    result.metrics.delta12
  );

  return {
    ...result,
    residentId,
    similarResidents,
  };
}

// ============================================================
// SIMILAR RESIDENTS FINDER
// ============================================================

async function findSimilarResidents(
  supabase: ReturnType<typeof createClient>,
  currentResidentId: string,
  pgy1: number | null,
  pgy2: number | null,
  delta12: number | null
): Promise<SimilarResident[]> {
  if (pgy1 === null || pgy2 === null) {
    return []; // Need at least 2 years for similarity
  }

  const { data: allScores, error } = await supabase
    .from('ite_scores')
    .select('resident_id, pgy_level, percentile, residents(id, user_profiles(full_name), classes(graduation_year))')
    .neq('resident_id', currentResidentId);

  if (error) {
    console.error('[MemorialClassifier] Error fetching similar residents:', error);
    return [];
  }

  if (!allScores) return [];

  // Group by resident
  const residentMap = new Map<string, { 
    id: string; 
    name: string; 
    classYear: number; 
    scores: Record<number, number> 
  }>();

  for (const row of allScores) {
    const resId = row.resident_id;
    if (!residentMap.has(resId)) {
      const res = Array.isArray(row.residents) ? row.residents[0] : row.residents;
      if (!res) continue;
      
      // Handle user_profiles which may be an array or object
      const userProfile = Array.isArray(res.user_profiles) ? res.user_profiles[0] : res.user_profiles;
      const classData = Array.isArray(res.classes) ? res.classes[0] : res.classes;
      const name = userProfile?.full_name || 'Unknown';
      const year = classData?.graduation_year || 0;
      
      residentMap.set(resId, {
        id: resId,
        name: name,
        classYear: year,
        scores: {}
      });
    }
    
    const pgyNum = typeof row.pgy_level === 'string'
      ? parseInt(row.pgy_level.replace(/\D/g, ''))
      : row.pgy_level;
    
    if (!isNaN(pgyNum) && row.percentile !== null) {
      residentMap.get(resId)!.scores[pgyNum] = row.percentile;
    }
  }

  // Calculate Similarity
  const candidates: SimilarResident[] = [];
  const currentDelta = delta12 ?? (pgy2 - pgy1);

  for (const res of residentMap.values()) {
    const rPgy1 = res.scores[1];
    const rPgy2 = res.scores[2];
    const rPgy3 = res.scores[3] ?? null;

    if (rPgy1 === undefined || rPgy2 === undefined) continue;

    const rDelta = rPgy2 - rPgy1;

    // Weighted Euclidean distance
    const distSq = 
      0.3 * Math.pow((pgy1 - rPgy1) / 100, 2) + 
      0.3 * Math.pow((pgy2 - rPgy2) / 100, 2) + 
      0.4 * Math.pow((currentDelta - rDelta) / 100, 2);

    const distance = Math.sqrt(distSq);
    const similarity = Math.max(0, 1 - distance * 2);

    if (similarity > 0.5) { // Lower threshold for more matches
      // Classify this resident to get their archetype
      const classifier = new MemorialArchetypeClassifier();
      const classification = classifier.classify({ 
        pgy1: rPgy1, 
        pgy2: rPgy2, 
        pgy3: rPgy3 
      });

      candidates.push({
        id: res.id,
        name: res.name,
        classYear: res.classYear,
        similarityScore: similarity,
        iteScores: {
          pgy1: rPgy1,
          pgy2: rPgy2,
          pgy3: rPgy3
        },
        archetype: classification.archetypeName
      });
    }
  }

  return candidates.sort((a, b) => b.similarityScore - a.similarityScore).slice(0, 5);
}

// ============================================================
// FACTORY AND SINGLETON
// ============================================================

export function createMemorialClassifier(): MemorialArchetypeClassifier {
  return new MemorialArchetypeClassifier();
}

export const memorialClassifier = new MemorialArchetypeClassifier();


