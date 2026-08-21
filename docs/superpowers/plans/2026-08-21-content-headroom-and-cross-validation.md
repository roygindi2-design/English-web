# Content Headroom and H1 Cross-Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** לסגור את שתי שורות המשימה שחולקות **בדיוק אותו שורש** — «סוכן התוכן עובד היום על מספרים שאיש לא מדד» (D-058 · D-055): **T-114** (מדידה שמכמתת, לכל אחת משש הרמות, כמה כותרות **פנויות-עם-תווית** נשארו) ו-**T-112** (אימות צולב לרשומות `!` של H1 מול מקור שני מורשה, במקום הכלל הגורף «הכל low» של D-025).

**Architecture:** שתי השורות נבנות באותן שתי שכבות בדיוק, ⛔ ואין כאן דפוס שלישי — זו בדיוק התבנית של `measure-coverage.mjs` ו-`measure-sense-accuracy.mjs`:

1. **שכבה טהורה** — `lib/core/levelHeadroom.ts` (חשבון ההדרוֹם) ו-`lib/core/translationConfidence.ts` (כלל D-055). ⛔ אפס React · DOM · שעון · env · רשת · fs.
2. **רץ אחד לא-טהור** — `scripts/measure-level-headroom.mjs` קורא `data/` וכותב `docs/level-headroom-report.md`; `scripts/measure-sense-accuracy.mjs` מקבל סעיף נוסף באותו דוח שהוא כבר כותב.

⛔ **אפס עמודה · אפס מיגרציה · אפס כתיבה לדאטהבייס · אפס רכיב ממשק.** שתי המשימות הן **קריאה בלבד** (‏T-114 אומרת זאת במפורש: «⛔ קריאה בלבד, אפס כתיבה»), ו-T-112 מייצרת **מודול הכרעה + מדידה**, ⛔ ולא מסלול כתיבה — אין Supabase חי בסביבת הלופ (‏TD-24).

**Tech Stack:** TypeScript (ללא `any`, `noUncheckedIndexedAccess` פעיל) · Node ≥ 22.18 עם הפשטת טיפוסים מובנית ו-`registerHooks` (הפרֶאמבּל מועתק מילולית מ-`scripts/measure-coverage.mjs`) · Vitest (סביבת `node`) · ⛔ אפס תלות חדשה ב-`package.json`.

**Spec:** `plan/40-decisions.md` — **D-058** (שורה 1548, שלושת הפערים + החוזה בן ארבעת הסעיפים) · **D-055** (שורה 1504, ארבעת הכללים + הסייג על מודל שפה) · **D-034** (‏`cefr_profile_band` מול `senses.cefr_level`) · **D-025** (הכלל שמתבטל חלקית) · **D-024** («טרם אומת» מוצג ⛔ ולא מוסתר) · `plan/50-tasks.md` — שורות **T-114** ו-**T-112** · `plan/20-alerts.md` — **R-014** (דיוק LLM 60–76%) · **R-021** · **R-005/R-006** (הפרדת כיסוי מדיוק) · `plan/15-syllabus-digest.md` § 1.7.1 כלל 4 (שני אותות בלתי תלויים).

## Global Constraints

- ⛔ `/lib/core/` **טהור**: אפס `React` · `window` · `document` · `localStorage` · `sessionStorage` · `process.env` · `fetch` · `fs` · `Date.now()` · `Math.random()` (‏`npm run check:core`). **חותמת הזמן של הדוח מוזרקת כפרמטר**, ⛔ ואינה נלקחת מהמודול.
- ⛔ **אפס תלות חדשה.** `tsx`, `csv-parse`, `zod` וכל שאר המועמדים נשקלו ונפסלו באותו נימוק שכתוב ב-`measure-coverage.mjs`: סקריפט שרץ לעתים רחוקות אינו מצדיק תלות.
- ⛔ **אפס מודל שפה כמקור אימות** (D-055, הסייג): המילים `llm`, `gpt`, `claude`, `openai`, `anthropic` ⛔ אינן מופיעות ב-`lib/core/translationConfidence.ts`. זו ⛔ אינה סיסמה — יש בדיקה שמודדת אותה.
- ⛔ **`words.cefr_profile_band` ⛔ אינה נכתבת ואינה משתנה** (D-058 סעיף 3). שתי המשימות האלה ⛔ אינן פולטות `update`, ⛔ אינן פולטות `insert`, ו⛔ אינן נוגעות ב-`supabase/seed/`.
- ⛔ **`senses.cefr_level` ⛔ אינה ממוזגת עם `cefr_profile_band`** (D-034 · 0008). הן חלוקות על 125 מתוך 343 שורות, ושתיהן נכונות.
- **קלט חסר ⇒ `unavailable`, ⛔ ולא `0`.** זה הכלל שכבר אכוף ב-`measure-sense-accuracy.test.ts` («reports a missing input as unavailable rather than as zero»), והוא חל על שני הרצים כאן. `data/h3-kaikki-en.jsonl` ו-`data/h4-word2word-en-he.tsv` ⛔ **אינם קיימים בריפו** — נמדד 2026-08-21 — ולכן המסלול הזה הוא **המסלול החי**, ⛔ ולא מקרה קצה תאורטי.
- ⛔ **TD-17: אפס הורדה.** אפס `fetch(`, אפס `node:http`, אפס `node:https`, אפס `axios` בשני הסקריפטים.
- כל בדיקת סקריפט היא **סריקת מקור** (התבנית של `scripts/measure-sense-accuracy.test.ts`), ⛔ ולא הרצה שכותבת ל-`docs/`.
- פקודת האימות המלאה, ⛔ ואין טענת הצלחה בלעדיה:
  `npm run typecheck && npm run check:core && npm test && npm run build`
- ⛔ **בלי `[skip ci]`** (`RULES § 0.7`). ⛔ דוחפים ל-`dev` בלבד.

---

## שלוש סטיות מוצהרות, ⛔ ולא השמטות

### סטייה 1 — «כמה `words` יש» ⛔ אינו ניתן לספירה מטבלת `words`, ולכן האוכלוסייה היא **הפרופיל**

שורת T-114 כתובה «כמה `words` יש שיש להן `cefr_profile_band` לא-ריק **וטרם** נכתבה להן משמעות». קריאה מילולית של המשפט הזה מחזירה **אפס בכל רמה ולעד**, ⛔ וזה ⛔ אינו באג במדידה אלא מבנה:

| הראיה | הקובץ | מה היא מוכיחה |
|---|---|---|
| `insert into public.words` יוצא **אך ורק** מרשומות אצווה | `scripts/build-ingest-sql.mjs:192` | שורה ב-`words` קיימת **רק** אחרי שנכתבה לה משמעות |
| `⛔ UPDATE only. This file never creates a word` | `scripts/build-word-levels-sql.mjs:6` | הפרופיל ⛔ אינו יוצר כותרת — הוא רק מתייג כותרת קיימת |

⇒ קבוצת «יש לה `cefr_profile_band` **וטרם** נכתבה לה משמעות» היא **הקבוצה הריקה בהגדרה**. הכוונה של D-058 היא אחרת ומפורשת: «⇒ T-114 (הרצת מדידה שמכמתת **כמה כותרות פנויות-עם-תווית** נשארו בכל רמה)». ⇒ **האוכלוסייה הנמדדת היא הפרופיל** (‏CEFR-J 1.5 ∪ Octanove 1.0), ⛔ ולא טבלת `words`, ו«תפוסה» = הכותרת מופיעה ב-`data/generated/batch-*.jsonl`.

