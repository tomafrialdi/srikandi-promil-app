-- Shared enum types used across modules.

create type public.plan_type as enum ('free', 'trial', 'plus_monthly', 'plus_yearly');

create type public.tracking_mode as enum ('ttc', 'pcos', 'iui', 'ivf', 'after_loss', 'pregnant');

create type public.journey_stage as enum (
  'getting_started',
  'trying',
  'two_week_wait',
  'in_treatment',
  'pregnant',
  'after_loss'
);

create type public.admin_role as enum ('super_admin', 'editor', 'support');

create type public.attention_severity as enum ('error', 'warning', 'info', 'primary');

-- Generic trigger function to keep updated_at fresh.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
