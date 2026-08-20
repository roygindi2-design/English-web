# Level Map Completion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** לסגור את מפת הרמה — ארבעת החלקים ש-`2026-08-17-level-map.md` הצהיר במפורש שהוא **אינו** בונה: סריקת הרמה (T-082), שורה 5 «לא ידעתי» (T-083), שדה `levels[]` בסיכום (T-102) ושורה 6 «מפת שש הרמות» (T-084).

**Architecture:** אין כאן ולו מיגרציה אחת — כל ארבע המשימות רצות על העמודות ש-`0013_learner_level.sql` כבר הנחיתה (`profiles.current_level` · `word_progress.self_marked_known` · `self_marked_at`), ועל `words.cefr_profile_band` שכבר קיימת. שכבת הליבה מקבלת שני מודולים טהורים חדשים (`levelScan.ts` · `levelPath.ts`) ופונקציה אחת נוספת ב-`levelSummary.ts`; נתיב API חדש אחד (`/api/levels/scan`) ונתיב קיים אחד שמקבל **שדה נוסף בלבד**; שלושה רכיבי לקוח, שניים מהם נכנסים כשורות 5 ו-6 של `<LevelMapScreen>` הקיים בלי לגעת בארבע השורות הראשונות.

**Tech Stack:** Next.js App Router (Server + Client Components) · TypeScript ללא `any` · Supabase דרך `lib/supabase/auth.ts` · vitest (סביבת `node`, ⛔ ללא jsdom) · Tailwind עם אסימוני `lib/core/palette.ts`.

**Spec:** `plan/40-decisions.md` § 4.2ז (תוכנית ה-UX המלאה, שש השורות) · D-037 · D-038 · D-041 · D-034 · R-017 · `plan/35-design-constitution.md`.

**Loop tasks covered:** **T-082** (Tasks 1–3) · **T-083** (Task 4) · **T-102** (Task 5) · **T-084** (Task 6).

---

## Global Constraints

כל אחת מהשורות האלה חלה על **כל** משימה בתוכנית, ואינה חוזרת בגוף המשימות.

| הכלל | הערך המדויק |
|---|---|
| טוהר `/lib/core` | ⛔ אפס React · DOM · `window` · `document` · `localStorage` · `fetch` · `process.env` · `Date.now()`. נאכף ב-`npm run check:core` |
| גישה לדאטהבייס | רכיב ממשק ⛔ לעולם אינו נוגע ב-Supabase. הכל דרך `app/api/*` ו-`lib/api/client.ts` |
| סדר השומרים בנתיב | ‏ENV ⇒ `getUser()` ⇒ ולידציה ⇒ שאילתה (דפוס C-0032). ⛔ קורא לא מזוהה אינו לומד אילו שדות מתקבלים |
| מחרוזת שגיאה של Supabase | ⛔ לעולם אינה נכנסת ל-JSON. `console.error` בלבד (T-053) |
| קודי הכשל | `session_expired` 401 · `schema_missing` 503 (`42P01` · `PGRST205` · `42703` · `PGRST204`) · `unavailable` 503. ⛔ «0 מילים» כשאין סכמה הוא שקר על תקלה |
| יציאה מכל מצב כשל | דרך `lib/core/failureExit.ts` בלבד (T-124 · D-065). «נסה שוב» ⛔ רק ל-`unavailable` |
| נוסח הכשל | מיובא מ-`lib/core/failure.ts` (`FAILURE_HE` · `RETRY_HE`). ⛔ אין קבוע כשל מקומי בקובץ רכיב |
| אנגלית בתוך עברית | דרך `<EnWord>` / `<EnText>` בלבד — המקום היחיד שכותב `lang="en"` (חוקה § 2) |
| פריסה | Mobile-First 375px · יעד מגע ≥ `min-h-touch` (44px) · ⛔ `justify-center` על מכולת עמוד · ⛔ `h-screen` (רק `min-h-[100dvh]`) · ⛔ אפס גלילה אופקית (חוקה § 4 · F-011 · F-016) |
| צבע | ⛔ hex גולמי ב-`components/` — אסימונים בלבד. ⛔ צבע לעולם אינו הערוץ היחיד: כל בקרה נושאת גם תווית עברית או מספר (חוקה § 1 · § 6) |
| אייקונים | SVG בלבד. ⛔ אמוג'י (חוקה § 6) |
| רדיוסים | `rounded-md` שדות ותגיות · `rounded-lg` כפתורים · `rounded-2xl` כרטיסיות. ⛔ ולא ערך אחר (חוקה § 3) |
| אוצר מילים אסור על כל המסכים כאן | ⛔ «שולט» · «מוכן» · «נעול» · «כל הכבוד» · «ניקוד» · «רצף» · «אחוז שליטה» (R-017 · D-037 · T-032) |
| הרמה של מילה | `words.cefr_profile_band` ⛔ ולעולם לא `senses.cefr_level` (חלוקים ב-125 מתוך 343 — D-034) |
| החוזה | `docs/api-contract.md` מתעדכן **באותו קומיט** של כל שינוי בנקודת קצה |
| ⛔ תוכן לימודי | אף משימה כאן ⛔ אינה כותבת מילה, תרגום או משפט. הכל נקרא מהמאגר |

**פקודת האימות המלאה, שרצה בסוף כל משימה:**

```bash
npm run typecheck && npm run check:core && npm test && npm run build
```

---

## מה נמדד בטיק התכנון, ⛔ ולא הונח

| מה נבדק | מה נמצא |
|---|---|
| `supabase/migrations/0013_learner_level.sql` | ‏`current_level` · `self_marked_known` · `self_marked_at` **קיימות**, ורוי הריץ אותה בייצור 19/08 (§ 4.2ז, «פריט 28 נסגר») ⇒ ⛔ **אין מיגרציה בתוכנית הזאת** |
| ‏RLS על `word_progress` | ‏`word_progress_select_own` · `_insert_own` · `_update_own` קיימות ב-`0003b:112–122` ⇒ הלומד רשאי גם להוסיף שורה וגם לעדכן את שלו ⇒ סריקה יכולה לכתוב בלי מיגרציה |
| `scripts/validate_palette.js` | ⛔ **אינו קיים בריפו** — הוא סקריפט של סקיל `dataviz`. תקדים C-0176: מסך בלי ערוץ צבע מריץ במקומו `npx vitest run lib/core/palette.test.ts`. Task 6 **כן** מוסיף ערוץ צבע (טבעת) ⇒ שם הסקיל חובה |
| ‏`GET /api/study/queue?deck=unknown` | מחזיר `total` **לפני** החיתוך ל-`limit`, ו-`cards[].sense.headword` + `translation_he`, ממוין `cefr_profile_band` ואז `next_review_at` ⇒ **בדיוק המיון ש-T-083 מבקש** ⇒ ⛔ **אין נתיב חדש ל-T-083** |
| `MAX_QUEUE_LIMIT` ב-`lib/core/deck.ts` | ‏50 ⇒ רשימת «לא ידעתי» מציגה עד 50 ואומרת את הסך |
| הרמה הגדולה במאגר | ‏A1 = 315 מילים (‏`seed/0002`) ⇒ תקרת `MAX_LEVEL_WORDS = 500` היא ביטוח, ⛔ לא ציפייה |
| `proxy.ts:28` | `PROTECTED_SCREENS = ['/onboarding','/studies','/cards','/me']` ⇒ `/study` **ו-`/study/scan`** ⛔ אינם מוגנים בפרוקסי ⇒ הם נמדדים ישירות ב-`check:mobile`, אך **בלי סשן** ⇒ מה שנמדד הוא מצב הכשל ⇒ צריך פיקסטורה |
| `app/api/levels/summary/route.ts` | מחזיר סיכום של **רמה אחת**; `LevelSummary.level` הוא `CefrBand` יחיד ⇒ הטענה ש-`levels[]` «כבר מיושם» שגויה, כפי ש-T-102 כבר קבעה |

---

## הכרעות שהתוכנית לוקחת, וכל אחת נימוקה

**ⓐ הסריקה מציעה אך ורק מילים שאין להן שורת `word_progress`** — בדיוק קבוצת `unseen` של § 4.2ז.
⛔ ולא «כל מילות הרמה»: מילה שכבר בְּרשימת החזרה שייכת למנוע (7.1), והצגתה בסריקה נותנת ללומד שתי דרכים סותרות לומר משהו על אותה מילה. זה גם מה שהופך את משפט הסיום לנכון — «נשארו 197» הוא בדיוק `unseen`, שיורד ב-1 על כל סימון. D-041 מדבר על 315 = 27 מסכים, וללומד חדש שתי הקבוצות **זהות**.

**ⓑ הדפדוף הוא בלקוח, ⛔ ולא «תן לי את ה-12 הבאים» בשרת.** נמדד על הנייר: נתיב שמחזיר בכל קריאה את 12 הבאים-שלא-סומנו יחזיר לנצח את אותן מילים שהלומד **לא** סימן — הלומד לעולם לא יתקדם. לכן `GET` מחזיר את הרשימה כולה (חסומה ב-500), והלקוח חותך ל-12 דרך `pageOf` בשכבה הטהורה.

**ⓒ הכתיבה היא `insert` על שורה חסרה ו-`update` על שורה קיימת, ⛔ ולא `upsert`** — אותו נימוק בדיוק כמו ב-`app/api/review/route.ts` (D-016): `upsert` היה חייב להצהיר מחדש על `track_id`, ומקום שני שבו ברירת המחדל חיה הוא מקום שני שבו היא יכולה להיות שגויה. שני הענפים כותבים **בדיוק** `self_marked_known` · `self_marked_at` · `updated_at`, ואת זה בודקת בדיקת מקור על ארגומנט ה-`update` עצמו.

**ⓓ מסך הסיום קורא מחדש את `GET /api/levels/summary` ⛔ ואינו סופר בעצמו.** «סימנת ש-118 מילים כבר ידועות לך. נשארו 197» הם `known` ו-`unseen` — ההגדרה חיה ב-`lib/core/levelSummary.ts` בלבד (§ 4.2ז: «⛔ אין הגדרה שנייה»). לקוח שסופר `markedThisSession` היה מציג מספר שני שסוטה מהראשון ברגע שהלומד סוגר וחוזר.

**ⓔ סדר המילים בסריקה הוא `headword` עולה ואז `wordId`, ⛔ ולא אקראי ולא לפי תדירות.** אקראי אינו יציב בין קריאות ⇒ לומד שיצא באמצע וחזר יראה מילה פעמיים ויפספס אחרת. תדירות (`ngsl_rank`) היא סדר **פדגוגי**, וסריקה אינה טוענת דבר פדגוגי (D-041) — היא רק מתעדת. סדר אלפביתי הוא הסדר היחיד שאין מאחוריו טענה.

**ⓕ ‏`levels[]` נוסף **רק** לענף שבו נבחרה רמה.** ‏T-102 כותבת מילה במילה «`level` ו-`{ok:true,level:null}` נשארים בדיוק כפי שהם». במצב `level: null` המסך ממילא מציג את שישה כפתורי הבחירה של T-081, ולכן טבעות המילוי אינן חסרות שם.

**ⓖ ⛔ אין ולידציה שהמילים שנשלחו ל-`POST /api/levels/scan` שייכות לרמה הנוכחית.** ‏RLS כבר מגביל כתיבה לשורות של הלומד עצמו, ולומד שסימן מילה מחוץ לרמתו אמר על עצמו אמת. שער כזה היה כלל מוצר חדש שאיש לא הכריע עליו, וזו בדיוק ההמצאה ש-⛔ אסורה ל-Dev. **מוצהר כאן ⛔ ולא מוסתר.**

---

## File Structure

| הקובץ | האחריות | משימה |
|---|---|---|
| `lib/core/levelScan.ts` | **חדש · טהור.** גודל עמוד (12) · חיתוך לעמודים · הסרת מילים שכבר נראו · ולידציית גוף הבקשה | 1 |
| `lib/core/levelScan.test.ts` | **חדש.** בדיקות היחידה של הנ״ל | 1 |
| `app/api/levels/scan/route.ts` | **חדש.** `GET` מחזיר את מילות הרמה שטרם נראו · `POST` מסמן עד 12 | 2 |
| `app/api/levels/scan/route.test.ts` | **חדש.** בדיקות מקור על סדר השומרים ועל העמודות הנכתבות | 2 |
| `docs/api-contract.md` | **עריכה.** סעיף `/api/levels/scan` (משימה 2) · שדה `levels[]` בסעיף `/api/levels/summary` (משימה 5) | 2 · 5 |
| `components/LevelScan.tsx` | **חדש.** רשת 12 · «המשך» · מסך הסיום העובדתי | 3 |
| `components/LevelScan.test.ts` | **חדש.** שומר מקור | 3 |
| `app/study/scan/page.tsx` | **חדש.** מסך הזרימה (Server Component דק) | 3 |
| `app/dev/scan/page.tsx` | **חדש.** פיקסטורת `check:mobile` — הרשת בת 12 בלי סשן | 3 |
| `scripts/verify-mobile.mjs` | **עריכה.** `/dev/scan` ל-`ROUTES` · רשומת `EXPECTED_CONSOLE` ל-`/study/scan` | 3 |
| `components/UnknownList.tsx` | **חדש.** שורה 5 — רשימת «לא ידעתי» | 4 |
| `components/UnknownList.test.ts` | **חדש.** שומר מקור | 4 |
| `lib/core/levelSummary.ts` | **עריכה — תוספת בלבד.** `summarizeAllLevels` לצד `summarizeLevel` | 5 |
| `lib/core/levelSummary.test.ts` | **עריכה — תוספת בלבד.** | 5 |
| `app/api/levels/summary/route.ts` | **עריכה.** שאילתת התקדמות אחת בלי מסנן רמה + שש ספירות `head` | 5 |
| `lib/core/levelPath.ts` | **חדש · טהור.** שישה שבבים, יחס מילוי ואחוז שלם | 6 |
| `lib/core/levelPath.test.ts` | **חדש.** | 6 |
| `components/LevelPath.tsx` | **חדש.** שורה 6 — שישה שבבים עם טבעת ומספר | 6 |
| `components/LevelPath.test.ts` | **חדש.** שומר מקור | 6 |
| `components/LevelMapScreen.tsx` | **עריכה — תוספת בלבד.** שורה 5 ושורה 6 נכנסות מתחת לשורה 4. ⛔ ארבע השורות הראשונות ⛔ אינן משתנות | 4 · 6 |
| `components/LevelMapScreen.test.ts` | **עריכה — תוספת בלבד.** | 4 · 6 |
| `plan/30-architecture.md` · `plan/50-tasks.md` · `plan/60-findings.md` · `plan/00-control.md` | **עריכה** בכל טיק שנכתב בו קוד (חוק הלופ) | כולן |

---

## גבול התוכנית — מה ⛔ לא נבנה כאן, ולמה

| הדבר | למה ⛔ לא |
|---|---|
| «בדוק את עצמי» — פתיחת רשימת «סימנת שידעת» כחפיסה, ונפילה שמחזירה `self_marked_known` ל-`false` | הגנת D-038. ⛔ **אין לה שורת משימה ב-`50-tasks.md`**, ולכן ⛔ אין ל-Dev רשות להמציא לה מסך. **נרשמת כפריט ל-PM בדיווח הטיק.** ⚠️ בלעדיה הסימון העצמי הוא **חד-כיווני**, וזה בדיוק סיכון דירוג-היתר שה-D מצהיר עליו |
| מבחן מיצוב אדפטיבי | ‏T-004, ⛔ חסומה — אין מנוע בחירת פריט ב-`70-engines` (D-041 מצהיר שהסריקה ⛔ אינה מחליפה אותה) |
| רצף יומי / ניקוד / אחוז מוכנות | ‏T-032 · R-017 · D-037. ⛔ בכל שש השורות |
| חפיסת «משפטים» | ‏D-035 · T-066, ⛔ חסומה ב-F-052 |
| מיגרציה כלשהי | ⛔ אין. `0013` בייצור, וכל העמודות קיימות |

---

## Task 1 — T-082ⓐ: השכבה הטהורה (`lib/core/levelScan.ts`)

**Files:**
- Create: `lib/core/levelScan.ts`
- Test: `lib/core/levelScan.test.ts`

**Interfaces:**
- Consumes: ⛔ כלום מהמשימות האחרות. (`CefrBand` מ-`lib/core/cefrLevels.ts` — קיים.)
- Produces:
  - `const SCAN_PAGE_SIZE: 12`
  - `const MAX_SCAN_WORDS: 500`
  - `interface ScanWord { readonly wordId: string; readonly headword: string }`
  - `function sortScanWords(words: readonly ScanWord[]): ScanWord[]`
  - `function excludeSeen(words: readonly ScanWord[], seenWordIds: readonly string[]): ScanWord[]`
  - `function pageCount(total: number): number`
  - `function pageOf(words: readonly ScanWord[], pageIndex: number): ScanWord[]`
  - `type ScanCheck = { readonly ok: true; readonly wordIds: readonly string[] } | { readonly ok: false; readonly code: 'unavailable' }`
  - `function checkScanPayload(body: unknown): ScanCheck`

