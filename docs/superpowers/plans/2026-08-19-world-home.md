# תוכנית מימוש — **`העולם` נעשה מסך בית**  ·  T-098 → T-104 → T-105 → T-106

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:executing-plans`.
> כל צעד הוא `- [ ]` ומיועד ל-2–5 דקות. ⛔ אל תדלג על צעד «הרץ ותראה שהבדיקה נכשלת».
> ⚠️ **ארבע משימות, ארבעה טיקים.** ⛔ אל תסגור שתיים בטיק אחד — כל סעיף מסתיים בקומיט משלו.

**Goal:** להפוך את `/world` ממסך-פיד יחיד ל**מסך בית של אפליקציות** (§ 4.2יא), ולהניח עליו את
המנגנון שהחזון דורש — «משהו שמחכה ללומד כשהוא חוזר מחר»: המשפט שהוא עצמו כתב, ומילת היעד
שלו חסרה (D-051 · § 4.2יב).

**Architecture:** אותה הפרדה שהזירה כבר מימשה ונמדדה. **כל החלטה יורדת לשכבה טהורה**
(`lib/core/worldApps.ts` · `lib/core/worldRecall.ts`) שאינה יודעת דבר על React, על HTTP ועל
Supabase; הנתיב שואל את הדאטהבייס «אילו שורות יש» ומוסר אותן לשכבה הטהורה, ⛔ ואינו מסנן,
מגריל או מדרג ב-SQL (בדיוק כמו `app/api/arcade/round/route.ts`); הרכיב **מצייר מצב ⛔ ואינו
מחשב אותו**. ⛔ **אפס מיגרציה ואפס עמודה חדשה** בכל ארבע המשימות — `world_posts` כבר מחזיק
`user_id · body_en · author_kind · created_at` (`0007` + `0010`, שתיהן הורצו), ומילת היעד
**נגזרת בזמן הצגה** (תבנית D-043).

**Tech Stack:** Next.js 16 App Router · React 19 · TypeScript (⛔ ללא `any`) · Tailwind
(אסימונים סמנטיים בלבד) · vitest (סביבת `node`, ⛔ בלי jsdom). ⛔ אפס ספרייה חדשה, אפס תלות,
אפס נכס חיצוני, אפס קריאה ל-AI.

**Spec:** `plan/40-decisions.md` § 4.2יא (T-098) · § 4.2יב (T-104…T-106) · D-046 · D-050 ·
D-051 · D-043 · D-037 · D-044/D-047 (הגבול) · `docs/api-contract.md` §§ `GET /api/world/posts` ·
`GET /api/world/bank` · `GET /api/arcade/round` · `plan/35-design-constitution.md` (קפואה) ·
`plan/15-syllabus-digest.md` שורות 132–133 (S20–S24 · R-021 · R-022).

---

## Global Constraints — חלים על **כל** משימה בתוכנית

| # | האילוץ | הערך המדויק |
|---|---|---|
| 1 | ⛔ אין כתיבה למנוע החזרות | ⛔ אפס `word_progress` · `easiness` · `interval_days` · `repetition` · `next_review_at` · `self_marked_known` · `current_level` בכל קובץ שנוצר כאן (D-051 · פריט 31 ב-`03-for-roy`) |
| 2 | ⛔ אין ניקוד | ⛔ אפס `xp` · `score` · `points` · `coin` · `streak` · `leaderboard` · «ניקוד» · «מטבע» · «לוח תוצאות» · «רצף» (D-050 · E4) |
| 3 | ⛔ אין שעון | ⛔ אפס `setTimeout` · `setInterval` · `deadline` · `countdown` — כאן המילים ⛔ אינן בהכרח ידועות, ולכן S15 אוסר (D-049) |
| 4 | ⛔ אין hex גולמי | כל צבע דרך אסימון Tailwind (`text-ink` · `text-ink-muted` · `bg-surface-raised` · `border-border-strong` · `border-border-subtle` · `bg-brand-surface` · `text-brand-on`) — חוקה § 6 |
| 5 | ⛔ אין אמוג'י כאייקון | SVG מוטבע בלבד, `currentColor`, תבנית `components/LockIcon.tsx` — חוקה § 6 |
| 6 | יעד מגע | `min-h-touch` (44px) על **כל** בקרה ניתנת להקשה — אריח, אפשרות, קישור |
| 7 | ⛔ אין מרכוז אנכי | ⛔ אפס `justify-center` על מכולת עמוד · ⛔ אפס `h-screen` (`min-h-[100dvh]` בלבד) — חוקה § 4 · F-011 · F-016 |
| 8 | צבע לעולם אינו ערוץ יחיד | כל מצב נושא **תווית עברית** לצד הצבע — חוקה § 1 |
| 9 | אנגלית בתוך עברית | **אך ורק** דרך `<EnWord>` / `<EnText>` (`components/EnWord.tsx:20` · `:66`) — חוקה § 2 |
| 10 | מוטיון | 150–300ms מ-`transition-*` של Tailwind; `prefers-reduced-motion` כבר מנוטרל גלובלית ב-`app/globals.css` ⇒ ⛔ אל תוסיף שאילתת מדיה משלך |
| 11 | רדיוסים | `rounded-md` שדות · `rounded-lg` כפתורים ואריחים · `rounded-2xl` כרטיסיות. ⛔ אין ערך רביעי (חוקה § 3) |
| 12 | נוסח כשל | `FAILURE_HE` · `RETRY_HE` מ-`lib/core/failure.ts` ⛔ ולא מחרוזת חדשה (T-056) |
| 13 | «—» ⛔ ולא «0» | מספר שאין לנו אינו אפס — כלל `<MeScreen>`/`<DeckSelector>`/`<ArcadeEntry>` |
| 14 | ⛔ אין `dataviz` | אין כאן גרף ואין מדד. «שרשרת הכתיבה» היא **מספר יחיד ורשימה** (§ 4.2יב שאלה 5) |
| 15 | ⛔ אין נגיעה ב-`/world/compose` | § 4.2ה נשארת כפי שהיא, ופריט 29 ב-`03-for-roy` ⛔ **אינו** מוכרע כאן |
| 16 | טהרה | `npm run check:core` — ⛔ אפס React/window/document/localStorage/fetch/process.env ב-`lib/core/` |

---

## 0 · מה כבר נמדד בטיק התכנון, ⛔ ולא נוחש  (C-0189)

⚠️ כל שורה כאן **נקראה מהקוד** ב-19/08/2026. ⛔ אל תסמוך על הזיכרון — אם משהו כאן אינו נכון
בזמן הביצוע, **זה ממצא**, ⛔ ולא «התוכנית התכוונה».

1. **`app/(tabs)/world/page.tsx` הוא קובץ בן 25 שורות שכל גופו `return <WorldFeed />;`** —
   ⛔ אפס גישה ל-Supabase, ⛔ אפס `getUser()`. ההערה בראשו מנמקת למה, וההנמקה נשארת בתוקף.
2. **`components/WorldFeed.tsx` מחזיר `<section className="flex flex-col gap-6">`** ובתוכו
   `<h1>העולם</h1>`, מונה «מילים שהפקת», וחמישה מצבים (`loading` · `posts` · `empty` ·
   `schema_missing` · `error` · `session_expired`). מצב `empty` מחזיק
   `data-primary-action="true"`. ⛔ **אל תמחק את הרכיב** — התוכנית מוסיפה **שכבה מעליו**.
3. **`/world` ⛔ אינו ב-`FLOW_ROUTES`** (`scripts/verify-mobile.mjs:127` —
   `['/', '/signup', '/login', '/dev/onboarding', '/study', '/world/compose']`) ⇒ בדיקת
   «בדיוק פעולה ראשית אחת» ⛔ **אינה רצה** על המסך הזה. ⇒ ⛔ **אל תסמן אריח כ-`data-primary-action`**.
4. **`EXPECTED_CONSOLE['/world']`** (`verify-mobile.mjs:242`) מחזיק היום שתי רשומות בדיוק:
   `/api/world/posts` ו-`/api/world/status`, שתיהן `503`. **כל בקשה חדשה שהמסך יעשה חייבת
   רשומה משלה**, כתובה מלאה וסטטוס אחד — אחרת `clean console` נופל בשלושת הרוחבים.
   ⚠️ וזה **בדיוק המדד** שמוכיח שהרכיב באמת נטען (הלקח של C-0188).
5. **`GET /api/arcade/round` מחזיר שש תשובות** (`docs/api-contract.md:679`), והמיפוי המלא
   שלהן ל-שלושה מצבי מסך כבר כתוב ב-`components/ArcadeEntry.tsx:toState` — ⛔ **אל תכתוב
   מיפוי שני.** `ARCADE_MIN_WORDS = 12` חי במקום אחד: `lib/core/arcadeRound.ts:14`.
6. **`components/ArcadeEntry.tsx` יושב בתור הסקירה של ה-Critic (C-0188).** ⛔ **אל תערוך
   אותו בתוכנית הזאת** — גם לא «רק להוציא מחרוזת». `ArcadeEntry.test.ts:64` טוען
   `expect(CODE).toContain('נדרשות')`, ולכן הזזת המחרוזת **מפילה בדיקה של משימה בסקירה**.
   הכלי מול הכפילות הוא **בדיקת עוגן** (§ 1, צעד 6), ⛔ לא עריכה.
7. **`GET /api/world/bank`** (`app/api/world/bank/route.ts`) כבר מדגים **בדיוק** את שלוש
   הקריאות ש-T-104 צריך: `words` עם `is_function_word`; `word_progress` עם
   `select('words!inner(headword)')` ו-`eq('user_id', user.id)`; ו-`world_posts` עם
   `eq('author_kind','learner')`. תקרות: `MAX_BANK_ROWS = 2000` · `MAX_USED_ROWS = 500`.
8. **`lib/core/world.ts` כבר מחזיק את הטוקניזציה**: `PUNCTUATION_TOKENS` (`:39`) ·
   `normaliseToken` (`:54`) · `producedWordCount` (`:120`, שהוא **ההפך המדויק** של
   `renderDraft` וחותך סימני פיסוק **מהסוף בלבד**). ⛔ **אל תכתוב מפצל שני** — ייבא.
9. **`splitAroundTarget` קיים אך ⛔ אינו מיוצא** (`lib/core/flashcard.ts:156`), והוא בונה
   `ExampleSegment[]` שמתחבר חזרה למשפט **בית-בבית**. `EnTextSegment` מיוצא מ-
   `components/EnWord.tsx:28`, ו-`EnText` (`:66`) מצייר `isTarget` כ-`<strong>` עם קו תחתון
   — ⛔ **ולא צבע** (הנימוק, כולל 4.42:1, כתוב שם ואינו חוזר כאן).
10. **`GET /api/world/posts`** מסנן `user_id` **וגם** `author_kind='learner'`, ממיין
    `created_at` יורד, מחזיר `id, body_en, created_at` בלבד, ותקרתו `MAX_FEED_ROWS = 100`.
    ⚠️ **`total` הוא גודל התשובה, ⛔ ולא ספירת טבלה** — וזה בדיוק מה ש-§ 4 חייבת לתקן.
11. **דפוס הכשל של נתיב**: `readSupabaseEnv()` → `getUser()` → שאילתה (סדר C-0032);
    `isSchemaMissing` בודק `42P01` · `PGRST205` · `42703` · `PGRST204`; הודעת PostgREST
    יורדת ללוג ⛔ **ולעולם לא לגוף התשובה**.
12. **`parseLevel`** מיוצא מ-`lib/core/levelSummary.ts` ומשמש את נתיב הזירה — ⛔ אל תכתוב
    ולידציה שנייה ל-`current_level`.

---

## Interfaces — החתימות המדויקות. ⛔ אל תמציא שם, ⛔ אל תשנה סדר פרמטרים

```ts
// ── lib/core/worldApps.ts  (חדש · טהור · § 1) ──────────────────────────────
export type WorldAppId = 'compose' | 'arcade';

