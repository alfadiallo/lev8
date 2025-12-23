// Phase Manager: Manages conversation phase transitions and branching logic
// Handles phase progression, objective tracking, and branch condition evaluation

import {
  ConversationPhase,
  PhaseState,
  BranchPath,
  VignetteV2,
  Difficulty,
} from '../../types/difficult-conversations';

export interface PhaseTransition {
  fromPhaseId: string;
  toPhaseId: string;
  reason: string;
  timestamp: Date;
}

export interface PhaseManagerConfig {
  vignette: VignetteV2;
  difficulty: Difficulty;
  initialPhaseId?: string;
}

export class PhaseManager {
  private vignette: VignetteV2;
  private difficulty: Difficulty;
  private phases: Map<string, ConversationPhase>;
  private currentPhaseState: PhaseState;
  private branchHistory: BranchPath[];
  private transitionHistory: PhaseTransition[];

  constructor(config: PhaseManagerConfig) {
    this.vignette = config.vignette;
    this.difficulty = config.difficulty;
    
    // Build phase map for quick lookup
    this.phases = new Map();
    this.vignette.conversation.phases.forEach(phase => {
      this.phases.set(phase.id, phase);
    });

    // Initialize phase state
    const initialPhaseId = config.initialPhaseId || this.getInitialPhaseId();
    this.currentPhaseState = {
      currentPhaseId: initialPhaseId,
      phaseStartTime: new Date(),
      objectivesCompleted: [],
      objectivesPending: this.getPhaseObjectives(initialPhaseId),
      timeInPhase: 0,
    };

    this.branchHistory = [];
    this.transitionHistory = [];
  }

  /**
   * Get the initial phase ID (first non-preparation phase)
   */
  private getInitialPhaseId(): string {
    const nonPrepPhases = this.vignette.conversation.phases.filter(
      p => p.id !== 'preparation'
    );
    return nonPrepPhases[0]?.id || this.vignette.conversation.phases[0].id;
  }

  /**
   * Get objectives for a phase
   */
  private getPhaseObjectives(phaseId: string): string[] {
    const phase = this.phases.get(phaseId);
    if (!phase) return [];
    
    return phase.learnerTasks || [];
  }

  /**
   * Get current phase
   */
  getCurrentPhase(): ConversationPhase {
    const phase = this.phases.get(this.currentPhaseState.currentPhaseId);
    if (!phase) {
      throw new Error(`Phase ${this.currentPhaseState.currentPhaseId} not found`);
    }
    return phase;
  }

  /**
   * Get current phase state
   */
  getPhaseState(): PhaseState {
    // Update time in phase
    const now = new Date();
    this.currentPhaseState.timeInPhase = Math.floor(
      (now.getTime() - this.currentPhaseState.phaseStartTime.getTime()) / 1000
    );
    
    return { ...this.currentPhaseState };
  }

  /**
   * Mark an objective as completed
   */
  completeObjective(objectiveIndex: number): void {
    const phase = this.getCurrentPhase();
    const objectives = phase.learnerTasks || [];
    
    if (objectiveIndex >= 0 && objectiveIndex < objectives.length) {
      const objective = objectives[objectiveIndex];
      
      if (!this.currentPhaseState.objectivesCompleted.includes(objective)) {
        this.currentPhaseState.objectivesCompleted.push(objective);
        this.currentPhaseState.objectivesPending = this.currentPhaseState.objectivesPending.filter(
          o => o !== objective
        );
      }
    }
  }

  /**
   * Mark an objective as completed by text
   */
  completeObjectiveByText(objectiveText: string): void {
    if (!this.currentPhaseState.objectivesCompleted.includes(objectiveText)) {
      this.currentPhaseState.objectivesCompleted.push(objectiveText);
      this.currentPhaseState.objectivesPending = this.currentPhaseState.objectivesPending.filter(
        o => o !== objectiveText
      );
    }
  }

