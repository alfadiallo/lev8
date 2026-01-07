// Running the Board - Preset Shift Configurations
// Pre-configured case combinations for different simulation scenarios

import { PresetShift } from '@/lib/types/running-board';

// ============================================================================
// PRESET SHIFT CONFIGURATIONS
// ============================================================================

export const SHIFT_1_PRESET: PresetShift = {
  id: 'preset_shift_1',
  name: 'Shift 1: Bread & Butter',
  description: 'Classic ED mix: Sepsis, STEMI, Stable Ectopic, and Minor Trauma. Good for building foundational multi-patient management skills.',
  case_ids: ['shift_1_case_a', 'shift_1_case_b', 'shift_1_case_c', 'shift_1_case_d'],
  difficulty: 'intermediate',
  is_global: true,
};

export const SHIFT_2_PRESET: PresetShift = {
  id: 'preset_shift_2',
  name: 'Shift 2: Challenging Mix',
  description: 'Upper GI Bleed, Asthma, Occult Fracture, Psych Emergency. Tests airway management, hidden diagnoses, and psychiatric holds.',
  case_ids: ['shift_2_case_a', 'shift_2_case_b', 'shift_2_case_c', 'shift_2_case_d'],
  difficulty: 'advanced',
  is_global: true,
};

export const SHIFT_3_PRESET: PresetShift = {
  id: 'preset_shift_3',
  name: 'Shift 3: Complex Scenarios',
  description: 'Sepsis with DNR, Ruptured Ectopic, Acute Stroke, Trauma with Hypoglycemia. Heavy on ethical decisions and time-critical interventions.',
  case_ids: ['shift_3_case_bill', 'shift_3_case_ashley', 'shift_3_case_mary', 'shift_3_case_richard'],
  difficulty: 'advanced',
  is_global: true,
};

export const SHIFT_4_PRESET: PresetShift = {
  id: 'preset_shift_4',
  name: 'Shift 4: GI Disaster',
  description: 'Mesenteric Ischemia, Cholangitis, Cirrhotic UGIB, LGIB on Anticoagulation. All GI-focused with surgical emergencies.',
  case_ids: ['shift_4_case_a', 'shift_4_case_b', 'shift_4_case_c', 'shift_4_case_d'],
  difficulty: 'advanced',
  is_global: true,
};

// ============================================================================
// ALL PRESETS ARRAY
// ============================================================================

export const ALL_PRESETS: PresetShift[] = [
  SHIFT_1_PRESET,
  SHIFT_2_PRESET,
  SHIFT_3_PRESET,
  SHIFT_4_PRESET,
];

// Helper to get preset by ID
export function getPresetById(id: string): PresetShift | undefined {
  return ALL_PRESETS.find((p) => p.id === id);
}

// ============================================================================
// FACILITATOR SCRIPTS (Global prompts for each phase)
// ============================================================================

export interface FacilitatorPhaseScript {
  phase_id: number;
  phase_name: string;
  time_label: string;
  global_prompts: string[];
  delegation_cues?: string[];
}

