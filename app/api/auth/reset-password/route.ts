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

    // Get the redirect URL from environment or use default
    const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || 'https://lev8.ai'}/update-password`;

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



