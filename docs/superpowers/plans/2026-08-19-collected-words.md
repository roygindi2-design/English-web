# «המילים שאספתי» — האיסוף, המסך, וההגדרה של «מילה ידועה» בתוך הזירה — Implementation Plan

**נכתב:** C-0206 (DEV, 📝 טיק תכנון) · 2026-08-19T20:4xZ (‏`date -u`)
**Goal:** לסגור את שלוש המשימות שנשארו מעל הסכמה שנחתה ב-T-107, ברצף אחד:
**T-109 → T-110 → T-118**. הכתיבה, המסך, ואז ההגדרה שנשענת על שניהם.
**Spec:** `plan/40-decisions.md` § 4.2יב (‏T-110) · § 4.2יא (הרשת) · D-047 · D-052 · D-053 ·
D-062 · D-059 · `plan/50-tasks.md` שורות T-109 · T-110 · T-118 ·
`supabase/migrations/0015_arcade_decoupling.sql` (הטבלה, כבר בריפו).
**⛔ מה ⛔ אינו בתוכנית הזאת, במכוון:** T-117 (הבמה — SVG ואנימציה, מחלקת עבודה אחרת)
ו-T-103 (סיבוב השטף עצמו — חסום ב-T-118 ונפתח רק אחריה).

---

## Global Constraints — חלים על שלוש המשימות

- **TDD.** בכל צעד: הבדיקה נכתבת ראשונה, **מורצת ונמדדת שהיא נופלת** (⛔ לא מונח שתיפול),
  ואז המימוש. הרצה בפועל, עם הפלט בדיווח.
- **`/lib/core` טהור.** אפס React · window · document · localStorage · fetch · process.env.
  `npm run check:core` הוא השער.
- **⛔ רכיב ממשק אינו ניגש לדאטהבייס.** `<CollectedWords>` קורא דרך `lib/api/client.ts` בלבד.
- **D-052 · D-044 — הבידוד נאכף כבדיקה שנכשלת, ⛔ ולא כהערה.** בכל קובץ חדש בתוכנית
  הזאת: סריקת מקור שמוודאת ש-`word_progress` · `next_review_at` · `easiness` ·
  `repetition` · `self_marked_known` · `current_level` ⛔ **אינם מופיעים בקובץ כלל**.
  התבנית קיימת ועובדת: `app/api/arcade/result/route.test.ts:32`, כולל `withoutComments`.
- **F-011 · F-016 בכל מסך:** ⛔ אין `justify-center` אנכי · ⛔ אין גרדיאנט סגול ·
  ⛔ אין hex בקוד (טוקנים בלבד) · ⛔ אין `Inter`. `plan/35-design-constitution.md` הוא
  מקור האמת. ⛔ **התוכנית אינה עורכת את קובץ החוקה.**
- **D-050 — ⛔ אפס מדדי משחק:** ⛔ אין ניקוד · ⛔ אין XP · ⛔ אין מטבע · ⛔ אין רצף יומי ·
  ⛔ אין לוח תוצאות. המונה היחיד המותר במסך הוא **גודל האוסף** (§ 4.2יב שאלה 2).
- **`docs/api-contract.md` מתעדכן באותו קומיט** של כל שינוי בנקודת קצה. ⛔ לא בקומיט הבא.
- **⛔ `dataviz` אסור כאן.** § 4.2יב שאלה 5 נוקבת `ui-styling` מפורשות: «רשימה אינה תצוגת
  נתונים». ⛔ אין `<svg>` גרפי, ⛔ אין טבעת מילוי, ⛔ אין sparkline באף אחד משלושת השלבים.
- **שער האימות בסוף כל משימה, מורץ ומודבק:**
  `npm run typecheck && npm run check:core && npm test && npm run build`
  ובמשימה 2 גם `npm run check:mobile`.

---

## ⚠️ שתי הכרעות מדידה שנלקחו בטיק התכנון — קרא לפני שאתה כותב שורה

### הכרעה א׳ — שורה נוצרת על **טעות** בלבד; `times_correct` עולה רק על שורה **שכבר קיימת**

שני מסמכים מתארים את אותה טבלה בשתי לשונות, וזה נמדד ⛔ ולא שוער:

| מקור | הלשון | מה היא מחייבת |
|---|---|---|
| `plan/50-tasks.md` — T-109 | «כל מילה **שהלומד טעה בה** בקרב נכתבת» | שורה על טעות |
| `plan/40-decisions.md` § 4.2יב | «רשימה של המילים **שהלומד טעה בהן** במשחקים» | המסך מציג טעויות |
| `0015_arcade_decoupling.sql:47` (הערת הטבלה) | «המילים שהלומד **פגש** בקרבות» | שורה על כל מפגש |

**ההכרעה: T-109 ו-§ 4.2יב מנצחות** — הן מפרט משימה ומפרט מסך, וההערה ב-SQL היא תיאור.
⇒ **`insert` מתרחש אך ורק על תשובה שגויה.** תשובה נכונה מעלה את `times_correct` **רק אם
כבר יש שורה** ללומד ולמילה הזאת; מילה שנענתה נכון ומעולם לא הוחמצה ⛔ **אינה נכנסת לאוסף**.

