'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ChevronRight, 
  ChevronDown,
  Building2,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTenant, useTenantUrl, useTenantPermissions } from '@/context/TenantContext';
import { usePermissions } from '@/lib/hooks/usePermissions';

interface NavChild {
  name: string;
  href: string;
  external?: boolean;  // Opens in new tab
  highlight?: boolean; // Special styling
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}

interface NavItem {
  name: string;
  href?: string;
  children?: NavChild[];
  adminOnly?: boolean;
  leadershipOnly?: boolean;
  facultyOnly?: boolean; // Hidden from residents
}

// Base navigation structure (paths will be prefixed with tenant URL)
function getNavigation(buildUrl: (path: string) => string): NavItem[] {
  return [
    { 
      name: 'Dashboard',
      href: buildUrl('/dashboard'),
    },
    { 
      name: 'Learn',
      children: [
        { name: 'Clinical Cases', href: buildUrl('/modules/learn/clinical-cases') },
        { name: 'Difficult Conversations', href: buildUrl('/modules/learn/difficult-conversations') },
        { name: 'EKG & ACLS', href: buildUrl('/modules/learn/ekg-acls') },
        { name: 'Running the Board', href: buildUrl('/modules/learn/running-board') },
        { name: 'Studio', href: '/studio', external: true, highlight: true, icon: Sparkles },
      ]
    },
    { 
      name: 'Reflect',
      facultyOnly: true, // Hidden from residents
      children: [
        { name: 'Voice Journaling', href: buildUrl('/modules/reflect/voice-journal') },
      ]
    },
    { 
      name: 'Understand',
      facultyOnly: true, // Hidden from residents
      children: [
        { name: 'Residents', href: buildUrl('/modules/understand/residents') },
        { name: 'Class Cohort', href: buildUrl('/modules/understand/class') },
        { name: 'Program-Wide', href: buildUrl('/modules/understand/program') },
        { name: 'CCC Meetings', href: buildUrl('/modules/understand') },
      ]
    },
    { 
      name: 'Truths',
      facultyOnly: true, // Hidden from residents
      children: [
        { name: 'Uploads', href: buildUrl('/truths/uploads') },
        { name: 'Scores', href: buildUrl('/truths/scores') },
      ]
    },
    { 
      name: 'Expectations',
      leadershipOnly: true,
      children: [
        { name: 'Dashboard', href: buildUrl('/expectations') },
        { name: 'Requirements', href: buildUrl('/expectations/requirements') },
        { name: 'Action Items', href: buildUrl('/expectations/action-items') },
        { name: 'Site Visits', href: buildUrl('/expectations/site-visits') },
      ]
    },
    { 
      name: 'Admin Portal',
      adminOnly: true,
      children: [
        { name: 'Dashboard', href: '/admin/dashboard' },
        { name: 'Access Requests', href: '/admin/requests' },
        { name: 'User Management', href: '/admin/users' },
      ]
    },
  ];
}

