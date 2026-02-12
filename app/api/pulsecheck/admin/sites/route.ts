import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

/**
 * GET /api/pulsecheck/admin/sites
 * Get all sites
 */
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: sites, error } = await supabase
      .from('pulsecheck_sites')
      .select('*')
      .order('name');

    if (error) {
      console.error('[pulsecheck/admin/sites] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sites });
  } catch (error) {
    console.error('[pulsecheck/admin/sites] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/pulsecheck/admin/sites
 * Create a new site
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, region, address } = body;

    if (!name) {
      return NextResponse.json({ error: 'Site name is required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: site, error } = await supabase
      .from('pulsecheck_sites')
      .insert({ name, region, address, is_active: true })
      .select()
      .single();

    if (error) {
      console.error('[pulsecheck/admin/sites] Insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ site }, { status: 201 });
  } catch (error) {
    console.error('[pulsecheck/admin/sites] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
