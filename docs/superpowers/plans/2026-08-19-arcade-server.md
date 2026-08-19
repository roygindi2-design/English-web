# תוכנית מימוש — **הצד השרתי של זירת הקרב**  ·  T-092 → T-093 → T-094

> נכתבה: **2026-08-19T01:4xZ** · C-0178 (DEV, טיק תכנון) · ענף `dev`
> מכסה **שלוש משימות** מתוך שש של § 4.2י. ⛔ T-095/T-096/T-097 (מסכים) ⛔ אינן בתחולה —
> הן חולקות רק את החוזה שהתוכנית הזאת מקבעת, ומסמך אחד לשש היה מסמך שאיש אינו קורא.
> מקורות מחייבים: `plan/40-decisions.md` § 4.2י · **D-044** (בידוד) · **D-045**+R-020 (⛔ אין שעון) ·
> **D-046** (מושבת עם מספר) · **D-047** (המילים שהפילו אותך — תצוגה בלבד) · **D-034** (`words.cefr_profile_band`).

---

## 0 · מה כבר נמדד, ⛔ ולא נוחש  (C-0178)

**כל בלוק קוד בחלקים 1–3 של המסמך הזה נכתב, הורץ ונמחק בטיק התכנון עצמו.** זו דרישת F-039
(«תוכנית שמספקת קוד בדיקה חייבת שהקוד יורץ פעם אחת לפני שהוא נכתב למסמך») ודרישת F-053
(«קוד מילולי בתוכנית שאינו מהדר»). הריצה הטרייה, `/tmp/repo` על `dev` בגרסה `47d3d7f`:

```
npx vitest run lib/supabase/arcade.test.ts lib/core/arcadeRound.test.ts lib/core/arcadeResult.test.ts
  Test Files  3 passed (3)
       Tests  52 passed (52)
npx tsc --noEmit           → exit 0
node scripts/check-core-purity.mjs → /lib/core purity: OK
```

**ושבע מוטציות הורצו על אותו קוד. כולן הרגו בדיקה בשמה:**

| # | המוטציה | הבדיקה שנפלה |
|---|---|---|
| ⓐ | `wins` יורד בהפסד | «⛔ הפסד אינו מוריד דבר» |
| ⓑ | `repetition: 0` נוסף ל-`arcade_progress.values` | «⛔ repetition אינו מפתח באף שורה שהתוכנית כותבת» |
| ⓒ | הסרת התרגום הנכון מסט הדדופליקציה של המסיחים | «מסיח שזהה לתרגום הנכון ⛔ אינו נספר» |
| ⓓ | `offset = 0` (ביטול חלון רמת המשחק) | «רמת משחק גבוהה מושכת מהחלק הרחוק של אותה רמה» |
| ⓔ | `check (arcade_level >= 1)` הועבר לתוך `create table` | «כל אילוץ מוצהר בנפרד ובשם בתוך `do $$`» |
| ⓕ | `word_id uuid references public.word_progress` נוסף ל-`arcade_runs` | **ארבע** בדיקות, כולל «⛔ אפס מפתח זר ל-word_progress» |
| ⓖ | `using (auth.uid() = user_id)` ⇒ `using (true)` במדיניות אחת | «כל מדיניות היא בעלות עצמית» |

**שלושה דברים שהתגלו בהרצה ו⛔ אי-אפשר היה לנחש אותם. המבצע ⛔ אינו צריך לגלות אותם שוב:**

1. **`[out[i], out[j]] = [out[j], out[i]]` ⛔ אינו מהדר בריפו הזה.** `noUncheckedIndexedAccess`
   מטפס `out[i]` ל-`T | undefined`, וההשמה ההדדית נופלת ב-`TS2322` פעמיים. נמדד:
   `lib/core/arcadeRound.ts(69,6): error TS2322`. הנוסח שכן מהדר נמצא בקוד למטה, ו⛔ אין
   לקצר אותו חזרה.
2. **`comment on table … is '…'` ⛔ אינו הערת SQL.** הוא **מחרוזת**, והמלבנה `BODY = SQL.replace(/--[^\n]*$/gm,'')`
   ⛔ אינה מסירה אותו. הנוסח הראשון של הקומנט הכיל את המילה `current_level`, והבדיקה
   «⛔ current_level אינו מופיע באף שורת SQL» **נפלה על הקומנט** — כלומר הבדיקה עובדת,
   והטקסט הוא שהיה צריך להשתנות. ⛔ אין להחליש את הבדיקה כדי «לתקן» את זה.
