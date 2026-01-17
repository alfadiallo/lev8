'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, Users, TrendingUp, TrendingDown, Minus, 
  Heart, Award, Brain, BarChart3, Info, ChevronDown, ChevronUp
} from 'lucide-react';
import { useInterviewUserContext } from '@/context/InterviewUserContext';

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

interface InterviewerStats {
  email: string;
  name: string | null;
  candidatesRated: number;
  avgEq: number;
  avgPq: number;
  avgIq: number;
  avgTotal: number;
  stdDevEq: number;
  stdDevPq: number;
  stdDevIq: number;
  stdDevTotal: number;
  deviationFromMean: number;
  deviationEq: number;
  deviationPq: number;
  deviationIq: number;
  ratingTendency: 'lenient' | 'neutral' | 'strict';
}

interface StatsData {
  interviewers: InterviewerStats[];
  groupStats: {
    totalRatings: number;
    avgEq: number;
    avgPq: number;
    avgIq: number;
    avgTotal: number;
    stdDevTotal: number;
  };
}

function getTendencyBadge(tendency: 'lenient' | 'neutral' | 'strict') {
  switch (tendency) {
    case 'lenient':
      return {
        icon: <TrendingUp className="w-3 h-3" />,
        text: 'Rates Higher',
        bg: '#DCFCE7',
        color: '#166534',
      };
    case 'strict':
      return {
        icon: <TrendingDown className="w-3 h-3" />,
        text: 'Rates Lower',
        bg: '#FEE2E2',
        color: '#991B1B',
      };
    default:
      return {
        icon: <Minus className="w-3 h-3" />,
        text: 'Neutral',
        bg: '#F1F5F9',
        color: '#475569',
      };
  }
}

function DeviationBar({ value, maxDeviation = 30 }: { value: number; maxDeviation?: number }) {
  const percentage = Math.min(Math.abs(value) / maxDeviation * 50, 50);
  const isPositive = value > 0;
  
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-4 bg-slate-100 rounded relative overflow-hidden">
        {/* Center line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-300" />
        
        {/* Deviation bar */}
        <div 
          className="absolute top-0 bottom-0 rounded"
          style={{
            left: isPositive ? '50%' : `${50 - percentage}%`,
            width: `${percentage}%`,
            backgroundColor: isPositive ? '#86EFAC' : '#FCA5A5',
          }}
        />
      </div>
      <span 
        className="text-sm font-medium w-12 text-right"
        style={{ color: isPositive ? '#166534' : value < 0 ? '#991B1B' : '#64748B' }}
      >
        {value > 0 ? '+' : ''}{value}
      </span>
    </div>
  );
}