  /**
   * Evaluate branch conditions and determine next phase
   */
  evaluateBranch(
    userMessage: string,
    emotionalState: number,
    context: {
      phaseDuration?: number;
      objectivesCompleted?: string[];
      messageCount?: number;
    } = {}
  ): PhaseTransition | null {
    const currentPhase = this.getCurrentPhase();
    
    // If no branch points, check for automatic progression
    if (!currentPhase.branchPoints || Object.keys(currentPhase.branchPoints).length === 0) {
      // Check if we should progress to next phase based on objectives/time
      return this.checkAutomaticProgression(context);
    }

    // Evaluate branch conditions
    for (const [condition, branchPoint] of Object.entries(currentPhase.branchPoints)) {
      if (this.evaluateCondition(condition, userMessage, emotionalState, context)) {
        const transition: PhaseTransition = {
          fromPhaseId: this.currentPhaseState.currentPhaseId,
          toPhaseId: branchPoint.next,
          reason: branchPoint.description,
          timestamp: new Date(),
        };

        // Record branch path
        this.branchHistory.push({
          phaseId: this.currentPhaseState.currentPhaseId,
          branchTrigger: condition,
          timestamp: new Date(),
        });

        // Transition to new phase
        this.transitionToPhase(branchPoint.next, transition);
        
        return transition;
      }
    }

    return null;
  }

  /**
   * Evaluate a branch condition
   */
  private evaluateCondition(
    condition: string,
    userMessage: string,
    emotionalState: number,
    context: Record<string, any>
  ): boolean {
    const message = userMessage.toLowerCase();
    
    // Simple keyword-based condition matching
    // In production, this would use more sophisticated NLP
    switch (condition) {
      case 'clear_empathetic':
        return this.matchesEmpatheticPattern(message);
      
      case 'medical_jargon':
        return this.containsMedicalJargon(message);
      
      case 'defensive':
        return this.matchesDefensivePattern(message);
      
      case 'objective_completed':
        return (context.objectivesCompleted?.length || 0) >= (context.totalObjectives || 1);
      
      case 'time_elapsed':
        return (context.phaseDuration || 0) >= (context.minDuration || 0);
      
      default:
        // For custom conditions, check if message contains condition keywords
        return message.includes(condition.toLowerCase());
    }
  }

