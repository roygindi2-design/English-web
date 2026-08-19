# ניתוק הזירה — שדרת הקושי, הסולם ותנאי הסיום — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** להפוך את זירת הקרב למשחק שאפשר לא לנצח בו, שציר הקושי שלו מנותק לחלוטין מהצד הלימודי — ארבע משימות ברצף: **T-107 → T-115 → T-108 → T-116**.

**Architecture:** ציר הקושי היחיד של הזירה הוא רמת המשחק ב-`arcade_progress`. סולם 12 הרמות והקבועים של הקרב (15 תחמושת · 10 חיי יריב · 3 ניצחונות לרמה) מוצהרים **בטבלה אחת** ב-`lib/core/arcadeLadder.ts`, וכל השאר — הנתיב, מנוע הקרב ותוכנית הכתיבה — קורא ממנה. `GET /api/arcade/round` מפסיק לקרוא את `profiles.current_level`, ובמקומו גוזר רמה ופרוסת תדירות מהסולם.

**Tech Stack:** Next.js App Router (Route Handlers) · TypeScript עם `noUncheckedIndexedAccess` · Vitest · Supabase/Postgres (מיגרציות SQL ידניות ב-`supabase/migrations/`).

**Spec:** `plan/40-decisions.md` § 4.9 (D-052 · D-053) ו-§ 4.10 (D-059 · D-060 · D-061 · D-062) · `plan/50-tasks.md` שורות T-107 · T-108 · T-115 · T-116.

## Global Constraints

- `lib/core/` טהור: ⛔ אפס React · אפס `window`/`document`/`localStorage` · אפס `fetch` · אפס `process.env` · אפס `Math.random` · אפס `Date.now`. נאכף ב-`npm run check:core`.
- ⛔ `profiles.current_level` · `word_progress` · `self_marked_known` · `easiness` · `interval_days` · `repetition` · `next_review_at` — **אינם מופיעים באף קובץ זירה**, לא בכתיבה ולא בקריאה (D-052 · D-044).
- ⛔ הסינון הוא `words.cefr_profile_band` ו**לעולם לא** `senses.cefr_level` (D-034 · D-058).
- ⛔ **המילה «הפסדת» אינה מופיעה באף מחרוזת ממשק** (D-059).
- ⛔ אין ניקוד, מטבע, XP או לוח תוצאות (D-050). «פריט שנפתח» הוא המנגנון היחיד.
- ⛔ אין שעון ואין דדליין בקרב הרגיל (D-045 · R-020).
- TypeScript ללא `any`. כל אינדוקס למערך מטפס ל-`T | undefined` — יש למסור `as T` או לבדוק, כמו ב-`lib/core/arcadeRound.ts:78`.
- פקודת האימות המלאה, בכל קומיט: `npm run typecheck && npm run check:core && npm test && npm run build`.
- `docs/api-contract.md` מתעדכן **באותו קומיט** של כל שינוי בנקודת קצה.
- קומיט לענף `dev` בלבד. ⛔ בלי `[skip ci]`.

## ⚠️ סטייה מודעת אחת ממפרט T-107 — קרא לפני שאתה כותב SQL

T-107ⓐ מבקשת עמודה חדשה `arcade_progress.game_level`. **נמדד בטיק התכנון (C-0193):** `supabase/migrations/0014_arcade.sql:30` כבר מצהיר `arcade_level int not null default 1`, `app/api/arcade/round/route.ts:60` קורא אותה, `app/api/arcade/result/route.ts:73` כותב אותה, ו-`docs/api-contract.md:790` מתעד אותה — כלומר **הציר שהמפרט מבקש כבר קיים תחת שם אחר**. עמודה שנייה באותה משמעות היא מקור אמת שני, וזה בדיוק הכשל שהוליד את D-034.

⇒ **ההכרעה בתוכנית הזאת: משתמשים ב-`arcade_level` הקיימת, ⛔ ולא מוסיפים `game_level`.** ⛔ אין שינוי שם ואין `alter … rename` — שינוי שם שובר שלושה קבצים חיים בשביל אסתטיקה. הפער נרשם כ-**F-073 → PM**; אם ה-PM מכריע אחרת, ההיפוך הוא מיגרציית `rename` בודדת ועריכת ארבעה אזכורים.

---

### Task 1: מיגרציה `0015_arcade_decoupling.sql` — טבלת האוסף (T-107)

**Files:**
- Create: `supabase/migrations/0015_arcade_decoupling.sql`
- Create: `lib/supabase/arcadeDecoupling.test.ts`

**Interfaces:**
- Consumes: `supabase/migrations/0014_arcade.sql` (‏`arcade_progress` · `arcade_runs` כבר קיימות).
- Produces: טבלה `public.arcade_collected_words` עם העמודות `user_id uuid` · `word_id uuid` · `first_seen_at timestamptz` · `times_missed int` · `times_correct int` · `hidden_by_learner boolean`, ומפתח ראשי מורכב `(user_id, word_id)`. **T-109 עושה `upsert` על `on_conflict=user_id,word_id`; T-118 סופר `times_correct >= 3`; T-110 קוראת `hidden_by_learner = false`.**

⚠️ `times_correct` נכנס **עכשיו** ולא במיגרציה נפרדת: D-062 מחייב מונה נכונות באותה טבלה («⛔ אפס טבלה חדשה»), ומיגרציה 0016 שמוסיפה עמודה בודדת היא הרצה ידנית שנייה של רוי בלי תמורה.

- [x] **Step 1: כתוב את הבדיקה הנופלת**