Task 2 קורא ל-`sortScanWords` · `excludeSeen` · `checkScanPayload` · `MAX_SCAN_WORDS`. Task 3 קורא ל-`pageOf` · `pageCount` · `SCAN_PAGE_SIZE` · `ScanWord`.

- [ ] **Step 1: כתוב את הבדיקות, לפני המימוש**

צור `lib/core/levelScan.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  MAX_SCAN_WORDS,
  SCAN_PAGE_SIZE,
  checkScanPayload,
  excludeSeen,
  pageCount,
  pageOf,
  sortScanWords,
  type ScanWord,
} from './levelScan';

const ID_A = '11111111-2222-3333-4444-555555555555';
const ID_B = '22222222-3333-4444-8888-999999999999';
const ID_C = '33333333-4444-4444-9999-aaaaaaaaaaaa';

function word(wordId: string, headword: string): ScanWord {
  return { wordId, headword };
}

describe('D-041 — 12 מילים בכל מסך, וזה מספר המפרט ⛔ ולא בחירה', () => {
  it('גודל העמוד הוא 12', () => {
    expect(SCAN_PAGE_SIZE).toBe(12);
  });

  it('315 מילים ⇒ 27 מסכים — בדיוק החישוב שכתוב ב-D-041', () => {
    expect(pageCount(315)).toBe(27);
  });

  it('אפס מילים ⇒ אפס מסכים, ⛔ ולא מסך ריק אחד', () => {
    expect(pageCount(0)).toBe(0);
  });

  it('12 בדיוק ⇒ מסך אחד, ו-13 ⇒ שניים', () => {
    expect(pageCount(12)).toBe(1);
    expect(pageCount(13)).toBe(2);
  });

  it('מספר שאינו שלם אי-שלילי ⇒ 0, ⛔ ולא NaN שיזלוג למסך', () => {
    expect(pageCount(-4)).toBe(0);
    expect(pageCount(2.5)).toBe(0);
    expect(pageCount(Number.NaN)).toBe(0);
  });
});

describe('pageOf — חיתוך, ⛔ ולא מיון מחדש', () => {
  const words: ScanWord[] = Array.from({ length: 25 }, (_, i) =>
    word(`${i}`.padStart(8, '0') + '-2222-3333-4444-555555555555', `w${`${i}`.padStart(2, '0')}`),
  );

  it('העמוד הראשון הוא 12 הראשונים', () => {
    const page = pageOf(words, 0);
    expect(page).toHaveLength(12);
    expect(page[0]?.headword).toBe('w00');
    expect(page[11]?.headword).toBe('w11');
  });

  it('העמוד האחרון מכיל את השארית ⛔ ואינו מרופד', () => {
    expect(pageOf(words, 2)).toHaveLength(1);
    expect(pageOf(words, 2)[0]?.headword).toBe('w24');
  });

  it('עמוד מעבר לסוף הוא רשימה ריקה, ⛔ ולא זריקה', () => {
    expect(pageOf(words, 99)).toEqual([]);
  });

  it('אינדקס שלילי או שבור ⇒ העמוד הראשון, ⛔ ולא undefined', () => {
    expect(pageOf(words, -1)[0]?.headword).toBe('w00');
    expect(pageOf(words, 1.5)[0]?.headword).toBe('w00');
  });
});

describe('ⓔ סדר יציב — לומד שיצא באמצע וחזר רואה בדיוק את אותה רשימה', () => {
  it('ממוין לפי headword, ובשוויון לפי wordId', () => {
    const sorted = sortScanWords([word(ID_C, 'zebra'), word(ID_B, 'apple'), word(ID_A, 'apple')]);
    expect(sorted.map((w) => w.wordId)).toEqual([ID_A, ID_B, ID_C]);
  });

  it('⛔ אינו משנה את המערך של הקורא', () => {
    const input = [word(ID_C, 'zebra'), word(ID_A, 'apple')];
    sortScanWords(input);
    expect(input[0]?.headword).toBe('zebra');
  });

  it('שתי הרצות על אותה כניסה מחזירות אותו סדר בדיוק', () => {
    const input = [word(ID_C, 'zebra'), word(ID_B, 'apple'), word(ID_A, 'apple')];
    expect(sortScanWords(input)).toEqual(sortScanWords(input));
  });
});

describe('ⓐ הסריקה מציעה אך ורק מילים שאין להן שורת התקדמות', () => {
  it('מילה שיש לה שורה מוסרת', () => {
    const left = excludeSeen([word(ID_A, 'apple'), word(ID_B, 'banana')], [ID_A]);
    expect(left.map((w) => w.wordId)).toEqual([ID_B]);
  });

  it('רשימת נראו ריקה ⇒ הכל נשאר', () => {
    expect(excludeSeen([word(ID_A, 'apple')], [])).toHaveLength(1);
  });

  it('מזהה שאינו ברשימת המילים ⛔ אינו מפיל דבר', () => {
    expect(excludeSeen([word(ID_A, 'apple')], [ID_C])).toHaveLength(1);
  });
});

describe('checkScanPayload — F-004 על הגבול', () => {
  it('גוף תקין עם מזהה אחד', () => {
    const result = checkScanPayload({ word_ids: [ID_A] });
    expect(result).toEqual({ ok: true, wordIds: [ID_A] });
  });

  it.each([null, [], 'x', 7, undefined])('⛔ גוף שאינו אובייקט (%s) נדחה', (body) => {
    expect(checkScanPayload(body)).toEqual({ ok: false, code: 'unavailable' });
  });

  it('⛔ רשימה ריקה נדחית — בקשה שאינה מסמנת דבר אינה בקשה', () => {
    expect(checkScanPayload({ word_ids: [] }).ok).toBe(false);
  });

  it('⛔ יותר מ-12 מזהים נדחים — מסך אחד הוא התקרה', () => {
    const many = Array.from({ length: SCAN_PAGE_SIZE + 1 }, () => ID_A);
    expect(checkScanPayload({ word_ids: many }).ok).toBe(false);
  });

  it('⛔ מזהה שאינו UUID נדחה, ⛔ ולא מסונן בשקט', () => {
    expect(checkScanPayload({ word_ids: [ID_A, 'not-a-uuid'] }).ok).toBe(false);
  });

  it('⛔ כפילות נדחית — היא הופכת «סימנתי 12» ל-11 בלי שאיש יראה', () => {
    expect(checkScanPayload({ word_ids: [ID_A, ID_A] }).ok).toBe(false);
  });

  it('⛔ אין ברירת מחדל: גוף בלי word_ids נדחה', () => {
    expect(checkScanPayload({}).ok).toBe(false);
  });
});

describe('התקרה היא ביטוח, ⛔ ולא מגבלת מוצר', () => {
  it('גדולה בהרבה מהרמה הגדולה במאגר (A1 = 315)', () => {
    expect(MAX_SCAN_WORDS).toBe(500);
    expect(MAX_SCAN_WORDS).toBeGreaterThan(315);
  });
});
```

- [ ] **Step 2: הרץ וּודא כישלון מהסיבה הנכונה**

```bash
npx vitest run lib/core/levelScan.test.ts
```

Expected: כישלון בהעמסה — `Failed to resolve import "./levelScan"`. ⛔ אם הכישלון הוא משהו אחר, עצור ובדוק.

- [ ] **Step 3: כתוב את המודול**

צור `lib/core/levelScan.ts`:

```ts
/**
 * סריקת רמה (Rapid Triage) — D-041 · T-082. טהור: אפס React, DOM, רשת, שעון ו-env.
 *
 * ⛔ הסריקה **אינה טוענת דבר**. היא מתעדת מה הלומד אמר על עצמו, ולכן ⛔ אין כאן ניקוד,
 * ⛔ אין זמן, ⛔ אין תשובה נכונה ו⛔ אין סף. זה מה שמבדיל אותה ממבחן מיצוב (T-004), שדורש
 * מנוע בחירת פריט וכלל עצירה שאין להם היום מקור ב-`plan/70-engines.md`.
 *
 * ⛔ שום דבר כאן אינו נוגע ב-SM-2. `self_marked_known` הוא עמודה נפרדת בדיוק כדי
 * שסימון עצמי לא ייכתב כ-`repetition = 1` — שקר לנוסחה שמניחה חשיפה שנענתה (D-038).
 */

/** D-041 מילה במילה: «מסך רשת של 12 מילים באנגלית בכל מסך». ⛔ לא פרמטר כוונון. */
export const SCAN_PAGE_SIZE = 12;

/**
 * תקרת ביטוח על מספר המילים שנקראות לסריקה אחת, ⛔ ולא מגבלת מוצר ו⛔ לעולם אינה מוצגת.
 * הרמה הגדולה במאגר היום היא A1 עם 315 מילים (נמדד ב-`supabase/seed/0002_word_cefr_levels.sql`),
 * כלומר התקרה רחוקה ממנה ב-185. שליפה שנחתכה בתקרה היא רשימה חלקית, והנתיב עונה עליה
 * 503 ⛔ ולא רשימה קצרה יותר.
 */
export const MAX_SCAN_WORDS = 500;

export interface ScanWord {
  readonly wordId: string;
  readonly headword: string;
}

/**
 * ⓔ סדר אלפביתי, ⛔ ולא אקראי ו⛔ לא לפי תדירות.
 * אקראי אינו יציב בין קריאות ⇒ לומד שיצא באמצע וחזר יראה מילה פעמיים ויפספס אחרת.
 * ‏`ngsl_rank` הוא סדר **פדגוגי**, וסריקה אינה טוענת דבר פדגוגי — סדר אלפביתי הוא
 * הסדר היחיד שאין מאחוריו טענה. שובר-שוויון מלא על `wordId` כדי ששתי מילים זהות
 * לא יתחלפו בין קריאה לקריאה (אותו נימוק כמו `sortQueue` ב-`deck.ts`).
 */
export function sortScanWords(words: readonly ScanWord[]): ScanWord[] {
  return [...words].sort((a, b) => {
    if (a.headword !== b.headword) return a.headword < b.headword ? -1 : 1;
    return a.wordId < b.wordId ? -1 : a.wordId > b.wordId ? 1 : 0;
  });
}

/**
 * ⛔ לא `not.in` בשאילתה — אותה הכרעה בדיוק כמו `excludeSeen` ב-`lib/core/deck.ts`:
 * רשימת המזהים גדלה עם ההיסטוריה של הלומד עד שכתובת ה-URL נשברת בשקט.
 */
export function excludeSeen(
  words: readonly ScanWord[],
  seenWordIds: readonly string[],
): ScanWord[] {
  const seen = new Set(seenWordIds);
  return words.filter((word) => !seen.has(word.wordId));
}

export function pageCount(total: number): number {
  if (!Number.isInteger(total) || total <= 0) return 0;
  return Math.ceil(total / SCAN_PAGE_SIZE);
}

/**
 * חיתוך בלבד. ⛔ אינו ממיין — הסדר נקבע פעם אחת ב-`sortScanWords`, ומיון שני כאן
 * היה הופך את «העמוד הבא» לתלוי במקום שממנו נקרא.
 */
export function pageOf(words: readonly ScanWord[], pageIndex: number): ScanWord[] {
  const index = Number.isInteger(pageIndex) && pageIndex > 0 ? pageIndex : 0;
  const start = index * SCAN_PAGE_SIZE;
  return words.slice(start, start + SCAN_PAGE_SIZE);
}

export type ScanCheck =
  | { readonly ok: true; readonly wordIds: readonly string[] }
  | { readonly ok: false; readonly code: 'unavailable' };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REJECT: ScanCheck = { ok: false, code: 'unavailable' };

/**
 * F-004 על הגבול: מערך הוא אובייקט ו-`null` הוא אובייקט, ולכן הצורה נבדקת לפני שנקראת
 * ולו תכונה אחת.
 *
 * ⛔ **כפילות נדחית ⛔ ואינה מסוננת בשקט.** גוף עם אותו מזהה פעמיים אומר שהלקוח שבור,
 * וסינון שקט היה הופך «סימנתי 12» ל-11 בלי שאיש רואה — בדיוק מחלקת השקט ש-F-030 נפתחה
 * עליה. ⛔ ואין כאן ולידציה שהמילה שייכת לרמת הלומד: RLS כבר מגביל כתיבה לשורות של
 * הלומד עצמו, ולומד שסימן מילה מחוץ לרמתו אמר על עצמו אמת. שער כזה היה כלל מוצר חדש
 * שאיש לא הכריע עליו.
 */
export function checkScanPayload(body: unknown): ScanCheck {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return REJECT;
  const { word_ids: raw } = body as { word_ids?: unknown };
  if (!Array.isArray(raw)) return REJECT;
  if (raw.length === 0 || raw.length > SCAN_PAGE_SIZE) return REJECT;
  const wordIds: string[] = [];
  const seen = new Set<string>();
  for (const value of raw) {
    if (typeof value !== 'string' || !UUID_RE.test(value)) return REJECT;
    if (seen.has(value)) return REJECT;
    seen.add(value);
    wordIds.push(value);
  }
  return { ok: true, wordIds };
}
```

- [ ] **Step 4: הרץ את הבדיקות ואת שומר הטוהר**

```bash
npx vitest run lib/core/levelScan.test.ts && npm run check:core
```

Expected: כל הבדיקות עוברות · `/lib/core purity: OK`.

- [ ] **Step 5: שתי מוטציות שמוכיחות ששתי הבדיקות החשובות חיות**

הרץ כל אחת, **רשום את המספר המדויק שנפל**, והחזר את הקוד:

1. ב-`checkScanPayload`, החלף `if (seen.has(value)) return REJECT;` ב-`if (false) return REJECT;`
   Expected: הבדיקה «⛔ כפילות נדחית» נופלת.
2. ב-`pageOf`, החלף `words.slice(start, start + SCAN_PAGE_SIZE)` ב-`words.slice(start)`
   Expected: «העמוד הראשון הוא 12 הראשונים» נופלת (`25` במקום `12`).

⛔ אם מוטציה **לא** הפילה דבר — הבדיקה הזאת חלולה. תקן אותה לפני שתמשיך, ופתח ממצא לפי תבנית F-064.

- [ ] **Step 6: קומיט**

```bash
git add lib/core/levelScan.ts lib/core/levelScan.test.ts
git commit -m "loop(DEV): T-082 pure level scan — 12 per screen, stable order, strict payload"
```

---

## Task 2 — T-082ⓑ: `GET/POST /api/levels/scan` + החוזה

**Files:**
- Create: `app/api/levels/scan/route.ts`
- Test: `app/api/levels/scan/route.test.ts`
- Modify: `docs/api-contract.md` (סעיף חדש **אחרי** `## POST /api/levels/current`, לפני `## GET /api/world/status`)

**Interfaces:**
- Consumes: `sortScanWords` · `excludeSeen` · `checkScanPayload` · `MAX_SCAN_WORDS` · `ScanWord` מ-Task 1 · `parseLevel` מ-`lib/core/levelSummary.ts` (קיים).
- Produces (החוזה ש-Task 3 צורך):
  - `GET /api/levels/scan` ⇒ `200 { ok: true, level: null }` **או** `200 { ok: true, level: CefrBand, total: number, words: { word_id: string; headword: string }[] }`
  - `POST /api/levels/scan` body `{ word_ids: string[] }` ⇒ `200 { ok: true, marked: number }`
  - שניהם: `401 { ok:false, code:'session_expired' }` · `503 { ok:false, code:'schema_missing', message:'המאגר עדיין לא הוקם' }` · `503 { ok:false, code:'unavailable' }` · `POST` בלבד: `400 { ok:false, code:'unavailable' }`

- [ ] **Step 1: כתוב את בדיקת המקור**

