// Running the Board - TypeScript Interfaces
// Multi-patient ED simulation module types

// ============================================================================
// ENUMS AND BASIC TYPES
// ============================================================================

export type OrganSystem = 'Infectious' | 'Cardiovascular' | 'GI' | 'Neuro' | 'Trauma' | 'OBGYN';
export type Acuity = 1 | 2 | 3 | 4 | 5;
export type SessionStatus = 'setup' | 'in_progress' | 'paused' | 'completed' | 'abandoned';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

// Phase IDs map to time ranges in the simulation
export type PhaseId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const PHASE_LABELS: Record<PhaseId, string> = {
  1: 'Initial Assessment',
  2: 'Critical Actions',
  3: 'Update #1',
  4: 'Deterioration',
  5: 'Lab Results',
  6: 'Task Overload',
  7: 'Communication',
  8: 'Final Tasks',
};

export const PHASE_TIME_RANGES: Record<PhaseId, string> = {
  1: '00:00-02:00',
  2: '02:00-05:00',
  3: '05:00-08:00',
  4: '08:00-10:00',
  5: '10:00-12:00',
  6: '12:00-15:00',
  7: '15:00-18:00',
  8: '18:00-20:00',
};

// Acuity color mapping (ESI levels)
export const ACUITY_COLORS: Record<Acuity, { bg: string; text: string; label: string }> = {
  1: { bg: 'bg-red-500', text: 'text-white', label: 'Critical' },
  2: { bg: 'bg-orange-500', text: 'text-white', label: 'Emergent' },
  3: { bg: 'bg-yellow-400', text: 'text-neutral-900', label: 'Urgent' },
  4: { bg: 'bg-green-500', text: 'text-white', label: 'Less Urgent' },
  5: { bg: 'bg-blue-400', text: 'text-white', label: 'Non-Urgent' },
};

// ============================================================================
// CLINICAL CASE INTERFACES
// ============================================================================

export interface Vitals {
  bp: string;
  hr: number;
  rr: number;
  o2: string;
  temp: string;
}

export interface PatientProfile {
  demographics: string;
  chief_complaint: string;
  initial_vitals: Vitals;
  target_disposition: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  is_critical: boolean;
}

export interface ConditionalTrigger {
  condition: string;
  script: string;
}

export interface TimelinePhase {
  phase_id: PhaseId;
  time_label: string;
  script_prompt: string;
  vitals_update?: Vitals;
  conditional_triggers?: ConditionalTrigger[];
  checklist: ChecklistItem[];
}

export interface ClinicalCase {
  id: string;
  title: string;
  category: OrganSystem;
  acuity_level: Acuity;
  tags: string[];
  patient_profile: PatientProfile;
  timeline: TimelinePhase[];
  debrief_points: string[];
  is_global?: boolean;
  institution_id?: string;
}

// ============================================================================
// PRESET SHIFT INTERFACES
// ============================================================================

export interface PresetShift {
  id: string;
  name: string;
  description: string;
  case_ids: string[];
  difficulty: Difficulty;
  is_global?: boolean;
  institution_id?: string;
}

// ============================================================================
// SESSION INTERFACES
// ============================================================================

export interface Learner {
  id: string;
  resident_id: string;
  user_id: string;
  full_name: string;
  pgy_level: number;
  photo_url?: string;
  is_recent?: boolean;
}

// Educator types for simulation facilitation
export type EducatorType = 'resident' | 'faculty' | 'custom';

export interface Educator {
  id: string;
  user_id?: string;
  full_name: string;
  type: EducatorType;
  pgy_level?: number;      // For residents
  credentials?: string;    // For faculty (MD, DO, etc.)
  is_recent?: boolean;
}

export interface SessionCase {
  case_id: string;
  column_position: number;
  case: ClinicalCase;
}

export interface RunningBoardSession {
  id: string;
  institution_id?: string;
  facilitator_id: string;
  facilitator_name?: string;
  learner_id: string;
  learner_name?: string;
  learner_pgy_level: number;
  educator_id?: string;
  educator_name?: string;
  educator_type?: EducatorType;
  preset_id?: string;
  preset_name?: string;
  status: SessionStatus;
  started_at?: string;
  ended_at?: string;
  total_duration_seconds?: number;
  final_phase_reached?: number;
  dark_mode_used?: boolean;
  created_at: string;
  cases?: SessionCase[];
}

