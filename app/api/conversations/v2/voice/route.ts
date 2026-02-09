// API Route: v2 Voice Conversation Turn
// POST /api/conversations/v2/voice - STT -> ConversationEngine -> TTS

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ConversationEngine, ConversationEngineConfig } from '@/lib/conversations/v2/ConversationEngine';
import { createProvider } from '@/lib/conversations/v2/modelProviders/index';
import { isVignetteV2 } from '@/lib/types/modules';
import { VignetteV2 } from '@/lib/types/difficult-conversations';
import type { AIModel, Difficulty } from '@/lib/types/difficult-conversations';
import { transcribeAudio } from '@/lib/voice/stt';
import { synthesizeSpeech } from '@/lib/voice/tts';

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

    const formData = await request.formData();
    const audioFile = formData.get('audio') as Blob | null;
    const vignetteId = formData.get('vignetteId') as string | null;
    const difficulty = formData.get('difficulty') as Difficulty | null;
    const sessionStateRaw = formData.get('sessionState') as string | null;
    const sessionState = sessionStateRaw ? (JSON.parse(sessionStateRaw) as Record<string, unknown>) : null;

    if (!audioFile || !vignetteId || !difficulty) {
      return NextResponse.json(
        { error: 'audio, vignetteId, and difficulty are required' },
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
      return NextResponse.json(
        { error: 'This vignette is not a v2 vignette.' },
        { status: 400 }
      );
    }

    const vignetteData = vignetteRecord.vignette_data as Partial<VignetteV2>;
    const voiceConfig = vignetteData?.voice_config;
    if (!voiceConfig?.enabled || !voiceConfig.voice_profile?.elevenlabs_voice_id) {
      return NextResponse.json(
        { error: 'Voice is not enabled for this vignette' },
        { status: 400 }
      );
    }

    const vignetteV2 = {
      ...vignetteData,
      id: vignetteRecord.id,
      title: vignetteRecord.title,
      description: vignetteRecord.description || '',
      category: vignetteRecord.category,
      subcategory: vignetteRecord.subcategory ?? undefined,
      difficulty: vignetteRecord.difficulty,
      estimatedDuration: vignetteRecord.estimated_duration_minutes ?? 15,
    } as VignetteV2;

    if (!vignetteV2.difficulty.includes(difficulty)) {
      return NextResponse.json(
        { error: `Difficulty ${difficulty} is not available for this vignette` },
        { status: 400 }
      );
    }

    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    const mimeType = audioFile.type || 'audio/webm';

    const sttResult = await transcribeAudio(audioBuffer, mimeType);
    const transcript = sttResult.transcript.trim();
    if (!transcript) {
      return NextResponse.json(
        {
          error: 'empty_transcript',
          details: 'Could not detect speech. Please try again.',
        },
        { status: 422 }
      );
    }

    const provider = createProvider({
      model: vignetteV2.aiModel as AIModel,
      maxTokens: vignetteV2.maxResponseLength ?? 500,
      temperature: 0.7,
    });

    const currentPhase = sessionState?.currentPhase as {
      currentPhaseId?: string;
      objectivesCompleted?: string[];
      messageCount?: number;
    } | undefined;

    // Build prior phase state for restoration
    const priorPhaseState = currentPhase
      ? {
          objectivesCompleted: currentPhase.objectivesCompleted ?? [],
          messageCount: currentPhase.messageCount ?? 0,
          branchHistory: (sessionState?.branchPath as { phaseId: string; branchTrigger: string; timestamp: Date }[]) ?? [],
        }
      : undefined;

    const engineConfig: ConversationEngineConfig = {
      vignette: vignetteV2,
      difficulty,
      userId: user.id,
      modelProvider: provider,
      initialPhaseId: currentPhase?.currentPhaseId,
      priorPhaseState,
    };
    const engine = new ConversationEngine(engineConfig);

    // Restore conversation history (for assessment scoring and prompt context)
    if (sessionState?.messages && Array.isArray(sessionState.messages)) {
      engine.updateConversationHistory(sessionState.messages as Parameters<typeof engine.updateConversationHistory>[0]);
    }

    const response = await engine.processUserMessage(transcript);
    const updatedSessionState = engine.getSessionState();
    const assistantText = response.response ?? (response as { text?: string }).text ?? '';

    const voiceId = voiceConfig.voice_profile.elevenlabs_voice_id;
    const stability = voiceConfig.voice_profile.default_stability ?? 0.55;
    const similarityBoost = voiceConfig.voice_profile.default_similarity_boost ?? 0.75;

    const ttsBuffer = await synthesizeSpeech(assistantText, voiceId, {
      stability,
      similarityBoost,
    });

    return NextResponse.json(
      {
        assistantAudio: ttsBuffer.toString('base64'),
        assistantTranscript: assistantText,
        residentTranscript: transcript,
        sessionState: updatedSessionState,
        currentPhase: updatedSessionState.currentPhase?.currentPhaseId,
        emotionalState: updatedSessionState.emotionalState?.value,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('[ConversationV2Voice] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process voice conversation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