  /**
   * Check if message matches empathetic patterns
   */
  private matchesEmpatheticPattern(message: string): boolean {
    const empatheticKeywords = [
      'understand', 'sorry', 'apologize', 'feel', 'emotions',
      'difficult', 'acknowledge', 'recognize', 'empathize'
    ];
    return empatheticKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Check if message contains medical jargon
   */
  private containsMedicalJargon(message: string): boolean {
    const jargonPatterns = [
      'iatrogenic', 'ventricular', 'tachycardia', 'defibrillation',
      'cardiac arrest', 'biphasic', 'amiodarone', 'norepinephrine',
      'adenosine', 'systolic', 'diastolic', 'hemodynamic'
    ];
    return jargonPatterns.some(pattern => message.includes(pattern.toLowerCase()));
  }

  /**
   * Check if message matches defensive patterns
   */
  private matchesDefensivePattern(message: string): boolean {
    const defensiveKeywords = [
      "it's not my fault", 'blame', "it's protocol", "standard procedure",
      'everyone makes mistakes', "these things happen", "not preventable",
      "wasn't my decision", "following orders"
    ];
    return defensiveKeywords.some(keyword => message.includes(keyword.toLowerCase()));
  }

  /**
   * Check for automatic phase progression
   */
  private checkAutomaticProgression(
    context: Record<string, any>
  ): PhaseTransition | null {
    const currentPhase = this.getCurrentPhase();
    const phaseIndex = this.vignette.conversation.phases.findIndex(
      p => p.id === currentPhase.id
    );
    
    // Don't progress from last phase
    if (phaseIndex >= this.vignette.conversation.phases.length - 1) {
      return null;
    }

    // Check if objectives are complete
    const objectives = currentPhase.learnerTasks || [];
    const completedObjectives = this.currentPhaseState.objectivesCompleted.length;
    const allObjectivesComplete = completedObjectives >= objectives.length;

    // Check minimum time in phase (if specified)
    const minDuration = this.parsePhaseDuration(currentPhase.duration);
    const timeElapsed = context.phaseDuration || this.currentPhaseState.timeInPhase;
    const timeRequirementMet = timeElapsed >= minDuration;

    // Progress if objectives complete and time requirement met
    if (allObjectivesComplete && timeRequirementMet) {
      const nextPhase = this.vignette.conversation.phases[phaseIndex + 1];
      const transition: PhaseTransition = {
        fromPhaseId: currentPhase.id,
        toPhaseId: nextPhase.id,
        reason: 'Objectives completed and minimum time elapsed',
        timestamp: new Date(),
      };

      this.transitionToPhase(nextPhase.id, transition);
      return transition;
    }

    return null;
  }

  /**
   * Parse phase duration string (e.g., "3-7 minutes") to seconds
   */
  private parsePhaseDuration(duration: string): number {
    // Extract numbers from duration string
    const match = duration.match(/(\d+)/);
    if (match) {
      // Use the first number as minimum duration in minutes, convert to seconds
      return parseInt(match[1]) * 60;
    }
    return 60; // Default 1 minute minimum
  }

  /**
   * Transition to a new phase
   */
  private transitionToPhase(phaseId: string, transition: PhaseTransition): void {
    const phase = this.phases.get(phaseId);
    if (!phase) {
      throw new Error(`Phase ${phaseId} not found`);
    }

    // Record transition
    this.transitionHistory.push(transition);

    // Update phase state
    this.currentPhaseState = {
      currentPhaseId: phaseId,
      phaseStartTime: new Date(),
      objectivesCompleted: [],
      objectivesPending: this.getPhaseObjectives(phaseId),
      timeInPhase: 0,
    };
  }

  /**
   * Get branch history
   */
  getBranchHistory(): BranchPath[] {
    return [...this.branchHistory];
  }

  /**
   * Get transition history
   */
  getTransitionHistory(): PhaseTransition[] {
    return [...this.transitionHistory];
  }

  /**
   * Check if current phase is critical
   */
  isCurrentPhaseCritical(): boolean {
    return this.getCurrentPhase().criticalPhase || false;
  }

  /**
   * Get all phases for this vignette
   */
  getAllPhases(): ConversationPhase[] {
    return Array.from(this.phases.values());
  }

  /**
   * Get phase by ID
   */
  getPhase(phaseId: string): ConversationPhase | undefined {
    return this.phases.get(phaseId);
  }

  /**
   * Check if we're in the final phase
   */
  isFinalPhase(): boolean {
    const phases = this.vignette.conversation.phases;
    const currentIndex = phases.findIndex(
      p => p.id === this.currentPhaseState.currentPhaseId
    );
    return currentIndex === phases.length - 1;
  }

  /**
   * Get phase progression percentage
   */
  getPhaseProgression(): number {
    const phases = this.vignette.conversation.phases;
    const currentIndex = phases.findIndex(
      p => p.id === this.currentPhaseState.currentPhaseId
    );
    
    if (currentIndex === -1) return 0;
    if (phases.length === 1) return 100;
    
    return Math.round((currentIndex / (phases.length - 1)) * 100);
  }

  /**
   * Reset to a specific phase (for testing/debugging)
   */
  resetToPhase(phaseId: string): void {
    const phase = this.phases.get(phaseId);
    if (!phase) {
      throw new Error(`Phase ${phaseId} not found`);
    }

    this.currentPhaseState = {
      currentPhaseId: phaseId,
      phaseStartTime: new Date(),
      objectivesCompleted: [],
      objectivesPending: this.getPhaseObjectives(phaseId),
      timeInPhase: 0,
    };
  }
}


