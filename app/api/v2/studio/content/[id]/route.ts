/**
 * V2 Studio Content Detail API
 * 
 * GET /api/v2/studio/content/[id] - Get content details
 * PATCH /api/v2/studio/content/[id] - Update content
 * DELETE /api/v2/studio/content/[id] - Delete content (owner or admin only)
 * 
 * Access rules:
 * - Published content: Anyone with matching specialty
 * - Draft/review: Owner only
 * - Publish action: Approved creators only
 */

import { NextRequest, NextResponse } from 'next/server';
import { withTenantAuth, TenantAuthContext } from '@/lib/api/withTenantAuth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function handleGet(
  _request: NextRequest,
  ctx: TenantAuthContext,
  routeCtx: RouteContext
): Promise<NextResponse> {
  const { id: contentId } = await routeCtx.params;

  // Fetch content
  const { data: content, error } = await ctx.supabase
    .from('studio_content')
    .select(`
      *,
      studio_creators!studio_content_creator_id_fkey (
        display_name,
        affiliation,
        specialty
      )
    `)
    .eq('id', contentId)
    .single();

  if (error || !content) {
    return NextResponse.json(
      { error: 'Content not found' },
      { status: 404 }
    );
  }

  // Check access
  const isOwner = ctx.studioCreatorId && content.creator_id === ctx.studioCreatorId;
  const isPublished = content.status === 'published';
  const matchesSpecialty = !content.specialty || 
    !ctx.specialty || 
    content.specialty.toLowerCase() === ctx.specialty.toLowerCase();

  if (!isOwner && !ctx.isAdmin) {
    if (!isPublished) {
      return NextResponse.json(
        { error: 'This content is not published' },
        { status: 403 }
      );
    }
    if (!matchesSpecialty) {
      return NextResponse.json(
        { error: 'This content is not available for your specialty' },
        { status: 403 }
      );
    }
  }

  // Increment view count for non-owners
  if (!isOwner) {
    await ctx.supabase
      .from('studio_content')
      .update({ view_count: (content.view_count || 0) + 1 })
      .eq('id', contentId);
  }

  const creator = content.studio_creators as { display_name: string; affiliation: string; specialty: string } | null;

  return NextResponse.json({
    content: {
      id: content.id,
      type: content.content_type,
      title: content.title,
      description: content.description,
      specialty: content.specialty,
      status: content.status,
      version: content.version,
      contentData: content.content_data,
      metadata: content.metadata,
      creator: {
        id: content.creator_id,
        displayName: creator?.display_name || 'Anonymous',
        affiliation: creator?.affiliation,
        specialty: creator?.specialty,
      },
      stats: {
        views: content.view_count,
        uses: content.use_count,
        rating: content.rating_avg,
        ratingCount: content.rating_count,
      },
      publishedAt: content.published_at,
      createdAt: content.created_at,
      updatedAt: content.updated_at,
    },
    permissions: {
      canEdit: isOwner || ctx.isAdmin,
      canDelete: isOwner || ctx.isAdmin,
      canPublish: isOwner && ctx.canPublishStudioContent,
      isOwner,
    },
  });
}

async function handlePatch(
  request: NextRequest,
  ctx: TenantAuthContext,
  routeCtx: RouteContext
): Promise<NextResponse> {
  const { id: contentId } = await routeCtx.params;

  // Fetch current content
  const { data: content, error: fetchError } = await ctx.supabase
    .from('studio_content')
    .select('creator_id, status')
    .eq('id', contentId)
    .single();

  if (fetchError || !content) {
    return NextResponse.json(
      { error: 'Content not found' },
      { status: 404 }
    );
  }

  // Check ownership
  const isOwner = ctx.studioCreatorId && content.creator_id === ctx.studioCreatorId;
  if (!isOwner && !ctx.isAdmin) {
    return NextResponse.json(
      { error: 'You can only edit your own content' },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { title, description, specialty, contentData, metadata, status } = body;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (specialty !== undefined) updates.specialty = specialty;
  if (contentData !== undefined) updates.content_data = contentData;
  if (metadata !== undefined) updates.metadata = metadata;

  // Handle status change
  if (status !== undefined && status !== content.status) {
    // Can only publish if approved creator
    if (status === 'published' && !ctx.canPublishStudioContent) {
      return NextResponse.json(
        { error: 'You must be an approved Studio creator to publish content' },
        { status: 403 }
      );
    }
    
    updates.status = status;
    
    // Set published_at on first publish
    if (status === 'published' && content.status !== 'published') {
      updates.published_at = new Date().toISOString();
    }
  }

  const { data: updated, error: updateError } = await ctx.supabase
    .from('studio_content')
    .update(updates)
    .eq('id', contentId)
    .select()
    .single();

  if (updateError) {
    console.error('[V2 Studio Content] Update error:', updateError);
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    content: {
      id: updated.id,
      title: updated.title,
      status: updated.status,
      updatedAt: updated.updated_at,
    },
    message: status === 'published' ? 'Content published successfully' : 'Content updated',
  });
}

async function handleDelete(
  _request: NextRequest,
  ctx: TenantAuthContext,
  routeCtx: RouteContext
): Promise<NextResponse> {
  const { id: contentId } = await routeCtx.params;

  // Fetch current content
  const { data: content, error: fetchError } = await ctx.supabase
    .from('studio_content')
    .select('creator_id')
    .eq('id', contentId)
    .single();

  if (fetchError || !content) {
    return NextResponse.json(
      { error: 'Content not found' },
      { status: 404 }
    );
  }

  // Check ownership
  const isOwner = ctx.studioCreatorId && content.creator_id === ctx.studioCreatorId;
  if (!isOwner && !ctx.isAdmin) {
    return NextResponse.json(
      { error: 'You can only delete your own content' },
      { status: 403 }
    );
  }

  const { error: deleteError } = await ctx.supabase
    .from('studio_content')
    .delete()
    .eq('id', contentId);

  if (deleteError) {
    console.error('[V2 Studio Content] Delete error:', deleteError);
    return NextResponse.json(
      { error: 'Failed to delete content' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: 'Content deleted successfully',
  });
}

// Wrap handlers to pass route context
export const GET = (request: NextRequest, routeCtx: RouteContext) => {
  return withTenantAuth(
    (req, ctx) => handleGet(req, ctx, routeCtx),
    { requireTenant: false, allowResident: true }
  )(request);
};

export const PATCH = (request: NextRequest, routeCtx: RouteContext) => {
  return withTenantAuth(
    (req, ctx) => handlePatch(req, ctx, routeCtx),
    { requireTenant: false, minimumRole: 'faculty' }
  )(request);
};

export const DELETE = (request: NextRequest, routeCtx: RouteContext) => {
  return withTenantAuth(
    (req, ctx) => handleDelete(req, ctx, routeCtx),
    { requireTenant: false, minimumRole: 'faculty' }
  )(request);
};
