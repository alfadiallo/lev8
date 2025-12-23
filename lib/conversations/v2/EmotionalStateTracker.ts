// Emotional State Tracker: Tracks avatar emotional state throughout conversation
// Manages continuous 0-1 scale with event-based modifiers

import {
  EmotionalState,
  ConversationPhase,
  VignetteV2,
  Difficulty,
} from '../../types/difficult-conversations';

export interface EmotionalModifier {
  type: string;
  value: number;
  reason: string;
  timestamp: Date;
}

export interface EmotionalStateTrackerConfig {
  vignette: VignetteV2;
  difficulty: Difficulty;
  initialEmotionalState?: number;
}

export class EmotionalStateTracker {
  private vignette: VignetteV2;
  private difficulty: Difficulty;
  private emotionalState: EmotionalState;
  private modifiers: EmotionalModifier[];
  private emotionalTrackingConfig;

  constructor(config: EmotionalStateTrackerConfig) {
    this.vignette = config.vignette;
    this.difficulty = config.difficulty;
    this.emotionalTrackingConfig = this.vignette.conversation.conversationMechanics.emotionalTracking;
    
    // Initialize emotional state
    const initialValue = config.initialEmotionalState ?? this.getInitialEmotionalState();
    this.emotionalState = {
      value: this.clampEmotionalState(initialValue),
      history: [
        {
          timestamp: new Date(),
          value: initialValue,
          reason: 'Initial state',
        },
      ],
      currentThreshold: this.getThresholdForValue(initialValue),
    };

    this.modifiers = [];
  }

  /**
   * Get initial emotional state based on difficulty and phase
   */
  private getInitialEmotionalState(): number {
    // Base emotional state varies by difficulty
    const baseStates: Record<Difficulty, number> = {
      beginner: 0.3, // Concerned
      intermediate: 0.5, // Upset
      advanced: 0.7, // Angry
    };

    return baseStates[this.difficulty] || 0.5;
  }

  /**
   * Get current emotional state
   */
  getEmotionalState(): EmotionalState {
    return {
      ...this.emotionalState,
      history: [...this.emotionalState.history],
    };
  }

  /**
   * Get current emotional value (0-1)
   */
  getEmotionalValue(): number {
    return this.emotionalState.value;
  }

  /**
   * Get current threshold label
   */
  getCurrentThreshold(): 'concerned' | 'upset' | 'angry' | 'hostile' {
    return this.emotionalState.currentThreshold;
  }

  /**
   * Apply a modifier to emotional state
   */
  applyModifier(
    modifierType: string,
    context?: {
      userMessage?: string;
      phaseId?: string;
      timeInPhase?: number;
    }
  ): EmotionalModifier {
    // Get modifier value from config
    const modifierValue = this.emotionalTrackingConfig.modifiers[modifierType] || 0;
    
    // Calculate actual modifier (can be adjusted based on context)
    let actualModifier = modifierValue;

    // Adjust modifier based on difficulty (advanced difficulty is less responsive)
    if (this.difficulty === 'advanced' && modifierValue < 0) {
      actualModifier = modifierValue * 0.7; // Less responsive to positive modifiers
    } else if (this.difficulty === 'beginner' && modifierValue > 0) {
      actualModifier = modifierValue * 0.8; // Less responsive to negative modifiers
    }

    // Apply modifier
    const oldValue = this.emotionalState.value;
    const newValue = this.clampEmotionalState(oldValue + actualModifier);

    // Create modifier record
    const modifier: EmotionalModifier = {
      type: modifierType,
      value: actualModifier,
      reason: this.getModifierReason(modifierType, context),
      timestamp: new Date(),
    };

    // Update emotional state
    this.emotionalState.value = newValue;
    this.emotionalState.currentThreshold = this.getThresholdForValue(newValue);
    this.emotionalState.history.push({
      timestamp: new Date(),
      value: newValue,
      modifier: modifierType,
      reason: modifier.reason,
    });

    this.modifiers.push(modifier);

    return modifier;
  }

  /**
   * Get reason for modifier
   */
  private getModifierReason(
    modifierType: string,
    context?: Record<string, any>
  ): string {
    const reasons: Record<string, string> = {
      empathyShown: 'Learner showed empathy',
      medicalJargon: 'Learner used medical jargon',
      defensiveness: 'Learner was defensive',
      honestApology: 'Learner gave honest apology',
      clearExplanation: 'Learner gave clear explanation',
    };

    return reasons[modifierType] || `Modifier: ${modifierType}`;
  }

  /**
   * Analyze user message and apply automatic modifiers
   */
  analyzeMessage(userMessage: string): EmotionalModifier[] {
    const appliedModifiers: EmotionalModifier[] = [];
    const message = userMessage.toLowerCase();

    // Check for empathy
    if (this.detectsEmpathy(message)) {
      const modifier = this.applyModifier('empathyShown', { userMessage });
      appliedModifiers.push(modifier);
    }

    // Check for medical jargon
    if (this.detectsMedicalJargon(message)) {
      const modifier = this.applyModifier('medicalJargon', { userMessage });
      appliedModifiers.push(modifier);
    }

    // Check for defensiveness
    if (this.detectsDefensiveness(message)) {
      const modifier = this.applyModifier('defensiveness', { userMessage });
      appliedModifiers.push(modifier);
    }

    // Check for honest apology
    if (this.detectsHonestApology(message)) {
      const modifier = this.applyModifier('honestApology', { userMessage });
      appliedModifiers.push(modifier);
    }

    // Check for clear explanation
    if (this.detectsClearExplanation(message)) {
      const modifier = this.applyModifier('clearExplanation', { userMessage });
      appliedModifiers.push(modifier);
    }

    return appliedModifiers;
  }

