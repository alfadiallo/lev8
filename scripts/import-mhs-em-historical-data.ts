/**
 * Import MHS EM Historical EQ·PQ·IQ Data
 *
 * Imports faculty evaluations and resident self-assessments from CSV files
 * into the structured_ratings table. Idempotent — skips duplicates.
 *
 * Usage: npx tsx scripts/import-mhs-em-historical-data.ts
 *
 * Prerequisites:
 *   - .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY
 *   - Faculty and resident records already seeded in the database
 *   - The dynamic averaging trigger migration applied
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// CSV file paths
const FACULTY_CSV = resolve(
  process.cwd(),
  'docs/_guidance/EQ-PQ-IQ/CCC/Data/MHS/EM/faculty.csv'
);
const RESIDENT_CSV = resolve(
  process.cwd(),
  'docs/_guidance/EQ-PQ-IQ/CCC/Data/MHS/EM/resident.csv'
);

// ============================================================================
// Name normalization helpers
// ============================================================================

function normalizeName(name: string): string {
  return name
    .replace(/,?\s*(MD|DO|MPH|PhD|RN|PA|NP)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Match a CSV faculty name to the database.
 * Returns { facultyId, fullName } or null.
 */
function findFaculty(
  csvName: string,
  facultyMap: Map<string, { id: string; fullName: string }>
): { id: string; fullName: string } | null {
  const normalized = normalizeName(csvName).toLowerCase();

  // Direct match
  for (const [key, val] of facultyMap) {
    if (key === normalized) return val;
  }

  // Partial last-name match
  const parts = normalized.split(' ');
  const lastName = parts[parts.length - 1];
  for (const [key, val] of facultyMap) {
    if (key.includes(lastName)) return val;
  }

  return null;
}

/**
 * Match a CSV resident name to the database.
 * Handles partial names (first name only, last name only, nicknames).
 */
function findResident(
  csvName: string,
  residentMap: Map<string, { id: string; fullName: string }>
): { id: string; fullName: string } | null {
  const normalized = csvName.trim().toLowerCase();

  // Direct match
  for (const [key, val] of residentMap) {
    if (key === normalized) return val;
  }

  // Partial match (first or last name)
  for (const [key, val] of residentMap) {
    const parts = key.split(' ');
    const firstName = parts[0];
    const lastName = parts[parts.length - 1];
    if (normalized === firstName || normalized === lastName) return val;
  }

  // Contains match
  for (const [key, val] of residentMap) {
    if (key.includes(normalized) || normalized.includes(key)) return val;
  }

  return null;
}

// ============================================================================
// CSV column → DB column mapping
// ============================================================================

// Faculty CSV column headers
const FACULTY_COL_MAP: Record<string, string> = {
  'Emotional Quotient (EQ) [Empathy and Positive Interactions]':
    'eq_empathy_positive_interactions',
  'Emotional Quotient (EQ) [Adaptability and Self-Awareness]':
    'eq_adaptability_self_awareness',
  'Emotional Quotient (EQ) [Stress Management and Resilience]':
    'eq_stress_management_resilience',
  'Emotional Quotient (EQ) [Curiosity & Growth Mindset]':
    'eq_curiosity_growth_mindset',
  'Emotional Quotient (EQ) [Effectiveness in communication]':
    'eq_effectiveness_communication',
  'Clinical Acumen and Critical Thinking (IQ) [Strong Knowledge Base]':
    'iq_knowledge_base',
  'Clinical Acumen and Critical Thinking (IQ) [Analytical Thinking and Problem-Solving]':
    'iq_analytical_thinking',
  'Clinical Acumen and Critical Thinking (IQ) [Commitment to Learning]':
    'iq_commitment_learning',
  'Clinical Acumen and Critical Thinking (IQ) [Adaptability in Clinical Reasoning]':
    'iq_clinical_flexibility',
  'Clinical Acumen and Critical Thinking (IQ) [Clinical abilities for level of training]':
    'iq_performance_for_level',
  'Professional Decorum and Leadership (PQ) [Work Ethic, Reliability & Professional Presence]':
    'pq_work_ethic_reliability',
  'Professional Decorum and Leadership (PQ) [Integrity and Accountability]':
    'pq_integrity_accountability',
  'Professional Decorum and Leadership (PQ) [Teachability and Receptiveness]':
    'pq_teachability_receptiveness',
  'Professional Decorum and Leadership (PQ) [Clear and Timely Documentation]':
    'pq_documentation',
  'Professional Decorum and Leadership (PQ) [Ability to lead & build relationships]':
    'pq_leadership_relationships',
};

