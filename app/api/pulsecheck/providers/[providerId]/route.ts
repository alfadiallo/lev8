import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/pulsecheck/providers/[providerId]
 * Get a specific provider with their rating history
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  try {
    const { providerId } = await params;
    const { searchParams } = new URL(request.url);
    const directorId = searchParams.get('director_id');
    const cycleId = searchParams.get('cycle_id');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get provider details
    const { data: provider, error: providerError } = await supabase
      .from('pulsecheck_providers')
      .select(`
        id,
        name,
        email,
        provider_type,
        credential,
        hire_date,
        is_active,
        primary_department_id,
        primary_director_id
      `)
      .eq('id', providerId)
      .single();

    if (providerError) {
      if (providerError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
      }
      throw providerError;
    }

    // Get existing rating if director and/or cycle specified
    let existingRating = null;
    if (directorId) {
      let ratingQuery = supabase
        .from('pulsecheck_ratings')
        .select('*')
        .eq('provider_id', providerId)
        .eq('director_id', directorId);

      if (cycleId) {
        ratingQuery = ratingQuery.eq('cycle_id', cycleId);
      }

      const { data: rating } = await ratingQuery.single();
      existingRating = rating;
    }

    // Get rating history
    const { data: ratingHistory } = await supabase
      .from('pulsecheck_ratings_with_totals')
      .select('*')
      .eq('provider_id', providerId)
      .order('completed_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      provider,
      existingRating,
      ratingHistory: ratingHistory || [],
    });
  } catch (error) {
    console.error('[pulsecheck/providers/[id]] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/pulsecheck/providers/[providerId]
 * Update a provider
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  try {
    const { providerId } = await params;
    const body = await request.json();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: provider, error } = await supabase
      .from('pulsecheck_providers')
      .update(body)
      .eq('id', providerId)
      .select()
      .single();

    if (error) {
      console.error('[pulsecheck/providers/[id]] Update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ provider });
  } catch (error) {
    console.error('[pulsecheck/providers/[id]] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/pulsecheck/providers/[providerId]
 * Soft delete a provider
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  try {
    const { providerId } = await params;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from('pulsecheck_providers')
      .update({ is_active: false })
      .eq('id', providerId);

    if (error) {
      console.error('[pulsecheck/providers/[id]] Delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[pulsecheck/providers/[id]] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
