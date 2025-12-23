#!/usr/bin/env tsx
// Production script to analyze ALL residents with anonymization
// Loops through all residents with sufficient evaluation data

import { createClient } from '@supabase/supabase-js';
import { analyzeCommentsWithRetry, testClaudeConnection } from '../lib/ai/claude-analyzer';
import { buildSWOTPrompt } from '../lib/ai/swot-prompt';
import { 
  anonymizeResidentName, 
  anonymizeComments, 
  clearSessionMapping,
  getSessionStats,
  type CommentWithDate as AnonymizedCommentWithDate
} from '../lib/ai/anonymizer';

// Initialize Supabase with service key for full access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ Missing ANTHROPIC_API_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CommentWithDate {
  text: string;
  date: string;
}

interface PeriodComments {
  period_label: string;
  comments: CommentWithDate[];
  n_comments: number;
}

interface ResidentInfo {
  resident_id: string;
  resident_name: string;
  periods: PeriodComments[];
}

// Minimum comments required per period to analyze
const MIN_COMMENTS_PER_PERIOD = 5;

async function fetchAllResidentsWithComments(): Promise<ResidentInfo[]> {
  console.log('\n📊 Fetching all residents with evaluation comments...');
  
  // Get all residents with comments
  const { data, error } = await supabase
    .from('imported_comments')
    .select(`
      resident_id,
      period_label,
      comment_text,
      date_completed,
      residents!inner(
        id,
        user_profiles!inner(full_name)
      )
    `)
    .not('resident_id', 'is', null)
    .not('comment_text', 'is', null)
    .order('date_completed', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch comments: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('No comments found in database');
  }

  console.log(`✓ Found ${data.length} total comments`);

  // Group by resident and period
  const residentMap = new Map<string, ResidentInfo>();
  
  for (const row of data) {
    const residentId = row.resident_id;
    const residentName = (row.residents as any).user_profiles.full_name;
    const periodLabel = row.period_label;
    
    if (!residentMap.has(residentId)) {
      residentMap.set(residentId, {
        resident_id: residentId,
        resident_name: residentName,
        periods: [],
      });
    }
    
    const resident = residentMap.get(residentId)!;
    let period = resident.periods.find(p => p.period_label === periodLabel);
    
    if (!period) {
      period = {
        period_label: periodLabel,
        comments: [],
        n_comments: 0,
      };
      resident.periods.push(period);
    }
    
    // Format date
    const date = row.date_completed ? new Date(row.date_completed).toLocaleDateString('en-US') : 'Unknown date';
    
    period.comments.push({
      text: row.comment_text,
      date: date,
    });
    period.n_comments++;
  }

  // Convert to array and filter out periods with too few comments
  const residents: ResidentInfo[] = [];
  for (const resident of residentMap.values()) {
    // Filter periods to only those with sufficient comments
    resident.periods = resident.periods.filter(p => p.n_comments >= MIN_COMMENTS_PER_PERIOD);
    
    // Only include residents with at least one analyzable period
    if (resident.periods.length > 0) {
      residents.push(resident);
    }
  }

  console.log(`\n✓ Found ${residents.length} residents with sufficient data`);
  
  return residents;
}

async function deleteExistingAnalyses(residentId: string) {
  // Delete existing SWOT summaries
  const { error: swotError } = await supabase
    .from('swot_summaries')
    .delete()
    .eq('resident_id', residentId);

  if (swotError) {
    console.error(`   ⚠️  Error deleting SWOT data: ${swotError.message}`);
  }

  // Delete existing period scores (AI-generated only)
  const { error: scoresError } = await supabase
    .from('period_scores')
    .delete()
    .eq('resident_id', residentId)
    .not('ai_eq_avg', 'is', null); // Only delete AI-generated scores

  if (scoresError) {
    console.error(`   ⚠️  Error deleting period scores: ${scoresError.message}`);
  }
}

