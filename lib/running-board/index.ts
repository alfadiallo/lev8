// Running the Board Module - Main Exports
// ED Multi-Patient Simulation

// Types
export * from '@/lib/types/running-board';

// Case Data
export { ALL_CASES, getCaseById, getCasesByCategory, getCasesByAcuity } from './cases';
export {
  SHIFT_1_CASE_A,
  SHIFT_1_CASE_B,
  SHIFT_1_CASE_C,
  SHIFT_1_CASE_D,
  SHIFT_2_CASE_A,
  SHIFT_2_CASE_B,
  SHIFT_2_CASE_C,
  SHIFT_2_CASE_D,
  SHIFT_3_CASE_BILL,
  SHIFT_3_CASE_ASHLEY,
  SHIFT_3_CASE_MARY,
  SHIFT_3_CASE_RICHARD,
  SHIFT_4_CASE_A,
  SHIFT_4_CASE_B,
  SHIFT_4_CASE_C,
  SHIFT_4_CASE_D,
} from './cases';

// Presets
export {
  ALL_PRESETS,
  getPresetById,
  SHIFT_1_PRESET,
  SHIFT_2_PRESET,
  SHIFT_3_PRESET,
  SHIFT_4_PRESET,
  FACILITATOR_SCRIPTS,
  DEBRIEF_SCENARIOS,
} from './presets';
export type { FacilitatorPhaseScript, DebriefScenario } from './presets';





