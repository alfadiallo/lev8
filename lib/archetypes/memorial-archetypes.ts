// ============================================================
// ITE Archetype Definitions - Memorial Healthcare System
// Based on analysis of Classes 2024 & 2025 ITE data
// Version: 1.0.0 - Memorial Baseline
// ============================================================

export type RiskLevel = 'Low' | 'Moderate' | 'High';

export interface ArchetypeCriteria {
  pgy1?: { min?: number; max?: number };
  pgy2?: { min?: number; max?: number };
  pgy3?: { min?: number; max?: number };
  delta12?: { min?: number; max?: number };
  delta23?: { min?: number; max?: number };
  deltaTotal?: { min?: number; max?: number };
}

export interface ArchetypeProfile {
  pgy1Mean: number;
  pgy1Std: number;
  pgy2Mean: number;
  pgy2Std: number;
  pgy3Mean: number;
  pgy3Std: number;
  delta12Mean: number;
  delta23Mean: number;
}

export interface ArchetypeDefinition {
  id: string;
  name: string;
  description: string;
  riskLevel: RiskLevel;
  color: string;
  
  // Classification criteria for COMPLETE data (3 years)
  criteria: ArchetypeCriteria;
  
  // Reference data from exemplars
  profile: ArchetypeProfile;
  
  exemplars: string[];
  recommendations: string[];
}

// ============================================================
// ARCHETYPES DERIVED FROM MEMORIAL DATA
// ============================================================

