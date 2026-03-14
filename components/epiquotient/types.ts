export interface HistoryPoint {
  period: string;
  composite: number;
}

export interface Archetype {
  id: string;
  name: string;
  risk: string;
  action: string;
  description: string;
  confidence: number;
}

export interface Profile {
  id: string;
  name: string;
  role: string;
  eq: Record<string, number>;
  pq: Record<string, number>;
  iq: Record<string, number>;
  eqScore: number;
  pqScore: number;
  iqScore: number;
  composite: number;
  history: HistoryPoint[];
  archetype: Archetype | null;
  narrative: string | null;
}

export type ScopeType = 'program' | 'class' | 'individual';

export interface ProgramMeta {
  institution: string;
  program: string;
}

export interface LensProps {
  scope: ScopeType;
  profiles: Profile[];
}

export const PILLAR_COLORS = {
  eq: '#2FE6DE',
  pq: '#18F2B2',
  iq: '#7BC8F8',
} as const;

export const PILLAR_LABELS = {
  eq: 'Emotional Quotient',
  pq: 'Professional Quotient',
  iq: 'Intellectual Quotient',
} as const;

export const ATTR_LABELS: Record<string, Record<string, string>> = {
  eq: {
    empathy: 'Empathy',
    adaptability: 'Adaptability',
    stressMgmt: 'Stress Mgmt',
    curiosity: 'Curiosity',
    communication: 'Communication',
  },
  pq: {
    workEthic: 'Work Ethic',
    teachability: 'Teachability',
    integrity: 'Integrity',
    documentation: 'Documentation',
    leadership: 'Leadership',
  },
  iq: {
    knowledgeBase: 'Knowledge',
    learningCommit: 'Learning',
    analyticalThinking: 'Analytical',
    clinicalAdapt: 'Clin. Adapt',
    clinicalPerf: 'Clin. Perf',
  },
};

export const RISK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Low: { bg: 'rgba(24,242,178,0.12)', text: '#18F2B2', border: 'rgba(24,242,178,0.3)' },
  Moderate: { bg: 'rgba(240,160,96,0.12)', text: '#f0a060', border: 'rgba(240,160,96,0.3)' },
  High: { bg: 'rgba(240,96,96,0.12)', text: '#f06060', border: 'rgba(240,96,96,0.3)' },
};
