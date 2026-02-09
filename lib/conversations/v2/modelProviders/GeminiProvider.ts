// Gemini Provider: Google Gemini 1.5 Pro integration
// Implements ConversationProvider interface for Gemini models

import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  ConversationProvider,
  ProviderConfig,
} from './ConversationProvider';
import {
  ConversationResponse,
  ConversationContext,
  Message,
  AIModel,
} from '../../../types/difficult-conversations';

export class GeminiProvider implements ConversationProvider {
  private genAI: GoogleGenerativeAI;
  private model: AIModel;
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    const apiKey = config.apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_GENERATIVE_AI_API_KEY environment variable is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.config = config;
    this.model = config.model;
  }

  async getResponse(
    userMessage: string,
    context: ConversationContext,
    history: Message[]
  ): Promise<ConversationResponse> {
    try {
      // Get the model instance
      const modelName = this.getGeminiModelName(this.model);
      const model = this.genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          maxOutputTokens: this.config.maxTokens || 500,
          temperature: this.config.temperature || 0.7,
        },
      });

      // Build prompt from context (using PromptBuilder's output format)
      const prompt = this.buildPrompt(userMessage, context, history);

      // Generate response
      const result = await model.generateContent(prompt);
      const response = result.response;
      const responseText = response.text();

      // Parse response for emotional impact and other metadata
      const emotionDelta = this.analyzeEmotionalImpact(responseText, context);

      return {
        response: responseText,
        emotion: context.sessionState.emotionalState.currentThreshold,
        emotionDelta,
        shouldEscalate: emotionDelta > 0.2,
      };
    } catch (error) {
      console.error('[GeminiProvider] Error:', error);
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async streamResponse?(
    userMessage: string,
    context: ConversationContext,
    history: Message[],
    onChunk: (chunk: string) => void
  ): Promise<void> {
    try {
      const modelName = this.getGeminiModelName(this.model);
      const model = this.genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          maxOutputTokens: this.config.maxTokens || 500,
          temperature: this.config.temperature || 0.7,
        },
      });

      const prompt = this.buildPrompt(userMessage, context, history);
      const result = await model.generateContentStream(prompt);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        onChunk(chunkText);
      }
    } catch (error) {
      console.error('[GeminiProvider] Streaming error:', error);
      throw new Error(`Gemini streaming error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getModelName(): AIModel {
    return this.model;
  }

  supportsStreaming(): boolean {
    return true;
  }

  /**
   * Build prompt from conversation context
   */
  private buildPrompt(
    userMessage: string,
    context: ConversationContext,
    history: Message[]
  ): string {
    // Format conversation history
    const historyText = history
      .slice(-10) // Last 10 messages
      .map(msg => {
        const sender = msg.sender === 'user' ? 'Doctor' : 'You';
        return `${sender}: ${msg.text}`;
      })
      .join('\n');

    // Build system instructions
    const primaryAvatar = context.primaryAvatar;
    const currentPhase = context.currentPhase;
    const emotionalState = context.sessionState.emotionalState;

    return `You are ${primaryAvatar.identity.name}, ${primaryAvatar.identity.relationship || 'a family member'}.

CURRENT SITUATION:
${context.vignette.clinicalData.patient.presentation.chiefComplaint}

YOUR CHARACTER:
- Personality: ${primaryAvatar.psychology.basePersonality}
- Medical Knowledge: ${primaryAvatar.psychology.medicalKnowledge}
- Current Emotional State: ${emotionalState.currentThreshold} (intensity: ${(emotionalState.value * 100).toFixed(0)}%)
- Communication Style: ${primaryAvatar.communicationStyle.vocabulary}

CURRENT PHASE: ${currentPhase.name}
- Objective: ${currentPhase.objective}
- Your emotional state in this phase: ${currentPhase.avatarState.emotional}

RESPONSE GUIDELINES:
- Keep responses to 2-3 sentences (up to 5 when very emotional)
- Match your words to your emotional state authentically
- Use appropriate vocabulary for your character
- Stay in character - never break character
- Respond naturally as a real person would

CONVERSATION HISTORY:
${historyText || 'No previous conversation.'}

CURRENT MESSAGE:
Doctor: ${userMessage}

Your response (as ${primaryAvatar.identity.name}):`;
  }

  /**
   * Get Gemini model name from AIModel enum
   */
  private getGeminiModelName(model: AIModel): string {
    const modelMap: Record<AIModel, string> = {
      'gemini-1.5-pro': 'gemini-2.0-flash',
      'claude-3-5-sonnet-20241022': 'gemini-2.0-flash', // Fallback
      'claude-3-5-haiku-20241022': 'gemini-2.0-flash', // Fallback
    };

    return modelMap[model] || 'gemini-2.0-flash';
  }

  /**
   * Analyze emotional impact of response
   */
  private analyzeEmotionalImpact(
    responseText: string,
    context: ConversationContext
  ): number {
    // Simple heuristic: check for emotional indicators
    const text = responseText.toLowerCase();
    let delta = 0;

    // Negative indicators
    if (text.includes('angry') || text.includes('furious') || text.includes('lawyer')) {
      delta += 0.3;
    } else if (text.includes('upset') || text.includes('frustrated') || text.includes('disappointed')) {
      delta += 0.15;
    }

    // Positive indicators
    if (text.includes('understand') || text.includes('thank') || text.includes('appreciate')) {
      delta -= 0.1;
    }

    // Check for defensive triggers from avatar
    const triggers = context.primaryAvatar.difficultyVariation.triggers;
    if (triggers.some(trigger => text.includes(trigger.toLowerCase()))) {
      delta += 0.2;
    }

    return Math.max(-0.3, Math.min(0.3, delta));
  }
}


