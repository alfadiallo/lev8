// Conversation Provider Interface
// Unified interface for AI model providers (Gemini, Claude, etc.)

import {
  ConversationResponse,
  ConversationContext,
  Message,
  AIModel,
} from '../../../types/difficult-conversations';

export interface ConversationProvider {
  /**
   * Get a response from the AI model
   * @param userMessage The user's message
   * @param context The conversation context
   * @param history Previous conversation messages
   * @returns Promise resolving to the conversation response
   */
  getResponse(
    userMessage: string,
    context: ConversationContext,
    history: Message[]
  ): Promise<ConversationResponse>;

  /**
   * Stream a response from the AI model (optional)
   * @param userMessage The user's message
   * @param context The conversation context
   * @param history Previous conversation messages
   * @param onChunk Callback for each chunk of the response
   * @returns Promise that resolves when streaming is complete
   */
  streamResponse?(
    userMessage: string,
    context: ConversationContext,
    history: Message[],
    onChunk: (chunk: string) => void
  ): Promise<void>;

  /**
   * Get the model name/identifier
   */
  getModelName(): AIModel;

  /**
   * Check if streaming is supported
   */
  supportsStreaming(): boolean;
}

export interface ProviderConfig {
  model: AIModel;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
  apiKey?: string;
}


