'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Calendar, Bell, Settings2, Users, UserCheck, GraduationCap,
  Send, Loader2, AlertCircle, X, CheckCircle2, Clock, FileText,
  ChevronRight, Mail, Edit3, Save, Heart, Award, Brain, ClipboardList
} from 'lucide-react';
import { useRequireProgressCheckAuth, useProgressCheckUserContext } from '@/context/ProgressCheckUserContext';
import { calculatePGYLevel } from '@/lib/utils/pgy-calculator';
import CompletionMatrix from '@/components/eqpqiq/CompletionMatrix';
import ScoreRangeKey from '@/components/eqpqiq/analytics/ScoreRangeKey';

const COLORS = {
  lightest: '#D8F3DC',
  light: '#B7E4C7',
  medium: '#74C69D',
  dark: '#40916C',
  darker: '#2D6A4F',
  veryDark: '#1B4332',
};

interface SurveyData {
  id: string;
  title: string;
  description: string | null;
  survey_type: string;
  status: 'draft' | 'active' | 'closed';
  deadline: string | null;
  period_label: string | null;
  academic_year: string | null;
  auto_remind: boolean;
  remind_every_days: number | null;
  max_reminders: number;
  audience_filter: { type?: string } | null;
  settings: {
    require_all_ratings?: boolean;
    require_comments?: boolean;
    allow_edit_after_submit?: boolean;
  } | null;
  program_id: string;
  class_id: string | null;
  classes: { id: string; graduation_year: number; name: string } | null;
  programs: { id: string; name: string; specialty: string } | null;
}

interface RespondentData {
  id: string;
  email: string;
  name: string | null;
  status: 'pending' | 'started' | 'completed';
  rater_type: string | null;
  token: string;
  reminder_count: number;
  last_reminded_at: string | null;
  completed_at: string | null;
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

type Tab = 'survey' | 'overview' | 'recipients' | 'completion';

const SURVEY_SECTIONS = [
  {
    id: 'eq',
    title: 'Emotional Intelligence (EQ)',
    subtitle: 'Interpersonal & Intrapersonal Skills',
    icon: Heart,
    iconColor: '#EF4444',
    accentBg: '#FEF2F2',
    accentBorder: '#FECACA',
    accentText: '#DC2626',
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
    icon: Award,
    iconColor: '#2563EB',
    accentBg: '#EFF6FF',
    accentBorder: '#BFDBFE',
    accentText: '#1D4ED8',
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
    icon: Brain,
    iconColor: '#7C3AED',
    accentBg: '#F5F3FF',
    accentBorder: '#DDD6FE',
    accentText: '#6D28D9',
    attributes: [
      { key: 'iq_knowledge_base', label: 'Strong Knowledge Base', desc: 'Medical knowledge breadth and depth' },
      { key: 'iq_analytical_thinking', label: 'Analytical Thinking', desc: 'Clinical reasoning, differential diagnosis' },
      { key: 'iq_commitment_learning', label: 'Commitment to Learning', desc: 'Acquiring new information, staying current' },
      { key: 'iq_clinical_flexibility', label: 'Clinical Flexibility', desc: 'Adjusting approach based on new information' },
      { key: 'iq_performance_for_level', label: 'Performance for Level', desc: 'Overall clinical performance relative to peers' },
    ],
  },
];

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

export default function SurveyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = params.surveyId as string;
  const { user } = useRequireProgressCheckAuth();
  const { can } = useProgressCheckUserContext();

  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [respondents, setRespondents] = useState<RespondentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('survey');

  // Editing state
  const [editing, setEditing] = useState(false);
  const [editDeadline, setEditDeadline] = useState('');
  const [editAutoRemind, setEditAutoRemind] = useState(true);
  const [editRemindDays, setEditRemindDays] = useState(3);
  const [editMaxReminders, setEditMaxReminders] = useState(5);
  const [editRequireRatings, setEditRequireRatings] = useState(true);
  const [editRequireComments, setEditRequireComments] = useState(false);
  const [editAllowEdit, setEditAllowEdit] = useState(true);
  const [saving, setSaving] = useState(false);

