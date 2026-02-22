'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X, Users, UserCheck, GraduationCap,
  Bell, Loader2, AlertCircle, Send,
  Settings2, FileText
} from 'lucide-react';

const COLORS = {
  lightest: '#D8F3DC',
  light: '#B7E4C7',
  medium: '#74C69D',
  dark: '#40916C',
  darker: '#2D6A4F',
  veryDark: '#1B4332',
};

interface ClassInfo {
  id: string;
  graduation_year: number;
  name: string;
  is_active: boolean;
}

interface FacultyInfo {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  credentials: string | null;
  faculty_type: 'core' | 'teaching';
  site: string | null;
  personal_email: string | null;
}

interface ResidentInfo {
  id: string;
  full_name: string;
  email: string;
  personal_email: string | null;
  class_id: string;
}

interface CampaignWizardProps {
  programId: string;
  userEmail: string;
  onClose: () => void;
  onCreated: () => void;
}

type PeriodOption = 'Orientation' | 'Fall' | 'Spring' | 'Custom';

const PERIOD_SURVEY_DEFAULTS: Record<PeriodOption, { self: boolean; core: boolean; teaching: boolean }> = {
  Orientation: { self: true, core: false, teaching: false },
  Fall: { self: true, core: true, teaching: true },
  Spring: { self: true, core: true, teaching: true },
  Custom: { self: false, core: false, teaching: false },
};

function getPgyLevel(graduationYear: number): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const month = now.getMonth() + 1;
  const academicYear = month >= 7 ? currentYear : currentYear - 1;
  const yearsToGrad = graduationYear - academicYear;
  const pgy = 4 - yearsToGrad;
  if (pgy < 1 || pgy > 7) return '';
  return `PGY-${pgy}`;
}

function getCurrentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (month >= 7) return `${year}-${year + 1}`;
  return `${year - 1}-${year}`;
}

function getCurrentPeriod(): PeriodOption {
  const month = new Date().getMonth() + 1;
  return month >= 1 && month <= 6 ? 'Spring' : 'Fall';
}

