'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import InterviewDashboard from '@/components/interview/InterviewDashboard';
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

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, isAuthenticated, login } = useInterviewUserContext();

  // If email is in URL and not logged in, log in
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam && !isAuthenticated && !isLoading) {
      login(emailParam);
    }
  }, [searchParams, isAuthenticated, isLoading, login]);

  // Redirect to home if not authenticated after loading
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const emailParam = searchParams.get('email');
      if (!emailParam) {
        router.push('/interview');
      }
    }
  }, [isLoading, isAuthenticated, router, searchParams]);

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

  if (!user) {
    return (
      <div className="max-w-xl mx-auto">
        <div 
          className="border rounded-xl p-6 text-center"
          style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA' }}
        >
          <p className="text-red-600">Please sign in to access the dashboard</p>
          <button
            onClick={() => router.push('/interview')}
            className="mt-4 font-medium"
            style={{ color: COLORS.dark }}
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <InterviewDashboard
      userEmail={user.email}
      userName={user.name}
      institutionName={user.institutionName}
      programName={user.programName}
      permission={user.permission}
      onBack={() => router.push('/interview')}
    />
  );
}
