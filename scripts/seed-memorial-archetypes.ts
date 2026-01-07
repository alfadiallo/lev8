// ============================================================
// Seed Memorial Archetypes v1.0.0
// Classifies all existing residents under the Memorial Baseline methodology
// ============================================================

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CURRENT_VERSION = '1.0.0';

// Memorial Archetypes Classification Logic
interface ClassificationResult {
  archetypeId: string;
  archetypeName: string;
  confidence: number;
  riskLevel: 'Low' | 'Moderate' | 'High';
  isProvisional: boolean;
  note: string;
  description: string;
  color: string;
  recommendations: string[];
}

function classifyComplete(pgy1: number, pgy2: number, pgy3: number): ClassificationResult {
  const d12 = pgy2 - pgy1;
  const d23 = pgy3 - pgy2;
  const dTotal = pgy3 - pgy1;

  // Elite Performer
  if (pgy1 >= 85 && pgy2 >= 85 && pgy3 >= 50) {
    return {
      archetypeId: 'elite_performer',
      archetypeName: 'Elite Performer',
      confidence: 0.95,
      riskLevel: 'Low',
      isProvisional: false,
      note: '',
      description: 'Started elite (85%+), maintained elite through PGY2 (85%+), ended above average (50%+)',
      color: '#1ABC9C',
      recommendations: ['Consider for leadership opportunities', 'Discuss fellowship interests', 'Potential teaching/mentorship role']
    };
  }

  // Elite → Late Struggle
  if (pgy1 >= 75 && pgy2 >= 80 && pgy3 < 50) {
    return {
      archetypeId: 'elite_late_struggle',
      archetypeName: 'Elite → Late Struggle',
      confidence: 0.90,
      riskLevel: 'Moderate',
      isProvisional: false,
      note: '',
      description: 'Started elite, maintained through PGY2, but significant PGY3 decline (<50%)',
      color: '#E67E22',
      recommendations: ['Investigate PGY3 performance drop factors', 'Assess burnout or external stressors', 'Consider board prep resources', 'Schedule check-in meetings']
    };
  }

  // Breakthrough Performer
  if (d12 >= 25 && pgy3 >= 70) {
    return {
      archetypeId: 'breakthrough_performer',
      archetypeName: 'Breakthrough Performer',
      confidence: 0.90,
      riskLevel: 'Low',
      isProvisional: false,
      note: '',
      description: 'Major improvement PGY1→PGY2 (+25 pts), sustained at PGY3 (70%+)',
      color: '#3498DB',
      recommendations: ['Document what strategies worked for improvement', 'Consider peer mentorship role', 'Strong momentum - maintain engagement']
    };
  }

  // Peak & Decline
  if (d12 >= 10 && d23 <= -30) {
    return {
      archetypeId: 'peak_decline',
      archetypeName: 'Peak & Decline',
      confidence: 0.85,
      riskLevel: 'High',
      isProvisional: false,
      note: '',
      description: 'Improved PGY1→PGY2 (+10pts), then significant PGY3 drop (-30pts)',
      color: '#E74C3C',
      recommendations: ['URGENT: Schedule PD meeting', 'Assess for burnout or personal issues', 'Board prep support critical', 'Consider tutoring resources', 'Weekly check-ins recommended']
    };
  }

  // Sophomore Slump → Strong Recovery
  if (d12 <= -15 && d23 >= 40) {
    return {
      archetypeId: 'sophomore_slump_recovery',
      archetypeName: 'Sophomore Slump → Strong Recovery',
      confidence: 0.90,
      riskLevel: 'Low',
      isProvisional: false,
      note: '',
      description: 'Dropped at PGY2 (-15pts), then strong PGY3 recovery (+40pts)',
      color: '#F39C12',
      recommendations: ['Reassure - strong recovery pattern demonstrated', 'Document what drove PGY3 success', 'Connect with current PGY2s showing similar PGY2 dip']
    };
  }

  // Continuous Decline
  if (d12 < 0 && d23 < 0 && dTotal <= -20) {
    return {
      archetypeId: 'continuous_decline',
      archetypeName: 'Continuous Decline',
      confidence: 0.85,
      riskLevel: 'High',
      isProvisional: false,
      note: '',
      description: 'Declining trajectory each year (negative deltas)',
      color: '#C0392B',
      recommendations: ['URGENT: Intensive support needed', 'Weekly check-ins mandatory', 'Assign dedicated mentor', 'Assess for underlying issues', 'Board prep intervention critical']
    };
  }

  // Late Bloomer
  if (pgy1 <= 40 && d23 >= 15 && pgy3 > pgy1) {
    return {
      archetypeId: 'late_bloomer',
      archetypeName: 'Late Bloomer',
      confidence: 0.85,
      riskLevel: 'Low',
      isProvisional: false,
      note: '',
      description: 'Low start (≤40%), gradual or late improvement through PGY3',
      color: '#9B59B6',
      recommendations: ['Positive trajectory - encourage continuation', 'Many late bloomers accelerate further', 'Continue current support approach']
    };
  }

  // Steady Climber
  if (d12 >= 0 && d23 >= 0 && dTotal >= 10) {
    return {
      archetypeId: 'steady_climber',
      archetypeName: 'Steady Climber',
      confidence: 0.80,
      riskLevel: 'Low',
      isProvisional: false,
      note: '',
      description: 'Consistent improvement each year (positive deltas)',
      color: '#27AE60',
      recommendations: ['Positive consistent trajectory', 'Continue current approach', 'May benefit from stretch goals']
    };
  }

  // Variable (fallback)
  return {
    archetypeId: 'variable',
    archetypeName: 'Variable',
    confidence: 0.60,
    riskLevel: 'Moderate',
    isProvisional: false,
    note: '',
    description: 'Pattern does not fit standard archetypes - unique trajectory',
    color: '#7F8C8D',
    recommendations: ['Monitor trajectory closely', 'Individualized approach needed', 'Document unique factors']
  };
}

