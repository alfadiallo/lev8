// Conversation Engine: Orchestrates phase-based conversations with emotional tracking
// Integrates PhaseManager, EmotionalStateTracker, and PromptBuilder

import {
  ConversationSessionState,
  ConversationContext,
  ConversationResponse,
  Message,
  VignetteV2,
  Difficulty,
  AssessmentResult,
} from '../../types/difficult-conversations';
import { PhaseManager, PhaseManagerConfig } from './PhaseManager';
import { EmotionalStateTracker, EmotionalStateTrackerConfig } from './EmotionalStateTracker';
import { PromptBuilder, PromptBuilderConfig } from './PromptBuilder';
import { ConversationProvider } from './modelProviders/ConversationProvider';
import { AssessmentEngine, AssessmentEngineConfig } from './AssessmentEngine';

export interface ConversationEngineConfig {
  vignette: VignetteV2;
  difficulty: Difficulty;
  userId: string;
  modelProvider: ConversationProvider;
  initialPhaseId?: string;
}

export class ConversationEngine {
  private vignette: VignetteV2;
  private difficulty: Difficulty;
  private userId: string;
  private modelProvider: ConversationProvider;
  
  private phaseManager: PhaseManager;
  private emotionalStateTracker: EmotionalStateTracker;
  private promptBuilder: PromptBuilder;
  private assessmentEngine: AssessmentEngine;
  
  private sessionState: ConversationSessionState;
  private messages: Message[];

  constructor(config: ConversationEngineConfig) {
    this.vignette = config.vignette;
    this.difficulty = config.difficulty;
    this.userId = config.userId;
    this.modelProvider = config.modelProvider;

    // Initialize components
    const phaseManagerConfig: PhaseManagerConfig = {
      vignette: this.vignette,
      difficulty: this.difficulty,
      initialPhaseId: config.initialPhaseId,
    };
    this.phaseManager = new PhaseManager(phaseManagerConfig);

    const emotionalStateConfig: EmotionalStateTrackerConfig = {
      vignette: this.vignette,
      difficulty: this.difficulty,
    };
    this.emotionalStateTracker = new EmotionalStateTracker(emotionalStateConfig);

    const promptBuilderConfig: PromptBuilderConfig = {
      vignette: this.vignette,
      difficulty: this.difficulty,
      phaseManager: this.phaseManager,
      emotionalStateTracker: this.emotionalStateTracker,
    };
    this.promptBuilder = new PromptBuilder(promptBuilderConfig);

    // Initialize assessment engine
    const assessmentConfig: AssessmentEngineConfig = {
      assessmentHooks: this.vignette.conversation.assessmentHooks,
      weights: this.vignette.assessmentWeights,
      passingScore: this.vignette.passingScore,
      excellenceScore: this.vignette.excellenceScore,
    };
    this.assessmentEngine = new AssessmentEngine(assessmentConfig);

    // Initialize session state
    this.sessionState = {
      vignetteId: this.vignette.id,
      difficulty: this.difficulty,
      currentPhase: this.phaseManager.getPhaseState(),
      emotionalState: this.emotionalStateTracker.getEmotionalState(),
      branchPath: this.phaseManager.getBranchHistory(),
      messages: [],
      revealedInformation: [],
      assessmentScores: {
        empathy: 0,
        clarity: 0,
        accountability: 0,
        overall: 0,
      },
      startedAt: new Date(),
      lastUpdated: new Date(),
    };

    this.messages = [];
  }

  /**
   * Process user message and generate avatar response
   */
  async processUserMessage(userMessage: string): Promise<ConversationResponse> {
    // Add user message to history
    const userMsg: Message = {
      id: this.generateMessageId(),
      text: userMessage,
      sender: 'user',
      timestamp: new Date(),
      phaseId: this.phaseManager.getCurrentPhase().id,
    };
    this.messages.push(userMsg);
    this.sessionState.messages.push(userMsg);

    // Analyze message for emotional impact
    const modifiers = this.emotionalStateTracker.analyzeMessage(userMessage);
    
    // Assess message for patterns (empathy, clarity, accountability)
    const assessmentResult = this.assessmentEngine.assessMessage(userMsg);
    
    // Update revealed information
    this.updateRevealedInformation(userMessage);

    // Check for phase transition
    const phaseState = this.phaseManager.getPhaseState();
    const emotionalValue = this.emotionalStateTracker.getEmotionalValue();
    
    const transition = this.phaseManager.evaluateBranch(userMessage, emotionalValue, {
      phaseDuration: phaseState.timeInPhase,
      objectivesCompleted: phaseState.objectivesCompleted,
      messageCount: this.messages.length,
    });

    // Build conversation context
    const context = this.buildConversationContext();

    // Build prompt
    const prompt = this.promptBuilder.buildPrompt(userMessage, this.messages);

    // Get response from model provider
    const response = await this.modelProvider.getResponse(userMessage, context, this.messages);

    // Add avatar response to history
    const avatarMsg: Message = {
      id: this.generateMessageId(),
      text: response.response,
      sender: 'avatar',
      avatarId: this.getPrimaryAvatarId(),
      timestamp: new Date(),
      phaseId: this.phaseManager.getCurrentPhase().id,
      emotionalImpact: response.emotionDelta,
    };
    this.messages.push(avatarMsg);
    this.sessionState.messages.push(avatarMsg);

    // Update session state
    const currentScores = this.assessmentEngine.getCurrentScores();
    this.sessionState.currentPhase = this.phaseManager.getPhaseState();
    this.sessionState.emotionalState = this.emotionalStateTracker.getEmotionalState();
    this.sessionState.branchPath = this.phaseManager.getBranchHistory();
    this.sessionState.assessmentScores = currentScores;
    this.sessionState.lastUpdated = new Date();

    // Handle phase transition if occurred
    if (transition) {
      response.phaseTransition = {
        from: transition.fromPhaseId,
        to: transition.toPhaseId,
        reason: transition.reason,
      };
    }

    // Add assessment update to response
    response.assessmentUpdate = currentScores;

    // Update emotional state if response indicates change
    if (response.emotionDelta !== undefined) {
      // The emotional state tracker already handled modifiers from user message
      // But we can apply additional delta from the response
      if (response.emotionDelta !== 0) {
        this.emotionalStateTracker.applyModifier(
          response.emotionDelta > 0 ? 'defensive' : 'empathyShown',
          { userMessage }
        );
      }
    }

    return response;
  }

