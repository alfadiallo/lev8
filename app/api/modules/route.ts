// API Route: Modules
// GET /api/modules - Get all modules accessible to the current user based on their role

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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

    // Get user profile to check role and institution
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('institution_id, role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Fetch modules - RLS will filter based on available_to_roles
    const { data: modules, error } = await supabase
      .from('modules')
      .select('*')
      .eq('is_active', true)
      .eq('institution_id', profile.institution_id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Modules] Error fetching modules:', error);
      return NextResponse.json({ error: 'Failed to fetch modules' }, { status: 500 });
    }

    // Filter modules based on user role (additional client-side check)
    const userRole = profile.role;
    const accessibleModules = modules?.filter(module => {
      if (!module.available_to_roles || module.available_to_roles.length === 0) return true;
      if (userRole === 'super_admin') return true;
      return module.available_to_roles.includes(userRole);
    }) || [];

    return NextResponse.json({ modules: accessibleModules }, { status: 200 });
  } catch (error) {
    console.error('[Modules] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