  // Recipient population
  const [faculty, setFaculty] = useState<FacultyInfo[]>([]);
  const [residents, setResidents] = useState<ResidentInfo[]>([]);
  const [populateLoading, setPopulateLoading] = useState(false);
  const [distributing, setDistributing] = useState(false);
  const [excludedEmails, setExcludedEmails] = useState<Set<string>>(new Set());

  const fetchSurvey = useCallback(async () => {
    try {
      const res = await fetch(`/api/surveys/${surveyId}`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setSurvey(data.survey);
      setRespondents(data.respondents || []);
    } catch {
      setError('Failed to load survey');
    } finally {
      setLoading(false);
    }
  }, [surveyId]);

  useEffect(() => {
    fetchSurvey();
  }, [fetchSurvey]);

  // Sync edit fields when survey loads
  useEffect(() => {
    if (survey) {
      setEditDeadline(survey.deadline ? survey.deadline.split('T')[0] : '');
      setEditAutoRemind(survey.auto_remind);
      setEditRemindDays(survey.remind_every_days || 3);
      setEditMaxReminders(survey.max_reminders || 5);
      setEditRequireRatings(survey.settings?.require_all_ratings ?? true);
      setEditRequireComments(survey.settings?.require_comments ?? false);
      setEditAllowEdit(survey.settings?.allow_edit_after_submit ?? true);
    }
  }, [survey]);

  // Expose survey title for breadcrumb (Progress Check layout resolves UUID → title)
  useEffect(() => {
    if (survey?.id && survey.title) {
      sessionStorage.setItem(`progress-check-survey-title-${survey.id}`, survey.title);
      window.dispatchEvent(new Event('progress-check-breadcrumb-update'));
    }
  }, [survey?.id, survey?.title]);

  const handleSaveSettings = async () => {
    if (!survey) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/surveys/${survey.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deadline: editDeadline || null,
          auto_remind: editAutoRemind,
          remind_every_days: editAutoRemind ? editRemindDays : null,
          max_reminders: editAutoRemind ? editMaxReminders : 5,
          settings: {
            require_all_ratings: editRequireRatings,
            require_comments: editRequireComments,
            allow_edit_after_submit: editAllowEdit,
          },
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setEditing(false);
      await fetchSurvey();
    } catch {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Load populate data for recipient tab
  const loadPopulateData = useCallback(async () => {
    if (!survey?.program_id) return;
    setPopulateLoading(true);
    try {
      const url = `/api/progress-check/campaign/populate?program_id=${survey.program_id}${survey.class_id ? `&class_id=${survey.class_id}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setFaculty(data.faculty || []);
      setResidents(data.residents || []);
    } catch {
      setError('Failed to load program data');
    } finally {
      setPopulateLoading(false);
    }
  }, [survey?.program_id, survey?.class_id]);

  useEffect(() => {
    if (tab === 'recipients' && faculty.length === 0) {
      loadPopulateData();
    }
  }, [tab, faculty.length, loadPopulateData]);

  const handleDistribute = async () => {
    if (!survey) return;
    setDistributing(true);
    setError('');
    try {
      const audienceType = survey.audience_filter?.type;
      const respondentPayload: { email: string; name: string; role: string; rater_type: string; resident_id?: string }[] = [];

      const isIncluded = (email: string) => !excludedEmails.has(email);

      if (audienceType === 'self' || survey.survey_type === 'learner_self_assessment') {
        for (const r of residents.filter(r => isIncluded(r.email))) {
          respondentPayload.push({
            email: r.email,
            name: r.full_name,
            role: 'resident',
            rater_type: 'self',
            resident_id: r.id,
          });
        }
      } else if (audienceType === 'core_faculty') {
        for (const f of faculty.filter(f => f.faculty_type === 'core' && isIncluded(f.email))) {
          respondentPayload.push({
            email: f.email,
            name: f.full_name + (f.credentials ? `, ${f.credentials}` : ''),
            role: 'faculty',
            rater_type: 'core_faculty',
          });
        }
      } else if (audienceType === 'teaching_faculty') {
        for (const f of faculty.filter(f => f.faculty_type === 'teaching' && isIncluded(f.email))) {
          respondentPayload.push({
            email: f.email,
            name: f.full_name + (f.credentials ? `, ${f.credentials}` : ''),
            role: 'faculty',
            rater_type: 'teaching_faculty',
          });
        }
      } else {
        for (const r of residents.filter(r => isIncluded(r.email))) {
          respondentPayload.push({ email: r.email, name: r.full_name, role: 'resident', rater_type: 'self' });
        }
        for (const f of faculty.filter(f => isIncluded(f.email))) {
          respondentPayload.push({
            email: f.email,
            name: f.full_name + (f.credentials ? `, ${f.credentials}` : ''),
            role: 'faculty',
            rater_type: f.faculty_type === 'core' ? 'core_faculty' : 'teaching_faculty',
          });
        }
      }

      if (respondentPayload.length === 0) {
        setError('No recipients to distribute to. Check that faculty/residents exist for this class.');
        setDistributing(false);
        return;
      }

      const res = await fetch(`/api/surveys/${survey.id}/distribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respondents: respondentPayload, send_emails: true }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to distribute');
      }

      const result = await res.json();
      console.log('[SurveyDetail] Distributed:', result);
      await fetchSurvey();
      setTab('completion');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to distribute');
    } finally {
      setDistributing(false);
    }
  };

  const handleSendReminders = async () => {
    if (!survey) return;
    try {
      await fetch(`/api/surveys/${survey.id}/remind`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      await fetchSurvey();
    } catch {
      setError('Failed to send reminders');
    }
  };

  if (!can('canManageSurveys')) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-400" />
        <p className="text-lg font-medium text-slate-900">Access Restricted</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: COLORS.dark }} />
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-400" />
        <p className="text-lg font-medium text-slate-900">Survey not found</p>
        <button onClick={() => router.push('/progress-check/surveys')} className="mt-4 text-sm underline" style={{ color: COLORS.dark }}>
          Back to surveys
        </button>
      </div>
    );
  }

  const pgy = survey.classes ? calculatePGYLevel(survey.classes.graduation_year) : null;
  const audienceType = survey.audience_filter?.type;
  const surveyTypeLabel =
    audienceType === 'core_faculty' ? 'Core Faculty Evaluation' :
    audienceType === 'teaching_faculty' ? 'Teaching Faculty Evaluation' :
    audienceType === 'self' || survey.survey_type === 'learner_self_assessment' ? 'Resident Self-Assessment' :
    'Faculty Evaluation';

  const isDraft = survey.status === 'draft';
  const isActive = survey.status === 'active';

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: 'survey', label: 'Survey', icon: ClipboardList },
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'recipients', label: isDraft ? 'Recipients' : 'Respondents', icon: Users },
    ...(isActive || survey.status === 'closed' ? [{ id: 'completion' as Tab, label: 'Completion', icon: CheckCircle2 }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => router.push('/progress-check/surveys')}
          className="flex items-center gap-1 text-sm mb-4 transition-colors hover:opacity-80"
          style={{ color: COLORS.dark }}
        >
          <ArrowLeft className="w-4 h-4" />
          All Surveys
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {pgy && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: COLORS.lightest, color: COLORS.darker }}>
                  PGY-{pgy}
                </span>
              )}
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
                style={{
                  backgroundColor: isActive ? COLORS.lightest : isDraft ? '#FEF3C7' : '#F3F4F6',
                  color: isActive ? COLORS.darker : isDraft ? '#92400E' : '#6B7280',
                }}
              >
                {survey.status}
              </span>
            </div>
            <h1 className="text-xl font-bold" style={{ color: COLORS.veryDark }}>
              {surveyTypeLabel}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {survey.period_label} · {survey.academic_year}
              {survey.classes && ` · ${survey.classes.name}`}
            </p>
          </div>

          {/* Primary action */}
          {isDraft && (
            <button
              onClick={() => { setTab('recipients'); }}
              className="flex items-center gap-2 px-4 py-2.5 text-white rounded-lg text-sm font-medium shrink-0 hover:opacity-90"
              style={{ backgroundColor: COLORS.dark }}
            >
              <Send className="w-4 h-4" />
              Prepare & Distribute
            </button>
          )}
          {isActive && (
            <button
              onClick={handleSendReminders}
              className="flex items-center gap-2 px-4 py-2.5 text-white rounded-lg text-sm font-medium shrink-0 hover:opacity-90"
              style={{ backgroundColor: COLORS.dark }}
            >
              <Mail className="w-4 h-4" />
              Send Reminders
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1" style={{ borderBottom: `1px solid ${COLORS.light}` }}>
        {tabs.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                active ? '' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
              style={active ? { borderColor: COLORS.dark, color: COLORS.darker } : undefined}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {tab === 'survey' && <SurveyPreviewTab />}

      {tab === 'overview' && (
        <OverviewTab
          survey={survey}
          editing={editing}
          setEditing={setEditing}
          saving={saving}
          editDeadline={editDeadline}
          setEditDeadline={setEditDeadline}
          editAutoRemind={editAutoRemind}
          setEditAutoRemind={setEditAutoRemind}
          editRemindDays={editRemindDays}
          setEditRemindDays={setEditRemindDays}
          editMaxReminders={editMaxReminders}
          setEditMaxReminders={setEditMaxReminders}
          editRequireRatings={editRequireRatings}
          setEditRequireRatings={setEditRequireRatings}
          editRequireComments={editRequireComments}
          setEditRequireComments={setEditRequireComments}
          editAllowEdit={editAllowEdit}
          setEditAllowEdit={setEditAllowEdit}
          onSave={handleSaveSettings}
          respondentCount={respondents.length}
        />
      )}

      {tab === 'recipients' && (
        <RecipientsTab
          survey={survey}
          respondents={respondents}
          faculty={faculty}
          residents={residents}
          populateLoading={populateLoading}
          distributing={distributing}
          excludedEmails={excludedEmails}
          onToggleRecipient={(email) => {
            setExcludedEmails(prev => {
              const next = new Set(prev);
              if (next.has(email)) next.delete(email);
              else next.add(email);
              return next;
            });
          }}
          onDistribute={handleDistribute}
        />
      )}

      {tab === 'completion' && (
        <div className="space-y-4">
          <CompletionMatrix
            surveyId={survey.id}
            onRemindAll={handleSendReminders}
            onRemindOne={async (respondentId) => {
              await fetch(`/api/surveys/${survey.id}/remind`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ respondent_id: respondentId }),
              });
              await fetchSurvey();
            }}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Overview Tab
// ============================================================================

function OverviewTab({
  survey, editing, setEditing, saving,
  editDeadline, setEditDeadline,
  editAutoRemind, setEditAutoRemind,
  editRemindDays, setEditRemindDays,
  editMaxReminders, setEditMaxReminders,
  editRequireRatings, setEditRequireRatings,
  editRequireComments, setEditRequireComments,
  editAllowEdit, setEditAllowEdit,
  onSave, respondentCount,
}: {
  survey: SurveyData;
  editing: boolean;
  setEditing: (v: boolean) => void;
  saving: boolean;
  editDeadline: string;
  setEditDeadline: (v: string) => void;
  editAutoRemind: boolean;
  setEditAutoRemind: (v: boolean) => void;
  editRemindDays: number;
  setEditRemindDays: (v: number) => void;
  editMaxReminders: number;
  setEditMaxReminders: (v: number) => void;
  editRequireRatings: boolean;
  setEditRequireRatings: (v: boolean) => void;
  editRequireComments: boolean;
  setEditRequireComments: (v: boolean) => void;
  editAllowEdit: boolean;
  setEditAllowEdit: (v: boolean) => void;
  onSave: () => void;
  respondentCount: number;
}) {
  const isDraft = survey.status === 'draft';

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {/* Survey Info */}
      <div className="bg-white rounded-xl border p-5 space-y-4" style={{ borderColor: COLORS.light }}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Survey Details</h3>
          {isDraft && !editing && (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs font-medium" style={{ color: COLORS.dark }}>
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          )}
          {editing && (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="text-xs text-slate-500">Cancel</button>
              <button onClick={onSave} disabled={saving} className="flex items-center gap-1 text-xs font-medium text-white px-2.5 py-1 rounded" style={{ backgroundColor: COLORS.dark }}>
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3 text-sm">
          <InfoRow label="Title" value={survey.title} />
          {survey.description && <InfoRow label="Description" value={survey.description} />}
          <InfoRow label="Type" value={survey.survey_type.replace(/_/g, ' ')} />
          <InfoRow label="Period" value={`${survey.period_label || '—'} · ${survey.academic_year || '—'}`} />

          {editing ? (
            <div>
              <label className="block text-xs text-slate-500 mb-1">Deadline</label>
              <input
                type="date"
                value={editDeadline}
                onChange={(e) => setEditDeadline(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                style={{ borderColor: COLORS.light }}
              />
            </div>
          ) : (
            <InfoRow
              label="Deadline"
              value={survey.deadline ? new Date(survey.deadline).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }) : 'Not set'}
            />
          )}

          <InfoRow label="Status" value={survey.status.toUpperCase()} />
          <InfoRow label="Respondents" value={respondentCount > 0 ? `${respondentCount} assigned` : 'Not yet distributed'} />
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-5">
        {/* Reminder settings */}
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: COLORS.light }}>
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4" style={{ color: COLORS.dark }} />
            <h3 className="font-semibold text-slate-900 text-sm">Reminder Settings</h3>
          </div>

          {editing ? (
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" checked={editAutoRemind} onChange={(e) => setEditAutoRemind(e.target.checked)} className="rounded" />
                Automated reminders
              </label>
              {editAutoRemind && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Every N days</label>
                    <input type="number" value={editRemindDays} onChange={(e) => setEditRemindDays(parseInt(e.target.value) || 3)} min={1} max={30} className="w-full px-2 py-1.5 border rounded text-sm" style={{ borderColor: COLORS.light }} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Max reminders</label>
                    <input type="number" value={editMaxReminders} onChange={(e) => setEditMaxReminders(parseInt(e.target.value) || 5)} min={1} max={20} className="w-full px-2 py-1.5 border rounded text-sm" style={{ borderColor: COLORS.light }} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-slate-600 space-y-1">
              <p>{survey.auto_remind ? `Every ${survey.remind_every_days || 3} days, max ${survey.max_reminders || 5}` : 'Manual only'}</p>
            </div>
          )}
        </div>

        {/* Form settings */}
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: COLORS.light }}>
          <div className="flex items-center gap-2 mb-3">
            <Settings2 className="w-4 h-4" style={{ color: COLORS.dark }} />
            <h3 className="font-semibold text-slate-900 text-sm">Form Settings</h3>
          </div>

          {editing ? (
            <div className="space-y-2.5">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" checked={editRequireRatings} onChange={(e) => setEditRequireRatings(e.target.checked)} className="rounded" />
                Require all rating sliders
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" checked={editRequireComments} onChange={(e) => setEditRequireComments(e.target.checked)} className="rounded" />
                Require comments
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" checked={editAllowEdit} onChange={(e) => setEditAllowEdit(e.target.checked)} className="rounded" />
                Allow editing after submit
              </label>
            </div>
          ) : (
            <div className="text-sm text-slate-600 space-y-1.5">
              <SettingLine on={survey.settings?.require_all_ratings} label="All ratings required" offLabel="Ratings optional" />
              <SettingLine on={survey.settings?.require_comments} label="Comments required" offLabel="Comments optional" />
              <SettingLine on={survey.settings?.allow_edit_after_submit} label="Editable after submit" offLabel="No editing after submit" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="font-medium text-slate-800 text-right">{value}</span>
    </div>
  );
}

function SettingLine({ on, label, offLabel }: { on?: boolean; label: string; offLabel: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-1.5 h-1.5 rounded-full ${on ? 'bg-green-500' : 'bg-slate-300'}`} />
      <span>{on ? label : offLabel}</span>
    </div>
  );
}

// ============================================================================
// Recipients Tab
// ============================================================================

function RecipientsTab({
  survey, respondents, faculty, residents, populateLoading, distributing,
  excludedEmails, onToggleRecipient, onDistribute,
}: {
  survey: SurveyData;
  respondents: RespondentData[];
  faculty: FacultyInfo[];
  residents: ResidentInfo[];
  populateLoading: boolean;
  distributing: boolean;
  excludedEmails: Set<string>;
  onToggleRecipient: (email: string) => void;
  onDistribute: () => void;
}) {
  const isDraft = survey.status === 'draft';
  const hasRespondents = respondents.length > 0;

  if (populateLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: COLORS.dark }} />
        <span className="ml-2 text-sm text-slate-500">Loading program data...</span>
      </div>
    );
  }

  // Already distributed — show respondent list
  if (hasRespondents) {
    const grouped = {
      self: respondents.filter(r => r.rater_type === 'self'),
      core: respondents.filter(r => r.rater_type === 'core_faculty'),
      teaching: respondents.filter(r => r.rater_type === 'teaching_faculty'),
      other: respondents.filter(r => !r.rater_type),
    };

    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-500">{respondents.length} respondents assigned</p>
        {grouped.self.length > 0 && <RespondentGroup title="Residents (Self)" icon={<GraduationCap className="w-4 h-4" />} list={grouped.self} />}
        {grouped.core.length > 0 && <RespondentGroup title="Core Faculty" icon={<UserCheck className="w-4 h-4" />} list={grouped.core} />}
        {grouped.teaching.length > 0 && <RespondentGroup title="Teaching Faculty" icon={<Users className="w-4 h-4" />} list={grouped.teaching} />}
        {grouped.other.length > 0 && <RespondentGroup title="Other" icon={<Users className="w-4 h-4" />} list={grouped.other} />}
      </div>
    );
  }

