import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // Get all users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError || !users || users.length === 0) {
      return NextResponse.json({
        error: 'No users found',
        users: []
      });
    }

    const userProfiles = [];

    for (const user of users) {
      const profile: any = {
        userId: user.id,
        email: user.email,
        resident: null,
        faculty: null,
        userProfile: null,
      };

      // Check user_profiles table
      const { data: userProfileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      profile.userProfile = userProfileData;

      // Check residents table
      const { data: residentData } = await supabase
        .from('residents')
        .select('*')
        .eq('user_id', user.id)
        .single();
      profile.resident = residentData;

      // Check faculty table
      const { data: facultyData } = await supabase
        .from('faculty')
        .select('*')
        .eq('user_id', user.id)
        .single();
      profile.faculty = facultyData;

      profile.hasValidProfile = !!(residentData || facultyData);
      profile.needsSetup = !profile.hasValidProfile;

      userProfiles.push(profile);
    }

    return NextResponse.json({
      totalUsers: users.length,
      profiles: userProfiles,
      summary: {
        withResidentProfile: userProfiles.filter(p => p.resident).length,
        withFacultyProfile: userProfiles.filter(p => p.faculty).length,
        needingSetup: userProfiles.filter(p => p.needsSetup).length,
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

