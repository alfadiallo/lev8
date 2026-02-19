'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle, ChevronLeft, ChevronRight, Loader2, Save, AlertCircle } from 'lucide-react';
import ScoreRangeKey from '@/components/eqpqiq/analytics/ScoreRangeKey';

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
// Attribute Definitions
// ============================================================================

const SECTIONS = [
  {
    id: 'eq',
    title: 'Emotional Intelligence (EQ)',
    subtitle: 'Interpersonal & Intrapersonal Skills',
    color: 'bg-blue-500',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
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
    title: 'Professional Intelligence (PQ)',
    subtitle: 'Professional Decorum & Leadership',
    color: 'bg-green-500',
    textColor: 'text-green-600',
    bgColor: 'bg-green-50',
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
    title: 'Intellectual Intelligence (IQ)',
    subtitle: 'Clinical Acumen & Critical Thinking',
    color: 'bg-purple-500',
    textColor: 'text-purple-600',
    bgColor: 'bg-purple-50',
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

const RATING_LABELS: Record<number, string> = {
  0: 'Well Below',
  15: 'Below',
  25: 'Slightly Below',
  35: 'Approaching',
  50: 'At Expected',
  65: 'Above',
  75: 'Well Above',
  85: 'Outstanding',
  100: 'Exceptional',
};

// ============================================================================
// Rating Slider Component (Mobile-Optimized)
// ============================================================================

function RatingSlider({
  label,
  description,
  value,
  onChange,
  color,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
}) {
  return (
    <div className="py-4 border-b border-neutral-100 last:border-0">
      <div className="mb-2">
        <div className="font-medium text-neutral-900 text-sm sm:text-base">{label}</div>
        <div className="text-xs text-neutral-500 mt-0.5">{description}</div>
      </div>
      <div className="flex items-center gap-3 mt-3">
        <span className="text-xs text-neutral-400 w-6 text-right">0</span>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className={`flex-1 h-2 rounded-full appearance-none cursor-pointer accent-current ${color}
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-current`}
        />
        <span className="text-xs text-neutral-400 w-8">100</span>
        <div className={`min-w-[60px] text-center py-1 px-2 rounded-full text-sm font-bold ${color} bg-opacity-10`}>
          {Math.round(value)}
        </div>
      </div>
      <div className="text-center mt-1">
        <span className="text-xs text-neutral-500">{RATING_LABELS[value] || ''}</span>
      </div>
    </div>
  );
}

// ============================================================================
// Progress Bar Component
// ============================================================================

function ProgressBar({ current, total, label }: { current: number; total: number; label: string }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-neutral-600">{label}</span>
        <span className="text-xs font-medium text-neutral-700">{pct}%</span>
      </div>
      <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

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
  const [currentSection, setCurrentSection] = useState(0); // 0=EQ, 1=PQ, 2=IQ, 3=Review
  const [currentResidentIndex, setCurrentResidentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // Teaching faculty: open roster mode
  const isTeachingFaculty = surveyData?.respondent.rater_type === 'teaching_faculty';
  const [showRoster, setShowRoster] = useState(true);

  // Dynamic sections: use framework data if available, else fall back to hardcoded SECTIONS
  const PILLAR_COLORS: Record<string, { color: string; textColor: string; bgColor: string }> = {
    eq: { color: 'bg-blue-500', textColor: 'text-blue-600', bgColor: 'bg-blue-50' },
    pq: { color: 'bg-green-500', textColor: 'text-green-600', bgColor: 'bg-green-50' },
    iq: { color: 'bg-purple-500', textColor: 'text-purple-600', bgColor: 'bg-purple-50' },
  };
  const DEFAULT_PILLAR_STYLE = { color: 'bg-indigo-500', textColor: 'text-indigo-600', bgColor: 'bg-indigo-50' };

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
          const residentId = data.survey.type === 'learner_self_assessment'
            ? data.self_resident?.id
            : data.residents[0]?.id;
          if (residentId && data.existing_scores[residentId]) {
            const existing = data.existing_scores[residentId];
            const numericScores: Partial<ScoreValues> = {};
            for (const [key, val] of Object.entries(existing)) {
              if (key !== 'comments' && typeof val === 'number') {
                numericScores[key as keyof ScoreValues] = val;
              }
            }
            if (Object.keys(numericScores).length > 0) {
              setScores(prev => ({ ...prev, ...numericScores }));
              setTouchedFields(new Set(Object.keys(numericScores)));
            }
            if (typeof existing.comments === 'string') {
              setComments(existing.comments);
            }
          }
        }

        if (data.respondent.status === 'completed') {
          setCompleted(true);
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
      const progressData: ProgressData = {
        current_section: activeSections[currentSection]?.id || 'eq',
        current_resident_index: currentResidentIndex,
        partial_scores: {
          [getCurrentResidentId()]: scores as unknown as Record<string, number>,
        },
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
  }, [token, currentSection, currentResidentIndex, scores, surveyData, completed]);

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
  const allowEditAfterSubmit = settings?.allow_edit_after_submit ?? false;

  function handleScoreChange(key: string, value: number) {
    setScores(prev => ({ ...prev, [key]: value }));
    setTouchedFields(prev => new Set(prev).add(key));
    setValidationErrors([]);
  }

  function validateSection(sectionIndex: number): boolean {
    if (!requireAllRatings) return true;
    const section = activeSections[sectionIndex];
    if (!section) return true;
    const untouched = section.attributes.filter(
      attr => !touchedFields.has(attr.key)
    );
    if (untouched.length > 0) {
      setValidationErrors(untouched.map(a => a.key));
      return false;
    }
    setValidationErrors([]);
    return true;
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

      if (data.all_complete) {
        setCompleted(true);
        return;
      }

      // Move to next resident or return to roster
      if (!isLearner) {
        if (isTeachingFaculty) {
          // Teaching faculty: return to roster after each submission
          setScores({ ...DEFAULT_SCORES });
          setComments('');
          setCurrentSection(0);
          setShowRoster(true);
          // Refresh data to get updated assignment statuses
          const refreshRes = await fetch(`/api/surveys/respond/${token}`);
          if (refreshRes.ok) {
            const refreshData: SurveyData = await refreshRes.json();
            setSurveyData(refreshData);
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (surveyData.residents.length > currentResidentIndex + 1) {
          const nextIdx = currentResidentIndex + 1;
          const nextResidentId = surveyData.residents[nextIdx]?.id;
          setCurrentResidentIndex(nextIdx);
          // Pre-fill existing scores if available (post-submit editing)
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

  // ========================================================================
  // Render
  // ========================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
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

  // Teaching Faculty: open roster view
  if (isTeachingFaculty && showRoster && surveyData.residents.length > 0) {
    const ratedCount = surveyData.residents.filter(r => r.assignment_status === 'completed').length;
    const guidanceMin = surveyData.respondent.guidance_min || 3;

    const handleSelectResident = (index: number) => {
      setCurrentResidentIndex(index);
      const residentId = surveyData.residents[index]?.id;
      if (residentId && surveyData.existing_scores?.[residentId]) {
        const existing = surveyData.existing_scores[residentId];
        const restored: Partial<ScoreValues> = {};
        for (const [key, val] of Object.entries(existing)) {
          if (key !== 'comments' && typeof val === 'number') {
            restored[key as keyof ScoreValues] = val;
          }
        }
        setScores({ ...DEFAULT_SCORES, ...restored });
        setTouchedFields(new Set(Object.keys(restored)));
        if (typeof existing.comments === 'string') setComments(existing.comments);
        else setComments('');
      } else {
        setScores({ ...DEFAULT_SCORES });
        setComments('');
      }
      setCurrentSection(0);
      setShowRoster(false);
    };

    const handleCompleteAll = async () => {
      setSubmitting(true);
      try {
        await fetch(`/api/surveys/respond/${token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'complete' }),
        });
        setCompleted(true);
      } catch {
        setError('Failed to complete survey');
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="max-w-lg mx-auto pb-24">
        <div className="px-4 pt-6 pb-4">
          <h1 className="text-lg font-bold text-neutral-900">{surveyData.survey.title}</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {surveyData.respondent.name || surveyData.respondent.email}
          </p>
        </div>

        {/* Soft guidance banner */}
        <div className="mx-4 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            We recommend evaluating at least <strong>{guidanceMin} residents</strong> you&apos;ve worked with closely.
            Rate as many as you&apos;d like — select any resident below to begin.
          </p>
        </div>

        {/* Progress */}
        <div className="mx-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-600">{ratedCount} of {surveyData.residents.length} residents rated</span>
            {ratedCount >= guidanceMin && (
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                Minimum met
              </span>
            )}
          </div>
          <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.round((ratedCount / surveyData.residents.length) * 100)}%`,
                backgroundColor: ratedCount >= guidanceMin ? '#22c55e' : '#3b82f6',
              }}
            />
          </div>
        </div>

        {/* Resident roster */}
        <div className="mx-4 space-y-2">
          {surveyData.residents.map((resident, idx) => {
            const isRated = resident.assignment_status === 'completed';
            return (
              <button
                key={resident.id}
                onClick={() => !isRated && handleSelectResident(idx)}
                disabled={isRated}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  isRated
                    ? 'bg-green-50 border-green-200 opacity-75'
                    : 'bg-white border-neutral-200 hover:border-blue-300 hover:shadow-sm active:scale-[0.99]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    isRated ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'
                  }`}>
                    {isRated ? <CheckCircle className="w-5 h-5" /> : resident.full_name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-medium ${isRated ? 'text-green-800' : 'text-neutral-900'}`}>
                      {resident.full_name}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {isRated ? 'Completed' : 'Tap to evaluate'}
                    </p>
                  </div>
                </div>
                {!isRated && <ChevronRight className="w-4 h-4 text-neutral-400" />}
              </button>
            );
          })}
        </div>

        {/* Complete button */}
        {ratedCount > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-4 py-3 shadow-lg">
            <div className="max-w-lg mx-auto">
              <button
                onClick={handleCompleteAll}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg 
                           hover:bg-green-700 transition-colors font-medium text-sm disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Complete Survey ({ratedCount} resident{ratedCount !== 1 ? 's' : ''} rated)
                  </>
                )}
              </button>
              {ratedCount < guidanceMin && (
                <p className="text-xs text-center text-neutral-400 mt-2">
                  {guidanceMin - ratedCount} more recommended
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  const isLearner = surveyData.survey.type === 'learner_self_assessment';
  const totalResidents = isLearner ? 1 : surveyData.residents.length;
  const completedResidents = isLearner
    ? 0
    : surveyData.residents.filter(r => r.assignment_status === 'completed').length;
  const isReviewSection = currentSection === activeSections.length;
  const currentSectionData = activeSections[currentSection];

  return (
    <div className="max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-neutral-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          {isTeachingFaculty && (
            <button
              onClick={() => {
                saveProgress();
                setShowRoster(true);
              }}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mr-2 shrink-0"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Roster
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-neutral-900 truncate">
              {surveyData.survey.title}
            </h1>
            <p className="text-xs text-neutral-500 truncate">
              {isLearner
                ? `Self-Assessment: ${getCurrentResidentName()}`
                : `Evaluating: ${getCurrentResidentName()}${isTeachingFaculty ? '' : ` (${currentResidentIndex + 1} of ${totalResidents})`}`}
            </p>
          </div>
          {/* Save indicator */}
          <div className="flex items-center gap-1 text-xs text-neutral-400 shrink-0 ml-2">
            {saving ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Saving...</span>
              </>
            ) : lastSaved ? (
              <>
                <Save className="w-3 h-3" />
                <span>Saved</span>
              </>
            ) : null}
          </div>
        </div>

        {/* Progress indicators */}
        {!isLearner && totalResidents > 1 && (
          <ProgressBar
            current={completedResidents + (isReviewSection ? 1 : 0)}
            total={totalResidents}
            label={`${completedResidents} of ${totalResidents} residents`}
          />
        )}

        {/* Section tabs */}
        <div className="flex gap-1 mt-2">
          {activeSections.map((section, idx) => (
            <button
              key={section.id}
              onClick={() => setCurrentSection(idx)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                idx === currentSection
                  ? `${section.color} text-white`
                  : idx < currentSection
                    ? 'bg-neutral-200 text-neutral-600'
                    : 'bg-neutral-100 text-neutral-400'
              }`}
            >
              {section.id.toUpperCase()}
            </button>
          ))}
          <button
            onClick={() => setCurrentSection(activeSections.length)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              isReviewSection
                ? 'bg-neutral-800 text-white'
                : 'bg-neutral-100 text-neutral-400'
            }`}
          >
            Review
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-500 font-medium">Dismiss</button>
        </div>
      )}

      {/* Score legend */}
      <div className="mx-4 mt-3 bg-white border border-neutral-200 rounded-lg px-3 py-2.5">
        <p className="text-[11px] text-neutral-500 text-center mb-1.5">
          Score meaning
        </p>
        <ScoreRangeKey />
      </div>

      {/* Section content */}
      {!isReviewSection && currentSectionData && (
        <div className="px-4 mt-4">
          <div className={`${currentSectionData.bgColor} rounded-lg p-4 mb-4`}>
            <h2 className={`text-lg font-bold ${currentSectionData.textColor}`}>
              {currentSectionData.title}
            </h2>
            <p className="text-sm text-neutral-600 mt-1">{currentSectionData.subtitle}</p>
          </div>

          <div className="bg-white rounded-lg border border-neutral-200 px-4">
            {currentSectionData.attributes.map((attr) => {
              const hasError = validationErrors.includes(attr.key);
              return (
                <div key={attr.key} className={hasError ? 'ring-1 ring-red-300 rounded-lg -mx-1 px-1' : ''}>
                  <RatingSlider
                    label={attr.label}
                    description={attr.desc}
                    value={scores[attr.key as keyof ScoreValues]}
                    onChange={(v) => handleScoreChange(attr.key, v)}
                    color={currentSectionData.textColor}
                  />
                  {hasError && (
                    <p className="text-xs text-red-500 pb-2 -mt-1">Please rate this attribute</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Section average */}
          <div className="mt-4 text-center">
            <span className="text-sm text-neutral-500">Section Average: </span>
            <span className={`text-lg font-bold ${currentSectionData.textColor}`}>
              {getSectionAverage(currentSection).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Review section */}
      {isReviewSection && (
        <div className="px-4 mt-4 space-y-4">
          <div className="bg-neutral-100 rounded-lg p-4">
            <h2 className="text-lg font-bold text-neutral-900 mb-1">Review & Submit</h2>
            <p className="text-sm text-neutral-600">
              {isLearner
                ? 'Review your self-assessment before submitting.'
                : `Review your evaluation of ${getCurrentResidentName()}.`}
            </p>
          </div>

          {/* Score summary */}
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              {activeSections.map((section, idx) => (
                <div key={section.id}>
                  <div className="text-xs text-neutral-500 mb-1">{section.id.toUpperCase()}</div>
                  <div className={`text-2xl font-bold ${section.textColor}`}>
                    {getSectionAverage(idx).toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-neutral-100 text-center">
              <div className="text-xs text-neutral-500 mb-1">Overall</div>
              <div className="text-3xl font-bold text-neutral-900">
                {activeSections.length > 0
                  ? (activeSections.reduce((sum, _, idx) => sum + getSectionAverage(idx), 0) / activeSections.length).toFixed(2)
                  : '0.00'}
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className={`bg-white rounded-lg border p-4 ${
            requireComments && !comments.trim() && error ? 'border-red-300' : 'border-neutral-200'
          }`}>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {isLearner ? 'Concerns & Goals' : 'Comments'}
              {requireComments
                ? <span className="text-red-500 ml-1">*</span>
                : <span className="text-neutral-400 ml-1">(Optional)</span>}
            </label>
            <textarea
              value={comments}
              onChange={(e) => { setComments(e.target.value); setError(null); }}
              rows={4}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 
                         focus:border-transparent text-sm resize-none"
              placeholder={
                isLearner
                  ? 'What are your current concerns or goals?'
                  : 'Additional comments or observations...'
              }
            />
          </div>
        </div>
      )}

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-4 py-3 shadow-lg">
        <div className="max-w-lg mx-auto flex gap-3">
          {/* Back button */}
          <button
            onClick={() => {
              if (currentSection > 0) setCurrentSection(prev => prev - 1);
            }}
            disabled={currentSection === 0}
            className="flex items-center gap-1 px-4 py-3 border border-neutral-300 rounded-lg text-neutral-700 
                       hover:bg-neutral-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          {/* Next / Submit button */}
          {!isReviewSection ? (
            <button
              onClick={() => {
                if (validateSection(currentSection)) {
                  setCurrentSection(prev => prev + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="flex-1 flex items-center justify-center gap-1 px-4 py-3 bg-blue-600 text-white rounded-lg 
                         hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={submitCurrentRating}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg 
                         hover:bg-green-700 transition-colors font-medium text-sm disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  {isLearner
                    ? 'Submit Self-Assessment'
                    : `Submit & ${currentResidentIndex + 1 < totalResidents ? 'Next Resident' : 'Finish'}`}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
