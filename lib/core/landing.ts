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
   * Which licensed dataset this row came from — NGSL, CEFR-J, Hebrew Wordnet…
   * Never a person, never an agent, never a copied exam item (R-010).
   */
  sourceId: string;
}

/**
 * TODO:CONTENT-PLACEHOLDER — deliberately empty.
 *
 * A preview card needs an English headword *and* a Hebrew gloss. No licensed
 * Hebrew source has been ingested yet (T-007 · T-013/T-016/T-017 are the
 * measurements that pick one, R-005 is still open), and inventing a word pair
 * here — or lifting one from a MAL"O practice exam — is exactly what R-010 and
 * the content rule forbid. So the slot ships empty and the screen renders
 * without it; the day a source lands, this array is the only thing that
 * changes. See plan/20-alerts.md.
 */
export const PREVIEW_CARDS: readonly PreviewCard[] = [];

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

/** Returns the forbidden terms present in a piece of user-facing copy (R-011). */
export function forbiddenTermsIn(copy: string): string[] {
  return FORBIDDEN_MARKETING_TERMS.filter((term) =>
    term === 'AI' || term === 'A.I.'
      ? new RegExp(`(^|[^A-Za-z])${term.replace('.', '\\.')}([^A-Za-z]|$)`).test(copy)
      : copy.includes(term),
  );
}
