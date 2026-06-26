-- Seed the contractor tenant row.
--
-- Run against the contractor Supabase project AFTER the base migrations
-- in supabase/migrations/ have been applied. The slug MUST match the
-- VERTICAL env var ('contractor') exactly; that slug is what every
-- engine query filters on.

insert into tenants (slug, name, domain) values
  ('contractor', 'Contractor Demo', 'contractor.output.systems')
  on conflict (slug) do nothing;
