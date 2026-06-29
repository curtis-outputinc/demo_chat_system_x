-- Seed the prequalifier_RS tenant row (Robert Salippo's demo).
--
-- This vertical SHARES the existing prequalifier Supabase project so we
-- can move fast. The slug MUST match the VERTICAL env var
-- ('prequalifier_RS') exactly; that slug is what every engine query
-- filters on.

insert into tenants (slug, name, domain) values
  ('prequalifier_RS', 'RS Mortgage Solutions', 'rs-mortgage-solutions.output.systems')
  on conflict (slug) do nothing;
