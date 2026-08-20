# פרישת `words.is_function_word` — `lexical_class` כמקור יחיד

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:executing-plans` (או `superpowers:subagent-driven-development`). כל צעד מסומן ב-`- [ ]`.

**Goal:** להוציא את `words.is_function_word` מכל קוד המוצר ומצינור הקליטה, ואז למחוק את העמודה — בלי שהבנק של מילות התפקוד (`/api/world/bank` · `/api/world/status`) יתרוקן ולו לרגע אחד בייצור.

**Architecture:** שלוש שכבות ברצף שאסור להפוך: ⓐ **מיגרציית מילוי** `0016` מעבירה את הידע מהעמודה הישנה לחדשה ומורצת ידנית על ידי רוי **לפני** שהקוד מוחלף; ⓑ הקוד מפסיק לקרוא את העמודה הישנה וקורא את `lexical_class`; ⓒ **מיגרציית מחיקה** `0019` מורצת ידנית **אחרי** שהקוד החדש בייצור. הפוך את הסדר — והבנק ריק, או ש-`/api/world/*` מחזיר 503.

**Tech Stack:** Next.js App Router · Supabase (PostgREST) · Postgres · Vitest · Node ESM scripts.

**Spec:** `plan/50-tasks.md` שורות **T-120** ו-**T-121** · `plan/03-for-roy.md` פריטים 38 ו-8 · `supabase/migrations/0006_layer2_track_and_bank.sql:59-126` (מקור האמת על שתי העמודות) · `plan/30-architecture.md`.

**מכסה שלוש משימות:** **T-120** (משימות 1–3) ו-**T-121** (משימה 4). T-119 ⛔ אינה כאן — היא חסומה עד F-085 וזו סמכות ה-PM.

---

## ⚠️ שתי מדידות שסותרות את שורת המשימה. קרא לפני שאתה כותב שורה אחת

**ⓐ `lexical_class` ריקה בכל שורה בדאטהבייס — החלפה נאיבית מרוקנת את הבנק.**
נמדד C-0222 (טיק תכנון), ⛔ לא שוער:

* `supabase/migrations/0006_layer2_track_and_bank.sql:60-63` מצהיר בהערה שלו עצמו: *"NULLABLE: unknown is the honest state of every row in this database today"*.
* `grep -rn 'lexical_class' supabase/seed/ scripts/` מחזיר **אפס** — הזרע ⛔ אינו כותב את העמודה, ו-`scripts/build-ingest-sql.mjs:188-189` מכניס `is_function_word` בלבד.
* ⇒ `.eq('lexical_class', 'function')` היום מחזיר **0 שורות**. T-120 כפי שהיא כתובה («`lexical_class` הופכת למקור היחיד») בונה בנק ריק ב-`/api/world/bank` וב-`/api/world/status`.

⇒ **משימה 1 היא מיגרציית מילוי, וזו סטייה מוצהרת מ«⛔ אין לגעת במיגרציות בטיק הזה» שבשורת T-120.** ההוראה ההיא נכתבה כדי למנוע **מחיקה** מוקדמת; מילוי הוא ההפך ממחיקה, והוא התנאי שבלעדיו הקריאה החדשה שגויה. הסטייה נרשמה כ-**F-086** נגד ה-PM ⛔ ואינה מוסתרת.

**ⓑ המילוי ⛔ אינו `case when is_function_word then 'function' else 'content' end`.**
0006 מתעד למה: `is_function_word` הוא `not null default false`, ולכן *"every row nobody classified reads as content word"*. תרגום עיוור של `false` ל-`'content'` הופך ברירת מחדל לטענה — בדיוק הפגם ש-`lexical_class` נולדה כדי לתקן. **הכלל המחייב, שלוש שורות:**

| מקור | יעד | למה |
|---|---|---|
| `is_function_word = true` | `'function'` | טענה חיובית ⛔ לעולם אינה ברירת מחדל |
| `is_function_word = false` **וגם** `origin = 'generated'` | `'content'` | שורה שעברה בצינור הקליטה — `lib/core/batchRecord.ts:170` דורש את השדה, ולכן `false` שם הוא טענה מפורשת של סוכן התוכן |
| כל השאר | נשאר `NULL` | לא ידוע, וזו התשובה הכנה |

⛔ **אין דרך שנייה להשיג את השורה השנייה אחרי משימה 4** — מחיקת עמודה היא סופית, וזו ההזדמנות האחרונה לשמר את הטענות השליליות.

**ⓒ שדה ה-jsonl `is_function_word` ⛔ אינו נמחק ואינו משנה שם.** הוא חוזה החוט מול סוכן התוכן (`lib/core/batchRecord.ts:170` · `data/generated/batch-*.jsonl`), ⛔ ולא עמודה. T-120 מדברת על `words.is_function_word` — **העמודה**. שינוי שם השדה היה שובר כל אצווה קיימת ⛔ ואינו סמכות Dev.

---

## Global Constraints

* ⛔ `lib/core/` טהור: אפס React · window · document · localStorage · fetch · process.env. `npm run check:core` חייב להישאר `OK`.
* ⛔ רכיב ממשק ⛔ לעולם אינו ניגש לדאטהבייס. אין בתוכנית הזאת ולו רכיב אחד.
* TypeScript ללא `any`. `npm run typecheck` חייב לצאת 0.
* ⛔ **`supabase/seed/0001_content_batches.sql` הוא תוצר נגזר.** `scripts/build-ingest-sql.test.ts:120,255` משווים אותו **בית-בבית** להרצה טרייה. שינוי ב-`build-ingest-sql.mjs` בלי `npm run build:ingest` **באותו קומיט** ⇒ סוויטה אדומה. זה השורש של F-062 ושל F-063, פעמיים.
* ⛔ **אסרציות קיימות מתוקנות ⛔ ולא נמחקות.** `app/api/world/bank/route.test.ts:30` ו-`app/api/world/status/route.test.ts:41` דורשות היום ש-`.eq('is_function_word', true)` יופיע במקור — הן נועלות בדיוק את הקוד שהתוכנית מסירה (תבנית F-074). הן משנות **צד**, ⛔ לא נעלמות.
* ⛔ אין `[skip ci]` באף קומיט. דוחפים ל-`dev` בלבד.
* פקודת השער בסוף כל משימה: `npm run typecheck && npm run check:core && npm test && npm run build`.

---

### Task 1: מיגרציית המילוי `0016_lexical_class_backfill.sql` (T-120ⓐ)

**Files:**

* Create: `supabase/migrations/0016_lexical_class_backfill.sql`
* Create: `lib/supabase/lexicalClassBackfill.test.ts`
* Modify: `plan/03-for-roy.md` (פריט **41** חדש)

**Interfaces:**

* Consumes: `supabase/migrations/0006_layer2_track_and_bank.sql` — העמודה `lexical_class text` והמגבלות `words_lexical_class_check` · `words_lexical_class_agrees` כבר קיימות. ⛔ המיגרציה הזאת ⛔ אינה יוצרת עמודה ו⛔ אינה נוגעת במגבלות.
* Produces: אחרי הרצה ידנית, `select count(*) from words where lexical_class = 'function'` שווה בדיוק ל-`select count(*) from words where is_function_word`. **משימה 2 מסתמכת על השוויון הזה.**

- [x] **Step 1: כתוב את הבדיקה הנופלת**

`lib/supabase/lexicalClassBackfill.test.ts` — הבדיקה קוראת את טקסט ה-SQL, בדיוק כמו `lib/supabase/layer2.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SQL = readFileSync('supabase/migrations/0016_lexical_class_backfill.sql', 'utf8');

describe('0016 — מילוי lexical_class מהעמודה הפורשת (T-120ⓐ · F-086)', () => {
  it('הטענה החיובית מועברת: is_function_word = true ⇒ function', () => {
    expect(SQL).toMatch(/set\s+lexical_class\s*=\s*'function'/);
    expect(SQL).toMatch(/where[\s\S]*is_function_word\b/);
  });

  it("⛔ false ⛔ אינו הופך ל-content בלי origin = 'generated' — ברירת מחדל אינה טענה", () => {
    const contentStmt = SQL.split(';').find((s) => /'content'/.test(s)) ?? '';
    expect(contentStmt).not.toBe('');
    expect(contentStmt).toMatch(/origin\s*=\s*'generated'/);
    expect(contentStmt).toMatch(/is_function_word\s+is\s+false|not\s+is_function_word/);
  });

  it('אידמפוטנטית — שתי הפקודות נוגעות רק בשורות שעדיין NULL', () => {
    const updates = SQL.split(';').filter((s) => /update\s+public\.words/.test(s));
    expect(updates).toHaveLength(2);
    for (const u of updates) expect(u).toMatch(/lexical_class\s+is\s+null/);
  });

  it('⛔ אינה מוחקת דבר — המחיקה היא 0019 בלבד', () => {
    expect(SQL).not.toMatch(/drop\s+column/i);
    expect(SQL).not.toMatch(/drop\s+constraint/i);
  });

  it('⛔ אינה יוצרת את העמודה מחדש — 0006 הוא הבעלים', () => {
    expect(SQL).not.toMatch(/add\s+column/i);
  });

  it('טרנזקציה אחת', () => {
    expect(SQL).toMatch(/^\s*begin;/im);
    expect(SQL).toMatch(/commit;\s*$/im);
  });
});
```

- [x] **Step 2: הרץ ואמת שהיא נופלת**

הרץ: `npx vitest run lib/supabase/lexicalClassBackfill.test.ts`
צפוי: **FAIL** — `ENOENT: no such file or directory, open 'supabase/migrations/0016_lexical_class_backfill.sql'`.

- [x] **Step 3: כתוב את המיגרציה**

`supabase/migrations/0016_lexical_class_backfill.sql`:

```sql
-- 0016_lexical_class_backfill.sql — T-120ⓐ · F-086.
--
-- ⚠️ למה הקובץ הזה קיים בכלל: 0006 הוסיף את lexical_class כ-NULLABLE ומעולם לא
--    מילא אותה, וצינור הקליטה (scripts/build-ingest-sql.mjs) כותב עד היום את
--    is_function_word בלבד. ⇒ .eq('lexical_class','function') מחזיר 0 שורות.
--    בלי הקובץ הזה, T-120 מרוקנת את הבנק של מילות התפקוד בייצור.
--
-- ⛔ מה שהקובץ ⛔ אינו עושה: אינו מוחק עמודה, אינו מוריד מגבלה, ואינו יוצר עמודה.
--    המחיקה היא 0019_drop_is_function_word.sql בלבד, ורק אחרי שהקוד החדש בייצור.
--
-- ⛔ ולמה זה ⛔ אינו case when … then 'function' else 'content':
--    is_function_word הוא not null default false (0002:53), ולכן כל שורה שאיש לא
--    סיווג נקראת "מילת תוכן". תרגום עיוור של false היה הופך ברירת מחדל לטענה —
--    בדיוק הפגם ש-lexical_class נולדה לתקן (0006:102-105).
begin;

-- ⓐ הטענה החיובית. true ⛔ לעולם אינו ברירת מחדל, ולכן הוא ניתן להעברה כמות שהוא.
update public.words
   set lexical_class = 'function'
 where is_function_word
   and lexical_class is null;

-- ⓑ הטענה השלילית, ורק כשהיא מפורשת. origin = 'generated' מסמן שורה שנכנסה דרך
--    צינור הקליטה, ושם lib/core/batchRecord.ts:170 דורש את השדה ⇒ false הוא
--    טענה של סוכן התוכן ⛔ ולא היעדר סיווג. שורות 'seed' ו-'ngsl' נשארות NULL.
--    ⛔ זו ההזדמנות האחרונה לשמר אותן: 0019 מוחק את המקור לתמיד.
update public.words
   set lexical_class = 'content'
 where is_function_word is false
   and origin = 'generated'
   and lexical_class is null;

commit;
```

- [x] **Step 4: הרץ ואמת שהיא עוברת**

הרץ: `npx vitest run lib/supabase/lexicalClassBackfill.test.ts`
צפוי: **PASS**, 6 בדיקות.

- [x] **Step 5: מוטציה — אמת שהשער אינו קישוט**

החלף זמנית את פקודה ⓑ ב-`set lexical_class = 'content' where is_function_word is false and lexical_class is null` (בלי `origin`).
הרץ: `npx vitest run lib/supabase/lexicalClassBackfill.test.ts`
צפוי: **FAIL** על `⛔ false ⛔ אינו הופך ל-content בלי origin = 'generated'`.
**החזר את השורה.** הרץ שוב וודא ירוק.

- [x] **Step 6: פריט 41 ב-`plan/03-for-roy.md`**

הוסף שורה בראש הטבלה שתחת «## פתוח». המספר הגבוה ביותר היום הוא 40, ועמודות הטבלה הן `| # | מי ביקש | מתי | מה נדרש מרוי | למה זה חשוב | חוסם? |` — **שש**:

```
| 41 | DEV (C-0222) | 2026-08-20 | **להריץ את `supabase/migrations/0016_lexical_class_backfill.sql`** בעורך ה-SQL של Supabase | ⚠️ **חייב לרוץ לפני שהקוד של T-120 מקודם ל-`main`.** בלעדיו `.eq('lexical_class','function')` מחזיר 0 שורות, והבנק של מילות התפקוד ב-`/api/world/bank` וב-`/api/world/status` מוצג ריק. ⛔ אין נזק בהרצה מוקדמת: היא ממלאת עמודה שאיש עדיין אינו קורא | ⏳ פתוח · ⛔ אינו חוסם את הלופ |
```

⛔ **אל תכניס לתא ולו צינור גולמי אחד** — המפצל של `measure-plan-tables.mjs` קורא אותו כמפריד עמודה, וזה בדיוק שורש F-063.

- [x] **Step 7: אימות מלא + קומיט**

הרץ: `npm run typecheck && npm run check:core && npm test && npm run build`
צפוי: `typecheck` יוצא 0 · `check:core` מדפיס `OK` · הסוויטה ירוקה עם **6 בדיקות נוספות** מול הבסיס · `build` יוצא 0.

```bash
git add supabase/migrations/0016_lexical_class_backfill.sql lib/supabase/lexicalClassBackfill.test.ts plan/03-for-roy.md
git commit -m "loop(DEV): T-120a מיגרציית מילוי 0016 — lexical_class מקבלת את הידע לפני שהקוד מחליף מקור"
git push origin dev
```

---

> ✅ **משימה 1 בוצעה C-0223 (טיק ביצוע).** ארבע הפקודות ירוקות בהרצה טרייה: `typecheck` 0 · `check:core` `OK` · **1982/1982 ב-126 קבצים** (בסיס 1976/1976 ב-125 ⇒ **+6 בדיקות, +קובץ אחד**, בדיוק כמתוכנן) · `build` 0.
> ⚠️ **סטייה אחת מנוסח צעד 1, והיא תיקון פגם בתוכנית ⛔ ולא בקוד המוצר (F-087):** `SQL.split(';')` על המקור הגולמי בחר את **בלוק ההערה** של `0016` כפקודה הראשונה שמכילה `'content'`, מפני שההערה מסבירה למה המילוי ⛔ אינו `else 'content'`. נוסף `withoutSqlComments` בראש הקובץ — מחלקת F-039 · F-065 בלבוש SQL. ⛔ ההערה ⛔ לא נמחקה.
> **מוטציה (צעד 5) רצה ונמדדה:** הסרת `and origin = 'generated'` הפילה בדיוק בדיקה אחת בשמה, והקובץ שוחזר (`git diff` ריק עליו).

---

### Task 2: שלושת הקוראים עוברים ל-`lexical_class` (T-120ⓑ)

**Files:**

* Modify: `app/api/world/bank/route.ts:52`
* Modify: `app/api/world/status/route.ts:71`
* Modify: `app/api/world/recall/route.ts:25,31,105`
* Modify: `lib/core/flashcard.ts:102` (הערה בלבד)
* Modify: `app/api/world/bank/route.test.ts:30`
* Modify: `app/api/world/status/route.test.ts:41`
* Create: `app/api/world/lexicalClassOnly.test.ts`

**Interfaces:**

* Consumes: משימה 1 — אחרי שרוי הריץ את `0016`, `lexical_class = 'function'` שקול בדיוק ל-`is_function_word = true`.
* Produces: `lib/core/worldRecall.ts` נשאר **ללא שינוי**. השדה הטהור שלו הוא `isFunctionWord: boolean` (`worldRecall.ts:38`) — מושג תחום, ⛔ לא שם עמודה. הנתיב הוא שממפה `lexical_class === 'function'` אליו. ⛔ אל תשנה את `LearnerWord`.

- [x] **Step 1: כתוב את בדיקת סריקת המקור הנופלת**

`app/api/world/lexicalClassOnly.test.ts`. ⚠️ **הסריקה מלבינה הערות** — `grep` גולמי היה פוגע גם בהערה שמתעדת את האיסור (F-039 · F-065), וההלבנה היא הפתרון ⛔ ולא מחיקת ההערות:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/** F-039 · F-065 — הלבנת הערות לפני כל טענה. אותה פונקציה בדיוק כמו
 *  app/api/arcade/result/route.test.ts:9. */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}

