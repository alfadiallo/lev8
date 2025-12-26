// API Route: Clinical Case by ID
// GET /api/clinical-cases/[id] - Get case details
// PUT /api/clinical-cases/[id] - Update case (educators only)
// DELETE /api/clinical-cases/[id] - Delete case (educators only)

import { NextRequest, NextResponse } from 'next/server';
import { checkApiPermission } from '@/lib/auth/checkApiPermission';
import { getServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Use checkApiPermission for auth
    const authResult = await checkApiPermission(request);
    if (!authResult.authorized) {
      return authResult.response!;
    }

    // Use shared server client (respects RLS)
    const supabase = getServerSupabaseClient();

    const { data: case_, error } = await supabase
      .from('clinical_cases')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !case_) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    return NextResponse.json({ case: case_ }, { status: 200 });
  } catch (error) {
    console.error('[ClinicalCases] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Require educator role
    const authResult = await checkApiPermission(request, {
      requiredRoles: ['faculty', 'program_director', 'super_admin']
    });
    if (!authResult.authorized) {
      return authResult.response!;
    }

    // Use shared server client (respects RLS)
    const supabase = getServerSupabaseClient();

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.difficulty !== undefined) updateData.difficulty = body.difficulty;
    if (body.specialty !== undefined) updateData.specialty = body.specialty;
    if (body.estimated_duration_minutes !== undefined) updateData.estimated_duration_minutes = body.estimated_duration_minutes;
    if (body.case_data !== undefined) updateData.case_data = body.case_data;
    if (body.is_public !== undefined) updateData.is_public = body.is_public;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    const { data: updatedCase, error } = await supabase
      .from('clinical_cases')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[ClinicalCases] Error updating case:', error);
      return NextResponse.json({ error: 'Failed to update case' }, { status: 500 });
    }

    return NextResponse.json({ case: updatedCase }, { status: 200 });
  } catch (error) {
    console.error('[ClinicalCases] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Require educator role
    const authResult = await checkApiPermission(request, {
      requiredRoles: ['faculty', 'program_director', 'super_admin']
    });
    if (!authResult.authorized) {
      return authResult.response!;
    }

    // Use shared server client (respects RLS)
    const supabase = getServerSupabaseClient();

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('clinical_cases')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('[ClinicalCases] Error deleting case:', error);
      return NextResponse.json({ error: 'Failed to delete case' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[ClinicalCases] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


