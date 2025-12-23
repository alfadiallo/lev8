// ACLS Scenario: VF/pVT (click-advance)
// Adapted from virtual-sim

import { Scenario } from '../state/types';
import { isEpiEligible } from '../state/engine';

const scn: Scenario = {
  id: 'vfvt-click',
  title: 'ACLS: VF/pVT (click-advance)',
  initial: 'S1',
  nodes: {
    S1: {
      id: 'S1',
      phase: 'analyze',
      rhythm: 'VF',
      entryAnim: 'none',
      clinical: { BP: 'Unmeasurable', ETCO2: 10, appearance: 'Unresponsive, pulseless' },
      choices: [
        { id: 'c1', label: 'Start CPR for 2 minutes', isCorrect: true, effects: { next: 'CPR1' } },
        { id: 'c2', label: 'Defibrillate (1st shock)', isCorrect: true, effects: { next: 'POST_SHOCK_1' } },
        { id: 'c3', label: 'Synchronized cardioversion', isCorrect: false, effects: { next: 'SYNC_ERR' } },
      ],
    },
    SYNC_ERR: {
      id: 'SYNC_ERR',
      phase: 'shock',
      rhythm: 'VF',
      entryAnim: 'none',
      clinical: { BP: 'Unmeasurable', ETCO2: 8, appearance: 'No effect; delay' },
      choices: [
        { id: 'c1', label: 'Correct to Defibrillation', isCorrect: true, effects: { next: 'POST_SHOCK_1' } },
      ],
    },
    CPR1: {
      id: 'CPR1',
      phase: 'cpr',
      rhythm: 'VF',
      entryAnim: 'none',
      clinical: { BP: 'Unmeasurable', ETCO2: 12, appearance: 'CPR in progress' },
      choices: [
        { id: 'c1', label: 'Defibrillate (1st shock)', isCorrect: true, effects: { next: 'POST_SHOCK_1' } },
      ],
    },
    POST_SHOCK_1: {
      id: 'POST_SHOCK_1',
      phase: 'shock',
      rhythm: 'VF',
      entryAnim: 'shock',
      clinical: { BP: 'Unmeasurable', ETCO2: 12, appearance: 'CPR needed' },
      choices: [
        { id: 'c1', label: 'CPR for 2 minutes', isCorrect: true, effects: { next: 'RE1' } },
        { id: 'c2', label: 'Give Epinephrine 1 mg (too early)', isCorrect: false, effects: { next: 'RE1' } },
      ],
    },
    RE1: {
      id: 'RE1',
      phase: 'reassess',
      rhythm: 'VF',
      entryAnim: 'none',
      clinical: { BP: 'Unmeasurable', ETCO2: 13, appearance: 'Still pulseless' },
      choices: [
        { id: 'c1', label: 'Defibrillate (2nd shock)', isCorrect: true, effects: { next: 'POST_SHOCK_2' } },
        { id: 'c2', label: 'Analyze only (delay)', isCorrect: false, effects: { next: 'POST_SHOCK_2' } },
      ],
    },
    POST_SHOCK_2: {
      id: 'POST_SHOCK_2',
      phase: 'shock',
      rhythm: 'VF',
      entryAnim: 'shock',
      clinical: { BP: 'Unmeasurable', ETCO2: 14, appearance: 'Resume CPR immediately' },
      choices: [
        {
          id: 'c1',
          label: 'CPR for 2 minutes + Give Epinephrine 1 mg',
          isCorrect: 'conditional',
          guard: (ctx) => isEpiEligible(ctx),
          effects: { pushEpiNow: true, next: 'RE2' },
        },
        { id: 'c2', label: 'CPR for 2 minutes (no meds)', isCorrect: true, effects: { next: 'RE2' } },
      ],
    },
    RE2: {
      id: 'RE2',
      phase: 'reassess',
      rhythm: 'VF',
      entryAnim: 'none',
      clinical: { BP: 'Unmeasurable', ETCO2: 15, appearance: 'VF persists' },
      choices: [
        { id: 'c1', label: 'Defibrillate (3rd shock)', isCorrect: true, effects: { next: 'POST_SHOCK_3' } },
        { id: 'c2', label: 'No shock', isCorrect: false, effects: { next: 'POST_SHOCK_3' } },
      ],
    },
    POST_SHOCK_3: {
      id: 'POST_SHOCK_3',
      phase: 'shock',
      rhythm: 'VF',
      entryAnim: 'shock',
      clinical: { BP: 'Unmeasurable', ETCO2: 16, appearance: 'Consider antiarrhythmic' },
      choices: [
        { id: 'c1', label: 'CPR for 2 minutes + Amiodarone 300 mg', isCorrect: true, effects: { setAmioGiven: true, next: 'RE3' } },
        {
          id: 'c2',
          label: 'CPR for 2 minutes + Repeat Epinephrine (if ≥3–5 min)',
          isCorrect: 'conditional',
          guard: (ctx) => isEpiEligible(ctx),
          effects: { pushEpiNow: true, next: 'RE3' },
        },
      ],
    },
    RE3: {
      id: 'RE3',
      phase: 'reassess',
      rhythm: 'PEA',
      entryAnim: 'none',
      clinical: { BP: 'Unmeasurable', ETCO2: 18, appearance: 'No pulse; organized rhythm (PEA)' },
      choices: [
        { id: 'c1', label: 'CPR for 2 minutes + Treat Hs & Ts', isCorrect: true, effects: { next: 'RE4' } },
        { id: 'c2', label: 'Check pulse repeatedly', isCorrect: false, effects: { next: 'RE4' } },
      ],
    },
    RE4: {
      id: 'RE4',
      phase: 'reassess',
      rhythm: 'NSR',
      entryAnim: 'none',
      clinical: { BP: '110/70', ETCO2: 35, appearance: 'Spontaneous circulation (ROSC)' },
      choices: [
        { id: 'c1', label: 'Begin post–cardiac arrest care', isCorrect: true, effects: { next: 'ROSC' } },
      ],
    },
    ROSC: {
      id: 'ROSC',
      phase: 'postROSC',
      rhythm: 'NSR',
      entryAnim: 'none',
      clinical: { BP: '112/72', ETCO2: 36, appearance: 'Improving' },
      choices: [],
    },
  },
};

export default scn;


