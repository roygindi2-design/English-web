# Story Schema and Content Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** להנחית את **שני הצעדים הראשונים** של «סיפור אחד ביום» (§ 4.2יג) — **T-134** (סכמה + שער טהור לסוג התוכן «סיפור») ו-**T-135** (הוראת הייצור לסוכן ה-Content + סקריפט הקליטה) — כך ש-T-136 (המסך) ו-T-137 (האריח) יוכלו להיבנות מעל תוכן שכבר עבר שער.

**Architecture:** שלוש שכבות, בדיוק כמו צינור התוכן הקיים (`batch-*.jsonl` → `gateSense` → `build-ingest-sql.mjs` → `supabase/seed/0001_content_batches.sql`), ⛔ ולא צינור חדש:
1. **סכמה** — `supabase/migrations/0018_stories.sql`: טבלה אחת, `origin` נעול על `'generated'` (§ 7.6), `cefr_level` נעול על ארבע רמות (⛔ ⛔ C1/C2 — R-021), RLS קריאה בלבד לכל מחובר ו⛔ אפס מדיניות כתיבה מהלקוח.
2. **שער טהור** — `lib/core/storyGate.ts`: מקבל טקסט + קבוצת למות מורשות ומחזיר `{ok, unknownWords}`. ⛔ אפס I/O, אפס `fetch`, אפס `process.env`.
3. **קליטה** — `scripts/build-stories-sql.mjs`: בונה את קבוצת הלמות המורשות **לרמה** מתוך אותם שני מקורות ש-`build-word-levels-sql.mjs` כבר משתמש בהם (`data/generated/batch-*.jsonl` + שני פרופילי ה-CEFR), מריץ את השער על כל סיפור **שוב** (R-014), ופולט `supabase/seed/0004_stories.sql`.

**Tech Stack:** TypeScript (ללא `any`) · Node ESM scripts (`registerHooks` preamble, ⛔ בלי שלב בנייה ובלי תלות חדשה) · Postgres/Supabase · Vitest.

**Spec:** `plan/40-decisions.md` § 4.2יג (‏שורה 1953) · **D-073** · **D-054** · **D-046** · `plan/15-syllabus-digest.md` (שורת «הספרייה») · שורות המשימה `plan/50-tasks.md` — **T-134** (שורה 189) ו-**T-135** (שורה 190) · § 7.6 · **R-021** · **F-020**.

## Global Constraints

- ⛔ `/lib/core/` טהור: אפס React · `window` · `document` · `localStorage` · `sessionStorage` · `process.env` · `fetch` (`scripts/check-core-purity.mjs`).
- ⛔ **הספרייה 🔗 מצומדת לצד הלימודי** (D-054): אף קובץ בתוכנית הזאת ⛔ אינו מזכיר `arcade_collected_words`. נאכף בבדיקה בשם.
- ⛔ **אפס תוכן לימודי מומצא בידי Dev** — התוכנית כותבת את **ההוראה** ואת **הסקריפט**, ⛔ ולא ולו סיפור אחד. ⛔ אפס העתקה ממאל"ו (R-010) ומ-AnkiWeb (R-013).
- ⛔ **תוכן AI אינו מקור פדגוגי ולעולם מסומן**: `origin='generated'` **not null** עם `check` בשם (§ 7.6).
- ⛔ **ארבע רמות בלבד: `A1·A2·B1·B2`.** C1/C2 ⛔ אינם חוקיים בסכמה — R-021 מדד אפס מילים בשתיהן.
- מיגרציה: `begin;`/`commit;` · `if not exists` על כל אובייקט · כל אילוץ **בשם ובנפרד** בתוך `do $$` ⛔ ולא בתוך `create table` (הלקח של C-0032) · **המספר הוא `0018`** — `scripts/migration-hygiene.test.ts` («leaves no gap in the sequence») מפיל כל דילוג.
- קובץ seed ⛔ **אינו נערך ביד לעולם** — הוא נפלט מהסקריפט. פלט הבדיקה מכוון ל-`SEED_OUT_DIR` ⛔ ואינו דורס את הקובץ המנוהל בגיט (F-048ⓑ).
- TypeScript ללא `any`.
- פקודת האימות המלאה, ⛔ ואין טענת הצלחה בלעדיה:
  `npm run typecheck && npm run check:core && npm test && npm run build`

---

## ארבע סטיות מוצהרות, ⛔ ולא השמטות

### סטייה 1 — כלל ההתאמה בשער: **הפחתת סיומות אל למה שבבנק + מפה סגורה של צורות חריגות**, ⛔ ולא השוואה מילולית

T-134ⓑ אוסרת לייבא את `inflections()` (‏ה-false-accept של F-020) ומורה «התאמה על **למה מנורמלת** בלבד». ⛔ **הנוסח אינו מגדיר את הנרמול, וההבדל נמדד ⛔ ולא שוער** (מדידה C-0245, על הבנק האמיתי: 495 למות, מהן **294 A1**):

| כלל ההתאמה | טוקנים נבדלים שנפסלו מתוך 55 בסיפור A1 סביר |
|---|---|
| השוואה מילולית ללמה | **19** — `opens · wants · looks · asks · says · walks · finds · gives · takes · reads · tells` ועוד |
| הפחתת סיומות אל למה שבבנק | **8**, מהם **6 פערי אוצר מילים אמיתיים** (‏`door · table · behind · evening · part · low`), **1 שם פרטי**, ו-**1 צורה חריגה** (`is` ← `be`, שהיא A1 בבנק) |

⇒ השוואה מילולית פוסלת **כל צורת גוף שלישי** ⇒ ⛔ **אין אנגלית תקנית שעוברת** ⇒ **T-135 לא הייתה יכולה להיסגר לעולם.** הכלל שנבחר הוא בדיוק «למה מנורמלת»: הטוקן **מוּפחת** ללמה ואז מושווה, ⛔ והלמה ⛔ אינה מורחבת לצורות. הכיוון הזה ⛔ **אינו** ה-false-accept של F-020: `car`+`d`=`card` נולד מהרחבה, והפחתה ⛔ אינה מייצרת אותו (`card` ⛔ אינו נחתך ל-`car` — אין כלל סיומת `-d`).

**הצורות החריגות** (`is` · `has` · `said` · `took`) ⛔ אינן נגישות לשום כלל סיומת, ולכן מפה **סגורה ומוצהרת** יושבת בקובץ — בדיוק התקדים של `CONTRACTION_STEMS` ב-`lib/core/contentSchema.ts:74` (`wo→will · ca→can · sha→shall`), ⛔ ולא המצאה חדשה. ⛔ **המפה ממפה צורה ללמה בלבד** — היא ⛔ אינה מכניסה למה לבנק, ואם הלמה אינה ברמה, הטוקן נפסל.

⚠️ **המחיר, מוצהר:** `printer` יעבור אם `print` בבנק, כלומר השער **מקל** על נגזרות. זו בדיוק ההקלה שהשער הקיים כבר נושא (`targetForms` מוסיף `${w}ly` לכל טוקן), ⇒ ⛔ אין כאן החמרה ולא הרעה. נרשם כ-**F-095 🟡 → CRITIC/PM**.

### סטייה 2 — ⛔ **אפס שמות פרטיים בסיפור**, ⛔ ולא «אין שמות אמיתיים» בלבד

T-135ⓒ אוסרת «שמות אמיתיים». נמדד: **כל** טוקן של שם פרטי (‏גם בדוי — `Dana`) ⛔ אינו למה בבנק ⇒ נפסל בשער. ⇒ ההוראה מחייבת דמויות **בתיאור** (‏`the girl` · `her teacher` · `my brother`), ⛔ ולא בשם. זו תוצאה של השער, ⛔ ולא טעם ספרותי.

### סטייה 3 — שני קבצי בדיקה **נוספים** על רשימות הקבצים של T-134 ו-T-135

`lib/supabase/stories.test.ts` (שומר המיגרציה) ו-`scripts/content-brief.test.ts` (שומר הסחיפה של ההוראה). הנימוק מדיד: **לכל מיגרציה בפרויקט יש שומר** (`arcade.test.ts` · `arcadeDecoupling.test.ts` · `arcadeRunId.test.ts` · `worldSchema.test.ts` · `lexicalClassBackfill.test.ts`), ומסמך הוראה שמספריו ⛔ אינם נמדדים מול הקוד הוא בדיוק הסחיפה של F-087.

