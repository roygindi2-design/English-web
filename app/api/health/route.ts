import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { DbProbe } from '@/lib/core/health';
import { buildHealthReport } from '@/lib/core/health';
import { readSupabaseEnv, type SupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/** RULES § 0.1 ד׳ leans on this endpoint, so it may not hang behind a silent database. */
const PROBE_TIMEOUT_MS = 3000;

/**
 * T-053: the only place in the product that sees a raw Supabase error.
 *
 * It maps that error to one of three states and throws the original away. The
 * anon key is used deliberately — under RLS the select can return zero rows for
 * an anonymous caller, and zero rows IS success here: it proves PostgREST
 * answered and the table exists. `head: true` returns no rows at all, so no
 * learner's data is read to answer a health check.
 */
async function probeDatabase(env: SupabaseEnv): Promise<DbProbe> {
  try {
    const supabase = createClient(env.url, env.anonKey, {
      auth: { persistSession: false },
      global: {
        fetch: (input, init) =>
          fetch(input, { ...init, signal: AbortSignal.timeout(PROBE_TIMEOUT_MS) }),
      },
    });

    const { error } = await supabase
      .from('word_progress')
      .select('user_id', { head: true, count: 'exact' })
      .limit(1);

    if (!error) return { status: 'ok' };

    // ⛔ The message goes to the server log and nowhere else.
    console.error('[health] word_progress probe failed:', error.code);
    return error.code === '42P01' || error.code === 'PGRST205'
      ? { status: 'schema_missing' }
      : { status: 'unreachable' };
  } catch {
    return { status: 'unreachable' };
  }
}

export async function GET() {
  const env = readSupabaseEnv();
  // No env means there is nothing to connect to — probing would only add a
  // misleading 'unreachable' on top of the ENV checks that already failed.
  const db = env ? await probeDatabase(env) : null;

  const report = buildHealthReport({
    hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasSupabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    allowPlaceholderContent: process.env.NEXT_PUBLIC_ALLOW_PLACEHOLDER === 'true',
    db,
  });

  return NextResponse.json(report, { status: report.ok ? 200 : 503 });
}