⚠️ **התוצאה שנגזרת מזה, נרשמת ⛔ ואינה מוסתרת:** מאגר «המילים הידועות» של T-118 הוא
**«מילים שפעם הוחמצו ומאז נענו נכון ≥3 פעמים»** — צר יותר מקריאה תמימה של D-062. זו ⛔ אינה
תקלה: הוא בדיוק «התאוששות נמדדת», והוא **המאגר היחיד** שהזירה רשאית לבנות בלי לקרוא ולו
שדה אחד מהצד הלימודי (D-052). **הפער נרשם כפריט לביקורת בסוף התוכנית ⛔ ואינו מוכרע בשקט.**

### הכרעה ב׳ — `missed` (תצוגה, ≤5) ו-`collected` (כתיבה, עד 15) הם **שני דברים**

`ARCADE_MISSED_LIMIT = 5` הוא תקרת **התצוגה** של D-047 («המילים שהפילו אותך» חוזר ללקוח
⛔ ואינו נשמר). ⛔ **הוא אינו רשאי לחתוך את האיסוף:** קרב של 15 שאלות שבו הלומד טעה ב-7
חייב לאסוף 7, ⛔ לא 5 — אחרת האוסף משקר על מה שקרה. ⇒ שני שדות נפרדים ב-`ArcadeWritePlan`,
ובדיקה נועלת בדיוק את זה.

---

## Interfaces — החתימות המדויקות, לפני קוד

```ts
// lib/core/arcadeResult.ts — הרחבה, ⛔ אפס שינוי משמעות בשדה קיים
export type ArcadeWriteTable = 'arcade_progress' | 'arcade_runs' | 'arcade_collected_words';

export interface ArcadeWriteRow {
  readonly table: ArcadeWriteTable;
  readonly values: Readonly<Record<string, unknown>>;
}

/** שורת אוסף אחת כפי שהיא לפני הקרב. ⛔ אין כאן שדה לימודי, ⛔ ואין CEFR. */
export interface CollectedBefore {
  readonly wordId: string;
  readonly timesMissed: number;
  readonly timesCorrect: number;
}

export function planArcadeWrites(input: {
  readonly userId: string;
  readonly answers: readonly ArcadeAnswer[];
  readonly before: { readonly gameLevel: number; readonly wins: number; readonly unlockedItems: readonly string[] };
  /** ⛔ שדה **רשות**: קורא שלא סיפק אותו מקבל בדיוק את ההתנהגות הישנה (ראה צעד 1.2). */
  readonly collectedBefore?: readonly CollectedBefore[];
  readonly finishedAt: string;
}): ArcadeWritePlan;

// ArcadeWritePlan גדל בשדה אחד ⛔ ואינו מאבד אף שדה:
//   readonly collected: readonly { wordId: string; timesMissed: number; timesCorrect: number }[];
```

```ts
// lib/core/arcadeCollection.ts — חדש. טהור. אפס I/O.
export interface CollectedWord {
  readonly wordId: string;
  readonly headword: string;
  readonly translationHe: string;
  readonly timesMissed: number;
  readonly firstSeenAt: string;
}

/** שלושת המצבים של המסך. ⛔ «ריק» ו«הסתרת הכל» הם **שניים שונים** (§ 4.2יב מצבי קצה). */
export type CollectionView =
  | { readonly kind: 'list'; readonly words: readonly CollectedWord[] }
  | { readonly kind: 'empty' }
  | { readonly kind: 'all_hidden' };

export function viewCollection(input: {
  readonly visible: readonly CollectedWord[];
  readonly hiddenCount: number;
}): CollectionView;

/** «נפגשת 3 פעמים». ⛔ המספר מגיע מהשרת ⛔ ואינו מחושב במסך. */
export function encountersHe(timesMissed: number): string;
```

```ts
// lib/core/arcadeFluency.ts — חדש. טהור. T-118.
/** D-062: בתוך הזירה, «ידועה» = נענתה נכון ≥3 פעמים בקרבות. ⛔ הקבוע חי כאן בלבד. */
export const ARCADE_KNOWN_CORRECT_MIN = 3;

export function isKnownInArcade(row: { readonly timesCorrect: number }): boolean;

/** ⛔ מחזירה **מאגר**, ⛔ ולא «סיבוב שטף»: T-103 היא שבונה את הסיבוב, והיא חסומה עד כאן. */
export function fluencyPool(rows: readonly { readonly wordId: string; readonly timesCorrect: number }[]): readonly string[];
```

---

## Task 1 — `POST /api/arcade/result` אוסף את המילים שהוחמצו (T-109)

**Files:** `lib/core/arcadeResult.ts` · `lib/core/arcadeResult.test.ts` ·
`app/api/arcade/result/route.ts` · `app/api/arcade/result/route.test.ts` · `docs/api-contract.md`
**Produces:** שורות `arcade_collected_words` בתוכנית הכתיבה, והחלתן בנתיב.
**Consumes:** הטבלה מ-`0015_arcade_decoupling.sql` (כבר בריפו).
**⛔ Does NOT:** ⛔ אינו נוגע ב-`word_progress` · ⛔ אינו מוסיף כפתור «הוסף לרשימת החזרה»
(D-053: הטיעון-נגד נופל כשהיעד הוא רשימה נפרדת) · ⛔ אינו משנה את `missed` שחוזר ללקוח.

- [ ] **1.1 · הבדיקה הנופלת על השכבה הטהורה — ראשונה.** הוסף ל-`lib/core/arcadeResult.test.ts`:

