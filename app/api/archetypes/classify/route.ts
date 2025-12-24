import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase'; // Service role client
import { classifyResident } from '@/lib/archetypes/classifier';

// Result type from the legacy classifier
interface LegacyClassificationResult {
  resident_id: string;
  archetype: string;
  confidence: number;
  fit_details: Record<string, unknown>;
  similar_residents: unknown[];
  needs_review: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const { resident_id } = await req.json();

    if (!resident_id) {
      return NextResponse.json({ error: 'Resident ID required' }, { status: 400 });
    }

    const supabase = createClient();

    // Run classification with service role client
    const result = await classifyResident(resident_id, supabase) as LegacyClassificationResult | null;

    if (!result) {
      return NextResponse.json({ error: 'Classification failed (insufficient data)' }, { status: 404 });
    }

    // Get archetype ID using archetype name from the result
    const { data: archDef } = await supabase
      .from('archetype_definitions')
      .select('id')
      .eq('name', result.archetype)
      .single();

    const archetypeId = archDef?.id;

    const { error: saveError } = await supabase
      .from('resident_archetypes')
      .upsert({
        resident_id: resident_id,
        archetype_id: archetypeId,
        confidence: result.confidence,
        fit_details: result.fit_details,
        similar_residents: result.similar_residents || [],
        needs_review: result.needs_review,
        review_status: 'pending',
        updated_at: new Date().toISOString()
      }, { onConflict: 'resident_id' });

    if (saveError) {
      console.error('Error saving classification:', saveError);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in classification API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