צור `lib/supabase/arcadeDecoupling.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * שומר על `0015_arcade_decoupling.sql` (T-107 · D-052 · D-053).
 * כמו `arcade.test.ts`: מוכיח מה הקובץ **אומר**, ⛔ לא שהוא הורץ (הרצה = פעולת רוי).
 * ההערות מולבנות לפני כל טענה — אילוץ שהוער החוצה אינו אילוץ.
 */
const SQL = readFileSync('supabase/migrations/0015_arcade_decoupling.sql', 'utf8');
const BODY = SQL.replace(/--[^\n]*$/gm, '');

describe('0015 — אידמפוטנטיות וטרנזקציה', () => {
  it('הטבלה נוצרת עם if not exists', () => {
    expect(BODY).toMatch(/create table if not exists public\.arcade_collected_words/i);
  });

  it('רצה בטרנזקציה אחת', () => {
    expect(BODY).toMatch(/^\s*begin;/im);
    expect(BODY).toMatch(/commit;\s*$/im);
  });

  it('כל אילוץ מוצהר בנפרד ובשם בתוך do $$ — ⛔ לא בתוך create table (לקח C-0032)', () => {
    const createBlocks = BODY.match(/create table if not exists[\s\S]*?\n\);/gi) ?? [];
    expect(createBlocks).toHaveLength(1);
    expect(createBlocks[0]).not.toMatch(/\bcheck\s*\(/i);
    for (const name of ['arcade_collected_missed_check', 'arcade_collected_correct_check']) {
      expect(BODY).toMatch(new RegExp(`conname\\s*=\\s*'${name}'`, 'i'));
      expect(BODY).toMatch(new RegExp(`add constraint ${name}`, 'i'));
    }
  });
});

describe('⛔ מילה שנאספה פעמיים היא שורה אחת ומונה 2', () => {
  it('מפתח ראשוני מורכב על (user_id, word_id)', () => {
    expect(BODY).toMatch(/primary key\s*\(\s*user_id\s*,\s*word_id\s*\)/i);
  });

  it('שני המונים קיימים, שניהם not null default 0', () => {
    expect(BODY).toMatch(/times_missed\s+int\s+not null\s+default\s+0/i);
    expect(BODY).toMatch(/times_correct\s+int\s+not null\s+default\s+0/i);
  });

  it('דגל ההסתרה קיים וברירת המחדל שלו false — ⛔ מילה שנאספה מוצגת', () => {
    expect(BODY).toMatch(/hidden_by_learner\s+boolean\s+not null\s+default\s+false/i);
  });
});

describe('⛔ הבידוד הדו-כיווני של D-052 נאכף בסכמה, ⛔ לא בהערה', () => {
  it.each(['word_progress', 'self_marked_known', 'current_level', 'senses'])(
    '⛔ %s אינו מופיע באף שורת SQL', (token) => {
      expect(BODY).not.toMatch(new RegExp(`\\b${token}\\b`, 'i'));
    });

  it('⛔ אפס טריגר ואפס פונקציית טריגר', () => {
    expect(BODY).not.toMatch(/create\s+(or replace\s+)?(trigger|function)/i);
  });

  it('המפתחות הזרים היחידים הם auth.users ו-words', () => {
    const refs = [...BODY.matchAll(/references\s+([a-z_.]+)\s*\(/gi)].map((m) => m[1]?.toLowerCase());
    expect([...new Set(refs)].sort()).toEqual(['auth.users', 'public.words']);
  });
});

describe('RLS — בעלות עצמית על טבלה חדשה', () => {
  it('RLS מופעלת', () => {
    expect(BODY).toMatch(/alter table public\.arcade_collected_words enable row level security/i);
  });

  it.each(['select', 'insert', 'update'])('יש מדיניות %s עצמית', (verb) => {
    expect(BODY).toMatch(new RegExp(`for ${verb} to authenticated`, 'i'));
  });

  it('revoke לפני grant — grant לבדו הוא no-op מול default privileges', () => {
    expect(BODY.indexOf('revoke all')).toBeLessThan(BODY.indexOf('grant select'));
  });

  it('⛔ anon אינו מקבל דבר', () => {
    expect(BODY).not.toMatch(/grant[^;]*to[^;]*\banon\b/i);
  });
});
```

- [x] **Step 2: הרץ ואמת שהיא נופלת**

Run: `npx vitest run lib/supabase/arcadeDecoupling.test.ts`
Expected: FAIL — `ENOENT: no such file or directory, open 'supabase/migrations/0015_arcade_decoupling.sql'`

- [x] **Step 3: כתוב את המיגרציה**

צור `supabase/migrations/0015_arcade_decoupling.sql`:

```sql
-- 0015_arcade_decoupling.sql — «המילים שאספתי» (T-107 · D-052 · D-053 · D-062).
--
-- מוחל בעורך ה-SQL של Supabase (או `supabase db push`) אחרי 0014.
--
-- ⚠️ **מה שהקובץ הזה ⛔ אינו עושה, ולמה:** T-107 ביקשה עמודה `arcade_progress.game_level`.
-- `0014_arcade.sql` כבר מצהיר `arcade_level int not null default 1`, וזהו בדיוק אותו ציר —
-- שתי עמודות באותה משמעות הן מקור אמת שני (הלקח של D-034). ⇒ ⛔ אין כאן עמודה חדשה,
-- ו-`arcade_level` היא **רמת המשחק** לכל דבר. הפער נרשם כ-F-073 → PM.
--
-- ⛔ **הבידוד של D-052 נאכף כאן בסכמה:** אין בקובץ מפתח זר ל-`word_progress`, אין טריגר,
-- ואין אזכור של שדה לימודי כלשהו. הזירה אינה יכולה לגעת במנוע החזרה המרווחת גם אם קוד
-- עתידי ינסה — אין דרך מהסכמה הזאת לשם.
--
-- אידמפוטנטי: `create table if not exists`, וכל אילוץ בנפרד ובשם בתוך `do $$` —
-- `create table … check` מדולג **כולו** כשהטבלה כבר קיימת (נמדד C-0032).

begin;

-- ---------------------------------------------------------------------------
-- arcade_collected_words — שורה אחת ל(לומד, מילה). רשימה, ⛔ לא מנוע.
-- ---------------------------------------------------------------------------
create table if not exists public.arcade_collected_words (
  user_id           uuid not null references auth.users (id) on delete cascade,
  word_id           uuid not null references public.words (id) on delete cascade,
  first_seen_at     timestamptz not null default now(),
  times_missed      int not null default 0,
  times_correct     int not null default 0,
  hidden_by_learner boolean not null default false,
  primary key (user_id, word_id)
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'arcade_collected_missed_check') then
    alter table public.arcade_collected_words
      add constraint arcade_collected_missed_check check (times_missed >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'arcade_collected_correct_check') then
    alter table public.arcade_collected_words
      add constraint arcade_collected_correct_check check (times_correct >= 0);
  end if;
end $$;

comment on table public.arcade_collected_words is
  'D-053: המילים שהלומד פגש בקרבות. ⛔ אין כאן SM-2, אין תזמון ואין רמת CEFR —
   «חזרה» היא לומד שפותח ומדפדף. ⛔ מילה כאן אינה נעלמת מהכרטיסיות ואינה מופיעה בהן.';

comment on column public.arcade_collected_words.times_correct is
  'D-062: «מילה ידועה» בתוך הזירה = ‏times_correct >= 3. ⛔ ההגדרה הזאת קיימת כאן
   ולא בצד הלימודי, כי D-052 אוסר על הזירה לקרוא את self_marked_known ואת repetition.';

-- הקריאה היחידה של T-110: (הלומד הזה, מה שלא הסתיר, החדש למעלה).
create index if not exists arcade_collected_user_seen_idx
  on public.arcade_collected_words (user_id, first_seen_at desc)
  where hidden_by_learner = false;

-- ---------------------------------------------------------------------------
-- RLS — בעלות עצמית. טבלה חדשה בלי RLS היא טבלה פתוחה לכל משתמש מזוהה.
-- ---------------------------------------------------------------------------
alter table public.arcade_collected_words enable row level security;

drop policy if exists "arcade_collected_select_own" on public.arcade_collected_words;
create policy "arcade_collected_select_own" on public.arcade_collected_words
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "arcade_collected_insert_own" on public.arcade_collected_words;
create policy "arcade_collected_insert_own" on public.arcade_collected_words
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "arcade_collected_update_own" on public.arcade_collected_words;
create policy "arcade_collected_update_own" on public.arcade_collected_words
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- הרשאות מפורשות. revoke קודם — grant לבדו הוא no-op מול default privileges,
-- ו-RLS ⛔ אינה חוסמת TRUNCATE.
-- ---------------------------------------------------------------------------
revoke all on public.arcade_collected_words from authenticated, anon;

grant select, insert, update on public.arcade_collected_words to authenticated;

-- ⛔ אין delete: «הסתרה» היא דגל (D-053), ⛔ ולא מחיקת שורה. מונה שנמחק אינו חוזר.
-- ⛔ anon אינו מקבל דבר.

commit;
```

