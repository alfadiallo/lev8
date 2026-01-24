// API Route: v2 Conversation Chat
// POST /api/conversations/v2/chat - Handle v2 conversation with phase-based engine

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ConversationEngine, ConversationEngineConfig } from '@/lib/conversations/v2/ConversationEngine';
import { createProvider } from '@/lib/conversations/v2/modelProviders/index';
import { isVignetteV2 } from '@/lib/types/modules';
import { VignetteV2 } from '@/lib/types/difficult-conversations';

export async function POST(request: NextRequest) {
  try {
    // Get auth token
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

    // Parse request body
    const body = await request.json();
    const {
      vignetteId,
      message,
      difficulty,
      sessionState, // Optional: existing session state
    } = body;

    if (!vignetteId || !message || !difficulty) {
      return NextResponse.json(
        { error: 'vignetteId, message, and difficulty are required' },
        { status: 400 }
      );
    }

    // Load vignette from database
    const { data: vignetteRecord, error: vignetteError } = await supabase
      .from('vignettes')
      .select('*')
      .eq('id', vignetteId)
      .eq('is_active', true)
      .single();

    if (vignetteError || !vignetteRecord) {
      return NextResponse.json(
        { error: 'Vignette not found' },
        { status: 404 }
      );
    }

    // Check if vignette is v2
    if (!isVignetteV2(vignetteRecord)) {
      return NextResponse.json(
        { error: 'This vignette is not a v2 vignette. Use /api/conversations/chat for v1 vignettes.' },
        { status: 400 }
      );
    }

    // Extract v2 structure from vignette_data
    const vignetteData = vignetteRecord.vignette_data as any;
    const vignetteV2: VignetteV2 = {
      ...vignetteData,
      // Ensure required fields from database are included
      id: vignetteRecord.id,
      title: vignetteRecord.title,
      description: vignetteRecord.description || '',
      category: vignetteRecord.category,
      subcategory: vignetteRecord.subcategory || undefined,
      difficulty: vignetteRecord.difficulty,
      estimatedDuration: vignetteRecord.estimated_duration_minutes || 15,
    };

    // Validate difficulty
    if (!vignetteV2.difficulty.includes(difficulty)) {
      return NextResponse.json(
        { error: `Difficulty ${difficulty} is not available for this vignette` },
        { status: 400 }
      );
    }

    // Create model provider based on vignette configuration
    const provider = createProvider({
      model: vignetteV2.aiModel,
      maxTokens: vignetteV2.maxResponseLength || 500,
      temperature: 0.7,
    } as any);

    // Create conversation engine configuration
    const engineConfig: ConversationEngineConfig = {
      vignette: vignetteV2,
      difficulty,
      userId: user.id,
      modelProvider: provider,
      initialPhaseId: sessionState?.currentPhase?.currentPhaseId,
    };

    // Create or restore conversation engine
    // For now, we'll create a new engine for each request
    // In production, we'd restore from session storage
    const engine = new ConversationEngine(engineConfig);

    // If session state provided, restore it (basic restoration)
    if (sessionState) {
      // Restore conversation history
      engine.updateConversationHistory(sessionState.messages || []);
      
      // Note: Full session restoration would require restoring phase manager state,
      // emotional state tracker history, etc. For MVP, we restore message history
      // and let the engine re-initialize phase/emotional state based on current state.
    }

    // Process user message
    const response = await engine.processUserMessage(message);

    // Get updated session state
    const updatedSessionState = engine.getSessionState();

    return NextResponse.json(
      {
        response: response.response || response.text, // Support both field names
        emotion: response.emotion,
        emotionDelta: response.emotionDelta,
        phaseTransition: response.phaseTransition,
        assessmentUpdate: response.assessmentUpdate,
        sessionState: updatedSessionState,
        currentPhase: updatedSessionState.currentPhase?.currentPhaseId,
        emotionalState: updatedSessionState.emotionalState?.value,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('[ConversationV2] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process conversation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

