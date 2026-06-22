import { NextRequest, NextResponse } from 'next/server';
import { isInsightsHost } from '@/lib/insights-host';

// On the insights subdomain (insights.output.systems / chat-insights...) the
// dashboard is served at the root, so a bare path like /conversations is
// rewritten into the /admin route tree. Demo chat hosts keep serving /admin
// directly. The dashboard is open for demos, no auth gate.
export function middleware(req: NextRequest) {
  const insightsHost = isInsightsHost(req.headers.get('host'));
  const isMultiTenantHub = process.env.MULTI_TENANT_ADMIN === 'true';
  const { pathname } = req.nextUrl;

  if (!insightsHost && !isMultiTenantHub) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/embed') ||
    pathname.startsWith('/_next')
  ) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = pathname === '/' ? '/admin' : `/admin${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.png|logo.png).*)'],
};