export const MEMORIAL_ARCHETYPES: Record<string, ArchetypeDefinition> = {
  
  // ============================================================
  // ELITE PERFORMER
  // ============================================================
  'elite_performer': {
    id: 'elite_performer',
    name: 'Elite Performer',
    description: 'Started elite (85%+), maintained elite through PGY2 (85%+), ended above average (50%+)',
    riskLevel: 'Low',
    color: '#1ABC9C',
    
    criteria: {
      pgy1: { min: 85 },
      pgy2: { min: 85 },
      pgy3: { min: 50 },
    },
    
    profile: {
      pgy1Mean: 92.3,
      pgy1Std: 3.1,
      pgy2Mean: 92.7,
      pgy2Std: 4.2,
      pgy3Mean: 62.0,
      pgy3Std: 13.1,
      delta12Mean: 0.3,
      delta23Mean: -30.7,
    },
    
    exemplars: ['Matthew Bidwell', 'Jesse Shulman', 'Steven Gayda'],
    
    recommendations: [
      'Consider for leadership opportunities',
      'Discuss fellowship interests',
      'Potential teaching/mentorship role',
    ],
  },

  // ============================================================
  // ELITE → LATE STRUGGLE
  // ============================================================
  'elite_late_struggle': {
    id: 'elite_late_struggle',
    name: 'Elite → Late Struggle',
    description: 'Started elite, maintained through PGY2, but significant PGY3 decline (<50%)',
    riskLevel: 'Moderate',
    color: '#E67E22',
    
    criteria: {
      pgy1: { min: 75 },
      pgy2: { min: 80 },
      pgy3: { max: 50 },
    },
    
    profile: {
      pgy1Mean: 84.7,
      pgy1Std: 9.5,
      pgy2Mean: 88.0,
      pgy2Std: 4.4,
      pgy3Mean: 24.0,
      pgy3Std: 9.5,
      delta12Mean: 3.3,
      delta23Mean: -64.0,
    },
    
    exemplars: ['Daniel Levi', 'Rolando Zamora', 'Eduardo Diaz'],
    
    recommendations: [
      'Investigate PGY3 performance drop factors',
      'Assess burnout or external stressors',
      'Consider board prep resources',
      'Schedule check-in meetings',
    ],
  },

  // ============================================================
  // BREAKTHROUGH PERFORMER
  // ============================================================
  'breakthrough_performer': {
    id: 'breakthrough_performer',
    name: 'Breakthrough Performer',
    description: 'Major improvement PGY1→PGY2 (+25 pts), sustained at PGY3 (70%+)',
    riskLevel: 'Low',
    color: '#3498DB',
    
    criteria: {
      delta12: { min: 25 },
      pgy3: { min: 70 },
    },
    
    profile: {
      pgy1Mean: 60.5,
      pgy1Std: 2.1,
      pgy2Mean: 93.5,
      pgy2Std: 3.5,
      pgy3Mean: 84.0,
      pgy3Std: 8.5,
      delta12Mean: 33.0,
      delta23Mean: -9.5,
    },
    
    exemplars: ['Joris Hoogendoorn', 'Sebastian Fresquet'],
    
    recommendations: [
      'Document what strategies worked for improvement',
      'Consider peer mentorship role',
      'Strong momentum - maintain engagement',
    ],
  },

  // ============================================================
  // PEAK & DECLINE
  // ============================================================
  'peak_decline': {
    id: 'peak_decline',
    name: 'Peak & Decline',
    description: 'Improved PGY1→PGY2 (+10pts), then significant PGY3 drop (-30pts)',
    riskLevel: 'High',
    color: '#E74C3C',
    
    criteria: {
      delta12: { min: 10 },
      delta23: { max: -30 },
    },
    
    profile: {
      pgy1Mean: 61.3,
      pgy1Std: 9.5,
      pgy2Mean: 78.0,
      pgy2Std: 4.6,
      pgy3Mean: 19.0,
      pgy3Std: 14.0,
      delta12Mean: 16.7,
      delta23Mean: -59.0,
    },
    
    exemplars: ['Kevin Abadi', 'Francisca Aguilar', 'Sarah Eldin'],
    
    recommendations: [
      'URGENT: Schedule PD meeting',
      'Assess for burnout or personal issues',
      'Board prep support critical',
      'Consider tutoring resources',
      'Weekly check-ins recommended',
    ],
  },

  // ============================================================
  // SOPHOMORE SLUMP → STRONG RECOVERY
  // ============================================================
  'sophomore_slump_recovery': {
    id: 'sophomore_slump_recovery',
    name: 'Sophomore Slump → Strong Recovery',
    description: 'Dropped at PGY2 (-15pts), then strong PGY3 recovery (+40pts)',
    riskLevel: 'Low',
    color: '#F39C12',
    
    criteria: {
      delta12: { max: -15 },
      delta23: { min: 40 },
    },
    
    profile: {
      pgy1Mean: 43.0,
      pgy1Std: 11.3,
      pgy2Mean: 15.0,
      pgy2Std: 0.0,
      pgy3Mean: 72.0,
      pgy3Std: 0.0,
      delta12Mean: -28.0,
      delta23Mean: 57.0,
    },
    
    exemplars: ['Sara Greenwald', 'Ambika Shivarajpur'],
    
    recommendations: [
      'Reassure - strong recovery pattern demonstrated',
      'Document what drove PGY3 success',
      'Connect with current PGY2s showing similar PGY2 dip',
    ],
  },

  // ============================================================
  // LATE BLOOMER
  // ============================================================
  'late_bloomer': {
    id: 'late_bloomer',
    name: 'Late Bloomer',
    description: 'Low start (≤40%), gradual or late improvement through PGY3',
    riskLevel: 'Low',
    color: '#9B59B6',
    
    criteria: {
      pgy1: { max: 40 },
      delta23: { min: 15 },
    },
    
    profile: {
      pgy1Mean: 17.0,
      pgy1Std: 14.5,
      pgy2Mean: 18.0,
      pgy2Std: 12.8,
      pgy3Mean: 42.7,
      pgy3Std: 16.2,
      delta12Mean: 1.0,
      delta23Mean: 24.7,
    },
    
    exemplars: ['Hadley Modeen', 'Larissa Tavares', 'Jennifer Truong'],
    
    recommendations: [
      'Positive trajectory - encourage continuation',
      'Many late bloomers accelerate further',
      'Continue current support approach',
    ],
  },

  // ============================================================
  // STEADY CLIMBER
  // ============================================================
  'steady_climber': {
    id: 'steady_climber',
    name: 'Steady Climber',
    description: 'Consistent improvement each year (positive deltas)',
    riskLevel: 'Low',
    color: '#27AE60',
    
    criteria: {
      delta12: { min: 0 },
      delta23: { min: 0 },
      deltaTotal: { min: 10 },
    },
    
    profile: {
      pgy1Mean: 35.0,
      pgy1Std: 0.0,
      pgy2Mean: 37.0,
      pgy2Std: 0.0,
      pgy3Mean: 46.0,
      pgy3Std: 0.0,
      delta12Mean: 2.0,
      delta23Mean: 9.0,
    },
    
    exemplars: ['Carly Whittaker'],
    
    recommendations: [
      'Positive consistent trajectory',
      'Continue current approach',
      'May benefit from stretch goals',
    ],
  },

  // ============================================================
  // CONTINUOUS DECLINE
  // ============================================================
  'continuous_decline': {
    id: 'continuous_decline',
    name: 'Continuous Decline',
    description: 'Declining trajectory each year (negative deltas)',
    riskLevel: 'High',
    color: '#C0392B',
    
    criteria: {
      delta12: { max: 0 },
      delta23: { max: 0 },
      deltaTotal: { max: -20 },
    },
    
    profile: {
      pgy1Mean: 55.0,
      pgy1Std: 0.0,
      pgy2Mean: 32.0,
      pgy2Std: 0.0,
      pgy3Mean: 16.0,
      pgy3Std: 0.0,
      delta12Mean: -23.0,
      delta23Mean: -16.0,
    },
    
    exemplars: ['Nadine Ajami'],
    
    recommendations: [
      'URGENT: Intensive support needed',
      'Weekly check-ins mandatory',
      'Assign dedicated mentor',
      'Assess for underlying issues',
      'Board prep intervention critical',
    ],
  },

  // ============================================================
  // VARIABLE
  // ============================================================
  'variable': {
    id: 'variable',
    name: 'Variable',
    description: 'Pattern does not fit standard archetypes - unique trajectory',
    riskLevel: 'Moderate',
    color: '#7F8C8D',
    
    criteria: {},
    
    profile: {
      pgy1Mean: 45.0,
      pgy1Std: 14.1,
      pgy2Mean: 47.5,
      pgy2Std: 14.8,
      pgy3Mean: 52.0,
      pgy3Std: 0.0,
      delta12Mean: 2.5,
      delta23Mean: 4.5,
    },
    
    exemplars: ['Ryan Kelly', 'Jalyn Joseph'],
    
    recommendations: [
      'Monitor trajectory closely',
      'Individualized approach needed',
      'Document unique factors',
    ],
  },
};