  /**
   * Detect empathy in message
   */
  private detectsEmpathy(message: string): boolean {
    const empathyPatterns = [
      'i understand', 'i can imagine', 'that must be', 'i\'m sorry',
      'i apologize', 'i recognize', 'i acknowledge', 'that sounds',
      'i hear you', 'i see that', 'that\'s difficult', 'must be hard'
    ];
    return empathyPatterns.some(pattern => message.includes(pattern));
  }

  /**
   * Detect medical jargon in message
   */
  private detectsMedicalJargon(message: string): boolean {
    const jargonTerms = [
      'iatrogenic', 'ventricular', 'tachycardia', 'defibrillation',
      'cardiac arrest', 'biphasic', 'amiodarone', 'norepinephrine',
      'adenosine', 'systolic', 'diastolic', 'hemodynamic', 'qrs',
      'ekg', 'ecg', 'rosc', 'cpr', 'acls'
    ];
    return jargonTerms.some(term => message.includes(term.toLowerCase()));
  }

  /**
   * Detect defensiveness in message
   */
  private detectsDefensiveness(message: string): boolean {
    const defensivePatterns = [
      "it's not my fault", 'not my responsibility', "following protocol",
      'standard procedure', "wasn't my decision", 'everyone makes mistakes',
      "these things happen", "can't be prevented", 'part of the job',
      'you have to understand', "that's just how it is"
    ];
    return defensivePatterns.some(pattern => message.includes(pattern));
  }

  /**
   * Detect honest apology in message
   */
  private detectsHonestApology(message: string): boolean {
    const apologyPatterns = [
      'i made a mistake', 'i made an error', 'i take responsibility',
      'i was wrong', 'this is my fault', 'i apologize for',
      'i\'m sorry for what happened', 'i accept responsibility'
    ];
    return apologyPatterns.some(pattern => message.includes(pattern));
  }

  /**
   * Detect clear explanation in message
   */
  private detectsClearExplanation(message: string): boolean {
    // Simple heuristic: clear explanations are longer, structured, avoid jargon
    const hasStructure = message.includes('first') || message.includes('then') || 
                         message.includes('next') || message.includes('finally');
    const isReasonableLength = message.length > 50 && message.length < 300;
    const avoidsJargon = !this.detectsMedicalJargon(message);
    
    return hasStructure && isReasonableLength && avoidsJargon;
  }

  /**
   * Clamp emotional value to 0-1 range
   */
  private clampEmotionalState(value: number): number {
    return Math.max(0, Math.min(1, value));
  }

  /**
   * Get threshold label for emotional value
   */
  private getThresholdForValue(value: number): 'concerned' | 'upset' | 'angry' | 'hostile' {
    const thresholds = this.emotionalTrackingConfig.scale.thresholds;
    
    if (value >= thresholds.hostile) return 'hostile';
    if (value >= thresholds.angry) return 'angry';
    if (value >= thresholds.upset) return 'upset';
    return 'concerned';
  }

  /**
   * Get emotional trajectory (trend over time)
   */
  getEmotionalTrajectory(windowSize: number = 5): 'improving' | 'stable' | 'worsening' {
    const history = this.emotionalState.history;
    if (history.length < windowSize) {
      return 'stable';
    }

    const recent = history.slice(-windowSize);
    const firstValue = recent[0].value;
    const lastValue = recent[recent.length - 1].value;
    const difference = lastValue - firstValue;

    if (difference < -0.1) return 'improving';
    if (difference > 0.1) return 'worsening';
    return 'stable';
  }

  /**
   * Get modifier history
   */
  getModifierHistory(): EmotionalModifier[] {
    return [...this.modifiers];
  }

  /**
   * Get emotional state history
   */
  getEmotionalHistory(): EmotionalState['history'] {
    return [...this.emotionalState.history];
  }

  /**
   * Reset emotional state (for testing)
   */
  resetEmotionalState(value?: number): void {
    const resetValue = value ?? this.getInitialEmotionalState();
    this.emotionalState = {
      value: this.clampEmotionalState(resetValue),
      history: [
        {
          timestamp: new Date(),
          value: resetValue,
          reason: 'State reset',
        },
      ],
      currentThreshold: this.getThresholdForValue(resetValue),
    };
    this.modifiers = [];
  }

  /**
   * Check if emotional state has crossed a threshold
   */
  hasCrossedThreshold(threshold: 'concerned' | 'upset' | 'angry' | 'hostile'): boolean {
    const current = this.emotionalState.currentThreshold;
    const thresholdValues: Record<string, number> = {
      concerned: 0.3,
      upset: 0.5,
      angry: 0.7,
      hostile: 0.9,
    };

    const currentValue = thresholdValues[current];
    const checkValue = thresholdValues[threshold];

    return this.emotionalState.value >= checkValue && currentValue >= checkValue;
  }

  /**
   * Get recommended response intensity based on emotional state
   */
  getResponseIntensity(): 'calm' | 'moderate' | 'intense' {
    const value = this.emotionalState.value;
    
    if (value >= 0.7) return 'intense';
    if (value >= 0.4) return 'moderate';
    return 'calm';
  }
}


