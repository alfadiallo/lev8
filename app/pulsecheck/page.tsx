'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Heart, Award, Brain, Activity, Building2, UserCog, Stethoscope, ClipboardList, Mail } from 'lucide-react';
import { usePulseCheckUserContext } from '@/context/PulseCheckUserContext';

// Purple color palette for Pulse Check
const COLORS = {
  lightest: '#EDE9FE',
  light: '#DDD6FE',
  mediumLight: '#C4B5FD',
  medium: '#A78BFA',
  mediumDark: '#8B5CF6',
  dark: '#7C3AED',
  darker: '#6D28D9',
  veryDark: '#5B21B6',
  darkest: '#4C1D95',
};

// Generate a unique visitor ID
const generateVisitorId = () => {
  return 'visitor_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export default function PulseCheckLandingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated } = usePulseCheckUserContext();
  
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

  // Visitor tracking on mount
  useEffect(() => {
    const trackVisitor = async () => {
      const storedVisitorId = localStorage.getItem('pulsecheck_visitor_id');
      
      if (storedVisitorId) {
        // Returning visitor - track silently
        try {
          await fetch('/api/pulsecheck/track-visitor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              visitorId: storedVisitorId,
              isReturning: true,
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

  const handleEmailSubmit = async (e: React.FormEvent) => {
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
        }),
      });

      // Store visitor ID in localStorage
      localStorage.setItem('pulsecheck_visitor_id', newVisitorId);
      setShowEmailModal(false);
    } catch (error) {
      console.error('[Visitor Tracking] Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Activity className="w-10 h-10" style={{ color: COLORS.dark }} />
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white">
            Pulse Check
          </h1>
        </div>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Physician and APC Performance Evaluation using the EQ·PQ·IQ framework - 
          a comprehensive approach to assessing providers.
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
            Mastering Interpersonal and Intrapersonal Skills
          </p>
          <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-1">
            <li>• Empathy & Rapport</li>
            <li>• Communication Effectiveness</li>
            <li>• Stress Management</li>
            <li>• Self-Awareness</li>
            <li>• Adaptability & Growth Mindset</li>
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
            Professionalism Quotient (PQ)
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
            Upholding Professional Decorum and Leadership
          </p>
          <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-1">
            <li>• Reliability & Work Ethic</li>
            <li>• Integrity & Accountability</li>
            <li>• Teachability & Receptiveness</li>
            <li>• Documentation Quality</li>
            <li>• Leadership & Collaboration</li>
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
            Excelling in Clinical Acumen and Critical Thinking
          </p>
          <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-1">
            <li>• Clinical Management</li>
            <li>• Evidence-Based Practice</li>
            <li>• Procedural & Technical Competence</li>
          </ul>
        </div>
      </div>

      {/* Demo Access Section - 2x2 Grid */}
      <div className="max-w-3xl mx-auto w-full">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 text-center">
          Explore the Demo
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
          Select a role to see the platform from different perspectives
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Regional Medical Director */}
          <button
            onClick={() => {
              login('michael.thompson@metrohealth.com');
              router.push('/pulsecheck/reports?email=michael.thompson%40metrohealth.com');
            }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border text-left transition-all hover:shadow-md hover:scale-[1.02] group"
            style={{ borderColor: COLORS.light }}
          >
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors"
              style={{ backgroundColor: COLORS.lightest }}
            >
              <Building2 className="w-6 h-6" style={{ color: COLORS.dark }} />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1 group-hover:text-purple-700">
              Regional Medical Director
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Healthsystem-wide analytics & reports
            </p>
          </button>

          {/* Medical Director */}
          <button
            onClick={() => {
              login('james.wilson@metrohealth.com');
              router.push('/pulsecheck/dashboard?email=james.wilson%40metrohealth.com');
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
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1 group-hover:text-purple-700">
              Medical Director
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Rate providers & manage team
            </p>
          </button>

          {/* Physician & APC - Greyed out */}
          <div
            className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-6 shadow-sm border text-left opacity-50 cursor-not-allowed"
            style={{ borderColor: '#E2E8F0' }}
          >
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
              style={{ backgroundColor: '#F1F5F9' }}
            >
              <Stethoscope className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Physician & APC
            </h3>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Self-evaluation & feedback
            </p>
            <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-500">
              Coming Soon
            </span>
          </div>

          {/* Executive Assistant */}
          <button
            onClick={() => {
              login('amanda.chen@metrohealth.com');
              router.push('/pulsecheck/dashboard?email=amanda.chen%40metrohealth.com');
            }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border text-left transition-all hover:shadow-md hover:scale-[1.02] group"
            style={{ borderColor: COLORS.light }}
          >
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors"
              style={{ backgroundColor: COLORS.lightest }}
            >
              <ClipboardList className="w-6 h-6" style={{ color: COLORS.dark }} />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1 group-hover:text-purple-700">
              Executive Assistant
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage users & import data
            </p>
          </button>
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          Want your own account?{' '}
          <a 
            href="mailto:support@lev8.ai" 
            className="font-medium hover:underline"
            style={{ color: COLORS.dark }}
          >
            Contact us
          </a>
          {' '}for access.
        </p>
      </div>

      {/* Rating Scale Info */}
      <div className="mt-12 text-center">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Rating Scale
        </h3>
        <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: COLORS.lightest }}>
            <span className="font-bold" style={{ color: COLORS.dark }}>5</span>
            <span>Exemplary</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: COLORS.lightest }}>
            <span className="font-bold" style={{ color: COLORS.dark }}>4</span>
            <span>Proficient</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: COLORS.lightest }}>
            <span className="font-bold" style={{ color: COLORS.dark }}>3</span>
            <span>Developing</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: COLORS.lightest }}>
            <span className="font-bold" style={{ color: COLORS.dark }}>2</span>
            <span>Needs Improvement</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: COLORS.lightest }}>
            <span className="font-bold" style={{ color: COLORS.dark }}>1</span>
            <span>Unsatisfactory</span>
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
                Please enter your email to explore the EQ·PQ·IQ Pulse Check demo.
              </p>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <input
                  type="email"
                  value={visitorEmail}
                  onChange={(e) => setVisitorEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
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