async function analyzePeriod(residentId: string, residentName: string, period: PeriodComments) {
  console.log(`   📝 ${period.period_label}: ${period.n_comments} comments`);

  // ANONYMIZATION: Scrub PII before sending to Claude
  const anonymizedPseudonym = anonymizeResidentName(residentId, residentName);
  const anonymizedCommentsList = anonymizeComments(period.comments);

  // Build prompt with anonymized data
  const prompt = buildSWOTPrompt({
    residentName: residentName, // Keep for backwards compatibility
    residentPseudonym: anonymizedPseudonym, // This is what gets sent to Claude
    periodLabel: period.period_label,
    comments: anonymizedCommentsList,
    nComments: period.n_comments,
  });

  // Call Claude API with retry
  const result = await analyzeCommentsWithRetry(prompt);

  // Insert SWOT summary
  const { error: swotError } = await supabase
    .from('swot_summaries')
    .insert({
      resident_id: residentId,
      period_label: period.period_label,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      opportunities: result.opportunities,
      threats: result.threats,
      n_comments_analyzed: period.n_comments,
      ai_confidence: result.confidence,
      ai_model_version: 'claude-sonnet-4-20250514',
      analysis_version: 'v1.0',
      is_current: true,
    });

  if (swotError) {
    throw new Error(`Failed to save SWOT: ${swotError.message}`);
  }

  // Insert period scores
  const { error: scoresError } = await supabase
    .from('period_scores')
    .insert({
      resident_id: residentId,
      period_label: period.period_label,
      ai_eq_avg: result.scores.eq.avg,
      ai_pq_avg: result.scores.pq.avg,
      ai_iq_avg: result.scores.iq.avg,
      ai_scores_detail: result.scores, // Store full 15-attribute breakdown
      ai_n_comments: period.n_comments,
      ai_confidence_avg: result.confidence,
      analysis_version: 'v1.0',
      is_current: true,
    });

  if (scoresError) {
    throw new Error(`Failed to save scores: ${scoresError.message}`);
  }

  // Log to audit trail
  await supabase
    .from('ai_anonymization_log')
    .insert({
      resident_id: residentId,
      period_label: period.period_label,
      pseudonym: anonymizedPseudonym,
      n_comments_sent: period.n_comments,
      api_provider: 'anthropic',
      api_model: 'claude-sonnet-4-20250514',
      data_sanitized: true,
      phi_scrubbed: true,
      names_anonymized: true,
      dates_generalized: true,
    });

  return result;
}

async function analyzeResident(resident: ResidentInfo) {
  console.log(`\n🤖 Analyzing: ${resident.resident_name}`);
  console.log(`   Periods to analyze: ${resident.periods.length}`);

  // Delete existing analyses
  await deleteExistingAnalyses(resident.resident_id);

  let successCount = 0;
  let errorCount = 0;

  for (const period of resident.periods) {
    try {
      await analyzePeriod(resident.resident_id, resident.resident_name, period);
      successCount++;
      console.log(`   ✓ ${period.period_label} complete`);
    } catch (error) {
      console.error(`   ❌ ${period.period_label} failed:`, error);
      errorCount++;
    }
  }

  return { successCount, errorCount };
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  AI SWOT Analysis - ALL RESIDENTS                         ║');
  console.log('║  Using Claude Sonnet 4 (claude-sonnet-4-20250514)         ║');
  console.log('║  🔒 WITH ANONYMIZATION ENABLED                             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    // Clear any previous session mapping
    clearSessionMapping();
    
    // Test Claude connection
    console.log('\n🔌 Testing Claude API connection...');
    const connected = await testClaudeConnection();
    if (!connected) {
      throw new Error('Claude API connection test failed');
    }
    console.log('✓ Claude API connected');

    // Fetch all residents
    const residents = await fetchAllResidentsWithComments();

    // Analyze each resident
    console.log('\n🚀 Starting analysis...');
    let totalSuccess = 0;
    let totalErrors = 0;
    let totalResidents = 0;

    for (const resident of residents) {
      try {
        const { successCount, errorCount } = await analyzeResident(resident);
        totalSuccess += successCount;
        totalErrors += errorCount;
        totalResidents++;
      } catch (error) {
        console.error(`\n❌ Error analyzing ${resident.resident_name}:`, error);
        totalErrors++;
      }
    }

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  ANALYSIS COMPLETE                                         ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`\n✓ Residents analyzed: ${totalResidents}`);
    console.log(`✓ Periods successfully analyzed: ${totalSuccess}`);
    console.log(`❌ Errors: ${totalErrors}`);
    
    // Display anonymization stats
    const stats = getSessionStats();
    console.log(`\n🔒 Privacy Protection:`);
    console.log(`   - Residents anonymized: ${stats.residentsAnonymized}`);
    console.log(`   - Pseudonyms generated: ${stats.pseudonymsGenerated}`);
    console.log(`   - All PII scrubbed before sending to Claude`);
    console.log(`   - Audit trail logged to ai_anonymization_log table`);

    if (totalSuccess > 0) {
      console.log('\n🎉 SWOT analyses now available in the dashboard!');
      console.log(`   View at: http://localhost:3000/modules/understand/overview`);
    }
    
    // Clean up session mapping
    clearSessionMapping();

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    clearSessionMapping(); // Clean up even on error
    process.exit(1);
  }
}

// Run the script
main();