### סטייה 4 — `supabase/seed/0004_stories.sql` **נפלט**, ⛔ ואינו נכתב בטיק הזה

T-135ⓕ מחייבת «3 בדיוק בכל אחת מארבע הרמות ⇒ 11 או 13 מפילים את הסקריפט **בשם**». ⇒ כל עוד `data/generated/stories-*.jsonl` ⛔ אינו קיים, הסקריפט **נעצר בשם** ו⛔ אינו פולט קובץ חלקי. הקובץ נולד בטיק ה-Content, ⛔ ולא כאן. הבדיקות מוכיחות את שני המסלולים על פיקסטורות בתיקייה זמנית.

---

## File Structure

| הקובץ | האחריות |
|---|---|
| `supabase/migrations/0018_stories.sql` | **צור.** טבלת `stories` אחת · שני אילוצים בשם · RLS קריאה בלבד · אינדקס אחד. ⛔ אפס מפתח זר לצד הלימודי. |
| `lib/supabase/stories.test.ts` | **צור.** שומר טקסטואלי על המיגרציה: אידמפוטנטיות · האילוצים בשם · ⛔ אפס C1/C2 · ⛔ אפס מדיניות כתיבה · ⛔ אפס `arcade_collected_words`. |
| `lib/core/storyGate.ts` | **צור.** טהור: הקבועים (`STORY_LEVELS` · `STORIES_PER_LEVEL` · `STORY_MIN_WORDS` · `STORY_MAX_WORDS`) · `parseStoryFile` · `allowedLemmasAtOrBelow` · `storyLemma` · `storyGate`. |
| `lib/core/storyGate.test.ts` | **צור.** מילה זרה אחת ⇒ `ok:false` ושמה ברשימה · הפחתת סיומות · המפה החריגה · גבולות אורך · ספירת רמות. |
| `docs/content-stories-brief.md` | **צור.** הוראת הייצור לסוכן ה-Content — ⛔ מפרט, ⛔ לא קוד. |
| `scripts/content-brief.test.ts` | **צור.** שער סחיפה: כל מספר בהוראה נמדד מול הקבוע ב-`lib/core/storyGate.ts`. |
| `scripts/build-stories-sql.mjs` | **צור.** השכבה הלא-טהורה היחידה: קורא, משער שוב (R-014), פולט SQL. |
| `scripts/build-stories-sql.test.ts` | **צור.** פיקסטורות בתיקייה זמנית: 12 עוברות ⇒ SQL · 11 ⇒ נפילה בשם · מילה מחוץ לרמה ⇒ נפילה בשם. |
| `package.json` | **ערוך.** `"build:stories": "node scripts/build-stories-sql.mjs"`. |

---

## Task 1: מיגרציה `0018_stories.sql` + השומר שלה  *(T-134ⓐ)*

**Files:**
- Create: `supabase/migrations/0018_stories.sql`
- Create: `lib/supabase/stories.test.ts`

**Interfaces:**
- Consumes: ⛔ כלום. זו המשימה הראשונה ברצף.
- Produces: הטבלה `public.stories(id uuid, cefr_level text, title_en text, body_en text, origin text, created_at timestamptz)` עם `unique (cefr_level, title_en)`. Task 4 פולט `insert … on conflict (cefr_level, title_en) do nothing` נגד הצורה הזאת בדיוק, ו-T-136 יקרא ממנה.

- [ ] **Step 1: כתוב את בדיקת השומר — היא נופלת כי אין קובץ**

```ts
// lib/supabase/stories.test.ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * שומר על `0018_stories.sql` (T-134ⓐ). כמו `arcadeRunId.test.ts`: מוכיח מה הקובץ
 * **אומר**, ⛔ לא שהוא הורץ (הרצה = פעולת רוי). ההערות מולבנות לפני כל טענה —
 * אילוץ שהוער החוצה אינו אילוץ (F-087 · F-088).
 */
const SQL = readFileSync('supabase/migrations/0018_stories.sql', 'utf8');
const BODY = SQL.replace(/--[^\n]*$/gm, '');

describe('0018 — אידמפוטנטיות של המיגרציה עצמה', () => {
  it('רצה בטרנזקציה אחת', () => {
    expect(BODY).toMatch(/^\s*begin;/im);
    expect(BODY).toMatch(/commit;\s*$/im);
  });

  it('הטבלה נוצרת עם if not exists — הרצה שנייה ⛔ אינה נופלת', () => {
    expect(BODY).toMatch(/create table if not exists\s+public\.stories/i);
  });

  it('⛔ אף אילוץ ⛔ אינו מוצהר בתוך create table — הוא היה מדולג בהרצה שנייה (C-0032)', () => {
    const create = BODY.slice(BODY.indexOf('create table'), BODY.indexOf('do $$'));
    expect(create).not.toMatch(/\bcheck\s*\(/i);
  });

  it('שני האילוצים מוצהרים בשם בתוך do $$', () => {
    expect(BODY).toMatch(/conname = 'stories_level_check'/);
    expect(BODY).toMatch(/conname = 'stories_origin_check'/);
    expect(BODY).toMatch(/add constraint stories_level_check/i);
    expect(BODY).toMatch(/add constraint stories_origin_check/i);
  });
});

describe('§ 7.6 · R-021 — מה שהסכמה ⛔ אינה מרשה', () => {
  it('origin נעול על generated בלבד, ו-not null', () => {
    expect(BODY).toMatch(/origin\s+text not null/i);
    const check = BODY.slice(BODY.indexOf('stories_origin_check'));
    expect(check).toMatch(/origin\s*=\s*'generated'/i);
    for (const banned of ['seed', 'ngsl', 'human']) expect(check).not.toContain(`'${banned}'`);
  });

  it('⛔ C1 ו-C2 ⛔ אינם רמות חוקיות — R-021 מדד אפס מילים בשתיהן', () => {
    const check = BODY.slice(BODY.indexOf('stories_level_check'));
    const head = check.slice(0, check.indexOf('end if'));
    expect(head).toMatch(/'A1'/);
    expect(head).toMatch(/'B2'/);
    expect(head).not.toMatch(/'C1'/);
    expect(head).not.toMatch(/'C2'/);
  });
});

describe('RLS — קריאה לכל מחובר, ⛔ אפס כתיבה מהלקוח', () => {
  it('RLS מופעלת על טבלה חדשה', () => {
    expect(BODY).toMatch(/alter table public\.stories\s+enable row level security/i);
  });

  it('מדיניות SELECT אחת ויחידה', () => {
    const policies = [...BODY.matchAll(/create policy "([^"]+)"/g)].map((m) => m[1]);
    expect(policies).toEqual(['stories_select_all']);
  });

  it('⛔ אין ולו grant אחד של insert/update/delete על הטבלה', () => {
    const grants = [...BODY.matchAll(/^\s*grant\s+([^;]+);/gim)].map((m) => m[1]);
    expect(grants.length).toBeGreaterThan(0);
    for (const g of grants) {
      expect(g).not.toMatch(/\binsert\b/i);
      expect(g).not.toMatch(/\bupdate\b/i);
      expect(g).not.toMatch(/\bdelete\b/i);
    }
  });

  it('revoke קודם ל-grant — default privileges של Supabase הם ALL', () => {
    expect(BODY.indexOf('revoke all')).toBeGreaterThan(-1);
    expect(BODY.indexOf('revoke all')).toBeLessThan(BODY.indexOf('grant select'));
  });
});

describe('⛔ הגבול של D-054 — הספרייה מצומדת לצד הלימודי, ⛔ ולא לזירה', () => {
  it.each(['arcade_collected_words', 'arcade_progress', 'arcade_runs'])(
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

Run: `npx vitest run lib/supabase/stories.test.ts`
Expected: FAIL — `ENOENT: no such file or directory, open 'supabase/migrations/0018_stories.sql'`

- [ ] **Step 3: כתוב את המיגרציה**

```sql
-- 0018_stories.sql — טבלת «סיפור» אחת (T-134ⓐ · § 4.2יג · D-073).
--
-- מוחל בעורך ה-SQL של Supabase (או `supabase db push`) אחרי 0017.
--
-- ⛔ **תוכן AI אינו מקור פדגוגי ולעולם מסומן** (§ 7.6): `origin` הוא not null עם
-- `check` בשם מול `'generated'` בלבד. סיפור הוא **הקשר לתרגול**, ⛔ ולא ידע.
--
-- ⛔ **ארבע רמות, ⛔ ולא שש** (R-021): C1 ו-C2 מודדות אפס מילים בבנק, ולכן סיפור
-- ברמה כזאת הוא שורה שאין לה ולו לומד אחד שיכול לקרוא אותה.
--
-- ⛔ **אין כאן ולו מפתח זר אחד לזירה** (D-054): הספרייה 🔗 מצומדת לצד הלימודי,
-- והמילה שהוקשה בסיפור נכתבת ל-`word_progress` דרך מסלול הכרטיסייה — ⛔ ⛔ לא
-- ל-`arcade_collected_words`. הגבול נאכף כאן בהיעדר, ⛔ ולא רק בקוד.
--
-- ⛔ **הלקוח ⛔ אינו כותב**: RLS מרשה `select` בלבד, ו-`grant` נוקב בפועל אחד.
-- קליטה נעשית בקובץ seed שרוי מריץ, בדיוק כמו 0001 ו-0003.
--
-- אידמפוטנטי: `create table if not exists`, וכל אילוץ **בשם ובנפרד** בתוך `do $$` —
-- `create table … check` מדולג **כולו** כשהטבלה כבר קיימת (נמדד C-0032).

