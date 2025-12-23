#!/usr/bin/env tsx
// Check if citations are in the database

import { createClient } from '@supabase/supabase-js';

const LARISSA_ID = '3ba5dff9-5699-4499-8e51-0d8cd930b764';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCitations() {
  const { data, error } = await supabase
    .from('swot_summaries')
    .select('period_label, strengths, weaknesses')
    .eq('resident_id', LARISSA_ID)
    .eq('period_label', 'PGY-4 Spring')
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('=== PGY-4 Spring SWOT Data ===\n');
  console.log('Strengths:', JSON.stringify(data.strengths, null, 2));
  console.log('\nWeaknesses:', JSON.stringify(data.weaknesses, null, 2));
}

checkCitations().catch(console.error);

