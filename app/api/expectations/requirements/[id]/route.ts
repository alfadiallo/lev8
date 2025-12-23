import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the requirement
    const { data: requirement, error: reqError } = await supabase
      .from('acgme_requirements')
      .select('*')
      .eq('id', id)
      .single();

    if (reqError) {
      if (reqError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Requirement not found' },
          { status: 404 }
        );
      }
      throw reqError;
    }

    // Get the first program (in production, from user context)
    const { data: programs } = await supabase
      .from('programs')
      .select('id')
      .limit(1);

    const programId = programs?.[0]?.id;

    let compliance = null;
    if (programId) {
      // Fetch compliance status for this requirement
      const { data: complianceData } = await supabase
        .from('acgme_compliance_status')
        .select('*')
        .eq('program_id', programId)
        .eq('requirement_id', id)
        .single();

      compliance = complianceData;
    }

    return NextResponse.json({
      requirement,
      compliance,
    });
  } catch (error) {
    console.error('Requirement detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch requirement' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the first program (in production, from user context)
    const { data: programs } = await supabase
      .from('programs')
      .select('id')
      .limit(1);

    const programId = programs?.[0]?.id;

    if (!programId) {
      return NextResponse.json(
        { error: 'No program found' },
        { status: 400 }
      );
    }

    // Upsert compliance status
    const { data, error } = await supabase
      .from('acgme_compliance_status')
      .upsert({
        program_id: programId,
        requirement_id: id,
        status: status,
        notes: notes,
        assessment_date: new Date().toISOString().split('T')[0],
      }, {
        onConflict: 'program_id,requirement_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Compliance update error:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      compliance: data,
    });
  } catch (error) {
    console.error('Requirement update API error:', error);
    return NextResponse.json(
      { error: 'Failed to update compliance status' },
      { status: 500 }
    );
  }
}


