import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('evolution_triggers')
      .select('*')
      .in('status', ['pending', 'under_review'])
      .order('triggered_at', { ascending: true });

    if (error) {
      console.error('[API /methodology/triggers] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch evolution triggers' },
        { status: 500 }
      );
    }

    const triggers = (data || []).map(t => ({
      id: t.id,
      type: t.trigger_type,
      triggeredAt: t.triggered_at,
      details: t.details,
      recommendation: t.recommendation,
      affectedCount: t.affected_residents?.length || 0,
      status: t.status,
      daysPending: Math.floor(
        (Date.now() - new Date(t.triggered_at).getTime()) / (1000 * 60 * 60 * 24)
      )
    }));

    return NextResponse.json({ triggers });
  } catch (err) {
    console.error('[API /methodology/triggers] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