```ts
describe('T-109 — הקרב אוסף את מה שהוחמץ, ⛔ ולא את מה שנענה נכון', () => {
  const before = { gameLevel: 1, wins: 0, unlockedItems: [] as string[] };
  const answer = (wordId: string, correct: boolean) =>
    ({ wordId, correct, chosen: 'x', answer: 'y' });

  it('מילה שהוחמצה ⇒ שורת אוסף אחת עם times_missed=1', () => {
    const plan = planArcadeWrites({
      userId: 'u1', answers: [answer('w1', false)], before,
      collectedBefore: [], finishedAt: '2026-08-19T00:00:00.000Z',
    });
    const rows = plan.rows.filter((r) => r.table === 'arcade_collected_words');
    expect(rows).toHaveLength(1);
    expect(rows[0].values).toMatchObject({ user_id: 'u1', word_id: 'w1', times_missed: 1, times_correct: 0 });
  });

  it('⛔ מילה שנענתה נכון ואין לה שורה ⇒ ⛔ אפס שורות אוסף', () => {
    const plan = planArcadeWrites({
      userId: 'u1', answers: [answer('w9', true)], before,
      collectedBefore: [], finishedAt: '2026-08-19T00:00:00.000Z',
    });
    expect(plan.rows.filter((r) => r.table === 'arcade_collected_words')).toHaveLength(0);
  });

  it('מילה שכבר באוסף ונענתה נכון ⇒ times_correct עולה, times_missed ⛔ לא', () => {
    const plan = planArcadeWrites({
      userId: 'u1', answers: [answer('w1', true)], before,
      collectedBefore: [{ wordId: 'w1', timesMissed: 2, timesCorrect: 1 }],
      finishedAt: '2026-08-19T00:00:00.000Z',
    });
    const row = plan.rows.find((r) => r.table === 'arcade_collected_words');
    expect(row?.values).toMatchObject({ word_id: 'w1', times_missed: 2, times_correct: 2 });
  });

  it('אותה מילה הוחמצה פעמיים באותו קרב ⇒ **שורה אחת** ומונה 2, ⛔ לא שתי שורות', () => {
    const plan = planArcadeWrites({
      userId: 'u1', answers: [answer('w1', false), answer('w1', false)], before,
      collectedBefore: [], finishedAt: '2026-08-19T00:00:00.000Z',
    });
    const rows = plan.rows.filter((r) => r.table === 'arcade_collected_words');
    expect(rows).toHaveLength(1);
    expect(rows[0].values).toMatchObject({ times_missed: 2 });
  });

  it('⛔ תקרת התצוגה ⛔ אינה חותכת את האיסוף — 7 החמצות ⇒ 7 שורות, ו-missed נשאר 5', () => {
    const answers = Array.from({ length: 7 }, (_, i) => answer(`w${i}`, false));
    const plan = planArcadeWrites({
      userId: 'u1', answers, before, collectedBefore: [],
      finishedAt: '2026-08-19T00:00:00.000Z',
    });
    expect(plan.rows.filter((r) => r.table === 'arcade_collected_words')).toHaveLength(7);
    expect(plan.missed).toHaveLength(ARCADE_MISSED_LIMIT);
  });

  it('⛔ והשומר הישן נשאר: קרב מלא ⇒ ⛔ אף שורה שאינה משלוש טבלאות הזירה', () => {
    const plan = planArcadeWrites({
      userId: 'u1',
      answers: [answer('w1', false), answer('w2', true)],
      before, collectedBefore: [{ wordId: 'w2', timesMissed: 1, timesCorrect: 0 }],
      finishedAt: '2026-08-19T00:00:00.000Z',
    });
    expect([...new Set(plan.rows.map((r) => r.table))].sort())
      .toEqual(['arcade_collected_words', 'arcade_progress', 'arcade_runs']);
    const json = JSON.stringify(plan);
    for (const forbidden of ['word_progress', 'easiness', 'repetition', 'next_review_at',
                             'self_marked_known', 'current_level']) {
      expect(json).not.toContain(forbidden);
    }
  });
});
```

- [ ] **1.2 · הרץ ומדוד שהן נופלות.** `npx vitest run lib/core/arcadeResult.test.ts`
      ⇒ צפוי `TS`/`failed` על `collectedBefore` ועל `arcade_collected_words`.
      **⛔ הדבק את הפלט בדיווח. ⛔ אל תניח שהן נופלות.**
- [ ] **1.3 · המימוש הטהור.** ב-`lib/core/arcadeResult.ts`:
      ⓐ הרחב את טיפוס הטבלה ל-`ArcadeWriteTable` ועדכן את `ARCADE_WRITE_TABLES` לשלוש.
      ⓑ הוסף `collectedBefore?: readonly CollectedBefore[]` לקלט — **רשות**, כדי שקורא
      קיים ⛔ לא יישבר ו-`typecheck` יישאר ירוק בתוך הצעד.
      ⓒ צבור לפי `wordId` ב-`Map`: החמצה ⇒ `timesMissed+1`; נכונה ⇒ `timesCorrect+1`
      **רק אם** המפתח קיים ב-`collectedBefore` או כבר נצבר בקרב הזה.
      ⓓ הפוך כל ערך צבור לשורה `{table:'arcade_collected_words', values:{user_id, word_id,
      times_missed, times_correct}}`. ⛔ אל תכתוב `first_seen_at` — ברירת המחדל בסכמה
      היא `now()`, וכתיבה מפורשת הייתה **מאפסת** את התאריך בכל upsert חוזר.
      ⓔ הוסף `collected` ל-`ArcadeWritePlan`. ⛔ `missed` ⛔ אינו משתנה.
