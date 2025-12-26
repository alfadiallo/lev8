// Type definitions for Difficult Conversations v2 architecture
// Based on 5-file vignette structure: clinical scenario, avatar profiles, conversation design, index, educator guide

export type UserRole = 
  | 'resident' 
  | 'faculty' 
  | 'program_director' 
  | 'assistant_program_director'
  | 'clerkship_director'
  | 'super_admin' 
  | 'admin';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type AIModel = 'gemini-1.5-pro' | 'claude-3-5-sonnet-20241022' | 'claude-3-5-haiku-20241022';

// ============================================================================
// 1. CLINICAL SCENARIO TYPES
// ============================================================================

export interface PatientDemographics {
  age: number;
  gender: string;
  identifier: string;
}

export interface VitalSigns {
  hr?: number;
  bp?: string;
  rhythm?: string;
  spo2?: string;
  rr?: number;
  temp?: string;
}

export interface EKGFindings {
  rate?: number;
  rhythm?: string;
  qrsWidth?: string;
  morphology?: string;
}

export interface PatientPresentation {
  chiefComplaint: string;
  vitals: VitalSigns;
  ekgFindings?: EKGFindings;
}

export interface ClinicalEvent {
  time: string;
  findings?: string;
  error?: string;
  reasoning?: string;
  actualDiagnosis?: string;
  medication?: string;
  route?: string;
  flush?: string;
  event?: string;
  patientStatus?: string;
  interventions?: string[];
  outcome?: string;
  location?: string;
  condition?: string;
  vitals?: string;
  neuroStatus?: string;
  prognosis?: string;
}

export interface ClinicalEvents {
  initialAssessment?: ClinicalEvent;
  misdiagnosis?: ClinicalEvent;
  intervention?: ClinicalEvent;
  complication?: ClinicalEvent;
  resuscitation?: ClinicalEvent;
  currentStatus?: ClinicalEvent;
}

export interface TimelineEvent {
  time: string;
  event: string;
}

export interface ErrorAnalysis {
  category: string;
  severity: string; // NCC MERP Index (A-I)
  preventability: string;
  contributingFactors: string[];
  systemsIssues?: string[];
}

export interface TeachingPoints {
  clinical: string[];
  communication: string[];
  systems: string[];
}

export interface ClinicalScenario {
  patient: {
    demographics: PatientDemographics;
    medicalHistory: string[];
    presentation: PatientPresentation;
  };
  clinicalEvents: ClinicalEvents;
  timeline: TimelineEvent[];
  errorAnalysis: ErrorAnalysis;
  teachingPoints: TeachingPoints;
}

// ============================================================================
// 2. AVATAR PROFILE TYPES
// ============================================================================

export interface AvatarIdentity {
  name: string;
  age?: number;
  relationship?: string;
  occupation?: string;
  appearance?: string;
}

export interface EmotionalAnchors {
  primary: string;
  secondary: string;
  tertiary: string;
}

export interface AvatarBackstory {
  context?: string;
  recentEvents?: string;
  medicalExperience?: string;
  expectations?: string;
}

export interface AvatarPsychology {
  basePersonality: string;
  medicalKnowledge: string;
  personalityTraits: string[];
  emotionalAnchors: EmotionalAnchors;
  copingMechanisms: string[];
  backstory: AvatarBackstory;
}

export interface SpeechPatterns {
  calm: string;
  stressed: string;
  angry: string;
}

export interface NonverbalCues {
  concerned: string;
  upset: string;
  devastated: string;
}

export interface CommunicationStyle {
  vocabulary: string;
  speechPatterns: SpeechPatterns;
  nonverbalCues: NonverbalCues;
}

export interface EmotionalRange {
  min: string;
  max: string;
  progression: string;
}

export interface DifficultyResponse {
  toEmpathy: string;
  toClarity: string;
  toDefensiveness: string;
}

export interface DifficultyVariation {
  traits: string;
  emotionalRange: EmotionalRange;
  triggers: string[];
  responses: DifficultyResponse;
  keyPhrases: string[];
}

export interface PrimaryAvatar {
  [key: string]: { // Key is relationship type (e.g., 'spouse', 'daughter')
    identity: AvatarIdentity;
    psychology: AvatarPsychology;
    communicationStyle: CommunicationStyle;
    difficultyVariations: {
      beginner: DifficultyVariation;
      intermediate: DifficultyVariation;
      advanced: DifficultyVariation;
    };
  };
}

