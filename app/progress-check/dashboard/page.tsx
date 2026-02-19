'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, BarChart3, ClipboardCheck, TrendingUp,
  ChevronRight, AlertCircle, FileText, Calendar
} from 'lucide-react';
import { useProgressCheckUserContext, useRequireProgressCheckAuth } from '@/context/ProgressCheckUserContext';
import { ScoreCard } from '@/components/eqpqiq/analytics';
import { calculatePGYLevel, formatPGYLevel, isResidentActive } from '@/lib/utils/pgy-calculator';

const COLORS = {
  lightest: '#D8F3DC',
  light: '#B7E4C7',
  medium: '#74C69D',
  dark: '#40916C',
  darker: '#2D6A4F',
  veryDark: '#1B4332',
};

interface ResidentSummary {
  id: string;
  name: string;
  anonCode: string;
  graduationYear: number | null;
  className: string | null;
  currentScores: {
    eq_score?: number;
    pq_score?: number;
    iq_score?: number;
    composite_score?: number;
    faculty_eq_avg?: number;
    faculty_pq_avg?: number;
    faculty_iq_avg?: number;
    periods?: string[];
  } | null;
}

interface ClassInfo {
  id: string;
  graduation_year: number;
  name: string;
  is_active: boolean;
}

interface SurveyInfo {
  id: string;
  title: string;
  type: string;
  status: string;
  deadline: string | null;
  total_respondents: number;
  completed_respondents: number;
}

