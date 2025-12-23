#!/usr/bin/env tsx
// Test analysis for one period to check citations

import { createClient } from '@supabase/supabase-js';
import { analyzeCommentsWithRetry } from '../lib/ai/claude-analyzer';
import { buildSWOTPrompt } from '../lib/ai/swot-prompt';

const LARISSA_ID = '3ba5dff9-5699-4499-8e51-0d8cd930b764';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testOnePeriod() {
  console.log('Fetching PGY-4 Spring comments...\n');
  
  const { data, error } = await supabase
    .from('imported_comments')
    .select('comment_text, date_completed')
    .eq('resident_id', LARISSA_ID)
    .eq('period_label', 'PGY-4 Spring')
    .order('date_completed', { ascending: true });

  if (error || !data) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${data.length} comments\n`);

  const comments = data.map(row => ({
    text: row.comment_text,
    date: row.date_completed ? new Date(row.date_completed).toLocaleDateString('en-US') : 'Unknown'
  }));

  const prompt = buildSWOTPrompt({
    residentName: 'Larissa Tavares',
    periodLabel: 'PGY-4 Spring',
    comments,
    nComments: comments.length
  });

  console.log('Sending to Claude...\n');
  const result = await analyzeCommentsWithRetry(prompt);

  console.log('\n=== RESULT ===\n');
  console.log('Strengths:', JSON.stringify(result.strengths, null, 2));
  console.log('\nWeaknesses:', JSON.stringify(result.weaknesses, null, 2));
}

testOnePeriod().catch(console.error);

