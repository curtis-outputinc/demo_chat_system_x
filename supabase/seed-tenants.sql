-- Per-vertical tenant seed.
--
-- The initial migration seeds only the legacy 'output' tenant. Every demo
-- vertical needs its own tenant row whose slug EXACTLY matches the VERTICAL env
-- var (that slug is what every query filters on). Run the matching insert
-- against the Supabase project after applying migrations.
--
-- Add one line per vertical as you create them. on conflict keeps this safe to
-- re-run.

insert into tenants (slug, name, domain) values
  ('injury-lawyer', 'Injury Law Demo', 'injury-lawyer.output.systems')
  on conflict (slug) do nothing;

insert into tenants (slug, name, domain) values
  ('immigration-lawyer', 'Immigration Law Demo', 'immigrationlaw.output.systems')
  on conflict (slug) do nothing;

insert into tenants (slug, name, domain) values
  ('realtor', 'Realtor Demo', 'realtor.output.systems')
  on conflict (slug) do nothing;

insert into tenants (slug, name, domain) values
  ('mortgage-broker', 'Mortgage Broker Demo', 'mortgagebroker.output.systems')
  on conflict (slug) do nothing;

insert into tenants (slug, name, domain) values
  ('financial-advisor', 'Financial Advisor Demo', 'financialadvisor.output.systems')
  on conflict (slug) do nothing;

insert into tenants (slug, name, domain) values
  ('insurance-broker', 'Insurance Broker Demo', 'insurancebroker.output.systems')
  on conflict (slug) do nothing;
