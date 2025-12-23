#!/usr/bin/env tsx
// Analyze Larissa Tavares' real MedHub comments using Claude API
// WITH ANONYMIZATION for privacy protection

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

const LARISSA_ID = '3ba5dff9-5699-4499-8e51-0d8cd930b764';
const LARISSA_NAME = 'Larissa Tavares';

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

async function fetchLarissaComments(): Promise<PeriodComments[]> {
  console.log('\n📊 Fetching Larissa\'s comments from database...');
  
  const { data, error } = await supabase
    .from('imported_comments')
    .select('period_label, comment_text, date_completed')
    .eq('resident_id', LARISSA_ID)
    .order('date_completed', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch comments: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('No comments found for Larissa');
  }

  console.log(`✓ Found ${data.length} total comments`);

  // Group by period
  const periodMap = new Map<string, CommentWithDate[]>();
  
  for (const row of data) {
    if (!row.period_label || !row.comment_text) continue;
    
    if (!periodMap.has(row.period_label)) {
      periodMap.set(row.period_label, []);
    }
    
    // Format date as MM/DD/YYYY
    const date = row.date_completed ? new Date(row.date_completed).toLocaleDateString('en-US') : 'Unknown date';
    
    periodMap.get(row.period_label)!.push({
      text: row.comment_text,
      date: date
    });
  }

  const periods: PeriodComments[] = [];
  for (const [period_label, comments] of periodMap.entries()) {
    periods.push({
      period_label,
      comments,
      n_comments: comments.length,
    });
  }

  // Sort periods chronologically
  periods.sort((a, b) => {
    const order = ['PGY-1 Fall', 'PGY-1 Spring', 'PGY-2 Fall', 'PGY-2 Spring', 'PGY-3 Fall', 'PGY-3 Spring', 'PGY-4 Fall', 'PGY-4 Spring'];
    return order.indexOf(a.period_label) - order.indexOf(b.period_label);
  });

  console.log('\n📋 Comments by period:');
  for (const period of periods) {
    console.log(`   ${period.period_label}: ${period.n_comments} comments`);
  }

  return periods;
}

async function deleteExistingData() {
  console.log('\n🗑️  Deleting existing fake test data...');
  
  // Delete SWOT summaries (will cascade to nothing, but good practice)
  const { error: swotError } = await supabase
    .from('swot_summaries')
    .delete()
    .eq('resident_id', LARISSA_ID);

  if (swotError) {
    console.error('⚠️  Error deleting SWOT data:', swotError.message);
  } else {
    console.log('✓ Deleted SWOT summaries');
  }

  // Delete period scores
  const { error: scoresError } = await supabase
    .from('period_scores')
    .delete()
    .eq('resident_id', LARISSA_ID);

  if (scoresError) {
    console.error('⚠️  Error deleting period scores:', scoresError.message);
  } else {
    console.log('✓ Deleted period scores');
  }

  // Note: We do NOT delete ITE scores - those are real!
  console.log('✓ Preserved ITE scores (real data)');
}