export type AppState =
  /** פתוח: הלומד יכול להיכנס עכשיו. */
  | { readonly kind: 'open' }
  /** מושבת **עם מספר** (D-046). `noteHe` **חייב** להכיל ספרה — נאכף בבדיקה. */
  | { readonly kind: 'locked'; readonly noteHe: string }
  /** לא ידוע: הקריאה נכשלה. «—» ⛔ ולא «0». */
  | { readonly kind: 'unknown' };

export interface WorldApp {
  readonly id: WorldAppId;
  readonly labelHe: string;
  readonly href: string;
  readonly state: AppState;
  /** «חיוב שלא נגמר» — האריח שיש בו כזה מוצג גדול יותר (§ 4.2יא). */
  readonly hasActiveTask: boolean;
}

/** סדר הרשת = סדר הפתיחה, ו⛔ לא «הכי בשימוש» (ספירת שימוש היא עמודה חדשה — נדחתה). */
export const WORLD_APP_ORDER: readonly WorldAppId[]; // ['compose', 'arcade']
export const WORLD_APP_LABEL_HE: Readonly<Record<WorldAppId, string>>;
export const WORLD_APP_HREF: Readonly<Record<WorldAppId, string>>;

/** «נדרשות 12 מילים ברמה, יש 8». שני המספרים מהשרת ⛔ ואינם כתובים בקוד. */
export function levelTooSmallNoteHe(required: number, eligible: number): string;

