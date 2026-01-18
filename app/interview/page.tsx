'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Heart, Award, Brain, Plus, Users, ArrowLeft, LayoutDashboard, 
  GraduationCap, UserCog, ClipboardList, Mail 
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

// Generate a unique visitor ID
const generateVisitorId = () => {
  return 'interview_visitor_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export default function InterviewLandingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, user } = useInterviewUserContext();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'landing' | 'create' | 'join' | 'dashboard'>('landing');
  const [sessionCode, setSessionCode] = useState('');
  
  // Visitor tracking state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [visitorEmail, setVisitorEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If email is in URL params and we're not authenticated, auto-login
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam && !isAuthenticated) {
      login(emailParam);
    }
  }, [searchParams, isAuthenticated, login]);

  // Pre-fill email if already authenticated
  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user, email]);

  // Visitor tracking on mount
  useEffect(() => {
    const trackVisitor = async () => {
      const storedVisitorId = localStorage.getItem('interview_visitor_id');
      
      if (storedVisitorId) {
        // Returning visitor - track silently
        try {
          await fetch('/api/pulsecheck/track-visitor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              visitorId: storedVisitorId,
              isReturning: true,
              source: 'interview',
            }),
          });
        } catch (error) {
          console.error('[Visitor Tracking] Error:', error);
        }
      } else {
        // New visitor - show email modal
        setShowEmailModal(true);
      }
    };

    // Small delay to ensure page loads first
    const timer = setTimeout(trackVisitor, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleVisitorEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorEmail.trim()) return;

    setIsSubmitting(true);
    const newVisitorId = generateVisitorId();

    try {
      await fetch('/api/pulsecheck/track-visitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId: newVisitorId,
          email: visitorEmail.trim(),
          isReturning: false,
          source: 'interview',
        }),
      });

      // Store visitor ID in localStorage
      localStorage.setItem('interview_visitor_id', newVisitorId);
      setShowEmailModal(false);
    } catch (error) {
      console.error('[Visitor Tracking] Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Login to context first
      await login(email);
      
      if (mode === 'dashboard') {
        router.push(`/interview/dashboard?email=${encodeURIComponent(email)}`);
      } else if (mode === 'create') {
        router.push(`/interview/create?email=${encodeURIComponent(email)}`);
      } else if (mode === 'join' && sessionCode) {
        router.push(`/interview/join/${sessionCode}?email=${encodeURIComponent(email)}`);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
          Interview Assessment Tool
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Evaluate candidates using the EQ·PQ·IQ framework - a comprehensive approach 
          to assessing Emotional, Professional, and Intellectual qualities.
        </p>
      </div>

      {/* EQ/PQ/IQ Explanation Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {/* EQ Card */}
        <div 
          className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border"
          style={{ borderColor: COLORS.light }}
        >
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
            style={{ backgroundColor: COLORS.lightest }}
          >
            <Heart className="w-6 h-6" style={{ color: COLORS.dark }} />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Emotional Quotient (EQ)
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
            Ability to understand, manage, and express emotions effectively.
          </p>
          <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-1">
            <li>• Empathy & Positive Interactions</li>
            <li>• Adaptability & Self-Awareness</li>
            <li>• Stress Management & Resilience</li>
            <li>• Curiosity & Growth Mindset</li>
            <li>• Communication Skills</li>
          </ul>
        </div>

        {/* PQ Card */}
        <div 
          className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border"
          style={{ borderColor: COLORS.light }}
        >
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
            style={{ backgroundColor: COLORS.lightest }}
          >
            <Award className="w-6 h-6" style={{ color: COLORS.dark }} />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Professional Quotient (PQ)
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
            Professional conduct, reliability, and workplace effectiveness.
          </p>
          <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-1">
            <li>• Work Ethic & Reliability</li>
            <li>• Integrity & Accountability</li>
            <li>• Teachability & Receptiveness</li>
            <li>• Documentation & Organization</li>
            <li>• Leadership & Initiative</li>
          </ul>
        </div>

        {/* IQ Card */}
        <div 
          className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border"
          style={{ borderColor: COLORS.light }}
        >
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
            style={{ backgroundColor: COLORS.lightest }}
          >
            <Brain className="w-6 h-6" style={{ color: COLORS.dark }} />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Intellectual Quotient (IQ)
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
            Knowledge application, analytical thinking, and clinical reasoning.
          </p>
          <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-1">
            <li>• Medical Knowledge & Expertise</li>
            <li>• Analytical & Problem-Solving</li>
            <li>• Learning & Knowledge Application</li>
            <li>• Cognitive Flexibility</li>
            <li>• Performance Under Pressure</li>
          </ul>
        </div>
      </div>

      {/* Demo Access Section - 2x2 Grid */}
      <div className="max-w-3xl mx-auto w-full mb-12">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 text-center">
          Explore the Demo
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
          Select a role to see the platform from different perspectives
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Program Director */}
          <button
            onClick={() => {
              login('sarah.chen@hospital.edu');
              router.push('/interview/dashboard?email=sarah.chen%40hospital.edu');
            }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border text-left transition-all hover:shadow-md hover:scale-[1.02] group"
            style={{ borderColor: COLORS.light }}
          >
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors"
              style={{ backgroundColor: COLORS.lightest }}
            >
              <GraduationCap className="w-6 h-6" style={{ color: COLORS.dark }} />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1 group-hover:text-green-700">
              Program Director
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              View all candidates, analytics & rank list
            </p>
          </button>

          {/* Core Faculty */}
          <button
            onClick={() => {
              login('emily.watson@hospital.edu');
              router.push('/interview/dashboard?email=emily.watson%40hospital.edu');
            }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border text-left transition-all hover:shadow-md hover:scale-[1.02] group"
            style={{ borderColor: COLORS.light }}
          >
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors"
              style={{ backgroundColor: COLORS.lightest }}
            >
              <UserCog className="w-6 h-6" style={{ color: COLORS.dark }} />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1 group-hover:text-green-700">
              Core Faculty
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Rate candidates & view own ratings
            </p>
          </button>

          {/* Guest Interviewer - Greyed out */}
          <div
            className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-6 shadow-sm border text-left opacity-50 cursor-not-allowed"
            style={{ borderColor: '#E2E8F0' }}
          >
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
              style={{ backgroundColor: '#F1F5F9' }}
            >
              <Users className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Guest Interviewer
            </h3>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              One-time session access
            </p>
            <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-500">
              Coming Soon
            </span>
          </div>

          {/* Coordinator - Greyed out */}
          <div
            className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-6 shadow-sm border text-left opacity-50 cursor-not-allowed"
            style={{ borderColor: '#E2E8F0' }}
          >
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
              style={{ backgroundColor: '#F1F5F9' }}
            >
              <ClipboardList className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Coordinator
            </h3>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Administrative support
            </p>
            <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-500">
              Coming Soon
            </span>
          </div>
        </div>
      </div>

      {/* Alternative: Manual Login Section */}
      <div 
        className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm border max-w-xl mx-auto w-full"
        style={{ borderColor: COLORS.light }}
      >
        {mode === 'landing' ? (
          <>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 text-center">
              Or Get Started Manually
            </h2>
            <div className="space-y-4">
              <button
                onClick={() => setMode('dashboard')}
                className="w-full py-3 px-4 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                style={{ backgroundColor: COLORS.dark }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = COLORS.darker}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = COLORS.dark}
              >
                <LayoutDashboard className="w-5 h-5" />
                Go to Dashboard
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setMode('create')}
                  className="flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  style={{ backgroundColor: COLORS.lightest, color: COLORS.darker }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = COLORS.light}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = COLORS.lightest}
                >
                  <Plus className="w-5 h-5" />
                  Create Session
                </button>
                <button
                  onClick={() => setMode('join')}
                  className="flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  style={{ backgroundColor: COLORS.lightest, color: COLORS.darker }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = COLORS.light}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = COLORS.lightest}
                >
                  <Users className="w-5 h-5" />
                  Join Session
                </button>
              </div>
            </div>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
              Want your own account?{' '}
              <a 
                href="mailto:support@eqpqiq.com" 
                className="font-medium hover:underline"
                style={{ color: COLORS.dark }}
              >
                Contact us
              </a>
              {' '}for access.
            </p>
          </>
        ) : (
          <>
            <button
              onClick={() => setMode('landing')}
              className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 mb-4 flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
              {mode === 'dashboard' ? 'Access Dashboard' : mode === 'create' ? 'Create New Session' : 'Join Session'}
            </h2>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Your Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:border-transparent"
                  style={{ borderColor: COLORS.light }}
                />
              </div>

              {mode === 'join' && (
                <div>
                  <label htmlFor="sessionCode" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Session Code
                  </label>
                  <input
                    id="sessionCode"
                    type="text"
                    value={sessionCode}
                    onChange={(e) => setSessionCode(e.target.value)}
                    placeholder="Enter session code"
                    required
                    className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:border-transparent"
                    style={{ borderColor: COLORS.light }}
                  />
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                style={{ backgroundColor: COLORS.dark }}
                onMouseOver={(e) => !isLoading && (e.currentTarget.style.backgroundColor = COLORS.darker)}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = COLORS.dark}
              >
                {isLoading ? 'Loading...' : mode === 'dashboard' ? 'Continue to Dashboard' : mode === 'create' ? 'Create Session' : 'Join Session'}
              </button>
            </form>
          </>
        )}
      </div>

      {/* Features */}
      <div className="mt-12 text-center">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          How It Works
        </h3>
        <div className="flex flex-wrap justify-center gap-8 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center font-medium"
              style={{ backgroundColor: COLORS.lightest, color: COLORS.dark }}
            >
              1
            </div>
            <span>Create or join a session</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center font-medium"
              style={{ backgroundColor: COLORS.lightest, color: COLORS.dark }}
            >
              2
            </div>
            <span>Add candidates</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center font-medium"
              style={{ backgroundColor: COLORS.lightest, color: COLORS.dark }}
            >
              3
            </div>
            <span>Rate EQ · PQ · IQ (0-100)</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center font-medium"
              style={{ backgroundColor: COLORS.lightest, color: COLORS.dark }}
            >
              4
            </div>
            <span>Review & share results</span>
          </div>
        </div>
      </div>

      {/* Visitor Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: COLORS.lightest }}
                >
                  <Mail className="w-5 h-5" style={{ color: COLORS.dark }} />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Welcome!</h2>
              </div>
              
              <p className="text-slate-600 mb-6">
                Please enter your email to explore the EQ·PQ·IQ Interview Assessment demo.
              </p>

              <form onSubmit={handleVisitorEmailSubmit} className="space-y-4">
                <input
                  type="email"
                  value={visitorEmail}
                  onChange={(e) => setVisitorEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300"
                  style={{ borderColor: COLORS.light }}
                  autoFocus
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !visitorEmail.trim()}
                  className="w-full py-3 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                  style={{ backgroundColor: COLORS.dark }}
                >
                  {isSubmitting ? 'Submitting...' : 'Continue to Demo'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
