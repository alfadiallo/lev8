'use client';

import { useState, useEffect, Fragment, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, Users, Calendar, TrendingUp, Heart, Award, Brain, 
  Download, Search, Filter, ChevronDown, ChevronUp, ExternalLink,
  Trophy, Medal, Star, ToggleLeft, ToggleRight
} from 'lucide-react';
import { 
  calculateInterviewerStats, 
  normalizeAllRatings, 
  calculateCandidateScores,
  formatRankChange,
  getRankChangeColor,
  type InterviewerRating,
  type NormalizedRating
} from '@/lib/interview/normalization';
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

interface Session {
  id: string;
  session_name: string;
  session_date: string | null;
  status: string;
}

interface CandidateRating {
  interviewer_email: string;
  interviewer_name: string | null;
  eq_score: number | null;
  pq_score: number | null;
  iq_score: number | null;
  total: number | null;
  notes: string | null;
  is_resident: boolean;
}

interface Candidate {
  id: string;
  session_id: string;
  candidate_name: string;
  candidate_email: string | null;
  medical_school: string | null;
  eq_total: number | null;
  pq_total: number | null;
  iq_total: number | null;
  interview_total: number | null;
  rank: number;
  ratingCount: number;
  ratings: CandidateRating[];
  session: {
    id: string;
    session_name: string;
    session_date: string | null;
  } | null;
}

interface SeasonData {
  sessions: Session[];
  candidates: Candidate[];
  summary: {
    totalSessions: number;
    totalCandidates: number;
    avgScore: number;
    distribution: {
      exceptional: number;
      strong: number;
      good: number;
      average: number;
      belowAverage: number;
    };
    topSchools: { school: string; count: number }[];
  };
}

type SortField = 'rank' | 'candidate_name' | 'session_date' | 'eq_total' | 'pq_total' | 'iq_total' | 'interview_total' | 'ratingCount';

function getScoreColor(score: number | null, isDomainScore: boolean = false): string {
  if (score === null) return '#E2E8F0';
  const threshold = isDomainScore ? score : score / 3;
  if (threshold >= 85) return COLORS.dark;
  if (threshold >= 75) return COLORS.mediumDark;
  if (threshold >= 65) return COLORS.medium;
  if (threshold >= 55) return COLORS.mediumLight;
  return '#F87171';
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
  if (rank <= 10) return <Star className="w-4 h-4 text-slate-300" />;
  return null;
}