- [x] **Step 4: הרץ ואמת שהיא עוברת**

Run: `npx vitest run lib/supabase/arcadeDecoupling.test.ts`
Expected: PASS — כל הבדיקות ירוקות.

- [x] **Step 5: הוסף שורה ל-`plan/03-for-roy.md`**

המיגרציה אינה רצה מעצמה. הוסף פריט חדש בסוף הרגיסטר, בנוסח של פריט 33:

```markdown
| 40 | **להריץ את `supabase/migrations/0015_arcade_decoupling.sql`** בעורך ה-SQL של Supabase | «המילים שאספתי» (T-109 · T-110) ו«סיבוב שטף» (T-118) מחזירים 503 עד שתריץ. ⛔ אין נזק בהמתנה — הקרב עצמו אינו תלוי בטבלה הזאת | ⏳ פתוח |
```

- [x] **Step 6: אימות מלא וקומיט**

Run: `npm run typecheck && npm run check:core && npm test && npm run build`
Expected: כל ארבע עוברות.

```bash
git add supabase/migrations/0015_arcade_decoupling.sql lib/supabase/arcadeDecoupling.test.ts plan/03-for-roy.md
git commit -m "loop(DEV): T-107 מיגרציה 0015 — arcade_collected_words עם שני מונים ו-RLS עצמית"
```

---

### Task 2: `lib/core/arcadeLadder.ts` — הקבועים והסולם בטבלה אחת (T-115)

**Files:**
- Create: `lib/core/arcadeLadder.ts`
- Create: `lib/core/arcadeLadder.test.ts`

**Interfaces:**
- Consumes: `CefrBand` מ-`lib/core/cefrLevels.ts`.
- Produces:
  - `ARCADE_AMMO: 15` · `ARCADE_ENEMY_HP: 10` · `ARCADE_WINS_PER_LEVEL: 3` · `MAX_GAME_LEVEL: 12` · `ARCADE_MIN_WORDS_PER_LEVEL: 12` · `ARENA_IDLE_LOOP: false`
  - `interface GameLevel { readonly level: number; readonly band: CefrBand; readonly sliceIndex: number; readonly slicesInBand: number }`
  - `GAME_LEVELS: readonly GameLevel[]` — 12 שורות
  - `gameLevelAt(level: number): GameLevel | null`
  - `describeLevel(level: number, eligible: number): { readonly unlocked: boolean; readonly required: number; readonly eligible: number }`
  - `isVictory(correct: number): boolean`
  - `applyWin(before: { level: number; wins: number }): { readonly level: number; readonly wins: number; readonly leveledUp: boolean }`

**T-108 קורא ל-`gameLevelAt` ול-`describeLevel`. T-116 קורא ל-`isVictory` ול-`applyWin` ומייבא את `ARCADE_ENEMY_HP` ואת `ARCADE_AMMO` מכאן.**

- [ ] **Step 1: כתוב את הבדיקה הנופלת**

צור `lib/core/arcadeLadder.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  ARCADE_AMMO, ARCADE_ENEMY_HP, ARCADE_MIN_WORDS_PER_LEVEL, ARCADE_WINS_PER_LEVEL,
  ARENA_IDLE_LOOP, GAME_LEVELS, MAX_GAME_LEVEL,
  applyWin, describeLevel, gameLevelAt, isVictory,
} from './arcadeLadder';

describe('D-059 — שלושת קבועי הקרב', () => {
  it('15 שאלות · 10 חיי יריב · 3 ניצחונות לרמה', () => {
    expect(ARCADE_AMMO).toBe(15);
    expect(ARCADE_ENEMY_HP).toBe(10);
    expect(ARCADE_WINS_PER_LEVEL).toBe(3);
  });

  it('סף הניצחון הוא בדיוק 10 מתוך 15 — ⛔ לא 9 ולא 11', () => {
    expect(isVictory(9)).toBe(false);
    expect(isVictory(10)).toBe(true);
    expect(isVictory(15)).toBe(true);
  });

  it('סף הדיוק שנגזר הוא 67% — הבדיקה שתיפול אם מישהו ישנה קבוע אחד לבדו', () => {
    expect(Math.round((ARCADE_ENEMY_HP / ARCADE_AMMO) * 100)).toBe(67);
  });

  it('D-060 · פריט 39 — לולאת ההמתנה כבויה בברירת מחדל', () => {
    expect(ARENA_IDLE_LOOP).toBe(false);
  });
});

describe('D-061 — סולם 12 רמות המשחק', () => {
  it('בדיוק 12 שורות, ממוספרות 1..12 ברצף', () => {
    expect(GAME_LEVELS).toHaveLength(12);
    expect(GAME_LEVELS.map((g) => g.level)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(MAX_GAME_LEVEL).toBe(12);
  });

  it('חלוקת הרמות היא בדיוק זו שב-D-061', () => {
    expect(GAME_LEVELS.map((g) => g.band)).toEqual([
      'A1', 'A1', 'A1', 'A1', 'A2', 'A2', 'B1', 'B1', 'B2', 'B2', 'C1', 'C2',
    ]);
  });

  it('פרוסות התדירות בתוך כל רמה רצות מ-0 ועד slicesInBand-1', () => {
    for (const band of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const) {
      const rows = GAME_LEVELS.filter((g) => g.band === band);
      expect(rows.map((r) => r.sliceIndex)).toEqual(rows.map((_, i) => i));
      for (const r of rows) expect(r.slicesInBand).toBe(rows.length);
    }
  });

  it('רמה 13 ⛔ אינה קיימת, וגם 0 ושבר אינם', () => {
    expect(gameLevelAt(13)).toBeNull();
    expect(gameLevelAt(0)).toBeNull();
    expect(gameLevelAt(1.5)).toBeNull();
    expect(gameLevelAt(1)).toEqual({ level: 1, band: 'A1', sliceIndex: 0, slicesInBand: 4 });
    expect(gameLevelAt(12)).toEqual({ level: 12, band: 'C2', sliceIndex: 0, slicesInBand: 1 });
  });
});

describe('D-061 · D-046 — רמה בלי 12 מילים כשירות נעולה **עם המספר**', () => {
  it('11 כשירות ⇒ נעולה, והמספרים חוזרים ללומד', () => {
    expect(describeLevel(3, 11)).toEqual({ unlocked: false, required: 12, eligible: 11 });
  });

  it('12 כשירות ⇒ פתוחה', () => {
    expect(describeLevel(3, 12)).toEqual({ unlocked: true, required: 12, eligible: 12 });
  });

  it('הסף הוא הקבוע ⛔ ולא מספר בקוד', () => {
    expect(ARCADE_MIN_WORDS_PER_LEVEL).toBe(12);
  });

  it('C1/C2 היום = 0 כשירות (R-021) ⇒ נעולות עם 0, ⛔ לא מוסתרות', () => {
    expect(describeLevel(11, 0)).toEqual({ unlocked: false, required: 12, eligible: 0 });
    expect(describeLevel(12, 0)).toEqual({ unlocked: false, required: 12, eligible: 0 });
  });
});

describe('D-061 — עלייה = 3 ניצחונות, ⛔ ואין ירידה', () => {
  it('ניצחון ראשון ושני מעלים מונה בלבד', () => {
    expect(applyWin({ level: 2, wins: 0 })).toEqual({ level: 2, wins: 1, leveledUp: false });
    expect(applyWin({ level: 2, wins: 1 })).toEqual({ level: 2, wins: 2, leveledUp: false });
  });

  it('השלישי מעלה רמה ומאפס את המונה', () => {
    expect(applyWin({ level: 2, wins: 2 })).toEqual({ level: 3, wins: 0, leveledUp: true });
  });

  it('⛔ רמה 12 היא התקרה — ניצחון שם ⛔ אינו יוצר רמה 13', () => {
    expect(applyWin({ level: 12, wins: 2 })).toEqual({ level: 12, wins: 0, leveledUp: false });
  });
});
```

