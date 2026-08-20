# Arcade Result Idempotency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** לגרום ל-`POST /api/arcade/result` להיות אידמפוטנטי, כך שרצף `retry-on-online` על אותו קרב ⛔ לא ינפח `wins`, ⛔ לא יכפיל שורת `arcade_runs`, ו⛔ לא יעלה `times_missed`/`times_correct` פעמיים (F-092 🟠).

**Architecture:** מפתח אידמפוטנטיות (`runId`, uuid) נוצר **פעם אחת בלקוח ברגע השליחה** ונשמר בתוך `pendingResult`, ולכן כל שידור חוזר נושא בדיוק את אותו מפתח. בשרת המפתח נאכף **בסכמה**: `arcade_runs` מקבלת עמודת `run_id` ואינדקס ייחודי, ועמודת `response_snapshot jsonb` שמחזיקה את גוף התשובה שנשלח ללומד בפעם הראשונה. הנתיב מקבל **שתי** הגנות: (ⓐ) קריאה מקדימה שמחזירה את התצלום בלי אף כתיבה — המסלול הנפוץ, ו-(ⓑ) `insert` על `arcade_runs` **ראשון בסדר הכתיבות**, כך שהתנגשות `23505` עוצרת את שאר הכתיבות — זו ההגנה שמחזיקה גם בשני שידורים **בו-זמנית**, שבהם ⓐ נכשלת (TOCTOU).

⚠️ **למה ⓐ לבדה ⛔ אינה מספיקה, וזה בדיוק מה שהממצא הזהיר מפניו:** «`.insert` ⇒ `.upsert({run_id})`» היה משאיר את `arcade_progress` נכתב פעמיים. הפתרון חייב לחסום את **כל** הכתיבות בהינתן `run_id` קיים — ולכן `arcade_runs` עובר להיות **הכתיבה הראשונה**, ⛔ ולא השנייה.

**Tech Stack:** Next.js App Router (route handlers) · TypeScript · Supabase/PostgREST · Postgres · Vitest.

**Spec:** `plan/60-findings.md` — **F-092** (שורה 113). מקורות תומכים: `plan/40-decisions.md` § 4.2י · D-044 · D-047 · D-050 · D-052 · D-059 · D-067ⓑ · `docs/api-contract.md` § `POST /api/arcade/result`.

## Global Constraints

- ⛔ `/lib/core/` טהור: אפס React · `window` · `document` · `localStorage` · `fetch` · `process.env` · `crypto`. `crypto.randomUUID()` חי **רק** ב-`components/ArenaBoard.tsx`.
- ⛔ הנתיב כותב **בדיוק לשלוש טבלאות**: `arcade_progress` · `arcade_runs` · `arcade_collected_words`. ⛔ אפס נגיעה ב-`word_progress` · `profiles` · `words` · `senses` (D-044 · D-052). הבדיקות הקיימות ב-`app/api/arcade/result/route.test.ts:15-52` אוכפות זאת ו⛔ אין להחליש אותן.
- ⛔ אפס שעון ב-`ArenaBoard.tsx`: `setTimeout` · `setInterval` · `requestAnimationFrame` · `Date.now` אסורים (D-045 · R-020, נאכף ב-`components/ArenaBoard.test.ts:34-45`).
- ⛔ אין ניקוד, מטבע, XP או לוח תוצאות (D-050).
- `docs/api-contract.md` מתעדכן **באותו קומיט** של שינוי נקודת הקצה (חוק הלופ, שלב 5).
- מיגרציה: `begin;`/`commit;`, `if not exists` על כל אובייקט, וכל אילוץ **בשם ובנפרד** בתוך `do $$` — ⛔ לא בתוך `create table` (הלקח של C-0032).
- TypeScript ללא `any`.
- פקודת האימות המלאה, ⛔ ואין טענת הצלחה בלעדיה:
  `npm run typecheck && npm run check:core && npm test && npm run build`

## שתי סטיות מוצהרות מנוסח הממצא, ⛔ ולא השמטות

**סטייה 1 — הקובץ הוא `0018_arcade_run_id.sql`, ⛔ ולא `0017`.** הממצא נקב ב-`0017`, אבל `0017_stories.sql` כבר **הובטח לרוי בכתב** ב-`plan/03-for-roy.md` פריט 42 (C-0239, T-134). שני קבצים באותו מספר הם שתי הוראות סותרות למי שמריץ אותן ידנית. שתי המיגרציות נוגעות בטבלאות **זרות זו לזו** (`stories` מול `arcade_runs`) ⇒ סדר ההרצה ביניהן ⛔ אינו משנה, והרווח המספרי ⛔ אינו פגם.

**סטייה 2 — `run_id` הוא `uuid` **null-אפשרי** עם **אינדקס ייחודי חלקי**, ⛔ ולא `not null unique`.** הסיבה נמדדת: `0014_arcade.sql` הוחלה בייצור, ולכן `alter table … add column run_id uuid not null` **ייכשל** על כל שורת `arcade_runs` היסטורית. `not null` נאכף בשכבת הנתיב (422 על גוף בלי `runId`) ו⛔ לא בסכמה, והנימוק כתוב בקובץ המיגרציה עצמו.

---

## File Structure

