import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyTOTPCode } from '@/lib/totp';
import { generateDeviceFingerprint, getClientIpAddress, getClientUserAgent } from '@/lib/deviceTrust';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, token, trustDevice } = body;

    if (!userId || !token) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user's TOTP secret
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('totp_secret')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.totp_secret) {
      return NextResponse.json(
        { error: '2FA not set up for this user' },
        { status: 400 }
      );
    }

    // Verify TOTP token
    const isValid = verifyTOTPCode(profile.totp_secret, token);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid 2FA code' },
        { status: 401 }
      );
    }

    // If user wants to trust device, create device trust record
    if (trustDevice) {
      const ipAddress = getClientIpAddress(req.headers);
      const userAgent = getClientUserAgent(req.headers);
      const deviceFingerprint = generateDeviceFingerprint(userAgent, ipAddress);

      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await supabase
        .from('device_trusts')
        .insert({
          user_id: userId,
          device_fingerprint: deviceFingerprint,
          ip_address: ipAddress,
          user_agent: userAgent,
          trust_expires_at: expiresAt.toISOString(),
        });
    }

    return NextResponse.json(
      {
        success: true,
        userId,
        next: '/dashboard',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verify 2FA error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}