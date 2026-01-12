import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect, notFound } from 'next/navigation';
import { TenantProvider } from '@/context/TenantContext';
import { AuthProvider } from '@/context/AuthContext';
import { TenantSidebar } from '@/components/layout/TenantSidebar';
import { Organization, Department, OrganizationMembership } from '@/lib/types/multi-tenant';

interface TenantLayoutProps {
  children: ReactNode;
  params: Promise<{ org: string; dept: string }>;
}

async function getTenantData(orgSlug: string, deptSlug: string, userId: string) {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Server component - cookies are read-only
        },
      },
    }
  );

  // Fetch organization by slug
  const { data: org, error: orgError } = await supabase
    .from('health_systems')
    .select('*')
    .eq('slug', orgSlug)
    .eq('is_active', true)
    .single();

  if (orgError || !org) {
    console.log('[TenantLayout] Organization not found:', orgSlug, orgError);
    return { organization: null, department: null, membership: null };
  }

  // Fetch department/program by slug within the organization
  const { data: dept, error: deptError } = await supabase
    .from('programs')
    .select('*')
    .eq('health_system_id', org.id)
    .eq('slug', deptSlug)
    .eq('is_active', true)
    .single();

  if (deptError || !dept) {
    console.log('[TenantLayout] Department not found:', deptSlug, deptError);
    return { organization: mapOrganization(org), department: null, membership: null };
  }

  // Fetch user's membership in this org/dept
  const { data: membership, error: membershipError } = await supabase
    .from('organization_memberships')
    .select('*')
    .eq('user_id', userId)
    .eq('health_system_id', org.id)
    .or(`program_id.eq.${dept.id},program_id.is.null`)
    .single();

  if (membershipError) {
    console.log('[TenantLayout] Membership check error:', membershipError);
  }

  return {
    organization: mapOrganization(org),
    department: mapDepartment(dept, org.id),
    membership: membership ? mapMembership(membership) : null
  };
}

// Map database row to Organization type
function mapOrganization(row: Record<string, unknown>): Organization {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    abbreviation: row.abbreviation as string | undefined,
    location: row.location as string | undefined,
    contactEmail: row.contact_email as string | undefined,
    settings: (row.settings as Organization['settings']) || {},
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  };
}

// Map database row to Department type
function mapDepartment(row: Record<string, unknown>, orgId: string): Department {
  return {
    id: row.id as string,
    organizationId: orgId,
    slug: row.slug as string,
    name: row.name as string,
    specialty: row.specialty as string | undefined,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  };
}

// Map database row to OrganizationMembership type
function mapMembership(row: Record<string, unknown>): OrganizationMembership {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    healthSystemId: row.health_system_id as string,
    programId: row.program_id as string | undefined,
    role: row.role as OrganizationMembership['role'],
    isPrimary: row.is_primary as boolean,
    grantedBy: row.granted_by as string | undefined,
    grantedAt: row.granted_at as string,
    expiresAt: row.expires_at as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  };
}

async function getUser() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Server component - cookies are read-only
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return {
    id: user.id,
    email: user.email || '',
    firstName: profile?.full_name?.split(' ')[0],
    lastName: profile?.full_name?.split(' ').slice(1).join(' '),
    role: profile?.role
  };
}

export default async function TenantLayout({ children, params }: TenantLayoutProps) {
  const { org: orgSlug, dept: deptSlug } = await params;
  
  // Get authenticated user
  const user = await getUser();
  
  if (!user) {
    redirect(`/login?redirect=/${orgSlug}/${deptSlug}`);
  }

  // Get tenant data
  const { organization, department, membership } = await getTenantData(orgSlug, deptSlug, user.id);

  // If organization doesn't exist, show 404
  if (!organization) {
    notFound();
  }

  // If department doesn't exist, show 404
  if (!department) {
    notFound();
  }

  // If user doesn't have membership, show access denied
  // For now, we'll allow access and handle permissions in components
  // TODO: Implement proper access denied page
  if (!membership) {
    console.log('[TenantLayout] User has no membership for this org/dept');
    // For development, create a temporary membership context
    // In production, this would redirect to an access denied page
  }

  return (
    <AuthProvider initialUser={user}>
      <TenantProvider 
        organization={organization} 
        department={department} 
        membership={membership}
      >
        <div className="flex h-screen min-h-screen" style={{ margin: 0, padding: 0 }}>
          <TenantSidebar />
          
          {/* Main content */}
          <main 
            className="flex-1 overflow-auto"
            style={{ background: 'transparent' }}
          >
            <div className="p-8 min-h-full">
              {children}
            </div>
          </main>
        </div>
      </TenantProvider>
    </AuthProvider>
  );
}
