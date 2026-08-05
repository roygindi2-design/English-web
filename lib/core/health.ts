/**
 * PURE. No React, no DOM, no fetch, no process.env reads.
 * Everything this module needs is passed in. This is the contract that lets
 * /lib/core/ move to React Native untouched.
 */

export interface HealthInput {
  readonly hasSupabaseUrl: boolean;
  readonly hasSupabaseAnonKey: boolean;
  readonly allowPlaceholderContent: boolean;
}

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
  ];

  return { ok: checks.every((c) => c.ok), checks };
}