צור `app/api/levels/scan/route.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * `GET/POST /api/levels/scan` — T-082 · D-041. בדיקות מקור, כמו שאר נתיבי ה-API:
 * סביבת vitest היא `node`, אין כאן Supabase חי, והדבר שנשמר כאן הוא **סדר השומרים
 * ואילו עמודות נכתבות** — בדיוק מה שמוטציה יכולה לשבור בשקט.
 */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}

const CODE = withoutComments(readFileSync('app/api/levels/scan/route.ts', 'utf8'));
const CONTRACT = readFileSync('docs/api-contract.md', 'utf8');

describe('סדר השומרים (דפוס C-0032)', () => {
  it('ENV נבדק לפני שנוצר לקוח', () => {
    expect(CODE.indexOf('readSupabaseEnv')).toBeLessThan(CODE.indexOf('createRouteClient'));
  });

  it('session נבדק לפני שהגוף מאומת — קורא לא מזוהה אינו לומד אילו ערכים מתקבלים', () => {
    expect(CODE.indexOf('getUser')).toBeLessThan(CODE.indexOf('checkScanPayload('));
  });

  it('גוף פסול ⇒ 400, ⛔ לא 500', () => {
    expect(CODE).toContain('status: 400');
  });

  it('⛔ מחרוזת השגיאה של Supabase אינה נכנסת ל-JSON (T-053)', () => {
    expect(CODE).not.toMatch(/message:\s*\w+Error\.message/);
    expect(CODE).toContain('console.error');
  });
});

describe('⛔ הכתיבה נוגעת בשלוש עמודות בלבד — ⛔ אף אחת מהן אינה SM-2 (D-038)', () => {
  const updateArg = CODE.slice(CODE.indexOf('const MARK ='), CODE.indexOf('};', CODE.indexOf('const MARK =')));

  it('self_marked_known · self_marked_at · updated_at, ותו לא', () => {
    expect(updateArg).toContain('self_marked_known');
    expect(updateArg).toContain('self_marked_at');
    expect(updateArg).toContain('updated_at');
  });

  it.each([
    'easiness',
    'interval_days',
    'repetition',
    'next_review_at',
    'consecutive_correct_recognition',
    'correct_attempts',
    'mastered_at',
    'attempts_to_mastery',
    'time_to_first_correct',
  ])('⛔ %s אינו נכתב — סימון עצמי אינו חשיפה שנענתה', (column) => {
    expect(updateArg).not.toContain(column);
  });

  it('⛔ אין upsert — insert על שורה חסרה, update על קיימת (D-016)', () => {
    expect(CODE).not.toContain('.upsert(');
    expect(CODE).toContain('.insert(');
    expect(CODE).toContain('.update(');
  });
});

describe('ⓐ הסריקה מציעה מילים שטרם נראו, ⛔ ולא את כל הרמה', () => {
  it('מסננת דרך excludeSeen בשכבה הטהורה ⛔ ולא ב-not.in בשאילתה', () => {
    expect(CODE).toContain('excludeSeen(');
    expect(CODE).not.toContain('.not(');
  });

  it('הסינון לרמה הוא cefr_profile_band ⛔ ולעולם לא senses.cefr_level (D-034)', () => {
    expect(CODE).toContain('cefr_profile_band');
    expect(CODE).not.toContain('cefr_level');
  });

  it('שש הרמות מוגדרות במקום אחד — דרך parseLevel', () => {
    expect(CODE).toContain('parseLevel(');
    expect(CODE).not.toMatch(/\['A1',\s*'A2'/);
  });
});

describe('התקרה מפילה ל-503, ⛔ ולא לרשימה חלקית', () => {
  it('נבדקת מול MAX_SCAN_WORDS ומחזירה unavailable', () => {
    expect(CODE).toContain('MAX_SCAN_WORDS');
    expect(CODE).toMatch(/>=\s*MAX_SCAN_WORDS/);
  });
});

describe('⛔ המסך לעולם אינו רואה «0 מילים» על תקלה', () => {
  it('כשל סכמה ⇒ schema_missing עם משפט עברי', () => {
    expect(CODE).toContain('schema_missing');
    expect(CODE).toContain('המאגר עדיין לא הוקם');
  });

  it('אין סשן ⇒ 401 session_expired', () => {
    expect(CODE).toContain('session_expired');
    expect(CODE).toContain('status: 401');
  });
});

describe('החוזה מתעדכן באותו קומיט', () => {
  it.each(['GET /api/levels/scan', 'POST /api/levels/scan'])('%s מתועד', (heading) => {
    expect(CONTRACT).toContain(heading);
  });

  it('החוזה אומר במפורש שהסריקה ⛔ אינה נוגעת ב-SM-2', () => {
    expect(CONTRACT).toContain('self_marked_known');
    expect(CONTRACT).toContain('D-038');
  });
});
```

- [ ] **Step 2: הרץ וּודא כישלון**

```bash
npx vitest run app/api/levels/scan/route.test.ts
```

Expected: כישלון בהעמסה — `ENOENT: no such file or directory, open 'app/api/levels/scan/route.ts'`.

- [ ] **Step 3: כתוב את הנתיב**

צור `app/api/levels/scan/route.ts`:

```ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  MAX_SCAN_WORDS,
  checkScanPayload,
  excludeSeen,
  sortScanWords,
  type ScanWord,
} from '@/lib/core/levelScan';
import { parseLevel } from '@/lib/core/levelSummary';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/**
 * סריקת רמה — D-041 · T-082 · § 4.2ז.
 *
 * ⛔ **הנתיב אינו מחשב ואינו סופר.** הוא שולף את מילות הרמה ואת מזהי ההתקדמות של
 * הלומד, ומוסר את שתיהן לשכבה הטהורה. הסינון «מה טרם נראה» חי ב-`lib/core/levelScan.ts`
 * בלבד, בדיוק כפי ששלוש הספירות חיות ב-`levelSummary.ts` בלבד.
 *
 * ⛔ **הכתיבה אינה נוגעת בְּמנוע החזרה המרווחת.** `self_marked_known` היא עמודה נפרדת
 * מפני שסימון עצמי ⛔ אינו חשיפה שנענתה, וכתיבתו כ-`repetition = 1` הייתה שקר לנוסחת
 * SM-2 (D-038). ⛔ אף עמודה של 7.1 אינה מופיעה בקובץ הזה.
 */

/**
 * תקרת ביטוח על רשימת «כבר נפגש», ⛔ ולא מגבלת מוצר — אותו קבוע ואותו נימוק כמו
 * `MAX_SEEN_ROWS` ב-`app/api/study/queue/route.ts`: הסינון נכון רק אם הרשימה שלמה,
 * ורשימה חתוכה הייתה מציעה לסריקה מילה שהלומד כבר פגש.
 */
const MAX_SEEN_ROWS = 1000;

/** ⛔ העמודות שהמסך מציג בלבד. `select('*')` היה שולח למסך שדות שאינם עניינו. */
const WORDS_SELECT = 'id, headword';

type WordRow = { id: string; headword: string | null };
type SeenRow = { word_id: string };

function isSchemaMissing(code: string | undefined): boolean {
  return code === '42P01' || code === 'PGRST205' || code === '42703' || code === 'PGRST204';
}
function schemaMissing() {
  return NextResponse.json(
    { ok: false, code: 'schema_missing', message: 'המאגר עדיין לא הוקם' },
    { status: 503 },
  );
}
function unavailable(status = 503) {
  return NextResponse.json({ ok: false, code: 'unavailable' }, { status });
}
function sessionExpired() {
  return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });
}

/** GET /api/levels/scan — see docs/api-contract.md */
export async function GET() {
  const env = readSupabaseEnv();
  if (!env) return unavailable();

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return sessionExpired();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('current_level')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('[api/levels/scan] profile read failed:', profileError.message);
    return isSchemaMissing((profileError as { code?: string }).code) ? schemaMissing() : unavailable();
  }

  // ⛔ אין נפילה שקטה ל-A1. «טרם בחר» הוא מצב אמיתי (D-037), והמסך מכבד אותו.
  const level = parseLevel((profile as { current_level?: unknown } | null)?.current_level);
  if (level === null) return NextResponse.json({ ok: true, level: null });

  const [wordsResult, seenResult] = await Promise.all([
    supabase.from('words').select(WORDS_SELECT).eq('cefr_profile_band', level).limit(MAX_SCAN_WORDS),
    supabase.from('word_progress').select('word_id').eq('user_id', user.id).limit(MAX_SEEN_ROWS),
  ]);

  if (wordsResult.error || seenResult.error) {
    const failed = wordsResult.error ?? seenResult.error;
    console.error('[api/levels/scan] read failed:', failed?.message);
    return isSchemaMissing((failed as { code?: string } | null)?.code) ? schemaMissing() : unavailable();
  }

  const wordRows = (wordsResult.data ?? []) as unknown as WordRow[];
  const seenRows = (seenResult.data ?? []) as unknown as SeenRow[];

  // רשימה שנחתכה בתקרה היא רשימה חלקית: היא הייתה מציעה מילה שכבר נפגשה, או משמיטה
  // מילים מהרמה בלי לומר זאת. עדיף מסך שאומר «לא הצלחנו» מאשר סריקה שקרית.
  if (wordRows.length >= MAX_SCAN_WORDS || seenRows.length >= MAX_SEEN_ROWS) {
    console.error('[api/levels/scan] ceiling reached; the scan list would be incomplete');
    return unavailable();
  }

  const candidates: ScanWord[] = wordRows
    .filter((row): row is WordRow & { headword: string } => typeof row.headword === 'string' && row.headword.trim() !== '')
    .map((row) => ({ wordId: row.id, headword: row.headword.trim() }));

  const words = sortScanWords(excludeSeen(candidates, seenRows.map((row) => row.word_id)));

  return NextResponse.json({
    ok: true,
    level,
    total: words.length,
    words: words.map((word) => ({ word_id: word.wordId, headword: word.headword })),
  });
}

/**
 * ⛔ שלוש עמודות, ⛔ ותו לא. הקבוע נקרא `MARK` כדי שבדיקת המקור תוכל לחתוך אותו
 * במדויק ולטעון על **מה שנכתב**, ⛔ ולא על מה שמופיע איפשהו בקובץ.
 */
function markPayload(nowIso: string) {
  const MARK = {
    self_marked_known: true,
    self_marked_at: nowIso,
    updated_at: nowIso,
  };
  return MARK;
}

/** POST /api/levels/scan — see docs/api-contract.md */
export async function POST(request: Request) {
  const env = readSupabaseEnv();
  if (!env) return unavailable();

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return sessionExpired();

  const check = checkScanPayload(await request.json().catch(() => null));
  if (!check.ok) return unavailable(400);
  const wordIds = check.wordIds;

  const nowIso = new Date().toISOString();
  const MARK = markPayload(nowIso);

  // אילו מהמילים כבר יש להן שורה. ⛔ לא `upsert`: הוא היה חייב להצהיר מחדש על
  // `track_id`, ומקום שני שבו ברירת המחדל חיה הוא מקום שני שבו היא יכולה להיות
  // שגויה (D-016, אותו נימוק בדיוק כמו ב-`app/api/review/route.ts`).
  const { data: existing, error: existingError } = await supabase
    .from('word_progress')
    .select('word_id')
    .eq('user_id', user.id)
    .in('word_id', [...wordIds]);

  if (existingError) {
    console.error('[api/levels/scan] existing read failed:', existingError.message);
    return isSchemaMissing((existingError as { code?: string }).code) ? schemaMissing() : unavailable();
  }

  const known = new Set(((existing ?? []) as unknown as SeenRow[]).map((row) => row.word_id));
  const toInsert = wordIds.filter((id) => !known.has(id));
  const toUpdate = wordIds.filter((id) => known.has(id));

  if (toInsert.length > 0) {
    const { error } = await supabase.from('word_progress').insert(
      toInsert.map((wordId) => ({
        user_id: user.id,
        word_id: wordId,
        first_seen_at: nowIso,
        ...MARK,
      })),
    );
    if (error) {
      console.error('[api/levels/scan] insert failed:', error.message);
      return isSchemaMissing((error as { code?: string }).code) ? schemaMissing() : unavailable();
    }
  }

  if (toUpdate.length > 0) {
    const { error } = await supabase
      .from('word_progress')
      .update(MARK)
      .eq('user_id', user.id)
      .in('word_id', toUpdate);
    if (error) {
      console.error('[api/levels/scan] update failed:', error.message);
      return isSchemaMissing((error as { code?: string }).code) ? schemaMissing() : unavailable();
    }
  }

  return NextResponse.json({ ok: true, marked: wordIds.length });
}
```

- [ ] **Step 4: עדכן את `docs/api-contract.md` באותו קומיט**

הוסף **מיד אחרי** סעיף `## POST /api/levels/current` ולפני `## GET /api/world/status`:

````markdown
## GET /api/levels/scan

**סריקת רמה — הרשימה שממנה הלומד מצהיר «אני יודע»** (T-082 · D-041 · § 4.2ז). דורש
סשן חי. ⛔ אין פרמטרים.

**200 — הלומד טרם בחר רמה:** `{ "ok": true, "level": null }`

**200 — רמה נבחרה:**

```json
{
  "ok": true,
  "level": "A1",
  "total": 197,
  "words": [{ "word_id": "1111…", "headword": "budget" }]
}
```

⚠️ **הרשימה מכילה אך ורק מילים שאין להן שורת `word_progress` ללומד הזה** — בדיוק
קבוצת `unseen` של `GET /api/levels/summary`. ⛔ ולא «כל מילות הרמה»: מילה שכבר ברשימת
החזרה שייכת למנוע 7.1, והצגתה בסריקה הייתה נותנת ללומד שתי דרכים סותרות לומר משהו על
אותה מילה. הסינון נעשה ב-`lib/core/levelScan.ts` (`excludeSeen`), ⛔ ולא כרשימת `not.in`
בשאילתה — אורך ה-URL גדל עם ההיסטוריה ונשבר בשקט.

⚠️ **הרשימה מלאה, והדפדוף הוא בלקוח** (12 בכל מסך, `SCAN_PAGE_SIZE`). ⛔ נתיב שמחזיר
«את ה-12 הבאים» היה מחזיר לנצח את אותן מילים שהלומד **לא** סימן, והלומד לא היה מתקדם.
הסדר הוא `headword` עולה ואז `word_id` — יציב בין קריאות, ⛔ ולא אקראי ו⛔ לא לפי תדירות
(סדר תדירות הוא טענה פדגוגית, וסריקה אינה טוענת דבר).

⚠️ **תקרה: `MAX_SCAN_WORDS = 500` מילים ברמה · `MAX_SEEN_ROWS = 1000` שורות התקדמות.**
שליפה שהגיעה לתקרה ⇒ **503 `unavailable`** עם `console.error`, ⛔ ולא רשימה חלקית.

**401 —** `{ "ok": false, "code": "session_expired" }`
**503 — הסכמה לא הורצה:** `{ "ok": false, "code": "schema_missing", "message": "המאגר עדיין לא הוקם" }`
**503 — כל כשל אחר:** `{ "ok": false, "code": "unavailable" }`

⚠️ **התנהגות הצרכן מול כישלון היא חלק מהחוזה** (תקדים C-0127 · T-124 · D-065). הצרכן
הוא `<LevelScan>`, ולשלושת הקודים יש יציאה מ-`lib/core/failureExit.ts`; «נסה שוב» מוצג
**רק** ל-`unavailable`.

---

## POST /api/levels/scan

**הסימון עצמו — «אני יודע את המילים האלה»** (T-082 · D-038 · D-041). דורש סשן חי.

**גוף הבקשה:** `{ "word_ids": ["1111…", "2222…"] }` — בין 1 ל-**12** מזהי UUID, ⛔ בלי
כפילות. 12 הוא `SCAN_PAGE_SIZE`: מסך אחד הוא התקרה.

**200:** `{ "ok": true, "marked": 7 }`

**400 — גוף פסול** (אינו אובייקט · `word_ids` חסר או ריק · יותר מ-12 · ערך שאינו UUID ·
מזהה כפול): `{ "ok": false, "code": "unavailable" }`.
⚠️ **כפילות נדחית ⛔ ואינה מסוננת בשקט** — סינון שקט היה הופך «סימנתי 12» ל-11 בלי
שאיש רואה.

⛔ **הנתיב כותב שלוש עמודות בלבד: `self_marked_known` · `self_marked_at` · `updated_at`.**
⛔ **אף עמודה של מנוע החזרה המרווחת אינה נכתבת ואינה נקראת כאן** — לא `easiness`, לא
`interval_days`, לא `repetition`, לא `next_review_at` ולא `consecutive_correct_recognition`.
זו הדרישה המפורשת של **D-038**: סימון עצמי ⛔ אינו חשיפה שנענתה, וכתיבתו כ-`repetition = 1`
הייתה שקר לנוסחה. השדה **מסנן מהתור** ותו לא. נאכף כבדיקת מקור ב-`route.test.ts`.

⛔ **שורה חסרה נוצרת ב-`insert` ושורה קיימת מעודכנת ב-`update` — ⛔ ולא `upsert`** (D-016):
‏`upsert` היה חייב להצהיר מחדש על `track_id`, ומקום שני שבו ברירת המחדל חיה הוא מקום שני
שבו היא יכולה להיות שגויה.

⚠️ **⛔ אין ולידציה שהמילה שייכת לרמת הלומד, וזו הכרעה מוצהרת:** RLS מגביל כתיבה לשורות
של הלומד עצמו, ולומד שסימן מילה מחוץ לרמתו אמר על עצמו אמת. שער כזה היה כלל מוצר חדש
שאין לו הכרעה כתובה.

