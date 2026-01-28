/**
 * V2 Residents API
 * 
 * GET /api/v2/residents - List residents (filtered by tenant and role)
 * 
 * Query params:
 * - class_year: Filter by graduation year
 * - include_graduated: Include graduated residents (default: false)
 * 
 * Role-based behavior:
 * - Residents: Only see themselves
 * - Faculty: See all residents in their program
 * - Leadership: See all residents in their program
 * - Admin: See all residents in health system
 */

import { NextRequest, NextResponse } from 'next/server';
import { withTenantAuth, TenantAuthContext } from '@/lib/api/withTenantAuth';
import { filterResidentsByRole } from '@/lib/api/dataShaping';
import { calculatePGYLevel } from '@/lib/utils/pgy-calculator';

interface ResidentWithPGY {
  id: string;
  userId: string;
  fullName: string;
  anonCode: string;
  graduationYear: number;
  className: string;
  currentPgyLevel: number;
  programId: string;
  isYou?: boolean;
}

async function handler(
  request: NextRequest,
  ctx: TenantAuthContext
): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const classYear = searchParams.get('class_year');
  const includeGraduated = searchParams.get('include_graduated') === 'true';

  // Build query
  // Use column-based join syntax (classes:class_id) for reliable foreign key resolution
  let query = ctx.supabase
    .from('residents')
    .select(`
      id,
      user_id,
      anon_code,
      program_id,
      class_id,
      user_profiles:user_id (
        full_name,
        email
      ),
      classes:class_id (
        graduation_year,
        name,
        is_active
      )
    `);

  // Filter by program (tenant isolation)
  // super_admin can see all residents without tenant context
  const isSuperAdmin = ctx.role === 'super_admin';
  
  if (ctx.programId) {
    query = query.eq('program_id', ctx.programId);
  } else if (ctx.healthSystemId && ctx.isAdmin) {
    // Admins can see all programs in their health system
    // Get all program IDs for this health system
    const { data: programs } = await ctx.supabase
      .from('programs')
      .select('id')
      .eq('health_system_id', ctx.healthSystemId);
    
    if (programs && programs.length > 0) {
      query = query.in('program_id', programs.map(p => p.id));
    }
  } else if (isSuperAdmin) {
    // super_admin can see all residents across all programs
    // No filter needed - query will return all
    console.log('[V2 Residents API] super_admin global access - no program filter applied');
  } else {
    // No tenant context and not admin - return empty
    return NextResponse.json({ residents: [] });
  }

  // Execute query
  const { data: residentsData, error } = await query;

  if (error) {
    console.error('[V2 Residents API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch residents' },
      { status: 500 }
    );
  }

  // Transform data
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  let residents: ResidentWithPGY[] = (residentsData || []).map((r: Record<string, unknown>) => {
    const userProfile = r.user_profiles as { full_name: string; email: string } | null;
    const classInfo = r.classes as { graduation_year: number; name: string; is_active: boolean } | null;
    const gradYear = classInfo?.graduation_year || currentYear + 3;
    
    return {
      id: r.id as string,
      userId: r.user_id as string,
      fullName: userProfile?.full_name || userProfile?.email?.split('@')[0] || 'Unknown',
      anonCode: (r.anon_code as string) || `R${(r.id as string).slice(0, 3).toUpperCase()}`,
      graduationYear: gradYear,
      className: classInfo?.name || `Class of ${gradYear}`,
      currentPgyLevel: calculatePGYLevel(gradYear),
      programId: r.program_id as string,
      isYou: (r.user_id as string) === ctx.user.id,
    };
  });

  // Filter by class year if specified
  if (classYear) {
    residents = residents.filter(r => r.graduationYear === parseInt(classYear));
  }

  // Filter out graduated unless requested
  if (!includeGraduated) {
    // Academic year ends in June
    const academicYear = currentMonth >= 6 ? currentYear : currentYear - 1;
    residents = residents.filter(r => r.graduationYear > academicYear);
  }

  // Apply role-based filtering
  residents = filterResidentsByRole(residents, ctx) as ResidentWithPGY[];

  // Sort by graduation year (descending) then name
  residents.sort((a, b) => {
    if (a.graduationYear !== b.graduationYear) {
      return b.graduationYear - a.graduationYear; // PGY-3 first
    }
    return a.fullName.localeCompare(b.fullName);
  });

  // For residents viewing, mark their own record
  if (ctx.isResident) {
    residents = residents.map(r => ({
      ...r,
      isYou: r.userId === ctx.user.id,
    }));
  }

  return NextResponse.json({
    residents,
    meta: {
      total: residents.length,
      programId: ctx.programId,
      includeGraduated,
    },
  });
}

// Export with tenant auth - residents can see themselves
export const GET = withTenantAuth(handler, { allowResident: true });
