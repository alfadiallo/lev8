// Name Matcher Utility
// Reconciles MedHub format ("Dr. Last, First") with Lev8 format ("First Last")

export interface NameParseResult {
  firstName: string;
  lastName: string;
  fullName: string; // "First Last" format
  confidence: 'exact' | 'fuzzy' | 'manual';
}

/**
 * Parse MedHub name format: "Dr. Last, First" → "First Last"
 */
export function parseMedHubName(medHubName: string): NameParseResult | null {
  // Remove "Dr." prefix and trim
  let cleanName = medHubName.replace(/^Dr\.\s*/i, '').trim();
  
  // Check for comma (MedHub format: "Last, First")
  if (cleanName.includes(',')) {
    const [lastName, firstName] = cleanName.split(',').map(s => s.trim());
    
    if (lastName && firstName) {
      return {
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        confidence: 'exact'
      };
    }
  }
  
  // If no comma, assume already in "First Last" format
  const parts = cleanName.split(' ');
  if (parts.length >= 2) {
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');
    return {
      firstName,
      lastName,
      fullName: cleanName,
      confidence: 'exact'
    };
  }
  
  return null;
}

/**
 * Find matching resident by name
 */
export async function findResidentByMedHubName(
  medHubName: string,
  supabase: any
): Promise<{ resident_id: string; match_confidence: string } | null> {
  const parsed = parseMedHubName(medHubName);
  if (!parsed) return null;

  // Try exact match first
  const { data: exactMatch, error } = await supabase
    .from('residents')
    .select('id, user_profiles!inner(full_name)')
    .eq('user_profiles.full_name', parsed.fullName)
    .single();

  if (exactMatch) {
    return {
      resident_id: exactMatch.id,
      match_confidence: 'exact'
    };
  }

  // Try fuzzy match (case-insensitive, handle variations)
  const { data: fuzzyMatches } = await supabase
    .from('residents')
    .select('id, user_profiles!inner(full_name)')
    .ilike('user_profiles.full_name', `%${parsed.firstName}%${parsed.lastName}%`);

  if (fuzzyMatches && fuzzyMatches.length === 1) {
    return {
      resident_id: fuzzyMatches[0].id,
      match_confidence: 'fuzzy'
    };
  }

  // Multiple matches or no match - needs manual review
  return null;
}

/**
 * Batch match MedHub names to resident IDs
 */
export async function batchMatchResidents(
  medHubNames: string[],
  supabase: any
): Promise<Map<string, string>> {
  const nameToIdMap = new Map<string, string>();
  
  for (const medHubName of medHubNames) {
    const match = await findResidentByMedHubName(medHubName, supabase);
    if (match) {
      nameToIdMap.set(medHubName, match.resident_id);
    }
  }
  
  return nameToIdMap;
}

/**
 * Example usage:
 * 
 * const medHubName = "Dr. Abadi, Kevin";
 * const parsed = parseMedHubName(medHubName);
 * // Result: { firstName: "Kevin", lastName: "Abadi", fullName: "Kevin Abadi" }
 * 
 * const match = await findResidentByMedHubName(medHubName, supabase);
 * // Result: { resident_id: "uuid-here", match_confidence: "exact" }
 */



