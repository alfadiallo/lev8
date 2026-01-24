// API Route: Migrate Vignettes
// POST /api/vignettes/migrate - Migrate vignette data from TypeScript to Supabase
// This is a one-time migration script (educators/admins only)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Sample vignette data structure - will be populated from virtual-sim
const sampleVignettes = [
  {
    title: 'Adenosine Medication Error',
    description: 'A medication error occurred during surgery where the patient received the wrong medication.',
    category: 'medical-error-disclosure',
    subcategory: 'medication-error',
    difficulty: ['beginner', 'intermediate', 'advanced'],
    estimated_duration_minutes: 20,
    vignette_data: {
      context: 'A medication error occurred during surgery where the patient received the wrong medication or incorrect dosage.',
      facts: [
        'The error was caught within 30 minutes',
        'The patient experienced complications but is now stable',
        'Hospital protocol requires disclosure within 24 hours',
        'This is classified as a Category C error (reached patient, no harm)',
        'Risk management has been notified',
        'The medical team acted quickly to correct the error',
      ],
      escalationTriggers: ['lawyer', 'sue', 'legal action', 'medical board', 'report', 'negligence'],
      primaryAvatar: {
        id: 'patient-family-1',
        name: 'Sarah Johnson',
        role: 'Patient\'s Family Member',
        color: '#7EC8E3',
        initialEmotion: 'worried',
      },
      initialPrompt: 'I heard there was an incident during surgery. What happened? Is my family member okay?',
    },
  },
];

export async function POST(request: NextRequest) {
  try {
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

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('institution_id, role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Only allow educators and admins
    const educatorRoles = ['faculty', 'program_director', 'super_admin'];
    if (!educatorRoles.includes(profile.role)) {
      return NextResponse.json(
        { error: 'Only educators can migrate vignettes' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { vignettes = sampleVignettes } = body;

    const migrated = [];
    const errors = [];

    for (const vignette of vignettes) {
      try {
        const { data: newVignette, error } = await supabase
          .from('vignettes')
          .insert({
            institution_id: profile.institution_id,
            title: vignette.title,
            description: vignette.description,
            category: vignette.category,
            subcategory: vignette.subcategory,
            difficulty: vignette.difficulty || ['beginner', 'intermediate', 'advanced'],
            estimated_duration_minutes: vignette.estimated_duration_minutes || 20,
            vignette_data: vignette.vignette_data || {},
            created_by_user_id: user.id,
            is_public: false,
            is_active: true,
          })
          .select()
          .single();

        if (error) {
          errors.push({ vignette: vignette.title, error: error.message });
        } else {
          migrated.push(newVignette);
        }
      } catch (error: unknown) {
        errors.push({ vignette: vignette.title, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    return NextResponse.json(
      {
        success: true,
        migrated: migrated.length,
        errors: errors.length,
        details: { migrated, errors },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[VignetteMigration] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


