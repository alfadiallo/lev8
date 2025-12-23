// Claude AI integration for conversations

import { Message } from '@/lib/types/modules';

export interface ConversationContext {
  vignetteContext: {
    context: string;
    facts: string[];
    escalationTriggers: string[];
  };
  avatarPersonality: {
    name: string;
    role: string;
    initialEmotion?: string;
  };
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface ConversationResponse {
  response: string;
  emotion?: string;
  shouldEscalate?: boolean;
}

export class ConversationAIService {
  /**
   * Get AI response for a conversation
   */
  static async getResponse(
    message: string,
    conversationHistory: Message[],
    context: ConversationContext
  ): Promise<ConversationResponse> {
    try {
      const response = await fetch('/api/conversations/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationHistory: conversationHistory.map(msg => ({
            sender: msg.sender,
            text: msg.text,
            avatarId: msg.avatarId,
          })),
          vignetteContext: context.vignetteContext,
          avatarPersonality: context.avatarPersonality,
          difficulty: context.difficulty,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();

      return {
        response: data.response,
        emotion: 'concerned', // Default emotion
        shouldEscalate: false,
      };
    } catch (error) {
      console.error('[ConversationAI] Error getting response:', error);
      throw error;
    }
  }

  /**
   * Stream AI response (for real-time updates)
   */
  static async streamResponse(
    message: string,
    conversationHistory: Message[],
    context: ConversationContext,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    // TODO: Implement streaming when needed
    // For now, use regular request
    const response = await this.getResponse(message, conversationHistory, context);
    onChunk(response.response);
  }
}


