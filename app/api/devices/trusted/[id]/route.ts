import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// DELETE /api/devices/trusted/[id] - Revoke a specific trusted device
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    // Get user from session
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

    const deviceId = params.id;

    // Verify device belongs to user and delete it
    const { error: deleteError } = await supabase
      .from('device_trusts')
      .delete()
      .eq('id', deviceId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('[API] Device revoke error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to revoke device' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Device revoked successfully' });
  } catch (error) {
    console.error('[API] Revoke device error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