function classifyTwoYear(pgy1: number, pgy2: number): ClassificationResult {
  const d12 = pgy2 - pgy1;

  if (pgy1 >= 85 && pgy2 >= 85) {
    return {
      archetypeId: 'elite_performer',
      archetypeName: 'Elite Performer',
      confidence: 0.85,
      riskLevel: 'Low',
      isProvisional: true,
      note: 'On track for Elite Performer - PGY3 will confirm',
      description: 'On track for Elite - PGY3 will confirm',
      color: '#1ABC9C',
      recommendations: ['Maintain current approach', 'Consider leadership opportunities']
    };
  }

  if (d12 >= 25 && pgy2 >= 60) {
    return {
      archetypeId: 'breakthrough_performer',
      archetypeName: 'Breakthrough Performer',
      confidence: 0.75,
      riskLevel: 'Low',
      isProvisional: true,
      note: 'Strong surge - monitor for PGY3 sustainment',
      description: 'Strong surge - monitor for sustainment',
      color: '#3498DB',
      recommendations: ['Document what drove improvement', 'Monitor PGY3 for sustainment']
    };
  }

  if (d12 >= 10 && pgy2 >= 60) {
    return {
      archetypeId: 'trending_peak',
      archetypeName: 'Trending: Peak (monitor PGY3)',
      confidence: 0.70,
      riskLevel: 'Moderate',
      isProvisional: true,
      note: '⚠️ Good improvement but Class 2024 showed PGY3 drops - monitor closely',
      description: 'Good improvement - PGY3 critical',
      color: '#F39C12',
      recommendations: ['Critical: Monitor PGY3 closely', 'Class 2024 showed PGY3 drops after similar pattern', 'Proactive support recommended']
    };
  }

  if (d12 <= -15) {
    return {
      archetypeId: 'trending_slump',
      archetypeName: 'Trending: Sophomore Slump',
      confidence: 0.75,
      riskLevel: 'Moderate',
      isProvisional: true,
      note: 'PGY2 dip - historical data shows strong recovery potential at PGY3',
      description: 'PGY2 dip - recovery potential at PGY3',
      color: '#E67E22',
      recommendations: ['Reassure - recovery common', 'Historical data shows 57-point PGY3 rebounds', 'Connect with recovered residents']
    };
  }

  if (pgy1 <= 40 && pgy2 <= 40) {
    return {
      archetypeId: 'trending_late_bloomer',
      archetypeName: 'Trending: Late Bloomer',
      confidence: 0.70,
      riskLevel: 'Moderate',
      isProvisional: true,
      note: 'Low start - watch for PGY3 acceleration (common pattern)',
      description: 'Low start - watch for PGY3 acceleration',
      color: '#9B59B6',
      recommendations: ['Continue supportive environment', 'Many accelerate at PGY3', 'Board prep support']
    };
  }

  if (d12 < -10 && pgy2 < 50) {
    return {
      archetypeId: 'trending_decline',
      archetypeName: 'Trending: Decline Risk',
      confidence: 0.75,
      riskLevel: 'High',
      isProvisional: true,
      note: 'Declining trajectory - intervention recommended',
      description: 'Declining trajectory - intervention recommended',
      color: '#E74C3C',
      recommendations: ['Schedule meeting', 'Assess external factors', 'Consider tutoring resources']
    };
  }

  if (Math.abs(d12) <= 15) {
    return {
      archetypeId: 'trending_stable',
      archetypeName: 'Trending: Stable',
      confidence: 0.65,
      riskLevel: 'Low',
      isProvisional: true,
      note: 'Stable trajectory - PGY3 will clarify final archetype',
      description: 'Stable trajectory - PGY3 will clarify',
      color: '#95A5A6',
      recommendations: ['Monitor PGY3', 'Standard progression']
    };
  }

  return {
    archetypeId: 'trending_variable',
    archetypeName: 'Trending: Variable',
    confidence: 0.50,
    riskLevel: 'Moderate',
    isProvisional: true,
    note: 'Non-standard pattern - monitor closely',
    description: 'Non-standard pattern - monitor closely',
    color: '#7F8C8D',
    recommendations: ['Individualized approach', 'Close monitoring']
  };
}