  // Draft — show who will receive it + Distribute button
  const audienceType = survey.audience_filter?.type;
  let targetList: { name: string; email: string; type: string }[] = [];

  if (audienceType === 'self' || survey.survey_type === 'learner_self_assessment') {
    targetList = residents.map(r => ({ name: r.full_name, email: r.email, type: 'Resident' }));
  } else if (audienceType === 'core_faculty') {
    targetList = faculty.filter(f => f.faculty_type === 'core').map(f => ({
      name: f.full_name + (f.credentials ? `, ${f.credentials}` : ''),
      email: f.email,
      type: 'Core Faculty',
    }));
  } else if (audienceType === 'teaching_faculty') {
    targetList = faculty.filter(f => f.faculty_type === 'teaching').map(f => ({
      name: f.full_name + (f.credentials ? `, ${f.credentials}` : ''),
      email: f.email,
      type: 'Teaching Faculty',
    }));
  }

  const enabledCount = targetList.filter(r => !excludedEmails.has(r.email)).length;

  return (
    <div className="space-y-5">
      {/* Preview */}
      <div className="bg-white rounded-xl border p-5" style={{ borderColor: COLORS.light }}>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">
          {enabledCount} recipient{enabledCount !== 1 ? 's' : ''} will receive this survey
          {excludedEmails.size > 0 && (
            <span className="text-xs font-normal text-slate-400 ml-2">
              ({excludedEmails.size} excluded)
            </span>
          )}
        </h3>

        {targetList.length === 0 ? (
          <p className="text-sm text-slate-400 italic">
            No matching {audienceType === 'core_faculty' ? 'core faculty' : audienceType === 'teaching_faculty' ? 'teaching faculty' : 'residents'} found.
            Check the Faculty Manager in Settings.
          </p>
        ) : (
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {targetList.map((r, i) => {
              const isOn = !excludedEmails.has(r.email);
              return (
                <div key={i} className={`flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 ${!isOn ? 'opacity-50' : ''}`}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{r.name}</p>
                    <p className="text-xs text-slate-400 truncate">{r.email}</p>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0 ml-2 mr-3">{r.type}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isOn}
                    onClick={() => onToggleRecipient(r.email)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1`}
                    style={{ backgroundColor: isOn ? COLORS.dark : '#CBD5E1' }}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ${isOn ? 'translate-x-4' : 'translate-x-0'}`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Distribute button */}
      {isDraft && enabledCount > 0 && (
        <div className="rounded-xl border p-5" style={{ borderColor: COLORS.light, backgroundColor: COLORS.lightest + '40' }}>
          <div className="flex items-start gap-3">
            <Send className="w-5 h-5 mt-0.5 shrink-0" style={{ color: COLORS.dark }} />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-800">Ready to distribute</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Each recipient will receive a unique survey link via email. The survey status will change from Draft to Active.
              </p>
              <button
                onClick={onDistribute}
                disabled={distributing}
                className="mt-3 flex items-center gap-2 px-5 py-2.5 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:opacity-90"
                style={{ backgroundColor: COLORS.dark }}
              >
                {distributing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Distributing...</>
                ) : (
                  <><Send className="w-4 h-4" /> Distribute &amp; Send Emails</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RespondentGroup({ title, icon, list }: { title: string; icon: React.ReactNode; list: RespondentData[] }) {
  const [expanded, setExpanded] = useState(false);
  const completed = list.filter(r => r.status === 'completed').length;

  return (
    <div className="bg-white rounded-xl border" style={{ borderColor: COLORS.light }}>
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-4 hover:bg-green-50/30">
        <div className="flex items-center gap-2">
          <span style={{ color: COLORS.dark }}>{icon}</span>
          <span className="text-sm font-medium text-slate-900">{title}</span>
          <span className="text-xs text-slate-400">({completed}/{list.length})</span>
        </div>
        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>
      {expanded && (
        <div className="border-t px-4 pb-3 pt-2 space-y-1" style={{ borderColor: COLORS.lightest }}>
          {list.map(r => (
            <div key={r.id} className="flex items-center justify-between py-1.5">
              <div className="min-w-0">
                <p className="text-sm text-slate-700 truncate">{r.name || r.email}</p>
                <p className="text-xs text-slate-400 truncate">{r.email}</p>
              </div>
              <StatusBadge status={r.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'completed') {
    return <span className="flex items-center gap-1 text-xs font-medium text-green-700"><CheckCircle2 className="w-3 h-3" /> Done</span>;
  }
  if (status === 'started') {
    return <span className="flex items-center gap-1 text-xs font-medium text-amber-600"><Clock className="w-3 h-3" /> Started</span>;
  }
  return <span className="flex items-center gap-1 text-xs font-medium text-slate-400"><Clock className="w-3 h-3" /> Pending</span>;
}

// ============================================================================
// Survey Preview Tab — compact view, all attributes grouped per pillar card
// ============================================================================

function getSliderColor(value: number) {
  if (value < 33) return COLORS.medium;
  if (value < 66) return COLORS.dark;
  return COLORS.darker;
}

function SurveyPreviewTab() {
  const [values, setValues] = useState<Record<string, number>>({});
  const [localValues, setLocalValues] = useState<Record<string, number>>({});

  const handleChange = (key: string, raw: number) => {
    const snapped = Math.round(raw / 5) * 5;
    setLocalValues(prev => ({ ...prev, [key]: snapped }));
  };

  const handleCommit = (key: string) => {
    const v = localValues[key];
    if (v !== undefined) setValues(prev => ({ ...prev, [key]: v }));
  };

  const getVal = (key: string) => localValues[key] ?? values[key] ?? 50;

  const getRatingLabel = (value: number): string => {
    const thresholds = Object.keys(RATING_LABELS).map(Number).sort((a, b) => b - a);
    for (const t of thresholds) {
      if (value >= t) return RATING_LABELS[t];
    }
    return RATING_LABELS[0];
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <p className="text-sm text-slate-500 text-center">
        Survey form preview — 15 attributes across 3 pillars, scored 0–100.
      </p>
      <div className="bg-white rounded-lg border px-3 py-2.5" style={{ borderColor: COLORS.light }}>
        <p className="text-[11px] text-slate-500 text-center mb-1.5">Score meaning</p>
        <ScoreRangeKey />
      </div>

      {SURVEY_SECTIONS.map(section => {
        const Icon = section.icon;
        const sectionValues = section.attributes.map(a => getVal(a.key));
        const sectionAvg = Math.round(sectionValues.reduce((s, v) => s + v, 0) / sectionValues.length);

        return (
          <div
            key={section.id}
            className="bg-white rounded-xl border overflow-hidden"
            style={{ borderColor: COLORS.light }}
          >
            {/* Pillar header */}
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

            {/* Compact attribute rows */}
            <div>
              {section.attributes.map((attr, idx) => {
                const val = getVal(attr.key);
                const fillColor = getSliderColor(val);

                return (
                  <div key={attr.key} className="px-5 py-3" style={idx > 0 ? { borderTop: `1px solid ${COLORS.lightest}` } : undefined}>
                    {/* Row: label + score */}
                    <div className="flex items-baseline justify-between mb-0.5">
                      <p className="text-sm font-medium text-slate-800">{attr.label}</p>
                      <span className="text-lg font-bold shrink-0 ml-3" style={{ color: COLORS.dark }}>{val}</span>
                    </div>

                    {/* Slider — compact height */}
                    <div className="relative h-7 flex items-center">
                      <div className="absolute w-full h-3 rounded-full" style={{ backgroundColor: COLORS.lightest }} />
                      {val > 0 && (
                        <div
                          className="absolute h-3 rounded-full transition-all duration-150"
                          style={{ width: `${Math.max(val, 3)}%`, backgroundColor: fillColor }}
                        />
                      )}
                      <div
                        className="absolute w-5 h-5 rounded-full bg-white shadow-md transition-all duration-150 pointer-events-none"
                        style={{ left: `${val}%`, transform: 'translateX(-50%)', border: `2.5px solid ${fillColor}` }}
                      />
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={val}
                        onChange={(e) => handleChange(attr.key, parseInt(e.target.value))}
                        onMouseUp={() => handleCommit(attr.key)}
                        onTouchEnd={() => handleCommit(attr.key)}
                        onKeyUp={() => handleCommit(attr.key)}
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

                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Comments */}
      <div className="bg-white rounded-xl p-5 border" style={{ borderColor: COLORS.light }}>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Comments &amp; Observations
        </label>
        <textarea
          className="w-full px-3 py-2.5 border rounded-lg bg-white text-sm text-slate-900 placeholder-slate-400 resize-none"
          style={{ borderColor: COLORS.light }}
          rows={3}
          placeholder="Any thoughts or observations..."
        />
      </div>
    </div>
  );
}
