// Shared TypeScript types for all learning modules

export type UserRole = 
  | 'resident' 
  | 'faculty' 
  | 'program_director' 
  | 'assistant_program_director'
  | 'clerkship_director'
  | 'studio_creator'  // Learn + Studio only (no Reflect, Understand, Truths)
  | 'super_admin' 
  | 'admin';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type ModuleType = 'vignette' | 'clinical_case' | 'acls' | 'running_board';

export interface Module {
  id: string;
  institution_id: string;
  bucket_id: string;
  slug: string;
  name: string;
  description: string;
  available_to_roles: UserRole[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClinicalCase {
  id: string;
  institution_id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  specialty: string;
  estimated_duration_minutes: number;
  case_data: Record<string, unknown>;
  created_by_user_id?: string;
  is_public: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CaseAttempt {
  id: string;
  case_id: string;
  user_id: string;
  progress_data: Record<string, unknown>;
  score?: number;
  completed: boolean;
  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Vignette {
  id: string;
  institution_id: string | null; // null = global vignette (available to all institutions)
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  difficulty: Difficulty[];
  estimated_duration_minutes: number;
  vignette_data: Record<string, unknown>; // v1 structure or v2 structure (check for version field)
  created_by_user_id?: string;
  is_public: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Helper type guard to check if vignette is v2
export function isVignetteV2(vignette: Vignette): boolean {
  return vignette.vignette_data?.version === '2.0' || vignette.vignette_data?.version === 2;
}

export interface TrainingSession {
  id: string;
  user_id: string;
  vignette_id?: string;
  vignette_title: string;
  module_type: ModuleType;
  difficulty: Difficulty;
  start_time: string;
  end_time?: string;
  messages: Message[];
  metrics: SessionMetrics;
  session_data: Record<string, unknown>;
  completed: boolean;
  ai_provider?: string;
  session_duration_seconds?: number;
  viewable_by_roles: UserRole[];
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'avatar';
  avatarId?: string;
  timestamp: Date | string;
  phaseId?: string;
  emotionalImpact?: number;
}

export interface SessionMetrics {
  empathyScore?: number;
  clarityScore?: number;
  deEscalationScore?: number;
  [key: string]: unknown;
}

export interface ACLSScenario {
  id: string;
  institution_id: string;
  title: string;
  description: string;
  scenario_data: Record<string, unknown>;
  created_by_user_id?: string;
  is_public: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ACLSSession {
  id: string;
  user_id: string;
  scenario_id: string;
  current_state: Record<string, unknown>;
  context_data: Record<string, unknown>;
  choices_made: unknown[];
  performance_metrics: Record<string, unknown>;
  completed: boolean;
  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface RunningBoardConfig {
  id: string;
  institution_id: string;
  name: string;
  description: string;
  patient_count: number;
  difficulty: Difficulty;
  config_data: Record<string, unknown>;
  created_by_user_id?: string;
  is_public: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RunningBoardSession {
  id: string;
  user_id: string;
  config_id: string;
  patient_states: unknown[];
  actions_taken: unknown[];
  performance_metrics: Record<string, unknown>;
  completed: boolean;
  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

