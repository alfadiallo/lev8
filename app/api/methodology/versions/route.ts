import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('archetype_methodology_versions')
      .select('*')
      .order('effective_date', { ascending: false });

    if (error) {
      console.error('[API /methodology/versions] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch methodology versions' },
        { status: 500 }
      );
    }

    const versions = (data || []).map(v => ({
      id: v.id,
      version: v.version,
      name: v.name,
      effectiveDate: v.effective_date,
      retiredDate: v.retired_date,
      isCurrent: v.is_current,
      changelog: v.changelog || [],
      archetypesCount: (v.archetypes as any[])?.length || 0,
      basedOnResidents: v.based_on_residents,
      basedOnClasses: v.based_on_classes || [],
      accuracyRate: v.accuracy_rate,
      createdAt: v.created_at
    }));

    return NextResponse.json({ versions });
  } catch (err) {
    console.error('[API /methodology/versions] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}