export default function SeasonOverviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: isUserLoading, isAuthenticated, login } = useInterviewUserContext();
  const email = user?.email || searchParams.get('email') || '';

  const [data, setData] = useState<SeasonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Sorting
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Expanded rows
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);
  
  // Normalization toggles
  const [showNormalized, setShowNormalized] = useState(false);
  const [excludeResidents, setExcludeResidents] = useState(false);
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
        const response = await fetch('/api/interview/season');
        if (!response.ok) throw new Error('Failed to fetch season data');
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

  // Calculate normalized scores
  const normalizedData = useMemo(() => {
    if (!data || !showNormalized) return null;
    
    // Collect all ratings from all candidates
    const allRatings: InterviewerRating[] = [];
    data.candidates.forEach(candidate => {
      candidate.ratings.forEach(rating => {
        allRatings.push({
          interviewer_email: rating.interviewer_email,
          interviewer_name: rating.interviewer_name,
          eq_score: rating.eq_score,
          pq_score: rating.pq_score,
          iq_score: rating.iq_score,
          is_resident: rating.is_resident,
        });
      });
    });
    
    // Calculate interviewer statistics
    const interviewerStats = calculateInterviewerStats(allRatings);
    
    // Build normalized ratings by candidate
    const candidateRatingsMap = new Map<string, NormalizedRating[]>();
    
    data.candidates.forEach(candidate => {
      const ratings: InterviewerRating[] = candidate.ratings.map(r => ({
        interviewer_email: r.interviewer_email,
        interviewer_name: r.interviewer_name,
        eq_score: r.eq_score,
        pq_score: r.pq_score,
        iq_score: r.iq_score,
        is_resident: r.is_resident,
      }));
      
      const normalizedRatings = normalizeAllRatings(ratings, interviewerStats);
      candidateRatingsMap.set(candidate.id, normalizedRatings);
    });
    
    // Calculate scores with normalization
    const scores = calculateCandidateScores(candidateRatingsMap, excludeResidents);
    
    return {
      scores: new Map(scores.map(s => [s.candidate_id, s])),
      interviewerStats,
    };
  }, [data, showNormalized, excludeResidents]);

  // Calculate normalized ranks when normalization is enabled
  const normalizedRanks = useMemo(() => {
    if (!showNormalized || !normalizedData || !data) return null;
    
    // Sort candidates by normalized score to determine rank
    const candidatesWithNormScore = data.candidates.map(c => ({
      id: c.id,
      normalizedTotal: normalizedData.scores.get(c.id)?.normalized_interview_total || 0,
    }));
    
    candidatesWithNormScore.sort((a, b) => b.normalizedTotal - a.normalizedTotal);
    
    // Assign ranks (handling ties)
    const ranks = new Map<string, number>();
    let currentRank = 1;
    let previousScore: number | null = null;
    
    candidatesWithNormScore.forEach((c, idx) => {
      if (previousScore !== null && c.normalizedTotal === previousScore) {
        // Same score = same rank
        ranks.set(c.id, currentRank);
      } else {
        // New score = new rank (accounting for ties)
        currentRank = idx + 1;
        ranks.set(c.id, currentRank);
      }
      previousScore = c.normalizedTotal;
    });
    
    return ranks;
  }, [showNormalized, normalizedData, data]);

  // Helper to get display rank (normalized or raw)
  const getDisplayRank = (candidate: Candidate): number => {
    if (showNormalized && normalizedRanks) {
      return normalizedRanks.get(candidate.id) || candidate.rank;
    }
    return candidate.rank;
  };

  // Filter and sort candidates
  const filteredCandidates = data?.candidates.filter(candidate => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = candidate.candidate_name.toLowerCase().includes(query);
      const matchesSchool = candidate.medical_school?.toLowerCase().includes(query);
      if (!matchesName && !matchesSchool) return false;
    }
    
    // Session filter
    if (selectedSession !== 'all' && candidate.session_id !== selectedSession) {
      return false;
    }
    
    // School filter
    if (selectedSchool !== 'all' && candidate.medical_school !== selectedSchool) {
      return false;
    }
    
    return true;
  }) || [];

  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'rank':
        comparison = (getDisplayRank(a) || 999) - (getDisplayRank(b) || 999);
        break;
      case 'candidate_name':
        comparison = a.candidate_name.localeCompare(b.candidate_name);
        break;
      case 'session_date':
        const dateA = a.session?.session_date || '';
        const dateB = b.session?.session_date || '';
        comparison = dateA.localeCompare(dateB);
        break;
      case 'eq_total':
        comparison = (b.eq_total || 0) - (a.eq_total || 0);
        break;
      case 'pq_total':
        comparison = (b.pq_total || 0) - (a.pq_total || 0);
        break;
      case 'iq_total':
        comparison = (b.iq_total || 0) - (a.iq_total || 0);
        break;
      case 'interview_total':
        comparison = (b.interview_total || 0) - (a.interview_total || 0);
        break;
      case 'ratingCount':
        comparison = (b.ratingCount || 0) - (a.ratingCount || 0);
        break;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Get unique schools for filter
  const uniqueSchools = [...new Set(data?.candidates.map(c => c.medical_school).filter(Boolean))]
    .sort() as string[];

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      // Default to descending for score fields, ascending for others
      if (['eq_total', 'pq_total', 'iq_total', 'interview_total', 'ratingCount'].includes(field)) {
        setSortDirection('desc');
      } else {
        setSortDirection('asc');
      }
    }
  };

  const getSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const exportToCsv = () => {
    if (!data) return;
    
    const headers = showNormalized 
      ? ['Rank (Normalized)', 'Raw Rank', 'Name', 'Email', 'Medical School', 'Interview Date', 'Normalized Total', 'Raw Total', '# Ratings']
      : ['Rank', 'Name', 'Email', 'Medical School', 'Interview Date', 'EQ Total', 'PQ Total', 'IQ Total', 'Interview Total', '# Ratings'];
    
    const rows = sortedCandidates.map(c => {
      if (showNormalized && normalizedData) {
        const scores = normalizedData.scores.get(c.id);
        return [
          getDisplayRank(c) || '',
          c.rank || '',
          c.candidate_name,
          c.candidate_email || '',
          c.medical_school || '',
          c.session?.session_date || '',
          scores?.normalized_interview_total?.toFixed(0) || '',
          c.interview_total || '',
          c.ratingCount,
        ];
      }
      return [
        c.rank || '',
        c.candidate_name,
        c.candidate_email || '',
        c.medical_school || '',
        c.session?.session_date || '',
        c.eq_total || '',
        c.pq_total || '',
        c.iq_total || '',
        c.interview_total || '',
        c.ratingCount,
      ];
    });
    
    const csvContent = [headers, ...rows].map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview_season_rankings_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
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
            onClick={() => router.push('/interview')}
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
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => router.push(`/interview/dashboard?email=${encodeURIComponent(email)}`)}
            className="text-sm text-slate-500 hover:text-slate-700 mb-2 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Interview Season Overview
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            All candidates ranked by interview scores
          </p>
        </div>
        <button
          onClick={exportToCsv}
          className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          style={{ backgroundColor: COLORS.lightest, color: COLORS.darker }}
        >
          <Download className="w-4 h-4" />
          Export Rank List
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
              <Calendar className="w-5 h-5" style={{ color: COLORS.dark }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: COLORS.darker }}>
                {data.summary.totalSessions}
              </p>
              <p className="text-sm text-slate-500">Interview Days</p>
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
                {Math.ceil(data.summary.totalCandidates / 2)}
              </p>
              <p className="text-sm text-slate-500">Top 50%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Score Normalization Toggle - Prominent */}
      <div 
        className="rounded-xl border-2 mb-6 p-5"
        style={{ 
          borderColor: showNormalized ? COLORS.dark : COLORS.light,
          backgroundColor: showNormalized ? COLORS.lightest : 'white',
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowNormalized(!showNormalized)}
              className="flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-all"
              style={{ 
                backgroundColor: showNormalized ? COLORS.dark : COLORS.light,
                color: showNormalized ? 'white' : COLORS.darker,
              }}
            >
              {showNormalized ? (
                <ToggleRight className="w-6 h-6" />
              ) : (
                <ToggleLeft className="w-6 h-6" />
              )}
              <span className="text-sm">
                {showNormalized ? 'Normalized Scores ON' : 'Show Normalized Scores'}
              </span>
            </button>
            
            {showNormalized && (
              <button
                onClick={() => setExcludeResidents(!excludeResidents)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
                style={{ 
                  backgroundColor: excludeResidents ? COLORS.medium : 'white',
                  color: excludeResidents ? 'white' : COLORS.darker,
                  border: `1px solid ${excludeResidents ? COLORS.medium : COLORS.light}`,
                }}
              >
                {excludeResidents ? (
                  <ToggleRight className="w-5 h-5" />
                ) : (
                  <ToggleLeft className="w-5 h-5" />
                )}
                Exclude Resident Ratings
              </button>
            )}
          </div>
          
          <button
            onClick={() => setShowNormalizationDetails(!showNormalizationDetails)}
            className="flex items-center gap-1 text-xs font-medium hover:underline"
            style={{ color: COLORS.dark }}
          >
            {showNormalizationDetails ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Hide Math
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                How it works
              </>
            )}
          </button>
        </div>
        
        {!showNormalized && (
          <p className="mt-3 text-xs text-slate-500">
            Normalization adjusts scores to account for differences in how interviewers rate. Some rate higher, others lower - normalization puts everyone on the same scale.
          </p>
        )}
        
        {showNormalized && (
          <p className="mt-3 text-xs" style={{ color: COLORS.darker }}>
            <strong>Active:</strong> Rankings and scores now reflect normalized values, accounting for interviewer rating tendencies.
          </p>
        )}
        
        {showNormalizationDetails && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: showNormalized ? COLORS.medium : COLORS.light }}>
            <div className="grid md:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="font-semibold mb-2" style={{ color: COLORS.darker }}>Step 1: Calculate Z-Score</p>
                <div className="bg-white rounded p-2 border font-mono text-xs mb-1" style={{ borderColor: COLORS.light }}>
                  z = (x - μ<sub>int</sub>) / σ<sub>int</sub>
                </div>
                <p className="text-slate-500 text-[10px]">x = raw score, μ = interviewer mean, σ = std dev</p>
              </div>
              <div>
                <p className="font-semibold mb-2" style={{ color: COLORS.darker }}>Step 2: Transform to Scale</p>
                <div className="bg-white rounded p-2 border font-mono text-xs mb-1" style={{ borderColor: COLORS.light }}>
                  normalized = 50 + (z × 15)
                </div>
                <p className="text-slate-500 text-[10px]">Centers around 50, ±15 per std deviation</p>
              </div>
            </div>
            <div className="mt-3 p-2 rounded text-xs" style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}>
              <strong>Result:</strong> A harsh grader&apos;s 70 and a lenient grader&apos;s 85 might both normalize to ~65 if they represent similar relative performance.
            </div>
          </div>
        )}
      </div>

      {/* Score Distribution by Decile */}
      <div 
        className="bg-white rounded-xl border mb-6 p-4"
        style={{ borderColor: COLORS.light }}
      >
        <h3 className="font-semibold text-slate-900 mb-1">Candidate Distribution by Decile</h3>
        <p className="text-xs text-slate-500 mb-3">
          Hover over each segment to see candidate names
          {showNormalized && <span className="ml-1 font-medium" style={{ color: COLORS.dark }}>(Using Normalized Scores)</span>}
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 relative pb-4">
            <div className="flex h-10 rounded-lg overflow-visible">
              {(() => {
                // Get score for sorting - use normalized if enabled, otherwise raw
                const getScore = (candidate: Candidate): number => {
                  if (showNormalized && normalizedData) {
                    const normScore = normalizedData.scores.get(candidate.id);
                    return normScore?.normalized_interview_total || 0;
                  }
                  return candidate.interview_total || 0;
                };
                
                // Sort candidates by score - highest first
                const sortedCandidates = [...data.candidates].sort((a, b) => 
                  getScore(b) - getScore(a)
                );
                const total = sortedCandidates.length;
                const decileSize = Math.ceil(total / 10);
                
                interface DecileData {
                  label: string;
                  candidates: { candidate: Candidate; score: number }[];
                  color: string;
                  textColor: string;
                }
                
                const deciles: DecileData[] = [];
                // Green → Yellow → Red gradient (top to bottom)
                const decileColors = [
                  { bg: '#15803D', text: 'white' },   // Top 10% - dark green
                  { bg: '#22C55E', text: 'white' },   // 2nd - green
                  { bg: '#4ADE80', text: '#14532D' }, // 3rd - lighter green
                  { bg: '#86EFAC', text: '#14532D' }, // 4th - light green
                  { bg: '#BBF7D0', text: '#14532D' }, // 5th - very light green (50th percentile)
                  { bg: '#FEF08A', text: '#713F12' }, // 6th - light yellow
                  { bg: '#FDE047', text: '#713F12' }, // 7th - yellow
                  { bg: '#FACC15', text: '#713F12' }, // 8th - darker yellow
                  { bg: '#FB923C', text: 'white' },   // 9th - orange
                  { bg: '#EF4444', text: 'white' },   // Bottom 10% - red
                ];
                
                for (let i = 0; i < 10; i++) {
                  const start = i * decileSize;
                  const end = Math.min(start + decileSize, total);
                  const candidatesInDecile = sortedCandidates.slice(start, end).map(c => ({
                    candidate: c,
                    score: getScore(c),
                  }));
                  
                  if (candidatesInDecile.length > 0) {
                    deciles.push({
                      label: i === 0 ? 'Top 10%' : i === 9 ? 'Bottom 10%' : `${i * 10 + 1}-${(i + 1) * 10}%`,
                      candidates: candidatesInDecile,
                      color: decileColors[i].bg,
                      textColor: decileColors[i].text,
                    });
                  }
                }
                
                return deciles.map((decile, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-center text-xs font-medium cursor-pointer transition-all hover:scale-y-110 relative group"
                    style={{ 
                      width: `${(decile.candidates.length / total) * 100}%`,
                      backgroundColor: decile.color,
                      color: decile.textColor,
                      minWidth: '28px',
                      borderRadius: idx === 0 ? '8px 0 0 8px' : idx === deciles.length - 1 ? '0 8px 8px 0' : '0',
                    }}
                  >
                    {decile.candidates.length}
                    {/* Tooltip - positioned below the bar */}
                    <div 
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none"
                      style={{ zIndex: 100 }}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-slate-900" />
                      <div className="bg-slate-900 text-white text-xs rounded-lg p-3 shadow-xl whitespace-nowrap">
                        <div className="font-semibold mb-2 pb-1 border-b border-slate-700 flex justify-between gap-6">
                          <span>{decile.label}</span>
                          <span className="text-slate-400">{decile.candidates.length} candidates</span>
                        </div>
                        <div className="max-h-52 overflow-y-auto">
                          {decile.candidates.map(({ candidate, score }) => (
                            <div key={candidate.id} className="text-left py-0.5 text-slate-200">
                              {candidate.candidate_name} <span className="text-slate-400">({score.toFixed(0)})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#15803D' }} />
              <span>Top 10%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-10 h-3 rounded" style={{ background: 'linear-gradient(to right, #22C55E, #FDE047)' }} />
              <span>50th %ile</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#EF4444' }} />
              <span>Bottom 10%</span>
            </div>
          </div>
          <span className="text-slate-400">
            Ranked by {showNormalized ? 'normalized' : 'raw'} combined score (EQ+PQ+IQ)
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div 
        className="bg-white rounded-xl border mb-6"
        style={{ borderColor: COLORS.light }}
      >
        <div className="p-4 flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or school..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
              style={{ borderColor: COLORS.light }}
            />
          </div>
          
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            style={{ backgroundColor: COLORS.lightest, color: COLORS.darker }}
          >
            <Filter className="w-4 h-4" />
            Filters
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {/* Results count */}
          <span className="text-sm text-slate-500">
            Showing {sortedCandidates.length} of {data.summary.totalCandidates}
          </span>
        </div>
        
        {/* Expanded Filters */}
        {showFilters && (
          <div 
            className="px-4 pb-4 pt-2 border-t flex flex-wrap gap-4"
            style={{ borderColor: COLORS.lightest }}
          >
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Interview Day</label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm min-w-[200px]"
                style={{ borderColor: COLORS.light }}
              >
                <option value="all">All Days</option>
                {data.sessions.map(session => (
                  <option key={session.id} value={session.id}>
                    {session.session_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Medical School</label>
              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm min-w-[200px]"
                style={{ borderColor: COLORS.light }}
              >
                <option value="all">All Schools</option>
                {uniqueSchools.map(school => (
                  <option key={school} value={school}>{school}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSession('all');
                  setSelectedSchool('all');
                }}
                className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rank List Table */}
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
                <th 
                  className="text-left px-4 py-3 font-medium text-slate-600 cursor-pointer hover:bg-white/50"
                  onClick={() => handleSort('rank')}
                >
                  <span className="flex items-center gap-1">
                    Rank {getSortIndicator('rank')}
                  </span>
                </th>
                <th 
                  className="text-left px-4 py-3 font-medium text-slate-600 cursor-pointer hover:bg-white/50"
                  onClick={() => handleSort('candidate_name')}
                >
                  <span className="flex items-center gap-1">
                    Candidate {getSortIndicator('candidate_name')}
                  </span>
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Medical School</th>
                <th 
                  className="text-left px-4 py-3 font-medium text-slate-600 cursor-pointer hover:bg-white/50"
                  onClick={() => handleSort('session_date')}
                >
                  <span className="flex items-center gap-1">
                    Date {getSortIndicator('session_date')}
                  </span>
                </th>
                <th 
                  className="text-center px-3 py-3 font-medium text-slate-600 cursor-pointer hover:bg-white/50"
                  onClick={() => handleSort('eq_total')}
                >
                  <span className="flex items-center justify-center gap-1">
                    <Heart className="w-4 h-4" style={{ color: COLORS.medium }} />
                    {getSortIndicator('eq_total')}
                  </span>
                </th>
                <th 
                  className="text-center px-3 py-3 font-medium text-slate-600 cursor-pointer hover:bg-white/50"
                  onClick={() => handleSort('pq_total')}
                >
                  <span className="flex items-center justify-center gap-1">
                    <Award className="w-4 h-4" style={{ color: COLORS.medium }} />
                    {getSortIndicator('pq_total')}
                  </span>
                </th>
                <th 
                  className="text-center px-3 py-3 font-medium text-slate-600 cursor-pointer hover:bg-white/50"
                  onClick={() => handleSort('iq_total')}
                >
                  <span className="flex items-center justify-center gap-1">
                    <Brain className="w-4 h-4" style={{ color: COLORS.medium }} />
                    {getSortIndicator('iq_total')}
                  </span>
                </th>
                <th 
                  className="text-center px-4 py-3 font-medium text-slate-600 cursor-pointer hover:bg-white/50"
                  onClick={() => handleSort('interview_total')}
                >
                  <span className="flex items-center justify-center gap-1">
                    Total {getSortIndicator('interview_total')}
                  </span>
                </th>
                <th 
                  className="text-center px-3 py-3 font-medium text-slate-600 cursor-pointer hover:bg-white/50"
                  onClick={() => handleSort('ratingCount')}
                >
                  <span className="flex items-center justify-center gap-1">
                    # {getSortIndicator('ratingCount')}
                  </span>
                </th>
                {showNormalized && (
                  <th className="text-center px-3 py-3 font-medium text-slate-600">
                    <span className="flex items-center justify-center gap-1">
                      Rank Δ
                    </span>
                  </th>
                )}
                <th className="text-center px-3 py-3 font-medium text-slate-600"></th>
              </tr>
            </thead>
            <tbody>
              {sortedCandidates.map((candidate) => (
                <Fragment key={candidate.id}>
                  <tr 
                    className="border-b hover:bg-slate-50 transition-colors cursor-pointer"
                    style={{ borderColor: COLORS.lightest }}
                    onClick={() => setExpandedCandidate(
                      expandedCandidate === candidate.id ? null : candidate.id
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getRankIcon(getDisplayRank(candidate))}
                        <span 
                          className="font-bold"
                          style={{ color: getDisplayRank(candidate) <= 10 ? COLORS.darker : undefined }}
                        >
                          {getDisplayRank(candidate) || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {expandedCandidate === candidate.id ? 
                          <ChevronUp className="w-4 h-4 text-slate-400" /> : 
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        }
                        <span className="font-medium text-slate-900">{candidate.candidate_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-600 text-xs truncate max-w-[200px]" title={candidate.medical_school || ''}>
                        {candidate.medical_school || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {candidate.session?.session_date ? 
                        new Date(candidate.session.session_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        }) : '-'
                      }
                    </td>
                    <td className="px-3 py-3 text-center">
                      {showNormalized && normalizedData ? (
                        <div>
                          <span style={{ color: getScoreColor(normalizedData.scores.get(candidate.id)?.normalized_eq_total || null) }}>
                            {normalizedData.scores.get(candidate.id)?.normalized_eq_total || '-'}
                          </span>
                          <span className="text-xs text-slate-400 block">
                            ({candidate.eq_total || '-'})
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: getScoreColor(candidate.eq_total) }}>
                          {candidate.eq_total || '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {showNormalized && normalizedData ? (
                        <div>
                          <span style={{ color: getScoreColor(normalizedData.scores.get(candidate.id)?.normalized_pq_total || null) }}>
                            {normalizedData.scores.get(candidate.id)?.normalized_pq_total || '-'}
                          </span>
                          <span className="text-xs text-slate-400 block">
                            ({candidate.pq_total || '-'})
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: getScoreColor(candidate.pq_total) }}>
                          {candidate.pq_total || '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {showNormalized && normalizedData ? (
                        <div>
                          <span style={{ color: getScoreColor(normalizedData.scores.get(candidate.id)?.normalized_iq_total || null) }}>
                            {normalizedData.scores.get(candidate.id)?.normalized_iq_total || '-'}
                          </span>
                          <span className="text-xs text-slate-400 block">
                            ({candidate.iq_total || '-'})
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: getScoreColor(candidate.iq_total) }}>
                          {candidate.iq_total || '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {showNormalized && normalizedData ? (
                        <div>
                          <span 
                            className="font-bold text-lg"
                            style={{ color: getScoreColor(normalizedData.scores.get(candidate.id)?.normalized_interview_total || null) }}
                          >
                            {normalizedData.scores.get(candidate.id)?.normalized_interview_total || '-'}
                          </span>
                          <span className="text-xs text-slate-400 block">
                            (raw: {candidate.interview_total || '-'})
                          </span>
                        </div>
                      ) : (
                        <span 
                          className="font-bold text-lg"
                          style={{ color: getScoreColor(candidate.interview_total) }}
                        >
                          {candidate.interview_total || '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center text-slate-500">
                      {candidate.ratingCount}
                    </td>
                    {showNormalized && normalizedData && (
                      <td className="px-3 py-3 text-center">
                        {(() => {
                          const scores = normalizedData.scores.get(candidate.id);
                          if (!scores) return '-';
                          return (
                            <span 
                              className="font-medium"
                              style={{ color: getRankChangeColor(scores.rank_change) }}
                            >
                              {formatRankChange(scores.rank_change)}
                            </span>
                          );
                        })()}
                      </td>
                    )}
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(
                            `/interview/session/${candidate.session_id}/review?email=${encodeURIComponent(email)}`
                          );
                        }}
                        className="p-1 hover:bg-slate-100 rounded"
                        title="View session details"
                      >
                        <ExternalLink className="w-4 h-4 text-slate-400" />
                      </button>
                    </td>
                  </tr>
                  
                  {/* Expanded Details Row */}
                  {expandedCandidate === candidate.id && (
                    <tr className="bg-slate-50">
                      <td colSpan={showNormalized ? 12 : 11} className="px-6 py-4">
                        <div className="space-y-4">
                          <h4 className="font-semibold text-slate-900">
                            Interviewer Ratings for {candidate.candidate_name}
                          </h4>
                          
                          {candidate.ratings.length === 0 ? (
                            <p className="text-slate-500 text-sm">No ratings available</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b" style={{ borderColor: COLORS.light }}>
                                    <th className="text-left px-4 py-2 font-medium text-slate-600">Interviewer</th>
                                    <th className="text-center px-4 py-2 font-medium text-slate-600">
                                      <span className="flex items-center justify-center gap-1">
                                        <Heart className="w-3 h-3" /> EQ
                                      </span>
                                    </th>
                                    <th className="text-center px-4 py-2 font-medium text-slate-600">
                                      <span className="flex items-center justify-center gap-1">
                                        <Award className="w-3 h-3" /> PQ
                                      </span>
                                    </th>
                                    <th className="text-center px-4 py-2 font-medium text-slate-600">
                                      <span className="flex items-center justify-center gap-1">
                                        <Brain className="w-3 h-3" /> IQ
                                      </span>
                                    </th>
                                    <th className="text-center px-4 py-2 font-medium text-slate-600">Total</th>
                                    <th className="text-left px-4 py-2 font-medium text-slate-600">Notes</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {candidate.ratings.map((rating, idx) => (
                                    <tr 
                                      key={idx} 
                                      className="border-b"
                                      style={{ borderColor: COLORS.lightest }}
                                    >
                                      <td className="px-4 py-2 font-medium text-slate-700">
                                        {rating.interviewer_name || rating.interviewer_email}
                                      </td>
                                      <td 
                                        className="px-4 py-2 text-center"
                                        style={{ color: getScoreColor(rating.eq_score, true) }}
                                      >
                                        {rating.eq_score ?? '-'}
                                      </td>
                                      <td 
                                        className="px-4 py-2 text-center"
                                        style={{ color: getScoreColor(rating.pq_score, true) }}
                                      >
                                        {rating.pq_score ?? '-'}
                                      </td>
                                      <td 
                                        className="px-4 py-2 text-center"
                                        style={{ color: getScoreColor(rating.iq_score, true) }}
                                      >
                                        {rating.iq_score ?? '-'}
                                      </td>
                                      <td 
                                        className="px-4 py-2 text-center font-bold"
                                        style={{ color: COLORS.darker }}
                                      >
                                        {rating.total ?? '-'}
                                      </td>
                                      <td className="px-4 py-2 text-slate-500 text-xs italic max-w-[300px]">
                                        {rating.notes ? `"${rating.notes}"` : '-'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        
        {sortedCandidates.length === 0 && (
          <div className="px-4 py-12 text-center text-slate-500">
            No candidates match your filters
          </div>
        )}
      </div>
    </div>
  );
}
