// API Route: Vignette version history
// GET /api/vignettes/[id]/versions - List version history (optionally fetch a specific version snapshot)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(
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

    // Optional: fetch a specific version's full snapshot
    const url = new URL(request.url);
    const versionParam = url.searchParams.get('version');

    if (versionParam) {
      const versionNumber = parseInt(versionParam, 10);
      const { data: version, error } = await supabase
        .from('vignette_versions')
        .select('*')
        .eq('vignette_id', id)
        .eq('version_number', versionNumber)
        .single();

      if (error || !version) {
        return NextResponse.json({ error: 'Version not found' }, { status: 404 });
      }

      return NextResponse.json({ version }, { status: 200 });
    }

    // List all versions (without full vignette_data to keep response light)
    const { data: versions, error } = await supabase
      .from('vignette_versions')
      .select('id, vignette_id, version_number, change_summary, changed_by, changed_by_name, created_at')
      .eq('vignette_id', id)
      .order('version_number', { ascending: false });

    if (error) {
      console.error('[VignetteVersions] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 });
    }

    return NextResponse.json({ versions: versions || [] }, { status: 200 });
  } catch (error) {
    console.error('[VignetteVersions] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