- [ ] **Step 2: הרץ ואמת שהיא נופלת**

Run: `npx vitest run lib/core/arcadeLadder.test.ts`
Expected: FAIL — `Failed to resolve import "./arcadeLadder"`

- [ ] **Step 3: כתוב את המימוש**

צור `lib/core/arcadeLadder.ts`:

```ts
/**
 * D-059 · D-061 — קבועי הקרב וסולם 12 רמות המשחק. טהור: ⛔ אפס React, DOM, רשת ו-env.
 *
 * ⚠️ זהו **המקום היחיד** שבו שלושת מספרי הקרב וחלוקת הרמות קיימים. R-023 פתוחה,
 * וכשיגיע שכיול מחדש הוא חייב להיות **עריכת שורה בטבלה** ⛔ ולא ציד ב-`if`-ים
 * במסך, בנתיב ובמנוע.
 *
 * ⛔ **הסולם ⛔ אינו קורא את הצד הלימודי** (D-052): הוא מתחיל ב-1 לכל לומד, גם למי
 * שהוא C1 בכרטיסיות, ועולה אך ורק מניצחונות בזירה.
 */
import type { CefrBand } from './cefrLevels';

/** «תחמושת» — מספר השאלות בקרב. קבוע, ⛔ אינו נגזר מהלומד ו⛔ אינו עולה עם הרמה. */
export const ARCADE_AMMO = 15;

/** חיי היריב. ניצחון = להפיל את כולם בתוך התחמושת ⇒ סף דיוק 67%. */
export const ARCADE_ENEMY_HP = 10;

/** ⛔ תיקו אינו מוריד ואינו מאפס את המונה (D-061). */
export const ARCADE_WINS_PER_LEVEL = 3;

export const MAX_GAME_LEVEL = 12;

/** רמה שאין לה כל כך הרבה מילים כשירות מוצגת **נעולה עם המספר** (D-046). */
export const ARCADE_MIN_WORDS_PER_LEVEL = 12;

/**
 * D-060 · `03-for-roy` פריט 39 — תנוחת המתנה חיה היא **לולאה מתמשכת**, וחוקה § 5
 * הקפואה מתירה 150–300ms של **מעבר**. ⛔ סוכן אינו משנה חוקה קפואה ⇒ ברירת המחדל
 * היא «בלי לולאה», וההיפוך הוא **השורה הזאת בלבד**.
 */
export const ARENA_IDLE_LOOP = false;

export interface GameLevel {
  readonly level: number;
  readonly band: CefrBand;
  /** איזו פרוסת תדירות בתוך הרמה, 0 = השכיחה ביותר. */
  readonly sliceIndex: number;
  /** לכמה פרוסות הרמה הזאת מחולקת. */
  readonly slicesInBand: number;
}

/**
 * ⛔ הטבלה, ⛔ ולא נוסחה: «1–4 = A1» אינו חוק מתמטי אלא הכרעה, ונוסחה הייתה
 * הופכת כל שכיול עתידי לשינוי אלגוריתם במקום לשינוי שורה.
 */
export const GAME_LEVELS: readonly GameLevel[] = Object.freeze([
  { level: 1,  band: 'A1', sliceIndex: 0, slicesInBand: 4 },
  { level: 2,  band: 'A1', sliceIndex: 1, slicesInBand: 4 },
  { level: 3,  band: 'A1', sliceIndex: 2, slicesInBand: 4 },
  { level: 4,  band: 'A1', sliceIndex: 3, slicesInBand: 4 },
  { level: 5,  band: 'A2', sliceIndex: 0, slicesInBand: 2 },
  { level: 6,  band: 'A2', sliceIndex: 1, slicesInBand: 2 },
  { level: 7,  band: 'B1', sliceIndex: 0, slicesInBand: 2 },
  { level: 8,  band: 'B1', sliceIndex: 1, slicesInBand: 2 },
  { level: 9,  band: 'B2', sliceIndex: 0, slicesInBand: 2 },
  { level: 10, band: 'B2', sliceIndex: 1, slicesInBand: 2 },
  { level: 11, band: 'C1', sliceIndex: 0, slicesInBand: 1 },
  { level: 12, band: 'C2', sliceIndex: 0, slicesInBand: 1 },
] as const);

export function gameLevelAt(level: number): GameLevel | null {
  if (!Number.isInteger(level)) return null;
  // ⛔ `?? null` ולא `as GameLevel`: `noUncheckedIndexedAccess` מטפס את האינדוקס
  // ל-`GameLevel | undefined`, ו-cast היה מחזיר `undefined` שנראה כמו רמה.
  return GAME_LEVELS[level - 1] ?? null;
}

export function describeLevel(
  level: number,
  eligible: number,
): { readonly unlocked: boolean; readonly required: number; readonly eligible: number } {
  void level;
  return {
    unlocked: eligible >= ARCADE_MIN_WORDS_PER_LEVEL,
    required: ARCADE_MIN_WORDS_PER_LEVEL,
    eligible,
  };
}

/** ⛔ `>=` ולא `===`: תחמושת עודפת אינה מבטלת ניצחון. */
export function isVictory(correct: number): boolean {
  return correct >= ARCADE_ENEMY_HP;
}

export function applyWin(
  before: { readonly level: number; readonly wins: number },
): { readonly level: number; readonly wins: number; readonly leveledUp: boolean } {
  const wins = before.wins + 1;
  if (wins < ARCADE_WINS_PER_LEVEL) return { level: before.level, wins, leveledUp: false };
  // ⛔ המונה מתאפס גם בתקרה: לומד ברמה 12 שממשיך לנצח ⛔ אינו צובר מונה שאין לו יעד.
  if (before.level >= MAX_GAME_LEVEL) return { level: MAX_GAME_LEVEL, wins: 0, leveledUp: false };
  return { level: before.level + 1, wins: 0, leveledUp: true };
}
```

- [ ] **Step 4: הרץ ואמת שהיא עוברת**