export const FACILITATOR_SCRIPTS: FacilitatorPhaseScript[] = [
  {
    phase_id: 1,
    phase_name: 'Initial Assessment',
    time_label: '00:00-02:00',
    global_prompts: [
      'Start Timer!',
      '"You\'re taking over at shift change..."',
      'Read all 4 patient presentations',
      'Allow 30 seconds for questions',
      'Watch for immediate recognition of STEMI/sepsis',
      'If missed: Use nurse voice to hint',
    ],
  },
  {
    phase_id: 2,
    phase_name: 'Critical Actions',
    time_label: '02:00-05:00',
    global_prompts: [
      'First Check-in',
      'If sepsis not addressed: "Nurse says Patient A looks worse than 10 minutes ago"',
      'If STEMI not addressed: "Tech asks if you want an EKG on the chest pain patient"',
      'Start tracking completion of critical actions',
    ],
  },
  {
    phase_id: 3,
    phase_name: 'Update #1',
    time_label: '05:00-08:00',
    global_prompts: [
      'Critical Update - URGENT voice!',
      '"Cath lab is ready for your STEMI - they need him NOW!"',
      'If sepsis bundle incomplete: "Patient A\'s BP is now 72/40, barely responding"',
      'Add pressure: "Charge nurse asks: which patient is your priority?"',
    ],
    delegation_cues: [
      '"You have two junior residents here. What specific tasks can they handle?"',
    ],
  },
  {
    phase_id: 4,
    phase_name: 'Deterioration',
    time_label: '08:00-10:00',
    global_prompts: [
      'Workflow Challenge',
      '"Good news - STEMI is in cath lab. Bad news - Patient A still hypotensive"',
      'Call out time: "8 minutes in..."',
    ],
    delegation_cues: [
      '"You have two junior residents here. What specific tasks can they handle?"',
    ],
  },
  {
    phase_id: 5,
    phase_name: 'Lab Results',
    time_label: '10:00-12:00',
    global_prompts: [
      'Lab Results - Dramatic delivery!',
      '"Lab calling with critical values..."',
      'Read Patient A results slowly',
      'Then add pregnancy test result',
      'Prompt if needed: "What does that hCG level mean with her symptoms?"',
    ],
  },
  {
    phase_id: 6,
    phase_name: 'Task Overload',
    time_label: '12:00-15:00',
    global_prompts: [
      'Create Multiple Demands - who will address each?',
      'Patient A has poor access',
      'Patient C significant other wants to discuss results',
      'Patient D angry about wait',
      '"What\'s your plan?"',
      'Watch delegation skills',
    ],
  },
  {
    phase_id: 7,
    phase_name: 'Communication',
    time_label: '15:00-18:00',
    global_prompts: [
      'Communication Test',
      'If Patient C not addressed: "Patient C is crying, says she might leave since no one will talk to her"',
      '15 minutes elapsed!',
    ],
    delegation_cues: [
      '"Can the PGY-1 handle any tasks independently?"',
    ],
  },
  {
    phase_id: 8,
    phase_name: 'Final Tasks',
    time_label: '18:00-20:00',
    global_prompts: [
      'Final Push',
      '"3 minutes before Swing Shift attending arrives. Patient D still needs sutures. What\'s essential? Patient C?"',
      'Watch for: Appropriate task prioritization, Clear delegation, Safety checks',
      'If Patient D forgotten: "Patient D asks if you forgot about him"',
    ],
  },
];

// ============================================================================
// "WHAT WOULD YOU DO IF?" SCENARIOS
// ============================================================================

export interface DebriefScenario {
  id: string;
  case_id: string;
  question: string;
  discussion_points: string[];
}

export const DEBRIEF_SCENARIOS: DebriefScenario[] = [
  {
    id: 'debrief_1',
    case_id: 'shift_1_case_a',
    question: 'What are the considerations for medication treatment in inferior MI?',
    discussion_points: ['Nitroglycerin contraindications', 'RV involvement', 'Fluid dependency'],
  },
  {
    id: 'debrief_2',
    case_id: 'shift_1_case_b',
    question: 'Acute shortness of breath after central line placement?',
    discussion_points: ['Pneumothorax', 'CXR', 'Needle decompression if tension'],
  },
  {
    id: 'debrief_3',
    case_id: 'shift_1_case_c',
    question: 'OBGYN resident explains that the free fluid is probably artifact, ruptured ectopic pregnancies are always tachycardic... how do you respond?',
    discussion_points: ['Trust clinical judgment', 'Hemodynamic instability can be subtle', 'Advocate for patient'],
  },
  {
    id: 'debrief_4',
    case_id: 'shift_3_case_ashley',
    question: 'You are single coverage. Interventional cards will be here in 15 mins and tells you to send the patient up - do you send upstairs or keep in ED?',
    discussion_points: ['Patient stability', 'Monitoring capabilities', 'Transport risks'],
  },
  {
    id: 'debrief_5',
    case_id: 'shift_1_case_c',
    question: 'Why is the RUQ view often first to be positive even with pelvic pathology?',
    discussion_points: ['Fluid tracks to Morrison\'s pouch', 'Anatomy', 'FAST exam technique'],
  },
];





