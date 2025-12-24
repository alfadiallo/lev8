import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the first program (in production, from user context)
    const { data: programs } = await supabase
      .from('programs')
      .select('id')
      .limit(1);

    const programId = programs?.[0]?.id;

    if (!programId) {
      return NextResponse.json({ actionItems: [] });
    }

    // Fetch action items for this program's compliance statuses
    const { data: actionItems, error } = await supabase
      .from('acgme_action_items')
      .select(`
        *,
        compliance_status:acgme_compliance_status!inner(
          program_id,
          requirement_id,
          requirement:acgme_requirements(id, title)
        )
      `)
      .eq('compliance_status.program_id', programId)
      .order('due_date', { ascending: true, nullsFirst: false });

    if (error) {
      console.error('Action items fetch error:', error);
      throw error;
    }

    // Fetch assigned user info
    const userIds = [...new Set(actionItems?.map(a => a.assigned_to).filter(Boolean))];
    const userMap: Record<string, { full_name: string; email: string }> = {};

    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      if (users) {
        users.forEach(u => {
          userMap[u.user_id] = { full_name: u.full_name, email: u.email };
        });
      }
    }

    // Enhance action items with user info
    const enhancedItems = (actionItems || []).map(item => ({
      ...item,
      assigned_user: item.assigned_to ? userMap[item.assigned_to] : null,
    }));

    return NextResponse.json({ actionItems: enhancedItems });
  } catch (error) {
    console.error('Action items API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch action items' },
      { status: 500 }
    );
  }
}