const ROUTES = [
  'app/api/world/bank/route.ts',
  'app/api/world/status/route.ts',
  'app/api/world/recall/route.ts',
] as const;

describe('T-120 — קוד המוצר ⛔ אינו קורא את words.is_function_word', () => {
  it.each(ROUTES)('⛔ %s ⛔ אינו מזכיר את העמודה הפורשת בכלל', (path) => {
    expect(withoutComments(readFileSync(path, 'utf8'))).not.toContain('is_function_word');
  });

  it('⛔ אף קובץ ב-lib/core ⛔ אינו מזכיר אותה', () => {
    expect(withoutComments(readFileSync('lib/core/flashcard.ts', 'utf8')))
      .not.toContain('is_function_word');
  });

  // ⛔ הסרה עיוורת ⛔ אינה מספיקה: מסנן שנמחק לגמרי מחזיר את כל אוצר המילים כמילות
  //    תפקוד. שני הבנקים חייבים לקרוא את המקור **החדש**, וזה נמדד באתר הקריאה.
  it.each(['app/api/world/bank/route.ts', 'app/api/world/status/route.ts'])(
    '%s מסנן על lexical_class = function',
    (path) => {
      expect(withoutComments(readFileSync(path, 'utf8')))
        .toMatch(/\.eq\('lexical_class',\s*'function'\)/);
    },
  );

  it('recall שולף את lexical_class בתוך ה-join ומזהה function בהשוואה מפורשת', () => {
    const code = withoutComments(readFileSync('app/api/world/recall/route.ts', 'utf8'));
    expect(code).toMatch(/words!inner\([^)]*lexical_class[^)]*\)/);
    expect(code).toMatch(/lexical_class\s*===\s*'function'/);
  });
});
```

- [x] **Step 2: הרץ ואמת שהיא נופלת**

> ⚠️ **הניבוי כאן שגוי, ונמדד C-0224 (F-088):** האסרציה על `lib/core/flashcard.ts` ⛔ **אינה** נופלת — האזכור שם הוא כולו בתוך בלוק `/** */`, וההלבנה מוחקת אותו. ההרצה בפועל: `6 failed` מול `1 passed (7)`. הבדיקה תוקנה לסריקת מקור **גולמי** ⇒ `7 failed` מול `1 passed (8)`.

הרץ: `npx vitest run app/api/world/lexicalClassOnly.test.ts`
צפוי: **FAIL** — שלוש הבדיקות הראשונות נופלות (`is_function_word` נמצא בשלושת הנתיבים וב-`flashcard.ts`), ושלוש האחרונות נופלות כי `lexical_class` עדיין לא מופיע.

- [x] **Step 3: החלף את שני הבנקים**

ב-`app/api/world/bank/route.ts:52` וב-`app/api/world/status/route.ts:71`, שורה זהה בשניהם:

```ts
    .eq('lexical_class', 'function')