export default function ProgressCheckDashboardPage() {
  const router = useRouter();
  const { user } = useRequireProgressCheckAuth();
  const { can } = useProgressCheckUserContext();

  const [residents, setResidents] = useState<ResidentSummary[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [surveys, setSurveys] = useState<SurveyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!user?.email) return;

    setLoading(true);
    try {
      // Fetch residents and surveys in parallel
      const [residentsRes, surveysRes] = await Promise.all([
        fetch(`/api/progress-check/residents?email=${encodeURIComponent(user.email)}`),
        can('canManageSurveys')
          ? fetch(`/api/surveys?created_by=${encodeURIComponent(user.email)}&status=active`)
          : Promise.resolve(null),
      ]);

      if (residentsRes.ok) {
        const data = await residentsRes.json();
        setResidents(data.residents || []);
        setClasses(data.classes || []);
      }

      if (surveysRes && surveysRes.ok) {
        const data = await surveysRes.json();
        setSurveys(data.surveys || []);
      }
    } catch (err) {
      console.error('[ProgressCheckDashboard] Error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user?.email, can]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Group residents by class
  const residentsByClass = residents.reduce((acc, r) => {
    const year = r.graduationYear || 0;
    if (!acc[year]) acc[year] = [];
    acc[year].push(r);
    return acc;
  }, {} as Record<number, ResidentSummary[]>);

  // Compute class averages
  const classAverages = Object.entries(residentsByClass).map(([year, classResidents]) => {
    const withScores = classResidents.filter((r) => r.currentScores);
    const avg = (field: string) => {
      const vals = withScores
        .map((r) => {
          const s = r.currentScores as Record<string, unknown>;
          return s?.[field];
        })
        .filter((v): v is number => typeof v === 'number');
      return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };
    const allPeriods = [...new Set(
      withScores.flatMap((r) => r.currentScores?.periods || [])
    )];

    return {
      year: parseInt(year),
      total: classResidents.length,
      eq: avg('faculty_eq_avg') || avg('eq_score'),
      pq: avg('faculty_pq_avg') || avg('pq_score'),
      iq: avg('faculty_iq_avg') || avg('iq_score'),
      periods: allPeriods,
    };
  }).sort((a, b) => {
    const activeA = a.year > 0 && isResidentActive(a.year);
    const activeB = b.year > 0 && isResidentActive(b.year);
    if (activeA && activeB) return a.year - b.year;
    if (activeA && !activeB) return -1;
    if (!activeA && activeB) return 1;
    return b.year - a.year;
  });

  // Stats
  const totalResidents = residents.length;
  const activeSurveys = surveys.filter((s) => s.status === 'active').length;
  const pendingSurveyResponses = surveys.reduce(
    (sum, s) => sum + (s.total_respondents - s.completed_respondents),
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full mx-auto" style={{ borderColor: COLORS.dark, borderTopColor: 'transparent' }} />
          <p className="text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: COLORS.veryDark }}>
          Progress Check Dashboard
        </h1>
        <p className="text-slate-600 mt-1">
          {user?.institutionName || ''} &middot; {user?.programName || 'Program'}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: COLORS.light }}>
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5" style={{ color: COLORS.dark }} />
            <span className="text-sm text-slate-500">Total Residents</span>
          </div>
          <p className="text-3xl font-bold" style={{ color: COLORS.veryDark }}>
            {totalResidents}
          </p>
        </div>

        <div className="bg-white rounded-xl border p-5" style={{ borderColor: COLORS.light }}>
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-5 h-5" style={{ color: COLORS.dark }} />
            <span className="text-sm text-slate-500">Active Classes</span>
          </div>
          <p className="text-3xl font-bold" style={{ color: COLORS.veryDark }}>
            {classAverages.filter(ca => ca.year > 0 && isResidentActive(ca.year)).length}
          </p>
        </div>

        <div className="bg-white rounded-xl border p-5" style={{ borderColor: COLORS.light }}>
          <div className="flex items-center gap-3 mb-2">
            <ClipboardCheck className="w-5 h-5" style={{ color: COLORS.dark }} />
            <span className="text-sm text-slate-500">Active Surveys</span>
          </div>
          <p className="text-3xl font-bold" style={{ color: COLORS.veryDark }}>
            {activeSurveys}
          </p>
        </div>

        <div className="bg-white rounded-xl border p-5" style={{ borderColor: COLORS.light }}>
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5" style={{ color: COLORS.dark }} />
            <span className="text-sm text-slate-500">Pending Responses</span>
          </div>
          <p className="text-3xl font-bold" style={{ color: COLORS.veryDark }}>
            {pendingSurveyResponses}
          </p>
        </div>
      </div>

      {/* Class Cohort Overview */}
      <div className="bg-white rounded-xl border" style={{ borderColor: COLORS.light }}>
        <div className="p-5" style={{ borderBottom: `1px solid ${COLORS.lightest}` }}>
          <h2 className="text-lg font-semibold" style={{ color: COLORS.veryDark }}>
            Class Cohort Overview
          </h2>
        </div>
        <div>
          {classAverages.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No class data available yet.
            </div>
          ) : (
            classAverages.map((ca, idx) => {
              const classInfo = classes.find((c) => c.graduation_year === ca.year);
              const pgyLevel = ca.year > 0 ? calculatePGYLevel(ca.year) : null;
              const active = ca.year > 0 ? isResidentActive(ca.year) : false;
              const hasScores = ca.eq !== null && ca.pq !== null && ca.iq !== null;
              const overall = hasScores ? Math.round(((ca.eq || 0) + (ca.pq || 0) + (ca.iq || 0)) / 3) : null;

              const getOverallColor = (score: number) => {
                if (score >= 75) return { bg: '#F0FDF4', text: '#16A34A' };
                if (score >= 50) return { bg: '#EFF6FF', text: '#2563EB' };
                if (score >= 25) return { bg: '#FFFBEB', text: '#D97706' };
                return { bg: '#FEF2F2', text: '#DC2626' };
              };

              return (
                <div
                  key={ca.year}
                  className="p-4 flex items-center justify-between hover:bg-green-50/30 transition-colors cursor-pointer"
                  style={idx > 0 ? { borderTop: `1px solid ${COLORS.lightest}` } : undefined}
                  onClick={() => router.push(`/progress-check/residents?classYear=${ca.year}&expandClass=${ca.year}`)}
                >
                  <div className="flex items-center gap-3">
                    {overall !== null ? (
                      <div
                        className="flex items-center justify-center flex-shrink-0"
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          backgroundColor: getOverallColor(overall).bg,
                        }}
                      >
                        <span
                          className="text-lg font-bold leading-none"
                          style={{ color: getOverallColor(overall).text }}
                        >
                          {overall}
                        </span>
                      </div>
                    ) : (
                      <div
                        className="flex items-center justify-center flex-shrink-0 text-sm font-medium"
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          backgroundColor: COLORS.lightest,
                          color: COLORS.darker,
                        }}
                      >
                        <Users className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">
                          {classInfo?.name || `Class of ${ca.year}`}
                        </p>
                        {pgyLevel !== null && (
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: active ? COLORS.lightest : '#F3F4F6',
                              color: active ? COLORS.darker : '#6B7280',
                            }}
                          >
                            {active ? formatPGYLevel(pgyLevel) : 'Graduated'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">
                        {ca.total} resident{ca.total !== 1 ? 's' : ''}
                        {ca.periods.length > 0 && <> &middot; {ca.periods.join(' · ')}</>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {hasScores ? (
                      <ScoreCard
                        eq={ca.eq!}
                        pq={ca.pq!}
                        iq={ca.iq!}
                        size="sm"
                        showOverall={false}
                      />
                    ) : (
                      <span className="text-sm text-slate-400 flex items-center gap-1">
                        <BarChart3 className="w-3.5 h-3.5" />
                        No scores
                      </span>
                    )}
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Active Surveys */}
      {can('canManageSurveys') && (
        <div className="bg-white rounded-xl border" style={{ borderColor: COLORS.light }}>
          <div className="p-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${COLORS.lightest}` }}>
            <h2 className="text-lg font-semibold" style={{ color: COLORS.veryDark }}>
              Active Surveys
            </h2>
            <button
              onClick={() => router.push('/progress-check/surveys')}
              className="text-sm font-medium flex items-center gap-1"
              style={{ color: COLORS.dark }}
            >
              Manage Surveys
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div>
            {surveys.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <FileText className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p>No active surveys.</p>
                <button
                  onClick={() => router.push('/progress-check/surveys')}
                  className="mt-2 text-sm font-medium"
                  style={{ color: COLORS.dark }}
                >
                  Create a survey
                </button>
              </div>
            ) : (
              surveys.map((survey, idx) => {
                const progress = survey.total_respondents > 0
                  ? Math.round((survey.completed_respondents / survey.total_respondents) * 100)
                  : 0;
                return (
                  <div
                    key={survey.id}
                    className="p-5 flex items-center justify-between hover:bg-green-50/50 transition-colors cursor-pointer"
                    style={idx > 0 ? { borderTop: `1px solid ${COLORS.lightest}` } : undefined}
                    onClick={() => router.push(`/progress-check/surveys?surveyId=${survey.id}`)}
                  >
                    <div>
                      <p className="font-medium text-slate-900">{survey.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                        <span className="capitalize">{survey.type}</span>
                        {survey.deadline && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Due {new Date(survey.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium" style={{ color: COLORS.darker }}>
                          {progress}%
                        </p>
                        <p className="text-xs text-slate-400">
                          {survey.completed_respondents}/{survey.total_respondents}
                        </p>
                      </div>
                      <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: progress === 100 ? COLORS.dark : COLORS.medium,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button
          onClick={() => router.push('/progress-check/residents')}
          className="p-5 rounded-xl border bg-white hover:shadow-md transition-all text-left"
          style={{ borderColor: COLORS.light }}
        >
          <Users className="w-6 h-6 mb-3" style={{ color: COLORS.dark }} />
          <h3 className="font-medium text-slate-900">View {user?.programSpecialty || 'All Residents'}</h3>
          <p className="text-sm text-slate-500 mt-1">
            Browse resident profiles with EQ·PQ·IQ scores
          </p>
        </button>

        {can('canManageSurveys') && (
          <button
            onClick={() => router.push('/progress-check/surveys')}
            className="p-5 rounded-xl border bg-white hover:shadow-md transition-all text-left"
            style={{ borderColor: COLORS.light }}
          >
            <ClipboardCheck className="w-6 h-6 mb-3" style={{ color: COLORS.dark }} />
            <h3 className="font-medium text-slate-900">Manage Surveys</h3>
            <p className="text-sm text-slate-500 mt-1">
              Create and distribute faculty & learner surveys
            </p>
          </button>
        )}

        <button
          onClick={() => router.push('/progress-check/sessions')}
          className="p-5 rounded-xl border bg-white hover:shadow-md transition-all text-left"
          style={{ borderColor: COLORS.light }}
        >
          <Calendar className="w-6 h-6 mb-3" style={{ color: COLORS.dark }} />
          <h3 className="font-medium text-slate-900">Progress Check Sessions</h3>
          <p className="text-sm text-slate-500 mt-1">
            Schedule and run progress check meetings
          </p>
        </button>
      </div>
    </div>
  );
}
