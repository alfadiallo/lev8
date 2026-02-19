'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight, Check, Save } from 'lucide-react';
import RatingSliders from '@/components/interview/RatingSliders';
import TotalScoreBar from '@/components/interview/TotalScoreBar';

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
  sort_order: number;
}

interface Rating {
  id?: string;
  eq_score: number;
  pq_score: number;
  iq_score: number;
  notes: string;
  questions_used: Record<string, boolean>;
}

export default function RatingPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId as string;
  const email = searchParams.get('email') || '';
  const initialCandidateId = searchParams.get('candidate');

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rating, setRating] = useState<Rating>({
    eq_score: 50,
    pq_score: 50,
    iq_score: 50,
    notes: '',
    questions_used: {},
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState('');

  const currentCandidate = candidates[currentIndex];

  // Fetch candidates
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await fetch(`/api/interview/sessions/${sessionId}?email=${encodeURIComponent(email)}`);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          const message = data?.error === 'Session not found'
            ? 'This session was not found. It may have been removed or the link may be from a different environment (e.g. demo data that isn’t in production).'
            : data?.error === 'Access denied'
              ? 'You don’t have access to this session. Sign in with the email that was invited to rate.'
              : data?.error || 'Failed to load session.';
          throw new Error(message);
        }
        setCandidates(data.candidates || []);

        // Set initial candidate if specified
        if (initialCandidateId && data.candidates) {
          const index = data.candidates.findIndex((c: Candidate) => c.id === initialCandidateId);
          if (index >= 0) setCurrentIndex(index);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load candidates');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCandidates();
  }, [sessionId, email, initialCandidateId]);

  // Fetch rating for current candidate
  const fetchRating = useCallback(async () => {
    if (!currentCandidate) return;

    try {
      const response = await fetch(
        `/api/interview/sessions/${sessionId}/ratings?candidate_id=${currentCandidate.id}&interviewer_email=${encodeURIComponent(email)}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.rating) {
          setRating({
            id: data.rating.id,
            eq_score: data.rating.eq_score ?? 50,
            pq_score: data.rating.pq_score ?? 50,
            iq_score: data.rating.iq_score ?? 50,
            notes: data.rating.notes || '',
            questions_used: data.rating.questions_used || {},
          });
        } else {
          // No existing rating, reset to defaults
          setRating({
            eq_score: 50,
            pq_score: 50,
            iq_score: 50,
            notes: '',
            questions_used: {},
          });
        }
      }
    } catch {
      console.error('Failed to fetch rating');
    }
  }, [sessionId, currentCandidate, email]);

  useEffect(() => {
    fetchRating();
  }, [fetchRating]);

  // Track last saved values to avoid unnecessary saves
  const lastSavedValues = useRef<{ eq: number; pq: number; iq: number; notes: string; questions_used: string } | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  // Save rating function (not wrapped in useCallback to avoid dependency issues)
  const saveRating = async () => {
    if (!currentCandidate || isSavingRef.current) return;

    // Check if values actually changed since last save
    const questionsUsedJson = JSON.stringify(rating.questions_used);
    const currentValues = {
      eq: rating.eq_score,
      pq: rating.pq_score,
      iq: rating.iq_score,
      notes: rating.notes,
      questions_used: questionsUsedJson,
    };

    if (
      lastSavedValues.current &&
      lastSavedValues.current.eq === currentValues.eq &&
      lastSavedValues.current.pq === currentValues.pq &&
      lastSavedValues.current.iq === currentValues.iq &&
      lastSavedValues.current.notes === currentValues.notes &&
      lastSavedValues.current.questions_used === currentValues.questions_used
    ) {
      return; // No changes, skip save
    }

    isSavingRef.current = true;
    setIsSaving(true);

    try {
      const response = await fetch(`/api/interview/sessions/${sessionId}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: currentCandidate.id,
          interviewer_email: email,
          eq_score: rating.eq_score,
          pq_score: rating.pq_score,
          iq_score: rating.iq_score,
          notes: rating.notes,
          questions_used: rating.questions_used,
        }),
      });

      if (!response.ok) throw new Error('Failed to save rating');

      const data = await response.json();
      setRating((prev) => ({ ...prev, id: data.id }));
      setLastSaved(new Date());
      lastSavedValues.current = currentValues;
    } catch {
      console.error('Failed to save rating');
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  // Debounced auto-save - only saves 1.5 seconds after user stops changing values
  useEffect(() => {
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout - save after 1.5 seconds of inactivity
    saveTimeoutRef.current = setTimeout(() => {
      saveRating();
    }, 1500);

    // Cleanup on unmount or when values change
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rating.eq_score, rating.pq_score, rating.iq_score, rating.notes, rating.questions_used, currentCandidate?.id]);

  const handleNext = () => {
    if (currentIndex < candidates.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleFinish = () => {
    router.push(`/interview/session/${sessionId}?email=${encodeURIComponent(email)}`);
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

  if (error || candidates.length === 0) {
    return (
      <div className="max-w-xl mx-auto">
        <div 
          className="border rounded-xl p-6 text-center"
          style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA' }}
        >
          <p className="text-red-600">
            {error || 'No candidates to rate.'}
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push(`/interview/session/${sessionId}?email=${encodeURIComponent(email)}`)}
              className="font-medium"
              style={{ color: COLORS.dark }}
            >
              Return to Session
            </button>
            <a
              href={email ? `/interview/dashboard?email=${encodeURIComponent(email)}` : '/interview'}
              className="font-medium"
              style={{ color: COLORS.dark }}
            >
              {email ? 'Go to Interview dashboard' : 'Go to Interview'}
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push(`/interview/session/${sessionId}?email=${encodeURIComponent(email)}`)}
          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Session
        </button>
        <div className="text-sm text-slate-500 flex items-center gap-2">
          {isSaving ? (
            <>
              <div 
                className="animate-spin rounded-full h-3 w-3 border-b"
                style={{ borderColor: COLORS.dark }}
              />
              <span>Saving...</span>
            </>
          ) : lastSaved ? (
            <>
              <Save className="w-3 h-3" style={{ color: COLORS.dark }} />
              <span>Saved {lastSaved.toLocaleTimeString()}</span>
            </>
          ) : null}
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
          <span>Candidate {currentIndex + 1} of {candidates.length}</span>
          <span>{Math.round(((currentIndex + 1) / candidates.length) * 100)}% Complete</span>
        </div>
        <div 
          className="h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: COLORS.lightest }}
        >
          <div
            className="h-full transition-all duration-300"
            style={{ 
              width: `${((currentIndex + 1) / candidates.length) * 100}%`,
              backgroundColor: COLORS.dark,
            }}
          />
        </div>
      </div>

      {/* Candidate Card */}
      <div 
        className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border mb-6"
        style={{ borderColor: COLORS.light }}
      >
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {currentCandidate.candidate_name}
          </h2>
          {currentCandidate.candidate_email && (
            <p className="text-slate-500 dark:text-slate-400">
              {currentCandidate.candidate_email}
            </p>
          )}
        </div>

        {/* Total Score Bar */}
        <div className="mb-6">
          <TotalScoreBar
            eqScore={rating.eq_score}
            pqScore={rating.pq_score}
            iqScore={rating.iq_score}
          />
        </div>

        {/* Rating Sliders */}
        <RatingSliders
          eqScore={rating.eq_score}
          pqScore={rating.pq_score}
          iqScore={rating.iq_score}
          onEqChange={(value) => setRating((prev) => ({ ...prev, eq_score: value }))}
          onPqChange={(value) => setRating((prev) => ({ ...prev, pq_score: value }))}
          onIqChange={(value) => setRating((prev) => ({ ...prev, iq_score: value }))}
          usedQuestions={rating.questions_used}
          onQuestionToggle={(questionId) => setRating((prev) => ({
            ...prev,
            questions_used: {
              ...prev.questions_used,
              [questionId]: !prev.questions_used[questionId]
            }
          }))}
        />

        {/* Notes */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Notes & Observations
          </label>
          <textarea
            value={rating.notes}
            onChange={(e) => setRating((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Add your notes about this candidate..."
            rows={4}
            className="w-full px-4 py-3 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:border-transparent resize-none"
            style={{ borderColor: COLORS.light }}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          style={{ backgroundColor: COLORS.lightest, color: COLORS.darker }}
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </button>

        {/* Candidate Navigation Dots */}
        <div className="flex gap-2">
          {candidates.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className="w-3 h-3 rounded-full transition-colors"
              style={{ 
                backgroundColor: index === currentIndex ? COLORS.dark : COLORS.light,
              }}
            />
          ))}
        </div>

        {currentIndex < candidates.length - 1 ? (
          <button
            onClick={handleNext}
            className="px-6 py-3 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            style={{ backgroundColor: COLORS.dark }}
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleFinish}
            className="px-6 py-3 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            style={{ backgroundColor: COLORS.darker }}
          >
            Finish
            <Check className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