export interface SupportingAvatar {
  id: string;
  name: string;
  age?: number;
  relationship?: string;
  occupation?: string;
  activationTrigger: {
    condition: string;
    threshold: number | string;
    entry: string;
  };
  personality: {
    traits: string;
    role: string;
    medicalBackground?: string;
    conflictedPosition?: string;
  };
  difficultyModifier: {
    beginner: string;
    intermediate: string;
    advanced: string;
  };
}

export interface RelationshipDynamics {
  [key: string]: {
    strength: string;
    dynamics: string;
    history?: string;
    tension?: string;
    priorExperience?: string;
    currentState?: string;
    rebuilding?: string;
  };
}

export interface AvatarProfiles {
  primaryAvatar: PrimaryAvatar;
  supportingAvatars?: SupportingAvatar[];
  relationshipDynamics?: RelationshipDynamics;
}

// ============================================================================
// 3. CONVERSATION DESIGN TYPES
// ============================================================================

export interface ConversationMetadata {
  expectedDuration: number;
  settingDescription: string;
  participantPositioning: string;
  emotionalArc: string;
}

export interface SystemGuidance {
  reminderPrompts?: string[];
}

export interface LearnerTasks {
  learnerTasks?: string[];
}

export interface AvatarState {
  emotional: string;
  expectations?: string;
  openingLine?: string;
  processing?: string;
  keyQuestions?: string[];
  copingBehaviors?: string[];
}

export interface GeminiContext {
  focus: string;
  informationLimit?: string;
  behaviorGuidance?: string;
  emotionalInflection?: string;
  informationBoundary?: string;
  adaptiveBehavior?: string;
  memoryIntegration?: string;
  expectation?: string;
  trustBuilding?: string;
}

export interface BranchPoint {
  next: string;
  emotionDelta: number;
  description: string;
}

export interface PhaseBranchPoints {
  [triggerCondition: string]: BranchPoint;
}

export interface SupportingAvatarTrigger {
  condition: string;
  threshold: number | string;
  entry: string;
}

export interface SupportingAvatarTriggers {
  [avatarId: string]: SupportingAvatarTrigger;
}

export interface ResolutionPath {
  indicators: string[];
  outcome: string;
}

export interface ResolutionPaths {
  [pathName: string]: ResolutionPath;
}

export interface ConversationPhase {
  id: string;
  name: string;
  duration: string;
  objective: string;
  criticalPhase?: boolean;
  systemGuidance?: SystemGuidance;
  learnerTasks?: string[];
  avatarState: AvatarState;
  geminiContext: GeminiContext;
  branchPoints?: PhaseBranchPoints;
  assessmentPoints?: string[];
  commonQuestions?: string[];
  supportingAvatarTriggers?: SupportingAvatarTriggers;
  resolutionPaths?: ResolutionPaths;
}

export interface EmotionalTracking {
  method: string;
  scale: {
    min: number;
    max: number;
    thresholds: {
      concerned: number;
      upset: number;
      angry: number;
      hostile: number;
    };
  };
  modifiers: {
    empathyShown: number;
    medicalJargon: number;
    defensiveness: number;
    honestApology: number;
    clearExplanation: number;
    [key: string]: number;
  };
}

export interface InformationRevelation {
  strategy: string;
  stages: string[];
}

export interface EscalationPrevention {
  maxAttempts: number;
  hintSystem: boolean;
  supportPrompts: string[];
}

export interface AdaptiveDifficulty {
  adjustmentFactors: string[];
  escalationPrevention: EscalationPrevention;
}

export interface ConversationMechanics {
  emotionalTracking: EmotionalTracking;
  informationRevelation: InformationRevelation;
  adaptiveDifficulty: AdaptiveDifficulty;
}

export interface BasePrompt {
  identity: string;
  personality: string;
  currentState: string;
}

export interface DynamicLayer {
  name: string;
  updates: string;
  integration: string;
}

export interface ResponseGuidelines {
  length: string;
  emotionalAuthenticity: string;
  questioningPattern: string;
  interruptionBehavior: string;
  silenceUsage: string;
}

