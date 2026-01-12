import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import UnderstandClient from '@/components/modules/understand/UnderstandClient';

interface CCCSession {
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

async function getServerData() {
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

  // Fetch CCC sessions if user has permission
  let sessions: CCCSession[] = [];
  
  if (profile?.role && ['faculty', 'program_director', 'assistant_program_director', 'clerkship_director', 'super_admin', 'admin'].includes(profile.role)) {
    const { data: sessionsData } = await supabase
      .from('ccc_sessions')
      .select('*')
      .order('session_date', { ascending: false });
    
    sessions = sessionsData || [];
  }

  return { sessions, userRole: profile?.role };
}

export default async function TenantUnderstandPage() {
  const { sessions } = await getServerData();

  return <UnderstandClient initialSessions={sessions} />;
}
