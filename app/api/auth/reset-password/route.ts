import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * POST /api/auth/reset-password
 * Request a password reset email
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Use request domain so reset links stay on the same product surface.
    const originHeader = req.headers.get('origin');
    const hostHeader = req.headers.get('host');
    const requestOrigin =
      originHeader ||
      (hostHeader ? `${req.nextUrl.protocol}//${hostHeader}` : null) ||
      req.nextUrl.origin;

    let appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lev8.ai';
    if (requestOrigin.includes('eqpqiq.com')) {
      appBaseUrl = 'https://www.eqpqiq.com';
    } else if (requestOrigin.includes('lev8.ai')) {
      appBaseUrl = 'https://www.lev8.ai';
    } else if (requestOrigin.includes('localhost')) {
      appBaseUrl = requestOrigin;
    }

    const redirectTo = `${appBaseUrl}/update-password`;

    // Use Supabase's built-in password reset
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      console.error('[ResetPassword] Error:', error);
      // Don't reveal whether email exists for security
      return NextResponse.json(
        { message: 'If an account exists with this email, you will receive a password reset link.' },
        { status: 200 }
      );
    }

    console.log('[ResetPassword] Reset email sent to:', email);
    return NextResponse.json(
      { message: 'If an account exists with this email, you will receive a password reset link.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ResetPassword] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}



