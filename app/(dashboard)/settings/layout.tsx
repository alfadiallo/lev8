'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { User, Building2, Shield } from 'lucide-react';

interface TabItem {
  label: string;
  href: string;
  icon: ReactNode;
  rolesAllowed?: string[];
}

export default function SettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();

  const tabs: TabItem[] = [
    {
      label: 'Account',
      href: '/settings/account',
      icon: <User size={18} />,
      rolesAllowed: ['resident', 'faculty', 'program_director', 'super_admin'],
    },
    {
      label: 'Program',
      href: '/settings/program',
      icon: <Building2 size={18} />,
      rolesAllowed: ['program_director', 'super_admin'],
    },
    {
      label: 'Devices',
      href: '/settings/devices',
      icon: <Shield size={18} />,
      rolesAllowed: ['resident', 'faculty', 'program_director', 'super_admin'],
    },
  ];

  // For testing purposes, create a mock user if auth is disabled
  const mockUser = {
    role: 'resident'
  };

  const displayUser = user || mockUser;

  // Filter tabs based on user role
  const visibleTabs = tabs.filter(tab => 
    !tab.rolesAllowed || tab.rolesAllowed.includes(displayUser?.role || '')
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#0EA5E9] to-[#4A90A8] bg-clip-text text-transparent" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>Settings</h1>
        <p className="text-neutral-600 mt-2">
          Manage your account, preferences, and security settings
        </p>
      </header>

      {/* Tab Navigation */}
      <nav className="border-b border-white/30 mb-8">
        <div className="flex space-x-8">
          {visibleTabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`
                  flex items-center space-x-2 pb-4 px-1 border-b-2 transition-colors
                  ${isActive 
                    ? 'border-[#7EC8E3] text-[#7EC8E3]' 
                    : 'border-transparent text-neutral-600 hover:text-[#7EC8E3] hover:border-white/20'
                  }
                `}
              >
                {tab.icon}
                <span className="font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Content Area - Transparent like main page tiles */}
      <main 
        className="rounded-2xl shadow-md border border-white/40 p-8"
        style={{
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(10px) saturate(150%)',
          WebkitBackdropFilter: 'blur(10px) saturate(150%)',
        }}
      >
        {children}
      </main>
    </div>
  );
}

