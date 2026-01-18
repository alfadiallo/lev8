import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

/**
 * GET /api/pulsecheck/ratings
 * Get ratings for a director or cycle
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const directorId = searchParams.get('director_id');
    const cycleId = searchParams.get('cycle_id');
    const providerId = searchParams.get('provider_id');
    const status = searchParams.get('status');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from('pulsecheck_ratings_with_totals')
      .select('*');

    if (directorId) {
      query = query.eq('director_id', directorId);
    }
    if (cycleId) {
      query = query.eq('cycle_id', cycleId);
    }
    if (providerId) {
      query = query.eq('provider_id', providerId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: ratings, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('[pulsecheck/ratings] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ratings });
  } catch (error) {
    console.error('[pulsecheck/ratings] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/pulsecheck/ratings
 * Create or update a rating
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      provider_id,
      director_id,
      cycle_id,
      eq_empathy_rapport,
      eq_communication,
      eq_stress_management,
      eq_self_awareness,
      eq_adaptability,
      pq_reliability,
      pq_integrity,
      pq_teachability,
      pq_documentation,
      pq_leadership,
      iq_clinical_management,
      iq_evidence_based,
      iq_procedural,
      notes,
      strengths,
      areas_for_improvement,
      goals,
      status,
    } = body;

    if (!provider_id || !director_id) {
      return NextResponse.json(
        { error: 'Provider ID and Director ID are required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if rating already exists for this provider/director/cycle combo
    let query = supabase
      .from('pulsecheck_ratings')
      .select('id')
      .eq('provider_id', provider_id)
      .eq('director_id', director_id);

    if (cycle_id) {
      query = query.eq('cycle_id', cycle_id);
    }

    const { data: existing } = await query.single();

    const ratingData = {
      provider_id,
      director_id,
      cycle_id,
      eq_empathy_rapport,
      eq_communication,
      eq_stress_management,
      eq_self_awareness,
      eq_adaptability,
      pq_reliability,
      pq_integrity,
      pq_teachability,
      pq_documentation,
      pq_leadership,
      iq_clinical_management,
      iq_evidence_based,
      iq_procedural,
      notes,
      strengths,
      areas_for_improvement,
      goals,
      status: status || 'in_progress',
      started_at: existing ? undefined : new Date().toISOString(),
      completed_at: status === 'completed' ? new Date().toISOString() : null,
    };

    let result;
    if (existing) {
      // Update existing rating
      const { data, error } = await supabase
        .from('pulsecheck_ratings')
        .update(ratingData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new rating
      const { data, error } = await supabase
        .from('pulsecheck_ratings')
        .insert(ratingData)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ rating: result, updated: !!existing });
  } catch (error) {
    console.error('[pulsecheck/ratings] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
