import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // Check user_profiles table structure
    const { data: userProfiles, error: upError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);

    // Check residents table structure  
    const { data: residents, error: rError } = await supabase
      .from('residents')
      .select('*')
      .limit(1);

    // Check programs
    const { data: programs, error: pError } = await supabase
      .from('programs')
      .select('id, name, health_system_id')
      .limit(5);

    // Check health systems
    const { data: healthSystems, error: hsError } = await supabase
      .from('health_systems')
      .select('id, name')
      .limit(5);

    return NextResponse.json({
      schemas: {
        user_profiles: {
          columns: userProfiles && userProfiles.length > 0 ? Object.keys(userProfiles[0]) : [],
          sampleData: userProfiles && userProfiles.length > 0 ? userProfiles[0] : null,
          error: upError?.message
        },
        residents: {
          columns: residents && residents.length > 0 ? Object.keys(residents[0]) : [],
          sampleData: residents && residents.length > 0 ? residents[0] : null,
          error: rError?.message
        }
      },
      data: {
        programsCount: programs?.length || 0,
        programs: programs || [],
        programsError: pError?.message,
        healthSystemsCount: healthSystems?.length || 0,
        healthSystems: healthSystems || [],
        healthSystemsError: hsError?.message,
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

