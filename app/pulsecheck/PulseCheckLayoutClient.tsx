'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import PulseCheckNavigationMenu from '@/components/pulsecheck/NavigationMenu';
import PulseCheckUserDropdown from '@/components/pulsecheck/UserDropdown';
import { usePulseCheckUserContext } from '@/context/PulseCheckUserContext';

// Blue/Purple color palette for Pulse Check (distinct from Interview green)
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

interface PulseCheckLayoutClientProps {
  children: ReactNode;
}

export default function PulseCheckLayoutClient({ children }: PulseCheckLayoutClientProps) {
  const { isAuthenticated, user } = usePulseCheckUserContext();
  
  // Build home href with email if authenticated
  const homeHref = user?.email 
    ? `/pulsecheck?email=${encodeURIComponent(user.email)}`
    : '/pulsecheck';

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
                Pulse Check
              </div>
              <span className="hidden sm:inline" style={{ color: COLORS.medium }}>|</span>
              <span className="hidden sm:inline text-sm" style={{ color: COLORS.dark }}>
                Provider Performance Evaluation
              </span>
            </Link>
            
            {/* Navigation + User */}
            <div className="flex items-center gap-2">
              <PulseCheckNavigationMenu />
              {isAuthenticated && (
                <PulseCheckUserDropdown />
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
              &copy; {new Date().getFullYear()} EQ·PQ·IQ
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
                href="#" 
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
