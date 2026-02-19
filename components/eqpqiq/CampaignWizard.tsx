'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X, ChevronRight, ChevronLeft, Users, UserCheck, GraduationCap,
  Calendar, Bell, Loader2, CheckCircle2, AlertCircle, Send,
  Eye, Trash2, Settings2
} from 'lucide-react';

const COLORS = {
  lightest: '#D8F3DC',
  light: '#B7E4C7',
  medium: '#74C69D',
  dark: '#40916C',
  darker: '#2D6A4F',
  veryDark: '#1B4332',
};

// ============================================================================
// Types
// ============================================================================

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
  personal_email: string | null;
}

interface ResidentInfo {
  id: string;
  full_name: string;
  email: string;
  personal_email: string | null;
  class_id: string;
}

interface RespondentEntry {
  email: string;
  name: string;
  role: 'resident' | 'faculty';
  rater_type: 'core_faculty' | 'teaching_faculty' | 'self';
  faculty_id?: string;
  resident_id?: string;
  user_profile_id?: string;
  included: boolean;
}

interface CampaignWizardProps {
  programId: string;
  userEmail: string;
  onClose: () => void;
  onCreated: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

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

function getCurrentPeriod(): 'Spring' | 'Fall' {
  const month = new Date().getMonth() + 1;
  return month >= 1 && month <= 6 ? 'Spring' : 'Fall';
}

// ============================================================================
// Component
// ============================================================================

export default function CampaignWizard({ programId, userEmail, onClose, onCreated }: CampaignWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Data from API
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [faculty, setFaculty] = useState<FacultyInfo[]>([]);
  const [residents, setResidents] = useState<ResidentInfo[]>([]);

  // Step 1: Campaign config
  const [selectedClassId, setSelectedClassId] = useState('');
  const [period, setPeriod] = useState<'Spring' | 'Fall'>(getCurrentPeriod());
  const [academicYear, setAcademicYear] = useState(getCurrentAcademicYear());
  const [deadline, setDeadline] = useState('');
  const [autoRemind, setAutoRemind] = useState(true);
  const [remindEveryDays, setRemindEveryDays] = useState(3);
  const [maxReminders, setMaxReminders] = useState(5);
  const [requireAllRatings, setRequireAllRatings] = useState(true);
  const [requireComments, setRequireComments] = useState(false);
  const [allowEditAfterSubmit, setAllowEditAfterSubmit] = useState(true);

  // Step 2: Respondent groups
  const [respondents, setRespondents] = useState<RespondentEntry[]>([]);

  // Load classes and faculty on mount
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

  // Load residents when class changes
  const loadResidents = useCallback(async (classId: string) => {
    if (!classId) {
      setResidents([]);
      return;
    }
    try {
      const res = await fetch(
        `/api/progress-check/campaign/populate?program_id=${programId}&class_id=${classId}`
      );
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

  // Build respondent list when we move to step 2
  const buildRespondentList = useCallback(() => {
    const list: RespondentEntry[] = [];

    // Residents (self-assessment)
    for (const r of residents) {
      list.push({
        email: r.email,
        name: r.full_name,
        role: 'resident',
        rater_type: 'self',
        resident_id: r.id,
        included: true,
      });
    }

    // Core Faculty
    for (const f of faculty.filter(f => f.faculty_type === 'core')) {
      list.push({
        email: f.email,
        name: f.full_name + (f.credentials ? `, ${f.credentials}` : ''),
        role: 'faculty',
        rater_type: 'core_faculty',
        faculty_id: f.id,
        included: true,
      });
    }

    // Teaching Faculty
    for (const f of faculty.filter(f => f.faculty_type === 'teaching')) {
      list.push({
        email: f.email,
        name: f.full_name + (f.credentials ? `, ${f.credentials}` : ''),
        role: 'faculty',
        rater_type: 'teaching_faculty',
        faculty_id: f.id,
        included: true,
      });
    }

    setRespondents(list);
  }, [residents, faculty]);

  const goToStep2 = () => {
    if (!selectedClassId) {
      setError('Please select a class');
      return;
    }
    buildRespondentList();
    setStep(2);
    setError('');
  };

  const toggleRespondent = (idx: number) => {
    setRespondents(prev =>
      prev.map((r, i) => i === idx ? { ...r, included: !r.included } : r)
    );
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const includedRespondents = respondents.filter(r => r.included);
  const selfCount = includedRespondents.filter(r => r.rater_type === 'self').length;
  const coreCount = includedRespondents.filter(r => r.rater_type === 'core_faculty').length;
  const teachingCount = includedRespondents.filter(r => r.rater_type === 'teaching_faculty').length;

  const campaignTitle = selectedClass
    ? `${period} ${academicYear.split('-')[period === 'Spring' ? 1 : 0]} – ${selectedClass.name}`
    : '';

  // Submit: create survey + distribute
  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      // 1. Create the survey
      const periodLabel = selectedClass
        ? `${getPgyLevel(selectedClass.graduation_year)} ${period}`
        : `${period}`;

      const createRes = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          survey_type: 'educator_assessment',
          title: campaignTitle,
          description: `${period} evaluation campaign for ${selectedClass?.name || 'class'}`,
          program_id: programId,
          class_id: selectedClassId,
          period_label: periodLabel,
          academic_year: academicYear,
          deadline: deadline || null,
          auto_remind: autoRemind,
          remind_every_days: autoRemind ? remindEveryDays : null,
          max_reminders: autoRemind ? maxReminders : 5,
          created_by_email: userEmail,
          settings: {
            require_all_ratings: requireAllRatings,
            require_comments: requireComments,
            allow_edit_after_submit: allowEditAfterSubmit,
          },
        }),
      });

      if (!createRes.ok) {
        const errData = await createRes.json();
        throw new Error(errData.error || 'Failed to create survey');
      }

      const { survey } = await createRes.json();

      // 2. Distribute to all included respondents
      const respondentPayload = includedRespondents.map(r => ({
        email: r.email,
        name: r.name,
        role: r.role,
        rater_type: r.rater_type,
        resident_id: r.resident_id || undefined,
      }));

      const distRes = await fetch(`/api/surveys/${survey.id}/distribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respondents: respondentPayload,
          send_emails: true,
        }),
      });

      if (!distRes.ok) {
        const errData = await distRes.json();
        throw new Error(errData.error || 'Failed to distribute survey');
      }

      const distResult = await distRes.json();
      console.log('[CampaignWizard] Created and distributed:', survey.id, distResult);

      onCreated();
    } catch (err) {
      console.error('[CampaignWizard] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create campaign');
    } finally {
      setSubmitting(false);
    }
  };

  // ========================================================================
  // Render
  // ========================================================================

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
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                s < step ? 'text-white' : s === step ? 'text-white' : 'text-slate-400 bg-slate-100'
              }`}
              style={s <= step ? { backgroundColor: COLORS.dark } : undefined}
            >
              {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
            </div>
            <span className={`text-sm ${s === step ? 'font-medium text-slate-900' : 'text-slate-400'}`}>
              {s === 1 ? 'Configure' : s === 2 ? 'Recipients' : 'Review'}
            </span>
            {s < 3 && <ChevronRight className="w-4 h-4 text-slate-300" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto text-red-500 font-medium text-xs">Dismiss</button>
        </div>
      )}

      {/* Step 1: Configure */}
      {step === 1 && (
        <div className="space-y-5">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Period *</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as 'Spring' | 'Fall')}
                className="w-full px-3 py-2.5 border rounded-lg text-sm"
                style={{ borderColor: COLORS.light }}
              >
                <option value="Spring">Spring</option>
                <option value="Fall">Fall</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Academic Year</label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2025-2026"
                className="w-full px-3 py-2.5 border rounded-lg text-sm"
                style={{ borderColor: COLORS.light }}
              />
            </div>
          </div>

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

          {/* Reminder settings */}
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
                <input
                  type="checkbox"
                  checked={requireAllRatings}
                  onChange={(e) => setRequireAllRatings(e.target.checked)}
                  className="rounded"
                />
                Require all rating sliders to be explicitly set
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireComments}
                  onChange={(e) => setRequireComments(e.target.checked)}
                  className="rounded"
                />
                Require comments for each resident
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowEditAfterSubmit}
                  onChange={(e) => setAllowEditAfterSubmit(e.target.checked)}
                  className="rounded"
                />
                Allow respondents to edit after submitting (until deadline)
              </label>
            </div>
          </div>

          {/* Preview info */}
          {selectedClassId && residents.length > 0 && (
            <div className="rounded-lg p-4" style={{ backgroundColor: COLORS.lightest + '60' }}>
              <p className="text-sm font-medium" style={{ color: COLORS.darker }}>
                Campaign Preview
              </p>
              <div className="mt-2 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-2xl font-bold" style={{ color: COLORS.veryDark }}>{residents.length}</p>
                  <p className="text-xs text-slate-500">Residents</p>
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: COLORS.veryDark }}>
                    {faculty.filter(f => f.faculty_type === 'core').length}
                  </p>
                  <p className="text-xs text-slate-500">Core Faculty</p>
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: COLORS.veryDark }}>
                    {faculty.filter(f => f.faculty_type === 'teaching').length}
                  </p>
                  <p className="text-xs text-slate-500">Teaching Faculty</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border rounded-lg text-sm font-medium text-slate-600"
              style={{ borderColor: COLORS.light }}
            >
              Cancel
            </button>
            <button
              onClick={goToStep2}
              disabled={!selectedClassId || residents.length === 0}
              className="flex-1 py-2.5 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-1"
              style={{ backgroundColor: COLORS.dark }}
            >
              Next: Recipients
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Recipients */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Resident self-assessments */}
          <RespondentGroup
            title="Residents (Self-Assessment)"
            icon={<GraduationCap className="w-4 h-4" />}
            description="Each resident evaluates themselves"
            respondents={respondents}
            filterType="self"
            onToggle={toggleRespondent}
            allRespondents={respondents}
          />

          {/* Core Faculty */}
          <RespondentGroup
            title="Core Faculty"
            icon={<UserCheck className="w-4 h-4" />}
            description={`Each rates all ${residents.length} residents (required)`}
            respondents={respondents}
            filterType="core_faculty"
            onToggle={toggleRespondent}
            allRespondents={respondents}
          />

          {/* Teaching Faculty */}
          <RespondentGroup
            title="Teaching Faculty"
            icon={<Users className="w-4 h-4" />}
            description="Open roster — rate any residents (min 3 recommended)"
            respondents={respondents}
            filterType="teaching_faculty"
            onToggle={toggleRespondent}
            allRespondents={respondents}
          />

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(1)}
              className="flex items-center justify-center gap-1 px-4 py-2.5 border rounded-lg text-sm font-medium text-slate-600"
              style={{ borderColor: COLORS.light }}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={() => { setStep(3); setError(''); }}
              disabled={includedRespondents.length === 0}
              className="flex-1 py-2.5 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-1"
              style={{ backgroundColor: COLORS.dark }}
            >
              Next: Review
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Send */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="rounded-lg border p-4" style={{ borderColor: COLORS.light }}>
            <h3 className="font-semibold text-slate-900 mb-3">{campaignTitle}</h3>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-slate-500">Class</span>
              <span className="font-medium">{selectedClass?.name}</span>
              <span className="text-slate-500">Period</span>
              <span className="font-medium">{period} {academicYear}</span>
              {deadline && (
                <>
                  <span className="text-slate-500">Deadline</span>
                  <span className="font-medium">{new Date(deadline).toLocaleDateString()}</span>
                </>
              )}
              <span className="text-slate-500">Reminders</span>
              <span className="font-medium">
                {autoRemind ? `Every ${remindEveryDays} days (max ${maxReminders})` : 'Manual only'}
              </span>
            </div>
          </div>

          <div className="rounded-lg border p-4" style={{ borderColor: COLORS.light }}>
            <h4 className="text-sm font-medium text-slate-700 mb-3">Recipients Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Residents (Self-Assessment)</span>
                <span className="font-medium">{selfCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Core Faculty (All {residents.length} residents each)</span>
                <span className="font-medium">{coreCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Teaching Faculty (Open roster)</span>
                <span className="font-medium">{teachingCount}</span>
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between text-sm font-semibold" style={{ borderColor: COLORS.lightest }}>
                <span>Total invitations</span>
                <span>{includedRespondents.length}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4" style={{ borderColor: COLORS.light }}>
            <h4 className="text-sm font-medium text-slate-700 mb-2">Form Settings</h4>
            <div className="space-y-1 text-sm text-slate-600">
              <p>{requireAllRatings ? 'All ratings required' : 'Ratings optional (defaults accepted)'}</p>
              <p>{requireComments ? 'Comments required' : 'Comments optional'}</p>
              <p>{allowEditAfterSubmit ? 'Respondents can edit after submitting' : 'No editing after submission'}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(2)}
              className="flex items-center justify-center gap-1 px-4 py-2.5 border rounded-lg text-sm font-medium text-slate-600"
              style={{ borderColor: COLORS.light }}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || includedRespondents.length === 0}
              className="flex-1 py-2.5 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: COLORS.dark }}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating & Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Create Campaign & Send Invitations
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </WizardShell>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

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
            Create a unified survey campaign for faculty and resident evaluations
          </p>
          {children}
        </div>
      </div>
    </div>
  );
}