// ============================================================
// PROVISIONAL ARCHETYPE DEFINITIONS
// ============================================================

export interface ProvisionalArchetype {
  id: string;
  name: string;
  description: string;
  riskLevel: RiskLevel;
  color: string;
  note: string;
  recommendations: string[];
}

// Two-Year Provisional Archetypes (PGY1 + PGY2)
export const TWO_YEAR_ARCHETYPES: Record<string, ProvisionalArchetype> = {
  'elite_performer': {
    id: 'elite_performer',
    name: 'Elite Performer',
    description: 'On track for Elite - PGY3 will confirm',
    riskLevel: 'Low',
    color: '#1ABC9C',
    note: 'On track for Elite Performer - PGY3 will confirm',
    recommendations: ['Maintain current approach', 'Consider leadership opportunities'],
  },
  'breakthrough_performer': {
    id: 'breakthrough_performer',
    name: 'Breakthrough Performer',
    description: 'Strong surge - monitor for sustainment',
    riskLevel: 'Low',
    color: '#3498DB',
    note: 'Strong surge - monitor for PGY3 sustainment',
    recommendations: ['Document what drove improvement', 'Monitor PGY3 for sustainment'],
  },
  'trending_peak': {
    id: 'trending_peak',
    name: 'Trending: Peak (monitor PGY3)',
    description: 'Good improvement - PGY3 critical',
    riskLevel: 'Moderate',
    color: '#F39C12',
    note: '⚠️ Good improvement but Class 2024 showed PGY3 drops - monitor closely',
    recommendations: ['Critical: Monitor PGY3 closely', 'Class 2024 showed PGY3 drops after similar pattern', 'Proactive support recommended'],
  },
  'trending_slump': {
    id: 'trending_slump',
    name: 'Trending: Sophomore Slump',
    description: 'PGY2 dip - recovery potential at PGY3',
    riskLevel: 'Moderate',
    color: '#E67E22',
    note: 'PGY2 dip - historical data shows strong recovery potential at PGY3',
    recommendations: ['Reassure - recovery common', 'Historical data shows 57-point PGY3 rebounds', 'Connect with recovered residents'],
  },
  'trending_late_bloomer': {
    id: 'trending_late_bloomer',
    name: 'Trending: Late Bloomer',
    description: 'Low start - watch for PGY3 acceleration',
    riskLevel: 'Moderate',
    color: '#9B59B6',
    note: 'Low start - watch for PGY3 acceleration (common pattern)',
    recommendations: ['Continue supportive environment', 'Many accelerate at PGY3', 'Board prep support'],
  },
  'trending_decline': {
    id: 'trending_decline',
    name: 'Trending: Decline Risk',
    description: 'Declining trajectory - intervention recommended',
    riskLevel: 'High',
    color: '#E74C3C',
    note: 'Declining trajectory - intervention recommended',
    recommendations: ['Schedule meeting', 'Assess external factors', 'Consider tutoring resources'],
  },
  'trending_stable': {
    id: 'trending_stable',
    name: 'Trending: Stable',
    description: 'Stable trajectory - PGY3 will clarify',
    riskLevel: 'Low',
    color: '#95A5A6',
    note: 'Stable trajectory - PGY3 will clarify final archetype',
    recommendations: ['Monitor PGY3', 'Standard progression'],
  },
  'trending_variable': {
    id: 'trending_variable',
    name: 'Trending: Variable',
    description: 'Non-standard pattern - monitor closely',
    riskLevel: 'Moderate',
    color: '#7F8C8D',
    note: 'Non-standard pattern - monitor closely',
    recommendations: ['Individualized approach', 'Close monitoring'],
  },
};

