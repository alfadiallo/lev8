// ─── Core Types ──────────────────────────────────────────────────

export interface HistoryPoint {
  period: string;
  composite: number;
  eq?: number;
  pq?: number;
  iq?: number;
}

export interface Archetype {
  id: string;
  name: string;
  risk: string;
  action: string;
  description: string;
  confidence: number;
}

// ─── Data Slice Types ────────────────────────────────────────────

export interface RadarSeries {
  label: string;
  scores: Record<string, number>;
  color: string;
  children?: RadarSeries[];
}

export interface RadarSnapshot {
  period: string;
  series: RadarSeries[];
}

export interface RadarData {
  series: RadarSeries[];
  timeline?: RadarSnapshot[];
}

export interface ComparisonData {
  faculty: { eq: number; pq: number; iq: number };
  self: { eq: number; pq: number; iq: number };
  classAverages?: { eq: number; pq: number; iq: number };
  classLabel?: string;
  facultyCount?: number;
  selfCount?: number;
}

export interface TrendPoint {
  period: string;
  facultyEq?: number;
  facultyPq?: number;
  facultyIq?: number;
  selfEq?: number;
  selfPq?: number;
  selfIq?: number;
}

export interface SwotData {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  periodLabel?: string;
  generatedAt?: string;
}

export interface IteScore {
  examYear: number;
  rawScore: number | null;
  percentile: number | null;
  nationalMean: number | null;
}

export interface IteAverages {
  rawScore: number | null;
  percentile: number | null;
}

export interface IteData {
  scores: IteScore[];
  individualAvg: IteAverages;
  classAvg: IteAverages;
  programAvg: IteAverages;
}

export interface RatingEntry {
  id: string;
  evaluatorType: 'core_faculty' | 'teaching_faculty' | 'self';
  evaluatorName?: string;
  date: string;
  eqAvg: number;
  pqAvg: number;
  iqAvg: number;
  comment?: string;
}

export interface RatingsData {
  coreFaculty: number;
  teachingFaculty: number;
  self: number;
  total: number;
  recent: RatingEntry[];
}

// ─── Profile (extensible via optional data slices) ───────────────

export interface Profile {
  id: string;
  name: string;
  role: string;
  graduationClass?: string;
  graduationYear?: number;
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

  radar?: RadarData;
  comparison?: ComparisonData;
  trends?: TrendPoint[];
  swot?: SwotData;
  ite?: IteData;
  ratings?: RatingsData;
}

// ─── Scope & Lens ────────────────────────────────────────────────

export type ScopeType = 'program' | 'class' | 'individual';

export interface ProgramMeta {
  institution: string;
  program: string;
  programLength?: number;
}

export interface LensProps {
  scope: ScopeType;
  profiles: Profile[];
}

// ─── Constants ───────────────────────────────────────────────────

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
