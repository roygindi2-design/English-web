/**
 * Landing-screen content model — T-027 (F-011, F-012, R-011).
 *
 * The copy lives here rather than inline in `app/page.tsx` for one reason: it
 * is the only marketing surface in the product, and R-011 forbids selling
 * "AI" or "adaptive" (three competitors already sell exactly that, 4.4).
 * A rule that lives in a plan file is a rule nobody enforces; exported strings
 * can be scanned by a test that fails the build.
 *
 * Pure by contract — no React, no DOM, no I/O (lib/core/README.md).
 */
import { GENERATED_PREVIEW_CARDS } from './previewCards.generated';

/** Words we do not put in front of a learner, and why (R-011 · D-017). */
export const FORBIDDEN_MARKETING_TERMS = [
  'AI',
  'A.I.',
  'בינה מלאכותית',
  'אדפטיבי',
  'אדפטיבית',
  'אלגוריתם',
] as const;

/**
 * The three lines that fill the dead space F-011 measured (267px + 275px at
 * 375x812). Each one is a concrete thing the learner receives — not a claim
 * about the technology behind it.
 */
export const LANDING_VALUE_POINTS = [
  'מבחן רמה קצר שקובע מאיפה מתחילים',
  'חזרות מתוזמנות לשיא זיכרון ביום המבחן',
  'עובד בטלפון, גם בלי אינטרנט',
] as const;

/** Headline pair. "10 דקות ביום" is the task-based goal framing of R-012/E2. */
export const LANDING_HEADLINE = '10 דקות ביום. עד תאריך המבחן שלך.';
export const LANDING_SUBHEAD = 'אוצר מילים לאמיר״ם, בקצב שמתכוונן אליך.';

/**
 * One flashcard shown before signup, so a learner can judge the product
 * without handing over an email first (F-012).
 */
export interface PreviewCard {
  /** The English headword, exactly as it appears in the licensed source. */
  headword: string;
  /** Part of speech, as recorded by the source. */
  pos: string;
  /** Answer options in display order; exactly one is correct. */
  options: readonly string[];
  /** Index into `options`. */
  correctIndex: number;
  /**
   * Where this row came from, in the form `dataset` or `generated:<headword
   * source>`. The Hebrew in the content bank was written for this project and
   * the headword list was read from NGSL v1.2 (CC BY-SA 4.0, column 1 only) —
   * data/generated/manifest.json records both halves, and calling that 'ngsl'
   * would credit NGSL with a gloss it never contained.
   * ⛔ Never a copied exam item (R-010), never an AnkiWeb deck (R-013).
   */
  sourceId: string;
}

/**
 * The cards a learner can try before signing up (F-012 · T-034).
 *
 * Empty from T-027 until 2026-08-16, for the reason the deleted comment gave:
 * no licensed Hebrew existed. That stopped being true on 2026-08-07, when the
 * Content agent began writing senses into data/generated/*.jsonl; by the time
 * this landed the bank held 1,187 gate-verified senses across 23 batches and
 * the gate re-check rejected none of them (docs/gate-recheck.md).
 *
 * ⛔ The rows are GENERATED, not authored here — see previewCards.generated.ts
 *    and scripts/build-preview-cards.mjs. Editing this array by hand puts
 *    unverified content in front of a learner.
 */
export const PREVIEW_CARDS: readonly PreviewCard[] = GENERATED_PREVIEW_CARDS;

/** Is there any real content to show before signup yet? */
export function hasPreviewContent(): boolean {
  return PREVIEW_CARDS.length > 0;
}

/** The card to render on the landing screen, or `null` while none exists. */
export function landingPreviewCard(): PreviewCard | null {
  return PREVIEW_CARDS[0] ?? null;
}

/**
 * Guards a card against shipping without provenance. Content with no source id
 * is content somebody made up.
 */
export function isAttributedCard(card: PreviewCard): boolean {
  return (
    card.sourceId.trim().length > 0 &&
    card.headword.trim().length > 0 &&
    card.options.length >= 2 &&
    card.correctIndex >= 0 &&
    card.correctIndex < card.options.length &&
    card.options.every((o) => o.trim().length > 0)
  );
}

/**
 * Builds the word-bounded pattern for a Latin-script forbidden term.
 *
 * Two things go wrong if this is done inline, and F-017 was the first of them:
 *
 * ⓐ `term.replace('.', '\\.')` escapes only the FIRST dot, because
 *    `String.prototype.replace` with a string pattern rewrites one occurrence.
 *    'A.I.' kept its second dot as a regex wildcard and matched "A.Ix", blocking
 *    valid copy at build time. Hence `replaceAll`.
 *
 * ⓑ Escaping the trailing dot *strictly* then swings the other way and misses
 *    the spelling Hebrew marketing copy actually uses — `ה-A.I שלנו`, `A.I
 *    בעברית`, `A.I?` — all of which the buggy wildcard had been catching by
 *    accident. So a trailing dot is matched optionally. Verified: this catches
 *    'A.I.', 'A.I', 'ה-A.I שלנו', 'A.I בעברית', 'A.I?' and still rejects
 *    'A.Ix', 'A.IX', 'A.Ident', 'USA.I.', 'xA.I.'.
 */
function latinTermPattern(term: string): RegExp {
  const escaped = term.replaceAll('.', '\\.');
  const body = escaped.endsWith('\\.') ? `${escaped.slice(0, -2)}\\.?` : escaped;
  return new RegExp(`(^|[^A-Za-z])${body}([^A-Za-z]|$)`);
}

/** A term whose Latin letters would otherwise match inside a longer word. */
function isLatinTerm(term: string): boolean {
  return /^[A-Za-z.]+$/.test(term);
}

/** Returns the forbidden terms present in a piece of user-facing copy (R-011). */
export function forbiddenTermsIn(copy: string): string[] {
  // Discriminate on the term's SHAPE, not on a hardcoded list of two strings:
  // adding 'A.I' or 'ML' to FORBIDDEN_MARKETING_TERMS used to fall through to
  // `includes()` and reintroduce the substring false positive this guards.
  return FORBIDDEN_MARKETING_TERMS.filter((term) =>
    isLatinTerm(term) ? latinTermPattern(term).test(copy) : copy.includes(term),
  );
}
