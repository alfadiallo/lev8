import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// GET /api/devices/trusted - Get all trusted devices for current user
export async function GET(request: NextRequest) {
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

    // Get trusted devices
    const { data: devices, error: devicesError } = await supabase
      .from('device_trusts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (devicesError) {
      console.error('[API] Device fetch error:', devicesError);
      return NextResponse.json(
        { error: 'Failed to fetch devices' },
        { status: 500 }
      );
    }

    return NextResponse.json({ devices: devices || [] });
  } catch (error) {
    console.error('[API] Get devices error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/devices/trusted - Revoke all trusted devices
export async function DELETE(request: NextRequest) {
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

    // Delete all trusted devices for this user
    const { error: deleteError } = await supabase
      .from('device_trusts')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('[API] Device revoke all error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to revoke devices' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'All devices revoked successfully' });
  } catch (error) {
    console.error('[API] Revoke all devices error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

