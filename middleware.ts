import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Routes that require authentication
const protectedRoutes = [
  '/',
  '/dashboard',
  '/modules',
  '/settings',
  '/forms',
  '/expectations',
  '/truths',
];

// Routes that should redirect to dashboard if authenticated
const authRoutes = ['/login', '/register'];

// Admin-only routes
const adminRoutes = ['/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route needs protection
  const isProtectedRoute = protectedRoutes.some((route) =>
    route === '/' ? pathname === '/' : pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  // Get the session token from cookies
  const supabaseAuthToken = request.cookies.get('sb-access-token')?.value;
  const supabaseRefreshToken = request.cookies.get('sb-refresh-token')?.value;

  // Check for auth in Supabase cookie format (sb-<project-ref>-auth-token)
  const allCookies = request.cookies.getAll();
  const supabaseSessionCookie = allCookies.find(
    (cookie) =>
      cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
  );

  const hasSession =
    supabaseAuthToken || supabaseRefreshToken || supabaseSessionCookie;

  // If trying to access protected routes without auth, redirect to login
  if (isProtectedRoute && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated and trying to access auth routes, redirect to dashboard
  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // For admin routes, we need to verify the user role
  // This is a basic check - the full role validation happens in API routes
  if (isAdminRoute && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public|.*\\..*$).*)',
  ],
};