// One-Year Provisional Archetypes (PGY1 only)
export const ONE_YEAR_ARCHETYPES: Record<string, ProvisionalArchetype> = {
  'potential_elite': {
    id: 'potential_elite',
    name: 'Potential: Elite',
    description: 'Strong start - many trajectories possible',
    riskLevel: 'Low',
    color: '#1ABC9C',
    note: 'Strong start - many trajectories possible including Elite Performer',
    recommendations: ['Standard monitoring', 'PGY2 will reveal trajectory direction'],
  },
  'potential_strong': {
    id: 'potential_strong',
    name: 'Potential: Strong Start',
    description: 'Above average start - watch PGY2',
    riskLevel: 'Low',
    color: '#3498DB',
    note: 'Above average start - watch PGY2 for trajectory direction',
    recommendations: ['Standard monitoring', 'PGY2 will reveal trajectory direction'],
  },
  'potential_average': {
    id: 'potential_average',
    name: 'Potential: Average Start',
    description: 'Mid-range start - multiple paths possible',
    riskLevel: 'Low',
    color: '#95A5A6',
    note: 'Mid-range start - multiple paths possible',
    recommendations: ['Watch PGY2 closely', 'Many paths possible from this starting point'],
  },
  'potential_below_average': {
    id: 'potential_below_average',
    name: 'Potential: Below Average',
    description: 'Lower start - may be Late Bloomer',
    riskLevel: 'Moderate',
    color: '#9B59B6',
    note: 'Lower start - may follow Late Bloomer trajectory',
    recommendations: ['Consider early support resources', 'May be Late Bloomer - encourage', 'PGY2 critical for trajectory'],
  },
  'potential_at_risk': {
    id: 'potential_at_risk',
    name: 'Potential: At Risk',
    description: 'Very low start - consider early support',
    riskLevel: 'High',
    color: '#E74C3C',
    note: 'Very low start - consider early support resources',
    recommendations: ['Consider early support resources', 'May be Late Bloomer - encourage', 'PGY2 critical for trajectory'],
  },
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export function getArchetypeById(id: string): ArchetypeDefinition | undefined {
  return MEMORIAL_ARCHETYPES[id];
}

export function getArchetypeByName(name: string): ArchetypeDefinition | undefined {
  return Object.values(MEMORIAL_ARCHETYPES).find(a => a.name === name);
}

export function getArchetypeColor(archetypeName: string): string {
  const archetype = getArchetypeByName(archetypeName);
  if (archetype) return archetype.color;
  
  // Check provisional archetypes
  const twoYear = Object.values(TWO_YEAR_ARCHETYPES).find(a => a.name === archetypeName);
  if (twoYear) return twoYear.color;
  
  const oneYear = Object.values(ONE_YEAR_ARCHETYPES).find(a => a.name === archetypeName);
  if (oneYear) return oneYear.color;
  
  return '#7F8C8D';
}

export function getArchetypeRisk(archetypeName: string): RiskLevel {
  const archetype = getArchetypeByName(archetypeName);
  if (archetype) return archetype.riskLevel;
  
  // Check provisional archetypes
  const twoYear = Object.values(TWO_YEAR_ARCHETYPES).find(a => a.name === archetypeName);
  if (twoYear) return twoYear.riskLevel;
  
  const oneYear = Object.values(ONE_YEAR_ARCHETYPES).find(a => a.name === archetypeName);
  if (oneYear) return oneYear.riskLevel;
  
  return 'Moderate';
}

export function getArchetypeRecommendations(archetypeName: string): string[] {
  const archetype = getArchetypeByName(archetypeName);
  if (archetype) return archetype.recommendations;
  
  // Check provisional archetypes
  const twoYear = Object.values(TWO_YEAR_ARCHETYPES).find(a => a.name === archetypeName);
  if (twoYear) return twoYear.recommendations;
  
  const oneYear = Object.values(ONE_YEAR_ARCHETYPES).find(a => a.name === archetypeName);
  if (oneYear) return oneYear.recommendations;
  
  return ['Monitor trajectory', 'Individual assessment needed'];
}

// ============================================================
// ARCHETYPE ORDERING (for classification priority)
// ============================================================

export const ARCHETYPE_CLASSIFICATION_ORDER = [
  'elite_performer',
  'elite_late_struggle',
  'breakthrough_performer',
  'peak_decline',
  'sophomore_slump_recovery',
  'continuous_decline',
  'late_bloomer',
  'steady_climber',
  'variable', // Fallback
];


