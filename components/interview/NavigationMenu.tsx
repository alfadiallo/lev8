'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, Calendar, Trophy, BarChart3, Home, Menu, X 
} from 'lucide-react';
import { useState, useEffect } from 'react';
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

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  requiresPD: boolean;
  requiresAuth: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Home',
    href: '/interview',
    icon: <Home className="w-4 h-4" />,
    requiresPD: false,
    requiresAuth: false,
  },
  {
    label: 'Dashboard',
    href: '/interview/dashboard',
    icon: <LayoutDashboard className="w-4 h-4" />,
    requiresPD: false,
    requiresAuth: true,
  },
  {
    label: 'Interview Dates',
    href: '/interview/sessions',
    icon: <Calendar className="w-4 h-4" />,
    requiresPD: false,
    requiresAuth: true,
  },
  {
    label: 'Rank List',
    href: '/interview/season',
    icon: <Trophy className="w-4 h-4" />,
    requiresPD: true,
    requiresAuth: true,
  },
  {
    label: 'Interviewer Stats',
    href: '/interview/stats',
    icon: <BarChart3 className="w-4 h-4" />,
    requiresPD: true,
    requiresAuth: true,
  },
];

export default function NavigationMenu() {
  const pathname = usePathname();
  const { isAuthenticated, isProgramDirector, user } = useInterviewUserContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when screen becomes large
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const handleResize = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        setIsMobileMenuOpen(false);
      }
    };
    
    // Initial check
    handleResize(mediaQuery);
    
    mediaQuery.addEventListener('change', handleResize);
    return () => mediaQuery.removeEventListener('change', handleResize);
  }, []);

  // Filter nav items based on user permissions
  const visibleItems = NAV_ITEMS.filter(item => {
    if (item.requiresAuth && !isAuthenticated) return false;
    if (item.requiresPD && !isProgramDirector) return false;
    return true;
  });

  // Build href with email if authenticated
  const getHref = (baseHref: string) => {
    if (user?.email) {
      return `${baseHref}?email=${encodeURIComponent(user.email)}`;
    }
    return baseHref;
  };

  // Check if a nav item is active
  const isActive = (href: string) => {
    if (href === '/interview') {
      return pathname === '/interview';
    }
    return pathname.startsWith(href);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-1">
        {visibleItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={getHref(item.href)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                transition-colors relative
              `}
              style={{
                color: active ? COLORS.darker : COLORS.dark,
                backgroundColor: active ? COLORS.lightest : 'transparent',
              }}
              onMouseOver={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = COLORS.lightest + '80';
                }
              }}
              onMouseOut={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {item.icon}
              {item.label}
              {active && (
                <span 
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                  style={{ backgroundColor: COLORS.dark }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden p-2 rounded-lg"
        style={{ color: COLORS.dark }}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Navigation Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-50 bg-black/20"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            className="absolute top-16 left-0 right-0 bg-white border-b shadow-lg p-4"
            style={{ borderColor: COLORS.light }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-1">
              {visibleItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={getHref(item.href)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium"
                    style={{
                      color: active ? COLORS.darker : COLORS.dark,
                      backgroundColor: active ? COLORS.lightest : 'transparent',
                    }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