/** האריח הגדול: הראשון עם `hasActiveTask` שגם `open`; אין ⇒ **האחרון הפתוח** בסדר
 *  הרשת (= «האחרון שנפתח»); אין פתוח בכלל ⇒ `null`. ⛔ אין הגרלה ואין שעון. */
export function featuredAppId(apps: readonly WorldApp[]): WorldAppId | null;

/** מדד ההצלחה ⓐ של § 4.2יא: «מה מתקדם = מספר האפליקציות הפתוחות». */
export function openAppCount(apps: readonly WorldApp[]): number;

// ── lib/core/worldRecall.ts  (חדש · טהור · § 2) ────────────────────────────
export const RECALL_OPTION_COUNT = 4;
/** סדר הגילים שנבחר ב-§ 4.2יב: קודם ~3 ימים, אחריו ~7, אחריו ~1. */
export const RECALL_AGE_PREFERENCE_DAYS: readonly number[]; // [3, 7, 1]

export interface RecallPost {
  readonly id: string;
  readonly bodyEn: string;
  /** ISO-8601 כפי שהדאטהבייס החזיר. ⛔ הפונקציה הטהורה אינה קוראת לשעון. */
  readonly createdAt: string;
}

/** מילה של הלומד: `word_progress` ⋈ `words`. `isFunctionWord` ו-`ngslRank` מהעמודות. */
export interface LearnerWord {
  readonly headword: string;
  readonly band: string | null;
  readonly ngslRank: number | null;
  readonly isFunctionWord: boolean;
}

export interface RecallCard {
  readonly postId: string;
  readonly bodyEn: string;
  /** מספר שלם, ⛔ לא תאריך. הנוסח נבנה במסך: «כתבת את זה לפני N ימים». */
  readonly daysAgo: number;
  readonly answer: string;
  /** ארבע, ⛔ ללא כפילות, כולל התשובה, בסדר דטרמיניסטי מ-`seed`. */
  readonly options: readonly string[];
  /** המשפט מפוצל סביב מילת היעד; `segments.map(s => s.text).join('') === bodyEn`. */
  readonly segments: readonly { readonly text: string; readonly isTarget: boolean }[];
}

/** גיל בימים שלמים, כלפי מטה. ⛔ `now` נכנס כפרמטר — אין `Date.now()` ב-lib/core. */
export function ageInDays(createdAt: string, nowMs: number): number;

/** המילה הנדירה ביותר לפי NGSL מבין מילות הלומד שמופיעות במשפט.
 *  ⛔ מילת תפקוד לעולם אינה יעד · `null` ⇒ המשפט **מדולג בשקט**. */
export function pickRecallTarget(
  bodyEn: string,
  words: readonly LearnerWord[],
): LearnerWord | null;

/** הכרטיס היחיד של היום, או `null` ⇒ `{ok:true, card:null}` ⛔ ולא 404. */
export function buildRecallCard(input: {
  readonly posts: readonly RecallPost[];
  readonly words: readonly LearnerWord[];
  readonly nowMs: number;
  readonly seed: number;
}): RecallCard | null;

// ── components (§ 1 · § 3 · § 4) ───────────────────────────────────────────
// components/AppGrid.tsx      — 'use client', ⛔ אפס props, קורא /api/arcade/round
// components/RecallCard.tsx   — 'use client', ⛔ אפס props, קורא /api/world/recall
// components/WritingChain.tsx — 'use client', ⛔ אפס props, קורא /api/world/posts
```

---

## 1 · T-098 — `/world` נעשה רשת אפליקציות  *(המעטפת בלבד)*

**מה נמסר:** `lib/core/worldApps.ts` + `lib/core/worldApps.test.ts` +
`components/AppGrid.tsx` + `components/AppGrid.test.ts` + שתי שורות ב-
`app/(tabs)/world/page.tsx` + רשומה אחת ב-`EXPECTED_CONSOLE` של `verify-mobile.mjs`.

**שלוש ההכרעות, וכולן חוקי המשימה ⛔ ולא טעם:**

⓵ **הרשת מוצבת מעל הפיד ⛔ ואינה מחליפה אותו.** § 4.2יא: «היא מוסיפה **שכבה מעל** מה
שקיים», ו-T-098 ⛔ «אינה נוגעת ב-`/world/compose`». ⇒ `page.tsx` מחזיר
`<><AppGrid /><WorldFeed /></>` — ⛔ **אפס שורה שנמחקת מ-`WorldFeed`**. פריט 29 ב-
`03-for-roy` (הסתירה בין החזון לבין `העולם` שנבנה) הוא **בדיוק** מה שיכריע אם הפיד נשאר,
והוא ⛔ אינו מוכרע כאן.

⓶ **בדיוק שני אריחים, ו⛔ אין שלישי.** § 4.2יא: «הרכבה» (קיים) · «זירה» (T-095). וכלל
המסננת שכתוב באותו סעיף — **«אריח בלי תנאי מדיד ⛔ אינו נכנס לרשת»** — הוא שקובע שספרייה,
הודעות, מייל וסימולטורים ⛔ **אינם ברשת**: לאף אחד מהם ⛔ אין תנאי פתיחה נקוב במספר, ואריח
«בקרוב» בלי מספר אסור מפורשות (D-046). ⚠️ **הפער הזה נרשם כממצא ⛔ ואינו מוסתר** — ראה
§ 5, ממצא F-072.

⓷ **המושבת עם המספר מגיע מהשרת.** לזירה **יש** תנאי מדיד ונקוב, והוא כבר על החוט:
`reason:'level_too_small'` עם `eligible` ו-`required` (`api-contract.md:679`). ⇒ אריח
«זירה» נעול = «נדרשות 12 מילים ברמה, יש 8», והמספרים **מהתשובה** ⛔ ולא מהקוד.

### צעדים

- [ ] **1.1** צור `lib/core/worldApps.ts` עם **החתימות מבלוק Interfaces בדיוק**, גוף ריק
      (`throw new Error('not implemented')` בכל פונקציה). ⛔ אל תכתוב לוגיקה עדיין.
- [ ] **1.2** צור `lib/core/worldApps.test.ts` והדבק את הבדיקות האלה **כלשונן**:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  WORLD_APP_ORDER,
  WORLD_APP_LABEL_HE,
  WORLD_APP_HREF,
  featuredAppId,
  levelTooSmallNoteHe,
  openAppCount,
  type WorldApp,
} from './worldApps';

const app = (over: Partial<WorldApp> & Pick<WorldApp, 'id'>): WorldApp => ({
  labelHe: WORLD_APP_LABEL_HE[over.id],
  href: WORLD_APP_HREF[over.id],
  state: { kind: 'open' },
  hasActiveTask: false,
  ...over,
});

describe('worldApps', () => {
  it('⛔ בדיוק שני אריחים, ⛔ ואין שלישי (§ 4.2יא)', () => {
    expect([...WORLD_APP_ORDER]).toEqual(['compose', 'arcade']);
    expect(Object.keys(WORLD_APP_HREF).sort()).toEqual(['arcade', 'compose']);
    expect(WORLD_APP_HREF.compose).toBe('/world/compose');
    expect(WORLD_APP_HREF.arcade).toBe('/arcade');
  });

  it('כל תווית היא עברית ⛔ ואינה ריקה (חוקה § 1 — צבע אינו ערוץ יחיד)', () => {
    for (const id of WORLD_APP_ORDER) {
      expect(WORLD_APP_LABEL_HE[id]).toMatch(/[֐-׿]/);
    }
  });

  it('⛔ אריח מושבת נושא מספר — «בקרוב» בלי ספרה אינו מצב חוקי (D-046)', () => {
    const note = levelTooSmallNoteHe(12, 8);
    expect(note).toMatch(/\d/);
    expect(note).toContain('12');
    expect(note).toContain('8');
    expect(note).not.toContain('בקרוב');
  });

  it('הגדול = הראשון עם חיוב פתוח; אין ⇒ **האחרון הפתוח** (§ 4.2יא)', () => {
    expect(
      featuredAppId([app({ id: 'compose' }), app({ id: 'arcade', hasActiveTask: true })]),
    ).toBe('arcade');
    // אין חיוב ⇒ האחרון שנפתח, ⛔ ולא הראשון ברשימה
    expect(featuredAppId([app({ id: 'compose' }), app({ id: 'arcade' })])).toBe('arcade');
    // חיוב על אריח **נעול** ⛔ אינו מגדיל אותו — אי-אפשר להיכנס אליו
    expect(
      featuredAppId([
        app({ id: 'compose' }),
        app({ id: 'arcade', hasActiveTask: true, state: { kind: 'locked', noteHe: 'נדרשות 12 מילים ברמה, יש 8' } }),
      ]),
    ).toBe('compose');
    expect(
      featuredAppId([
        app({ id: 'compose', state: { kind: 'unknown' } }),
        app({ id: 'arcade', state: { kind: 'unknown' } }),
      ]),
    ).toBeNull();
  });

  it('«מספר האפליקציות הפתוחות» סופר `open` בלבד ⛔ ולא `unknown`', () => {
    expect(
      openAppCount([
        app({ id: 'compose' }),
        app({ id: 'arcade', state: { kind: 'unknown' } }),
      ]),
    ).toBe(1);
  });

  it('⛔ אפס ניקוד, מטבע ולוח תוצאות במודול (D-050)', () => {
    const src = readFileSync('lib/core/worldApps.ts', 'utf8');
    for (const banned of [/\bxp\b/i, /\bscore\b/i, /\bpoints\b/i, /\bcoin\b/i, /\bstreak\b/i, /לוח תוצאות/]) {
      expect(src).not.toMatch(banned);
    }
  });

  it('⛔ הנוסח ⛔ אינו סוטה מזה שכבר על המסך ב-<ArcadeEntry> (עוגן, ⛔ לא עריכה)', () => {
    // ⚠️ `<ArcadeEntry>` יושב בתור הסקירה (C-0188) ⇒ ⛔ אסור לערוך אותו. הבדיקה הזאת
    // הופכת את הכפילות ל**נמדדת**: היום שבו אחד הנוסחים ישתנה — היא נופלת בשמה.
    const entry = readFileSync('components/ArcadeEntry.tsx', 'utf8');
    expect(entry).toContain('נדרשות');
    expect(entry).toContain('מילים ברמה, יש');
    expect(levelTooSmallNoteHe(12, 8)).toBe('נדרשות 12 מילים ברמה, יש 8');
  });
});
```

