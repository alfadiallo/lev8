'use client';

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { Organization, Department, OrganizationMembership, TenantContext as TenantContextType } from '@/lib/types/multi-tenant';

interface TenantProviderProps {
  children: ReactNode;
  organization: Organization | null;
  department: Department | null;
  membership: OrganizationMembership | null;
  isStudioAccess?: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ 
  children, 
  organization, 
  department, 
  membership,
  isStudioAccess = false
}: TenantProviderProps) {
  const value = useMemo(() => ({
    organization,
    department,
    membership,
    isStudioAccess
  }), [organization, department, membership, isStudioAccess]);

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant(): TenantContextType {
  const context = useContext(TenantContext);
  if (!context) {
    // Return empty context for routes outside tenant scope
    return {
      organization: null,
      department: null,
      membership: null,
      isStudioAccess: false
    };
  }
  return context;
}

// Helper hook to get tenant URL prefix
export function useTenantUrl() {
  const { organization, department } = useTenant();
  
  const baseUrl = useMemo(() => {
    if (organization?.slug && department?.slug) {
      return `/${organization.slug}/${department.slug}`;
    }
    return '';
  }, [organization?.slug, department?.slug]);
  
  // Build a URL with the tenant prefix
  const buildUrl = (path: string) => {
    if (!baseUrl) return path;
    return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  };
  
  return { baseUrl, buildUrl };
}

// Helper to check permissions within tenant context
export function useTenantPermissions() {
  const { membership } = useTenant();
  
  const hasRole = (roles: string[]) => {
    if (!membership) return false;
    return roles.includes(membership.role);
  };
  
  const canEdit = membership?.role && ['admin', 'program_director', 'assistant_program_director', 'clerkship_director', 'faculty'].includes(membership.role);
  const isAdmin = membership?.role && ['admin', 'program_director', 'super_admin'].includes(membership.role);
  const isResident = membership?.role === 'resident';
  
  return {
    membership,
    hasRole,
    canEdit: !!canEdit,
    isAdmin: !!isAdmin,
    isResident,
    role: membership?.role
  };
}
