import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createClient();
    
    // Get classifications with drift
    const { data: driftData, error: driftError } = await supabase
      .from('resident_classifications')
      .select(`
        resident_id,
        original_archetype_name,
        current_archetype_name,
        has_version_drift,
        drift_reason,
        residents(
          user_profiles(full_name)
        )
      `)
      .eq('has_version_drift', true);

    if (driftError) {
      console.error('[API /methodology/drift-analysis] Error fetching drift:', driftError);
      return NextResponse.json(
        { error: 'Failed to fetch drift analysis' },
        { status: 500 }
      );
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('resident_classifications')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('[API /methodology/drift-analysis] Error fetching count:', countError);
    }

    const total = count || 0;
    const drifted = driftData?.length || 0;

    return NextResponse.json({
      totalResidents: total,
      withDrift: drifted,
      driftPercentage: total > 0 ? ((drifted / total) * 100).toFixed(1) : '0',
      driftDetails: (driftData || []).map(d => ({
        residentId: d.resident_id,
        residentName: (d.residents as any)?.user_profiles?.full_name || 'Unknown',
        originalArchetype: d.original_archetype_name,
        currentArchetype: d.current_archetype_name,
        driftReason: d.drift_reason || 'unknown'
      }))
    });
  } catch (err) {
    console.error('[API /methodology/drift-analysis] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