- [ ] **1.4 · הרץ עד ירוק.** `npx vitest run lib/core/arcadeResult.test.ts`
- [ ] **1.5 · מוטציה מודדת, ⛔ לא מוצהרת.** החלף את התנאי בסעיף ⓒ כך ש-`times_correct`
      יעלה גם למילה שאין לה שורה. **חייבת ליפול** «⛔ מילה שנענתה נכון ואין לה שורה».
      שחזר את הקובץ. **הדבק את שם הבדיקה שנפלה.**
- [ ] **1.6 · הבדיקה הנופלת על הנתיב.** ב-`app/api/arcade/result/route.test.ts`, עדכן את
      השומר הקיים לשלוש טבלאות והוסף את הקריאה החדשה:

```ts
it('שלוש הטבלאות, ותו לא', () => {
  expect([...new Set(written)].sort())
    .toEqual(['arcade_collected_words', 'arcade_progress', 'arcade_runs']);
});

it('האוסף **נקרא** לפני שהתוכנית נבנית, ומסונן ללומד', () => {
  expect(CODE).toContain(".from('arcade_collected_words')");
  expect(CODE.indexOf("from('arcade_collected_words')"))
    .toBeLessThan(CODE.indexOf('planArcadeWrites('));
  const read = CODE.slice(CODE.indexOf("from('arcade_collected_words')"),
                          CODE.indexOf('planArcadeWrites('));
  expect(read).toContain(".eq('user_id', user.id)");
});

it('⛔ upsert על המפתח המורכב, ⛔ ולא על user_id לבדו', () => {
  expect(CODE).toContain("onConflict: 'user_id,word_id'");
});

it('⛔ והשומר הישן חי: word_progress ⛔ אינו מופיע בקובץ בכלל', () => {
  expect(CODE).not.toContain('word_progress');
});
```

- [ ] **1.7 · הרץ ומדוד שהן נופלות.** `npx vitest run app/api/arcade/result/route.test.ts`
- [ ] **1.8 · המימוש בנתיב.** אחרי קריאת `arcade_progress` ולפני `planArcadeWrites`:
      קרא `select('word_id, times_missed, times_correct').eq('user_id', user.id)
      .in('word_id', answers.map(a => a.wordId))`; מפה ל-`CollectedBefore[]`; העבר פנימה.
      בלולאת הכתיבה הוסף ענף שלישי: `upsert(values, { onConflict: 'user_id,word_id' })`.
      ⛔ **שגיאת סכמה בקריאת האוסף עוברת דרך `isSchemaMissing` הקיים** ⇒ 503 בעברית,
      ⛔ לא 500, ⛔ ולא קרב שנבלע בשקט.
- [ ] **1.9 · הרץ עד ירוק,** ואז מוטציה: מחק את `.eq('user_id', user.id)` מהקריאה החדשה
      ⇒ «האוסף נקרא… ומסונן ללומד» חייבת ליפול. שחזר.
- [ ] **1.10 · `docs/api-contract.md` — באותו קומיט.** במדור `POST /api/arcade/result`:
      שורה שאומרת שהנתיב כותב עכשיו גם ל-`arcade_collected_words`, ש-`missed` בתשובה
      ⛔ **לא השתנה** (עדיין ≤5, תצוגה בלבד, D-047), ושאין שדה חדש בגוף התשובה.
- [ ] **1.11 · שער האימות המלא.** הדבק את ארבע השורות.
- [ ] **1.12 · קומיט.**
      `git commit -m "loop(DEV): T-109 הקרב אוסף את המילים שהוחמצו — arcade_collected_words"`

---

## Task 2 — מסך «המילים שאספתי» (T-110)

**Files:** `lib/core/arcadeCollection.ts` (+`.test.ts`) · `app/api/arcade/collected/route.ts`
(+`.test.ts`) · `app/(tabs)/world/collected/page.tsx` · `components/CollectedWords.tsx`
(+`.test.ts`) · `lib/core/worldApps.ts` (+`.test.ts`) · `components/AppGrid.tsx`
(+`.test.ts`) · `scripts/verify-mobile.mjs` · `docs/api-contract.md`

> ⚠️ **הרחבה מוצהרת מעל עמודת הקבצים של T-110, וסיבתה חוק ⛔ ולא נוחות.** T-110 נוקבת
> בשני קבצים בלבד — המסך והרכיב. ⛔ **רכיב ממשק אינו רשאי לגעת בדאטהבייס**, ולכן נדרשת
> נקודת קצה, והיא ⛔ אינה בעמודה. בנוסף § 4.2יא (‏C-0190) מחייבת **שלושה** אריחים ברשת
> ו-`lib/core/worldApps.ts` מצהיר **שניים** ⇒ בלי האריח השלישי אין ל-T-110 דרך הגעה
> («מגיעים מאריח «המילים שאספתי»», § 4.2יב שאלה 6). שתי ההרחבות נרשמות לביקורת.

**⛔ Does NOT:** ⛔ אין «ידעתי/לא ידעתי» · ⛔ אין תזמון · ⛔ אין SM-2 · ⛔ אין רמת CEFR
במסך ובנתיב (רוי: «אין שום קשר לכרטיסיות והרמות שם») · ⛔ אין `dataviz` · ⛔ אין מחיקת שורה
(«הסתרה» היא דגל, D-053) · ⛔ אין `<ActionBar>` (המסלול בתוך `(tabs)`, D-028).

