import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Early return for non-protected routes to avoid unnecessary auth checks
  // Static assets, API routes, and public files don't need auth
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Lightweight auth check - only getUser(), no profile fetch
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            // Override httpOnly to false so client-side JS can read the session
            response.cookies.set(name, value, {
              ...options,
              httpOnly: false,
            });
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  const authRoutes = ['/login', '/register', '/forgot-password', '/request-access'];
  const adminRoutes = ['/admin'];
  const debugRoutes = ['/debug'];

  // Check if the route needs protection (exact match for root, prefix for others)
  const isProtectedRoute = protectedRoutes.some((route) =>
    route === '/' ? pathname === '/' : pathname.startsWith(route)
  ) && !debugRoutes.some(route => pathname.startsWith(route));
  
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  // If protected route and no user, redirect to login
  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url);
    // Don't add redirect param for root to keep URL clean
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // If auth route and user exists, redirect to dashboard
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // For admin routes, we need to verify the user role
  // Basic check here, detailed check in layout/page
  if (isAdminRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

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
