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
    // Fetch residents
    let residentsData: any[] = [];
    
    const { data: viewData, error: viewError } = await supabase
      .from('residents_with_pgy')
      .select('id, full_name, anon_code, graduation_year, class_name, current_pgy_level');
    
    if (!viewError && viewData && viewData.length > 0) {
      residentsData = viewData;
    } else {
      // Fallback: query residents directly
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('residents')
        .select(`
          id, 
          anon_code,
          user_profiles:user_id(full_name),
          classes:class_id(graduation_year)
        `);

      if (fallbackError) throw fallbackError;
      
      // Transform fallback data to match view format
      residentsData = (fallbackData || []).map((r: any) => ({
        id: r.id,
        full_name: r.user_profiles?.full_name || 'Unknown Resident',
        anon_code: r.anon_code || 'R000',
        graduation_year: r.classes?.graduation_year || 2027
      }));
    }

    // Fetch ITE scores
    const { data: iteScores, error: iteError } = await supabase
      .from('ite_scores')
      .select('*');

    if (iteError) throw iteError;

    // Fetch Exam scores (USMLE, COMLEX, Boards) - handle if table doesn't exist
    let otherScores: any[] = [];
    try {
      const { data, error } = await supabase.from('exam_scores').select('*');
      if (!error && data) otherScores = data;
    } catch (e) {
      console.warn('exam_scores table might not exist yet');
    }

    return NextResponse.json({
      residents: residentsData,
      iteScores: iteScores || [],
      examScores: otherScores
    });
  } catch (error) {
    console.error('[Scores API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scores data' },
      { status: 500 }
    );
  }
}

