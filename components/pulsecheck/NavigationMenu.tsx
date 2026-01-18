'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, FileText, Settings, Menu, X, Activity, BarChart3 } from 'lucide-react';
import { useState, useEffect } from 'react';
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

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
  requiresAuth?: boolean;
  roles?: string[];
}

export default function PulseCheckNavigationMenu() {
  const pathname = usePathname();
  const { isAuthenticated, user, isMedicalDirector, isRegionalDirector, isAdminAssistant } = usePulseCheckUserContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when screen becomes large
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const handleResize = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        setIsMobileMenuOpen(false);
      }
    };
    handleResize(mediaQuery);
    mediaQuery.addEventListener('change', handleResize);
    return () => mediaQuery.removeEventListener('change', handleResize);
  }, []);

  const emailParam = user?.email ? `?email=${encodeURIComponent(user.email)}` : '';

  // Define navigation links based on role
  const getNavLinks = (): NavLink[] => {
    const links: NavLink[] = [];

    if (!isAuthenticated) {
      return links;
    }

    // Dashboard - available to all authenticated users
    links.push({
      href: `/pulsecheck/dashboard${emailParam}`,
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      requiresAuth: true,
    });

    // Providers - for Medical Directors
    if (isMedicalDirector) {
      links.push({
        href: `/pulsecheck/providers${emailParam}`,
        label: 'My Providers',
        icon: <Users className="w-4 h-4" />,
        requiresAuth: true,
      });
      links.push({
        href: `/pulsecheck/rate${emailParam}`,
        label: 'Rate',
        icon: <Activity className="w-4 h-4" />,
        requiresAuth: true,
      });
    }

    // Reports - for Regional Directors and Admin Assistants
    if (isRegionalDirector || isAdminAssistant) {
      links.push({
        href: `/pulsecheck/reports${emailParam}`,
        label: 'Reports',
        icon: <BarChart3 className="w-4 h-4" />,
        requiresAuth: true,
      });
    }

    // Admin - for Admin Assistants only
    if (isAdminAssistant) {
      links.push({
        href: `/pulsecheck/admin${emailParam}`,
        label: 'Admin',
        icon: <Settings className="w-4 h-4" />,
        requiresAuth: true,
      });
    }

    return links;
  };

  const navLinks = getNavLinks();

  if (navLinks.length === 0) {
    return null;
  }

  const isActive = (href: string) => {
    const basePath = href.split('?')[0];
    return pathname === basePath || pathname.startsWith(basePath + '/');
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-1">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive(link.href)
                ? 'text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            style={isActive(link.href) ? { backgroundColor: COLORS.dark } : {}}
            onMouseOver={(e) => {
              if (!isActive(link.href)) {
                e.currentTarget.style.backgroundColor = COLORS.lightest;
              }
            }}
            onMouseOut={(e) => {
              if (!isActive(link.href)) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {link.icon}
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Navigation Dropdown */}
      {isMobileMenuOpen && (
        <div 
          className="absolute top-16 left-0 right-0 bg-white border-b shadow-lg md:hidden z-50"
          style={{ borderColor: COLORS.light }}
        >
          <nav className="flex flex-col p-4 gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-white'
                    : 'text-slate-600'
                }`}
                style={isActive(link.href) ? { backgroundColor: COLORS.dark } : { backgroundColor: COLORS.lightest }}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
