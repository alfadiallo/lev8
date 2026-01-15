import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidate_id');
    const interviewerEmail = searchParams.get('interviewer_email');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from('interview_ratings')
      .select(`
        *,
        interview_candidates!inner(session_id)
      `)
      .eq('interview_candidates.session_id', sessionId);

    if (candidateId) {
      query = query.eq('candidate_id', candidateId);
    }

    if (interviewerEmail) {
      query = query.eq('interviewer_email', interviewerEmail.toLowerCase());
    }

    const { data: ratings, error } = await query;

    if (error) {
      console.error('[ratings] GET error:', error);
      return NextResponse.json({ error: 'Failed to fetch ratings' }, { status: 500 });
    }

    // If looking for a specific rating, return single object
    if (candidateId && interviewerEmail && ratings && ratings.length > 0) {
      return NextResponse.json({ rating: ratings[0] });
    }

    return NextResponse.json({ ratings: ratings || [] });
  } catch (error) {
    console.error('[ratings] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      candidate_id,
      interviewer_email,
      interviewer_name,
      interviewer_user_id,
      eq_score,
      pq_score,
      iq_score,
      notes,
      questions_asked,
      question_notes,
      questions_used,
    } = body;

    if (!candidate_id) {
      return NextResponse.json({ error: 'Candidate ID is required' }, { status: 400 });
    }

    if (!interviewer_email) {
      return NextResponse.json({ error: 'Interviewer email is required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if a rating already exists for this candidate + interviewer
    const { data: existingRating } = await supabase
      .from('interview_ratings')
      .select('id')
      .eq('candidate_id', candidate_id)
      .eq('interviewer_email', interviewer_email.toLowerCase())
      .single();

    const ratingData = {
      candidate_id,
      interviewer_email: interviewer_email.toLowerCase(),
      interviewer_name: interviewer_name || null,
      interviewer_user_id: interviewer_user_id || null,
      eq_score: eq_score ?? null,
      pq_score: pq_score ?? null,
      iq_score: iq_score ?? null,
      notes: notes || null,
      questions_asked: questions_asked || null,
      question_notes: question_notes || null,
      questions_used: questions_used || {},
      updated_at: new Date().toISOString(),
    };

    let result;

    if (existingRating) {
      // Update existing rating
      const { is_revised, ...updateData } = { ...ratingData, is_revised: true, revised_at: new Date().toISOString() };
      const { data, error } = await supabase
        .from('interview_ratings')
        .update({ ...updateData, is_revised, revised_at: new Date().toISOString() })
        .eq('id', existingRating.id)
        .select()
        .single();

      if (error) {
        console.error('[ratings] UPDATE error:', error);
        return NextResponse.json({ error: 'Failed to update rating' }, { status: 500 });
      }
      result = data;
    } else {
      // Create new rating
      const { data, error } = await supabase
        .from('interview_ratings')
        .insert(ratingData)
        .select()
        .single();

      if (error) {
        console.error('[ratings] INSERT error:', error);
        return NextResponse.json({ error: 'Failed to create rating' }, { status: 500 });
      }
      result = data;
    }

    return NextResponse.json(result, { status: existingRating ? 200 : 201 });
  } catch (error) {
    console.error('[ratings] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
