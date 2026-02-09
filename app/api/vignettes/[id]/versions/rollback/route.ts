// API Route: Rollback vignette to a previous version
// POST /api/vignettes/[id]/versions/rollback - Super Admin only

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Super Admin only
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, full_name, role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Super Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { version_number } = body;

    if (!version_number || typeof version_number !== 'number') {
      return NextResponse.json(
        { error: 'version_number (integer) is required' },
        { status: 400 }
      );
    }

    // Fetch the target version snapshot
    const { data: targetVersion, error: versionError } = await supabase
      .from('vignette_versions')
      .select('vignette_data')
      .eq('vignette_id', id)
      .eq('version_number', version_number)
      .single();

    if (versionError || !targetVersion) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    // Fetch current vignette (to snapshot before rollback)
    const { data: current, error: fetchError } = await supabase
      .from('vignettes')
      .select('vignette_data')
      .eq('id', id)
      .single();

    if (fetchError || !current) {
      return NextResponse.json({ error: 'Vignette not found' }, { status: 404 });
    }

    // Get next version number
    const { data: latestVersion } = await supabase
      .from('vignette_versions')
      .select('version_number')
      .eq('vignette_id', id)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = (latestVersion?.version_number ?? 0) + 1;

    // Snapshot the current state BEFORE rollback (so rollback is itself reversible)
    await supabase
      .from('vignette_versions')
      .insert({
        vignette_id: id,
        version_number: nextVersion,
        vignette_data: current.vignette_data,
        change_summary: `Rolled back to version ${version_number}`,
        changed_by: user.id,
        changed_by_name: profile?.full_name || user.email || 'Unknown',
      });

    // Apply the rollback — replace vignette_data with the target version
    const { data: updated, error: updateError } = await supabase
      .from('vignettes')
      .update({
        vignette_data: targetVersion.vignette_data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[VignetteRollback] Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to rollback', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        vignette: updated,
        rolled_back_to: version_number,
        new_version: nextVersion,
        message: `Rolled back to version ${version_number}. Current state saved as version ${nextVersion}.`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[VignetteRollback] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
