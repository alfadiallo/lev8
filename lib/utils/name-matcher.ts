/**
 * Name Matching Utilities
 * 
 * Handles normalization and matching of faculty/resident names
 * from various sources (CSV imports, forms, etc.)
 */

/**
 * Strip medical credentials from a name
 * Examples:
 *   "Alfa Diallo, MD, MPH" → "Alfa Diallo"
 *   "Leon Melnitsky, DO" → "Leon Melnitsky"
 *   "Lara Goldstein, MD, PhD" → "Lara Goldstein"
 */
export function stripCredentials(name: string): string {
  if (!name) return '';
  
  // Remove everything after the first comma (credentials)
  const withoutCredentials = name.split(',')[0].trim();
  
  // Remove common prefixes
  const withoutPrefix = withoutCredentials
    .replace(/^Dr\.?\s+/i, '')
    .replace(/^Professor\s+/i, '')
    .replace(/^Prof\.?\s+/i, '');
  
  return withoutPrefix.trim();
}

/**
 * Normalize a name for matching
 * - Strips credentials
 * - Converts to lowercase
 * - Removes extra whitespace
 * - Handles middle initials
 */
export function normalizeName(name: string): string {
  if (!name) return '';
  
  const stripped = stripCredentials(name);
  
  // Convert to lowercase and remove extra spaces
  const normalized = stripped
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  
  return normalized;
}

/**
 * Check if two names match
 * Handles variations like:
 *   "Alfa Diallo" vs "Alfa Diallo, MD, MPH"
 *   "Franz C Mendoza-Garcia" vs "Franz Mendoza-Garcia"
 */
export function namesMatch(name1: string, name2: string): boolean {
  const norm1 = normalizeName(name1);
  const norm2 = normalizeName(name2);
  
  // Exact match
  if (norm1 === norm2) return true;
  
  // Check if one is a substring of the other (handles middle initials)
  // "Franz C Mendoza-Garcia" matches "Franz Mendoza-Garcia"
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    // Make sure it's a reasonable match (not just one letter)
    const minLength = Math.min(norm1.length, norm2.length);
    if (minLength >= 5) return true;
  }
  
  return false;
}

/**
 * Find the best matching name from a list
 * Returns the index of the best match, or -1 if no match found
 */
export function findBestMatch(target: string, candidates: string[]): number {
  const normalizedTarget = normalizeName(target);
  
  for (let i = 0; i < candidates.length; i++) {
    if (namesMatch(normalizedTarget, candidates[i])) {
      return i;
    }
  }
  
  return -1;
}

/**
 * Parse a full name into first and last name
 * Handles various formats:
 *   "Alfa Diallo" → { first: "Alfa", last: "Diallo" }
 *   "Franz C Mendoza-Garcia" → { first: "Franz", last: "Mendoza-Garcia" }
 */
export function parseName(fullName: string): { first: string; last: string } {
  const cleaned = stripCredentials(fullName);
  const parts = cleaned.split(' ').filter(p => p.length > 0);
  
  if (parts.length === 0) {
    return { first: '', last: '' };
  }
  
  if (parts.length === 1) {
    return { first: parts[0], last: '' };
  }
  
  // First name is the first part, last name is everything else
  const first = parts[0];
  const last = parts.slice(1).join(' ');
  
  return { first, last };
}

/**
 * Format a name consistently
 * "alfa diallo" → "Alfa Diallo"
 */
export function formatName(name: string): string {
  const cleaned = stripCredentials(name);
  
  return cleaned
    .split(' ')
    .map(part => {
      if (part.length === 0) return '';
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(' ');
}


