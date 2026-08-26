/**
 * PURE. ⛔ אפס React, DOM, שעון, `window`, `fetch`, `process.env`.
 *
 * T-165ⓑ ⓔ — הפיכת שורה מהמאגר לפריט אחד של חפיסת «משפטים»: **גזע השלמה** (`sense_items`,
 * למשל «I have too much ____ this week.») וארבע אפשרויות **באנגלית**.
 *
 * ⚠️ **וכאן, ⛔ בשונה מהזירה, האפשרויות האנגליות הן הנכונות** (D-023): התשובה היא המילה
 * האנגלית עצמה, וזה בדיוק התרגיל ש-`sense_distractors` נבנו בשבילו. ⛔ **אין להכניס
 * `translation_he` כאפשרות** — זה D-087 בהיפוך, ובדיקה מפילה את המוטציה בשם.
 *
 * ⛔ **אפס כתיבה ל-SM-2 עוברת כאן** (D-032 · D-033). המודול בונה פריט, ⛔ ואינו מדרג.
 *
 * ⛔ **ההחרגה של `low` ⛔ אינה מיושמת כאן שוב** — `supabase/migrations/0003a_low_confidence_is_visible.sql:45-49`
 * אוכפת אותה ב-RLS, ועותק שני של אותו כלל הוא כלל שני שיכול לסטות (D-013 · כלל קליטה 5).
 */

import { mulberry32, shuffle } from './shuffle';

export const SENTENCE_OPTION_COUNT = 4;
export const BLANK_TOKEN = '____';

/**
 * D-023 — סוגי הקשר שמותר להם להפוך לאפשרות. `near_synonym` **נשמר במאגר** ו⛔ לעולם
 * אינו מנוקד: קרוב-נרדף הופך את הפריט לשאלה שאין לה תשובה אחת נכונה.
 *
 * ⚠️ **הוא 0 היום, וההחרגה נכתבת בכל זאת.** כלל שנכתב רק כשהוא נושך עכשיו הוא כלל
 * שאצוות התוכן הבאה מסירה בשקט.
 */
export const SCORABLE_RELATIONS: readonly string[] = [
  'semantic',
  'orthographic',
  'collocational',
  'unrelated',
];

/** טווח עברית ב-Unicode. משמש כשומר בלבד — ⛔ לא כדי לתרגם דבר. */
const HEBREW_RE = /[֐-׿]/;

export interface SentenceCandidate {
  readonly wordId: string;
  /** המילה האנגלית. היא **התשובה** (T-165ⓑ), ⛔ ולא ההנחיה. */
  readonly headword: string;
  readonly stems: readonly { readonly itemIndex: number; readonly stem: string }[];
  readonly distractors: readonly { readonly text: string; readonly relationType: string }[];
  readonly cefrProfileBand: string | null;
}

export interface SentenceItem {
  readonly wordId: string;
  readonly itemIndex: number;
  readonly stem: string;
  readonly answer: string;
  /** בדיוק SENTENCE_OPTION_COUNT, מוגרלות, ⛔ כולן אנגלית. */
  readonly options: readonly string[];
}

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * המסיחים שמותר להם להפוך לאפשרות. שלושה מסננים, וכל אחד מהם מגן על משהו אחר:
 * ⓐ `SCORABLE_RELATIONS` — D-023 · ⓑ אפשרות עברית ⇒ D-087 בהיפוך, ונופלת כאן ⛔ ולא במסך ·
 * ⓒ מסיח שהוא **התשובה עצמה** היה נותן פריט עם שתי תשובות נכונות.
 */
export function usableDistractors(candidate: SentenceCandidate): readonly string[] {
  const answer = candidate.headword.trim().toLowerCase();
  const seen = new Set<string>();
  const out: string[] = [];
  for (const distractor of candidate.distractors) {
    const text = distractor.text.trim();
    if (text.length === 0) continue;
    if (!SCORABLE_RELATIONS.includes(distractor.relationType)) continue;
    if (HEBREW_RE.test(text)) continue;
    const key = text.toLowerCase();
    if (key === answer || seen.has(key)) continue;
    seen.add(key);
    out.push(text);
  }
  return out;
}

/** `false` ⇒ השורה יורדת **לפני** שהיא יכולה להפוך לפריט שבור. */
export function isUsableCandidate(candidate: SentenceCandidate): boolean {
  if (candidate.headword.trim().length === 0) return false;
  if (HEBREW_RE.test(candidate.headword)) return false;
  return usableDistractors(candidate).length >= SENTENCE_OPTION_COUNT - 1;
}

/** `true` ⇒ הגזע מכיל את התשובה מחוץ לחסר ⇒ ⛔ הפריט יורד. */
export function leaksAnswer(stem: string, headword: string): boolean {
  const answer = headword.trim();
  if (answer.length === 0) return false;
  // החסר עצמו יוצא מהטקסט לפני הסריקה: `____` אינו מילה, והוא ⛔ אינו דליפה.
  const withoutBlank = stem.split(BLANK_TOKEN).join(' ');
  return new RegExp(`\\b${escapeForRegExp(answer)}\\b`, 'i').test(withoutBlank);
}

function isUsableStem(stem: string, headword: string): boolean {
  if (!stem.includes(BLANK_TOKEN)) return false;
  return !leaksAnswer(stem, headword);
}

/**
 * ⚠️ הזוגות **משוטחים לפני ההגרלה** ⛔ ולא אחריה: מועמד אחד נושא עד שלושה גזעים, והגרלה
 * ברמת המועמד הייתה נותנת ללומד שלוש שאלות רצופות על אותה מילה.
 *
 * ה-seed מגיע מבחוץ ⇒ אותו seed מחזיר את אותו תור, ⛔ תמיד. `Math.random` ⛔ אינו כאן.
 */
export function buildSentenceItems(
  candidates: readonly SentenceCandidate[],
  seed: number,
  limit: number,
): readonly SentenceItem[] {
  if (limit <= 0) return [];
  const rnd = mulberry32(seed);
  const pairs: { candidate: SentenceCandidate; itemIndex: number; stem: string }[] = [];
  for (const candidate of candidates) {
    if (!isUsableCandidate(candidate)) continue;
    for (const entry of candidate.stems) {
      const stem = entry.stem.trim();
      if (!isUsableStem(stem, candidate.headword)) continue;
      pairs.push({ candidate, itemIndex: entry.itemIndex, stem });
    }
  }
  return shuffle(pairs, rnd)
    .slice(0, limit)
    .map(({ candidate, itemIndex, stem }) => {
      const answer = candidate.headword.trim();
      const wrong = shuffle(usableDistractors(candidate), rnd).slice(0, SENTENCE_OPTION_COUNT - 1);
      return {
        wordId: candidate.wordId,
        itemIndex,
        stem,
        answer,
        options: shuffle([answer, ...wrong], rnd),
      };
    });
}
