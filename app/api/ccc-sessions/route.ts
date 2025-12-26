import { NextRequest, NextResponse } from 'next/server';
import { checkApiPermission } from '@/lib/auth/checkApiPermission';
import { getServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const authResult = await checkApiPermission(request, { minimumRole: 'faculty' });
  if (!authResult.authorized) {
    return authResult.response!;
  }

  // Use shared server client helper (respects RLS)
  const supabase = getServerSupabaseClient();

  try {
    const { data: sessions, error } = await supabase
      .from('ccc_sessions')
      .select('*')
      .order('session_date', { ascending: false });

    if (error) {
      console.error('[CCC Sessions API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ sessions: sessions || [] });
  } catch (error) {
    console.error('[CCC Sessions API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

