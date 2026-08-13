/**
 * PURE. No React, no DOM, no fetch, no process.env reads.
 * Everything this module needs is passed in. This is the contract that lets
 * /lib/core/ move to React Native untouched.
 */

/**
 * T-053: the result of touching a real table, reduced to three states BEFORE it
 * reaches this module. The raw Supabase error never crosses this boundary — the
 * impure route maps it, so no PostgREST string can ever leak into the JSON.
 */
export type DbProbe =
  | { readonly status: 'ok' }
  | { readonly status: 'unreachable' }
  | { readonly status: 'schema_missing' };

export interface HealthInput {
  readonly hasSupabaseUrl: boolean;
  readonly hasSupabaseAnonKey: boolean;
  readonly allowPlaceholderContent: boolean;
  /** null = הבדיקה לא נוסתה כלל (ENV חסר, אין למה להתחבר). */
  readonly db: DbProbe | null;
}

/** ⛔ The only four strings `database_schema` is ever allowed to expose. */
const DB_DETAIL: Record<DbProbe['status'] | 'not_probed', string> = {
  ok: 'word_progress reachable',
  schema_missing: 'word_progress missing — migrations not applied',
  unreachable: 'database unreachable',
  not_probed: 'not probed — supabase env missing',
};

export interface HealthReport {
  readonly ok: boolean;
  readonly checks: ReadonlyArray<{ name: string; ok: boolean; detail: string }>;
}

export function buildHealthReport(input: HealthInput): HealthReport {
  const checks = [
    {
      name: 'supabase_url',
      ok: input.hasSupabaseUrl,
      detail: input.hasSupabaseUrl ? 'configured' : 'NEXT_PUBLIC_SUPABASE_URL missing',
    },
    {
      name: 'supabase_anon_key',
      ok: input.hasSupabaseAnonKey,
      detail: input.hasSupabaseAnonKey ? 'configured' : 'NEXT_PUBLIC_SUPABASE_ANON_KEY missing',
    },
    {
      name: 'placeholder_content_blocked',
      ok: !input.allowPlaceholderContent,
      detail: input.allowPlaceholderContent
        ? 'UNVERIFIED CONTENT IS EXPOSED — must be false in production'
        : 'blocked',
    },
    {
      name: 'database_schema',
      ok: input.db?.status === 'ok',
      detail: input.db === null ? DB_DETAIL.not_probed : DB_DETAIL[input.db.status],
    },
  ];

  return { ok: checks.every((c) => c.ok), checks };
}
