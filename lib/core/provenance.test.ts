import { describe, expect, it } from 'vitest';
import {
  NGSL_EXPECTED_ROWS,
  NGSL_VERSION,
  checkNgslRowCount,
  checkSourceUrl,
} from './provenance';

describe('NGSL row count — T-012', () => {
  it('accepts exactly 2,809 rows', () => {
    expect(NGSL_EXPECTED_ROWS).toBe(2809);
    expect(NGSL_VERSION).toBe('1.2');
    expect(checkNgslRowCount(2809)).toEqual({ ok: true });
  });

  it('rejects 2,801 by name — that is the mirrored early version, not a rounding error', () => {
    // F-005: the 2,801-row file exists, parses cleanly, and is wrong. A guard
    // that only said "unexpected count" would read as a parser bug to whoever
    // hits it; naming the number is what makes the message actionable.
    const verdict = checkNgslRowCount(2801);
    expect(verdict.ok).toBe(false);
    expect(verdict.ok === false && verdict.reason).toContain('2801');
    expect(verdict.ok === false && verdict.reason).toContain('2809');
  });

  it('rejects a count that is off by one in either direction', () => {
    expect(checkNgslRowCount(2808).ok).toBe(false);
    expect(checkNgslRowCount(2810).ok).toBe(false);
  });

  it('rejects an empty file instead of reporting 0% coverage later', () => {
    expect(checkNgslRowCount(0).ok).toBe(false);
  });
});

describe('source host — R-004', () => {
  it('accepts the canonical host', () => {
    expect(checkSourceUrl('ngsl', 'https://www.newgeneralservicelist.com/ngsl-1-2.csv')).toEqual({
      ok: true,
    });
    expect(checkSourceUrl('ngsl', 'https://newgeneralservicelist.com/x.csv')).toEqual({ ok: true });
  });

  it('rejects a host that merely ENDS with the domain', () => {
    // `newgeneralservicelist.com.example.net` ends with nothing useful, but
    // naive `endsWith(host)` accepts `evil-newgeneralservicelist.com`, and
    // naive `includes(host)` accepts both. Both were tried; both are wrong.
    const bad = checkSourceUrl('ngsl', 'https://evil-newgeneralservicelist.com/ngsl.csv');
    expect(bad.ok).toBe(false);
  });

  it('rejects a host that merely STARTS with the domain', () => {
    const bad = checkSourceUrl('ngsl', 'https://newgeneralservicelist.com.example.net/ngsl.csv');
    expect(bad.ok).toBe(false);
  });

  it('accepts a real subdomain of the canonical host', () => {
    expect(checkSourceUrl('ngsl', 'https://files.newgeneralservicelist.com/a.csv').ok).toBe(true);
  });

  it('rejects plain http — an unauthenticated mirror is the R-004 failure mode', () => {
    expect(checkSourceUrl('ngsl', 'http://www.newgeneralservicelist.com/x.csv').ok).toBe(false);
  });

  it('rejects a string that is not a url at all, without throwing', () => {
    const verdict = checkSourceUrl('ngsl', 'newgeneralservicelist.com/x.csv');
    expect(verdict.ok).toBe(false);
    expect(verdict.ok === false && verdict.reason).toMatch(/url/i);
  });

  it('guards every other source by its own host, not only NGSL', () => {
    expect(checkSourceUrl('kaikki', 'https://kaikki.org/dictionary/English/x.jsonl').ok).toBe(true);
    expect(checkSourceUrl('kaikki', 'https://newgeneralservicelist.com/x.jsonl').ok).toBe(false);
  });
});
