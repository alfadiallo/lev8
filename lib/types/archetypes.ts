// ============================================================
// ITE Archetype Types - v3
// Memorial Healthcare System
// ============================================================

// Re-export from memorial-archetypes for backwards compatibility
export { 
  type RiskLevel,
  type ArchetypeCriteria,
  type ArchetypeProfile,
  type ArchetypeDefinition,
  type ProvisionalArchetype,
  MEMORIAL_ARCHETYPES,
  TWO_YEAR_ARCHETYPES,
  ONE_YEAR_ARCHETYPES,
  getArchetypeById,
  getArchetypeByName,
  getArchetypeColor,
  getArchetypeRisk,
  getArchetypeRecommendations,
  ARCHETYPE_CLASSIFICATION_ORDER
} from '@/lib/archetypes/memorial-archetypes';

// Re-export from memorial-classifier
export {
  type ClassificationInput,
  type ClassificationMetrics,
  type ClassificationResult,
  type SimilarResident,
  type FullClassificationResult,
  MemorialArchetypeClassifier,
  classifyResident,
  createMemorialClassifier,
  memorialClassifier
} from '@/lib/archetypes/memorial-classifier';

// ============================================================
// METHODOLOGY VERSION TYPES
// ============================================================

export interface MethodologyVersion {
  id: string;
  version: string;              // Semantic versioning: "1.0.0"
  name: string;                 // Human-friendly: "Memorial Baseline"
  effectiveDate: string;        // ISO date when this became active
  retiredDate?: string | null;  // ISO date when superseded (null if current)
  isCurrent: boolean;
  
  // What changed in this version
  changelog: string[];
  
  // The archetype definitions at this version
  archetypes: ArchetypeDefinitionV[];
  
  // Statistical basis
  basedOnResidents: number;     // How many residents informed this
  basedOnClasses: number[];     // Which graduating classes
  
  // Validation metrics (populated after outcomes known)
  accuracyRate?: number;        // % correctly predicted outcomes
  interRaterAgreement?: number; // Faculty agreement with system
  
  createdAt: string;
}

export interface ArchetypeDefinitionV {
  id: string;
  name: string;
  description?: string;
  criteria: Record<string, { min?: number; max?: number }>;
  riskLevel: 'Low' | 'Moderate' | 'High';
  color: string;
  exemplars?: string[];
  recommendations?: string[];
}

// ============================================================
// RESIDENT CLASSIFICATION TYPES
// ============================================================

export interface ResidentClassification {
  id: string;
  residentId: string;
  residentName?: string;
  graduationYear?: number;
  
  // The scores (immutable facts)
  scores: {
    pgy1: number | null;
    pgy2: number | null;
    pgy3: number | null;
  };
  
  // Computed deltas
  delta12: number | null;
  delta23: number | null;
  deltaTotal: number | null;
  
  // How many years of data
  dataYears: number;
  
  // Original classification (NEVER changes)
  originalClassification: {
    archetypeId: string;
    archetypeName: string;
    confidence: number;
    riskLevel: string;
    isProvisional: boolean;
    methodologyVersion: string;
    classifiedAt: string;
    classifiedBy: 'system' | string;
    note?: string;
  };
  
  // Current classification (updates when methodology evolves)
  currentClassification: {
    archetypeId: string;
    archetypeName: string;
    confidence: number;
    riskLevel: string;
    isProvisional: boolean;
    methodologyVersion: string;
    lastUpdated: string;
    note?: string;
  };
  
  // Recommendations
  recommendations: string[];
  
  // Alternatives considered
  alternatives: Array<{
    archetypeId: string;
    archetypeName: string;
    confidence: number;
  }>;
  
  // Similar residents
  similarResidents: SimilarResidentV3[];
  
  // History of all classifications
  classificationHistory: ClassificationHistoryEntry[];
  
