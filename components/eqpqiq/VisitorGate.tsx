'use client';

import { useState, useEffect, useCallback } from 'react';
import { Mail } from 'lucide-react';

/**
 * Unified EQ·PQ·IQ Visitor Gate
 *
 * Requires visitors on eqpqiq.com to enter their email once.
 * Tracks page visits silently for returning visitors.
 * Only activates on the eqpqiq.com domain (and eqpqiq.localhost for dev).
 */

const STORAGE_KEY = 'eqpqiq_visitor';
const OLD_INTERVIEW_KEY = 'interview_visitor_id';
const OLD_PULSECHECK_KEY = 'pulsecheck_visitor_id';

// Green color palette matching the EQ·PQ·IQ brand
const COLORS = {
  lightest: '#D8F3DC',
  light: '#B7E4C7',
  dark: '#40916C',
  darker: '#2D6A4F',
};

function generateVisitorId() {
  return 'eqpqiq_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function isEqpqiqDomain(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host.includes('eqpqiq.com') || host.includes('eqpqiq.localhost');
}

interface VisitorGateProps {
  /** The page path being visited (e.g. "/", "/interview", "/pulsecheck") */
  page: string;
}

export default function VisitorGate({ page }: VisitorGateProps) {
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  const trackPageVisit = useCallback(
    async (visitorId: string, isReturning: boolean, visitorEmail?: string) => {
      try {
        await fetch('/api/eqpqiq/track-visitor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visitorId,
            email: visitorEmail,
            page,
            isReturning,
          }),
        });
      } catch (err) {
        console.error('[VisitorGate] Track error:', err);
      }
    },
    [page]
  );

  useEffect(() => {
    // Only activate on eqpqiq.com
    if (!isEqpqiqDomain()) {
      setReady(true);
      return;
    }

    const init = async () => {
      // Check for existing unified visitor
      const existing = localStorage.getItem(STORAGE_KEY);
      if (existing) {
        // Returning visitor -- silently track page visit
        await trackPageVisit(existing, true);
        // Also set old keys for backward compatibility so existing per-page
        // modals don't re-appear if the user navigates within the same domain.
        localStorage.setItem(OLD_INTERVIEW_KEY, existing);
        localStorage.setItem(OLD_PULSECHECK_KEY, existing);
        setReady(true);
        return;
      }

      // Check for old per-product visitor IDs and migrate
      const oldInterview = localStorage.getItem(OLD_INTERVIEW_KEY);
      const oldPulsecheck = localStorage.getItem(OLD_PULSECHECK_KEY);
      const migratedId = oldInterview || oldPulsecheck;

      if (migratedId) {
        // Migrate: set unified key and track silently
        localStorage.setItem(STORAGE_KEY, migratedId);
        // Make sure both old keys are set for backward compat
        localStorage.setItem(OLD_INTERVIEW_KEY, migratedId);
        localStorage.setItem(OLD_PULSECHECK_KEY, migratedId);
        await trackPageVisit(migratedId, true);
        setReady(true);
        return;
      }

      // New visitor -- show the email modal
      setShowModal(true);
    };

    // Small delay so the page renders first
    const timer = setTimeout(init, 800);
    return () => clearTimeout(timer);
  }, [trackPageVisit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    const visitorId = generateVisitorId();

    try {
      await trackPageVisit(visitorId, false, email.trim());

      // Store in localStorage (unified + old keys for compat)
      localStorage.setItem(STORAGE_KEY, visitorId);
      localStorage.setItem(OLD_INTERVIEW_KEY, visitorId);
      localStorage.setItem(OLD_PULSECHECK_KEY, visitorId);

      setShowModal(false);
      setReady(true);
    } catch (err) {
      console.error('[VisitorGate] Submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // On non-eqpqiq domains or after gate passed, render nothing
  if (!showModal && ready) return null;

  // Before init completes, render nothing (avoids flash)
  if (!showModal && !ready) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: COLORS.lightest }}
            >
              <Mail className="w-5 h-5" style={{ color: COLORS.dark }} />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">Welcome to EQ·PQ·IQ</h2>
          </div>

          <p className="text-slate-600 mb-6">
            Please enter your email to explore the platform.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300"
              style={{ borderColor: COLORS.light }}
              autoFocus
              required
            />
            <button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="w-full py-3 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              style={{ backgroundColor: COLORS.dark }}
            >
              {isSubmitting ? 'Submitting...' : 'Continue'}
            </button>
          </form>

          <p className="text-xs text-slate-400 mt-4 text-center">
            We respect your privacy. Your email is only used to understand who is exploring our platform.
          </p>
        </div>
      </div>
    </div>
  );
}