  /**
   * Get current conversation state
   */
  getSessionState(): ConversationSessionState {
    return {
      ...this.sessionState,
      currentPhase: this.phaseManager.getPhaseState(),
      emotionalState: this.emotionalStateTracker.getEmotionalState(),
      branchPath: this.phaseManager.getBranchHistory(),
      messages: [...this.messages],
    };
  }

  /**
   * Get conversation context for prompt building
   */
  private buildConversationContext(): ConversationContext {
    const primaryAvatar = this.getPrimaryAvatar();
    const currentPhase = this.phaseManager.getCurrentPhase();

    return {
      vignette: this.vignette,
      sessionState: this.getSessionState(),
      currentPhase: currentPhase,
      primaryAvatar: {
        identity: primaryAvatar.identity,
        psychology: primaryAvatar.psychology,
        communicationStyle: primaryAvatar.communicationStyle,
        difficultyVariation: primaryAvatar.difficultyVariations[this.difficulty],
      },
    };
  }

  /**
   * Get primary avatar
   */
  private getPrimaryAvatar() {
    const primaryAvatars = this.vignette.avatars.primaryAvatar;
    const avatarKey = Object.keys(primaryAvatars)[0];
    return primaryAvatars[avatarKey];
  }

  /**
   * Get primary avatar ID
   */
  private getPrimaryAvatarId(): string {
    const primaryAvatars = this.vignette.avatars.primaryAvatar;
    const avatarKey = Object.keys(primaryAvatars)[0];
    return avatarKey; // e.g., 'spouse'
  }

  /**
   * Update revealed information based on user message
   */
  private updateRevealedInformation(userMessage: string): void {
    const message = userMessage.toLowerCase();
    const revelationStages = this.vignette.conversation.conversationMechanics.informationRevelation.stages;

    // Simple keyword-based information revelation detection
    revelationStages.forEach(stage => {
      const keywords = stage.toLowerCase().split(' ');
      if (keywords.some(keyword => message.includes(keyword))) {
        if (!this.sessionState.revealedInformation.includes(stage)) {
          this.sessionState.revealedInformation.push(stage);
        }
      }
    });
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current phase
   */
  getCurrentPhase() {
    return this.phaseManager.getCurrentPhase();
  }

  /**
   * Get emotional state
   */
  getEmotionalState() {
    return this.emotionalStateTracker.getEmotionalState();
  }

  /**
   * Get messages
   */
  getMessages(): Message[] {
    return [...this.messages];
  }

  /**
   * Get assessment results
   */
  getAssessmentResults(): AssessmentResult {
    return this.assessmentEngine.assessConversation(this.messages);
  }

  /**
   * Get assessment engine (for external access if needed)
   */
  getAssessmentEngine(): AssessmentEngine {
    return this.assessmentEngine;
  }

  /**
   * Check if conversation is complete
   */
  isComplete(): boolean {
    return this.phaseManager.isFinalPhase() && 
           this.phaseManager.getPhaseState().objectivesCompleted.length >=
           (this.getCurrentPhase().learnerTasks?.length || 0);
  }

  /**
   * Get conversation progress (0-1)
   */
  getProgress(): number {
    const phaseProgression = this.phaseManager.getPhaseProgression() / 100;
    const objectivesProgress = this.getObjectivesProgress();
    
    // Weighted average (phases 70%, objectives 30%)
    return phaseProgression * 0.7 + objectivesProgress * 0.3;
  }

  /**
   * Get objectives progress (0-1)
   */
  private getObjectivesProgress(): number {
    const currentPhase = this.phaseManager.getCurrentPhase();
    const objectives = currentPhase.learnerTasks || [];
    const phaseState = this.phaseManager.getPhaseState();
    
    if (objectives.length === 0) return 1;
    return phaseState.objectivesCompleted.length / objectives.length;
  }

  /**
   * Update conversation history (for session restoration)
   */
  updateConversationHistory(messages: Message[]): void {
    this.messages = [...messages];
    this.sessionState.messages = [...messages];
    
    // Update assessment engine with conversation history
    this.assessmentEngine.updateConversationHistory(messages);
    
    // Re-assess conversation to update scores
    if (messages.length > 0) {
      const assessmentResult = this.assessmentEngine.assessConversation(messages);
      this.sessionState.assessmentScores = {
        empathy: assessmentResult.empathy.score,
        clarity: assessmentResult.clarity.score,
        accountability: assessmentResult.accountability.score,
        overall: assessmentResult.overall,
      };
    }
  }

  /**
   * Reset conversation (for testing)
   */
  reset(): void {
    this.phaseManager.resetToPhase(this.phaseManager.getCurrentPhase().id);
    this.emotionalStateTracker.resetEmotionalState();
    this.assessmentEngine.reset();
    this.messages = [];
    this.sessionState.messages = [];
    this.sessionState.revealedInformation = [];
    this.sessionState.assessmentScores = {
      empathy: 0,
      clarity: 0,
      accountability: 0,
      overall: 0,
    };
    this.sessionState.startedAt = new Date();
    this.sessionState.lastUpdated = new Date();
  }
}

