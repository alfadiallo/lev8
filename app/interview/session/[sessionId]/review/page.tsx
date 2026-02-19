'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { ArrowLeft, Users, Heart, Award, Brain, TrendingUp, ChevronDown, ChevronUp, Download } from 'lucide-react';

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

interface Rating {
  eq: number | null;
  pq: number | null;
  iq: number | null;
  total: number | null;
  notes: string | null;
  interviewerName: string;
}

interface Candidate {
  id: string;
  candidate_name: string;
  candidate_email: string | null;
  medical_school: string | null;
  eq_total: number | null;
  pq_total: number | null;
  iq_total: number | null;
  interview_total: number | null;
  sort_order: number;
  ratings: Record<string, Rating>;
  ratingCount: number;
}

interface Interviewer {
  email: string;
  name: string;
  role: string;
  candidatesRated: number;
  avgEq: number;
  avgPq: number;
  avgIq: number;
  avgTotal: number;
}

interface Session {
  id: string;
  session_name: string;
  session_date: string | null;
  status: string;
}

interface ReviewData {
  session: Session;
  candidates: Candidate[];
  interviewers: Interviewer[];
  viewScope?: 'all' | 'self';
  summary: {
    totalCandidates: number;
    totalRatings: number;
    totalInterviewers: number;
  };
}

function getScoreColor(score: number | null): string {
  if (score === null) return '#E2E8F0';
  if (score >= 85) return COLORS.dark;
  if (score >= 75) return COLORS.mediumDark;
  if (score >= 65) return COLORS.medium;
  if (score >= 55) return COLORS.mediumLight;
  return '#F87171'; // Red for below 55
}

function getScoreBgColor(score: number | null): string {
  if (score === null) return '#F8FAFC';
  if (score >= 85) return COLORS.lightest;
  if (score >= 75) return '#E0F7E9';
  if (score >= 65) return '#F0FDF4';
  if (score >= 55) return '#FFFBEB';
  return '#FEF2F2';
}

