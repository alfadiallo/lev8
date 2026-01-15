'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Calendar, Mail } from 'lucide-react';

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

export default function CreateSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [sessionName, setSessionName] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/interview/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_name: sessionName,
          session_date: sessionDate,
          creator_email: email,
          session_type: 'individual',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create session');
      }

      const data = await response.json();
      router.push(`/interview/session/${data.id}?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <button
        onClick={() => router.push('/interview')}
        className="text-sm text-slate-500 hover:text-slate-700 mb-6 flex items-center gap-1"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </button>

      <div 
        className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm border"
        style={{ borderColor: COLORS.light }}
      >
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Create New Session
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Set up a new interview session to start rating candidates.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Your Email
            </label>
            <div className="relative">
              <Mail 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" 
                style={{ color: COLORS.medium }}
              />
              <input
                id="email"
                type="email"
                value={email}
                disabled
                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-slate-50 text-slate-500"
                style={{ borderColor: COLORS.light }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="sessionName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Session Name
            </label>
            <input
              id="sessionName"
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="e.g., October 15 Interview Day"
              required
              className="w-full px-4 py-2 border rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:border-transparent"
              style={{ borderColor: COLORS.light }}
            />
          </div>

          <div>
            <label htmlFor="sessionDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Interview Date
            </label>
            <div className="relative">
              <Calendar 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" 
                style={{ color: COLORS.medium }}
              />
              <input
                id="sessionDate"
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white text-slate-900 focus:ring-2 focus:border-transparent"
                style={{ borderColor: COLORS.light }}
              />
            </div>
          </div>

          {error && (
            <div 
              className="p-3 border rounded-lg"
              style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA' }}
            >
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            style={{ backgroundColor: COLORS.dark }}
          >
            {isLoading ? 'Creating...' : 'Create Session'}
          </button>
        </form>
      </div>
    </div>
  );
}
