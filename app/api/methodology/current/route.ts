import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('archetype_methodology_versions')
      .select('*')
      .eq('is_current', true)
      .single();

    if (error) {
      console.error('[API /methodology/current] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch current methodology version' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'No current methodology version found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: data.id,
      version: data.version,
      name: data.name,
      effectiveDate: data.effective_date,
      isCurrent: data.is_current,
      changelog: data.changelog || [],
      archetypes: data.archetypes || [],
      basedOnResidents: data.based_on_residents,
      basedOnClasses: data.based_on_classes || [],
      accuracyRate: data.accuracy_rate,
      createdAt: data.created_at
    });
  } catch (err) {
    console.error('[API /methodology/current] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