Run: `npx vitest run lib/core/arcadeLadder.test.ts`
Expected: PASS — 14 בדיקות ירוקות.

- [ ] **Step 5: אמת שהטוהר לא נשבר**

Run: `npm run check:core`
Expected: PASS — הקובץ אינו מייבא React, DOM, רשת או env.

- [ ] **Step 6: אימות מלא וקומיט**

Run: `npm run typecheck && npm run check:core && npm test && npm run build`

```bash
git add lib/core/arcadeLadder.ts lib/core/arcadeLadder.test.ts
git commit -m "loop(DEV): T-115 קבועי הקרב וסולם 12 הרמות בטבלה אחת ב-lib/core"
```

---

### Task 3: `GET /api/arcade/round` מפסיק לקרוא את `profiles.current_level` (T-108)

**Files:**
- Modify: `lib/core/arcadeRound.ts` (‏`buildRound` מקבל `gameLevel` במקום `level` + `arcadeLevel`)
- Modify: `lib/core/arcadeRound.test.ts` (התאמת הקריאות הקיימות)
- Modify: `app/api/arcade/round/route.ts:41-51` (הסרת קריאת הפרופיל) ו-`:100-115`
- Modify: `app/api/arcade/round/route.test.ts` (סריקת המקור)
- Modify: `docs/api-contract.md` (‏`GET /api/arcade/round`)

**Interfaces:**
- Consumes: `gameLevelAt` · `describeLevel` · `ARCADE_AMMO` · `ARCADE_MIN_WORDS_PER_LEVEL` מ-Task 2.
- Produces: `buildRound(input: { readonly gameLevel: number; readonly candidates: readonly ArcadeCandidate[]; readonly seed: number }): ArcadeRound` שבו
  `ArcadeRound = { ok: true; band: CefrBand; gameLevel: number; questions: readonly ArcadeQuestion[] } | { ok: false; reason: 'level_too_small'; eligible: number; required: number } | { ok: false; reason: 'no_such_level' }`.
  **T-116 ו-`components/ArenaBoard.tsx` צורכים `questions` בלבד ואינם מושפעים.**

⚠️ **`ARCADE_ROUND_SIZE` הישן (8) מת.** גודל הסיבוב הוא `ARCADE_AMMO` (15). `lib/core/arcadeRound.ts` מייבא אותו מ-`arcadeLadder` ומייצא אותו מחדש בשם `ARCADE_ROUND_SIZE` כדי ש-`app/dev/arcade/page.tsx` לא יישבר; ההערה שם ("Eight questions") מתוקנת ל-15 באותו קומיט.

- [ ] **Step 1: כתוב את בדיקת סריקת המקור הנופלת**

הוסף ל-`app/api/arcade/round/route.test.ts`, בראש הקובץ אם אין שם `withoutComments`, את אותה הלבנה כמו ב-`app/api/arcade/result/route.test.ts:10`, ואז את הבלוק:

```ts
describe('⛔ D-052 — הזירה אינה יודעת שקיים צד לימודי', () => {
  it.each(['current_level', 'word_progress', 'self_marked_known', 'repetition',
           'next_review_at', 'easiness', 'interval_days'])(
    '⛔ %s אינו מופיע בנתיב — גם לא בקריאה', (token) => {
      expect(CODE).not.toContain(token);
    });

  it('⛔ הטבלה `profiles` אינה נקראת בכלל', () => {
    expect(CODE).not.toMatch(/\.from\('profiles'\)/);
  });

  it('הטבלאות שנקראות הן בדיוק arcade_progress ו-words', () => {
    const read = [...CODE.matchAll(/\.from\('([a-z_]+)'\)/g)].map((m) => m[1]);
    expect([...new Set(read)].sort()).toEqual(['arcade_progress', 'words']);
  });

  it('⛔ הנתיב עדיין אינו כותב דבר', () => {
    expect(CODE).not.toMatch(/\.(insert|upsert|update|delete)\(/);
  });

  it('⛔ הסינון הוא cefr_profile_band ולעולם לא senses.cefr_level (D-034 · D-058)', () => {
    expect(CODE).toContain('cefr_profile_band');
    expect(CODE).not.toContain('cefr_level');
  });
});
```

וכן, ב-`lib/core/arcadeRound.test.ts`, בדיקה חדשה לחוזה החדש:

```ts
describe('T-108 — הסיבוב נגזר מרמת משחק, ⛔ לא מרמת הלומד', () => {
  it('רמת משחק 13 ⇒ no_such_level, ⛔ ולא נפילה חזרה ל-A1', () => {
    const round = buildRound({ gameLevel: 13, candidates: [], seed: 1 });
    expect(round).toEqual({ ok: false, reason: 'no_such_level' });
  });

  it('רמת משחק 1 מחזירה band A1 ואת מספר הרמה', () => {
    const pool = makeCandidates('A1', 20); // עוזר קיים בקובץ; אם אינו קיים — 20 מועמדים כשירים
    const round = buildRound({ gameLevel: 1, candidates: pool, seed: 7 });
    expect(round.ok).toBe(true);
    if (!round.ok) return;
    expect(round.band).toBe('A1');
    expect(round.gameLevel).toBe(1);
    expect(round.questions).toHaveLength(15);
  });

  it('שתי פרוסות באותה רמה ⛔ אינן מחזירות את אותן מילים', () => {
    const pool = makeCandidates('A1', 80);
    const a = buildRound({ gameLevel: 1, candidates: pool, seed: 7 });
    const b = buildRound({ gameLevel: 4, candidates: pool, seed: 7 });
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    const idsA = new Set(a.questions.map((q) => q.wordId));
    const overlap = b.questions.filter((q) => idsA.has(q.wordId));
    expect(overlap).toHaveLength(0);
  });
});
```

- [ ] **Step 2: הרץ ואמת שהן נופלות**

Run: `npx vitest run lib/core/arcadeRound.test.ts app/api/arcade/round/route.test.ts`
Expected: FAIL — `Object literal may only specify known properties, and 'gameLevel' does not exist` בבדיקות הליבה, ו-`expected 'current_level' not to be contained` בסריקת המקור.

- [ ] **Step 3: החלף את חתימת `buildRound`**

ב-`lib/core/arcadeRound.ts`: החלף את שורות 14–16 ואת `buildRound`:

```ts
import { ARCADE_AMMO, ARCADE_MIN_WORDS_PER_LEVEL, gameLevelAt } from './arcadeLadder';
import type { CefrBand } from './cefrLevels';

export const ARCADE_MIN_WORDS = ARCADE_MIN_WORDS_PER_LEVEL;
/** ⛔ שם היסטורי. גודל הסיבוב הוא התחמושת (D-059) — ⛔ אין כאן מספר משלו. */
export const ARCADE_ROUND_SIZE = ARCADE_AMMO;
export const ARCADE_OPTION_COUNT = 4;

export type ArcadeRound =
  | { readonly ok: true; readonly band: CefrBand; readonly gameLevel: number;
      readonly questions: readonly ArcadeQuestion[] }
  | { readonly ok: false; readonly reason: 'level_too_small';
      readonly eligible: number; readonly required: number }
  | { readonly ok: false; readonly reason: 'no_such_level' };

export function buildRound(input: {
  readonly gameLevel: number;
  readonly candidates: readonly ArcadeCandidate[];
  readonly seed: number;
}): ArcadeRound {
  // ⛔ הרמה נגזרת מהסולם ⛔ ולא מהלומד (D-052). רמה שאינה בטבלה אינה נופלת ל-A1.
  const rung = gameLevelAt(input.gameLevel);
  if (rung === null) return { ok: false, reason: 'no_such_level' };

  const pool = eligibleCandidates(input.candidates, rung.band);
  if (pool.length < ARCADE_MIN_WORDS) {
    return { ok: false, reason: 'level_too_small', eligible: pool.length, required: ARCADE_MIN_WORDS };
  }
  const byRank = pool
    .slice()
    .sort((a, b) =>
      (a.ngslRank ?? Number.MAX_SAFE_INTEGER) - (b.ngslRank ?? Number.MAX_SAFE_INTEGER)
      || a.wordId.localeCompare(b.wordId));

  // הפרוסה: הרמה מחולקת ל-`slicesInBand` חלקים שווים לפי תדירות יורדת, והרמה
  // הזאת לוקחת את החלק שלה. ⛔ החלון לעולם אינו קטן מ-ARCADE_MIN_WORDS — פרוסה
  // דקה מדי הייתה מחזירה `level_too_small` על רמה שיש בה מספיק מילים.
  const sliceSize = Math.max(ARCADE_MIN_WORDS, Math.ceil(byRank.length / rung.slicesInBand));
  const offset = Math.min(rung.sliceIndex * sliceSize, Math.max(0, byRank.length - sliceSize));
  const window = byRank.slice(offset, offset + sliceSize);

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
  return { ok: true, band: rung.band, gameLevel: rung.level, questions };
}
```

⚠️ `eligibleCandidates` ו-`isEligible` נשארים בדיוק כפי שהם — הם כבר מקבלים `CefrBand` מפורש.

- [ ] **Step 4: הרץ את בדיקות הליבה**

Run: `npx vitest run lib/core/arcadeRound.test.ts`
Expected: PASS. אם בדיקה ישנה עדיין מוסרת `level: 'A1'` — החלף אותה ל-`gameLevel: 1`; ⛔ אל תוסיף שכבת תאימות.

- [ ] **Step 5: הסר את קריאת הפרופיל מהנתיב**

ב-`app/api/arcade/round/route.ts`:

1. מחק את הבלוק כולו (שורות 41–51 בגרסה שלפני העריכה) — `supabase.from('profiles').select('current_level')`, טיפול השגיאה שלו, ואת שתי שורות ה-`parseLevel` שאחריו.
2. שנה את ה-`import` של `parseLevel` — הוא עדיין דרוש למיפוי `cefr_profile_band` של המועמדים, ⛔ ולא לפרופיל.
3. קרא את רמת המשחק **ראשונה**, והחלף את גוף הסיום:

```ts
  const gameLevel = (progressRow as { arcade_level?: number } | null)?.arcade_level ?? 1;
  const rung = gameLevelAt(gameLevel);
  // ⛔ רמה מחוץ לסולם היא שורה פגומה בדאטהבייס, ⛔ לא מצב לומד: נופלים לרמה 1
  // ⛔ ולא ל-503, כי הזירה אינה כלי אבחון ולומד ⛔ אינו רואה מסך שגיאה על מונה.
  const band = (rung ?? gameLevelAt(1))?.band ?? 'A1';

  const { data, error } = await supabase
    .from('words')
    .select(ROUND_SELECT)
    .eq('cefr_profile_band', band)
    .order('ngsl_rank', { nullsFirst: false })
    .order('id')
    .limit(MAX_LEVEL_ROWS);
```

ואת סוף הפונקציה:

```ts
  const seed = Date.now() >>> 0;
  const round = buildRound({ gameLevel: rung === null ? 1 : gameLevel, candidates, seed });

  if (!round.ok) {
    const eligible = round.reason === 'level_too_small' ? round.eligible : 0;
    // ⛔ לא מסך ריק ו⛔ לא בשקט: מספר (D-046 · «נדרשות 12 מילים, יש 8»).
    return NextResponse.json({
      ok: true, gameLevel, band, round: null,
      ...describeLevel(gameLevel, eligible),
      reason: round.reason,
    });
  }
  return NextResponse.json({
    ok: true, gameLevel: round.gameLevel, band: round.band, seed,
    round: { questions: round.questions },
  });
```

4. הוסף ל-`import` בראש הקובץ: `import { describeLevel, gameLevelAt } from '@/lib/core/arcadeLadder';`

⛔ **הבלוק `{ ok: true, level: null, round: null }` נמחק כולו** — «הלומד טרם בחר רמה» חדל להיות מצב של הזירה, כי הזירה אינה יודעת שקיימת רמת לומד.

- [ ] **Step 6: עדכן את `docs/api-contract.md` באותו קומיט**

בסעיף `## GET /api/arcade/round`:
- החלף את `level` ב-`gameLevel` (מספר 1–12) ו-`band` (‏`CefrBand`) בטבלת שדות התשובה.
- מחק את השורה שמתארת `{ok:true, level:null, round:null}` והחלף אותה במשפט: *«⛔ אין יותר מצב «טרם בחר רמה» — רמת המשחק מתחילה ב-1 לכל לומד (D-052).»*
- הוסף לשורת הטבלאות הנקראות: *«`arcade_progress` · `words`, שתיהן בקריאה. ⛔ `profiles` ⛔ אינה נקראת (D-052, נאכף בסריקת מקור ב-`route.test.ts`).»*
- החלף «8 שאלות» ב-«15 שאלות (`ARCADE_AMMO`)».

- [ ] **Step 7: תקן את ההערה המיושנת ב-`app/dev/arcade/page.tsx:25`**

החלף `Eight questions` ב-`Fifteen questions` ואת `ARCADE_ROUND_SIZE` is 8 ב-`ARCADE_ROUND_SIZE` is 15.

- [ ] **Step 8: אימות מלא וקומיט**

Run: `npm run typecheck && npm run check:core && npm test && npm run build`
Expected: כל ארבע עוברות. ⚠️ אם `route.test.ts` הישן טוען `level: null` — הבדיקה מתארת מפרט שבוטל; החלף אותה בבדיקה על `gameLevel: 1`.

```bash
git add lib/core/arcadeRound.ts lib/core/arcadeRound.test.ts app/api/arcade/round/route.ts \
        app/api/arcade/round/route.test.ts app/dev/arcade/page.tsx docs/api-contract.md
git commit -m "loop(DEV): T-108 הסיבוב נגזר מרמת המשחק — profiles.current_level יורד מהזירה"
```

---

### Task 4: תנאי הסיום של הקרב (T-116)

**Files:**
- Modify: `lib/core/arcadeBattle.ts`
- Modify: `lib/core/arcadeBattle.test.ts`
- Modify: `lib/core/arcadeResult.ts`
- Modify: `lib/core/arcadeResult.test.ts`
- Modify: `app/api/arcade/result/route.ts:59-95`
- Modify: `app/api/arcade/result/route.test.ts`
- Modify: `docs/api-contract.md` (‏`POST /api/arcade/result`)

