import { createClient } from '@/lib/supabase'; // Now correctly imports the service role client
import { 
  ArchetypeName, 
  DEFAULT_ARCHETYPE_DEFINITIONS, 
  SimilarResident 
} from '@/lib/types/archetypes';

// Legacy classification result type for this classifier
interface LegacyClassificationResult {
  resident_id: string;
  archetype: ArchetypeName;
  confidence: number;
  fit_details: Record<string, unknown>;
  similar_residents: SimilarResident[];
  needs_review: boolean;
  alternatives?: { archetype: ArchetypeName; confidence: number }[];
}

// Helper to get score for a PGY level
// Handles string "PGY-1" or "1", or number 1
function getScore(scores: Array<{ pgy_level: string | number; percentile: number | null; raw_score: number }>, pgy: string): { percentile: number, raw: number } | null {
  // Extract number from requested pgy (e.g. "PGY-1" -> 1)
  const pgyNum = parseInt(pgy.replace(/\D/g, ''));
  
  const s = scores.find(s => {
    // Check if DB pgy_level matches "PGY-1" format or just "1"
    const dbPgy = String(s.pgy_level);
    const dbNum = parseInt(dbPgy.replace(/\D/g, ''));
    return dbNum === pgyNum;
  });
  
  if (s && s.percentile !== null) return { percentile: s.percentile, raw: s.raw_score };
  return null;
}

export async function classifyResident(residentId: string, supabaseClient?: ReturnType<typeof createClient>): Promise<LegacyClassificationResult | null> {
  // Use passed client (likely service role) or create one
  const supabase = supabaseClient || createClient();

  // 1. Fetch Resident Scores
  const { data: scores, error } = await supabase
    .from('ite_scores')
    .select('*')
    .eq('resident_id', residentId);

  if (error || !scores || scores.length === 0) {
    // If no scores, we can't classify, but we shouldn't error out console unless debugging.
    // Return a graceful "Unclassified" result.
    return {
      resident_id: residentId,
      archetype: ArchetypeName.UNCLASSIFIED,
      confidence: 0,
      fit_details: { reason: 'No ITE data found' },
      similar_residents: [],
      needs_review: false
    };
  }

  // 2. Extract Metrics
  const pgy1 = getScore(scores, 'PGY-1');
  const pgy2 = getScore(scores, 'PGY-2');
  
  // We primarily classify based on PGY1 -> PGY2 trajectory
  if (!pgy1 || !pgy2) {
    // Insufficient data for trajectory classification
    return {
      resident_id: residentId,
      archetype: ArchetypeName.UNCLASSIFIED,
      confidence: 0,
      fit_details: { reason: 'Missing PGY-1 or PGY-2 scores' },
      similar_residents: [],
      needs_review: false
    };
  }

  const pgy1Score = pgy1.percentile;
  const pgy2Score = pgy2.percentile;
  const delta = pgy2Score - pgy1Score;

  // 3. Evaluate Archetypes
  let bestArchetype = ArchetypeName.UNCLASSIFIED;
  let bestConfidence = 0;
  let bestFitDetails: Record<string, unknown> = {};
  const alternatives: { archetype: ArchetypeName; confidence: number }[] = [];

  for (const def of DEFAULT_ARCHETYPE_DEFINITIONS) {
    let score = 0;
    let maxScore = 0;
    const details: Record<string, unknown> = {};

    // PGY1 Fit (Weight 30%)
    if (def.pgy1_range[0] !== null || def.pgy1_range[1] !== null) {
      maxScore += 30;
      const min = def.pgy1_range[0] ?? -Infinity;
      const max = def.pgy1_range[1] ?? Infinity;
      if (pgy1Score >= min && pgy1Score <= max) {
        score += 30;
        details.pgy1_match = true;
      } else {
        const dist = Math.min(Math.abs(pgy1Score - min), Math.abs(pgy1Score - max));
        if (dist < 10) score += 15; 
        details.pgy1_match = false;
      }
    }

    // PGY2 Fit (Weight 30%)
    if (def.pgy2_range[0] !== null || def.pgy2_range[1] !== null) {
      maxScore += 30;
      const min = def.pgy2_range[0] ?? -Infinity;
      const max = def.pgy2_range[1] ?? Infinity;
      if (pgy2Score >= min && pgy2Score <= max) {
        score += 30;
        details.pgy2_match = true;
      } else {
        const dist = Math.min(Math.abs(pgy2Score - min), Math.abs(pgy2Score - max));
        if (dist < 10) score += 15;
        details.pgy2_match = false;
      }
    }

    // Delta Fit (Weight 40%) - MOST IMPORTANT
    if (def.delta_range[0] !== null || def.delta_range[1] !== null) {
      maxScore += 40;
      const min = def.delta_range[0] ?? -Infinity;
      const max = def.delta_range[1] ?? Infinity;
      if (delta >= min && delta <= max) {
        score += 40;
        details.delta_match = true;
      } else {
        const dist = Math.min(Math.abs(delta - min), Math.abs(delta - max));
        if (dist < 5) score += 20;
        else if (dist < 10) score += 10;
        details.delta_match = false;
      }
    }

    const confidence = maxScore > 0 ? score / maxScore : 0;

    if (confidence > bestConfidence) {
      if (bestArchetype !== ArchetypeName.UNCLASSIFIED) {
        alternatives.push({ archetype: bestArchetype, confidence: bestConfidence });
      }
      bestArchetype = def.name;
      bestConfidence = confidence;
      bestFitDetails = details;
    } else if (confidence > 0.4) {
      alternatives.push({ archetype: def.name, confidence });
    }
  }

  // 4. Find Similar Residents
  // PASS THE SERVICE ROLE CLIENT to ensure we can see all residents
  const similarResidents = await findSimilarResidents(supabase, residentId, pgy1Score, pgy2Score, delta);

  // 5. Determine if Review Needed
  const needsReview = bestConfidence < 0.5 || bestArchetype === ArchetypeName.AT_RISK;

  return {
    resident_id: residentId,
    archetype: bestArchetype,
    confidence: bestConfidence,
    fit_details: bestFitDetails,
    similar_residents: similarResidents,
    needs_review: needsReview,
    alternatives: alternatives.sort((a, b) => b.confidence - a.confidence).slice(0, 2)
  };
}