- [ ] **1.3** הרץ `npx vitest run lib/core/worldApps.test.ts` ו**ראה אותן נכשלות**
      (`not implemented`). ⛔ אל תמשיך לפני שראית אדום.
- [ ] **1.4** מלא את `lib/core/worldApps.ts`. `featuredAppId`: `apps.find(a => a.hasActiveTask
      && a.state.kind === 'open')?.id` ⇒ אחרת `[...apps].reverse().find(a => a.state.kind ===
      'open')?.id` ⇒ אחרת `null`. הרץ שוב — **ירוק**.
- [ ] **1.5** צור `components/AppGrid.tsx`: `'use client'`, ⛔ אפס props, `apiGet` יחיד ל-
      `/api/arcade/round` ב-`useEffect` עם דגל `cancelled` (תבנית `ArcadeEntry.tsx`).
      המיפוי: `level === null` ⇒ `locked` עם «בחר רמה כדי לשחק»… ⚠️ **עצור** — «בחר רמה» ⛔
      אינו מספר. ⇒ במצב הזה האריח הוא **`open` עם `href='/cards'`**, בדיוק כמו
      `data-arcade-entry-choose` — נעילה בלי מספר אסורה, וקישור לבחירת רמה הוא היעד שכבר
      הוכרע (D-037). `reason==='level_too_small'` ⇒ `locked` + `levelTooSmallNoteHe`.
      `round !== null` ⇒ `open` + `hasActiveTask: true`. `!ok` ⇒ `unknown`.
      אריח «הרכבה» תמיד `open`, `hasActiveTask: false` (⛔ אין לו עדיין אות חיוב מוכרע —
      זה חלק מ-F-072, והוא נמסר ב-§ 3 מהתשובה שכבר תהיה על המסך).
      פריסה: `<ul>` ב-`grid grid-cols-2 gap-3`, האריח הגדול `col-span-2`;
      כל אריח `min-h-touch rounded-lg`; פתוח ⇒ `<Link>`; נעול ⇒ `<button type="button"
      aria-disabled="true">` **בלי handler** ⛔ ולא התכונה `disabled`.
      ⛔ **אל תוסיף `data-primary-action`** (§ 0 עובדה 3).
