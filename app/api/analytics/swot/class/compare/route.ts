// GET /api/analytics/swot/class/compare - Get historical class SWOT data for comparison

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const periodLabel = searchParams.get('period_label');
    const swotType = searchParams.get('swot_type');
    const excludeYear = searchParams.get('exclude_year');

    if (!periodLabel || !swotType || !excludeYear) {
      return NextResponse.json(
        { error: 'Missing required parameters: period_label, swot_type, exclude_year' },
        { status: 400 }
      );
    }

    const excludeYearNum = parseInt(excludeYear);

    // Fetch class-level SWOT summaries for the specified period
    // Exclude the current class and only get class-level data (resident_id is null)
    const { data: swotData, error } = await supabase
      .from('swot_summaries')
      .select('class_year, period_label, strengths, weaknesses, opportunities, threats, n_comments_analyzed, ai_confidence')
      .eq('period_label', periodLabel)
      .neq('class_year', excludeYearNum)
      .is('resident_id', null)
      .eq('is_current', true)
      .order('class_year', { ascending: false });

    if (error) {
      console.error('[Analytics API] Historical comparison fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch historical SWOT data' },
        { status: 500 }
      );
    }

    // Map the data to extract only the requested SWOT type
    const comparisons = (swotData || []).map((row: any) => ({
      class_year: row.class_year,
      period_label: row.period_label,
      items: row[swotType] || [],
      n_comments_analyzed: row.n_comments_analyzed,
      ai_confidence: row.ai_confidence
    }));

    return NextResponse.json({
      comparisons
    });
  } catch (error) {
    console.error('[Analytics API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