⚠️ **הפעולה חד-כיוונית היום.** הגנת D-038 — «בדוק את עצמי» שפותח את הרשימה כחפיסה
ונפילה שמחזירה `self_marked_known` ל-`false` — ⛔ **טרם נבנתה ואין לה שורת משימה**.
נרשם ל-PM.

**401 —** `{ "ok": false, "code": "session_expired" }`
**503 —** `schema_missing` / `unavailable`, כמו ב-`GET`.

---
````

- [ ] **Step 5: הרץ את הבדיקות**

```bash
npx vitest run app/api/levels/scan/route.test.ts && npm run typecheck
```

Expected: כל הבדיקות עוברות · `typecheck` יוצא 0.

- [ ] **Step 6: מוטציה שמוכיחה ששומר העמודות חי**

הוסף `repetition: 1,` לתוך אובייקט `MARK` ב-`markPayload`, הרץ שוב, **רשום את המספר**, והסר.
Expected: `it.each` על העמודות האסורות נופל על `repetition` — הבדיקה שהיא **מדד ההצלחה החשוב ביותר** של § 4.2ז.

- [ ] **Step 7: קומיט**

```bash
git add app/api/levels/scan/route.ts app/api/levels/scan/route.test.ts docs/api-contract.md
git commit -m "loop(DEV): T-082 GET/POST /api/levels/scan + contract — three columns, zero SM-2"
```

---

## Task 3 — T-082ⓒ: המסך `<LevelScan>` + `/study/scan` + הפיקסטורה

**Files:**
- Create: `components/LevelScan.tsx`
- Test: `components/LevelScan.test.ts`
- Create: `app/study/scan/page.tsx`
- Create: `app/dev/scan/page.tsx`
- Modify: `scripts/verify-mobile.mjs` (‏`ROUTES` + `EXPECTED_CONSOLE`)

**Interfaces:**
- Consumes: החוזה של Task 2 · `pageOf` · `pageCount` · `SCAN_PAGE_SIZE` · `ScanWord` מ-Task 1 · `apiGet`/`apiPost` · `FAILURE_HE`/`RETRY_HE` · `failureExit`/`isRetryable` · `<EnWord>` · `LevelSummary` (לקריאה החוזרת במסך הסיום).
- Produces: `export default function LevelScan(props: { readonly initialWords?: readonly ScanWord[] })` — הפרופ הרשות היחיד בקובץ, וקיים **אך ורק** בשביל הפיקסטורה `/dev/scan`, שאין לה סשן ולכן לעולם לא הייתה מציירת את הרשת.

⚠️ **סקיל חובה לפני שורת קוד:** המשימה מסומנת `ui-styling` ב-`plan/50-tasks.md`. הפעל אותו.
⚠️ **⛔ אין כאן `dataviz`:** המסך הזה ⛔ אינו מקודד נתונים בצבע — הוא רשת של מילים ושני מספרים בטקסט. `dataviz` נכנס ב-Task 6, שבו יש טבעת.

- [ ] **Step 1: כתוב את בדיקת המקור**

צור `components/LevelScan.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * `<LevelScan>` — סריקת רמה (T-082 · D-041 · § 4.2ז).
 *
 * שומר מקור, כמו `LevelMapScreen.test.ts` ו-`DeckSelector.test.ts`: סביבת vitest היא
 * `node` ו-jsdom נעדר בכוונה. גיאומטריה — 44px ואפס גלילה אופקית — היא עבודתו של
 * `check:mobile` דרך הפיקסטורה `/dev/scan`.
 */
const SRC = readFileSync('components/LevelScan.tsx', 'utf8');
const PAGE = readFileSync('app/study/scan/page.tsx', 'utf8');
const HARNESS = readFileSync('scripts/verify-mobile.mjs', 'utf8');

function withoutComments(source: string): string {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}

const CODE = withoutComments(SRC);

describe('D-041 — הצהרה, ⛔ ולא מבחן', () => {
  it('הרשת נחתכת ל-12 דרך השכבה הטהורה ⛔ ולא במספר מוטבע', () => {
    expect(CODE).toContain('pageOf(');
    expect(CODE).toContain('SCAN_PAGE_SIZE');
    expect(CODE).not.toMatch(/slice\(\s*\d+\s*,\s*\d+\s*\)/);
  });

  it.each(['ניקוד', 'נכון', 'שגוי', 'טעית', 'כל הכבוד', 'ציון', 'שניות', 'טיימר'])(
    '⛔ המילה «%s» אינה מופיעה — אין ניקוד, אין זמן, אין תשובה נכונה',
    (word) => {
      expect(CODE).not.toContain(word);
    },
  );

  it('⛔ אין שעון בקובץ — סריקה אינה מדודה בזמן', () => {
    expect(CODE).not.toContain('setInterval');
    expect(CODE).not.toContain('setTimeout');
    expect(CODE).not.toContain('Date.now');
  });
});

describe('ⓓ מסך הסיום עובדתי, והמספרים נקראים ⛔ ולא נספרים בלקוח', () => {
  it('קורא מחדש את /api/levels/summary ⛔ ואינו סופר markedThisSession', () => {
    expect(CODE).toContain('/api/levels/summary');
    expect(CODE).not.toContain('markedCount');
  });

  it('שני המשפטים העובדתיים בשמם', () => {
    expect(CODE).toContain('סימנת ש-');
    expect(CODE).toContain('נשארו');
  });
});

describe('הסימון נשלח לנתיב הסריקה ⛔ ולעולם לא ל-/api/review', () => {
  it('POST /api/levels/scan', () => {
    expect(CODE).toContain("'/api/levels/scan'");
  });

  it.each(['/api/review', '/api/practice'])('⛔ %s אינו מוזכר', (path) => {
    expect(CODE).not.toContain(path);
  });

  it('⛔ אין גישה ישירה לדאטהבייס — הכל דרך lib/api/client.ts', () => {
    expect(CODE).not.toContain('supabase');
    expect(CODE).not.toMatch(/\bfetch\(/);
  });
});

describe('חוקת העיצוב', () => {
  it('⛔ אין מרכוז אנכי ואין h-screen (F-011 · F-016 · חוקה § 4)', () => {
    expect(CODE).not.toContain('justify-center');
    expect(CODE).not.toContain('h-screen');
  });

  it('⛔ אין hex גולמי (חוקה § 6)', () => {
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it('⛔ אין אמוג\'י (חוקה § 6)', () => {
    expect(CODE).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  });

  it('כל מילה אנגלית עוברת ב-<EnWord> (חוקה § 2)', () => {
    expect(CODE).toContain('EnWord');
  });

  it('כל תא ברשת הוא יעד מגע ≥44px', () => {
    // lookbehind על `=` — בלי זה הכמת העצל עוצר ב-`>` של `onClick={() => …}`
    // ונכשל גם על קוד תקין (מחלקת F-039, נמדד ב-C-0176).
    expect(CODE).toMatch(/<button[^=>]*(?:=(?:"[^"]*"|\{[^}]*\})[^=>]*)*min-h-touch/s);
  });
});

describe('T-124 · D-065 — כל ענף כשל נושא יציאה', () => {
  it('היציאה נגזרת מהטבלה היחידה ⛔ ולא מנוסחת כאן', () => {
    expect(CODE).toContain('failureExit(');
    expect(CODE).toContain('isRetryable(');
  });

  it('נוסח הכשל מיובא ⛔ ואינו מוכפל (T-056)', () => {
    expect(CODE).toContain('FAILURE_HE');
    expect(CODE).toContain('RETRY_HE');
  });
});

describe('המסך מחובר, ⛔ ואינו יתום', () => {
  it('‏/study/scan מרנדר את הרכיב', () => {
    expect(PAGE).toContain('LevelScan');
  });

  it('הפיקסטורה נמדדת ב-check:mobile', () => {
    expect(HARNESS).toContain("'/dev/scan'");
  });
});
```

- [ ] **Step 2: הרץ וּודא כישלון**

```bash
npx vitest run components/LevelScan.test.ts
```

Expected: `ENOENT ... components/LevelScan.tsx`.

- [ ] **Step 3: כתוב את הרכיב**

צור `components/LevelScan.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import EnWord from '@/components/EnWord';
import { apiGet, apiPost } from '@/lib/api/client';
import { FAILURE_HE, RETRY_HE } from '@/lib/core/failure';
import { failureExit, isRetryable } from '@/lib/core/failureExit';
import { SCAN_PAGE_SIZE, pageCount, pageOf, type ScanWord } from '@/lib/core/levelScan';
import type { LevelSummary } from '@/lib/core/levelSummary';

/**
 * סריקת רמה — T-082 · D-041 · § 4.2ז.
 *
 * ⛔ **זו הצהרה, ⛔ ולא מבחן.** אין ניקוד, אין שעון, ואין תשובה נכונה: הקשה על תא אומרת
 * «אני יודע», והקשה שנייה מבטלת. לכן אין בקובץ הזה `setTimeout`, אין `Date.now`, ואין
 * ולו מילה אחת של משוב הערכה.
 *
 * ⛔ **הדפדוף בלקוח, ⛔ ולא בשרת.** הנתיב מחזיר את הרשימה כולה פעם אחת; לו היה מחזיר
 * «את ה-12 הבאים» הוא היה מחזיר לנצח את אותן מילים שהלומד **לא** סימן, והלומד לא היה
 * מתקדם. החיתוך עצמו הוא `pageOf` בשכבה הטהורה.
 *
 * ⛔ **מסך הסיום קורא את המספרים ⛔ ואינו סופר אותם.** «סימנת ש-N מילים כבר ידועות לך»
 * הוא `known` מ-`GET /api/levels/summary`, ו«נשארו M» הוא `unseen`. ההגדרה חיה
 * ב-`lib/core/levelSummary.ts` בלבד (§ 4.2ז: «⛔ אין הגדרה שנייה»); מונה מקומי היה
 * מספר שני שסוטה מהראשון ברגע שהלומד סוגר וחוזר.
 *
 * ⛔ עיגון עליון, ⛔ אפס `justify-center` (חוקה § 4 — F-011 שחזר כ-F-016).
 */

const HEADING_HE = 'סריקת רמה';
const LEAD_HE = 'הקש על כל מילה שאתה כבר יודע.';
const HINT_HE = 'זו הצהרה שלך, ⛔ ולא בחינה. אפשר לשנות בכל רגע.';
const CONTINUE_HE = 'המשך';
const DONE_HE = 'סיימת את הסריקה';
const CHOOSE_FIRST_HE = 'בחר רמה כדי להתחיל בסריקה';
const CHOOSE_FIRST_ACTION_HE = 'למפת הרמה';
const SCHEMA_MISSING_HE = 'המאגר עדיין לא הוקם';
const EXPIRED_HE = 'ההתחברות פגה. היכנס שוב.';
const BACK_HE = 'חזרה למפת הרמה';
const CARDS_HREF = '/cards';

type ScanResponse =
  | { readonly ok: true; readonly level: string; readonly total: number; readonly words: readonly WireWord[] }
  | { readonly ok: true; readonly level: null }
  | { readonly ok: false; readonly code: string };

type WireWord = { readonly word_id: string; readonly headword: string };

type SummaryResponse =
  | ({ readonly ok: true } & LevelSummary)
  | { readonly ok: true; readonly level: null }
  | { readonly ok: false; readonly code: string };

type FailCode = 'schema_missing' | 'session_expired' | 'unavailable';

type ScreenState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'choose' }
  | { readonly kind: 'scanning'; readonly words: readonly ScanWord[] }
  | { readonly kind: 'done'; readonly known: number | null; readonly unseen: number | null }
  | { readonly kind: 'failed'; readonly code: FailCode };

function failCode(code: string): FailCode {
  return code === 'schema_missing' || code === 'session_expired' ? code : 'unavailable';
}

/** ⛔ `schema_missing` ו-`session_expired` אינם «כשל טעינה»: שלושה אירועים, שלושה משפטים. */
function failureText(code: FailCode): string {
  if (code === 'schema_missing') return SCHEMA_MISSING_HE;
  if (code === 'session_expired') return EXPIRED_HE;
  return FAILURE_HE.load;
}

/** ⛔ לא `0`. מספר שלא הצלחנו לקרוא אינו אפס — אותו כלל של `<DeckSelector>` ושל `<MeScreen>`. */
const NO_NUMBER_HE = '—';
function number(value: number | null): string {
  return value === null ? NO_NUMBER_HE : String(value);
}

export default function LevelScan({
  initialWords,
}: {
  /** ⛔ קיים אך ורק בשביל הפיקסטורה `/dev/scan`, שאין לה סשן ולכן לעולם לא הייתה
   *  מציירת את הרשת. ⛔ המסך האמיתי לעולם אינו מקבל אותו. */
  readonly initialWords?: readonly ScanWord[];
} = {}): React.JSX.Element {
  const [state, setState] = useState<ScreenState>(
    initialWords ? { kind: 'scanning', words: initialWords } : { kind: 'loading' },
  );
  const [page, setPage] = useState(0);
  const [marked, setMarked] = useState<readonly string[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (initialWords) return;
    setState({ kind: 'loading' });
    try {
      const body = await apiGet<ScanResponse>('/api/levels/scan');
      if (!body.ok) {
        setState({ kind: 'failed', code: failCode(body.code) });
        return;
      }
      if (body.level === null) {
        setState({ kind: 'choose' });
        return;
      }
      setPage(0);
      setMarked([]);
      setState({
        kind: 'scanning',
        words: body.words.map((word) => ({ wordId: word.word_id, headword: word.headword })),
      });
    } catch {
      setState({ kind: 'failed', code: 'unavailable' });
    }
  }, [initialWords]);

  useEffect(() => {
    void load();
  }, [load]);

  const finish = useCallback(async () => {
    // ⛔ המספרים נקראים, ⛔ ולא נספרים כאן. כשל בקריאה משאיר «—», ⛔ ולא אפס.
    try {
      const body = await apiGet<SummaryResponse>('/api/levels/summary');
      if (body.ok && body.level !== null) {
        setState({ kind: 'done', known: body.known, unseen: body.unseen });
        return;
      }
    } catch {
      /* נופל ל-«—» מתחת */
    }
    setState({ kind: 'done', known: null, unseen: null });
  }, []);

  const toggle = useCallback((wordId: string) => {
    setMarked((current) =>
      current.includes(wordId) ? current.filter((id) => id !== wordId) : [...current, wordId],
    );
  }, []);

  const advance = useCallback(
    async (words: readonly ScanWord[]) => {
      setSaving(true);
      try {
        // ⛔ בקשה שאינה מסמנת דבר אינה נשלחת: הנתיב דוחה רשימה ריקה ב-400, וזה נכון —
        // «דילגתי על המסך» אינו כתיבה.
        if (marked.length > 0) {
          const body = await apiPost<{ ok: boolean; code?: string }>('/api/levels/scan', {
            word_ids: marked,
          });
          if (!body.ok) {
            setState({ kind: 'failed', code: failCode(body.code ?? 'unavailable') });
            return;
          }
        }
        setMarked([]);
        const next = page + 1;
        if (next >= pageCount(words.length)) await finish();
        else setPage(next);
      } catch {
        setState({ kind: 'failed', code: 'unavailable' });
      } finally {
        setSaving(false);
      }
    },
    [finish, marked, page],
  );

  const words = state.kind === 'scanning' ? state.words : [];
  const current = pageOf(words, page);
  const total = pageCount(words.length);

  return (
    <section className="flex min-h-[100dvh] flex-col gap-6 p-5" data-level-scan>
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold leading-tight">{HEADING_HE}</h1>
        {state.kind === 'scanning' ? (
          <p className="text-lg text-ink-muted">
            {LEAD_HE} מסך {page + 1} מתוך {total}.
          </p>
        ) : null}
        {state.kind === 'scanning' ? <p className="text-base text-ink-muted">{HINT_HE}</p> : null}
      </header>

      {state.kind === 'choose' ? (
        <div className="flex flex-col gap-3">
          <p className="text-lg">{CHOOSE_FIRST_HE}</p>
          <Link
            href={CARDS_HREF}
            data-primary-action="true"
            className="flex min-h-touch items-center rounded-lg bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
          >
            {CHOOSE_FIRST_ACTION_HE}
          </Link>
        </div>
      ) : null}

      {state.kind === 'failed' ? (
        <div className="flex flex-col gap-3">
          <p className="text-lg">{failureText(state.code)}</p>
          {isRetryable(state.code) ? (
            <button
              type="button"
              onClick={() => void load()}
              className="flex min-h-touch items-center rounded-lg border border-border-strong px-5 py-3 text-ink active:opacity-90"
            >
              {RETRY_HE}
            </button>
          ) : null}
          {/* ⛔ `<a>` ולא `<Link>`: כשהסשן מת הבקשה הבאה חייבת להגיע לשרת ולקבל רשות
              להפנות — הראוטר של הלקוח עלול לענות מהמטמון. */}
          <a
            href={failureExit(state.code).href}
            className="flex min-h-touch items-center rounded-lg bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
          >
            {failureExit(state.code).labelHe}
          </a>
        </div>
      ) : null}

      {state.kind === 'scanning' ? (
        <>
          {/* שתי עמודות ב-375: תא של 44px לפחות עם מילה אנגלית שלמה ⛔ אינו נכנס
              שלוש בשורה בלי לגלוש. שש שורות × שתיים = 12, בדיוק המספר של D-041. */}
          <ul className="grid list-none grid-cols-2 gap-3 p-0">
            {current.map((word) => {
              const on = marked.includes(word.wordId);
              return (
                <li key={word.wordId}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(word.wordId)}
                    className={[
                      'flex min-h-touch w-full items-center justify-between gap-2 rounded-lg px-4 py-3 text-ink active:opacity-90',
                      on ? 'border-2 border-border-strong font-bold' : 'border border-border-subtle',
                    ].join(' ')}
                  >
                    <EnWord className="text-lg">{word.headword}</EnWord>
                    {/* ⛔ צבע אינו הערוץ היחיד (חוקה § 1): המצב נאמר גם במילה,
                        וגם ב-`aria-pressed` לקורא מסך. */}
                    <span className="text-sm text-ink-muted">{on ? 'ידוע' : ''}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={() => void advance(words)}
            disabled={saving}
            data-primary-action="true"
            className="flex min-h-touch items-center rounded-lg bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
          >
            {CONTINUE_HE}
          </button>
        </>
      ) : null}

      {state.kind === 'done' ? (
        // ⛔ אין «כל הכבוד» ואין הערכת מוכנות (R-017). שני מספרים ומשפט עובדתי.
        <div className="flex flex-col gap-3">
          <p className="text-2xl font-bold">{DONE_HE}</p>
          <p className="text-lg">
            סימנת ש-{number(state.known)} מילים כבר ידועות לך. נשארו {number(state.unseen)}.
          </p>
          <Link
            href={CARDS_HREF}
            data-primary-action="true"
            className="flex min-h-touch items-center rounded-lg bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
          >
            {BACK_HE}
          </Link>
        </div>
      ) : null}

      {state.kind === 'loading' ? (
        // חוקה § 5: שלד, ⛔ לא ספינר. שש שורות בגובה הסופי כדי ששום דבר לא יקפוץ.
        <ul aria-busy="true" className="grid list-none grid-cols-2 gap-3 p-0">
          {Array.from({ length: SCAN_PAGE_SIZE }, (_, i) => (
            <li key={i} className="min-h-touch rounded-lg border border-border-subtle" />
          ))}
        </ul>
      ) : null}
    </section>
  );
}
```

