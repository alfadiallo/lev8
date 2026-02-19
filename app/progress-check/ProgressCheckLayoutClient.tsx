'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useProgressCheckUserContext } from '@/context/ProgressCheckUserContext';
import { Users, BarChart3, ClipboardCheck, Settings, LogOut, ChevronRight } from 'lucide-react';

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

interface ProgressCheckLayoutClientProps {
  children: ReactNode;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PERMISSION_LABELS: Record<string, string> = {
  program_director: 'Program Director',
  faculty: 'Core Faculty',
  resident: 'Resident',
  admin: 'Admin',
  guest: 'Guest',
};

/** Resolves UUIDs to human-readable names in the breadcrumb. */
function BreadcrumbNav({ pathname, homeHref }: { pathname: string; homeHref: string }) {
  const segments = pathname.split('/').filter(Boolean).slice(1); // skip 'progress-check'
  const [resolvedNames, setResolvedNames] = useState<Record<string, string>>({});

  const readNames = () => {
    const names: Record<string, string> = {};
    segments.forEach((seg, idx) => {
      if (UUID_RE.test(seg)) {
        const prev = segments[idx - 1];
        const stored =
          prev === 'surveys'
            ? sessionStorage.getItem(`progress-check-survey-title-${seg}`)
            : sessionStorage.getItem(`progress-check-resident-name-${seg}`);
        if (stored) names[seg] = stored;
      }
    });
    setResolvedNames(names);
  };

  // Read on mount / pathname change
  useEffect(() => {
    readNames();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for name updates from detail pages
  useEffect(() => {
    const handler = () => readNames();
    window.addEventListener('progress-check-breadcrumb-update', handler);
    return () => window.removeEventListener('progress-check-breadcrumb-update', handler);
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatSegment = (segment: string): string => {
    if (resolvedNames[segment]) return resolvedNames[segment];
    return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
  };

  // Build links for intermediate breadcrumb segments
  const buildHref = (idx: number): string => {
    return '/progress-check/' + segments.slice(0, idx + 1).join('/');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      <nav className="flex items-center gap-1 text-sm text-slate-500">
        <Link href={homeHref} className="hover:text-slate-700 transition-colors">
          Progress Check
        </Link>
        {segments.map((segment, idx) => {
          const isLast = idx === segments.length - 1;
          return (
            <span key={`${segment}-${idx}`} className="flex items-center gap-1">
              <ChevronRight className="w-3.5 h-3.5" />
              {isLast ? (
                <span className="text-slate-700 font-medium">
                  {formatSegment(segment)}
                </span>
              ) : (
                <Link
                  href={buildHref(idx)}
                  className="hover:text-slate-700 transition-colors"
                >
                  {formatSegment(segment)}
                </Link>
              )}
            </span>
          );
        })}
      </nav>
    </div>
  );
}

export default function ProgressCheckLayoutClient({ children }: ProgressCheckLayoutClientProps) {
  const { isAuthenticated, user, logout, can } = useProgressCheckUserContext();
  const pathname = usePathname();

  const homeHref =
    isAuthenticated
      ? '/progress-check/dashboard'
      : user?.email
        ? `/progress-check?email=${encodeURIComponent(user.email)}`
        : '/progress-check';

  const navItems = [
    {
      href: '/progress-check/dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      show: can('canViewAnalytics'),
    },
    {
      href: '/progress-check/residents',
      label: user?.programSpecialty || 'Residents',
      icon: Users,
      show: can('canViewResidents'),
    },
    {
      href: '/progress-check/surveys',
      label: 'Surveys',
      icon: ClipboardCheck,
      show: can('canManageSurveys'),
    },
    {
      href: '/progress-check/settings',
      label: 'Settings',
      icon: Settings,
      show: can('canManageSurveys'),
    },
  ].filter((item) => item.show);

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
            {/* Logo + Program */}
            <Link href={homeHref} className="flex items-center gap-3 min-w-0">
              <div
                className="text-2xl font-bold shrink-0"
                style={{ color: COLORS.darker }}
              >
                EQ·PQ·IQ
              </div>
              <span className="hidden sm:inline shrink-0" style={{ color: COLORS.medium }}>|</span>
              <div className="hidden sm:flex flex-col min-w-0">
                <span className="text-sm font-medium truncate" style={{ color: COLORS.dark }}>
                  Progress Check
                </span>
                {isAuthenticated && (user?.institutionName || user?.programName) && (
                  <span className="text-xs truncate" style={{ color: COLORS.medium }}>
                    {[user.institutionName, user.programName].filter(Boolean).join(' · ')}
                  </span>
                )}
              </div>
            </Link>

            {/* Navigation + User */}
            <div className="flex items-center gap-2">
              {isAuthenticated && navItems.length > 0 && (
                <nav className="hidden md:flex items-center gap-1">
                  {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? 'font-medium'
                            : 'hover:bg-green-50'
                        }`}
                        style={{
                          color: isActive ? COLORS.darker : COLORS.dark,
                          backgroundColor: isActive ? COLORS.lightest : undefined,
                        }}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              )}

              {isAuthenticated ? (
                <div className="flex items-center gap-3 ml-3">
                  <div className="hidden sm:flex flex-col items-end text-right min-w-0">
                    <span className="text-sm font-medium text-slate-800 truncate max-w-[180px]">
                      {user?.name || user?.email}
                    </span>
                    <span className="text-xs text-slate-500 truncate max-w-[180px]" title={user?.email ?? undefined}>
                      {user?.email}
                    </span>
                    {user?.permission && (
                      <span className="text-xs text-slate-500">
                        {PERMISSION_LABELS[user.permission] ?? user.permission}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={logout}
                    className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors shrink-0"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="text-sm text-slate-500">
                  Powered by{' '}
                  <span className="font-medium" style={{ color: COLORS.darker }}>
                    lev8.ai
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      {isAuthenticated && navItems.length > 0 && (
        <div
          className="md:hidden border-b bg-white/80 backdrop-blur-sm"
          style={{ borderColor: COLORS.light }}
        >
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-1 py-2 overflow-x-auto">
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                      isActive ? 'font-medium' : ''
                    }`}
                    style={{
                      color: isActive ? COLORS.darker : COLORS.dark,
                      backgroundColor: isActive ? COLORS.lightest : undefined,
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      {isAuthenticated && pathname !== '/progress-check' && (
        <BreadcrumbNav pathname={pathname} homeHref={homeHref} />
      )}

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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <div>&copy; {new Date().getFullYear()} EQ·PQ·IQ</div>
            <div className="flex gap-6">
              <a href="#" style={{ color: COLORS.dark }} className="transition-colors hover:opacity-80">
                Privacy
              </a>
              <a href="#" style={{ color: COLORS.dark }} className="transition-colors hover:opacity-80">
                Terms
              </a>
              <a href="mailto:hello@eqpqiq.com" style={{ color: COLORS.dark }} className="transition-colors hover:opacity-80">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
