import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Known non-tenant route prefixes (don't try to parse as org/dept)
const NON_TENANT_PREFIXES = [
  'api',
  'login',
  'register', 
  'forgot-password',
  'update-password',
  'verify-2fa',
  'request-access',
  'admin',
  'debug',
  'reset',
  'studio',  // Studio has its own routing
  'interview',  // Interview tool (eqpqiq.com) - publicly accessible
  'pulsecheck', // Pulse Check tool - publicly accessible
  '_next',
  'favicon.ico',
  'public'
];

// Auth routes that redirect to dashboard if already logged in
const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/request-access'];

// Parse tenant info from pathname
function parseTenantFromPath(pathname: string): { orgSlug: string; deptSlug: string; rest: string } | null {
  const parts = pathname.split('/').filter(Boolean);
  
  if (parts.length < 2) {
    return null;
  }
  
  const [first, second, ...rest] = parts;
  
  // Check if first segment is a non-tenant prefix
  if (NON_TENANT_PREFIXES.includes(first.toLowerCase())) {
    return null;
  }
  
  return {
    orgSlug: first,
    deptSlug: second,
    rest: rest.length > 0 ? `/${rest.join('/')}` : ''
  };
}

// Check if this is a Studio subdomain request
function isStudioSubdomain(request: NextRequest): boolean {
  const host = request.headers.get('host') || '';
  return host.startsWith('studio.') || host.includes('studio.localhost');
}

// Check if this is an eqpqiq.com domain request
function isEqpqiqDomain(request: NextRequest): boolean {
  const host = request.headers.get('host') || '';
  return host.includes('eqpqiq.com') || host.includes('eqpqiq.localhost');
}

// Get the subdomain from the request
function getSubdomain(request: NextRequest): string | null {
  const host = request.headers.get('host') || '';
  const parts = host.split('.');
  
  // Handle localhost:3000 or studio.localhost:3000
  if (host.includes('localhost')) {
    if (parts[0] === 'studio') {
      return 'studio';
    }
    return null;
  }
  
  // Handle production: studio.lev8.ai or mhs.lev8.ai
  if (parts.length >= 3) {
    const subdomain = parts[0];
    if (subdomain !== 'www') {
      return subdomain;
    }
  }
  
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const subdomain = getSubdomain(request);
  const isStudio = subdomain === 'studio';
  const isEqpqiq = isEqpqiqDomain(request);

  // ============================================================================
  // EQPQIQ.COM DOMAIN HANDLING
  // When accessed via eqpqiq.com, route all traffic to /interview/*
  // ============================================================================
  if (isEqpqiq) {
    // Allow API routes, static files, and interview routes to pass through
    if (
      pathname.startsWith('/api') ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon.ico') ||
      pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/)
    ) {
      const response = NextResponse.next();
      response.headers.set('x-lev8-context', 'eqpqiq');
      return response;
    }

    // If already on /interview path, continue
    if (pathname.startsWith('/interview')) {
      const response = NextResponse.next();
      response.headers.set('x-lev8-context', 'eqpqiq');
      return response;
    }

    // Redirect root and all other paths to /interview
    const interviewUrl = new URL('/interview', request.url);
    // Preserve query params
    interviewUrl.search = request.nextUrl.search;
    return NextResponse.redirect(interviewUrl);
  }

  // Early return for non-protected routes to avoid unnecessary auth checks
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/interview') ||  // Interview tool is publicly accessible
    pathname.startsWith('/pulsecheck') || // Pulse Check tool is publicly accessible
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client for auth checking
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

  // ============================================================================
  // STUDIO SUBDOMAIN HANDLING
  // When accessed via studio.lev8.ai, rewrite paths to /studio/*
  // ============================================================================
  if (isStudio) {
    // Allow auth routes without authentication (to avoid redirect loops)
    const isAuthPath = pathname.startsWith('/login') || 
                       pathname.startsWith('/register') || 
                       pathname.startsWith('/forgot-password') ||
                       pathname.startsWith('/request-access');
    
    // Studio requires authentication (except for auth pages)
    if (!user && !isAuthPath) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('context', 'studio');
      return NextResponse.redirect(loginUrl);
    }
    
    // Rewrite paths to /studio/* if not already prefixed (except auth pages)
    // studio.lev8.ai/ → /studio
    // studio.lev8.ai/resources/curriculum → /studio/resources/curriculum
    if (!pathname.startsWith('/studio') && !isAuthPath && !pathname.startsWith('/api')) {
      const rewriteUrl = new URL(`/studio${pathname === '/' ? '' : pathname}`, request.url);
      return NextResponse.rewrite(rewriteUrl, {
        headers: {
          'x-lev8-context': 'studio',
        },
      });
    }
    
    // Add studio context to headers for downstream components
    response.headers.set('x-lev8-context', 'studio');
    return response;
  }

  // ============================================================================
  // MULTI-TENANT PATH ROUTING
  // ============================================================================
  const tenantInfo = parseTenantFromPath(pathname);
  
  if (tenantInfo) {
    // This is a tenant-specific route (e.g., /mhs/em/modules/understand)
    
    // Require authentication for all tenant routes
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Add tenant context to headers for downstream components
    response.headers.set('x-lev8-org', tenantInfo.orgSlug);
    response.headers.set('x-lev8-dept', tenantInfo.deptSlug);
    response.headers.set('x-lev8-context', 'program');
    
    // ========================================================================
    // ROLE-BASED ROUTE RESTRICTIONS
    // Residents can only access certain paths within tenant routes
    // ========================================================================
    
    // Paths that residents ARE allowed to access
    const RESIDENT_ALLOWED_PATHS = [
      '/dashboard',
      '/modules/learn',
      '/settings',
    ];
    
    // Paths that are restricted from residents (facultyOnly modules)
    const RESIDENT_BLOCKED_PATHS = [
      '/modules/reflect',
      '/modules/understand',
      '/truths',
      '/expectations',
      '/admin',
    ];
    
    // Fetch user's membership role for this organization
    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('role')
      .eq('user_id', user.id)
      .eq('health_system_id', (
        await supabase
          .from('health_systems')
          .select('id')
          .eq('slug', tenantInfo.orgSlug)
          .single()
      ).data?.id)
      .single();
    
    const userRole = membership?.role || 'viewer';
    response.headers.set('x-lev8-role', userRole);
    
    // If user is a resident, check if they're trying to access a blocked path
    if (userRole === 'resident') {
      const isBlockedPath = RESIDENT_BLOCKED_PATHS.some(blockedPath => 
        tenantInfo.rest.startsWith(blockedPath)
      );
      
      if (isBlockedPath) {
        // Redirect residents to dashboard if they try to access restricted modules
        const dashboardUrl = new URL(`/${tenantInfo.orgSlug}/${tenantInfo.deptSlug}/dashboard`, request.url);
        return NextResponse.redirect(dashboardUrl);
      }
    }
    
    return response;
  }

  // ============================================================================
  // LEGACY/ROOT ROUTES (redirect authenticated users to their primary org)
  // ============================================================================
  
  // Routes that require authentication (legacy routes)
  const protectedRoutes = [
    '/',
    '/dashboard',
    '/modules',
    '/settings',
    '/forms',
    '/expectations',
    '/truths',
  ];

  const debugRoutes = ['/debug'];
  const adminRoutes = ['/admin'];

  const isProtectedRoute = protectedRoutes.some((route) =>
    route === '/' ? pathname === '/' : pathname.startsWith(route)
  ) && !debugRoutes.some(route => pathname.startsWith(route));
  
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  // If protected route and no user, redirect to login
  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // If auth route and user exists, redirect to their primary organization
  // For now, redirect to /mhs/em as that's the seeded data
  if (isAuthRoute && user) {
    // TODO: Fetch user's primary org from database
    // For now, use default redirect
    const redirectTo = request.nextUrl.searchParams.get('redirect');
    if (redirectTo) {
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
    // Default to Memorial EM
    return NextResponse.redirect(new URL('/mhs/em/dashboard', request.url));
  }

  // If user accesses root or legacy routes, redirect to their primary org
  if (user && (pathname === '/' || pathname === '/dashboard')) {
    // TODO: Fetch user's primary org from database
    return NextResponse.redirect(new URL('/mhs/em/dashboard', request.url));
  }

  // If user accesses legacy module routes, redirect to tenant-aware routes
  if (user && pathname.startsWith('/modules')) {
    const newPath = pathname.replace('/modules', '/mhs/em/modules');
    return NextResponse.redirect(new URL(newPath, request.url));
  }

  // For admin routes, require authentication
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