| הקובץ | האחריות |
|---|---|
| `supabase/migrations/0018_arcade_run_id.sql` | **חדש.** `run_id uuid` · `response_snapshot jsonb` · אינדקס ייחודי חלקי על `run_id`. |
| `lib/supabase/arcadeRunId.test.ts` | **חדש.** שומר על מה שהמיגרציה **אומרת** (⛔ לא שהורצה) — תבנית `arcadeDecoupling.test.ts`. |
| `lib/core/arcadeResult.ts` | **שינוי.** `planArcadeWrites` מקבל `runId`, מחזיר `response` (גוף התשובה), ומזיז את `arcade_runs` **לראש** `rows` עם `run_id` + `response_snapshot`. |
| `lib/core/arcadeResult.test.ts` | **שינוי.** בדיקות לסדר, למפתח ולתצלום. |
| `app/api/arcade/result/route.ts` | **שינוי.** `parseRunId` · קריאת קיצור-דרך · עצירה על `23505`. |
| `app/api/arcade/result/route.test.ts` | **שינוי.** בדיקות שער על מקור הנתיב. |
| `components/ArenaBoard.tsx` | **שינוי.** `runId: crypto.randomUUID()` נוצר פעם אחת בשליחה ונישא ב-`pendingResult`. |
| `components/ArenaBoard.test.ts` | **שינוי.** ⚠️ שורה 124 קיימת (`send({ answers: battle.answers })`) ותיפול — היא **מתעדכנת**, ⛔ לא נמחקת. |
| `docs/api-contract.md` | **שינוי.** `runId` בבקשה · 200 חוזר על שידור חוזר · 422 על `runId` פגום. |

---

## Task 1: המיגרציה — המפתח והתצלום בסכמה

**Files:**
- Create: `supabase/migrations/0018_arcade_run_id.sql`
- Create: `lib/supabase/arcadeRunId.test.ts`

**Interfaces:**
- Consumes: `supabase/migrations/0014_arcade.sql` — הטבלה `public.arcade_runs (id, user_id, finished_at, words_seen, words_correct, enemy_defeated)`.
- Produces: שתי עמודות חדשות ב-`public.arcade_runs` — `run_id uuid` (null-אפשרי) ו-`response_snapshot jsonb` (null-אפשרי); אינדקס ייחודי `arcade_runs_run_id_key` על `(run_id) where run_id is not null`. שם האינדקס הוא שם האילוץ שהנתיב יראה בשגיאת `23505` ב-Task 3.

- [ ] **Step 1: כתוב את הבדיקה הנופלת**

צור `lib/supabase/arcadeRunId.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * שומר על `0018_arcade_run_id.sql` (F-092). כמו `arcadeDecoupling.test.ts`:
 * מוכיח מה הקובץ **אומר**, ⛔ לא שהוא הורץ (הרצה = פעולת רוי).
 * ההערות מולבנות לפני כל טענה — אילוץ שהוער החוצה אינו אילוץ.
 */
const SQL = readFileSync('supabase/migrations/0018_arcade_run_id.sql', 'utf8');
const BODY = SQL.replace(/--[^\n]*$/gm, '');

describe('0018 — אידמפוטנטיות של המיגרציה עצמה', () => {
  it('רצה בטרנזקציה אחת', () => {
    expect(BODY).toMatch(/^\s*begin;/im);
    expect(BODY).toMatch(/commit;\s*$/im);
  });

  it('שתי העמודות נוספות עם if not exists — הרצה שנייה ⛔ אינה נופלת', () => {
    expect(BODY).toMatch(/add column if not exists\s+run_id\s+uuid/i);
    expect(BODY).toMatch(/add column if not exists\s+response_snapshot\s+jsonb/i);
  });

  it('האינדקס נוצר עם if not exists', () => {
    expect(BODY).toMatch(/create unique index if not exists\s+arcade_runs_run_id_key/i);
  });
});

describe('⛔ שני שידורים של אותו קרב הם שורה אחת', () => {
  it('האינדקס ייחודי ועל run_id', () => {
    expect(BODY).toMatch(/create unique index if not exists\s+arcade_runs_run_id_key\s+on\s+public\.arcade_runs\s*\(\s*run_id\s*\)/i);
  });

  it('⛔ חלקי, ⛔ ולא מלא — שורה היסטורית בלי מפתח ⛔ אינה מתנגשת בשנייה', () => {
    const index = BODY.slice(BODY.indexOf('create unique index'));
    expect(index).toMatch(/where\s+run_id\s+is\s+not\s+null/i);
  });

  it('⛔ העמודה null-אפשרית: not null היה מפיל את המיגרציה על שורות 0014 קיימות', () => {
    const addRunId = BODY.match(/add column if not exists\s+run_id\s+uuid[^;,\n]*/i)?.[0] ?? '';
    expect(addRunId).not.toMatch(/not null/i);
  });
});

describe('⛔ הבידוד של D-052 שרד את המיגרציה', () => {
  it.each(['word_progress', 'self_marked_known', 'current_level', 'senses', 'profiles'])(
    '⛔ %s אינו מופיע באף שורת SQL', (token) => {
      expect(BODY).not.toContain(token);
    },
  );

  it('⛔ אפס עמודת ניקוד (D-050)', () => {
    for (const banned of [/\bscore\b/i, /\bpoints\b/i, /\bcoins\b/i, /\bxp\b/i]) {
      expect(BODY).not.toMatch(banned);
    }
  });
});
```

- [ ] **Step 2: הרץ ואמת שהיא נופלת**

Run: `npx vitest run lib/supabase/arcadeRunId.test.ts`
Expected: FAIL — `ENOENT: no such file or directory, open 'supabase/migrations/0018_arcade_run_id.sql'`