### סטייה 2 — «כותרת פנויה» חייבת להיות גם **מותרת לכתיבה**, אחרת המספר מנפח את עצמו פי 2.7

הפרופיל מתייג 8,843 למות. רשימת ההיתר (`data/generated/allowed-words-2026-08-07.txt`, נגזרת NGSL v1.2) מכילה 24,913. **החיתוך הוא 3,293 בלבד** — נמדד 2026-08-21. כותרת מתויגת שאינה ברשימת ההיתר ⛔ אינה «פנויה»: סוכן התוכן ⛔ אינו רשאי לכתוב עליה. ⇒ הדוח פולט **חמישה מספרים לכל רמה** ⛔ ולא אחד, ו-`free` הוא `allowed − authored` ⛔ ולא `labelled − authored`. `offLimits` מודווח בעמודה משלו כדי שהפער יהיה **נמדד** ⛔ ולא נעלם.

### סטייה 3 — `crossValidate` נשבר על קלט שאינו רשומת `!`, ⛔ ואינו «מחזיר את מה שקיבל»

D-055 מסדיר **אך ורק** רשומות `!`. פונקציה שמקבלת רשומה רגילה ומחזירה `'medium'` **מורידה בשקט** רשומה שהייתה `high`. ⇒ `crossValidate` **זורק `RangeError`** על קלט שאינו מועמד, ו-`isCrossValidationCandidate` הוא המסנן שהקורא חייב להפעיל לפניו. זה הדפוס של `requireLevel` ב-`lib/core/confidence.ts:35`.

---

## מבנה הקבצים

| קובץ | אחריות |
|---|---|
| `lib/core/levelHeadroom.ts` (חדש) | חשבון ההדרוֹם + רינדור הדוח. טהור. |
| `lib/core/levelHeadroom.test.ts` (חדש) | 11 בדיקות יחידה. |
| `scripts/measure-level-headroom.mjs` (חדש) | הרץ: קורא `data/`, כותב `docs/level-headroom-report.md`. |
| `scripts/measure-level-headroom.test.ts` (חדש) | סריקת מקור על הרץ. |
| `package.json` (עריכה) | `measure:headroom`. |
| `lib/core/translationConfidence.ts` (חדש) | כלל D-055 + הסיכום + רינדור הסעיף. טהור. |
| `lib/core/translationConfidence.test.ts` (חדש) | 12 בדיקות יחידה. |
| `scripts/measure-sense-accuracy.mjs` (עריכה) | טוען H3/H4 אם קיימים ומצרף את סעיף האימות הצולב. |
| `scripts/measure-sense-accuracy.test.ts` (עריכה) | 4 בדיקות נוספות. |

---

## Task 1: `measureHeadroom` — חשבון ההדרוֹם, טהור

**Files:**
- Create: `lib/core/levelHeadroom.ts`
- Test: `lib/core/levelHeadroom.test.ts`

**Interfaces:**
- Consumes: `BAND_ORDER`, `CefrBand` מ-`./cefrLevels` · `normalizeEnglish` מ-`./lexicon`.
- Produces:

```ts
export interface HeadroomInput {
  /** lemma מנורמל → תווית. בפועל: buildLevelMap(...).byLemma. */
  readonly labelled: ReadonlyMap<string, CefrBand>;
  /** רשימת ההיתר. מנורמלת בפנים, ⛔ לא בידי הקורא. */
  readonly allowed: Iterable<string>;
  /** כותרות שכבר נכתבה להן משמעות. מנורמלות בפנים. */
  readonly authored: Iterable<string>;
}
export interface BandHeadroom {
  readonly band: CefrBand;
  readonly labelled: number;
  readonly allowed: number;
  readonly authored: number;
  readonly free: number;
  readonly offLimits: number;
}
export interface HeadroomTotals {
  readonly labelled: number;
  readonly allowed: number;
  readonly authored: number;
  readonly free: number;
  readonly offLimits: number;
}
export interface HeadroomReport {
  readonly bands: readonly BandHeadroom[];      // תמיד שש, תמיד ב-BAND_ORDER
  readonly totals: HeadroomTotals;
  readonly authoredUnlabelled: number;          // D-058 פער 3 — עבודה שנפלה לרצפה
  readonly authoredOffLimits: number;           // מתויגת אך מחוץ לרשימת ההיתר
}
export function measureHeadroom(input: HeadroomInput): HeadroomReport;
```

- [x] **Step 1: כתוב את הבדיקה הנופלת**

צור `lib/core/levelHeadroom.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { BAND_ORDER, type CefrBand } from './cefrLevels';
import { measureHeadroom, type HeadroomInput } from './levelHeadroom';

function input(over: Partial<HeadroomInput> = {}): HeadroomInput {
  return {
    labelled: new Map<string, CefrBand>(),
    allowed: [],
    authored: [],
    ...over,
  };
}

describe('measureHeadroom — D-058 headroom arithmetic', () => {
  it('emits all six bands in BAND_ORDER even when every one of them is empty', () => {
    const r = measureHeadroom(input());
    expect(r.bands.map((b) => b.band)).toEqual([...BAND_ORDER]);
  });

  it('counts a labelled+allowed+unauthored headword as free', () => {
    const r = measureHeadroom(input({
      labelled: new Map<string, CefrBand>([['run', 'A1']]),
      allowed: ['run'],
    }));
    const a1 = r.bands.find((b) => b.band === 'A1');
    expect(a1).toMatchObject({ labelled: 1, allowed: 1, authored: 0, free: 1, offLimits: 0 });
  });

  it('moves an authored headword out of free and into authored', () => {
    const r = measureHeadroom(input({
      labelled: new Map<string, CefrBand>([['run', 'A1']]),
      allowed: ['run'],
      authored: ['run'],
    }));
    const a1 = r.bands.find((b) => b.band === 'A1');
    expect(a1).toMatchObject({ allowed: 1, authored: 1, free: 0 });
  });

  it('counts a labelled headword outside the allow-list as offLimits and NEVER as free', () => {
    const r = measureHeadroom(input({
      labelled: new Map<string, CefrBand>([['nevertheless', 'C1']]),
      allowed: [],
    }));
    const c1 = r.bands.find((b) => b.band === 'C1');
    expect(c1).toMatchObject({ labelled: 1, allowed: 0, free: 0, offLimits: 1 });
  });

  it('normalises case and marks on every one of the three inputs', () => {
    const r = measureHeadroom(input({
      labelled: new Map<string, CefrBand>([['run', 'A1']]),
      allowed: ['  RUN '],
      authored: ['Run'],
    }));
    const a1 = r.bands.find((b) => b.band === 'A1');
    expect(a1).toMatchObject({ allowed: 1, authored: 1, free: 0 });
  });

  it('reports an authored headword with no profile label as authoredUnlabelled', () => {
    const r = measureHeadroom(input({ authored: ['zzzz'] }));
    expect(r.authoredUnlabelled).toBe(1);
    expect(r.totals.authored).toBe(0);
  });

  it('reports an authored+labelled headword outside the allow-list as authoredOffLimits', () => {
    const r = measureHeadroom(input({
      labelled: new Map<string, CefrBand>([['run', 'A1']]),
      allowed: [],
      authored: ['run'],
    }));
    expect(r.authoredOffLimits).toBe(1);
    expect(r.totals.authored).toBe(0);
  });

  it('keeps free non-negative and equal to allowed minus authored on every band', () => {
    const r = measureHeadroom(input({
      labelled: new Map<string, CefrBand>([['a', 'A1'], ['b', 'A1'], ['c', 'B2']]),
      allowed: ['a', 'b', 'c'],
      authored: ['a'],
    }));
    for (const b of r.bands) {
      expect(b.free).toBe(b.allowed - b.authored);
      expect(b.free).toBeGreaterThanOrEqual(0);
    }
  });

  it('sums the totals from the bands and from nothing else', () => {
    const r = measureHeadroom(input({
      labelled: new Map<string, CefrBand>([['a', 'A1'], ['b', 'C2']]),
      allowed: ['a'],
    }));
    expect(r.totals).toEqual({ labelled: 2, allowed: 1, authored: 0, free: 1, offLimits: 1 });
  });

  it('ignores a duplicate in the allow-list instead of double-counting it', () => {
    const r = measureHeadroom(input({
      labelled: new Map<string, CefrBand>([['run', 'A1']]),
      allowed: ['run', 'RUN', 'run'],
    }));
    expect(r.bands.find((b) => b.band === 'A1')?.allowed).toBe(1);
  });

  it('never counts one lemma in two bands', () => {
    const r = measureHeadroom(input({
      labelled: new Map<string, CefrBand>([['run', 'B1']]),
      allowed: ['run'],
    }));
    expect(r.totals.labelled).toBe(1);
    expect(r.bands.filter((b) => b.labelled > 0)).toHaveLength(1);
  });
});
```

