import { NextRequest, NextResponse } from 'next/server';
import { isInsightsHost } from '@/lib/insights-host';

const ADMIN_USER = 'admin';

function unauthorized() {
  return new NextResponse('Authentication required.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Insights"' },
  });
}

function checkBasicAuth(req: NextRequest): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return true;
  const header = req.headers.get('authorization');
  if (!header || !header.startsWith('Basic ')) return false;
  try {
    const decoded = atob(header.slice(6));
    const sep = decoded.indexOf(':');
    if (sep < 0) return false;
    const user = decoded.slice(0, sep);
    const pass = decoded.slice(sep + 1);
    return user === ADMIN_USER && pass === password;
  } catch {
    return false;
  }
}

// On the insights subdomain (insights.output.systems / chat-insights...) the
// dashboard is served at the root, so a bare path like /conversations is
// rewritten into the /admin route tree. Demo chat hosts keep serving /admin
// directly. Both /admin paths and the insights host are gated by HTTP Basic
// auth using ADMIN_PASSWORD (skipped if the env var is not set, so local dev
// stays frictionless).
export function middleware(req: NextRequest) {
  const insightsHost = isInsightsHost(req.headers.get('host'));
  const isMultiTenantHub = process.env.MULTI_TENANT_ADMIN === 'true';
  const { pathname } = req.nextUrl;

  // Auth gate. On the insights hub deployment (MULTI_TENANT_ADMIN=true) gate
  // every non-asset path on every host (covers the bare *.vercel.app URL too).
  // On per-demo deploys, only gate /admin.
  if (isMultiTenantHub || insightsHost || pathname.startsWith('/admin')) {
    const isApiOrEmbed = pathname.startsWith('/api') || pathname.startsWith('/embed');
    const isAsset = pathname.startsWith('/_next');
    if (!isApiOrEmbed && !isAsset && !checkBasicAuth(req)) {
      return unauthorized();
    }
  }

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