async function analyzePeriod(period: PeriodComments) {
  console.log(`\n🤖 Analyzing ${period.period_label}...`);
  console.log(`   Comments: ${period.n_comments}`);

  // Skip periods with too few comments
  if (period.n_comments < 5) {
    console.log(`   ⚠️  Skipping (< 5 comments, insufficient data)`);
    return null;
  }

  // ANONYMIZATION: Scrub PII before sending to Claude
  const anonymizedPseudonym = anonymizeResidentName(LARISSA_ID, LARISSA_NAME);
  const anonymizedCommentsList = anonymizeComments(period.comments);
  
  console.log(`   🔒 Anonymized: ${LARISSA_NAME} → ${anonymizedPseudonym}`);

  // Build prompt with anonymized data
  const prompt = buildSWOTPrompt({
    residentName: LARISSA_NAME, // Keep for backwards compatibility
    residentPseudonym: anonymizedPseudonym, // This is what gets sent to Claude
    periodLabel: period.period_label,
    comments: anonymizedCommentsList,
    nComments: period.n_comments,
  });

  console.log(`   Sending to Claude... (${prompt.length} chars, anonymized)`);

  // Call Claude API with retry
  const result = await analyzeCommentsWithRetry(prompt);

  console.log(`   ✓ Analysis complete`);
  console.log(`     - Strengths: ${result.strengths.length}`);
  console.log(`     - Weaknesses: ${result.weaknesses.length} (${result.weaknesses.filter(w => w.severity === 'critical').length} critical)`);
  console.log(`     - EQ avg: ${result.scores.eq.avg.toFixed(2)}`);
  console.log(`     - PQ avg: ${result.scores.pq.avg.toFixed(2)}`);
  console.log(`     - IQ avg: ${result.scores.iq.avg.toFixed(2)}`);
  console.log(`     - Confidence: ${(result.confidence * 100).toFixed(0)}%`);
  
  // Debug: Check if citations are present
  const hasStrengthCitations = result.strengths.some(s => s.supporting_quotes && s.supporting_quotes.length > 0);
  const hasWeaknessCitations = result.weaknesses.some(w => w.supporting_quotes && w.supporting_quotes.length > 0);
  console.log(`     - Citations: Strengths=${hasStrengthCitations}, Weaknesses=${hasWeaknessCitations}`);
  
  if (hasStrengthCitations || hasWeaknessCitations) {
    console.log(`     - Sample citation: "${result.strengths[0]?.supporting_quotes?.[0]?.quote || 'N/A'}"`);
  }

  return result;
}

async function saveResults(period: PeriodComments, analysis: any) {
  console.log(`\n💾 Saving results for ${period.period_label}...`);

  // Insert SWOT summary
  const { error: swotError } = await supabase
    .from('swot_summaries')
    .insert({
      resident_id: LARISSA_ID,
      period_label: period.period_label,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      opportunities: analysis.opportunities,
      threats: analysis.threats,
      n_comments_analyzed: period.n_comments,
      ai_confidence: analysis.confidence,
      ai_model_version: 'claude-sonnet-4-20250514',
      analysis_version: 'v1.0',
      is_current: true,
    });

  if (swotError) {
    throw new Error(`Failed to save SWOT: ${swotError.message}`);
  }

  console.log('   ✓ SWOT summary saved');

  // Insert period scores
  const { error: scoresError } = await supabase
    .from('period_scores')
    .insert({
      resident_id: LARISSA_ID,
      period_label: period.period_label,
      ai_eq_avg: analysis.scores.eq.avg,
      ai_pq_avg: analysis.scores.pq.avg,
      ai_iq_avg: analysis.scores.iq.avg,
      ai_scores_detail: analysis.scores, // Store full 15-attribute breakdown
      ai_n_comments: period.n_comments,
      ai_confidence_avg: analysis.confidence,
      analysis_version: 'v1.0',
      is_current: true,
    });

  if (scoresError) {
    throw new Error(`Failed to save scores: ${scoresError.message}`);
  }

  console.log('   ✓ Period scores saved');
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  AI SWOT Analysis for Larissa Tavares                     ║');
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

    // Fetch comments
    const periods = await fetchLarissaComments();

    // Delete existing fake data
    await deleteExistingData();

    // Analyze each period
    console.log('\n🚀 Starting analysis...');
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const period of periods) {
      try {
        const analysis = await analyzePeriod(period);
        
        if (analysis) {
          await saveResults(period, analysis);
          successCount++;
        } else {
          skipCount++;
        }
      } catch (error) {
        console.error(`\n❌ Error analyzing ${period.period_label}:`, error);
        errorCount++;
      }
    }

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  ANALYSIS COMPLETE                                         ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`\n✓ Successfully analyzed: ${successCount} periods`);
    console.log(`⚠️  Skipped (insufficient data): ${skipCount} periods`);
    console.log(`❌ Errors: ${errorCount} periods`);
    
    // Display anonymization stats
    const stats = getSessionStats();
    console.log(`\n🔒 Privacy Protection:`);
    console.log(`   - Residents anonymized: ${stats.residentsAnonymized}`);
    console.log(`   - Pseudonyms generated: ${stats.pseudonymsGenerated}`);
    console.log(`   - All PII scrubbed before sending to Claude`);

    if (successCount > 0) {
      console.log('\n🎉 Real SWOT analysis now available in the dashboard!');
      console.log(`   View at: http://localhost:3000/modules/understand/overview/resident/${LARISSA_ID}`);
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