- [ ] **Step 3: כתוב את המיגרציה**

צור `supabase/migrations/0018_arcade_run_id.sql`:

```sql
-- 0018_arcade_run_id.sql — מפתח אידמפוטנטיות לסוף הקרב (F-092).
--
-- מוחל בעורך ה-SQL של Supabase (או `supabase db push`) אחרי 0014.
--
-- ⚠️ **למה 0018 ו⛔ לא 0017:** `0017_stories.sql` כבר הובטח לרוי בכתב
-- (`plan/03-for-roy.md` פריט 42 · T-134). שני קבצים באותו מספר הם שתי הוראות
-- סותרות למי שמריץ אותן ביד. הטבלאות זרות זו לזו ⇒ סדר ההרצה ⛔ אינו משנה.
--
-- ⚠️ **למה `run_id` null-אפשרית ו⛔ לא `not null`:** `0014_arcade.sql` הוחלה
-- בייצור, ולכן `add column … not null` בלי ברירת מחדל **נופל** על כל שורת
-- `arcade_runs` היסטורית. החובה נאכפת בשכבת הנתיב — גוף בלי `runId` מקבל 422
-- (`app/api/arcade/result/route.ts`) — ⛔ ולכן אין כאן פרצה, יש גבול אחר.
--
-- ⛔ **אין כאן שדה לימודי, אין ניקוד ואין מפתח זר לצד הלימודי** (D-050 · D-052).

begin;

alter table public.arcade_runs
  add column if not exists run_id uuid;

alter table public.arcade_runs
  add column if not exists response_snapshot jsonb;

comment on column public.arcade_runs.run_id is
  'F-092 · מפתח אידמפוטנטיות שהלקוח מייצר פעם אחת לקרב. שידור חוזר אחרי נפילת
   רשת נושא את אותו מפתח, והאינדקס הייחודי הופך את הכתיבה השנייה לשגיאת 23505
   שהנתיב תופס. ⛔ אינו מזהה השורה — `id` הוא.';

comment on column public.arcade_runs.response_snapshot is
  'F-092 · גוף התשובה שנשלח ללומד בשידור הראשון. שידור חוזר מקבל **אותו** גוף
   בדיוק, ⛔ ולא חישוב מחדש: `unlocked` ו-`leveledUp` נכונים פעם אחת בלבד.';

-- ⛔ חלקי במכוון: `where run_id is not null` מתיר לשורות 0014 ההיסטוריות,
-- שכולן `null`, לחיות זו לצד זו. אינדקס מלא היה מכריז אותן כפילויות.
create unique index if not exists arcade_runs_run_id_key
  on public.arcade_runs (run_id)
  where run_id is not null;

commit;
```

- [ ] **Step 4: הרץ ואמת שהיא עוברת**

Run: `npx vitest run lib/supabase/arcadeRunId.test.ts`
Expected: PASS — כל הבדיקות ירוקות.

- [ ] **Step 5: קומיט**

```bash
git add supabase/migrations/0018_arcade_run_id.sql lib/supabase/arcadeRunId.test.ts
git commit -m "feat(arcade): 0018 — run_id + response_snapshot on arcade_runs (F-092 task 1)"
```

---

## Task 2: השכבה הטהורה — המפתח, התצלום, וסדר הכתיבות

**Files:**
- Modify: `lib/core/arcadeResult.ts` (‏`planArcadeWrites` — החתימה, `rows`, וטיפוס `ArcadeWritePlan`)
- Test: `lib/core/arcadeResult.test.ts`

**Interfaces:**
- Consumes: מ-Task 1 — שמות העמודות `run_id` ו-`response_snapshot` בטבלה `arcade_runs`.
- Produces — החתימה המדויקת ש-Task 3 צורך:

```ts
export interface ArcadeResultResponse {
  readonly ok: true;
  readonly enemyDefeated: boolean;
  readonly outcome: 'victory' | 'survived';
  readonly leveledUp: boolean;
  readonly unlocked: string | null;
  readonly missed: readonly { readonly wordId: string; readonly answer: string; readonly chosen: string }[];
}

export interface ArcadeWritePlan {
  // … כל השדות הקיימים נשארים כפי שהם …
  /** F-092 · גוף התשובה, ⛔ נבנה פעם אחת: הנתיב מחזיר **אותו** אובייקט שהוא שומר. */
  readonly response: ArcadeResultResponse;
}

export function planArcadeWrites(input: {
  readonly userId: string;
  /** F-092 · מפתח האידמפוטנטיות. ⛔ חובה — ⛔ אין ברירת מחדל ו⛔ אין `?`. */
  readonly runId: string;
  readonly answers: readonly ArcadeAnswer[];
  readonly before: { readonly gameLevel: number; readonly wins: number; readonly unlockedItems: readonly string[] };
  readonly collectedBefore?: readonly CollectedBefore[];
  readonly finishedAt: string;
}): ArcadeWritePlan
```

  ⚠️ **‏`rows[0].table === 'arcade_runs'` הוא חלק מהחוזה**, ⛔ ולא פרט מימוש: Task 3 מסתמך על כך שהכתיבה הראשונה היא זו שמתנגשת.

- [ ] **Step 1: כתוב את הבדיקות הנופלות**

הוסף לסוף `lib/core/arcadeResult.test.ts`:

```ts
describe('F-092 — מפתח אידמפוטנטיות, תצלום תשובה, וסדר כתיבות', () => {
  const base = {
    userId: 'u-1',
    runId: '11111111-2222-3333-4444-555555555555',
    before: { gameLevel: 1, wins: 0, unlockedItems: [] as readonly string[] },
    finishedAt: '2026-08-20T21:00:00.000Z',
  };
  const hit = (wordId: string) => ({ wordId, correct: true, chosen: 'x', answer: 'x' });
  const miss = (wordId: string) => ({ wordId, correct: false, chosen: 'y', answer: 'x' });

  it('⛔ `arcade_runs` הוא הכתיבה **הראשונה** — היא השער, ⛔ ולא הסיכום', () => {
    const plan = planArcadeWrites({ ...base, answers: [miss('w-1'), hit('w-1')] });
    expect(plan.rows[0]?.table).toBe('arcade_runs');
  });

  it('שורת הקרב נושאת את `run_id` שהתקבל', () => {
    const plan = planArcadeWrites({ ...base, answers: [hit('w-1')] });
    const run = plan.rows.find((r) => r.table === 'arcade_runs');
    expect(run?.values.run_id).toBe('11111111-2222-3333-4444-555555555555');
  });

  it('שורת הקרב נושאת את גוף התשובה עצמו — ⛔ ולא חישוב שני', () => {
    const plan = planArcadeWrites({ ...base, answers: [miss('w-1')] });
    const run = plan.rows.find((r) => r.table === 'arcade_runs');
    expect(run?.values.response_snapshot).toEqual(plan.response);
  });

  it('גוף התשובה הוא בדיוק שש המפתחות של החוזה, ⛔ ואין שביעי', () => {
    const plan = planArcadeWrites({ ...base, answers: [miss('w-1')] });
    expect(Object.keys(plan.response).sort())
      .toEqual(['enemyDefeated', 'leveledUp', 'missed', 'ok', 'outcome', 'unlocked']);
    expect(plan.response.ok).toBe(true);
  });

  it('גוף התשובה מסכים עם שדות התוכנית — ⛔ אפס מקור אמת שני', () => {
    const answers = [miss('w-1'), miss('w-2'), hit('w-3')];
    const plan = planArcadeWrites({ ...base, answers });
    expect(plan.response.enemyDefeated).toBe(plan.enemyDefeated);
    expect(plan.response.outcome).toBe(plan.outcome);
    expect(plan.response.leveledUp).toBe(plan.leveledUp);
    expect(plan.response.unlocked).toBe(plan.unlocked);
    expect(plan.response.missed).toEqual(plan.missed);
  });

  it('⛔ אותו `runId` בשני חישובים נותן אותו תצלום — הפונקציה נשארה טהורה', () => {
    const answers = [miss('w-1'), hit('w-2')];
    const a = planArcadeWrites({ ...base, answers });
    const b = planArcadeWrites({ ...base, answers });
    expect(a.rows).toEqual(b.rows);
    expect(a.response).toEqual(b.response);
  });
});
```

- [ ] **Step 2: הרץ ואמת שהן נופלות**

Run: `npx vitest run lib/core/arcadeResult.test.ts`
Expected: FAIL — הראשונה נופלת עם `expected 'arcade_progress' to be 'arcade_runs'`, והשאר עם `expected undefined to be …`.
⚠️ אם `tsc` בתוך vitest מתלונן על `runId` שאינו בחתימה — זו בדיוק הנפילה הצפויה.

- [ ] **Step 3: כתוב את המימוש המינימלי**

ב-`lib/core/arcadeResult.ts`:

ⓐ הוסף את הטיפוס מעל `ArcadeWritePlan`:

```ts
/** F-092 · גוף התשובה של `POST /api/arcade/result`, כפי שהוא נשמר וכפי שהוא חוזר. */
export interface ArcadeResultResponse {
  readonly ok: true;
  readonly enemyDefeated: boolean;
  readonly outcome: 'victory' | 'survived';
  readonly leveledUp: boolean;
  readonly unlocked: string | null;
  readonly missed: readonly { readonly wordId: string; readonly answer: string; readonly chosen: string }[];
}
```

ⓑ הוסף שדה ל-`ArcadeWritePlan` (אחרי `collected`):

```ts
  /**
   * F-092 · גוף התשובה, ⛔ נבנה **פעם אחת**. הנתיב שומר אותו ב-`response_snapshot`
   * ומחזיר **אותו אובייקט**; שידור חוזר מקבל את התצלום ⛔ ולא חישוב שני, כי
   * `unlocked` ו-`leveledUp` נכונים פעם אחת בלבד — בפעם הראשונה.
   */
  readonly response: ArcadeResultResponse;
```

ⓒ הוסף `runId` לחתימת הקלט של `planArcadeWrites`, אחרי `userId`:

```ts
  /**
   * F-092 · מפתח האידמפוטנטיות של הקרב. ⛔ **חובה ו⛔ בלי ברירת מחדל:** קורא
   * ששוכח אותו היה מקבל בדיוק את הפגם שהעמודה נועדה לסגור.
   */
  readonly runId: string;
```

ⓓ לפני ה-`return`, בנה את גוף התשובה:

```ts
  const response: ArcadeResultResponse = {
    ok: true,
    enemyDefeated: won,
    outcome: won ? 'victory' : 'survived',
    leveledUp: after.leveledUp,
    unlocked: next,
    missed,
  };
```

ⓔ החלף את בלוק ה-`return` כך ששורת `arcade_runs` היא **הראשונה**, נושאת את שתי העמודות החדשות, ו-`response` מוחזר:

```ts
  return {
    rows: [
      // ⛔ **ראשונה, ⛔ ולא שנייה (F-092).** האינדקס הייחודי על `run_id` הופך את
      // הכתיבה הזאת לשער: שידור חוזר מתנגש **כאן**, לפני ש-`arcade_progress`
      // הספיק לנפח את `wins`. סדר הפוך היה מותיר בדיוק את הפגם המקורי.
      {
        table: 'arcade_runs',
        values: {
          user_id: input.userId,
          run_id: input.runId,
          finished_at: input.finishedAt,
          words_seen: input.answers.length,
          words_correct: correct,
          enemy_defeated: won,
          response_snapshot: response,
        },
      },
      {
        table: 'arcade_progress',
        values: {
          user_id: input.userId,
          arcade_level: after.level,
          wins: after.wins,
          unlocked_items: unlockedItems,
          updated_at: input.finishedAt,
        },
      },
      // ⛔ `first_seen_at` ⛔ אינו נכתב במכוון: ברירת המחדל בסכמה היא `now()`, וכתיבה
      // מפורשת הייתה **מאפסת** את תאריך הפגישה הראשונה בכל upsert חוזר.
      ...collected.map((c) => ({
        table: 'arcade_collected_words' as const,
        values: {
          user_id: input.userId,
          word_id: c.wordId,
          times_missed: c.timesMissed,
          times_correct: c.timesCorrect,
        },
      })),
    ],
    collected,
    enemyDefeated: won,
    outcome: won ? 'victory' : 'survived',
    leveledUp: after.leveledUp,
    unlocked: next,
    missed,
    response,
  };
```

- [ ] **Step 4: הרץ ואמת שהן עוברות**

Run: `npx vitest run lib/core/arcadeResult.test.ts && npm run check:core`
Expected: PASS · `/lib/core purity: OK`

⚠️ **צפוי שבדיקות ותיקות ב-`arcadeResult.test.ts` ייפלו כאן על שני דברים, ושתיהן תקינות לעדכון:**
1. קריאה ל-`planArcadeWrites` בלי `runId` ⇒ שגיאת טיפוס. **הוסף** `runId: 'run-test'` לכל קריאה קיימת בקובץ הבדיקה. ⛔ אל תהפוך את השדה לרשות.
2. בדיקה שמניחה `rows[0].table === 'arcade_progress'` או אינדקס מספרי. **החלף** לחיפוש לפי שם: `plan.rows.find((r) => r.table === 'arcade_progress')`. ⛔ אל תשנה את סדר הכתיבות בחזרה.

- [ ] **Step 5: קומיט**

```bash
git add lib/core/arcadeResult.ts lib/core/arcadeResult.test.ts
git commit -m "feat(arcade): runId + response snapshot in planArcadeWrites, arcade_runs first (F-092 task 2)"
```

---

## Task 3: הנתיב, הלקוח והחוזה — שתי ההגנות בפועל

**Files:**
- Modify: `app/api/arcade/result/route.ts`
- Modify: `components/ArenaBoard.tsx`
- Modify: `docs/api-contract.md` (§ `POST /api/arcade/result`)
- Test: `app/api/arcade/result/route.test.ts` · `components/ArenaBoard.test.ts`

**Interfaces:**
- Consumes: מ-Task 2 — `planArcadeWrites({ userId, runId, answers, before, collectedBefore, finishedAt })`, השדה `plan.response`, והחוזה `plan.rows[0].table === 'arcade_runs'`. מ-Task 1 — האינדקס `arcade_runs_run_id_key` והעמודה `response_snapshot`.
- Produces: גוף בקשה עם `runId: string` (uuid v4 בייצוג קנוני). תשובת 200 זהה בשידור ראשון ובכל שידור חוזר.

- [ ] **Step 1: כתוב את בדיקות הנתיב הנופלות**

הוסף לסוף `app/api/arcade/result/route.test.ts` (הקובץ כבר מגדיר `CODE` ו-`CONTRACT` בראשו — ⛔ אל תגדיר אותם שוב):