- [ ] **Step 4: כתוב את שני העמודים**

צור `app/study/scan/page.tsx`:

```tsx
import LevelScan from '@/components/LevelScan';

/**
 * מסך הזרימה של סריקת הרמה — T-082 · D-041.
 *
 * ⛔ נשאר Server Component דק: הרשימה נקראת בלקוח דרך `lib/api/client.ts`, בדיוק כמו
 * ב-`app/study/page.tsx`. שליפה בשרת הייתה מקפיאה את הרשימה בציור הראשון, ולומד
 * שסימן וחזר היה מקבל את אותן מילים שוב.
 *
 * ⛔ **מחוץ ל-`app/(tabs)/`, ובכוונה:** מסך זרימה מלא-מסך אינו מקבל סרגל ניווט ראשי
 * (D-028), אחרת הרשת מאבדת את המסך שהיא זקוקה לו. הדרך החוצה היא הקישור «חזרה למפת
 * הרמה» שהרכיב נושא בכל מצב סופי.
 */
export default function LevelScanPage() {
  return <LevelScan />;
}
```

צור `app/dev/scan/page.tsx`:

```tsx
import LevelScan from '@/components/LevelScan';
import type { ScanWord } from '@/lib/core/levelScan';

/**
 * פיקסטורת פריסה ל-`check:mobile`. ⛔ אינה מסך מוצר ו⛔ אינה מקושרת משום מקום.
 *
 * ⚠️ **בלי הפיקסטורה הרשת עצמה לעולם אינה נמדדת:** ל-`next start` בהרנס אין env של
 * Supabase, ולכן `GET /api/levels/scan` עונה 503 בחוזה שלו עצמו — כלומר כל שורת
 * «ok /study/scan» הייתה מתארת את מסך **הכשל**, וזו בדיוק מחלקת F-027. שתים-עשרה
 * המילים כאן הן מחרוזות פריסה, ⛔ ואינן תוכן לימודי.
 *
 * הפיקסטורה מקבלת את המילים כ-prop ואינה מבקשת מהשרת דבר ⇒ ⛔ אין לה רשומה
 * ב-`EXPECTED_CONSOLE`, והשקט הזה הוא מה שמוכיח שהמדידה אינה על מסך הכשל.
 */
const WORDS: readonly ScanWord[] = [
  'ability', 'balance', 'capital', 'decision', 'evidence', 'feature',
  'general', 'however', 'increase', 'journey', 'knowledge', 'language',
].map((headword, i) => ({
  wordId: `${`${i}`.padStart(8, '0')}-2222-4333-8444-555555555555`,
  headword,
}));

export default function DevScanPage() {
  return <LevelScan initialWords={WORDS} />;
}
```

- [ ] **Step 5: חבר את ההרנס**

ב-`scripts/verify-mobile.mjs`, הוסף ל-`ROUTES` **אחרי** `'/dev/deck/skeleton',`:

```js
  // T-082 · D-041 — סריקת הרמה. `/study/scan` יושב מחוץ ל-`PROTECTED_SCREENS`
  // (proxy.ts) ולכן הוא **כן** מרונדר כאן, אבל בלי env של Supabase
  // `GET /api/levels/scan` עונה 503 בחוזה שלו עצמו ⇒ מה שהשורה ההיא מודדת הוא מצב
  // **הכשל**. הפיקסטורה מקבלת את 12 המילים כ-prop ואינה מבקשת מהשרת דבר, ולכן
  // ⛔ אין לה רשומה ב-EXPECTED_CONSOLE — והשקט הזה הוא ההוכחה שהרשת עצמה נמדדת.
  '/study/scan',
  '/dev/scan',
```

ובאובייקט `EXPECTED_CONSOLE`, הוסף ליד הרשומה `'/study'`:

```js
  '/study/scan': [/status of 503[\s\S]*@\S*\/api\/levels\/scan/],
```

- [ ] **Step 6: הרץ את הבדיקות ואת האימות המלא**

```bash
npx vitest run components/LevelScan.test.ts && npm run typecheck && npm run check:core && npm test && npm run build
```

Expected: כל אחת עוברת. **רשום את שני המספרים** של `npm test` (קבצים · בדיקות) מול הבסיס שלפני המשימה.

- [ ] **Step 7: מדוד את הפריסה, ⛔ אל תטען אותה**

```bash
npm run build && (npm start &) && sleep 8 && npm run check:mobile ; kill %1
```

Expected: `/dev/scan` ו-`/study/scan` עוברים ב-320/375/414 — אפס גלילה אופקית, כל יעדי המגע ≥44px, `/study/scan` (ב-`FLOW_ROUTES`? ⛔ **לא** — אל תוסיף אותו שם: הוא אינו אחד מחמשת מסכי המסלול של F-027) נושא פעולה מסומנת.
**רשום את מספר הבדיקות שהריץ ההרנס.** ⛔ אם `/dev/scan` נכשל על גלישה ב-320 — הרשת יורדת לעמודה אחת ב-`grid-cols-1 min-[360px]:grid-cols-2`, ⛔ ולא מוקטן יעד המגע.

- [ ] **Step 8: מוטציה**

הסר `min-h-touch` מכפתור התא ברשת, הרץ `npx vitest run components/LevelScan.test.ts`, **רשום את המספר שנפל**, והחזר.
Expected: «כל תא ברשת הוא יעד מגע ≥44px» נופלת.

- [ ] **Step 9: קומיט**

```bash
git add components/LevelScan.tsx components/LevelScan.test.ts app/study/scan/page.tsx app/dev/scan/page.tsx scripts/verify-mobile.mjs
git commit -m "loop(DEV): T-082 level scan screen — 12 per page, factual finish, measured fixture"
```

---

## Task 4 — T-083: שורה 5 — רשימת «לא ידעתי»

**Files:**
- Create: `components/UnknownList.tsx`
- Test: `components/UnknownList.test.ts`
- Modify: `components/LevelMapScreen.tsx` (**תוספת בלבד** — שורה 5 מתחת לשורה 4)
- Modify: `components/LevelMapScreen.test.ts` (**תוספת בלבד**)

**Interfaces:**
- Consumes: `GET /api/study/queue?deck=unknown&limit=50` (קיים, ⛔ ללא שינוי) · `apiGet` · `<EnWord>` · `FAILURE_HE`.
- Produces: `export default function UnknownList(): React.JSX.Element` — ⛔ בלי פרופים. ‏`<LevelMapScreen>` מרנדר אותו כשורה 5.

⚠️ **סקיל חובה:** `ui-styling` (העמודה ב-`50-tasks.md`).

**⛔ אין כאן נתיב חדש, וזה נמדד ⛔ ולא הונח:** `GET /api/study/queue?deck=unknown` כבר מחזיר בדיוק את הרשימה, בדיוק במיון ש-T-083 מבקש — `cefr_profile_band` עולה ואז `next_review_at` (`sortQueue` ב-`lib/core/deck.ts`, מתועד ב-`docs/api-contract.md`) — ועם `total` **לפני** החיתוך ל-`limit`. נתיב שני היה **הגדרה שנייה** לאותה חפיסה, וזה בדיוק מה ש-§ 4.2ז אוסר.

- [ ] **Step 1: כתוב את בדיקת המקור**

צור `components/UnknownList.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/** `<UnknownList>` — שורה 5 של § 4.2ז (T-083). שומר מקור, כמו שאר רכיבי המסך. */
const SRC = readFileSync('components/UnknownList.tsx', 'utf8');
const SCREEN = readFileSync('components/LevelMapScreen.tsx', 'utf8');

function withoutComments(source: string): string {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}

const CODE = withoutComments(SRC);

describe('רשימה, ⛔ ולא מונה (T-083)', () => {
  it('מציגה את המילה ואת התרגום, ⛔ ולא רק מספר', () => {
    expect(CODE).toContain('headword');
    expect(CODE).toContain('translation_he');
  });

  it('המילה האנגלית עוברת ב-<EnWord> (חוקה § 2)', () => {
    expect(CODE).toContain('EnWord');
  });

  it('פעולה אחת בראש הרשימה, ליעד הקיים', () => {
    expect(CODE).toContain('/study?deck=unknown');
    expect(CODE).toContain('תרגל את הרשימה');
  });
});

describe('⛔ אין הגדרה שנייה לחפיסה (§ 4.2ז)', () => {
  it('קוראת את הנתיב הקיים ⛔ ולא נתיב חדש', () => {
    expect(CODE).toContain('/api/study/queue?deck=unknown');
    expect(CODE).not.toContain('/api/levels/unknown');
  });

  it('⛔ אינה ממיינת מחדש בלקוח — המיון הוא של lib/core/deck.ts', () => {
    expect(CODE).not.toContain('.sort(');
  });

  it('⛔ אין גישה ישירה לדאטהבייס', () => {
    expect(CODE).not.toContain('supabase');
    expect(CODE).not.toMatch(/\bfetch\(/);
  });
});

describe('⛔ אין מחיקה ידנית — יציאה מהרשימה היא דרך המנוע בלבד', () => {
  it.each(['DELETE', 'apiPatch', 'הסר', 'מחק'])('⛔ «%s» אינו מופיע', (needle) => {
    expect(CODE).not.toContain(needle);
  });
});

describe('אמת על מספרים', () => {
  it('כשל קריאה ⇒ «—» ⛔ ולא 0', () => {
    expect(CODE).toContain("'—'");
  });

  it('רשימה חתוכה אומרת את הסך ⛔ ואינה מתחזה לשלמה', () => {
    expect(CODE).toContain('מתוך');
    expect(CODE).toContain('MAX_QUEUE_LIMIT');
  });
});

describe('חוקת העיצוב', () => {
  it('⛔ אין מרכוז אנכי ואין h-screen', () => {
    expect(CODE).not.toContain('justify-center');
    expect(CODE).not.toContain('h-screen');
  });

  it('⛔ אין hex גולמי ואין אמוג\'י (חוקה § 6)', () => {
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CODE).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  });

  it.each(['נעול', 'שולט', 'כל הכבוד', 'ניקוד', 'רצף'])('⛔ המילה «%s» אינה מופיעה', (word) => {
    expect(CODE).not.toContain(word);
  });
});

describe('הרכיב הוא שורה 5 של המסך, ⛔ ואינו יתום', () => {
  it('‏<LevelMapScreen> מרנדר אותו', () => {
    expect(SCREEN).toContain('UnknownList');
  });

  it('שורה 5 מופיעה אחרי שורה 4 במקור — הסדר של § 4.2ז', () => {
    expect(SCREEN.indexOf('דרכים לתרגל')).toBeLessThan(SCREEN.indexOf('UnknownList'));
  });
});
```

- [ ] **Step 2: הרץ וּודא כישלון**

```bash
npx vitest run components/UnknownList.test.ts
```

Expected: `ENOENT ... components/UnknownList.tsx`.

- [ ] **Step 3: כתוב את הרכיב**

צור `components/UnknownList.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import EnWord from '@/components/EnWord';
import { apiGet } from '@/lib/api/client';
import { MAX_QUEUE_LIMIT } from '@/lib/core/deck';
import { FAILURE_HE } from '@/lib/core/failure';

/**
 * שורה 5 של § 4.2ז — «רשימה מסודרת של המילים שסימן כלא ידע, כדי שיוכל לחזור עליהן»
 * (`02-inbox` פריט 8, בלשונו של רוי). T-083.
 *
 * ⛔ **רשימה, ⛔ ולא מונה.** ‏`<DeckSelector>` כבר מציג את המספר כאריח; אריח שני עם
 * אותו מספר אינו רשימה, וזה בדיוק מה שהמשימה נכתבה נגדו.
 *
 * ⛔ **אין כאן נתיב חדש, וזו מדידה ⛔ ולא חיסכון:** `GET /api/study/queue?deck=unknown`
 * כבר מחזיר את החפיסה במיון `cefr_profile_band` עולה ואז `next_review_at` — בדיוק
 * המיון ש-D-034 מכתיב — ואת `total` לפני החיתוך ל-`limit`. נתיב שני היה **הגדרה שנייה**
 * לאותה חפיסה, וזה מה ש-§ 4.2ז אוסר במפורש.
 *
 * ⛔ **אין מחיקה ידנית.** יציאה מהרשימה היא דרך המנוע בלבד — תשובה נכונה מאפסת את
 * החברות בחפיסה (`repetition >= 1`). כפתור «הסר» היה מקור אמת שני על אותה מילה.
 *
 * ⛔ הרכיב הזה ⛔ אינו נושא `<h1>` — המסך מחזיק אחד («הרמה שלך») ומוסר לכאן `<h2>`.
 */

const HEADING_HE = 'לא ידעתי';
const ACTION_HE = 'תרגל את הרשימה';
const ACTION_HREF = '/study?deck=unknown';
const EMPTY_HE = 'הרשימה ריקה. כל מילה שתיפול בכרטיסייה תגיע לכאן.';
/** ⛔ לא `0`. מספר שלא הצלחנו לקרוא אינו אפס — אותו כלל של `<DeckSelector>`. */
const NO_NUMBER_HE = '—';

type Card = {
  readonly word_id: string;
  readonly sense: { readonly headword: string; readonly translation_he: string };
};

type QueueResponse =
  | { readonly ok: true; readonly total: number; readonly cards: readonly Card[] }
  | { readonly ok: false; readonly code: string };

const QUERY = `/api/study/queue?deck=unknown&limit=${MAX_QUEUE_LIMIT}`;

export default function UnknownList(): React.JSX.Element {
  const [cards, setCards] = useState<readonly Card[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const body = await apiGet<QueueResponse>(QUERY);
        if (cancelled) return;
        if (!body.ok) {
          setFailed(true);
        } else {
          // ⛔ אין מיון כאן: הסדר הוא של `sortQueue` ב-`lib/core/deck.ts`, ומיון שני
          // בלקוח היה הגדרה שנייה שסוטה ברגע שהראשונה משתנה.
          setCards(body.cards);
          setTotal(body.total);
        }
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const empty = !loading && !failed && cards.length === 0;
  const truncated = total !== null && total > cards.length;

  return (
    <section className="flex flex-col gap-3" data-unknown-list>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold">{HEADING_HE}</h2>
        <span className="text-lg text-ink-muted">{total === null ? NO_NUMBER_HE : String(total)}</span>
      </div>

      {/* הפעולה בראש הרשימה, לפני הפריטים: רוי ביקש «כדי שיוכל לחזור עליהן», והחזרה
          היא הדבר שהרשימה קיימת בשבילו. מושבתת עם המספר כשאין מה לתרגל (§ 4.2ו),
          ⛔ ולא מוסתרת. */}
      {cards.length > 0 ? (
        <Link
          href={ACTION_HREF}
          className="flex min-h-touch items-center rounded-lg bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
        >
          {ACTION_HE}
        </Link>
      ) : (
        <button
          type="button"
          aria-disabled="true"
          className="flex w-full min-h-touch items-center rounded-lg border border-border-subtle px-5 py-3 text-ink-muted"
        >
          {ACTION_HE}
        </button>
      )}

      {failed ? <p className="text-base text-ink-muted">{FAILURE_HE.load}</p> : null}
      {empty ? <p className="text-base text-ink-muted">{EMPTY_HE}</p> : null}

      <ul aria-busy={loading} className="flex list-none flex-col gap-2 p-0">
        {cards.map((card) => (
          <li
            key={card.word_id}
            className="flex items-baseline justify-between gap-3 rounded-md border border-border-subtle px-4 py-2"
          >
            <EnWord className="text-lg font-semibold">{card.sense.headword}</EnWord>
            <span className="text-base text-ink-muted">{card.sense.translation_he}</span>
          </li>
        ))}
      </ul>

      {truncated ? (
        // ⛔ רשימה חתוכה אינה מתחזה לשלמה. הסך כבר מוצג למעלה, וזו השורה שאומרת
        // מפורשות שהיא נחתכה — בלעדיה 50 מתוך 90 נראים כמו כל הרשימה.
        <p className="text-sm text-ink-muted">
          מוצגות {cards.length} מתוך {total}.
        </p>
      ) : null}
    </section>
  );
}
```

