import { NextResponse, type NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/workspaces', '/enter', '/invites'];

// Routes that should only be accessible when NOT authenticated
const authRoutes = ['/login', '/sign-up', '/forgot-password', '/reset-password'];

// Simple authentication check
async function isAuthenticated(request: NextRequest): Promise<boolean> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';

    // console.log('[Middleware] Checking auth with cookies:', request.cookies.getAll().map(c => c.name));

    const response = await fetch(`${backendUrl}/auth/me`, {
      method: 'GET',
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
      redirect: 'manual',
    });

    // console.log('[Middleware] Auth check response:', response.status);

    // Return true only if we get 200
    return response.status === 200;
  } catch (error) {
    // If backend is down or network error, assume not authenticated
    // console.log('[Middleware] Auth check error:', error);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  const isAuth = await isAuthenticated(request);

  // Handle protected routes (require authentication)
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!isAuth) {
      // Redirect to login with original path
      const loginUrl = new URL('/login', request.url);
      if (pathname !== '/workspaces') {
        loginUrl.searchParams.set('redirect', pathname);
      }
      return NextResponse.redirect(loginUrl);
    }
  }

  // Handle auth routes (should redirect if already authenticated)
  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (isAuth) {
      return NextResponse.redirect(new URL('/workspaces', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