begin;

create table if not exists public.stories (
  id         uuid primary key default gen_random_uuid(),
  cefr_level text not null,
  title_en   text not null,
  body_en    text not null,
  origin     text not null,
  created_at timestamptz not null default now(),
  unique (cefr_level, title_en)
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'stories_level_check') then
    alter table public.stories
      add constraint stories_level_check
      check (cefr_level in ('A1', 'A2', 'B1', 'B2'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'stories_origin_check') then
    alter table public.stories
      add constraint stories_origin_check
      check (origin = 'generated');
  end if;
end $$;

comment on table public.stories is
  '§ 4.2יג · D-073: סיפור קצר אחד, מיוצר אצלנו. ⛔ אינו מקור פדגוגי (§ 7.6) —
   הוא ההקשר שהכרטיסייה ⛔ אינה מספקת. ⛔ אין כאן שאלה, ציון או תשובה נכונה.';

comment on column public.stories.origin is
  '§ 7.6: תוכן AI מסומן **תמיד**. הערך היחיד המותר הוא generated, ⛔ ואין ערך
   ברירת מחדל — שורה בלי מקור מוצהר ⛔ אינה נכתבת.';

comment on column public.stories.cefr_level is
  'R-021: ארבע רמות בלבד. C1/C2 מודדות אפס מילים בבנק ⇒ סיפור כזה ⛔ אינו קריא
   לאף לומד. ⛔ זו ⛔ אינה senses.cefr_level ו⛔ אינה words.cefr_profile_band.';

-- הקריאה היחידה של המסך: (הרמה של הלומד, הסיפורים בה לפי זמן).
create index if not exists stories_level_created_idx
  on public.stories (cefr_level, created_at desc);

alter table public.stories enable row level security;

drop policy if exists "stories_select_all" on public.stories;
create policy "stories_select_all" on public.stories
  for select to authenticated using (true);

-- Supabase נותנת ALL ל-anon ול-authenticated דרך default privileges, ולכן `grant`
-- לבדו הוא no-op ו-RLS נשארת ההגנה היחידה — ו-RLS ⛔ אינה חוסמת TRUNCATE.
revoke all on public.stories from authenticated, anon;

grant select on public.stories to authenticated;
-- ⛔ אין insert · update · delete: הקליטה היא קובץ seed, ⛔ ולא פעולת לקוח.
-- ⛔ anon אינו מקבל דבר.

commit;
```

- [ ] **Step 4: הרץ את השומר ואת שער המיגרציות**

Run: `npx vitest run lib/supabase/stories.test.ts scripts/migration-hygiene.test.ts`
Expected: PASS — ⛔ ובפרט «leaves no gap in the sequence» ירוק, כי 0018 עוקב ל-0017.

- [ ] **Step 5: קומיט**

```bash
git add supabase/migrations/0018_stories.sql lib/supabase/stories.test.ts
git commit -m "loop(DEV): C-XXXX T-134a — 0018_stories.sql + שומר"
```

---

## Task 2: השער הטהור `lib/core/storyGate.ts`  *(T-134ⓑ)*

**Files:**
- Create: `lib/core/storyGate.ts`
- Create: `lib/core/storyGate.test.ts`

**Interfaces:**
- Consumes: `BAND_ORDER` ו-`CefrBand` מ-`@/lib/core/cefrLevels`. ⛔ **`inflections()`/`targetForms()` מ-`contentSchema.ts` ⛔ אינם מיובאים** — הכיוון כאן הוא הפחתה, ⛔ ולא הרחבה (סטייה 1).
- Produces:
```ts
export const STORY_LEVELS: readonly ['A1', 'A2', 'B1', 'B2'];
export type StoryLevel = (typeof STORY_LEVELS)[number];
export const STORIES_PER_LEVEL = 3;
export const STORY_MIN_WORDS = 90;
export const STORY_MAX_WORDS = 150;
export const STORY_TITLE_MAX_WORDS = 6;
export interface StoryRecord { readonly level: StoryLevel; readonly titleEn: string; readonly bodyEn: string }
export interface BankLemma { readonly lemma: string; readonly band: CefrBand }
export type StoryGateReason = 'unknown_words' | 'too_short' | 'too_long' | 'title_too_long' | 'digit_in_text';
export interface StoryGateResult {
  readonly ok: boolean;
  readonly unknownWords: readonly string[];
  readonly wordCount: number;
  readonly reasons: readonly StoryGateReason[];
}
export function parseStoryFile(text: string): StoryRecord[];
export function allowedLemmasAtOrBelow(level: StoryLevel, bank: readonly BankLemma[]): Set<string>;
export function storyLemma(token: string, allowed: ReadonlySet<string>): string | null;
export function storyGate(record: StoryRecord, opts: { readonly allowedLemmas: ReadonlySet<string> }): StoryGateResult;
```
  Task 3 קורא את ארבעת הקבועים; Task 4 קורא את חמש הפונקציות.

- [ ] **Step 1: כתוב את הבדיקות — הן נופלות כי אין מודול**

```ts
// lib/core/storyGate.test.ts
import { describe, expect, it } from 'vitest';
import {
  STORIES_PER_LEVEL,
  STORY_LEVELS,
  STORY_MAX_WORDS,
  STORY_MIN_WORDS,
  allowedLemmasAtOrBelow,
  parseStoryFile,
  storyGate,
  storyLemma,
  type StoryRecord,
} from '@/lib/core/storyGate';

const BANK = [
  { lemma: 'the', band: 'A1' },
  { lemma: 'girl', band: 'A1' },
  { lemma: 'be', band: 'A1' },
  { lemma: 'open', band: 'A1' },
  { lemma: 'book', band: 'A1' },
  { lemma: 'read', band: 'A1' },
  { lemma: 'happy', band: 'A1' },
  { lemma: 'and', band: 'A1' },
  { lemma: 'she', band: 'A1' },
  { lemma: 'company', band: 'A2' },
  { lemma: 'method', band: 'B1' },
] as const;

const A1 = allowedLemmasAtOrBelow('A1', BANK);
const A2 = allowedLemmasAtOrBelow('A2', BANK);

/** גוף באורך חוקי מתוך מילים מורשות בלבד — ⛔ המבנה, ⛔ לא הספרות, הוא הנבדק. */
function body(words: readonly string[], count = STORY_MIN_WORDS): string {
  return Array.from({ length: count }, (_, i) => words[i % words.length]).join(' ') + '.';
}

const OK: StoryRecord = {
  level: 'A1',
  titleEn: 'The girl and the book',
  bodyEn: body(['the', 'girl', 'reads', 'a', 'book']),
};

describe('allowedLemmasAtOrBelow — «ברמה או נמוכה ממנה»', () => {
  it('A1 ⛔ אינו מכיל מילת A2', () => {
    expect(A1.has('girl')).toBe(true);
    expect(A1.has('company')).toBe(false);
  });

  it('A2 מכיל את A1 ואת A2, ⛔ ולא את B1', () => {
    expect(A2.has('girl')).toBe(true);
    expect(A2.has('company')).toBe(true);
    expect(A2.has('method')).toBe(false);
  });
});

describe('storyLemma — הפחתה אל למה שבבנק, ⛔ ולא הרחבה', () => {
  it('טוקן שהוא עצמו למה מוחזר כמות שהוא', () => {
    expect(storyLemma('book', A1)).toBe('book');
  });

  it('גוף שלישי · עבר · הווה ממושך מופחתים ללמה', () => {
    expect(storyLemma('reads', A1)).toBe('read');
    expect(storyLemma('opened', A1)).toBe('open');
    expect(storyLemma('opening', A1)).toBe('open');
  });

  it('צורה חריגה עוברת דרך המפה הסגורה: is ⇒ be', () => {
    expect(storyLemma('is', A1)).toBe('be');
    expect(storyLemma('was', A1)).toBe('be');
  });

  it('⛔ המפה החריגה ⛔ אינה מכניסה למה שאינה בבנק', () => {
    const tiny = new Set(['book']);
    expect(storyLemma('is', tiny)).toBeNull();
  });

  it('⛔ ⛔ ה-false-accept של F-020 ⛔ אינו נולד מחדש: card ⛔ אינו car', () => {
    const withCar = new Set(['car']);
    expect(storyLemma('card', withCar)).toBeNull();
  });

  it('מילה שאינה בבנק כלל ⇒ null', () => {
    expect(storyLemma('helicopter', A1)).toBeNull();
  });
});

describe('storyGate — מילה זרה אחת מפילה את הסיפור ומזוהה בשמה', () => {
  it('סיפור נקי עובר', () => {
    const r = storyGate(OK, { allowedLemmas: A1 });
    expect(r.ok).toBe(true);
    expect(r.unknownWords).toEqual([]);
  });

  it('מילה אחת מחוץ לרמה ⇒ ok:false ושמה ברשימה', () => {
    const r = storyGate(
      { ...OK, bodyEn: `${OK.bodyEn} The company is here.` },
      { allowedLemmas: A1 },
    );
    expect(r.ok).toBe(false);
    expect(r.reasons).toContain('unknown_words');
    expect(r.unknownWords).toContain('company');
  });

  it('⛔ הכותרת נבדקת גם היא — היא טקסט שהלומד קורא', () => {
    const r = storyGate({ ...OK, titleEn: 'The helicopter' }, { allowedLemmas: A1 });
    expect(r.unknownWords).toContain('helicopter');
  });

  it('⛔ המילים החסרות ⛔ אינן כפולות ומדווחות ממוינות', () => {
    const r = storyGate(
      { ...OK, bodyEn: `${OK.bodyEn} zebra zebra apple.` },
      { allowedLemmas: A1 },
    );
    expect(r.unknownWords).toEqual(['apple', 'zebra']);
  });

  it('גוף קצר מדי ⇒ too_short, וארוך מדי ⇒ too_long', () => {
    const short = storyGate({ ...OK, bodyEn: body(['the', 'girl'], STORY_MIN_WORDS - 1) }, { allowedLemmas: A1 });
    expect(short.reasons).toContain('too_short');
    const long = storyGate({ ...OK, bodyEn: body(['the', 'girl'], STORY_MAX_WORDS + 1) }, { allowedLemmas: A1 });
    expect(long.reasons).toContain('too_long');
  });

  it('⛔ ספרה בטקסט ⇒ נפסל — תאריך ומספר הם טענה על העולם (T-135ⓒ)', () => {
    const r = storyGate({ ...OK, bodyEn: `${OK.bodyEn} It was 1999.` }, { allowedLemmas: A1 });
    expect(r.reasons).toContain('digit_in_text');
  });

  it('כותרת ארוכה מדי ⇒ title_too_long', () => {
    const r = storyGate({ ...OK, titleEn: 'the the the the the the the' }, { allowedLemmas: A1 });
    expect(r.reasons).toContain('title_too_long');
  });
});

describe('parseStoryFile', () => {
  it('קורא שורות JSONL ומדלג על ריקות', () => {
    const text = `{"level":"A1","title_en":"The book","body_en":"the girl"}\n\n`;
    expect(parseStoryFile(text)).toEqual([
      { level: 'A1', titleEn: 'The book', bodyEn: 'the girl' },
    ]);
  });

  it('⛔ רמה שאינה אחת מארבע ⇒ זריקה בשם, ⛔ ולא דילוג שקט', () => {
    expect(() => parseStoryFile('{"level":"C1","title_en":"x","body_en":"y"}')).toThrow(/C1/);
  });
});

describe('הקבועים הם המקור היחיד', () => {
  it('ארבע רמות · שלושה סיפורים · 90–150 מילים', () => {
    expect(STORY_LEVELS).toEqual(['A1', 'A2', 'B1', 'B2']);
    expect(STORIES_PER_LEVEL).toBe(3);
    expect(STORY_MIN_WORDS).toBe(90);
    expect(STORY_MAX_WORDS).toBe(150);
  });
});
```

- [ ] **Step 2: הרץ ואמת שהן נופלות**

Run: `npx vitest run lib/core/storyGate.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/core/storyGate"`

- [ ] **Step 3: כתוב את המודול**

```ts
/**
 * שער הסיפור — השכבה הטהורה של «סיפור אחד ביום» (T-134ⓑ · § 4.2יג · D-073).
 *
 * ⛔ טהור: אפס React · DOM · רשת · שעון · env. הקובץ ⛔ אינו יודע מאין באה קבוצת
 * הלמות המורשות — הקורא בונה אותה (`scripts/build-stories-sql.mjs`), וזה בדיוק
 * התקדים של `GateOptions.allowedWords` ב-`lib/core/contentSchema.ts`.
 *
 * ⛔ **הכיוון הוא הפחתה, ⛔ ולא הרחבה, וזה כל ההבדל מ-F-020.** `inflections()`
 * הרחיבה למה לצורות ובדרך ייצרה מילים אמיתיות אחרות (`car`+`d`=`card`) — false
 * accept. כאן הטוקן **מוּפחת** ללמה, והלמה חייבת להימצא בקבוצה. `card` ⛔ אינו
 * נחתך ל-`car`, כי ⛔ אין כלל סיומת `-d`.
 *
 * ⛔ **צורות חריגות יושבות במפה סגורה** — `is` ⛔ אינו נגיש לשום כלל סיומת, וגם
 * ⛔ אינו למה בבנק. המפה ממפה **צורה ללמה בלבד**: אם הלמה אינה בקבוצה, הטוקן
 * נפסל. התקדים הוא `CONTRACTION_STEMS` באותו פרויקט, ⛔ ולא המצאה חדשה.
 *
 * ⛔ **מה שהשער ⛔ אינו יודע לבדוק, ו⛔ אינו מתיימר:** נושא רגיש (T-135ⓓ) וטענה
 * על העולם שאין בה ספרה. שני אלה חיים ב-`docs/content-stories-brief.md` ובעין
 * אנושית, ⛔ ולא בטענה חלולה כאן.
 */
import { BAND_ORDER, type CefrBand } from './cefrLevels';

export const STORY_LEVELS = ['A1', 'A2', 'B1', 'B2'] as const;
export type StoryLevel = (typeof STORY_LEVELS)[number];

/** D-073 מילה במילה: «12 להתחלה: 3 בכל רמה». ⛔ לא פרמטר כוונון. */
export const STORIES_PER_LEVEL = 3;
/** T-135ⓐ: 90–150 מילים לסיפור. ⛔ שני המספרים חיים כאן בלבד. */
export const STORY_MIN_WORDS = 90;
export const STORY_MAX_WORDS = 150;
/** T-135ⓔ: כותרת עד 6 מילים. */
export const STORY_TITLE_MAX_WORDS = 6;

export interface StoryRecord {
  readonly level: StoryLevel;
  readonly titleEn: string;
  readonly bodyEn: string;
}

export interface BankLemma {
  readonly lemma: string;
  readonly band: CefrBand;
}

export type StoryGateReason =
  | 'unknown_words'
  | 'too_short'
  | 'too_long'
  | 'title_too_long'
  | 'digit_in_text';

export interface StoryGateResult {
  readonly ok: boolean;
  readonly unknownWords: readonly string[];
  readonly wordCount: number;
  readonly reasons: readonly StoryGateReason[];
}

/** ⛔ למה נמוכה או שווה, ⛔ ולא «באותה רמה»: לומד B1 קורא גם A1. */
export function allowedLemmasAtOrBelow(
  level: StoryLevel,
  bank: readonly BankLemma[],
): Set<string> {
  const ceiling = BAND_ORDER.indexOf(level);
  const out = new Set<string>();
  for (const w of bank) {
    const at = BAND_ORDER.indexOf(w.band);
    if (at >= 0 && at <= ceiling) out.add(w.lemma.toLowerCase());
  }
  return out;
}

/** מראה את `tokens()` של `contentSchema.ts` — ⛔ מועתק ולא מיובא: הוא פרטי שם,
 *  והייצוא שלו היה מרחיב את שטח ה-API של קובץ שאינו נוגע לסיפורים. */
const tokensOf = (s: string): string[] => s.toLowerCase().match(/[a-z']+/g) ?? [];

const CONTRACTION_STEMS: Readonly<Record<string, string>> = { wo: 'will', ca: 'can', sha: 'shall' };

/** מסיר גרשיים חיצוניים וקליטיקות, כך ש-"wasn't" נבדק כ-was ו-"teacher's" כ-teacher. */
function normalizeToken(token: string): string {
  let t = token.replace(/^'+|'+$/g, '');
  if (t.endsWith("n't")) {
    const base = t.slice(0, -3);
    t = CONTRACTION_STEMS[base] ?? base;
  } else if (t.endsWith("'s")) {
    t = t.slice(0, -2);
  }
  return t;
}

/**
 * צורות חריגות של למות בתדירות גבוהה. **סגורה ומוצהרת** — ⛔ אין כאן ניחוש
 * מורפולוגי, ו⛔ אין כאן למה חדשה: הערך נבדק מול הקבוצה כמו כל למה אחרת.
 */
const IRREGULAR_LEMMA: Readonly<Record<string, string>> = {
  am: 'be', is: 'be', are: 'be', was: 'be', were: 'be', been: 'be', being: 'be',
  has: 'have', had: 'have', having: 'have',
  does: 'do', did: 'do', done: 'do', doing: 'do',
  went: 'go', gone: 'go', said: 'say', saw: 'see', seen: 'see',
  made: 'make', took: 'take', taken: 'take', got: 'get', came: 'come',
  knew: 'know', known: 'know', thought: 'think', gave: 'give', given: 'give',
  found: 'find', told: 'tell', became: 'become', left: 'leave', felt: 'feel',
  meant: 'mean', kept: 'keep', began: 'begin', begun: 'begin', shown: 'show',
  heard: 'hear', ran: 'run', brought: 'bring', wrote: 'write', written: 'write',
  sat: 'sit', stood: 'stand', lost: 'lose', paid: 'pay', met: 'meet',
  held: 'hold', bought: 'buy', understood: 'understand', spoke: 'speak',
  spoken: 'speak', children: 'child', men: 'man', women: 'woman',
  better: 'good', best: 'good', worse: 'bad', worst: 'bad',
};

/** סיומות רגולריות, מהארוכה לקצרה — «ies» חייב להיבדק לפני «s». */
const SUFFIXES: readonly (readonly [string, string])[] = [
  ['iest', 'y'], ['ies', 'y'], ['ied', 'y'], ['ier', 'y'], ['ily', 'y'],
  ['ing', ''], ['est', ''], ['ed', ''], ['er', ''], ['es', ''], ['ly', ''], ['s', ''],
];

/** ⛔ שארית של אות אחת אינה גזע אנגלי — הגבול הזה הוא שמונע `bed`→`b`. */
const MIN_STEM = 2;
const DOUBLED_CONSONANT = /([bcdfghjklmnpqrstvwxz])\1$/;

/**
 * הלמה של טוקן, או `null` אם ⛔ אין לו למה בקבוצה. הסדר הוא ההגדרה:
 * (1) הטוקן עצמו · (2) המפה החריגה · (3) הפחתת סיומת. מועמד ארוך לפני קצר
 * (`hope` לפני `hop`), כי הצורה השלמה היא ההשערה הסבירה יותר.
 */
export function storyLemma(token: string, allowed: ReadonlySet<string>): string | null {
  const t = normalizeToken(token);
  if (t === '') return null;
  if (allowed.has(t)) return t;

  const irregular = IRREGULAR_LEMMA[t];
  if (irregular !== undefined && allowed.has(irregular)) return irregular;

  for (const [suffix, replacement] of SUFFIXES) {
    if (!t.endsWith(suffix)) continue;
    const stem = t.slice(0, -suffix.length) + replacement;
    if (stem.length < MIN_STEM) continue;
    const candidates = [`${stem}e`, stem];
    const dedoubled = DOUBLED_CONSONANT.test(stem) ? stem.slice(0, -1) : null;
    if (dedoubled !== null) candidates.push(dedoubled);
    for (const cand of candidates) if (allowed.has(cand)) return cand;
  }
  return null;
}

const DIGIT = /[0-9]/;

export function storyGate(
  record: StoryRecord,
  opts: { readonly allowedLemmas: ReadonlySet<string> },
): StoryGateResult {
  const bodyTokens = tokensOf(record.bodyEn);
  const titleTokens = tokensOf(record.titleEn);
  const wordCount = bodyTokens.length;

  const unknown = new Set<string>();
  for (const token of [...titleTokens, ...bodyTokens]) {
    if (storyLemma(token, opts.allowedLemmas) === null) unknown.add(normalizeToken(token));
  }
  unknown.delete('');

  const reasons: StoryGateReason[] = [];
  if (unknown.size > 0) reasons.push('unknown_words');
  if (wordCount < STORY_MIN_WORDS) reasons.push('too_short');
  if (wordCount > STORY_MAX_WORDS) reasons.push('too_long');
  if (titleTokens.length > STORY_TITLE_MAX_WORDS) reasons.push('title_too_long');
  if (DIGIT.test(record.titleEn) || DIGIT.test(record.bodyEn)) reasons.push('digit_in_text');

  return {
    ok: reasons.length === 0,
    unknownWords: [...unknown].sort(),
    wordCount,
    reasons,
  };
}

const LEVELS = new Set<string>(STORY_LEVELS);

/** מראה את `parseBatchFile`: שורה פגומה היא **עצירה בשם**, ⛔ ולא דילוג שקט. */
export function parseStoryFile(text: string): StoryRecord[] {
  const out: StoryRecord[] = [];
  const lines = text.split('\n');
  for (const [i, line] of lines.entries()) {
    const trimmed = line.trim();
    if (trimmed === '') continue;
    let raw: unknown;
    try {
      raw = JSON.parse(trimmed);
    } catch {
      throw new SyntaxError(`storyGate: line ${i + 1} is not JSON`);
    }
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new TypeError(`storyGate: line ${i + 1} is not an object`);
    }
    const r = raw as Record<string, unknown>;
    const level = r.level;
    if (typeof level !== 'string' || !LEVELS.has(level)) {
      throw new RangeError(`storyGate: line ${i + 1} has level "${String(level)}", not one of A1·A2·B1·B2`);
    }
    const titleEn = r.title_en;
    const bodyEn = r.body_en;
    if (typeof titleEn !== 'string' || titleEn.trim() === '') {
      throw new TypeError(`storyGate: line ${i + 1} has no title_en`);
    }
    if (typeof bodyEn !== 'string' || bodyEn.trim() === '') {
      throw new TypeError(`storyGate: line ${i + 1} has no body_en`);
    }
    out.push({ level: level as StoryLevel, titleEn, bodyEn });
  }
  return out;
}
```

- [ ] **Step 4: הרץ את הבדיקות ואת שער הטוהר**

Run: `npx vitest run lib/core/storyGate.test.ts && npm run check:core && npm run typecheck`
Expected: PASS · `lib/core purity: OK` · אפס שגיאות טיפוס.

- [ ] **Step 5: בדיקת מוטציה — שער שאינו יכול ליפול אינו שער (F-088)**

מחק זמנית את שורת `if (at >= 0 && at <= ceiling)` והחזר את כל הבנק.
Run: `npx vitest run lib/core/storyGate.test.ts`
Expected: FAIL על «A1 ⛔ אינו מכיל מילת A2». **החזר את השורה** והרץ שוב — PASS.

- [ ] **Step 6: קומיט**

```bash
git add lib/core/storyGate.ts lib/core/storyGate.test.ts
git commit -m "loop(DEV): C-XXXX T-134b — שער הסיפור הטהור"
```

---

## Task 3: הוראת הייצור `docs/content-stories-brief.md`  *(T-135, החצי המפרטי)*

**Files:**
- Create: `docs/content-stories-brief.md`
- Create: `scripts/content-brief.test.ts`

**Interfaces:**
- Consumes: ארבעת הקבועים של Task 2 (`STORIES_PER_LEVEL` · `STORY_MIN_WORDS` · `STORY_MAX_WORDS` · `STORY_TITLE_MAX_WORDS`).
- Produces: המסמך שסוכן ה-Content קורא, והפורמט `data/generated/stories-YYYY-MM-DD.jsonl` ששלב 4 קולט: שורת JSON אחת לסיפור עם `level` · `title_en` · `body_en`.

- [ ] **Step 1: כתוב את שער הסחיפה — הוא נופל כי אין מסמך**

```ts
// scripts/content-brief.test.ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  STORIES_PER_LEVEL,
  STORY_LEVELS,
  STORY_MAX_WORDS,
  STORY_MIN_WORDS,
  STORY_TITLE_MAX_WORDS,
} from '@/lib/core/storyGate';

/**
 * F-087 · F-093 — מסמך הוראה שמספריו ⛔ אינם נמדדים מול הקוד סוחף בשקט, והסוכן
 * מייצר לפי המספר הישן. כל מספר בהוראה נטען כאן מול הקבוע שהשער אוכף.
 */
const BRIEF = readFileSync('docs/content-stories-brief.md', 'utf8');

describe('docs/content-stories-brief.md — ⛔ אפס סחיפה מול הקוד', () => {
  it('נוקב באורך הגוף כפי שהשער אוכף אותו', () => {
    expect(BRIEF).toContain(`${STORY_MIN_WORDS}–${STORY_MAX_WORDS}`);
  });

  it('נוקב במכסה: 3 בכל רמה, 12 בסך הכל', () => {
    expect(BRIEF).toContain(`${STORIES_PER_LEVEL}`);
    expect(BRIEF).toContain(`${STORIES_PER_LEVEL * STORY_LEVELS.length}`);
  });

  it('נוקב בתקרת הכותרת', () => {
    expect(BRIEF).toContain(`${STORY_TITLE_MAX_WORDS}`);
  });

  it('מונה את ארבע הרמות ⛔ ולא את C1/C2', () => {
    for (const level of STORY_LEVELS) expect(BRIEF).toContain(level);
    expect(BRIEF).not.toContain('C1');
    expect(BRIEF).not.toContain('C2');
  });

  it('⛔ אוסר שם פרטי ו⛔ אוסר ספרה — שתי המחלקות שהשער פוסל בפועל', () => {
    expect(BRIEF).toMatch(/שם פרטי/);
    expect(BRIEF).toMatch(/ספרה|ספרות/);
  });

  it('⛔ אוסר תיקון ביד: פריט שנפסל מיוצר מחדש', () => {
    expect(BRIEF).toMatch(/מיוצר מחדש/);
  });
});
```

- [ ] **Step 2: הרץ ואמת שהוא נופל**

Run: `npx vitest run scripts/content-brief.test.ts`
Expected: FAIL — `ENOENT … docs/content-stories-brief.md`

- [ ] **Step 3: כתוב את ההוראה**

```markdown
# הוראת ייצור — «סיפור אחד ביום» (T-135 · D-073 · § 4.2יג)

**מי מבצע:** סוכן ה-Content. ⛔ **לא ה-Dev ו⛔ לא ה-PM.**
**המכסה:** **12** סיפורים — **3** בכל אחת מארבע הרמות **A1 · A2 · B1 · B2**.
⛔ 11 או 13 מפילים את הקליטה בשם. ⛔ אין רמות מעבר לארבע האלה.

## מה נכתב

| הכלל | המספר | מי אוכף |
|---|---|---|
| אורך הגוף | **90–150** מילים | `storyGate` — `too_short` / `too_long` |
| אורך הכותרת | עד **6** מילים | `storyGate` — `title_too_long` |
| אוצר המילים | **כל מילה חייבת להיות בבנק שלנו, ברמת הסיפור או נמוכה ממנה** | `storyGate` — `unknown_words` |
| ⛔ ספרות | ⛔ אפס ספרה בטקסט | `storyGate` — `digit_in_text` |
| ⛔ שם פרטי | ⛔ **אפס שמות**, גם בדויים | `storyGate` (שם ⛔ אינו למה בבנק) |
| ⛔ נושא רגיש | ⛔ מוות · מחלה · אלימות · פוליטיקה · דת | **עין אנושית** — ⛔ אין שער |

## חמשת האיסורים

1. ⛔ **אפס מילה חדשה.** לפני הכתיבה — לבדוק את רשימת המועמדים מול הבנק, ⛔ לא אחרי שהשער פסל (הלקח מ-`plan/80-content-lessons.md` שורה 5).
2. ⛔ **אפס טענה על העולם.** אין תאריכים, אין ספרות, אין מקומות אמיתיים ואין «כך אומרים באנגלית». **סיפור הוא הקשר, ⛔ ולא ידע** (D-073).
3. ⛔ **אפס שם פרטי.** הדמות היא `the girl` · `her teacher` · `my brother`. שם — גם בדוי — ⛔ אינו למה בבנק ולכן פוסל את הסיפור כולו.
4. ⛔ **אפס העתקה.** ⛔ לא ממאל"ו (R-010) · ⛔ לא מ-AnkiWeb (R-013) · ⛔ לא מ-VOA כלשונו (D-073). הטקסט נכתב אצלנו, ומסומן `origin='generated'` (§ 7.6).
5. ⛔ **אפס תיקון ביד.** פריט שהשער פסל ⛔ אינו מתוקן — הוא **מיוצר מחדש**. תיקון ידני של פריט שנפסל הוא בדיוק מה ש-R-014 אוסר בצינור הקיים.

## הצורה שנמסרת

קובץ אחד: `data/generated/stories-YYYY-MM-DD.jsonl` — שורת JSON אחת לסיפור.

```jsonl
{"level":"A1","title_en":"The girl and the book","body_en":"The girl opens ..."}
```

⛔ **אין שדה `origin` בקובץ** — הוא נקבע בקליטה ואינו נתון לבחירה.

## איך בודקים לפני מסירה

```bash
npm run build:stories
```

הסקריפט מריץ את `storyGate` על כל פריט **שוב** (R-014), ופולט `supabase/seed/0004_stories.sql`
רק כשכל 12 עוברים. פריט שנפסל מדווח עם **שמות המילים החסרות**, ⛔ ולא כ«נכשל».
```

- [ ] **Step 4: הרץ את שער הסחיפה**

Run: `npx vitest run scripts/content-brief.test.ts`
Expected: PASS — כל שבע הטענות.

- [ ] **Step 5: קומיט**

```bash
git add docs/content-stories-brief.md scripts/content-brief.test.ts
git commit -m "loop(DEV): C-XXXX T-135a — הוראת הייצור + שער סחיפה"
```

---

## Task 4: סקריפט הקליטה `scripts/build-stories-sql.mjs`  *(T-135, החצי המכני)*

**Files:**
- Create: `scripts/build-stories-sql.mjs`
- Create: `scripts/build-stories-sql.test.ts`
- Modify: `package.json` (‏שורת `scripts`)

**Interfaces:**
- Consumes: `parseStoryFile` · `allowedLemmasAtOrBelow` · `storyGate` · `STORIES_PER_LEVEL` · `STORY_LEVELS` מ-`lib/core/storyGate.ts` · `parseBatchFile` מ-`lib/core/batchRecord.ts` · `parseCefrCsv`/`buildLevelMap` מ-`lib/core/cefrLevels.ts` · `assignWordLevels` מ-`lib/core/wordLevel.ts`.
- Produces: `supabase/seed/0004_stories.sql` · שתי דריסות סביבה לבדיקות: `SEED_OUT_DIR` (‏תקדים F-048ⓑ) ו-`STORIES_DATA_DIR`.

- [ ] **Step 1: כתוב את הבדיקות — הן נופלות כי אין סקריפט**

```ts
// scripts/build-stories-sql.test.ts
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseBatchFile } from '@/lib/core/batchRecord';
import { buildLevelMap, parseCefrCsv } from '@/lib/core/cefrLevels';
import { assignWordLevels } from '@/lib/core/wordLevel';
import { STORIES_PER_LEVEL, STORY_LEVELS, STORY_MIN_WORDS, allowedLemmasAtOrBelow } from '@/lib/core/storyGate';

/**
 * הפיקסטורות ⛔ אינן כותבות מילים בכתב יד: הן נבנות מ**הבנק האמיתי**, בדיוק כפי
 * שהסקריפט בונה אותו. פיקסטורה עם רשימת מילים קשיחה הייתה מאדימה ביום שבו אצוות
 * תוכן משנה את הבנק — ושער שנערך בכל טיק תוכן מפסיק להיקרא (הלקח של F-048).
 */
const DATA = join('data', 'generated');

function bankLemmas() {
  const map = buildLevelMap([
    ...parseCefrCsv(readFileSync(join('data', 'cefrj-vocabulary-profile-1.5.csv'), 'utf8')).entries,
    ...parseCefrCsv(readFileSync(join('data', 'octanove-vocabulary-profile-c1c2-1.0.csv'), 'utf8')).entries,
  ]);
  const words = readdirSync(DATA)
    .filter((f) => /^batch-.*\.jsonl$/.test(f))
    .sort()
    .flatMap((f) => parseBatchFile(readFileSync(join(DATA, f), 'utf8')))
    .map((r) => ({ headword: r.sense.headword, pos: r.sense.pos, ownBand: r.sense.cefr_level ?? null }));
  return assignWordLevels(map, words).words
    .filter((w) => w.profileBand !== null)
    .map((w) => ({ lemma: w.headword.toLowerCase(), band: w.profileBand }));
}

const A1 = [...allowedLemmasAtOrBelow('A1', bankLemmas())].sort();

/** גוף חוקי: מילות A1 אמיתיות, בדיוק STORY_MIN_WORDS מהן. */
function body(seed: number): string {
  const words = Array.from({ length: STORY_MIN_WORDS }, (_, i) => A1[(i * 7 + seed) % A1.length]);
  return `${words.join(' ')}.`;
}

function fixtureDir(stories: readonly { level: string; title: string; body: string }[]): string {
  const dir = mkdtempSync(join(tmpdir(), 'stories-data-'));
  writeFileSync(
    join(dir, 'stories-2026-08-21.jsonl'),
    stories.map((s) => JSON.stringify({ level: s.level, title_en: s.title, body_en: s.body })).join('\n'),
    'utf8',
  );
  return dir;
}

function twelve(): { level: string; title: string; body: string }[] {
  return STORY_LEVELS.flatMap((level, li) =>
    Array.from({ length: STORIES_PER_LEVEL }, (_, i) => ({
      level,
      title: `${A1[0]} ${A1[1]} ${li} ${i}`.replace(/[0-9]/g, (d) => A1[Number(d) % A1.length]),
      body: body(li * 10 + i),
    })),
  );
}

function run(dataDir: string, outDir: string): string {
  return execFileSync('node', ['scripts/build-stories-sql.mjs'], {
    encoding: 'utf8',
    env: { ...process.env, STORIES_DATA_DIR: dataDir, SEED_OUT_DIR: outDir },
  });
}

describe('build-stories-sql — המסלול המלא', () => {
  it('12 סיפורים עוברים ⇒ SQL עם 12 שורות ערכים, 3 בכל רמה', () => {
    const out = mkdtempSync(join(tmpdir(), 'stories-out-'));
    run(fixtureDir(twelve()), out);
    const sql = readFileSync(join(out, '0004_stories.sql'), 'utf8');
    for (const level of STORY_LEVELS) {
      expect(sql.split(`'${level}'`).length - 1).toBe(STORIES_PER_LEVEL);
    }
    expect(sql.split("'generated'").length - 1).toBe(STORIES_PER_LEVEL * STORY_LEVELS.length);
    expect(sql).toMatch(/^\s*begin;/im);
    expect(sql).toMatch(/commit;\s*$/im);
    expect(sql).toMatch(/on conflict \(cefr_level, title_en\) do nothing/i);
  });

  it('⛔ 11 מפילים את הסקריפט בשם, ⛔ ולא פולטים קובץ חלקי', () => {
    const out = mkdtempSync(join(tmpdir(), 'stories-out-'));
    expect(() => run(fixtureDir(twelve().slice(0, 11)), out)).toThrow(/expected 3 .*got 2|B2/i);
  });

  it('⛔ מילה מחוץ לרמה מפילה, והמילה מדווחת בשמה', () => {
    const out = mkdtempSync(join(tmpdir(), 'stories-out-'));
    const bad = twelve();
    bad[0] = { ...bad[0], body: `${bad[0].body} helicopter.` };
    expect(() => run(fixtureDir(bad), out)).toThrow(/helicopter/);
  });

  it('⛔ אין קובץ קלט ⇒ עצירה בשם, ⛔ ולא קובץ ריק', () => {
    const out = mkdtempSync(join(tmpdir(), 'stories-out-'));
    expect(() => run(mkdtempSync(join(tmpdir(), 'stories-empty-')), out)).toThrow(/stories-.*\.jsonl/);
  });
});

describe('⛔ הגבול של D-054', () => {
  it('⛔ הסקריפט ⛔ אינו מזכיר את הזירה', () => {
    const src = readFileSync('scripts/build-stories-sql.mjs', 'utf8');
    expect(src).not.toContain('arcade_collected_words');
  });
});
```

- [ ] **Step 2: הרץ ואמת שהן נופלות**

Run: `npx vitest run scripts/build-stories-sql.test.ts`
Expected: FAIL — `Cannot find module … build-stories-sql.mjs`

- [ ] **Step 3: כתוב את הסקריפט**

```js
#!/usr/bin/env node
/**
 * Builds supabase/seed/0004_stories.sql from data/generated/stories-*.jsonl (T-135).
 *
 * זו השכבה הלא-טהורה היחידה של הצינור: היא קוראת קבצים וכותבת אחד. הפירוק
 * (lib/core/storyGate.ts), רמות המילים (lib/core/wordLevel.ts) והשער עצמו טהורים
 * ונבדקים ביחידה.
 *
 * ⛔ R-014: כל סיפור עובר את השער **שוב** כאן, גם אחרי שסוכן ה-Content הריץ אותו.
 *    סיפור שנפסל מדווח ו**עוצר את הריצה** — ⛔ ואינו מתוקן. תיקון תוכן בתוך קליטה
 *    הוא טיק של סוכן ה-Content.
 *
 * ⛔ הבנק נבנה מאותם שני מקורות שמהם `build-word-levels-sql.mjs` בונה את
 *    `0002_word_cefr_levels.sql` — `data/generated/batch-*.jsonl` + שני פרופילי
 *    ה-CEFR. ⛔ אין כאן מקור חדש, ⛔ ואין קריאה לדאטהבייס (TD-24: אין Supabase חי
 *    בסביבת הלופ).
 *
 * ⛔ הסינון הוא על `cefr_profile_band` ולעולם לא על `senses.cefr_level` — השתיים
 *    חלוקות על 125 מתוך 343 שורות (D-034), וזה בדיוק הנימוק שכתוב ב-
 *    `app/api/levels/summary/route.ts`.
 *
 * TypeScript is imported directly, with no build step and no new dependency — the
 * registerHooks preamble is copied verbatim from scripts/build-ingest-sql.mjs.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
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

const { parseBatchFile } = await import('../lib/core/batchRecord.ts');
const { parseCefrCsv, buildLevelMap } = await import('../lib/core/cefrLevels.ts');
const { assignWordLevels } = await import('../lib/core/wordLevel.ts');
const {
  parseStoryFile,
  allowedLemmasAtOrBelow,
  storyGate,
  STORIES_PER_LEVEL,
  STORY_LEVELS,
} = await import('../lib/core/storyGate.ts');

const BANK_DIR = join('data', 'generated');
/** ⛔ דריסה לבדיקות בלבד, בדיוק כמו SEED_OUT_DIR — ⛔ אינה נקראת בשום מקום אחר. */
const STORIES_DIR = process.env.STORIES_DATA_DIR || BANK_DIR;
const OUT_DIR = process.env.SEED_OUT_DIR || join('supabase', 'seed');
const OUT = join(OUT_DIR, '0004_stories.sql');

const q = (v) => `'${String(v).replaceAll("'", "''")}'`;

// --- 1. הבנק: למה → רמת פרופיל, הנמוכה מבין ה-pos-ים -------------------------
const map = buildLevelMap([
  ...parseCefrCsv(readFileSync(join('data', 'cefrj-vocabulary-profile-1.5.csv'), 'utf8')).entries,
  ...parseCefrCsv(readFileSync(join('data', 'octanove-vocabulary-profile-c1c2-1.0.csv'), 'utf8')).entries,
]);

const batchFiles = readdirSync(BANK_DIR).filter((f) => /^batch-.*\.jsonl$/.test(f)).sort();
const words = batchFiles
  .flatMap((f) => parseBatchFile(readFileSync(join(BANK_DIR, f), 'utf8')))
  .map((r) => ({ headword: r.sense.headword, pos: r.sense.pos, ownBand: r.sense.cefr_level ?? null }));

const ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const lowest = new Map();
for (const w of assignWordLevels(map, words).words) {
  if (w.profileBand === null) continue;
  const lemma = w.headword.toLowerCase();
  const prev = lowest.get(lemma);
  // ⛔ הנמוכה, ⛔ ולא הראשונה: מילה שהיא A1 כשם עצם ⛔ אינה נעשית קשה יותר מפני
  // שהפרופיל דירג את הפועל שלה גבוה יותר.
  if (prev === undefined || ORDER.indexOf(w.profileBand) < ORDER.indexOf(prev)) {
    lowest.set(lemma, w.profileBand);
  }
}
const bank = [...lowest.entries()].map(([lemma, band]) => ({ lemma, band }));

// --- 2. הסיפורים ------------------------------------------------------------
const storyFiles = readdirSync(STORIES_DIR).filter((f) => /^stories-.*\.jsonl$/.test(f)).sort();
if (storyFiles.length === 0) {
  // ⛔ עצירה, ⛔ ולא קובץ ריק: seed בלי שורות נראה כמו קליטה שהצליחה.
  throw new Error(`no stories-*.jsonl in ${STORIES_DIR} — the Content agent has not delivered yet`);
}

const stories = storyFiles.flatMap((f) => parseStoryFile(readFileSync(join(STORIES_DIR, f), 'utf8')));

// --- 3. השער, על כל סיפור, פעם שנייה (R-014) --------------------------------
const allowedByLevel = new Map(
  STORY_LEVELS.map((level) => [level, allowedLemmasAtOrBelow(level, bank)]),
);

const rejected = [];
for (const [i, story] of stories.entries()) {
  const result = storyGate(story, { allowedLemmas: allowedByLevel.get(story.level) });
  if (!result.ok) {
    rejected.push(
      `#${i + 1} [${story.level}] "${story.titleEn}" — ${result.reasons.join(', ')}` +
        (result.unknownWords.length > 0 ? ` · unknown: ${result.unknownWords.join(' ')}` : ''),
    );
  }
}
if (rejected.length > 0) {
  // ⛔ הרשימה כולה, ⛔ ולא הראשון: סבב תיקון אחד במקום שנים-עשר.
  throw new Error(`storyGate rejected ${rejected.length} of ${stories.length}:\n${rejected.join('\n')}`);
}

// --- 4. המכסה: 3 בדיוק בכל אחת מארבע הרמות ----------------------------------
for (const level of STORY_LEVELS) {
  const n = stories.filter((s) => s.level === level).length;
  if (n !== STORIES_PER_LEVEL) {
    throw new Error(`${level}: expected ${STORIES_PER_LEVEL} stories, got ${n}`);
  }
}

// --- 5. פליטה ---------------------------------------------------------------
const rows = stories
  .map((s) => `    (${q(s.level)}, ${q(s.titleEn)}, ${q(s.bodyEn)}, 'generated')`)
  .join(',\n');

const sql = `-- supabase/seed/0004_stories.sql
-- ⛔ GENERATED by scripts/build-stories-sql.mjs — do not edit by hand.
--    Regenerate with \`npm run build:stories\`. Apply exactly like a migration.
--
-- ${stories.length} stories · ${STORIES_PER_LEVEL} per level · sources: ${storyFiles.join(' ')}
-- Every row was re-gated by lib/core/storyGate.ts (R-014) before emission.
-- origin is 'generated' on every row and is NOT a field of the input (§ 7.6).
-- Apply supabase/migrations/0018_stories.sql first.

begin;

insert into public.stories (cefr_level, title_en, body_en, origin) values
${rows}
on conflict (cefr_level, title_en) do nothing;

commit;
`;

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, sql, 'utf8');
console.log(`${OUT}: ${stories.length} stories from ${storyFiles.length} file(s)`);
```

- [ ] **Step 4: הוסף את הפקודה ל-`package.json`**

```json
"build:stories": "node scripts/build-stories-sql.mjs",
```
(‏מיד אחרי `"build:levels"`.)

- [ ] **Step 5: הרץ את הבדיקות**

Run: `npx vitest run scripts/build-stories-sql.test.ts`
Expected: PASS — חמש הטענות, ובכללן שתי הנפילות בשם.

- [ ] **Step 6: אימות מלא, ⛔ ואין טענת הצלחה בלעדיו**

Run: `npm run typecheck && npm run check:core && npm test && npm run build`
Expected: ארבע ירוקות. ⛔ `npm run build:stories` **נופל בשם** («no stories-*.jsonl») כל עוד סוכן ה-Content לא מסר — וזו התוצאה הנכונה (סטייה 4).

- [ ] **Step 7: קומיט**

```bash
git add scripts/build-stories-sql.mjs scripts/build-stories-sql.test.ts package.json
git commit -m "loop(DEV): C-XXXX T-135b — סקריפט קליטת הסיפורים"
```

---

## Self-Review — נעשתה, והתוצאה כאן

**1. כיסוי המפרט.** T-134ⓐ ⇒ Task 1 · T-134ⓑ ⇒ Task 2 · T-135ⓐⓑⓒⓓⓔ ⇒ Task 3 · T-135ⓕ ⇒ Task 4. **מדדי ההצלחה של § 4.2יג:** ⓐ «אפס `arcade_collected_words` בקבצי הספרייה» — נטען ב-Task 1 וב-Task 4 · ⓑ «אפס מילה שאינה `senses` שלנו — הבדיקה נכשלת בשם» — Task 2 (`unknownWords`) ו-Task 4 (הודעת הדחייה) · ⓓ «12 אינם 12 — הבדיקה סופרת 3 לכל אחת מארבע» — Task 4 שלב 4. ⛔ **מדד ⓒ (`check:mobile`) ⛔ אינו בתוכנית הזאת** — הוא של T-136, שאין בה שורת קוד כאן.

**2. סריקת מצייני מקום.** ⛔ אין «TODO» · ⛔ אין «טיפול בשגיאות מתאים» · ⛔ אין «בדיקות כמו במשימה N» — קוד הבדיקה חוזר במלואו בכל משימה.

**3. עקיבות טיפוסים.** `StoryRecord` (`level` · `titleEn` · `bodyEn`) זהה בין Task 2 ל-Task 4 · `allowedLemmasAtOrBelow(level, bank)` נקראת בשני המקומות עם אותו סדר ארגומנטים · `BankLemma.band` הוא `CefrBand`, וה-`profileBand` שהסקריפט מסנן ל-`!== null` הוא בדיוק הטיפוס הזה · `STORIES_PER_LEVEL` ו-`STORY_LEVELS` הם המקור היחיד למספרים 3 ו-12, בקוד ובמסמך כאחד.

## מה התוכנית הזאת ⛔ אינה עושה

- ⛔ **אינה נוגעת ב-T-136 וב-T-137.** § 4.2יג מחייבת סדר: ⛔ אין מסך לפני שיש סיפור.
- ⛔ **אינה מכריעה מה נכתב ל-`word_progress` בהקשה על מילה בסיפור.** § 4.2יג אומרת «דרך אותו מסלול של הכרטיסייה», ו-`POST /api/review` דורש `grade` — כלומר **טענה על הזיכרון** — בעוד אותו סעיף אומר «⛔ אין טעות בקריאה ולכן ⛔ אין עונש». ⛔ **זו הכרעת מסך, ⛔ ולא הכרעת Dev** ⇒ נרשמה כפער ל-PM, ו-T-136 ⛔ אינה נלקחת לפניה.
- ⛔ **אינה כותבת ולו סיפור אחד.**
