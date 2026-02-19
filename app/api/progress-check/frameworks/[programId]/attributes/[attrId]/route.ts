import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

/**
 * PATCH /api/progress-check/frameworks/[programId]/attributes/[attrId]
 * Update an attribute's name, description, and tags.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ programId: string; attrId: string }> }
) {
  try {
    const { attrId } = await params;
    const body = await request.json();
    const { name, description, tags } = body;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (tags !== undefined) updates.tags = tags;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('framework_attributes')
      .update(updates)
      .eq('id', attrId)
      .select()
      .single();

    if (error) {
      console.error('[framework-attr] Update error:', error);
      return NextResponse.json({ error: 'Failed to update attribute' }, { status: 500 });
    }

    return NextResponse.json({ attribute: data });
  } catch (error) {
    console.error('[framework-attr] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
