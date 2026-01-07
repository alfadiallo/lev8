// API Route: Running Board Session Debrief
// GET /api/running-board/sessions/[id]/debrief - Get debrief with auto-generated summary
// POST /api/running-board/sessions/[id]/debrief - Save debrief

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getServiceSupabaseClient } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';

// Type for running board action
interface RunningBoardAction {
  id: string;
  session_id: string;
  case_id: string;
  phase_id: number;
  checklist_item_id: string;
  checked: boolean;
  is_critical: boolean;
  time_completed?: string;
}

// Helper function to generate auto-summary from actions
async function generateAutoSummary(sessionId: string, supabase: SupabaseClient) {
  // Fetch all actions for the session
  const { data: actions } = await supabase
    .from('running_board_actions')
    .select('*')
    .eq('session_id', sessionId);

  // Fetch session cases to get case details for missed items
  const { data: sessionCases } = await supabase
    .from('running_board_session_cases')
    .select(`
      case:running_board_cases(id, title, timeline)
    `)
    .eq('session_id', sessionId);

  const allActions: RunningBoardAction[] = actions || [];
  
  // Type for session case with nested case data (Supabase returns case as object or array depending on join)
  interface SessionCase {
    case: {
      id: string;
      title: string;
      timeline: Array<{ phase_id: number; checklist: Array<{ id: string; label: string }> }>;
    } | null;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cases: SessionCase[] = (sessionCases as any) || [];

  // Count totals
  const totalActions = allActions.length;
  const completedActions = allActions.filter(a => a.checked).length;
  const criticalActions = allActions.filter(a => a.is_critical);
  const criticalActionsTotal = criticalActions.length;
  const criticalActionsMissed = criticalActions.filter(a => !a.checked).length;

  // Build missed critical items list with case info
  const missedCriticalItems: { case_id: string; case_title: string; item_id: string; label: string; phase_id: number }[] = [];
  
  for (const action of criticalActions.filter(a => !a.checked)) {
    const sessionCase = cases.find(sc => sc.case?.id === action.case_id);
    if (sessionCase?.case) {
      const timeline = sessionCase.case.timeline;
      const phase = timeline.find((p) => p.phase_id === action.phase_id);
      const item = phase?.checklist.find((i) => i.id === action.checklist_item_id);
      
      missedCriticalItems.push({
        case_id: action.case_id,
        case_title: sessionCase.case.title,
        item_id: action.checklist_item_id,
        label: item?.label || 'Unknown action',
        phase_id: action.phase_id,
      });
    }
  }

  return {
    total_actions: totalActions,
    completed_actions: completedActions,
    critical_actions_total: criticalActionsTotal,
    critical_actions_missed: criticalActionsMissed,
    missed_critical_items: missedCriticalItems,
    completion_percentage: totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0,
  };
}

// GET /api/running-board/sessions/[id]/debrief - Get debrief
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    
    const cookieStore = await cookies();
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
            cookiesToSet.forEach(({ name: _name, value: _value, options: _options }) => {
              // Read-only in GET request
            });
          },
        },
      }
    );

    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getServiceSupabaseClient();

    // Fetch existing debrief
    const { data: existingDebrief } = await supabase
      .from('running_board_debriefs')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    // Generate auto-summary (always fresh)
    const autoSummary = await generateAutoSummary(sessionId, supabase);

    if (existingDebrief) {
      // Merge auto-summary with saved debrief
      return NextResponse.json({
        debrief: {
          ...existingDebrief,
          ...autoSummary, // Override with fresh calculations
        },
      }, { status: 200 });
    }

    // Return just the auto-summary if no debrief saved yet
    return NextResponse.json({
      debrief: {
        session_id: sessionId,
        ...autoSummary,
        strengths: [],
        areas_for_improvement: [],
        overall_score: null,
        facilitator_notes: null,
        discussion_points_covered: [],
      },
    }, { status: 200 });
  } catch (error) {
    console.error('[RunningBoardDebrief] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/running-board/sessions/[id]/debrief - Save debrief
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    
    const cookieStore = await cookies();
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
            cookiesToSet.forEach(({ name: _name, value: _value, options: _options }) => {
              // Read-only in POST request
            });
          },
        },
      }
    );

    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getServiceSupabaseClient();

    // Verify user is the facilitator
    const { data: session } = await supabase
      .from('running_board_sessions')
      .select('facilitator_id')
      .eq('id', sessionId)
      .single();

    if (!session || session.facilitator_id !== user.id) {
      return NextResponse.json({ error: 'Only facilitator can save debrief' }, { status: 403 });
    }

    const body = await request.json();
    const {
      strengths,
      areas_for_improvement,
      overall_score,
      facilitator_notes,
      discussion_points_covered,
      recommended_cases,
      follow_up_date,
    } = body;

    // Generate auto-summary
    const autoSummary = await generateAutoSummary(sessionId, supabase);

    // Check if debrief already exists
    const { data: existingDebrief } = await supabase
      .from('running_board_debriefs')
      .select('id')
      .eq('session_id', sessionId)
      .single();

    const debriefData = {
      session_id: sessionId,
      ...autoSummary,
      strengths: strengths || [],
      areas_for_improvement: areas_for_improvement || [],
      overall_score: overall_score || null,
      facilitator_notes: facilitator_notes || null,
      discussion_points_covered: discussion_points_covered || [],
      recommended_cases: recommended_cases || [],
      follow_up_date: follow_up_date || null,
    };

    let result;

    if (existingDebrief) {
      // Update existing debrief
      const { data, error } = await supabase
        .from('running_board_debriefs')
        .update(debriefData)
        .eq('id', existingDebrief.id)
        .select()
        .single();

      if (error) {
        console.error('[RunningBoardDebrief] Error updating debrief:', error);
        return NextResponse.json({ error: 'Failed to update debrief' }, { status: 500 });
      }
      result = data;
    } else {
      // Create new debrief
      const { data, error } = await supabase
        .from('running_board_debriefs')
        .insert(debriefData)
        .select()
        .single();

      if (error) {
        console.error('[RunningBoardDebrief] Error creating debrief:', error);
        return NextResponse.json({ error: 'Failed to create debrief' }, { status: 500 });
      }
      result = data;
    }

    return NextResponse.json({ debrief: result }, { status: existingDebrief ? 200 : 201 });
  } catch (error) {
    console.error('[RunningBoardDebrief] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
