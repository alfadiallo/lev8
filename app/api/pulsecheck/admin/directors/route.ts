import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

/**
 * GET /api/pulsecheck/admin/directors
 * Get all directors
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('department_id');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from('pulsecheck_directors')
      .select('*')
      .order('name');

    if (departmentId) {
      query = query.eq('department_id', departmentId);
    }

    const { data: directors, error } = await query;

    if (error) {
      console.error('[pulsecheck/admin/directors] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ directors });
  } catch (error) {
    console.error('[pulsecheck/admin/directors] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/pulsecheck/admin/directors
 * Create a new director
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { department_id, name, email, role } = body;

    if (!department_id || !name || !email || !role) {
      return NextResponse.json(
        { error: 'Department ID, name, email, and role are required' },
        { status: 400 }
      );
    }

    const validRoles = [
      'regional_director',
      'medical_director',
      'associate_medical_director',
      'assistant_medical_director',
      'admin_assistant',
    ];

    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for duplicate email
    const { data: existing } = await supabase
      .from('pulsecheck_directors')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'A director with this email already exists' },
        { status: 409 }
      );
    }

    const { data: director, error } = await supabase
      .from('pulsecheck_directors')
      .insert({
        department_id,
        name,
        email: email.toLowerCase(),
        role,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('[pulsecheck/admin/directors] Insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ director }, { status: 201 });
  } catch (error) {
    console.error('[pulsecheck/admin/directors] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
