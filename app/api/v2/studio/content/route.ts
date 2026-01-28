/**
 * V2 Studio Content API
 * 
 * GET /api/v2/studio/content - List studio content
 * POST /api/v2/studio/content - Create new content (draft)
 * 
 * Query params (GET):
 * - type: Filter by content type (running_board_case, clinical_case, conversation, ekg_scenario)
 * - status: Filter by status (draft, review, published, archived)
 * - mine: If 'true', only show user's own content
 * 
 * Access rules:
 * - Published content is visible to users of the same specialty
 * - Draft/review content is only visible to the creator
 * - Only approved Studio creators can publish
 */

import { NextRequest, NextResponse } from 'next/server';
import { withTenantAuth, TenantAuthContext } from '@/lib/api/withTenantAuth';

type ContentType = 'running_board_case' | 'clinical_case' | 'conversation' | 'ekg_scenario';
type ContentStatus = 'draft' | 'review' | 'published' | 'archived';

async function handleGet(
  request: NextRequest,
  ctx: TenantAuthContext
): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') as ContentType | null;
  const status = searchParams.get('status') as ContentStatus | null;
  const mine = searchParams.get('mine') === 'true';

  // Build query
  let query = ctx.supabase
    .from('studio_content')
    .select(`
      id,
      creator_id,
      content_type,
      title,
      description,
      specialty,
      status,
      version,
      published_at,
      view_count,
      use_count,
      rating_avg,
      rating_count,
      created_at,
      updated_at,
      studio_creators!studio_content_creator_id_fkey (
        display_name,
        affiliation
      )
    `)
    .order('updated_at', { ascending: false });

  // Filter by type
  if (type) {
    query = query.eq('content_type', type);
  }

  // Filter by status
  if (status) {
    query = query.eq('status', status);
  }

  // If user only wants their own content
  if (mine && ctx.studioCreatorId) {
    query = query.eq('creator_id', ctx.studioCreatorId);
  } else if (!mine) {
    // For browsing, show:
    // 1. User's own content (all statuses)
    // 2. Published content matching user's specialty
    
    if (ctx.studioCreatorId) {
      // Complex filter: own content OR (published AND matching specialty)
      // Supabase doesn't support OR with different conditions easily,
      // so we'll fetch and filter in memory
    }
  }

  const { data: content, error } = await query;

  if (error) {
    console.error('[V2 Studio Content] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch studio content' },
      { status: 500 }
    );
  }

  // Filter content based on access rules
  const filteredContent = (content || []).filter((item: Record<string, unknown>) => {
    const isOwner = ctx.studioCreatorId && item.creator_id === ctx.studioCreatorId;
    const isPublished = item.status === 'published';
    const matchesSpecialty = !item.specialty || 
      !ctx.specialty || 
      (item.specialty as string).toLowerCase() === ctx.specialty.toLowerCase();

    // Owner can see all their content
    if (isOwner) return true;
    
    // Others can only see published content that matches their specialty
    if (isPublished && matchesSpecialty) return true;
    
    // Admin can see everything
    if (ctx.isAdmin) return true;

    return false;
  });

  // Transform response
  const transformedContent = filteredContent.map((item: Record<string, unknown>) => {
    const creator = item.studio_creators as { display_name: string; affiliation: string } | null;
    return {
      id: item.id,
      type: item.content_type,
      title: item.title,
      description: item.description,
      specialty: item.specialty,
      status: item.status,
      version: item.version,
      creator: {
        id: item.creator_id,
        displayName: creator?.display_name || 'Anonymous',
        affiliation: creator?.affiliation,
      },
      stats: {
        views: item.view_count,
        uses: item.use_count,
        rating: item.rating_avg,
        ratingCount: item.rating_count,
      },
      publishedAt: item.published_at,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      isOwner: ctx.studioCreatorId === item.creator_id,
    };
  });

  return NextResponse.json({
    content: transformedContent,
    meta: {
      total: transformedContent.length,
      userSpecialty: ctx.specialty,
      isCreator: ctx.isStudioCreator,
    },
  });
}

async function handlePost(
  request: NextRequest,
  ctx: TenantAuthContext
): Promise<NextResponse> {
  // Must be an approved studio creator
  if (!ctx.isStudioCreator || !ctx.studioCreatorId) {
    return NextResponse.json(
      { error: 'You must be an approved Studio creator to create content' },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { type, title, description, specialty, contentData } = body;

  if (!type || !title) {
    return NextResponse.json(
      { error: 'type and title are required' },
      { status: 400 }
    );
  }

  const validTypes: ContentType[] = ['running_board_case', 'clinical_case', 'conversation', 'ekg_scenario'];
  if (!validTypes.includes(type)) {
    return NextResponse.json(
      { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
      { status: 400 }
    );
  }

  const { data: content, error } = await ctx.supabase
    .from('studio_content')
    .insert({
      creator_id: ctx.studioCreatorId,
      content_type: type,
      title,
      description: description || '',
      specialty: specialty || ctx.specialty || 'Emergency Medicine',
      status: 'draft',
      content_data: contentData || {},
      metadata: {},
      version: 1,
      view_count: 0,
      use_count: 0,
      rating_count: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('[V2 Studio Content] Create error:', error);
    return NextResponse.json(
      { error: 'Failed to create content' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    content: {
      id: content.id,
      type: content.content_type,
      title: content.title,
      status: content.status,
    },
    message: 'Content created as draft',
  }, { status: 201 });
}

// Studio content requires authentication but not necessarily tenant context
export const GET = withTenantAuth(handleGet, { 
  requireTenant: false,
  allowResident: true, // Residents can browse published content
});

export const POST = withTenantAuth(handlePost, { 
  requireTenant: false,
  minimumRole: 'faculty', // Must be faculty to create
});
