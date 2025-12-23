// Dynamic Prompt Builder: Constructs prompts for AI models with dynamic layers
// Integrates emotional state, conversation history, information boundaries, and difficulty

import {
  ConversationContext,
  Message,
  VignetteV2,
  Difficulty,
} from '../../types/difficult-conversations';
import { PhaseManager } from './PhaseManager';
import { EmotionalStateTracker } from './EmotionalStateTracker';

export interface PromptBuilderConfig {
  vignette: VignetteV2;
  difficulty: Difficulty;
  phaseManager: PhaseManager;
  emotionalStateTracker: EmotionalStateTracker;
}

export class PromptBuilder {
  private vignette: VignetteV2;
  private difficulty: Difficulty;
  private phaseManager: PhaseManager;
  private emotionalStateTracker: EmotionalStateTracker;
  private promptStrategy;

  constructor(config: PromptBuilderConfig) {
    this.vignette = config.vignette;
    this.difficulty = config.difficulty;
    this.phaseManager = config.phaseManager;
    this.emotionalStateTracker = config.emotionalStateTracker;
    this.promptStrategy = this.vignette.conversation.geminiPromptStrategy;
  }

  /**
   * Build complete prompt for AI model
   */
  buildPrompt(
    userMessage: string,
    conversationHistory: Message[]
  ): string {
    const context = this.buildConversationContext();
    const basePrompt = this.buildBasePrompt();
    const dynamicLayers = this.buildDynamicLayers(userMessage, conversationHistory);
    const systemInstructions = this.buildSystemInstructions(context);

    // Combine all components
    return [
      systemInstructions,
      basePrompt,
      ...dynamicLayers,
      this.buildConversationContext(context),
      this.buildResponseGuidelines(),
    ].join('\n\n');
  }

  /**
   * Build base prompt from vignette configuration
   */
  private buildBasePrompt(): string {
    const strategy = this.promptStrategy.basePrompt;
    const primaryAvatar = this.getPrimaryAvatar();

    return `${strategy.identity}

Personality: ${primaryAvatar.psychology.basePersonality}
Medical Knowledge: ${primaryAvatar.psychology.medicalKnowledge}

${strategy.personality}
Current State: ${strategy.currentState}`;
  }

  /**
   * Build dynamic layers (emotional state, history, boundaries, difficulty)
   */
  private buildDynamicLayers(
    userMessage: string,
    conversationHistory: Message[]
  ): string[] {
    const layers: string[] = [];

    // 1. Emotional State Layer
    layers.push(this.buildEmotionalStateLayer());

    // 2. Conversation History Layer
    layers.push(this.buildConversationHistoryLayer(conversationHistory));

    // 3. Information Boundary Layer
    layers.push(this.buildInformationBoundaryLayer());

    // 4. Difficulty Adjustment Layer
    layers.push(this.buildDifficultyAdjustmentLayer());

    return layers.filter(layer => layer.length > 0);
  }

  /**
   * Build emotional state layer
   */
  private buildEmotionalStateLayer(): string {
    const emotionalState = this.emotionalStateTracker.getEmotionalState();
    const threshold = emotionalState.currentThreshold;
    const value = emotionalState.value;

    const primaryAvatar = this.getPrimaryAvatar();
    const difficultyVariation = primaryAvatar.difficultyVariations[this.difficulty];
    const traits = difficultyVariation.traits;

    return `EMOTIONAL STATE LAYER:
Your current emotional state: ${threshold} (intensity: ${(value * 100).toFixed(0)}%)
Traits at this difficulty: ${traits}
Emotional range: ${difficultyVariation.emotionalRange.min} to ${difficultyVariation.emotionalRange.max}

Your response should reflect this emotional state authentically. ${
      value >= 0.7 
        ? 'You are highly emotional and may be less cooperative.' 
        : value >= 0.5
        ? 'You are upset but can be reasoned with.'
        : 'You are concerned but seeking understanding.'
    }`;
  }

  /**
   * Build conversation history layer
   */
  private buildConversationHistoryLayer(conversationHistory: Message[]): string {
    if (conversationHistory.length === 0) {
      return '';
    }

    // Get recent messages (last 10 for context)
    const recentMessages = conversationHistory.slice(-10);
    const historyText = recentMessages
      .map(msg => {
        const sender = msg.sender === 'user' ? 'Doctor' : 'You';
        return `${sender}: ${msg.text}`;
      })
      .join('\n');

    return `CONVERSATION HISTORY LAYER:
Recent conversation:
${historyText}

Remember what has been said and maintain consistency. Reference previous statements when relevant.`;
  }

  /**
   * Build information boundary layer
   */
  private buildInformationBoundaryLayer(): string {
    const currentPhase = this.phaseManager.getCurrentPhase();
    const geminiContext = currentPhase.geminiContext;

    // Determine what information has been revealed
    const revealedInformation = this.getRevealedInformation();

    return `INFORMATION BOUNDARY LAYER:
Current Phase: ${currentPhase.name}
Focus: ${geminiContext.focus}

${geminiContext.informationLimit || geminiContext.informationBoundary ? 
  `Information Limit: ${geminiContext.informationLimit || geminiContext.informationBoundary}` : 
  ''
}

You know: ${revealedInformation.join(', ')}

Do NOT reveal information that hasn't been discussed yet. Stay within the boundaries of what has been revealed.`;
  }