export function TenantSidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { organization, department } = useTenant();
  const { buildUrl, baseUrl } = useTenantUrl();
  const { canAccessAdminPortal, isProgramLeadership, isSuperAdmin, role } = usePermissions();
  const [expandedModules, setExpandedModules] = useState<string[]>(['learn']);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Build navigation with tenant-aware URLs
  const navigation = getNavigation(buildUrl);

  // Expectations is only visible to Program Leadership, Admin, Super Admin
  const canAccessExpectations = isProgramLeadership || isSuperAdmin;
  
  // Check if user is a resident (residents have restricted access)
  const isResident = role === 'resident';
  
  // Faculty and above can see facultyOnly modules
  const isFacultyOrAbove = !isResident;

  // Filter navigation based on permissions
  const filteredNavigation = navigation.filter(item => {
    if (item.adminOnly) return canAccessAdminPortal;
    if (item.leadershipOnly) return canAccessExpectations;
    if (item.facultyOnly) return isFacultyOrAbove; // Hide from residents
    return true;
  });

  // Ensure modules are expanded based on current pathname
  useEffect(() => {
    const expanded = new Set(['learn']);
    
    if (pathname?.includes('/admin')) {
      expanded.add('admin portal');
    }
    if (pathname?.includes('/truths')) {
      expanded.add('truths');
    }
    if (pathname?.includes('/expectations')) {
      expanded.add('expectations');
    }
    if (pathname?.includes('/modules/reflect')) {
      expanded.add('reflect');
    }
    if (pathname?.includes('/modules/understand')) {
      expanded.add('understand');
    }
    if (pathname?.includes('/modules/learn')) {
      expanded.add('learn');
    }
    
    setExpandedModules(prev => {
      const merged = new Set([...prev, ...expanded]);
      return Array.from(merged);
    });
  }, [pathname]);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
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
      } else {
        return [...prev, module];
      }
    });
  };

  const isExpanded = (module: string) => expandedModules.includes(module);
  
  const isActive = (href: string) => pathname === href;
  
  const isChildActive = (item: NavItem) => {
    if (!item.children) return false;
    return item.children.some(child => pathname === child.href || pathname?.startsWith(child.href + '/'));
  };

  return (
    <aside 
      className="w-64 flex flex-col"
      style={{
        background: 'var(--theme-surface)',
        backdropFilter: 'var(--theme-blur)',
        WebkitBackdropFilter: 'var(--theme-blur)',
        borderRight: '1px solid rgba(0,0,0,0.06)',
        minHeight: '100vh',
      }}
    >
      {/* Header */}
      <div 
        className="flex h-16 items-center px-6"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
      >
        <div className="mr-3 flex items-center justify-center">
          <img 
            src="/logo-small.png" 
            alt="Logo" 
            className="h-8 w-auto rounded-lg shadow-sm"
          />
        </div>
        <span 
          className="text-xl font-bold tracking-tight logo-gradient"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
        >
          Elevate
        </span>
      </div>

      {/* Organization/Department Badge */}
      {organization && department && (
        <div 
          className="mx-3 mt-3 p-3 rounded-xl"
          style={{ 
            background: 'var(--theme-surface-hover)',
            border: '1px solid rgba(0,0,0,0.04)'
          }}
        >
          <div className="flex items-center gap-2">
            <Building2 size={16} style={{ color: 'var(--theme-primary)' }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--theme-text)' }}>
                {organization.name}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--theme-text-muted)' }}>
                {department.name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {filteredNavigation.map((item) => {
          const hasChildren = !!item.children;
          const expanded = hasChildren && isExpanded(item.name.toLowerCase());
          const active = item.href ? isActive(item.href) : isChildActive(item);
          
          return (
            <div key={item.name}>
              {/* Parent item */}
              {item.href ? (
                <Link
                  href={item.href}
                  className="flex items-center px-3 py-2.5 rounded-xl transition-all duration-200"
                  style={{
                    background: 'transparent',
                    color: active ? 'var(--theme-primary)' : 'var(--theme-text)',
                    fontWeight: active ? 600 : 400,
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'var(--theme-surface-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <span className="text-sm">{item.name}</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => toggleModule(item.name.toLowerCase())}
                  className="flex items-center justify-between w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer"
                  style={{
                    background: 'transparent',
                    color: active ? 'var(--theme-primary)' : 'var(--theme-text)',
                    fontWeight: active ? 600 : 400,
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'var(--theme-surface-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <span className="text-sm">{item.name}</span>
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
                    const ChildIcon = child.icon;
                    
                    // Special styling for highlighted items (like Studio)
                    if (child.highlight) {
                      return (
                        <a
                          key={child.href}
                          href={child.href}
                          target={child.external ? '_blank' : undefined}
                          rel={child.external ? 'noopener noreferrer' : undefined}
                          className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-all duration-200 mt-2"
                          style={{
                            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(14, 165, 233, 0.12) 100%)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            color: 'var(--theme-primary)',
                            fontWeight: 500,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(14, 165, 233, 0.2) 100%)';
                            e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(14, 165, 233, 0.12) 100%)';
                            e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)';
                          }}
                        >
                          {ChildIcon && <ChildIcon size={14} style={{ color: 'var(--theme-primary)' }} />}
                          <span>{child.name}</span>
                          {child.external && <ExternalLink size={12} className="ml-auto opacity-60" />}
                        </a>
                      );
                    }
                    
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        target={child.external ? '_blank' : undefined}
                        className="block text-sm px-3 py-1.5 transition-colors duration-200"
                        style={{
                          background: 'none',
                          backgroundColor: 'transparent',
                          color: childActive ? 'var(--theme-primary)' : 'var(--theme-text-muted)',
                          fontWeight: childActive ? 600 : 400,
                        }}
                        onMouseEnter={(e) => {
                          if (!childActive) {
                            e.currentTarget.style.color = 'var(--theme-primary)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!childActive) {
                            e.currentTarget.style.color = 'var(--theme-text-muted)';
                          }
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
        style={{ 
          background: 'var(--theme-surface)',
        }}
      >
        {/* User Info */}
        <div 
          className="px-3 py-2 mb-2 pb-3"
          style={{ borderBottom: '1px solid rgba(200, 200, 200, 0.3)' }}
        >
          <p className="text-sm font-medium truncate" style={{ color: 'var(--theme-text)' }}>
            {user?.email}
          </p>
          <p className="text-xs uppercase tracking-wider mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            {role?.replace(/_/g, ' ') || 'Loading...'}
          </p>
        </div>

        <div className="pt-1">
          <Link 
            href={buildUrl('/settings')} 
            className="flex items-center px-3 py-2 rounded-xl transition-colors"
            style={{ color: 'var(--theme-text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--theme-surface-hover)';
              e.currentTarget.style.color = 'var(--theme-text)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--theme-text-muted)';
            }}
          >
            <span className="text-sm">Settings</span>
          </Link>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center px-3 py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ color: 'var(--theme-text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.color = 'var(--theme-error)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--theme-text-muted)';
            }}
          >
            <span className="text-sm">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

export default TenantSidebar;
