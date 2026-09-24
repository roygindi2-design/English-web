import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CLASS_CODE_ALPHABET, CLASS_CODE_LENGTH, isClassCode, normalizeClassCode } from './classCode';

describe('classCode — T-467 · `39 § 2` · D-287', () => {
  it('failure scenario: a learner types `k7q2mz` for class `K7Q2MZ` — it is the same code', () => {
    expect(normalizeClassCode(' k7q2mz ')).toBe('K7Q2MZ');
    expect(normalizeClassCode('k7q 2mz')).toBe('K7Q2MZ');
    expect(isClassCode(normalizeClassCode(' k7q2mz '))).toBe(true);
  });

  it('⛔ the characters a learner confuses are not in the alphabet — 0/O · 1/I/L', () => {
    for (const c of ['0', 'O', '1', 'I', 'L']) expect(CLASS_CODE_ALPHABET).not.toContain(c);
    expect(isClassCode('K0Q2MZ')).toBe(false);
    expect(isClassCode('K1Q2MZ')).toBe(false);
    expect(isClassCode('KLQ2MZ')).toBe(false);
  });

  it('exactly six characters, upper case — ⛔ a normalised string only', () => {
    expect(CLASS_CODE_LENGTH).toBe(6);
    expect(isClassCode('K7Q2M')).toBe(false);
    expect(isClassCode('K7Q2MZA')).toBe(false);
    expect(isClassCode('k7q2mz')).toBe(false);
    expect(isClassCode('')).toBe(false);
  });

  it('the alphabet has no duplicates and is the one the SQL draws from (0032)', () => {
    expect(new Set(CLASS_CODE_ALPHABET).size).toBe(CLASS_CODE_ALPHABET.length);
    const sql = readFileSync('supabase/migrations/0032_classes.sql', 'utf8');
    expect(sql).toContain(`'${CLASS_CODE_ALPHABET}'`);
  });
});
