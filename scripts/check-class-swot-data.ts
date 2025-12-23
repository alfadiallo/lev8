// Check which classes have SWOT data

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function checkClassSWOTData() {
  console.log('Checking class-level SWOT data...\n');

  const { data, error } = await supabase
    .from('swot_summaries')
    .select('class_year, period_label, n_comments_analyzed, created_at')
    .is('resident_id', null)
    .eq('is_current', true)
    .order('class_year', { ascending: false })
    .order('period_label', { ascending: false });

  if (error) {
    console.error('Error fetching SWOT data:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No class-level SWOT data found.');
    return;
  }

  console.log('Class-level SWOT data:');
  console.log('─'.repeat(80));
  
  const grouped = data.reduce((acc: any, row: any) => {
    if (!acc[row.class_year]) {
      acc[row.class_year] = [];
    }
    acc[row.class_year].push(row);
    return acc;
  }, {});

  for (const [classYear, rows] of Object.entries(grouped)) {
    console.log(`\nClass of ${classYear}:`);
    (rows as any[]).forEach((row: any) => {
      console.log(`  ${row.period_label}: ${row.n_comments_analyzed} comments (${new Date(row.created_at).toLocaleDateString()})`);
    });
  }
  
  console.log('\n' + '─'.repeat(80));
  console.log(`Total: ${data.length} SWOT summaries across ${Object.keys(grouped).length} classes`);
}

checkClassSWOTData();


