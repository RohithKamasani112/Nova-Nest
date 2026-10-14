-- Optional least-privilege runtime role grants. Run as the database owner:
-- psql "$DATABASE_URL" -v integration_role=your_existing_runtime_role -f infra/magicbricks-db-grants.sql
-- This does not create a role/password or change the CRM's existing role.
GRANT USAGE ON SCHEMA public TO :"integration_role";
GRANT USAGE ON TYPE public.lead_source, public.lead_status TO :"integration_role";
GRANT SELECT, INSERT ON public.leads, public.integration_lead_dedupe TO :"integration_role";
GRANT INSERT ON public.lead_duplicates TO :"integration_role";
