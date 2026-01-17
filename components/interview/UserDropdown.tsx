'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, LogOut, User, Shield, Users } from 'lucide-react';
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

function getRoleBadge(permission: string) {
  switch (permission) {
    case 'admin':
      return { label: 'Admin', bg: COLORS.darker, icon: <Shield className="w-3 h-3" /> };
    case 'program_director':
      return { label: 'PD', bg: COLORS.dark, icon: <Shield className="w-3 h-3" /> };
    case 'faculty':
      return { label: 'Faculty', bg: COLORS.medium, icon: <Users className="w-3 h-3" /> };
    default:
      return { label: 'Guest', bg: '#94A3B8', icon: <User className="w-3 h-3" /> };
  }
}

export default function UserDropdown() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useInterviewUserContext();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated || !user) {
    return null;
  }

  const roleBadge = getRoleBadge(user.permission);
  const displayName = user.name || user.email.split('@')[0];
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleSignOut = () => {
    console.log('[UserDropdown] Sign out clicked');
    logout();
    setIsOpen(false);
    // Explicitly push to home without params
    router.push('/interview');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
        style={{ backgroundColor: isOpen ? COLORS.lightest : 'transparent' }}
        onMouseOver={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = COLORS.lightest + '80';
          }
        }}
        onMouseOut={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        {/* Avatar */}
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
          style={{ backgroundColor: COLORS.dark }}
        >
          {initials}
        </div>
        
        {/* Name and Role (hidden on mobile) */}
        <div className="hidden sm:flex flex-col items-start">
          <span className="text-sm font-medium text-slate-900 leading-tight">
            {displayName}
          </span>
          <span 
            className="text-xs leading-tight flex items-center gap-1"
            style={{ color: COLORS.dark }}
          >
            {roleBadge.icon}
            {roleBadge.label}
          </span>
        </div>
        
        <ChevronDown 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: COLORS.dark }}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border py-2 z-50"
          style={{ borderColor: COLORS.light }}
        >
          {/* User Info */}
          <div className="px-4 py-3 border-b" style={{ borderColor: COLORS.lightest }}>
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                style={{ backgroundColor: COLORS.dark }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {user.name || 'Guest User'}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user.email}
                </p>
              </div>
            </div>
            {/* Role Badge */}
            <div className="mt-3 flex items-center gap-2">
              <span 
                className="px-2 py-1 rounded-full text-xs font-medium text-white flex items-center gap-1"
                style={{ backgroundColor: roleBadge.bg }}
              >
                {roleBadge.icon}
                {roleBadge.label}
              </span>
              {user.institutionName && (
                <span className="text-xs text-slate-500">
                  {user.institutionName}
                </span>
              )}
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