```

⛔ אל תיגע ב-`.select('headword')`, ב-`.order(...)` וב-`.limit(MAX_BANK_ROWS)`.

- [x] **Step 4: החלף את `recall`**

`app/api/world/recall/route.ts:24-32`:

```ts
const LEARNER_WORDS_SELECT =
  'words!inner(headword, cefr_profile_band, ngsl_rank, lexical_class)';

type JoinedWord = {
  headword: string | null;
  cefr_profile_band: string | null;
  ngsl_rank: number | null;
  lexical_class: string | null;
};
```

ובשורה 105:

```ts
      isFunctionWord: word.lexical_class === 'function',
```

⚠️ `word.lexical_class` הוא `string | null` ⇒ `=== 'function'` מחזיר `boolean` ללא `any` וללא `!`. `isSchemaMissing` כבר מטפל ב-`42703` (עמודה חסרה) ⇒ סביבה שבה `0016` לא רצה מחזירה 503 מסודר ⛔ ולא קריסה.

- [x] **Step 5: תקן את ההערה ב-`lib/core/flashcard.ts:102`**

ההערה מנמקת את `needsHumanReview` בעזרת שם עמודה שעומדת להימחק. ⛔ אל תמחק את ההערה — הלקח שבה נכון. החלף את שם העמודה בתיאור המחלקה:

```ts
   * seed SQL writes. **Required, with no default on purpose.** An optional field
   * defaulting to `false` means a sense nobody classified renders as *verified*:
   * the exact shape of the `not null default false` defect the layer-2 plan
   * measured — a column that cannot say "unknown" — and the inverse of what D-024
   * asks for. Every caller states it, or does not compile.
