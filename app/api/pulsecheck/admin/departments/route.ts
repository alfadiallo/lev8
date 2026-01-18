import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

/**
 * GET /api/pulsecheck/admin/departments
 * Get all departments
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('site_id');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from('pulsecheck_departments')
      .select('*')
      .order('name');

    if (siteId) {
      query = query.eq('site_id', siteId);
    }

    const { data: departments, error } = await query;

    if (error) {
      console.error('[pulsecheck/admin/departments] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ departments });
  } catch (error) {
    console.error('[pulsecheck/admin/departments] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/pulsecheck/admin/departments
 * Create a new department
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { site_id, name, specialty } = body;

    if (!site_id || !name) {
      return NextResponse.json({ error: 'Site ID and name are required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: department, error } = await supabase
      .from('pulsecheck_departments')
      .insert({ site_id, name, specialty, is_active: true })
      .select()
      .single();

    if (error) {
      console.error('[pulsecheck/admin/departments] Insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ department }, { status: 201 });
  } catch (error) {
    console.error('[pulsecheck/admin/departments] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
