// Check which classes have evaluation comments

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function checkAvailableClasses() {
  console.log('Checking classes with evaluation comments...\n');

  const { data, error } = await supabase
    .from('imported_comments')
    .select('class_year, pgy_level, period_label')
    .not('class_year', 'is', null);

  if (error) {
    console.error('Error:', error);
    return;
  }

  const grouped = data.reduce((acc: any, row: any) => {
    const key = `${row.class_year}|${row.pgy_level}`;
    if (!acc[key]) {
      acc[key] = { class_year: row.class_year, pgy_level: row.pgy_level, count: 0, periods: new Set() };
    }
    acc[key].count++;
    if (row.period_label) acc[key].periods.add(row.period_label);
    return acc;
  }, {});

  const byClass = Object.values(grouped).reduce((acc: any, item: any) => {
    if (!acc[item.class_year]) {
      acc[item.class_year] = [];
    }
    acc[item.class_year].push(item);
    return acc;
  }, {});

  console.log('Classes with evaluation comments:');
  console.log('─'.repeat(80));
  
  for (const [classYear, items] of Object.entries(byClass).sort((a, b) => Number(b[0]) - Number(a[0]))) {
    console.log(`\nClass of ${classYear}:`);
    (items as any[]).sort((a, b) => b.pgy_level.localeCompare(a.pgy_level)).forEach((item: any) => {
      const periods = Array.from(item.periods).sort().join(', ');
      console.log(`  ${item.pgy_level}: ${item.count} comments (${periods})`);
    });
  }
  
  console.log('\n' + '─'.repeat(80));
  console.log(`\nTo generate SWOT for a class, run:`);
  console.log(`npx tsx --env-file=.env.local scripts/analyze-class-swot.ts <YEAR>`);
}

checkAvailableClasses();
