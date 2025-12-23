// ============================================================
// Populate Similar Historical Profiles
// Calculates similarity scores between residents based on ITE trajectories
// ============================================================

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ResidentData {
  id: string;
  name: string;
  classYear: number;
  pgy1: number | null;
  pgy2: number | null;
  pgy3: number | null;
  archetype: string;
}

interface SimilarResident {
  id: string;
  name: string;
  classYear: number;
  similarityScore: number;
  iteScores: {
    pgy1: number | null;
    pgy2: number | null;
    pgy3: number | null;
  };
  archetype: string;
}

async function main() {
  console.log('=== Populating Similar Historical Profiles ===\n');

  // 1. Get all residents with classifications
  console.log('Fetching all classified residents...');
  const { data: classifications, error: classError } = await supabase
    .from('resident_classifications')
    .select(`
      id,
      resident_id,
      pgy1_percentile,
      pgy2_percentile,
      pgy3_percentile,
      delta_12,
      current_archetype_name,
      residents(
        user_profiles(full_name),
        classes(graduation_year)
      )
    `);

  if (classError || !classifications) {
    console.error('Error fetching classifications:', classError);
    return;
  }

  console.log(`Found ${classifications.length} classified residents\n`);

  // Build resident data array
  const residents: ResidentData[] = classifications.map(c => ({
    id: c.resident_id,
    name: (c.residents as any)?.user_profiles?.full_name || 'Unknown',
    classYear: (c.residents as any)?.classes?.graduation_year || 0,
    pgy1: c.pgy1_percentile,
    pgy2: c.pgy2_percentile,
    pgy3: c.pgy3_percentile,
    archetype: c.current_archetype_name
  }));

  let updatedCount = 0;

  // 2. For each resident, find similar historical profiles
  for (const resident of residents) {
    // Skip residents without at least 2 years of data
    if (resident.pgy1 === null || resident.pgy2 === null) {
      console.log(`  ⏭️  ${resident.name} - Insufficient data for similarity`);
      continue;
    }

    const delta12 = resident.pgy2 - resident.pgy1;

    // Find similar residents (excluding self)
    const similar: SimilarResident[] = [];

    for (const other of residents) {
      if (other.id === resident.id) continue;
      if (other.pgy1 === null || other.pgy2 === null) continue;

      const otherDelta12 = other.pgy2 - other.pgy1;

      // Calculate weighted Euclidean distance
      // Weights: PGY1=30%, PGY2=30%, Delta=40%
      const distSq = 
        0.3 * Math.pow((resident.pgy1 - other.pgy1) / 100, 2) + 
        0.3 * Math.pow((resident.pgy2 - other.pgy2) / 100, 2) + 
        0.4 * Math.pow((delta12 - otherDelta12) / 100, 2);

      const distance = Math.sqrt(distSq);
      const similarity = Math.max(0, 1 - distance * 2);

      // Include if similarity > 50%
      if (similarity > 0.5) {
        similar.push({
          id: other.id,
          name: other.name,
          classYear: other.classYear,
          similarityScore: similarity,
          iteScores: {
            pgy1: other.pgy1,
            pgy2: other.pgy2,
            pgy3: other.pgy3
          },
          archetype: other.archetype
        });
      }
    }

    // Sort by similarity and take top 5
    similar.sort((a, b) => b.similarityScore - a.similarityScore);
    const topSimilar = similar.slice(0, 5);

    // Update the classification record
    const { error: updateError } = await supabase
      .from('resident_classifications')
      .update({ similar_residents: topSimilar })
      .eq('resident_id', resident.id);

    if (updateError) {
      console.error(`  ❌ ${resident.name} - Error:`, updateError.message);
    } else {
      const matchInfo = topSimilar.length > 0 
        ? `${topSimilar.length} matches (top: ${topSimilar[0]?.name} ${Math.round(topSimilar[0]?.similarityScore * 100)}%)`
        : 'no similar profiles found';
      console.log(`  ✓ ${resident.name} → ${matchInfo}`);
      updatedCount++;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`✓ Updated: ${updatedCount} residents with similar profiles`);
}

main();