- [x] **Step 2: הרץ את הבדיקה וודא שהיא נופלת**

Run: `npx vitest run lib/core/levelHeadroom.test.ts`
Expected: FAIL — `Failed to resolve import "./levelHeadroom"`.

- [x] **Step 3: כתוב את המימוש המינימלי**

צור `lib/core/levelHeadroom.ts`:

```ts
/**
 * D-058 — כמה כותרות **פנויות-עם-תווית** נשארו בכל רמה. טהור: הקורא קורא את הקבצים.
 *
 * ⛔ האוכלוסייה היא **הפרופיל** (CEFR-J 1.5 ∪ Octanove 1.0), ⛔ ולא טבלת `words`.
 * שורה ב-`words` נוצרת אך ורק מרשומת אצווה (scripts/build-ingest-sql.mjs:192),
 * ו-scripts/build-word-levels-sql.mjs מצהיר «UPDATE only … never creates a word»
 * ⇒ «מתויגת וטרם נכתבה» היא הקבוצה הריקה בהגדרה, ומספר שנספר משם הוא 0 לנצח.
 *
 * ⛔ «פנויה» ⛔ אינה «מתויגת»: כותרת מחוץ לרשימת ההיתר (NGSL v1.2) אסורה לכתיבה.
 * נמדד 2026-08-21: 8,843 מתויגות מול 3,293 שגם מותרות — פי 2.7. ⇒ free = allowed − authored.
 *
 * ⛔ אינו נוגע ב-senses.cefr_level. D-034: השתיים חלוקות על 125 מתוך 343 שורות, ושתיהן נכונות.
 */
import { BAND_ORDER, type CefrBand } from './cefrLevels';
import { normalizeEnglish } from './lexicon';

export interface HeadroomInput {
  readonly labelled: ReadonlyMap<string, CefrBand>;
  readonly allowed: Iterable<string>;
  readonly authored: Iterable<string>;
}

export interface BandHeadroom {
  readonly band: CefrBand;
  readonly labelled: number;
  readonly allowed: number;
  readonly authored: number;
  readonly free: number;
  readonly offLimits: number;
}

export interface HeadroomTotals {
  readonly labelled: number;
  readonly allowed: number;
  readonly authored: number;
  readonly free: number;
  readonly offLimits: number;
}

export interface HeadroomReport {
  readonly bands: readonly BandHeadroom[];
  readonly totals: HeadroomTotals;
  readonly authoredUnlabelled: number;
  readonly authoredOffLimits: number;
}

/** Set ולא מערך: רשימת ההיתר נמדדה 24,913 שורות, וחיפוש ליניארי בה על 8,843 למות הוא O(n·m). */
function normalizedSet(values: Iterable<string>): Set<string> {
  const out = new Set<string>();
  for (const v of values) {
    const key = normalizeEnglish(v);
    if (key !== '') out.add(key);
  }
  return out;
}

export function measureHeadroom(input: HeadroomInput): HeadroomReport {
  const allowed = normalizedSet(input.allowed);
  const authored = normalizedSet(input.authored);

  // מאותחל מ-BAND_ORDER ⛔ ולא מהנתונים: רמה בלי ולו כותרת אחת חייבת להופיע בדוח
  // כשורת אפס. C1/C2 הן בדיוק המקרה הזה, והן הרמות שבגללן D-058 נכתבה.
  const counters = new Map<CefrBand, { labelled: number; allowed: number; authored: number }>();
  for (const band of BAND_ORDER) counters.set(band, { labelled: 0, allowed: 0, authored: 0 });

  for (const [rawLemma, band] of input.labelled) {
    const lemma = normalizeEnglish(rawLemma);
    if (lemma === '') continue;
    const c = counters.get(band);
    if (c === undefined) continue; // תווית שאינה אחת מהשש — ⛔ אינה נספרת בשקט תחת אחרת
    c.labelled += 1;
    if (!allowed.has(lemma)) continue;
    c.allowed += 1;
    if (authored.has(lemma)) c.authored += 1;
  }

  const bands: BandHeadroom[] = BAND_ORDER.map((band) => {
    const c = counters.get(band) ?? { labelled: 0, allowed: 0, authored: 0 };
    return {
      band,
      labelled: c.labelled,
      allowed: c.allowed,
      authored: c.authored,
      free: c.allowed - c.authored,
      offLimits: c.labelled - c.allowed,
    };
  });

  const totals: HeadroomTotals = bands.reduce(
    (acc, b) => ({
      labelled: acc.labelled + b.labelled,
      allowed: acc.allowed + b.allowed,
      authored: acc.authored + b.authored,
      free: acc.free + b.free,
      offLimits: acc.offLimits + b.offLimits,
    }),
    { labelled: 0, allowed: 0, authored: 0, free: 0, offLimits: 0 },
  );

  // שני מוני הכשל של D-058. הם ⛔ אינם נסכמים לתוך totals: כותרת שאין לה תווית
  // אינה שייכת לאף רמה, וסכימתה לתוך רמה כלשהי היא בדיוק פער 3 שהם מודדים.
  let authoredUnlabelled = 0;
  let authoredOffLimits = 0;
  const labelledKeys = new Set<string>();
  for (const rawLemma of input.labelled.keys()) {
    const key = normalizeEnglish(rawLemma);
    if (key !== '') labelledKeys.add(key);
  }
  for (const lemma of authored) {
    if (!labelledKeys.has(lemma)) authoredUnlabelled += 1;
    else if (!allowed.has(lemma)) authoredOffLimits += 1;
  }

  return { bands, totals, authoredUnlabelled, authoredOffLimits };
}
```