export default function InterviewerStatsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: isUserLoading, isAuthenticated, login } = useInterviewUserContext();
  const email = user?.email || searchParams.get('email') || '';

  const [data, setData] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortField, setSortField] = useState<'candidatesRated' | 'avgTotal' | 'deviationFromMean'>('candidatesRated');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showNormalizationDetails, setShowNormalizationDetails] = useState(false);

  // If email is in URL and not logged in, log in
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam && !isAuthenticated && !isUserLoading) {
      login(emailParam);
    }
  }, [searchParams, isAuthenticated, isUserLoading, login]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/interview/stats');
        if (!response.ok) throw new Error('Failed to fetch stats');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const sortedInterviewers = data?.interviewers.slice().sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'candidatesRated':
        comparison = b.candidatesRated - a.candidatesRated;
        break;
      case 'avgTotal':
        comparison = b.avgTotal - a.avgTotal;
        break;
      case 'deviationFromMean':
        comparison = Math.abs(b.deviationFromMean) - Math.abs(a.deviationFromMean);
        break;
    }
    return sortDirection === 'desc' ? comparison : -comparison;
  }) || [];

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

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

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push(`/interview/dashboard?email=${encodeURIComponent(email)}`)}
          className="text-sm text-slate-500 hover:text-slate-700 mb-2 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Interviewer Statistics
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Analyze how each interviewer rates compared to the group average
        </p>
      </div>

      {/* Group Stats Summary */}
      <div 
        className="bg-white rounded-xl border p-6 mb-6"
        style={{ borderColor: COLORS.light }}
      >
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" style={{ color: COLORS.dark }} />
          Group Averages
        </h2>
        
        {/* Total Ratings - Prominent */}
        <div className="mb-6 pb-6 border-b" style={{ borderColor: COLORS.lightest }}>
          <div className="text-center">
            <p className="text-4xl font-bold mb-1" style={{ color: COLORS.darker }}>
              {data.groupStats.totalRatings}
            </p>
            <p className="text-sm font-medium text-slate-600">Total Ratings</p>
          </div>
        </div>
        
        {/* Average Scores */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* EQ, PQ, IQ in a row */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Heart className="w-5 h-5" style={{ color: COLORS.medium }} />
              <p className="text-3xl font-bold" style={{ color: COLORS.darker }}>
                {data.groupStats.avgEq}
              </p>
            </div>
            <p className="text-sm font-medium text-slate-600">Avg EQ</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Award className="w-5 h-5" style={{ color: COLORS.medium }} />
              <p className="text-3xl font-bold" style={{ color: COLORS.darker }}>
                {data.groupStats.avgPq}
              </p>
            </div>
            <p className="text-sm font-medium text-slate-600">Avg PQ</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Brain className="w-5 h-5" style={{ color: COLORS.medium }} />
              <p className="text-3xl font-bold" style={{ color: COLORS.darker }}>
                {data.groupStats.avgIq}
              </p>
            </div>
            <p className="text-sm font-medium text-slate-600">Avg IQ</p>
          </div>
          
          {/* Avg Total - Emphasized */}
          <div 
            className="text-center rounded-lg p-4"
            style={{ backgroundColor: COLORS.lightest + '40' }}
          >
            <p className="text-3xl font-bold mb-2" style={{ color: COLORS.dark }}>
              {data.groupStats.avgTotal}
            </p>
            <p className="text-sm font-semibold" style={{ color: COLORS.darker }}>
              Avg Total
            </p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div 
        className="rounded-xl p-4 mb-6 flex items-start gap-3"
        style={{ backgroundColor: COLORS.lightest + '60', borderColor: COLORS.light }}
      >
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: COLORS.dark }} />
        <div className="flex-1 text-sm" style={{ color: COLORS.darker }}>
          <strong>Understanding Deviation:</strong> The deviation shows how each interviewer&apos;s average 
          compares to the group mean. Positive values indicate they rate higher than average (more lenient), 
          while negative values indicate they rate lower (more strict). This helps identify calibration differences.
          
          <button
            onClick={() => setShowNormalizationDetails(!showNormalizationDetails)}
            className="mt-3 flex items-center gap-1 text-xs font-medium hover:underline"
            style={{ color: COLORS.dark }}
          >
            {showNormalizationDetails ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Learn Less about Score Normalization
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Learn More about Score Normalization
              </>
            )}
          </button>
          
          {showNormalizationDetails && (
            <div className="mt-4 pt-4 border-t" style={{ borderColor: COLORS.light }}>
              <div className="space-y-4 text-xs">
                <div>
                  <p className="font-semibold mb-2">For Score Normalization (Advanced):</p>
                  <p className="mb-2">
                    The normalization feature uses <strong>Z-score transformation (standardization)</strong>.
                  </p>
                </div>
                
                <div>
                  <p className="font-semibold mb-2">Step 1: Calculate Z-Score</p>
                  <p className="mb-2">
                    For each individual rating, convert it to a z-score:
                  </p>
                  <div className="bg-white rounded p-3 border font-mono text-xs" style={{ borderColor: COLORS.light }}>
                    z = (x - μ<sub>interviewer</sub>) / σ<sub>interviewer</sub>
                  </div>
                  <p className="mt-2 text-slate-600">
                    Where:<br />
                    • <strong>x</strong> = the raw score (e.g., EQ=75)<br />
                    • <strong>μ<sub>interviewer</sub></strong> = that interviewer&apos;s personal mean score<br />
                    • <strong>σ<sub>interviewer</sub></strong> = that interviewer&apos;s personal standard deviation
                  </p>
                </div>
                
                <div>
                  <p className="font-semibold mb-2">Step 2: Transform to Normalized Scale</p>
                  <p className="mb-2">
                    Convert the z-score back to a 0-100 scale:
                  </p>
                  <div className="bg-white rounded p-3 border font-mono text-xs" style={{ borderColor: COLORS.light }}>
                    normalized = 50 + (z × 15)
                  </div>
                  <p className="mt-2 text-slate-600">
                    This uses:<br />
                    • Mean of <strong>50</strong> (center of the scale)<br />
                    • Standard deviation of <strong>15</strong> (similar to IQ scale scaling)
                  </p>
                </div>
                
                <div>
                  <p className="font-semibold mb-2">Why this works:</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    <li>A z-score of <strong>0</strong> = interviewer&apos;s average → normalized to <strong>50</strong></li>
                    <li>A z-score of <strong>+1</strong> = one standard deviation above their average → normalized to <strong>65</strong></li>
                    <li>A z-score of <strong>-1</strong> = one standard deviation below their average → normalized to <strong>35</strong></li>
                  </ul>
                  <p className="mt-2 text-slate-600">
                    This adjusts for each interviewer&apos;s personal distribution, putting all scores on a comparable scale 
                    regardless of whether they tend to rate higher or lower.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interviewer Table */}
      <div 
        className="bg-white rounded-xl border overflow-hidden"
        style={{ borderColor: COLORS.light }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr 
                className="border-b"
                style={{ backgroundColor: COLORS.lightest + '60', borderColor: COLORS.light }}
              >
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Interviewer
                </th>
                <th 
                  className="text-center px-3 py-3 font-medium text-slate-600 cursor-pointer hover:bg-white/50"
                  onClick={() => handleSort('candidatesRated')}
                >
                  <span className="flex items-center justify-center gap-1">
                    <Users className="w-4 h-4" />
                    Rated
                    {sortField === 'candidatesRated' && (sortDirection === 'desc' ? ' ↓' : ' ↑')}
                  </span>
                </th>
                <th 
                  className="text-center px-3 py-3 font-medium text-slate-600 cursor-pointer hover:bg-white/50"
                  onClick={() => handleSort('avgTotal')}
                >
                  <span className="flex items-center justify-center gap-1">
                    Avg Total
                    {sortField === 'avgTotal' && (sortDirection === 'desc' ? ' ↓' : ' ↑')}
                  </span>
                </th>
                <th className="text-center px-3 py-3 font-medium text-slate-600">
                  <span className="flex items-center justify-center gap-1">
                    <Heart className="w-3 h-3" /> EQ
                  </span>
                </th>
                <th className="text-center px-3 py-3 font-medium text-slate-600">
                  <span className="flex items-center justify-center gap-1">
                    <Award className="w-3 h-3" /> PQ
                  </span>
                </th>
                <th className="text-center px-3 py-3 font-medium text-slate-600">
                  <span className="flex items-center justify-center gap-1">
                    <Brain className="w-3 h-3" /> IQ
                  </span>
                </th>
                <th 
                  className="text-left px-4 py-3 font-medium text-slate-600 cursor-pointer hover:bg-white/50"
                  onClick={() => handleSort('deviationFromMean')}
                >
                  <span className="flex items-center gap-1">
                    Deviation from Mean
                    {sortField === 'deviationFromMean' && (sortDirection === 'desc' ? ' ↓' : ' ↑')}
                  </span>
                </th>
                <th className="text-center px-3 py-3 font-medium text-slate-600">
                  Tendency
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedInterviewers.map((interviewer) => {
                const tendencyBadge = getTendencyBadge(interviewer.ratingTendency);
                
                return (
                  <tr 
                    key={interviewer.email}
                    className="border-b hover:bg-slate-50 transition-colors"
                    style={{ borderColor: COLORS.lightest }}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-900">
                          {interviewer.name || interviewer.email}
                        </p>
                        {interviewer.name && (
                          <p className="text-xs text-slate-500">{interviewer.email}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="font-medium">{interviewer.candidatesRated}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span 
                        className="text-lg font-bold"
                        style={{ color: COLORS.darker }}
                      >
                        {interviewer.avgTotal}
                      </span>
                      <span className="text-xs text-slate-400 block">
                        ±{interviewer.stdDevTotal}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span>{interviewer.avgEq}</span>
                      <span 
                        className="text-xs block"
                        style={{ color: interviewer.deviationEq > 0 ? '#166534' : interviewer.deviationEq < 0 ? '#991B1B' : '#64748B' }}
                      >
                        {interviewer.deviationEq > 0 ? '+' : ''}{interviewer.deviationEq}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span>{interviewer.avgPq}</span>
                      <span 
                        className="text-xs block"
                        style={{ color: interviewer.deviationPq > 0 ? '#166534' : interviewer.deviationPq < 0 ? '#991B1B' : '#64748B' }}
                      >
                        {interviewer.deviationPq > 0 ? '+' : ''}{interviewer.deviationPq}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span>{interviewer.avgIq}</span>
                      <span 
                        className="text-xs block"
                        style={{ color: interviewer.deviationIq > 0 ? '#166534' : interviewer.deviationIq < 0 ? '#991B1B' : '#64748B' }}
                      >
                        {interviewer.deviationIq > 0 ? '+' : ''}{interviewer.deviationIq}
                      </span>
                    </td>
                    <td className="px-4 py-3 w-48">
                      <DeviationBar value={interviewer.deviationFromMean} />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span 
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: tendencyBadge.bg, color: tendencyBadge.color }}
                      >
                        {tendencyBadge.icon}
                        {tendencyBadge.text}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {sortedInterviewers.length === 0 && (
          <div className="px-4 py-12 text-center text-slate-500">
            No interviewer data available yet
          </div>
        )}
      </div>
    </div>
  );
}
