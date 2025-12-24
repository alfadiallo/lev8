import { NextRequest, NextResponse } from 'next/server';
import { checkApiPermission } from '@/lib/auth/checkApiPermission';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const authResult = await checkApiPermission(request, { minimumRole: 'faculty' });
  if (!authResult.authorized) {
    return authResult.response!;
  }

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
          // Read-only
        },
      },
    }
  );

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

