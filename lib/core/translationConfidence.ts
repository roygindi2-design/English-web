/**
 * D-055 — אימות צולב לרשומות `!` של H1. טהור: הקורא קורא את הקבצים.
 *
 * ⛔ זה ⛔ אינו senseSelection.ts. שם נבחר **סינסט** מתוך מלאי WordNet (כלל 4 של
 * § 1.7.1, אות שני שמצביע לפי rank); כאן נבדק **מחרוזת עברית אחת** מול מאגר
 * דו-לשוני שני. צירים שונים, קלטים שונים, ⛔ ואין כאן שכפול של אותה הכרעה.
 *
 * ⛔ **מודל שפה ⛔ אינו מקור אימות ולעולם אינו קובע confidence** — דיוק משמעות של
 * מודל נמדד 60–76% (R-014), וכלל 4 של § 1.7.1 דורש שני אותות **בלתי תלויים**.
 * מותר לו למיין לבדיקה אנושית בלבד, וזה קורה מחוץ למודול הזה.
 *
 * ⛔ 'high' ⛔ אינו נגזר כאן לעולם: מקור שני הוא מקור שני, ⛔ ואינו אדם.
 * D-024 נשמרת — רשומה שנשארה low **מוצגת ומסומנת** «טרם אומת», ⛔ ואינה מוסתרת.
 */
import { asRawGloss, classifyGloss, normalizeEnglish, normalizeHebrew } from './lexicon';
import type { GoldSet } from './senseGold';

export type CrossConfidence = 'low' | 'medium';

export type CrossRoute =
  | 'second_agrees'
  | 'second_disagrees'
  | 'second_silent'
  | 'no_second_source';

export interface CrossVerdict {
  readonly confidence: CrossConfidence;
  /** false ⇒ «טרם אומת» נשאר על גב הכרטיס (D-024). */
  readonly verified: boolean;
  readonly route: CrossRoute;
}

export interface SecondSourceIndex {
  /** הגלוסות שהמקור השני נושא ללמה הזאת. קבוצה ריקה = ⛔ אינו מכסה אותה. */
  glossesFor(lemma: string): ReadonlySet<string>;
}

export interface CrossTally {
  readonly candidates: number;
  readonly upgraded: number;
  readonly disagreed: number;
  readonly uncovered: number;
  readonly noSecondSource: number;
  readonly lemmasCovered: number;
}

const EMPTY: ReadonlySet<string> = Object.freeze(new Set<string>());

export function isCrossValidationCandidate(rawGloss: string): boolean {
  const v = classifyGloss(asRawGloss(rawGloss));
  return v.kind === 'keep' && v.confidence === 'low';
}

export function buildSecondSourceIndex(
  entries: readonly { en: string; he: string }[],
): SecondSourceIndex {
  const byLemma = new Map<string, Set<string>>();
  for (const e of entries) {
    const lemma = normalizeEnglish(e.en);
    const he = normalizeHebrew(e.he);
    if (lemma === '' || he === '') continue;
    let set = byLemma.get(lemma);
    if (!set) {
      set = new Set<string>();
      byLemma.set(lemma, set);
    }
    set.add(he);
  }
  return {
    glossesFor(lemma: string): ReadonlySet<string> {
      return byLemma.get(normalizeEnglish(lemma)) ?? EMPTY;
    },
  };
}

/**
 * ⚠️ קריאה מוצהרת של כלל 2. «תואם (התאמת lemma מנורמלת)» נקרא כאן כ**חיתוך
 * גלוסות** ⛔ ולא כ«המקור השני מכיר את הלמה»: כלל 3 מבחין בין «חלוק» ל«לא מכוסה»,
 * וההבחנה הזאת ⛔ אינה קיימת אם די בכיסוי הלמה כדי לשדרג. ⇒ שדרוג דורש שהמחרוזת
 * העברית עצמה תופיע גם במקור השני.
 */
export function verdictFor(
  lemma: string,
  normalizedHebrew: string,
  second: SecondSourceIndex | null,
): CrossVerdict {
  if (second === null) {
    return { confidence: 'low', verified: false, route: 'no_second_source' };
  }
  const glosses = second.glossesFor(lemma);
  if (glosses.size === 0) {
    return { confidence: 'low', verified: false, route: 'second_silent' };
  }
  if (glosses.has(normalizeHebrew(normalizedHebrew))) {
    return { confidence: 'medium', verified: true, route: 'second_agrees' };
  }
  return { confidence: 'low', verified: false, route: 'second_disagrees' };
}

