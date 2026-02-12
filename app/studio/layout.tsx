import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import { AuthProvider } from '@/context/AuthContext';
import StudioSidebar from '@/components/studio/StudioSidebar';

interface StudioLayoutProps {
  children: ReactNode;
}

async function getStudioUser() {
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
    return { user: null, hasStudioAccess: false, creatorProfile: null };
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Check if user has Studio access (org member OR approved creator)
  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('id, program_id')
    .eq('user_id', user.id)
    .eq('is_primary', true)
    .single();

  // Get user's program/specialty
  let specialty = 'Emergency Medicine';
  if (membership?.program_id) {
    const { data: program } = await supabase
      .from('programs')
      .select('name, specialty')
      .eq('id', membership.program_id)
      .single();
    if (program) {
      specialty = program.specialty || program.name || 'Emergency Medicine';
    }
  }

  const { data: creator } = await supabase
    .from('studio_creators')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Studio access: org membership, approved studio_creators row, or studio_creator role (Learn + Studio only)
  const hasStudioAccess = !!membership || (creator?.status === 'approved') || profile?.role === 'studio_creator';

  return {
    user: {
      id: user.id,
      email: user.email || '',
      firstName: profile?.full_name?.split(' ')[0],
      lastName: profile?.full_name?.split(' ').slice(1).join(' '),
      role: profile?.role
    },
    hasStudioAccess,
    creatorProfile: creator,
    specialty
  };
}

export default async function StudioLayout({ children }: StudioLayoutProps) {
  const { user, hasStudioAccess, creatorProfile, specialty } = await getStudioUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/login?context=studio');
  }

  // If user doesn't have Studio access, show request access page
  if (!hasStudioAccess) {
    return (
      <AuthProvider initialUser={user}>
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--theme-background)' }}>
          <div className="max-w-md w-full p-8 rounded-2xl" style={{ background: 'var(--theme-surface-solid)', border: '1px solid var(--theme-border-solid)' }}>
            <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--theme-text)' }}>
              Studio Access Required
            </h1>
            <p className="mb-6" style={{ color: 'var(--theme-text-muted)' }}>
              You need to be an approved Studio creator or a member of a registered program to access Studio.
            </p>
            {creatorProfile?.status === 'pending' ? (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-amber-800 font-medium">Your creator application is pending review.</p>
                <p className="text-amber-600 text-sm mt-1">We&apos;ll notify you once it&apos;s approved.</p>
              </div>
            ) : (
              <a
                href="/studio/request-access"
                className="block w-full text-center px-6 py-3 rounded-lg font-medium"
                style={{ background: 'var(--theme-primary)', color: 'white' }}
              >
                Request Creator Access
              </a>
            )}
          </div>
        </div>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider initialUser={user}>
      <div className="flex h-screen min-h-screen" style={{ margin: 0, padding: 0 }}>
        <StudioSidebar creatorProfile={creatorProfile} specialty={specialty} />
        
        {/* Main content */}
        <main 
          className="flex-1 overflow-auto"
          style={{ background: 'var(--theme-background)' }}
        >
          <div className="p-8 min-h-full">
            {children}
          </div>
        </main>
      </div>
    </AuthProvider>
  );
}
