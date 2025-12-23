import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireSuperAdmin } from '@/lib/auth/checkApiPermission';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  // Require super_admin authentication
  const authResult = await requireSuperAdmin(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    console.log('[Seed] Starting database seed...');
    
    // Insert health system
    console.log('[Seed] Checking for health system...');
    
    // Check if ANY health system exists with this name (regardless of ID)
    const { data: existingHS } = await supabase
      .from('health_systems')
      .select('*')
      .eq('name', 'Memorial Healthcare System')
      .maybeSingle();
    
    let healthSystemId: string;
    
    if (existingHS) {
      console.log('[Seed] Health system already exists:', existingHS.name, 'ID:', existingHS.id);
      healthSystemId = existingHS.id;
    } else {
      // Create new one with specific ID
      healthSystemId = 'a0000000-0000-0000-0000-000000000001';
      const { error: hsInsertError } = await supabase
        .from('health_systems')
        .insert({
          id: healthSystemId,
          name: 'Memorial Healthcare System',
          abbreviation: 'MHS',
          location: 'Hollywood, FL'
        });

      if (hsInsertError) {
        console.error('[Seed] Health system insert error:', hsInsertError);
        return NextResponse.json({
          error: 'Failed to create health system',
          details: hsInsertError.message,
          code: hsInsertError.code
        }, { status: 500 });
      }
      
      console.log('[Seed] Health system created with ID:', healthSystemId);
    }

    // Insert program
    console.log('[Seed] Checking for program...');
    
    // Check if program exists with this name and health system
    const { data: existingProg } = await supabase
      .from('programs')
      .select('*')
      .eq('name', 'Emergency Medicine Residency')
      .eq('health_system_id', healthSystemId)
      .maybeSingle();
    
    let programId: string;
    
    if (existingProg) {
      console.log('[Seed] Program already exists:', existingProg.name, 'ID:', existingProg.id);
      programId = existingProg.id;
    } else {
      // Create new one
      programId = 'b0000000-0000-0000-0000-000000000001';
      const { error: progInsertError } = await supabase
        .from('programs')
        .insert({
          id: programId,
          health_system_id: healthSystemId,
          name: 'Emergency Medicine Residency',
          specialty: 'Emergency Medicine'
        });

      if (progInsertError) {
        console.error('[Seed] Program insert error:', progInsertError);
        return NextResponse.json({
          error: 'Failed to create program',
          details: progInsertError.message,
          code: progInsertError.code
        }, { status: 500 });
      }
      
      console.log('[Seed] Program created with ID:', programId);
    }

    // Insert classes (using graduation year)
    console.log('[Seed] Creating classes...');
    const currentYear = new Date().getFullYear();
    const classesData = [
      { program_id: programId, graduation_year: currentYear + 3, name: `Class of ${currentYear + 3}` }, // PGY-1
      { program_id: programId, graduation_year: currentYear + 2, name: `Class of ${currentYear + 2}` }, // PGY-2
      { program_id: programId, graduation_year: currentYear + 1, name: `Class of ${currentYear + 1}` }, // PGY-3
    ];

    for (const classData of classesData) {
      const { error: classError } = await supabase
        .from('classes')
        .insert(classData);
      
      if (classError && classError.code !== '23505') {
        console.error('[Seed] Class error:', classError);
        // Continue anyway - classes are optional
      }
    }
    
    console.log('[Seed] Classes created:', classesData.length);

    // Insert module buckets
    console.log('[Seed] Creating module buckets...');
    const bucketsData = [
      { institution_id: healthSystemId, name: 'Learn', description: 'Educational content and clinical learning modules', display_order: 1, is_active: true },
      { institution_id: healthSystemId, name: 'Reflect', description: 'Personal development and reflection tools', display_order: 2, is_active: true },
      { institution_id: healthSystemId, name: 'Understand', description: 'Assessment and comprehension modules', display_order: 3, is_active: true },
    ];

    for (const bucketData of bucketsData) {
      const { error: bucketError } = await supabase
        .from('module_buckets')
        .insert(bucketData);
      
      if (bucketError && bucketError.code !== '23505') {
        console.error('[Seed] Bucket error:', bucketError);
        // Continue anyway - buckets are optional
      }
    }
    
    console.log('[Seed] Buckets created:', bucketsData.length);

    return NextResponse.json({
      success: true,
      message: 'Seed data created successfully!',
      data: {
        healthSystem: 'Memorial Healthcare System',
        program: 'Emergency Medicine Residency',
        classes: classesData.length,
        buckets: bucketsData.length
      }
    });
    console.log('[Seed] ✅ Seed complete!');
    
  } catch (error) {
    console.error('[Seed] ❌ Unexpected error:', error);
    console.error('[Seed] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : JSON.stringify(error)
    }, { status: 500 });
  }
}

