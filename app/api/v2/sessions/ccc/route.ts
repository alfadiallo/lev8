/**
 * V2 CCC Sessions API
 * 
 * GET /api/v2/sessions/ccc - List CCC sessions
 * POST /api/v2/sessions/ccc - Create a new CCC session
 * 
 * Query params (GET):
 * - status: Filter by status ('scheduled', 'in_progress', 'completed')
 * - include_residents: Include resident details (default: false)
 * 
 * Role-based behavior:
 * - Residents: No access
 * - Faculty: See sessions they facilitated or attended
 * - Leadership: See all sessions in their program
 */

import { NextRequest, NextResponse } from 'next/server';
import { withTenantAuth, TenantAuthContext } from '@/lib/api/withTenantAuth';
import { shapeCCCSessions } from '@/lib/api/dataShaping';

async function handleGet(
  request: NextRequest,
  ctx: TenantAuthContext
): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const includeResidents = searchParams.get('include_residents') === 'true';

  // Build query
  let query = ctx.supabase
    .from('ccc_sessions')
    .select(`
      id,
      title,
      session_date,
      status,
      facilitator_id,
      attendees,
      notes,
      created_at,
      updated_at
    `)
    .eq('program_id', ctx.programId)
    .order('session_date', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data: sessions, error } = await query;

  if (error) {
    console.error('[V2 CCC Sessions] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CCC sessions' },
      { status: 500 }
    );
  }

  // Shape based on role (faculty only sees their sessions)
  const shapedSessions = shapeCCCSessions(
    (sessions || []).map(s => ({
      ...s,
      facilitatorId: s.facilitator_id,
    })),
    ctx
  );

  // Get facilitator names
  const facilitatorIds = [...new Set(shapedSessions.map(s => s.facilitator_id).filter(Boolean))];
  let facilitatorMap = new Map<string, string>();
  
  if (facilitatorIds.length > 0) {
    const { data: facilitators } = await ctx.supabase
      .from('user_profiles')
      .select('id, full_name')
      .in('id', facilitatorIds);
    
    facilitatorMap = new Map((facilitators || []).map(f => [f.id, f.full_name]));
  }

  // Get resident counts per session if requested
  let residentCounts = new Map<string, number>();
  if (!includeResidents) {
    const { data: discussions } = await ctx.supabase
      .from('ccc_resident_discussions')
      .select('session_id')
      .in('session_id', shapedSessions.map(s => s.id));

    for (const d of (discussions || [])) {
      residentCounts.set(d.session_id, (residentCounts.get(d.session_id) || 0) + 1);
    }
  }

  // Transform response
  const transformedSessions = shapedSessions.map(session => ({
    id: session.id,
    title: session.title,
    sessionDate: session.session_date,
    status: session.status,
    facilitatorId: session.facilitator_id,
    facilitatorName: facilitatorMap.get(session.facilitator_id) || 'Unknown',
    attendeeCount: session.attendees?.length || 0,
    residentCount: residentCounts.get(session.id) || 0,
    notes: ctx.isProgramLeadership ? session.notes : undefined,
    createdAt: session.created_at,
  }));

  return NextResponse.json({
    sessions: transformedSessions,
    meta: {
      total: transformedSessions.length,
      programId: ctx.programId,
    },
  });
}

async function handlePost(
  request: NextRequest,
  ctx: TenantAuthContext
): Promise<NextResponse> {
  // Only leadership can create sessions
  if (!ctx.isProgramLeadership) {
    return NextResponse.json(
      { error: 'Only program leadership can create CCC sessions' },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { title, sessionDate, attendees, notes } = body;

  if (!title || !sessionDate) {
    return NextResponse.json(
      { error: 'title and sessionDate are required' },
      { status: 400 }
    );
  }

  const { data: session, error } = await ctx.supabase
    .from('ccc_sessions')
    .insert({
      program_id: ctx.programId,
      title,
      session_date: sessionDate,
      status: 'scheduled',
      facilitator_id: ctx.user.id,
      attendees: attendees || [],
      notes: notes || '',
    })
    .select()
    .single();

  if (error) {
    console.error('[V2 CCC Sessions] Create error:', error);
    return NextResponse.json(
      { error: 'Failed to create CCC session' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    session: {
      id: session.id,
      title: session.title,
      sessionDate: session.session_date,
      status: session.status,
      facilitatorId: session.facilitator_id,
    },
    message: 'CCC session created successfully',
  }, { status: 201 });
}

// Export handlers - faculty can view, but residents cannot
export const GET = withTenantAuth(handleGet, { minimumRole: 'faculty' });
export const POST = withTenantAuth(handlePost, { minimumRole: 'faculty' });
