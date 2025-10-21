import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateDeviceFingerprint, getClientIpAddress, getClientUserAgent } from '@/lib/deviceTrust';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    // Attempt login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login failed:', error);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate device fingerprint
    const ipAddress = getClientIpAddress(req.headers);
    const userAgent = getClientUserAgent(req.headers);
    const deviceFingerprint = generateDeviceFingerprint(userAgent, ipAddress);

    // Check if device is trusted
    const { data: trustedDevice } = await supabase
      .from('device_trusts')
      .select('*')
      .eq('user_id', data.user.id)
      .eq('device_fingerprint', deviceFingerprint)
      .gt('trust_expires_at', new Date().toISOString())
      .single();

    if (trustedDevice) {
      // Device is trusted and hasn't expired, skip 2FA
      return NextResponse.json(
        {
          userId: data.user.id,
          email: data.user.email,
          session: data.session?.access_token,
          requiresMFA: false,
          next: '/dashboard',
        },
        { status: 200 }
      );
    }

    // Device not trusted, require 2FA
    return NextResponse.json(
      {
        userId: data.user.id,
        email: data.user.email,
        requiresMFA: true,
        next: '/verify-2fa',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}