/**
 * V2 Resident Self-Access API
 * 
 * GET /api/v2/residents/me - Get current resident's profile
 * 
 * This endpoint is for residents to access their own data without
 * needing to know their resident ID. It looks up the resident record
 * associated with the authenticated user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withTenantAuth, TenantAuthContext } from '@/lib/api/withTenantAuth';
import { calculatePGYLevel } from '@/lib/utils/pgy-calculator';

async function handler(
  _request: NextRequest,
  ctx: TenantAuthContext
): Promise<NextResponse> {
  // Find resident record for current user
  // Use column-based join syntax for reliable foreign key resolution
  const { data: resident, error } = await ctx.supabase
    .from('residents')
    .select(`
      id,
      user_id,
      anon_code,
      program_id,
      medical_school,
      specialty,
      user_profiles:user_id (
        full_name,
        email
      ),
      classes:class_id (
        graduation_year,
        name
      ),
      programs:program_id (
        name,
        specialty
      )
    `)
    .eq('user_id', ctx.user.id)
    .single();

  if (error || !resident) {
    // User might not be a resident
    if (error?.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'You are not registered as a resident' },
        { status: 404 }
      );
    }
    console.error('[V2 Residents Me API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch your profile' },
      { status: 500 }
    );
  }

  // Transform data (Supabase join results can be array; cast via unknown)
  const userProfile = resident.user_profiles as unknown as { full_name: string; email: string } | null;
  const classInfo = resident.classes as unknown as { graduation_year: number; name: string } | null;
  const programInfo = resident.programs as unknown as { name: string; specialty: string } | null;

  const graduationYear = classInfo?.graduation_year || new Date().getFullYear() + 3;

  const residentData = {
    id: resident.id,
    userId: resident.user_id,
    fullName: userProfile?.full_name,
    anonCode: resident.anon_code,
    email: userProfile?.email,
    graduationYear,
    className: classInfo?.name || `Class of ${graduationYear}`,
    currentPgyLevel: calculatePGYLevel(graduationYear),
    medicalSchool: resident.medical_school,
    specialty: resident.specialty || programInfo?.specialty,
    programName: programInfo?.name,
    programId: resident.program_id,
  };

  return NextResponse.json({ resident: residentData });
}

// Residents can access their own data
export const GET = withTenantAuth(handler, { 
  allowResident: true,
  requireTenant: false, // Allow access even without tenant context
});
