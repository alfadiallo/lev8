import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateTOTPSecret } from '@/lib/totp';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Generate TOTP secret and QR code
    const { secret, qrCode } = await generateTOTPSecret(userData.user.email!);

    // TODO: Store secret temporarily (e.g., in session or temp table)
    // For MVP, return it and user stores in browser until confirmed

    return NextResponse.json(
      {
        secret,
        qrCode,
        message: 'Scan QR code with authenticator app',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Setup 2FA error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}