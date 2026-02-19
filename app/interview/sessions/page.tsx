'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, Calendar, Users, ChevronRight, Plus, 
  Eye, Edit, Clock, CheckCircle, AlertCircle
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

interface Session {
  id: string;
  session_name: string;
  session_date: string | null;
  status: string;
  candidate_count: number;
  rating_count: number;
  interviewers?: string[];
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return {
        icon: <Clock className="w-3 h-3" />,
        text: 'Active',
        bg: '#FEF3C7',
        color: '#92400E',
      };
    case 'review':
      return {
        icon: <Eye className="w-3 h-3" />,
        text: 'In Review',
        bg: COLORS.lightest,
        color: COLORS.darker,
      };
    case 'completed':
      return {
        icon: <CheckCircle className="w-3 h-3" />,
        text: 'Completed',
        bg: '#DCFCE7',
        color: '#166534',
      };
    default:
      return {
        icon: <AlertCircle className="w-3 h-3" />,
        text: 'Draft',
        bg: '#F1F5F9',
        color: '#475569',
      };
  }
}

export default function InterviewSessionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: isUserLoading, isAuthenticated, isProgramDirector, login, can } = useInterviewUserContext();
  const email = user?.email || searchParams.get('email') || '';

  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // If email is in URL, re-auth when needed (including stale guest sessions)
  useEffect(() => {
    const emailParam = searchParams.get('email');
    const normalizedParam = emailParam?.toLowerCase();
    const normalizedUserEmail = user?.email?.toLowerCase();
    const shouldRefreshAuth = Boolean(
      normalizedParam &&
      !isUserLoading &&
      (
        !isAuthenticated ||
        normalizedUserEmail !== normalizedParam ||
        user?.permission === 'guest'
      )
    );

    if (shouldRefreshAuth && normalizedParam) {
      login(normalizedParam);
    }
  }, [searchParams, isAuthenticated, isUserLoading, login, user?.email, user?.permission]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isUserLoading && !isAuthenticated && !searchParams.get('email')) {
      router.push('/interview');
    }
  }, [isUserLoading, isAuthenticated, router, searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      if (!email) return;

      try {
        const sessionsResponse = await fetch(`/api/interview/sessions/list?email=${encodeURIComponent(email)}`);
        if (!sessionsResponse.ok) throw new Error('Failed to fetch sessions');
        
        const sessionsData = await sessionsResponse.json();
        setSessions(sessionsData.sessions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    if (email) {
      fetchData();
    }
  }, [email]);

  const isPDorAdmin = isProgramDirector;
  const canViewSessionResults = can('canViewAllRatings');

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
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
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
            Interview Dates
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {canViewSessionResults
              ? 'Manage interview sessions and view candidate ratings'
              : 'View interview sessions and rate candidates'
            }
          </p>
        </div>
        {isPDorAdmin && (
          <button
            onClick={() => router.push(`/interview/create?email=${encodeURIComponent(email)}`)}
            className="px-4 py-2 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            style={{ backgroundColor: COLORS.dark }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = COLORS.darker}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = COLORS.dark}
          >
            <Plus className="w-4 h-4" />
            New Interview Date
          </button>
        )}
      </div>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <div 
          className="rounded-xl border p-12 text-center"
          style={{ borderColor: COLORS.light }}
        >
          <Calendar className="w-12 h-12 mx-auto mb-4" style={{ color: COLORS.medium }} />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            No Interview Sessions Yet
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            {isPDorAdmin 
              ? 'Create your first interview session to get started'
              : 'No interview sessions are available yet'
            }
          </p>
          {isPDorAdmin && (
            <button
              onClick={() => router.push(`/interview/create?email=${encodeURIComponent(email)}`)}
              className="px-4 py-2 text-white rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
              style={{ backgroundColor: COLORS.dark }}
            >
              <Plus className="w-4 h-4" />
              Create Session
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const statusBadge = getStatusBadge(session.status);
            // Parse date manually to avoid timezone shifts (dates are stored as YYYY-MM-DD)
            const sessionDate = session.session_date 
              ? (() => {
                  const [y, m, d] = session.session_date.split('-').map(Number);
                  // Create date in local time (months are 0-indexed)
                  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  });
                })()
              : 'No date set';

            return (
              <div
                key={session.id}
                className="bg-white dark:bg-slate-800 rounded-xl border p-4 hover:shadow-md transition-shadow cursor-pointer group"
                style={{ borderColor: COLORS.light }}
                onClick={() => router.push(
                  canViewSessionResults
                    ? `/interview/session/${session.id}/review?email=${encodeURIComponent(email)}`
                    : `/interview/session/${session.id}/rate?email=${encodeURIComponent(email)}`
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {session.session_name}
                      </h3>
                      <span 
                        className="px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1"
                        style={{ backgroundColor: statusBadge.bg, color: statusBadge.color }}
                      >
                        {statusBadge.icon}
                        {statusBadge.text}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {sessionDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {session.candidate_count} candidates
                      </span>
                      {session.interviewers && session.interviewers.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Edit className="w-4 h-4" />
                          {session.interviewers.join(' · ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight 
                    className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
