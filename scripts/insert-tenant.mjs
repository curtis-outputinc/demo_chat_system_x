#!/usr/bin/env node
// Insert a tenant row via the Supabase REST API (HTTPS — works even when the
// direct Postgres connection is blocked on IPv6/IPv4 issues).
//
// Usage: node scripts/insert-tenant.mjs <slug> <name> <domain>
//   e.g. node scripts/insert-tenant.mjs financial-advisor 'Financial Advisor Demo' financialadvisor.output.systems

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const envText = readFileSync(join(root, '.env.local'), 'utf-8');
const env = {};
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (!m) continue;
  let v = m[2];
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
  env[m[1]] = v;
}

const [slug, name, domain] = process.argv.slice(2);
if (!slug || !name || !domain) {
  console.error('Usage: node scripts/insert-tenant.mjs <slug> <name> <domain>');
  process.exit(1);
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data: existing } = await supabase
  .from('tenants')
  .select('slug')
  .eq('slug', slug)
  .maybeSingle();

if (existing) {
  console.log(`tenant '${slug}' already exists — nothing to do`);
} else {
  const { error } = await supabase.from('tenants').insert({ slug, name, domain });
  if (error) {
    console.error('insert failed:', error.message);
    process.exit(1);
  }
  console.log(`inserted: ${slug} | ${name} | ${domain}`);
}

const { data } = await supabase.from('tenants').select('slug, name').order('name');
console.log('\nall tenants:');
for (const t of data ?? []) console.log(`  ${t.slug.padEnd(22)} ${t.name}`);
