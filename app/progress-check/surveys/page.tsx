'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, ClipboardCheck, Calendar, Users, GraduationCap,
  AlertCircle, X, FileText
} from 'lucide-react';
import { useRequireProgressCheckAuth, useProgressCheckUserContext } from '@/context/ProgressCheckUserContext';
import { calculatePGYLevel } from '@/lib/utils/pgy-calculator';
import CampaignWizard from '@/components/eqpqiq/CampaignWizard';

const COLORS = {
  lightest: '#D8F3DC',
  light: '#B7E4C7',
  medium: '#74C69D',
  dark: '#40916C',
  darker: '#2D6A4F',
  veryDark: '#1B4332',
};

const PGY_ACCENT: Record<number, { bg: string; border: string; text: string; badge: string }> = {
  3: { bg: '#FEF3C7', border: '#FDE68A', text: '#92400E', badge: 'Senior' },
  2: { bg: '#DBEAFE', border: '#93C5FD', text: '#1E40AF', badge: 'Mid-level' },
  1: { bg: '#D8F3DC', border: '#B7E4C7', text: '#1B4332', badge: 'Intern' },
};

interface SurveyFromAPI {
  id: string;
  title: string;
  survey_type: string;
  status: 'draft' | 'active' | 'closed';
  program_id: string;
  class_id: string | null;
  period_label: string | null;
  academic_year: string | null;
  deadline: string | null;
  auto_remind: boolean;
  created_at: string;
  audience_filter: { type?: string } | null;
  classes: { id: string; graduation_year: number; name: string } | null;
  programs: { id: string; name: string; specialty: string } | null;
  stats: {
    total_respondents: number;
    completed_count: number;
    started_count: number;
    pending_count: number;
    completion_percentage: number;
  };
}

interface PGYGroup {
  pgy: number;
  graduationYear: number;
  surveys: SurveyFromAPI[];
}