function classifyOneYear(pgy1: number): ClassificationResult {
  if (pgy1 >= 85) {
    return {
      archetypeId: 'potential_elite',
      archetypeName: 'Potential: Elite',
      confidence: 0.60,
      riskLevel: 'Low',
      isProvisional: true,
      note: 'Strong start - many trajectories possible including Elite Performer',
      description: 'Strong start - many trajectories possible',
      color: '#1ABC9C',
      recommendations: ['Standard monitoring', 'PGY2 will reveal trajectory direction']
    };
  }

  if (pgy1 >= 65) {
    return {
      archetypeId: 'potential_strong',
      archetypeName: 'Potential: Strong Start',
      confidence: 0.55,
      riskLevel: 'Low',
      isProvisional: true,
      note: 'Above average start - watch PGY2 for trajectory direction',
      description: 'Above average start - watch PGY2',
      color: '#3498DB',
      recommendations: ['Standard monitoring', 'PGY2 will reveal trajectory direction']
    };
  }

  if (pgy1 >= 40) {
    return {
      archetypeId: 'potential_average',
      archetypeName: 'Potential: Average Start',
      confidence: 0.50,
      riskLevel: 'Low',
      isProvisional: true,
      note: 'Mid-range start - multiple paths possible',
      description: 'Mid-range start - multiple paths possible',
      color: '#95A5A6',
      recommendations: ['Watch PGY2 closely', 'Many paths possible from this starting point']
    };
  }

  if (pgy1 >= 20) {
    return {
      archetypeId: 'potential_below_average',
      archetypeName: 'Potential: Below Average',
      confidence: 0.55,
      riskLevel: 'Moderate',
      isProvisional: true,
      note: 'Lower start - may follow Late Bloomer trajectory',
      description: 'Lower start - may be Late Bloomer',
      color: '#9B59B6',
      recommendations: ['Consider early support resources', 'May be Late Bloomer - encourage', 'PGY2 critical for trajectory']
    };
  }

  return {
    archetypeId: 'potential_at_risk',
    archetypeName: 'Potential: At Risk',
    confidence: 0.60,
    riskLevel: 'High',
    isProvisional: true,
    note: 'Very low start - consider early support resources',
    description: 'Very low start - consider early support',
    color: '#E74C3C',
    recommendations: ['Consider early support resources', 'May be Late Bloomer - encourage', 'PGY2 critical for trajectory']
  };
}

