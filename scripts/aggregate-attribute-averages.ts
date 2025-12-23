/**
 * Aggregate Attribute Averages Script
 * 
 * Calculates and stores class-level and program-level averages for each
 * EQ/PQ/IQ attribute by academic period. These averages are used for
 * trendline calculations in the AttributeTimelineChart.
 * 
 * Usage:
 *   node -r dotenv/config scripts/aggregate-attribute-averages.ts
 * 
 * This script should be run:
 *   - After initial AI analysis of residents
 *   - After new MedHub data is imported and analyzed
 *   - Periodically to ensure averages are up-to-date
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// All 15 attribute keys we track
const ATTRIBUTE_KEYS = [
  // EQ attributes
  'eq_empathy',
  'eq_adaptability', 
  'eq_stress_mgmt',
  'eq_curiosity',
  'eq_communication',
  // PQ attributes
  'pq_work_ethic',
  'pq_integrity',
  'pq_teachability',
  'pq_documentation',
  'pq_leadership',
  // IQ attributes
  'iq_knowledge',
  'iq_analytical',
  'iq_learning',
  'iq_flexibility',
  'iq_performance'
];

// Map from ai_scores_detail keys to our attribute keys
const SCORE_KEY_MAP: Record<string, Record<string, string>> = {
  eq: {
    empathy: 'eq_empathy',
    adaptability: 'eq_adaptability',
    stress_mgmt: 'eq_stress_mgmt',
    curiosity: 'eq_curiosity',
    communication: 'eq_communication'
  },
  pq: {
    work_ethic: 'pq_work_ethic',
    integrity: 'pq_integrity',
    teachability: 'pq_teachability',
    documentation: 'pq_documentation',
    leadership: 'pq_leadership'
  },
  iq: {
    knowledge: 'iq_knowledge',
    analytical: 'iq_analytical',
    learning: 'iq_learning',
    flexibility: 'iq_flexibility',
    performance: 'iq_performance'
  }
};

interface PeriodScore {
  resident_id: string;
  period_label: string;
  ai_scores_detail: {
    eq?: Record<string, number>;
    pq?: Record<string, number>;
    iq?: Record<string, number>;
  } | null;
}

interface ResidentInfo {
  id: string;
  class_year: number | null;
}

interface AverageRecord {
  scope_type: 'class' | 'program';
  scope_id: string | null;
  period_label: string;
  attribute_key: string;
  avg_score: number;
  n_residents: number;
}

async function main() {
  console.log('🔄 Aggregating attribute averages for trendlines...\n');

  // Step 1: Fetch all period_scores with ai_scores_detail
  console.log('📊 Fetching period scores with AI attribute data...');
  const { data: periodScores, error: scoresError } = await supabase
    .from('period_scores')
    .select('resident_id, period_label, ai_scores_detail')
    .not('ai_scores_detail', 'is', null)
    .eq('is_current', true);

  if (scoresError) {
    console.error('❌ Error fetching period scores:', scoresError.message);
    process.exit(1);
  }

  if (!periodScores || periodScores.length === 0) {
    console.log('⚠️  No period scores with AI data found. Run AI analysis first.');
    process.exit(0);
  }

  console.log(`   Found ${periodScores.length} period scores with AI data`);

  // Step 2: Fetch resident class years (via classes join)
  console.log('📊 Fetching resident class years...');
  const residentIds = [...new Set(periodScores.map(ps => ps.resident_id))];
  
  const { data: residents, error: residentsError } = await supabase
    .from('residents')
    .select('id, classes(graduation_year)')
    .in('id', residentIds);

  if (residentsError) {
    console.error('❌ Error fetching residents:', residentsError.message);
    process.exit(1);
  }

  // Create a map of resident_id -> class_year (graduation_year)
  const residentClassMap = new Map<string, number | null>();
  residents?.forEach((r: any) => {
    const classYear = r.classes?.graduation_year || null;
    residentClassMap.set(r.id, classYear);
  });

  console.log(`   Found ${residents?.length || 0} residents with class years`);

  // Step 3: Build aggregation data structures
  // Structure: { period_label -> { attribute_key -> { scope -> [scores] } } }
  type ScoresByScope = {
    program: number[];
    classes: Map<number, number[]>;
  };
  
  const aggregations = new Map<string, Map<string, ScoresByScope>>();

  // Process each period score
  for (const ps of periodScores as PeriodScore[]) {
    const classYear = residentClassMap.get(ps.resident_id);
    const scores = ps.ai_scores_detail;
    
    if (!scores) continue;

    // Initialize period if needed
    if (!aggregations.has(ps.period_label)) {
      aggregations.set(ps.period_label, new Map());
    }
    const periodMap = aggregations.get(ps.period_label)!;

    // Extract scores for each attribute
    for (const [category, attrMap] of Object.entries(SCORE_KEY_MAP)) {
      const categoryScores = scores[category as keyof typeof scores];
      if (!categoryScores) continue;

      for (const [scoreKey, attrKey] of Object.entries(attrMap)) {
        const score = categoryScores[scoreKey];
        if (typeof score !== 'number' || isNaN(score)) continue;

        // Initialize attribute if needed
        if (!periodMap.has(attrKey)) {
          periodMap.set(attrKey, {
            program: [],
            classes: new Map()
          });
        }
        const attrData = periodMap.get(attrKey)!;

        // Add to program-level
        attrData.program.push(score);

        // Add to class-level if class year is known
        if (classYear) {
          if (!attrData.classes.has(classYear)) {
            attrData.classes.set(classYear, []);
          }
          attrData.classes.get(classYear)!.push(score);
        }
      }
    }
  }

  // Step 4: Calculate averages and prepare upsert records
  const records: AverageRecord[] = [];

  for (const [periodLabel, attrMap] of aggregations) {
    for (const [attrKey, scopeData] of attrMap) {
      // Program-level average
      if (scopeData.program.length > 0) {
        const avg = scopeData.program.reduce((a, b) => a + b, 0) / scopeData.program.length;
        records.push({
          scope_type: 'program',
          scope_id: null,
          period_label: periodLabel,
          attribute_key: attrKey,
          avg_score: Math.round(avg * 100) / 100, // Round to 2 decimals
          n_residents: scopeData.program.length
        });
      }

      // Class-level averages
      for (const [classYear, scores] of scopeData.classes) {
        if (scores.length > 0) {
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          records.push({
            scope_type: 'class',
            scope_id: classYear.toString(),
            period_label: periodLabel,
            attribute_key: attrKey,
            avg_score: Math.round(avg * 100) / 100,
            n_residents: scores.length
          });
        }
      }
    }
  }

  console.log(`\n📈 Calculated ${records.length} average records`);

  // Step 5: Upsert records to database
  console.log('💾 Upserting averages to database...');

  // Process in batches to avoid overwhelming the database
  const BATCH_SIZE = 100;
  let upsertedCount = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    
    const { error: upsertError } = await supabase
      .from('attribute_period_averages')
      .upsert(batch, {
        onConflict: 'scope_type,scope_id,period_label,attribute_key'
      });

    if (upsertError) {
      console.error(`❌ Error upserting batch ${i / BATCH_SIZE + 1}:`, upsertError.message);
      continue;
    }

    upsertedCount += batch.length;
  }

  console.log(`   ✅ Upserted ${upsertedCount} records`);

  // Step 6: Print summary statistics
  console.log('\n📊 Summary:');
  
  const uniquePeriods = new Set(records.map(r => r.period_label));
  const uniqueClasses = new Set(records.filter(r => r.scope_type === 'class').map(r => r.scope_id));
  
  console.log(`   Periods: ${uniquePeriods.size}`);
  console.log(`   Classes: ${uniqueClasses.size}`);
  console.log(`   Attributes: ${ATTRIBUTE_KEYS.length}`);
  console.log(`   Program averages: ${records.filter(r => r.scope_type === 'program').length}`);
  console.log(`   Class averages: ${records.filter(r => r.scope_type === 'class').length}`);

  // Print sample data
  console.log('\n📋 Sample averages (first 5):');
  records.slice(0, 5).forEach(r => {
    const scope = r.scope_type === 'program' ? 'Program' : `Class ${r.scope_id}`;
    console.log(`   ${r.period_label} | ${r.attribute_key} | ${scope}: ${r.avg_score} (n=${r.n_residents})`);
  });

  console.log('\n✅ Aggregation complete!');
}

// Run the script
main().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});