// Resident CSV column headers (different section names, same attributes)
const RESIDENT_COL_MAP: Record<string, string> = {
  'Mastering Interpersonal and Intrapersonal Skills [Empathy and Positive Interactions]':
    'eq_empathy_positive_interactions',
  'Mastering Interpersonal and Intrapersonal Skills [Adaptability and Self-Awareness]':
    'eq_adaptability_self_awareness',
  'Mastering Interpersonal and Intrapersonal Skills [Stress Management and Resilience]':
    'eq_stress_management_resilience',
  'Mastering Interpersonal and Intrapersonal Skills [Curiosity & Growth Mindset]':
    'eq_curiosity_growth_mindset',
  'Mastering Interpersonal and Intrapersonal Skills [Effectiveness in communication]':
    'eq_effectiveness_communication',
  'Clinical Acumen and Critical Thinking [Strong Knowledge Base]':
    'iq_knowledge_base',
  'Clinical Acumen and Critical Thinking [Analytical Thinking and Problem-Solving]':
    'iq_analytical_thinking',
  'Clinical Acumen and Critical Thinking [Commitment to Learning]':
    'iq_commitment_learning',
  'Clinical Acumen and Critical Thinking [Adaptability in Clinical Reasoning]':
    'iq_clinical_flexibility',
  'Clinical Acumen and Critical Thinking [Clinical abilities for your level of training]':
    'iq_performance_for_level',
  'Professional Decorum and Leadership  [Work Ethic, Reliability & Professional Presence]':
    'pq_work_ethic_reliability',
  'Professional Decorum and Leadership  [Integrity and Accountability]':
    'pq_integrity_accountability',
  'Professional Decorum and Leadership  [Teachability and Receptiveness]':
    'pq_teachability_receptiveness',
  'Professional Decorum and Leadership  [Clear and Timely Documentation]':
    'pq_documentation',
  'Professional Decorum and Leadership  [Ability to lead & build relationships]':
    'pq_leadership_relationships',
};

// ============================================================================
// Parse helpers
// ============================================================================

function parseScore(val: string | undefined): number | null {
  if (!val || val.trim() === '' || val === '#N/A' || val === '#DIV/0!') return null;
  const num = parseFloat(val);
  if (isNaN(num)) return null;
  if (num < 1.0 || num > 5.0) return null;
  // Convert 1-5 scale to 0-100: (val - 1) * 25
  return (num - 1) * 25;
}

