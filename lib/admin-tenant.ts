import { getSupabaseService, TENANT_SLUG } from './supabase';

export interface AdminTenant {
  slug: string;
  name: string;
}

const LEGACY_SLUGS = new Set(['output', 'demo']);

export function isMultiTenantAdmin(): boolean {
  return process.env.MULTI_TENANT_ADMIN === 'true';
}

let cachedTenants: AdminTenant[] | null = null;
export async function listAdminTenants(): Promise<AdminTenant[]> {
  if (cachedTenants) return cachedTenants;
  const supabase = getSupabaseService();
  const { data, error } = await supabase
    .from('tenants')
    .select('slug, name')
    .order('name');
  if (error || !data) return [];
  cachedTenants = data
    .filter((t) => !LEGACY_SLUGS.has(t.slug))
    .map((t) => ({ slug: t.slug, name: t.name }));
  return cachedTenants;
}

/**
 * Resolve the tenant slug for an admin page request.
 *
 * Multi-tenant mode (env MULTI_TENANT_ADMIN=true, used by the insights hub):
 *   - read ?tenant=<slug> from the URL if present and valid
 *   - otherwise default to the first allowed tenant
 *
 * Single-tenant mode (per-vertical demo deploys):
 *   - always return TENANT_SLUG (= VERTICAL env var)
 */
export async function resolveAdminTenantSlug(searchParams: {
  tenant?: string;
}): Promise<string> {
  if (!isMultiTenantAdmin()) return TENANT_SLUG;
  const tenants = await listAdminTenants();
  const allowed = new Set(tenants.map((t) => t.slug));
  if (searchParams.tenant && allowed.has(searchParams.tenant)) {
    return searchParams.tenant;
  }
  return tenants[0]?.slug ?? TENANT_SLUG;
}

/** Append the active tenant to a URL query string when in multi-tenant mode. */
export function withTenantParam(base: string, tenantSlug: string | null): string {
  if (!isMultiTenantAdmin() || !tenantSlug) return base;
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}tenant=${encodeURIComponent(tenantSlug)}`;
}
