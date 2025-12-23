import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the first program (in production, from user context)
    const { data: programs } = await supabase
      .from('programs')
      .select('id')
      .limit(1);

    const programId = programs?.[0]?.id;

    if (!programId) {
      return NextResponse.json({ siteVisits: [] });
    }

    // Fetch site visits for this program
    const { data: siteVisits, error } = await supabase
      .from('acgme_site_visits')
      .select(`
        *,
        citations:acgme_citations(
          id,
          requirement_id,
          citation_text,
          severity,
          resolution_status
        )
      `)
      .eq('program_id', programId)
      .order('visit_date', { ascending: false });

    if (error) {
      console.error('Site visits fetch error:', error);
      throw error;
    }

    return NextResponse.json({ siteVisits: siteVisits || [] });
  } catch (error) {
    console.error('Site visits API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site visits' },
      { status: 500 }
    );
  }
}

