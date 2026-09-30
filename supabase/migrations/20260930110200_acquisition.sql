-- Acquisition: installs (attributed) and marketing spend per channel.

create table public.app_installs (
  id bigint generated always as identity primary key,
  user_id uuid references public.app_users (id) on delete set null,
  channel public.acquisition_channel not null,
  campaign text,
  installed_at timestamptz not null
);
create index app_installs_installed_at_idx on public.app_installs (installed_at);
create index app_installs_user_idx on public.app_installs (user_id);

create table public.channel_spend (
  id bigint generated always as identity primary key,
  channel public.acquisition_channel not null,
  spend_date date not null,
  amount_idr bigint not null check (amount_idr >= 0)
);
create index channel_spend_date_idx on public.channel_spend (spend_date);

alter table public.app_installs enable row level security;
alter table public.channel_spend enable row level security;

create policy "admins read installs" on public.app_installs for select to authenticated using ((select public.is_console_admin()));
create policy "admins read channel spend" on public.channel_spend for select to authenticated using ((select public.is_console_admin()));
