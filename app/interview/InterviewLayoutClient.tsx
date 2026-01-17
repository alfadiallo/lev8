'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import NavigationMenu from '@/components/interview/NavigationMenu';
import UserDropdown from '@/components/interview/UserDropdown';
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

interface InterviewLayoutClientProps {
  children: ReactNode;
}

export default function InterviewLayoutClient({ children }: InterviewLayoutClientProps) {
  const { isAuthenticated, user } = useInterviewUserContext();
  
  // Build home href with email if authenticated
  const homeHref = user?.email 
    ? `/interview?email=${encodeURIComponent(user.email)}`
    : '/interview';

  return (
    <div 
      className="min-h-screen"
      style={{ background: `linear-gradient(to bottom right, ${COLORS.lightest}40, white)` }}
    >
      {/* Header */}
      <header 
        className="border-b bg-white/90 backdrop-blur-sm sticky top-0 z-50"
        style={{ borderColor: COLORS.light }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href={homeHref} className="flex items-center gap-3">
              <div 
                className="text-2xl font-bold"
                style={{ color: COLORS.darker }}
              >
                EQ·PQ·IQ
              </div>
              <span className="hidden sm:inline" style={{ color: COLORS.medium }}>|</span>
              <span className="hidden sm:inline text-sm" style={{ color: COLORS.dark }}>
                Interview Assessment Tool
              </span>
            </Link>
            
            {/* Navigation + User */}
            <div className="flex items-center gap-2">
              <NavigationMenu />
              {isAuthenticated ? (
                <UserDropdown />
              ) : (
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Powered by <span className="font-medium" style={{ color: COLORS.darker }}>lev8.ai</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer 
        className="border-t mt-auto"
        style={{ borderColor: COLORS.light }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400">
            <div>
              &copy; {new Date().getFullYear()} eqpqiq.com - A lev8.ai Product
            </div>
            <div className="flex gap-6">
              <a 
                href="#" 
                className="transition-colors"
                style={{ color: COLORS.dark }}
                onMouseOver={(e) => e.currentTarget.style.color = COLORS.darker}
                onMouseOut={(e) => e.currentTarget.style.color = COLORS.dark}
              >
                Privacy
              </a>
              <a 
                href="#" 
                className="transition-colors"
                style={{ color: COLORS.dark }}
                onMouseOver={(e) => e.currentTarget.style.color = COLORS.darker}
                onMouseOut={(e) => e.currentTarget.style.color = COLORS.dark}
              >
                Terms
              </a>
              <a 
                href="https://lev8.ai" 
                className="transition-colors"
                style={{ color: COLORS.dark }}
                onMouseOver={(e) => e.currentTarget.style.color = COLORS.darker}
                onMouseOut={(e) => e.currentTarget.style.color = COLORS.dark}
              >
                About
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
