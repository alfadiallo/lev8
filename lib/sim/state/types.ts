// Simulation state types (adapted from virtual-sim)

export type Rhythm = 'NSR' | 'VF' | 'pVT' | 'PEA' | 'Asystole';

export type Phase = 'analyze' | 'shock' | 'cpr' | 'reassess' | 'postROSC';

export type EntryAnim = 'none' | 'shock';

export type Clinical = {
  BP: string;
  ETCO2: number;
  appearance: string;
  SpO2?: string;
  RR?: string;
  HRText?: string;
};

export type ChoiceEffect = {
  next?: string;
  inc?: Partial<Record<'shocks', number>>;
  pushEpiNow?: boolean;
  setAmioGiven?: boolean;
  penalty?: Partial<Record<
    'delayShock' | 'missedShock' | 'cprPause' | 'timing' | 'unnecessaryPulseCheck',
    number
  >>;
  note?: string;
};

export type Choice = {
  id: string;
  label: string;
  isCorrect: boolean | 'conditional' | 'probabilistic';
  effects?: ChoiceEffect;
  guard?: (ctx: SimContext) => boolean;
};

export type SimStateNode = {
  id: string;
  phase: Phase;
  rhythm: Rhythm;
  timer?: number;
  clinical: Clinical;
  choices: Choice[];
  onTimeout?: { next: string };
  entryAnim?: EntryAnim;
};

export type Scenario = {
  id: string;
  title: string;
  initial: string;
  nodes: Record<string, SimStateNode>;
};

export type SimContext = {
  currentId: string;
  shocks: number;
  minutes: number;
  epiGivenAtMinutes: number[];
  amioGiven: boolean;
  penalties: Record<string, number>;
  rosProbability: number;
};

export type SimEvent =
  | { type: 'TICK'; dtSec: number }
  | { type: 'CHOICE'; choice: Choice }
  | { type: 'RESET' }
  | { type: 'GOTO'; id: string };


