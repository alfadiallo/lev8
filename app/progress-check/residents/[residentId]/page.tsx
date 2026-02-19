'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Heart, Award, Brain, TrendingUp, AlertCircle,
  BarChart3, MessageSquare
} from 'lucide-react';
import { useRequireProgressCheckAuth } from '@/context/ProgressCheckUserContext';
import {
  EqpqiqRadarChart,
  PROGRESS_CHECK_ATTRIBUTES,
  ScoreCard,
  ScoreTrendLine,
  ComparisonChart,
} from '@/components/eqpqiq/analytics';
import type { EqpqiqScores, TrendDataPoint, TrendView } from '@/components/eqpqiq/analytics';

const COLORS = {
  lightest: '#D8F3DC',
  light: '#B7E4C7',
  medium: '#74C69D',
  dark: '#40916C',
  darker: '#2D6A4F',
  veryDark: '#1B4332',
};

// Single-page layout — no tabs

interface ResidentData {
  resident: {
    id: string;
    name: string;
    email: string | null;
    anonCode: string;
    medicalSchool: string | null;
    graduationYear: number | null;
    className: string | null;
    programId: string;
  };
  currentScores: Record<string, unknown> | null;
  trendData: {
    period: string;
    facultyEq: number | null;
    facultyPq: number | null;
    facultyIq: number | null;
    selfEq: number | null;
    selfPq: number | null;
    selfIq: number | null;
  }[];
  facultyAverages: ScoreAverages | null;
  coreFacultyAverages: ScoreAverages | null;
  teachingFacultyAverages: ScoreAverages | null;
  selfAverages: ScoreAverages | null;
  gapAnalysis: { eq: number | null; pq: number | null; iq: number | null; overall: number | null } | null;
  classAverages: { eq: number | null; pq: number | null; iq: number | null } | null;
  swot: SWOTData | null;
  iteScores: ITEScore[];
  ratings: {
    faculty: number;
    coreFaculty: number;
    teachingFaculty: number;
    self: number;
    total: number;
    recent: RatingEntry[];
  };
}

interface ScoreAverages {
  eq: {
    eq_empathy_positive_interactions: number | null;
    eq_adaptability_self_awareness: number | null;
    eq_stress_management_resilience: number | null;
    eq_curiosity_growth_mindset: number | null;
    eq_effectiveness_communication: number | null;
    average: number | null;
  };
  pq: {
    pq_work_ethic_reliability: number | null;
    pq_integrity_accountability: number | null;
    pq_teachability_receptiveness: number | null;
    pq_documentation: number | null;
    pq_leadership_relationships: number | null;
    average: number | null;
  };
  iq: {
    iq_knowledge_base: number | null;
    iq_analytical_thinking: number | null;
    iq_commitment_learning: number | null;
    iq_clinical_flexibility: number | null;
    iq_performance_for_level: number | null;
    average: number | null;
  };
  overall: number | null;
  count: number;
}

interface SWOTData {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  period_label: string;
  generated_at: string;
}

interface ITEScore {
  id: string;
  exam_year: number;
  raw_score: number | null;
  percentile: number | null;
  national_mean: number | null;
}

interface RatingEntry {
  id: string;
  evaluator_type: string;
  evaluation_date: string;
  eq_avg: number;
  pq_avg: number;
  iq_avg: number;
  overall_avg: number;
  comments: string | null;
  faculty: { id: string; user_profiles: { full_name: string } } | null;
}