- [ ] **Step 4: חבר כשורה 5 ב-`<LevelMapScreen>`**

ב-`components/LevelMapScreen.tsx`:

1. הוסף לייבוא, אחרי `import EnWord from '@/components/EnWord';`:

```tsx
import UnknownList from '@/components/UnknownList';
```

2. הוסף **מיד אחרי** בלוק `<section>` של «דרכים לתרגל» ולפני סגירת ה-`</section>` החיצוני:

```tsx
      {/* שורה 5 — «לא ידעתי» (T-083 · § 4.2ז). ⛔ רשימה ולא מונה: `<DeckSelector>`
          למעלה כבר מציג את המספר כאריח. מוצגת רק כשיש רמה — בלי רמה המסך הוא מצב
          בחירה, ורשימה מתחת לשש הרמות הייתה תשובה לשאלה שהלומד עוד לא שאל. */}
      {state.kind === 'ready' ? <UnknownList /> : null}
```

3. עדכן את `components/LevelMapScreen.test.ts` — הוסף ל-`describe('ארבע השורות של § 4.2ז, בסדרן', …)` (ושנה את שמו ל-`'חמש השורות של § 4.2ז, בסדרן'`):

```ts
  it('שורה 5 — רשימת «לא ידעתי», אחרי בלוק «דרכים לתרגל»', () => {
    expect(CODE).toContain('UnknownList');
    expect(CODE.indexOf('דרכים לתרגל')).toBeLessThan(CODE.indexOf('UnknownList'));
  });
```

- [ ] **Step 5: עדכן את רשומת ההרנס**

⚠️ `<UnknownList>` מוצג **רק** ב-`state.kind === 'ready'`, והפיקסטורה `/dev/tabs/cards` נוחתת ב-`failed` (אין env) ⇒ **⛔ אין בקשה חדשה, ולכן ⛔ אין רשומה חדשה ב-`EXPECTED_CONSOLE`.** ⛔ אל תוסיף אחת "ליתר ביטחון" — רשומה מיותרת שם מלבינה בקשה שאיש אינו מבצע, וזו בדיוק מחלקת F-088.

⚠️ **הפער המוצהר שנובע מכך:** הרשימה עצמה ⛔ אינה נמדדת ב-`check:mobile`. **דווח זאת במפורש בסיום הטיק.** ⛔ אל תמציא לה פיקסטורה — היא תוסיף מסלול מת שאיש אינו מפנה אליו, וזה בדיוק F-064.

- [ ] **Step 6: הרץ את האימות המלא**

```bash
npm run typecheck && npm run check:core && npm test && npm run build
```

Expected: ארבעתן עוברות. **רשום את שני המספרים של `npm test`.**

- [ ] **Step 7: מוטציה**

הוסף `const sorted = [...cards].sort();` בגוף הרכיב, הרץ `npx vitest run components/UnknownList.test.ts`, **רשום את המספר**, והסר.
Expected: «⛔ אינה ממיינת מחדש בלקוח» נופלת.

- [ ] **Step 8: קומיט**

```bash
git add components/UnknownList.tsx components/UnknownList.test.ts components/LevelMapScreen.tsx components/LevelMapScreen.test.ts
git commit -m "loop(DEV): T-083 «לא ידעתי» list — row 5, existing endpoint, no second definition"
```

---

## Task 5 — T-102: `levels[]` בסיכום — תוספת בלבד

**Files:**
- Modify: `lib/core/levelSummary.ts` (**תוספת בלבד** — `summarizeAllLevels` לצד `summarizeLevel`)
- Modify: `lib/core/levelSummary.test.ts` (**תוספת בלבד**)
- Modify: `app/api/levels/summary/route.ts`
- Modify: `docs/api-contract.md` (סעיף `## GET /api/levels/summary`)

**Interfaces:**
- Consumes: `ProgressFacts` · `LevelSummary` · `classifyProgress` · `BAND_ORDER` · `CefrBand` — כולם קיימים.
- Produces:
  - `interface BandedProgressFacts extends ProgressFacts { readonly band: CefrBand | null }`
  - `function summarizeAllLevels(input: { readonly totals: Readonly<Record<CefrBand, number>>; readonly rows: readonly BandedProgressFacts[] }): readonly LevelSummary[]` — **בדיוק שש רשומות, בסדר `BAND_ORDER`.**
  - התשובה של `GET /api/levels/summary` מקבלת שדה `levels: LevelSummary[]` **רק** בענף שבו נבחרה רמה.

Task 6 קורא ל-`summarizeAllLevels` דרך התשובה בלבד.

⛔ **`level` · `totalInLevel` · `known` · `inReviewList` · `unseen` · `{ok:true,level:null}` — ⛔ אף אחד מהם אינו משתנה.** T-080/T-081 יושבות בתור הסקירה ואסור לפתוח אותן.

- [ ] **Step 1: הוסף את הבדיקות בסוף `lib/core/levelSummary.test.ts`**

```ts
describe('T-102 — שש רשומות, בסדר, וסכום שלוש הספירות בכל אחת הוא הסך', () => {
  const EMPTY_TOTALS = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 } as const;

  it('מחזיר בדיוק שש רשומות בסדר A1…C2, גם על מאגר ריק לגמרי', () => {
    const levels = summarizeAllLevels({ totals: EMPTY_TOTALS, rows: [] });
    expect(levels.map((l) => l.level)).toEqual(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
  });

  it('רמה בלי מילים במאגר היא 0 בכל השדות, ⛔ ולא נעדרת מהמערך (C1/C2 היום)', () => {
    const levels = summarizeAllLevels({ totals: EMPTY_TOTALS, rows: [] });
    const c2 = levels.find((l) => l.level === 'C2');
    expect(c2).toEqual({ level: 'C2', totalInLevel: 0, known: 0, inReviewList: 0, unseen: 0 });
  });

  it('שורה מקובצת לרמה שלה ⛔ ולא לרמה הנוכחית', () => {
    const levels = summarizeAllLevels({
      totals: { ...EMPTY_TOTALS, A1: 5, B1: 3 },
      rows: [
        { band: 'A1', attempts: 0, repetition: 0, selfMarkedKnown: true },
        { band: 'B1', attempts: 2, repetition: 0, selfMarkedKnown: false },
      ],
    });
    expect(levels.find((l) => l.level === 'A1')).toMatchObject({ known: 1, inReviewList: 0, unseen: 4 });
    expect(levels.find((l) => l.level === 'B1')).toMatchObject({ known: 0, inReviewList: 1, unseen: 2 });
  });

  it('⛔ שורה עם band = null ⛔ אינה מנוחשת לרמה — היא מושמטת מכל שש הספירות', () => {
    const levels = summarizeAllLevels({
      totals: { ...EMPTY_TOTALS, A1: 2 },
      rows: [{ band: null, attempts: 3, repetition: 0, selfMarkedKnown: false }],
    });
    expect(levels.find((l) => l.level === 'A1')).toMatchObject({ known: 0, inReviewList: 0, unseen: 2 });
  });

  it('⛔ הספירה הכפולה נתפסת גם כאן: אותה מילה גם סומנה וגם נוסתה נספרת פעם אחת', () => {
    const levels = summarizeAllLevels({
      totals: { ...EMPTY_TOTALS, A1: 1 },
      rows: [{ band: 'A1', attempts: 4, repetition: 0, selfMarkedKnown: true }],
    });
    const a1 = levels.find((l) => l.level === 'A1');
    expect(a1).toMatchObject({ known: 1, inReviewList: 0, unseen: 0 });
    expect((a1?.known ?? 0) + (a1?.inReviewList ?? 0) + (a1?.unseen ?? 0)).toBe(a1?.totalInLevel);
  });

  it('סכום שלוש הספירות = הסך, בכל אחת משש הרמות', () => {
    const levels = summarizeAllLevels({
      totals: { A1: 10, A2: 7, B1: 4, B2: 2, C1: 0, C2: 0 },
      rows: [
        { band: 'A1', attempts: 1, repetition: 2, selfMarkedKnown: false },
        { band: 'A1', attempts: 1, repetition: 0, selfMarkedKnown: false },
        { band: 'A2', attempts: 0, repetition: 0, selfMarkedKnown: true },
      ],
    });
    for (const level of levels) {
      expect(level.known + level.inReviewList + level.unseen).toBe(level.totalInLevel);
    }
  });

  it('ספירה בלתי-אפשרית זורקת ⛔ ואינה מחזירה מספר שלילי', () => {
    expect(() =>
      summarizeAllLevels({
        totals: { ...EMPTY_TOTALS, A1: 0 },
        rows: [{ band: 'A1', attempts: 0, repetition: 1, selfMarkedKnown: false }],
      }),
    ).toThrow(RangeError);
  });
});
```

הוסף `summarizeAllLevels` לשורת הייבוא בראש אותו קובץ.

- [ ] **Step 2: הרץ וּודא כישלון**

```bash
npx vitest run lib/core/levelSummary.test.ts
```

Expected: כישלון בהעמסה — `summarizeAllLevels is not exported` / `does not provide an export named`.

- [ ] **Step 3: הוסף את הפונקציה בסוף `lib/core/levelSummary.ts`**

```ts
/**
 * שורת התקדמות עם הרמה של המילה שלה. T-102.
 *
 * ‏`band: null` הוא מילה ש-`cefr_profile_band` שלה NULL או ערך לא מוכר — היא ⛔ אינה
 * מנוחשת לרמה (D-034) ולכן ⛔ אינה נספרת באף אחת מהשש. אותה הכרעה בדיוק שבה `bandRank`
 * ב-`lib/core/deck.ts` שולח מילה כזאת לסוף התור במקום לרמה מומצאת.
 */
export interface BandedProgressFacts extends ProgressFacts {
  readonly band: CefrBand | null;
}

/**
 * שש הרמות בבת אחת — הקלט של טבעות המילוי ב-T-084.
 *
 * ⛔ **תוספת, ⛔ ולא החלפה.** `summarizeLevel` נשארת בדיוק כפי שהיא, ושתיהן חולקות את
 * `classifyProgress` — שהיא **ההגדרה היחידה** של «ידוע / ברשימת החזרה / טרם נראה».
 * ⛔ סיווג שני כאן היה בדיוק מה ש-§ 4.2ז אוסר.
 *
 * ⛔ **תמיד שש רשומות, בסדר `BAND_ORDER`.** רמה בלי מילים במאגר (C1/C2 היום) חוזרת
 * כאפסים ⛔ ואינה נעדרת: המסך מציג אותה מושבתת **עם המספר 0**, ⛔ ולא מסתיר אותה
 * (§ 4.2ז שורה 6). מערך באורך משתנה היה מסך שמשנה את מספר השבבים שלו כשהמאגר גדל,
 * ולומד לא היה יכול לדעת אם המוצר השתנה או הוא.
 */
export function summarizeAllLevels(input: {
  readonly totals: Readonly<Record<CefrBand, number>>;
  readonly rows: readonly BandedProgressFacts[];
}): readonly LevelSummary[] {
  const grouped = new Map<CefrBand, ProgressFacts[]>();
  for (const band of BAND_ORDER) grouped.set(band, []);
  for (const row of input.rows) {
    if (row.band === null) continue;
    grouped.get(row.band)?.push(row);
  }
  return BAND_ORDER.map((band) =>
    summarizeLevel({ level: band, totalInLevel: input.totals[band] ?? 0, rows: grouped.get(band) ?? [] }),
  );
}
```

- [ ] **Step 4: הרץ את הבדיקות ואת שומר הטוהר**

```bash
npx vitest run lib/core/levelSummary.test.ts && npm run check:core
```

Expected: הכל ירוק · `/lib/core purity: OK`.

- [ ] **Step 5: הרחב את הנתיב — תוספת בלבד**

ב-`app/api/levels/summary/route.ts`:

1. הרחב את הייבוא:

```ts
import {
  parseLevel,
  summarizeAllLevels,
  summarizeLevel,
  type BandedProgressFacts,
  type ProgressFacts,
} from '@/lib/core/levelSummary';
import { BAND_ORDER, type CefrBand } from '@/lib/core/cefrLevels';
```

2. **הסר את מסנן הרמה משליפת ההתקדמות** — הוא הופך לשליפה אחת על כל הרמות. החלף את הבלוק

```ts
  const { data, error } = await supabase
    .from('word_progress')
    .select(PROGRESS_SELECT)
    .eq('user_id', user.id)
    .eq('words.cefr_profile_band', level)
    .limit(MAX_PROGRESS_ROWS);
```

ב:

```ts
  // ⚠️ **T-102: שליפה אחת בלי מסנן רמה, ⛔ ולא שש שליפות.** שש קריאות היו שש נסיעות
  // רשת על אותה טבלה, והקיבוץ ממילא נעשה בשכבה הטהורה. התקרה נבדקת מול הסך הכולל
  // מיד אחרי כן — שליפה שנחתכה היא ספירה שגויה בכל שש הרמות, ⛔ ולא בְּאחת.
  const { data, error } = await supabase
    .from('word_progress')
    .select(PROGRESS_SELECT)
    .eq('user_id', user.id)
    .limit(MAX_PROGRESS_ROWS);
```

3. עדכן את הטיפוס המקומי כך שיישא את הרמה:

```ts
type ProgressJoinRow = {
  attempts: number | null;
  repetition: number | null;
  self_marked_known: boolean | null;
  words: { cefr_profile_band: string | null } | { cefr_profile_band: string | null }[] | null;
};

/** PostgREST מחזיר embed של many-to-one כאובייקט במסלול אחד וכמערך בן-איבר במסלול אחר. */
function bandOf(row: ProgressJoinRow): CefrBand | null {
  const words = Array.isArray(row.words) ? (row.words[0] ?? null) : row.words;
  const raw = words?.cefr_profile_band ?? null;
  return parseLevel(raw);
}
```

4. החלף את בניית `rows` והסיכום (מ-`const rows: ProgressFacts[] = raw.map(...)` ועד סוף הפונקציה) ב:

```ts
  const banded: BandedProgressFacts[] = raw.map((row) => ({
    attempts: row.attempts ?? 0,
    repetition: row.repetition ?? 0,
    selfMarkedKnown: row.self_marked_known === true,
    band: bandOf(row),
  }));

  // שש ספירות `head: true` — עלות אחת לכל רמה, ⛔ ואפס שורות על החוט. ⛔ הן ⛔ אינן
  // סופרות התקדמות: הן סופרות **מילים ברמה**, וזה בדיוק מה שהשכבה הטהורה אינה יכולה
  // לדעת. מקבילות, כי אף אחת מהן ⛔ אינה תלויה בשנייה.
  const counted = await Promise.all(
    BAND_ORDER.map((band) =>
      supabase.from('words').select('id', { count: 'exact', head: true }).eq('cefr_profile_band', band),
    ),
  );
  const failedCount = counted.find((result) => result.error);
  if (failedCount?.error) {
    console.error('[api/levels/summary] level sizes read failed:', failedCount.error.message);
    return isSchemaMissing((failedCount.error as { code?: string }).code) ? schemaMissing() : unavailable();
  }

  const totals = Object.fromEntries(
    BAND_ORDER.map((band, i) => [band, counted[i]?.count ?? 0]),
  ) as Record<CefrBand, number>;

  try {
    // ⛔ הנתיב אינו סופר: הוא מוסר שורות ומקבל סיכומים. ההגדרה חיה במקום אחד.
    const levels = summarizeAllLevels({ totals, rows: banded });
    const rows: ProgressFacts[] = banded.filter((row) => row.band === level);
    const summary = summarizeLevel({ level, totalInLevel: totals[level] ?? 0, rows });
    // ⛔ **תוספת בלבד:** חמשת השדות הקיימים יוצאים בדיוק כפי שיצאו קודם.
    return NextResponse.json({ ok: true, ...summary, levels });
  } catch (rangeError) {
    console.error('[api/levels/summary] impossible counts:', (rangeError as Error).message);
    return unavailable();
  }
```