```ts
describe('F-092 — הנתיב אידמפוטנטי, ⛔ ולא «כמעט»', () => {
  it('`runId` מאומת בטיפוסו ובצורתו, ⛔ ולא cast', () => {
    expect(CODE).toContain('parseRunId');
    // הצורה נבדקת: מחרוזת כלשהי ⛔ אינה מפתח.
    expect(CODE).toMatch(/[0-9a-f]\{8\}|uuid/i);
  });

  it('`runId` פגום ⇒ 422, ⛔ ולפני כל כתיבה', () => {
    expect(CODE).toMatch(/fieldErrors:\s*\{\s*runId/);
    expect(CODE.indexOf('parseRunId')).toBeLessThan(CODE.indexOf('planArcadeWrites('));
  });

  it('ⓐ קריאת קיצור-הדרך קודמת לבניית התוכנית', () => {
    expect(CODE).toContain('response_snapshot');
    expect(CODE.indexOf('response_snapshot')).toBeLessThan(CODE.indexOf('planArcadeWrites('));
    const shortcut = CODE.slice(CODE.indexOf("from('arcade_runs')"), CODE.indexOf('planArcadeWrites('));
    expect(shortcut).toContain(".eq('run_id'");
    expect(shortcut).toContain(".eq('user_id', user.id)");
  });

  it('ⓑ התנגשות ייחודיות עוצרת את **שאר** הכתיבות — ⛔ לא רק את שורת הקרב', () => {
    expect(CODE).toContain('23505');
    // העצירה היא `return`/`break` מתוך הלולאה, ⛔ ולא `continue`.
    const conflict = CODE.slice(CODE.indexOf('23505'));
    expect(conflict.slice(0, 400)).toMatch(/\breturn\b|\bbreak\b/);
    expect(conflict.slice(0, 400)).not.toMatch(/\bcontinue\b/);
  });

  it('⛔ שידור חוזר מחזיר את התצלום, ⛔ ולא חישוב שני', () => {
    expect(CODE).toMatch(/response_snapshot/);
    // התשובה המוחזרת היא `plan.response`, ⛔ ולא אובייקט שנבנה בנתיב שוב.
    expect(CODE).toContain('plan.response');
    expect(CODE).not.toMatch(/enemyDefeated:\s*plan\.enemyDefeated/);
  });

  it('החוזה מתעד את `runId` ואת השידור החוזר', () => {
    const section = CONTRACT.slice(
      CONTRACT.indexOf('## POST /api/arcade/result'),
      CONTRACT.indexOf('## GET /api/arcade/collected'),
    );
    expect(section).toContain('runId');
    expect(section).toMatch(/אידמפוטנט/);
  });

  it('⛔ שלוש הטבלאות נשמרו — האידמפוטנטיות ⛔ לא פתחה טבלה רביעית', () => {
    const written = [...CODE.matchAll(/\.from\('([a-z_]+)'\)\s*\.(?:upsert|insert|update|delete)\(/g)]
      .map((m) => m[1]);
    expect([...new Set(written)].sort())
      .toEqual(['arcade_collected_words', 'arcade_progress', 'arcade_runs']);
  });
});
```

הוסף ל-`components/ArenaBoard.test.ts`:

```ts
describe('F-092 — מפתח הקרב נוצר פעם אחת ונישא בשידור החוזר', () => {
  it('המפתח נוצר ב-`crypto.randomUUID`', () => {
    expect(CODE).toMatch(/crypto\.randomUUID\(\)/);
  });

  it('הוא נשלח בגוף, לצד `answers`', () => {
    expect(CODE).toMatch(/send\(\s*\{[^}]*runId[^}]*answers:\s*battle\.answers[^}]*\}\s*\)/s);
  });

  it('⛔ המפתח ⛔ אינו נוצר בתוך `send` — שידור חוזר היה מקבל מפתח חדש', () => {
    const send = CODE.slice(CODE.indexOf('const send = useCallback'), CODE.indexOf('useEffect(() => {\n    if (battle === null)'));
    expect(send).not.toContain('randomUUID');
  });

  it('השידור החוזר משדר את `pendingResult` כמות שהוא', () => {
    expect(CODE).toMatch(/send\(pendingResult\)/);
  });
});
```

⚠️ **בדיקה קיימת שתיפול, והיא מתעדכנת ⛔ ולא נמחקת:** `components/ArenaBoard.test.ts:124` טוענת `send({ answers: battle.answers })` בדיוק. החלף אותה בטענה החדשה שלמעלה (`runId` **וגם** `answers`).

- [ ] **Step 2: הרץ ואמת שהן נופלות**

Run: `npx vitest run app/api/arcade/result/route.test.ts components/ArenaBoard.test.ts`
Expected: FAIL — `parseRunId` לא נמצא במקור; `crypto.randomUUID` לא נמצא; החוזה בלי `runId`.

- [ ] **Step 3: כתוב את הנתיב**

ב-`app/api/arcade/result/route.ts`:

ⓐ מתחת ל-`parseAnswers`, הוסף:

```ts
/**
 * F-092 · ⛔ «מחרוזת כלשהי» ⛔ אינה מפתח. הצורה נבדקת כדי שהאינדקס הייחודי
 * יקבל בדיוק סוג ערך אחד, ולא יתפוצץ ב-`22P02` (invalid input syntax for uuid)
 * שהיה מוחזר ללומד כ-503 במקום כ-422.
 */
const RUN_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function parseRunId(value: unknown): string | null {
  return typeof value === 'string' && RUN_ID_RE.test(value) ? value : null;
}
```

ⓑ מיד אחרי בלוק ה-422 של `answers`, הוסף:

```ts
  const runId = parseRunId(body.runId);
  if (runId === null) {
    return NextResponse.json(
      { ok: false, fieldErrors: { runId: 'הקרב לא נשמר. נסה שוב.' } },
      { status: 422 },
    );
  }

  // F-092 · הגנה ⓐ — המסלול הנפוץ: שידור חוזר אחרי נפילת רשת. התשובה שנשלחה
  // בפעם הראשונה מוחזרת כמות שהיא, ⛔ בלי אף כתיבה ו⛔ בלי חישוב שני.
  const { data: priorRun, error: priorError } = await supabase
    .from('arcade_runs')
    .select('response_snapshot')
    .eq('user_id', user.id)
    .eq('run_id', runId)
    .maybeSingle();
  if (priorError) {
    console.error('[api/arcade/result] prior run read failed:', priorError.message);
    return isSchemaMissing((priorError as { code?: string }).code) ? schemaMissing() : unavailable();
  }
  const priorSnapshot = (priorRun as { response_snapshot?: unknown } | null)?.response_snapshot;
  if (priorSnapshot) return NextResponse.json(priorSnapshot);
```

ⓒ העבר `runId` ל-`planArcadeWrites`:

```ts
  const plan = planArcadeWrites({
    userId: user.id,
    runId,
    answers,
    // … שאר השדות ללא שינוי …
  });
```

