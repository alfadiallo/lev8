// API Route: Import v2 Vignette
// POST /api/vignettes/v2/import - Import a v2 vignette into the database
// Supports importing from VignetteV2 structure or from a vignette ID

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { convertVignetteV2ToDatabase, validateVignetteV2 } from '@/lib/vignettes/v2/convertToDatabaseFormat';
import { VignetteV2 } from '@/lib/types/difficult-conversations';
import { MED001AdenosineErrorVignette } from '@/lib/vignettes/v2/MED-001-adenosine-error';

// Registry of available v2 vignettes for import
const VIGNETTE_REGISTRY: Record<string, VignetteV2> = {
  'MED-001-adenosine-error-v1': MED001AdenosineErrorVignette,
};

export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
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

    // Get user profile to check role and institution
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('institution_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Only allow educators and admins
    const educatorRoles = ['faculty', 'program_director', 'super_admin'];
    if (!educatorRoles.includes(profile.role)) {
      return NextResponse.json(
        { error: 'Only educators can import vignettes' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { vignetteId, vignette } = body;

    let vignetteToImport: VignetteV2;

    // Option 1: Import from registry by ID
    if (vignetteId) {
      if (!VIGNETTE_REGISTRY[vignetteId]) {
        return NextResponse.json(
          { error: `Vignette ${vignetteId} not found in registry` },
          { status: 404 }
        );
      }
      vignetteToImport = VIGNETTE_REGISTRY[vignetteId];
    }
    // Option 2: Import from provided vignette object
    else if (vignette) {
      vignetteToImport = vignette as VignetteV2;
    } else {
      return NextResponse.json(
        { error: 'Either vignetteId or vignette must be provided' },
        { status: 400 }
      );
    }

    // Validate vignette structure
    const validationErrors = validateVignetteV2(vignetteToImport);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Vignette validation failed',
          details: validationErrors,
        },
        { status: 400 }
      );
    }

    // Convert to database format
    const dbVignette = convertVignetteV2ToDatabase(
      vignetteToImport,
      profile.institution_id,
      user.id
    );

    // Check if vignette already exists
    const { data: existing } = await supabase
      .from('vignettes')
      .select('id, title')
      .eq('institution_id', profile.institution_id)
      .eq('title', dbVignette.title)
      .eq('category', dbVignette.category)
      .maybeSingle();

    let result;
    if (existing) {
      // Update existing vignette
      const { data: updated, error: updateError } = await supabase
        .from('vignettes')
        .update({
          ...dbVignette,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        console.error('[V2Import] Error updating vignette:', updateError);
        return NextResponse.json(
          { error: 'Failed to update vignette', details: updateError.message },
          { status: 500 }
        );
      }

      result = {
        vignette: updated,
        action: 'updated',
      };
    } else {
      // Insert new vignette
      const { data: newVignette, error: insertError } = await supabase
        .from('vignettes')
        .insert(dbVignette)
        .select()
        .single();

      if (insertError) {
        console.error('[V2Import] Error creating vignette:', insertError);
        return NextResponse.json(
          { error: 'Failed to create vignette', details: insertError.message },
          { status: 500 }
        );
      }

      result = {
        vignette: newVignette,
        action: 'created',
      };
    }

    return NextResponse.json(
      {
        success: true,
        ...result,
        version: (result.vignette.vignette_data as Record<string, unknown>)?.version || 'unknown',
      },
      { status: result.action === 'created' ? 201 : 200 }
    );
  } catch (error: unknown) {
    console.error('[V2Import] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

