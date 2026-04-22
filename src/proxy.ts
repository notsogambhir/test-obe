import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // Rate limiting (basic IP tracking in memory, NOT for serverless edge scaling but works as an example)
  // For proper scaling, use Redis (e.g., Upstash) + @upstash/ratelimit.
  const ip = (request as any).ip || request.headers.get('x-forwarded-for') || '127.0.0.1';
  
  // NOTE: Simple route protection could be added here
  // const token = request.cookies.get('auth-token')?.value;
  // if (request.nextUrl.pathname.startsWith('/admin') && !token) { ... }

  // Set response headers to ensure they are added even for edge and static routes
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  
  return response;
}

// See "Matching Paths" below to learn more
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
