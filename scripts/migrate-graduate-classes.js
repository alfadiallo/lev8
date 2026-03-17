// Migrate 167 Graduate profiles into 75 (5 classes × 15) with rest archived.
// Uses existing columns: cohort_label for class name, narrative='ARCHIVED' for archive flag.
// No DDL needed — runs entirely via Supabase JS client.

const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;
if (!url || !key) { console.error('Missing env vars'); process.exit(1); }

const supabase = createClient(url, key, { auth: { persistSession: false } });

// Class design: 5 classes with distinct score profiles
const CLASSES = [
  { label: 'Class of 2026', base: 68, spread: 8  },  // Current — tight, moderate-to-high
  { label: 'Class of 2025', base: 55, spread: 18 },  // Recent — wide spectrum
  { label: 'Class of 2024', base: 72, spread: 10 },  // Mature — higher baseline
  { label: 'Class of 2023', base: 78, spread: 6  },  // Established — tight high cluster
  { label: 'Class of 2022', base: 60, spread: 20 },  // Senior alumni — widest range
];

async function run() {
  // 1. Fetch all Graduates ordered by id
  console.log('Fetching graduates...');
  const { data: grads, error } = await supabase
    .from('epiq_profiles')
    .select('id, first_name, last_name, role, cohort_label, narrative')
    .eq('role', 'Graduate')
    .order('id', { ascending: true });

  if (error) { console.error('Fetch error:', error.message); process.exit(1); }
  console.log(`Found ${grads.length} Graduate profiles`);

  // Check if already migrated
  const alreadyClassified = grads.filter(g => g.cohort_label?.startsWith('Class of'));
  if (alreadyClassified.length >= 75) {
    console.log('Migration already applied. Verifying...');
    const classCounts = {};
    alreadyClassified.forEach(g => { classCounts[g.cohort_label] = (classCounts[g.cohort_label] || 0) + 1; });
    console.log('Class breakdown:', classCounts);
    const archived = grads.filter(g => g.narrative === 'ARCHIVED').length;
    console.log(`Archived: ${archived}`);
    return;
  }

  if (grads.length < 75) {
    console.error(`Only ${grads.length} graduates — need at least 75!`);
    process.exit(1);
  }

  // 2. Archive ALL graduates first
  console.log('\nArchiving all graduates...');
  const { error: archErr } = await supabase
    .from('epiq_profiles')
    .update({ narrative: 'ARCHIVED', cohort_label: 'Archived' })
    .eq('role', 'Graduate');
  if (archErr) { console.error('Archive error:', archErr.message); process.exit(1); }

  // 3. Assign 75 graduates to 5 classes and un-archive
  console.log('\nAssigning 75 graduates to 5 classes...');
  let totalAssigned = 0;

  for (let ci = 0; ci < CLASSES.length; ci++) {
    const cls = CLASSES[ci];
    console.log(`\n  ${cls.label} (base: ${cls.base}, spread: ±${cls.spread}):`);

    for (let slot = 0; slot < 15; slot++) {
      const idx = ci * 15 + slot;
      const target = grads[idx];

      // Un-archive and assign class
      const { error: assignErr } = await supabase
        .from('epiq_profiles')
        .update({ cohort_label: cls.label, narrative: null })
        .eq('id', target.id);
      if (assignErr) { console.error(`  Error assigning ${target.id}:`, assignErr.message); continue; }

      // Fetch scores to re-scale
      const { data: scores } = await supabase
        .from('epiq_profile_scores')
        .select('id, score, pillar')
        .eq('profile_id', target.id);

      if (scores && scores.length > 0) {
        const oldAvg = scores.reduce((a, s) => a + s.score, 0) / scores.length;
        // Distribute: slot 0-14 maps to (base - spread) to (base + spread) linearly
        const targetCenter = Math.max(28, Math.min(96, cls.base + (slot - 7) * (cls.spread * 2 / 14)));

        if (oldAvg > 0) {
          const scale = targetCenter / oldAvg;
          for (const s of scores) {
            const jitter = (Math.random() - 0.5) * cls.spread * 0.3;
            const newScore = Math.max(22, Math.min(100, Math.round(s.score * scale + jitter)));
            await supabase.from('epiq_profile_scores').update({ score: newScore }).eq('id', s.id);
          }
        }
      }

      // Update trajectory history Graduate row to match new scores
      const { data: updatedScores } = await supabase
        .from('epiq_profile_scores')
        .select('score, pillar')
        .eq('profile_id', target.id);

      if (updatedScores && updatedScores.length > 0) {
        const pillarAvg = (p) => {
          const vals = updatedScores.filter(s => s.pillar === p).map(s => s.score);
          return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 50;
        };
        const eqAvg = pillarAvg('eq');
        const pqAvg = pillarAvg('pq');
        const iqAvg = pillarAvg('iq');
        const comp = Math.round((eqAvg + pqAvg + iqAvg) / 3);

        await supabase
          .from('epiq_profile_history')
          .update({ composite_score: comp, eq_score: eqAvg, pq_score: pqAvg, iq_score: iqAvg })
          .eq('profile_id', target.id)
          .eq('period', 'Graduate');
      }

      totalAssigned++;
    }
    console.log(`    ✓ 15 assigned`);
  }

  // 4. Ensure non-graduates are clean
  await supabase
    .from('epiq_profiles')
    .update({ narrative: null })
    .neq('role', 'Graduate')
    .eq('narrative', 'ARCHIVED');

  // 5. Verify
  console.log('\n--- Verification ---');
  const { data: finalGrads } = await supabase
    .from('epiq_profiles')
    .select('id, cohort_label, narrative')
    .eq('role', 'Graduate');

  const active = finalGrads.filter(g => g.narrative !== 'ARCHIVED');
  const archived = finalGrads.filter(g => g.narrative === 'ARCHIVED');
  console.log(`Active graduates: ${active.length}`);
  console.log(`Archived graduates: ${archived.length}`);

  const classCounts = {};
  active.forEach(g => { classCounts[g.cohort_label] = (classCounts[g.cohort_label] || 0) + 1; });
  console.log('Class breakdown:', classCounts);

  // Show score ranges per class
  for (const cls of CLASSES) {
    const classProfiles = active.filter(g => g.cohort_label === cls.label);
    const composites = [];
    for (const p of classProfiles) {
      const { data: sc } = await supabase
        .from('epiq_profile_scores')
        .select('score, pillar')
        .eq('profile_id', p.id);
      if (sc && sc.length > 0) {
        const avg = Math.round(sc.reduce((a, s) => a + s.score, 0) / sc.length);
        composites.push(avg);
      }
    }
    if (composites.length > 0) {
      const min = Math.min(...composites);
      const max = Math.max(...composites);
      const mean = Math.round(composites.reduce((a, b) => a + b, 0) / composites.length);
      console.log(`  ${cls.label}: mean=${mean}, range=[${min}–${max}]`);
    }
  }

  console.log('\nDone!');
}

run().catch(err => { console.error('Fatal:', err); process.exit(1); });
