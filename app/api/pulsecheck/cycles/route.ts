import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

/**
 * GET /api/pulsecheck/cycles
 * Get all rating cycles
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from('pulsecheck_cycles')
      .select('*')
      .order('start_date', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: cycles, error } = await query;

    if (error) {
      console.error('[pulsecheck/cycles] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ cycles });
  } catch (error) {
    console.error('[pulsecheck/cycles] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/pulsecheck/cycles
 * Create a new rating cycle
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      description, 
      start_date, 
      due_date, 
      reminder_cadence,
      created_by 
    } = body;

    if (!name || !start_date || !due_date) {
      return NextResponse.json(
        { error: 'Name, start date, and due date are required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: cycle, error } = await supabase
      .from('pulsecheck_cycles')
      .insert({
        name,
        description,
        start_date,
        due_date,
        reminder_cadence: reminder_cadence || 'weekly',
        created_by,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('[pulsecheck/cycles] Insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Create rating entries for all providers assigned to directors
    const { data: providers } = await supabase
      .from('pulsecheck_providers')
      .select('id, primary_director_id')
      .eq('is_active', true)
      .not('primary_director_id', 'is', null);

    if (providers && providers.length > 0) {
      const ratingEntries = providers.map(p => ({
        cycle_id: cycle.id,
        provider_id: p.id,
        director_id: p.primary_director_id,
        status: 'pending',
      }));

      await supabase
        .from('pulsecheck_ratings')
        .insert(ratingEntries);
    }

    return NextResponse.json({ cycle }, { status: 201 });
  } catch (error) {
    console.error('[pulsecheck/cycles] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/pulsecheck/cycles
 * Update a cycle
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Cycle ID is required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: cycle, error } = await supabase
      .from('pulsecheck_cycles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[pulsecheck/cycles] Update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ cycle });
  } catch (error) {
    console.error('[pulsecheck/cycles] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