function averagesToRadarData(avgs: ScoreAverages): EqpqiqScores {
  return {
    eq_empathy_positive_interactions: avgs.eq.eq_empathy_positive_interactions ?? 0,
    eq_adaptability_self_awareness: avgs.eq.eq_adaptability_self_awareness ?? 0,
    eq_stress_management_resilience: avgs.eq.eq_stress_management_resilience ?? 0,
    eq_curiosity_growth_mindset: avgs.eq.eq_curiosity_growth_mindset ?? 0,
    eq_effectiveness_communication: avgs.eq.eq_effectiveness_communication ?? 0,
    pq_work_ethic_reliability: avgs.pq.pq_work_ethic_reliability ?? 0,
    pq_integrity_accountability: avgs.pq.pq_integrity_accountability ?? 0,
    pq_teachability_receptiveness: avgs.pq.pq_teachability_receptiveness ?? 0,
    pq_documentation: avgs.pq.pq_documentation ?? 0,
    pq_leadership_relationships: avgs.pq.pq_leadership_relationships ?? 0,
    iq_knowledge_base: avgs.iq.iq_knowledge_base ?? 0,
    iq_analytical_thinking: avgs.iq.iq_analytical_thinking ?? 0,
    iq_commitment_learning: avgs.iq.iq_commitment_learning ?? 0,
    iq_clinical_flexibility: avgs.iq.iq_clinical_flexibility ?? 0,
    iq_performance_for_level: avgs.iq.iq_performance_for_level ?? 0,
  } as EqpqiqScores;
}

/**
 * Compute section averages from individual attribute averages.
 * This matches the method the radar chart summary uses, avoiding
 * discrepancy with the pre-computed eq_avg/pq_avg/iq_avg columns
 * (which weight differently when older ratings have fewer attributes).
 */
function sectionAvgFromAttributes(avgs: ScoreAverages) {
  const mean = (vals: (number | null)[]) => {
    const nums = vals.filter((v): v is number => v !== null && v > 0);
    return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
  };
  const eq = mean([
    avgs.eq.eq_empathy_positive_interactions,
    avgs.eq.eq_adaptability_self_awareness,
    avgs.eq.eq_stress_management_resilience,
    avgs.eq.eq_curiosity_growth_mindset,
    avgs.eq.eq_effectiveness_communication,
  ]);
  const pq = mean([
    avgs.pq.pq_work_ethic_reliability,
    avgs.pq.pq_integrity_accountability,
    avgs.pq.pq_teachability_receptiveness,
    avgs.pq.pq_documentation,
    avgs.pq.pq_leadership_relationships,
  ]);
  const iq = mean([
    avgs.iq.iq_knowledge_base,
    avgs.iq.iq_analytical_thinking,
    avgs.iq.iq_commitment_learning,
    avgs.iq.iq_clinical_flexibility,
    avgs.iq.iq_performance_for_level,
  ]);
  return { eq, pq, iq };
}

