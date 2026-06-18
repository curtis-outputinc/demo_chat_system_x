import { headers } from 'next/headers';
import { adminBaseForHost } from './insights-host';

// Server-only. Resolves the link-base prefix for the current request's host.
// Returns '' on the insights subdomain, '/admin' everywhere else.
export async function getAdminBase(): Promise<string> {
  const h = await headers();
  return adminBaseForHost(h.get('host'));
}