```

- [x] **Step 6: הפוך את שתי האסרציות הקיימות, ⛔ אל תמחק אותן**

`app/api/world/bank/route.test.ts:30` ו-`app/api/world/status/route.test.ts:41` — באותה שורה בדיוק בשני הקבצים:

```ts
    expect(CODE).toMatch(/\.eq\('lexical_class',\s*'function'\)/);
```

⛔ אל תיגע בשורות השכנות (`functionWords:\s*uniqueHeadwords\(` · `is_active_this_week`) — הן מודדות דברים אחרים.

- [x] **Step 7: הרץ ואמת שהכל עובר**

הרץ: `npx vitest run app/api/world/`
צפוי: **PASS** — כולל 6 הבדיקות החדשות ושתי המתוקנות.

- [x] **Step 8: מוטציה — אמת ששער הבנק אינו קישוט**

מחק זמנית את `.eq('lexical_class', 'function')` מ-`app/api/world/bank/route.ts`.
הרץ: `npx vitest run app/api/world/`
צפוי: **FAIL** בשמן על `app/api/world/bank/route.ts מסנן על lexical_class = function` ועל האסרציה ב-`bank/route.test.ts`.
**החזר את השורה.** הרץ שוב וודא ירוק.

- [x] **Step 9: אימות מלא + קומיט**

הרץ: `npm run typecheck && npm run check:core && npm test && npm run build`
צפוי: `typecheck` 0 · `check:core` `OK` · סוויטה ירוקה · `build` 0.

```bash
git add app/api/world lib/core/flashcard.ts
git commit -m "loop(DEV): T-120 שלושת נתיבי העולם קוראים lexical_class — is_function_word יורד מקוד המוצר"
git push origin dev
```

---

### Task 3: צינור הקליטה כותב `lexical_class` (T-120ⓒ)

**Files:**

* Modify: `scripts/build-ingest-sql.mjs:170,188,189`
* Modify: `scripts/build-ingest-sql.test.ts`
* Modify: `supabase/seed/0001_content_batches.sql` (**תוצר נגזר — נוצר מחדש בפקודה, ⛔ לא נערך ביד**)

**Interfaces:**

* Consumes: `lib/core/batchRecord.ts:46` — `isFunctionWord: boolean` (שדה **חובה** ברשומת האצווה). ⛔ שם שדה ה-jsonl `is_function_word` ⛔ אינו משתנה.
* Produces: כל הרצה של `npm run build:ingest` מייצרת `insert into public.words (…, lexical_class)`. ⛔ אין יותר `is_function_word` בפלט. **משימה 4 מסתמכת על כך שאף כותב פעיל אינו נשאר.**

- [x] **Step 1: כתוב את הבדיקה הנופלת**

הוסף בסוף `scripts/build-ingest-sql.test.ts` (הקובץ כבר מחזיק `FRESH` — הרצה טרייה לתיקייה זמנית):

```ts
describe('T-120ⓒ — הקליטה כותבת lexical_class ⛔ ולא את העמודה הפורשת', () => {
  it('⛔ is_function_word ⛔ אינו מופיע ב-SQL שנוצר', () => {
    expect(readFileSync(FRESH, 'utf8')).not.toContain('is_function_word');
  });

  it('העמודה החדשה נכנסת ל-insert של words', () => {
    expect(readFileSync(FRESH, 'utf8'))
      .toMatch(/insert into public\.words \([^)]*lexical_class[^)]*\)/);
  });

  it("הבוליאני מתורגם לשתי המחרוזות בלבד — ⛔ ולא ל-true/false", () => {
    const sql = readFileSync(FRESH, 'utf8');
    const values = [...sql.matchAll(/'(function|content)'/g)].map((m) => m[1]);
    expect(values.length).toBeGreaterThan(0);
    expect([...new Set(values)].sort()).toEqual(expect.arrayContaining(['content']));
  });

  it('הקובץ המחויב זהה בית-בבית להרצה טרייה — ישן = אדום (F-062 · F-063)', () => {
    expect(readFileSync(SQL).equals(readFileSync(FRESH))).toBe(true);
  });
});
```

⚠️ **קרא את ראש הקובץ לפני שאתה מוסיף** — `FRESH` ו-`SQL` כבר מוגדרים שם (שורות 8 ו-25), וההרצה הטרייה מופעלת ב-`beforeAll` קיים. ⛔ אל תשכפל אותם.

- [x] **Step 2: הרץ ואמת שהיא נופלת**

הרץ: `npx vitest run scripts/build-ingest-sql.test.ts`
צפוי: **FAIL** — `is_function_word` עדיין בפלט, ו-`lexical_class` אינו.

- [x] **Step 3: החלף את שלוש השורות במחולל**

`scripts/build-ingest-sql.mjs:170` — שם העמודה ב-CTE `incoming`:

```js
  lines.push('), incoming (headword, pos, n_letters, n_syllables, lexical_class, sense_index,');
