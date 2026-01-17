'use client';

import { useState, useEffect, Fragment, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, Users, TrendingUp, Trophy, ChevronDown, ChevronUp,
  Heart, Award, Brain, Calendar, ExternalLink
} from 'lucide-react';

// Green color palette
const COLORS = {
  lightest: '#D8F3DC',
  light: '#B7E4C7',
  mediumLight: '#95D5B2',
  medium: '#74C69D',
  mediumDark: '#52B788',
  dark: '#40916C',
  darker: '#2D6A4F',
  veryDark: '#1B4332',
  darkest: '#081C15',
};

interface CandidateRating {
  interviewer_email: string;
  interviewer_name: string | null;
  eq_score: number | null;
  pq_score: number | null;
  iq_score: number | null;
  total: number;
  notes: string | null;
}

interface Candidate {
  id: string;
  name: string;
  email: string | null;
  medical_school: string | null;
  eq_total: number | null;
  pq_total: number | null;
  iq_total: number | null;
  interview_total: number | null;
  rank: number | null;
  rating_count: number;
  ratings: CandidateRating[];
}

interface SummaryData {
  session: {
    id: string;
    name: string;
    date: string | null;
    status: string;
  };
  candidates: Candidate[];
  summary: {
    totalCandidates: number;
    candidatesRated: number;
    totalRatings: number;
    interviewerCount: number;
    avgScore: number;
    minScore: number;
    maxScore: number;
    distribution: {
      exceptional: number;
      strong: number;
      good: number;
      average: number;
      belowAverage: number;
    };
  };
}

function getScoreColor(score: number | null): string {
  if (score === null) return '#E2E8F0';
  const avg = score / 3;
  if (avg >= 85) return COLORS.dark;
  if (avg >= 75) return COLORS.mediumDark;
  if (avg >= 65) return COLORS.medium;
  if (avg >= 55) return COLORS.mediumLight;
  return '#F87171';
}

function getRankBadge(rank: number | null) {
  if (!rank) return null;
  if (rank === 1) return { bg: '#FEF3C7', color: '#92400E', text: '1st' };
  if (rank === 2) return { bg: '#F1F5F9', color: '#475569', text: '2nd' };
  if (rank === 3) return { bg: '#FED7AA', color: '#9A3412', text: '3rd' };
  return { bg: COLORS.lightest, color: COLORS.darker, text: `#${rank}` };
}

