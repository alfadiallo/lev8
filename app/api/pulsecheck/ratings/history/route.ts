import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

/**
 * GET /api/pulsecheck/ratings/history
 * Get historical ratings data for sparklines
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const directorId = searchParams.get('director_id');

    if (!directorId) {
      return NextResponse.json({ error: 'director_id is required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get providers for this director
    const { data: providers, error: providerError } = await supabase
      .from('pulsecheck_providers')
      .select('id')
      .eq('primary_director_id', directorId)
      .eq('is_active', true);

    if (providerError) {
      console.error('[ratings/history] Provider error:', providerError);
      return NextResponse.json({ error: providerError.message }, { status: 500 });
    }

    const providerIds = providers?.map(p => p.id) || [];

    if (providerIds.length === 0) {
      return NextResponse.json({ history: [] });
    }

    // Get all completed ratings for these providers, ordered by date
    const { data: ratings, error: ratingsError } = await supabase
      .from('pulsecheck_ratings_with_totals')
      .select(`
        provider_id,
        cycle_id,
        status,
        completed_at,
        overall_total,
        eq_total,
        pq_total,
        iq_total
      `)
      .in('provider_id', providerIds)
      .eq('status', 'completed')
      .order('completed_at', { ascending: true });

    if (ratingsError) {
      console.error('[ratings/history] Ratings error:', ratingsError);
      return NextResponse.json({ error: ratingsError.message }, { status: 500 });
    }

    // Group ratings by provider and extract score arrays
    const historyByProvider: Record<string, {
      scores: number[];
      eq_scores: number[];
      pq_scores: number[];
      iq_scores: number[];
    }> = {};

    for (const rating of ratings || []) {
      if (!historyByProvider[rating.provider_id]) {
        historyByProvider[rating.provider_id] = {
          scores: [],
          eq_scores: [],
          pq_scores: [],
          iq_scores: [],
        };
      }

      if (rating.overall_total != null) {
        historyByProvider[rating.provider_id].scores.push(rating.overall_total);
      }
      if (rating.eq_total != null) {
        historyByProvider[rating.provider_id].eq_scores.push(rating.eq_total);
      }
      if (rating.pq_total != null) {
        historyByProvider[rating.provider_id].pq_scores.push(rating.pq_total);
      }
      if (rating.iq_total != null) {
        historyByProvider[rating.provider_id].iq_scores.push(rating.iq_total);
      }
    }

    // Convert to array format
    const history = Object.entries(historyByProvider).map(([provider_id, data]) => ({
      provider_id,
      ...data,
    }));

    return NextResponse.json({ history });
  } catch (error) {
    console.error('[ratings/history] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
