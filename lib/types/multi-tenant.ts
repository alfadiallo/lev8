// Multi-Tenant Architecture Types

export interface Organization {
  id: string;
  slug: string;
  name: string;
  abbreviation?: string;
  location?: string;
  contactEmail?: string;
  settings: OrganizationSettings;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationSettings {
  theme?: string;
  features?: {
    running_board?: boolean;
    clinical_cases?: boolean;
    voice_journal?: boolean;
    swot_analysis?: boolean;
    difficult_conversations?: boolean;
    ekg_acls?: boolean;
  };
  branding?: {
    logo?: string;
    primaryColor?: string;
  };
}

export interface Department {
  id: string;
  organizationId: string;
  slug: string;
  name: string;
  specialty?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type MembershipRole =
  | 'super_admin'
  | 'admin'
  | 'program_director'
  | 'assistant_program_director'
  | 'clerkship_director'
  | 'faculty'
  | 'resident'
  | 'viewer';

export interface OrganizationMembership {
  id: string;
  userId: string;
  healthSystemId: string;
  programId?: string;
  role: MembershipRole;
  isPrimary: boolean;
  grantedBy?: string;
  grantedAt: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type StudioCreatorStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface StudioCreator {
  id: string;
  userId: string;
  displayName?: string;
  bio?: string;
  affiliation?: string;
  specialty?: string;
  status: StudioCreatorStatus;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  contentCount: number;
  createdAt: string;
  updatedAt: string;
}

export type StudioContentType = 'running_board_case' | 'clinical_case' | 'conversation' | 'ekg_scenario';
export type StudioContentStatus = 'draft' | 'review' | 'published' | 'archived';

export interface StudioContent {
  id: string;
  creatorId: string;
  contentType: StudioContentType;
  title: string;
  description?: string;
  specialty?: string;
  status: StudioContentStatus;
  contentData: Record<string, unknown>;
  metadata: Record<string, unknown>;
  version: number;
  publishedAt?: string;
  viewCount: number;
  useCount: number;
  ratingAvg?: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
}

// Context types for multi-tenant routing
export interface TenantContext {
  organization: Organization | null;
  department: Department | null;
  membership: OrganizationMembership | null;
  isStudioAccess: boolean;
}

// URL routing helpers
export interface TenantRoute {
  orgSlug: string;
  deptSlug?: string;
  path: string;
}

// Helper to build tenant-aware URLs
export function buildTenantUrl(orgSlug: string, deptSlug: string, path: string = ''): string {
  const basePath = `/${orgSlug}/${deptSlug}`;
  return path ? `${basePath}${path.startsWith('/') ? path : `/${path}`}` : basePath;
}

// Parse tenant info from pathname
export function parseTenantRoute(pathname: string): TenantRoute | null {
  // Expected format: /orgSlug/deptSlug/...rest
  const parts = pathname.split('/').filter(Boolean);
  
  if (parts.length < 2) {
    return null;
  }
  
  const [orgSlug, deptSlug, ...rest] = parts;
  
  // Skip known non-tenant routes
  const nonTenantPrefixes = ['api', 'login', 'register', 'forgot-password', 'admin', 'debug', 'studio', 'request-access', 'update-password', 'verify-2fa', '_next'];
  if (nonTenantPrefixes.includes(orgSlug)) {
    return null;
  }
  
  return {
    orgSlug,
    deptSlug,
    path: rest.length > 0 ? `/${rest.join('/')}` : ''
  };
}

// Check if a role has certain permissions
export function hasPermission(role: MembershipRole, permission: 'view' | 'edit' | 'admin'): boolean {
  const rolePermissions: Record<MembershipRole, string[]> = {
    'super_admin': ['view', 'edit', 'admin'],
    'admin': ['view', 'edit', 'admin'],
    'program_director': ['view', 'edit', 'admin'],
    'assistant_program_director': ['view', 'edit'],
    'clerkship_director': ['view', 'edit'],
    'faculty': ['view', 'edit'],
    'resident': ['view'],
    'viewer': ['view']
  };
  
  return rolePermissions[role]?.includes(permission) ?? false;
}