3. **RLS **כן** מוצהרת ב-0014, ו⛔ זו אינה סתירה ל-T-092.** מה שאסור הוא הצהרה **חוזרת**
   על טבלה קיימת (מדיניות שנייה מ-OR'ד עם הראשונה, F-051). ⛔ `arcade_progress` ו-`arcade_runs`
   ⛔ אינן קיימות, וטבלה חדשה בלי RLS פתוחה לכל משתמש מזוהה. ⇒ מוצהרת **פעם אחת**.

---

## Interfaces

```ts
// lib/core/arcadeRound.ts  —  ⛔ טהור
export const ARCADE_MIN_WORDS = 12;
export const ARCADE_ROUND_SIZE = 8;
export const ARCADE_OPTION_COUNT = 4;

export interface ArcadeCandidate {
  readonly wordId: string;
  readonly headword: string;
  readonly band: CefrBand | null;
  readonly ngslRank: number | null;
  readonly translationHe: string;
  readonly distractorsHe: readonly string[];
}
export interface ArcadeQuestion {
  readonly wordId: string; readonly headword: string;
  readonly answer: string; readonly options: readonly string[];
}
export type ArcadeRound =
  | { readonly ok: true; readonly level: CefrBand; readonly questions: readonly ArcadeQuestion[] }
  | { readonly ok: false; readonly reason: 'level_too_small';
      readonly eligible: number; readonly required: number };

export function isEligible(c: ArcadeCandidate, level: CefrBand): boolean;
export function eligibleCandidates(cs: readonly ArcadeCandidate[], level: CefrBand): ArcadeCandidate[];
export function buildRound(input: {
  readonly level: CefrBand;
  readonly candidates: readonly ArcadeCandidate[];
  readonly seed: number;
  readonly arcadeLevel?: number;
}): ArcadeRound;

// lib/core/arcadeResult.ts  —  ⛔ טהור
export interface ArcadeAnswer {
  readonly wordId: string; readonly correct: boolean;
  readonly chosen: string; readonly answer: string;
}
export interface ArcadeWriteRow {
  readonly table: 'arcade_progress' | 'arcade_runs';
  readonly values: Readonly<Record<string, unknown>>;
}
export interface ArcadeWritePlan {
  readonly rows: readonly ArcadeWriteRow[];
  readonly enemyDefeated: boolean;
  readonly unlocked: string | null;
  readonly missed: readonly { readonly wordId: string;
                              readonly answer: string;
                              readonly chosen: string }[];
}
export const ARCADE_WRITE_TABLES: readonly ['arcade_progress', 'arcade_runs'];
export const ARCADE_MISSED_LIMIT = 5;
export const ARCADE_ITEMS: readonly string[];

export function planArcadeWrites(input: {
  readonly userId: string;
  readonly answers: readonly ArcadeAnswer[];
  readonly before: { readonly arcadeLevel: number; readonly wins: number;
                     readonly unlockedItems: readonly string[] };
  readonly enemyHp: number;
  readonly finishedAt: string;
}): ArcadeWritePlan;
```

**החוזה בין השכבות, ובמשפט אחד:** הנתיב שולף שורות ומוסר אותן; השכבה הטהורה מחליטה ומחזירה
ערך; הנתיב מחיל. ⛔ אין החלטה ב-SQL ו⛔ אין קריאת רשת ב-`/lib/core`.

---

## 1 · T-092 — מיגרציה `0014_arcade.sql`

### 1.1 · `supabase/migrations/0014_arcade.sql`  *(מהודר ומאומת)*

```sql
-- 0014_arcade.sql — שתי הטבלאות של זירת הקרב (T-092 · § 4.2י · D-044).
--
-- מוחל בעורך ה-SQL של Supabase (או `supabase db push`) אחרי 0013. עד שיוחל,
-- `GET /api/arcade/round` ו-`POST /api/arcade/result` עונים 503 מוסבר בעברית
-- ⛔ ולא מסך ריק (§ 4.2י, «הסכמה לא הורצה ⇒ 503 בעברית»).
--
-- ⛔ **הגבול של D-044 נאכף כאן בסכמה, ⛔ ולא רק בקוד:** אין בקובץ הזה ולו מפתח זר
-- אחד ל-`word_progress`, ואין בו ולו טריגר אחד. הזירה ⛔ אינה יכולה לגעת במנוע
-- החזרה המרווחת גם אם קוד עתידי ינסה — אין דרך מהסכמה הזאת לשם.
--
-- אידמפוטנטי: `create table if not exists` לאורך הקובץ, וכל אילוץ מוצהר בנפרד
-- ובשם בתוך `do $$` — `create table … check` מדולג **כולו** כשהטבלה כבר קיימת,
-- ופרויקט שהריץ טיוטה מוקדמת היה נשאר בלי האילוץ בשקט (נמדד C-0032).
--
-- ⚠️ RLS **כן** מוצהרת כאן, ופעם אחת: שתי הטבלאות **חדשות**. האיסור ב-0013 היה על
-- הצהרה **חוזרת** על טבלה קיימת (מדיניות שנייה מ-OR'ד עם הראשונה ולכן יכולה רק
-- להרחיב גישה). טבלה חדשה בלי RLS היא טבלה פתוחה לכל משתמש מזוהה.

begin;

-- ---------------------------------------------------------------------------
-- arcade_progress — שורה אחת ללומד. המצב המתמיד של הזירה, ותו לא.
-- ---------------------------------------------------------------------------
create table if not exists public.arcade_progress (
  user_id        uuid primary key references auth.users (id) on delete cascade,
  arcade_level   int  not null default 1,
  wins           int  not null default 0,
  unlocked_items text[] not null default '{}'::text[],
  avatar_parts   jsonb  not null default '{}'::jsonb,
  updated_at     timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'arcade_progress_level_check') then
    alter table public.arcade_progress
      add constraint arcade_progress_level_check check (arcade_level >= 1);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'arcade_progress_wins_check') then
    alter table public.arcade_progress
      add constraint arcade_progress_wins_check check (wins >= 0);
  end if;
end $$;

comment on table public.arcade_progress is
  'D-044 · § 4.2י: מצב הזירה של לומד אחד. ⛔ אינו נקרא ואינו נכתב על ידי מנוע
   החזרה המרווחת, ⛔ ואינו משנה את הרמה הלימודית שהלומד בחר לעצמו בפרופיל.';

comment on column public.arcade_progress.unlocked_items is
  'D-046 · § 4.2י: הפריטים שנפתחו בניצחונות. מערך טקסט ⛔ ולא טבלה — פריט הוא
   מזהה קבוע מרשימה סגורה בקוד, ⛔ לא ישות עם מחזור חיים.';

-- ---------------------------------------------------------------------------
-- arcade_runs — שורה אחת לקרב. סיכום, ⛔ לא יומן תשובות.
-- ---------------------------------------------------------------------------
create table if not exists public.arcade_runs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  finished_at    timestamptz not null default now(),
  words_seen     int  not null,
  words_correct  int  not null,
  enemy_defeated boolean not null
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'arcade_runs_counts_check') then
    alter table public.arcade_runs
      add constraint arcade_runs_counts_check
      check (words_seen >= 0 and words_correct >= 0 and words_correct <= words_seen);
  end if;
end $$;

comment on table public.arcade_runs is
  '§ 4.2י: סיכום קרב. ⛔ אין כאן word_id ואין תשובה בודדת — «המילים שהפילו אותך»
   (D-047) הוא תצוגה בזיכרון במסך הסיום, ⛔ ואינו נשמר.';

-- הקריאה היחידה: (הלומד הזה, הקרבות שלו לפי זמן).
create index if not exists arcade_runs_user_finished_idx
  on public.arcade_runs (user_id, finished_at desc);

-- ---------------------------------------------------------------------------
-- RLS — בעלות עצמית, פעם אחת, על שתי טבלאות חדשות.
-- ---------------------------------------------------------------------------
alter table public.arcade_progress enable row level security;
alter table public.arcade_runs     enable row level security;

drop policy if exists "arcade_progress_select_own" on public.arcade_progress;
create policy "arcade_progress_select_own" on public.arcade_progress
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "arcade_progress_insert_own" on public.arcade_progress;
create policy "arcade_progress_insert_own" on public.arcade_progress
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "arcade_progress_update_own" on public.arcade_progress;
create policy "arcade_progress_update_own" on public.arcade_progress
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "arcade_runs_select_own" on public.arcade_runs;
create policy "arcade_runs_select_own" on public.arcade_runs
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "arcade_runs_insert_own" on public.arcade_runs;
create policy "arcade_runs_insert_own" on public.arcade_runs
  for insert to authenticated with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- הרשאות מפורשות. Supabase נותנת ALL ל-anon ול-authenticated דרך default
-- privileges, ולכן `grant` לבדו הוא no-op ו-RLS נשאר ההגנה היחידה — ו-RLS ⛔ אינה
-- חוסמת TRUNCATE. revoke קודם, ואז בדיוק הפעלים שהמדיניות למעלה מתירה.
-- ---------------------------------------------------------------------------
revoke all on public.arcade_progress, public.arcade_runs from authenticated, anon;

grant select, insert, update on public.arcade_progress to authenticated;
grant select, insert          on public.arcade_runs     to authenticated;

-- ⛔ arcade_runs אינה מקבלת update: קרב שנגמר נגמר. תיקון של שורה שנכתבה הוא
-- שכתוב היסטוריה, ⛔ ואין לו מקרה שימוש במוצר.
-- ⛔ anon אינו מקבל דבר.

commit;
```

### 1.2 · `lib/supabase/arcade.test.ts`  *(25 בדיקות · הורצו · ירוקות)*

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * שומר על `0014_arcade.sql` (T-092 · § 4.2י · D-044).
 *
 * אותה גישה ואותן מגבלות כמו `learnerLevel.test.ts`: זה מוכיח מה הקובץ **אומר**,
 * ⛔ לא שהוא הורץ. ההרצה היא פעולה של רוי (`03-for-roy` פריט 33).
 *
 * ההערות מולבנות לפני כל טענה — אילוץ שהוער החוצה הוא אילוץ שאינו קיים, והתאמת
 * טקסט גולמי הייתה נשארת ירוקה מעליו, וגם הייתה נכשלת על ההסבר שמצדיק אותו.
 */
const SQL = readFileSync('supabase/migrations/0014_arcade.sql', 'utf8');
const BODY = SQL.replace(/--[^\n]*$/gm, '');

describe('0014_arcade — אידמפוטנטיות וטרנזקציה', () => {
  it('שתי הטבלאות נוצרות עם if not exists', () => {
    expect(BODY).toMatch(/create table if not exists public\.arcade_progress/i);
    expect(BODY).toMatch(/create table if not exists public\.arcade_runs/i);
  });

  it('רצה בטרנזקציה אחת', () => {
    expect(BODY).toMatch(/^\s*begin;/im);
    expect(BODY).toMatch(/commit;\s*$/im);
  });

  it('כל אילוץ מוצהר בנפרד ובשם בתוך do $$ — ⛔ לא בתוך create table (לקח C-0032)', () => {
    const createBlocks = BODY.match(/create table if not exists[\s\S]*?\);/gi) ?? [];
    expect(createBlocks).toHaveLength(2);
    for (const block of createBlocks) expect(block).not.toMatch(/\bcheck\s*\(/i);
    for (const name of [
      'arcade_progress_level_check',
      'arcade_progress_wins_check',
      'arcade_runs_counts_check',
    ]) {
      expect(BODY).toMatch(new RegExp(`conname\\s*=\\s*'${name}'`, 'i'));
      expect(BODY).toMatch(new RegExp(`add constraint ${name}`, 'i'));
    }
  });

  it('האינדקס אידמפוטנטי גם הוא', () => {
    expect(BODY).toMatch(/create index if not exists arcade_runs_user_finished_idx/i);
  });
});

describe('⛔ הבדיקה החשובה בקובץ: D-044 נאכף בסכמה, ⛔ לא בהערה', () => {
  it('⛔ אפס מפתח זר ל-word_progress', () => {
    expect(BODY).not.toMatch(/references\s+public\.word_progress/i);
  });

  it('⛔ אפס אזכור של word_progress בשום שורת SQL', () => {
    expect(BODY).not.toMatch(/\bword_progress\b/i);
  });

  it('⛔ אפס טריגר ואפס פונקציית טריגר', () => {
    expect(BODY).not.toMatch(/create\s+(or replace\s+)?trigger/i);
    expect(BODY).not.toMatch(/\bexecute\s+function\b/i);
  });

  it.each([
    'easiness',
    'interval_days',
    'repetition',
    'next_review_at',
    'self_marked_known',
    'consecutive_correct_recognition',
    'current_level',
  ])('⛔ %s אינו מופיע באף שורת SQL', (column) => {
    expect(BODY).not.toMatch(new RegExp(`\\b${column}\\b`, 'i'));
  });

  it('שני המפתחות הזרים היחידים מצביעים ל-auth.users', () => {
    const refs = BODY.match(/references\s+[a-z_.]+/gi) ?? [];
    expect(refs).toHaveLength(2);
    for (const ref of refs) expect(ref).toMatch(/references\s+auth\.users/i);
  });
});

describe('מה השדות מרשים', () => {
  it('arcade_progress הוא שורה אחת ללומד — user_id הוא המפתח הראשי', () => {
    expect(BODY).toMatch(/user_id\s+uuid primary key references auth\.users/i);
  });

  it('unlocked_items הוא מערך טקסט, avatar_parts הוא jsonb, שניהם not null עם ברירת מחדל ריקה', () => {
    expect(BODY).toMatch(/unlocked_items\s+text\[\] not null default '\{\}'::text\[\]/i);
    expect(BODY).toMatch(/avatar_parts\s+jsonb\s+not null default '\{\}'::jsonb/i);
  });

  it('⛔ אין הפסד שמוריד: אין ולו ברירת מחדל שלילית, והאילוצים חוסמים ירידה מתחת לרצפה', () => {
    expect(BODY).toMatch(/check \(arcade_level >= 1\)/i);
    expect(BODY).toMatch(/check \(wins >= 0\)/i);
  });

  it('ספירות הקרב אינן יכולות לשקר — נכונות ≤ נראות', () => {
    expect(BODY).toMatch(/words_correct <= words_seen/i);
  });

  it('⛔ arcade_runs אינה מחזיקה word_id — «המילים שהפילו אותך» אינו נשמר (D-047)', () => {
    const runsBlock = BODY.slice(BODY.indexOf('create table if not exists public.arcade_runs'));
    expect(runsBlock.slice(0, runsBlock.indexOf(');'))).not.toMatch(/\bword_id\b/i);
  });
});

describe('RLS — מוצהרת פעם אחת על שתי טבלאות חדשות', () => {
  it('RLS מופעלת על שתיהן', () => {
    expect(BODY).toMatch(/alter table public\.arcade_progress enable row level security/i);
    expect(BODY).toMatch(/alter table public\.arcade_runs\s+enable row level security/i);
  });

  it('כל מדיניות היא בעלות עצמית — ⛔ אין ולו אחת בלי auth.uid() = user_id', () => {
    const policies = BODY.match(/create policy[\s\S]*?;/gi) ?? [];
    expect(policies.length).toBeGreaterThanOrEqual(5);
    for (const policy of policies) expect(policy).toMatch(/auth\.uid\(\) = user_id/);
  });

  it('כל create policy מקדימה לו drop policy if exists — הרצה חוזרת ⛔ אינה נופלת', () => {
    const created = (BODY.match(/create policy "([a-z_]+)"/gi) ?? []).map((m) => m.split('"')[1]);
    for (const name of created) {
      expect(BODY).toMatch(new RegExp(`drop policy if exists "${name}"`, 'i'));
    }
  });

  it('⛔ anon אינו מקבל דבר, ו-revoke בא לפני grant (RLS ⛔ אינה חוסמת TRUNCATE)', () => {
    expect(BODY.indexOf('revoke all on public.arcade_progress')).toBeGreaterThan(-1);
    expect(BODY.indexOf('revoke all on public.arcade_progress')).toBeLessThan(BODY.indexOf('grant select'));
    expect(BODY).not.toMatch(/grant[^;]*to[^;]*\banon\b/i);
  });

  it('⛔ arcade_runs אינה מקבלת update — קרב שנגמר נגמר', () => {
    expect(BODY).toMatch(/grant select, insert\s+on public\.arcade_runs/i);
    expect(BODY).not.toMatch(/grant[^;]*update[^;]*arcade_runs/i);
  });
});
```

### 1.3 · צעדים

- [x] כתוב את `supabase/migrations/0014_arcade.sql` מ-1.1 מילה במילה. **2 דק׳**
- [x] כתוב את `lib/supabase/arcade.test.ts` מ-1.2. הרץ `npx vitest run lib/supabase/arcade.test.ts` — צפוי **25 ירוקות**. **3 דק׳**
- [x] הרץ מוטציה ⓕ (הוסף `word_id uuid references public.word_progress (word_id),` ל-`arcade_runs`) ואמת **ארבע** נפילות בשם; שחזר ואמת ב-`git diff` שהקובץ חזר. **3 דק׳**
- [x] הוסף ל-`plan/03-for-roy.md` פריט: «מיגרציה 0014 מוכנה להרצה» — ⛔ **הפריט 33 כבר קיים**, עדכן אותו ⛔ ואל תפתח שני. **2 דק׳**

⚠️ **T-092 מסתיימת כאן.** הרצת המיגרציה בייצור היא פעולה של רוי. ⛔ אל תסמן את המשימה
כחסומה ואל תעצור — T-093 ⛔ אינה תלויה בהרצה (הנתיבים עונים 503 מוסבר עד שתרוץ).

---

## 2 · T-093 — `GET /api/arcade/round`

### 2.1 · `lib/core/arcadeRound.ts`  *(מהודר ומאומת)*

```ts
/**
 * § 4.2י — סיבוב קרב אחד בזירה. טהור: אפס React, DOM, רשת ו-env.
 *
 * ⚠️ זהו **המקום היחיד** שמחליט אילו מילים נלחמות ואילו ארבע אפשרויות מוצגות.
 * `app/api/arcade/round/route.ts` שואל את הדאטהבייס «אילו מילים ומסיחים יש ברמה
 * הזאת» ומעביר אותם לכאן — ⛔ הוא אינו מסנן ואינו מגריל ב-SQL.
 *
 * ⛔ שום דבר כאן אינו קורא, כותב או מפרש SM-2, ו⛔ אין בקובץ `Math.random`:
 * הגרלה שאינה ניתנת לשחזור היא סיבוב שאי-אפשר לכתוב עליו בדיקה. ה-seed מגיע
 * מהנתיב.
 */
import type { CefrBand } from './cefrLevels';

export const ARCADE_MIN_WORDS = 12;
export const ARCADE_ROUND_SIZE = 8;
export const ARCADE_OPTION_COUNT = 4;

export interface ArcadeCandidate {
  readonly wordId: string;
  readonly headword: string;
  readonly band: CefrBand | null;
  readonly ngslRank: number | null;
  readonly translationHe: string;
  readonly distractorsHe: readonly string[];
}

export interface ArcadeQuestion {
  readonly wordId: string;
  readonly headword: string;
  readonly answer: string;
  readonly options: readonly string[];
}

export type ArcadeRound =
  | { readonly ok: true; readonly level: CefrBand; readonly questions: readonly ArcadeQuestion[] }
  | { readonly ok: false; readonly reason: 'level_too_small'; readonly eligible: number; readonly required: number };

function usableDistractors(c: ArcadeCandidate): string[] {
  const seen = new Set<string>([c.translationHe]);
  const out: string[] = [];
  for (const d of c.distractorsHe) {
    const t = d.trim();
    if (t.length === 0 || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

export function isEligible(c: ArcadeCandidate, level: CefrBand): boolean {
  if (c.band !== level) return false;
  if (c.translationHe.trim().length === 0) return false;
  return usableDistractors(c).length >= ARCADE_OPTION_COUNT - 1;
}

export function eligibleCandidates(
  candidates: readonly ArcadeCandidate[],
  level: CefrBand,
): ArcadeCandidate[] {
  return candidates.filter((c) => isEligible(c, level));
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: readonly T[], rnd: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    // ⛔ ⛔ לא destructuring swap: `noUncheckedIndexedAccess` מטפס `out[i]` ל-`T | undefined`
    // וההשמה ההדדית אינה מהדרת (נמדד בהרצת `tsc --noEmit`, C-0178).
    const atI = out[i] as T;
    const atJ = out[j] as T;
    out[i] = atJ;
    out[j] = atI;
  }
  return out;
}

export function buildRound(input: {
  readonly level: CefrBand;
  readonly candidates: readonly ArcadeCandidate[];
  readonly seed: number;
  readonly arcadeLevel?: number;
}): ArcadeRound {
  const pool = eligibleCandidates(input.candidates, input.level);
  if (pool.length < ARCADE_MIN_WORDS) {
    return { ok: false, reason: 'level_too_small', eligible: pool.length, required: ARCADE_MIN_WORDS };
  }
  const byRank = pool
    .slice()
    .sort((a, b) => (a.ngslRank ?? Number.MAX_SAFE_INTEGER) - (b.ngslRank ?? Number.MAX_SAFE_INTEGER) || a.wordId.localeCompare(b.wordId));
  const depth = Math.max(0, (input.arcadeLevel ?? 1) - 1);
  const offset = Math.min(depth * ARCADE_ROUND_SIZE, Math.max(0, byRank.length - ARCADE_ROUND_SIZE));
  const window = byRank.slice(offset, offset + Math.max(ARCADE_ROUND_SIZE, ARCADE_MIN_WORDS));
  const rnd = mulberry32(input.seed);
  const picked = shuffle(window, rnd).slice(0, ARCADE_ROUND_SIZE);
  const questions = picked.map((c) => {
    const wrong = shuffle(usableDistractors(c), rnd).slice(0, ARCADE_OPTION_COUNT - 1);
    return {
      wordId: c.wordId,
      headword: c.headword,
      answer: c.translationHe,
      options: shuffle([c.translationHe, ...wrong], rnd),
    };
  });
  return { ok: true, level: input.level, questions };
}
```

### 2.2 · `lib/core/arcadeRound.test.ts`  *(13 בדיקות · הורצו · ירוקות)*

```ts
import { describe, expect, it } from 'vitest';
import {
  ARCADE_MIN_WORDS,
  ARCADE_OPTION_COUNT,
  ARCADE_ROUND_SIZE,
  buildRound,
  eligibleCandidates,
  type ArcadeCandidate,
} from './arcadeRound';
import type { CefrBand } from './cefrLevels';

function candidate(i: number, over: Partial<ArcadeCandidate> = {}): ArcadeCandidate {
  return {
    wordId: `w-${String(i).padStart(2, '0')}`,
    headword: `word${i}`,
    band: 'A2' as CefrBand,
    ngslRank: 100 + i,
    translationHe: `תרגום-${i}`,
    distractorsHe: [`מסיח-${i}-א`, `מסיח-${i}-ב`, `מסיח-${i}-ג`],
    ...over,
  };
}

const POOL = Array.from({ length: 20 }, (_, i) => candidate(i));

describe('כשירות — ⛔ מילה בלי ארבעה מסיחים כשירים מדולגת בשקט', () => {
  it('שלושה מסיחים ייחודיים הם המינימום; שניים ⇒ מדולגת', () => {
    const thin = candidate(99, { distractorsHe: ['מסיח-א', 'מסיח-ב'] });
    expect(eligibleCandidates([thin, ...POOL], 'A2')).toHaveLength(POOL.length);
  });

  it('מסיח שזהה לתרגום הנכון ⛔ אינו נספר — ארבע אפשרויות עם כפילות אינן ארבע', () => {
    const dup = candidate(98, { distractorsHe: ['תרגום-98', 'מסיח-א', 'מסיח-ב'] });
    expect(eligibleCandidates([dup], 'A2')).toHaveLength(0);
  });

  it('שני מסיחים זהים זה לזה נספרים כאחד', () => {
    const dup = candidate(97, { distractorsHe: ['מסיח-א', 'מסיח-א', 'מסיח-ב'] });
    expect(eligibleCandidates([dup], 'A2')).toHaveLength(0);
  });

  it('⛔ רמה אחרת אינה נכנסת — לומד ב-A2 ⛔ לעולם אינו נלחם על מילת C1', () => {
    const other = candidate(96, { band: 'C1' as CefrBand });
    expect(eligibleCandidates([other, ...POOL], 'A2').map((c) => c.wordId)).not.toContain('w-96');
  });

  it('band ריק ⛔ אינו נחשב שייך לרמה', () => {
    expect(eligibleCandidates([candidate(95, { band: null })], 'A2')).toHaveLength(0);
  });
});

describe('רמה קטנה מדי — מספר, ⛔ לא מסך ריק', () => {
  it(`פחות מ-${ARCADE_MIN_WORDS} כשירות ⇒ level_too_small עם הספירה האמיתית`, () => {
    const small = POOL.slice(0, 8);
    const round = buildRound({ level: 'A2', candidates: small, seed: 1 });
    expect(round).toEqual({ ok: false, reason: 'level_too_small', eligible: 8, required: ARCADE_MIN_WORDS });
  });

  it('הספירה סופרת כשירות ⛔ ולא שורות — 20 שורות שרק 8 מהן כשירות הן 8', () => {
    const mixed = [
      ...POOL.slice(0, 8),
      ...Array.from({ length: 12 }, (_, i) => candidate(50 + i, { distractorsHe: ['רק-אחד'] })),
    ];
    const round = buildRound({ level: 'A2', candidates: mixed, seed: 1 });
    expect(round).toMatchObject({ ok: false, eligible: 8 });
  });
});

describe('הסיבוב עצמו', () => {
  const round = buildRound({ level: 'A2', candidates: POOL, seed: 7 });

  it(`${ARCADE_ROUND_SIZE} שאלות`, () => {
    expect(round.ok && round.questions).toHaveLength(ARCADE_ROUND_SIZE);
  });

  it(`כל שאלה ${ARCADE_OPTION_COUNT} אפשרויות, ⛔ בלי כפילות, והנכונה ביניהן`, () => {
    expect(round.ok).toBe(true);
    if (!round.ok) return;
    for (const q of round.questions) {
      expect(q.options).toHaveLength(ARCADE_OPTION_COUNT);
      expect(new Set(q.options).size).toBe(ARCADE_OPTION_COUNT);
      expect(q.options).toContain(q.answer);
    }
  });

  it('⛔ אותה מילה אינה חוזרת בסיבוב אחד', () => {
    expect(round.ok).toBe(true);
    if (!round.ok) return;
    expect(new Set(round.questions.map((q) => q.wordId)).size).toBe(round.questions.length);
  });

  it('אותו seed ⇒ אותו סיבוב בדיוק — הפונקציה טהורה ו⛔ אינה מגרילה בעצמה', () => {
    const again = buildRound({ level: 'A2', candidates: POOL, seed: 7 });
    expect(JSON.stringify(again)).toBe(JSON.stringify(round));
  });

  it('seed אחר ⇒ סידור אחר', () => {
    const other = buildRound({ level: 'A2', candidates: POOL, seed: 8 });
    expect(JSON.stringify(other)).not.toBe(JSON.stringify(round));
  });

  it('רמת משחק גבוהה מושכת מהחלק הרחוק של אותה רמה — ⛔ ולא מרמה אחרת', () => {
    const deep = buildRound({ level: 'A2', candidates: POOL, seed: 7, arcadeLevel: 3 });
    expect(deep.ok).toBe(true);
    if (!deep.ok || !round.ok) return;
    const deepRanks = deep.questions.map((q) => Number(q.wordId.slice(2)));
    expect(Math.max(...deepRanks)).toBeGreaterThan(Math.max(...round.questions.map((q) => Number(q.wordId.slice(2)))));
    // ⛔ ועדיין A2 בלבד: כל מזהה מגיע מהמאגר שסונן לרמה
    expect(deep.questions.every((q) => POOL.some((c) => c.wordId === q.wordId))).toBe(true);
  });
});
```

### 2.3 · `app/api/arcade/round/route.ts`

⚠️ **הנתיב הזה ⛔ לא הורץ בטיק התכנון** — הוא דורש `next/headers` ו-session חי. מה שכן נמדד:
הוא **העתק מבני של `app/api/levels/summary/route.ts`**, שירוק היום, ושלושת הבלוקים המשותפים
(`isSchemaMissing` · `schemaMissing()` · `unavailable()`) מועתקים ממנו בית-בבית. ⛔ אל תמציא
קודי שגיאה חדשים.

```ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { buildRound, type ArcadeCandidate } from '@/lib/core/arcadeRound';
import { parseLevel } from '@/lib/core/levelSummary';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/** תקרה על שורות המילים שנקראות. A1 היא 315 מילים היום; התקרה היא ביטוח, ⛔ לא ציפייה. */
const MAX_LEVEL_ROWS = 1000;

/**
 * ⛔ הסינון הוא `words.cefr_profile_band` ולעולם לא `senses.cefr_level` — השתיים חלוקות
 * על 125 מתוך 343 שורות (D-034). ⛔ `!inner` על שתי הרמות: מילה בלי משמעות ומשמעות בלי
 * מסיחים אינן פריט קרב, ו-outer join היה מכניס אותן ואז מדלג עליהן בשקט בשכבה הטהורה.
 */
const ROUND_SELECT =
  'id, headword, cefr_profile_band, ngsl_rank, ' +
  'senses!inner(translation_he, translation_confidence, sense_distractors!inner(distractor))';

function isSchemaMissing(code: string | undefined): boolean {
  return code === '42P01' || code === 'PGRST205' || code === '42703' || code === 'PGRST204';
}
function schemaMissing() {
  return NextResponse.json(
    { ok: false, code: 'schema_missing', message: 'המאגר עדיין לא הוקם' },
    { status: 503 },
  );
}
function unavailable() {
  return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
}

/** GET /api/arcade/round — see docs/api-contract.md */
export async function GET() {
  const env = readSupabaseEnv();
  if (!env) return unavailable();

  const supabase = createRouteClient(env, await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('current_level')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError) {
    console.error('[api/arcade/round] profile read failed:', profileError.message);
    return isSchemaMissing((profileError as { code?: string }).code) ? schemaMissing() : unavailable();
  }

  // ⛔ אין נפילה שקטה ל-A1. «טרם בחר» הוא מצב אמיתי (D-037), והמסך שולח למפת הרמה.
  const level = parseLevel((profile as { current_level?: unknown } | null)?.current_level);
  if (level === null) return NextResponse.json({ ok: true, level: null, round: null });

  // ⛔ **קריאה בלבד.** אין בקובץ הזה `.update(`, `.insert(`, `.upsert(` — נאכף בבדיקה.
  const { data: progressRow, error: progressError } = await supabase
    .from('arcade_progress')
    .select('arcade_level')
    .eq('user_id', user.id)
    .maybeSingle();
  if (progressError) {
    console.error('[api/arcade/round] arcade progress read failed:', progressError.message);
    return isSchemaMissing((progressError as { code?: string }).code) ? schemaMissing() : unavailable();
  }

  const { data, error } = await supabase
    .from('words')
    .select(ROUND_SELECT)
    .eq('cefr_profile_band', level)
    .order('ngsl_rank', { nullsFirst: false })
    .order('id')
    .limit(MAX_LEVEL_ROWS);
  if (error) {
    console.error('[api/arcade/round] level read failed:', error.message);
    return isSchemaMissing((error as { code?: string }).code) ? schemaMissing() : unavailable();
  }

  const candidates: ArcadeCandidate[] = (data ?? []).map((row) => {
    const r = row as unknown as {
      id: string; headword: string | null;
      cefr_profile_band: string | null; ngsl_rank: number | null;
      senses: { translation_he: string | null; translation_confidence: string | null;
                sense_distractors: { distractor: string | null }[] | null }[] | null;
    };
    // ⛔ D-013: תרגום בביטחון נמוך לעולם אינו מוצג ללומד. המשמעות הראשונה שאינה low.
    const sense = (r.senses ?? []).find((s) => s.translation_confidence !== 'low');
    return {
      wordId: r.id,
      headword: r.headword ?? '',
      band: parseLevel(r.cefr_profile_band),
      ngslRank: r.ngsl_rank,
      translationHe: sense?.translation_he ?? '',
      distractorsHe: (sense?.sense_distractors ?? [])
        .map((d) => d.distractor ?? '')
        .filter((d) => d.length > 0),
    };
  });

  // ⛔ הנתיב אינו מסנן ואינו מגריל: הוא מוסר מועמדים ומקבל סיבוב. ⛔ ואין כאן `Math.random`
  // — ה-seed נגזר מהשעה, כך שהסיבוב ניתן לשחזור מהתשובה עצמה.
  const seed = Date.now() >>> 0;
  const round = buildRound({
    level,
    candidates,
    seed,
    arcadeLevel: (progressRow as { arcade_level?: number } | null)?.arcade_level ?? 1,
  });

  if (!round.ok) {
    // ⛔ לא מסך ריק ו⛔ לא בשקט: מספר (D-046 · § 4.2י «נדרשות 12 מילים ברמה, יש 8»).
    return NextResponse.json({
      ok: true, level, round: null,
      reason: round.reason, eligible: round.eligible, required: round.required,
    });
  }
  return NextResponse.json({ ok: true, level, seed, round: { questions: round.questions } });
}
```

### 2.4 · `app/api/arcade/round/route.test.ts`

⚠️ בדיקות מקור, כמו כל נתיבי ה-API בריפו. ⚠️ **F-039:** כל אסרציה כאן היא איתור-אתר-קריאה
(חותכים את הקטע ואז בודקים בתוכו), ⛔ ולא חיפוש מחרוזת בקובץ כולו — מחרוזת שמופיעה בהערה
הייתה מרצה את הבדיקה בלי שהקוד עושה דבר.

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}
const CODE = withoutComments(readFileSync('app/api/arcade/round/route.ts', 'utf8'));
const CONTRACT = readFileSync('docs/api-contract.md', 'utf8');

describe('⛔ קריאה בלבד — D-044 בשכבת הנתיב', () => {
  it.each(['.update(', '.insert(', '.upsert(', '.delete('])('⛔ %s אינו מופיע בקובץ', (verb) => {
    expect(CODE).not.toContain(verb);
  });

  it('⛔ word_progress אינו נקרא ואינו נכתב', () => {
    expect(CODE).not.toContain('word_progress');
  });

  it('הטבלאות שהקובץ נוגע בהן הן בדיוק שלוש, וכולן קריאה', () => {
    const tables = [...CODE.matchAll(/\.from\('([a-z_]+)'\)/g)].map((m) => m[1]);
    expect([...new Set(tables)].sort()).toEqual(['arcade_progress', 'profiles', 'words']);
  });
});

describe('בחירת המילים (D-034 · § 4.2י)', () => {
  const selectBlock = CODE.slice(CODE.indexOf('ROUND_SELECT'), CODE.indexOf('function isSchemaMissing'));

  it('הסינון הוא cefr_profile_band ⛔ ולעולם לא senses.cefr_level', () => {
    expect(CODE).toContain(".eq('cefr_profile_band', level)");
    expect(CODE).not.toContain('cefr_level');
  });

  it('המסיחים נשלפים מהטבלה ⛔ ואינם מיוצרים בזמן אמת', () => {
    expect(selectBlock).toContain('sense_distractors');
    expect(CODE).not.toMatch(/generateDistractor|makeDistractor/i);
  });

  it('!inner על שני הצמתים — מילה בלי משמעות או בלי מסיח ⛔ אינה פריט קרב', () => {
    expect(selectBlock).toContain('senses!inner');
    expect(selectBlock).toContain('sense_distractors!inner');
  });

  it('order בא לפני limit — תקרה על סדר לא מוגדר חותכת אוכלוסייה אקראית (לקח F-034)', () => {
    expect(CODE.indexOf(".order('ngsl_rank'")).toBeLessThan(CODE.indexOf('.limit('));
  });
});

describe('⛔ אין שעון (D-045 · R-020) — נמדד בסריקת מקור', () => {
  it.each(['setTimeout', 'setInterval', 'deadline', 'countdown'])('⛔ %s אינו מופיע', (token) => {
    expect(CODE).not.toContain(token);
  });
});

describe('הנתיב אינו מחליט — ההחלטה בשכבה הטהורה', () => {
  it('קורא ל-buildRound ⛔ ואינו סופר או מסנן בעצמו', () => {
    expect(CODE).toContain('buildRound(');
    expect(CODE).not.toMatch(/\.filter\([^)]*band/);
  });

  it('רמה קטנה מדי ⇒ 200 עם המספר, ⛔ לא 404 ו⛔ לא מסך ריק (D-046)', () => {
    const branch = CODE.slice(CODE.indexOf('if (!round.ok)'), CODE.indexOf('return NextResponse.json({ ok: true, level, seed'));
    expect(branch).toContain('eligible');
    expect(branch).toContain('required');
    expect(branch).not.toContain('404');
  });

  it('current_level ריק ⇒ round: null ⛔ ולא נפילה שקטה ל-A1', () => {
    expect(CODE).toContain('parseLevel(');
    expect(CODE).not.toMatch(/\?\?\s*'A1'/);
  });
});

describe('החוזה מתעדכן באותו קומיט', () => {
  it('docs/api-contract.md מתעד את הנתיב', () => {
    expect(CONTRACT).toContain('GET /api/arcade/round');
  });
});
```

### 2.5 · צעדים

- [ ] כתוב את `lib/core/arcadeRound.ts` מ-2.1. הרץ `node scripts/check-core-purity.mjs` — צפוי `OK`. **4 דק׳**
- [ ] כתוב את `lib/core/arcadeRound.test.ts` מ-2.2. הרץ — צפוי **13 ירוקות**. **3 דק׳**
- [ ] הרץ מוטציה ⓒ (`const seen = new Set<string>();` בלי `c.translationHe`) ואמת נפילה בשם; שחזר. **2 דק׳**
- [ ] הרץ מוטציה ⓓ (`const offset = 0;`) ואמת נפילה בשם; שחזר ואמת ב-`git diff`. **2 דק׳**
- [ ] `mkdir -p app/api/arcade/round` וכתוב את `route.ts` מ-2.3. **5 דק׳**
- [ ] כתוב את `route.test.ts` מ-2.4. **4 דק׳**
- [ ] הוסף ל-`docs/api-contract.md` את `GET /api/arcade/round` — **באותו קומיט**, ⛔ לא אחריו. **4 דק׳**
- [ ] `npm run typecheck && npm run check:core && npm test` — הכל ירוק לפני שממשיכים. **3 דק׳**

⚠️ **הצעד שקל לדלג עליו ו⛔ אסור:** `docs/api-contract.md` חייב לתעד גם את **תשובת הרמה
הקטנה** (`round: null` + `eligible` + `required`), ⛔ ולא רק את המסלול המוצלח. המסך של T-097
נשען עליה כדי להציג «נדרשות 12 מילים ברמה, יש 8».

---

## 3 · T-094 — `POST /api/arcade/result`

### 3.1 · `lib/core/arcadeResult.ts`  *(מהודר ומאומת)*

```ts
/**
 * § 4.2י · D-044 — מה קרב שנגמר משנה, ו**מה הוא ⛔ אינו רשאי לגעת בו**. טהור.
 *
 * ⚠️ הפונקציה מחזירה **תוכנית כתיבה** ⛔ ואינה כותבת. זו הצורה שהופכת את הגבול של
 * D-044 מהערה לבדיקה שנכשלת: אפשר להחיל את התוכנית על מחסן מדומה ולמדוד ש-
 * `word_progress` זהה בית-בבית לפני ואחרי. פונקציה שקוראת ל-supabase בעצמה אינה
 * ניתנת למדידה הזאת, וזה בדיוק מה שמדד ההצלחה ⓐ דורש.
 *
 * ⛔ הפסד אינו מוריד דבר (הכרעת רוי) · ⛔ אין ניקוד, אין מטבע ואין XP (D-050:
 * ניקוד g=0.340 מול בלי ניקוד g=0.840, p=0.013) · ⛔ «המילים שהפילו אותך» הוא
 * ערך מוחזר לתצוגה ⛔ ואינו שורה שנכתבת (D-047).
 */
export interface ArcadeAnswer {
  readonly wordId: string;
  readonly correct: boolean;
  readonly chosen: string;
  readonly answer: string;
}

export interface ArcadeWriteRow {
  readonly table: 'arcade_progress' | 'arcade_runs';
  readonly values: Readonly<Record<string, unknown>>;
}

export interface ArcadeWritePlan {
  readonly rows: readonly ArcadeWriteRow[];
  readonly enemyDefeated: boolean;
  readonly unlocked: string | null;
  readonly missed: readonly { readonly wordId: string; readonly answer: string; readonly chosen: string }[];
}

export const ARCADE_WRITE_TABLES = Object.freeze(['arcade_progress', 'arcade_runs'] as const);
export const ARCADE_MISSED_LIMIT = 5;
export const ARCADE_ITEMS = Object.freeze(['helmet', 'cape', 'lantern', 'boots', 'banner'] as const);

export function planArcadeWrites(input: {
  readonly userId: string;
  readonly answers: readonly ArcadeAnswer[];
  readonly before: { readonly arcadeLevel: number; readonly wins: number; readonly unlockedItems: readonly string[] };
  readonly enemyHp: number;
  readonly finishedAt: string;
}): ArcadeWritePlan {
  const correct = input.answers.filter((a) => a.correct).length;
  const enemyDefeated = correct >= input.enemyHp;
  const wins = input.before.wins + (enemyDefeated ? 1 : 0);
  const arcadeLevel = enemyDefeated ? input.before.arcadeLevel + 1 : input.before.arcadeLevel;
  const held = new Set(input.before.unlockedItems);
  const next = enemyDefeated ? ARCADE_ITEMS.find((i) => !held.has(i)) ?? null : null;
  const unlockedItems = next ? [...input.before.unlockedItems, next] : [...input.before.unlockedItems];

  const missed = input.answers
    .filter((a) => !a.correct)
    .slice(0, ARCADE_MISSED_LIMIT)
    .map((a) => ({ wordId: a.wordId, answer: a.answer, chosen: a.chosen }));

  return {
    rows: [
      {
        table: 'arcade_progress',
        values: {
          user_id: input.userId,
          arcade_level: arcadeLevel,
          wins,
          unlocked_items: unlockedItems,
          updated_at: input.finishedAt,
        },
      },
      {
        table: 'arcade_runs',
        values: {
          user_id: input.userId,
          finished_at: input.finishedAt,
          words_seen: input.answers.length,
          words_correct: correct,
          enemy_defeated: enemyDefeated,
        },
      },
    ],
    enemyDefeated,
    unlocked: next,
    missed,
  };
}
```

### 3.2 · `lib/core/arcadeResult.test.ts`  ·  ⛔ **מדד ההצלחה ⓐ של § 4.2י חי כאן**  *(14 בדיקות · הורצו · ירוקות)*

```ts
import { describe, expect, it } from 'vitest';
import {
  ARCADE_MISSED_LIMIT,
  ARCADE_WRITE_TABLES,
  planArcadeWrites,
  type ArcadeAnswer,
  type ArcadeWritePlan,
} from './arcadeResult';

const FINISHED_AT = '2026-08-19T01:00:00.000Z';
const BEFORE = { arcadeLevel: 1, wins: 0, unlockedItems: [] as string[] };

function answers(pattern: readonly boolean[]): ArcadeAnswer[] {
  return pattern.map((correct, i) => ({
    wordId: `w-${i}`,
    correct,
    chosen: correct ? `נכון-${i}` : `מסיח-${i}`,
    answer: `נכון-${i}`,
  }));
}

/** מחסן מדומה. ⛔ הוא ⛔ אינו יודע להחיל שום טבלה שאינה של הזירה. */
function makeStore() {
  return {
    word_progress: [
      {
        user_id: 'u-1',
        word_id: 'w-0',
        attempts: 3,
        repetition: 2,
        easiness: 2.5,
        interval_days: 6,
        next_review_at: '2026-08-25T00:00:00.000Z',
        self_marked_known: false,
        consecutive_correct_recognition: 1,
      },
    ],
    profiles: [{ id: 'u-1', current_level: 'A2', updated_at: '2026-08-18T00:00:00.000Z' }],
    arcade_progress: [] as Record<string, unknown>[],
    arcade_runs: [] as Record<string, unknown>[],
  };
}

function applyPlan(store: ReturnType<typeof makeStore>, plan: ArcadeWritePlan): void {
  for (const row of plan.rows) {
    if (row.table !== 'arcade_progress' && row.table !== 'arcade_runs') {
      throw new Error(`arcadeResult tried to write outside the arcade: ${row.table}`);
    }
    store[row.table].push({ ...row.values });
  }
}

describe('⛔ מדד ההצלחה ⓐ של § 4.2י — הבידוד של D-044 הוא בדיקה שנכשלת, ⛔ לא הערה', () => {
  it('קרב מלא (נכונות ושגיאות) ⇒ word_progress זהה בית-בבית לפני ואחרי', () => {
    const store = makeStore();
    const before = JSON.stringify(store.word_progress);
    const plan = planArcadeWrites({
      userId: 'u-1',
      answers: answers([true, false, true, true, false, true, true, true]),
      before: BEFORE,
      enemyHp: 5,
      finishedAt: FINISHED_AT,
    });
    applyPlan(store, plan);
    expect(JSON.stringify(store.word_progress)).toBe(before);
  });

  it('ואותו קרב ⇒ profiles.current_level זהה בית-בבית', () => {
    const store = makeStore();
    const before = JSON.stringify(store.profiles);
    applyPlan(
      store,
      planArcadeWrites({
        userId: 'u-1',
        answers: answers([false, false, false, false, false, false, false, false]),
        before: BEFORE,
        enemyHp: 5,
        finishedAt: FINISHED_AT,
      }),
    );
    expect(JSON.stringify(store.profiles)).toBe(before);
  });

  it('התוכנית נוגעת בשתי טבלאות הזירה בלבד', () => {
    const plan = planArcadeWrites({
      userId: 'u-1',
      answers: answers([true, true, true, true, true, true, true, true]),
      before: BEFORE,
      enemyHp: 5,
      finishedAt: FINISHED_AT,
    });
    expect([...new Set(plan.rows.map((r) => r.table))].sort()).toEqual([...ARCADE_WRITE_TABLES].sort());
  });

  it.each([
    'easiness',
    'interval_days',
    'repetition',
    'next_review_at',
    'self_marked_known',
    'consecutive_correct_recognition',
    'current_level',
  ])('⛔ %s אינו מפתח באף שורה שהתוכנית כותבת', (column) => {
    const plan = planArcadeWrites({
      userId: 'u-1',
      answers: answers([true, false, true, false, true, true, true, true]),
      before: BEFORE,
      enemyHp: 5,
      finishedAt: FINISHED_AT,
    });
    const keys = plan.rows.flatMap((r) => Object.keys(r.values));
    expect(keys).not.toContain(column);
  });
});

describe('מה הקרב כן משנה', () => {
  it('ניצחון מעלה רמת משחק, מוסיף ניצחון ופותח פריט אחד', () => {
    const plan = planArcadeWrites({
      userId: 'u-1',
      answers: answers([true, true, true, true, true, true, true, true]),
      before: BEFORE,
      enemyHp: 5,
      finishedAt: FINISHED_AT,
    });
    const progress = plan.rows.find((r) => r.table === 'arcade_progress')!.values;
    expect(plan.enemyDefeated).toBe(true);
    expect(progress.arcade_level).toBe(2);
    expect(progress.wins).toBe(1);
    expect(plan.unlocked).not.toBeNull();
    expect(progress.unlocked_items).toEqual([plan.unlocked]);
  });

  it('⛔ הפסד אינו מוריד דבר — רמת משחק, ניצחונות ופריטים נשארים כמו שהיו', () => {
    const before = { arcadeLevel: 4, wins: 3, unlockedItems: ['helmet', 'cape'] };
    const plan = planArcadeWrites({
      userId: 'u-1',
      answers: answers([false, false, true, false, false, false, false, false]),
      before,
      enemyHp: 5,
      finishedAt: FINISHED_AT,
    });
    const progress = plan.rows.find((r) => r.table === 'arcade_progress')!.values;
    expect(plan.enemyDefeated).toBe(false);
    expect(progress.arcade_level).toBe(4);
    expect(progress.wins).toBe(3);
    expect(progress.unlocked_items).toEqual(['helmet', 'cape']);
  });
});

describe('«המילים שהפילו אותך» (D-047) — תצוגה בלבד', () => {
  it('עד חמש מילים, ורק השגויות, עם המסיח שפיתה', () => {
    const plan = planArcadeWrites({
      userId: 'u-1',
      answers: answers([false, false, false, false, false, false, true]),
      before: BEFORE,
      enemyHp: 5,
      finishedAt: FINISHED_AT,
    });
    expect(plan.missed).toHaveLength(ARCADE_MISSED_LIMIT);
    expect(plan.missed[0]).toEqual({ wordId: 'w-0', answer: 'נכון-0', chosen: 'מסיח-0' });
    expect(plan.missed.map((m) => m.wordId)).not.toContain('w-6');
  });

  it('⛔ הרשימה אינה שורה שנכתבת — היא אינה מופיעה באף `values`', () => {
    const plan = planArcadeWrites({
      userId: 'u-1',
      answers: answers([false, true, true, true, true, true, true, true]),
      before: BEFORE,
      enemyHp: 5,
      finishedAt: FINISHED_AT,
    });
    const keys = plan.rows.flatMap((r) => Object.keys(r.values));
    expect(keys).not.toContain('missed');
    expect(keys).not.toContain('missed_words');
  });
});
```

### 3.3 · `app/api/arcade/result/route.ts`

⚠️ **גם הוא ⛔ לא הורץ בטיק התכנון.** מבנה זהה ל-`app/api/levels/current/route.ts` (הגנת גוף
הבקשה של F-004 · `getUser` לפני ולידציה · 422 עם `fieldErrors`), ובנוסף **החלת תוכנית הכתיבה**.

```ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { planArcadeWrites, type ArcadeAnswer } from '@/lib/core/arcadeResult';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

const MAX_ANSWERS = 64;

function isSchemaMissing(code: string | undefined): boolean {
  return code === '42P01' || code === 'PGRST205' || code === '42703' || code === 'PGRST204';
}
function schemaMissing() {
  return NextResponse.json(
    { ok: false, code: 'schema_missing', message: 'המאגר עדיין לא הוקם' },
    { status: 503 },
  );
}
function unavailable() {
  return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
}

/** ⛔ ולידציה מלאה ⛔ ולא cast: הגוף מגיע מהלקוח, ותשובה מזויפת ⛔ אינה רשאית להפיל 500. */
function parseAnswers(value: unknown): ArcadeAnswer[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_ANSWERS) return null;
  const out: ArcadeAnswer[] = [];
  for (const item of value) {
    if (typeof item !== 'object' || item === null) return null;
    const a = item as Record<string, unknown>;
    if (typeof a.wordId !== 'string' || a.wordId.length === 0) return null;
    if (typeof a.correct !== 'boolean') return null;
    if (typeof a.chosen !== 'string' || typeof a.answer !== 'string') return null;
    out.push({ wordId: a.wordId, correct: a.correct, chosen: a.chosen, answer: a.answer });
  }
  return out;
}

/** POST /api/arcade/result — see docs/api-contract.md */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 400 });
  }
  // F-004: null, מערך ופרימיטיב כולם עוברים JSON.parse ומפילים את קריאת המאפיין ב-500.
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 400 });
  }
  const body = payload as Record<string, unknown>;

  const env = readSupabaseEnv();
  if (!env) return unavailable();

  const supabase = createRouteClient(env, await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  // ולידציה אחרי בדיקת ה-session (דפוס C-0032).
  const answers = parseAnswers(body.answers);
  const enemyHp = typeof body.enemyHp === 'number' && Number.isInteger(body.enemyHp) && body.enemyHp > 0
    ? body.enemyHp
    : null;
  if (answers === null || enemyHp === null) {
    return NextResponse.json(
      { ok: false, fieldErrors: { answers: 'הקרב לא נשמר. נסה שוב.' } },
      { status: 422 },
    );
  }

  const { data: current, error: readError } = await supabase
    .from('arcade_progress')
    .select('arcade_level, wins, unlocked_items')
    .eq('user_id', user.id)
    .maybeSingle();
  if (readError) {
    console.error('[api/arcade/result] progress read failed:', readError.message);
    return isSchemaMissing((readError as { code?: string }).code) ? schemaMissing() : unavailable();
  }
  const row = current as { arcade_level?: number; wins?: number; unlocked_items?: string[] } | null;

  // ⛔ הנתיב אינו מחשב: הוא מקבל תוכנית כתיבה ומחיל אותה. D-044 חי בשכבה הטהורה,
  // ו-`ArcadeWriteRow['table']` הוא הטיפוס שאינו מרשה שם טבלה שלישי.
  const plan = planArcadeWrites({
    userId: user.id,
    answers,
    before: {
      arcadeLevel: row?.arcade_level ?? 1,
      wins: row?.wins ?? 0,
      unlockedItems: row?.unlocked_items ?? [],
    },
    enemyHp,
    finishedAt: new Date().toISOString(),
  });

  for (const write of plan.rows) {
    const { error } = write.table === 'arcade_progress'
      ? await supabase.from('arcade_progress').upsert(write.values, { onConflict: 'user_id' })
      : await supabase.from('arcade_runs').insert(write.values);
    if (error) {
      console.error(`[api/arcade/result] ${write.table} write failed:`, error.message);
      return isSchemaMissing((error as { code?: string }).code) ? schemaMissing() : unavailable();
    }
  }

  // ⛔ «המילים שהפילו אותך» חוזר ללקוח ⛔ ואינו נשמר (D-047).
  return NextResponse.json({
    ok: true,
    enemyDefeated: plan.enemyDefeated,
    unlocked: plan.unlocked,
    missed: plan.missed,
  });
}
```

### 3.4 · `app/api/arcade/result/route.test.ts`

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}
const CODE = withoutComments(readFileSync('app/api/arcade/result/route.ts', 'utf8'));
const CONTRACT = readFileSync('docs/api-contract.md', 'utf8');

describe('⛔ הכתיבה נוגעת בשתי טבלאות הזירה בלבד (D-044 · § 4.2י מדד ⓐ)', () => {
  const written = [...CODE.matchAll(/\.from\('([a-z_]+)'\)\s*\.(?:upsert|insert|update|delete)\(/g)]
    .map((m) => m[1]);

  it('שתי הטבלאות, ותו לא', () => {
    expect([...new Set(written)].sort()).toEqual(['arcade_progress', 'arcade_runs']);
  });

  it.each(['word_progress', 'profiles', 'words', 'senses'])('⛔ %s אינו נכתב', (table) => {
    expect(written).not.toContain(table);
  });

  it('⛔ word_progress אינו מופיע בקובץ בכלל — גם לא בקריאה', () => {
    expect(CODE).not.toContain('word_progress');
  });

  it.each(['easiness', 'interval_days', 'repetition', 'next_review_at',
           'self_marked_known', 'current_level'])('⛔ %s אינו מופיע בקובץ', (column) => {
    expect(CODE).not.toContain(column);
  });
});

describe('סדר ההגנות (F-004 · C-0032)', () => {
  it('גוף שאינו אובייקט ⇒ 400, ⛔ לא 500', () => {
    expect(CODE).toContain('Array.isArray(payload)');
    expect(CODE).toContain('status: 400');
  });

  it('session נבדק לפני שהגוף מאומת', () => {
    expect(CODE.indexOf('getUser')).toBeLessThan(CODE.indexOf('parseAnswers(body.answers)'));
  });

  it('תשובות פגומות ⇒ 422 בעברית, ⛔ ולא כתיבה', () => {
    expect(CODE).toContain('status: 422');
    expect(CODE).toContain('fieldErrors');
    expect(CODE.indexOf('status: 422')).toBeLessThan(CODE.indexOf('.upsert('));
  });

  it('⛔ אין cast עיוור על הגוף — כל שדה נבדק בטיפוסו', () => {
    const parser = CODE.slice(CODE.indexOf('function parseAnswers'), CODE.indexOf('export async function POST'));
    for (const guard of ["typeof a.wordId !== 'string'", "typeof a.correct !== 'boolean'"]) {
      expect(parser).toContain(guard);
    }
  });
});

describe('הנתיב אינו מחליט', () => {
  it('קורא ל-planArcadeWrites ומחיל את השורות שחזרו', () => {
    expect(CODE).toContain('planArcadeWrites(');
    expect(CODE).toContain('for (const write of plan.rows)');
  });

  it('⛔ אין ניקוד, מטבע, XP או לוח תוצאות (D-050)', () => {
    for (const token of ['score', 'points', 'xp', 'coins', 'leaderboard', 'streak']) {
      expect(CODE.toLowerCase()).not.toContain(token);
    }
  });

  it('«המילים שהפילו אותך» חוזר בתשובה ⛔ ואינו נכתב (D-047)', () => {
    const writes = CODE.slice(CODE.indexOf('for (const write of plan.rows)'), CODE.indexOf('return NextResponse.json({\n    ok: true,'));
    expect(writes).not.toContain('missed');
    expect(CODE.slice(CODE.lastIndexOf('return NextResponse.json'))).toContain('missed: plan.missed');
  });
});

describe('החוזה מתעדכן באותו קומיט', () => {
  it('docs/api-contract.md מתעד את הנתיב', () => {
    expect(CONTRACT).toContain('POST /api/arcade/result');
  });
});
```

### 3.5 · צעדים

- [ ] כתוב את `lib/core/arcadeResult.ts` מ-3.1. `node scripts/check-core-purity.mjs` — `OK`. **4 דק׳**
- [ ] כתוב את `lib/core/arcadeResult.test.ts` מ-3.2. הרץ — צפוי **14 ירוקות**. **4 דק׳**
- [ ] הרץ מוטציה ⓐ (`wins` יורד בהפסד) ומוטציה ⓑ (`repetition: 0` ב-`values`) — כל אחת מפילה בדיקה בשמה; שחזר ואמת ב-`git diff`. **4 דק׳**
- [ ] `mkdir -p app/api/arcade/result` וכתוב את `route.ts` מ-3.3. **5 דק׳**
- [ ] כתוב את `route.test.ts` מ-3.4. **4 דק׳**
- [ ] `docs/api-contract.md` — `POST /api/arcade/result`, **באותו קומיט**. **4 דק׳**
- [ ] `plan/30-architecture.md` — פסקה אחת: הזירה היא שתי טבלאות ושני נתיבים, והגבול נאכף בשלושה מקומות (סכמה · טיפוס `ArcadeWriteRow['table']` · בדיקת הבית-בבית). **4 דק׳**
- [ ] סגור את **T-088** כ«הוחלפה» ⛔ רק כש-T-095 נוחתת — ⛔ **לא בתוכנית הזאת** (§ 4.2י). **1 דק׳**

---

## 4 · בדיקה עצמית — ⛔ לפני שטוענים שהתוכנית הושלמה

```bash
npm run typecheck && npm run check:core && npm test && npm run build
```

⛔ **אין לטעון «עובר» בלי שהפקודה רצה בהודעה עצמה** (`verification-before-completion`).

ואז שבע השאלות. **כל אחת נענית במדידה, ⛔ לא בזיכרון:**

> 🔴 **F-065 — תוקן ב-C-0182, והנוסח כאן הוא הנוסח המחייב.** ארבע השורות הבאות היו
> `grep` גולמי על הקובץ כולו, ולכן **פגעו בהערה שמתעדת את האיסור ובאסרציה שאוכפת אותו**
> — false-reject, התאום המשלים של F-039. נמדד ב-C-0180 על מימוש T-093 **שאין בו ולו
> הפרה אחת**: חמש משבע השאלות החזירו «הפרה». ⛔ **הפעולה הזולה — למחוק את ההערות שמתעדות
> את D-044 ואת D-034 — אסורה.** המדידה היא שמתוקנת: מלבינים הערות, ומחריגים `*.test.ts`
> מסריקת המקור. הסקריפט מריץ את שמונת הטוקנים; **פלט ריק = אפס הפרות.**

```bash
node -e '
const fs=require("fs"),path=require("path");
const white=(s,sql)=>s.replace(/\/\*[\s\S]*?\*\//g,"").replace(/^[ \t]*\/\/[^\n]*$/gm,"")
  .replace(sql?/^[ \t]*--[^\n]*$/gm:/(?!)/g,"");
const files=["supabase/migrations/0014_arcade.sql","lib/core/arcadeRound.ts","lib/core/arcadeResult.ts",
  "app/api/arcade/round/route.ts","app/api/arcade/result/route.ts"].filter(f=>fs.existsSync(f));
const tokens=["word_progress","setTimeout","setInterval","cefr_level","Math.random",
  "easiness","interval_days","next_review_at"];
for(const f of files){const src=white(fs.readFileSync(f,"utf8"),f.endsWith(".sql"));
  for(const t of tokens) if(src.includes(t)) console.log("HIT",f,t);}
' </dev/null
```

- [ ] הסקריפט ⇒ **פלט ריק**. זה הגבול של D-044 (`word_progress` · עמודות SM-2), של D-045 · R-020 (⛔ אין שעון), של D-034 (`cefr_profile_band` ⛔ ולא `cefr_level`) ושל שחזוריות ההגרלה (⛔ אפס `Math.random`).
- [ ] ⚠️ **פגיעה בהערה או בשם בדיקה ⛔ אינה הפרה** — היא כשל של המדידה. ⛔ **בשום מקרה: מחיקת ההערות.**
- [ ] ⚠️ **ובכיוון השני, נמדד ב-C-0182:** `toContain` על טוקן קצר הוא אותו פגם — `xp` יושב בתוך `export` בכל קובץ TypeScript, ולכן אסרציית D-050 ב-3.4 חייבת להיות **גבול מזהה** (`\bxp\b`) ⛔ ולא substring.
- [ ] `docs/api-contract.md` מכיל את **שני** הנתיבים **ואת תשובת הרמה הקטנה**, ובאותו קומיט של הקוד.
- [ ] הרצת **שלוש** מוטציות לפחות (⓪ⓐ/ⓑ/ⓒ/ⓓ/ⓕ), כל אחת מפילה בדיקה **בשמה**, וכל שחזור מאומת ב-`git diff` ⛔ ולא בזיכרון.
- [ ] `plan/00-control.md` · `50-tasks.md` · `30-architecture.md` עודכנו, ו-`npm run measure:plan` הוא **הפקודה האחרונה לפני הקומיט** (לקח C-0172: הצהרה שקדמה לעריכה היא הצהרה שגויה).

## 5 · מה התוכנית הזאת ⛔ אינה מכסה

⛔ **T-095/T-096/T-097 — המסכים.** הן צריכות תוכנית משלהן, והחוזה שהן יבנו עליו הוא
בדיוק מה שחלקים 2.3 ו-3.3 מקבעים. ⛔ אל תתחיל אותן בתוך הטיק הזה.
⛔ **T-103 («סיבוב שטף»)** — היא מוסיפה דדליין, ולכן ⛔ אינה יכולה לחלוק קובץ עם `buildRound`
לפני ש-T-095 קיימת. היא ממתינה בתור.
⛔ **הרצת המיגרציה בייצור** — פעולה של רוי, `03-for-roy` פריט 33.
