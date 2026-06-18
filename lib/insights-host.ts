// Host detection for the insights dashboard subdomain. Kept dependency-free so
// it is safe to import from edge middleware as well as server components.
//
// The dashboard answers on two hosts:
//   chat-insights.output.systems  -> served at the root, links have no /admin prefix
//   chat.output.systems/admin     -> the original path, links keep the /admin prefix
//
// adminBaseForHost returns the prefix every in-app dashboard link should carry
// for the current host. Middleware rewrites the bare paths on the insights host
// back into the /admin route tree.

export const INSIGHTS_HOST_PREFIXES = ['chat-insights', 'insights'];

export function isInsightsHost(host?: string | null): boolean {
  if (!host) return false;
  const h = host.split(':')[0].toLowerCase();
  return INSIGHTS_HOST_PREFIXES.some((prefix) => h.startsWith(`${prefix}.`) || h === prefix);
}

export function adminBaseForHost(host?: string | null): string {
  return isInsightsHost(host) ? '' : '/admin';
}
