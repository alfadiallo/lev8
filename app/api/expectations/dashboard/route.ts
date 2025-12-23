import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // For now, get the first program (in production, this would come from user context)
    const { data: programs } = await supabase
      .from('programs')
      .select('id')
      .limit(1);

    const programId = programs?.[0]?.id;

    if (!programId) {
      // Return empty data if no program exists
      return NextResponse.json({
        summary: {
          total_requirements: 0,
          compliant_count: 0,
          at_risk_count: 0,
          non_compliant_count: 0,
          not_assessed_count: 0,
          compliance_percentage: 0,
        },
        categories: [],
        deadlines: [],
      });
    }

    // Get compliance summary using the database function
    const { data: summaryData, error: summaryError } = await supabase
      .rpc('calculate_program_compliance', { p_program_id: programId });

    if (summaryError) {
      console.error('Summary error:', summaryError);
    }

    // Get category breakdown using the database function
    const { data: categoryData, error: categoryError } = await supabase
      .rpc('get_compliance_by_category', { p_program_id: programId });

    if (categoryError) {
      console.error('Category error:', categoryError);
    }

    // Get upcoming deadlines using the database function
    const { data: deadlineData, error: deadlineError } = await supabase
      .rpc('get_upcoming_deadlines', { p_program_id: programId, p_days: 30 });

    if (deadlineError) {
      console.error('Deadline error:', deadlineError);
    }

    // Format the summary - the RPC returns an array with one row
    const summary = summaryData?.[0] || {
      total_requirements: 0,
      compliant_count: 0,
      at_risk_count: 0,
      non_compliant_count: 0,
      not_assessed_count: 0,
      compliance_percentage: 0,
    };

    return NextResponse.json({
      summary,
      categories: categoryData || [],
      deadlines: deadlineData || [],
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

