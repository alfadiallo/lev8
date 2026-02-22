'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Loader2, Save, AlertCircle, Heart, Award, Brain, Edit2, RefreshCw, ArrowUpDown } from 'lucide-react';
import ScoreRangeKey from '@/components/eqpqiq/analytics/ScoreRangeKey';
import ScoreCard from '@/components/eqpqiq/analytics/ScoreCard';

// ============================================================================
// Types
// ============================================================================

interface SurveyData {
  survey: {
    id: string;
    type: string;
    title: string;
    description: string | null;
    deadline: string | null;
    period_label: string | null;
    academic_year: string | null;
    program: { id: string; name: string; specialty: string } | null;
    settings: Record<string, unknown>;
  };
  respondent: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    rater_type: string | null;
    guidance_min: number | null;
    status: string;
    progress_data: ProgressData | null;
  };
  residents: ResidentInfo[];
  self_resident: { id: string; assignment_id: string; full_name: string } | null;
  existing_scores?: Record<string, Record<string, number | string | null>>;
  framework?: {
    id: string;
    name: string;
    version: number;
    score_min: number;
    score_max: number;
    score_step: number;
    pillars: Array<{
      id: string;
      name: string;
      slug: string;
      description: string | null;
      color: string | null;
      display_order: number;
      attributes: Array<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        display_order: number;
        tags: string[];
        category: string | null;
      }>;
    }>;
  } | null;
}

interface ResidentInfo {
  id: string;
  display_order: number;
  assignment_id: string;
  assignment_status: string;
  full_name: string;
  email: string;
  graduation_year: number | null;
}

interface ProgressData {
  current_section?: string;
  current_resident_index?: number;
  completed_sections?: string[];
  completed_residents?: string[];
  partial_scores?: Record<string, Record<string, number>>;
}

interface ScoreValues {
  eq_empathy_positive_interactions: number;
  eq_adaptability_self_awareness: number;
  eq_stress_management_resilience: number;
  eq_curiosity_growth_mindset: number;
  eq_effectiveness_communication: number;
  pq_work_ethic_reliability: number;
  pq_integrity_accountability: number;
  pq_teachability_receptiveness: number;
  pq_documentation: number;
  pq_leadership_relationships: number;
  iq_knowledge_base: number;
  iq_analytical_thinking: number;
  iq_commitment_learning: number;
  iq_clinical_flexibility: number;
  iq_performance_for_level: number;
}

// ============================================================================
// Theme & Attribute Definitions
// ============================================================================

const COLORS = {
  lightest: '#D8F3DC',
  light: '#B7E4C7',
  medium: '#74C69D',
  dark: '#40916C',
  darker: '#2D6A4F',
  veryDark: '#1B4332',
};

const SECTION_ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  eq: Heart,
  pq: Award,
  iq: Brain,
};

const SECTIONS = [
  {
    id: 'eq',
    title: 'Emotional Quotient (EQ)',
    subtitle: 'Interpersonal & Intrapersonal Skills',
    hex: '#EF4444',
    hexText: '#DC2626',
    hexBg: '#FEF2F2',
    attributes: [
      { key: 'eq_empathy_positive_interactions', label: 'Empathy & Positive Interactions', desc: 'Patient/family rapport, compassionate care' },
      { key: 'eq_adaptability_self_awareness', label: 'Adaptability & Self-Awareness', desc: 'Flexibility, insight into strengths/weaknesses' },
      { key: 'eq_stress_management_resilience', label: 'Stress Management & Resilience', desc: 'Performance under pressure, emotional regulation' },
      { key: 'eq_curiosity_growth_mindset', label: 'Curiosity & Growth Mindset', desc: 'Learning drive, seeking improvement' },
      { key: 'eq_effectiveness_communication', label: 'Effective Communication', desc: 'Team communication, handoffs, presentations' },
    ],
  },
  {
    id: 'pq',
    title: 'Professional Quotient (PQ)',
    subtitle: 'Professional Decorum & Leadership',
    hex: '#2563EB',
    hexText: '#1D4ED8',
    hexBg: '#EFF6FF',
    attributes: [
      { key: 'pq_work_ethic_reliability', label: 'Work Ethic & Reliability', desc: 'Dedication, punctuality, follow-through' },
      { key: 'pq_integrity_accountability', label: 'Integrity & Accountability', desc: 'Ethics, honesty, ownership of mistakes' },
      { key: 'pq_teachability_receptiveness', label: 'Teachability & Receptiveness', desc: 'Accepting feedback, implementing suggestions' },
      { key: 'pq_documentation', label: 'Clear & Timely Documentation', desc: 'Charting quality, completeness, timeliness' },
      { key: 'pq_leadership_relationships', label: 'Leadership & Relationships', desc: 'Team dynamics, leadership potential' },
    ],
  },
  {
    id: 'iq',
    title: 'Intellectual Quotient (IQ)',
    subtitle: 'Clinical Acumen & Critical Thinking',
    hex: '#7C3AED',
    hexText: '#6D28D9',
    hexBg: '#F5F3FF',
    attributes: [
      { key: 'iq_knowledge_base', label: 'Strong Knowledge Base', desc: 'Medical knowledge breadth and depth' },
      { key: 'iq_analytical_thinking', label: 'Analytical Thinking', desc: 'Clinical reasoning, differential diagnosis' },
      { key: 'iq_commitment_learning', label: 'Commitment to Learning', desc: 'Acquiring new information, staying current' },
      { key: 'iq_clinical_flexibility', label: 'Clinical Flexibility', desc: 'Adjusting approach based on new information' },
      { key: 'iq_performance_for_level', label: 'Performance for Level', desc: 'Overall clinical performance relative to peers' },
    ],
  },
];

const DEFAULT_SCORES: ScoreValues = {
  eq_empathy_positive_interactions: 50,
  eq_adaptability_self_awareness: 50,
  eq_stress_management_resilience: 50,
  eq_curiosity_growth_mindset: 50,
  eq_effectiveness_communication: 50,
  pq_work_ethic_reliability: 50,
  pq_integrity_accountability: 50,
  pq_teachability_receptiveness: 50,
  pq_documentation: 50,
  pq_leadership_relationships: 50,
  iq_knowledge_base: 50,
  iq_analytical_thinking: 50,
  iq_commitment_learning: 50,
  iq_clinical_flexibility: 50,
  iq_performance_for_level: 50,
};