export default function SessionSummaryPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [data, setData] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/interview/sessions/${sessionId}/summary`);
        if (!response.ok) throw new Error('Failed to fetch summary');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div 
          className="animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderColor: COLORS.dark }}
        />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto">
        <div 
          className="border rounded-xl p-6 text-center"
          style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA' }}
        >
          <p className="text-red-600">{error || 'Failed to load data'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 font-medium"
            style={{ color: COLORS.dark }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const sessionDate = data.session.date 
    ? new Date(data.session.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'No date set';

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => router.push(`/interview/sessions?email=${encodeURIComponent(email)}`)}
            className="text-sm text-slate-500 hover:text-slate-700 mb-2 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sessions
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Interview Day Summary
          </h1>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mt-1">
            <Calendar className="w-4 h-4" />
            {sessionDate}
          </div>
        </div>
        <button
          onClick={() => router.push(`/interview/session/${sessionId}/review?email=${encodeURIComponent(email)}`)}
          className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          style={{ backgroundColor: COLORS.lightest, color: COLORS.darker }}
        >
          <ExternalLink className="w-4 h-4" />
          Full Review
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div 
          className="bg-white rounded-xl p-4 border"
          style={{ borderColor: COLORS.light }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: COLORS.lightest }}
            >
              <Users className="w-5 h-5" style={{ color: COLORS.dark }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: COLORS.darker }}>
                {data.summary.totalCandidates}
              </p>
              <p className="text-sm text-slate-500">Candidates</p>
            </div>
          </div>
        </div>
        <div 
          className="bg-white rounded-xl p-4 border"
          style={{ borderColor: COLORS.light }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: COLORS.lightest }}
            >
              <TrendingUp className="w-5 h-5" style={{ color: COLORS.dark }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: COLORS.darker }}>
                {data.summary.avgScore}
              </p>
              <p className="text-sm text-slate-500">Avg Score</p>
            </div>
          </div>
        </div>
        <div 
          className="bg-white rounded-xl p-4 border"
          style={{ borderColor: COLORS.light }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: COLORS.lightest }}
            >
              <Trophy className="w-5 h-5" style={{ color: COLORS.dark }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: COLORS.darker }}>
                {data.summary.maxScore}
              </p>
              <p className="text-sm text-slate-500">High Score</p>
            </div>
          </div>
        </div>
        <div 
          className="bg-white rounded-xl p-4 border"
          style={{ borderColor: COLORS.light }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: COLORS.lightest }}
            >
              <Users className="w-5 h-5" style={{ color: COLORS.dark }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: COLORS.darker }}>
                {data.summary.interviewerCount}
              </p>
              <p className="text-sm text-slate-500">Interviewers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Score Distribution */}
      <div 
        className="bg-white rounded-xl border mb-6 p-4"
        style={{ borderColor: COLORS.light }}
      >
        <h3 className="font-semibold text-slate-900 mb-3">Today&apos;s Score Distribution</h3>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="flex h-8 rounded-lg overflow-hidden">
              {data.summary.distribution.exceptional > 0 && (
                <div 
                  className="flex items-center justify-center text-white text-xs font-medium"
                  style={{ 
                    width: `${(data.summary.distribution.exceptional / data.summary.totalCandidates) * 100}%`,
                    backgroundColor: COLORS.dark,
                    minWidth: '30px',
                  }}
                >
                  {data.summary.distribution.exceptional}
                </div>
              )}
              {data.summary.distribution.strong > 0 && (
                <div 
                  className="flex items-center justify-center text-white text-xs font-medium"
                  style={{ 
                    width: `${(data.summary.distribution.strong / data.summary.totalCandidates) * 100}%`,
                    backgroundColor: COLORS.mediumDark,
                    minWidth: '30px',
                  }}
                >
                  {data.summary.distribution.strong}
                </div>
              )}
              {data.summary.distribution.good > 0 && (
                <div 
                  className="flex items-center justify-center text-white text-xs font-medium"
                  style={{ 
                    width: `${(data.summary.distribution.good / data.summary.totalCandidates) * 100}%`,
                    backgroundColor: COLORS.medium,
                    minWidth: '30px',
                  }}
                >
                  {data.summary.distribution.good}
                </div>
              )}
              {data.summary.distribution.average > 0 && (
                <div 
                  className="flex items-center justify-center text-xs font-medium"
                  style={{ 
                    width: `${(data.summary.distribution.average / data.summary.totalCandidates) * 100}%`,
                    backgroundColor: COLORS.mediumLight,
                    color: COLORS.darker,
                    minWidth: '30px',
                  }}
                >
                  {data.summary.distribution.average}
                </div>
              )}
              {data.summary.distribution.belowAverage > 0 && (
                <div 
                  className="flex items-center justify-center text-white text-xs font-medium"
                  style={{ 
                    width: `${(data.summary.distribution.belowAverage / data.summary.totalCandidates) * 100}%`,
                    backgroundColor: '#F87171',
                    minWidth: '30px',
                  }}
                >
                  {data.summary.distribution.belowAverage}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.dark }} />
            <span>Exceptional (85+)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.mediumDark }} />
            <span>Strong (75-84)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.medium }} />
            <span>Good (65-74)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.mediumLight }} />
            <span>Average (55-64)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#F87171' }} />
            <span>Below (&lt;55)</span>
          </div>
        </div>
      </div>

      {/* Ranked Candidates */}
      <div 
        className="bg-white rounded-xl border overflow-hidden"
        style={{ borderColor: COLORS.light }}
      >
        <div 
          className="px-4 py-3 border-b"
          style={{ backgroundColor: COLORS.lightest + '60', borderColor: COLORS.light }}
        >
          <h3 className="font-semibold text-slate-900">Today&apos;s Rankings</h3>
        </div>
        <div className="divide-y" style={{ borderColor: COLORS.lightest }}>
          {data.candidates.map((candidate) => {
            const rankBadge = getRankBadge(candidate.rank);
            const isExpanded = expandedCandidate === candidate.id;

            return (
              <Fragment key={candidate.id}>
                <div 
                  className="px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => setExpandedCandidate(isExpanded ? null : candidate.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Rank Badge */}
                      <div className="w-12 text-center">
                        {rankBadge ? (
                          <span 
                            className="inline-block px-2 py-1 rounded-full text-xs font-bold"
                            style={{ backgroundColor: rankBadge.bg, color: rankBadge.color }}
                          >
                            {rankBadge.text}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </div>
                      
                      {/* Candidate Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          {isExpanded ? 
                            <ChevronUp className="w-4 h-4 text-slate-400" /> : 
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          }
                          <span className="font-medium text-slate-900">{candidate.name}</span>
                        </div>
                        <p className="text-xs text-slate-500 ml-6">{candidate.medical_school || 'Unknown school'}</p>
                      </div>
                    </div>

                    {/* Scores */}
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-slate-500">
                            <Heart className="w-3 h-3" />
                            <span style={{ color: getScoreColor(candidate.eq_total) }}>
                              {candidate.eq_total || '-'}
                            </span>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-slate-500">
                            <Award className="w-3 h-3" />
                            <span style={{ color: getScoreColor(candidate.pq_total) }}>
                              {candidate.pq_total || '-'}
                            </span>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-slate-500">
                            <Brain className="w-3 h-3" />
                            <span style={{ color: getScoreColor(candidate.iq_total) }}>
                              {candidate.iq_total || '-'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div 
                        className="text-xl font-bold w-16 text-right"
                        style={{ color: getScoreColor(candidate.interview_total) }}
                      >
                        {candidate.interview_total || '-'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && candidate.ratings.length > 0 && (
                  <div className="px-4 py-3 bg-slate-50">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-slate-500">
                          <th className="text-left py-1 font-medium">Interviewer</th>
                          <th className="text-center py-1 font-medium">EQ</th>
                          <th className="text-center py-1 font-medium">PQ</th>
                          <th className="text-center py-1 font-medium">IQ</th>
                          <th className="text-center py-1 font-medium">Total</th>
                          <th className="text-left py-1 font-medium">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {candidate.ratings.map((rating, idx) => (
                          <tr key={idx} className="border-t border-slate-200">
                            <td className="py-2 text-slate-700">
                              {rating.interviewer_name || rating.interviewer_email}
                            </td>
                            <td className="py-2 text-center">{rating.eq_score ?? '-'}</td>
                            <td className="py-2 text-center">{rating.pq_score ?? '-'}</td>
                            <td className="py-2 text-center">{rating.iq_score ?? '-'}</td>
                            <td className="py-2 text-center font-medium">{rating.total}</td>
                            <td className="py-2 text-slate-500 text-xs italic truncate max-w-[200px]">
                              {rating.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
