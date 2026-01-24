// Model Provider Factory
// Creates appropriate provider based on model type

import { ConversationProvider, ProviderConfig } from './ConversationProvider';
import { GeminiProvider } from './GeminiProvider';
import { ClaudeProvider } from './ClaudeProvider';
// AIModel type is re-exported from types

export function createProvider(config: ProviderConfig): ConversationProvider {
  const model = config.model;

  if (model === 'gemini-1.5-pro') {
    return new GeminiProvider(config);
  } else if (model.startsWith('claude-')) {
    return new ClaudeProvider(config);
  } else {
    throw new Error(`Unsupported model: ${model}`);
  }
}

export type { ConversationProvider, ProviderConfig } from './ConversationProvider';
export { GeminiProvider } from './GeminiProvider';
export { ClaudeProvider } from './ClaudeProvider';

