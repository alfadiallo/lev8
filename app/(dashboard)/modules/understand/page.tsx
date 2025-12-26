import { getServerUserWithProfile } from '@/lib/auth/server';
import { getServerSupabaseClient } from '@/lib/supabase/server';
import UnderstandClient from './UnderstandClient';

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

export default async function UnderstandModulePage() {
  // Fetch user to check permissions
  const user = await getServerUserWithProfile();
  
  // Fetch CCC sessions server-side (only if user has permission)
  let sessions: CCCSession[] = [];
  
  if (user?.role && ['faculty', 'program_director', 'assistant_program_director', 'clerkship_director', 'super_admin', 'admin'].includes(user.role)) {
    const supabase = getServerSupabaseClient();
    const { data: sessionsData } = await supabase
      .from('ccc_sessions')
      .select('*')
      .order('session_date', { ascending: false });
    
    sessions = sessionsData || [];
  }

  return <UnderstandClient initialSessions={sessions} />;
}
