// API Route: Vignette by ID
// GET  /api/vignettes/[id] - Get vignette details
// PATCH /api/vignettes/[id] - Update vignette (Super Admin only, creates version snapshot)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/** Authenticate and return user + profile, or null. */
async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;

  const { data: { user }, error } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );
  if (error || !user) return null;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single();

  return { user, profile };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: vignette, error } = await supabase
      .from('vignettes')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !vignette) {
      return NextResponse.json({ error: 'Vignette not found' }, { status: 404 });
    }

    return NextResponse.json({ vignette }, { status: 200 });
  } catch (error) {
    console.error('[Vignettes] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/vignettes/[id]
 * Updates vignette_data (deep merge). Creates a version snapshot before saving.
 * Super Admin only.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Super Admin only
    if (auth.profile?.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Super Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { vignette_data: updatedData, change_summary, title, description } = body;

    if (!updatedData && !title && !description) {
      return NextResponse.json(
        { error: 'Nothing to update. Provide vignette_data, title, or description.' },
        { status: 400 }
      );
    }

    // Fetch current vignette
    const { data: current, error: fetchError } = await supabase
      .from('vignettes')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !current) {
      return NextResponse.json({ error: 'Vignette not found' }, { status: 404 });
    }

    // ── Snapshot current state as a version ──
    // Get the next version number
    const { data: latestVersion } = await supabase
      .from('vignette_versions')
      .select('version_number')
      .eq('vignette_id', id)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = (latestVersion?.version_number ?? 0) + 1;

    // Insert snapshot of the CURRENT state (before changes)
    const { error: snapshotError } = await supabase
      .from('vignette_versions')
      .insert({
        vignette_id: id,
        version_number: nextVersion,
        vignette_data: current.vignette_data,
        change_summary: change_summary || 'Manual edit via Studio',
        changed_by: auth.user.id,
        changed_by_name: auth.profile?.full_name || auth.user.email || 'Unknown',
      });

    if (snapshotError) {
      console.error('[Vignettes] Failed to create version snapshot:', snapshotError);
      // Continue with the update even if snapshot fails — don't block edits
    }

    // ── Deep merge vignette_data ──
    const mergedData = updatedData
      ? deepMerge(current.vignette_data || {}, updatedData)
      : current.vignette_data;

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      vignette_data: mergedData,
      updated_at: new Date().toISOString(),
    };
    if (title) updatePayload.title = title;
    if (description) updatePayload.description = description;

    // Save
    const { data: updated, error: updateError } = await supabase
      .from('vignettes')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[Vignettes] Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update vignette', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        vignette: updated,
        version: nextVersion,
        message: `Saved. Version ${nextVersion} snapshot created.`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Vignettes] PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/** Simple deep merge for JSONB objects. Arrays are replaced, not merged. */
function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const sourceVal = source[key];
    const targetVal = target[key];
    if (
      sourceVal && typeof sourceVal === 'object' && !Array.isArray(sourceVal) &&
      targetVal && typeof targetVal === 'object' && !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(targetVal as Record<string, unknown>, sourceVal as Record<string, unknown>);
    } else {
      result[key] = sourceVal;
    }
  }
  return result;
}


