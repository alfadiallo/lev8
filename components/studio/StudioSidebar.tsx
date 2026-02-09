'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  ChevronRight, 
  ChevronDown,
  Settings,
  User
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface StudioCreatorProfile {
  id: string;
  display_name?: string;
  status: string;
  content_count: number;
}

interface NavItem {
  name: string;
  href?: string;
  children?: { name: string; href: string }[];
}

const NAVIGATION: NavItem[] = [
  { 
    name: 'Dashboard',
    href: '/studio',
  },
  { 
    name: 'Content',
    children: [
      { name: 'Running Board Cases', href: '/studio/content/running-board' },
      { name: 'Clinical Cases', href: '/studio/content/clinical-cases' },
      { name: 'Conversations', href: '/studio/content/conversations' },
      { name: 'EKG Scenarios', href: '/studio/content/ekg-scenarios' },
    ]
  },
  { 
    name: 'Resources',
    children: [
      { name: '18 Month Curriculum', href: '/studio/resources/curriculum' },
    ]
  },
];

export default function StudioSidebar({ creatorProfile, specialty = 'Emergency Medicine' }: { creatorProfile: StudioCreatorProfile | null; specialty?: string }) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [expandedModules, setExpandedModules] = useState<string[]>(['content']);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const expanded = new Set(['content']);
    if (pathname?.includes('/studio/content')) {
      expanded.add('content');
    }
    setExpandedModules(Array.from(expanded));
  }, [pathname]);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    logout().catch(console.error);
    setTimeout(() => {
      window.location.href = '/login';
    }, 500);
  };

  const toggleModule = (module: string) => {
    setExpandedModules(prev => {
      if (prev.includes(module)) {
        return prev.filter(m => m !== module);
      }
      return [...prev, module];
    });
  };

  const isExpanded = (module: string) => expandedModules.includes(module.toLowerCase());
  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');
  const isChildActive = (item: NavItem) => {
    if (!item.children) return false;
    return item.children.some(child => pathname === child.href || pathname?.startsWith(child.href + '/'));
  };

  return (
    <aside 
      className="w-64 flex flex-col"
      style={{
        background: 'var(--theme-surface-solid)',
        borderRight: '1px solid var(--theme-border-solid)',
        minHeight: '100vh',
      }}
    >
      {/* Header */}
      <div 
        className="flex h-16 items-center px-6"
        style={{ borderBottom: '1px solid var(--theme-border-solid)' }}
      >
        <div className="mr-3 flex items-center justify-center">
          <Image 
            src="/logo-small.png" 
            alt="Logo" 
            width={32}
            height={32}
            className="h-8 w-auto rounded-lg shadow-sm"
          />
        </div>
        <div>
          <span 
            className="text-xl font-bold tracking-tight logo-gradient"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
          >
            Elevate Studio
          </span>
          <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            {specialty}
          </p>
        </div>
      </div>

      {/* Creator Profile Badge */}
      {creatorProfile && (
        <div 
          className="mx-3 mt-3 p-3 rounded-xl"
          style={{ background: 'var(--theme-surface-hover)' }}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--theme-primary)' }}>
              <User size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--theme-text)' }}>
                {creatorProfile.display_name || user?.email}
              </p>
              <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                {creatorProfile.content_count} {creatorProfile.content_count === 1 ? 'item' : 'items'} created
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAVIGATION.map((item) => {
          const hasChildren = !!item.children;
          const expanded = hasChildren && isExpanded(item.name);
          const active = item.href ? isActive(item.href) : isChildActive(item);
          
          return (
            <div key={item.name}>
              {item.href ? (
                <Link
                  href={item.href}
                  className="flex items-center px-3 py-2.5 rounded-xl transition-all duration-200"
                  style={{
                    color: 'var(--theme-text)',
                  }}
                >
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => toggleModule(item.name.toLowerCase())}
                  className="flex items-center justify-between w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200"
                  style={{
                    color: 'var(--theme-text)',
                  }}
                >
                  <span className="text-sm font-medium">{item.name}</span>
                  {expanded ? (
                    <ChevronDown size={16} style={{ color: 'var(--theme-text-muted)' }} />
                  ) : (
                    <ChevronRight size={16} style={{ color: 'var(--theme-text-muted)' }} />
                  )}
                </button>
              )}
              
              {/* Children */}
              {hasChildren && expanded && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.children!.map((child) => {
                    const childActive = isActive(child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block text-sm px-3 py-1.5 transition-all duration-200"
                        style={{
                          color: childActive ? 'var(--theme-primary)' : 'var(--theme-text-muted)',
                          fontWeight: childActive ? 600 : 400,
                        }}
                      >
                        {child.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div 
        className="p-4"
        style={{ borderTop: '1px solid var(--theme-border-solid)' }}
      >
        <div className="px-3 py-2 mb-2">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--theme-text)' }}>
            {user?.email}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            Studio Creator
          </p>
        </div>

        <div className="space-y-1">
          <Link 
            href="/studio/settings" 
            className="flex items-center gap-2 px-3 py-2 rounded-xl transition-colors"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            <Settings size={16} />
            <span className="text-sm">Settings</span>
          </Link>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-colors hover:text-red-500 hover:bg-red-50 disabled:opacity-50"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            <span className="text-sm">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
