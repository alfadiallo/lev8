// Analyze current database state and readiness

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function analyzeDBState() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Lev8 Database State Analysis                              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // 1. Data completeness by level
  console.log('📊 DATA COMPLETENESS:\n');
  
  // Individual residents
  const { data: residents } = await supabase.from('residents').select('id');
  const { data: residentSWOT } = await supabase
    .from('swot_summaries')
    .select('resident_id')
    .not('resident_id', 'is', null);
  const { data: residentScores } = await supabase.from('period_scores').select('resident_id');
  
  console.log(`Individual Residents:`);
  console.log(`  Total residents: ${residents?.length || 0}`);
  console.log(`  With SWOT data: ${new Set(residentSWOT?.map(r => r.resident_id)).size || 0}`);
  console.log(`  With EQ/PQ/IQ scores: ${new Set(residentScores?.map(r => r.resident_id)).size || 0}`);
  
  // Class level
  const { data: classSWOT } = await supabase
    .from('swot_summaries')
    .select('class_year, period_label')
    .is('resident_id', null);
  
  const classYears = new Set(classSWOT?.map(c => c.class_year));
  console.log(`\nClass-Level Analytics:`);
  console.log(`  Classes with SWOT: ${classYears.size} (${Array.from(classYears).sort().join(', ')})`);
  console.log(`  Total class SWOT summaries: ${classSWOT?.length || 0}`);
  
  // 2. Relationship data (for graph DB)
  console.log('\n\n🔗 RELATIONSHIP DATA (Graph DB Readiness):\n');
  
  const { data: comments } = await supabase
    .from('imported_comments')
    .select('resident_id, faculty_id, rotation_type_id')
    .not('resident_id', 'is', null);
  
  const residentFacultyPairs = new Set(
    comments?.filter(c => c.faculty_id).map(c => `${c.resident_id}:${c.faculty_id}`)
  );
  const residentRotationPairs = new Set(
    comments?.filter(c => c.rotation_type_id).map(c => `${c.resident_id}:${c.rotation_type_id}`)
  );
  
  console.log(`Resident ↔ Faculty relationships: ${residentFacultyPairs.size}`);
  console.log(`Resident ↔ Rotation relationships: ${residentRotationPairs.size}`);
  console.log(`Total evaluation events: ${comments?.length || 0}`);
  
  // 3. Missing data
  console.log('\n\n⚠️  DATA GAPS:\n');
  
  const { data: commentsWithoutFaculty } = await supabase
    .from('imported_comments')
    .select('id')
    .is('faculty_id', null)
    .not('resident_id', 'is', null);
  
  const { data: residentsWithoutSWOT } = await supabase
    .from('residents')
    .select('id')
    .not('id', 'in', `(${residentSWOT?.map(r => r.resident_id).join(',') || 'null'})`);
  
  console.log(`Comments without faculty link: ${commentsWithoutFaculty?.length || 0}`);
  console.log(`Residents without SWOT: ${residentsWithoutSWOT?.length || 0}`);
  
  // 4. Recommendations
  console.log('\n\n💡 RECOMMENDATIONS:\n');
  
  const individualCompleteness = ((residentSWOT?.length || 0) / (residents?.length || 1)) * 100;
  const classCompleteness = classYears.size;
  
  console.log(`Individual Profile Completeness: ${individualCompleteness.toFixed(0)}%`);
  console.log(`Class Analytics Completeness: ${classCompleteness}/5 classes\n`);
  
  if (individualCompleteness < 50) {
    console.log('🎯 PRIORITY: Individual Resident Profiles');
    console.log('   - Generate SWOT for remaining residents');
    console.log('   - Collect more EQ/PQ/IQ ratings');
  } else if (classCompleteness < 3) {
    console.log('🎯 PRIORITY: Class-Level Analytics');
    console.log('   - Generate SWOT for more classes');
    console.log('   - Enable historical comparison');
  } else {
    console.log('🎯 PRIORITY: Advanced Features');
    console.log('   - Neo4j graph database integration');
    console.log('   - Network analysis (resident-faculty-rotation)');
    console.log('   - Predictive analytics');
  }
  
  console.log('\n\n📈 GRAPH DB READINESS:\n');
  
  if (residentFacultyPairs.size > 100 && residentRotationPairs.size > 100) {
    console.log('✅ READY for Neo4j integration');
    console.log('   - Sufficient relationship data');
    console.log('   - Can model: Resident → Evaluated_By → Faculty');
    console.log('   - Can model: Resident → Completed → Rotation');
    console.log('   - Can model: Class → Contains → Resident');
  } else {
    console.log('⚠️  NOT READY for Neo4j yet');
    console.log('   - Need more relationship data');
    console.log('   - Focus on data collection first');
  }
}

analyzeDBState();