- [ ] **2.1 · הבדיקה הנופלת על השכבה הטהורה.** `lib/core/arcadeCollection.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { encountersHe, viewCollection, type CollectedWord } from './arcadeCollection';

const word = (id: string): CollectedWord => ({
  wordId: id, headword: 'ability', translationHe: 'יכולת',
  timesMissed: 3, firstSeenAt: '2026-08-19T00:00:00.000Z',
});

describe('§ 4.2יב — שני מצבים ריקים **שונים**, ⛔ ולא אחד', () => {
  it('אוסף ריק לגמרי ⇒ empty', () => {
    expect(viewCollection({ visible: [], hiddenCount: 0 })).toEqual({ kind: 'empty' });
  });
  it('הלומד הסתיר הכל ⇒ all_hidden, ⛔ ולא empty', () => {
    expect(viewCollection({ visible: [], hiddenCount: 4 })).toEqual({ kind: 'all_hidden' });
  });
  it('יש מה להציג ⇒ list', () => {
    const v = viewCollection({ visible: [word('w1')], hiddenCount: 9 });
    expect(v.kind).toBe('list');
  });
});

describe('«נפגשת N פעמים» — המספר מהשרת', () => {
  it('3 ⇒ המחרוזת נושאת את הספרה', () => {
    expect(encountersHe(3)).toContain('3');
  });
  it('1 ⇒ ⛔ אינה אומרת «1 פעמים»', () => {
    expect(encountersHe(1)).not.toContain('1 פעמים');
  });
});

describe('⛔ מדד ⓐ — ⛔ אפס שדה לימודי בשכבה הזאת', () => {
  const src = require('node:fs').readFileSync('lib/core/arcadeCollection.ts', 'utf8');
  it.each(['word_progress', 'next_review_at', 'easiness', 'repetition',
           'self_marked_known', 'current_level', 'cefr'])('⛔ %s ⛔ אינו מופיע', (bad) => {
    expect(src.toLowerCase()).not.toContain(bad);
  });
});
```

- [ ] **2.2 · הרץ ומדוד נפילה** (`ENOENT … arcadeCollection.ts` צפוי). הדבק.
- [ ] **2.3 · המימוש הטהור.** `lib/core/arcadeCollection.ts`. `viewCollection` מכריע
      לפי `visible.length === 0` ואז `hiddenCount > 0`. `encountersHe(1)` ⇒ «נפגשת פעם אחת»,
      אחרת «נפגשת N פעמים». ⛔ אפס `cefr`, ⛔ אפס תאריך מפורמט (ראה 2.10).
- [ ] **2.4 · הרץ עד ירוק,** ואז מוטציה: הפוך את שני התנאים ב-`viewCollection` ⇒ «הלומד
      הסתיר הכל» חייבת ליפול. שחזר.
- [ ] **2.5 · הבדיקה הנופלת על הנתיב.** `app/api/arcade/collected/route.test.ts`, בתבנית
      `withoutComments` של `app/api/arcade/result/route.test.ts`:

```ts
const CODE = withoutComments(readFileSync('app/api/arcade/collected/route.ts', 'utf8'));

it('⛔ GET קורא ⛔ ואינו כותב', () => {
  const get = CODE.slice(CODE.indexOf('export async function GET'),
                         CODE.indexOf('export async function PATCH'));
  for (const write of ['.insert(', '.update(', '.upsert(', '.delete(']) {
    expect(get).not.toContain(write);
  }
});

it('הקריאה מסוננת ללומד, ל-hidden_by_learner=false, והחדש למעלה', () => {
  expect(CODE).toContain(".eq('user_id', user.id)");
  expect(CODE).toContain(".eq('hidden_by_learner', false)");
  expect(CODE).toContain("ascending: false");
});

it('⛔ אין רמת CEFR בשליפה — לא כעמודה ולא בתשובה', () => {
  expect(CODE.toLowerCase()).not.toContain('cefr');
});

it.each(['word_progress', 'next_review_at', 'easiness', 'repetition',
         'self_marked_known', 'current_level'])('⛔ %s ⛔ אינו בקובץ', (bad) => {
  expect(CODE).not.toContain(bad);
});

it('PATCH מסתיר בדגל ⛔ ואינו מוחק שורה', () => {
  const patch = CODE.slice(CODE.indexOf('export async function PATCH'));
  expect(patch).toContain('hidden_by_learner');
  expect(patch).not.toContain('.delete(');
});

it('סדר השומרים של C-0032: ENV ⇒ סשן ⇒ שאילתה', () => {
  expect(CODE.indexOf('readSupabaseEnv')).toBeLessThan(CODE.indexOf('getUser'));
  expect(CODE.indexOf('getUser')).toBeLessThan(CODE.indexOf("from('arcade_collected_words')"));
});

it('סכמה חסרה ⇒ 503 בעברית, ⛔ לא 500', () => {
  expect(CODE).toContain('schema_missing');
  expect(CODE).toContain('status: 503');
});
```