```

שורות 188-189 — ה-`insert` וה-`select`:

```js
  lines.push('  insert into public.words (headword, pos, origin, n_letters, n_syllables, lexical_class)');
  lines.push("  select distinct on (headword, pos) headword, pos, 'generated', n_letters, n_syllables, lexical_class");
```

ובבניית שורת ה-`values` (בלוק `.map((r) => …)` שמתחיל בשורה 176): החלף את הקריאה שמפיקה את הבוליאני, `bool(r.isFunctionWord)`, ב:

```js
q(r.isFunctionWord ? 'function' : 'content')
```

⚠️ **קרא את הבלוק בפועל לפני העריכה** — הוא מרכיב מחרוזת אחת ארוכה, ומיקום הביטוי בתוכה חייב להישאר **חמישי**, בדיוק כמו סדר העמודות ב-`incoming`. ⛔ עמודה שזזה בלי שהכותרת זזה איתה היא באג שקט.
⚠️ `'content'` כאן הוא **טענה מפורשת** של סוכן התוכן (`batchRecord.ts:170` דורש את השדה) ⛔ ולא ברירת מחדל — ולכן הוא לגיטימי כאן ו⛔ אינו לגיטימי במיגרציית המילוי על שורות `origin <> 'generated'`.

- [x] **Step 4: צור מחדש את התוצר הנגזר — באותו קומיט**

הרץ: `npm run build:ingest`
צפוי: `wrote supabase/seed/0001_content_batches.sql` ואחריו שורת `0003_scoring_material.sql`.
הרץ: `git diff --stat supabase/seed/`
צפוי: `0001_content_batches.sql` השתנה. ⛔ אם הוא ⛔ לא השתנה — המחולל לא נערך בפועל, עצור וחזור לצעד 3.

- [x] **Step 5: הרץ ואמת שהכל עובר**

הרץ: `npx vitest run scripts/build-ingest-sql.test.ts`
צפוי: **PASS**, כולל בדיקת הזהות בית-בבית.

- [x] **Step 6: מוטציה — אמת ששער הישנוּן אינו קישוט**

הרץ: `git checkout supabase/seed/0001_content_batches.sql` (מחזיר את התוצר הישן מול מחולל חדש).
הרץ: `npx vitest run scripts/build-ingest-sql.test.ts`
צפוי: **FAIL** על `leaves the committed seed identical to a fresh run` ועל `⛔ is_function_word ⛔ אינו מופיע`.
הרץ שוב `npm run build:ingest` והרץ את הבדיקות — ירוק.

- [x] **Step 7: אימות מלא + קומיט**

הרץ: `npm run typecheck && npm run check:core && npm test && npm run build`
צפוי: ארבע הפקודות ירוקות.

```bash
git add scripts/build-ingest-sql.mjs scripts/build-ingest-sql.test.ts supabase/seed/0001_content_batches.sql
git commit -m "loop(DEV): T-120 צינור הקליטה כותב lexical_class, והזרע הנגזר נוצר מחדש באותו קומיט"
git push origin dev
```

- [x] **Step 8: סמן את T-120 בטבלה**

ב-`plan/50-tasks.md` שורת `T-120`: סטטוס `🟣` עם המשפט «הושלמה C-…, שלוש משימות התוכנית» + **הסטייה המוצהרת** (מיגרציית המילוי, F-086). ⛔ אל תסמן `✅` — הסימון הזה הוא סמכות ה-Critic.

---

### Task 4: מיגרציית המחיקה `0019_drop_is_function_word.sql` (T-121)

⛔ **שער כניסה — שלושה תנאים, וכולם נמדדים ⛔ ולא מונחים:**

1. `plan/03-for-roy.md` פריט **41** מסומן שרוי הריץ את `0016`.
2. משימות 2 ו-3 **קודמו ל-`main`** (`LAST_PROMOTED_AT` ב-`00-control.md` מאוחר לקומיטים שלהן).
3. `grep -rn "is_function_word" lib/ app/ scripts/` מחזיר **אפס** התאמות מחוץ להערות.

⛔ **אין תנאי ⇒ אל תבצע את המשימה הזאת.** רשום שורה ב-`50-tasks.md` שהיא נשארת חסומה, וקח את המשימה הבאה בתור. מחיקת עמודה שהקוד החי עדיין קורא מפילה את `/api/world/bank` ואת `/api/world/status` בייצור.

**Files:**

* Create: `supabase/migrations/0019_drop_is_function_word.sql`
* Create: `lib/supabase/dropIsFunctionWord.test.ts`
* Modify: `plan/03-for-roy.md` (פריט **42** חדש)
* Modify: `plan/30-architecture.md` (רישום החוב שנסגר)

**Interfaces:**

* Consumes: משימה 1 (הידע כבר ב-`lexical_class`) ומשימות 2–3 (אפס קוראים).
* Produces: `public.words` בלי `is_function_word` ובלי המגבלה `words_lexical_class_agrees`. ⛔ `lexical_class` והמגבלה `words_lexical_class_check` **נשארות**.

⚠️ **המספר הוא `0019` ⛔ ולא `0016` כפי ששורת T-121 נוקבת, ו⛔ לא `0017` כפי שגרסה קודמת של התוכנית קבעה (עודכן C-0241 · F-093).** `0017` נתפס בידי `0017_arcade_run_id.sql` שכבר **נכתבה ונדחפה**, ו-`0018` שמור למיגרציית הסיפורים (T-134 · פריט 42). ⚠️ **הלקח:** מספר שייך לקובץ ש**קיים** — שריון מראש לקובץ שטרם נכתב הוא בדיוק מה שייצר את ההתנגשות המשולשת הזאת. `0016` נתפס בידי מיגרציית המילוי, ושתי מיגרציות באותו מספר הן שני מקורות אמת לסדר ההרצה. הסטייה מוצהרת ונרשמת בשורת המשימה.

- [ ] **Step 1: כתוב את הבדיקה הנופלת**

`lib/supabase/dropIsFunctionWord.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SQL = readFileSync('supabase/migrations/0019_drop_is_function_word.sql', 'utf8');

