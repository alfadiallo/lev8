import { NextRequest, NextResponse } from 'next/server';
import { requireFacultyOrAbove } from '@/lib/auth/checkApiPermission';
import { getServiceSupabaseClient } from '@/lib/supabase/server';

// GET /api/resident-notes - Fetch notes for a resident
export async function GET(request: NextRequest) {
  // Require faculty or above to view resident notes
  const authResult = await requireFacultyOrAbove(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  // Use service role client for admin operations (bypasses RLS)
  const supabase = getServiceSupabaseClient();

  try {
    const { searchParams } = new URL(request.url);
    const residentId = searchParams.get('resident_id');
    const sourceType = searchParams.get('source_type');
    const noteType = searchParams.get('note_type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!residentId) {
      return NextResponse.json(
        { error: 'resident_id is required' },
        { status: 400 }
      );
    }

    // First check if table exists by trying a simple query
    let query = supabase
      .from('resident_notes')
      .select('*')
      .eq('resident_id', residentId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Optional filters
    if (sourceType) {
      query = query.eq('source_type', sourceType);
    }
    if (noteType) {
      query = query.eq('note_type', noteType);
    }

    const { data, error, count } = await query;

    if (error) {
      // If table doesn't exist, return empty array (migration not run yet)
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.log('[ResidentNotes] Table does not exist yet, returning empty');
        return NextResponse.json({ notes: [], count: 0 });
      }
      console.error('[ResidentNotes] GET error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      notes: data || [],
      count: count || data?.length || 0
    });
  } catch (err) {
    console.error('[ResidentNotes] GET exception:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/resident-notes - Create a new note
export async function POST(request: NextRequest) {
  // Require faculty or above to create resident notes
  const authResult = await requireFacultyOrAbove(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const body = await request.json();
    const {
      resident_id,
      source_type = 'portal_review',
      source_id,
      note_type = 'general',
      note_text,
      is_confidential = false,
      created_by
    } = body;

    // Validation
    if (!resident_id) {
      return NextResponse.json(
        { error: 'resident_id is required' },
        { status: 400 }
      );
    }

    if (!note_text?.trim()) {
      return NextResponse.json(
        { error: 'note_text is required' },
        { status: 400 }
      );
    }

    // Validate source_type
    const validSourceTypes = ['portal_review', 'ccc_session', 'one_on_one', 'voice_memo'];
    if (!validSourceTypes.includes(source_type)) {
      return NextResponse.json(
        { error: `Invalid source_type. Must be one of: ${validSourceTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate note_type
    const validNoteTypes = [
      'general', 'strength', 'weakness', 'opportunity', 'threat',
      'action_item', 'milestone_note', 'committee_decision'
    ];
    if (!validNoteTypes.includes(note_type)) {
      return NextResponse.json(
        { error: `Invalid note_type. Must be one of: ${validNoteTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('resident_notes')
      .insert({
        resident_id,
        source_type,
        source_id: source_id || null,
        note_type,
        note_text: note_text.trim(),
        is_confidential,
        created_by: created_by || null
      })
      .select()
      .single();

    if (error) {
      // If table doesn't exist, return helpful error
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.log('[ResidentNotes] Table does not exist yet');
        return NextResponse.json(
          { error: 'Notes table not set up. Please run database migrations.' },
          { status: 503 }
        );
      }
      console.error('[ResidentNotes] POST error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ note: data }, { status: 201 });
  } catch (err) {
    console.error('[ResidentNotes] POST exception:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/resident-notes - Update a note
export async function PATCH(request: NextRequest) {
  // Require faculty or above to update resident notes
  const authResult = await requireFacultyOrAbove(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const body = await request.json();
    const { id, note_text, note_type, is_confidential } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Note id is required' },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    
    if (note_text !== undefined) {
      updates.note_text = note_text.trim();
    }
    if (note_type !== undefined) {
      const validNoteTypes = [
        'general', 'strength', 'weakness', 'opportunity', 'threat',
        'action_item', 'milestone_note', 'committee_decision'
      ];
      if (!validNoteTypes.includes(note_type)) {
        return NextResponse.json(
          { error: `Invalid note_type. Must be one of: ${validNoteTypes.join(', ')}` },
          { status: 400 }
        );
      }
      updates.note_type = note_type;
    }
    if (is_confidential !== undefined) {
      updates.is_confidential = is_confidential;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('resident_notes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[ResidentNotes] PATCH error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ note: data });
  } catch (err) {
    console.error('[ResidentNotes] PATCH exception:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/resident-notes - Delete a note
export async function DELETE(request: NextRequest) {
  // Require faculty or above to delete resident notes
  const authResult = await requireFacultyOrAbove(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Note id is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('resident_notes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[ResidentNotes] DELETE error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[ResidentNotes] DELETE exception:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}