- [x] **Step 4: הרץ את הבדיקה וודא שהיא עוברת**

Run: `npx vitest run lib/core/levelHeadroom.test.ts`
Expected: PASS — 11 passed.

- [x] **Step 5: הרץ את שער הטוהר**

Run: `npm run check:core`
Expected: `/lib/core purity: OK`

- [x] **Step 6: קומיט**

```bash
git add lib/core/levelHeadroom.ts lib/core/levelHeadroom.test.ts
git commit -m "loop(DEV): T-114 headroom arithmetic (pure)"
```

---

## Task 2: `renderHeadroomMarkdown` — הדוח

**Files:**
- Modify: `lib/core/levelHeadroom.ts` (הוספה בסוף)
- Test: `lib/core/levelHeadroom.test.ts` (הוספה בסוף)

**Interfaces:**
- Consumes: `HeadroomReport` מ-Task 1.
- Produces:

```ts
export function renderHeadroomMarkdown(
  report: HeadroomReport,
  provenance: readonly string[],
  generatedAt: string,
): string;
```

- [x] **Step 1: כתוב את הבדיקה הנופלת**

הוסף בסוף `lib/core/levelHeadroom.test.ts`:

```ts
import { renderHeadroomMarkdown } from './levelHeadroom';

describe('renderHeadroomMarkdown', () => {
  const report = measureHeadroom(input({
    labelled: new Map<string, CefrBand>([['run', 'A1'], ['walk', 'A1'], ['whereas', 'C2']]),
    allowed: ['run', 'walk'],
    authored: ['run'],
  }));
  const md = renderHeadroomMarkdown(report, ['data/x.csv — 3 rows'], '2026-08-21T12:00:00Z');

  it('prints a row for every one of the six bands, including the empty ones', () => {
    for (const band of BAND_ORDER) expect(md).toMatch(new RegExp(`\\|\\s*${band}\\s*\\|`));
  });

  it('carries the injected timestamp and never invents one', () => {
    expect(md).toContain('2026-08-21T12:00:00Z');
  });

  it('prints the provenance lines it was given', () => {
    expect(md).toContain('data/x.csv — 3 rows');
  });

  it('states that the population is the profile and NOT the words table', () => {
    expect(md).toContain('cefr_profile_band');
    expect(md).toMatch(/⛔/);
  });

  it('prints the free number for A1 as allowed minus authored', () => {
    expect(md).toMatch(/\|\s*A1\s*\|\s*2\s*\|\s*2\s*\|\s*1\s*\|\s*1\s*\|\s*0\s*\|/);
  });
});
```

- [x] **Step 2: הרץ ואמת נפילה**

Run: `npx vitest run lib/core/levelHeadroom.test.ts`
Expected: FAIL — `renderHeadroomMarkdown is not a function`.

- [x] **Step 3: כתוב את המימוש**

הוסף בסוף `lib/core/levelHeadroom.ts`:

```ts
/**
 * `generatedAt` מוזרק ⛔ ואינו נלקח כאן: `Date` בקובץ ב-/lib/core מפיל את
 * `npm run check:core`, וזו בדיוק הסיבה שהשער קיים.
 */
export function renderHeadroomMarkdown(
  report: HeadroomReport,
  provenance: readonly string[],
  generatedAt: string,
): string {
  const lines: string[] = [
    '<!-- GENERATED by scripts/measure-level-headroom.mjs (T-114). ⛔ Do not hand-edit. -->',
    '',
    '# כמה כותרות פנויות-עם-תווית נשארו בכל רמה',
    '',
    `נמדד: ${generatedAt}`,
    '',
    '⛔ האוכלוסייה היא **הפרופיל** (`cefr_profile_band`: CEFR-J 1.5 ∪ Octanove 1.0),',
    '⛔ ולא טבלת `words` — שורה שם נוצרת אך ורק אחרי שנכתבה לה משמעות, ולכן',
    '"מתויגת וטרם נכתבה" היא הקבוצה הריקה בהגדרה.',
    '',
    '⛔ **`free` הוא המספר היחיד שסוכן התוכן רשאי לתכנן לפיו** (D-058 סעיף 1):',
    'כותרת מתויגת שאינה ברשימת ההיתר (NGSL v1.2) אסורה לכתיבה ונספרת ב-`offLimits`.',
    '',
    '| רמה | מתויגות | מותרות | נכתבו | **פנויות** | מחוץ להיתר |',
    '|---|---|---|---|---|---|',
  ];
  for (const b of report.bands) {
    lines.push(
      `| ${b.band} | ${b.labelled} | ${b.allowed} | ${b.authored} | **${b.free}** | ${b.offLimits} |`,
    );
  }
  const t = report.totals;
  lines.push(
    `| **סה"כ** | ${t.labelled} | ${t.allowed} | ${t.authored} | **${t.free}** | ${t.offLimits} |`,
    '',
    '## שני מוני הכשל של D-058',
    '',
    `- כותרות שנכתבו ואין להן תווית פרופיל (פער 3 — עבודה שנפלה לרצפה): **${report.authoredUnlabelled}**`,
    `- כותרות שנכתבו, מתויגות, ⛔ אך מחוץ לרשימת ההיתר: **${report.authoredOffLimits}**`,
    '',
    '## מקורות',
    '',
    ...provenance.map((p) => `- ${p}`),
    '',
  );
  return lines.join('\n');
}
```

- [x] **Step 4: הרץ ואמת מעבר**

Run: `npx vitest run lib/core/levelHeadroom.test.ts`
Expected: PASS — 16 passed.

- [x] **Step 5: קומיט**

```bash
git add lib/core/levelHeadroom.ts lib/core/levelHeadroom.test.ts
git commit -m "loop(DEV): T-114 headroom report rendering"
```

---

## Task 3: `measure-level-headroom.mjs` — הרץ. **סוגר את T-114**

**Files:**
- Create: `scripts/measure-level-headroom.mjs`
- Create: `scripts/measure-level-headroom.test.ts`
- Modify: `package.json` (בלוק `scripts`)

**Interfaces:**
- Consumes: `measureHeadroom`, `renderHeadroomMarkdown` מ-Task 1/2 · `parseCefrCsv`, `buildLevelMap` מ-`lib/core/cefrLevels.ts` · `parseBatchFile` מ-`lib/core/batchRecord.ts` (‏`rec.sense.headword`).
- Produces: `docs/level-headroom-report.md` · `npm run measure:headroom`.

- [x] **Step 1: כתוב את בדיקת סריקת המקור**

צור `scripts/measure-level-headroom.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('scripts/measure-level-headroom.mjs', 'utf8');