// ============================================================================
// Custom Filled-Bar Slider (matches portal design)
// ============================================================================

function getSliderColor(value: number) {
  if (value < 33) return COLORS.medium;
  if (value < 66) return COLORS.dark;
  return COLORS.darker;
}

function CompactSlider({
  label,
  value,
  onChange,
  hasError,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hasError?: boolean;
}) {
  const fillColor = getSliderColor(value);

  return (
    <div className={`px-5 py-3 ${hasError ? 'bg-red-50/50' : ''}`}>
      <div className="flex items-baseline justify-between mb-0.5">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <span className="text-lg font-bold shrink-0 ml-3" style={{ color: COLORS.dark }}>{value}</span>
      </div>
      <div className="relative h-7 flex items-center">
        <div className="absolute w-full h-3 rounded-full" style={{ backgroundColor: COLORS.lightest }} />
        {value > 0 && (
          <div
            className="absolute h-3 rounded-full transition-all duration-150"
            style={{ width: `${Math.max(value, 3)}%`, backgroundColor: fillColor }}
          />
        )}
        <div
          className="absolute w-5 h-5 rounded-full bg-white shadow-md transition-all duration-150 pointer-events-none"
          style={{ left: `${value}%`, transform: 'translateX(-50%)', border: `2.5px solid ${fillColor}` }}
        />
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="absolute w-full h-7 appearance-none bg-transparent cursor-pointer z-10
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-transparent
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-transparent
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:cursor-pointer"
        />
      </div>
      {hasError && (
        <p className="text-xs text-red-500 mt-0.5">Please rate this attribute</p>
      )}
    </div>
  );
}

// ============================================================================
// Section Ref Helper for Scroll-To
// ============================================================================

// ============================================================================
// Main Survey Page
// ============================================================================

