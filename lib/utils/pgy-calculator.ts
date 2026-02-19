/**
 * PGY Level Calculator
 * 
 * Calculates the Post-Graduate Year (PGY) level for a resident based on their
 * graduation year and a reference date (typically the progress check session date).
 * 
 * For a 3-year Emergency Medicine program:
 * - PGY-1: First year residents
 * - PGY-2: Second year residents  
 * - PGY-3: Third/final year residents (graduating)
 */

/**
 * Calculate the academic year for a given date.
 * Academic year runs July 1 - June 30.
 * 
 * @param date - The reference date
 * @returns The academic year (e.g., 2025 for July 2025 - June 2026)
 */
export function getAcademicYear(date: Date): number {
  const month = date.getMonth(); // 0-indexed (0 = January, 6 = July)
  const year = date.getFullYear();
  
  // If July or later (month >= 6), we're in the academic year that started this calendar year
  // If before July, we're in the academic year that started last calendar year
  return month >= 6 ? year : year - 1;
}

/**
 * Calculate PGY level based on graduation year and reference date.
 * 
 * @param graduationYear - The year the resident will graduate (e.g., 2026)
 * @param referenceDate - The date to calculate PGY level for (default: now)
 * @param programLengthYears - Length of residency program in years (default: 3 for EM)
 * @returns The PGY level (1, 2, or 3 for a 3-year program)
 * 
 * @example
 * // For Spring 2026 (Feb 2026, academic year 2025-2026):
 * calculatePGYLevel(2026, new Date('2026-02-15')) // Returns 3 (PGY-3, graduating)
 * calculatePGYLevel(2027, new Date('2026-02-15')) // Returns 2 (PGY-2)
 * calculatePGYLevel(2028, new Date('2026-02-15')) // Returns 1 (PGY-1)
 */
export function calculatePGYLevel(
  graduationYear: number,
  referenceDate: Date = new Date(),
  programLengthYears: number = 3
): number {
  const academicYear = getAcademicYear(referenceDate);
  
  // Years until graduation from start of current academic year
  const yearsUntilGraduation = graduationYear - academicYear - 1;
  
  // PGY level = program length - years remaining
  const pgyLevel = programLengthYears - yearsUntilGraduation;
  
  return pgyLevel;
}

/**
 * Get a formatted PGY label.
 * 
 * @param pgyLevel - The PGY level (1, 2, 3, etc.)
 * @returns Formatted string like "PGY-1", "PGY-2", etc.
 */
export function formatPGYLevel(pgyLevel: number): string {
  return `PGY-${pgyLevel}`;
}

/**
 * Calculate the graduation year for a given PGY level and reference date.
 * Inverse of calculatePGYLevel.
 * 
 * @param pgyLevel - The target PGY level
 * @param referenceDate - The reference date (default: now)
 * @param programLengthYears - Length of residency program in years (default: 3)
 * @returns The graduation year for that PGY level
 * 
 * @example
 * // For Spring 2026 (academic year 2025-2026):
 * getGraduationYearForPGY(3, new Date('2026-02-15')) // Returns 2026
 * getGraduationYearForPGY(2, new Date('2026-02-15')) // Returns 2027
 * getGraduationYearForPGY(1, new Date('2026-02-15')) // Returns 2028
 */
export function getGraduationYearForPGY(
  pgyLevel: number,
  referenceDate: Date = new Date(),
  programLengthYears: number = 3
): number {
  const academicYear = getAcademicYear(referenceDate);
  
  // Reverse the PGY calculation:
  // pgyLevel = programLengthYears - (graduationYear - academicYear - 1)
  // graduationYear = academicYear + 1 + (programLengthYears - pgyLevel)
  return academicYear + 1 + (programLengthYears - pgyLevel);
}

/**
 * Get all active PGY levels for a program.
 * 
 * @param programLengthYears - Length of residency program in years (default: 3)
 * @returns Array of PGY levels [1, 2, 3] for a 3-year program
 */
export function getActivePGYLevels(programLengthYears: number = 3): number[] {
  return Array.from({ length: programLengthYears }, (_, i) => i + 1);
}

/**
 * Check if a resident is currently active (not graduated).
 * 
 * @param graduationYear - The resident's graduation year
 * @param referenceDate - The reference date (default: now)
 * @returns True if the resident hasn't graduated yet
 */
export function isResidentActive(
  graduationYear: number,
  referenceDate: Date = new Date()
): boolean {
  const academicYear = getAcademicYear(referenceDate);
  // Resident is active if their graduation year is after the current academic year ends
  // Academic year 2025-2026 ends June 30, 2026, so Class of 2026 graduates then
  return graduationYear > academicYear;
}

/**
 * Format academic year as a string range.
 * 
 * @param academicYear - The starting year of the academic year
 * @returns Formatted string like "2025-2026"
 */
export function formatAcademicYear(academicYear: number): string {
  return `${academicYear}-${academicYear + 1}`;
}

/**
 * Get the academic year string for a given date.
 * 
 * @param date - The reference date
 * @returns Formatted academic year string like "2025-2026"
 */
export function getAcademicYearString(date: Date = new Date()): string {
  return formatAcademicYear(getAcademicYear(date));
}








