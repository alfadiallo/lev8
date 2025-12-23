// Check which classes have evaluation comments

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function checkClassesWithComments() {
  console.log('Checking classes with evaluation comments...\n');

  const { data, error } = await supabase
    .from('imported_comments')
    .select(`
      pgy_level,
      period_label,
      residents!inner(
        classes!inner(
          graduation_year
        )
      )
    `)
    .not('resident_id', 'is', null);

  if (error) {
    console.error('Error:', error);
    return;
  }

  const grouped: any = {};
  
  data.forEach((row: any) => {
    const classYear = row.residents?.classes?.graduation_year;
    if (!classYear) return;
    
    const key = `${classYear}|${row.pgy_level}`;
    if (!grouped[key]) {
      grouped[key] = { 
        class_year: classYear, 
        pgy_level: row.pgy_level, 
        count: 0, 
        periods: new Set() 
      };
    }
    grouped[key].count++;
    if (row.period_label) grouped[key].periods.add(row.period_label);
  });

  const byClass: any = {};
  Object.values(grouped).forEach((item: any) => {
    if (!byClass[item.class_year]) {
      byClass[item.class_year] = [];
    }
    byClass[item.class_year].push(item);
  });

  console.log('Classes with evaluation comments:');
  console.log('─'.repeat(80));
  
  const sortedClasses = Object.entries(byClass).sort((a, b) => Number(b[0]) - Number(a[0]));
  
  for (const [classYear, items] of sortedClasses) {
    console.log(`\nClass of ${classYear}:`);
    (items as any[]).sort((a, b) => b.pgy_level.localeCompare(a.pgy_level)).forEach((item: any) => {
      const periods = Array.from(item.periods).sort().join(', ');
      console.log(`  ${item.pgy_level}: ${item.count} comments (${periods})`);
    });
  }
  
  console.log('\n' + '─'.repeat(80));
  console.log(`\nClasses available for SWOT generation: ${sortedClasses.map(([y]) => y).join(', ')}`);
  console.log(`\nTo generate SWOT for a class, run:`);
  console.log(`npx tsx --env-file=.env.local scripts/analyze-class-swot.ts <YEAR>`);
}

checkClassesWithComments();
