import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// POST /api/studio/content - Create new content
export async function POST(request: NextRequest) {
  try {
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
            // API route - cookies handled differently
          },
        },
      }
    );

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's creator profile
    const { data: creator, error: creatorError } = await supabase
      .from('studio_creators')
      .select('id, status')
      .eq('user_id', user.id)
      .single();

    // Check if user has studio access (creator OR org member)
    let hasAccess = creator?.status === 'approved';
    
    if (!hasAccess) {
      const { data: membership } = await supabase
        .from('organization_memberships')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .single();
      
      hasAccess = !!membership;
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Studio access required' }, { status: 403 });
    }

    // If user doesn't have a creator profile yet, create one
    let creatorId = creator?.id;
    
    if (!creatorId) {
      // Get user profile for display name
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const { data: newCreator, error: createError } = await supabase
        .from('studio_creators')
        .insert({
          user_id: user.id,
          display_name: profile?.full_name || user.email,
          status: 'approved', // Auto-approve org members
        })
        .select('id')
        .single();

      if (createError) {
        console.error('[Studio API] Error creating creator profile:', createError);
        return NextResponse.json({ error: 'Failed to create creator profile' }, { status: 500 });
      }

      creatorId = newCreator.id;
    }

    // Parse request body
    const body = await request.json();
    const { content_type, title, description, specialty, status, content_data, metadata } = body;

    // Validate required fields
    if (!content_type || !title) {
      return NextResponse.json({ error: 'content_type and title are required' }, { status: 400 });
    }

    // Validate content_type
    const validTypes = ['running_board_case', 'clinical_case', 'conversation', 'ekg_scenario'];
    if (!validTypes.includes(content_type)) {
      return NextResponse.json({ error: 'Invalid content_type' }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['draft', 'review'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Insert content
    const { data: content, error: insertError } = await supabase
      .from('studio_content')
      .insert({
        creator_id: creatorId,
        content_type,
        title,
        description,
        specialty,
        status: status || 'draft',
        content_data: content_data || {},
        metadata: metadata || {},
      })
      .select('id, created_at')
      .single();

    if (insertError) {
      console.error('[Studio API] Error inserting content:', insertError);
      return NextResponse.json({ error: 'Failed to create content' }, { status: 500 });
    }

    // Update creator's content count
    await supabase.rpc('increment_content_count', { creator_id: creatorId });

    return NextResponse.json({
      id: content.id,
      message: 'Content created successfully',
      created_at: content.created_at,
    });

  } catch (error) {
    console.error('[Studio API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/studio/content - List user's content
export async function GET(request: NextRequest) {
  try {
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
            // API route - cookies handled differently
          },
        },
      }
    );

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get('type');
    const status = searchParams.get('status');

    // Get user's creator profile
    const { data: creator } = await supabase
      .from('studio_creators')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!creator) {
      return NextResponse.json({ content: [] });
    }

    // Build query
    let query = supabase
      .from('studio_content')
      .select('*')
      .eq('creator_id', creator.id)
      .order('updated_at', { ascending: false });

    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: content, error: queryError } = await query;

    if (queryError) {
      console.error('[Studio API] Error fetching content:', queryError);
      return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
    }

    return NextResponse.json({ content: content || [] });

  } catch (error) {
    console.error('[Studio API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
