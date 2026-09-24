/**
 * T-467 · `39 § 2` · D-287 — the six-character code that opens a closed class.
 *
 * Pure. The code is DRAWN by the database (`create_class` in
 * `supabase/migrations/0032_classes.sql`, from this same alphabet — a test holds the two
 * together); this file only says what a learner typed.
 *
 * ⛔ No `0/O` and ⛔ no `1/I/L`: a code is read off a board or a phone and typed by a
 * child, and those are the pairs that get swapped. 23 letters + 8 digits = 31 symbols ⇒
 * 31^6 ≈ 887M codes.
 */
export const CLASS_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const CLASS_CODE_LENGTH = 6;

const CODE = new RegExp(`^[${CLASS_CODE_ALPHABET}]{${CLASS_CODE_LENGTH}}$`);

/** What the learner typed ⇒ the stored form: every space removed, upper case. */
export function normalizeClassCode(raw: string): string {
  return raw.replace(/\s+/g, '').toUpperCase();
}

/** A NORMALISED string that could be a code. ⛔ It says nothing about whether the class exists. */
export function isClassCode(code: string): boolean {
  return CODE.test(code);
}
