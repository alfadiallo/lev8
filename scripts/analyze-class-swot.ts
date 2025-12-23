#!/usr/bin/env tsx
/**
 * Generate class-level SWOT analysis aggregated by PGY year
 * Aggregates all comments for a graduation class across PGY-1, PGY-2, and PGY-3
 */

import { createClient } from '@supabase/supabase-js';
import { analyzeCommentsWithRetry } from '../lib/ai/claude-analyzer';
import { buildClassSWOTPrompt } from '../lib/ai/swot-prompt-class';
import { anonymizeComments, type CommentWithDate } from '../lib/ai/anonymizer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ Missing ANTHROPIC_API_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CommentWithDate is imported from anonymizer

// Calculate date range for a PGY year based on graduation year
function getPGYDateRange(graduationYear: number, pgyLevel: number): { start: Date; end: Date } {
  // PGY-1 starts 3 years before graduation, PGY-2 is 2 years before, PGY-3 is 1 year before
  const yearsBeforeGraduation = 4 - pgyLevel;
  const startYear = graduationYear - yearsBeforeGraduation;
  
  return {
    start: new Date(`${startYear}-07-01`),
    end: new Date(`${startYear + 1}-06-30`)
  };
}

async function fetchClassCommentsByPGY(classYear: number, pgyLevel: number) {
  console.log(`\n📚 Fetching comments for Class of ${classYear}, PGY-${pgyLevel}...`);
  
  const dateRange = getPGYDateRange(classYear, pgyLevel);
  console.log(`   Date range: ${dateRange.start.toISOString().split('T')[0]} to ${dateRange.end.toISOString().split('T')[0]}`);
  
  // Get all residents in this class
  const { data: residents, error: residentsError } = await supabase
    .from('residents')
    .select('id, user_profiles!inner(full_name), classes!inner(graduation_year)')
    .eq('classes.graduation_year', classYear);
  
  if (residentsError) {
    throw new Error(`Failed to fetch residents: ${residentsError.message}`);
  }
  
  if (!residents || residents.length === 0) {
    console.log(`   ⚠️  No residents found for Class of ${classYear}`);
    return { comments: [], residentCount: 0 };
  }
  
  console.log(`   Found ${residents.length} residents in class`);
  
  const residentIds = residents.map((r: any) => r.id);
  
  // Fetch all comments for these residents within the date range
  const { data: comments, error: commentsError } = await supabase
    .from('imported_comments')
    .select('comment_text, date_completed')
    .in('resident_id', residentIds)
    .gte('date_completed', dateRange.start.toISOString())
    .lte('date_completed', dateRange.end.toISOString())
    .not('comment_text', 'is', null)
    .order('date_completed', { ascending: true });
  
  if (commentsError) {
    throw new Error(`Failed to fetch comments: ${commentsError.message}`);
  }
  
  const formattedComments: CommentWithDate[] = (comments || []).map(c => ({
    text: c.comment_text,
    date: c.date_completed ? new Date(c.date_completed).toLocaleDateString('en-US') : 'Unknown date'
  }));
  
  console.log(`   ✓ Found ${formattedComments.length} comments`);
  
  return {
    comments: formattedComments,
    residentCount: residents.length
  };
}

async function analyzeClassPGY(classYear: number, pgyLevel: number) {
  const periodLabel = `PGY-${pgyLevel}`;
  console.log(`\n🤖 Analyzing ${periodLabel} for Class of ${classYear}...`);
  
  const { comments, residentCount } = await fetchClassCommentsByPGY(classYear, pgyLevel);
  
  if (comments.length < 10) {
    console.log(`   ⚠️  Skipping (< 10 comments, insufficient data)`);
    return null;
  }
  
  // Anonymize comments (dates and PHI scrubbing)
  const anonymizedComments = anonymizeComments(comments);
  
  // Build class-level SWOT prompt (cohort analysis)
  const prompt = buildClassSWOTPrompt({
    classYear: classYear,
    periodLabel: `${periodLabel} year`,
    comments: anonymizedComments,
    nComments: comments.length,
    nResidents: residentCount,
  });
  
  console.log(`   Sending to Claude... (${prompt.length} chars, ${comments.length} comments from ${residentCount} residents)`);
  
  // Call Claude API (use class year as identifier for audit log)
  const result = await analyzeCommentsWithRetry(prompt, `class-${classYear}`, `Class of ${classYear}`, periodLabel);
  
  console.log(`   ✓ Analysis complete`);
  console.log(`     - Strengths: ${result.strengths.length}`);
  console.log(`     - Weaknesses: ${result.weaknesses.length} (${result.weaknesses.filter((w: any) => w.severity === 'critical').length} critical)`);
  console.log(`     - Opportunities: ${result.opportunities.length}`);
  console.log(`     - Threats: ${result.threats.length}`);
  console.log(`     - Confidence: ${(result.confidence * 100).toFixed(0)}%`);
  
  return {
    ...result,
    n_comments: comments.length,
    n_residents: residentCount
  };
}

async function saveClassSWOT(classYear: number, pgyLevel: number, analysis: any) {
  console.log(`\n💾 Saving results for Class of ${classYear} PGY-${pgyLevel}...`);
  
  const periodLabel = `PGY-${pgyLevel}`;
  
  // Delete existing class-level SWOT for this period
  await supabase
    .from('swot_summaries')
    .delete()
    .eq('class_year', classYear)
    .eq('period_label', periodLabel);
  
  // Insert new class-level SWOT
  const { error } = await supabase
    .from('swot_summaries')
    .insert({
      class_year: classYear,
      resident_id: null,
      period_label: periodLabel,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      opportunities: analysis.opportunities,
      threats: analysis.threats,
      n_comments_analyzed: analysis.n_comments,
      ai_confidence: analysis.confidence,
      ai_model_version: 'claude-sonnet-4-20250514',
      analysis_version: 'v1.0',
      is_current: true,
    });
  
  if (error) {
    throw new Error(`Failed to save SWOT: ${error.message}`);
  }
  
  console.log(`   ✓ Saved (${analysis.n_comments} comments from ${analysis.n_residents} residents)`);
}

async function main() {
  const classYear = process.argv[2] ? parseInt(process.argv[2]) : 2026;
  
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log(`║  Class-Level SWOT Analysis - Class of ${classYear}                ║`);
  console.log('║  Aggregated by PGY Year                                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  try {
    let successCount = 0;
    let skipCount = 0;
    
    // Analyze PGY-3, PGY-2, PGY-1 (in reverse order for display)
    for (const pgyLevel of [3, 2, 1]) {
      try {
        const analysis = await analyzeClassPGY(classYear, pgyLevel);
        
        if (analysis) {
          await saveClassSWOT(classYear, pgyLevel, analysis);
          successCount++;
        } else {
          skipCount++;
        }
      } catch (error) {
        console.error(`\n❌ Error analyzing PGY-${pgyLevel}:`, error);
      }
    }
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  ANALYSIS COMPLETE                                         ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`\n✓ Successfully analyzed: ${successCount} PGY year(s)`);
    console.log(`⚠️  Skipped (insufficient data): ${skipCount} PGY year(s)`);
    
    if (successCount > 0) {
      console.log(`\n🎉 Class-level SWOT for Class of ${classYear} is now available!`);
      console.log(`   Navigate to /modules/understand/overview/class/${classYear} to view.`);
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();

