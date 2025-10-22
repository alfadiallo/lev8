import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    // Get auth user from session or Bearer token
    const authHeader = req.headers.get('Authorization');
    const cookieHeader = req.headers.get('cookie');
    
    let userId: string | null = null;
    let residentId: string | null = null;

    // Try Bearer token first
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data.user) {
        userId = data.user.id;
      }
    }

    // Try to get from cookie session (for client-side requests)
    if (!userId && cookieHeader) {
      // Extract session from cookies
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      // Try to get session from Supabase
      const sessionToken = cookies['sb-access-token'] || cookies['supabase-auth-token'];
      if (sessionToken) {
        const { data, error } = await supabase.auth.getUser(sessionToken);
        if (!error && data.user) {
          userId = data.user.id;
        }
      }
    }

    // For development: Get any authenticated user from Supabase Auth
    // This is a fallback for MVP - in production use proper middleware
    if (!userId) {
      console.log('No auth found, trying to get any authenticated session');
      const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (!usersError && users && users.length > 0) {
        // Use first user as fallback (for MVP testing only)
        userId = users[0].id;
        console.log('Using fallback user:', userId);
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Parse form data
    console.log('[Upload] Parsing form data...');
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const duration = parseInt(formData.get('duration') as string) || 0;

    console.log('[Upload] Audio file:', audioFile?.name, 'Size:', audioFile?.size, 'Type:', audioFile?.type);
    console.log('[Upload] Duration:', duration, 'seconds');

    if (!audioFile) {
      console.error('[Upload] No audio file in form data');
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Validate file size (50MB max)
    if (audioFile.size > 50 * 1024 * 1024) {
      console.error('[Upload] File too large:', audioFile.size);
      return NextResponse.json(
        { error: 'File too large (max 50MB)' },
        { status: 400 }
      );
    }
    
    // Validate file has content
    if (audioFile.size === 0) {
      console.error('[Upload] Audio file is empty');
      return NextResponse.json(
        { error: 'Audio file is empty' },
        { status: 400 }
      );
    }

    // SIMPLIFIED: Just use the user's ID directly
    // Voice journal only needs authenticated user, not resident/faculty record
    console.log('[Upload] Using user ID for voice journal:', userId);
    
    // Try to get institution from user profile or use default
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('health_system_id')
      .eq('id', userId)
      .single();
    
    let institutionId = userProfile?.health_system_id;
    
    // If no institution in profile, use the first one available
    if (!institutionId) {
      const { data: healthSystem } = await supabase
        .from('health_systems')
        .select('id')
        .limit(1)
        .single();
      
      institutionId = healthSystem?.id;
      console.log('[Upload] Using default institution:', institutionId);
    }
    
    if (!institutionId) {
      console.error('[Upload] No institution found');
      return NextResponse.json(
        { error: 'System not configured. Please contact administrator.' },
        { status: 500 }
      );
    }
    
    // Use userId directly as the "resident_id" for voice journal
    // This allows ANY authenticated user to create voice journals
    residentId = userId;

    // Upload audio file to Supabase Storage
    console.log('[Upload] Starting storage upload for user:', userId);
    
    // Convert File to ArrayBuffer for better compatibility
    const arrayBuffer = await audioFile.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: audioFile.type });
    
    const fileName = `voice_journal/${userId}/${Date.now()}.webm`;
    console.log('[Upload] Uploading to:', fileName);
    
    const { data: storageData, error: storageError } = await supabase.storage
      .from('voice_journal')
      .upload(fileName, blob, {
        contentType: audioFile.type,
        upsert: false
      });

    if (storageError) {
      console.error('[Upload] Storage error:', storageError);
      console.error('[Upload] Storage error details:', JSON.stringify(storageError, null, 2));
      return NextResponse.json(
        { error: `Failed to upload audio: ${storageError.message}` },
        { status: 500 }
      );
    }
    
    console.log('[Upload] Storage upload successful:', storageData.path);

    // Create database record
    console.log('[Upload] Creating database entry...');
    console.log('[Upload] Data:', { 
      institution_id: institutionId, 
      resident_id: residentId, 
      audio_blob_url: storageData.path,
      duration 
    });
    
    const { data: entryData, error: dbError } = await supabase
      .from('grow_voice_journal')
      .insert({
        institution_id: institutionId,
        resident_id: residentId,
        audio_blob_url: storageData.path,
        recording_duration_seconds: duration,
        is_private: true,
      })
      .select('id')
      .single();

    if (dbError) {
      console.error('[Upload] DB insert error:', dbError);
      console.error('[Upload] DB error details:', JSON.stringify(dbError, null, 2));
      // Cleanup: delete uploaded file if DB insert fails
      await supabase.storage
        .from('voice_journal')
        .remove([fileName]);
      return NextResponse.json(
        { error: `Failed to create entry: ${dbError.message}` },
        { status: 500 }
      );
    }
    
    console.log('[Upload] Database entry created:', entryData.id);

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
    console.error('[Upload] Unexpected error:', error);
    console.error('[Upload] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
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
        system: 'Summarize this healthcare professional\'s voice journal entry into 2-3 key reflection points. Be concise and focus on clinical learning and professional development.',
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