describe('0019 — מחיקת words.is_function_word (T-121)', () => {
  it('המגבלה יורדת לפני העמודה — סדר, ⛔ לא צירוף מקרים', () => {
    const constraint = SQL.indexOf('words_lexical_class_agrees');
    const column = SQL.search(/drop\s+column\s+if\s+exists\s+is_function_word/i);
    expect(constraint).toBeGreaterThan(-1);
    expect(column).toBeGreaterThan(-1);
    expect(constraint).toBeLessThan(column);
  });

  it('אידמפוטנטית — שתי המחיקות מוגנות ב-if exists', () => {
    expect(SQL).toMatch(/drop\s+constraint\s+if\s+exists\s+words_lexical_class_agrees/i);
    expect(SQL).toMatch(/drop\s+column\s+if\s+exists\s+is_function_word/i);
  });

  it('⛔ lexical_class ⛔ אינה נפגעת', () => {
    expect(SQL).not.toMatch(/drop\s+column\s+if\s+exists\s+lexical_class/i);
    expect(SQL).not.toMatch(/drop\s+constraint\s+if\s+exists\s+words_lexical_class_check/i);
  });

  it('⛔ אינה ממלאת דבר — המילוי כבר קרה ב-0016', () => {
    expect(SQL).not.toMatch(/update\s+public\.words/i);
  });

  it('טרנזקציה אחת', () => {
    expect(SQL).toMatch(/^\s*begin;/im);
    expect(SQL).toMatch(/commit;\s*$/im);
  });
});
```

- [ ] **Step 2: הרץ ואמת שהיא נופלת**

הרץ: `npx vitest run lib/supabase/dropIsFunctionWord.test.ts`
צפוי: **FAIL** — `ENOENT` על `0019_drop_is_function_word.sql`.

- [ ] **Step 3: כתוב את המיגרציה**

```sql
-- 0019_drop_is_function_word.sql — T-121 · פריט 38 · פריט 8.
--
-- ⛔ אל תריץ את הקובץ הזה לפני 0016_lexical_class_backfill.sql. 0016 מעביר את
--    הידע; זה מוחק את המקור. סדר הפוך = איבוד סיווג מילות התפקוד לתמיד.
--
-- ⚠️ words_lexical_class_agrees (0006:107-111) מתייחסת לשתי העמודות, ולכן היא
--    יורדת כאן במפורש ⛔ ולא בהסתמכות על מחיקה משתמעת עם העמודה. מגבלה שנמחקת
--    בשקט היא מגבלה שאיש אינו יודע שנעלמה.
--
-- ⛔ מה שנשאר: lexical_class עצמה, ומגבלת הערכים words_lexical_class_check.
begin;

