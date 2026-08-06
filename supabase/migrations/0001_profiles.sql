-- T-002 · profiles + Row Level Security
--
-- Apply in the Supabase SQL editor (or `supabase db push`) BEFORE the first
-- real signup. A table without RLS on Supabase's free tier is a public table:
-- the anon key is in the browser, so RLS is the only thing standing between one
-- learner's row and everyone else's.

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  track_id    text        not null default 'amiram',   -- D-016: one track for now
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'One row per learner. Onboarding answers (T-003) and telemetry (T-015) extend this table.';

alter table public.profiles enable row level security;

-- Read/write your own row. Nothing else, from any key that reaches a browser.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Deliberately no delete policy: account deletion is out of scope for T-002,
-- and an absent policy denies by default rather than half-implementing it.

-- The profile row is created by the database, not by the application, so a
-- signup that completes over email confirmation (no session, no API call back
-- into our routes) still ends up with a profile.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, track_id)
  values (new.id, 'amiram')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
