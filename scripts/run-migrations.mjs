#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';
import dns from 'node:dns';
// Force IPv4 — newer Node prefers IPv6 when both A and AAAA exist, but the
// Supabase host's IPv6 endpoint is sometimes unreachable from this machine.
dns.setDefaultResultOrder('ipv4first');

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

const url = env.DIRECT_URL || env.DATABASE_URL;
if (!url) {
  console.error('No DIRECT_URL or DATABASE_URL in .env.local');
  process.exit(1);
}

// Resolve the Postgres host to an IPv4 address ourselves and override host in
// pg's config. The Supabase host's IPv6 endpoint is sometimes unreachable from
// this network; pg client doesn't honour dns.setDefaultResultOrder.
const u = new URL(url);
const ipv4 = await new Promise((resolve, reject) =>
  dns.lookup(u.hostname, { family: 4 }, (e, addr) => (e ? reject(e) : resolve(addr))),
);
console.log(`resolved ${u.hostname} to IPv4 ${ipv4}`);

const files = [
  'supabase/migrations/20260430000001_initial_chatbot_schema.sql',
  'supabase/migrations/20260509000001_chatbot_v1_features.sql',
  'supabase/migrations/20260606000001_insights_reports.sql',
  'supabase/seed-tenants.sql',
];

const { Client } = pg;
const client = new Client({
  host: ipv4,
  port: Number(u.port) || 5432,
  user: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password),
  database: u.pathname.replace(/^\//, '') || 'postgres',
  ssl: { rejectUnauthorized: false, servername: u.hostname },
});
await client.connect();
console.log('connected to postgres');

for (const f of files) {
  const sql = readFileSync(join(root, f), 'utf-8');
  console.log(`\n--- running ${f} ---`);
  try {
    await client.query(sql);
    console.log(`OK: ${f}`);
  } catch (e) {
    console.error(`FAIL: ${f}\n${e.message}`);
    await client.end();
    process.exit(1);
  }
}

console.log('\n=== final tenants table ===');
const r = await client.query('select slug, name, domain from tenants order by slug');
for (const row of r.rows) console.log(`  ${row.slug.padEnd(22)} ${row.name}`);

await client.end();
console.log('\ndone.');