function RespondentGroup({
  title,
  icon,
  description,
  respondents,
  filterType,
  onToggle,
  allRespondents,
}: {
  title: string;
  icon: React.ReactNode;
  description: string;
  respondents: RespondentEntry[];
  filterType: string;
  onToggle: (idx: number) => void;
  allRespondents: RespondentEntry[];
}) {
  const [expanded, setExpanded] = useState(false);
  const grouped = allRespondents
    .map((r, idx) => ({ ...r, originalIndex: idx }))
    .filter(r => r.rater_type === filterType);
  const includedCount = grouped.filter(r => r.included).length;

  return (
    <div className="border rounded-lg" style={{ borderColor: COLORS.light }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-green-50/30"
      >
        <div className="flex items-center gap-2">
          <span style={{ color: COLORS.dark }}>{icon}</span>
          <div className="text-left">
            <p className="text-sm font-medium text-slate-900">{title}</p>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: COLORS.darker }}>
            {includedCount}/{grouped.length}
          </span>
          <ChevronRight
            className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
          />
        </div>
      </button>

      {expanded && (
        <div className="border-t px-3 pb-3 pt-2 space-y-1" style={{ borderColor: COLORS.lightest }}>
          {grouped.map(r => (
            <label
              key={r.originalIndex}
              className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={r.included}
                onChange={() => onToggle(r.originalIndex)}
                className="rounded"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 truncate">{r.name}</p>
                <p className="text-xs text-slate-400 truncate">{r.email}</p>
              </div>
            </label>
          ))}
          {grouped.length === 0 && (
            <p className="text-sm text-slate-400 py-2 text-center">
              No {filterType === 'teaching_faculty' ? 'teaching faculty' : 'members'} found
            </p>
          )}
        </div>
      )}
    </div>
  );
}
