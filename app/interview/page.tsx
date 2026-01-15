'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Award, Brain, Plus, Users, ArrowLeft } from 'lucide-react';

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

export default function InterviewLandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'landing' | 'create' | 'join'>('landing');
  const [sessionCode, setSessionCode] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Proceed directly based on mode - email check happens on create page
      if (mode === 'create') {
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

      {/* Action Section */}
      <div 
        className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm border max-w-xl mx-auto w-full"
        style={{ borderColor: COLORS.light }}
      >
        {mode === 'landing' ? (
          <>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 text-center">
              Get Started
            </h2>
            <div className="space-y-4">
              <button
                onClick={() => setMode('create')}
                className="w-full py-3 px-4 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                style={{ backgroundColor: COLORS.dark }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = COLORS.darker}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = COLORS.dark}
              >
                <Plus className="w-5 h-5" />
                Create New Session
              </button>
              <button
                onClick={() => setMode('join')}
                className="w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                style={{ backgroundColor: COLORS.lightest, color: COLORS.darker }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = COLORS.light}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = COLORS.lightest}
              >
                <Users className="w-5 h-5" />
                Join Existing Session
              </button>
            </div>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
              Already have a lev8.ai account?{' '}
              <a 
                href="/login" 
                className="font-medium hover:underline"
                style={{ color: COLORS.dark }}
              >
                Sign in
              </a>
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
              {mode === 'create' ? 'Create New Session' : 'Join Session'}
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
                {isLoading ? 'Loading...' : mode === 'create' ? 'Create Session' : 'Join Session'}
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
    </div>
  );
}