export default function SurveyPage() {
  const params = useParams();
  const token = params.token as string;

  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  // Form state
  const [scores, setScores] = useState<ScoreValues>({ ...DEFAULT_SCORES });
  const [comments, setComments] = useState('');
  const [currentSection, setCurrentSection] = useState(0);
  const [currentResidentIndex, setCurrentResidentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Faculty type detection
  const isTeachingFaculty = surveyData?.respondent.rater_type === 'teaching_faculty';
  const isCoreFaculty = surveyData?.respondent.rater_type === 'core_faculty';
  const isFacultyMultiResident = isTeachingFaculty || isCoreFaculty;

  // Multi-resident state (core + teaching faculty)
  const [allScores, setAllScores] = useState<Record<string, ScoreValues>>({});
  const [allComments, setAllComments] = useState<Record<string, string>>({});
  const [showSummary, setShowSummary] = useState(false);
  const [submittedResidents, setSubmittedResidents] = useState<Set<string>>(new Set());
  const [expandedResident, setExpandedResident] = useState<string | null>(null);
  const [initialSubmittedAll, setInitialSubmittedAll] = useState(false);
  const [hasScoreChanges, setHasScoreChanges] = useState(false);
  const [snapshotScores, setSnapshotScores] = useState<Record<string, ScoreValues>>({});
  const [summarySortMode, setSummarySortMode] = useState<'original' | 'a-z' | 'z-a' | 'score-high' | 'score-low'>('original');
  const [showWelcome, setShowWelcome] = useState(false);

  // Dynamic sections: use framework data if available, else fall back to hardcoded SECTIONS
  const PILLAR_COLORS: Record<string, { hex: string; hexText: string; hexBg: string }> = {
    eq: { hex: '#EF4444', hexText: '#DC2626', hexBg: '#FEF2F2' },
    pq: { hex: '#2563EB', hexText: '#1D4ED8', hexBg: '#EFF6FF' },
    iq: { hex: '#7C3AED', hexText: '#6D28D9', hexBg: '#F5F3FF' },
  };
  const DEFAULT_PILLAR_STYLE = { hex: '#6366F1', hexText: '#4F46E5', hexBg: '#EEF2FF' };

  const activeSections = surveyData?.framework
    ? surveyData.framework.pillars.map(pillar => {
        const style = PILLAR_COLORS[pillar.slug] || DEFAULT_PILLAR_STYLE;
        return {
          id: pillar.slug,
          title: pillar.name,
          subtitle: pillar.description || '',
          ...style,
          attributes: pillar.attributes.map(attr => ({
            key: attr.slug,
            label: attr.name,
            desc: attr.description || '',
          })),
        };
      })
    : SECTIONS;

  // ========================================================================
  // Load survey data
  // ========================================================================
  useEffect(() => {
    async function loadSurvey() {
      try {
        const res = await fetch(`/api/surveys/respond/${token}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || 'Failed to load survey');
          return;
        }
        const data: SurveyData = await res.json();
        setSurveyData(data);

        // Restore progress if available
        if (data.respondent.progress_data) {
          const progress = data.respondent.progress_data;
          if (progress.current_section) {
            const sections = data.framework
              ? data.framework.pillars.map(p => p.slug)
              : SECTIONS.map(s => s.id);
            const idx = sections.indexOf(progress.current_section);
            if (idx >= 0) setCurrentSection(idx);
          }
          if (progress.current_resident_index !== undefined) {
            setCurrentResidentIndex(progress.current_resident_index);
          }
          // Restore partial scores for the current resident
          if (progress.partial_scores) {
            const residentId = data.survey.type === 'learner_self_assessment'
              ? data.self_resident?.id
              : data.residents[progress.current_resident_index ?? 0]?.id;
            if (residentId && progress.partial_scores[residentId]) {
              const restored = progress.partial_scores[residentId];
              setScores(prev => ({ ...prev, ...restored }));
              setTouchedFields(new Set(Object.keys(restored)));
            }
          }
        }

        // Pre-fill scores from existing ratings (post-submit editing)
        if (data.existing_scores) {
          // Populate allScores/allComments for all previously-submitted residents
          const restoredAll: Record<string, ScoreValues> = {};
          const restoredComments: Record<string, string> = {};
          const restoredSubmitted = new Set<string>();
          for (const [resId, existing] of Object.entries(data.existing_scores)) {
            const numericScores: Partial<ScoreValues> = {};
            for (const [key, val] of Object.entries(existing)) {
              if (key !== 'comments' && typeof val === 'number') {
                numericScores[key as keyof ScoreValues] = val;
              }
            }
            if (Object.keys(numericScores).length > 0) {
              restoredAll[resId] = { ...DEFAULT_SCORES, ...numericScores };
              restoredSubmitted.add(resId);
            }
            if (typeof existing.comments === 'string') {
              restoredComments[resId] = existing.comments;
            }
          }
          setAllScores(restoredAll);
          setAllComments(restoredComments);
          setSubmittedResidents(restoredSubmitted);

          // Snapshot scores at load time for change detection
          const snapshot: Record<string, ScoreValues> = {};
          for (const [id, s] of Object.entries(restoredAll)) {
            snapshot[id] = { ...s };
          }
          setSnapshotScores(snapshot);
          if (restoredSubmitted.size === data.residents.length) {
            setInitialSubmittedAll(true);
          }

          // For faculty multi-resident (core + teaching), set up navigation
          const isFacMulti = (data.respondent.rater_type === 'core_faculty' || data.respondent.rater_type === 'teaching_faculty')
            && data.residents.length > 1;
          if (isFacMulti) {
            const firstPending = data.residents.findIndex(r => r.assignment_status !== 'completed');
            const startIdx = firstPending >= 0 ? firstPending : 0;
            setCurrentResidentIndex(startIdx);
            const startId = data.residents[startIdx]?.id;
            if (startId && restoredAll[startId]) {
              setScores({ ...restoredAll[startId] });
              setTouchedFields(new Set(Object.keys(restoredAll[startId])));
              setComments(restoredComments[startId] || '');
            }
            if (restoredSubmitted.size > 0 || firstPending < 0) {
              // Returning user: go straight to summary
              setShowSummary(true);
            } else if (data.respondent.rater_type === 'teaching_faculty') {
              // First-time teaching faculty: show welcome screen
              setShowWelcome(true);
              setShowSummary(true);
            } else {
              // First-time core faculty: start rating immediately
            }
          } else {
            // Self-assessment or single-resident
            const residentId = data.survey.type === 'learner_self_assessment'
              ? data.self_resident?.id
              : data.residents[0]?.id;
            if (residentId && restoredAll[residentId]) {
              setScores({ ...restoredAll[residentId] });
              setTouchedFields(new Set(Object.keys(restoredAll[residentId])));
              setComments(restoredComments[residentId] || '');
            }
          }
        }

        if (data.respondent.status === 'completed') {
          // Faculty multi-resident: show summary page so they can review/edit
          const isFacMulti = (data.respondent.rater_type === 'core_faculty' || data.respondent.rater_type === 'teaching_faculty')
            && data.residents.length > 1;
          if (isFacMulti) {
            setShowSummary(true);
          } else {
            setCompleted(true);
          }
        }
      } catch {
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    }
    loadSurvey();
  }, [token]);

  // ========================================================================
  // Auto-save progress
  // ========================================================================
  const saveProgress = useCallback(async () => {
    if (!surveyData || completed) return;

    setSaving(true);
    try {
      // Merge current scores into allScores for a complete snapshot
      const currentId = getCurrentResidentId();
      const mergedScores: Record<string, Record<string, number>> = {};
      for (const [id, s] of Object.entries(allScores)) {
        mergedScores[id] = s as unknown as Record<string, number>;
      }
      if (currentId) {
        mergedScores[currentId] = scores as unknown as Record<string, number>;
      }

      const progressData: ProgressData = {
        current_section: activeSections[currentSection]?.id || 'eq',
        current_resident_index: currentResidentIndex,
        partial_scores: mergedScores,
      };

      await fetch(`/api/surveys/respond/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_progress', progress_data: progressData }),
      });

      setLastSaved(new Date());
    } catch {
      // Silently fail -- auto-save is best-effort
    } finally {
      setSaving(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, currentSection, currentResidentIndex, scores, surveyData, completed, allScores]);

  // Auto-save on section change
  useEffect(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(saveProgress, 3000);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [scores, currentSection, saveProgress]);

  // ========================================================================
  // Helpers
  // ========================================================================
  function getCurrentResidentId(): string {
    if (!surveyData) return '';
    if (surveyData.survey.type === 'learner_self_assessment') {
      return surveyData.self_resident?.id || '';
    }
    return surveyData.residents[currentResidentIndex]?.id || '';
  }

  function getCurrentResidentName(): string {
    if (!surveyData) return '';
    if (surveyData.survey.type === 'learner_self_assessment') {
      return surveyData.self_resident?.full_name || surveyData.respondent.name || '';
    }
    return surveyData.residents[currentResidentIndex]?.full_name || '';
  }

  function getCurrentAssignmentId(): string {
    if (!surveyData) return '';
    if (surveyData.survey.type === 'learner_self_assessment') {
      return surveyData.self_resident?.assignment_id || '';
    }
    return surveyData.residents[currentResidentIndex]?.assignment_id || '';
  }

  function getSectionAverage(sectionIndex: number): number {
    const section = activeSections[sectionIndex];
    if (!section) return 0;
    const sum = section.attributes.reduce(
      (acc, attr) => acc + (scores[attr.key as keyof ScoreValues] || 0),
      0
    );
    return sum / section.attributes.length;
  }

  function getSectionAverageForScores(sectionIndex: number, s: ScoreValues): number {
    const section = activeSections[sectionIndex];
    if (!section) return 0;
    const sum = section.attributes.reduce(
      (acc, attr) => acc + (s[attr.key as keyof ScoreValues] || 0),
      0
    );
    return sum / section.attributes.length;
  }

  function getOverallForScores(s: ScoreValues): number {
    if (activeSections.length === 0) return 0;
    return activeSections.reduce((sum, _, idx) => sum + getSectionAverageForScores(idx, s), 0) / activeSections.length;
  }

  function formatResidentClass(graduationYear: number | null): string {
    if (!graduationYear) return '';
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    // Graduated if graduation year is past (after June 30 of that year)
    const hasGraduated = currentYear > graduationYear || (currentYear === graduationYear && currentMonth >= 6);
    if (hasGraduated) return `Class of ${graduationYear}`;
    // Active resident: compute PGY
    const academicYear = currentMonth >= 6 ? currentYear : currentYear - 1;
    const yearsUntilGrad = graduationYear - academicYear - 1;
    const pgy = 3 - yearsUntilGrad;
    return `PGY-${pgy} · Class of ${graduationYear}`;
  }

  function scoreToHeatColor(score: number): string {
    const t = Math.max(0, Math.min(100, score)) / 100;
    // Red (0) → Orange (25) → Yellow (50) → Light green (75) → Green (100)
    const r = t < 0.5 ? 220 : Math.round(220 - (t - 0.5) * 2 * 180);
    const g = t < 0.5 ? Math.round(60 + t * 2 * 140) : Math.round(200 + (t - 0.5) * 2 * 20);
    const b = t < 0.5 ? 30 : Math.round(30 + (t - 0.5) * 2 * 40);
    return `rgb(${r}, ${g}, ${b})`;
  }

  // Save current scores to allScores map without submitting to API
  function stashCurrentScores() {
    const id = getCurrentResidentId();
    if (!id) return;
    setAllScores(prev => ({ ...prev, [id]: { ...scores } }));
    setAllComments(prev => ({ ...prev, [id]: comments }));
  }

  // Load scores from allScores for a given resident
  function loadResidentScores(residentId: string) {
    if (allScores[residentId]) {
      setScores({ ...allScores[residentId] });
      setTouchedFields(new Set(Object.keys(allScores[residentId])));
      setComments(allComments[residentId] || '');
    } else if (surveyData?.existing_scores?.[residentId]) {
      const existing = surveyData.existing_scores[residentId];
      const restored: Partial<ScoreValues> = {};
      for (const [key, val] of Object.entries(existing)) {
        if (key !== 'comments' && typeof val === 'number') {
          restored[key as keyof ScoreValues] = val;
        }
      }
      setScores({ ...DEFAULT_SCORES, ...restored });
      setTouchedFields(new Set(Object.keys(restored)));
      setComments(typeof existing.comments === 'string' ? existing.comments : '');
    } else {
      setScores({ ...DEFAULT_SCORES });
      setTouchedFields(new Set());
      setComments('');
    }
  }

  // Core faculty: navigate to a specific resident by index
  function navigateToResident(index: number) {
    if (!surveyData) return;
    stashCurrentScores();
    setCurrentResidentIndex(index);
    loadResidentScores(surveyData.residents[index]?.id || '');
    setCurrentSection(0);
    setValidationErrors([]);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ========================================================================
  // Settings-based validation
  // ========================================================================
  const settings = surveyData?.survey.settings as {
    require_all_ratings?: boolean;
    require_comments?: boolean;
    allow_edit_after_submit?: boolean;
  } | null;

  const requireAllRatings = settings?.require_all_ratings ?? false;
  const requireComments = settings?.require_comments ?? false;

  function handleScoreChange(key: string, value: number) {
    setScores(prev => ({ ...prev, [key]: value }));
    setTouchedFields(prev => new Set(prev).add(key));
    setValidationErrors([]);
  }

  function validateForSubmit(): boolean {
    const errors: string[] = [];
    if (requireAllRatings) {
      for (const section of activeSections) {
        for (const attr of section.attributes) {
          if (!touchedFields.has(attr.key)) {
            errors.push(attr.key);
          }
        }
      }
    }
    if (errors.length > 0) {
      setValidationErrors(errors);
      return false;
    }
    if (requireComments && !comments.trim()) {
      setError('Comments are required for this evaluation.');
      return false;
    }
    setValidationErrors([]);
    return true;
  }

  // ========================================================================
  // Submit single rating
  // ========================================================================
  async function submitCurrentRating() {
    if (!surveyData) return;

    if (!validateForSubmit()) return;

    setSubmitting(true);

    try {
      const isLearner = surveyData.survey.type === 'learner_self_assessment';
      const action = isLearner ? 'submit_self' : 'submit_rating';

      const res = await fetch(`/api/surveys/respond/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          assignment_id: getCurrentAssignmentId(),
          scores,
          ...(isLearner ? { concerns_goals: comments } : { comments }),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to submit');
        return;
      }

      // Stash submitted scores
      const residentId = getCurrentResidentId();
      const newScores = { ...scores };
      setAllScores(prev => {
        const updated = { ...prev, [residentId]: newScores };
        // Detect changes from initial snapshot
        if (initialSubmittedAll) {
          const snap = snapshotScores[residentId];
          if (snap) {
            const changed = Object.keys(newScores).some(
              k => newScores[k as keyof ScoreValues] !== snap[k as keyof ScoreValues]
            );
            if (changed) setHasScoreChanges(true);
          } else {
            setHasScoreChanges(true);
          }
        }
        return updated;
      });
      setAllComments(prev => ({ ...prev, [residentId]: comments }));
      setSubmittedResidents(prev => new Set(prev).add(residentId));

      if (data.all_complete && !isFacultyMultiResident) {
        setCompleted(true);
        return;
      }

      // Move to next resident or return to summary
      if (!isLearner) {
        if (isTeachingFaculty) {
          // Teaching faculty: return to summary after each submission
          setShowSummary(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (isCoreFaculty) {
          // Core faculty: advance to next resident or show summary
          if (currentResidentIndex < surveyData.residents.length - 1) {
            const nextIdx = currentResidentIndex + 1;
            setCurrentResidentIndex(nextIdx);
            loadResidentScores(surveyData.residents[nextIdx]?.id || '');
            setCurrentSection(0);
            setValidationErrors([]);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            // Last resident done — show summary
            setShowSummary(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        } else if (surveyData.residents.length > currentResidentIndex + 1) {
          const nextIdx = currentResidentIndex + 1;
          const nextResidentId = surveyData.residents[nextIdx]?.id;
          setCurrentResidentIndex(nextIdx);
          if (nextResidentId && surveyData.existing_scores?.[nextResidentId]) {
            const existing = surveyData.existing_scores[nextResidentId];
            const restored: Partial<ScoreValues> = {};
            for (const [key, val] of Object.entries(existing)) {
              if (key !== 'comments' && typeof val === 'number') {
                restored[key as keyof ScoreValues] = val;
              }
            }
            setScores({ ...DEFAULT_SCORES, ...restored });
            setTouchedFields(new Set(Object.keys(restored)));
            if (typeof existing.comments === 'string') setComments(existing.comments);
          } else {
            setScores({ ...DEFAULT_SCORES });
            setComments('');
          }
          setCurrentSection(0);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          setCompleted(true);
        }
      } else {
        setCompleted(true);
      }
    } catch {
      setError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // Complete the entire survey from summary page (core + teaching faculty)
  async function completeSurveyFromSummary() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/surveys/respond/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' }),
      });
      if (res.ok) {
        // Take new snapshot so future edits are detected against this baseline
        const newSnapshot: Record<string, ScoreValues> = {};
        for (const [id, s] of Object.entries(allScores)) {
          newSnapshot[id] = { ...s };
        }
        setSnapshotScores(newSnapshot);
        setInitialSubmittedAll(true);
        setHasScoreChanges(false);
        // Stay on summary — user can still edit
      } else {
        setError('Failed to complete survey');
      }
    } catch {
      setError('Failed to complete survey');
    } finally {
      setSubmitting(false);
    }
  }

  // ========================================================================
  // Render
  // ========================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: COLORS.dark }} />
          <p className="text-neutral-600">Loading your survey...</p>
        </div>
      </div>
    );
  }

  if (error && !surveyData) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Unable to Load Survey</h2>
          <p className="text-neutral-600">{error}</p>
        </div>
      </div>
    );
  }

  // Determine if editing after submit is allowed
  const surveySettings = surveyData?.survey.settings as {
    allow_edit_after_submit?: boolean;
  } | null;
  const canEditAfterSubmit = surveySettings?.allow_edit_after_submit ?? false;
  const deadlinePassed = surveyData?.survey.deadline
    ? new Date(surveyData.survey.deadline) < new Date()
    : false;
  const isEditable = canEditAfterSubmit && !deadlinePassed;

  if ((completed || surveyData?.respondent.status === 'completed') && !isEditable) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Thank You!</h2>
          <p className="text-neutral-600 mb-4">
            Your {surveyData?.survey.type === 'learner_self_assessment' ? 'self-assessment' : 'evaluation'} has been submitted successfully.
          </p>
          <p className="text-sm text-neutral-400">
            You can close this page now.
          </p>
        </div>
      </div>
    );
  }

  if (!surveyData) return null;

  const isLearner = surveyData.survey.type === 'learner_self_assessment';
  const totalResidents = isLearner ? 1 : surveyData.residents.length;
  const completedResidents = isLearner
    ? 0
    : surveyData.residents.filter(r => r.assignment_status === 'completed').length;
  const isMultiResident = isFacultyMultiResident && totalResidents > 1;
  const guidanceMin = surveyData.respondent.guidance_min || 3;

  // ========================================================================
  // Teaching Faculty: Welcome Screen
  // ========================================================================
  if (isMultiResident && showWelcome) {
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: COLORS.lightest }}>
          <Heart className="w-8 h-8" style={{ color: COLORS.dark }} />
        </div>
        <h1 className="text-xl font-bold mb-3" style={{ color: COLORS.veryDark }}>
          {surveyData.survey.title}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed mb-8 max-w-sm">
          Thank you for taking the time to provide your input for the Emergency Medicine residency program.
          On the following screen you can choose who you would like to provide input on.
          Your feedback is invaluable in making our future attendings the best versions of themselves.
        </p>
        <button
          onClick={() => setShowWelcome(false)}
          className="px-8 py-3 text-white rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
          style={{ backgroundColor: COLORS.dark }}
        >
          Get Started
        </button>
        <p className="text-xs text-slate-400 mt-4">
          {totalResidents} residents to review
          {guidanceMin > 0 && ` · minimum ${guidanceMin} recommended`}
        </p>
      </div>
    );
  }

  // ========================================================================
  // Multi-Resident Summary Page (Core + Teaching Faculty)
  // ========================================================================
  if (isMultiResident && showSummary) {
    return (
      <div className="max-w-2xl mx-auto pb-12">
        <div className="px-4 pt-6 pb-2">
          <h1 className="text-lg font-bold" style={{ color: COLORS.veryDark }}>
            Review & Submit
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {surveyData.survey.title} &middot; {submittedResidents.size} of {totalResidents} residents scored
            {isTeachingFaculty && guidanceMin > 0 && (
              <span> · min {guidanceMin} recommended</span>
            )}
          </p>
        </div>

        {error && (
          <div className="mx-4 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-red-500 font-medium">Dismiss</button>
          </div>
        )}

        {/* Sort controls */}
        <div className="mx-4 mt-4 flex items-center gap-2 flex-wrap">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          {([
            ['original', 'Original'],
            ['a-z', 'A → Z'],
            ['z-a', 'Z → A'],
            ['score-high', 'Score ↓'],
            ['score-low', 'Score ↑'],
          ] as const).map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => setSummarySortMode(mode)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                summarySortMode === mode
                  ? 'text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
              style={summarySortMode === mode ? { backgroundColor: COLORS.dark } : undefined}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Resident list */}
        <div className="mx-4 mt-3 bg-white rounded-xl border overflow-hidden" style={{ borderColor: COLORS.light }}>
          {(() => {
            const indexed = surveyData.residents.map((r, i) => ({ resident: r, originalIdx: i }));
            const sorted = [...indexed].sort((a, b) => {
              if (summarySortMode === 'a-z') return a.resident.full_name.localeCompare(b.resident.full_name);
              if (summarySortMode === 'z-a') return b.resident.full_name.localeCompare(a.resident.full_name);
              if (summarySortMode === 'score-high' || summarySortMode === 'score-low') {
                const aScores = allScores[a.resident.id];
                const bScores = allScores[b.resident.id];
                const aAvg = aScores ? getOverallForScores(aScores) : -1;
                const bAvg = bScores ? getOverallForScores(bScores) : -1;
                return summarySortMode === 'score-high' ? bAvg - aAvg : aAvg - bAvg;
              }
              return 0;
            });
            return sorted.map(({ resident, originalIdx }, displayIdx) => {
              const resScores = allScores[resident.id];
              const isSubmitted = submittedResidents.has(resident.id);
              const eqAvg = resScores ? Math.round(getSectionAverageForScores(0, resScores)) : 0;
              const pqAvg = resScores ? Math.round(getSectionAverageForScores(1, resScores)) : 0;
              const iqAvg = resScores ? Math.round(getSectionAverageForScores(2, resScores)) : 0;
              const isExpanded = expandedResident === resident.id;
              const overallAvg = resScores ? Math.round(getOverallForScores(resScores)) : 0;

              return (
                <div
                  key={resident.id}
                  style={displayIdx > 0 ? { borderTop: `1px solid ${COLORS.lightest}` } : undefined}
                >
                  <div
                    className="p-3 sm:p-4 hover:bg-green-50/30 transition-colors cursor-pointer"
                    onClick={() => { setShowSummary(false); navigateToResident(originalIdx); }}
                  >
                    {/* Top row: avatar + name + expand chevron */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shrink-0 text-white"
                        style={{ backgroundColor: resScores ? scoreToHeatColor(overallAvg) : '#d1d5db' }}>
                        {resScores ? overallAvg : originalIdx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm sm:text-base truncate">{resident.full_name}</p>
                        {resident.graduation_year && (
                          <p className="text-[10px] sm:text-[11px] text-slate-400">{formatResidentClass(resident.graduation_year)}</p>
                        )}
                        <p className="text-[10px] sm:text-xs text-slate-400">
                          {isSubmitted ? 'Tap to edit' : 'Not yet scored'}
                        </p>
                      </div>
                      {resScores ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); setExpandedResident(isExpanded ? null : resident.id); }}
                          className="p-1 rounded-md hover:bg-slate-100 transition-colors shrink-0"
                          aria-label={isExpanded ? 'Collapse breakdown' : 'Expand breakdown'}
                        >
                          {isExpanded
                            ? <ChevronUp className="w-4 h-4 text-slate-400" />
                            : <ChevronDown className="w-4 h-4 text-slate-400" />
                          }
                        </button>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </div>
                    {/* Score tiles below name on own row for mobile-friendly layout */}
                    {resScores && (
                      <div className="mt-2 ml-[2.875rem] sm:ml-[3.125rem]">
                        <ScoreCard eq={eqAvg} pq={pqAvg} iq={iqAvg} size="sm" showOverall={false} />
                      </div>
                    )}
                  </div>

                  {/* Expanded attribute breakdown */}
                  {isExpanded && resScores && (
                    <div className="px-4 pb-4 pt-0">
                      <div className="bg-slate-50 rounded-lg p-3 space-y-3">
                        {SECTIONS.map((section) => (
                          <div key={section.id}>
                            <p className="text-xs font-semibold mb-1.5" style={{ color: section.hexText }}>
                              {section.id.toUpperCase()}
                            </p>
                            <div className="space-y-1">
                              {section.attributes.map((attr) => {
                                const val = resScores[attr.key as keyof ScoreValues] ?? 50;
                                return (
                                  <div key={attr.key} className="flex items-center justify-between text-xs">
                                    <span className="text-slate-600 truncate pr-2">{attr.label}</span>
                                    <span className="font-mono font-medium tabular-nums shrink-0" style={{ color: section.hexText }}>
                                      {val}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                          <button
                            onClick={() => { setShowSummary(false); navigateToResident(originalIdx); }}
                            className="text-xs font-medium flex items-center gap-1 hover:underline"
                            style={{ color: COLORS.dark }}
                          >
                            <Edit2 className="w-3 h-3" /> Edit scores
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>

        {/* Submit / Update */}
        <div className="mx-4 mt-6">
          {(() => {
            const scoredCount = submittedResidents.size;
            const allScored = scoredCount >= totalResidents;
            const alreadySubmitted = initialSubmittedAll;
            // Teaching faculty: can submit once they've scored at least 1 resident
            // Core faculty: must score all residents
            const meetsThreshold = isTeachingFaculty ? scoredCount > 0 : allScored;
            const canSubmit = meetsThreshold && (!alreadySubmitted || hasScoreChanges);

            return (
              <>
                <button
                  onClick={completeSurveyFromSummary}
                  disabled={submitting || !canSubmit}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3.5 text-white rounded-lg font-medium text-sm disabled:opacity-40 hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: COLORS.dark }}
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                  ) : alreadySubmitted && !hasScoreChanges ? (
                    <><CheckCircle className="w-4 h-4" /> Submitted</>
                  ) : alreadySubmitted && hasScoreChanges ? (
                    <><RefreshCw className="w-4 h-4" /> Update Your Submission</>
                  ) : (
                    <><CheckCircle className="w-4 h-4" /> Submit!</>
                  )}
                </button>
                {isCoreFaculty && !allScored && (
                  <p className="text-xs text-center text-slate-400 mt-2">
                    Score all {totalResidents} residents to submit
                  </p>
                )}
                {isTeachingFaculty && scoredCount === 0 && (
                  <p className="text-xs text-center text-slate-400 mt-2">
                    Score at least one resident to submit
                  </p>
                )}
                {isTeachingFaculty && scoredCount > 0 && scoredCount < guidanceMin && !alreadySubmitted && (
                  <p className="text-xs text-center text-amber-500 mt-2">
                    {guidanceMin - scoredCount} more recommended (minimum {guidanceMin})
                  </p>
                )}
                {alreadySubmitted && !hasScoreChanges && (
                  <p className="text-xs text-center text-slate-400 mt-2">
                    Your evaluation has been submitted. Edit any resident&apos;s scores to update.
                  </p>
                )}
              </>
            );
          })()}
        </div>
      </div>
    );
  }

  // ========================================================================
  // Rating Form (Self-Assessment, Teaching Faculty, Core Faculty per-resident)
  // ========================================================================
  return (
    <div className={`max-w-2xl mx-auto ${isMultiResident ? 'pt-0 pb-28' : 'pb-12'}`}>
      {/* Error banner */}
      {error && (
        <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-500 font-medium">Dismiss</button>
        </div>
      )}

      {/* Unified header card — sticky for multi-resident, static otherwise */}
      <div className={`mx-4 bg-white rounded-lg border px-4 py-3 ${isMultiResident ? 'sticky top-0 z-30 mt-2 shadow-sm' : 'mt-4'}`} style={{ borderColor: COLORS.light }}>
        <div className="mb-2">
          <h1 className="text-sm font-bold text-center truncate" style={{ color: COLORS.veryDark }}>
            {surveyData.survey.title}
          </h1>
          {!isMultiResident && (
            <p className="text-xs text-slate-500 text-center truncate">
              {isLearner
                ? getCurrentResidentName()
                : `Evaluating: ${getCurrentResidentName()} (${currentResidentIndex + 1} of ${totalResidents})`}
            </p>
          )}
          <div className="flex items-center justify-center gap-1 text-xs text-slate-400 mt-0.5">
            {saving ? (
              <><Loader2 className="w-3 h-3 animate-spin" /><span>Saving...</span></>
            ) : lastSaved ? (
              <><Save className="w-3 h-3" /><span>Saved {lastSaved.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span></>
            ) : null}
          </div>
        </div>

        {/* Core faculty: pill stepper + resident name inside the card */}
        {isMultiResident && (
          <div className="mb-2 pt-2" style={{ borderTop: `1px solid ${COLORS.lightest}` }}>
            <div className="flex items-center justify-center gap-1.5 mb-1.5">
              {surveyData.residents.map((r, idx) => {
                const isDone = submittedResidents.has(r.id) || r.assignment_status === 'completed';
                const isCurrent = idx === currentResidentIndex;
                return (
                  <button
                    key={r.id}
                    onClick={() => navigateToResident(idx)}
                    className="relative group"
                    title={r.full_name}
                  >
                    <div
                      className={`rounded-full transition-all duration-200 ${
                        'w-3 h-3'
                      }`}
                      style={{
                        backgroundColor: isCurrent
                          ? COLORS.veryDark
                          : isDone
                            ? COLORS.medium
                            : '#e2e8f0',
                      }}
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-center text-sm font-semibold" style={{ color: COLORS.veryDark }}>
              {getCurrentResidentName()}
            </p>
            {surveyData.residents[currentResidentIndex]?.graduation_year && (
              <p className="text-center text-[11px] text-slate-400">
                {formatResidentClass(surveyData.residents[currentResidentIndex].graduation_year)}
              </p>
            )}
            <div className="flex items-center justify-center gap-2 mt-0.5">
              <p className="text-[11px] text-slate-400">
                {currentResidentIndex + 1} of {totalResidents}
              </p>
              <span className="text-[11px] text-slate-300">|</span>
              <button
                onClick={() => { stashCurrentScores(); setShowSummary(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="text-[11px] font-medium underline"
                style={{ color: COLORS.dark }}
              >
                Review All
              </button>
            </div>
          </div>
        )}

        {/* Resident progress for non-core faculty */}
        {!isLearner && !isMultiResident && totalResidents > 1 && (
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-slate-500">{completedResidents} of {totalResidents} residents</span>
              <span className="text-xs font-medium text-slate-600">
                {totalResidents > 0 ? Math.round((completedResidents / totalResidents) * 100) : 0}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.lightest }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${totalResidents > 0 ? (completedResidents / totalResidents) * 100 : 0}%`, backgroundColor: COLORS.dark }}
              />
            </div>
          </div>
        )}

        <div className={`pt-2 ${isMultiResident ? '' : ''}`} style={{ borderTop: isMultiResident ? undefined : `1px solid ${COLORS.lightest}` }}>
          <p className="text-[11px] text-slate-500 text-center mb-1.5">Score meaning</p>
          <ScoreRangeKey />
        </div>
      </div>

      {/* All sections — scrollable */}
      <div className="px-4 mt-4 space-y-5">
        {activeSections.map((section) => {
          const Icon = SECTION_ICONS[section.id] || Heart;
          const sectionValues = section.attributes.map(a => scores[a.key as keyof ScoreValues] || 0);
          const sectionAvg = Math.round(sectionValues.reduce((s, v) => s + v, 0) / sectionValues.length);

          return (
            <div
              key={section.id}
              ref={(el) => { sectionRefs.current[section.id] = el; }}
              className="bg-white rounded-xl border overflow-hidden"
              style={{ borderColor: COLORS.light }}
            >
              <div className="px-5 py-3 flex items-center justify-between" style={{ backgroundColor: COLORS.lightest }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/70">
                    <Icon className="w-4 h-4" style={{ color: COLORS.dark }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm" style={{ color: COLORS.veryDark }}>{section.title}</h3>
                    <p className="text-[11px] text-slate-500">{section.subtitle}</p>
                  </div>
                </div>
                <div className="text-xl font-bold" style={{ color: COLORS.dark }}>{sectionAvg}</div>
              </div>

              <div>
                {section.attributes.map((attr, idx) => (
                  <div key={attr.key} style={idx > 0 ? { borderTop: `1px solid ${COLORS.lightest}` } : undefined}>
                    <CompactSlider
                      label={attr.label}
                      value={scores[attr.key as keyof ScoreValues]}
                      onChange={(v) => handleScoreChange(attr.key, v)}
                      hasError={validationErrors.includes(attr.key)}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Comments */}
        <div className={`bg-white rounded-xl border p-5 ${
          requireComments && !comments.trim() && error ? 'border-red-300' : ''
        }`} style={!(requireComments && !comments.trim() && error) ? { borderColor: COLORS.light } : undefined}>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {isLearner ? 'Concerns & Goals' : 'Comments & Observations'}
            {requireComments
              ? <span className="text-red-500 ml-1">*</span>
              : <span className="text-slate-400 ml-1">(Optional)</span>}
          </label>
          <textarea
            value={comments}
            onChange={(e) => { setComments(e.target.value); setError(null); }}
            rows={3}
            className="w-full px-3 py-2.5 border rounded-lg bg-white text-sm text-slate-900 placeholder-slate-400 resize-none"
            style={{ borderColor: COLORS.light }}
            placeholder={
              isLearner
                ? 'What are your current concerns or goals?'
                : 'Any thoughts or observations...'
            }
          />
        </div>

        {/* Submit section — only for non-core-faculty (core faculty uses sticky footer) */}
        {!isMultiResident && (
          <div className="rounded-xl border p-5" style={{ borderColor: COLORS.light, backgroundColor: COLORS.lightest + '40' }}>
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              {activeSections.map((section, idx) => (
                <div key={section.id}>
                  <div className="text-xs text-slate-500 mb-1">{section.id.toUpperCase()}</div>
                  <div className="text-xl font-bold" style={{ color: COLORS.dark }}>
                    {getSectionAverage(idx).toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mb-4 pt-3" style={{ borderTop: `1px solid ${COLORS.light}` }}>
              <div className="text-xs text-slate-500 mb-1">Overall Average</div>
              <div className="text-3xl font-bold" style={{ color: COLORS.veryDark }}>
                {activeSections.length > 0
                  ? (activeSections.reduce((sum, _, idx) => sum + getSectionAverage(idx), 0) / activeSections.length).toFixed(0)
                  : '0'}
              </div>
            </div>

            <button
              onClick={submitCurrentRating}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 text-white rounded-lg font-medium text-sm disabled:opacity-50 hover:opacity-90"
              style={{ backgroundColor: COLORS.dark }}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
              ) : (
                <><CheckCircle className="w-4 h-4" /> Submit</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Sticky bottom bar for multi-resident surveys */}
      {isMultiResident && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t shadow-lg" style={{ borderColor: COLORS.light }}>
          <div className="max-w-2xl mx-auto px-4 py-3">
            {/* Score + stepper card */}
            <div className="rounded-lg border px-4 py-2.5 mb-2.5" style={{ borderColor: COLORS.light }}>
              {/* EQ / PQ / IQ scores */}
              <div className="flex items-center justify-center gap-4 mb-1">
                {activeSections.map((sec, idx) => (
                  <span key={sec.id} className="text-xs text-slate-500">
                    {sec.id.toUpperCase()}{' '}
                    <strong className="text-sm" style={{ color: COLORS.dark }}>
                      {getSectionAverage(idx).toFixed(0)}
                    </strong>
                  </span>
                ))}
              </div>
              {/* Overall average */}
              <p className="text-center text-xs font-semibold mb-2" style={{ color: COLORS.veryDark }}>
                Avg{' '}
                <span className="text-base">
                  {activeSections.length > 0
                    ? (activeSections.reduce((sum, _, idx) => sum + getSectionAverage(idx), 0) / activeSections.length).toFixed(0)
                    : '0'}
                </span>
              </p>
              {/* Pill stepper */}
              <div className="flex items-center justify-center gap-1.5 mb-1">
                {surveyData.residents.map((r, idx) => {
                  const isDone = submittedResidents.has(r.id) || r.assignment_status === 'completed';
                  const isCurrent = idx === currentResidentIndex;
                  return (
                    <button
                      key={r.id}
                      onClick={() => navigateToResident(idx)}
                      title={r.full_name}
                    >
                      <div
                        className={`rounded-full transition-all duration-200 ${
                          'w-3 h-3'
                        }`}
                        style={{
                          backgroundColor: isCurrent
                            ? COLORS.veryDark
                            : isDone
                              ? COLORS.medium
                              : '#e2e8f0',
                        }}
                      />
                    </button>
                  );
                })}
              </div>
              {/* Resident name */}
              <p className="text-center text-sm font-semibold" style={{ color: COLORS.veryDark }}>
                {getCurrentResidentName()}
              </p>
              {surveyData.residents[currentResidentIndex]?.graduation_year && (
                <p className="text-center text-[11px] text-slate-400">
                  {formatResidentClass(surveyData.residents[currentResidentIndex].graduation_year)}
                </p>
              )}
              <div className="flex items-center justify-center gap-2 mt-0.5">
                <p className="text-[11px] text-slate-400">
                  {currentResidentIndex + 1} of {totalResidents}
                </p>
                <span className="text-[11px] text-slate-300">|</span>
                <button
                  onClick={() => { stashCurrentScores(); setShowSummary(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="text-[11px] font-medium underline"
                  style={{ color: COLORS.dark }}
                >
                  Review All
                </button>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (isTeachingFaculty) {
                    stashCurrentScores();
                    setShowSummary(true);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else if (currentResidentIndex > 0) {
                    stashCurrentScores();
                    const prevIdx = currentResidentIndex - 1;
                    setCurrentResidentIndex(prevIdx);
                    loadResidentScores(surveyData.residents[prevIdx]?.id || '');
                    setCurrentSection(0);
                    setValidationErrors([]);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                disabled={!isTeachingFaculty && currentResidentIndex === 0}
                className="flex items-center justify-center gap-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-30"
                style={{ color: COLORS.dark, border: `1px solid ${COLORS.light}` }}
              >
                <ChevronLeft className="w-4 h-4" />
                {isTeachingFaculty ? 'Review All' : 'Back'}
              </button>

              <button
                onClick={submitCurrentRating}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-lg font-medium text-sm disabled:opacity-50 hover:opacity-90"
                style={{ backgroundColor: COLORS.dark }}
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : isTeachingFaculty ? (
                  <>Save & Review <ChevronRight className="w-4 h-4" /></>
                ) : currentResidentIndex < totalResidents - 1 ? (
                  <>Next <ChevronRight className="w-4 h-4" /></>
                ) : (
                  <>Review All <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
