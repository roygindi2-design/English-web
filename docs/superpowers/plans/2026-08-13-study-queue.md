# תור הכרטיסיות — מהשרת עד מסך הגלילה

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:executing-plans`. כל צעד הוא `- [ ]` בן 2–5 דקות.
> ⛔ אין `[skip ci]`. דוחפים ל-`dev` בלבד. אימות לפני כל טענת סיום:
> `npm run typecheck && npm run check:core && npm test && npm run build`.

**Loop tasks covered:** **T-064** (משימות 1–4) · **T-065** (משימות 5–8).
**נכתב:** C-0095, 2026-08-13T16:51Z · Dev · מצב 📝 תכנון (⛔ אפס שינוי קוד בטיק הכתיבה).
**מקור ה-UX:** `plan/40-decisions.md` § 4.2ו + D-032..D-034. ⛔ אין כאן החלטת מסך חדשה.

**Goal:** לחבר את שלושת החלקים שכבר קיימים ואינם נוגעים זה בזה — `Flashcard.tsx` (שלם),
`POST /api/review` (קיים), SM-2 (קיים) — דרך endpoint של תור, ולהעלות מעליו את מסך הגלילה
בשני מצביו. ⛔ T-066 (משפטים) אינה בתחולה: היא חסומה ב-D-035.

---

## מה נמדד, ולא הונח

הורץ בריפו הזה ב-2026-08-13 (`cat`, `grep -n`, `ls`):

| עובדה | ערך שנמדד |
|---|---|
| `app/study/page.tsx` | 37 שורות, סטטי. `StudyEmptyState` + קישור הביתה. ⛔ אפס state, אפס fetch |
| `components/Flashcard.tsx` | שלם. `props = { card: Card, onGrade: (g: CardGrade) => void }` · **מייצר בעצמו את שני כפתורי הסימון** עם תווית וגליף · מאפס `revealed` כשה-prop מתחלף |
| `lib/core/flashcard.ts` | `buildCard(sense: CardSense, direction, ctx: {isFirstEncounter})` · `directionFor(state, policy)` |
| `CardSense` | `{headword, translationHe, examples:{supportive,neutral}, needsHumanReview}` — `needsHumanReview` **חובה, בלי ברירת מחדל** |
| `lib/core/queue.ts` | `planDailyQueue({dueReviewCount, newCardsPerDay, dailyMinutesGoal, secondsPerCard})` — קיים, ⛔ אין לו קורא |
| `profiles` | `daily_minutes smallint` קיים (`0004`). ⛔ **אין** עמודת `new_cards_per_day` ו⛔ אין `seconds_per_card` |
| `word_progress` | PK `(user_id, word_id)` · `attempts` · `correct_attempts` · `repetition` · `easiness` · `interval_days` · `next_review_at` (**nullable בכוונה**) · `consecutive_correct_recognition` |
| `words.cefr_profile_band` | `0008`, `check in ('A1'..'C2')`, **nullable** · `cefr_profile_source` צמוד לו |
| `senses.cefr_level` | קיים ב-`0002` — ⛔ **אסור למיין לפיו** (D-034: חלוק על הפרופיל ב-125/343) |
| RLS על `senses` | `0002`/`0003`: הקריאה מסננת `translation_confidence <> 'low'` בשרת. ⛔ אין צורך לחזור על D-013 בקוד |
| דפוס מסלול קיים | `createRouteClient(env, await cookies())` → `getUser()` **לפני** קריאת הגוף → `{ok:false, code}` |
| דפוס טסט למסלול | קריאת **מקור** ב-`readFileSync` + `withoutComments()` (`app/api/profile/route.test.ts`) |
| דפוס פרמטר-מוצר | `MASTERY_CONSECUTIVE_CORRECT` ב-`app/api/review/route.ts` — קבוע **במסלול**, עם הערת `HEURISTIC`, ⛔ ולא ב-`/lib/core` |
| מסכים מוגנים | `proxy.ts:27` = `['/onboarding','/studies','/cards','/me']` — ⛔ **`/study` אינו מוגן**, ולכן הוא נמדד ישירות |
| `check:mobile` | מודד רשימת נתיבים קבועה ב-`scripts/verify-mobile.mjs:40-59`; מסך מוגן נמדד דרך `/dev/tabs/*` |

⚠️ **הממצא שמעצב את סדר המשימות:** אין שום דרך היום להביא כרטיס אחד מהדאטהבייס אל
`Flashcard`. ⛔ החסם אינו עיצוב הגלילה. לכן משימות 1–4 (השרת) חייבות להסתיים לפני 5–8.

⚠️ **שני פרמטרי מוצר אין להם מקור, ולכן הם קבועים במסלול ולא ב-`/lib/core`** — בדיוק
כמו `MASTERY_CONSECUTIVE_CORRECT`: `NEW_CARDS_PER_DAY = 5` ו-`SECONDS_PER_CARD = 20`.
⛔ הם אינם מובאים כראיה פדגוגית, ⛔ ואינם מיוצאים משום מקום. ההערה מעליהם חייבת לומר זאת.

---

## Interfaces — חתימות מדויקות

```ts
// lib/core/deck.ts — ⛔ טהור. אין React, אין fetch, אין Date.now(), אין process.env.
import type { Card, CardDirection, CardGrade } from '@/lib/core/flashcard';

export type DeckName = 'due' | 'unknown';
export const DECK_NAMES: readonly DeckName[] = ['due', 'unknown'];
export const DEFAULT_QUEUE_LIMIT = 20;
export const MAX_QUEUE_LIMIT = 50;
/** סדר הרמות. ⛔ המקור הוא words.cefr_profile_band בלבד (D-034). */
export const CEFR_BAND_ORDER: readonly string[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/** שורה אחת אחרי שהמסלול שיטח אותה. ⛔ אין כאן צורת PostgREST מקוננת. */
export interface QueueRow {
  readonly wordId: string;
  readonly headword: string;
  readonly translationHe: string;
  readonly examples: { readonly supportive: string; readonly neutral: string };
  readonly needsHumanReview: boolean;
  readonly cefrProfileBand: string | null;
  /** epoch ms. null = מילה חדשה שטרם נענתה — ⛔ ולא "לא בזמן". */
  readonly nextReviewAtMs: number | null;
  readonly attempts: number;
  readonly repetition: number;
  readonly consecutiveCorrectRecognition: number;
}

/** צורת החוט. ⛔ המסלול לא בונה Card — buildCard רץ בלקוח, שם חי גם מצב החשיפה. */
export interface QueueCardInput {
  readonly word_id: string;
  readonly direction: CardDirection;
  readonly is_first_encounter: boolean;
  readonly sense: {
    readonly headword: string;
    readonly translation_he: string;
    readonly examples: { readonly supportive: string; readonly neutral: string };
    readonly needs_human_review: boolean;
  };
}

export function parseDeckName(value: string | null): DeckName | null;
export function clampQueueLimit(value: string | null): number;
/** NULL ורמה לא מוכרת ⇒ CEFR_BAND_ORDER.length — סוף התור, ⛔ לא רמה מנוחשת. */
export function bandRank(band: string | null): number;
export function isUnknownRow(row: QueueRow): boolean; // attempts > 0 && repetition === 0
export function sortQueue(rows: readonly QueueRow[]): QueueRow[];
export function selectDeck(rows: readonly QueueRow[], deck: DeckName, limit: number): QueueRow[];
export function excludeSeen(rows: readonly QueueRow[], seenWordIds: readonly string[]): QueueRow[];
export function toQueueCardInput(row: QueueRow, promoteAfterConsecutiveCorrect: number): QueueCardInput;

/** D-033: זה כל מה שתרגול עושה. ⛔ אין כאן easiness/interval/repetition/next_review. */
export interface PracticeCounters { readonly attempts: number; readonly correctAttempts: number }
export function applyPractice(current: PracticeCounters, grade: CardGrade): PracticeCounters;

export type PracticePayload = { readonly wordId: string; readonly grade: CardGrade };
export type PracticeCheck =
  | { readonly ok: true; readonly payload: PracticePayload }
  | { readonly ok: false; readonly code: 'unavailable' };
export function checkPracticePayload(body: unknown): PracticeCheck;
```

```ts
// app/api/study/queue/route.ts — הצד הלא-טהור.
export async function GET(request: Request): Promise<Response>;
// app/api/practice/route.ts
export async function POST(request: Request): Promise<Response>;
```

**חוזה התשובה — נכתב כאן ולא מומצא בזמן הקוד:**

| מצב | סטטוס | גוף |
|---|---|---|
| הצליח | 200 | `{ok:true, deck, total, cards:[QueueCardInput]}` — `total` = לפני החיתוך ל-`limit` |
| `deck` לא מוכר / `limit` פסול | 400 | `{ok:false, code:'unavailable'}` |
| אין session | 401 | `{ok:false, code:'session_expired'}` |
| אין ENV של Supabase | 503 | `{ok:false, code:'unavailable'}` |
| שגיאת PostgREST `42P01` / `PGRST205` | 503 | `{ok:false, code:'schema_missing', message:'המאגר עדיין לא הוקם'}` |
| כל שגיאת דאטהבייס אחרת | 503 | `{ok:false, code:'unavailable'}` |
| התור ריק | 200 | `{ok:true, deck, total:0, cards:[]}` — ⛔ **לא** 503 ולא 404 |

⛔ **הדרישה הקשה:** מחרוזת השגיאה של Supabase לעולם אינה נכנסת ל-JSON — `console.error` בלבד.
זו אותה דרישה שנאכפה ב-T-053, ואותו טסט מקור אוכף אותה כאן.

`POST /api/practice`: `{word_id, grade}` ⇒ 200 `{ok:true, attempts, correct_attempts}` ·
400 `unavailable` · 401 `session_expired` · **404 `unavailable` כששורת ההתקדמות אינה קיימת**
(מילה בלי `attempts>0` אינה יכולה להיות בחפיסת התרגול — ⛔ ולכן המסלול לעולם אינו **מוסיף** שורה).

---

## משימה 1 — השכבה הטהורה: מיון, סינון, וצורת החוט (T-064, חלק א׳)

**קבצים:** `lib/core/deck.ts` (חדש) · `lib/core/deck.test.ts` (חדש)
⚠️ TDD: הטסטים נכתבים ורצים **ונכשלים** לפני המימוש.

- [ ] צור `lib/core/deck.test.ts` עם הבלוק הבא **כפי שהוא**, והרץ `npx vitest run lib/core/deck.test.ts` — חייב להיכשל על מודול חסר:

```ts
import { describe, expect, it } from 'vitest';
import {
  applyPractice, bandRank, checkPracticePayload, clampQueueLimit, DEFAULT_QUEUE_LIMIT,
  isUnknownRow, parseDeckName, selectDeck, sortQueue, toQueueCardInput, type QueueRow,
} from '@/lib/core/deck';

const row = (over: Partial<QueueRow>): QueueRow => ({
  wordId: '00000000-0000-4000-8000-000000000001',
  headword: 'word', translationHe: 'מילה',
  examples: { supportive: 'A supportive word.', neutral: 'The word is here.' },
  needsHumanReview: false, cefrProfileBand: 'A1', nextReviewAtMs: 1_000,
  attempts: 0, repetition: 0, consecutiveCorrectRecognition: 0, ...over,
});

describe('sortQueue — D-034', () => {
  it('ממיין לפי cefr_profile_band עולה', () => {
    const out = sortQueue([row({ cefrProfileBand: 'B2' }), row({ cefrProfileBand: 'A1' })]);
    expect(out.map((r) => r.cefrProfileBand)).toEqual(['A1', 'B2']);
  });

  it('NULL הוא סוף התור, ⛔ ולא רמה מנוחשת', () => {
    const out = sortQueue([row({ cefrProfileBand: null }), row({ cefrProfileBand: 'C2' })]);
    expect(out.map((r) => r.cefrProfileBand)).toEqual(['C2', null]);
  });

  it('רמה לא מוכרת נופלת לסוף ולא זורקת', () => {
    expect(bandRank('B3')).toBe(bandRank(null));
  });

  it('בתוך רמה — next_review_at עולה, ו-null אחרון', () => {
    const out = sortQueue([
      row({ nextReviewAtMs: null, headword: 'c' }),
      row({ nextReviewAtMs: 900, headword: 'b' }),
      row({ nextReviewAtMs: 100, headword: 'a' }),
    ]);
    expect(out.map((r) => r.headword)).toEqual(['a', 'b', 'c']);
  });

  it('שובר שוויון מלא לפי headword — סדר יציב, ⛔ לא תלוי-מנוע', () => {
    const out = sortQueue([row({ headword: 'zebra' }), row({ headword: 'apple' })]);
    expect(out.map((r) => r.headword)).toEqual(['apple', 'zebra']);
  });

  it('⛔ אינו משנה את המערך שהתקבל', () => {
    const input = [row({ cefrProfileBand: 'B1' }), row({ cefrProfileBand: 'A1' })];
    sortQueue(input);
    expect(input[0].cefrProfileBand).toBe('B1');
  });
});

describe('חפיסת «לא ידעתי» — attempts > 0 AND repetition = 0 (⛔ אפס מיגרציה)', () => {
  it('נכשל לפחות פעם אחת ולא ענה נכון מאז', () => {
    expect(isUnknownRow(row({ attempts: 3, repetition: 0 }))).toBe(true);
  });
  it('מילה שטרם נגעו בה אינה «לא ידעתי»', () => {
    expect(isUnknownRow(row({ attempts: 0, repetition: 0 }))).toBe(false);
  });
  it('מילה שענו עליה נכון יצאה מהחפיסה', () => {
    expect(isUnknownRow(row({ attempts: 5, repetition: 2 }))).toBe(false);
  });
  it('selectDeck מסנן, ממיין וחותך ב-limit', () => {
    const rows = [
      row({ wordId: 'a', attempts: 1, repetition: 0, cefrProfileBand: 'B1' }),
      row({ wordId: 'b', attempts: 1, repetition: 0, cefrProfileBand: 'A1' }),
      row({ wordId: 'c', attempts: 0, repetition: 0 }),
    ];
    expect(selectDeck(rows, 'unknown', 1).map((r) => r.wordId)).toEqual(['b']);
  });
  it('deck=due אינו מסנן — הסינון שלו נעשה בשאילתה', () => {
    expect(selectDeck([row({}), row({ wordId: 'x' })], 'due', 50)).toHaveLength(2);
  });
});

describe('parseDeckName · clampQueueLimit — קלט מהכתובת הוא קלט זר', () => {
  it('מקבל את שני השמות בלבד', () => {
    expect(parseDeckName('due')).toBe('due');
    expect(parseDeckName('unknown')).toBe('unknown');
    expect(parseDeckName('sentences')).toBeNull(); // ⛔ D-035 — חסומה
    expect(parseDeckName(null)).toBe('due');       // ברירת מחדל = מנת היום
  });
  it('limit פסול נופל לברירת מחדל, ⛔ ולא ל-NaN בשאילתה', () => {
    for (const bad of ['0', '-3', 'abc', '2.5', '']) {
      expect(clampQueueLimit(bad)).toBe(DEFAULT_QUEUE_LIMIT);
    }
    expect(clampQueueLimit(null)).toBe(DEFAULT_QUEUE_LIMIT);
    expect(clampQueueLimit('7')).toBe(7);
    expect(clampQueueLimit('9999')).toBe(50);
  });
});

describe('toQueueCardInput — צורת החוט שנכנסת ל-buildCard', () => {
  it('needs_human_review נוסע כמו שהוא — D-024', () => {
    const out = toQueueCardInput(row({ needsHumanReview: true }), 3);
    expect(out.sense.needs_human_review).toBe(true);
  });
  it('attempts=0 ⇒ מפגש ראשון ⇒ המשפט התומך', () => {
    expect(toQueueCardInput(row({ attempts: 0 }), 3).is_first_encounter).toBe(true);
    expect(toQueueCardInput(row({ attempts: 1 }), 3).is_first_encounter).toBe(false);
  });
  it('הכיוון נגזר מהרצף דרך directionFor, ⛔ ולא מדגל חדש', () => {
    expect(toQueueCardInput(row({ consecutiveCorrectRecognition: 0 }), 3).direction).toBe('recognition');
    expect(toQueueCardInput(row({ consecutiveCorrectRecognition: 3 }), 3).direction).toBe('production');
  });
});

describe('applyPractice — ⛔ הבדיקה החשובה בכל התוכנית (D-033)', () => {
  it('סופר ניסיון, ומעלה correct רק על good', () => {
    expect(applyPractice({ attempts: 4, correctAttempts: 1 }, 'good')).toEqual({ attempts: 5, correctAttempts: 2 });
    expect(applyPractice({ attempts: 4, correctAttempts: 1 }, 'again')).toEqual({ attempts: 5, correctAttempts: 1 });
  });
  it('⛔ מחזיר שני שדות בלבד — אין דרך לכתוב תזמון דרך הפונקציה הזו', () => {
    expect(Object.keys(applyPractice({ attempts: 0, correctAttempts: 0 }, 'good')).sort())
      .toEqual(['attempts', 'correctAttempts']);
  });
});

describe('checkPracticePayload — F-004 בגבול הזה', () => {
  const id = '00000000-0000-4000-8000-000000000001';
  it('דוחה null, מערך ופרימיטיב', () => {
    for (const bad of [null, [], 'x', 7]) expect(checkPracticePayload(bad).ok).toBe(false);
  });
  it('דוחה word_id שאינו UUID ו-grade שאינו בינארי', () => {
    expect(checkPracticePayload({ word_id: 'nope', grade: 'good' }).ok).toBe(false);
    expect(checkPracticePayload({ word_id: id, grade: 'easy' }).ok).toBe(false);
  });
  it('מקבל את השניים התקינים', () => {
    const check = checkPracticePayload({ word_id: id, grade: 'again' });
    expect(check.ok && check.payload).toEqual({ wordId: id, grade: 'again' });
  });
});
```

- [ ] כתוב את `lib/core/deck.ts` עד שכל הבלוק ירוק. ⛔ אל תוסיף פונקציה שאין לה בדיקה כאן.
- [ ] `npm run check:core` — הקובץ חייב לעבור את בדיקת הטוהר (⛔ אפס `fetch`/`Date.now()`/`process.env`).
- [ ] בראש הקובץ, הערה בת 3–6 שורות: **למה `words.cefr_profile_band` ו⛔ לא `senses.cefr_level`** — עם המספר 125/343 מ-D-034.

## משימה 2 — `GET /api/study/queue` (T-064, חלק ב׳)

**קבצים:** `app/api/study/queue/route.ts` (חדש) · `docs/api-contract.md`

- [ ] צור את המסלול לפי דפוס `app/api/review/route.ts` **בסדר הזה בדיוק**: `readSupabaseEnv()` → 503 · `createRouteClient` → `getUser()` → 401 · **רק אז** קריאת `searchParams` (דפוס C-0032: קורא לא מזוהה אינו לומד אילו פרמטרים מתקבלים).
- [ ] `parseDeckName(url.searchParams.get('deck'))` — `null` ⇒ 400. `clampQueueLimit(url.searchParams.get('limit'))`.
- [ ] שאילתת הבסיס (**חפיסה אחת, שאילתה אחת**), עם תקרה קשיחה של 200 שורות:

```ts
const PROGRESS_SELECT =
  'word_id, attempts, correct_attempts, repetition, consecutive_correct_recognition, next_review_at, ' +
  'words!inner(headword, cefr_profile_band, ' +
  'senses(sense_index, translation_he, needs_human_review, sense_examples(kind, text_en)))';
```

- [ ] `deck='due'` ⇒ `.lte('next_review_at', nowIso)` · `deck='unknown'` ⇒ ⛔ **בלי** מסנן תאריך, הסינון הוא `isUnknownRow` בשכבה הטהורה.
- [ ] שטח כל שורה ל-`QueueRow`: **המשמעות הנבחרת היא `sense_index` הנמוך ביותר** (D-021 — שורה היא משמעות); שורה בלי משמעות שמישה או בלי `translation_he` **מושמטת** (⛔ `buildCard` זורק על טקסט ריק, ו-500 על כרטיס פגום הוא באג ולא הגנה). משפט חסר ⇒ מחרוזת ריקה.
- [ ] `total` = אורך הרשימה **אחרי** הסינון ו**לפני** החיתוך; `cards = selectDeck(rows, deck, limit).map((r) => toQueueCardInput(r, PROMOTE_AFTER_CONSECUTIVE_CORRECT))`.
- [ ] מיפוי שגיאה: `error.code === '42P01' || error.code === 'PGRST205'` ⇒ 503 `schema_missing` + ההודעה העברית מהחוזה. אחרת 503 `unavailable`. ⛔ `error.message` ל-`console.error` בלבד.
- [ ] עדכן `docs/api-contract.md` **באותו קומיט** — כל שבע שורות טבלת החוזה.

## משימה 3 — מילים חדשות במנת היום (T-064, חלק ג׳)

⚠️ בלי החלק הזה `deck=due` ריק לנצח עבור כל לומד חדש: `word_progress` ריקה, ולכן אין לו מה להיות "בזמן".

- [ ] הוסף למסלול שני קבועים עם הערת `HEURISTIC` בנוסח של `MASTERY_CONSECUTIVE_CORRECT` — ⛔ הם פרמטרי מוצר, ⛔ אינם ראיה, ⛔ ואינם עוברים ל-`/lib/core`:

```ts
const NEW_CARDS_PER_DAY = 5;
const SECONDS_PER_CARD = 20;
const PROMOTE_AFTER_CONSECUTIVE_CORRECT = 3;
```

- [ ] `deck='due'` בלבד: קרא `profiles.daily_minutes` (ברירת מחדל 10 כשהוא `null` — הלומד לא ענה, ⛔ ולא "אפס דקות") והרץ
`planDailyQueue({dueReviewCount: rows.length, newCardsPerDay: NEW_CARDS_PER_DAY, dailyMinutesGoal, secondsPerCard: SECONDS_PER_CARD})`.
- [ ] `newCardsToShow > 0` ⇒ שאילתה שנייה על `words`, `.order('cefr_profile_band', {ascending: true, nullsFirst: false}).order('ngsl_rank', {ascending: true})`, `limit(newCardsToShow + seenIds.length)`, ואז `excludeSeen(candidates, seenIds)` בשכבה הטהורה. ⛔ **אל תבנה `not.in` מרשימת מזהים** — כתובת ה-URL גדלה עם ההיסטוריה של הלומד ותישבר בשקט.
- [ ] המילים החדשות מצטרפות **אחרי** שורות החזרה (`reviewsToShow` תחילה), ו-`total` נספר עליהן גם הוא.
- [ ] אם השאילתה השנייה נכשלת — ⛔ **אל תפיל את כל התור**: החזר את שורות החזרה עם `console.error`. חצי תור עדיף על מסך שגיאה.

## משימה 4 — `POST /api/practice` (T-064, חלק ד׳) — ✅ **בוצעה C-0100**

**קבצים:** `app/api/practice/route.ts` (חדש) · `app/api/practice/route.test.ts` (חדש) · `docs/api-contract.md`

- [x] כתוב **קודם** את טסט המקור, והרץ אותו — חייב להיכשל על קובץ חסר:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const withoutComments = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');
const CODE = withoutComments(readFileSync('app/api/practice/route.ts', 'utf8'));
const CONTRACT = readFileSync('docs/api-contract.md', 'utf8');

describe('POST /api/practice — D-033, ההגנה שמונעת נזק שקט', () => {
  it('⛔ אינו כותב אף אחד מארבעת שדות התזמון', () => {
    for (const field of ['next_review_at', 'easiness', 'interval_days', 'repetition']) {
      expect(CODE).not.toContain(field);
    }
  });

  it('⛔ אינו נוגע ברצף ההכרה — הרצף מקדם לייצור, ותרגול אינו מקדם', () => {
    expect(CODE).not.toContain('consecutive_correct_recognition');
  });

  it('⛔ לעולם אינו מוסיף שורה — תרגול הוא על מילה שכבר נכשלה', () => {
    expect(CODE).not.toMatch(/\.insert\(|\.upsert\(/);
    expect(CODE).toMatch(/\.update\(/);
  });

  it('הספירה עצמה נעשית בשכבה הטהורה', () => {
    expect(CODE).toContain('applyPractice');
  });

  it('⛔ אינו מדליף את הודעת השגיאה של Supabase', () => {
    expect(CODE).not.toMatch(/error\.message[\s\S]{0,40}(NextResponse|json\()/);
  });

  it('מתועד בחוזה עם אותה הבטחה', () => {
    expect(CONTRACT).toContain('POST /api/practice');
    expect(CONTRACT).toContain('next_review_at');
  });
});
```

- [x] מימוש: session → `checkPracticePayload` → `select('attempts, correct_attempts')` על `(user_id, word_id)` → `maybeSingle()`; `null` ⇒ 404. אחרת `applyPractice` → `.update({attempts, correct_attempts, updated_at})` → 200.
- [x] `docs/api-contract.md`: סעיף חדש שאומר **במפורש** ש-`next_review_at` אינו משתנה, וש-`/api/review` הוא המסלול היחיד שמזיז אותו.

## משימה 5 — `CardDeck` (T-065, חלק א׳) — ✅ **בוצעה C-0101**

**קבצים:** `components/CardDeck.tsx` (חדש) · `components/CardDeck.test.ts` (חדש)
**סקיל:** `ui-styling`. ⛔ לא `design-taste-frontend` (§ 4.2ו, שאלה 5).

- [x] `'use client'`. Props: `{ deck: DeckName; cards: readonly QueueCardInput[]; onGraded: (wordId: string, grade: CardGrade) => Promise<void> }`. ⛔ **הרכיב אינו קורא `fetch` בעצמו** — העמוד מזרים לו.
- [x] מכולה: `snap-y snap-mandatory overflow-y-auto` · כל כרטיס `h-dvh snap-start` ⇒ כרטיס אחד למסך. ⛔ **בלי `justify-center` בעטיפת העמוד** (F-011/F-016 — `scripts/verify-mobile.test.ts` דוחה אותו סטטית).
- [x] מרנדר את **הנותרים בלבד**: `cards.filter((c) => !graded.has(c.word_id))`. סימון ⇒ הכרטיס יורד מה-DOM ⇒ ⛔ אין גלילה אחורה לכרטיס שסומן, בלי שום קוד שחוסם גלילה.
- [x] כל כרטיס: `<Flashcard key={c.word_id} card={buildCard(sense, c.direction, {isFirstEncounter: c.is_first_encounter})} onGrade={...} />`. ⛔ **אפס שינוי ב-`Flashcard.tsx`** — הוא כבר מייצר את שני הכפתורים עם תווית וגליף.
- [x] אחרי סימון: `scrollIntoView({block:'start', behavior:'auto'})` על הכרטיס הבא. ⛔ `behavior:'smooth'` אסור — הוא מתעלם מ-`prefers-reduced-motion`.
- [x] `deck='unknown'` ⇒ תווית דביקה בראש המסך, גלויה תמיד: **«תרגול — לא משנה את מועד החזרה»** (§ 4.2ו; ה-⛔ במסמך הוא סימון הדגשה של התוכנית, ⛔ ואינו חלק מהמחרוזת שהלומד רואה).
- [x] מונה נותרים ליד התווית, יורד בזמן אמת. הרשימה מתרוקנת ⇒ `onFinished` (מסך הסיום עצמו הוא **T-055 וחסום ב-F-032** — ⛔ אל תמציא אותו; כרגע: כותרת «סיימת» + קישור ל-`/cards`).
- [x] `components/CardDeck.test.ts` בדפוס `Flashcard.test.ts`: (1) המכולה נושאת `snap-mandatory` · (2) המחרוזת «לא משנה את מועד החזרה» מופיעה **רק** בענף `unknown` · (3) ⛔ אין `behavior: 'smooth'` · (4) ⛔ אין `justify-center`.

⚠️ **סטייה מדווחת (C-0101): `onFinished` לא נכתב.** בלוק ה-Props של המשימה מונה שלושה
props בדיוק, והשורה על התרוקנות הרשימה מבקשת רביעי — שני חצאים של אותה משימה שאינם
מסתדרים. הוכרע לפי החתימה: החפיסה מרנדרת את מצב הסיום **בעצמה** (כותרת «סיימת» + קישור
ל-`/cards`, בדיוק כפי שהמשימה מכתיבה), ⛔ בלי prop רביעי. הנימוק אינו סגנון — למשימות
6–8 אין קורא ל-`onFinished`, ולכן הוא היה prop מת שאיש אינו מעביר ואף בדיקה אינה מודדת.
ביום שמסך הסיום ייפתח (T-055, חסומה ב-F-032) הוא ייכתב עם הקורא שלו.

## משימה 6 — `/study` מתחבר לתור (T-065, חלק ב׳)

**קבצים:** `app/study/page.tsx` · `components/StudyDeckScreen.tsx` (חדש)

- [ ] `app/study/page.tsx` נשאר Server Component: קורא `searchParams.deck`, מאמת ב-`parseDeckName`, ומרנדר `<StudyDeckScreen deck={deck} />`. ⛔ בלי `fetch` בשרת.
- [ ] `StudyDeckScreen` ('use client') מושך `apiGet<QueueResponse>('/api/study/queue?deck=…')` דרך `lib/api/client.ts` — ⛔ אין `fetch` ישיר ברכיב.
- [ ] חמישה מצבים, כולם קיימים בקוד ולא רק בתוכנית:
  · **טעינה** — שלד בצורת הכרטיס (⛔ לא ספינר, חוקה § 5)
  · **`schema_missing`** — ההודעה העברית מהחוזה (⛔ לא «אין מילים»: שקר על תקלה)
  · **שגיאה/`session_expired`** — עברית + «נסה שוב»; `session_expired` ⇒ קישור ל-`/login`
  · **ריק** — `StudyEmptyState` הקיים + פעולה אחת: «אין מה לחזור היום — התחל מילים חדשות»
  · **כרטיסים** — `<CardDeck>`
- [ ] `onGraded`: `deck='due'` ⇒ `apiPost('/api/review', {word_id, grade, direction, elapsed_ms})` · `deck='unknown'` ⇒ `apiPost('/api/practice', {word_id, grade})`. ⛔ **החיווט הזה הוא כל D-033** — טסט נפרד מוודא ששם המסלול נבחר לפי `deck`.
- [ ] `elapsed_ms`: הפרש מרגע הצגת הכרטיס, חסום ב-`MAX_ELAPSED_MS` (600000) — ערך גדול יותר נשלח כ-`MAX_ELAPSED_MS`. ⛔ אל תשלח ערך שהמסלול ידחה ב-400.
- [ ] כשל רשת בסימון (`ApiUnreachableError`) ⇒ הודעת האופליין הקיימת, והכרטיס **חוזר** לרשימה. ⛔ אל תבלע סימון שלא נשמר.

## משימה 7 — הבורר בלשונית `כרטיסיות` (T-065, חלק ג׳)

**קבצים:** `components/CardsScreen.tsx` (+`.test.ts` אם נוצר) · `app/dev/tabs/cards/page.tsx`

- [ ] `CardsScreen` הופך ל-'use client' ומושך את שני המונים (`?deck=due&limit=1` ו-`?deck=unknown&limit=1` — `total` מגיע גם כש-`limit=1`, ולכן ⛔ אין צורך למשוך חפיסה שלמה בשביל מספר).
- [ ] שלושה כרטיסי כניסה, **תמיד שלושה**: «מנת היום · <n>» → `/study` · «לא ידעתי · <n>» → `/study?deck=unknown` · «משפטים · נעול» (⛔ D-035 — `aria-disabled`, ⛔ בלי ניווט).
- [ ] חפיסה ריקה = **מושבתת עם המספר**, ⛔ לא מוסתרת (§ 4.2ו).
- [ ] ⛔ **בלי `<ActionBar>`** — D-028 אוסר שני סרגלים תחתונים, והמסך הזה נושא את סרגל הלשוניות.
- [ ] כשל fetch (כולל 401 בפיקסצ'ר `/dev/tabs/cards` שאין לו session) ⇒ שלושת הכרטיסים מוצגים מושבתים עם «—», ⛔ לא מסך שגיאה ו⛔ לא ריק. זה גם המצב שההארנס מודד.

## משימה 8 — המדידה (T-065, חלק ד׳)

**קבצים:** `app/dev/deck/page.tsx` + `layout.tsx` (חדשים) · `scripts/verify-mobile.mjs`

- [ ] פיקסצ'ר `/dev/deck` שמרנדר `<CardDeck>` עם **שני כרטיסים קבועים בקוד** ו-`onGraded` ריק — אותו נימוק כמו `/dev/card` ו-`/dev/tabs/*`: `/study` בלי ENV של Supabase מציג מצב שגיאה, וההארנס היה מודד אותו במקום את החפיסה.
- [ ] הוסף `'/dev/deck'` לרשימת המסכים ב-`scripts/verify-mobile.mjs` (ליד `/dev/card`), עם הערה בת שורה שמסבירה למה.
- [ ] הרץ `npm run check:mobile` ודרוש בשלושת הרוחבים: אפס גלילה אופקית · שני כפתורי הסימון ≥44×44px עם מרווח ≥8px · כרטיס אחד לכל מסך.
- [ ] ⛔ אם `check:mobile` נופל — זה ממצא על הקוד, ⛔ ולא סיבה להוריד את הפיקסצ'ר מהרשימה.

---

## בדיקה עצמית — לפני קומיט הסיום

- [ ] `npm run typecheck && npm run check:core && npm test && npm run build` — **ריצה טרייה באותה הודעה שבה נטענת ההצלחה.** ⛔ «עבר קודם» אינו ראיה.
- [ ] `grep -n "senses(cefr_level\|cefr_level" app/api/study/queue/route.ts lib/core/deck.ts` ⇒ **אפס** (D-034).
- [ ] `grep -n "next_review_at\|easiness\|interval_days" app/api/practice/route.ts` ⇒ **אפס** (D-033).
- [ ] `grep -rn "'use client'" lib/core/deck.ts` ⇒ אפס · `npm run check:core` ירוק.
- [ ] `docs/api-contract.md` עודכן **באותו קומיט** של שני המסלולים (RULES, Dev § 5).
- [ ] ⛔ אין `[skip ci]` · ⛔ הדחיפה ל-`dev` בלבד · ⛔ לא נגעת ב-`Flashcard.tsx` · ⛔ לא הומצא מסך סיום (T-055 חסומה ב-F-032).
- [ ] `plan/30-architecture.md` · `50-tasks` · `60-findings` · `00-control` עודכנו, ו-`MILESTONE_TICKS` עלה ב-1.