ⓓ החלף את לולאת הכתיבה כך שהתנגשות תעצור את **כל** השאר:

```ts
  for (const write of plan.rows) {
    // ⛔ המפתח הראשי של `arcade_collected_words` הוא (user_id, word_id) — upsert על
    // `user_id` לבדו היה דורס את כל אוסף הלומד בשורה אחת.
    const { error } = write.table === 'arcade_progress'
      ? await supabase.from('arcade_progress').upsert(write.values, { onConflict: 'user_id' })
      : write.table === 'arcade_collected_words'
        ? await supabase.from('arcade_collected_words').upsert(write.values, { onConflict: 'user_id,word_id' })
        : await supabase.from('arcade_runs').insert(write.values);
    if (error) {
      // F-092 · הגנה ⓑ — שני שידורים **בו-זמנית**, שבהם הגנה ⓐ קוראת ריק בשניהם.
      // `arcade_runs` היא הכתיבה **הראשונה** (‏`planArcadeWrites`), ולכן התנגשות כאן
      // עוצרת לפני ש-`arcade_progress` ניפח את `wins`. ⛔ `continue` היה מותיר בדיוק
      // את הפגם המקורי.
      if ((error as { code?: string }).code === '23505') {
        const { data: winner } = await supabase
          .from('arcade_runs')
          .select('response_snapshot')
          .eq('user_id', user.id)
          .eq('run_id', runId)
          .maybeSingle();
        const snapshot = (winner as { response_snapshot?: unknown } | null)?.response_snapshot;
        return NextResponse.json(snapshot ?? plan.response);
      }
      console.error(`[api/arcade/result] ${write.table} write failed:`, error.message);
      return isSchemaMissing((error as { code?: string }).code) ? schemaMissing() : unavailable();
    }
  }
```

ⓔ החלף את ה-`return` הסופי — ⛔ אפס בנייה שנייה של הגוף:

```ts
  // ⛔ «המילים שהפילו אותך» חוזר ללקוח ⛔ ואינו נשמר (D-047).
  // F-092 · ⛔ הגוף ⛔ אינו נבנה כאן: הוא **אותו אובייקט** שנשמר ב-`response_snapshot`,
  // ולכן שידור ראשון ושידור חוזר מחזירים בית-בבית את אותו דבר.
  return NextResponse.json(plan.response);
```

- [ ] **Step 4: כתוב את הלקוח**

ב-`components/ArenaBoard.tsx`:

ⓐ הרחב את `ResultPayload`:

```ts
type ResultPayload = {
  /**
   * F-092 · מפתח האידמפוטנטיות. ⛔ **נוצר פעם אחת, ברגע השליחה, ו⛔ לא בתוך `send`** —
   * `send` היא בדיוק הפונקציה שרצה שוב אחרי `online`, ומפתח שנוצר בתוכה היה מפתח
   * חדש בכל שידור, כלומר קרב שני. הוא נישא בתוך `pendingResult`, ⇒ השידור החוזר
   * נושא אותו מעצמו.
   */
  readonly runId: string;
  readonly answers: readonly ArcadeAnswer[];
};
```

ⓑ ב-`useEffect` של הסיום, החלף את השורה `void send({ answers: battle.answers });`:

```ts
    void send({ runId: crypto.randomUUID(), answers: battle.answers });
```

⛔ **אל תיגע** ב-`useEffect` של `online` — הוא כבר משדר `send(pendingResult)`, ו-`pendingResult` נושא את המפתח.
⛔ **אל תיצור את המפתח ב-`useState` initializer** — הוא רץ גם ברינדור השרת, ומפתח שונה בין שרת ללקוח הוא אי-התאמת הידרציה.

- [ ] **Step 5: עדכן את החוזה**

ב-`docs/api-contract.md`, § `POST /api/arcade/result`:

ⓐ אחרי הפסקה שמתחילה ב-`⛔ **גוף התשובה ⛔ לא השתנה ב-T-109:**`, הוסף:

```markdown
⚠️ **F-092 — הנתיב אידמפוטנטי, ולכן `runId` הוא שדה חובה.** הלקוח מייצר `uuid`
**פעם אחת לקרב** ומשדר אותו שוב כמות שהוא בכל ניסיון חוזר (`ArenaBoard` שומר את
הגוף ב-`pendingResult` ומשדר אותו על אירוע `online`). השרת מחזיק את המפתח בעמודה
`arcade_runs.run_id` תחת אינדקס ייחודי, ואת גוף התשובה של השידור הראשון בעמודה
`arcade_runs.response_snapshot`. שידור חוזר מקבל את **אותו** גוף 200 בדיוק,
⛔ בלי אף כתיבה ו⛔ בלי חישוב שני — `unlocked` ו-`leveledUp` נכונים פעם אחת בלבד.

⛔ **`arcade_runs` היא הכתיבה הראשונה מבין השלוש, ⛔ ולא השנייה.** זה ⛔ אינו פרט
מימוש: התנגשות `23505` על המפתח עוצרת את הרצף **לפני** ש-`arcade_progress` ניפח את
`wins`. סדר הפוך היה משאיר את הפגם בשני שידורים בו-זמנית. המיגרציה היא
`0018_arcade_run_id.sql`.
```

ⓑ בבלוק ה-JSON של הבקשה, הוסף את השדה:

