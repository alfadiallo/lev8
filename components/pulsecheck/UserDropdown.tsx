'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, ChevronDown, Building2, Briefcase } from 'lucide-react';
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

const ROLE_LABELS: Record<string, string> = {
  regional_director: 'Regional Director',
  medical_director: 'Medical Director',
  associate_medical_director: 'Associate Medical Director',
  assistant_medical_director: 'Assistant Medical Director',
  admin_assistant: 'Admin Assistant',
  guest: 'Guest',
};

export default function PulseCheckUserDropdown() {
  const router = useRouter();
  const { user, logout } = usePulseCheckUserContext();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    console.log('[PulseCheckUserDropdown] Sign out clicked');
    logout();
    setIsOpen(false);
    router.push('/pulsecheck');
  };

  if (!user) return null;

  const displayName = user.name || user.email;
  const roleLabel = ROLE_LABELS[user.role] || 'User';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        style={{ backgroundColor: COLORS.lightest, color: COLORS.darker }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = COLORS.light}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = COLORS.lightest}
      >
        <div 
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium"
          style={{ backgroundColor: COLORS.dark }}
        >
          {displayName.charAt(0).toUpperCase()}
        </div>
        <span className="hidden sm:inline max-w-[150px] truncate">
          {displayName}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border py-2 z-50"
          style={{ borderColor: COLORS.light }}
        >
          {/* User Info */}
          <div className="px-4 py-3 border-b" style={{ borderColor: COLORS.lightest }}>
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                style={{ backgroundColor: COLORS.dark }}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">
                  {user.name || 'User'}
                </p>
                <p className="text-sm text-slate-500 truncate">
                  {user.email}
                </p>
              </div>
            </div>
            
            {/* Role Badge */}
            <div className="mt-3 flex items-center gap-2">
              <span 
                className="px-2 py-1 text-xs font-medium rounded-full"
                style={{ backgroundColor: COLORS.lightest, color: COLORS.darker }}
              >
                {roleLabel}
              </span>
            </div>

            {/* Organization Info */}
            {(user.healthsystemName || user.siteName || user.departmentName) && (
              <div className="mt-3 space-y-1 text-sm text-slate-600">
                {/* For Regional Directors and Admin Assistants: show healthsystem */}
                {user.healthsystemName && (user.role === 'regional_director' || user.role === 'admin_assistant') ? (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span>{user.healthsystemName}</span>
                  </div>
                ) : (
                  <>
                    {user.siteName && (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span>{user.siteName}</span>
                      </div>
                    )}
                    {user.departmentName && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-slate-400" />
                        <span>{user.departmentName}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
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
