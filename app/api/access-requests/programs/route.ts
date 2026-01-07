import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// Use service key for public access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/access-requests/programs
 * Get list of programs for the access request form (public)
 */
export async function GET() {
  try {
    const { data: programs, error } = await supabase
      .from('programs')
      .select('id, name, specialty')
      .order('name');

    if (error) {
      console.error('[Programs] Fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch programs' },
        { status: 500 }
      );
    }

    return NextResponse.json({ programs: programs || [] });
  } catch (error) {
    console.error('[Programs] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