5. ⚠️ **מחק את השאילתה הישנה של גודל הרמה היחידה** (בלוק `const { count, error: totalError } = ...` וטיפול השגיאה שלו) — `totals[level]` מחליף אותה בדיוק. השארתה הייתה קריאה שישית מיותרת **ומקור אמת שני** לאותו מספר.

- [ ] **Step 6: הרץ typecheck ובדיקות**

```bash
npm run typecheck && npx vitest run lib/core/levelSummary.test.ts app/api/levels
```

Expected: `typecheck` יוצא 0 · הבדיקות עוברות.
⚠️ **אם `app/api/levels/summary/route.test.ts` נכשל** — קרא את מה שהוא טוען לפני שאתה משנה אותו. שומר קיים שנשבר הוא **מדידה**, ⛔ לא מכשול; החלשתו כדי להתאים לתוכנית הזאת היא בדיוק מה ש-F-064 נפתחה נגדו. אם הטענה עדיין נכונה — תקן את הקוד. אם היא התיישנה בגלל T-102 — **עדכן אותה עם הערה מנומקת בקובץ, ⛔ לא בשקט.**

- [ ] **Step 7: עדכן את `docs/api-contract.md` באותו קומיט**

בסעיף `## GET /api/levels/summary`, החלף את בלוק ה-JSON של «200 — רמה נבחרה» ב:

````markdown
```json
{
  "ok": true,
  "level": "A1",
  "totalInLevel": 315,
  "known": 189,
  "inReviewList": 18,
  "unseen": 108,
  "levels": [
    { "level": "A1", "totalInLevel": 315, "known": 189, "inReviewList": 18, "unseen": 108 },
    { "level": "A2", "totalInLevel": 80, "known": 0, "inReviewList": 0, "unseen": 80 },
    { "level": "B1", "totalInLevel": 20, "known": 0, "inReviewList": 0, "unseen": 20 },
    { "level": "B2", "totalInLevel": 2, "known": 0, "inReviewList": 0, "unseen": 2 },
    { "level": "C1", "totalInLevel": 0, "known": 0, "inReviewList": 0, "unseen": 0 },
    { "level": "C2", "totalInLevel": 0, "known": 0, "inReviewList": 0, "unseen": 0 }
  ]
}
```

⚠️ **`levels` הוא תוספת של T-102, ⛔ ואינו משנה ולו שדה קיים אחד.** חמשת השדות שמעליו
נשארים בדיוק כפי שהיו, ותשובת «טרם בחר רמה» (`{ "ok": true, "level": null }`) ⛔ אינה
נושאת אותו כלל — במצב הזה המסך מציג ממילא את שישה כפתורי הבחירה של T-081.

⚠️ **תמיד בדיוק שש רשומות, בסדר `A1…C2`.** רמה בלי מילים במאגר (C1/C2 היום) חוזרת
כאפסים ⛔ ואינה נעדרת: § 4.2ז שורה 6 מחייבת שבב **מושבת עם המספר 0**, ⛔ לא מוסתר.
מערך באורך משתנה היה מסך שמשנה את מספר השבבים שלו כשהמאגר גדל.

⚠️ **הספירות ב-`levels` נגזרות מאותה `classifyProgress`** שגוזרת את חמשת השדות שמעליה
(`lib/core/levelSummary.ts`) — ⛔ אין סיווג שני. שורה שהרמה שלה NULL או לא מוכרת ⛔ אינה
מנוחשת לרמה ו⛔ אינה נספרת באף אחת מהשש (D-034), ולכן ⛔ ייתכן שסכום ה-`known` של שש
הרמות קטן ממספר שורות ההתקדמות של הלומד. זו מדידה, ⛔ לא אי-התאמה.
````

- [ ] **Step 8: מוטציה שמוכיחה שהשומר על שש הרשומות חי**

ב-`summarizeAllLevels`, החלף את `BAND_ORDER.map(...)` ב-`BAND_ORDER.filter((b) => (input.totals[b] ?? 0) > 0).map(...)`, הרץ, **רשום את המספר**, והחזר.
Expected: «מחזיר בדיוק שש רשומות» ו«רמה בלי מילים במאגר היא 0 בכל השדות» נופלות.

- [ ] **Step 9: אימות מלא + קומיט**

```bash
npm run typecheck && npm run check:core && npm test && npm run build
git add lib/core/levelSummary.ts lib/core/levelSummary.test.ts app/api/levels/summary/route.ts docs/api-contract.md
git commit -m "loop(DEV): T-102 levels[] in the summary — additive, six rows always"
```

---

## Task 6 — T-084: שורה 6 — מפת שש הרמות

**Files:**
- Create: `lib/core/levelPath.ts`
- Test: `lib/core/levelPath.test.ts`
- Create: `components/LevelPath.tsx`
- Test: `components/LevelPath.test.ts`
- Modify: `components/LevelMapScreen.tsx` (**תוספת בלבד** — שורה 6, ומעביר `levels` כפרופ)
- Modify: `components/LevelMapScreen.test.ts` (**תוספת בלבד**)

**Interfaces:**
- Consumes: השדה `levels[]` מ-Task 5 · `POST /api/levels/current` (קיים, ⛔ ללא שינוי) · `LevelSummary` · `BAND_ORDER` · `LEVEL_LABELS_HE`.
- Produces:
  - `interface LevelChip { readonly band: CefrBand; readonly known: number; readonly totalInLevel: number; readonly isCurrent: boolean; readonly isEmpty: boolean; readonly percent: number }`
  - `function buildLevelPath(levels: readonly LevelSummary[], current: CefrBand | null): readonly LevelChip[]` — תמיד שישה, בסדר `BAND_ORDER`.
  - `export default function LevelPath(props: { readonly levels: readonly LevelSummary[]; readonly current: CefrBand | null; readonly onChoose: (band: CefrBand) => void; readonly busy: boolean }): React.JSX.Element`

⚠️ **סקיל חובה לפני שורת קוד: `dataviz`** (העמודה ב-`50-tasks.md`, ו-§ 4.2ז שאלה 5). **הפעל אותו והרץ את `scripts/validate_palette.js` שלו בבהיר ובכהה.** ⚠️ הפעם **יש** ערוץ צבע — טבעת המילוי — ולכן ⛔ **אין** ליפול לתקדים C-0176 (שהחליף אותו ב-`palette.test.ts` כי לא היה שם צבע). אם הסקריפט של הסקיל אינו רץ בסביבה הזאת, **דווח זאת במפורש כפער** והרץ **בנוסף** `npx vitest run lib/core/palette.test.ts`. ⛔ אל תמציא אסימון צבע חדש כדי «שיהיה מה לאמת» — הטבעת משתמשת ב-`--brand` ו-`--border-subtle` הקיימים.

- [ ] **Step 1: כתוב את בדיקות השכבה הטהורה**

צור `lib/core/levelPath.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildLevelPath } from './levelPath';
import type { LevelSummary } from './levelSummary';
import type { CefrBand } from './cefrLevels';

function summary(level: CefrBand, totalInLevel: number, known: number): LevelSummary {
  return { level, totalInLevel, known, inReviewList: 0, unseen: totalInLevel - known };
}

const SIX: LevelSummary[] = [
  summary('A1', 315, 189),
  summary('A2', 80, 8),
  summary('B1', 20, 0),
  summary('B2', 2, 1),
  summary('C1', 0, 0),
  summary('C2', 0, 0),
];

describe('שישה שבבים, תמיד, בסדר', () => {
  it('בדיוק שישה בסדר A1…C2', () => {
    expect(buildLevelPath(SIX, 'A1').map((c) => c.band)).toEqual(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
  });

  it('רשימה חסרה ⛔ אינה מקצרת את המסלול — רמה שלא נמסרה היא אפסים', () => {
    const path = buildLevelPath([summary('A1', 10, 5)], 'A1');
    expect(path).toHaveLength(6);
    expect(path.find((c) => c.band === 'C2')).toMatchObject({ totalInLevel: 0, known: 0, percent: 0 });
  });

  it('רשימה ריקה לגמרי ⇒ שישה שבבים ריקים, ⛔ ולא זריקה', () => {
    expect(buildLevelPath([], null)).toHaveLength(6);
  });
});

describe('R-017 — אחוז המילוי הוא ספירה, ⛔ ולא מוכנות', () => {
  it('189 מתוך 315 ⇒ 60', () => {
    expect(buildLevelPath(SIX, 'A1').find((c) => c.band === 'A1')?.percent).toBe(60);
  });

  it('אחוז הוא מספר שלם ⛔ ולא שבר שיגלוש למסך', () => {
    for (const chip of buildLevelPath(SIX, 'A1')) {
      expect(Number.isInteger(chip.percent)).toBe(true);
    }
  });

  it('רמה בלי מילים במאגר ⇒ אחוז 0 ⛔ ולא NaN (חלוקה באפס)', () => {
    const c1 = buildLevelPath(SIX, 'A1').find((c) => c.band === 'C1');
    expect(c1?.percent).toBe(0);
    expect(c1?.isEmpty).toBe(true);
  });

  it('האחוז חסום ל-0..100 גם על קלט בלתי אפשרי', () => {
    const path = buildLevelPath([summary('A1', 4, 9)], 'A1');
    expect(path.find((c) => c.band === 'A1')?.percent).toBe(100);
  });
});

describe('D-037 — הנוכחית מסומנת, ⛔ ואף אחת אינה נעולה', () => {
  it('רק הנוכחית נושאת isCurrent', () => {
    const path = buildLevelPath(SIX, 'B1');
    expect(path.filter((c) => c.isCurrent).map((c) => c.band)).toEqual(['B1']);
  });

  it('current = null ⇒ אף שבב אינו נוכחי, ⛔ ואין נפילה שקטה ל-A1', () => {
    expect(buildLevelPath(SIX, null).some((c) => c.isCurrent)).toBe(false);
  });

  it('⛔ אין ולו שדה אחד ששמו נעילה, סף או מוכנות', () => {
    const keys = Object.keys(buildLevelPath(SIX, 'A1')[0] ?? {});
    expect(keys).toEqual(['band', 'known', 'totalInLevel', 'isCurrent', 'isEmpty', 'percent']);
  });
});
```

- [ ] **Step 2: הרץ וּודא כישלון**

```bash
npx vitest run lib/core/levelPath.test.ts
```

Expected: `Failed to resolve import "./levelPath"`.

- [ ] **Step 3: כתוב את המודול הטהור**

צור `lib/core/levelPath.ts`:

```ts
/**
 * מפת שש הרמות — שורה 6 של § 4.2ז (T-084). טהור: אפס React, DOM, רשת ו-env.
 *
 * ⛔ **מה שאין כאן, ומה שלעולם לא ייכנס:** ⛔ אין שדה «נעול», ⛔ אין סף, ⛔ אין
 * «מוכנות» ו⛔ אין רצף. D-037 קובע שהמעבר בין רמות הוא פעולה של הלומד מפני ש**אין ולו
 * סף אמפירי אחד בספרות** — Webb/Sasao/Ballance 2017 כותבים על נקודת החיתוך
 * *"appears to have been arbitrary"*. כל מספר שהיינו מציגים כמוכנות היה טענה פדגוגית
 * בלי מקור, כלומר R-017 בדיוק.
 *
 * `percent` הוא **ספירה**: כמה מילים ברמה סימן הלומד כידועות, מתוך כמה יש בה. ⛔ הוא
 * ⛔ אינו רשאי להיקרא «שליטה», ⛔ אינו פותח דבר, ו⛔ אינו חוסם דבר.
 */
import { BAND_ORDER, type CefrBand } from './cefrLevels';
import type { LevelSummary } from './levelSummary';

export interface LevelChip {
  readonly band: CefrBand;
  readonly known: number;
  readonly totalInLevel: number;
  readonly isCurrent: boolean;
  /** רמה שאין בה מילים במאגר (C1/C2 היום). המסך מציג אותה **מושבתת עם המספר 0**,
   *  ⛔ ולא מסתיר אותה — § 4.2ז שורה 6, ואותו כלל של «חפיסה ריקה» ב-§ 4.2ו. */
  readonly isEmpty: boolean;
  /** 0..100, שלם. ⛔ לא שבר: טבעת ומספר על מסך של 375px אינם מקום לנקודה עשרונית. */
  readonly percent: number;
}

function percentOf(known: number, total: number): number {
  // ⛔ חלוקה באפס אינה 0 — היא NaN, ו-NaN על המסך נראה כמו באג תצוגה. רמה בלי מילים
  // היא 0 באופן מוצהר.
  if (!Number.isFinite(total) || total <= 0) return 0;
  const raw = Math.round((known / total) * 100);
  return Math.min(100, Math.max(0, raw));
}

/**
 * ⛔ **תמיד שישה, בסדר.** רמה שלא הופיעה ברשימה שהשרת מסר חוזרת כאפסים ⛔ ואינה
 * נעדרת: מסלול שמשנה את מספר השבבים שלו כשהמאגר גדל משאיר את הלומד בלי דרך לדעת
 * אם המוצר השתנה או הוא.
 */
export function buildLevelPath(
  levels: readonly LevelSummary[],
  current: CefrBand | null,
): readonly LevelChip[] {
  const byBand = new Map<CefrBand, LevelSummary>();
  for (const level of levels) byBand.set(level.level, level);

  return BAND_ORDER.map((band) => {
    const level = byBand.get(band);
    const totalInLevel = level?.totalInLevel ?? 0;
    const known = level?.known ?? 0;
    return {
      band,
      known,
      totalInLevel,
      isCurrent: current === band,
      isEmpty: totalInLevel === 0,
      percent: percentOf(known, totalInLevel),
    };
  });
}
```

- [ ] **Step 4: הרץ + שומר טוהר**

```bash
npx vitest run lib/core/levelPath.test.ts && npm run check:core
```

Expected: ירוק · `OK`.

- [ ] **Step 5: כתוב את בדיקת המקור של הרכיב**

צור `components/LevelPath.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/** `<LevelPath>` — שורה 6 של § 4.2ז (T-084). שומר מקור. */
const SRC = readFileSync('components/LevelPath.tsx', 'utf8');
const SCREEN = readFileSync('components/LevelMapScreen.tsx', 'utf8');

function withoutComments(source: string): string {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}

const CODE = withoutComments(SRC);

describe('חוקה § 1 — צבע לעולם אינו הערוץ היחיד', () => {
  it('לכל שבב תווית מספרית לצד הטבעת', () => {
    expect(CODE).toContain('{chip.known}');
    expect(CODE).toContain('{chip.totalInLevel}');
  });

  it('לכל שבב גם תווית עברית ⛔ ולא אות בלבד', () => {
    expect(CODE).toContain('LEVEL_LABELS_HE');
  });

  it('הרמה הנוכחית מסומנת גם בטקסט ⛔ ולא רק במסגרת', () => {
    expect(CODE).toContain('aria-current');
    expect(CODE).toContain('הרמה שלך');
  });

  it('האחוז מגיע מהשכבה הטהורה ⛔ ואינו מחושב כאן', () => {
    expect(CODE).toContain('chip.percent');
    expect(CODE).not.toMatch(/\/\s*totalInLevel/);
  });
});

describe('D-037 · R-017 — ⛔ אין נעילה ואין סף', () => {
  it.each(['נעול', 'LockIcon', 'שולט', 'עדיין לא', 'מוכן', 'ניקוד', 'רצף', 'אחוז שליטה'])(
    '⛔ «%s» אינו מופיע',
    (needle) => {
      expect(CODE).not.toContain(needle);
    },
  );

  it('כל שבב שיש בו מילים ניתן להקשה — הכתיבה היא הנתיב הקיים', () => {
    expect(CODE).toContain('onChoose(');
    expect(CODE).not.toContain('/api/levels/current');
  });

  it('רמה ריקה מושבתת עם המספר ⛔ ולא מוסתרת', () => {
    expect(CODE).toContain('chip.isEmpty');
    expect(CODE).toContain('aria-disabled');
    expect(CODE).not.toMatch(/isEmpty\s*\?\s*null/);
  });
});

describe('חוקת העיצוב', () => {
  it('⛔ אין hex גולמי — אסימונים בלבד (חוקה § 6)', () => {
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it('הטבעת היא SVG ⛔ ולא אמוג\'י ולא תמונה (חוקה § 6)', () => {
    expect(CODE).toContain('<svg');
    expect(CODE).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  });

  it('הטבעת נצבעת דרך currentColor ⛔ ולא דרך ערך צבע בקובץ', () => {
    expect(CODE).toContain('currentColor');
  });

  it('⛔ אין מרכוז אנכי על מכולה ראשית ואין h-screen', () => {
    expect(CODE).not.toContain('justify-center');
    expect(CODE).not.toContain('h-screen');
  });

  it('כל שבב הוא יעד מגע ≥44px', () => {
    expect(CODE).toContain('min-h-touch');
  });

  it('⛔ אין גישה ישירה לדאטהבייס', () => {
    expect(CODE).not.toContain('supabase');
    expect(CODE).not.toMatch(/\bfetch\(/);
  });
});

describe('הרכיב הוא שורה 6 של המסך, ⛔ ואינו יתום', () => {
  it('‏<LevelMapScreen> מרנדר אותו אחרי שורה 5', () => {
    expect(SCREEN).toContain('LevelPath');
    expect(SCREEN.indexOf('UnknownList')).toBeLessThan(SCREEN.indexOf('<LevelPath'));
  });

  it('המסך מוסר לו את levels מהשרת ⛔ ואינו בונה אותם בעצמו', () => {
    expect(SCREEN).toContain('levels={');
  });
});
```

