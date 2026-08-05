import { describe, expect, it } from 'vitest';
import { buildHealthReport } from './health';

describe('buildHealthReport', () => {
  it('is ok when everything is configured and placeholders are blocked', () => {
    const r = buildHealthReport({
      hasSupabaseUrl: true,
      hasSupabaseAnonKey: true,
      allowPlaceholderContent: false,
    });
    expect(r.ok).toBe(true);
  });

  it('fails when unverified placeholder content would be exposed', () => {
    const r = buildHealthReport({
      hasSupabaseUrl: true,
      hasSupabaseAnonKey: true,
      allowPlaceholderContent: true,
    });
    expect(r.ok).toBe(false);
    expect(r.checks.find((c) => c.name === 'placeholder_content_blocked')?.ok).toBe(false);
  });

  it('fails when supabase config is missing', () => {
    const r = buildHealthReport({
      hasSupabaseUrl: false,
      hasSupabaseAnonKey: false,
      allowPlaceholderContent: false,
    });
    expect(r.ok).toBe(false);
  });
});