- [ ] **2.6 · הרץ ומדוד נפילה.** הדבק.
- [ ] **2.7 · המימוש בנתיב.** `app/api/arcade/collected/route.ts`, `export const dynamic =
      'force-dynamic'`.
      **GET** — `from('arcade_collected_words').select('word_id, times_missed, first_seen_at,
      words!inner(headword, senses!inner(translation_he))').eq('user_id', user.id)
      .eq('hidden_by_learner', false).order('first_seen_at', { ascending: false })
      .limit(MAX_COLLECTED_ROWS)`. תשובה:
      `{ ok:true, words: CollectedWord[], hiddenCount: number }`, כאשר `hiddenCount` הוא
      קריאת `head:true` עם `count:'exact'` על `hidden_by_learner = true` **ובאותו סינון
      לומד** — ⛔ הוא מה שמפריד «ריק» מ«הסתרת הכל», ובלעדיו שני המצבים קורסים לאחד.
      **PATCH** — גוף `{ wordId: string, hidden: boolean }`, ולידציה מלאה ⛔ ולא cast,
      ואז `update({ hidden_by_learner: hidden }).eq('user_id', user.id).eq('word_id', wordId)`.
      ⛔ אין `DELETE` בקובץ.
      ⛔ **תקרת שורות** `MAX_COLLECTED_ROWS = 200`, בהערה כביטוח ⛔ ולא כמגבלת מוצר —
      בדיוק הנוסח של `MAX_FEED_ROWS` ב-`app/api/world/posts/route.ts:14`.
- [ ] **2.8 · הרץ עד ירוק,** ואז מוטציה: מחק `.eq('hidden_by_learner', false)` ⇒ הבדיקה
      בשמה חייבת ליפול. שחזר.
- [ ] **2.9 · `docs/api-contract.md`** — מדור חדש `GET /api/arcade/collected` ו-`PATCH`
      באותו מדור: הצורות, `503 schema_missing`, `401 session_expired`, ו-⛔ שורה מפורשת
      שהתשובה ⛔ **אינה** נושאת רמת CEFR ו⛔ אינה נושאת שדה מנוע חזרות.
- [ ] **2.10 · הבדיקה הנופלת על הרכיב.** `components/CollectedWords.test.ts`, בתבנית
      `components/WritingChain.test.ts` (סריקת מקור):

```ts
const SRC = readFileSync('components/CollectedWords.tsx', 'utf8');
const CODE = withoutComments(SRC);

it('קורא בלבד — ⛔ אפס apiPost (D-051)', () => {
  expect(CODE).not.toContain('apiPost');
});
it('משתמש ב-<EnWord> למילה האנגלית', () => {
  expect(CODE).toContain('<EnWord');
});
it('«הסתר» הוא יעד מגע ≥44px', () => {
  expect(CODE).toContain('min-h-touch');
});
it('⛔ אפס svg/גרף — ⛔ לא dataviz (§ 4.2יב שאלה 5)', () => {
  expect(CODE).not.toContain('<svg');
  expect(CODE.toLowerCase()).not.toContain('chart');
});
it('⛔ אפס רצף יומי ואפס ניקוד (D-050)', () => {
  for (const bad of ['streak', 'רצף', 'ניקוד', 'score', 'xp']) {
    expect(CODE.toLowerCase()).not.toContain(bad.toLowerCase());
  }
});
it('⛔ אפס toLocaleDateString — הידרציה (הלקח של C-0205)', () => {
  expect(CODE).not.toContain('toLocaleDateString');
});
it('⛔ אפס hex ואפס justify-center (F-011 · F-016)', () => {
  expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  expect(CODE).not.toContain('justify-center');
});
it('⛔ אפס רמת CEFR במסך', () => {
  expect(CODE.toLowerCase()).not.toContain('cefr');
  for (const band of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) expect(CODE).not.toContain(`'${band}'`);
});
it('שלושת המצבים מרונדרים מ-viewCollection, ⛔ ולא מתנאי מקומי', () => {
  expect(CODE).toContain('viewCollection');
  expect(CODE).toContain("'all_hidden'");
});
it('טעינה = שלד שלוש שורות, ⛔ לא ספינר (§ 4.2יב מצבי קצה)', () => {
  expect(CODE.toLowerCase()).not.toContain('spinner');
  expect(CODE).toContain('animate-pulse');
});
it('מצב ריק נושא **פעולה אחת** — קישור לזירה', () => {
  expect(CODE).toContain('/arcade');
});
```

- [ ] **2.11 · הרץ ומדוד נפילה.** הדבק.
- [ ] **2.12 · המימוש.** `components/CollectedWords.tsx` (‏`'use client'`): `apiGet`
      ל-`/api/arcade/collected`, `viewCollection` מכריע, שלושה ענפי רינדור.
      «הסתר» ⇒ `apiPatch`/`fetch` דרך `lib/api/client.ts` בלבד ואז רענון אופטימי מקומי.
      **⚠️ אם `lib/api/client.ts` ⛔ אינו מייצא עוזר ל-PATCH — הוסף אחד באותו קומיט
      בתבנית `apiPost` הקיימת. ⛔ אל תקרא ל-`fetch` ישירות מהרכיב.**
      ⛔ אין מרכוז אנכי — עוגן למעלה. ⛔ אפס hex — טוקנים בלבד.
      ⚠️ **מלכודת שנמדדה בטיק התכנון:** שומר F-011 ב-`WritingChain.test.ts:98` וב-
      `RecallCard.test.ts:80` פוסל את המחרוזת `justify-center` **כולה**, ולכן ⛔ אי-אפשר
      להשתמש בה גם למרכוז **אופקי** בתוך כפתור «הסתר» (‏`CardDeck.tsx:121` כן משתמש בה,
      ⛔ אך אין עליו את השומר הזה). ⇒ השתמש ב-`min-h-touch items-center text-center`.
- [ ] **2.13 · הרץ עד ירוק,** ואז מוטציה: הוסף `<svg …>` לרכיב ⇒ «⛔ לא dataviz» חייבת
      ליפול. שחזר.
