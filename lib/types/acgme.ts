// ACGME Expectations Module Types

export type RequirementScope = 'UNIVERSAL' | 'EM_SPECIFIC' | 'FELLOWSHIP';
export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low';
export type RequirementOwner = 'DIO' | 'PD' | 'PC' | 'APD' | 'Faculty' | 'Resident';

export type ComplianceStatus = 'compliant' | 'at_risk' | 'non_compliant' | 'not_assessed' | 'not_applicable';
export type EvidenceType = 'document' | 'policy' | 'meeting_minutes' | 'survey_result' | 'attestation' | 'screenshot' | 'other';
export type ActionPriority = 'urgent' | 'high' | 'medium' | 'low';
export type ActionStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type VisitType = 'initial' | 'continued' | 'focused' | 'self_study';
export type VisitOutcome = 'continued_accreditation' | 'continued_with_warning' | 'probation' | 'withdrawal' | 'pending';
export type CitationSeverity = 'citation' | 'area_for_improvement' | 'concern';
export type CitationResolution = 'pending' | 'submitted' | 'accepted' | 'requires_followup' | 'resolved';

// ACGME Requirement from master catalog
export interface ACGMERequirement {
  id: string; // e.g., "CPR-1.1"
  scope: RequirementScope;
  section: string;
  category: string;
  title: string;
  text: string;
  risk_level: RiskLevel;
  owner: RequirementOwner;
  compliance_logic?: string;
  evidence_needed?: string;
  source_file?: string;
  parent_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Program's compliance status for a requirement
export interface ProgramComplianceStatus {
  id: string;
  program_id: string;
  requirement_id: string;
  status: ComplianceStatus;
  assessment_date: string;
  next_review_date?: string;
  assessed_by?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  
  // Joined data
  requirement?: ACGMERequirement;
  evidence?: ComplianceEvidence[];
  action_items?: ActionItem[];
}

// Evidence supporting compliance
export interface ComplianceEvidence {
  id: string;
  compliance_status_id: string;
  evidence_type: EvidenceType;
  title: string;
  description?: string;
  file_path?: string;
  file_type?: string;
  file_size_bytes?: number;
  external_url?: string;
  effective_date?: string;
  expiration_date?: string;
  uploaded_by?: string;
  created_at?: string;
  updated_at?: string;
}

// Action item for remediation
export interface ActionItem {
  id: string;
  compliance_status_id: string;
  title: string;
  description?: string;
  priority: ActionPriority;
  status: ActionStatus;
  assigned_to?: string;
  due_date?: string;
  completed_date?: string;
  completion_notes?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  
  // Joined data
  assigned_user?: {
    full_name: string;
    email: string;
  };
}

// Compliance history entry
export interface ComplianceHistory {
  id: string;
  compliance_status_id: string;
  previous_status?: string;
  new_status: string;
  changed_by?: string;
  change_reason?: string;
  created_at: string;
  
  // Joined data
  changed_by_user?: {
    full_name: string;
  };
}

// Site visit record
export interface SiteVisit {
  id: string;
  program_id: string;
  visit_type: VisitType;
  visit_date: string;
  outcome?: VisitOutcome;
  next_visit_date?: string;
  citations_count: number;
  areas_for_improvement?: string[];
  commendations?: string[];
  report_file_path?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  
  // Joined data
  citations?: Citation[];
}

// Citation from site visit
export interface Citation {
  id: string;
  site_visit_id: string;
  requirement_id: string;
  citation_text: string;
  severity: CitationSeverity;
  response_due_date?: string;
  response_submitted_date?: string;
  response_text?: string;
  resolution_status?: CitationResolution;
  created_at?: string;
  updated_at?: string;
  
  // Joined data
  requirement?: ACGMERequirement;
}

// Dashboard summary statistics
export interface ComplianceSummary {
  total_requirements: number;
  compliant_count: number;
  at_risk_count: number;
  non_compliant_count: number;
  not_assessed_count: number;
  compliance_percentage: number;
}

// Category breakdown
export interface CategoryCompliance {
  category: string;
  total: number;
  compliant: number;
  at_risk: number;
  non_compliant: number;
  not_assessed: number;
}

// Upcoming deadline
export interface UpcomingDeadline {
  deadline_type: 'action_item' | 'evidence_expiring';
  title: string;
  due_date: string;
  requirement_id: string;
  requirement_title: string;
  priority: ActionPriority;
}

// Status badge configuration
export const STATUS_CONFIG: Record<ComplianceStatus, { label: string; color: string; bgColor: string }> = {
  compliant: { label: 'Compliant', color: '#059669', bgColor: '#D1FAE5' },
  at_risk: { label: 'At Risk', color: '#D97706', bgColor: '#FEF3C7' },
  non_compliant: { label: 'Non-Compliant', color: '#DC2626', bgColor: '#FEE2E2' },
  not_assessed: { label: 'Not Assessed', color: '#6B7280', bgColor: '#F3F4F6' },
  not_applicable: { label: 'N/A', color: '#9CA3AF', bgColor: '#F9FAFB' },
};

export const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bgColor: string }> = {
  Critical: { label: 'Critical', color: '#DC2626', bgColor: '#FEE2E2' },
  High: { label: 'High', color: '#EA580C', bgColor: '#FFEDD5' },
  Medium: { label: 'Medium', color: '#D97706', bgColor: '#FEF3C7' },
  Low: { label: 'Low', color: '#059669', bgColor: '#D1FAE5' },
};

export const PRIORITY_CONFIG: Record<ActionPriority, { label: string; color: string; bgColor: string }> = {
  urgent: { label: 'Urgent', color: '#DC2626', bgColor: '#FEE2E2' },
  high: { label: 'High', color: '#EA580C', bgColor: '#FFEDD5' },
  medium: { label: 'Medium', color: '#D97706', bgColor: '#FEF3C7' },
  low: { label: 'Low', color: '#059669', bgColor: '#D1FAE5' },
};

export const OWNER_LABELS: Record<RequirementOwner, string> = {
  DIO: 'Designated Institutional Official',
  PD: 'Program Director',
  PC: 'Program Coordinator',
  APD: 'Associate Program Director',
  Faculty: 'Faculty',
  Resident: 'Resident',
};

export const CATEGORY_ORDER = [
  'Oversight',
  'Personnel',
  'Recruitment',
  'Curriculum',
  'Evaluation',
  'Learning Environment',
  'Scholarly Activity',
  'Quality Improvement',
];


