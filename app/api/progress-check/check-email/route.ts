import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

type ProgressCheckPermission = 'guest' | 'resident' | 'faculty' | 'program_director' | 'admin';

function getProgressCheckPermission(role: string | null): ProgressCheckPermission {
  switch (role) {
    case 'super_admin':
      return 'admin';
    case 'program_director':
      return 'program_director';
    case 'faculty':
      return 'faculty';
    case 'resident':
      return 'resident';
    default:
      return 'guest';
  }
}

/**
 * POST /api/progress-check/check-email
 * Email-based auth for Progress Check tool. Checks user_profiles, faculty, residents
 * to determine role and program association.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const normalizedEmail = email.toLowerCase();

    // Check user_profiles (search both email and personal_email)
    const { data: user, error } = await supabase
      .from('user_profiles')
      .select(`
        id, email, personal_email, full_name, role, institution_id, source,
        health_systems:institution_id (id, name, abbreviation)
      `)
      .or(`email.eq.${normalizedEmail},personal_email.eq.${normalizedEmail}`)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[progress-check/check-email] Error:', error);
      return NextResponse.json({ error: 'Failed to check email' }, { status: 500 });
    }

    let permission: ProgressCheckPermission = 'guest';
    let programInfo = null;
    let facultyInfo = null;
    let residentInfo = null;

    if (user) {
      permission = getProgressCheckPermission(user.role);

      // Check if they're active faculty
      const { data: faculty } = await supabase
        .from('faculty')
        .select(`
          id, title, is_evaluator, program_id,
          programs:program_id (id, name, specialty, health_system_id)
        `)
        .or(`user_id.eq.${user.id},email.eq.${normalizedEmail}`)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (faculty) {
        facultyInfo = {
          id: faculty.id,
          title: faculty.title,
          isEvaluator: faculty.is_evaluator,
        };
        programInfo = faculty.programs;
        if (permission === 'guest') permission = 'faculty';
      }

      // Check if they're a resident
      if (!faculty) {
        const { data: resident } = await supabase
          .from('residents')
          .select(`
            id, medical_school, class_id,
            classes:class_id (id, graduation_year, name),
            programs:program_id (id, name, specialty, health_system_id)
          `)
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (resident) {
          residentInfo = {
            id: resident.id,
            medicalSchool: resident.medical_school,
            class: resident.classes,
          };
          programInfo = resident.programs;
          if (permission === 'guest') permission = 'resident';
        }
      }

      // If PD, find their program
      if (!programInfo && (user.role === 'program_director' || user.role === 'admin')) {
        const { data: program } = await supabase
          .from('programs')
          .select('id, name, specialty, health_system_id')
          .eq('pgm_director_id', user.id)
          .limit(1)
          .single();

        if (program) {
          programInfo = program;
        } else {
          // Fallback: first program in their institution
          const { data: anyProgram } = await supabase
            .from('programs')
            .select('id, name, specialty, health_system_id')
            .eq('health_system_id', user.institution_id)
            .limit(1)
            .single();
          if (anyProgram) programInfo = anyProgram;
        }
      }
    }

    // Also check eqpqiq_user_roles for progress-check-specific role
    const { data: eqpqiqRole } = await supabase
      .from('eqpqiq_user_roles')
      .select('role, is_admin, program_id')
      .eq('user_email', normalizedEmail)
      .eq('tool', 'progress_check')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (eqpqiqRole) {
      // Override with progress-check-specific role if it's higher
      const roleMap: Record<string, ProgressCheckPermission> = {
        program_director: 'program_director',
        faculty: 'faculty',
        resident: 'resident',
      };
      const progressCheckPerm = roleMap[eqpqiqRole.role] || 'guest';
      const hierarchy: Record<ProgressCheckPermission, number> = {
        guest: 0, resident: 1, faculty: 2, program_director: 3, admin: 4,
      };
      if (hierarchy[progressCheckPerm] > hierarchy[permission]) {
        permission = progressCheckPerm;
      }

      // Load program info from eqpqiq_user_roles if not already set
      if (!programInfo && eqpqiqRole.program_id) {
        const { data: eqpqiqProgram } = await supabase
          .from('programs')
          .select('id, name, specialty, health_system_id')
          .eq('id', eqpqiqRole.program_id)
          .single();
        if (eqpqiqProgram) programInfo = eqpqiqProgram;
      }
    }

    const capabilities = {
      canViewResidents: ['faculty', 'program_director', 'admin'].includes(permission),
      canViewResidentDetail: ['faculty', 'program_director', 'admin'].includes(permission),
      canManageSurveys: ['program_director', 'admin'].includes(permission),
      canManageSessions: ['faculty', 'program_director', 'admin'].includes(permission),
      canRateResidents: ['faculty', 'program_director', 'admin'].includes(permission),
      canSelfAssess: permission === 'resident',
      canViewAnalytics: ['faculty', 'program_director', 'admin'].includes(permission),
      canExportData: ['program_director', 'admin'].includes(permission),
    };

    return NextResponse.json({
      isLev8User: !!user,
      user: user ? {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        source: user.source,
      } : null,
      institution: user?.health_systems || null,
      program: programInfo,
      faculty: facultyInfo,
      resident: residentInfo,
      permission: {
        level: permission,
        capabilities,
      },
    });
  } catch (error) {
    console.error('[progress-check/check-email] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }
  return POST(new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ email }),
    headers: { 'Content-Type': 'application/json' },
  }));
}