export interface GeminiPromptStrategy {
  basePrompt: BasePrompt;
  dynamicLayers: DynamicLayer[];
  responseGuidelines: ResponseGuidelines;
}

export interface AssessmentHooks {
  empathy: {
    semantic: boolean;
    patterns: string[];
    antiPatterns: string[];
    weight: number;
  };
  clarity: {
    semantic: boolean;
    patterns: string[];
    antiPatterns: string[];
    weight: number;
  };
  accountability: {
    semantic: boolean;
    patterns: string[];
    antiPatterns: string[];
    weight: number;
  };
}

export interface PerformanceMetrics {
  phaseCompletion: {
    tracking: string;
    scoring: string;
  };
  emotionalManagement: {
    tracking: string;
    scoring: string;
  };
  informationDelivery: {
    tracking: string;
    scoring: string;
  };
  overallEffectiveness: {
    calculation: string;
    passingThreshold: number;
    excellenceThreshold: number;
  };
}

export interface ConversationDesign {
  conversationMetadata: ConversationMetadata;
  phases: ConversationPhase[];
  conversationMechanics: ConversationMechanics;
  geminiPromptStrategy: GeminiPromptStrategy;
  assessmentHooks: AssessmentHooks;
  performanceMetrics: PerformanceMetrics;
}

// ============================================================================
// 4. EDUCATOR GUIDE TYPES
// ============================================================================

export interface EducatorOverview {
  title: string;
  subtitle: string;
  totalDuration: string;
  setting: string;
  participants: string;
  materialsNeeded: string[];
}

export interface PreBriefing {
  duration: string;
  script: string;
  keyPoints: string[];
}

export interface ScenarioSummary {
  clinicalContext: string;
  communicationChallenge: string;
  criticalElements: string[];
}

export interface DifficultyGuidance {
  selectingDifficulty: {
    [difficulty: string]: {
      learnerProfile: string;
      spouseBehavior: string;
      emotionalIntensity: string;
      recommendation: string;
    };
  };
}

export interface ObservationPhase {
  phase: string;
  duration: string;
  watchFor: string[];
  redFlags: string[];
}

export interface ObservationGuide {
  phases: ObservationPhase[];
}

export interface DebriefPhase {
  phase: string;
  duration: string;
  opening?: string;
  followUp?: string[];
  structure?: {
    strengths: string;
    improvements: string;
    approach: string;
  };
  topics?: Array<{
    topic: string;
    points: string[];
  }>;
  prompt?: string;
}

export interface DebriefStructure {
  format: string;
  phases: DebriefPhase[];
}

export interface AssessmentCriteria {
  item: string;
  weight: string;
  indicators: string[];
}

export interface ScoringRubric {
  exemplary: string;
  proficient: string;
  developing: string;
  needsImprovement: string;
}

export interface AssessmentChecklist {
  criteria: AssessmentCriteria[];
  scoringRubric: ScoringRubric;
}

export interface CommonPitfall {
  pitfall: string;
  example: string;
  correction: string;
}

export interface ClinicalPearl {
  topic: string;
  keyPoints: string[];
}

export interface Resource {
  title: string;
  url?: string;
  description?: string;
}

export interface EducatorResources {
  preparation?: Resource[];
  additionalReading?: string[];
  followUp?: string[];
}

export interface EducatorGuide {
  overview: EducatorOverview;
  preBriefing: PreBriefing;
  scenarioSummary: ScenarioSummary;
  difficultyGuidance: DifficultyGuidance;
  observationGuide: ObservationGuide;
  debriefStructure: DebriefStructure;
  assessmentChecklist: AssessmentChecklist;
  commonPitfalls: CommonPitfall[];
  clinicalPearls: ClinicalPearl[];
  resources: EducatorResources;
  keyTakeaway: string;
}

// ============================================================================
// 5. REGISTRY ENTRY (INDEX) TYPES
// ============================================================================

export interface LearningObjective {
  id: string;
  category: string;
  objective: string;
}

export interface AssessmentWeights {
  empathy: number;
  clarity: number;
  accountability: number;
  [key: string]: number;
}

export interface CompletionCriteria {
  minimumDuration: number;
  phasesCompleted: string[];
  assessmentSubmitted: boolean;
}