export function crossValidate(
  lemma: string,
  rawGloss: string,
  second: SecondSourceIndex | null,
): CrossVerdict {
  const verdict = classifyGloss(asRawGloss(rawGloss));
  // ⛔ ⛔ אינו מחזיר את מה שקיבל: רשומה שאינה `!` ⛔ אינה בתחום D-055, והחזרת
  // 'medium' עליה הייתה **מורידה** בשקט רשומה שהייתה high. קלט שגוי הוא שגיאה.
  if (verdict.kind !== 'keep' || verdict.confidence !== 'low') {
    throw new RangeError(
      'crossValidate governs `!` records only (D-055). Filter with isCrossValidationCandidate first.',
    );
  }
  return verdictFor(lemma, verdict.match, second);
}

export function tallyCrossValidation(
  gold: GoldSet,
  second: SecondSourceIndex | null,
): CrossTally {
  let candidates = 0;
  let upgraded = 0;
  let disagreed = 0;
  let uncovered = 0;
  let noSecondSource = 0;
  const lemmas = new Set<string>();

  for (const [lemma, entry] of gold.byLemma) {
    for (const he of entry.low) {
      candidates += 1;
      const v = verdictFor(lemma, he, second);
      // ⛔ switch ממצה ⛔ ולא if/else: מסלול שיתווסף ל-CrossRoute ⛔ לא ייפול
      // בשקט לאחת מהדליים הקיימות, וההרכבה candidates = סכום הדליים תישמר.
      switch (v.route) {
        case 'second_agrees':
          upgraded += 1;
          lemmas.add(lemma);
          break;
        case 'second_disagrees':
          disagreed += 1;
          lemmas.add(lemma);
          break;
        case 'second_silent':
          uncovered += 1;
          break;
        case 'no_second_source':
          noSecondSource += 1;
          break;
      }
    }
  }

  return { candidates, upgraded, disagreed, uncovered, noSecondSource, lemmasCovered: lemmas.size };
}

/**
 * ⛔ אחוז ⛔ אינו מודפס כשאין מקור שני. `0 מתוך 3301` הוא מספר נכון שנקרא כטענה
 * שקרית — «האימות רץ ונכשל» במקום «האימות לא רץ». זה בדיוק הכלל ש-
 * measure-sense-accuracy.test.ts כבר אוכף: קלט חסר הוא unavailable ⛔ ולא אפס.
 */
export function renderCrossValidationMarkdown(
  tally: CrossTally,
  provenance: readonly string[],
): string {
  const lines: string[] = [
    '## אימות צולב לרשומות `!` (T-112 · D-055)',
    '',
    'D-055 ביטלה את הכלל הגורף «כל רשומת `!` היא low». רשומה נבדקת מול מקור שני',
    'מורשה (H3 Kaikki CC BY-SA · H4 word2word Apache-2.0): תואמת ⇒ `medium` ומוסר',
    '«טרם אומת»; חלוקה או לא-מכוסה ⇒ נשארת `low`.',
    '',
    '⛔ **מודל שפה ⛔ אינו מקור אימות ולעולם אינו קובע confidence** (D-055 · R-014).',
    '',
  ];
  if (tally.noSecondSource === tally.candidates && tally.candidates > 0) {
    lines.push(
      `- מועמדים (רשומות \`!\`): **${tally.candidates}**`,
      '- שיעור השדרוג: **unavailable** — ⛔ אין מקור שני טעון. ראה `data/README.md` (T-043).',
      '',
    );
  } else {
    const pct =
      tally.candidates === 0 ? '0.0' : ((tally.upgraded / tally.candidates) * 100).toFixed(1);
    lines.push(
      `- מועמדים (רשומות \`!\`): **${tally.candidates}**`,
      `- שודרגו ל-\`medium\` (כלל 2): **${tally.upgraded}** (${pct}%)`,
      `- נשארו \`low\` — המקור השני חלוק (כלל 3): **${tally.disagreed}**`,
      `- נשארו \`low\` — המקור השני ⛔ אינו מכסה (כלל 4): **${tally.uncovered}**`,
      `- למות שהמקור השני מכסה: **${tally.lemmasCovered}**`,
      '',
    );
  }
  lines.push(
    '### מקורות האימות',
    '',
    ...(provenance.length === 0 ? ['- ⛔ אין.'] : provenance.map((p) => `- ${p}`)),
    '',
  );
  return lines.join('\n');
}