**Interfaces:**
- Consumes: `ARCADE_ENEMY_HP` · `ARCADE_AMMO` · `isVictory` · `applyWin` מ-Task 2.
- Produces:
  - `battleOutcome(state: BattleState): 'running' | 'victory' | 'survived'`
  - `planArcadeWrites` בחתימה **בלי** `enemyHp`: `{ userId: string; answers: readonly ArcadeAnswer[]; before: { gameLevel: number; wins: number; unlockedItems: readonly string[] }; finishedAt: string }`
  - `ArcadeWritePlan` מקבל `readonly outcome: 'victory' | 'survived'` ו-`readonly leveledUp: boolean` בנוסף לשדות הקיימים.

⛔ **`enemyHp` מפסיק להגיע מהלקוח.** לקוח ששולח `enemyHp: 1` היה מנצח בתשובה נכונה אחת — הקבוע חי בשרת, והשדה בגוף הבקשה מתעלמים ממנו.

- [ ] **Step 1: כתוב את הבדיקות הנופלות**

הוסף ל-`lib/core/arcadeBattle.test.ts`:

```ts
import { ARCADE_AMMO, ARCADE_ENEMY_HP } from './arcadeLadder';
import { battleOutcome } from './arcadeBattle';

describe('D-059 — שני מוצאים בלבד מהקרב', () => {
  const q = (i: number) => ({ wordId: `w${i}`, headword: `w${i}`, answer: 'נכון', options: ['נכון', 'א', 'ב', 'ג'] });
  const questions = Array.from({ length: ARCADE_AMMO }, (_, i) => q(i));

  function play(correctCount: number) {
    let s = startBattle(questions);
    for (let i = 0; i < ARCADE_AMMO; i += 1) {
      s = advance(chooseOption(s, i < correctCount ? 'נכון' : 'א'));
    }
    return s;
  }

  it('היריב מתחיל עם 10 חיים, ⛔ לא 5', () => {
    expect(startBattle(questions).enemyHp).toBe(ARCADE_ENEMY_HP);
    expect(ARCADE_ENEMY_HP).toBe(10);
  });

  it('10 נכונות מתוך 15 ⇒ ניצחון', () => {
    expect(battleOutcome(play(10))).toBe('victory');
  });

  it('9 נכונות מתוך 15 ⇒ «היריב שרד», ⛔ ולא «הפסד»', () => {
    expect(battleOutcome(play(9))).toBe('survived');
  });

  it('⛔ תשובה שגויה ⛔ אינה מרפאת את היריב ו⛔ אינה מסיימת את הקרב', () => {
    let s = startBattle(questions);
    s = advance(chooseOption(s, 'נכון'));
    const hpAfterHit = s.enemyHp;
    s = advance(chooseOption(s, 'א'));
    expect(s.enemyHp).toBe(hpAfterHit);
    expect(battleOutcome(s)).toBe('running');
  });

  it('הקרב באמצע ⇒ running', () => {
    expect(battleOutcome(startBattle(questions))).toBe('running');
  });
});
```

הוסף ל-`lib/core/arcadeResult.test.ts`:

```ts
describe('D-061 — ניצחון מקדם מונה, ⛔ ולא רמה', () => {
  const answers = (correct: number) =>
    Array.from({ length: 15 }, (_, i) => ({
      wordId: `w${i}`, correct: i < correct, chosen: 'x', answer: 'נכון',
    }));

  const plan = (correct: number, before: { gameLevel: number; wins: number }) =>
    planArcadeWrites({
      userId: 'u1', answers: answers(correct),
      before: { ...before, unlockedItems: [] },
      finishedAt: '2026-08-19T12:00:00.000Z',
    });

  it('ניצחון ראשון: המונה עולה, הרמה ⛔ לא', () => {
    const p = plan(10, { gameLevel: 2, wins: 0 });
    expect(p.outcome).toBe('victory');
    expect(p.leveledUp).toBe(false);
    expect(p.rows[0]?.values).toMatchObject({ arcade_level: 2, wins: 1 });
  });

  it('ניצחון שלישי: הרמה עולה והמונה מתאפס', () => {
    const p = plan(12, { gameLevel: 2, wins: 2 });
    expect(p.leveledUp).toBe(true);
    expect(p.rows[0]?.values).toMatchObject({ arcade_level: 3, wins: 0 });
  });

  it('⛔ «היריב שרד» ⛔ אינו מוריד דבר — לא רמה, לא מונה, לא פריטים', () => {
    const p = plan(9, { gameLevel: 5, wins: 2 });
    expect(p.outcome).toBe('survived');
    expect(p.leveledUp).toBe(false);
    expect(p.unlocked).toBeNull();
    expect(p.rows[0]?.values).toMatchObject({ arcade_level: 5, wins: 2 });
  });

  it('⛔ הכתיבה עדיין נוגעת בשתי טבלאות הזירה בלבד (D-044)', () => {
    const p = plan(10, { gameLevel: 1, wins: 0 });
    expect([...new Set(p.rows.map((r) => r.table))].sort()).toEqual(['arcade_progress', 'arcade_runs']);
  });
});
```

והוסף ל-`app/api/arcade/result/route.test.ts` את בדיקת המחרוזת האסורה:

```ts
describe('D-059 — ⛔ המילה «הפסדת» אינה קיימת במוצר', () => {
  const files = [
    'components/ArenaBoard.tsx', 'components/ArenaResult.tsx', 'components/ArenaAvatar.tsx',
    'components/ArcadeEntry.tsx', 'lib/core/arcadeBattle.ts', 'lib/core/arcadeResult.ts',
  ];
  it.each(files)('⛔ %s אינו מכיל «הפסדת»', (file) => {
    expect(readFileSync(file, 'utf8')).not.toContain('הפסדת');
  });

  it('⛔ ואינו מכיל «הפסד» כמילה עצמאית', () => {
    for (const file of files) {
      expect(withoutComments(readFileSync(file, 'utf8'))).not.toMatch(/הפסד\b/);
    }
  });
});
```

- [ ] **Step 2: הרץ ואמת שהן נופלות**

Run: `npx vitest run lib/core/arcadeBattle.test.ts lib/core/arcadeResult.test.ts app/api/arcade/result/route.test.ts`
Expected: FAIL — `battleOutcome is not exported`, ו-`expected 5 to be 10`.

- [ ] **Step 3: עדכן את `lib/core/arcadeBattle.ts`**

```ts
import { ARCADE_ENEMY_HP } from './arcadeLadder';

// ⛔ הקבוע חי ב-arcadeLadder (D-059). זה re-export לתאימות של `components/ArenaBoard.tsx`.
export { ARCADE_ENEMY_HP };

export type BattleOutcome = 'running' | 'victory' | 'survived';

/**
 * ⛔ שני מוצאים בלבד, ⛔ ואין שלישי: «ניצחון» או «היריב שרד».
 * ⛔ תשובה שגויה אינה מסיימת דבר — היא קליע שבוזבז (D-059).
 */
export function battleOutcome(state: BattleState): BattleOutcome {
  if (state.enemyHp === 0) return 'victory';
  if (state.index >= state.questions.length) return 'survived';
  return 'running';
}
```

