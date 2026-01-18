import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; candidateId: string }> }
) {
  try {
    const { candidateId } = await params;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: candidate, error } = await supabase
      .from('interview_candidates')
      .select('*')
      .eq('id', candidateId)
      .single();

    if (error) {
      console.error('[candidate] GET error:', error);
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    return NextResponse.json(candidate);
  } catch (error) {
    console.error('[candidate] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; candidateId: string }> }
) {
  try {
    const { candidateId } = await params;
    const body = await request.json();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const updateData: Record<string, unknown> = { ...body };
    updateData.updated_at = new Date().toISOString();

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.session_id;
    delete updateData.created_at;

    const { data: candidate, error } = await supabase
      .from('interview_candidates')
      .update(updateData)
      .eq('id', candidateId)
      .select()
      .single();

    if (error) {
      console.error('[candidate] PATCH error:', error);
      return NextResponse.json({ error: 'Failed to update candidate' }, { status: 500 });
    }

    return NextResponse.json(candidate);
  } catch (error) {
    console.error('[candidate] PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; candidateId: string }> }
) {
  try {
    const { candidateId } = await params;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from('interview_candidates')
      .delete()
      .eq('id', candidateId);

    if (error) {
      console.error('[candidate] DELETE error:', error);
      return NextResponse.json({ error: 'Failed to delete candidate' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[candidate] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