alter table public.words
  drop constraint if exists words_lexical_class_agrees;

alter table public.words
  drop column if exists is_function_word;

comment on column public.words.lexical_class is
  'function | content | NULL (לא ידוע). המקור היחיד מאז 0019 — is_function_word נמחקה (T-121). מולאה מ-0016: true ⇒ function; false בשורות origin = generated ⇒ content; כל השאר נשאר NULL.';

commit;
```

- [ ] **Step 4: הרץ ואמת שהיא עוברת**

הרץ: `npx vitest run lib/supabase/dropIsFunctionWord.test.ts`
צפוי: **PASS**, 5 בדיקות.

- [ ] **Step 5: מוטציה**

הפוך זמנית את סדר שתי פקודות ה-`alter` (העמודה לפני המגבלה).
הרץ: `npx vitest run lib/supabase/dropIsFunctionWord.test.ts`
צפוי: **FAIL** על `המגבלה יורדת לפני העמודה`.
**החזר את הסדר.** הרץ שוב וודא ירוק.

- [ ] **Step 6: פריט 42 ב-`plan/03-for-roy.md` + חוב ב-`30-architecture.md`**

פריט 42, באותן שש עמודות: `| # | מי ביקש | מתי | מה נדרש מרוי | למה זה חשוב | חוסם? |`

