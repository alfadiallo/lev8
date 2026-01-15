'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';

export default function JoinSessionPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const code = params.code as string;
  const email = searchParams.get('email') || '';
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function findAndJoinSession() {
      if (!code || !email) {
        setError('Missing session code or email');
        setIsLoading(false);
        return;
      }

      try {
        // Look up session by share_token
        const response = await fetch(`/api/interview/sessions/join?code=${encodeURIComponent(code)}&email=${encodeURIComponent(email)}`);
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Session not found');
        }

        const data = await response.json();
        
        // Redirect to the session page
        router.replace(`/interview/session/${data.sessionId}?email=${encodeURIComponent(email)}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to join session');
        setIsLoading(false);
      }
    }

    findAndJoinSession();
  }, [code, email, router]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Joining session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">!</div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Could not join session
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/interview')}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return null;
}