export interface Customizable {
  institutionPolicies: boolean;
  localProtocols: boolean;
  culturalAdaptation: boolean;
}

export interface VignetteV2 {
  // Identification
  id: string;
  category: string;
  subcategory?: string;
  version: number;

  // Human-readable information
  title: string;
  shortTitle?: string;
  description: string;

  // Clinical components
  clinicalData: ClinicalScenario;
  avatars: AvatarProfiles;
  conversation: ConversationDesign;
  educatorResources: EducatorGuide;

  // Metadata
  difficulty: Difficulty[];
  estimatedDuration: number;
  debriefDuration?: number;
  totalSessionTime?: number;

  // Educational alignment
  learningObjectives: LearningObjective[];
  prerequisites?: string[];
  tags?: string[];
  clinicalContext?: string[];
  relatedVignettes?: string[];
  suggestedPreparation?: string[];

  // Tracking
  createdDate?: string;
  lastModified?: string;
  authors?: string[];
  reviewers?: string[];

  // Technical settings
  aiModel: AIModel;
  responseStyle?: string;
  maxResponseLength?: number;

  // Assessment configuration
  assessmentWeights: AssessmentWeights;
  passingScore: number;
  excellenceScore: number;

  // Completion tracking
  completionCriteria: CompletionCriteria;

  // Institutional customization flags
  customizable: Customizable;
}

// ============================================================================
// 6. CONVERSATION ENGINE TYPES
// ============================================================================

export interface EmotionalState {
  value: number; // 0-1 scale
  history: Array<{
    timestamp: Date;
    value: number;
    modifier?: string;
    reason?: string;
  }>;
  currentThreshold: 'concerned' | 'upset' | 'angry' | 'hostile';
}

export interface PhaseState {
  currentPhaseId: string;
  phaseStartTime: Date;
  objectivesCompleted: string[];
  objectivesPending: string[];
  timeInPhase: number; // seconds
}

export interface BranchPath {
  phaseId: string;
  branchTrigger: string;
  timestamp: Date;
}

export interface ConversationSessionState {
  vignetteId: string;
  difficulty: Difficulty;
  currentPhase: PhaseState;
  emotionalState: EmotionalState;
  branchPath: BranchPath[];
  messages: Message[];
  revealedInformation: string[];
  assessmentScores: {
    empathy: number;
    clarity: number;
    accountability: number;
    overall: number;
  };
  startedAt: Date;
  lastUpdated: Date;
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

export interface ConversationContext {
  vignette: VignetteV2;
  sessionState: ConversationSessionState;
  currentPhase: ConversationPhase;
  primaryAvatar: {
    identity: AvatarIdentity;
    psychology: AvatarPsychology;
    communicationStyle: CommunicationStyle;
    difficultyVariation: DifficultyVariation;
  };
}

export interface ConversationResponse {
  response: string;
  text?: string; // Alias for response (for compatibility)
  emotion?: string;
  emotionDelta?: number;
  shouldEscalate?: boolean;
  phaseTransition?: {
    from: string;
    to: string;
    reason: string;
  };
  assessmentUpdate?: {
    empathy?: number;
    clarity?: number;
    accountability?: number;
    overall?: number;
  };
}

// ============================================================================
// 7. ASSESSMENT TYPES
// ============================================================================

export interface PatternMatch {
  pattern: string;
  matched: boolean;
  confidence: number;
  context: string;
}

export interface AssessmentResult {
  empathy: {
    score: number;
    patterns: PatternMatch[];
    antiPatterns: PatternMatch[];
  };
  clarity: {
    score: number;
    patterns: PatternMatch[];
    antiPatterns: PatternMatch[];
  };
  accountability: {
    score: number;
    patterns: PatternMatch[];
    antiPatterns: PatternMatch[];
  };
  overall: number;
  timestamp: Date;
}

// ============================================================================
// 8. MODEL PROVIDER TYPES
// ============================================================================

export interface ConversationProvider {
  getResponse(
    message: string,
    context: ConversationContext,
    history: Message[]
  ): Promise<ConversationResponse>;
  
  streamResponse?(
    message: string,
    context: ConversationContext,
    history: Message[],
    onChunk: (chunk: string) => void
  ): Promise<void>;
}

export interface ProviderConfig {
  model: AIModel;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