מחק את `export const ARCADE_ENEMY_HP = 5;` ואת הערת ה-JSDoc שמעליה (שמצטטת «5» ו-«8»), והשאר את `isFinished` ו-`enemyDefeated` כפי שהם — הם עדיין נכונים ומשמשים את `ArenaBoard`.

- [ ] **Step 4: עדכן את `lib/core/arcadeResult.ts`**

```ts
import { applyWin, isVictory } from './arcadeLadder';

export interface ArcadeWritePlan {
  readonly rows: readonly ArcadeWriteRow[];
  readonly enemyDefeated: boolean;
  readonly outcome: 'victory' | 'survived';
  readonly leveledUp: boolean;
  readonly unlocked: string | null;
  readonly missed: readonly { readonly wordId: string; readonly answer: string; readonly chosen: string }[];
}

export function planArcadeWrites(input: {
  readonly userId: string;
  readonly answers: readonly ArcadeAnswer[];
  readonly before: { readonly gameLevel: number; readonly wins: number; readonly unlockedItems: readonly string[] };
  readonly finishedAt: string;
}): ArcadeWritePlan {
  const correct = input.answers.filter((a) => a.correct).length;
  // ⛔ הסף מגיע מהקבוע ⛔ ולא מהלקוח: `enemyHp` בגוף הבקשה היה מאפשר ניצחון בתשובה אחת.
  const won = isVictory(correct);
  const after = won
    ? applyWin({ level: input.before.gameLevel, wins: input.before.wins })
    : { level: input.before.gameLevel, wins: input.before.wins, leveledUp: false };

  const held = new Set(input.before.unlockedItems);
  // ⛔ פריט נפתח בעליית **רמה**, ⛔ ולא בכל ניצחון (D-061: «כל רמה שנפתחת פותחת פריט אחד»).
  const next = after.leveledUp ? ARCADE_ITEMS.find((i) => !held.has(i)) ?? null : null;
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
          arcade_level: after.level,
          wins: after.wins,
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
          enemy_defeated: won,
        },
      },
    ],
    enemyDefeated: won,
    outcome: won ? 'victory' : 'survived',
    leveledUp: after.leveledUp,
    unlocked: next,
    missed,
  };
}
```

- [ ] **Step 5: עדכן את `app/api/arcade/result/route.ts`**

1. מחק את בלוק `const enemyHp = ...` (שורות 59–62) ואת `enemyHp === null` מתנאי ה-422 — התנאי נשאר `if (answers === null)`.
2. שנה את `before` ל-`{ gameLevel: row?.arcade_level ?? 1, wins: row?.wins ?? 0, unlockedItems: row?.unlocked_items ?? [] }` והסר את `enemyHp` מהקריאה.
3. הוסף לתשובה: `outcome: plan.outcome` ו-`leveledUp: plan.leveledUp`.

⚠️ `components/ArenaBoard.tsx:217` עדיין שולח `enemyHp` בגוף — ⛔ אל תמחק את השדה מהלקוח בטיק הזה; השרת פשוט מתעלם ממנו, וההסרה מהלקוח שייכת ל-T-117 שנוגעת ממילא בקובץ.

- [ ] **Step 6: עדכן את `docs/api-contract.md` באותו קומיט**

בסעיף `## POST /api/arcade/result`:
- החלף בטבלת התשובה את שורת `enemyDefeated` ב: *«`correct ≥ 10` (‏`ARCADE_ENEMY_HP`). ניצחון מעלה את מונה הניצחונות; **שלושה** מעלים `arcade_level` ב-1, מאפסים את המונה ופותחים **פריט אחד** (D-061).»*
- הוסף שתי שורות: `outcome` (‏`'victory' | 'survived'`) ו-`leveledUp` (‏`boolean`).
- הוסף אזהרה: *«⛔ `enemyHp` בגוף הבקשה ⛔ אינו נקרא. הסף הוא קבוע שרת (D-059) — לקוח ששולח `enemyHp: 1` ⛔ אינו מנצח בתשובה אחת.»*
- החלף את דוגמת הבקשה מ-`enemyHp: 5` ל-15 תשובות בלי השדה.

- [ ] **Step 7: אימות מלא וקומיט**

Run: `npm run typecheck && npm run check:core && npm test && npm run build`
Expected: כל ארבע עוברות. ⚠️ בדיקות ישנות ב-`arcadeResult.test.ts` שמוסרות `enemyHp: 5` ומצפות לעליית רמה בכל ניצחון — **מתארות מפרט שבוטל ב-D-061**; מחק אותן, ⛔ אל תשמר אותן.

```bash
git add lib/core/arcadeBattle.ts lib/core/arcadeBattle.test.ts lib/core/arcadeResult.ts \
        lib/core/arcadeResult.test.ts app/api/arcade/result/route.ts \
        app/api/arcade/result/route.test.ts docs/api-contract.md
git commit -m "loop(DEV): T-116 תנאי הסיום — ניצחון או «היריב שרד», 3 ניצחונות לרמה"
```

---

## בדיקה עצמית של התוכנית (בוצעה בטיק התכנון C-0193)

**כיסוי מול המפרט:** T-107 ⇒ Task 1 (בסטייה מתועדת אחת, F-073) · T-115 ⇒ Task 2 (שלושת הקבועים ⓐ · טבלת 12 הרמות ⓑ · `ARENA_IDLE_LOOP` ⓒ, וכל שלוש הבדיקות שהמשימה נוקבת בהן) · T-108 ⇒ Task 3 (הסרת `current_level` · הסולם במקום אחד · סריקת המקור · `cefr_profile_band` נשמר) · T-116 ⇒ Task 4 (שני המוצאים · שגויה אינה מרפאת ואינה מסיימת · «הפסדת» נסרקת · אין ירידת רמה · 3 ניצחונות).

**מה ⛔ אינו בתוכנית הזאת, במכוון:** T-109 · T-110 · T-117 · T-118 — הראשונות שתיים הן מסך וכתיבה על טבלת האוסף, T-117 היא במה, ו-T-118 תלויה ב-T-109. הן תוכנית נפרדת מעל הסכמה שנחתה כאן.

**עקביות טיפוסים:** `gameLevel` הוא `number` בכל ארבע המשימות · `band` הוא `CefrBand` · `before.gameLevel` ב-`planArcadeWrites` מוזן מ-`arcade_progress.arcade_level` · `applyWin` מקבל `{level, wins}` ומחזיר `{level, wins, leveledUp}` בדיוק כפי שנקרא ב-Task 4.

**סיכון ידוע שנרשם ⛔ ולא הוסתר:** Task 3 משנה את חוזה `GET /api/arcade/round` (‏`level` ⇒ `gameLevel` + `band`). `components/ArenaBoard.tsx` צורך `questions` בלבד, אבל `app/arcade/page.tsx` עשוי לקרוא `level` — **בדוק בגריפ לפני Step 5 של Task 3** ותקן באותו קומיט.
