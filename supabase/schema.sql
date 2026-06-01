-- Run this in Supabase SQL Editor (Dashboard → SQL → New query)

-- Profiles: admin can grant edit access
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'viewer' check (role in ('admin', 'editor', 'viewer')),
  can_edit boolean not null default false,
  display_name text,
  created_at timestamptz not null default now()
);

-- Single shared pool document (all app data as JSON)
create table if not exists public.pool_state (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create or replace function public.user_can_edit(uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.user_profiles
    where id = uid and (role = 'admin' or can_edit = true)
  );
$$;

alter table public.user_profiles enable row level security;
alter table public.pool_state enable row level security;

-- Profiles
drop policy if exists "profiles_select" on public.user_profiles;
create policy "profiles_select" on public.user_profiles
  for select to authenticated using (true);

drop policy if exists "profiles_insert_own" on public.user_profiles;
create policy "profiles_insert_own" on public.user_profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists "profiles_update_admin" on public.user_profiles;
create policy "profiles_update_admin" on public.user_profiles
  for update to authenticated
  using (
    exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Pool (shared read, editors write)
drop policy if exists "pool_select" on public.pool_state;
create policy "pool_select" on public.pool_state
  for select to authenticated using (true);

drop policy if exists "pool_insert_editors" on public.pool_state;
create policy "pool_insert_editors" on public.pool_state
  for insert to authenticated
  with check (public.user_can_edit(auth.uid()));

drop policy if exists "pool_update_editors" on public.pool_state;
create policy "pool_update_editors" on public.pool_state
  for update to authenticated
  using (public.user_can_edit(auth.uid()));

-- Realtime (enable in Dashboard → Database → Replication for pool_state)
alter publication supabase_realtime add table public.pool_state;
