import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import UnderstandClient from '@/components/modules/understand/UnderstandClient';

interface ProgressCheckSession {
  id: string;
  session_date: string;
  academic_year: string;
  session_type: string;
  title: string | null;
  duration_minutes: number;
  created_at: string;
  program_id: string;
  pgy_level: number | null;
}

interface PageProps {
  params: Promise<{ org: string; dept: string }>;
}

async function getServerData(orgSlug: string, deptSlug: string) {
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

  // Get user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { sessions: [], userRole: null };
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Use service role for tenant-filtered queries
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  );

  // Resolve tenant from URL params
  const { data: org } = await supabaseAdmin
    .from('health_systems')
    .select('id')
    .eq('slug', orgSlug)
    .eq('is_active', true)
    .single();

  const { data: program } = await supabaseAdmin
    .from('programs')
    .select('id')
    .eq('health_system_id', org?.id)
    .eq('slug', deptSlug)
    .eq('is_active', true)
    .single();

  // Fetch Progress Check sessions if user has permission - filtered by program
  let sessions: ProgressCheckSession[] = [];
  
  if (profile?.role && ['faculty', 'program_director', 'assistant_program_director', 'clerkship_director', 'super_admin', 'admin'].includes(profile.role)) {
    if (program?.id) {
      const { data: sessionsData } = await supabaseAdmin
        .from('progress_check_sessions')
        .select('*')
        .eq('program_id', program.id)
        .order('session_date', { ascending: false });
      
      sessions = sessionsData || [];
    }
  }

  return { sessions, userRole: profile?.role };
}

export default async function TenantUnderstandPage({ params }: PageProps) {
  const { org, dept } = await params;
  const { sessions } = await getServerData(org, dept);

  return <UnderstandClient initialSessions={sessions} />;
}
