'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTenant, useTenantUrl } from '@/context/TenantContext';
import { usePermissions } from '@/lib/hooks/usePermissions';
import {
  BookOpen,
  MessageSquare,
  TrendingUp,
  FileText,
  ClipboardCheck,
  Activity,
  Clock,
  ArrowRight,
  Sparkles,
  Shield,
  Building2
} from 'lucide-react';

export default function TenantDashboardPage() {
  const { user } = useAuth();
  const { organization, department } = useTenant();
  const { buildUrl } = useTenantUrl();
  const { canAccessAdminPortal, isProgramLeadership, isSuperAdmin, isResident } = usePermissions();
  const [greeting, setGreeting] = useState('Welcome');
  const [dateString, setDateString] = useState('');
  
  const canAccessExpectations = isProgramLeadership || isSuperAdmin;
  
  // Faculty and above can see all modules, residents only see Learn
  const isFacultyOrAbove = !isResident;

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
    
    setDateString(new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    }));
  }, []);

  const baseModules = [
    {
      name: 'Learn',
      description: 'Clinical cases, conversations, simulations',
      icon: BookOpen,
      href: buildUrl('/modules/learn'),
      color: 'from-blue-500 to-cyan-500',
      facultyOnly: false,
      items: [
        { name: 'Clinical Cases', href: buildUrl('/modules/learn/clinical-cases') },
        { name: 'Difficult Conversations', href: buildUrl('/modules/learn/difficult-conversations') },
        { name: 'Running the Board', href: buildUrl('/modules/learn/running-board') },
      ]
    },
    {
      name: 'Reflect',
      description: 'Voice journaling and self-reflection',
      icon: MessageSquare,
      href: buildUrl('/modules/reflect'),
      color: 'from-purple-500 to-pink-500',
      facultyOnly: true,  // Hidden from residents
      items: [
        { name: 'Voice Journal', href: buildUrl('/modules/reflect/voice-journal') },
      ]
    },
    {
      name: 'Understand',
      description: 'Analytics and resident insights',
      icon: TrendingUp,
      href: buildUrl('/modules/understand'),
      color: 'from-emerald-500 to-teal-500',
      facultyOnly: true,  // Hidden from residents
      items: [
        { name: 'Resident Analytics', href: buildUrl('/modules/understand/residents') },
        { name: 'Class Cohort', href: buildUrl('/modules/understand/class') },
      ]
    },
    {
      name: 'Truths',
      description: 'Program documents and resources',
      icon: FileText,
      href: buildUrl('/truths'),
      color: 'from-amber-500 to-orange-500',
      facultyOnly: true,  // Hidden from residents
      items: []
    },
  ];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const modules = useMemo(() => {
    // Filter base modules based on role
    const result = baseModules.filter(module => {
      if (module.facultyOnly) return isFacultyOrAbove;
      return true;
    });
    
    if (canAccessExpectations) {
      result.push({
        name: 'Expectations',
        description: 'ACGME requirements and compliance',
        icon: ClipboardCheck,
        href: buildUrl('/expectations'),
        color: 'from-rose-500 to-red-500',
        facultyOnly: false,
        items: []
      });
    }
    
    if (canAccessAdminPortal) {
      result.push({
        name: 'Admin Portal',
        description: 'User management and access control',
        icon: Shield,
        href: '/admin/dashboard',
        color: 'from-slate-600 to-slate-800',
        facultyOnly: false,
        items: [
          { name: 'Dashboard', href: '/admin/dashboard' },
          { name: 'Access Requests', href: '/admin/requests' },
          { name: 'User Management', href: '/admin/users' },
        ]
      });
    }
    
    return result;
  }, [canAccessExpectations, canAccessAdminPortal, isFacultyOrAbove, buildUrl]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 
            className="text-3xl font-bold flex items-center gap-3"
            style={{ color: 'var(--theme-text)' }}
          >
            {greeting}, {user?.firstName || 'there'}
            <Sparkles className="w-7 h-7 text-amber-400" />
          </h1>
          <p style={{ color: 'var(--theme-text-muted)' }}>
            Here&apos;s your overview for today
          </p>
        </div>
        {dateString && (
          <div 
            className="text-sm px-4 py-2 rounded-full"
            style={{ 
              background: 'var(--theme-primary-soft)',
              color: 'var(--theme-primary)'
            }}
          >
            {dateString}
          </div>
        )}
      </div>

      {/* Organization Context Banner */}
      {organization && department && (
        <div 
          className="rounded-xl p-4 flex items-center gap-4"
          style={{
            background: 'linear-gradient(135deg, var(--theme-primary-soft) 0%, var(--theme-surface-hover) 100%)',
            border: '1px solid var(--theme-border-solid)',
          }}
        >
          <div 
            className="p-3 rounded-lg"
            style={{ background: 'var(--theme-surface-solid)' }}
          >
            <Building2 className="w-6 h-6" style={{ color: 'var(--theme-primary)' }} />
          </div>
          <div>
            <p className="font-semibold" style={{ color: 'var(--theme-text)' }}>
              {organization.name}
            </p>
            <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
              {department.name} Residency Program
            </p>
          </div>
        </div>
      )}

      {/* Quick Access Modules */}
      <div>
        <h2 
          className="text-lg font-semibold mb-4"
          style={{ color: 'var(--theme-text)' }}
        >
          Quick Access
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.name}
                href={module.href}
                className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                style={{
                  background: 'var(--theme-surface-solid)',
                  border: '1px solid var(--theme-border-solid)',
                }}
              >
                <div 
                  className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${module.color}`}
                />
                
                <div className="flex items-start gap-4">
                  <div 
                    className={`p-3 rounded-xl bg-gradient-to-br ${module.color}`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 
                      className="font-bold text-lg flex items-center gap-2"
                      style={{ color: 'var(--theme-text)' }}
                    >
                      {module.name}
                      <ArrowRight 
                        className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" 
                        style={{ color: 'var(--theme-primary)' }}
                      />
                    </h3>
                    <p 
                      className="text-sm mt-1"
                      style={{ color: 'var(--theme-text-muted)' }}
                    >
                      {module.description}
                    </p>
                  </div>
                </div>

                {module.items.length > 0 && (
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--theme-border-solid)' }}>
                    <div className="flex flex-wrap gap-2">
                      {module.items.slice(0, 3).map((item) => (
                        <span
                          key={item.name}
                          className="text-xs px-2 py-1 rounded-full"
                          style={{ 
                            background: 'var(--theme-surface-hover)',
                            color: 'var(--theme-text-muted)'
                          }}
                        >
                          {item.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div 
        className="rounded-2xl p-6"
        style={{
          background: 'var(--theme-surface-solid)',
          border: '1px solid var(--theme-border-solid)',
        }}
      >
        <h2 
          className="text-lg font-semibold mb-4 flex items-center gap-2"
          style={{ color: 'var(--theme-text)' }}
        >
          <Clock className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
          Recent Activity
        </h2>
        <div 
          className="text-center py-8"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Your recent activity will appear here</p>
          <p className="text-sm mt-1">Start exploring the modules above!</p>
        </div>
      </div>
    </div>
  );
}