- [ ] **Step 6: כתוב את הרכיב**

צור `components/LevelPath.tsx`:

```tsx
'use client';

import EnWord from '@/components/EnWord';
import type { CefrBand } from '@/lib/core/cefrLevels';
import { buildLevelPath } from '@/lib/core/levelPath';
import { LEVEL_LABELS_HE, type LevelSummary } from '@/lib/core/levelSummary';

/**
 * שורה 6 של § 4.2ז — מפת שש הרמות (T-084 · D-037 · R-017).
 *
 * ⛔ **משחוק בלי רצפים ובלי שערים.** כל שישה השבבים ניתנים להקשה תמיד: אין סף שליטה
 * אמפירי (D-037), ולכן ⛔ אין «רמה נעולה», ⛔ אין «עדיין לא שלטת» ו⛔ אין אחוז שנקרא
 * כמוכנות. השבב היחיד שאינו ניתן להקשה הוא רמה **שאין בה מילים במאגר**, והוא מוצג
 * **מושבת עם המספר 0** ⛔ ולא מוסתר.
 *
 * ⛔ **צבע אינו הערוץ היחיד** (חוקה § 1): לצד כל טבעת יש המספר `known/total`, תווית
 * עברית, ו-`aria-current` על הנוכחית. לומד דויטרנופי רואה בדיוק את אותו מידע.
 *
 * ⛔ **הרכיב אינו כותב לשרת.** ההקשה קוראת ל-`onChoose`, והמסך שמעליו הוא שמדבר עם
 * `POST /api/levels/current` — אותו נתיב שמצב הבחירה של T-081 כבר משתמש בו, בלי
 * שינוי. שני כותבים לאותה עמודה הם שני מקורות אמת.
 */

const HEADING_HE = 'שש הרמות';
const CURRENT_HE = 'הרמה שלך';
const EMPTY_HE = 'עדיין אין מילים ברמה הזאת';

/** גיאומטריית הטבעת. r=20 ⇒ היקף 2πr ≈ 125.66, וזה כל מה שהיא צריכה לדעת. */
const RING_RADIUS = 20;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function LevelPath({
  levels,
  current,
  onChoose,
  busy,
}: {
  readonly levels: readonly LevelSummary[];
  readonly current: CefrBand | null;
  readonly onChoose: (band: CefrBand) => void;
  readonly busy: boolean;
}): React.JSX.Element {
  const chips = buildLevelPath(levels, current);

  return (
    <section className="flex flex-col gap-3" data-level-path>
      <h2 className="text-xl font-semibold">{HEADING_HE}</h2>
      {/* שלוש בשורה ב-375: שבב של 44px+ עם טבעת ומספר ⛔ אינו נכנס שש בשורה
          בלי לגלוש, ושתי שורות של שלושה הן המסלול שהמפרט מתאר. */}
      <ul className="grid list-none grid-cols-3 gap-3 p-0">
        {chips.map((chip) => {
          const label = `${chip.known}/${chip.totalInLevel}`;
          const body = (
            <>
              {/* הטבעת. `currentColor` בכוונה: הצבע מגיע מ-`text-brand`/`text-ink-muted`
                  שעל האלמנט, ⛔ ואין בקובץ הזה ולו ערך צבע אחד (חוקה § 6). */}
              <svg
                viewBox="0 0 48 48"
                aria-hidden="true"
                className={chip.isEmpty ? 'h-12 w-12 text-ink-muted' : 'h-12 w-12 text-brand'}
              >
                <circle
                  cx="24"
                  cy="24"
                  r={RING_RADIUS}
                  fill="none"
                  strokeWidth="4"
                  className="text-border-subtle"
                  stroke="currentColor"
                />
                <circle
                  cx="24"
                  cy="24"
                  r={RING_RADIUS}
                  fill="none"
                  strokeWidth="4"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeDasharray={`${(chip.percent / 100) * RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
                  transform="rotate(-90 24 24)"
                />
              </svg>
              <EnWord className="text-lg font-semibold">{chip.band}</EnWord>
              {/* ⛔ התווית המספרית לצד הטבעת — היא, ⛔ ולא הצבע, נושאת את המידע. */}
              <span className="text-sm text-ink-muted">{label}</span>
              <span className="text-xs text-ink-muted">
                {chip.isCurrent ? CURRENT_HE : LEVEL_LABELS_HE[chip.band]}
              </span>
            </>
          );

          return (
            <li key={chip.band}>
              {chip.isEmpty ? (
                // ⛔ מושבת **עם המספר**, ⛔ ולא מוסתר ו⛔ ולא «נעול»: הרמה קיימת,
                // המאגר עדיין ריק, וזו עובדה על המוצר ⛔ ולא שיפוט על הלומד.
                // ⛔ לא התכונה `disabled` — השבב נשאר במיקוד כדי שקורא מסך ימצא אותו.
                <button
                  type="button"
                  aria-disabled="true"
                  title={EMPTY_HE}
                  className="flex w-full min-h-touch flex-col items-center gap-1 rounded-lg border border-border-subtle px-2 py-3 text-ink-muted"
                >
                  {body}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onChoose(chip.band)}
                  disabled={busy}
                  aria-current={chip.isCurrent ? 'true' : undefined}
                  className={[
                    'flex w-full min-h-touch flex-col items-center gap-1 rounded-lg px-2 py-3 text-ink active:opacity-90',
                    chip.isCurrent ? 'border-2 border-border-strong' : 'border border-border-subtle',
                  ].join(' ')}
                >
                  {body}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
```

- [ ] **Step 7: חבר כשורה 6 ב-`<LevelMapScreen>`**

1. הוסף לייבוא:

```tsx
import LevelPath from '@/components/LevelPath';
```

2. הרחב את `SummaryResponse` כדי שיישא את השדה החדש (**תוספת בלבד**):

```tsx
type SummaryResponse =
  | ({ readonly ok: true; readonly levels?: readonly LevelSummary[] } & LevelSummary)
  | { readonly ok: true; readonly level: null }
  | { readonly ok: false; readonly code: string };
```

3. הרחב את `ScreenState` בענף `ready`:

```tsx
  | { readonly kind: 'ready'; readonly summary: LevelSummary; readonly levels: readonly LevelSummary[] }
```

4. ב-`load`, החלף `setState({ kind: 'ready', summary: body });` ב:

```tsx
      // ⛔ `?? []` ⛔ ואינו קריסה: שרת ישן (לפני T-102) אינו נושא את השדה, ומסלול
      // שנופל על `undefined.map` היה הופך תוספת תואמת-אחורה לשבירה.
      setState({ kind: 'ready', summary: body, levels: body.levels ?? [] });
```

5. הוסף **מיד אחרי** שורה 5 (`{state.kind === 'ready' ? <UnknownList /> : null}`):

```tsx
      {/* שורה 6 — מפת שש הרמות (T-084 · § 4.2ז). כולן ניתנות להקשה ומחליפות את
          `profiles.current_level` דרך **אותו** `choose` שמצב הבחירה משתמש בו —
          ⛔ ולא כותב שני לאותה עמודה. */}
      {state.kind === 'ready' ? (
        <LevelPath
          levels={state.levels}
          current={state.summary.level}
          onChoose={(band) => void choose(band)}
          busy={saving}
        />
      ) : null}
```

6. הוסף ל-`components/LevelMapScreen.test.ts`:

```ts
  it('שורה 6 — מפת שש הרמות, אחרי שורה 5', () => {
    expect(CODE).toContain('LevelPath');
    expect(CODE.indexOf('UnknownList')).toBeLessThan(CODE.indexOf('<LevelPath'));
  });

  it('שורה 6 משתמשת באותו choose ⛔ ולא בכותב שני', () => {
    expect(CODE).toContain('onChoose={(band) => void choose(band)}');
  });
```

- [ ] **Step 8: הרץ את הסקיל `dataviz` ואת האימות המלא**

```bash
npm run typecheck && npm run check:core && npm test && npm run build
npx vitest run lib/core/palette.test.ts
```

Expected: ארבע הפקודות ירוקות · 13 רצפות הניגודיות עוברות בשני המצבים.
**בנוסף:** הרץ את `scripts/validate_palette.js` של הסקיל בבהיר ובכהה. ⚠️ אם הוא אינו קיים בסביבה — **רשום זאת כפער מפורש בדיווח**, ⛔ אל תטען שהוא עבר.

- [ ] **Step 9: מדוד את הפריסה, ⛔ אל תטען אותה**

```bash
npm run build && (npm start &) && sleep 8 && npm run check:mobile ; kill %1
```

Expected: `/dev/tabs/cards` עובר. ⚠️ **הפיקסטורה נוחתת ב-`failed` ולכן ⛔ אינה מציירת את שורות 5–6** — זה פער מדידה אמיתי. **דווח עליו במפורש** יחד עם הפער של Task 4. ⛔ אל תמציא פיקסטורה חדשה — זו הכרעת PM (מסך `/dev` נוסף), ⛔ לא בחירה של Dev.

- [ ] **Step 10: שתי מוטציות**

1. ב-`buildLevelPath`, החלף `if (!Number.isFinite(total) || total <= 0) return 0;` ב-`// noop` — Expected: «רמה בלי מילים במאגר ⇒ אחוז 0 ⛔ ולא NaN» נופלת.
2. ב-`<LevelPath>`, החלף את הרינדור של השבב הריק ב-`chip.isEmpty ? null : (...)` — Expected: «רמה ריקה מושבתת עם המספר ⛔ ולא מוסתרת» נופלת.

**רשום את שני המספרים**, והחזר את שתי המוטציות.

- [ ] **Step 11: קומיט**

```bash
git add lib/core/levelPath.ts lib/core/levelPath.test.ts components/LevelPath.tsx components/LevelPath.test.ts components/LevelMapScreen.tsx components/LevelMapScreen.test.ts
git commit -m "loop(DEV): T-084 six-level path — ring plus number, no gate, no lock"
```

---

## Self-Review

**1 · כיסוי המפרט (§ 4.2ז + D-041).**

| דרישת המפרט | היכן |
|---|---|
| רשת 12 מילים · הקשה = «אני יודע» · «המשך» ⇒ 12 הבאות (D-041) | Tasks 1 · 3 (`SCAN_PAGE_SIZE` · `pageOf` · `toggle` · `advance`) |
| ⛔ אין ניקוד · אין טיימר · אין תשובה נכונה | Task 3, `describe('D-041 — הצהרה, ⛔ ולא מבחן')` — שמונה מילים אסורות + איסור `setTimeout`/`Date.now` |
| כותב `self_marked_known` + `self_marked_at` דרך `/api/levels/scan` ⛔ ולא דרך `/api/review` | Task 2 (`MARK`, `it.each` על 9 עמודות אסורות) · Task 3 (איסור `/api/review` במקור) |
| יעד מגע ≥44px לכל תא | Task 3 Step 1 (בדיקת מקור, עם lookbehind נגד מחלקת F-039) + Step 7 (`check:mobile`) |
| מסך סיום עובדתי «סימנת ש-N… נשארו M» ⛔ בלי «כל הכבוד» | Task 3 (`finish` קורא את `summary`, ⛔ ולא סופר) |
| שורה 5 — רשימה ⛔ ולא מונה, מיון band ואז `next_review_at`, «תרגל את הרשימה», ⛔ אין מחיקה ידנית | Task 4 |
| שורה 6 — שישה שבבים, הנוכחי מסומן, **כולם** ניתנים להקשה, טבעת + **תווית מספרית**, רמה ריקה מושבתת **עם 0** | Tasks 5 · 6 |
| ⛔ אין סף · אין נעילה · אין רצף (D-037 · R-017 · T-032) | רשימת מילים אסורה בכל אחת מארבע בדיקות המקור |
| מדד ⓐ — שלוש ספירות זרות, פיקסטורה שבה אותה מילה גם `self_marked_known` וגם `attempts>0` | Task 5 Step 1 («⛔ הספירה הכפולה נתפסת גם כאן») |
| מדד ⓑ — `self_marked_known` ⛔ אינו נוגע ב-SM-2 | Task 2 Step 1 + מוטציית Step 6 (**הבדיקה החשובה ביותר**) |
| מדד ⓒ — `check:mobile` ב-375 | Task 3 Step 7 · Task 6 Step 9 |
| מדד ⓓ — `validate_palette` בשני המצבים | Task 6 Step 8, עם הוראה מפורשת לדווח פער אם הסקריפט אינו קיים |

**פערים מוצהרים, ⛔ ולא מוסתרים:**
- ⓐ **הגנת D-038 («בדוק את עצמי» + נפילה שמחזירה `self_marked_known` ל-`false`) ⛔ אינה בתוכנית** — אין לה שורת משימה, ולכן ⛔ אין ל-Dev רשות להמציא לה מסך. **פריט ל-PM.** בלעדיה הסימון חד-כיווני, וזה הסיכון שה-D מצהיר עליו במפורש.
- ⓑ **שורות 5 ו-6 ⛔ אינן נמדדות ב-`check:mobile`** — הפיקסטורה `/dev/tabs/cards` נוחתת בענף הכשל (אין env), ושתיהן מוצגות רק ב-`ready`. פיקסטורה שלישית היא הכרעת PM. **פריט ל-PM.**
- ⓒ **מיון «לא ידעתי» הוא של הנתיב, ⛔ ולא של הרכיב** — כלומר T-083 מסתמכת על `sortQueue`. אם ה-PM ירצה מיון אחר לרשימה מזה של החפיסה, זו הכרעה חדשה ו⛔ לא שינוי ברכיב.

**2 · סריקת placeholder.** ⛔ אין «TODO» · ⛔ אין «טיפול בשגיאות מתאים» · ⛔ אין «בדיקות כמו במשימה N» — כל בלוק קוד ובדיקה כתוב במלואו. הקוד שחוזר בין משימות (טיפול בכשל ב-`<LevelScan>` מול `<LevelMapScreen>`) **שוכתב במלואו** ⛔ ולא הופנה, כי מבצע עשוי לקרוא משימה בודדת.

**3 · עקביות טיפוסים.**
- `ScanWord { wordId, headword }` — Task 1 מגדיר, Tasks 2–3 צורכים באותו שם בדיוק.
- `checkScanPayload` מחזיר `{ ok, wordIds }` (camelCase) והחוט הוא `word_ids` (snake_case) — ההמרה קורית בפונקציה עצמה, כמו `checkPracticePayload` ב-`deck.ts`.
- `BandedProgressFacts extends ProgressFacts` — Task 5 מגדיר ומשתמש; Task 6 צורך `LevelSummary` בלבד, ⛔ ולא אותו.
- `LevelChip` — Task 6 מגדיר; בדיקת `Object.keys` נועלת את שמות השדות **ואת סדרם**, כדי ששדה «נעילה» לא ייכנס מאוחר יותר בשקט.
- `buildLevelPath(levels, current)` — אותה חתימה בשלושת המקומות (המודול · הבדיקה · הרכיב).
- ‏`onChoose: (band: CefrBand) => void` ב-`<LevelPath>` נצרך ב-`<LevelMapScreen>` כ-`(band) => void choose(band)` — ו-`choose` שם מוגדר `async (level: CefrBand)`, כלומר התאמה מלאה.