- [ ] **1.6** צור `components/AppGrid.test.ts` כשומר מקור (תבנית `ArcadeEntry.test.ts:1-56`,
      כולל הלבנת ההערות ב-`CODE` — הלקח של F-065/C-0187: `/**` כאיבר ראשון אחרי `{` נבלע).
      הבדיקות המחייבות:
      `expect(CODE).toMatch(/apiGet<[^>]*>\('\/api\/arcade\/round'\)/)` ·
      `expect(CODE, '⛔ 12 אינו מספר בקוד').not.toMatch(/['"`][^'"`]*\b12\b/)` ·
      `expect(CODE).toContain('levelTooSmallNoteHe')` ·
      `expect(CODE).toContain('aria-disabled')` ו-`expect(CODE).not.toMatch(/\bdisabled=\{/)` ·
      `expect(CODE).not.toContain('data-primary-action')` ·
      `expect(CODE).not.toMatch(/backdrop-blur|shadow-2xl|rotate-|perspective/)` ← **מדד ⓒ
      של § 4.2יא, ונופל בשם** · `expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)` ·
      `expect(CODE).not.toMatch(/\bxp\b|\bscore\b|\bcoin\b/i)`.
- [ ] **1.7** ערוך את `app/(tabs)/world/page.tsx`: ייבא `AppGrid` והחזר
      `<><AppGrid /><WorldFeed /></>`. הוסף **פסקה אחת** להערה בראש הקובץ שמסבירה למה הרשת
      מעל הפיד ו⛔ לא במקומו (⓵ למעלה). ⛔ אל תיגע ביתר ההערה.
- [ ] **1.8** הוסף ל-`EXPECTED_CONSOLE['/world']` ב-`scripts/verify-mobile.mjs` שורה אחת:
      `/status of 503[\s\S]*@\S*\/api\/arcade\/round/`, עם הערה בת שתי שורות בסגנון הרשומות
      שסביבה (כתובת אחת, סטטוס אחד).
- [ ] **1.9** **מוטציה 1** — הפוך את `featuredAppId` להחזיר תמיד `apps[0]?.id ?? null`.
      הרץ `npx vitest run lib/core/worldApps.test.ts` ⇒ חייבת ליפול «הגדול = הראשון עם חיוב
      פתוח». שחזר ב-`git checkout --`.
- [ ] **1.10** **מוטציה 2** — הוסף `shadow-2xl` ל-`className` של אריח ב-`AppGrid.tsx`. הרץ
      `npx vitest run components/AppGrid.test.ts` ⇒ חייבת ליפול בשם. שחזר.
- [ ] **1.11** **מוטציה 3 (על ההארנס)** — הסר את השורה שהוספת ב-1.8 והרץ
      `npm run check:mobile` ⇒ `clean console` חייב ליפול בשלושת הרוחבים. **זה מה שמוכיח
      שהרכיב באמת נטען ובאמת מבקש.** שחזר.
- [ ] **1.12** שער האימות המלא (§ 6 של הפרומפט) + `npm run check:mobile`, ואז עדכון
      `plan/` וקומיט. ⚠️ `npm run measure:plan` הוא **הפעולה האחרונה לפני הקומיט**, אחרי כל
      עריכה ב-`50-tasks.md`/`60-findings.md` (הלקח של F-071 · F-063).

---

## 2 · T-104 — `GET /api/world/recall`  *(שרת · ⛔ אפס מיגרציה)*

**מה נמסר:** `lib/core/worldRecall.ts` + `lib/core/worldRecall.test.ts` +
`app/api/world/recall/route.ts` + `app/api/world/recall/route.test.ts` +
`docs/api-contract.md` **באותו קומיט**.

**החוזה — שלוש תשובות בלבד, וכל אחת נכתבת ל-`api-contract.md` לפני שהיא נבדקת:**

```json
{ "ok": true, "card": null }
```
```json
{ "ok": true,
  "card": { "postId": "…", "bodyEn": "the garden is quiet.", "daysAgo": 3,
            "answer": "garden", "options": ["garden", "table", "river", "market"],
            "segments": [{ "text": "the ", "isTarget": false },
                         { "text": "garden", "isTarget": true },
                         { "text": " is quiet.", "isTarget": false }] } }
```
`401 {"ok":false,"code":"session_expired"}` ·
`503 {"ok":false,"code":"schema_missing","message":"המאגר עדיין לא הוקם"}` ·
`503 {"ok":false,"code":"unavailable"}`.

⛔ **`card: null` ⛔ ואינו 404** (§ 4.2יב). ⛔ **הנתיב הוא `GET` ואינו כותב דבר** — אין בו
`.insert(` · `.update(` · `.upsert(` · `.delete(`, ו⛔ אינו נוגע ב-`word_progress`
לא בכתיבה **ולא בקריאה של SM-2** (הוא קורא ממנה **מילים בלבד**, דרך `words!inner(...)` —
בדיוק כמו `/api/world/bank`).

### צעדים

- [ ] **2.1** כתוב את הסעיף `## GET /api/world/recall` ב-`docs/api-contract.md`, **מיד אחרי**
      `## GET /api/world/bank`, עם שלוש התשובות למעלה ועם המשפט «⛔ הנתיב אינו כותב דבר».
- [ ] **2.2** צור `lib/core/worldRecall.ts` עם החתימות מבלוק Interfaces, גוף
      `throw new Error('not implemented')`.
- [ ] **2.3** צור `lib/core/worldRecall.test.ts` והדבק **כלשונן**:

```ts
import { describe, expect, it } from 'vitest';
import {
  RECALL_OPTION_COUNT,
  ageInDays,
  buildRecallCard,
  pickRecallTarget,
  type LearnerWord,
  type RecallPost,
} from './worldRecall';

const DAY = 86_400_000;
const NOW = Date.parse('2026-08-19T09:00:00Z');
const at = (days: number): string => new Date(NOW - days * DAY).toISOString();

const w = (headword: string, ngslRank: number | null, isFunctionWord = false): LearnerWord => ({
  headword, ngslRank, isFunctionWord, band: 'A1',
});
const WORDS: LearnerWord[] = [
  w('the', 1, true), w('is', 3, true), w('a', 5, true),
  w('table', 900), w('garden', 2600), w('river', 1800), w('market', 2100), w('quiet', 3100),
];
const post = (id: string, bodyEn: string, days: number): RecallPost => ({
  id, bodyEn, createdAt: at(days),
});

describe('ageInDays', () => {
  it('ימים שלמים כלפי מטה, ⛔ ולא עיגול', () => {
    expect(ageInDays(at(3), NOW)).toBe(3);
    expect(ageInDays(new Date(NOW - 3 * DAY - 23 * 3_600_000).toISOString(), NOW)).toBe(3);
    expect(ageInDays(at(0), NOW)).toBe(0);
  });
});

describe('pickRecallTarget', () => {
  it('המילה הנדירה ביותר לפי NGSL מבין מילות הלומד', () => {
    expect(pickRecallTarget('the table is by the river.', WORDS)?.headword).toBe('river');
  });

  it('⛔ מילת תפקוד לעולם אינה יעד — «the» אינו פריט לימוד (מדד ⓒ)', () => {
    expect(pickRecallTarget('the a is the a.', WORDS)).toBeNull();
  });

  it('⛔ מילה שאינה של הלומד אינה יעד', () => {
    expect(pickRecallTarget('the helicopter is loud.', WORDS)).toBeNull();
  });

  it('דירוג חסר (null) ⛔ אינו מנצח דירוג קיים — הוא הפחות ידוע עלינו, ⛔ לא הנדיר ביותר', () => {
    expect(pickRecallTarget('a table and a lamp.', [...WORDS, w('lamp', null)])?.headword)
      .toBe('table');
  });

  it('התאמה היא טוקן שלם ⛔ ולא includes — «car» ⛔ אינו מסופק על ידי «card» (F-020)', () => {
    expect(pickRecallTarget('i have a card.', [...WORDS, w('car', 400)])).toBeNull();
  });
});

describe('buildRecallCard', () => {
  const base = { words: WORDS, nowMs: NOW, seed: 7 };

  it('⛔ משפט מהיום אינו נבחר, ו-3 ימים מנצח 7 ואת 1 (§ 4.2יב)', () => {
    const card = buildRecallCard({
      ...base,
      posts: [post('today', 'the garden is quiet.', 0),
              post('seven', 'the market is quiet.', 7),
              post('three', 'the river is quiet.', 3)],
    });
    expect(card?.postId).toBe('three');
    expect(card?.daysAgo).toBe(3);
  });

  it('⛔ משפט שכל מילותיו מילות תפקוד מדולג **בשקט** (מדד ⓑ)', () => {
    const card = buildRecallCard({ ...base, posts: [post('p1', 'the a is a.', 3),
                                                    post('p2', 'the garden is quiet.', 7)] });
    expect(card?.postId).toBe('p2');
  });

  it('אפס משפטים כשירים ⇒ `null` ⛔ ולא זריקה', () => {
    expect(buildRecallCard({ ...base, posts: [] })).toBeNull();
    expect(buildRecallCard({ ...base, posts: [post('p', 'the a is a.', 3)] })).toBeNull();
  });

  it('ארבע אפשרויות, ⛔ ללא כפילות, כולן מילות הלומד, והתשובה ביניהן (מדד ⓓ)', () => {
    const card = buildRecallCard({ ...base, posts: [post('p', 'the garden is quiet.', 3)] });
    expect(card?.options).toHaveLength(RECALL_OPTION_COUNT);
    expect(new Set(card?.options).size).toBe(RECALL_OPTION_COUNT);
    expect(card?.options).toContain(card?.answer);
    const learner = new Set(WORDS.filter((x) => !x.isFunctionWord).map((x) => x.headword));
    for (const option of card?.options ?? []) expect(learner.has(option)).toBe(true);
  });

  it('פחות מ-4 מילים כשירות ⇒ הכרטיס **מדולג בשקט** ⛔ ולא מוצג עם 2 (§ 4.2יב מצבי קצה)', () => {
    const thin = [w('the', 1, true), w('garden', 2600), w('table', 900)];
    expect(buildRecallCard({ ...base, words: thin, posts: [post('p', 'the garden is here.', 3)] }))
      .toBeNull();
  });

  it('המקטעים מתחברים חזרה למשפט **בית-בבית**, ובדיוק אחד הוא היעד', () => {
    const card = buildRecallCard({ ...base, posts: [post('p', 'the garden is quiet.', 3)] });
    expect(card?.segments.map((s) => s.text).join('')).toBe('the garden is quiet.');
    expect(card?.segments.filter((s) => s.isTarget)).toHaveLength(1);
  });

  it('אותו seed ⇒ אותו סדר אפשרויות. ⛔ אין `Math.random` במודול', () => {
    const posts = [post('p', 'the garden is quiet.', 3)];
    expect(buildRecallCard({ ...base, posts })?.options)
      .toEqual(buildRecallCard({ ...base, posts })?.options);
  });
});
```

- [ ] **2.4** הרץ ו**ראה אדום**. ⛔ אל תמשיך לפני זה.
- [ ] **2.5** מלא את `lib/core/worldRecall.ts`. ייבא `normaliseToken` ו-`PUNCTUATION_TOKENS`
      מ-`./world` ⛔ **ואל תכתוב מפצל שני** (§ 0 עובדה 8). הבחירה: מיין את המשפטים לפי
      `RECALL_AGE_PREFERENCE_DAYS` (מרחק מוחלט מ-3, אחר כך מ-7, אחר כך מ-1), דלג על
      `daysAgo === 0`, וקח את הראשון שיש לו יעד **וגם** ≥4 מסיחים כשירים. ההגרלה מ-`seed`
      בלבד — LCG קטן, בדיוק כמו `lib/core/arcadeRound.ts`. ⛔ אפס `Math.random`, אפס
      `Date.now()`. הרץ — **ירוק**.
- [ ] **2.6** צור `app/api/world/recall/route.ts` בדפוס `app/api/world/bank/route.ts`:
      `readSupabaseEnv()` → `getUser()` → שלוש קריאות:
      ⓐ `world_posts` `select('id, body_en, created_at')` `.eq('user_id', user.id)`
      `.eq('author_kind','learner')` `.order('created_at',{ascending:false})`
      `.limit(MAX_RECALL_POSTS)` (‏`= 100`, תקרת שאילתה ⛔ לא מגבלת מוצר);
      ⓑ `word_progress` `select('words!inner(headword, cefr_profile_band, ngsl_rank,
      is_function_word)')` `.eq('user_id', user.id)` `.limit(MAX_LEARNER_WORDS)` (‏`= 2000`);
      ⓒ ⛔ **אין ⓒ.** שתי קריאות בדיוק.
      ה-`seed` נגזר מ-`Date.now() >>> 0` **בנתיב** ⛔ ולא בשכבה הטהורה, בדיוק כמו
      `arcade/round`. שגיאה ⇒ `isSchemaMissing` ⇒ `schemaMissing()` אחרת `unavailable()`.
- [ ] **2.7** צור `app/api/world/recall/route.test.ts` כשומר מקור (תבנית
      `app/api/arcade/round/route.test.ts`, כולל `withoutComments()` — **F-065**: גרפ שאינו
      מלבין הערות נכשל על קוד תקין):
      `expect(CODE).not.toMatch(/\.(insert|update|upsert|delete)\(/)` ← **המדד ⓐ החשוב
      בתוכנית** · `expect(CODE).not.toContain('word_progress' + "')")`… ⚠️ **לא** — הנתיב **כן**
      קורא מ-`word_progress`; מה שנאסר הוא **כתיבה** ו**שדות SM-2**: אכוף
      `expect(CODE).not.toMatch(/easiness|interval_days|repetition|next_review_at|self_marked_known/)` ·
      `expect(CODE).toContain("eq('author_kind', 'learner')")` ·
      `expect(CODE).toMatch(/status:\s*401/)` ו-`/status:\s*503/` ·
      `expect(CODE).not.toMatch(/message:\s*`?\$\{/)` (הודעת PostgREST ⛔ לא בגוף).
- [ ] **2.8** **מוטציה 1** — הוסף `.update({ x: 1 })` בקובץ הנתיב ⇒ בדיקת «⛔ אינו כותב»
      חייבת ליפול. שחזר.
- [ ] **2.9** **מוטציה 2** — הסר את `.eq('author_kind','learner')` ⇒ הבדיקה חייבת ליפול
      בשמה (פוסט מיוצר היה מוצג ללומד כמשפט שהוא כתב — הלקח של C-0123). שחזר.
- [ ] **2.10** שער אימות מלא + `measure:plan` אחרון + קומיט.

---

## 3 · T-105 — הכרטיס «מה שכתבת אתמול» בראש `/world`

**מה נמסר:** `components/RecallCard.tsx` + `components/RecallCard.test.ts` +
`app/dev/world/recall/page.tsx` (פיקסטורה) + שורה ב-`ROUTES` ורשומה ב-`EXPECTED_CONSOLE`
ב-`verify-mobile.mjs` + שורה אחת ב-`app/(tabs)/world/page.tsx`.

**הפיקסטורה ⛔ אינה כפילות של F-064:** בלי env של Supabase `/api/world/recall` עונה 503
בחוזה שלו עצמו ⇒ הכרטיס, ארבע האפשרויות והנחיתה **לעולם אינם על המסך** במסלול האמיתי.
הפיקסטורה מקבלת כרטיס כ-prop ו⛔ אינה מבקשת מהשרת דבר ⇒ ⛔ **אין לה רשומה ב-
`EXPECTED_CONSOLE`, והשקט הזה הוא מה שמוכיח שהמדידה אינה על מסך הכשל.**

### צעדים

- [x] **3.1** צור `components/RecallCard.tsx`: `'use client'`, `apiGet` ל-`/api/world/recall`.
      ⚠️ **חתימה כפולה במכוון:** `export default function RecallCard()` קורא לשרת, ומייצא גם
      `export function RecallCardView({ card }: { card: RecallCardData })` שמצייר בלבד —
      הפיקסטורה מרנדרת את השני. ⛔ **אין עותק שני של ה-JSX.**
- [x] **3.2** המסך, בדיוק כפי ש-§ 4.2יב קובעת ⛔ ולא כפי שנוח:
      שורה עברית «כתבת את זה לפני N ימים» (N מ-`daysAgo`) · המשפט ב-`<EnText segments=…>`
      כאשר מקטע היעד מוחלף ב**מסגרת ריקה בגובה השורה** — `<span className="inline-block
      min-w-[4ch] rounded-md border border-border-strong align-baseline">` עם
      `&#8203;` בפנים ⛔ **ולא `border-b`** (־«לא קו תחתון דק») · ארבע אפשרויות ב-
      `grid grid-cols-2 gap-3`, כל אחת `min-h-touch` · נכון ⇒ המילה נכנסת למקומה עם
      `transition-opacity duration-200` והשורה נעשית «… — וזכרת» · שגוי ⇒ המילה הנכונה
      נכנסת **בכל מקרה** והשורה נעשית «המילה הייתה X»; ⛔ אין ניסיון שני, ⛔ אין «נסה שוב»,
      ⛔ אפס עונש · `card === null` ⇒ **מושבת עם המספר**: «כתוב את המשפט הראשון שלך» +
      קישור ל-`/world/compose` · טעינה ⇒ שלד **בצורת הכרטיס** ⛔ לא ספינר · כשל ⇒
      `FAILURE_HE.load`.
- [x] **3.3** צור `components/RecallCard.test.ts` כשומר מקור. הבדיקות המחייבות:
      `expect(CODE).not.toMatch(/apiPost/)` ← **מדד ⓐ: מחזור מלא ⛔ אינו כותב** ·
      `expect(CODE).not.toMatch(/easiness|interval_days|repetition|next_review_at|self_marked_known|word_progress/)` ·
      `expect(CODE).not.toMatch(/\bxp\b|\bscore\b|\bpoints\b|\bcoin\b|\bstreak\b/i)` ·
      `expect(CODE).toContain('EnText')` · `expect(CODE).not.toMatch(/border-b\b/)` ←
      «⛔ לא קו תחתון דק», נופלת בשם · `expect(CODE).not.toMatch(/setTimeout|setInterval/)`
      (D-049) · `expect(CODE).not.toMatch(/נסה שוב.*אפשרות|ניסיון שני/)` ·
      `expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)`.
- [x] **3.4** צור `app/dev/world/recall/page.tsx` — כרטיס קבוע בקוד (`daysAgo: 3`, משפט
      אנגלי אחד, ארבע אפשרויות), `export const metadata = { robots: { index: false } }`
      בדיוק כמו יתר `app/dev/*`. ⛔ אפס `fetch`.
- [x] **3.5** הוסף `'/dev/world/recall'` ל-`ROUTES` ב-`verify-mobile.mjs` עם הערת נימוק בת
      שלוש שורות, והוסף ל-`EXPECTED_CONSOLE['/world']` את
      `/status of 503[\s\S]*@\S*\/api\/world\/recall/`. ⛔ **אל תוסיף רשומה לפיקסטורה.**
- [x] **3.6** ערוך את `app/(tabs)/world/page.tsx`: `<><RecallCard /><AppGrid /><WorldFeed /></>`
      — הכרטיס **בראש**, מעל הרשת (§ 4.2יב קישוריות 6).
- [x] **3.7** ב-`components/AppGrid.tsx` — ⛔ **אל תיגע.** «חיוב פתוח» ל«הרכבה» נשאר פתוח
      ב-F-072 עד שיוכרע, ו⛔ אין להסיק אותו מהכרטיס.
- [x] **3.8** **מוטציה 1** — הוסף `void apiPost('/api/review', {});` לרכיב ⇒ «⛔ אינו כותב»
      חייבת ליפול. שחזר.
- [x] **3.9** **מוטציה 2** — החלף את המסגרת ב-`border-b` ⇒ הבדיקה חייבת ליפול בשם. שחזר.
- [x] **3.10** `npm run check:mobile` ⇒ הפיקסטורה חייבת להופיע בפלט **בלי** שורת קונסול
      מותרת. שער אימות מלא + `measure:plan` אחרון + קומיט.

---

## 4 · T-106 — «שרשרת הכתיבה»

**מה נמסר:** `app/(tabs)/world/chain/page.tsx` + `components/WritingChain.tsx` +
`components/WritingChain.test.ts` + שדה **תוספתי** אחד ב-`GET /api/world/posts` +
`docs/api-contract.md` **באותו קומיט**.

⚠️ **סטייה מוצהרת מעמודת הקבצים של T-106, ⛔ ולא שכחה.** T-106 דורשת «מספר המשפטים שהלומד
כתב **אי-פעם**», ו-`GET /api/world/posts` מחזיר `total` שהוא **גודל התשובה** בתקרת
`MAX_FEED_ROWS = 100` (‏§ 0 עובדה 10) ⇒ הצגתו כ«אי-פעם» היא **מספר שמשקר** ביום ה-101,
וזה בדיוק הכלל של `<MeScreen>`. ⇒ מוסיפים שדה **תוספתי** `count` (ספירה מדויקת,
`select('id', { count: 'exact', head: true })`), ⛔ **אף שדה קיים אינו משתנה ואינו נעלם**.
⛔ הנתיב ⛔ אינו בתור הסקירה של ה-Critic ⇒ ההרחבה מותרת. ⚠️ **אם ה-Critic דוחה — הנפילה
לאחור היא הצגת `total` עם התקרה כתובה**, ⛔ ולא «אי-פעם» על מספר חתוך.

### צעדים

- [x] **4.1** הוסף ל-`app/api/world/posts/route.ts` שאילתת `head:true` שנייה ושדה `count`
      בתשובה. עדכן את `## GET /api/world/posts` ב-`docs/api-contract.md` **באותו עריכה**,
      כולל המשפט «`total` הוא גודל התשובה · `count` הוא ספירת הטבלה».
- [x] **4.2** הוסף ל-`app/api/world/posts/route.test.ts` שתי בדיקות: `count` קיים בתשובה,
      ו-`total` ⛔ **לא שינה משמעות** (עדיין `posts.length`).
- [x] **4.3** צור `components/WritingChain.tsx`: `'use client'`, `apiGet('/api/world/posts')`,
      מציג את `count` עם התווית «משפטים שכתבת» ואת הרשימה `created_at` יורד, כל משפט ב-
      `<EnWord>`. מצב ריק ⇒ «כתוב את המשפט הראשון שלך» + קישור ל-`/world/compose`.
      ⛔ אין גרף · ⛔ אין רצף יומי · ⛔ אין שיתוף · ⛔ אין משתמש אחר.
- [x] **4.4** צור `components/WritingChain.test.ts`: ⛔ אפס `streak`/«רצף» ·
      ⛔ אפס `svg`/`chart`/`bar`/`Recharts` (⛔ לא `dataviz`) · ⛔ אפס `share`/«שיתוף» ·
      `expect(CODE).toContain('count')` · «—» ⛔ ולא «0» במצב לא ידוע.
- [x] **4.5** צור `app/(tabs)/world/chain/page.tsx` שמחזיר `<WritingChain />` בלבד, בהערה
      שמפנה ל-§ 4.2יב. הוסף באריח/בכרטיס קישור «שרשרת הכתיבה» ⇒ `/world/chain`
      ⚠️ ⛔ **רק אם § 4.2יב נוקבת במיקומו** — היא נוקבת: «יוצאים — «שרשרת הכתיבה» ⇒ T-106»
      מתוך **הכרטיס**. ⇒ הקישור נוסף ב-`RecallCard.tsx`, ⛔ לא ברשת.
- [x] **4.6** הוסף `'/world/chain'` ל-`ROUTES` וב-`EXPECTED_CONSOLE` רשומה אחת
      (`/api/world/posts`, 503). ⛔ אין פיקסטורה — המצב הריק **הוא** מה שנמדד, והוא מצב
      שלומד פוגש.
- [x] **4.7** **מוטציה** — הוסף `<svg>` ל-`WritingChain.tsx` ⇒ בדיקת «⛔ לא dataviz» חייבת
      ליפול. שחזר. שער אימות מלא + `measure:plan` אחרון + קומיט.

---

## 5 · ממצא שנפתח בטיק התכנון — ⛔ ואינו נסגר בקוד

**F-072 · 🟡 MEDIUM · פער מפרט (כלל בלי ולו מופע אחד) · נפתח על ידי DEV (C-0189, טיק תכנון)**

`plan/40-decisions.md` § 4.2יא דורשת «שאר האריחים **מושבתים עם תנאי פתיחה מדיד ונקוב
במספר**», ובאותה נשימה קובעת «אריח בלי תנאי מדיד ⛔ אינו נכנס לרשת», ו⛔ **אינה נוקבת ולו
באריח אחד כזה**: ספרייה · הודעות · מייל · סימולטורים מסומנים מפורשות «⛔ לא נפתחה להן ולו
משימה אחת». ⇒ שני הכללים יחד מייצרים רשת של **שני אריחים פתוחים ואפס מושבתים**, ומדד
ההצלחה ⓐ («כל אריח מושבת נושא מספר») **עובר ריק**. ⚠️ בנוסף, § 4.2יא מגדירה את האריח הגדול
כ«זה שיש בו **משימה פעילה** (חיוב שלא נגמר)» ⛔ **ואינה מגדירה מהו חיוב פתוח עבור «הרכבה»**
— לזירה יש אות מדיד (`round !== null`), להרכבה **אין**. ⇒ **בעלות: PM.** ⛔ ה-Dev פתח ואינו
מכריע — «אין תוכנית UX למשימת ממשק ⇒ רשום שהיא חסרה ועבור הלאה».
**ההשפעה על התוכנית:** ⛔ אפס חסימה. § 1 מממשת את **המבנה** של אריח מושבת עם מספר
(`AppState.locked` + `levelTooSmallNoteHe`), הבדיקה אוכפת שכל `locked` נושא ספרה, וביום שה-PM
ינקוב באריח — הוא **שורה אחת ב-`WORLD_APP_ORDER`**.

---

## 6 · בדיקה עצמית — ⛔ אל תסמן משימה כנמסרה לפני שכל שורה כאן ירוקה

| # | הבדיקה | הפקודה / הראיה |
|---|---|---|
| 1 | ארבע הפקודות | `npm run typecheck && npm run check:core && npm test && npm run build` — **הרצה טרייה בהודעה שבה אתה טוען** |
| 2 | מובייל | `npm run check:mobile` — שלושה רוחבים, `clean console` ירוק, כל מסלול חדש מופיע בפלט |
| 3 | טהרה | `check:core` ⇒ `/lib/core purity: OK` — שני המודולים החדשים ⛔ בלי React/fetch/env |
| 4 | ⛔ אפס כתיבה | `grep -n "\.insert(\|\.update(\|\.upsert(\|\.delete(" app/api/world/recall/route.ts` ⇒ **אפס שורות** |
| 5 | ⛔ אפס מיגרציה | `git status --porcelain supabase/` ⇒ **ריק** בכל ארבעת הקומיטים |
| 6 | ⛔ אפס נכס | `grep -rn "https\?://\|<img\|cdn" components/AppGrid.tsx components/RecallCard.tsx components/WritingChain.tsx` ⇒ אפס |
| 7 | החוזה | כל שינוי בנקודת קצה יצא **באותו קומיט** עם `docs/api-contract.md` |
| 8 | הרגיסטרים | `npm run measure:plan` הוא **הפעולה האחרונה לפני כל קומיט**, אחרי כל עריכה ב-`plan/` (F-071 · F-063) |
| 9 | ⛔ לא `main` | `git branch --show-current` ⇒ `dev` בכל דחיפה |
| 10 | ⛔ לא החוקה | `git status --porcelain plan/35-design-constitution.md plan/10-pedagogy.md` ⇒ **ריק** |
