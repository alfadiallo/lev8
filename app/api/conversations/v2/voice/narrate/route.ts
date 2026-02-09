// POST /api/conversations/v2/voice/narrate - TTS for opening line, closing line, or context brief

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { synthesizeSpeech } from '@/lib/voice/tts';
import { isVignetteV2 } from '@/lib/types/modules';
import type { VignetteV2 } from '@/lib/types/difficult-conversations';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { vignetteId, type } = body as { vignetteId?: string; type?: string };

    if (!vignetteId || !type) {
      return NextResponse.json(
        { error: 'vignetteId and type are required (type: opening_line | closing_line | context_brief)' },
        { status: 400 }
      );
    }

    const { data: vignetteRecord, error: vignetteError } = await supabase
      .from('vignettes')
      .select('*')
      .eq('id', vignetteId)
      .eq('is_active', true)
      .single();

    if (vignetteError || !vignetteRecord) {
      return NextResponse.json({ error: 'Vignette not found' }, { status: 404 });
    }

    if (!isVignetteV2(vignetteRecord)) {
      return NextResponse.json({ error: 'Vignette is not v2' }, { status: 400 });
    }

    const vignetteData = vignetteRecord.vignette_data as Partial<VignetteV2>;
    const voiceConfig = vignetteData?.voice_config;
    if (!voiceConfig?.enabled || !voiceConfig.voice_profile?.elevenlabs_voice_id) {
      return NextResponse.json({ error: 'Voice not enabled for this vignette' }, { status: 400 });
    }

    let text: string;
    if (type === 'opening_line') {
      text = voiceConfig.opening_line;
    } else if (type === 'closing_line') {
      text = voiceConfig.closing_line;
    } else if (type === 'context_brief') {
      text = voiceConfig.context_brief;
    } else {
      return NextResponse.json(
        { error: 'type must be opening_line, closing_line, or context_brief' },
        { status: 400 }
      );
    }

    if (!text?.trim()) {
      return NextResponse.json({ error: `No text for type: ${type}` }, { status: 400 });
    }

    const voiceId = voiceConfig.voice_profile.elevenlabs_voice_id;
    const stability = voiceConfig.voice_profile.default_stability ?? 0.55;
    const similarityBoost = voiceConfig.voice_profile.default_similarity_boost ?? 0.75;

    const buffer = await synthesizeSpeech(text, voiceId, { stability, similarityBoost });

    return NextResponse.json(
      { audio: buffer.toString('base64') },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('[VoiceNarrate] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate narration',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
