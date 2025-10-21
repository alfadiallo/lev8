import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    // Get auth user
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data.user) {
        userId = data.user.id;
      }
    }

    // For MVP, we'll get userId from session context
    // In production, use proper auth middleware
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const duration = parseInt(formData.get('duration') as string) || 0;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Validate file size (50MB max)
    if (audioFile.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large (max 50MB)' },
        { status: 400 }
      );
    }

    // Get resident info to find institution_id
    const { data: residentData, error: residentError } = await supabase
      .from('residents')
      .select('id, program_id')
      .eq('user_id', userId)
      .single();

    if (residentError || !residentData) {
      return NextResponse.json(
        { error: 'Resident record not found' },
        { status: 404 }
      );
    }

    // Get program to find institution_id
    const { data: programData } = await supabase
      .from('programs')
      .select('health_system_id')
      .eq('id', residentData.program_id)
      .single();

    const institutionId = programData?.health_system_id;

    if (!institutionId) {
      return NextResponse.json(
        { error: 'Institution not found' },
        { status: 404 }
      );
    }

    // Upload audio file to Supabase Storage
    const fileName = `voice_journal/${userId}/${Date.now()}.wav`;
    const { data: storageData, error: storageError } = await supabase.storage
      .from('voice_journal')
      .upload(fileName, audioFile);

    if (storageError) {
      console.error('Storage upload error:', storageError);
      return NextResponse.json(
        { error: 'Failed to upload audio' },
        { status: 500 }
      );
    }

    // Create database record
    const { data: entryData, error: dbError } = await supabase
      .from('grow_voice_journal')
      .insert({
        institution_id: institutionId,
        resident_id: residentData.id,
        audio_blob_url: storageData.path,
        recording_duration_seconds: duration,
        is_private: true,
      })
      .select('id')
      .single();

    if (dbError) {
      console.error('DB insert error:', dbError);
      // Cleanup: delete uploaded file if DB insert fails
      await supabase.storage
        .from('voice_journal')
        .remove([fileName]);
      return NextResponse.json(
        { error: 'Failed to create entry' },
        { status: 500 }
      );
    }

    // Trigger transcription job (async)
    // For MVP: we'll call it directly (might timeout, but acceptable)
    triggerTranscriptionJob(entryData.id, storageData.path).catch((err) =>
      console.error('Transcription job failed:', err)
    );

    return NextResponse.json(
      {
        entryId: entryData.id,
        status: 'uploading',
        message: 'Audio uploaded. Transcription starting...',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function triggerTranscriptionJob(entryId: string, audioPath: string) {
  // Update status to transcribing
  await supabase
    .from('grow_voice_journal')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', entryId);

  // Call transcription (will be implemented in next task)
  transcribeAudio(entryId, audioPath);
}

async function transcribeAudio(entryId: string, audioPath: string) {
  try {
    // Get audio from storage
    const { data: audioBuffer, error: downloadError } = await supabase.storage
      .from('voice_journal')
      .download(audioPath);

    if (downloadError || !audioBuffer) {
      throw new Error('Failed to download audio');
    }

    // Call Whisper API (OpenAI)
    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer]), 'audio.wav');
    formData.append('model', 'whisper-1');

    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      throw new Error('Whisper API error');
    }

    const transcriptionData = await whisperResponse.json();
    const transcription = transcriptionData.text;

    // Update DB with transcription
    await supabase
      .from('grow_voice_journal')
      .update({
        transcription,
        transcription_confidence: 0.95, // Placeholder
        updated_at: new Date().toISOString(),
      })
      .eq('id', entryId);

    // Trigger summarization
    summarizeTranscription(entryId, transcription);
  } catch (error) {
    console.error('Transcription error:', error);
    // Update DB with error status
    await supabase
      .from('grow_voice_journal')
      .update({
        transcription: '[Transcription failed - manual entry may be needed]',
        updated_at: new Date().toISOString(),
      })
      .eq('id', entryId);
  }
}

async function summarizeTranscription(entryId: string, transcription: string) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 256,
        system: 'Summarize this medical resident voice journal entry into 2-3 key reflection points. Be concise and focus on clinical learning.',
        messages: [
          {
            role: 'user',
            content: transcription,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error('Claude API error');
    }

    const summaryData = await response.json();
    const summary = summaryData.content[0]?.text || '';

    // Update DB with summary
    await supabase
      .from('grow_voice_journal')
      .update({
        claude_summary: summary,
        updated_at: new Date().toISOString(),
      })
      .eq('id', entryId);
  } catch (error) {
    console.error('Summarization error:', error);
    // Log error but don't fail - transcription alone is valuable
  }
}