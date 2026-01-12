import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { notifyStudioCreatorRequest } from '@/lib/email/notifications';

// POST /api/studio/request-access - Submit creator access request
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // API route - cookies handled differently
          },
        },
      }
    );

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has a creator profile
    const { data: existingCreator } = await supabase
      .from('studio_creators')
      .select('id, status')
      .eq('user_id', user.id)
      .single();

    if (existingCreator) {
      if (existingCreator.status === 'approved') {
        return NextResponse.json({ error: 'You already have Studio access' }, { status: 400 });
      }
      if (existingCreator.status === 'pending') {
        return NextResponse.json({ error: 'You already have a pending request' }, { status: 400 });
      }
    }

    // Parse request body
    const body = await request.json();
    const { displayName, affiliation, specialty, bio } = body;

    // Validate required fields
    if (!displayName?.trim() || !affiliation?.trim()) {
      return NextResponse.json({ error: 'Display name and affiliation are required' }, { status: 400 });
    }

    // Create or update creator profile
    if (existingCreator) {
      // Update existing rejected/suspended profile to pending
      const { error: updateError } = await supabase
        .from('studio_creators')
        .update({
          display_name: displayName.trim(),
          affiliation: affiliation.trim(),
          specialty: specialty?.trim() || null,
          bio: bio?.trim() || null,
          status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingCreator.id);

      if (updateError) {
        console.error('[Studio API] Error updating creator profile:', updateError);
        return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
      }
    } else {
      // Create new creator profile
      const { error: insertError } = await supabase
        .from('studio_creators')
        .insert({
          user_id: user.id,
          display_name: displayName.trim(),
          affiliation: affiliation.trim(),
          specialty: specialty?.trim() || null,
          bio: bio?.trim() || null,
          status: 'pending',
        });

      if (insertError) {
        console.error('[Studio API] Error creating creator profile:', insertError);
        return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
      }
    }

    // Send email notification to admin
    await notifyStudioCreatorRequest({
      user_email: user.email || '',
      display_name: displayName.trim(),
      affiliation: affiliation.trim(),
      specialty: specialty?.trim(),
      bio: bio?.trim(),
    });

    return NextResponse.json({
      message: 'Request submitted successfully',
    });

  } catch (error) {
    console.error('[Studio API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
