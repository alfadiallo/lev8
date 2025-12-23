// Claude Provider: Anthropic Claude integration
// Implements ConversationProvider interface for Claude models

import Anthropic from '@anthropic-ai/sdk';
import {
  ConversationProvider,
  ProviderConfig,
} from './ConversationProvider';
import {
  ConversationResponse,
  ConversationContext,
  Message,
  AIModel,
  Difficulty,
} from '../../../types/difficult-conversations';

export class ClaudeProvider implements ConversationProvider {
  private anthropic: Anthropic;
  private model: AIModel;
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }

    this.anthropic = new Anthropic({ apiKey });
    this.config = config;
    this.model = config.model;
  }

  async getResponse(
    userMessage: string,
    context: ConversationContext,
    history: Message[]
  ): Promise<ConversationResponse> {
    try {
      // Build system prompt
      const systemPrompt = this.buildSystemPrompt(context);

      // Format messages for Claude API
      const messages = this.formatMessages(history, userMessage);

      // Select model based on difficulty or config
      const modelName = this.getClaudeModelName(context.sessionState.difficulty);

      // Call Claude API
      const response = await this.anthropic.messages.create({
        model: modelName,
        max_tokens: this.config.maxTokens || 500,
        system: systemPrompt,
        messages,
        temperature: this.config.temperature || 0.7,
      });

      // Extract response text
      const responseText = response.content
        .filter((block: any) => block.type === 'text')
        .map((block: any) => block.text)
        .join('');

      // Analyze emotional impact
      const emotionDelta = this.analyzeEmotionalImpact(responseText, context);

      return {
        response: responseText,
        emotion: context.sessionState.emotionalState.currentThreshold,
        emotionDelta,
        shouldEscalate: emotionDelta > 0.2,
      };
    } catch (error: any) {
      console.error('[ClaudeProvider] Error:', error);
      throw new Error(`Claude API error: ${error.message || 'Unknown error'}`);
    }
  }

  async streamResponse?(
    userMessage: string,
    context: ConversationContext,
    history: Message[],
    onChunk: (chunk: string) => void
  ): Promise<void> {
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const messages = this.formatMessages(history, userMessage);
      const modelName = this.getClaudeModelName(context.sessionState.difficulty);

      const stream = await this.anthropic.messages.stream({
        model: modelName,
        max_tokens: this.config.maxTokens || 500,
        system: systemPrompt,
        messages,
        temperature: this.config.temperature || 0.7,
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          onChunk(chunk.delta.text);
        }
      }
    } catch (error: any) {
      console.error('[ClaudeProvider] Streaming error:', error);
      throw new Error(`Claude streaming error: ${error.message || 'Unknown error'}`);
    }
  }

  getModelName(): AIModel {
    return this.model;
  }

  supportsStreaming(): boolean {
    return true;
  }

  /**
   * Build system prompt from conversation context
   */
  private buildSystemPrompt(context: ConversationContext): string {
    const primaryAvatar = context.primaryAvatar;
    const currentPhase = context.currentPhase;
    const emotionalState = context.sessionState.emotionalState;
    const vignette = context.vignette;

    return `You are ${primaryAvatar.identity.name}, ${primaryAvatar.identity.relationship || 'a family member'}.

CURRENT SITUATION:
${vignette.clinicalData.patient.presentation.chiefComplaint}

YOUR CHARACTER:
- Personality: ${primaryAvatar.psychology.basePersonality}
- Medical Knowledge: ${primaryAvatar.psychology.medicalKnowledge}
- Current Emotional State: ${emotionalState.currentThreshold} (intensity: ${(emotionalState.value * 100).toFixed(0)}%)
- Communication Style: ${primaryAvatar.communicationStyle.vocabulary}

CURRENT PHASE: ${currentPhase.name}
- Objective: ${currentPhase.objective}
- Your emotional state: ${currentPhase.avatarState.emotional}
${currentPhase.avatarState.openingLine ? `- Your opening line: "${currentPhase.avatarState.openingLine}"` : ''}

RESPONSE GUIDELINES:
- Keep responses to 2-3 sentences (up to 5 when very emotional)
- Match your words to your emotional state authentically
- Use appropriate vocabulary: ${primaryAvatar.communicationStyle.vocabulary}
- Stay in character - never break character or acknowledge you are an AI
- Respond naturally as a real person with real emotions

DIFFICULTY LEVEL: ${context.sessionState.difficulty}
- Your behavior: ${primaryAvatar.difficultyVariation.traits}
- Emotional range: ${primaryAvatar.difficultyVariation.emotionalRange.min} to ${primaryAvatar.difficultyVariation.emotionalRange.max}
- How you respond to empathy: ${primaryAvatar.difficultyVariation.responses.toEmpathy}
- How you respond to clarity: ${primaryAvatar.difficultyVariation.responses.toClarity}
- How you respond to defensiveness: ${primaryAvatar.difficultyVariation.responses.toDefensiveness}

CRITICAL: Stay in character. You are ${primaryAvatar.identity.name}, a real person experiencing a difficult situation.`;
  }

  /**
   * Format messages for Claude API
   */
  private formatMessages(
    history: Message[],
    currentMessage: string
  ): Array<{ role: 'user' | 'assistant'; content: string }> {
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    // Add conversation history (last 10 messages)
    const recentHistory = history.slice(-10);
    for (const msg of recentHistory) {
      if (msg.sender === 'user') {
        messages.push({ role: 'user', content: msg.text });
      } else {
        messages.push({ role: 'assistant', content: msg.text });
      }
    }

    // Add current user message
    messages.push({ role: 'user', content: currentMessage });

    return messages;
  }

  /**
   * Get Claude model name based on difficulty
   */
  private getClaudeModelName(difficulty: Difficulty): string {
    // Override with config model if it's a Claude model
    if (this.model.startsWith('claude-')) {
      return this.model;
    }

    // Default: use Sonnet for advanced, Haiku for others
    return difficulty === 'advanced'
      ? 'claude-3-5-sonnet-20241022'
      : 'claude-3-5-haiku-20241022';
  }

  /**
   * Analyze emotional impact of response
   */
  private analyzeEmotionalImpact(
    responseText: string,
    context: ConversationContext
  ): number {
    const text = responseText.toLowerCase();
    let delta = 0;

    // Negative indicators
    if (text.includes('angry') || text.includes('furious') || text.includes('lawyer')) {
      delta += 0.3;
    } else if (text.includes('upset') || text.includes('frustrated')) {
      delta += 0.15;
    }

    // Positive indicators
    if (text.includes('understand') || text.includes('thank you') || text.includes('appreciate')) {
      delta -= 0.1;
    }

    // Check for defensive triggers
    const triggers = context.primaryAvatar.difficultyVariation.triggers;
    if (triggers.some(trigger => text.includes(trigger.toLowerCase()))) {
      delta += 0.2;
    }

    return Math.max(-0.3, Math.min(0.3, delta));
  }
}