- [ ] **2.14 · המסך.** `app/(tabs)/world/collected/page.tsx` — ‏Server Component ריק
      מגישה לנתונים, בדיוק כמו `app/(tabs)/world/chain/page.tsx`: מרנדר `<CollectedWords />`
      ותו לא. ⛔ אין `getUser()` שני.
- [ ] **2.15 · האריח השלישי.** `lib/core/worldApps.ts`: `WorldAppId` גדל ב-`'collected'`,
      `WORLD_APP_ORDER` ל-שלושה, `WORLD_APP_LABEL_HE.collected = 'המילים שאספתי'`,
      `WORLD_APP_HREF.collected = '/world/collected'`. בדיקה קודם: «הרשת נושאת בדיוק
      שלושה אריחים» + «לכל אריח יש `href` ותווית». ⛔ עדכן את הערת הראש של הקובץ ושל
      `components/AppGrid.tsx` — שתיהן אומרות היום «בדיוק שני אריחים», וזו תהיה **שקר
      מתועד** אחרי הצעד הזה.
      ⛔ **מצב האריח:** `open` תמיד — § 4.2יב אומרת שהמסך לעולם אינו לבן ושיש לו מצב ריק
      בעל פעולה אחת ⇒ ⛔ אין לו תנאי פתיחה נקוב במספר, ולכן ⛔ **אינו** אריח `locked`
      (D-046 חל על אריח נעול, ⛔ לא על אריח פתוח עם אוסף ריק).
- [ ] **2.16 · שומר המסלולים.** הוסף `/world/collected` ל-`ROUTES` ב-`scripts/verify-mobile.mjs`.
      ⚠️ **הבדיקה ב-`scripts/verify-mobile.test.ts` נגזרת מ-`ROUTES` מאז C-0205** ⇒ מסלול
      עולם שנמדד חייב רשומה, ורשומה למסלול שאינו נמדד אסורה. אם היא נופלת — היא צודקת.
- [ ] **2.17 · שער האימות המלא + `npm run check:mobile`.** ⛔ **התוצאה חייבת לכלול את
      `/world/collected` ב-320/375/414 עם `clean console`**, אפס גלילה אופקית, ו«הסתר» ≥44px.
      הדבק את מספר הבדיקות לפני ואחרי.
- [ ] **2.18 · קומיט.**
      `git commit -m "loop(DEV): T-110 מסך «המילים שאספתי» — רשימה ולא מנוע, שני מצבים ריקים"`

---

## Task 3 — «מילה ידועה» מוגדרת בתוך הזירה (T-118)

**Files:** `lib/core/arcadeFluency.ts` (+`.test.ts`)
**Consumes:** `times_correct` שנכתב ב-Task 1.
**⛔ Does NOT:** ⛔ **אינו בונה את סיבוב השטף** — זו T-103, והיא חסומה עד שהמשימה הזאת
תיסגר. ⛔ אין כאן שעון, ⛔ אין דדליין, ⛔ אין «נגמר הזמן ⇒ הפסדת» (D-049 · S16 · S18) ·
⛔ אין טבלה חדשה ואין מיגרציה (D-062 מפורשות) · ⛔ ואין קריאה ל-`self_marked_known`
ול-`repetition` — זה כל **הטעם** שהמשימה קיימת.

- [ ] **3.1 · הבדיקה הנופלת — ראשונה.** `lib/core/arcadeFluency.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ARCADE_KNOWN_CORRECT_MIN, fluencyPool, isKnownInArcade } from './arcadeFluency';

describe('D-062 — «ידועה» נמדדת בתוך הזירה בלבד', () => {
  it('הסף הוא 3', () => {
    expect(ARCADE_KNOWN_CORRECT_MIN).toBe(3);
  });
  it('2 נכונות ⛔ אינן «ידועה»', () => {
    expect(isKnownInArcade({ timesCorrect: 2 })).toBe(false);
  });
  it('3 נכונות ⇒ «ידועה»', () => {
    expect(isKnownInArcade({ timesCorrect: 3 })).toBe(true);
  });
  it('המאגר מחזיר מזהים בלבד, ורק את הכשירים', () => {
    expect(fluencyPool([
      { wordId: 'a', timesCorrect: 5 },
      { wordId: 'b', timesCorrect: 1 },
      { wordId: 'c', timesCorrect: 3 },
    ])).toEqual(['a', 'c']);
  });
});

describe('⛔ הבידוד של D-052 הוא בדיקה שנכשלת', () => {
  const src = readFileSync('lib/core/arcadeFluency.ts', 'utf8');
  it.each(['self_marked_known', 'selfMarkedKnown', 'repetition', 'word_progress',
           'next_review_at', 'easiness', 'current_level'])('⛔ %s ⛔ אינו בקובץ', (bad) => {
    expect(src).not.toContain(bad);
  });
  it('⛔ ואין שעון ואין דדליין (D-049 · S16)', () => {
    for (const bad of ['setTimeout', 'Date.now', 'deadline', 'countdown']) {
      expect(src).not.toContain(bad);
    }
  });
});
```

