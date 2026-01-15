'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { ArrowLeft, Share2, Plus, Trash2, PlayCircle, Heart, Award, Brain, GraduationCap } from 'lucide-react';
import { useInterviewUser } from '@/hooks/useInterviewUser';

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
}

interface Session {
  id: string;
  session_name: string;
  session_date: string | null;
  status: string;
  share_token: string | null;
  creator_email: string | null;
  session_type: string;
}

export default function SessionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId as string;
  const email = searchParams.get('email') || '';

  // Get user context for permissions
  const { context: userContext, isProgramDirector, can } = useInterviewUser(email);

  const [session, setSession] = useState<Session | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [newCandidateName, setNewCandidateName] = useState('');
  const [newCandidateEmail, setNewCandidateEmail] = useState('');
  const [newCandidateMedSchool, setNewCandidateMedSchool] = useState('');
  const [isAddingCandidate, setIsAddingCandidate] = useState(false);

  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch(`/api/interview/sessions/${sessionId}?email=${encodeURIComponent(email)}`);
      if (!response.ok) throw new Error('Failed to fetch session');
      const data = await response.json();
      setSession(data.session);
      setCandidates(data.candidates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, email]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingCandidate(true);

    try {
      const response = await fetch(`/api/interview/sessions/${sessionId}/candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_name: newCandidateName,
          candidate_email: newCandidateEmail || null,
          medical_school: newCandidateMedSchool || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to add candidate');

      setNewCandidateName('');
      setNewCandidateEmail('');
      setNewCandidateMedSchool('');
      setShowAddCandidate(false);
      fetchSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add candidate');
    } finally {
      setIsAddingCandidate(false);
    }
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    if (!confirm('Are you sure you want to remove this candidate?')) return;

    try {
      const response = await fetch(`/api/interview/sessions/${sessionId}/candidates/${candidateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete candidate');
      fetchSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete candidate');
    }
  };

  const copyShareLink = () => {
    const link = `${window.location.origin}/interview/join/${session?.share_token}`;
    navigator.clipboard.writeText(link);
    alert('Share link copied to clipboard!');
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

  if (error) {
    return (
      <div className="max-w-xl mx-auto">
        <div 
          className="border rounded-xl p-6 text-center"
          style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA' }}
        >
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => router.push('/interview')}
            className="mt-4 font-medium"
            style={{ color: COLORS.dark }}
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* User Role Banner (for lev8 users) */}
      {userContext?.isLev8User && (
        <div 
          className="mb-6 p-4 rounded-lg border flex items-center justify-between"
          style={{ 
            backgroundColor: isProgramDirector ? COLORS.lightest : 'white',
            borderColor: COLORS.light 
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
              style={{ backgroundColor: isProgramDirector ? COLORS.dark : COLORS.medium }}
            >
              {userContext.user?.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="font-medium text-slate-900">
                {userContext.user?.fullName}
              </p>
              <p className="text-sm text-slate-500">
                {isProgramDirector ? 'Program Director' : 'Faculty'} 
                {userContext.institution && ` at ${userContext.institution.name}`}
              </p>
            </div>
          </div>
          {isProgramDirector && (
            <span 
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: COLORS.dark, color: 'white' }}
            >
              Full Access
            </span>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={() => router.push('/interview')}
            className="text-sm text-slate-500 hover:text-slate-700 mb-2 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {session?.session_name}
          </h1>
          {session?.session_date && (
            <p className="text-slate-600 dark:text-slate-400">
              {new Date(session.session_date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* PD-only: View All Ratings button */}
          {can('canViewAllRatings') && (
            <button
              onClick={() => router.push(`/interview/session/${sessionId}/review?email=${encodeURIComponent(email)}`)}
              className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-white"
              style={{ backgroundColor: COLORS.darker }}
            >
              View All Ratings
            </button>
          )}
          <button
            onClick={copyShareLink}
            className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            style={{ backgroundColor: COLORS.lightest, color: COLORS.darker }}
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>

      {/* Candidates List */}
      <div 
        className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border"
        style={{ borderColor: COLORS.light }}
      >
        <div 
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: COLORS.light }}
        >
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Candidates ({candidates.length})
          </h2>
          <button
            onClick={() => setShowAddCandidate(true)}
            className="px-4 py-2 text-white rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
            style={{ backgroundColor: COLORS.dark }}
          >
            <Plus className="w-4 h-4" />
            Add Candidate
          </button>
        </div>

        {/* Add Candidate Form */}
        {showAddCandidate && (
          <div 
            className="px-6 py-4 border-b"
            style={{ backgroundColor: COLORS.lightest + '40', borderColor: COLORS.light }}
          >
            <form onSubmit={handleAddCandidate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newCandidateName}
                    onChange={(e) => setNewCandidateName(e.target.value)}
                    placeholder="Candidate name"
                    required
                    className="w-full px-3 py-2 border rounded-lg bg-white text-slate-900 text-sm"
                    style={{ borderColor: COLORS.light }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    value={newCandidateEmail}
                    onChange={(e) => setNewCandidateEmail(e.target.value)}
                    placeholder="candidate@example.com"
                    className="w-full px-3 py-2 border rounded-lg bg-white text-slate-900 text-sm"
                    style={{ borderColor: COLORS.light }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Medical School (optional)
                  </label>
                  <input
                    type="text"
                    value={newCandidateMedSchool}
                    onChange={(e) => setNewCandidateMedSchool(e.target.value)}
                    placeholder="e.g., Johns Hopkins"
                    className="w-full px-3 py-2 border rounded-lg bg-white text-slate-900 text-sm"
                    style={{ borderColor: COLORS.light }}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCandidate(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingCandidate}
                  className="px-4 py-2 text-white rounded-lg font-medium text-sm disabled:opacity-50"
                  style={{ backgroundColor: COLORS.dark }}
                >
                  {isAddingCandidate ? 'Adding...' : 'Add Candidate'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Candidates Table */}
        {candidates.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              No candidates added yet.
            </p>
            <button
              onClick={() => setShowAddCandidate(true)}
              className="font-medium"
              style={{ color: COLORS.dark }}
            >
              Add your first candidate
            </button>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: COLORS.lightest }}>
            {candidates.map((candidate, index) => (
              <div
                key={candidate.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-slate-400 w-8">
                    #{index + 1}
                  </span>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">
                      {candidate.candidate_name}
                    </h3>
                    {candidate.medical_school && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" />
                        {candidate.medical_school}
                      </p>
                    )}
                    {candidate.candidate_email && !candidate.medical_school && (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {candidate.candidate_email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Scores */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center flex items-center gap-1">
                      <Heart className="w-3 h-3" style={{ color: COLORS.medium }} />
                      <span className="font-medium" style={{ color: COLORS.dark }}>
                        {candidate.eq_total ?? '-'}
                      </span>
                    </div>
                    <div className="text-center flex items-center gap-1">
                      <Award className="w-3 h-3" style={{ color: COLORS.medium }} />
                      <span className="font-medium" style={{ color: COLORS.dark }}>
                        {candidate.pq_total ?? '-'}
                      </span>
                    </div>
                    <div className="text-center flex items-center gap-1">
                      <Brain className="w-3 h-3" style={{ color: COLORS.medium }} />
                      <span className="font-medium" style={{ color: COLORS.dark }}>
                        {candidate.iq_total ?? '-'}
                      </span>
                    </div>
                    <div 
                      className="text-center pl-4"
                      style={{ borderLeft: `1px solid ${COLORS.light}` }}
                    >
                      <span className="font-bold" style={{ color: COLORS.darker }}>
                        {candidate.interview_total ?? '-'}
                      </span>
                      <p className="text-xs text-slate-400">Total</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/interview/session/${sessionId}/rate?candidate=${candidate.id}&email=${encodeURIComponent(email)}`)}
                      className="px-3 py-1.5 text-white rounded-lg text-sm font-medium"
                      style={{ backgroundColor: COLORS.dark }}
                    >
                      Rate
                    </button>
                    <button
                      onClick={() => handleDeleteCandidate(candidate.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Start Rating Button */}
      {candidates.length > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push(`/interview/session/${sessionId}/rate?email=${encodeURIComponent(email)}`)}
            className="px-8 py-3 text-white rounded-xl font-medium text-lg shadow-lg transition-all flex items-center gap-2 mx-auto"
            style={{ 
              backgroundColor: COLORS.dark,
              boxShadow: `0 10px 25px -5px ${COLORS.dark}40`,
            }}
          >
            <PlayCircle className="w-5 h-5" />
            Start Rating Candidates
          </button>
        </div>
      )}
    </div>
  );
}
