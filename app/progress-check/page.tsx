'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Heart, Award, Brain, Users, BarChart3, ClipboardCheck,
  GraduationCap, UserCog, Mail, ArrowRight, TrendingUp,
  Target, Star
} from 'lucide-react';
import { useProgressCheckUserContext } from '@/context/ProgressCheckUserContext';
import VisitorGate from '@/components/eqpqiq/VisitorGate';

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

const DEMO_ACCOUNTS = [
  {
    role: 'Program Director',
    email: 'demo-pd@greysloan.edu',
    icon: UserCog,
    description: 'Full analytics, surveys, progress check session management',
    permission: 'program_director',
  },
  {
    role: 'Faculty',
    email: 'demo-faculty@greysloan.edu',
    icon: GraduationCap,
    description: 'Rate residents, view analytics, participate in progress checks',
    permission: 'faculty',
  },
  {
    role: 'Resident',
    email: 'demo-resident@greysloan.edu',
    icon: Users,
    description: 'Self-assessment, view own scores',
    permission: 'resident',
  },
];

const FEATURES = [
  {
    icon: Target,
    title: 'EQ·PQ·IQ Framework',
    description: 'Structured evaluation across Emotional, Professional, and Intellectual Quotients with 15 core attributes.',
  },
  {
    icon: TrendingUp,
    title: 'Longitudinal Tracking',
    description: 'Track resident development over time with period-over-period trends and PGY-level benchmarks.',
  },
  {
    icon: BarChart3,
    title: 'Rich Analytics',
    description: 'Radar charts, score distributions, faculty-vs-self comparisons, and AI-powered SWOT analysis.',
  },
  {
    icon: ClipboardCheck,
    title: 'Survey Management',
    description: 'Distribute faculty and learner surveys with zero-friction, token-based access and automated reminders.',
  },
  {
    icon: Star,
    title: 'Progress Check Sessions',
    description: 'Organize and run progress check meetings with structured resident discussions and outcome tracking.',
  },
  {
    icon: Users,
    title: 'Class Cohort Views',
    description: 'Compare residents within cohorts, identify trends, and support data-driven promotion decisions.',
  },
];

export default function ProgressCheckLandingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, user, isProgramDirector, isLoading: contextLoading } = useProgressCheckUserContext();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-login from URL params
  useEffect(() => {
    if (contextLoading) return;
    const emailParam = searchParams.get('email');
    if (emailParam && !isAuthenticated) {
      login(emailParam);
    }
  }, [searchParams, isAuthenticated, login, contextLoading]);

  // Pre-fill email if already authenticated
  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user, email]);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (contextLoading) return;
    if (isAuthenticated && user?.permission !== 'guest') {
      if (isProgramDirector) {
        router.replace('/progress-check/dashboard');
      } else if (user?.permission === 'faculty') {
        router.replace('/progress-check/residents');
      }
    }
  }, [isAuthenticated, user, isProgramDirector, router, contextLoading]);

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <div className="text-center space-y-3">
          <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full mx-auto" style={{ borderColor: COLORS.dark, borderTopColor: 'transparent' }} />
          <p className="text-slate-500 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const success = await login(email.trim());
      if (success) {
        // Redirect handled by the useEffect above
      }
    } catch {
      setError('Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setIsLoading(true);
    setError('');

    try {
      await login(demoEmail);
    } catch {
      setError('Failed to sign in with demo account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      <VisitorGate page="/progress-check" />

      {/* Hero */}
      <div className="text-center space-y-6 py-8">
        <div className="flex justify-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: '#FDE8E8' }}
          >
            <Heart className="w-6 h-6 text-red-500" />
          </div>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: '#DBEAFE' }}
          >
            <Award className="w-6 h-6 text-blue-500" />
          </div>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: '#D8F3DC' }}
          >
            <Brain className="w-6 h-6" style={{ color: COLORS.dark }} />
          </div>
        </div>

        <h1
          className="text-4xl sm:text-5xl font-bold tracking-tight"
          style={{ color: COLORS.veryDark }}
        >
          Progress Check
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Data-driven resident analytics powered by the EQ·PQ·IQ framework.
          Track development, manage surveys, and run progress check sessions with
          comprehensive insights.
        </p>
      </div>

      {/* Login Card */}
      <div className="max-w-md mx-auto">
        <div
          className="bg-white rounded-2xl shadow-lg p-8 border"
          style={{ borderColor: COLORS.light }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: COLORS.lightest }}
            >
              <Mail className="w-5 h-5" style={{ color: COLORS.dark }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Sign In</h2>
              <p className="text-sm text-slate-500">Enter your institutional email</p>
            </div>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@institution.edu"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
              style={{
                borderColor: COLORS.light,
                '--tw-ring-color': COLORS.mediumLight,
              } as React.CSSProperties}
              required
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full py-3 text-white font-medium rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: COLORS.dark }}
            >
              {isLoading ? (
                <span className="animate-pulse">Signing in...</span>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Demo Accounts */}
      <div className="max-w-2xl mx-auto">
        <h3 className="text-center text-sm font-medium text-slate-500 mb-4">
          Or try a demo account
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {DEMO_ACCOUNTS.map((demo) => {
            const Icon = demo.icon;
            return (
              <button
                key={demo.role}
                onClick={() => handleDemoLogin(demo.email)}
                disabled={isLoading}
                className="p-4 rounded-xl border bg-white hover:shadow-md transition-all text-left disabled:opacity-50"
                style={{ borderColor: COLORS.light }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4" style={{ color: COLORS.dark }} />
                  <span className="text-sm font-medium" style={{ color: COLORS.darker }}>
                    {demo.role}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{demo.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-8">
        <h2
          className="text-2xl font-bold text-center mb-8"
          style={{ color: COLORS.veryDark }}
        >
          What You Can Do
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="p-6 rounded-xl border bg-white"
                style={{ borderColor: COLORS.light }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: COLORS.lightest }}
                >
                  <Icon className="w-5 h-5" style={{ color: COLORS.dark }} />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
