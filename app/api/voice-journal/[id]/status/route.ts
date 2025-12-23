import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const { id } = params;

    const { data: entry, error } = await supabase
      .from('grow_voice_journal')
      .select('id, transcription, claude_summary')
      .eq('id', id)
      .single();

    if (error || !entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    // Determine status based on what's been processed
    let status = 'uploading';
    if (entry.transcription) {
      status = entry.claude_summary ? 'complete' : 'summarizing';
    } else if (entry.transcription === null) {
      status = 'transcribing';
    }

    return NextResponse.json(
      {
        entryId: entry.id,
        status,
        hasTranscription: !!entry.transcription,
        hasSummary: !!entry.claude_summary,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}