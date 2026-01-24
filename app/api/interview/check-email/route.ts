import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Interview tool permission levels based on lev8 role
type InterviewPermission = 'guest' | 'faculty' | 'program_director' | 'admin';

function getInterviewPermission(role: string | null): InterviewPermission {
  switch (role) {
    case 'super_admin':
      return 'admin';
    case 'program_director':
      return 'program_director';
    case 'faculty':
      return 'faculty';
    default:
      return 'guest';
  }
}

// Define what each permission level can do
const PERMISSION_CAPABILITIES = {
  guest: {
    canCreateIndividualSession: true,
    canJoinGroupSession: false,
    canRateCandidates: true,
    canViewOwnRatings: true,
    canViewAllRatings: false,
    canViewAggregateAnalytics: false,
    canManageSessions: false,
    canExportData: false,
  },
  faculty: {
    canCreateIndividualSession: true,
    canJoinGroupSession: true,
    canRateCandidates: true,
    canViewOwnRatings: true,
    canViewAllRatings: false,
    canViewAggregateAnalytics: false,
    canManageSessions: false,
    canExportData: true,
  },
  program_director: {
    canCreateIndividualSession: true,
    canJoinGroupSession: true,
    canRateCandidates: true,
    canViewOwnRatings: true,
    canViewAllRatings: true,
    canViewAggregateAnalytics: true,
    canManageSessions: true,
    canExportData: true,
  },
  admin: {
    canCreateIndividualSession: true,
    canJoinGroupSession: true,
    canRateCandidates: true,
    canViewOwnRatings: true,
    canViewAllRatings: true,
    canViewAggregateAnalytics: true,
    canManageSessions: true,
    canExportData: true,
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if email exists in user_profiles with institution info
    const { data: user, error } = await supabase
      .from('user_profiles')
      .select(`
        id, 
        email, 
        full_name, 
        role,
        institution_id,
        source,
        health_systems:institution_id (
          id,
          name,
          abbreviation,
          location
        )
      `)
      .eq('email', email.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[check-email] Error:', error);
      return NextResponse.json({ error: 'Failed to check email' }, { status: 500 });
    }

    // If user exists, get their faculty/program info
    let facultyInfo = null;
    let programInfo = null;

    if (user) {
      // Check if they're faculty - try by user_id first, then by email
      let faculty = null;
      
      // First try matching by user_id
      const { data: facultyByUserId } = await supabase
        .from('faculty')
        .select(`
          id,
          full_name,
          credentials,
          email,
          is_active,
          program_id,
          programs:program_id (
            id,
            name,
            specialty
          )
        `)
        .eq('user_id', user.id)
        .single();

      if (facultyByUserId) {
        faculty = facultyByUserId;
      } else {
        // Fallback: try matching by email
        const { data: facultyByEmail } = await supabase
          .from('faculty')
          .select(`
            id,
            full_name,
            credentials,
            email,
            is_active,
            program_id,
            programs:program_id (
              id,
              name,
              specialty
            )
          `)
          .eq('email', email.toLowerCase())
          .single();
        
        if (facultyByEmail) {
          faculty = facultyByEmail;
        }
      }

      if (faculty) {
        facultyInfo = {
          id: faculty.id,
          fullName: faculty.full_name,
          credentials: faculty.credentials,
          email: faculty.email,
          isActive: faculty.is_active,
        };
        programInfo = faculty.programs;
      } 
      // If not found in faculty table, try finding program directly via pgm_director_id if they are a PD
      else if (user.role === 'program_director' || user.role === 'admin') {
        const { data: programByDirector } = await supabase
          .from('programs')
          .select('id, name, specialty')
          // Assuming we can link via user_id, but pgm_director_id is a UUID.
          // In seed data, PD user ID is used.
          .eq('pgm_director_id', user.id) 
          .single();
          
        if (programByDirector) {
          programInfo = programByDirector;
        } else {
           // Fallback for demo: just grab the first program for the institution if one exists
           // This helps with the Sarah Chen case if she's not explicitly set as PD in programs table yet
           const { data: anyProgram } = await supabase
            .from('programs')
            .select('id, name, specialty')
            .eq('health_system_id', user.institution_id)
            .limit(1)
            .single();
            
           if (anyProgram) {
             programInfo = anyProgram;
           }
        }
      }
    }

    // First check user_profiles role
    let permission = getInterviewPermission(user?.role || null);
    
    // Also check if they have program_director role in interview_session_interviewers
    // This handles the case where someone is a PD for interviews but not in user_profiles
    if (permission === 'guest' || permission === 'faculty') {
      const { data: interviewerRole } = await supabase
        .from('interview_session_interviewers')
        .select('role')
        .eq('interviewer_email', email.toLowerCase())
        .eq('role', 'program_director')
        .limit(1)
        .single();
      
      if (interviewerRole) {
        permission = 'program_director';
      }
    }
    
    const capabilities = PERMISSION_CAPABILITIES[permission];

    return NextResponse.json({
      isLev8User: !!user,
      user: user ? {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        source: user.source,
      } : null,
      institution: user?.health_systems || null,
      faculty: facultyInfo,
      program: programInfo,
      // Permission info for eqpqiq
      permission: {
        level: permission,
        capabilities,
      },
    });
  } catch (error) {
    console.error('[check-email] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Also support GET for easier testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  // Reuse POST logic
  return POST(new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ email }),
    headers: { 'Content-Type': 'application/json' },
  }));
}
