-- 0012_auth_attempts.sql — the durable counter behind the auth rate limiter (F-008 half b).
--
-- Why a table and not a Map: the auth routes are Netlify serverless functions
-- (netlify.toml, @netlify/plugin-nextjs). A module-level Map lives inside ONE warm
-- lambda instance and is invisible to the next one, so an attacker fanning 100k
-- addresses across instances would never meet the same counter. The counter has to
-- outlive the process.
--
-- Why an RPC and not a table write: these routes run BEFORE anyone is logged in, on
-- the anon key. An RLS policy that let anon insert or update a counter row would let
-- the caller reset their own counter, which is the same as having no counter at all.
-- The table therefore has NO anon policy. The only door is one SECURITY DEFINER
-- function that increments and returns: a caller can raise their count and can never
-- lower it, and can never read anyone else's bucket.
--
-- Privacy: `bucket` is a salted sha256 prefix computed in the application
-- (lib/supabase/authRateLimit.ts). No address and no IP is ever stored here.

create table if not exists public.auth_attempts (
  bucket text not null,
  window_started_at_ms bigint not null,
  hits integer not null default 0,
  primary key (bucket, window_started_at_ms)
);

-- No policy is created on purpose (see the header). RLS on + zero policies = the
-- table is unreachable to anon and authenticated alike; only the definer function
-- below can touch it.
alter table public.auth_attempts enable row level security;

-- The sweep index. An append-only counter table grows forever otherwise, and the
-- only sane delete predicate is "windows that closed long ago".
create index if not exists auth_attempts_window_started_at_ms_idx
  on public.auth_attempts (window_started_at_ms);

-- Returns the hit count INCLUDING this call, and the window it belongs to.
--
-- The window formula is epoch-aligned and must stay identical to `windowStartMs`
-- in lib/core/rateLimit.ts. If the two ever diverge, the adapter compares a window
-- start it computed against one the database computed, never matches, treats every
-- counter as stale, and the limiter silently allows everything.
create or replace function public.consume_auth_attempt(
  p_bucket text,
  p_window_seconds integer
) returns table (hits integer, window_started_at_ms bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window bigint;
begin
  if p_window_seconds is null or p_window_seconds < 1 then
    raise exception 'p_window_seconds must be >= 1';
  end if;

  v_window := floor(
    (extract(epoch from clock_timestamp()) * 1000)::bigint / (p_window_seconds * 1000)
  )::bigint * (p_window_seconds * 1000)::bigint;

  -- One statement. A select-then-update would let two lambdas in the same
  -- millisecond both read 1 and both write 2, and the limit would never be reached.
  return query
  insert into public.auth_attempts as a (bucket, window_started_at_ms, hits)
  values (p_bucket, v_window, 1)
  on conflict (bucket, window_started_at_ms)
    do update set hits = a.hits + 1
  returning a.hits, a.window_started_at_ms;
end;
$$;

-- The anon routes are the whole point of the function; without this grant the
-- limiter errors on every unauthenticated request and falls back to allowing it.
grant execute on function public.consume_auth_attempt(text, integer) to anon;
grant execute on function public.consume_auth_attempt(text, integer) to authenticated;