async function findSimilarResidents(
  supabase: ReturnType<typeof createClient>,
  currentResidentId: string,
  pgy1: number,
  pgy2: number,
  delta: number
): Promise<SimilarResident[]> {
  // Use .from('ite_scores') with select including relations
  const { data: allScores, error } = await supabase
    .from('ite_scores')
    .select('resident_id, pgy_level, percentile, residents(id, user_profiles(full_name), classes(graduation_year))')
    .neq('resident_id', currentResidentId);

  if (error) {
    console.error('Error fetching similar residents:', error);
    return [];
  }

  if (!allScores) return [];

  // Group by resident
  const residentMap = new Map<string, { 
    id: string; 
    name: string; 
    class_year: number; 
    scores: Record<string, number> 
  }>();

  for (const row of allScores) {
    const resId = row.resident_id;
    if (!residentMap.has(resId)) {
      // Safe navigation
      const res = Array.isArray(row.residents) ? row.residents[0] : row.residents;
      if (!res) continue; 
      
      const name = res.user_profiles?.full_name || 'Unknown';
      const year = res.classes?.graduation_year || 0;
      
      residentMap.set(resId, {
        id: resId,
        name: name,
        class_year: year,
        scores: {}
      });
    }
    
    // Normalize PGY key to string "PGY-1", "PGY-2" for internal map consistency
    // row.pgy_level might be "1", 1, "PGY-1"
    const pgyNum = parseInt(String(row.pgy_level).replace(/\D/g, ''));
    if (!isNaN(pgyNum) && row.percentile !== null) {
        residentMap.get(resId)!.scores[`PGY-${pgyNum}`] = row.percentile;
    }
  }

  // Calculate Similarity
  const candidates: SimilarResident[] = [];

  for (const res of residentMap.values()) {
    const rPgy1 = res.scores['PGY-1'];
    const rPgy2 = res.scores['PGY-2'];
    const rPgy3 = res.scores['PGY-3'] || null;

    if (rPgy1 === undefined || rPgy2 === undefined) continue;

    const rDelta = rPgy2 - rPgy1;

    const distSq = 
      0.3 * Math.pow((pgy1 - rPgy1) / 100, 2) + 
      0.3 * Math.pow((pgy2 - rPgy2) / 100, 2) + 
      0.4 * Math.pow((delta - rDelta) / 100, 2); 

    const distance = Math.sqrt(distSq);
    const similarity = Math.max(0, 1 - distance * 2); 

    if (similarity > 0.6) {
      candidates.push({
        id: res.id,
        name: res.name, 
        classYear: res.class_year,
        similarityScore: similarity,
        iteScores: {
          pgy1: rPgy1,
          pgy2: rPgy2,
          pgy3: rPgy3
        }
      });
    }
  }

  return candidates.sort((a, b) => b.similarityScore - a.similarityScore).slice(0, 3);
}
