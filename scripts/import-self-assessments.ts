#!/usr/bin/env tsx
/**
 * Import Resident Self-Assessments from CSV
 * 
 * Parses EQPQIQ Resident Self Assessment.csv and imports into structured_ratings table
 * - 52 rows of resident self-assessments
 * - Matches residents by name → resident_id
 * - Maps 5 EQ + 5 IQ + 5 PQ attributes
 * - Stores concerns/goals in concerns_goals field
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { normalizeName } from '../lib/utils/name-matcher';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ParsedSelfAssessment {
  timestamp: Date;
  resident_name: string;
  email: string;
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
  concerns_goals: string | null;
}

function parseNumber(value: string): number | null {
  if (!value || value.trim() === '' || value === '#DIV/0!' || value === '#N/A') {
    return null;
  }
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

function parseCSV(filePath: string): ParsedSelfAssessment[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const assessments: ParsedSelfAssessment[] = [];
  
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
    
    const pgyLevel = values[3]?.trim() || '';
    
    const period = values[20]?.trim() || ''; // Period column (Fall/Spring)
    
    const assessment: ParsedSelfAssessment = {
      timestamp: new Date(values[0]),
      resident_name: values[1],
      email: values[2],
      pgy_level: pgyLevel,
      period: period,
      period_label: `${pgyLevel} ${period}`.trim(),
      eq_empathy: parseNumber(values[4]),
      eq_adaptability: parseNumber(values[5]),
      eq_stress: parseNumber(values[6]),
      eq_curiosity: parseNumber(values[7]),
      eq_communication: parseNumber(values[8]),
      iq_knowledge: parseNumber(values[9]),
      iq_analytical: parseNumber(values[10]),
      iq_learning: parseNumber(values[11]),
      iq_flexibility: parseNumber(values[12]),
      iq_performance: parseNumber(values[13]),
      pq_work_ethic: parseNumber(values[14]),
      pq_integrity: parseNumber(values[15]),
      pq_teachability: parseNumber(values[16]),
      pq_documentation: parseNumber(values[17]),
      pq_leadership: parseNumber(values[18]),
      concerns_goals: values[19] || null, // Concerns/goals column
    };
    
    assessments.push(assessment);
  }
  
  return assessments;
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

async function importAssessments() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  Import Resident Self-Assessments from CSV                ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  // Parse CSV
  const csvPath = path.join(__dirname, '../docs/_guidance/Understand.../Overview/Prep Documents/Sample data/EQ+PQ+IQ/EQPQIQ Resident Self Assessment.csv');
  console.log(`📄 Reading CSV: ${csvPath}`);
  
  const assessments = parseCSV(csvPath);
  console.log(`✓ Parsed ${assessments.length} self-assessments\n`);
  
  // Get resident map
  console.log('🔍 Loading resident data...');
  const residentMap = await getResidentMap();
  console.log(`✓ Found ${residentMap.size} residents\n`);
  
  // Process assessments
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];
  
  console.log('📊 Importing self-assessments...\n');
  
  for (const assessment of assessments) {
    // Match resident
    const residentNormalized = normalizeName(assessment.resident_name);
    const residentId = residentMap.get(residentNormalized);
    
    if (!residentId) {
      errors.push(`Resident not found: ${assessment.resident_name}`);
      skipped++;
      continue;
    }
    
    // Check for existing assessment (duplicate prevention)
    const { data: existing } = await supabase
      .from('structured_ratings')
      .select('id')
      .eq('resident_id', residentId)
      .eq('period_label', assessment.period_label)
      .eq('rater_type', 'self')
      .single();
    
    if (existing) {
      skipped++;
      continue;
    }
    
    // Insert assessment
    const { error } = await supabase
      .from('structured_ratings')
      .insert({
        resident_id: residentId,
        rater_type: 'self',
        evaluation_date: assessment.timestamp.toISOString().split('T')[0],
        pgy_level: assessment.pgy_level,
        period: assessment.period,
        period_label: assessment.period_label,
        eq_empathy_positive_interactions: assessment.eq_empathy,
        eq_adaptability_self_awareness: assessment.eq_adaptability,
        eq_stress_management_resilience: assessment.eq_stress,
        eq_curiosity_growth_mindset: assessment.eq_curiosity,
        eq_effectiveness_communication: assessment.eq_communication,
        iq_knowledge_base: assessment.iq_knowledge,
        iq_analytical_thinking: assessment.iq_analytical,
        iq_commitment_learning: assessment.iq_learning,
        iq_clinical_flexibility: assessment.iq_flexibility,
        iq_performance_for_level: assessment.iq_performance,
        pq_work_ethic_reliability: assessment.pq_work_ethic,
        pq_integrity_accountability: assessment.pq_integrity,
        pq_teachability_receptiveness: assessment.pq_teachability,
        pq_documentation: assessment.pq_documentation,
        pq_leadership_relationships: assessment.pq_leadership,
        concerns_goals: assessment.concerns_goals,
      });
    
    if (error) {
      errors.push(`Error importing ${assessment.resident_name}: ${error.message}`);
      skipped++;
    } else {
      imported++;
      if (imported % 10 === 0) {
        console.log(`   ✓ Imported ${imported} assessments...`);
      }
    }
  }
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  IMPORT COMPLETE                                           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log(`✓ Successfully imported: ${imported} self-assessments`);
  console.log(`⚠️  Skipped: ${skipped} assessments`);
  
  if (errors.length > 0) {
    console.log(`\n❌ Errors (${errors.length}):`);
    const uniqueErrors = [...new Set(errors)];
    uniqueErrors.forEach(err => console.log(`   - ${err}`));
  }
}

importAssessments().catch(console.error);

