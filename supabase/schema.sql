create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  company_name text,
  role_title text,
  use_case text,
  trial_status text not null default 'not_applied',
  trial_submitted_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.profiles add column if not exists company_name text;
alter table public.profiles add column if not exists role_title text;
alter table public.profiles add column if not exists use_case text;
alter table public.profiles add column if not exists trial_status text not null default 'not_applied';
alter table public.profiles add column if not exists trial_submitted_at timestamptz;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  status text not null default 'draft',
  recognition_source text,
  goal integer not null default 50,
  age_range jsonb not null default '[22,40]'::jsonb,
  selling_points jsonb not null default '[]'::jsonb,
  previews jsonb not null default '[]'::jsonb,
  note text not null default '',
  current_version_id uuid,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  version_index integer not null default 1,
  status text not null default 'draft',
  strategy_mode text,
  active_tweaks jsonb not null default '[]'::jsonb,
  advanced_prompt text not null default '',
  form_snapshot jsonb not null default '{}'::jsonb,
  strategy_snapshot jsonb,
  scenes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'projects'
      and constraint_name = 'projects_current_version_id_fkey'
  ) then
    alter table public.projects
      add constraint projects_current_version_id_fkey
      foreign key (current_version_id)
      references public.project_versions(id)
      on delete set null;
  end if;
end;
$$;

create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_projects_updated_at on public.projects(updated_at desc);
create index if not exists idx_project_versions_project_id on public.project_versions(project_id);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

drop trigger if exists set_project_versions_updated_at on public.project_versions;
create trigger set_project_versions_updated_at
before update on public.project_versions
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_versions enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own"
on public.projects
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own"
on public.projects
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own"
on public.projects
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "project_versions_select_own" on public.project_versions;
create policy "project_versions_select_own"
on public.project_versions
for select
to authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = project_versions.project_id
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "project_versions_insert_own" on public.project_versions;
create policy "project_versions_insert_own"
on public.project_versions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.projects
    where projects.id = project_versions.project_id
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "project_versions_update_own" on public.project_versions;
create policy "project_versions_update_own"
on public.project_versions
for update
to authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = project_versions.project_id
      and projects.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.projects
    where projects.id = project_versions.project_id
      and projects.user_id = (select auth.uid())
  )
);
