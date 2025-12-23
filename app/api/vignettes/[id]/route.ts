// API Route: Vignette by ID
// GET /api/vignettes/[id] - Get vignette details

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: vignette, error } = await supabase
      .from('vignettes')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !vignette) {
      return NextResponse.json({ error: 'Vignette not found' }, { status: 404 });
    }

    return NextResponse.json({ vignette }, { status: 200 });
  } catch (error) {
    console.error('[Vignettes] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


