// Analytics Types for Understand > Overview module

export interface SWOTElement {
  theme?: string;
  description: string;
  severity?: 'critical' | 'moderate' | 'minor';
  frequency?: number;
  prevalence?: 'universal' | 'majority' | 'common' | 'occasional' | 'rare'; // For class-level SWOT
  supporting_quotes?: Array<{
    quote: string;
    citation: string;
  }>;
}

export interface SWOTSummary {
  id: string;
  resident_id: string;
  period_label: string;
  strengths: SWOTElement[];
  weaknesses: SWOTElement[];
  opportunities: SWOTElement[];
  threats: SWOTElement[];
  n_comments_analyzed: number;
  ai_confidence: number;
  created_at: string;
}

export interface PeriodScore {
  id: string;
  resident_id: string;
  period_label: string;
  
  // Faculty ratings
  faculty_eq_avg: number | null;
  faculty_pq_avg: number | null;
  faculty_iq_avg: number | null;
  faculty_n_raters: number | null;
  faculty_ratings_detail: Record<string, any> | null;
  
  // Self-assessment
  self_eq_avg: number | null;
  self_pq_avg: number | null;
  self_iq_avg: number | null;
  self_ratings_detail: Record<string, any> | null;
  
  // AI analysis of comments
  ai_eq_avg: number | null;
  ai_pq_avg: number | null;
  ai_iq_avg: number | null;
  ai_n_comments: number | null;
  ai_confidence_avg: number | null;
  ai_scores_detail?: {
    eq?: Record<string, number>;
    pq?: Record<string, number>;
    iq?: Record<string, number>;
  } | null;
  
  // Gap analysis
  self_faculty_gap_eq: number | null;
  self_faculty_gap_pq: number | null;
  self_faculty_gap_iq: number | null;
  
  // ITE data
  ite_raw_score: number | null;
  ite_percentile: number | null;
  ite_test_date: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface ITEScore {
  id: string;
  resident_id: string;
  test_date: string;
  academic_year: string;
  pgy_level: string;
  raw_score: number | null;
  percentile: number | null;
  notes: string | null;
}

export interface ROSHSnapshot {
  id: string;
  resident_id: string;
  snapshot_date: string;
  completion_percentage: number;
  pgy_level: string;
  class_year: number;
  notes: string | null;
}

export interface ResidentProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  class_year: number;
  program_name: string;
  current_pgy_level: string | null;
}

export interface ClassStats {
  class_year: number;
  n_residents: number;
  avg_eq: number | null;
  avg_pq: number | null;
  avg_iq: number | null;
  avg_ite_percentile: number | null;
}

export interface ProgramStats {
  program_id: string;
  program_name: string;
  n_residents: number;
  n_classes: number;
  avg_eq: number | null;
  avg_pq: number | null;
  avg_iq: number | null;
  avg_ite_percentile: number | null;
}

// API Response types
export interface SWOTResponse {
  periods: Array<{
    period_label: string;
    swot: SWOTSummary;
  }>;
}

export interface ScoresResponse {
  periods: PeriodScore[];
  ite_scores: ITEScore[];
  rosh_snapshots: ROSHSnapshot[];
}

export interface ResidentOverviewData {
  profile: ResidentProfile;
  swot: SWOTSummary[];
  scores: PeriodScore[];
  ite: ITEScore[];
  rosh: ROSHSnapshot[];
}

export interface ClassOverviewData {
  class_year: number;
  stats: ClassStats;
  residents: ResidentProfile[];
  aggregated_swot: SWOTSummary | null;
  period_averages: PeriodScore[];
}

export interface ProgramOverviewData {
  stats: ProgramStats;
  classes: ClassStats[];
  recent_trends: any;
}


