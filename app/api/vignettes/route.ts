// API Route: Vignettes
// GET /api/vignettes - List all available vignettes
// POST /api/vignettes - Create a new vignette (educators only)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET /api/vignettes - List vignettes
export async function GET(request: NextRequest) {
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

    // Get user profile to check institution
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('institution_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

      // Fetch vignettes - include global vignettes (institution_id IS NULL) and institution-specific ones
      // Global vignettes are available to all users regardless of institution
      const { data: vignettes, error } = await supabase
        .from('vignettes')
        .select('*')
        .eq('is_active', true)
        .or(`institution_id.is.null,institution_id.eq.${profile.institution_id}`)
        .order('created_at', { ascending: false });

    if (error) {
      console.error('[Vignettes] Error fetching vignettes:', error);
      return NextResponse.json({ error: 'Failed to fetch vignettes' }, { status: 500 });
    }

    return NextResponse.json({ vignettes: vignettes || [] }, { status: 200 });
  } catch (error) {
    console.error('[Vignettes] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/vignettes - Create vignette (educators only)
export async function POST(request: NextRequest) {
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

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('institution_id, role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Check if user is educator
    const educatorRoles = ['faculty', 'program_director', 'super_admin'];
    if (!educatorRoles.includes(profile.role)) {
      return NextResponse.json(
        { error: 'Only educators can create vignettes' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      category,
      subcategory,
      difficulty,
      estimated_duration_minutes,
      vignette_data,
      is_public = false,
    } = body;

    if (!title || !category || !vignette_data) {
      return NextResponse.json(
        { error: 'Title, category, and vignette_data are required' },
        { status: 400 }
      );
    }

    const { data: newVignette, error } = await supabase
      .from('vignettes')
      .insert({
        institution_id: profile.institution_id,
        title,
        description,
        category,
        subcategory,
        difficulty: difficulty || ['beginner', 'intermediate', 'advanced'],
        estimated_duration_minutes,
        vignette_data,
        created_by_user_id: user.id,
        is_public,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('[Vignettes] Error creating vignette:', error);
      return NextResponse.json({ error: 'Failed to create vignette' }, { status: 500 });
    }

    return NextResponse.json({ vignette: newVignette }, { status: 201 });
  } catch (error) {
    console.error('[Vignettes] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