  /**
   * Build difficulty adjustment layer
   */
  private buildDifficultyAdjustmentLayer(): string {
    const primaryAvatar = this.getPrimaryAvatar();
    const difficultyVariation = primaryAvatar.difficultyVariations[this.difficulty];
    
    const emotionalState = this.emotionalStateTracker.getEmotionalState();
    const triggers = difficultyVariation.triggers;
    const responses = difficultyVariation.responses;

    return `DIFFICULTY ADJUSTMENT LAYER:
Difficulty Level: ${this.difficulty}
Your behavior: ${difficultyVariation.traits}

What triggers you: ${triggers.join(', ')}
How you respond:
- To empathy: ${responses.toEmpathy}
- To clarity: ${responses.toClarity}
- To defensiveness: ${responses.toDefensiveness}

Current emotional intensity: ${(emotionalState.value * 100).toFixed(0)}%

${this.difficulty === 'advanced' 
  ? 'You are less cooperative and may challenge the doctor more aggressively.'
  : this.difficulty === 'intermediate'
  ? 'You are demanding answers but can be reached with the right approach.'
  : 'You are seeking understanding and will respond well to empathy and clarity.'
}`;
  }

  /**
   * Build system instructions
   */
  private buildSystemInstructions(context?: any): string {
    const guidelines = this.promptStrategy.responseGuidelines;

    return `You are an AI avatar in a medical simulation. Your role is to portray ${this.getPrimaryAvatar().identity.name}, ${this.getPrimaryAvatar().identity.relationship || 'a family member'}.

CRITICAL INSTRUCTIONS:
1. Stay in character at all times
2. Match your emotional state to the current intensity
3. Use appropriate vocabulary: ${this.getPrimaryAvatar().communicationStyle.vocabulary}
4. Follow response guidelines:
   - Length: ${guidelines.length}
   - Emotional authenticity: ${guidelines.emotionalAuthenticity}
   - Questioning pattern: ${guidelines.questioningPattern}
   - Interruption behavior: ${guidelines.interruptionBehavior}
   - Silence usage: ${guidelines.silenceUsage}
5. Do NOT break character or acknowledge you are an AI
6. Respond as if this is a real conversation with real emotions`;
  }

  /**
   * Build conversation context summary
   */
  private buildConversationContext(context?: any): string {
    const currentPhase = this.phaseManager.getCurrentPhase();
    const clinicalData = this.vignette.clinicalData;

    return `CONVERSATION CONTEXT:
Setting: ${this.vignette.conversation.conversationMetadata.settingDescription}
Current Phase: ${currentPhase.name} - ${currentPhase.objective}
Patient: ${clinicalData.patient.demographics.identifier}, ${clinicalData.patient.demographics.age} year old ${clinicalData.patient.demographics.gender}
Clinical Situation: ${clinicalData.patient.presentation.chiefComplaint}

Your opening line in this phase: ${currentPhase.avatarState.openingLine || 'N/A'}`;
  }

  /**
   * Build response guidelines
   */
  private buildResponseGuidelines(): string {
    const guidelines = this.promptStrategy.responseGuidelines;
    const emotionalState = this.emotionalStateTracker.getEmotionalState();
    const intensity = this.emotionalStateTracker.getResponseIntensity();

    return `RESPONSE GUIDELINES:
- Keep responses to ${guidelines.length}
- Your emotional intensity is: ${intensity}
- Match your words to your emotional state (${emotionalState.currentThreshold})
- ${guidelines.questioningPattern}
- ${emotionalState.value >= 0.7 ? guidelines.interruptionBehavior : 'Allow the doctor to finish speaking'}
- ${guidelines.silenceUsage}

Remember: You are ${this.getPrimaryAvatar().identity.name}, a real person with real emotions in a difficult situation.`;
  }

  /**
   * Get primary avatar for current conversation
   */
  private getPrimaryAvatar() {
    // For MED-001, the primary avatar is the spouse
    const primaryAvatars = this.vignette.avatars.primaryAvatar;
    const avatarKey = Object.keys(primaryAvatars)[0]; // Get first (should be 'spouse')
    return primaryAvatars[avatarKey];
  }

  /**
   * Get revealed information based on current phase
   */
  private getRevealedInformation(): string[] {
    const currentPhase = this.phaseManager.getCurrentPhase();
    const phaseId = currentPhase.id;
    
    const revelationStages = this.vignette.conversation.conversationMechanics.informationRevelation.stages;
    
    // Determine which stages have been revealed based on phase
    const phaseRevelationMap: Record<string, string[]> = {
      'preparation': [],
      'opening': [],
      'disclosure': [revelationStages[0], revelationStages[1]], // Error occurred, Nature of error
      'emotional_processing': [revelationStages[0], revelationStages[1], revelationStages[2]], // + Immediate consequences
      'clinical_questions': [revelationStages[0], revelationStages[1], revelationStages[2], revelationStages[3]], // + Current status
      'next_steps': revelationStages.slice(0, 5), // All except prevention plan
    };

    return phaseRevelationMap[phaseId] || [];
  }

  /**
   * Build prompt for specific phase (helper method)
   */
  buildPhasePrompt(phaseId: string, userMessage: string, history: Message[]): string {
    // Temporarily switch to phase
    const originalPhase = this.phaseManager.getCurrentPhase().id;
    this.phaseManager.resetToPhase(phaseId);
    
    const prompt = this.buildPrompt(userMessage, history);
    
    // Restore original phase
    this.phaseManager.resetToPhase(originalPhase);
    
    return prompt;
  }

  /**
   * Get prompt optimization hints (for token efficiency)
   */
  getOptimizationHints(): string[] {
    const hints: string[] = [];
    const history = this.emotionalStateTracker.getEmotionalHistory();

    // If emotional state is stable, we can compress history
    if (history.length > 10) {
      hints.push('Consider summarizing older conversation history');
    }

    // If in later phases, we can reference earlier phases more briefly
    const progression = this.phaseManager.getPhaseProgression();
    if (progression > 50) {
      hints.push('Early phases can be referenced briefly');
    }

    return hints;
  }
}