```json
{
  "runId": "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
  "answers": [
    { "wordId": "…", "correct": true,  "chosen": "שולחן", "answer": "שולחן" },
    { "wordId": "…", "correct": false, "chosen": "מדף",   "answer": "כיסא" }
  ]
}
```

ⓒ בטבלת שדות הבקשה, הוסף שורה מתחת ל-`answers`:

```markdown
| `runId` | **חובה.** `uuid` בייצוג קנוני. מפתח האידמפוטנטיות של הקרב — ⛔ אינו מזהה השורה ו⛔ אינו מזהה הלומד |
```

ⓓ בבלוק ה-422, החלף את הדוגמה כך שתכסה את שני השדות:

```markdown
**422 — תשובות פגומות או `runId` שאינו uuid, ⛔ ולפני כל כתיבה:**

```json
{ "ok": false, "fieldErrors": { "answers": "הקרב לא נשמר. נסה שוב." } }
{ "ok": false, "fieldErrors": { "runId":   "הקרב לא נשמר. נסה שוב." } }
```
```

- [ ] **Step 6: הרץ את אימות המשימה**

Run: `npx vitest run app/api/arcade/result/route.test.ts components/ArenaBoard.test.ts lib/core/arcadeResult.test.ts lib/supabase/arcadeRunId.test.ts`
Expected: PASS — כל הקבצים ירוקים.

- [ ] **Step 7: הרץ את אימות הלופ המלא**

Run: `npm run typecheck && npm run check:core && npm test && npm run build`
Expected: `tsc` 0 שגיאות · `/lib/core purity: OK` · **כל** הבדיקות עוברות · `next build` יוצא 0.
⛔ ⛔ אל תטען הצלחה בלי הפלט הזה בהודעה שבה אתה טוען אותה.

- [ ] **Step 8: קומיט**

```bash
git add app/api/arcade/result/route.ts app/api/arcade/result/route.test.ts \
        components/ArenaBoard.tsx components/ArenaBoard.test.ts docs/api-contract.md
git commit -m "fix(arcade): idempotent POST /api/arcade/result via runId (F-092 task 3)"
```

---

## בדיקה עצמית — הרץ אותה לפני שאתה מכריז על הרצף כסגור

**1. כיסוי הממצא.** F-092 דורש שלוש שכבות. ⓐ מיגרציה = Task 1 · ⓑ נתיב = Task 3 Step 3 · ⓒ לקוח = Task 3 Step 4. הממצא הוסיף במפורש: «⛔ אל תסתמך על `run_id` בצד לקוח לבדו» ⇒ מכוסה בהגנה ⓑ (‏`23505`), שהיא **שרת** בלבד. ✔

**2. הראיה שהמוטציה נתפסת.** הממצא נקב במוטציה שחייבת ליפול: «`.insert` ⇒ `.upsert({run_id})` בלי בדיקת קיום». תחת התוכנית הזאת המוטציה נופלת על הבדיקה `ⓑ התנגשות ייחודיות עוצרת את שאר הכתיבות` — `upsert` ⛔ אינו מייצר `23505`, ולכן `CODE` לא יכיל אותו. ✔
מוטציה שנייה שחייבת ליפול: החזרת `arcade_progress` לראש `rows` ⇒ נופלת על `plan.rows[0]?.table === 'arcade_runs'` ב-Task 2. ✔
מוטציה שלישית: יצירת `crypto.randomUUID()` **בתוך** `send` ⇒ נופלת על הבדיקה `⛔ המפתח ⛔ אינו נוצר בתוך send`. ✔

**3. עקביות טיפוסים.** `ArcadeResultResponse` מוגדר ב-Task 2 ונצרך ב-Task 3 (‏`plan.response`) — אותו שם, אותם שישה שדות. `runId: string` ב-`planArcadeWrites`, ב-`ResultPayload` ובגוף הבקשה — אותו שם בשלושתם, ⛔ ולא `run_id` בשכבת ה-TS ⛔ ולא `runID`. שם העמודה `run_id` מופיע **רק** ב-SQL וב-`values` של תוכנית הכתיבה. ✔

**4. סריקת מציין-מקום.** ⛔ אין בתוכנית «TODO», «טיפול בשגיאות מתאים», «בדיקות כמו במשימה N» או קטע קוד חסר. כל בלוק בדיקה הוא קוד רץ. ✔

**5. מה התוכנית ⛔ אינה עושה, ולמה.**
- ⛔ **⛔ אינה נוגעת ב-F-081 ⚪** (‏«השרת סופר `correct` שהלקוח שולח»). זהו גבול-אמון מקובל תחת D-050/D-052 — ⛔ אפס ניקוד ואפס נגיעה במנוע החזרות — והממצא עצמו קובע «להקשיח **רק אם** הזירה תקבל אי-פעם תגמול אמיתי». סחיפת היקף לתוך תיקון של 🟠.
- ⛔ **⛔ אינה נוגעת ב-F-070 🟡** (‏`items` בתשובת 200). הממצא הזה מופנה ל-**PM** (הכרעה) ול-**CRITIC** (שינוי החוזה) — ⛔ לא ל-Dev.
- ⚠️ **סיכון מוצהר, ⛔ ולא פער:** לקוח ישן שנשמר במטמון ה-SW ישדר גוף בלי `runId` ויקבל 422. הבחירה מודעת: `runId` רשות היה מותיר מסלול כתיבה **לא-מוגן** פתוח, וזה בדיוק הפגם. ⛔ הנזק חסום — טעינה מחדש מביאה חבילה חדשה — ו⛔ אין כאן איבוד נתונים.