export default function ResidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useRequireProgressCheckAuth();

  const residentId = params.residentId as string;
  const [data, setData] = useState<ResidentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trendView, setTrendView] = useState<TrendView>('both');
  const [showBreakout, setShowBreakout] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.email || !residentId) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/progress-check/residents/${residentId}/scores?email=${encodeURIComponent(user.email)}`
      );
      if (!res.ok) throw new Error('Failed to fetch');
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error('[ResidentDetail] Error:', err);
      setError('Failed to load resident data');
    } finally {
      setLoading(false);
    }
  }, [user?.email, residentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Store resident name for breadcrumb display and notify layout
  useEffect(() => {
    if (data?.resident?.name) {
      sessionStorage.setItem(`progress-check-resident-name-${residentId}`, data.resident.name);
      window.dispatchEvent(new Event('progress-check-breadcrumb-update'));
    }
  }, [data?.resident?.name, residentId]);

  const navigateBack = useCallback(() => {
    const year = data?.resident?.graduationYear;
    const url = year
      ? `/progress-check/residents?expandClass=${year}`
      : '/progress-check/residents';
    router.push(url);
  }, [data?.resident?.graduationYear, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full mx-auto" style={{ borderColor: COLORS.dark, borderTopColor: 'transparent' }} />
          <p className="text-slate-500">Loading resident data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-400" />
        <p className="text-lg font-medium text-slate-900">Error Loading Data</p>
        <p className="text-sm text-slate-500 mt-1">{error || 'Resident not found'}</p>
        <button
          onClick={navigateBack}
          className="mt-4 text-sm font-medium"
          style={{ color: COLORS.dark }}
        >
          Back to {user?.programSpecialty || 'Residents'}
        </button>
      </div>
    );
  }

  const {
    resident, facultyAverages, coreFacultyAverages, teachingFacultyAverages,
    selfAverages, gapAnalysis, classAverages, swot, iteScores, trendData, ratings,
  } = data;

  // Build radar data series (combined Faculty + Self by default)
  // Always show both Core Faculty and Teaching Faculty as children
  const facultyChildren = [];
  if (facultyAverages) {
    facultyChildren.push({
      label: coreFacultyAverages ? `Core Faculty (n=${coreFacultyAverages.count})` : 'Core Faculty',
      data: coreFacultyAverages ? averagesToRadarData(coreFacultyAverages) : null,
      color: COLORS.dark,
    });
    facultyChildren.push({
      label: teachingFacultyAverages ? `Teaching Faculty (n=${teachingFacultyAverages.count})` : 'Teaching Faculty',
      data: teachingFacultyAverages ? averagesToRadarData(teachingFacultyAverages) : null,
      color: '#F59E0B',
    });
  }

  const radarSeries = [];
  if (facultyAverages) {
    radarSeries.push({
      label: `Faculty Avg (n=${facultyAverages.count})`,
      data: averagesToRadarData(facultyAverages),
      color: COLORS.dark,
      children: facultyChildren,
    });
  }
  if (selfAverages) {
    radarSeries.push({
      label: 'Self-Assessment',
      data: averagesToRadarData(selfAverages),
      color: '#6366f1',
    });
  }

  // Breakout radar series (Core Faculty vs Teaching Faculty vs Self)
  const breakoutRadarSeries = [];
  if (coreFacultyAverages) {
    breakoutRadarSeries.push({
      label: `Core Faculty (n=${coreFacultyAverages.count})`,
      data: averagesToRadarData(coreFacultyAverages),
      color: COLORS.dark,
    });
  }
  if (teachingFacultyAverages) {
    breakoutRadarSeries.push({
      label: `Teaching Faculty (n=${teachingFacultyAverages.count})`,
      data: averagesToRadarData(teachingFacultyAverages),
      color: '#F59E0B',
    });
  }
  if (selfAverages) {
    breakoutRadarSeries.push({
      label: 'Self-Assessment',
      data: averagesToRadarData(selfAverages),
      color: '#6366f1',
    });
  }

  // Build trend data (faculty + self for toggle)
  const trendPoints: TrendDataPoint[] = trendData.map((td) => ({
    period: td.period,
    eq: td.facultyEq ?? undefined,
    pq: td.facultyPq ?? undefined,
    iq: td.facultyIq ?? undefined,
    selfEq: td.selfEq ?? undefined,
    selfPq: td.selfPq ?? undefined,
    selfIq: td.selfIq ?? undefined,
  }));

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={navigateBack}
          className="p-2 rounded-lg hover:bg-green-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" style={{ color: COLORS.dark }} />
        </button>

        {/* Overall score badge (matches list page) */}
        {facultyAverages && facultyAverages.overall !== null && (() => {
          const overall = Math.round(facultyAverages.overall);
          const getColor = (score: number) => {
            if (score >= 75) return { bg: '#F0FDF4', text: '#16A34A' };
            if (score >= 50) return { bg: '#EFF6FF', text: '#2563EB' };
            if (score >= 25) return { bg: '#FFFBEB', text: '#D97706' };
            return { bg: '#FEF2F2', text: '#DC2626' };
          };
          const c = getColor(overall);
          return (
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                backgroundColor: c.bg,
              }}
            >
              <span className="text-2xl font-bold leading-none" style={{ color: c.text }}>
                {overall}
              </span>
            </div>
          );
        })()}

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold" style={{ color: COLORS.veryDark }}>
            {resident.name}
          </h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 flex-wrap">
            {resident.className && <span>{resident.className}</span>}
            {resident.medicalSchool && (
              <>
                <span>&middot;</span>
                <span>{resident.medicalSchool}</span>
              </>
            )}
            {resident.anonCode && (
              <>
                <span>&middot;</span>
                <span className="font-mono text-xs">{resident.anonCode}</span>
              </>
            )}
          </div>
        </div>

        {/* EQ/PQ/IQ breakdown (no overall — it's on the left now) */}
        {facultyAverages && facultyAverages.eq.average !== null && (
          <div className="hidden sm:block">
            <ScoreCard
              eq={facultyAverages.eq.average}
              pq={facultyAverages.pq.average ?? 0}
              iq={facultyAverages.iq.average ?? 0}
              size="lg"
              showOverall={false}
            />
          </div>
        )}
      </div>

      {/* Score Pills (mobile) */}
      {facultyAverages && facultyAverages.overall !== null && (
        <div className="sm:hidden flex gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-blue-50">
            <Heart className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-medium text-blue-700">{Math.round(facultyAverages.eq.average ?? 0)}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-green-50">
            <Award className="w-3.5 h-3.5 text-green-600" />
            <span className="font-medium text-green-700">{Math.round(facultyAverages.pq.average ?? 0)}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-purple-50">
            <Brain className="w-3.5 h-3.5 text-purple-600" />
            <span className="font-medium text-purple-700">{Math.round(facultyAverages.iq.average ?? 0)}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-slate-100">
            <span className="font-medium">{Math.round(facultyAverages.overall ?? 0)} avg</span>
          </div>
        </div>
      )}

      {/* ── Radar Chart ───────────────────────────────────────────── */}
      {radarSeries.length > 0 ? (
        <div className="bg-white rounded-xl border p-6" style={{ borderColor: COLORS.light }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-lg font-semibold" style={{ color: COLORS.veryDark }}>
              EQ·PQ·IQ Profile
            </h2>
            {(coreFacultyAverages || teachingFacultyAverages) && (
              <button
                onClick={() => setShowBreakout(!showBreakout)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors"
                style={{
                  borderColor: COLORS.light,
                  color: showBreakout ? 'white' : COLORS.dark,
                  backgroundColor: showBreakout ? COLORS.dark : 'transparent',
                }}
              >
                {showBreakout ? 'Combined View' : 'Breakout: Core vs Teaching'}
              </button>
            )}
          </div>
          <EqpqiqRadarChart
            series={showBreakout ? breakoutRadarSeries : radarSeries}
            attributes={PROGRESS_CHECK_ATTRIBUTES}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border p-8 text-center" style={{ borderColor: COLORS.light }}>
          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-600 font-medium">No EQ·PQ·IQ data yet</p>
          <p className="text-sm text-slate-500 mt-1">
            Scores will appear here once faculty surveys are collected
          </p>
        </div>
      )}

      {/* ── Gap Analysis ──────────────────────────────────────────── */}
      {facultyAverages && selfAverages && (() => {
        const fScores = sectionAvgFromAttributes(facultyAverages);
        const sScores = sectionAvgFromAttributes(selfAverages);
        return (
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: COLORS.light }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: COLORS.veryDark }}>
              Faculty vs Self-Assessment
            </h2>
            <ComparisonChart
              series1={{
                label: 'Faculty Average',
                eq: fScores.eq,
                pq: fScores.pq,
                iq: fScores.iq,
                color: COLORS.dark,
              }}
              series2={{
                label: 'Self-Assessment',
                eq: sScores.eq,
                pq: sScores.pq,
                iq: sScores.iq,
                color: '#6366f1',
              }}
              classAverages={classAverages}
              classLabel={resident.className || `Class of ${resident.graduationYear}`}
              showGap
            />
          </div>
        );
      })()}

      {/* ── Trends ────────────────────────────────────────────────── */}
      {trendPoints.length > 1 && (
        <div className="bg-white rounded-xl border p-6" style={{ borderColor: COLORS.light }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-lg font-semibold" style={{ color: COLORS.veryDark }}>
              Score Trends Over Time
            </h2>
            <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: COLORS.light }}>
              {([
                { id: 'faculty' as TrendView, label: 'Faculty' },
                { id: 'self' as TrendView, label: 'Self' },
                { id: 'both' as TrendView, label: 'Both' },
              ]).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setTrendView(opt.id)}
                  className="px-3 py-1.5 text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: trendView === opt.id ? COLORS.dark : 'transparent',
                    color: trendView === opt.id ? 'white' : COLORS.dark,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {trendView === 'both' && (
            <div className="flex items-center gap-4 mb-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-5 h-0.5 bg-blue-500 rounded" /> Solid = Faculty
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-5 border-t-2 border-dashed border-blue-300 rounded" /> Dashed = Self
              </span>
            </div>
          )}
          <ScoreTrendLine data={trendPoints} height={350} view={trendView} />
        </div>
      )}

      {/* ── ITE Scores ────────────────────────────────────────────── */}
      {iteScores.length > 0 && (
        <div className="bg-white rounded-xl border p-6" style={{ borderColor: COLORS.light }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: COLORS.veryDark }}>
            ITE Scores
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500" style={{ borderBottom: `1px solid ${COLORS.lightest}` }}>
                  <th className="pb-2 font-medium">Year</th>
                  <th className="pb-2 font-medium">Raw Score</th>
                  <th className="pb-2 font-medium">Percentile</th>
                  <th className="pb-2 font-medium">National Mean</th>
                </tr>
              </thead>
              <tbody>
                {iteScores.map((ite, idx) => (
                  <tr key={ite.id} style={idx > 0 ? { borderTop: `1px solid ${COLORS.lightest}` } : undefined}>
                    <td className="py-2.5 font-medium">{ite.exam_year}</td>
                    <td className="py-2.5">{ite.raw_score ?? '-'}</td>
                    <td className="py-2.5">
                      {ite.percentile !== null ? (
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: ite.percentile >= 50 ? COLORS.lightest : '#FEE2E2',
                            color: ite.percentile >= 50 ? COLORS.darker : '#991B1B',
                          }}
                        >
                          {ite.percentile}th
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-2.5">{ite.national_mean ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Rating Summary ────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border p-6" style={{ borderColor: COLORS.light }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: COLORS.veryDark }}>
          Rating Summary
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold" style={{ color: COLORS.darker }}>
              {ratings.coreFaculty}
            </p>
            <p className="text-sm text-slate-500">Core Faculty</p>
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: '#F59E0B' }}>
              {ratings.teachingFaculty}
            </p>
            <p className="text-sm text-slate-500">Teaching Faculty</p>
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: '#6366f1' }}>
              {ratings.self}
            </p>
            <p className="text-sm text-slate-500">Self Assessments</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-700">{ratings.total}</p>
            <p className="text-sm text-slate-500">Total</p>
          </div>
        </div>
      </div>

      {/* ── Comments ──────────────────────────────────────────────── */}
      {(() => {
        const withComments = ratings.recent.filter((r) => r.comments);
        if (withComments.length === 0) return null;
        return (
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: COLORS.light }}>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: COLORS.veryDark }}>
              <MessageSquare className="w-5 h-5" />
              Respondent Comments
            </h2>
            <div className="space-y-4">
              {withComments.map((rating) => {
                const raterType = rating.evaluator_type;
                const isFaculty = raterType === 'core_faculty' || raterType === 'teaching_faculty';
                const isTeaching = raterType === 'teaching_faculty';
                const evaluatorName = isFaculty
                  ? (rating.faculty as { user_profiles: { full_name: string } })?.user_profiles?.full_name || 'Faculty'
                  : 'Self-Assessment';
                const badgeLabel = raterType === 'core_faculty' ? 'Core Faculty'
                  : raterType === 'teaching_faculty' ? 'Teaching Faculty' : 'Self';
                return (
                  <div key={rating.id} className="border-l-3 pl-4 py-1" style={{ borderLeftWidth: 3, borderLeftColor: isTeaching ? '#F59E0B' : isFaculty ? COLORS.medium : '#818CF8' }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: isTeaching ? '#FEF3C7' : isFaculty ? COLORS.lightest : '#EDE9FE',
                          color: isTeaching ? '#92400E' : isFaculty ? COLORS.darker : '#5B21B6',
                        }}
                      >
                        {badgeLabel}
                      </span>
                      <span className="text-sm text-slate-600">{evaluatorName}</span>
                      <span className="text-xs text-slate-400 ml-auto">
                        {new Date(rating.evaluation_date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 italic leading-relaxed">
                      &ldquo;{rating.comments}&rdquo;
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
