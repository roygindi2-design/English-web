/**
 * D-023 · D-138 § ג׳ — **התמהיל של שלוש התשובות השגויות.** טהור: ⛔ אפס React, DOM, רשת,
 * env ו-`Math.random` — ההגרלה מגיעה כ-`rnd`.
 *
 * ⚠️ הקובץ נפרד מ-`arcadeRound.ts` בכוונה: שומר-המקור שם סורק את גוף `buildRound` ונופל
 * **בשם** אם מסיח אנגלי יחזור לאפשרויות. הפרדה שומרת על המשמעות של אותה סריקה.
 *
 * ⛔ **המילוי ⛔ אינו נסיגה — הוא משבצת.** נמדד על `data/generated/batch-*.jsonl`:
 * תמהיל מלא קיים ב-216/787 מהמשמעויות, אך **704/787 = 89.5%** מהן נושאות לפחות מסיח
 * מתויג אחד. מילוי לפי משבצת מזיז 89.5% מהסבבים ביום הראשון, ⛔ בלי מילה חדשה אחת.
 */
import { shuffle } from './shuffle';

export type DistractorRelation =
  | 'semantic' | 'orthographic' | 'collocational' | 'unrelated' | 'near_synonym';

export interface TaggedHeDistractor {
  /** התרגום העברי של מילת המסיח האנגלית — ⛔ תמיד ערך שכבר במאגר, ⛔ ולא מחרוזת חדשה. */
  readonly he: string;
  readonly relation: DistractorRelation;
}

/** `D-138 § ג׳`: «שתיים מהשלוש קרובות במשמעות ואחת היא המשמעות של מילה אנגלית דומת־צורה». */
export const SEMANTIC_SLOTS = 2;
export const ORTHOGRAPHIC_SLOTS = 1;

/**
 * ⛔ `near_synonym` פוגע ביכולת ההבחנה (D-023 · Ludewig 2023) ⇒ ⛔ אינו מוגש לעולם.
 * ⛔ `unrelated` ו-`collocational` ⛔ אינם נבחרים כמתויגים: מסיח לא-קשור הוא בדיוק מה
 * שהמילוי מהרמה כבר נותן (T-152), ובחירתו כמתויג הייתה תופסת משבצת בלי לקנות דבר.
 */
function taggedOfRelation(
  tagged: readonly TaggedHeDistractor[],
  relation: DistractorRelation,
  answer: string,
  taken: ReadonlySet<string>,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tagged) {
    if (t.relation !== relation) continue;
    const he = t.he.trim();
    if (he.length === 0 || he === answer || taken.has(he) || seen.has(he)) continue;
    seen.add(he);
    out.push(he);
  }
  return out;
}

export function pickWrongOptions(input: {
  readonly answer: string;
  readonly tagged: readonly TaggedHeDistractor[];
  readonly levelTranslations: readonly string[];
  readonly count: number;
  readonly rnd: () => number;
}): string[] {
  const answer = input.answer.trim();
  const chosen: string[] = [];
  const taken = new Set<string>();

  const take = (values: readonly string[], slots: number): void => {
    let left = slots;
    for (const v of values) {
      if (chosen.length >= input.count || left <= 0) return;
      if (taken.has(v)) continue;
      taken.add(v);
      chosen.push(v);
      left -= 1;
    }
  };

  // ⛔ הסדר הוא סמנטי → צורני → מילוי, ⛔ ולא הפוך: משבצת סמנטית שנתפסה במילוי
  // מחזירה בדיוק את הבעיה ש-T-153 נפתחה בגללה.
  take(shuffle(taggedOfRelation(input.tagged, 'semantic', answer, taken), input.rnd), SEMANTIC_SLOTS);
  take(shuffle(taggedOfRelation(input.tagged, 'orthographic', answer, taken), input.rnd), ORTHOGRAPHIC_SLOTS);

  // T-152 — המילוי הקיים, ⛔ בלי שינוי התנהגות: תרגומים עבריים של מועמדים אחרים ברמה.
  const filler = input.levelTranslations
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && t !== answer && !taken.has(t));
  take(shuffle(filler, input.rnd), input.count - chosen.length);

  return chosen;
}
