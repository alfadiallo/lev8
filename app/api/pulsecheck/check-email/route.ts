import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/pulsecheck/check-email
 * Validates a user's email and returns their role and permissions for Pulse Check
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user exists in pulsecheck_directors table
    const { data: director, error: directorError } = await supabase
      .from('pulsecheck_directors')
      .select(`
        id,
        name,
        email,
        role,
        department_id,
        healthsystem_id,
        is_active,
        user_profile_id
      `)
      .eq('email', normalizedEmail)
      .eq('is_active', true)
      .single();

    if (directorError && directorError.code !== 'PGRST116') {
      console.error('[pulsecheck/check-email] Director lookup error:', directorError);
    }

    // If found as a director, get their department, site, and healthsystem info
    if (director) {
      // Get department info if director has a department
      let department = null;
      if (director.department_id) {
        const { data: deptData } = await supabase
          .from('pulsecheck_departments')
          .select('id, name, site_id')
          .eq('id', director.department_id)
          .single();
        department = deptData;
      }

      // Get site info if department exists
      let site = null;
      if (department?.site_id) {
        const { data: siteData } = await supabase
          .from('pulsecheck_sites')
          .select('id, name, region')
          .eq('id', department.site_id)
          .single();
        site = siteData;
      }

      // Get healthsystem info if director is associated with a healthsystem
      let healthsystem = null;
      if (director.healthsystem_id) {
        const { data: healthsystemData } = await supabase
          .from('pulsecheck_healthsystems')
          .select('id, name, abbreviation')
          .eq('id', director.healthsystem_id)
          .single();
        healthsystem = healthsystemData;
      }

      // Get count of providers under this director (for Medical Directors)
      let providerCount = 0;
      if (director.role === 'medical_director' || 
          director.role === 'associate_medical_director' || 
          director.role === 'assistant_medical_director') {
        const { count } = await supabase
          .from('pulsecheck_providers')
          .select('*', { count: 'exact', head: true })
          .eq('primary_director_id', director.id)
          .eq('is_active', true);
        providerCount = count || 0;
      }

      return NextResponse.json({
        found: true,
        director: {
          id: director.id,
          name: director.name,
          email: director.email,
          role: director.role,
          department_id: director.department_id,
          healthsystem_id: director.healthsystem_id,
        },
        department: department ? {
          id: department.id,
          name: department.name,
        } : null,
        site: site ? {
          id: site.id,
          name: site.name,
          region: site.region,
        } : null,
        healthsystem: healthsystem ? {
          id: healthsystem.id,
          name: healthsystem.name,
          abbreviation: healthsystem.abbreviation,
        } : null,
        providerCount,
      });
    }

    // Check if user exists in user_profiles (lev8 user)
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, role')
      .eq('email', normalizedEmail)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('[pulsecheck/check-email] Profile lookup error:', profileError);
    }

    // If found in user_profiles but not as a director, they're a guest
    if (userProfile) {
      return NextResponse.json({
        found: true,
        name: userProfile.full_name,
        director: null,
        department: null,
        site: null,
        healthsystem: null,
        message: 'User found in lev8 but not registered as a Pulse Check director',
      });
    }

    // Not found at all
    return NextResponse.json({
      found: false,
      director: null,
      department: null,
      site: null,
      healthsystem: null,
      message: 'Email not found in system',
    });

  } catch (error) {
    console.error('[pulsecheck/check-email] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
