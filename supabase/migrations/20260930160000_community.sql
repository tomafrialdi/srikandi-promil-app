-- Community moderation: groups, posts, reports, moderator notes, keyword rules, guidelines.

create type public.community_reason as enum ('self_harm', 'spam', 'medical_misinformation', 'harassment', 'personal_info');
-- open = waiting for a moderator; appealed = author appealed a decision.
create type public.community_mod_status as enum ('clean', 'open', 'appealed', 'approved', 'hidden', 'removed', 'escalated');

create table public.community_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 2 and 60),
  description text not null default '',
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  hosted_by text,
  protected boolean not null default false,
  moderators text[] not null default '{}',
  member_count integer not null default 0 check (member_count >= 0),
  created_by uuid references public.admin_profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.community_groups (id) on delete cascade,
  author_handle text not null,
  -- Snapshot of the author's context at posting time (shown to moderators).
  author_mode text,
  author_account_months integer,
  author_prior_reports integer not null default 0,
  author_last_checkin text,
  body text not null,
  created_at timestamptz not null default now(),
  reason public.community_reason,
  ai_score numeric(3, 2) check (ai_score between 0 and 1),
  mod_status public.community_mod_status not null default 'clean',
  flagged_at timestamptz,
  resolved_at timestamptz,
  resolved_by uuid references public.admin_profiles (id) on delete set null,
  resolution text
);

create index community_posts_created_idx on public.community_posts (created_at desc);
create index community_posts_queue_idx on public.community_posts (mod_status, flagged_at desc) where mod_status in ('open', 'appealed');
create index community_posts_group_idx on public.community_posts (group_id, created_at desc);

create table public.community_reports (
  id bigint generated always as identity primary key,
  post_id uuid not null references public.community_posts (id) on delete cascade,
  reporter_handle text not null,
  reason public.community_reason not null,
  created_at timestamptz not null default now()
);
create index community_reports_post_idx on public.community_reports (post_id);

create table public.community_mod_notes (
  id bigint generated always as identity primary key,
  post_id uuid not null references public.community_posts (id) on delete cascade,
  author_id uuid references public.admin_profiles (id) on delete set null,
  note text not null check (char_length(note) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index community_mod_notes_post_idx on public.community_mod_notes (post_id);

create table public.community_keyword_rules (
  id bigint generated always as identity primary key,
  keyword text not null unique check (char_length(keyword) between 2 and 60),
  action text not null check (action in ('flag', 'hide')),
  reason public.community_reason not null,
  created_at timestamptz not null default now()
);

-- Single-row-per-key settings (community guidelines text).
create table public.community_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.community_groups enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_reports enable row level security;
alter table public.community_mod_notes enable row level security;
alter table public.community_keyword_rules enable row level security;
alter table public.community_settings enable row level security;

create policy "admins read community groups" on public.community_groups for select to authenticated using ((select public.is_console_admin()));
create policy "admins read community posts" on public.community_posts for select to authenticated using ((select public.is_console_admin()));
create policy "admins read community reports" on public.community_reports for select to authenticated using ((select public.is_console_admin()));
create policy "admins read mod notes" on public.community_mod_notes for select to authenticated using ((select public.is_console_admin()));
create policy "admins read keyword rules" on public.community_keyword_rules for select to authenticated using ((select public.is_console_admin()));
create policy "admins read community settings" on public.community_settings for select to authenticated using ((select public.is_console_admin()));
