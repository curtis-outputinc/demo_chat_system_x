-- Seed the HVAC tenant row.
--
-- Run against the HVAC Supabase project AFTER the base migrations in
-- supabase/migrations/ have been applied. The slug MUST match the
-- VERTICAL env var ('hvac') exactly; that slug is what every engine
-- query filters on.

insert into tenants (slug, name, domain) values
  ('hvac', 'HVAC Demo', 'hvac.output.systems')
  on conflict (slug) do nothing;