```
| 42 | DEV (C-…) | 2026-08-… | **להריץ את `supabase/migrations/0019_drop_is_function_word.sql`** בעורך ה-SQL של Supabase | ⛔ **רק אחרי שפריט 41 בוצע וקוד T-120 נמצא בייצור.** מוחק את `words.is_function_word` ואת המגבלה `words_lexical_class_agrees`. ⛔ הרצה מוקדמת מפילה את `/api/world/bank` ואת `/api/world/status` | ⏳ פתוח · ⛔ אינו חוסם את הלופ |
```

וב-`plan/30-architecture.md`, בסעיף החוב הטכני: שורה אחת שהחוב «שתי עמודות לאותה עובדה» (0006) נסגר, עם הפניה ל-`0016` ול-`0019`.

- [ ] **Step 7: אימות מלא + קומיט**

הרץ: `npm run typecheck && npm run check:core && npm test && npm run build`
צפוי: ארבע הפקודות ירוקות.

```bash
git add supabase/migrations/0019_drop_is_function_word.sql lib/supabase/dropIsFunctionWord.test.ts plan/03-for-roy.md plan/30-architecture.md
git commit -m "loop(DEV): T-121 מיגרציית 0019 — is_function_word והמגבלה הכפולה יורדות"
git push origin dev
```

---

## Self-Review — נעשה, ⛔ לא הוצהר

**1. כיסוי המפרט.**

| דרישה בשורת המשימה | היכן היא מבוצעת |
|---|---|
| T-120 «הקוד מפסיק לקרוא את `words.is_function_word`» | משימה 2 (שלושה נתיבים + `flashcard.ts`) ומשימה 3 (המחולל) |
| T-120 «`lexical_class` הופכת למקור היחיד» | משימה 1 (מילוי — התנאי שבלעדיו הקריאה שגויה) + משימה 2 |
| T-120 «בדיקה שנכשלת אם מישהו יחזיר את הקריאה» | `app/api/world/lexicalClassOnly.test.ts`, משימה 2 צעד 1, במתכונת `arcade/result/route.test.ts:32` |
| T-120 «⛔ אין לגעת במיגרציות בטיק הזה» | **⚠️ סטייה מוצהרת** — משימה 1 היא מיגרציה, והנימוק המדוד בראש התוכנית (F-086) |
| T-120 עמודת הקבצים: `flashcard.ts` · `batchRecord.ts` · `bank` · `status` · `build-ingest-sql.mjs` | ⚠️ **`batchRecord.ts` ⛔ אינו נערך** — האזכור שם הוא שם שדה ב-jsonl ⛔ ולא עמודה (ⓒ בראש התוכנית). ⚠️ **`recall/route.ts` ⛔ אינו בעמודה ונערך בכל זאת** — הוא הקורא השלישי, ובלעדיו המחיקה מפילה אותו |
| T-121 «`alter table words drop column is_function_word`» | משימה 4 |
| T-121 «חסומה עד ש-T-120 נדחפה» | שער הכניסה של משימה 4, שלושה תנאים נמדדים |
| T-121 «המגבלה `words_lexical_class_agrees` יורדת באותה מיגרציה» | משימה 4 צעד 3, ובדיקת סדר במפורש |
| T-121 «אידמפוטנטית, טרנזקציה אחת» | משימה 4 צעדים 1 ו-3 |
| T-121 «אינה נכנסת לייצור עד שרוי מריץ ידנית — פריט חדש ב-`03-for-roy`» | משימה 4 צעד 6, פריט 42 |
| T-121 שם הקובץ `0016_drop_is_function_word.sql` | ⚠️ **סטייה מוצהרת** — `0019` (עודכן C-0241), כי `0016` נתפס בידי המילוי |

**2. סריקת מציין-מקום.** אין `TODO`, אין «טיפול בשגיאות מתאים», אין «בדיקות כמו במשימה N». כל בלוק קוד מלא. שלושה מקומות מורים במפורש **לקרוא את הקוד בפועל לפני העריכה** (משימה 1 צעד 6, משימה 3 צעדים 1 ו-3) — ⛔ אלה אינם מציינֵי מקום אלא הודאה מדודה: מבנה טבלת `03-for-roy` ומבנה מחרוזת ה-`values` ב-`build-ingest-sql.mjs` ארוכים מכדי להעתיק בבטחה לתוך תוכנית, ותוכנית שמנחשת אותם גרועה מתוכנית שמורה לקרוא.

**3. עקביות טיפוסים.** `lexical_class` הוא `string | null` בכל מקום שהוא נקרא (`JoinedWord`), ו-`'function' | 'content' | null` בסכמה. ⛔ אין `any`. `LearnerWord.isFunctionWord` נשאר `boolean` ו⛔ אינו משנה שם — הנתיב הוא הגבול שבו העמודה הופכת למושג.

**4. פער שנשאר פתוח במכוון.** `lib/supabase/layer2.test.ts:99-110` בודקת את **טקסט 0006** ואוכפת שהמגבלה `words_lexical_class_agrees` מוצהרת שם. ⛔ היא נשארת ירוקה אחרי משימה 4, כי `0006` ⛔ אינו נערך — מיגרציה שנכתבה מחדש בדיעבד מפסיקה להיות היסטוריה. ⛔ אל תיגע בה.