// ============================================================================
// ACTION TRACKING INTERFACES
// ============================================================================

export interface ActionRecord {
  id: string;
  session_id: string;
  case_id: string;
  checklist_item_id: string;
  phase_id: PhaseId;
  is_critical: boolean;
  checked: boolean;
  checked_at?: string;
  unchecked_at?: string;
  elapsed_time_seconds?: number;
}

// For real-time state tracking during simulation
export interface CheckboxState {
  [itemId: string]: {
    checked: boolean;
    checked_at?: Date;
    elapsed_time_seconds?: number;
  };
}

// ============================================================================
// DEBRIEF INTERFACES
// ============================================================================

export interface MissedCriticalItem {
  case_id: string;
  case_title: string;
  item_id: string;
  label: string;
  phase_id: PhaseId;
}

export interface SessionDebrief {
  id?: string;
  session_id: string;
  
  // Auto-generated summary
  total_actions: number;
  completed_actions: number;
  critical_actions_total: number;
  critical_actions_missed: number;
  missed_critical_items: MissedCriticalItem[];
  completion_percentage: number;
  
  // Structured feedback
  strengths: string[];
  areas_for_improvement: string[];
  overall_score?: number;
  
  // Free-form notes
  facilitator_notes?: string;
  discussion_points_covered: string[];
  
  // Follow-up
  recommended_cases?: string[];
  follow_up_date?: string;
  
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// SIMULATION STATE INTERFACES
// ============================================================================

export interface SimulationState {
  session: RunningBoardSession | null;
  cases: ClinicalCase[];
  currentPhaseIndex: number;
  elapsedTime: number; // in seconds
  isRunning: boolean;
  isPaused: boolean;
  checkboxState: CheckboxState;
  darkMode: boolean;
}

export interface SimulationActions {
  startSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  endSession: () => void;
  jumpToPhase: (phaseIndex: number) => void;
  toggleCheckbox: (caseId: string, itemId: string, phaseId: PhaseId, isCritical: boolean) => void;
  setDarkMode: (enabled: boolean) => void;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateSessionRequest {
  learner_id: string;
  learner_pgy_level: number;
  preset_id?: string;
  case_ids?: string[];
  institution_id?: string;
}

export interface CreateSessionResponse {
  session: RunningBoardSession;
  cases: ClinicalCase[];
}

export interface RecordActionRequest {
  case_id: string;
  checklist_item_id: string;
  phase_id: PhaseId;
  is_critical: boolean;
  checked: boolean;
  elapsed_time_seconds: number;
}

export interface SaveDebriefRequest {
  strengths: string[];
  areas_for_improvement: string[];
  overall_score?: number;
  facilitator_notes?: string;
  discussion_points_covered: string[];
  recommended_cases?: string[];
  follow_up_date?: string;
}

// ============================================================================
// FILTER/QUERY TYPES
// ============================================================================

export interface CaseFilters {
  category?: OrganSystem;
  acuity_level?: Acuity;
  tags?: string[];
  search?: string;
}

export interface SessionFilters {
  learner_id?: string;
  facilitator_id?: string;
  status?: SessionStatus;
  from_date?: string;
  to_date?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getPhaseByTime(elapsedSeconds: number): PhaseId {
  const minutes = elapsedSeconds / 60;
  if (minutes < 2) return 1;
  if (minutes < 5) return 2;
  if (minutes < 8) return 3;
  if (minutes < 10) return 4;
  if (minutes < 12) return 5;
  if (minutes < 15) return 6;
  if (minutes < 18) return 7;
  return 8;
}

export function formatElapsedTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function getCategoryColor(category: OrganSystem): string {
  const colors: Record<OrganSystem, string> = {
    'Infectious': 'bg-red-100 text-red-800 border-red-200',
    'Cardiovascular': 'bg-pink-100 text-pink-800 border-pink-200',
    'GI': 'bg-amber-100 text-amber-800 border-amber-200',
    'Neuro': 'bg-purple-100 text-purple-800 border-purple-200',
    'Trauma': 'bg-orange-100 text-orange-800 border-orange-200',
    'OBGYN': 'bg-sky-100 text-sky-800 border-sky-200',
  };
  return colors[category] || 'bg-neutral-100 text-neutral-800';
}



