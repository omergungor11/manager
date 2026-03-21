import { type NextRequest, NextResponse } from 'next/server';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'manager.local';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') ?? '';
  const currentHost = hostname.replace(`.${ROOT_DOMAIN}`, '');

  // If there's no subdomain or it's "www", let it pass through to the main app
  if (currentHost === ROOT_DOMAIN || currentHost === 'www' || currentHost === '') {
    return NextResponse.next();
  }

  // Set tenant slug header for downstream use
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-slug', currentHost);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
