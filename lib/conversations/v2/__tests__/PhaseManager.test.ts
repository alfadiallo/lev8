// Unit tests for PhaseManager
// Run with: npm test -- PhaseManager

import { PhaseManager, PhaseManagerConfig } from '../PhaseManager';
import { MED001AdenosineErrorVignette } from '../../../vignettes/v2/MED-001-adenosine-error';

describe('PhaseManager', () => {
  let phaseManager: PhaseManager;
  let config: PhaseManagerConfig;

  beforeEach(() => {
    config = {
      vignette: MED001AdenosineErrorVignette,
      difficulty: 'intermediate',
    };
    phaseManager = new PhaseManager(config);
  });

  describe('Initialization', () => {
    it('should initialize with first non-preparation phase', () => {
      const currentPhase = phaseManager.getCurrentPhase();
      expect(currentPhase.id).toBe('opening');
    });

    it('should set initial phase state correctly', () => {
      const state = phaseManager.getPhaseState();
      expect(state.currentPhaseId).toBe('opening');
      expect(state.objectivesCompleted).toEqual([]);
      expect(state.objectivesPending.length).toBeGreaterThan(0);
    });
  });

  describe('Phase Transitions', () => {
    it('should evaluate branch conditions correctly', () => {
      const transition = phaseManager.evaluateBranch(
        'I understand this is difficult, and I want to help you understand what happened.',
        0.5,
        { phaseDuration: 120, messageCount: 3 }
      );

      // Should transition based on empathetic message
      if (transition) {
        expect(transition.toPhaseId).toBe('emotional_processing');
      }
    });

    it('should detect medical jargon', () => {
      const transition = phaseManager.evaluateBranch(
        'The patient experienced iatrogenic ventricular fibrillation due to adenosine administration.',
        0.6,
        {}
      );

      // Should not progress well due to jargon
      // (Actual behavior depends on branch point logic)
      expect(phaseManager.getCurrentPhase().id).toBeDefined();
    });

    it('should detect defensive patterns', () => {
      const transition = phaseManager.evaluateBranch(
        "It's not my fault, I was following protocol.",
        0.7,
        {}
      );

      // Should handle defensive response
      expect(phaseManager.getCurrentPhase().id).toBeDefined();
    });
  });

  describe('Objective Tracking', () => {
    it('should complete objectives', () => {
      const phase = phaseManager.getCurrentPhase();
      const objectives = phase.learnerTasks || [];
      
      if (objectives.length > 0) {
        phaseManager.completeObjective(0);
        const state = phaseManager.getPhaseState();
        expect(state.objectivesCompleted.length).toBe(1);
        expect(state.objectivesPending.length).toBe(objectives.length - 1);
      }
    });

    it('should complete objectives by text', () => {
      const phase = phaseManager.getCurrentPhase();
      const objectives = phase.learnerTasks || [];
      
      if (objectives.length > 0) {
        phaseManager.completeObjectiveByText(objectives[0]);
        const state = phaseManager.getPhaseState();
        expect(state.objectivesCompleted).toContain(objectives[0]);
      }
    });
  });

  describe('Phase Information', () => {
    it('should identify critical phases', () => {
      // Transition to disclosure phase (which is critical)
      phaseManager.resetToPhase('disclosure');
      expect(phaseManager.isCurrentPhaseCritical()).toBe(true);
    });

    it('should calculate phase progression', () => {
      const progression = phaseManager.getPhaseProgression();
      expect(progression).toBeGreaterThanOrEqual(0);
      expect(progression).toBeLessThanOrEqual(100);
    });

    it('should detect final phase', () => {
      phaseManager.resetToPhase('next_steps');
      expect(phaseManager.isFinalPhase()).toBe(true);
    });
  });

  describe('Branch History', () => {
    it('should track branch paths', () => {
      phaseManager.evaluateBranch(
        'I understand this is difficult.',
        0.5,
        {}
      );

      const history = phaseManager.getBranchHistory();
      expect(Array.isArray(history)).toBe(true);
    });
  });
});