export default function ProgressCheckSurveysPage() {
  const router = useRouter();
  const { user } = useRequireProgressCheckAuth();
  const { can } = useProgressCheckUserContext();

  const [surveys, setSurveys] = useState<SurveyFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showCampaignWizard, setShowCampaignWizard] = useState(false);

  const fetchSurveys = useCallback(async () => {
    if (!user?.programId && !user?.email) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (user?.programId) {
        params.set('program_id', user.programId);
      } else {
        params.set('created_by', user!.email);
      }
      const res = await fetch(`/api/surveys?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch surveys');
      const data = await res.json();
      setSurveys(data.surveys || []);
    } catch (err) {
      console.error('[ProgressCheckSurveys] Error:', err);
      setError('Failed to load surveys');
    } finally {
      setLoading(false);
    }
  }, [user?.programId, user?.email]);

  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  const pgyGroups: PGYGroup[] = useMemo(() => {
    const now = new Date();
    const grouped = new Map<number, SurveyFromAPI[]>();

    for (const s of surveys) {
      const gradYear = s.classes?.graduation_year;
      if (!gradYear) continue;
      const pgy = calculatePGYLevel(gradYear, now);
      if (pgy < 1 || pgy > 3) continue;
      if (!grouped.has(pgy)) grouped.set(pgy, []);
      grouped.get(pgy)!.push(s);
    }

    const typeOrder: Record<string, number> = { self: 0, core_faculty: 1, teaching_faculty: 2 };

    return [3, 2, 1]
      .filter(pgy => grouped.has(pgy))
      .map(pgy => {
        const items = grouped.get(pgy)!.sort((a, b) => {
          const aType = a.audience_filter?.type || (a.survey_type === 'learner_self_assessment' ? 'self' : 'zzz');
          const bType = b.audience_filter?.type || (b.survey_type === 'learner_self_assessment' ? 'self' : 'zzz');
          return (typeOrder[aType] ?? 99) - (typeOrder[bType] ?? 99);
        });
        const gradYear = items[0].classes!.graduation_year;
        return { pgy, graduationYear: gradYear, surveys: items };
      });
  }, [surveys]);

  const unclassified = useMemo(() => {
    return surveys.filter(s => !s.classes?.graduation_year);
  }, [surveys]);

  const handleCampaignCreated = () => {
    setShowCampaignWizard(false);
    fetchSurveys();
  };

  if (!can('canManageSurveys')) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-400" />
        <p className="text-lg font-medium text-slate-900">Access Restricted</p>
        <p className="text-sm text-slate-500 mt-1">
          Only Program Directors can manage surveys.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full mx-auto" style={{ borderColor: COLORS.dark, borderTopColor: 'transparent' }} />
          <p className="text-slate-500">Loading surveys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: COLORS.veryDark }}>
            Survey Management
          </h1>
          <p className="text-slate-600 mt-1">
            Faculty &amp; learner evaluation surveys by class
          </p>
        </div>
        <button
          onClick={() => setShowCampaignWizard(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-white rounded-lg text-sm font-medium transition-colors hover:opacity-90"
          style={{ backgroundColor: COLORS.dark }}
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
          <button onClick={() => setError('')} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {surveys.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center" style={{ borderColor: COLORS.light }}>
          <ClipboardCheck className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-lg font-medium text-slate-900">No Surveys Yet</p>
          <p className="text-sm text-slate-500 mt-1 mb-4">
            Create your first campaign to start collecting evaluations
          </p>
          <button
            onClick={() => setShowCampaignWizard(true)}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg"
            style={{ backgroundColor: COLORS.dark }}
          >
            Create Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {pgyGroups.map(({ pgy, graduationYear, surveys: groupSurveys }) => {
            const accent = PGY_ACCENT[pgy] || PGY_ACCENT[1];
            return (
              <div key={pgy} className="space-y-3">
                {/* Column Header */}
                <div
                  className="rounded-xl p-4 border"
                  style={{ backgroundColor: accent.bg, borderColor: accent.border }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5" style={{ color: accent.text }} />
                      <h2 className="text-lg font-bold" style={{ color: accent.text }}>
                        PGY-{pgy}
                      </h2>
                    </div>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${accent.text}18`, color: accent.text }}
                    >
                      Class of {graduationYear}
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: accent.text, opacity: 0.7 }}>
                    {groupSurveys.length} survey{groupSurveys.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Survey Cards — click navigates to detail page */}
                {groupSurveys.map((survey) => (
                  <SurveyCard
                    key={survey.id}
                    survey={survey}
                    onClick={() => router.push(`/progress-check/surveys/${survey.id}`)}
                  />
                ))}
              </div>
            );
          })}

          {pgyGroups.length === 0 && unclassified.length > 0 && (
            <div className="md:col-span-3 space-y-3">
              <h2 className="text-sm font-medium text-slate-500">All Surveys</h2>
              {unclassified.map((survey) => (
                <SurveyCard
                  key={survey.id}
                  survey={survey}
                  onClick={() => router.push(`/progress-check/surveys/${survey.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Unclassified surveys */}
      {pgyGroups.length > 0 && unclassified.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-500">Other Surveys</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {unclassified.map((survey) => (
              <SurveyCard
                key={survey.id}
                survey={survey}
                onClick={() => router.push(`/progress-check/surveys/${survey.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Campaign Wizard */}
      {showCampaignWizard && user?.programId && (
        <CampaignWizard
          programId={user.programId}
          userEmail={user.email}
          onClose={() => setShowCampaignWizard(false)}
          onCreated={handleCampaignCreated}
        />
      )}
    </div>
  );
}

function getSurveyTypeInfo(survey: SurveyFromAPI): { icon: typeof Users; label: string } {
  const audienceType = survey.audience_filter?.type;
  if (audienceType === 'core_faculty') return { icon: Users, label: 'Core Faculty' };
  if (audienceType === 'teaching_faculty') return { icon: GraduationCap, label: 'Teaching Faculty' };
  if (audienceType === 'self' || survey.survey_type === 'learner_self_assessment') return { icon: FileText, label: 'Self-Assessment' };
  if (survey.survey_type === 'educator_assessment') return { icon: Users, label: 'Faculty Eval' };
  return { icon: ClipboardCheck, label: 'Survey' };
}

function SurveyCard({
  survey,
  onClick,
}: {
  survey: SurveyFromAPI;
  onClick: () => void;
}) {
  const stats = survey.stats;
  const total = stats?.total_respondents || 0;
  const completed = stats?.completed_count || 0;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const { icon: TypeIcon, label: typeLabel } = getSurveyTypeInfo(survey);

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl border p-4 transition-all hover:shadow-md hover:border-slate-300"
      style={{ borderColor: COLORS.light }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <TypeIcon className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-medium text-slate-500">{typeLabel}</span>
        </div>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide shrink-0"
          style={{
            backgroundColor:
              survey.status === 'active' ? COLORS.lightest :
              survey.status === 'draft' ? '#FEF3C7' : '#F3F4F6',
            color:
              survey.status === 'active' ? COLORS.darker :
              survey.status === 'draft' ? '#92400E' : '#6B7280',
          }}
        >
          {survey.status}
        </span>
      </div>

      {survey.period_label && (
        <p className="text-sm font-semibold text-slate-800 mt-2 leading-snug">
          {survey.period_label}
        </p>
      )}

      {survey.deadline && (
        <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-400">
          <Calendar className="w-3 h-3" />
          Due {new Date(survey.deadline).toLocaleDateString()}
        </div>
      )}

      {/* Progress bar */}
      {total > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-500">{completed}/{total} complete</span>
            <span className="font-semibold" style={{ color: progress === 100 ? COLORS.dark : COLORS.darker }}>
              {progress}%
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress}%`,
                backgroundColor: progress === 100 ? COLORS.dark : COLORS.medium,
              }}
            />
          </div>
        </div>
      )}

      {total === 0 && (
        <p className="text-xs text-slate-400 mt-2 italic">Not yet distributed</p>
      )}
    </button>
  );
}