  // Has classification changed across versions?
  hasVersionDrift: boolean;
  driftReason?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface SimilarResidentV3 {
  id: string;
  name: string;
  classYear: number;
  similarityScore: number;
  iteScores: {
    pgy1: number | null;
    pgy2: number | null;
    pgy3: number | null;
  };
  archetype?: string;
  outcomes?: {
    boardScore?: number;
    passedBoards?: boolean;
  };
}

export interface ClassificationHistoryEntry {
  id: string;
  archetypeId: string;
  archetypeName: string;
  confidence: number;
  riskLevel: string;
  isProvisional: boolean;
  methodologyVersion: string;
  dataYears: number;
  trigger: 'initial' | 'pgy2_score_added' | 'pgy3_score_added' | 'methodology_update' | 'faculty_override' | 'retrospective_analysis';
  triggeredBy: string;
  notes?: string;
  createdAt: string;
}

// ============================================================
// EVOLUTION TRIGGER TYPES
// ============================================================

export interface EvolutionTrigger {
  id: string;
  type: 'annual_review' | 'threshold_breach' | 'pattern_discovery' | 'outcome_feedback';
  triggeredAt: string;
  details: string;
  recommendation: string;
  affectedResidents?: string[];
  supportingMetrics?: Record<string, unknown>;
  status: 'pending' | 'under_review' | 'implemented' | 'dismissed';
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resultingVersion?: string;
}

export interface PatternCluster {
  id: string;
  delta12Bucket: number;
  delta23Bucket: number;
  suggestedName: string;
  residents: string[];
  memberCount: number;
  centroid: {
    avgPgy1: number;
    avgPgy2: number;
    avgPgy3: number;
    avgDelta12: number;
    avgDelta23: number;
  };
  status: 'detected' | 'under_review' | 'promoted' | 'dismissed';
  promotedToArchetype?: string;
  promotedInVersion?: string;
}

// ============================================================
// OUTCOME TYPES
// ============================================================

export interface ClassificationOutcome {
  id: string;
  residentId: string;
  classificationId?: string;
  passedBoards?: boolean;
  boardScore?: number;
  attempts: number;
  careerPath?: string;
  archetypeAtOutcome: string;
  methodologyVersionAtOutcome: string;
  archetypeWasPredictive?: boolean;
  createdAt: string;
}

// ============================================================
// LEGACY COMPATIBILITY
// Keep old enum for backwards compatibility during migration
// ============================================================

export enum ArchetypeName {
  // Complete (3-year) archetypes
  ELITE_PERFORMER = 'Elite Performer',
  ELITE_LATE_STRUGGLE = 'Elite → Late Struggle',
  BREAKTHROUGH_PERFORMER = 'Breakthrough Performer',
  PEAK_DECLINE = 'Peak & Decline',
  SOPHOMORE_SLUMP_RECOVERY = 'Sophomore Slump → Strong Recovery',
  LATE_BLOOMER = 'Late Bloomer',
  STEADY_CLIMBER = 'Steady Climber',
  CONTINUOUS_DECLINE = 'Continuous Decline',
  VARIABLE = 'Variable',
  
  // Provisional (2-year)
  TRENDING_PEAK = 'Trending: Peak (monitor PGY3)',
  TRENDING_SLUMP = 'Trending: Sophomore Slump',
  TRENDING_LATE_BLOOMER = 'Trending: Late Bloomer',
  TRENDING_DECLINE = 'Trending: Decline Risk',
  TRENDING_STABLE = 'Trending: Stable',
  TRENDING_VARIABLE = 'Trending: Variable',
  
  // Provisional (1-year)
  POTENTIAL_ELITE = 'Potential: Elite',
  POTENTIAL_STRONG = 'Potential: Strong Start',
  POTENTIAL_AVERAGE = 'Potential: Average Start',
  POTENTIAL_BELOW_AVERAGE = 'Potential: Below Average',
  POTENTIAL_AT_RISK = 'Potential: At Risk',
  
  // No data
  AWAITING_DATA = 'Awaiting Data',
  UNCLASSIFIED = 'Unclassified',
  
  // Legacy names (for migration)
  EARLY_SURGE = 'Early Surge',
  HIGH_PERFORMER = 'High Performer',
  PLATEAU = 'Plateau',
  DECLINING = 'Declining',
  AT_RISK = 'At-Risk'
}

// Legacy type exports for backwards compatibility
export const DEFAULT_ARCHETYPE_DEFINITIONS = Object.values(MEMORIAL_ARCHETYPES).map(a => ({
  name: a.name as ArchetypeName,
  description: a.description,
  risk_level: a.riskLevel,
  pgy1_range: [a.criteria.pgy1?.min ?? null, a.criteria.pgy1?.max ?? null] as [number | null, number | null],
  pgy2_range: [a.criteria.pgy2?.min ?? null, a.criteria.pgy2?.max ?? null] as [number | null, number | null],
  delta_range: [a.criteria.delta12?.min ?? null, a.criteria.delta12?.max ?? null] as [number | null, number | null],
  color_hex: a.color
}));
