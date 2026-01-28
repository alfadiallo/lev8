/**
 * V2 CCC Session Detail API
 * 
 * GET /api/v2/sessions/ccc/[id] - Get session details with resident discussions
 * PATCH /api/v2/sessions/ccc/[id] - Update session
 * DELETE /api/v2/sessions/ccc/[id] - Delete session
 * 
 * Role-based behavior:
 * - Residents: No access
 * - Faculty: Can view sessions they participated in
 * - Leadership: Full access to all sessions
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
  const { id: sessionId } = await routeCtx.params;

  // Fetch session - super_admin can access any session
  let query = ctx.supabase
    .from('ccc_sessions')
    .select('*')
    .eq('id', sessionId);
  
  // If not super_admin, require program_id match
  if (!ctx.isAdmin && ctx.programId) {
    query = query.eq('program_id', ctx.programId);
  }

  const { data: session, error } = await query.single();

  if (error || !session) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  }

  // Check access for non-leadership
  if (!ctx.isProgramLeadership) {
    const isParticipant = 
      session.facilitator_id === ctx.user.id ||
      session.attendees?.includes(ctx.user.id);
    
    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Access denied to this session' },
        { status: 403 }
      );
    }
  }

  // Get facilitator name
  const { data: facilitator } = await ctx.supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', session.facilitator_id)
    .single();

  // Get resident discussions
  const { data: discussions } = await ctx.supabase
    .from('ccc_resident_discussions')
    .select(`
      id,
      resident_id,
      discussion_notes,
      recommendations,
      action_items,
      status,
      created_at
    `)
    .eq('session_id', sessionId);

  // Get resident details for discussions
  const residentIds = [...new Set((discussions || []).map(d => d.resident_id))];
  let residentMap = new Map<string, { name: string; anonCode: string; pgyLevel: number }>();

  if (residentIds.length > 0) {
    const { data: residents } = await ctx.supabase
      .from('residents')
      .select(`
        id,
        anon_code,
        user_profiles:user_id (full_name),
        classes:class_id (graduation_year)
      `)
      .in('id', residentIds);

    for (const r of (residents || [])) {
      const profile = r.user_profiles as { full_name: string } | null;
      const classInfo = r.classes as { graduation_year: number } | null;
      const gradYear = classInfo?.graduation_year || new Date().getFullYear() + 3;
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      const academicYear = currentMonth >= 6 ? currentYear + 1 : currentYear;
      const pgyLevel = academicYear - gradYear + 4;

      residentMap.set(r.id, {
        name: profile?.full_name || 'Unknown',
        anonCode: r.anon_code,
        pgyLevel: Math.max(1, Math.min(pgyLevel, 4)),
      });
    }
  }

  // Transform discussions
  const transformedDiscussions = (discussions || []).map(d => {
    const resident = residentMap.get(d.resident_id);
    return {
      id: d.id,
      residentId: d.resident_id,
      residentName: resident?.name || 'Unknown',
      anonCode: resident?.anonCode || '',
      pgyLevel: resident?.pgyLevel || 0,
      notes: d.discussion_notes,
      recommendations: d.recommendations,
      actionItems: d.action_items,
      status: d.status,
      createdAt: d.created_at,
    };
  });

  return NextResponse.json({
    session: {
      id: session.id,
      title: session.title,
      sessionDate: session.session_date,
      status: session.status,
      facilitatorId: session.facilitator_id,
      facilitatorName: facilitator?.full_name || 'Unknown',
      attendees: session.attendees || [],
      notes: session.notes,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
    },
    discussions: transformedDiscussions,
    meta: {
      totalDiscussions: transformedDiscussions.length,
    },
  });
}

async function handlePatch(
  request: NextRequest,
  ctx: TenantAuthContext,
  routeCtx: RouteContext
): Promise<NextResponse> {
  const { id: sessionId } = await routeCtx.params;

  console.log('[V2 CCC Session PATCH] Auth context:', {
    userId: ctx.user?.id,
    role: ctx.role,
    isAdmin: ctx.isAdmin,
    isProgramLeadership: ctx.isProgramLeadership,
    programId: ctx.programId,
    healthSystemId: ctx.healthSystemId,
  });

  // Only leadership can update sessions
  if (!ctx.isProgramLeadership) {
    return NextResponse.json(
      { error: 'Only program leadership can update CCC sessions' },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { title, sessionDate, status, attendees, notes, sessionType, durationMinutes } = body;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (title !== undefined) updates.title = title;
  if (sessionDate !== undefined) updates.session_date = sessionDate;
  if (status !== undefined) updates.status = status;
  if (attendees !== undefined) updates.attendees = attendees;
  if (notes !== undefined) updates.notes = notes;
  if (sessionType !== undefined) updates.session_type = sessionType;
  if (durationMinutes !== undefined) updates.duration_minutes = durationMinutes;

  // Build query - super_admin can update any session
  let query = ctx.supabase
    .from('ccc_sessions')
    .update(updates)
    .eq('id', sessionId);
  
  // If not super_admin, require program_id match
  if (!ctx.isAdmin && ctx.programId) {
    query = query.eq('program_id', ctx.programId);
  }

  const { data: session, error } = await query.select().single();

  if (error || !session) {
    console.error('[V2 CCC Session] Update error:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    session: {
      id: session.id,
      title: session.title,
      sessionDate: session.session_date,
      status: session.status,
    },
    message: 'Session updated successfully',
  });
}

async function handleDelete(
  _request: NextRequest,
  ctx: TenantAuthContext,
  routeCtx: RouteContext
): Promise<NextResponse> {
  const { id: sessionId } = await routeCtx.params;

  // Only leadership can delete sessions
  if (!ctx.isProgramLeadership) {
    return NextResponse.json(
      { error: 'Only program leadership can delete CCC sessions' },
      { status: 403 }
    );
  }

  // Build delete query - super_admin can delete any session
  let deleteQuery = ctx.supabase
    .from('ccc_sessions')
    .delete()
    .eq('id', sessionId);
  
  // If not super_admin, require program_id match
  if (!ctx.isAdmin && ctx.programId) {
    deleteQuery = deleteQuery.eq('program_id', ctx.programId);
  }

  const { error } = await deleteQuery;

  if (error) {
    console.error('[V2 CCC Session] Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: 'Session deleted successfully',
  });
}

// Wrap handlers to pass route context
export const GET = (request: NextRequest, routeCtx: RouteContext) => {
  return withTenantAuth(
    (req, ctx) => handleGet(req, ctx, routeCtx),
    { minimumRole: 'faculty' }
  )(request);
};

export const PATCH = (request: NextRequest, routeCtx: RouteContext) => {
  return withTenantAuth(
    (req, ctx) => handlePatch(req, ctx, routeCtx),
    { minimumRole: 'faculty' }
  )(request);
};

export const DELETE = (request: NextRequest, routeCtx: RouteContext) => {
  return withTenantAuth(
    (req, ctx) => handleDelete(req, ctx, routeCtx),
    { minimumRole: 'faculty' }
  )(request);
};