function parseCsvDate(dateStr: string): string {
  // Format: M/D/YY HH:MM
  const parts = dateStr.trim().split(' ');
  const dateParts = parts[0].split('/');
  const month = parseInt(dateParts[0]);
  const day = parseInt(dateParts[1]);
  let year = parseInt(dateParts[2]);
  if (year < 100) year += 2000;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ============================================================================
// Main import logic
// ============================================================================

async function main() {
  console.log('📊 MHS EM Historical EQ·PQ·IQ Data Import\n');

  // ──────────────────────────────────────────────
  // Step 1: Build faculty lookup
  // ──────────────────────────────────────────────
  console.log('📋 Step 1: Loading faculty from database...');
  const { data: facultyRows, error: facError } = await supabase
    .from('faculty')
    .select('id, user_id, full_name, email, is_active')
    .eq('is_active', true);

  if (facError || !facultyRows) {
    console.error('  ❌ Failed to load faculty:', facError?.message);
    process.exit(1);
  }

  const facultyMap = new Map<string, { id: string; fullName: string }>();
  for (const f of facultyRows) {
    if (f.full_name) {
      facultyMap.set(f.full_name.toLowerCase(), {
        id: f.id,
        fullName: f.full_name,
      });
    }
  }
  console.log(`  ✅ Found ${facultyMap.size} faculty members\n`);

  // ──────────────────────────────────────────────
  // Step 2: Build resident lookup
  // ──────────────────────────────────────────────
  console.log('📋 Step 2: Loading residents from database...');
  const { data: residentRows, error: resError } = await supabase
    .from('residents')
    .select('id, user_id, anon_code')
    .order('anon_code');

  if (resError || !residentRows) {
    console.error('  ❌ Failed to load residents:', resError?.message);
    process.exit(1);
  }

  // Fetch user profiles separately (avoid FK join schema cache issues)
  const residentUserIds = residentRows.map((r) => r.user_id).filter(Boolean);
  const { data: residentProfiles } = await supabase
    .from('user_profiles')
    .select('id, full_name, email')
    .in('id', residentUserIds);

  const resProfileById = new Map<string, { full_name: string; email: string }>();
  for (const p of residentProfiles || []) {
    resProfileById.set(p.id, { full_name: p.full_name, email: p.email });
  }

  const residentMap = new Map<string, { id: string; fullName: string }>();
  for (const r of residentRows) {
    const profile = resProfileById.get(r.user_id);
    if (profile?.full_name) {
      residentMap.set(profile.full_name.toLowerCase(), {
        id: r.id,
        fullName: profile.full_name,
      });
    }
  }
  console.log(`  ✅ Found ${residentMap.size} residents\n`);

  // ──────────────────────────────────────────────
  // Step 3: Get program ID
  // ──────────────────────────────────────────────
  console.log('📋 Step 3: Getting MHS EM program ID...');
  const { data: program } = await supabase
    .from('programs')
    .select('id, name, specialty')
    .eq('specialty', 'Emergency Medicine')
    .limit(1)
    .single();

  if (!program) {
    console.error('  ❌ No Emergency Medicine program found. Ensure the program exists in the database.');
    process.exit(1);
  }
  console.log(`  ✅ Program: ${program.name} (${program.specialty})\n`);

  // ──────────────────────────────────────────────
  // Step 4: Load existing ratings for deduplication
  // ──────────────────────────────────────────────
  console.log('📋 Step 4: Loading existing ratings for dedup...');
  const { data: existingRatings } = await supabase
    .from('structured_ratings')
    .select('resident_id, faculty_id, rater_type, evaluation_date, period_label');

  const existingSet = new Set<string>();
  for (const r of existingRatings || []) {
    const key = `${r.resident_id}|${r.faculty_id || 'self'}|${r.rater_type}|${r.evaluation_date}|${r.period_label}`;
    existingSet.add(key);
  }
  console.log(`  ✅ ${existingSet.size} existing ratings loaded\n`);

  // ──────────────────────────────────────────────
  // Step 5: Import faculty evaluations
  // ──────────────────────────────────────────────
  console.log('📋 Step 5: Importing faculty evaluations...');
  const facultyCsvRaw = readFileSync(FACULTY_CSV, 'utf-8');
  // Strip BOM if present
  const facultyCsv = facultyCsvRaw.charCodeAt(0) === 0xFEFF ? facultyCsvRaw.slice(1) : facultyCsvRaw;
  const facultyRecords = parse(facultyCsv, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
    bom: true,
  });

  let facInserted = 0;
  let facSkipDup = 0;
  let facSkipNoMatch = 0;
  let facSkipEmpty = 0;
  const facMissing = new Map<string, number>();

  for (const row of facultyRecords) {
    const csvFaculty = row['Faculty'];
    const csvResident = row['Resident'];
    const csvTimestamp = row['Timestamp'];
    const csvPgy = (row['[Program Year]'] || row[' [Program Year]'])?.trim();
    const csvPeriod = (row['[Evaluation period]'] || row[' [Evaluation period]'])?.trim();
    const csvClass = row['Class'];
    const csvPeriodLabel = row['Combined Class & Period']?.trim();
    const csvComments = row['Comments']?.trim() || null;

    if (!csvFaculty || !csvResident || !csvTimestamp) continue;

    // Match faculty
    const faculty = findFaculty(csvFaculty, facultyMap);
    if (!faculty) {
      const name = normalizeName(csvFaculty);
      facMissing.set(name, (facMissing.get(name) || 0) + 1);
      facSkipNoMatch++;
      continue;
    }

    // Match resident
    const resident = findResident(csvResident, residentMap);
    if (!resident) {
      facMissing.set(`Resident: ${csvResident}`, (facMissing.get(`Resident: ${csvResident}`) || 0) + 1);
      facSkipNoMatch++;
      continue;
    }

    // Parse date
    const evalDate = parseCsvDate(csvTimestamp);

    // Check dedup
    const dedupKey = `${resident.id}|${faculty.id}|faculty|${evalDate}|${csvPeriodLabel}`;
    if (existingSet.has(dedupKey)) {
      facSkipDup++;
      continue;
    }

    // Build the rating record
    const record: Record<string, unknown> = {
      resident_id: resident.id,
      rater_type: 'core_faculty',
      faculty_id: faculty.id,
      evaluation_date: evalDate,
      pgy_level: csvPgy || null,
      period: csvPeriod || null,
      period_label: csvPeriodLabel || null,
    };

    // Map attribute scores
    let hasAnyScore = false;
    for (const [csvCol, dbCol] of Object.entries(FACULTY_COL_MAP)) {
      const val = parseScore(row[csvCol]);
      record[dbCol] = val;
      if (val !== null) hasAnyScore = true;
    }

    if (!hasAnyScore) {
      facSkipEmpty++;
      continue;
    }

    // Insert
    const { error: insertError } = await supabase
      .from('structured_ratings')
      .insert(record);

    if (insertError) {
      console.error(`  ❌ Insert error for ${csvFaculty} → ${csvResident}: ${insertError.message}`);
    } else {
      facInserted++;
      existingSet.add(dedupKey);
    }
  }

  console.log(`  ✅ Faculty evaluations: ${facInserted} inserted, ${facSkipDup} duplicates, ${facSkipNoMatch} unmatched, ${facSkipEmpty} empty`);
  if (facMissing.size > 0) {
    console.log('  ⚠️  Unmatched names:');
    for (const [name, count] of facMissing) {
      console.log(`     - ${name} (${count} rows)`);
    }
  }
  console.log('');

  // ──────────────────────────────────────────────
  // Step 6: Import resident self-assessments
  // ──────────────────────────────────────────────
  console.log('📋 Step 6: Importing resident self-assessments...');
  const residentCsvRaw = readFileSync(RESIDENT_CSV, 'utf-8');
  const residentCsv = residentCsvRaw.charCodeAt(0) === 0xFEFF ? residentCsvRaw.slice(1) : residentCsvRaw;
  const residentRecords = parse(residentCsv, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
    bom: true,
  });

  let selfInserted = 0;
  let selfSkipDup = 0;
  let selfSkipNoMatch = 0;
  let selfSkipEmpty = 0;
  const selfMissing = new Map<string, number>();

  for (const row of residentRecords) {
    const csvName = row['What is your name?']?.trim();
    const csvTimestamp = row['Timestamp'];
    const csvPgy = (row['[Program Year]'] || row[' [Program Year]'])?.trim();
    const csvPeriod = row['Period']?.trim();
    const csvClass = row['Class'];
    const csvEmail = row['What is your email?']?.trim();
    const csvConcerns = row[
      'Do you have any concerns and/or goals you have at this stage of your career?'
    ]?.trim() || null;

    if (!csvName || !csvTimestamp) continue;

    // Match resident
    const resident = findResident(csvName, residentMap);
    if (!resident) {
      selfMissing.set(csvName, (selfMissing.get(csvName) || 0) + 1);
      selfSkipNoMatch++;
      continue;
    }

    // Parse date
    const evalDate = parseCsvDate(csvTimestamp);

    // Build period label
    const periodLabel = csvPgy && csvPeriod ? `${csvPgy} ${csvPeriod}` : null;

    // Check dedup
    const dedupKey = `${resident.id}|self|self|${evalDate}|${periodLabel}`;
    if (existingSet.has(dedupKey)) {
      selfSkipDup++;
      continue;
    }

    // Build the rating record
    const record: Record<string, unknown> = {
      resident_id: resident.id,
      rater_type: 'self',
      faculty_id: null,
      evaluation_date: evalDate,
      pgy_level: csvPgy || null,
      period: csvPeriod || null,
      period_label: periodLabel,
      concerns_goals: csvConcerns,
    };

    // Map attribute scores
    let hasAnyScore = false;
    for (const [csvCol, dbCol] of Object.entries(RESIDENT_COL_MAP)) {
      const val = parseScore(row[csvCol]);
      record[dbCol] = val;
      if (val !== null) hasAnyScore = true;
    }

    if (!hasAnyScore) {
      selfSkipEmpty++;
      continue;
    }

    // Insert
    const { error: insertError } = await supabase
      .from('structured_ratings')
      .insert(record);

    if (insertError) {
      console.error(`  ❌ Insert error for ${csvName}: ${insertError.message}`);
    } else {
      selfInserted++;
      existingSet.add(dedupKey);
    }
  }

  console.log(`  ✅ Self-assessments: ${selfInserted} inserted, ${selfSkipDup} duplicates, ${selfSkipNoMatch} unmatched, ${selfSkipEmpty} empty`);
  if (selfMissing.size > 0) {
    console.log('  ⚠️  Unmatched names:');
    for (const [name, count] of selfMissing) {
      console.log(`     - ${name} (${count} rows)`);
    }
  }
  console.log('');

  // ──────────────────────────────────────────────
  // Summary
  // ──────────────────────────────────────────────
  console.log('='.repeat(60));
  console.log('📊 Import Summary');
  console.log('='.repeat(60));
  console.log(`  Faculty evaluations inserted: ${facInserted}`);
  console.log(`  Self-assessments inserted:    ${selfInserted}`);
  console.log(`  Total new ratings:            ${facInserted + selfInserted}`);
  console.log(`  Duplicates skipped:           ${facSkipDup + selfSkipDup}`);
  console.log(`  Unmatched names:              ${facSkipNoMatch + selfSkipNoMatch}`);
  console.log(`  Empty/invalid rows:           ${facSkipEmpty + selfSkipEmpty}`);
  console.log('');
  console.log('✨ Done!\n');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
