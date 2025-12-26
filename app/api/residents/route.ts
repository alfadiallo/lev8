import { NextRequest, NextResponse } from 'next/server';
import { checkApiPermission } from '@/lib/auth/checkApiPermission';
import { getServerSupabaseClient } from '@/lib/supabase/server';
import { calculatePGYLevel } from '@/lib/utils/pgy-calculator';

export async function GET(request: NextRequest) {
  const authResult = await checkApiPermission(request, { minimumRole: 'faculty' });
  if (!authResult.authorized) {
    return authResult.response!;
  }

  // Use shared server client helper (respects RLS)
  const supabase = getServerSupabaseClient();

  try {
    // Try using the view first
    let { data: residents, error: viewError } = await supabase
      .from('residents_with_pgy')
      .select('id, full_name, anon_code, graduation_year, class_name, current_pgy_level')
      .order('graduation_year', { ascending: false })
      .order('full_name', { ascending: true });

    // Fallback: if view doesn't exist, query residents directly
    if (viewError || !residents || residents.length === 0) {
      const { data: fallbackData } = await supabase
        .from('residents')
        .select(`
          id,
          anon_code,
          class_id,
          classes:class_id (
            graduation_year,
            name
          )
        `)
        .order('anon_code', { ascending: true });

      if (fallbackData && fallbackData.length > 0) {
        // Get user profiles for names
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('id, full_name, email');

        const { data: residentUserData } = await supabase
          .from('residents')
          .select('id, user_id');

        const userIdMap = new Map(residentUserData?.map(r => [r.id, r.user_id]) || []);
        const profileMap = new Map(profileData?.map(p => [p.id, p]) || []);

        residents = fallbackData.map((r: any) => {
          const classesRaw = r.classes as unknown;
          let graduationYear = 0;
          let className = '';

          if (classesRaw && typeof classesRaw === 'object' && !Array.isArray(classesRaw)) {
            const classObj = classesRaw as Record<string, unknown>;
            graduationYear = (classObj.graduation_year as number) || 0;
            className = (classObj.name as string) || '';
          }

          const userId = userIdMap.get(r.id);
          const profile = userId ? profileMap.get(userId) : null;

          return {
            id: r.id,
            full_name: profile?.full_name || profile?.email?.split('@')[0] || 'Unknown',
            anon_code: r.anon_code || '',
            graduation_year: graduationYear,
            class_name: className || `Class ${r.class_id?.slice(-2) || '??'}`,
            current_pgy_level: graduationYear ? calculatePGYLevel(graduationYear) : 0,
          };
        });
      }
    }

    return NextResponse.json({ residents: residents || [] });
  } catch (error) {
    console.error('[Residents API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch residents' },
      { status: 500 }
    );
  }
}

