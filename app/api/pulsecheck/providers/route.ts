import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/pulsecheck/providers
 * Get providers for a department or director
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const directorId = searchParams.get('director_id');
    const departmentId = searchParams.get('department_id');
    const _siteId = searchParams.get('site_id');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from('pulsecheck_providers')
      .select(`
        id,
        name,
        email,
        provider_type,
        credential,
        hire_date,
        is_active,
        primary_department_id,
        primary_director_id,
        created_at
      `)
      .eq('is_active', true)
      .order('name');

    if (directorId) {
      query = query.eq('primary_director_id', directorId);
    }
    if (departmentId) {
      query = query.eq('primary_department_id', departmentId);
    }

    const { data: providers, error } = await query;

    if (error) {
      console.error('[pulsecheck/providers] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ providers });
  } catch (error) {
    console.error('[pulsecheck/providers] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/pulsecheck/providers
 * Create a new provider
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      provider_type,
      credential,
      primary_department_id,
      primary_director_id,
      hire_date,
    } = body;

    if (!name || !email || !provider_type || !primary_department_id) {
      return NextResponse.json(
        { error: 'Name, email, provider type, and department are required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for duplicate email
    const { data: existing } = await supabase
      .from('pulsecheck_providers')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'A provider with this email already exists', duplicate: true },
        { status: 409 }
      );
    }

    const { data: provider, error } = await supabase
      .from('pulsecheck_providers')
      .insert({
        name,
        email: email.toLowerCase(),
        provider_type,
        credential,
        primary_department_id,
        primary_director_id,
        hire_date,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('[pulsecheck/providers] Insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ provider }, { status: 201 });
  } catch (error) {
    console.error('[pulsecheck/providers] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
