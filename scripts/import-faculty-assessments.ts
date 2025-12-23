#!/usr/bin/env tsx
/**
 * Import Faculty Assessments from CSV
 * 
 * Parses EQPQIQ Faculty Assessment of Residents.csv and imports into structured_ratings table
 * - 267 rows of faculty evaluations
 * - Matches faculty by name → faculty_id
 * - Matches residents by name → resident_id
 * - Maps 5 EQ + 5 IQ + 5 PQ attributes
 * - Handles missing values and duplicates
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { stripCredentials, normalizeName } from '../lib/utils/name-matcher';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CSVRow {
  Timestamp: string;
  Faculty: string;
  Resident: string;
  '[Program Year]': string;
  '[Evaluation period]': string;
  'Emotional Quotient (EQ) [Empathy and Positive Interactions]': string;
  'Emotional Quotient (EQ) [Adaptability and Self-Awareness]': string;
  'Emotional Quotient (EQ) [Stress Management and Resilience]': string;
  'Emotional Quotient (EQ) [Curiosity & Growth Mindset]': string;
  'Clinical Acumen and Critical Thinking (IQ) [Strong Knowledge Base]': string;
  'Clinical Acumen and Critical Thinking (IQ) [Analytical Thinking and Problem-Solving]': string;
  'Clinical Acumen and Critical Thinking (IQ) [Commitment to Learning]': string;
  'Clinical Acumen and Critical Thinking (IQ) [Adaptability in Clinical Reasoning]': string;
  'Professional Decorum and Leadership (PQ) [Work Ethic, Reliability & Professional Presence]': string;
  'Professional Decorum and Leadership (PQ) [Integrity and Accountability]': string;
  'Professional Decorum and Leadership (PQ) [Teachability and Receptiveness]': string;
  'Professional Decorum and Leadership (PQ) [Clear and Timely Documentation]': string;
  Comments: string;
  'Emotional Quotient (EQ) [Effectiveness in communication]': string;
  'Clinical Acumen and Critical Thinking (IQ) [Clinical abilities for level of training]': string;
  'Professional Decorum and Leadership (PQ) [Ability to lead & build relationships]': string;
}

interface ParsedRating {
  timestamp: Date;
  faculty_name: string;
  resident_name: string;
  pgy_level: string;
  period: string;
  period_label: string;
  eq_empathy: number | null;
  eq_adaptability: number | null;
  eq_stress: number | null;
  eq_curiosity: number | null;
  eq_communication: number | null;
  iq_knowledge: number | null;
  iq_analytical: number | null;
  iq_learning: number | null;
  iq_flexibility: number | null;
  iq_performance: number | null;
  pq_work_ethic: number | null;
  pq_integrity: number | null;
  pq_teachability: number | null;
  pq_documentation: number | null;
  pq_leadership: number | null;
  comments: string | null;
}

function parseNumber(value: string): number | null {
  if (!value || value.trim() === '' || value === '#DIV/0!' || value === '#N/A') {
    return null;
  }
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

function parseCSV(filePath: string): ParsedRating[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const headers = lines[0].split(',');
  
  const ratings: ParsedRating[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV line (handle quoted fields)
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    if (values.length < 20) continue; // Skip incomplete rows
    
    const pgyLevel = values[3]?.replace(/[\[\]]/g, '').trim() || '';
    const period = values[4]?.replace(/[\[\]]/g, '').trim() || '';
    
    const rating: ParsedRating = {
      timestamp: new Date(values[0]),
      faculty_name: values[1],
      resident_name: values[2],
      pgy_level: pgyLevel,
      period: period,
      period_label: `${pgyLevel} ${period}`,
      eq_empathy: parseNumber(values[5]),
      eq_adaptability: parseNumber(values[6]),
      eq_stress: parseNumber(values[7]),
      eq_curiosity: parseNumber(values[8]),
      iq_knowledge: parseNumber(values[9]),
      iq_analytical: parseNumber(values[10]),
      iq_learning: parseNumber(values[11]),
      iq_flexibility: parseNumber(values[12]),
      pq_work_ethic: parseNumber(values[13]),
      pq_integrity: parseNumber(values[14]),
      pq_teachability: parseNumber(values[15]),
      pq_documentation: parseNumber(values[16]),
      comments: values[17] || null,
      eq_communication: parseNumber(values[18]),
      iq_performance: parseNumber(values[19]),
      pq_leadership: parseNumber(values[20]),
    };
    
    ratings.push(rating);
  }
  
  return ratings;
}

async function getFacultyMap(): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from('faculty')
    .select('id, full_name');
  
  if (error) throw new Error(`Failed to fetch faculty: ${error.message}`);
  
  const map = new Map<string, string>();
  for (const faculty of data || []) {
    const normalized = normalizeName(faculty.full_name);
    map.set(normalized, faculty.id);
  }
  
  return map;
}

async function getResidentMap(): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from('residents')
    .select('id, user_id')
    .not('user_id', 'is', null);
  
  if (error) throw new Error(`Failed to fetch residents: ${error.message}`);
  
  const { data: profiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, full_name')
    .in('id', (data || []).map(r => r.user_id));
  
  if (profileError) throw new Error(`Failed to fetch profiles: ${profileError.message}`);
  
  const map = new Map<string, string>();
  for (const resident of data || []) {
    const profile = profiles?.find(p => p.id === resident.user_id);
    if (profile) {
      const normalized = normalizeName(profile.full_name);
      map.set(normalized, resident.id);
    }
  }
  
  return map;
}

async function importRatings() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  Import Faculty Assessments from CSV                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  // Parse CSV
  const csvPath = path.join(__dirname, '../docs/_guidance/Understand.../Overview/Prep Documents/Sample data/EQ+PQ+IQ/EQPQIQ Faculty Assessment of Residents.csv');
  console.log(`📄 Reading CSV: ${csvPath}`);
  
  const ratings = parseCSV(csvPath);
  console.log(`✓ Parsed ${ratings.length} ratings\n`);
  
  // Get faculty and resident maps
  console.log('🔍 Loading faculty and resident data...');
  const facultyMap = await getFacultyMap();
  const residentMap = await getResidentMap();
  console.log(`✓ Found ${facultyMap.size} faculty members`);
  console.log(`✓ Found ${residentMap.size} residents\n`);
  
  // Process ratings
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];
  
  console.log('📊 Importing ratings...\n');
  
  for (const rating of ratings) {
    // Match faculty
    const facultyNormalized = normalizeName(rating.faculty_name);
    const facultyId = facultyMap.get(facultyNormalized);
    
    if (!facultyId) {
      errors.push(`Faculty not found: ${rating.faculty_name}`);
      skipped++;
      continue;
    }
    
    // Match resident
    const residentNormalized = normalizeName(rating.resident_name);
    const residentId = residentMap.get(residentNormalized);
    
    if (!residentId) {
      errors.push(`Resident not found: ${rating.resident_name}`);
      skipped++;
      continue;
    }
    
    // Check for existing rating (duplicate prevention)
    const { data: existing } = await supabase
      .from('structured_ratings')
      .select('id')
      .eq('resident_id', residentId)
      .eq('faculty_id', facultyId)
      .eq('period_label', rating.period_label)
      .eq('rater_type', 'faculty')
      .single();
    
    if (existing) {
      skipped++;
      continue;
    }
    
    // Insert rating
    const { error } = await supabase
      .from('structured_ratings')
      .insert({
        resident_id: residentId,
        rater_type: 'faculty',
        faculty_id: facultyId,
        evaluation_date: rating.timestamp.toISOString().split('T')[0],
        pgy_level: rating.pgy_level,
        period: rating.period,
        period_label: rating.period_label,
        eq_empathy_positive_interactions: rating.eq_empathy,
        eq_adaptability_self_awareness: rating.eq_adaptability,
        eq_stress_management_resilience: rating.eq_stress,
        eq_curiosity_growth_mindset: rating.eq_curiosity,
        eq_effectiveness_communication: rating.eq_communication,
        iq_knowledge_base: rating.iq_knowledge,
        iq_analytical_thinking: rating.iq_analytical,
        iq_commitment_learning: rating.iq_learning,
        iq_clinical_flexibility: rating.iq_flexibility,
        iq_performance_for_level: rating.iq_performance,
        pq_work_ethic_reliability: rating.pq_work_ethic,
        pq_integrity_accountability: rating.pq_integrity,
        pq_teachability_receptiveness: rating.pq_teachability,
        pq_documentation: rating.pq_documentation,
        pq_leadership_relationships: rating.pq_leadership,
      });
    
    if (error) {
      errors.push(`Error importing ${rating.resident_name}: ${error.message}`);
      skipped++;
    } else {
      imported++;
      if (imported % 50 === 0) {
        console.log(`   ✓ Imported ${imported} ratings...`);
      }
    }
  }
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  IMPORT COMPLETE                                           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log(`✓ Successfully imported: ${imported} ratings`);
  console.log(`⚠️  Skipped: ${skipped} ratings`);
  
  if (errors.length > 0) {
    console.log(`\n❌ Errors (${errors.length}):`);
    const uniqueErrors = [...new Set(errors)];
    uniqueErrors.slice(0, 10).forEach(err => console.log(`   - ${err}`));
    if (uniqueErrors.length > 10) {
      console.log(`   ... and ${uniqueErrors.length - 10} more`);
    }
  }
}

importRatings().catch(console.error);