export default function SessionReviewPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId as string;
  const email = searchParams.get('email') || '';

  const [data, setData] = useState<ReviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortField, setSortField] = useState<'sort_order' | 'interview_total' | 'candidate_name'>('sort_order');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/interview/sessions/${sessionId}/review?email=${encodeURIComponent(email)}`);
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.error || 'Failed to fetch review data');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [sessionId, email]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'interview_total' ? 'desc' : 'asc');
    }
  };

  const sortedCandidates = data?.candidates.slice().sort((a, b) => {
    let comparison = 0;
    if (sortField === 'sort_order') {
      comparison = a.sort_order - b.sort_order;
    } else if (sortField === 'interview_total') {
      comparison = (b.interview_total || 0) - (a.interview_total || 0);
    } else if (sortField === 'candidate_name') {
      comparison = a.candidate_name.localeCompare(b.candidate_name);
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  }) || [];

  const exportToCsv = () => {
    if (!data) return;
    
    const headers = ['Rank', 'Name', 'Medical School', 'EQ Total', 'PQ Total', 'IQ Total', 'Interview Total'];
    data.interviewers.forEach(i => {
      headers.push(`${i.name} (EQ)`, `${i.name} (PQ)`, `${i.name} (IQ)`, `${i.name} (Total)`);
    });
    
    const rows = sortedCandidates.map((c, idx) => {
      const row = [
        idx + 1,
        c.candidate_name,
        c.medical_school || '',
        c.eq_total || '',
        c.pq_total || '',
        c.iq_total || '',
        c.interview_total || '',
      ];
      data.interviewers.forEach(i => {
        const rating = c.ratings[i.email];
        row.push(
          rating?.eq ?? '',
          rating?.pq ?? '',
          rating?.iq ?? '',
          rating?.total ?? ''
        );
      });
      return row;
    });
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.session.session_name.replace(/[^a-z0-9]/gi, '_')}_ratings.csv`;
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
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => router.push(`/interview/session/${sessionId}?email=${encodeURIComponent(email)}`)}
            className="text-sm text-slate-500 hover:text-slate-700 mb-2 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Session
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {data.session.session_name}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {data.viewScope === 'self' ? 'My Ratings Review' : 'All Ratings Review'}
          </p>
        </div>
        <button
          onClick={exportToCsv}
          className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          style={{ backgroundColor: COLORS.lightest, color: COLORS.darker }}
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
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
                {data.summary.totalRatings}
              </p>
              <p className="text-sm text-slate-500">Ratings</p>
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
              <Award className="w-5 h-5" style={{ color: COLORS.dark }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: COLORS.darker }}>
                {data.summary.totalInterviewers}
              </p>
              <p className="text-sm text-slate-500">Interviewers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Interviewer Calibration Summary */}
      <div 
        className="bg-white rounded-xl border mb-6 overflow-hidden"
        style={{ borderColor: COLORS.light }}
      >
        <div 
          className="px-4 py-3 border-b"
          style={{ backgroundColor: COLORS.lightest + '60', borderColor: COLORS.light }}
        >
          <h2 className="font-semibold text-slate-900">Interviewer Summary</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: COLORS.lightest }}>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Interviewer</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Role</th>
                <th className="text-center px-4 py-2 font-medium text-slate-600"># Rated</th>
                <th className="text-center px-4 py-2 font-medium text-slate-600">
                  <span className="flex items-center justify-center gap-1">
                    <Heart className="w-3 h-3" /> Avg EQ
                  </span>
                </th>
                <th className="text-center px-4 py-2 font-medium text-slate-600">
                  <span className="flex items-center justify-center gap-1">
                    <Award className="w-3 h-3" /> Avg PQ
                  </span>
                </th>
                <th className="text-center px-4 py-2 font-medium text-slate-600">
                  <span className="flex items-center justify-center gap-1">
                    <Brain className="w-3 h-3" /> Avg IQ
                  </span>
                </th>
                <th className="text-center px-4 py-2 font-medium text-slate-600">Avg Total</th>
              </tr>
            </thead>
            <tbody>
              {data.interviewers.map(interviewer => (
                <tr 
                  key={interviewer.email} 
                  className="border-b hover:bg-slate-50"
                  style={{ borderColor: COLORS.lightest }}
                >
                  <td className="px-4 py-2 font-medium">{interviewer.name}</td>
                  <td className="px-4 py-2">
                    <span 
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: interviewer.role === 'program_director' ? COLORS.dark : 
                          interviewer.role === 'core_faculty' ? COLORS.mediumDark : 
                          interviewer.role === 'teaching_faculty' ? COLORS.medium : COLORS.light,
                        color: interviewer.role === 'program_director' ? 'white' : 
                          interviewer.role === 'core_faculty' ? 'white' : 
                          interviewer.role === 'teaching_faculty' ? 'white' : COLORS.darker,
                      }}
                    >
                      {interviewer.role === 'program_director' ? 'PD' : 
                       interviewer.role === 'core_faculty' ? 'Core Faculty' : 
                       interviewer.role === 'teaching_faculty' ? 'Teaching Faculty' : 
                       interviewer.role === 'coordinator' ? 'APD' : 'Faculty'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">{interviewer.candidatesRated}</td>
                  <td className="px-4 py-2 text-center" style={{ color: getScoreColor(interviewer.avgEq) }}>
                    {interviewer.avgEq || '-'}
                  </td>
                  <td className="px-4 py-2 text-center" style={{ color: getScoreColor(interviewer.avgPq) }}>
                    {interviewer.avgPq || '-'}
                  </td>
                  <td className="px-4 py-2 text-center" style={{ color: getScoreColor(interviewer.avgIq) }}>
                    {interviewer.avgIq || '-'}
                  </td>
                  <td className="px-4 py-2 text-center font-bold" style={{ color: COLORS.darker }}>
                    {interviewer.avgTotal || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ratings Matrix */}
      <div 
        className="bg-white rounded-xl border overflow-hidden"
        style={{ borderColor: COLORS.light }}
      >
        <div 
          className="px-4 py-3 border-b flex items-center justify-between"
          style={{ backgroundColor: COLORS.lightest + '60', borderColor: COLORS.light }}
        >
          <h2 className="font-semibold text-slate-900">Candidate Ratings</h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Sort by:</span>
            <button
              onClick={() => handleSort('sort_order')}
              className={`px-2 py-1 rounded ${sortField === 'sort_order' ? 'bg-white shadow-sm' : ''}`}
              style={{ color: sortField === 'sort_order' ? COLORS.dark : undefined }}
            >
              Order {sortField === 'sort_order' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSort('interview_total')}
              className={`px-2 py-1 rounded ${sortField === 'interview_total' ? 'bg-white shadow-sm' : ''}`}
              style={{ color: sortField === 'interview_total' ? COLORS.dark : undefined }}
            >
              Score {sortField === 'interview_total' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSort('candidate_name')}
              className={`px-2 py-1 rounded ${sortField === 'candidate_name' ? 'bg-white shadow-sm' : ''}`}
              style={{ color: sortField === 'candidate_name' ? COLORS.dark : undefined }}
            >
              Name {sortField === 'candidate_name' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: COLORS.lightest }}>
                <th className="text-left px-4 py-2 font-medium text-slate-600 sticky left-0 bg-white">#</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600 sticky left-8 bg-white min-w-[200px]">Candidate</th>
                <th className="text-center px-3 py-2 font-medium text-slate-600 bg-slate-50">
                  <div className="text-xs">Total</div>
                  <div className="text-xs text-slate-400">EQ+PQ+IQ</div>
                </th>
                {data.interviewers.map(interviewer => (
                  <th 
                    key={interviewer.email} 
                    className="text-center px-3 py-2 font-medium text-slate-600 min-w-[120px]"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-xs truncate max-w-[120px] font-semibold" title={interviewer.name}>
                        {interviewer.name}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wide">
                        {interviewer.role === 'program_director' ? 'PD' : 
                         interviewer.role === 'core_faculty' ? 'Core Faculty' : 
                         interviewer.role === 'teaching_faculty' ? 'Teaching Faculty' : 
                         interviewer.role === 'coordinator' ? 'APD' : 'Faculty'}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedCandidates.map((candidate, idx) => (
                <>
                  <tr 
                    key={candidate.id}
                    className="border-b hover:bg-slate-50 cursor-pointer"
                    style={{ borderColor: COLORS.lightest }}
                    onClick={() => setExpandedCandidate(
                      expandedCandidate === candidate.id ? null : candidate.id
                    )}
                  >
                    <td className="px-4 py-3 text-slate-400 sticky left-0 bg-white">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 sticky left-8 bg-white">
                      <div className="flex items-center gap-2">
                        {expandedCandidate === candidate.id ? 
                          <ChevronUp className="w-4 h-4 text-slate-400" /> : 
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        }
                        <div>
                          <div className="font-medium text-slate-900">{candidate.candidate_name}</div>
                          <div className="text-xs text-slate-500 truncate max-w-[180px]">
                            {candidate.medical_school}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td 
                      className="px-3 py-3 text-center font-bold"
                      style={{ 
                        backgroundColor: getScoreBgColor(candidate.interview_total ? candidate.interview_total / 3 : null),
                        color: COLORS.darker,
                      }}
                    >
                      {candidate.interview_total || '-'}
                    </td>
                    {data.interviewers.map(interviewer => {
                      const rating = candidate.ratings[interviewer.email];
                      return (
                        <td 
                          key={interviewer.email}
                          className="px-3 py-3 text-center"
                          style={{ 
                            backgroundColor: getScoreBgColor(rating?.total ? rating.total / 3 : null),
                          }}
                        >
                          {rating ? (
                            <span 
                              className="font-medium"
                              style={{ color: getScoreColor(rating.total ? rating.total / 3 : null) }}
                            >
                              {rating.total || '-'}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  {/* Expanded Details Row */}
                  {expandedCandidate === candidate.id && (
                    <tr className="bg-slate-50">
                      <td colSpan={3 + data.interviewers.length} className="px-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* EQ/PQ/IQ Breakdown */}
                          <div 
                            className="bg-white rounded-lg p-4 border"
                            style={{ borderColor: COLORS.light }}
                          >
                            <h4 className="font-medium text-slate-900 mb-3">Score Breakdown</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="flex items-center gap-2 text-slate-600">
                                  <Heart className="w-4 h-4" style={{ color: COLORS.medium }} />
                                  EQ Total
                                </span>
                                <span className="font-bold" style={{ color: COLORS.dark }}>
                                  {candidate.eq_total || '-'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="flex items-center gap-2 text-slate-600">
                                  <Award className="w-4 h-4" style={{ color: COLORS.medium }} />
                                  PQ Total
                                </span>
                                <span className="font-bold" style={{ color: COLORS.dark }}>
                                  {candidate.pq_total || '-'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="flex items-center gap-2 text-slate-600">
                                  <Brain className="w-4 h-4" style={{ color: COLORS.medium }} />
                                  IQ Total
                                </span>
                                <span className="font-bold" style={{ color: COLORS.dark }}>
                                  {candidate.iq_total || '-'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Individual Ratings */}
                          <div 
                            className="bg-white rounded-lg p-4 border md:col-span-2"
                            style={{ borderColor: COLORS.light }}
                          >
                            <h4 className="font-medium text-slate-900 mb-3">Individual Ratings</h4>
                            <div className="space-y-3">
                              {data.interviewers.map(interviewer => {
                                const rating = candidate.ratings[interviewer.email];
                                if (!rating) return null;
                                return (
                                  <div 
                                    key={interviewer.email}
                                    className="flex items-start justify-between border-b pb-2"
                                    style={{ borderColor: COLORS.lightest }}
                                  >
                                    <div>
                                      <div className="font-medium text-slate-700">{interviewer.name}</div>
                                      {rating.notes && (
                                        <p className="text-xs text-slate-500 mt-1 italic">
                                          &ldquo;{rating.notes}&rdquo;
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                      <span style={{ color: getScoreColor(rating.eq) }}>
                                        EQ: {rating.eq ?? '-'}
                                      </span>
                                      <span style={{ color: getScoreColor(rating.pq) }}>
                                        PQ: {rating.pq ?? '-'}
                                      </span>
                                      <span style={{ color: getScoreColor(rating.iq) }}>
                                        IQ: {rating.iq ?? '-'}
                                      </span>
                                      <span 
                                        className="font-bold pl-2 border-l"
                                        style={{ color: COLORS.darker, borderColor: COLORS.light }}
                                      >
                                        {rating.total ?? '-'}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
