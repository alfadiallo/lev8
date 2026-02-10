/**
 * V2 Resident Detail API
 * 
 * GET /api/v2/residents/[id] - Get resident details
 * 
 * Role-based behavior:
 * - Residents: Can only view their own profile
 * - Faculty+: Can view any resident in their program
 */

import { NextRequest, NextResponse } from 'next/server';
import { withTenantAuth, TenantAuthContext } from '@/lib/api/withTenantAuth';
import { calculatePGYLevel } from '@/lib/utils/pgy-calculator';

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function handler(
  request: NextRequest,
  ctx: TenantAuthContext,
  routeCtx: RouteContext
): Promise<NextResponse> {
  const { id: residentId } = await routeCtx.params;

  // Check if user can access this resident
  const canAccess = await ctx.canAccessResident(residentId);
  if (!canAccess) {
    return NextResponse.json(
      { error: 'Access denied. You cannot view this resident.' },
      { status: 403 }
    );
  }

  // Fetch resident details
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
    .eq('id', residentId)
    .single();

  if (error || !resident) {
    return NextResponse.json(
      { error: 'Resident not found' },
      { status: 404 }
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
    fullName: ctx.isResident ? undefined : userProfile?.full_name, // Hide name from other residents
    anonCode: resident.anon_code,
    email: ctx.isResident ? undefined : userProfile?.email,
    graduationYear,
    className: classInfo?.name || `Class of ${graduationYear}`,
    currentPgyLevel: calculatePGYLevel(graduationYear),
    medicalSchool: resident.medical_school,
    specialty: resident.specialty || programInfo?.specialty,
    programName: programInfo?.name,
    isYou: resident.user_id === ctx.user.id,
  };

  return NextResponse.json({ resident: residentData });
}

// Wrap handler to pass route context
export const GET = (request: NextRequest, routeCtx: RouteContext) => {
  return withTenantAuth(
    (req, ctx) => handler(req, ctx, routeCtx),
    { allowResident: true }
  )(request);
};
