-- Seed the prequalifier tenant row.
--
-- Run against the prequalifier Supabase project AFTER the base migrations
-- and prequalifications-schema.sql have been applied. The slug MUST match
-- the VERTICAL env var ('prequalifier') exactly; that slug is what every
-- engine query filters on.

insert into tenants (slug, name, domain) values
  ('prequalifier', 'Mortgage Prequalifier Demo', 'prequalify.output.systems')
  on conflict (slug) do nothing;
