'use client';

import { useState, useEffect, Fragment, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, Users, Calendar, TrendingUp, Heart, Award, Brain, 
  Download, Search, Filter, ChevronDown, ChevronUp, ExternalLink,
  Trophy, Medal, Star, ToggleLeft, ToggleRight, Info
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
        comparison = (a.rank || 999) - (b.rank || 999);
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
    
    const headers = ['Rank', 'Name', 'Email', 'Medical School', 'Interview Date', 'EQ Total', 'PQ Total', 'IQ Total', 'Interview Total', '# Ratings'];
    
    const rows = sortedCandidates.map(c => [
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
    ]);
    
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
                {data.summary.distribution.exceptional}
              </p>
              <p className="text-sm text-slate-500">Top Tier (85+)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Score Distribution */}
      <div 
        className="bg-white rounded-xl border mb-6 p-4"
        style={{ borderColor: COLORS.light }}
      >
        <h3 className="font-semibold text-slate-900 mb-3">Score Distribution</h3>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="flex h-8 rounded-lg overflow-hidden">
              {data.summary.distribution.exceptional > 0 && (
                <div 
                  className="flex items-center justify-center text-white text-xs font-medium"
                  style={{ 
                    width: `${(data.summary.distribution.exceptional / data.summary.totalCandidates) * 100}%`,
                    backgroundColor: COLORS.dark,
                    minWidth: data.summary.distribution.exceptional > 0 ? '30px' : 0,
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
                    minWidth: data.summary.distribution.strong > 0 ? '30px' : 0,
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
                    minWidth: data.summary.distribution.good > 0 ? '30px' : 0,
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
                    minWidth: data.summary.distribution.average > 0 ? '30px' : 0,
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
                    minWidth: data.summary.distribution.belowAverage > 0 ? '30px' : 0,
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

      {/* Normalization Controls */}
      <div 
        className="bg-white rounded-xl border mb-6 p-4"
        style={{ borderColor: COLORS.light }}
      >
        <div className="flex items-start gap-3 mb-4">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: COLORS.dark }} />
          <div className="text-sm" style={{ color: COLORS.darker }}>
            <strong>Score Normalization:</strong> Adjusts scores to account for differences in how interviewers rate. 
            Some rate higher, others lower - normalization puts everyone on the same scale.
          </div>
        </div>
        <div className="flex flex-wrap gap-6">
          {/* Normalized Toggle */}
          <button
            onClick={() => setShowNormalized(!showNormalized)}
            className="flex items-center gap-2 text-sm"
          >
            {showNormalized ? (
              <ToggleRight className="w-8 h-5" style={{ color: COLORS.dark }} />
            ) : (
              <ToggleLeft className="w-8 h-5 text-slate-400" />
            )}
            <span className={showNormalized ? 'font-medium' : 'text-slate-500'}>
              Show Normalized Scores
            </span>
          </button>
          
          {/* Exclude Residents Toggle */}
          <button
            onClick={() => setExcludeResidents(!excludeResidents)}
            className="flex items-center gap-2 text-sm"
            disabled={!showNormalized}
            style={{ opacity: showNormalized ? 1 : 0.5 }}
          >
            {excludeResidents && showNormalized ? (
              <ToggleRight className="w-8 h-5" style={{ color: COLORS.dark }} />
            ) : (
              <ToggleLeft className="w-8 h-5 text-slate-400" />
            )}
            <span className={excludeResidents && showNormalized ? 'font-medium' : 'text-slate-500'}>
              Exclude Resident Ratings
            </span>
          </button>
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
                        {getRankIcon(candidate.rank)}
                        <span 
                          className="font-bold"
                          style={{ color: candidate.rank <= 10 ? COLORS.darker : undefined }}
                        >
                          {candidate.rank || '-'}
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