- [ ] **3.2 · הרץ ומדוד נפילה** (`ENOENT … arcadeFluency.ts`). הדבק.
- [ ] **3.3 · המימוש.** `lib/core/arcadeFluency.ts` — שלושה יצוא, אפס I/O, אפס תלות.
      בראש הקובץ הערה שמסבירה **למה** ההגדרה חיה כאן ולא בצד הלימודי (D-052 מול D-049),
      ומצטטת את Nation 2007 כפי ש-D-062 מצטט.
      ⛔ **אל תכתוב את שמות השדות האסורים גם בהערה** — הבדיקה סורקת את המקור הגולמי
      (⛔ ללא `withoutComments`, במכוון: כאן גם אזכור בהערה הוא ריח).
- [ ] **3.4 · הרץ עד ירוק,** ואז מוטציה: שנה את הסף ל-`>=` על 2 ⇒ «2 נכונות ⛔ אינן
      «ידועה»» חייבת ליפול. שחזר.
- [ ] **3.5 · שער האימות המלא.** הדבק.
- [ ] **3.6 · סגירה.** סמן T-109 · T-110 · T-118 כ-🟣 ב-`plan/50-tasks.md`,
      הרץ `npm run measure:plan` **באותו קומיט** (‏F-059 · F-062ⓒ · F-063 — שלוש פעמים
      אותה מחלקה), ועדכן `plan/30-architecture.md` בכל סטייה מוצהרת.
- [ ] **3.7 · קומיט.**
      `git commit -m "loop(DEV): T-118 «ידועה» = 3 נכונות בקרבות — ההגדרה עוברת פנימה לזירה"`

---

## בדיקה עצמית של התוכנית (בוצעה בטיק התכנון C-0206)

**כיסוי מול המפרט.**
T-109 ⇒ Task 1: upsert על לומד+מילה ✅ · `times_missed` עולה ✅ · ⛔ אפס `word_progress` ✅ ·
השומר הקיים «קרב מלא ⇒ `word_progress` זהה» **נשאר ומורחב** ✅ · ⛔ אין כפתור «הוסף
לרשימת החזרה» ✅.
T-110 ⇒ Task 2: `EnWord` ✅ · תרגום ✅ · «נפגשת N פעמים» ✅ · «הסתר» ≥44px ✅ · החדש למעלה ✅ ·
⛔ אין «ידעתי/לא ידעתי» ✅ · ⛔ אין תזמון/SM-2 ✅ · ⛔ אין CEFR ✅ · שני מצבים ריקים שונים ✅ ·
מסגור «שלל» ✅ (הכותרת נכתבת בצעד 2.12 — «מה שאספתי», ⛔ לא «טעויות»).
T-118 ⇒ Task 3: ההגדרה עוברת פנימה ✅ · `times_correct` באותה טבלה ✅ · ⛔ אפס טבלה חדשה ✅ ·
⛔ אין דדליין ואין «נגמר הזמן» ✅ · ⛔ סיבוב השטף עצמו ⛔ אינו נבנה כאן ✅ (T-103).

**עקביות טיפוסים.** `wordId` הוא `string` בשלושת השלבים · `timesCorrect`/`timesMissed` הם
`number` · `CollectedBefore` שיוצא מהנתיב ב-1.8 הוא בדיוק מה ש-`planArcadeWrites` מקבל ב-1.3 ·
`CollectedWord` שהנתיב מחזיר ב-2.7 הוא בדיוק מה ש-`viewCollection` מקבל ב-2.3.

**⚠️ ארבעה פריטים לביקורת, ⛔ ולא לביצוע שקט:**

ⓐ **הכרעה א׳ מצמצמת את מאגר D-062.** «ידועה» יוצא «הוחמצה פעם ומאז נענתה נכון ≥3».
   קריאה תמימה של D-062 הייתה נותנת מאגר רחב יותר. ⛔ הוכרע לצד T-109 ו-§ 4.2יב, שהן
   מפרט כתוב, מול הערת SQL שהיא תיאור. **ה-Critic מכריע אם זה מה שהתכוונו.**
ⓑ **T-110 מקבלת נקודת קצה שאינה בעמודת הקבצים שלה,** כי רכיב ממשק אינו רשאי לגעת בדאטהבייס.
ⓒ **`lib/core/worldApps.ts` נערך,** כי § 4.2יא (‏C-0190) מחייבת שלושה אריחים והקובץ מצהיר
   שניים — כלומר **המסמך והקוד כבר חלוקים היום**, ⛔ והתוכנית ⛔ אינה יוצרת את הפער אלא
   סוגרת אותו. שתי הערות ראש שאומרות «בדיוק שני אריחים» יתוקנו באותו קומיט.
ⓓ **מצב האריח השלישי הוא `open` תמיד** ⛔ ולא `locked` — אין לו תנאי פתיחה נקוב במספר,
   ו-§ 4.2יא אוסרת אריח בלי תנאי מדיד. ⛔ ההצדקה: § 4.2יב מגדירה לו **מצב ריק בעל פעולה
   אחת**, כלומר המסך שמיש מהרגע הראשון ⇒ ⛔ אין מה לנעול. **ה-Critic מכריע.**

**סיכון ידוע שנרשם ⛔ ולא הוסתר.** `0015_arcade_decoupling.sql` **טרם הורצה על פרויקט חי**
(‏פריט 40 ב-`plan/03-for-roy.md`) ⇒ בייצור, `GET /api/arcade/collected` ו-`POST /api/arcade/result`
יחזירו **503 בעברית** עד שרוי יריץ אותה. ⛔ זה מצב מתוכנן ⛔ ולא רגרסיה: כל שלושת השלבים
מטפלים בו דרך `isSchemaMissing` הקיים, והקרב עצמו ⛔ אינו תלוי בטבלה הזאת.
