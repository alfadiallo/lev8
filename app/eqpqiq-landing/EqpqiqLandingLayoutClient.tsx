'use client';

import { ReactNode } from 'react';
import Link from 'next/link';

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

interface EqpqiqLandingLayoutClientProps {
  children: ReactNode;
}

export default function EqpqiqLandingLayoutClient({ children }: EqpqiqLandingLayoutClientProps) {
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
            <Link href="/" className="flex items-center gap-3">
              <div className="text-2xl font-bold" style={{ color: COLORS.darker }}>
                EQ·PQ·IQ
              </div>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-6">
              <Link
                href="/interview"
                className="text-sm font-medium transition-colors hover:underline underline-offset-4"
                style={{ color: COLORS.dark }}
              >
                Interview
              </Link>
              <Link
                href="/pulsecheck"
                className="text-sm font-medium transition-colors hover:underline underline-offset-4"
                style={{ color: COLORS.dark }}
              >
                Pulse Check
              </Link>
              <a
                href="mailto:hello@eqpqiq.com"
                className="text-sm font-medium transition-colors hover:underline underline-offset-4"
                style={{ color: COLORS.dark }}
              >
                Contact Us
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t mt-auto" style={{ borderColor: COLORS.light }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              <div className="text-lg font-bold mb-2" style={{ color: COLORS.darker }}>
                EQ·PQ·IQ
              </div>
              <p className="text-sm text-slate-500">
                Measure What Matters. Comprehensive evaluation across Emotional, Professional, and
                Intellectual dimensions.
              </p>
            </div>

            {/* Products */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Products</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>
                  <Link href="/interview" className="hover:underline" style={{ color: COLORS.dark }}>
                    Interview Assessment
                  </Link>
                </li>
                <li>
                  <Link href="/pulsecheck" className="hover:underline" style={{ color: COLORS.dark }}>
                    Pulse Check
                  </Link>
                </li>
                <li>
                  <a
                    href="https://lev8.ai"
                    className="hover:underline"
                    style={{ color: COLORS.dark }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Elevate Platform
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Contact</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>
                  <a
                    href="mailto:hello@eqpqiq.com"
                    className="hover:underline"
                    style={{ color: COLORS.dark }}
                  >
                    hello@eqpqiq.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
            <div>&copy; {new Date().getFullYear()} EQ·PQ·IQ</div>
            <div className="flex gap-6">
              <a href="#" className="transition-colors" style={{ color: COLORS.dark }}>
                Privacy
              </a>
              <a href="#" className="transition-colors" style={{ color: COLORS.dark }}>
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
