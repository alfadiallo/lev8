import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Clear auth cookie by setting it to expire
    // Note: The client-side logout (AuthContext) handles Supabase session clearing
    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );

    response.cookies.set('sb-auth-token', '', {
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    // Still return success and clear cookies even if there's an error
    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );

    response.cookies.set('sb-auth-token', '', {
      maxAge: 0,
      path: '/',
    });

    return response;
  }
}