describe('measure-level-headroom.mjs', () => {
  it('never fetches anything (TD-17)', () => {
    expect(SRC).not.toMatch(/\bfetch\s*\(|node:https?|axios/);
  });

  it('is read-only — it writes exactly one file, and it is under docs/', () => {
    expect(SRC.match(/writeFileSync\(/g)).toHaveLength(1);
    expect(SRC).toContain("join('docs', 'level-headroom-report.md')");
  });

  it('⛔ never emits SQL and never touches the seed directory (D-058 §3)', () => {
    expect(SRC).not.toMatch(/insert into|update public\.|supabase\/seed|SEED_OUT_DIR/i);
  });

  it('reads both CEFR profiles, the allow-list and the batches', () => {
    for (const f of [
      'cefrj-vocabulary-profile-1.5.csv',
      'octanove-vocabulary-profile-c1c2-1.0.csv',
      'allowed-words-2026-08-07.txt',
      'batch-',
    ]) expect(SRC).toContain(f);
  });

  it('reports a missing input as unavailable rather than as zero', () => {
    expect(SRC).toContain('unavailable');
  });

  it('is registered as an npm script', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    expect(pkg.scripts['measure:headroom']).toBe('node scripts/measure-level-headroom.mjs');
  });

  it('takes its timestamp at the impure layer, never inside lib/core', () => {
    expect(SRC).toContain('new Date().toISOString()');
  });
});
```

- [x] **Step 2: הרץ ואמת נפילה**

Run: `npx vitest run scripts/measure-level-headroom.test.ts`
Expected: FAIL — `ENOENT: no such file or directory, open 'scripts/measure-level-headroom.mjs'`.

- [x] **Step 3: כתוב את הרץ**

צור `scripts/measure-level-headroom.mjs`:

```js
#!/usr/bin/env node
/**
 * T-114 · D-058 — כמה כותרות פנויות-עם-תווית נשארו בכל רמה.
 *
 * ⛔ קריאה בלבד. הוא קורא data/ וכותב קובץ אחד תחת docs/. ⛔ אפס SQL, אפס seed,
 * אפס עמודה. `words.cefr_profile_band` היא עמודת מקור חיצוני (D-058 סעיף 3).
 *
 * ⛔ אינו מוריד דבר (TD-17). הפרֶאמבּל של registerHooks מועתק מילולית מ-
 * scripts/measure-coverage.mjs מאותה סיבה: Node ≥ 22.18 מפשיט טיפוסים בעצמו,
 * אך ⛔ אינו פותר את המפרטים חסרי-הסיומת ש-lib/core משתמש בהם.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) {
      try {
        return withTsFormat(nextResolve(`${specifier}.ts`, context));
      } catch {
        // Not a TypeScript sibling — fall through to the default resolver.
      }
    }
    return withTsFormat(nextResolve(specifier, context));
  },
});

function withTsFormat(resolved) {
  if (resolved && typeof resolved.url === 'string' && resolved.url.endsWith('.ts')) {
    return { ...resolved, format: 'module-typescript' };
  }
  return resolved;
}

const { parseCefrCsv, buildLevelMap } = await import('../lib/core/cefrLevels.ts');
const { parseBatchFile } = await import('../lib/core/batchRecord.ts');
const { measureHeadroom, renderHeadroomMarkdown } = await import('../lib/core/levelHeadroom.ts');

const DATA = 'data';
const GENERATED = join(DATA, 'generated');
const OUT = join('docs', 'level-headroom-report.md');
const ALLOWED_WORDS_FILE = 'allowed-words-2026-08-07.txt';
const PROFILES = [
  'cefrj-vocabulary-profile-1.5.csv',
  'octanove-vocabulary-profile-c1c2-1.0.csv',
];

const provenance = [];

// --- 1. הפרופילים ------------------------------------------------------------
// ⛔ פרופיל חסר הוא עצירה ⛔ ולא "unavailable": בלי תוויות אין אוכלוסייה כלל,
// ודוח שכל שורותיו אפס היה נקרא כ"נגמרו הכותרות" במקום כ"לא נמדד".
const levelEntries = [];
for (const name of PROFILES) {
  const path = join(DATA, name);
  if (!existsSync(path)) {
    console.error(`\n✗ ${path} חסר — אין אוכלוסייה למדוד. ראה data/README.md (T-043).\n`);
    process.exit(1);
  }
  const parsed = parseCefrCsv(readFileSync(path, 'utf8'));
  levelEntries.push(...parsed.entries);
  provenance.push(
    `\`${path}\` — ${parsed.rows} שורות · ${parsed.entries.length} רשומות · `
    + `${parsed.skipped} דולגו · ${parsed.unknownPos} ללא POS מוכר`,
  );
}
const map = buildLevelMap(levelEntries);

// --- 2. רשימת ההיתר ----------------------------------------------------------
const allowedPath = join(GENERATED, ALLOWED_WORDS_FILE);
let allowed = [];
if (existsSync(allowedPath)) {
  allowed = readFileSync(allowedPath, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'));
  provenance.push(`\`${allowedPath}\` — ${allowed.length} צורות מותרות (NGSL v1.2)`);
} else {
  provenance.push(`\`${allowedPath}\` — **unavailable** ⇒ אפס כותרות מותרות, ⛔ ולא "הכל מותר"`);
}

// --- 3. מה כבר נכתב ----------------------------------------------------------
const authored = [];
const batchFiles = existsSync(GENERATED)
  ? readdirSync(GENERATED).filter((f) => /^batch-.*\.jsonl$/.test(f)).sort()
  : [];
for (const file of batchFiles) {
  const records = parseBatchFile(readFileSync(join(GENERATED, file), 'utf8'));
  for (const rec of records) authored.push(rec.sense.headword);
  provenance.push(`\`${join(GENERATED, file)}\` — ${records.length} רשומות`);
}
if (batchFiles.length === 0) {
  provenance.push(`\`${GENERATED}\` — **unavailable** ⇒ אפס כותרות כתובות`);
}

// --- 4. מדידה ופלט -----------------------------------------------------------
const report = measureHeadroom({ labelled: map.byLemma, allowed, authored });
mkdirSync('docs', { recursive: true });
writeFileSync(OUT, renderHeadroomMarkdown(report, provenance, new Date().toISOString()), 'utf8');

for (const b of report.bands) {
  console.log(
    `${b.band}: free ${b.free} (labelled ${b.labelled} · allowed ${b.allowed} · authored ${b.authored} · offLimits ${b.offLimits})`,
  );
}
console.log(
  `TOTAL: free ${report.totals.free} · authoredUnlabelled ${report.authoredUnlabelled} · authoredOffLimits ${report.authoredOffLimits}`,
);
console.log(`\nwrote ${OUT}`);
```

- [x] **Step 4: רשום את הסקריפט ב-`package.json`**

הוסף מיד אחרי השורה של `measure:sense`:

```json
    "measure:headroom": "node scripts/measure-level-headroom.mjs",
```

- [x] **Step 5: הרץ את הבדיקה וודא שהיא עוברת**

Run: `npx vitest run scripts/measure-level-headroom.test.ts`
Expected: PASS — 7 passed.

- [x] **Step 6: הרץ את המדידה עצמה ואמת מול המספרים שנמדדו בטיק התכנון**

Run: `npm run measure:headroom`
Expected — ⛔ **המספרים האלה נמדדו ב-2026-08-21 ואינם ניחוש.** סטייה בהם ⛔ אינה «רענון», היא באג:

```
A1: free 562 (labelled 1083 · allowed 867 · authored 305 · offLimits 216)
A2: free 730 (labelled 1272 · allowed 830 · authored 100 · offLimits 442)
B1: free 941 (labelled 2174 · allowed 1015 · authored 74 · offLimits 1159)
B2: free 456 (labelled 2489 · allowed 526 · authored 70 · offLimits 1963)
C1: free 46 (labelled 929 · allowed 46 · authored 0 · offLimits 883)
C2: free 9 (labelled 896 · allowed 9 · authored 0 · offLimits 887)
TOTAL: free 2744 · authoredUnlabelled 0 · authoredOffLimits 0
```

⚠️ **הפער מול D-058 הוא ראיה, ⛔ ולא טעות שמתקנים:** D-058 כותבת «55 ו-14 כותרות בסך הכל» ל-C1/C2, והמדידה נותנת **46** ו-**9**. שני המספרים נכונים על אוכלוסיות שונות (‏D-058 ספרה `(headword,pos)`, כאן נספר lemma מנורמל). **רשום את הפער ב-`plan/30-architecture.md`** כשורה אחת, ⛔ ואל תשנה לא את הקוד ולא את D-058.

- [x] **Step 7: קומיט — T-114 נסגרת**

```bash
git add scripts/measure-level-headroom.mjs scripts/measure-level-headroom.test.ts package.json docs/level-headroom-report.md
git commit -m "loop(DEV): T-114 measure level headroom"
```

---

## Task 4: `translationConfidence.ts` — כלל D-055, טהור

**Files:**
- Create: `lib/core/translationConfidence.ts`
- Test: `lib/core/translationConfidence.test.ts`

**Interfaces:**
- Consumes: `asRawGloss`, `classifyGloss`, `normalizeEnglish`, `normalizeHebrew` מ-`./lexicon` · `GoldSet` מ-`./senseGold` (‏`byLemma: ReadonlyMap<string, { lemma, accepted: ReadonlySet<string>, low: ReadonlySet<string> }>`, ו-`low` מכיל עברית **כבר מנורמלת** — `verdict.match`) · `SourceEntry` (`{ en: string; he: string }`) מ-`./sources`.
- Produces:

```ts
export type CrossConfidence = 'low' | 'medium';
export type CrossRoute = 'second_agrees' | 'second_disagrees' | 'second_silent' | 'no_second_source';
export interface CrossVerdict {
  readonly confidence: CrossConfidence;
  readonly verified: boolean;
  readonly route: CrossRoute;
}
export interface SecondSourceIndex {
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
export function isCrossValidationCandidate(rawGloss: string): boolean;
export function buildSecondSourceIndex(entries: readonly { en: string; he: string }[]): SecondSourceIndex;
export function verdictFor(lemma: string, normalizedHebrew: string, second: SecondSourceIndex | null): CrossVerdict;
export function crossValidate(lemma: string, rawGloss: string, second: SecondSourceIndex | null): CrossVerdict;
export function tallyCrossValidation(gold: GoldSet, second: SecondSourceIndex | null): CrossTally;
```

- [ ] **Step 1: כתוב את הבדיקה הנופלת**

צור `lib/core/translationConfidence.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildGoldSet } from './senseGold';
import {
  buildSecondSourceIndex,
  crossValidate,
  isCrossValidationCandidate,
  tallyCrossValidation,
  verdictFor,
} from './translationConfidence';

const SECOND = buildSecondSourceIndex([
  { en: 'run', he: 'לרוץ' },
  { en: 'Run', he: 'ריצה' },
  { en: 'bank', he: 'בנק' },
]);

describe('isCrossValidationCandidate — D-055 governs `!` records and nothing else', () => {
  it('accepts a bang-prefixed gloss', () => {
    expect(isCrossValidationCandidate('!לרוץ')).toBe(true);
  });

  it('rejects a plain gloss — it was never low, and must not be downgraded', () => {
    expect(isCrossValidationCandidate('לרוץ')).toBe(false);
  });

  it('rejects a GAP record — it is not a translation at all (D-025)', () => {
    expect(isCrossValidationCandidate('GAP!')).toBe(false);
  });
});

describe('verdictFor — the four rules of D-055', () => {
  it('rule 2 — the second source carries the same gloss ⇒ medium, verified', () => {
    expect(verdictFor('run', 'לרוץ', SECOND)).toEqual({
      confidence: 'medium', verified: true, route: 'second_agrees',
    });
  });

  it('rule 3 — the second source covers the lemma but not this gloss ⇒ stays low', () => {
    expect(verdictFor('bank', 'גדה', SECOND)).toEqual({
      confidence: 'low', verified: false, route: 'second_disagrees',
    });
  });

  it('rule 4 — the second source does not cover the lemma ⇒ stays low. Absence of evidence is not evidence', () => {
    expect(verdictFor('zzzz', 'משהו', SECOND)).toEqual({
      confidence: 'low', verified: false, route: 'second_silent',
    });
  });

  it('no second source at all ⇒ stays low, and says so in its own route', () => {
    expect(verdictFor('run', 'לרוץ', null)).toEqual({
      confidence: 'low', verified: false, route: 'no_second_source',
    });
  });

  it('matches on the NORMALISED lemma — case and spacing never decide', () => {
    expect(verdictFor('  RUN ', 'ריצה', SECOND).route).toBe('second_agrees');
  });

  it('matches Hebrew with niqqud against the same gloss without it', () => {
    const second = buildSecondSourceIndex([{ en: 'run', he: 'לָרוּץ' }]);
    expect(verdictFor('run', 'לרוץ', second).route).toBe('second_agrees');
  });
});

describe('crossValidate — the raw-gloss entry point', () => {
  it('strips the bang and routes exactly as verdictFor does', () => {
    expect(crossValidate('run', '!לרוץ', SECOND).route).toBe('second_agrees');
  });

  it('⛔ throws on a gloss D-055 does not govern, instead of silently downgrading it', () => {
    expect(() => crossValidate('run', 'לרוץ', SECOND)).toThrow(RangeError);
  });
});

describe('tallyCrossValidation', () => {
  const gold = buildGoldSet(['run\t!לרוץ', 'bank\t!גדה', 'zzzz\t!משהו', 'run\tריצה'].join('\n'));

  it('counts every `!` gloss in the gold set and no other', () => {
    expect(tallyCrossValidation(gold, SECOND).candidates).toBe(3);
  });

  it('routes each candidate to exactly one bucket, and the buckets sum to candidates', () => {
    const t = tallyCrossValidation(gold, SECOND);
    expect(t.upgraded + t.disagreed + t.uncovered + t.noSecondSource).toBe(t.candidates);
    expect(t).toMatchObject({ upgraded: 1, disagreed: 1, uncovered: 1, noSecondSource: 0 });
  });

  it('with no second source, every candidate lands in noSecondSource and none is upgraded', () => {
    const t = tallyCrossValidation(gold, null);
    expect(t).toMatchObject({ candidates: 3, upgraded: 0, noSecondSource: 3 });
  });
});

describe('⛔ D-055 — a language model is never a validation source', () => {
  it('names no model anywhere in the module', async () => {
    const src = await import('node:fs').then((fs) =>
      fs.readFileSync('lib/core/translationConfidence.ts', 'utf8'));
    expect(src.toLowerCase()).not.toMatch(/\bllm\b|\bgpt\b|openai|anthropic|\bclaude\b/);
  });
});
```

- [ ] **Step 2: הרץ ואמת נפילה**

Run: `npx vitest run lib/core/translationConfidence.test.ts`
Expected: FAIL — `Failed to resolve import "./translationConfidence"`.

- [ ] **Step 3: כתוב את המימוש**

צור `lib/core/translationConfidence.ts`:

```ts
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
        case 'second_agrees': upgraded += 1; lemmas.add(lemma); break;
        case 'second_disagrees': disagreed += 1; lemmas.add(lemma); break;
        case 'second_silent': uncovered += 1; break;
        case 'no_second_source': noSecondSource += 1; break;
      }
    }
  }

  return { candidates, upgraded, disagreed, uncovered, noSecondSource, lemmasCovered: lemmas.size };
}
```

- [ ] **Step 4: הרץ ואמת מעבר**

Run: `npx vitest run lib/core/translationConfidence.test.ts`
Expected: PASS — 15 passed.

- [ ] **Step 5: שער הטוהר**

Run: `npm run check:core`
Expected: `/lib/core purity: OK`

- [ ] **Step 6: קומיט**

```bash
git add lib/core/translationConfidence.ts lib/core/translationConfidence.test.ts
git commit -m "loop(DEV): T-112 D-055 cross-validation rule (pure)"
```

---

## Task 5: סעיף האימות הצולב בדוח. **סוגר את T-112**

**Files:**
- Modify: `lib/core/translationConfidence.ts` (הוספה בסוף)
- Modify: `lib/core/translationConfidence.test.ts` (הוספה בסוף)
- Modify: `scripts/measure-sense-accuracy.mjs`
- Modify: `scripts/measure-sense-accuracy.test.ts`

**Interfaces:**
- Consumes: `CrossTally` מ-Task 4 · `parsePairsTsv`, `parseKaikkiJsonl` מ-`lib/core/sources.ts` (שניהם מחזירים `{ entries: readonly { en, he }[], lines, skipped }`).
- Produces:

```ts
export function renderCrossValidationMarkdown(
  tally: CrossTally,
  provenance: readonly string[],
): string;
```

- [ ] **Step 1: כתוב את הבדיקה הנופלת על הרינדור**

הוסף בסוף `lib/core/translationConfidence.test.ts`:

```ts
import { renderCrossValidationMarkdown } from './translationConfidence';

describe('renderCrossValidationMarkdown', () => {
  const gold = buildGoldSet(['run\t!לרוץ', 'bank\t!גדה', 'zzzz\t!משהו'].join('\n'));

  it('prints unavailable — and never 0% — when there is no second source', () => {
    const md = renderCrossValidationMarkdown(tallyCrossValidation(gold, null), []);
    expect(md).toContain('unavailable');
    expect(md).not.toMatch(/\b0(\.0)?%/);
  });

  it('prints a percentage once a second source is present', () => {
    const md = renderCrossValidationMarkdown(tallyCrossValidation(gold, SECOND), ['H4 — 3 pairs']);
    expect(md).toContain('33.3%');
    expect(md).toContain('H4 — 3 pairs');
  });

  it('states that a model is not a validation source', () => {
    const md = renderCrossValidationMarkdown(tallyCrossValidation(gold, SECOND), []);
    expect(md).toContain('D-055');
    expect(md).toMatch(/⛔/);
  });
});
```

- [ ] **Step 2: הרץ ואמת נפילה**

Run: `npx vitest run lib/core/translationConfidence.test.ts`
Expected: FAIL — `renderCrossValidationMarkdown is not a function`.

- [ ] **Step 3: כתוב את הרינדור**

הוסף בסוף `lib/core/translationConfidence.ts`:

```ts
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
    const pct = tally.candidates === 0
      ? '0.0'
      : ((tally.upgraded / tally.candidates) * 100).toFixed(1);
    lines.push(
      `- מועמדים (רשומות \`!\`): **${tally.candidates}**`,
      `- שודרגו ל-\`medium\` (כלל 2): **${tally.upgraded}** (${pct}%)`,
      `- נשארו \`low\` — המקור השני חלוק (כלל 3): **${tally.disagreed}**`,
      `- נשארו \`low\` — המקור השני ⛔ אינו מכסה (כלל 4): **${tally.uncovered}**`,
      `- למות שהמקור השני מכסה: **${tally.lemmasCovered}**`,
      '',
    );
  }
  lines.push('### מקורות האימות', '', ...(
    provenance.length === 0 ? ['- ⛔ אין.'] : provenance.map((p) => `- ${p}`)
  ), '');
  return lines.join('\n');
}
```

- [ ] **Step 4: הרץ ואמת מעבר**

Run: `npx vitest run lib/core/translationConfidence.test.ts`
Expected: PASS — 18 passed.

- [ ] **Step 5: כתוב את בדיקות הרץ**

הוסף בסוף `scripts/measure-sense-accuracy.test.ts`:

```ts
describe('measure-sense-accuracy.mjs — the T-112 cross-validation section', () => {
  it('loads both permitted second sources by name', () => {
    expect(SRC).toContain('h3-kaikki-en.jsonl');
    expect(SRC).toContain('h4-word2word-en-he.tsv');
  });

  it('passes null — never an empty index — when no second source is present', () => {
    expect(SRC).toMatch(/secondEntries\.length === 0 \? null :/);
  });

  it('appends the cross-validation section to the same report, not to a second file', () => {
    expect(SRC.match(/writeFileSync\(/g)).toHaveLength(1);
    expect(SRC).toContain('renderCrossValidationMarkdown');
  });

  it('⛔ names no language model as a validation source (D-055)', () => {
    expect(SRC.toLowerCase()).not.toMatch(/\bllm\b|\bgpt\b|openai|anthropic/);
  });
});
```

- [ ] **Step 6: הרץ ואמת נפילה**

Run: `npx vitest run scripts/measure-sense-accuracy.test.ts`
Expected: FAIL — `expected '…' to contain 'h3-kaikki-en.jsonl'`.

- [ ] **Step 7: חבר את הרץ**

ב-`scripts/measure-sense-accuracy.mjs`, אחרי השורה
`const { measureAccuracy, renderAccuracyMarkdown } = await import('../lib/core/senseAccuracy.ts');`
הוסף:

```js
const { parsePairsTsv, parseKaikkiJsonl } = await import('../lib/core/sources.ts');
const { buildSecondSourceIndex, tallyCrossValidation, renderCrossValidationMarkdown } =
  await import('../lib/core/translationConfidence.ts');
```

ואחרי `const markdown = renderAccuracyMarkdown(report, provenance);` החלף את שלוש השורות
האחרונות של הקובץ בבלוק הזה:

```js
// --- T-112 · D-055 — אימות צולב לרשומות `!` -----------------------------------
// ⛔ שני המקורות כבר ברשימה המאושרת: H3 Kaikki (CC BY-SA) · H4 word2word
// (Apache-2.0). ⛔ אפס רישוי חדש, אפס עלות, ⛔ ואפס הורדה (TD-17).
const SECOND_SOURCES = [
  { id: 'H3', file: join(DATA, 'h3-kaikki-en.jsonl'), parse: (t) => parseKaikkiJsonl(t, 'he') },
  { id: 'H4', file: join(DATA, 'h4-word2word-en-he.tsv'), parse: parsePairsTsv },
];
const secondEntries = [];
const secondProvenance = [];
for (const s of SECOND_SOURCES) {
  if (!existsSync(s.file)) {
    secondProvenance.push(`\`${s.file}\` — **unavailable** (T-043)`);
    continue;
  }
  const parsed = s.parse(readFileSync(s.file, 'utf8'));
  secondEntries.push(...parsed.entries);
  secondProvenance.push(
    `\`${s.file}\` — ${parsed.entries.length} זוגות · ${parsed.skipped}/${parsed.lines} שורות דולגו`,
  );
}
// ⛔ null ⛔ ולא אינדקס ריק: אינדקס ריק היה מדווח על 3,301 מועמדים כ"המקור השני
// חלוק/אינו מכסה" — כלומר שהאימות רץ ונכשל, במקום שלא רץ כלל.
const second = secondEntries.length === 0 ? null : buildSecondSourceIndex(secondEntries);
const crossSection = renderCrossValidationMarkdown(
  tallyCrossValidation(gold, second),
  secondProvenance,
);

const full = `${markdown}\n${crossSection}`;
mkdirSync('docs', { recursive: true });
writeFileSync(OUT, full, 'utf8');
console.log(full);
console.log(`\nwritten to ${OUT}`);
```

- [ ] **Step 8: הרץ את שתי סוויטות הבדיקה**

Run: `npx vitest run scripts/measure-sense-accuracy.test.ts lib/core/translationConfidence.test.ts`
Expected: PASS.

- [ ] **Step 9: הרץ את המדידה ואמת את המספר שנמדד בטיק התכנון**

Run: `npm run measure:sense`
Expected — ⛔ **נמדד 2026-08-21, ⛔ ואינו ניחוש:** `gold` נושא **3,301** רשומות `!` על **2,929** למות; H3 ו-H4 ⛔ אינם קיימים בריפו ⇒ הסעיף חייב להדפיס

```
- מועמדים (רשומות `!`): **3301**
- שיעור השדרוג: **unavailable** — ⛔ אין מקור שני טעון.
```

⛔ אם הסעיף מדפיס `0.0%` — הבאג הוא ש-`second` הוא אינדקס ריק במקום `null`.

- [ ] **Step 10: קומיט — T-112 נסגרת**

```bash
git add lib/core/translationConfidence.ts lib/core/translationConfidence.test.ts \
        scripts/measure-sense-accuracy.mjs scripts/measure-sense-accuracy.test.ts \
        docs/sense-accuracy-report.md
git commit -m "loop(DEV): T-112 cross-validate H1 low glosses"
```

---

## בדיקה עצמית — לפני הקומיט האחרון

- [ ] **1 · אימות מלא, בהרצה טרייה באותה הודעה:**
  `npm run typecheck && npm run check:core && npm test && npm run build`
  ⛔ «אמור לעבוד» · «נראה תקין» · «עבר קודם» — אסורים.
- [ ] **2 · הרצ׳ט של הרגיסטרים ⛔ לא עלה:** `npm run measure:plan` ⇒ `findings: … 13 malformed` ⛔ או פחות. עלה — תיקנת שורה, ⛔ לא הוספת חריגה.
- [ ] **3 · אפס כתיבה:** `git grep -n "insert into\|update public\.\|\.upsert(\|\.delete(" -- scripts/measure-level-headroom.mjs lib/core/levelHeadroom.ts lib/core/translationConfidence.ts` ⇒ ⛔ אפס שורות.
- [ ] **4 · אפס הורדה:** אותה פקודה עם `fetch(\|node:http` ⇒ ⛔ אפס שורות.
- [ ] **5 · אפס תלות חדשה:** `git diff --stat package.json` ⇒ שינוי אך ורק בבלוק `scripts`.
- [ ] **6 · שלוש מוטציות נקובות בשם. הרץ כל אחת, ודא שהיא מפילה בדיוק את הבדיקה שכתובה כאן, והחזר:**
  - ⓐ ב-`levelHeadroom.ts` החלף `free: c.allowed - c.authored` ב-`free: c.labelled - c.authored` ⇒ חייבת ליפול `keeps free non-negative and equal to allowed minus authored on every band`.
  - ⓑ ב-`translationConfidence.ts` החלף את ה-`throw new RangeError` בהחזרת `{ confidence: 'medium', verified: true, route: 'second_agrees' }` ⇒ חייבת ליפול `⛔ throws on a gloss D-055 does not govern`.
  - ⓒ ב-`measure-sense-accuracy.mjs` החלף `secondEntries.length === 0 ? null :` ב-`buildSecondSourceIndex(secondEntries)` ⇒ חייבות ליפול `passes null — never an empty index` **וגם** `prints unavailable — and never 0%`.
- [ ] **7 · עדכן את הרגיסטרים באותו קומיט:** `plan/50-tasks.md` (‏T-114 · T-112 → 🟣) · `plan/30-architecture.md` (שורת הפער 46/9 מול 55/14 של D-058) · `plan/60-findings.md` (אם נמדד פער חדש) · `plan/00-control.md` (‏CYCLE_ID · ACTIVE_TASK_ID · NEXT_AGENT=CRITIC · שחרור LOCK · MILESTONE_TICKS+1).

## כיסוי מול המפרט

| דרישה במפרט | היכן היא ממומשת |
|---|---|
| D-058 «כמה כותרות פנויות-עם-תווית נשארו בכל רמה» | Task 1–3, עמודת `free` |
| D-058 סעיף 1 — בחירה אך ורק מקבוצה מתויגת | Task 1, `labelled` היא האוכלוסייה |
| D-058 סעיף 3 — ⛔ אינו כותב `cefr_profile_band` | Task 3 Step 1, בדיקת «⛔ never emits SQL» |
| D-058 סעיף 4 — «נגמרו ⇒ עוצר ומדווח» | Task 3 Step 6, `C1: free 46` · `C2: free 9` הם המספר שעליו עוצרים |
| D-058 פער 3 — כותרת בלי תווית ⛔ אינה נספרת | Task 1, `authoredUnlabelled` |
| D-055 כלל 1 — מקור שני מורשה בלבד | Task 5, `SECOND_SOURCES` = H3 · H4 |
| D-055 כלל 2 — תואם ⇒ `medium`, מוסר «טרם אומת» | Task 4, `second_agrees` ⇒ `verified: true` |
| D-055 כלל 3 — חלוק ⇒ נשאר `low` | Task 4, `second_disagrees` |
| D-055 כלל 4 — לא מכוסה ⇒ נשאר `low` | Task 4, `second_silent` |
| D-055 הסייג — מודל שפה ⛔ אינו מקור | Task 4 Step 1, הבדיקה שסורקת את המקור |
| D-024 — «טרם אומת» מוצג ⛔ ולא מוסתר | Task 4, `verified` הוא דגל תצוגה ⛔ ולא מסנן |
| T-114 «⛔ קריאה בלבד, אפס כתיבה» | Task 3 Step 1, `writeFileSync` פעם אחת בלבד |
| T-114 «הפלט נכתב ל-`docs/`» | Task 3, `docs/level-headroom-report.md` |
