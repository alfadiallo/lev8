// Anonymization utilities for protecting resident PII before sending to external AI APIs

/**
 * In-memory mapping of resident IDs to pseudonyms for the current session
 * This is intentionally NOT persisted to ensure privacy
 */
const sessionPseudonymMap = new Map<string, string>();
let pseudonymCounter = 0;

/**
 * Generate a consistent pseudonymous identifier for a resident
 * Uses letters A-Z, then AA, AB, etc.
 */
export function generateResidentPseudonym(residentId: string): string {
  // Check if we already have a pseudonym for this resident in this session
  if (sessionPseudonymMap.has(residentId)) {
    return sessionPseudonymMap.get(residentId)!;
  }

  // Generate new pseudonym
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let pseudonym = '';
  let num = pseudonymCounter;

  do {
    pseudonym = letters[num % 26] + pseudonym;
    num = Math.floor(num / 26) - 1;
  } while (num >= 0);

  pseudonym = `Resident ${pseudonym}`;
  
  sessionPseudonymMap.set(residentId, pseudonym);
  pseudonymCounter++;

  return pseudonym;
}

/**
 * Anonymize a resident's name by replacing it with a pseudonym
 */
export function anonymizeResidentName(residentId: string, residentName: string): string {
  return generateResidentPseudonym(residentId);
}

/**
 * Anonymize dates by converting them to relative time periods
 * This prevents identification through temporal correlation
 */
export function anonymizeDate(date: string): string {
  try {
    const d = new Date(date);
    const month = d.getMonth(); // 0-11
    
    // Convert to academic year periods
    if (month >= 6 && month <= 8) {
      return 'Early in rotation period';
    } else if (month >= 9 && month <= 11) {
      return 'Mid-rotation period';
    } else if (month >= 0 && month <= 2) {
      return 'Late in rotation period';
    } else {
      return 'Spring rotation period';
    }
  } catch {
    return 'During rotation period';
  }
}

/**
 * PHI patterns to detect and redact
 */
const PHI_PATTERNS = [
  // Medical Record Numbers (various formats)
  { pattern: /\b(MRN|MR#|Medical Record)\s*[:#]?\s*\d{5,10}\b/gi, replacement: '[MRN REDACTED]' },
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN REDACTED]' }, // SSN
  
  // Patient names (common patterns in medical notes)
  { pattern: /\b(patient|pt\.?|mr\.?|mrs\.?|ms\.?)\s+[A-Z][a-z]+\s+[A-Z][a-z]+\b/gi, replacement: 'the patient' },
  { pattern: /\b(patient|pt\.?)\s+[A-Z]\.\s*[A-Z]\./gi, replacement: 'the patient' },
  
  // Phone numbers
  { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, replacement: '[PHONE REDACTED]' },
  
  // Email addresses
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL REDACTED]' },
  
  // Dates in various formats (MM/DD/YYYY, MM-DD-YYYY, etc.)
  { pattern: /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/g, replacement: '[DATE]' },
  
  // Specific times
  { pattern: /\b\d{1,2}:\d{2}\s*(AM|PM|am|pm)?\b/g, replacement: '[TIME]' },
  
  // Hospital/facility identifiers
  { pattern: /\b(room|bed|unit)\s*#?\s*\d+[A-Z]?\b/gi, replacement: '[LOCATION REDACTED]' },
];

/**
 * Scrub Protected Health Information (PHI) from comment text
 * Uses pattern matching to detect and redact common PHI elements
 */
export function scrubPHI(commentText: string): string {
  let scrubbedText = commentText;

  // Apply all PHI patterns
  for (const { pattern, replacement } of PHI_PATTERNS) {
    scrubbedText = scrubbedText.replace(pattern, replacement);
  }

  return scrubbedText;
}

/**
 * Check if text contains potential PII/PHI
 * Returns true if suspicious patterns are detected
 * 
 * NOTE: This is intentionally conservative to avoid false positives.
 * We only flag clear PII like SSN, email, or "Dr. Last, First" patterns.
 * Generic medical comments with capitalized words are allowed.
 */
export function containsPII(text: string): boolean {
  // Check for CLEAR PII patterns only (avoid false positives)
  const suspiciousPatterns = [
    /\bDr\.\s+[A-Z][a-z]+,\s+[A-Z][a-z]+\b/, // "Dr. Last, First" (faculty name format)
    /\b[A-Z][a-z]+,\s+[A-Z][a-z]+,\s+(MD|DO|PhD|MPH)\b/, // "Last, First, MD" format
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
    /\bMRN[:#]?\s*\d{5,10}\b/i, // Medical Record Number
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(text)) {
      return true;
    }
  }

  return false;
}

/**
 * Anonymize a complete comment object
 */
export interface CommentWithDate {
  text: string;
  date: string;
}

export function anonymizeComment(comment: CommentWithDate): CommentWithDate {
  return {
    text: scrubPHI(comment.text),
    date: anonymizeDate(comment.date),
  };
}

/**
 * Anonymize an array of comments
 */
export function anonymizeComments(comments: CommentWithDate[]): CommentWithDate[] {
  return comments.map(anonymizeComment);
}

/**
 * Clear the session pseudonym mapping
 * Call this at the end of an analysis session
 */
export function clearSessionMapping(): void {
  sessionPseudonymMap.clear();
  pseudonymCounter = 0;
}

/**
 * Get statistics about the current session
 * Useful for logging and debugging
 */
export function getSessionStats() {
  return {
    residentsAnonymized: sessionPseudonymMap.size,
    pseudonymsGenerated: pseudonymCounter,
  };
}

