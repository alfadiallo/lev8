import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all requirements
    const { data: requirements, error: reqError } = await supabase
      .from('acgme_requirements')
      .select('*')
      .order('id');

    if (reqError) {
      console.error('Requirements fetch error:', reqError);
      throw reqError;
    }

    // Get the first program (in production, from user context)
    const { data: programs } = await supabase
      .from('programs')
      .select('id')
      .limit(1);

    const programId = programs?.[0]?.id;

    let compliance: any[] = [];
    if (programId) {
      // Fetch compliance status for this program
      const { data: complianceData, error: compError } = await supabase
        .from('acgme_compliance_status')
        .select('*')
        .eq('program_id', programId);

      if (compError) {
        console.error('Compliance fetch error:', compError);
      } else {
        compliance = complianceData || [];
      }
    }

    return NextResponse.json({
      requirements: requirements || [],
      compliance,
    });
  } catch (error) {
    console.error('Requirements API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch requirements' },
      { status: 500 }
    );
  }
}

