import { createClient, SupabaseClient } from '@supabase/supabase-js';

let serviceClient: SupabaseClient | null = null;

/**
 * Server-only Supabase client. Uses the service role key, bypasses RLS.
 * Never expose to the browser.
 */
export function getSupabaseService(): SupabaseClient {
  if (serviceClient) return serviceClient;

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  }

  serviceClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return serviceClient;
}

// The active vertical (injury-lawyer, mortgage-broker, etc.) is selected by the
// VERTICAL env var and is also the tenant slug used across every Supabase query.
// One deploy = one vertical = one tenant row. Falls back to 'demo' so the app
// still boots before a vertical is configured.
export const TENANT_SLUG = process.env.VERTICAL ?? process.env.TENANT_SLUG ?? 'demo';