export default function CampaignWizard({ programId, userEmail, onClose, onCreated }: CampaignWizardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [faculty, setFaculty] = useState<FacultyInfo[]>([]);
  const [residents, setResidents] = useState<ResidentInfo[]>([]);

  const [selectedClassId, setSelectedClassId] = useState('');
  const [period, setPeriod] = useState<PeriodOption>(getCurrentPeriod());
  const [academicYear] = useState(getCurrentAcademicYear());
  const [deadline, setDeadline] = useState('');
  const [autoRemind, setAutoRemind] = useState(true);
  const [remindEveryDays, setRemindEveryDays] = useState(3);
  const [maxReminders, setMaxReminders] = useState(5);
  const [requireAllRatings, setRequireAllRatings] = useState(true);
  const [requireComments, setRequireComments] = useState(false);
  const [allowEditAfterSubmit, setAllowEditAfterSubmit] = useState(true);

  // Survey type checkboxes
  const [includeSelf, setIncludeSelf] = useState(true);
  const [includeCore, setIncludeCore] = useState(true);
  const [includeTeaching, setIncludeTeaching] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/progress-check/campaign/populate?program_id=${programId}`);
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setClasses(data.classes || []);
        setFaculty(data.faculty || []);
      } catch {
        setError('Failed to load program data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [programId]);

  const loadResidents = useCallback(async (classId: string) => {
    if (!classId) { setResidents([]); return; }
    try {
      const res = await fetch(`/api/progress-check/campaign/populate?program_id=${programId}&class_id=${classId}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setResidents(data.residents || []);
    } catch {
      setError('Failed to load residents');
    }
  }, [programId]);

  useEffect(() => {
    if (selectedClassId) loadResidents(selectedClassId);
  }, [selectedClassId, loadResidents]);

  // Auto-set survey types when period changes
  const handlePeriodChange = (newPeriod: PeriodOption) => {
    setPeriod(newPeriod);
    const defaults = PERIOD_SURVEY_DEFAULTS[newPeriod];
    setIncludeSelf(defaults.self);
    setIncludeCore(defaults.core);
    setIncludeTeaching(defaults.teaching);
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const coreCount = faculty.filter(f => f.faculty_type === 'core').length;
  const teachingCount = faculty.filter(f => f.faculty_type === 'teaching').length;
  const selectedSurveyCount = [includeSelf, includeCore, includeTeaching].filter(Boolean).length;

  const canCreate = selectedClassId && residents.length > 0 && selectedSurveyCount > 0;

  const handleCreate = async () => {
    if (!canCreate || !selectedClass) return;
    setSubmitting(true);
    setError('');

    try {
      const pgy = getPgyLevel(selectedClass.graduation_year);
      const yearLabel = academicYear.split('-')[period === 'Spring' ? 1 : 0];
      const settings = {
        require_all_ratings: requireAllRatings,
        require_comments: requireComments,
        allow_edit_after_submit: allowEditAfterSubmit,
      };

      const surveyTypes: Array<{
        type: string;
        title: string;
        description: string;
        audienceType: string;
      }> = [];

      if (includeSelf) {
        surveyTypes.push({
          type: 'learner_self_assessment',
          title: `${period} ${yearLabel} CCC Self-Assessment — ${pgy}`,
          description: `Resident self-assessment for ${pgy} (${selectedClass.name}).`,
          audienceType: 'self',
        });
      }

      if (includeCore) {
        surveyTypes.push({
          type: 'educator_assessment',
          title: `${period} ${yearLabel} CCC Core Faculty Eval — ${pgy}`,
          description: `Core faculty evaluation of ${pgy} residents (${selectedClass.name}).`,
          audienceType: 'core_faculty',
        });
      }

      if (includeTeaching) {
        surveyTypes.push({
          type: 'educator_assessment',
          title: `${period} ${yearLabel} CCC Teaching Faculty Eval — ${pgy}`,
          description: `Teaching faculty evaluation of ${pgy} residents (${selectedClass.name}).`,
          audienceType: 'teaching_faculty',
        });
      }

      for (const st of surveyTypes) {
        const createRes = await fetch('/api/surveys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            survey_type: st.type,
            title: st.title,
            description: st.description,
            program_id: programId,
            class_id: selectedClassId,
            period_label: `${pgy} ${period} CCC`,
            academic_year: academicYear,
            audience_filter: { type: st.audienceType },
            deadline: deadline || null,
            auto_remind: autoRemind,
            remind_every_days: autoRemind ? remindEveryDays : null,
            max_reminders: autoRemind ? maxReminders : 5,
            created_by_email: userEmail,
            settings,
          }),
        });

        if (!createRes.ok) {
          const errData = await createRes.json();
          throw new Error(errData.error || `Failed to create ${st.audienceType} survey`);
        }
      }

      onCreated();
    } catch (err) {
      console.error('[CampaignWizard] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create campaign');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <WizardShell onClose={onClose}>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: COLORS.dark }} />
          <span className="ml-2 text-slate-500">Loading program data...</span>
        </div>
      </WizardShell>
    );
  }

  return (
    <WizardShell onClose={onClose}>
      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto text-red-500 font-medium text-xs">Dismiss</button>
        </div>
      )}

      <div className="space-y-5">
        {/* Class selector */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Class *</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-3 py-2.5 border rounded-lg text-sm"
            style={{ borderColor: COLORS.light }}
          >
            <option value="">Select a class...</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({getPgyLevel(c.graduation_year) || `Grad ${c.graduation_year}`})
              </option>
            ))}
          </select>
        </div>

        {/* Period radio buttons */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Period *</label>
          <div className="grid grid-cols-4 gap-2">
            {(['Orientation', 'Fall', 'Spring', 'Custom'] as PeriodOption[]).map(p => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  period === p
                    ? 'text-white border-transparent'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
                style={period === p
                  ? { backgroundColor: COLORS.dark }
                  : { borderColor: COLORS.light }
                }
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Survey type checkboxes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Survey Types</label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-green-50/30 transition-colors" style={{ borderColor: includeSelf ? COLORS.dark : COLORS.light }}>
              <input
                type="checkbox"
                checked={includeSelf}
                onChange={(e) => setIncludeSelf(e.target.checked)}
                className="rounded"
              />
              <GraduationCap className="w-4 h-4 shrink-0" style={{ color: COLORS.dark }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">Self-Assessment</p>
                <p className="text-xs text-slate-500">Each resident evaluates themselves</p>
              </div>
              <span className="text-sm font-medium shrink-0" style={{ color: COLORS.darker }}>
                {residents.length}
              </span>
            </label>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-green-50/30 transition-colors" style={{ borderColor: includeCore ? COLORS.dark : COLORS.light }}>
              <input
                type="checkbox"
                checked={includeCore}
                onChange={(e) => setIncludeCore(e.target.checked)}
                className="rounded"
              />
              <UserCheck className="w-4 h-4 shrink-0" style={{ color: COLORS.dark }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">Core Faculty Evaluation</p>
                <p className="text-xs text-slate-500">Each core faculty rates all {residents.length} residents</p>
              </div>
              <span className="text-sm font-medium shrink-0" style={{ color: COLORS.darker }}>
                {coreCount}
              </span>
            </label>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-green-50/30 transition-colors" style={{ borderColor: includeTeaching ? COLORS.dark : COLORS.light }}>
              <input
                type="checkbox"
                checked={includeTeaching}
                onChange={(e) => setIncludeTeaching(e.target.checked)}
                className="rounded"
              />
              <Users className="w-4 h-4 shrink-0" style={{ color: COLORS.dark }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">Teaching Faculty Evaluation</p>
                <p className="text-xs text-slate-500">Choose which residents to evaluate (min 3 recommended)</p>
              </div>
              <span className="text-sm font-medium shrink-0" style={{ color: COLORS.darker }}>
                {teachingCount}
              </span>
            </label>
          </div>
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Deadline</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full px-3 py-2.5 border rounded-lg text-sm"
            style={{ borderColor: COLORS.light }}
          />
        </div>

        {/* Reminders */}
        <div className="border rounded-lg p-4" style={{ borderColor: COLORS.light }}>
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4" style={{ color: COLORS.dark }} />
            <span className="text-sm font-medium text-slate-700">Automated Reminders</span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              id="autoRemind"
              checked={autoRemind}
              onChange={(e) => setAutoRemind(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="autoRemind" className="text-sm text-slate-600">
              Send automated reminders to non-completers
            </label>
          </div>
          {autoRemind && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Every N days</label>
                <input
                  type="number"
                  value={remindEveryDays}
                  onChange={(e) => setRemindEveryDays(parseInt(e.target.value) || 3)}
                  min={1}
                  max={30}
                  className="w-full px-2 py-1.5 border rounded text-sm"
                  style={{ borderColor: COLORS.light }}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Max reminders</label>
                <input
                  type="number"
                  value={maxReminders}
                  onChange={(e) => setMaxReminders(parseInt(e.target.value) || 5)}
                  min={1}
                  max={20}
                  className="w-full px-2 py-1.5 border rounded text-sm"
                  style={{ borderColor: COLORS.light }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Form settings */}
        <div className="border rounded-lg p-4" style={{ borderColor: COLORS.light }}>
          <div className="flex items-center gap-2 mb-3">
            <Settings2 className="w-4 h-4" style={{ color: COLORS.dark }} />
            <span className="text-sm font-medium text-slate-700">Form Settings</span>
          </div>
          <div className="space-y-2.5">
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" checked={requireAllRatings} onChange={(e) => setRequireAllRatings(e.target.checked)} className="rounded" />
              Respondents must rate every attribute (no skipping)
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" checked={requireComments} onChange={(e) => setRequireComments(e.target.checked)} className="rounded" />
              Require written comments for each evaluation
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" checked={allowEditAfterSubmit} onChange={(e) => setAllowEditAfterSubmit(e.target.checked)} className="rounded" />
              Allow changes after submission (until deadline)
            </label>
          </div>
        </div>

        {/* Campaign summary */}
        {selectedClassId && residents.length > 0 && selectedSurveyCount > 0 && (
          <div className="rounded-lg p-4" style={{ backgroundColor: COLORS.lightest + '60' }}>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4" style={{ color: COLORS.darker }} />
              <p className="text-sm font-medium" style={{ color: COLORS.darker }}>
                Campaign Summary
              </p>
            </div>
            <p className="text-sm text-slate-600 mb-2">
              {selectedSurveyCount} survey{selectedSurveyCount !== 1 ? 's' : ''} for{' '}
              <strong>{selectedClass?.name}</strong> &middot; {period} {academicYear}
            </p>
            <div className="space-y-1 text-xs text-slate-500">
              {includeSelf && (
                <p>Self-Assessment → {residents.length} resident{residents.length !== 1 ? 's' : ''}</p>
              )}
              {includeCore && (
                <p>Core Faculty Eval → {coreCount} faculty × {residents.length} residents</p>
              )}
              {includeTeaching && (
                <p>Teaching Faculty Eval → {teachingCount} faculty</p>
              )}
              <p className="pt-1 font-medium text-slate-600">
                {selectedSurveyCount} survey{selectedSurveyCount !== 1 ? 's' : ''} will be created as draft
              </p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border rounded-lg text-sm font-medium text-slate-600"
            style={{ borderColor: COLORS.light }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={submitting || !canCreate}
            className="flex-1 py-2.5 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: COLORS.dark }}
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
            ) : (
              <><Send className="w-4 h-4" /> Create Campaign</>
            )}
          </button>
        </div>
      </div>
    </WizardShell>
  );
}

function WizardShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-slate-900">New Evaluation Campaign</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <p className="text-sm text-slate-500 mb-6">
            Select a class, period, and survey types
          </p>
          {children}
        </div>
      </div>
    </div>
  );
}