async function main() {
  console.log('=== Seeding Memorial Archetypes v1.0.0 ===\n');

  // 1. Get all residents with their ITE scores
  console.log('Fetching residents and ITE scores...');
  const { data: residents, error: resError } = await supabase
    .from('residents')
    .select(`
      id,
      user_profiles(full_name),
      classes(graduation_year),
      ite_scores(pgy_level, percentile)
    `);

  if (resError || !residents) {
    console.error('Error fetching residents:', resError);
    return;
  }

  console.log(`Found ${residents.length} residents\n`);

  let classifiedCount = 0;
  let skippedCount = 0;

  for (const resident of residents) {
    const name = (resident.user_profiles as any)?.full_name || 'Unknown';
    const gradYear = (resident.classes as any)?.graduation_year || 0;
    const scores = resident.ite_scores as any[] || [];

    // Extract scores
    const getScore = (pgy: number): number | null => {
      const score = scores.find((s: any) => {
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

    // Skip if no data
    if (pgy1 === null) {
      console.log(`  ⏭️  ${name} - No ITE data, skipping`);
      skippedCount++;
      continue;
    }

    // Classify
    let result: ClassificationResult;
    let dataYears: number;

    if (pgy1 !== null && pgy2 !== null && pgy3 !== null) {
      result = classifyComplete(pgy1, pgy2, pgy3);
      dataYears = 3;
    } else if (pgy1 !== null && pgy2 !== null) {
      result = classifyTwoYear(pgy1, pgy2);
      dataYears = 2;
    } else {
      result = classifyOneYear(pgy1);
      dataYears = 1;
    }

    // Calculate deltas
    const d12 = pgy1 !== null && pgy2 !== null ? pgy2 - pgy1 : null;
    const d23 = pgy2 !== null && pgy3 !== null ? pgy3 - pgy2 : null;
    const dTotal = pgy1 !== null && pgy3 !== null ? pgy3 - pgy1 : null;

    const now = new Date().toISOString();

    // Insert into resident_classifications
    const { error: insertError } = await supabase
      .from('resident_classifications')
      .upsert({
        resident_id: resident.id,
        
        // Scores
        pgy1_percentile: pgy1,
        pgy2_percentile: pgy2,
        pgy3_percentile: pgy3,
        delta_12: d12,
        delta_23: d23,
        delta_total: dTotal,
        data_years: dataYears,
        
        // Original classification
        original_archetype_id: result.archetypeId,
        original_archetype_name: result.archetypeName,
        original_confidence: result.confidence,
        original_risk_level: result.riskLevel,
        original_is_provisional: result.isProvisional,
        original_methodology_version: CURRENT_VERSION,
        original_classified_at: now,
        original_classified_by: 'system',
        original_note: result.note,
        
        // Current classification (same for initial)
        current_archetype_id: result.archetypeId,
        current_archetype_name: result.archetypeName,
        current_confidence: result.confidence,
        current_risk_level: result.riskLevel,
        current_is_provisional: result.isProvisional,
        current_methodology_version: CURRENT_VERSION,
        current_last_updated: now,
        current_note: result.note,
        
        // Additional
        recommendations: result.recommendations,
        
        // No drift for initial
        has_version_drift: false,
      }, { onConflict: 'resident_id' });

    if (insertError) {
      console.error(`  ❌ ${name} - Error:`, insertError.message);
    } else {
      console.log(`  ✓ ${name} (${gradYear}) → ${result.archetypeName} (${Math.round(result.confidence * 100)}%)${result.isProvisional ? ' [PROVISIONAL]' : ''}`);
      classifiedCount++;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`✓ Classified: ${classifiedCount}`);
  console.log(`⏭️  Skipped (no data): ${skippedCount}`);
  console.log(`📊 Total: ${residents.length}`);
}

main();




