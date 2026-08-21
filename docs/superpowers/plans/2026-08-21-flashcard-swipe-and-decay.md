# החלקה אופקית בכרטיסייה + דעיכה חזותית — תוכנית מימוש

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** לסגור שלוש שורות משימה רצופות באותם שני קבצים — **T-127** (ההערה שמנמקת איסור שבוטל), **T-099** (החלקה אופקית כקיצור לשני הכפתורים) ו-**T-100** (דעיכה חזותית למילה שהגיע זמנה) — **⛔ בלי להחליש ולו בדיקה קיימת אחת**, וכשכל היגיון שאפשר לבודד יושב ב-`/lib/core` הטהור.

**Architecture:** שתי המחוות החדשות נשענות על אותה תבנית שכבר קיימת בריפו: **המתמטיקה טהורה, הרכיב רק מצייר.** `lib/core/swipeGrade.ts` מקבל ארבע קואורדינטות ורוחב מסך ומחזיר `CardGrade | null` — כל שלושת הסייגים של D-042 (אזור קצה · סף מרחק · זווית) הם תנאים בפונקציה טהורה עם בדיקות יחידה אמיתיות, ⛔ ולא תנאים מפוזרים בתוך מטפל אירועים שאי אפשר לבדוק בלי DOM. `lib/core/decay.ts` מקבל `nowMs` כארגומנט ומחזיר דרגת דעיכה — ⛔ אפס שעון בפנים, ⛔ אפס עמודה, ⛔ אפס מיגרציה (D-043). הרכיב `components/Flashcard.tsx` הוא הצרכן היחיד של שתיהן, וההיזון החזותי נעשה דרך **מחלקות ו-CSS גלובלי** בתקדים המדויק של בלוק `[data-arena-stage]` — ⛔ ולא דרך `style={{}}`, שאין לו ולו מופע אחד בכל `components/` ו-`app/` (נמדד).

**Tech Stack:** Next.js App Router · React 19 · TypeScript (⛔ ללא `any`) · Tailwind · vitest (סביבת node, ⛔ אין jsdom ⇒ בדיקות רכיב הן **שומר מקור**; מודולים טהורים מקבלים בדיקות יחידה אמיתיות) · Playwright דרך `scripts/verify-mobile.mjs`.

**Spec:**

- `plan/40-decisions.md` — **D-042** (`:1046`, ההחלקה כקיצור + שלושת הסייגים) · **D-043** (`:1069`, הדעיכה כפנים למנוע קיים) · D-033 · D-034
- `plan/50-tasks.md` — שורות **T-127** · **T-099** · **T-100**
- `plan/35-design-constitution.md` (§ 1 צבע · § 2 טיפוגרפיה · § 3 רדיוסים · § 4 מרווחים · § 6 איסורים)
- `plan/60-findings.md` — **F-102** · **F-103** (שניהם נפתחו בטיק התכנון הזה, ראה «ארבע העובדות» למטה)
- `docs/api-contract.md` § `GET /api/study/queue`

---

## Global Constraints

חלות על **כל** משימה בתוכנית. ערכים מדויקים, מועתקים מהמקור:

- **גופנים:** Heebo (כותרות) · Assistant (גוף) · Noto Sans Hebrew (גיבוי). ⛔ אסורים: Inter · Roboto · Open Sans · Geist · Comic Neue (חוקה § 2).
- **רדיוסים — שלושה בלבד:** `rounded-md` · `rounded-lg` · `rounded-2xl` (חוקה § 3, ונאכף ב-`scripts/radius-hygiene.test.ts` על כל `components/` ו-`app/`).
- **⛔ `justify-center` על מכולת עמוד ראשית — אסור.** עיגון למעלה (F-011 · F-016 · חוקה § 4).
- **⛔ אפס גלילה אופקית ב-320/375/414.** יעד מגע ≥ **44px** (חוקה § 4).
- **⛔ ערך hex גולמי ב-`components/`** — הכל דרך אסימוני `lib/core/palette.ts`. ⛔ אמוג׳י כאייקון. ⛔ גרדיאנט (חוקה § 6).
- **⛔ צבע לעולם אינו הערוץ היחיד** — לכל מצב יש גם תווית עברית (חוקה § 1 · D-043 אומרת את זה שוב במפורש).
- **⛔ `style={{}}` בקוד מוצר** — נמדד בטיק התכנון: `grep -rn "style={{" components/ app/` מחזיר **אפס שורות**. ההיזון החזותי והדעיכה נעשים במחלקות ובכללי CSS גלובליים, בתקדים `[data-arena-stage]` (`app/globals.css:114`).
- **כל מילה אנגלית בתוך טקסט עברי עוברת דרך `<EnWord>`/`<EnText>`** (חוקה § 2).
- **⛔ אסור להמציא תוכן לימודי** (R-010 · R-013) — הפיקסטורה נשארת Lorem/Ipsum/Dolor/Sit/Amet.
- **⛔ אסור להחליש בדיקה קיימת** כדי להעביר מסך. בדיקה שנופלת = ממצא, ⛔ לא הזדמנות לרכך תנאי. שתי בדיקות חיות **תיפולנה** בתוכנית הזאת והן **מכוונות מחדש ⛔ ולא מוחלשות** — ראה עובדה ג׳.
- **⛔ `/lib/core` טהור** — אפס React/window/document/localStorage/fetch/process.env, **ואפס שעון**: `decayLevel` מקבל `nowMs` כארגומנט.
- **פקודת האימות המלאה, בכל משימה:** `npm run typecheck && npm run check:core && npm test && npm run build`, ובכל משימה שנוגעת בפיקסטורה/בארנס גם `npm run check:mobile`.

---

## ארבע עובדות שנמדדו בטיק התכנון — ⛔ אף אחת מהן לא הונחה

### א׳ · הכיוון והכפתור סותרים זה את זה ב-RTL — **F-102 🟡**

`app/layout.tsx:33` הוא `<html lang="he" dir="rtl">`. ב-`components/Flashcard.tsx` שני כפתורי הסימון יושבים ב-`grid grid-cols-2`, והראשון ב-DOM הוא `data-grade="again"` («לא ידעתי») — כלומר ב-RTL הוא נמצא **מימין**, ו-`data-grade="good"` («ידעתי») נמצא **משמאל**. ואילו D-042 ו-T-099 קובעות **«ימין = ידעתי, שמאל = לא ידעתי»**. ⇒ לומד שמחליק לכיוון הכפתור שהוא רואה מקבל את **ההפך** ממה שהוא התכוון.

**ההכרעה בתוכנית הזאת, ו⛔ היא אינה המצאה:** ממומש **בדיוק כלשון ההחלטה החתומה** — `dx > 0` (ימין פיזי) ⇒ `'good'`. הסתירה ⛔ אינה נסגרת בקוד, היא **נרשמת כ-F-102 ומועברת ל-PM**: או שההחלטה מתוקנת לכיוון הלוגי, או שסדר שני הכפתורים מתהפך. ⛔ **אינה חוסמת:** שני הכפתורים נשארים הערוץ הקנוני, ולומד שאינו מחליק אינו נפגע כלל.

### ב׳ · הכרטיס ⛔ אינו יודע מתי הוא נועד לחזרה — הפער האמיתי של T-100

`lib/core/deck.ts:42` — `QueueCardInput` נושא `word_id · direction · is_first_encounter · sense`, **ותו לא**. `nextReviewAtMs` קיים ב-`QueueRow` (`:35`) ו-`toQueueCardInput` (`:136`) **מפיל אותו**, ו-`interval_days` ⛔ **אינו נשלף כלל**: `PROGRESS_SELECT` (`app/api/study/queue/route.ts:65`) מונה שבעה שדות ואינו כולל אותו. העמודה עצמה **קיימת מאז `0005_review_state.sql:29`**. ⇒ T-100 ⛔ **אינה משימת רכיב** — היא שרשרת: שאילתה ← `QueueRow` ← חוט ← רכיב. ⛔ **ואפס מיגרציה** בכל זאת, כפי ש-D-043 דורשת.

### ג׳ · שתי בדיקות חיות **מובטחות ליפול**, ושתיהן מכוונות מחדש ⛔ ולא מוחלשות — **F-103 ⚪**

1. `components/Flashcard.test.ts:239` — `it('⛔ ⛔ swipe-to-grade (D-032 בתוקף)')` אוסר `onPointerDown · onPointerMove · onTouchMove · onSwipe` על **כל הקובץ**. הנימוק שכתוב בה — «D-032 בתוקף» — **חדל להתקיים**: D-042 הפכה אותה במפורש. זו בדיוק מחלקת הכשל ש-T-127 קיימת בשבילה, רק שהיא יושבת בבדיקה ולא בהערה, ואיש לא רשם אותה. נרשמת כ-**F-103 ⚪** ונסגרת במשימה 3.
2. `components/CardDeck.test.ts:197` — `expect(CODE).not.toContain('preventDefault')`. **⛔ אינה נוגעת בתוכנית הזאת**, וזה שיקול מכוון: המחווה נבנית כולה ב-`Flashcard.tsx`, ו-`CardDeck.tsx` מקבל **רק את החלפת ההערה** של T-127 (הערות נמחקות ב-`withoutComments` לפני כל שומר). ⇒ אפס סיכון לבלוק הזה.

**מה הבדיקה החדשה במקום הישנה טוענת** (משימה 3, צעד 1): ⛔ אין `onPointerMove` ו⛔ אין `onTouchMove` — «⛔ הכרטיס אינו נגרר עם האצבע» (D-042ⓒ) הוא בדיוק היעדר מעקב אחרי תנועה · שני הכפתורים `data-grade` **עדיין בקובץ** · המחווה קוראת ל-**אותו** `onGrade` ⛔ ולא לנתיב שני. זה **חד יותר** מהאיסור הישן, ⛔ לא רך יותר.

### ד׳ · אטימות על טקסט שוברת את רצפת 4.5:1 — ולכן «היחלשות» ⛔ אינה `opacity` על הכרטיס

`lib/core/palette.ts:61` מצהיר `--ink-muted` על `--surface-raised` ≥ 4.5:1. חישוב על ערכי האסימונים: `--ink-muted` בהיר הוא `#475569` על `#ffffff` ≈ 7.5:1, ובאטימות 60% הוא נופל ל-**~3.6:1** ⇒ **מתחת לרצפה**. לעומת זאת `--ink` (`#0f172a` על `#ffffff`) הוא ~17:1, ובאטימות 60% הוא ~**4.7:1** ⇒ שורד. ⇒ **הדעיכה נוגעת אך ורק במילת הכותרת** (`data-card-front`, שהיא `--ink`), ⛔ **לעולם לא בשורת ה-`text-ink-muted`** ו⛔ לא במכולה. הטענה הזאת ⛔ אינה מוצהרת בתוכנית — היא **נבדקת בקוד** במשימה 4 עם `contrastRatio` ו-`tokenValue` שכבר קיימים ב-`palette.ts`, בשני המצבים.

---

## File Structure

| קובץ | אחריות | משימה |
|---|---|---|
| `components/CardDeck.tsx` | **שינוי — הערה בלבד.** סעיף 2 בבלוק העליון מוחלף בנוסח D-042. ⛔ אפס שינוי קוד. | 1 |
| `components/CardDeck.test.ts` | **שינוי.** שומר על ה**מקור הגולמי** (⛔ לא על `CODE`): הנוסח הבטל נעלם, שלושת הסייגים נוכחים. | 1 |
| `lib/core/swipeGrade.ts` | **חדש.** טהור. שלושת הסייגים של D-042 כפונקציה אחת. | 2 |
| `lib/core/swipeGrade.test.ts` | **חדש.** בדיקות יחידה אמיתיות (⛔ לא שומר מקור). | 2 |
| `components/Flashcard.tsx` | **שינוי.** ⓐ מחווה (משימה 3) · ⓑ תווית ומחלקת דעיכה (משימה 5). | 3·5 |
| `components/Flashcard.test.ts` | **שינוי.** ⓐ הבדיקה של D-032 מכוונת מחדש (משימה 3) · ⓑ שומרי דעיכה (משימה 5). | 3·5 |
| `app/globals.css` | **שינוי.** בלוק `[data-swipe]` (משימה 3) ובלוק `[data-decay]` (משימה 5), שניהם בתקדים `[data-arena-stage]`. | 3·5 |
| `scripts/verify-mobile.mjs` | **שינוי.** בלוק מדידה חי ל-`/dev/deck`: מחווה מסמנת · מחווה מאזור הקצה ⛔ אינה מסמנת (משימה 3) · `[data-decay]` נוכח (משימה 5). | 3·5 |
| `scripts/verify-mobile.test.ts` | **שינוי.** שומר מקור לשני הבלוקים. | 3·5 |
| `lib/core/decay.ts` | **חדש.** טהור. `decayLevel` · `parseReviewAt` · `DECAY_OPACITY` · `DECAY_LABEL`. | 4 |
| `lib/core/decay.test.ts` | **חדש.** בדיקות יחידה + **הוכחת ניגודיות** בשני המצבים. | 4 |
| `lib/core/deck.ts` | **שינוי.** `QueueRow.intervalDays` · `QueueCardInput.review` · `toQueueCardInput`. | 5 |
| `lib/core/deck.test.ts` | **שינוי.** הבלוק החדש עובר בחוט. | 5 |
| `app/api/study/queue/route.ts` | **שינוי.** `interval_days` ב-`PROGRESS_SELECT` · `ProgressJoinRow` · `toQueueRow` · `toNewQueueRow`. | 5 |
| `app/api/study/queue/route.test.ts` | **שינוי.** השדה נשלף ומגיע לחוט. | 5 |
| `app/dev/deck/page.tsx` | **שינוי.** חמשת הכרטיסים מקבלים `review`, ואחד מהם **פג לחזרה** כדי שהתווית תהיה מדידה. | 5 |
| `docs/api-contract.md` | **שינוי.** בלוק ה-JSON של `GET /api/study/queue` + פסקה. **באותו קומיט.** | 5 |

---

## Task 1: T-127 — ההערה מפסיקה לנמק איסור שבוטל

**Files:**

- Modify: `components/CardDeck.tsx:21-25`
- Test: `components/CardDeck.test.ts`

**Interfaces:**

- Consumes: כלום. Produces: כלום. ⛔ **אפס שינוי קוד** — רק טקסט הערה ובדיקה שמודדת אותו.

**למה זו משימה ולא ניקיון:** שורת T-127 אומרת זאת במפורש — «הערה שמנמקת כלל בטל מסוכנת יותר מהיעדר הערה — הסוכן הבא יאמין לה ויסגור את T-099 כ«לא רלוונטית»». והיא נכונה: הסוכן שכתב את `Flashcard.test.ts:239` עשה בדיוק את זה.

**⚠️ שים לב לפני שאתה כותב את הבדיקה:** `CardDeck.test.ts` מגדיר `const CODE = withoutComments(SRC)` — כל השומרים בקובץ הזה **עיוורים להערות**. הבדיקה החדשה חייבת לרוץ על **`SRC` הגולמי**, אחרת היא עוברת ריק לנצח.

- [ ] **Step 1: Write the failing test**

הוסף לסוף `components/CardDeck.test.ts`, **אחרי** ה-`describe` האחרון, את הבלוק המלא הזה:

```ts
/**
 * T-127 · D-042 — ההערה מנמקת את הכלל שבתוקף, ⛔ לא את זה שבוטל.
 *
 * ⚠️ הבדיקה היחידה בקובץ הזה שרצה על **המקור הגולמי**: כל שאר השומרים מודדים
 * את `CODE` שממנו ההערות הוסרו, ולכן שומר על נוסח הערה **חייב** לקרוא את `SRC`.
 * ⛔ בלי זה הבדיקה עוברת ריק גם אם ההערה נמחקה כולה.
 */
describe('the deck comment cites D-042 and ⛔ never the repealed ban (T-127)', () => {
  it('⛔ no longer justifies «never swipe-to-grade» — D-042 overturned it', () => {
    expect(SRC, 'D-042 החליפה את האיסור בקיצור — נוסח בטל מטעה את הסוכן הבא').not.toContain(
      'never swipe-to-grade',
    );
  });

  it('names D-042 and all three caveats, with their numbers', () => {
    // המספרים הם התוכן: הערה שאומרת «יש סייגים» ⛔ אינה מונעת מימוש שמפר אותם.
    for (const required of ['D-042', '20px', '64px', '30°', '200ms']) {
      expect(SRC, `${required} — סייג של D-042 שההערה חייבת לשאת`).toContain(required);
    }
  });

  it('⛔ changes no code at all — the comment is the whole task', () => {
    // הטענה החזקה: כל השומרים האחרים בקובץ מודדים את `CODE`, והוא ⛔ לא זז.
    expect(CODE).toContain('snap-y');
    expect(CODE).not.toContain('preventDefault');
    expect(CODE).not.toContain('onPointerDown');
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
npm test -- components/CardDeck.test.ts
```

Expected: **FAIL ×2** — `not.toContain('never swipe-to-grade')` נופלת (הנוסח שם), ו-`toContain('D-042')` נופלת (המחרוזת אינה בקובץ). הבדיקה השלישית עוברת כבר עכשיו, וזה בכוונה: היא הבסיס שמוכיח שהמשימה ⛔ לא נגעה בקוד.

- [ ] **Step 3: Replace the comment**

ב-`components/CardDeck.tsx`, החלף את סעיף 2 בבלוק התיעוד העליון (`* 2. **Vertical snap, ⛔ never swipe-to-grade.** …` ועד סוף אותו סעיף, לפני `* 3. **`behavior: 'auto'`…`) בטקסט הזה **במלואו**:

```
 * 2. **Vertical snap here; the horizontal shortcut lives in `Flashcard` (D-042 · T-099).**
 *    The original ban quoted the vision's reason for forbidding drag — «a gesture on the
 *    scroll axis competes with the scroll» — and D-042 measured that reason against this
 *    file and found it does not apply: this container scrolls **vertically**
 *    (`snap-y snap-mandatory`), and the gesture is **horizontal**. The two axes are not the
 *    same axis, so the blanket ban was wider than the evidence that justified it.
 *    What survives, and is not negotiable: the two ≥44px buttons with a Hebrew label and a
 *    glyph stay **the canonical channel**, and the swipe calls **exactly the same handler**
 *    — ⛔ never a second path with its own logic. Three caveats come from measurement:
 *    ⓐ a **20px** strip at each edge does not respond (iOS Safari back-swipe), ⓑ the
 *    gesture needs ≥**64px** of travel at ≤**30°** off the horizontal, ⓒ ⛔ zero horizontal
 *    scroll survives: the card is ⛔ never dragged with the finger — feedback is ≤8px of
 *    offset plus an opacity change, ≤**200ms**, switched off by prefers-reduced-motion.
 *    ⛔ None of that lives here: `<Flashcard>` owns both grade buttons, so it owns the
 *    shortcut to them, and this component still adds no control of its own.
```

- [ ] **Step 4: Run the whole file and watch it pass**

```bash
npm test -- components/CardDeck.test.ts
```

Expected: **PASS**, כל הבדיקות בקובץ (כולל 20+ השומרים הישנים — אם אחד מהם נפל, נגעת בקוד ולא בהערה).

- [ ] **Step 5: Full verification**

```bash
npm run typecheck && npm run check:core && npm test && npm run build
```

Expected: `tsc` 0 · `purity: OK` · כל הבדיקות ירוקות · build 0.

- [ ] **Step 6: Commit**

```bash
git add components/CardDeck.tsx components/CardDeck.test.ts
git commit -m "loop(DEV): T-127 — the deck comment cites D-042, not the repealed ban"
```

---

## Task 2: T-099ⓐ — `lib/core/swipeGrade.ts`, שלושת הסייגים כפונקציה טהורה

**Files:**

- Create: `lib/core/swipeGrade.ts`
- Test: `lib/core/swipeGrade.test.ts`

**Interfaces:**

- Consumes: `CardGrade` מ-`lib/core/flashcard.ts` (קיים: `'again' | 'good'`).
- Produces — החתימות המדויקות שמשימה 3 מייבאת:

```ts
import type { CardGrade } from './flashcard';

/** נקודות ההתחלה והסיום של המחווה, ורוחב המסך שבו היא נעשתה. הכל בפיקסלי CSS. */
export interface SwipeInput {
  readonly startX: number;
  readonly startY: number;
  readonly endX: number;
  readonly endY: number;
  readonly viewportWidth: number;
}

/** D-042ⓐ — רצועה בכל צד שאינה מגיבה (החלקת «אחורה» של iOS Safari). */
export const SWIPE_EDGE_PX = 20;
/** D-042ⓑ — סף המרחק האופקי. */
export const SWIPE_MIN_DISTANCE_PX = 64;
/** D-042ⓑ — הסטייה המרבית מהציר האופקי, במעלות. */
export const SWIPE_MAX_ANGLE_DEG = 30;
/** D-042ⓒ — תקרת ההיזון החזותי. שתיהן נצרכות ב-app/globals.css ונבדקות שם. */
export const SWIPE_FEEDBACK_MAX_PX = 8;
export const SWIPE_FEEDBACK_MAX_MS = 200;

/** `null` = ⛔ לא מחווה. ⛔ לעולם לא ניחוש. */
export function resolveSwipe(input: SwipeInput): CardGrade | null;
```

**⛔ מה שהמודול הזה ⛔ אינו עושה, ומוצהר ⛔ ולא מוסתר:** ⛔ אינו יודע מה זה אלמנט · ⛔ אינו מחזיק מצב · ⛔ אינו יודע אם הכרטיס נחשף. השאלה «האם המחווה בכלל פעילה עכשיו» היא של הרכיב (משימה 3), כי התשובה שלה היא «בדיוק כששני הכפתורים על המסך» — וזה מצב React.

**⚠️ הכיוון ממומש כלשון D-042 — `dx > 0 ⇒ 'good'` — והסתירה עם סדר הכפתורים ב-RTL רשומה כ-F-102** (עובדה א׳). ⛔ אל תהפוך אותו «כי זה נראה הגיוני»: החלטה חתומה משתנה בידי ה-PM, ⛔ לא בידי המבצע.

- [ ] **Step 1: Write the failing test**

צור `lib/core/swipeGrade.test.ts` עם התוכן הזה **במלואו**:

```ts
import { describe, expect, it } from 'vitest';
import {
  resolveSwipe,
  SWIPE_EDGE_PX,
  SWIPE_MAX_ANGLE_DEG,
  SWIPE_MIN_DISTANCE_PX,
} from './swipeGrade';

/**
 * T-099 · D-042 — שלושת הסייגים, כל אחד עם שתי הצדדים של הגבול שלו.
 *
 * בדיקות יחידה אמיתיות ⛔ ולא שומר מקור: המודול טהור, ולכן הטענה «סף 64px»
 * נמדדת ב-63 וב-64 ⛔ ולא בכך שהמספר 64 מופיע בקובץ.
 */
const VW = 375;
const base = { startX: 100, startY: 400, viewportWidth: VW };

describe('resolveSwipe — הכיוון (D-042, ⛔ ראה F-102 על סתירת ה-RTL)', () => {
  it('ימין ⇒ «ידעתי»', () => {
    expect(resolveSwipe({ ...base, endX: 180, endY: 400 })).toBe('good');
  });

  it('שמאל ⇒ «לא ידעתי»', () => {
    expect(resolveSwipe({ ...base, endX: 20, endY: 400 })).toBe('again');
  });

  it('⛔ אפס תזוזה ⇒ ⛔ לא מחווה (הקשה רגילה חייבת לשרוד)', () => {
    expect(resolveSwipe({ ...base, endX: 100, endY: 400 })).toBeNull();
  });
});

describe('D-042ⓐ — רצועת הקצה ⛔ אינה מגיבה', () => {
  it('התחלה בתוך 20px משמאל ⇒ null, גם למחווה מושלמת', () => {
    expect(
      resolveSwipe({ startX: SWIPE_EDGE_PX, startY: 400, endX: 300, endY: 400, viewportWidth: VW }),
    ).toBeNull();
  });

  it('התחלה בתוך 20px מימין ⇒ null', () => {
    expect(
      resolveSwipe({ startX: VW - SWIPE_EDGE_PX, startY: 400, endX: 100, endY: 400, viewportWidth: VW }),
    ).toBeNull();
  });

  it('פיקסל אחד פנימה משתי הרצועות ⇒ המחווה חיה', () => {
    expect(
      resolveSwipe({ startX: SWIPE_EDGE_PX + 1, startY: 400, endX: 300, endY: 400, viewportWidth: VW }),
    ).toBe('good');
    expect(
      resolveSwipe({ startX: VW - SWIPE_EDGE_PX - 1, startY: 400, endX: 100, endY: 400, viewportWidth: VW }),
    ).toBe('again');
  });

  it('מסך צר מפעמיים הרצועה ⇒ ⛔ אין בו מחווה כלל, ⛔ ולא חלוקה באפס', () => {
    expect(
      resolveSwipe({ startX: 20, startY: 400, endX: 100, endY: 400, viewportWidth: 30 }),
    ).toBeNull();
  });
});

describe('D-042ⓑ — סף המרחק', () => {
  it(`${SWIPE_MIN_DISTANCE_PX - 1}px ⇒ null`, () => {
    expect(
      resolveSwipe({ ...base, endX: 100 + SWIPE_MIN_DISTANCE_PX - 1, endY: 400 }),
    ).toBeNull();
  });

  it(`${SWIPE_MIN_DISTANCE_PX}px בדיוק ⇒ מחווה`, () => {
    expect(resolveSwipe({ ...base, endX: 100 + SWIPE_MIN_DISTANCE_PX, endY: 400 })).toBe('good');
  });

  it('הסף נמדד על הציר האופקי בלבד — גלילה אנכית ארוכה ⛔ אינה מחווה', () => {
    expect(resolveSwipe({ ...base, endX: 110, endY: 100 })).toBeNull();
  });
});

describe(`D-042ⓑ — הזווית ≤${SWIPE_MAX_ANGLE_DEG}°`, () => {
  it('אלכסון של ~36.9° ⇒ null (dx=80, dy=60)', () => {
    expect(resolveSwipe({ ...base, endX: 180, endY: 460 })).toBeNull();
  });

  it('אלכסון של ~26.6° ⇒ מחווה (dx=80, dy=40)', () => {
    expect(resolveSwipe({ ...base, endX: 180, endY: 440 })).toBe('good');
  });

  it('הזווית סימטרית לשני הכיוונים האנכיים', () => {
    expect(resolveSwipe({ ...base, endX: 180, endY: 340 })).toBe('good');
    expect(resolveSwipe({ ...base, endX: 180, endY: 340 })).toBe(
      resolveSwipe({ ...base, endX: 180, endY: 460 - 120 }),
    );
  });

  it('ומטפלת בשמאל בדיוק אותו דבר', () => {
    expect(resolveSwipe({ ...base, endX: 20, endY: 460 })).toBeNull();
    expect(resolveSwipe({ ...base, endX: 20, endY: 440 })).toBe('again');
  });
});

describe('קלט לא סביר ⛔ אינו מייצר ציון', () => {
  it('NaN ⇒ null ⛔ ולא ניחוש', () => {
    expect(resolveSwipe({ ...base, endX: Number.NaN, endY: 400 })).toBeNull();
  });

  it('אינסוף ⇒ null', () => {
    expect(resolveSwipe({ ...base, endX: Number.POSITIVE_INFINITY, endY: 400 })).toBeNull();
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
npm test -- lib/core/swipeGrade.test.ts
```

Expected: **FAIL** — `Failed to resolve import "./swipeGrade"`.

- [ ] **Step 3: Write the implementation**

צור `lib/core/swipeGrade.ts` עם התוכן הזה **במלואו**:

```ts
/**
 * PURE. No React, no DOM, no clock, no env, no I/O.
 *
 * T-099 · D-042 — «החלקה אופקית היא **קיצור**, ⛔ ולעולם לא הערוץ היחיד».
 *
 * למה שלושת הסייגים יושבים כאן ⛔ ולא בתוך מטפל האירועים: כל אחד מהם הוא **מספר
 * שנגזר ממדידה** (רצועת ה-back-swipe של iOS · סף שמפריד מחווה מגלילה מעט אלכסונית),
 * ומספר כזה שקבור בתוך `onPointerUp` נבדק רק בדפדפן ⛔ ואף פעם לא בגבול שלו. כאן
 * הוא נבדק ב-63 וב-64.
 *
 * ⚠️ **הכיוון:** `dx > 0` (ימין פיזי) ⇒ `'good'`, כלשון D-042 ו-T-099. ב-RTL הכפתור
 * «ידעתי» יושב דווקא **משמאל** — הסתירה נמדדה, נרשמה כ-**F-102** והועברה ל-PM.
 * ⛔ אל תהפוך אותה כאן: החלטה חתומה משתנה בהחלטה, ⛔ לא במימוש.
 */
import type { CardGrade } from './flashcard';

export interface SwipeInput {
  readonly startX: number;
  readonly startY: number;
  readonly endX: number;
  readonly endY: number;
  readonly viewportWidth: number;
}

export const SWIPE_EDGE_PX = 20;
export const SWIPE_MIN_DISTANCE_PX = 64;
export const SWIPE_MAX_ANGLE_DEG = 30;
export const SWIPE_FEEDBACK_MAX_PX = 8;
export const SWIPE_FEEDBACK_MAX_MS = 200;

const MAX_ANGLE_RAD = (SWIPE_MAX_ANGLE_DEG * Math.PI) / 180;

export function resolveSwipe(input: SwipeInput): CardGrade | null {
  const { startX, startY, endX, endY, viewportWidth } = input;

  // ⛔ מספר שאינו סופי ⛔ אינו «אפס» ואינו «הרבה»: כל השוואה עליו מחזירה false
  // בשקט, וההשתקה הזאת היא בדיוק איך שמחווה מומצאת נכנסת. נדחה במפורש.
  for (const value of [startX, startY, endX, endY, viewportWidth]) {
    if (!Number.isFinite(value)) return null;
  }

  // D-042ⓐ. הבדיקה היא על נקודת ההתחלה בלבד — ⛔ לא על הסיום: החלקה שמסתיימת
  // בקצה היא מחווה תקינה שחצתה את המסך, וההחלקה שהדפדפן חוטף היא זו שמתחילה שם.
  if (startX <= SWIPE_EDGE_PX) return null;
  if (startX >= viewportWidth - SWIPE_EDGE_PX) return null;

  const dx = endX - startX;
  const dy = endY - startY;

  // D-042ⓑ — המרחק. ⛔ נמדד על הציר האופקי ⛔ ולא כמרחק אוקלידי: גלילה אנכית של
  // 300px עם סטייה של 10px היא גלילה, והמרחק האוקלידי שלה עובר כל סף.
  if (Math.abs(dx) < SWIPE_MIN_DISTANCE_PX) return null;

  // D-042ⓑ — הזווית. `atan2` על הערכים המוחלטים מחזיר את הסטייה מהציר האופקי
  // ברביע הראשון, ולכן הסימטריה בין למעלה/למטה ובין ימין/שמאל היא תכונה של
  // הנוסחה ⛔ ולא ארבעה ענפים שצריך לזכור לתחזק.
  if (Math.atan2(Math.abs(dy), Math.abs(dx)) > MAX_ANGLE_RAD) return null;

  return dx > 0 ? 'good' : 'again';
}
```

- [ ] **Step 4: Run it and watch it pass**

```bash
npm test -- lib/core/swipeGrade.test.ts && npm run check:core
```

Expected: **PASS** בכל הבדיקות · `/lib/core purity: OK`.

- [ ] **Step 5: Mutation check — ⛔ בדיקה שלא נופלת אינה בדיקה**

הרץ שלוש מוטציות, אחת אחרי השנייה, וודא שכל אחת **מפילה בדיקה בשם**, ואז שחזר:

1. `SWIPE_MIN_DISTANCE_PX = 32` ⇒ חייב להפיל את «63px ⇒ null».
2. הסר את בלוק `startX <= SWIPE_EDGE_PX` ⇒ חייב להפיל את «התחלה בתוך 20px משמאל».
3. החלף `Math.abs(dx)` ב-`Math.hypot(dx, dy)` ⇒ חייב להפיל את «גלילה אנכית ארוכה ⛔ אינה מחווה».

רשום בדיווח הטיק **מה נפל בכל אחת**. מוטציה ש⛔ לא הפילה דבר = הבדיקה חסרה, ⛔ ולא «המימוש חזק».

- [ ] **Step 6: Full verification + commit**

```bash
npm run typecheck && npm run check:core && npm test && npm run build
git add lib/core/swipeGrade.ts lib/core/swipeGrade.test.ts
git commit -m "loop(DEV): T-099a — pure swipe resolution, D-042's three caveats as one function"
```

---

## Task 3: T-099ⓑ — המחווה על הכרטיס, ההיזון, והמדידה החיה

**Files:**

- Modify: `components/Flashcard.tsx`
- Modify: `components/Flashcard.test.ts:239` (מכוונת מחדש — **F-103**)
- Modify: `app/globals.css`
- Modify: `scripts/verify-mobile.mjs` · `scripts/verify-mobile.test.ts`

**Interfaces:**

- Consumes: `resolveSwipe · SWIPE_FEEDBACK_MAX_PX · SWIPE_FEEDBACK_MAX_MS` ממשימה 2.
- Produces: `data-swipe="good" | "again"` על `<section data-flashcard>` — הסלקטור שגם `globals.css` וגם הארנס קוראים.

**שלוש הכרעות מימוש, וכל אחת נגזרת ממדידה:**

**ⓐ · Pointer Events ⛔ ולא Touch Events.** `pointerdown`/`pointerup` מכסים אצבע, עכבר ועט במטפל אחד, ו-Playwright מייצר אותם דרך `page.mouse` — כלומר המחווה **נמדדת בארנס** במקום להיות מוצהרת. `onTouchStart` היה דורש נהיגה ב-`Touch` שאי אפשר לבנות דרך `dispatchEvent` של Playwright, כלומר בדיקה חיה בלתי אפשרית.

**ⓑ · ⛔ אפס `onPointerMove`, ולכן ⛔ אפס גרירה.** D-042ⓒ אוסרת שהכרטיס ייגרר עם האצבע. ⛔ היעדר מטפל תנועה הוא הניסוח היחיד של האיסור שמכונה יכולה לאכוף, ולכן ההיזון החזותי ⛔ אינו עוקב אחרי האצבע: הוא **אישור בדיד** שנצבע ברגע ההכרעה — 8px היסט ואטימות, 200ms, דרך CSS גלובלי שה-`prefers-reduced-motion` הקיים (`globals.css:103`) כבר מאפס. ⛔ אפס `setTimeout`: `onGrade` נקרא **מיד**, והמעבר מתנגן בזמן שהבקשה בדרך.

**ⓒ · המחווה חיה בדיוק כששני הכפתורים על המסך.** התנאי הוא `revealed && card.input === 'self'` — ⛔ לא תנאי חדש שהומצא, אלא **בדיוק** התנאי שמרנדר את `data-grade="again"` ו-`data-grade="good"`. D-042 אומרת «ההחלקה מפעילה **בדיוק את אותו handler**»; handler שאין לו כפתור על המסך אינו «אותו handler». ⇒ הקשה על חזית הכרטיס לחשיפה ⛔ אינה יכולה לסמן מילה בטעות, וזה בדיוק הנזק ש-D-033 נבנתה למנוע.

**⛔ מה שהמשימה הזאת ⛔ אינה עושה:** ⛔ אינה נוגעת ב-`CardDeck.tsx` (עובדה ג׳ 2) · ⛔ אינה מוסיפה `preventDefault` · ⛔ אינה מסירה ולו כפתור אחד.

- [ ] **Step 1: Re-aim the stale guard (F-103) — ⛔ ולא להחליש אותו**

ב-`components/Flashcard.test.ts`, החלף את `it('⛔ ⛔ swipe-to-grade (D-032 בתוקף)')` **כולו** בבלוק הזה:

```ts
  /**
   * F-103 · D-042 · T-099 — הבדיקה הקודמת כאן אסרה מחווה בנימוק «D-032 בתוקף».
   * D-042 הפכה את D-032 במפורש, ולכן הנימוק חדל להתקיים. ⛔ הבדיקה ⛔ לא הוחלשה:
   * מה שהיא מודדת עכשיו **חד יותר** — לא «אין מחווה» אלא «המחווה היא קיצור, ⛔ לא
   * ערוץ, ⛔ לא גרירה, ⛔ ולא מסלול שני».
   */
  it('D-042ⓒ — ⛔ ⛔ גרירה: אין מטפל תנועה בכל הקובץ', () => {
    for (const forbidden of ['onPointerMove', 'onTouchMove', 'onTouchStart', 'onDrag']) {
      expect(T085_CARD_SRC, `${forbidden} ⇒ הכרטיס נגרר עם האצבע — D-042ⓒ אוסרת`).not.toContain(
        forbidden,
      );
    }
  });

  it('D-042 — שני הכפתורים נשארים הערוץ הקנוני', () => {
    expect(T085_CARD_SRC).toContain('data-grade="again"');
    expect(T085_CARD_SRC).toContain('data-grade="good"');
    expect(T085_CARD_SRC).toContain('לא ידעתי');
    expect(T085_CARD_SRC).toContain('ידעתי');
  });

  it('D-042 — המחווה קוראת ל-onGrade, ⛔ ולא למסלול שני', () => {
    // ⛔ `resolveSwipe` הוא היחיד שמכריע, ו-`onGrade` הוא היחיד שמסמן: שתי
    // המחרוזות ⛔ אינן מספיקות בנפרד, ולכן שתיהן נדרשות באותה בדיקה.
    expect(T085_CARD_SRC).toContain('resolveSwipe');
    expect(T085_CARD_SRC).toContain('onPointerUp');
    expect(T085_CARD_SRC).toContain('onPointerDown');
    // ⛔ אפס לוגיקת ציון מקומית: הציון מגיע מהמודול הטהור ונמסר כמו שהוא.
    expect(T085_CARD_SRC).not.toMatch(/onGrade\(\s*['"]good['"]\s*\)\s*;?\s*\/\/\s*swipe/);
  });

  it('D-042ⓒ — ⛔ אפס גרירה אופקית: אין `preventDefault` ואין `touch-action` שמבטל גלילה', () => {
    expect(T085_CARD_SRC).not.toContain('preventDefault');
    expect(T085_CARD_SRC).not.toContain('overflow-x');
  });

  it('⛔ אפס `style={{}}` — ההיזון חי ב-CSS, בתקדים [data-arena-stage]', () => {
    expect(T085_CARD_SRC).not.toContain('style={{');
    expect(T085_CARD_SRC).toContain('data-swipe');
  });
```

- [ ] **Step 2: Run it and watch it fail**

```bash
npm test -- components/Flashcard.test.ts
```

Expected: **FAIL ×2** — «המחווה קוראת ל-onGrade» (אין `resolveSwipe` בקובץ) ו«אפס `style={{}}`» (אין `data-swipe`). ארבע האחרות עוברות כבר עכשיו, וזה הבסיס שמוכיח שהכפתורים ⛔ לא נעלמו במהלך העבודה.

- [ ] **Step 3: Add the CSS block**

הוסף לסוף `app/globals.css`:

```css
/* T-099 · D-042ⓒ — ההיזון החזותי של ההחלקה. ⛔ מעבר בדיד, ⛔ ולא מעקב אחרי האצבע:
   הכרטיס ⛔ אינו נגרר, ולכן אין כאן מטפל תנועה ואין ערך רציף. שני המספרים הם
   התקרות שההחלטה נוקבת בהן — 8px ו-200ms — ו-prefers-reduced-motion למעלה
   (שורה 103) מאפס את המשך בלי כלל נוסף כאן. */
[data-flashcard] {
  transition: transform 200ms ease-out, opacity 200ms ease-out;
}
[data-flashcard][data-swipe='good'] {
  transform: translateX(8px);
  opacity: 0.6;
}
[data-flashcard][data-swipe='again'] {
  transform: translateX(-8px);
  opacity: 0.6;
}
```

- [ ] **Step 4: Wire the gesture into `Flashcard.tsx`**

ⓐ הוסף לייבוא בראש הקובץ:

```ts
import { resolveSwipe } from '@/lib/core/swipeGrade';
```

ⓑ הוסף ליד שאר ה-`useState` בגוף הרכיב:

```tsx
  // ⛔ ref ולא state: נקודת ההתחלה ⛔ אינה משנה ולו פיקסל אחד על המסך, ורינדור
  // מחדש על כל `pointerdown` היה מאפס את שדה ההקלדה של הכיוון השני.
  const swipeFrom = useRef<{ x: number; y: number } | null>(null);
  const [swipe, setSwipe] = useState<CardGrade | null>(null);
```

והוסף `useRef` לייבוא מ-`react` (השורה הראשונה בקובץ הופכת ל-`import { useId, useRef, useState } from 'react';`).

ⓒ אפס את `swipe` בבלוק «adjust state when a prop changes» הקיים — הוסף `setSwipe(null);` לצד `setGrade(null);`.

ⓓ החלף את פתיחת ה-`<section>` בזה:

```tsx
    <section
      className="flex flex-1 flex-col gap-6"
      data-flashcard={card.direction}
      // D-042 — הקיצור לשני הכפתורים. ⛔ הוא חי בדיוק כשהם על המסך: `swipeActive`
      // הוא **אותו תנאי** שמרנדר אותם למטה, ⛔ ולא תנאי שני שיסטה ממנו.
      // ⛔ אפס `onPointerMove`: הכרטיס ⛔ אינו נגרר (D-042ⓒ), וההיזון הוא אישור
      // בדיד שנצבע ברגע ההכרעה.
      data-swipe={swipe ?? undefined}
      onPointerDown={(e) => {
        setSwipe(null);
        swipeFrom.current = swipeActive ? { x: e.clientX, y: e.clientY } : null;
      }}
      onPointerUp={(e) => {
        const from = swipeFrom.current;
        swipeFrom.current = null;
        if (from === null) return;
        const resolved = resolveSwipe({
          startX: from.x,
          startY: from.y,
          endX: e.clientX,
          endY: e.clientY,
          // ⛔ `window.innerWidth` ⛔ אינו נקרא ב-`/lib/core` — הרכיב הוא שמודד
          // את המסך ומוסר את המספר, וזה בדיוק גבול הטהרה של הפרויקט.
          viewportWidth: window.innerWidth,
        });
        if (resolved === null) return;
        // ⛔ אפס `setTimeout`: הציון יוצא **מיד**, והמעבר של 200ms מתנגן בזמן
        // שהבקשה בדרך. השהיית הציון הייתה מירוץ (התקדים הוא F-101).
        setSwipe(resolved);
        onGrade(resolved);
      }}
    >
```

ⓔ הוסף מעל ה-`return`, ליד `prompt`:

```tsx
  /** ⛔ תנאי אחד לשני הערוצים: הכפתורים למטה נבדקים באותו ביטוי בדיוק. */
  const swipeActive = revealed && card.input === 'self';
```

והחלף את התנאי של בלוק שני הכפתורים מ-`{revealed && card.input === 'self' ? (` ל-`{swipeActive ? (`.

- [ ] **Step 5: Run the component tests and watch them pass**

```bash
npm test -- components/Flashcard.test.ts components/CardDeck.test.ts
```

Expected: **PASS** בשני הקבצים. ⚠️ אם `CardDeck.test.ts` נפל — נגעת בקובץ שהמשימה הזאת ⛔ אינה נוגעת בו.

- [ ] **Step 6: Add the live measurement to the harness**

ב-`scripts/verify-mobile.mjs`, בתוך `for (const route of ROUTES)`, **מיד לפני** בלוק בדיקת שגיאות הקונסולה שסוגר את גוף הלולאה, הוסף:

```js
      // T-099 · D-042 — המחווה נמדדת חיה, ⛔ ולא מוצהרת. `/dev/deck` מחזיק חמישה
      // כרטיסים ו-`onGraded` שלו נפתר מיד, ולכן «הכרטיס סומן» הוא בדיוק ירידה
      // של `data-remaining` — ⛔ ולא צילום מסך ולא «נראה תקין».
      //
      // ⚠️ הבלוק יושב **אחרון** בגוף הלולאה בכוונה: הוא משנה את מצב העמוד
      // (כרטיס עוזב את ה-DOM), וכל בדיקה שהייתה רצה אחריו הייתה מודדת דף אחר.
      if (route === '/dev/deck') {
        const remainingNow = () =>
          page.evaluate(() => {
            const el = document.querySelector('[data-remaining]');
            return el === null ? -1 : Number(el.getAttribute('data-remaining'));
          });

        // ⓐ המחווה ⛔ אינה חיה לפני החשיפה — שני הכפתורים אינם על המסך, ולכן
        // גם הקיצור אליהם אינו. זה D-033: סימון בטעות הוא הנזק.
        const before = await remainingNow();
        const box = await page.locator('[data-flashcard]').first().boundingBox();
        const midY = Math.round(box.y + box.height / 2);
        await page.mouse.move(Math.round(width / 2) - 40, midY);
        await page.mouse.down();
        await page.mouse.move(Math.round(width / 2) + 40, midY, { steps: 8 });
        await page.mouse.up();
        check(
          (await remainingNow()) === before,
          `${at} swipe before reveal ⛔ does not grade`,
          `remaining moved ${before} → ${await remainingNow()}`,
        );

        // ⓑ אחרי חשיפה — החלקה ימינה מסמנת «ידעתי» והכרטיס עוזב.
        await page.locator('[data-reveal]').first().click();
        const revealed = await remainingNow();
        await page.mouse.move(Math.round(width / 2) - 40, midY);
        await page.mouse.down();
        await page.mouse.move(Math.round(width / 2) + 40, midY, { steps: 8 });
        await page.mouse.up();
        const afterSwipe = await remainingNow();
        check(
          afterSwipe === revealed - 1,
          `${at} swipe right grades the card`,
          `remaining ${revealed} → ${afterSwipe}`,
        );

        // ⓒ D-042ⓐ — מחווה שמתחילה ברצועת הקצה ⛔ אינה מסמנת. זו הבדיקה
        // ששומרת על ההחלקה «אחורה» של iOS Safari, והיא **שלילית בכוונה**.
        await page.locator('[data-reveal]').first().click();
        const beforeEdge = await remainingNow();
        await page.mouse.move(5, midY);
        await page.mouse.down();
        await page.mouse.move(200, midY, { steps: 8 });
        await page.mouse.up();
        check(
          (await remainingNow()) === beforeEdge,
          `${at} edge-zone swipe ⛔ does not grade (D-042ⓐ)`,
          `remaining moved ${beforeEdge} → ${await remainingNow()}`,
        );
      }
```

- [ ] **Step 7: Add the source guard for the harness change**

הוסף ל-`scripts/verify-mobile.test.ts`:

```ts
describe('T-099 · D-042 — the deck gesture is measured, ⛔ not declared', () => {
  const SRC = readFileSync('scripts/verify-mobile.mjs', 'utf8');

  it('measures all three claims: before reveal · after reveal · edge zone', () => {
    for (const label of [
      'swipe before reveal ⛔ does not grade',
      'swipe right grades the card',
      'edge-zone swipe ⛔ does not grade (D-042ⓐ)',
    ]) {
      expect(SRC, `${label} — בדיקה חסרה בארנס`).toContain(label);
    }
  });

  it('the block runs last for that route — it mutates the page', () => {
    // ⛔ הטענה היא סדר: בלוק שמסמן כרטיס ורץ באמצע היה משאיר לכל שאר
    // הבדיקות דף אחר ממה שהן חושבות שהן מודדות.
    expect(SRC.indexOf("route === '/dev/deck'")).toBeGreaterThan(SRC.indexOf('no horizontal scroll'));
  });
});
```

⚠️ ודא ש-`readFileSync` ו-`describe/expect/it` כבר מיובאים בראש `scripts/verify-mobile.test.ts` — אם כן, ⛔ אל תכפיל את הייבוא.

- [ ] **Step 8: Run the live harness**

```bash
npm run build && npm run check:mobile
```

Expected: מספר ה-`✓` **עולה בתשעה בדיוק** מול הבסיס (שלוש בדיקות × שלושה רוחבים), ואפס `✗`. אם הוא עלה בפחות — בלוק לא רץ; אם עלה ביותר — משהו אחר השתנה ויש למדוד למה. ⛔ אל תדווח «עבר» בלי המספר לפני ואחרי.

- [ ] **Step 9: Full verification + commit**

```bash
npm run typecheck && npm run check:core && npm test && npm run build && npm run check:mobile
git add components/Flashcard.tsx components/Flashcard.test.ts app/globals.css scripts/verify-mobile.mjs scripts/verify-mobile.test.ts
git commit -m "loop(DEV): T-099b — the horizontal shortcut, measured live on /dev/deck (F-103 closed)"
```

---

## Task 4: T-100ⓐ — `lib/core/decay.ts`, והוכחת הניגודיות

**Files:**

- Create: `lib/core/decay.ts`
- Test: `lib/core/decay.test.ts`

**Interfaces:**

- Consumes: `contrastRatio · tokenValue · ThemeMode` מ-`lib/core/palette.ts` (בבדיקה בלבד).
- Produces — החתימות המדויקות שמשימה 5 מייבאת:

```ts
/** ⛔ ארבע דרגות ⛔ ולא ערך רציף — הנימוק בגוף הקובץ. */
export type DecayLevel = 'none' | 'due' | 'late' | 'stale';

export interface DecayInput {
  /** ⛔ ארגומנט ⛔ ולא `Date.now()`: /lib/core הוא חסר שעון. */
  readonly nowMs: number;
  readonly nextReviewAtMs: number | null;
  readonly intervalDays: number;
}

export const DECAY_LATE_RATIO = 0.5;
export const DECAY_STALE_RATIO = 1;
/** התווית העברית. D-043: «⛔ וצבע אינו הערוץ היחיד». */
export const DECAY_LABEL = 'הגיע זמן לחזור';
/** האטימות לכל דרגה. ⛔ חלה על --ink בלבד — ראה עובדה ד׳. */
export const DECAY_OPACITY: Readonly<Record<DecayLevel, number>> = { none: 1, due: 0.9, late: 0.75, stale: 0.6 };

export function decayLevel(input: DecayInput): DecayLevel;
/** ISO ⇒ epoch ms. קלט פגום ⇒ `null` ⛔ ולא NaN. */
export function parseReviewAt(value: string | null): number | null;
/** מיזוג אלפא של צבע על רקע — הכלי שמוכיח את רצפת 4.5:1 בבדיקה. */
export function blendOver(hexFg: string, hexBg: string, alpha: number): string;
```

**⛔ ארבע דרגות ⛔ ולא ערך רציף, וזו מדידה ⛔ ולא טעם:** ⛔ אין ולו `style={{}}` אחד בכל `components/` ו-`app/` (נמדד), ואטימות רציפה בלי `style` הייתה דורשת מחלקת Tailwind דינמית — כלומר מחרוזת שנבנית בזמן ריצה, שה-JIT ⛔ אינו רואה ולכן ⛔ אינו מייצר. ארבע דרגות = ארבע מחלקות שכתובות בקובץ, נראות ל-JIT, ונבדקות.

**⛔ ומה שהדעיכה אינה** (D-043, מועתק): ⛔ אינה עונש · ⛔ אינה מורידה מונה · ⛔ אינה משנה שדה SM-2 · ⛔ אינה משנה את שלוש הספירות של § 4.2ז · ⛔ אפס עמודה ואפס מיגרציה.

**למה `intervalDays <= 0` ⇒ `'none'`:** T-100 מדברת על «מילה **שסומנה כידועה**». `interval_days = 0` הוא בדיוק מילה ש-SM-2 ⛔ טרם תזמן — חדשה, או כזו שנענתה «לא ידעתי» ואופסה. מילה כזאת ⛔ אינה «דעכה», היא **מעולם לא נלמדה**, והצגת «הגיע זמן לחזור» עליה הייתה שקר ללומד. ⛔ זו ⛔ אינה החמרה שהומצאה — היא הקריאה היחידה שבה הביטוי `f(now, next_review_at, interval_days)` של D-043 מוגדר בכלל (חלוקה במכנה שאינו אפס).

- [ ] **Step 1: Write the failing test**

צור `lib/core/decay.test.ts` עם התוכן הזה **במלואו**:

```ts
import { describe, expect, it } from 'vitest';
import {
  blendOver,
  DECAY_LABEL,
  DECAY_OPACITY,
  decayLevel,
  parseReviewAt,
  type DecayLevel,
} from './decay';
import { contrastRatio, tokenValue } from './palette';

const DAY = 86_400_000;
const NOW = 1_755_000_000_000;

describe('decayLevel — D-043, ⛔ אפס שדה חדש', () => {
  it('מילה שטרם תוזמנה ⛔ אינה דועכת', () => {
    expect(decayLevel({ nowMs: NOW, nextReviewAtMs: null, intervalDays: 0 })).toBe('none');
    expect(decayLevel({ nowMs: NOW, nextReviewAtMs: null, intervalDays: 7 })).toBe('none');
  });

  it('interval_days=0 ⇒ ⛔ אינה «ידועה» ⇒ ⛔ אינה דועכת', () => {
    expect(decayLevel({ nowMs: NOW, nextReviewAtMs: NOW - 30 * DAY, intervalDays: 0 })).toBe('none');
  });

  it('מועד שטרם הגיע ⇒ none', () => {
    expect(decayLevel({ nowMs: NOW, nextReviewAtMs: NOW + DAY, intervalDays: 7 })).toBe('none');
  });

  it('בדיוק במועד ⇒ none — «מעבר לזמן» ⛔ אינו «בזמן»', () => {
    expect(decayLevel({ nowMs: NOW, nextReviewAtMs: NOW, intervalDays: 7 })).toBe('none');
  });

  it('פיגור קטן מחצי מרווח ⇒ due', () => {
    expect(decayLevel({ nowMs: NOW, nextReviewAtMs: NOW - 2 * DAY, intervalDays: 7 })).toBe('due');
  });

  it('חצי מרווח בדיוק ⇒ late', () => {
    expect(decayLevel({ nowMs: NOW, nextReviewAtMs: NOW - 3.5 * DAY, intervalDays: 7 })).toBe('late');
  });

  it('מרווח מלא ומעלה ⇒ stale', () => {
    expect(decayLevel({ nowMs: NOW, nextReviewAtMs: NOW - 7 * DAY, intervalDays: 7 })).toBe('stale');
    expect(decayLevel({ nowMs: NOW, nextReviewAtMs: NOW - 90 * DAY, intervalDays: 7 })).toBe('stale');
  });

  it('הדרגה יחסית למרווח ⛔ ולא מוחלטת — יומיים פיגור על מרווח 1 הם stale', () => {
    expect(decayLevel({ nowMs: NOW, nextReviewAtMs: NOW - 2 * DAY, intervalDays: 1 })).toBe('stale');
    expect(decayLevel({ nowMs: NOW, nextReviewAtMs: NOW - 2 * DAY, intervalDays: 30 })).toBe('due');
  });

  it('קלט לא סופי ⇒ none ⛔ ולא NaN', () => {
    expect(decayLevel({ nowMs: Number.NaN, nextReviewAtMs: NOW, intervalDays: 7 })).toBe('none');
  });
});

describe('parseReviewAt', () => {
  it('ISO ⇒ אותם מילישניות', () => {
    expect(parseReviewAt('2026-08-21T07:00:00.000Z')).toBe(Date.parse('2026-08-21T07:00:00.000Z'));
  });

  it('null ו-מחרוזת פגומה ⇒ null ⛔ ולא NaN', () => {
    expect(parseReviewAt(null)).toBeNull();
    expect(parseReviewAt('שלום')).toBeNull();
    expect(parseReviewAt('')).toBeNull();
  });
});

describe('D-043 · חוקה § 1 — צבע ⛔ אינו הערוץ היחיד', () => {
  it('לכל דרגה שאינה none יש תווית עברית אחת ויחידה', () => {
    expect(DECAY_LABEL).toBe('הגיע זמן לחזור');
  });
});

/**
 * עובדה ד׳ של התוכנית, כקוד: האטימות חלה על `--ink` בלבד, ובכל דרגה היא
 * **חייבת** לשרוד את רצפת 4.5:1 בשני המצבים. ⛔ הטענה ⛔ אינה מוצהרת — היא מחושבת.
 */
describe('the decay opacity never breaks the 4.5:1 floor', () => {
  const LEVELS: readonly DecayLevel[] = ['none', 'due', 'late', 'stale'];

  for (const mode of ['light', 'dark'] as const) {
    for (const level of LEVELS) {
      it(`--ink at ${level} on --surface-raised (${mode}) stays ≥ 4.5:1`, () => {
        const bg = tokenValue('--surface-raised', mode);
        const faded = blendOver(tokenValue('--ink', mode), bg, DECAY_OPACITY[level]);
        expect(contrastRatio(faded, bg)).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  it('⛔ ומוכיח שהרצפה אמיתית: --ink-muted באטימות stale ⛔ אינו שורד', () => {
    // הבדיקה שמנמקת למה הדעיכה ⛔ אינה חלה על השורה המשנית ו⛔ לא על המכולה.
    const bg = tokenValue('--surface-raised', 'light');
    const faded = blendOver(tokenValue('--ink-muted', 'light'), bg, DECAY_OPACITY.stale);
    expect(contrastRatio(faded, bg)).toBeLessThan(4.5);
  });
});

describe('blendOver', () => {
  it('אלפא 1 ⇒ הצבע עצמו · אלפא 0 ⇒ הרקע', () => {
    expect(blendOver('#0f172a', '#ffffff', 1)).toBe('#0f172a');
    expect(blendOver('#0f172a', '#ffffff', 0)).toBe('#ffffff');
  });

  it('דוחה hex מקוצר, כמו luminance', () => {
    expect(() => blendOver('#fff', '#000000', 0.5)).toThrow(RangeError);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
npm test -- lib/core/decay.test.ts
```

Expected: **FAIL** — `Failed to resolve import "./decay"`.

- [ ] **Step 3: Write the implementation**

צור `lib/core/decay.ts` עם התוכן הזה **במלואו**:

```ts
/**
 * PURE. No React, no DOM, no clock, no env, no I/O.
 *
 * T-100 · D-043 — «דעיכה חזותית: מקור אמת אחד, ⛔ ולא מנגנון מקביל».
 *
 * ⛔ **אפס עמודה, אפס מיגרציה, אפס שדה מתמיד.** הדרגה נגזרת בזמן הצגה משני
 * שדות SM-2 שכבר קיימים מאז `0005_review_state.sql`. שדה מתמיד היה מקור אמת
 * שני שיסטה, וזו בדיוק התקלה של D-034 (שתי עמודות רמה חלוקות על 125 מתוך 343).
 *
 * ⛔ **והדעיכה אינה:** ⛔ אינה עונש · ⛔ אינה מורידה מונה · ⛔ אינה משנה שום שדה
 * SM-2 · ⛔ אינה משנה את שלוש הספירות של § 4.2ז. מילה שדעכה נשארת «ידועה» —
 * היא **פגה לחזרה**, וזה מה שהמנוע כבר אומר. «ריפוי» הוא תשובה נכונה בחפיסת
 * מנת היום, ⛔ ולא פעולה חדשה.
 *
 * **⛔ ארבע דרגות ⛔ ולא ערך רציף:** אטימות רציפה בלי `style={{}}` (שאין לו ולו
 * מופע אחד בכל components/ ו-app/) הייתה דורשת מחלקת Tailwind שנבנית בזמן ריצה
 * — מחרוזת שה-JIT ⛔ אינו רואה ולכן ⛔ אינו מייצר, כלומר אטימות שלא תגיע לדפדפן.
 *
 * **⛔ והאטימות חלה על `--ink` בלבד:** `--ink-muted` על `--surface-raised` הוא
 * ~7.5:1, ובאטימות 0.6 הוא נופל מתחת ל-4.5:1 — כלומר «היחלשות» של השורה המשנית
 * הייתה שוברת רצפת ניגודיות מוצהרת (`palette.ts` CONTRAST_FLOORS). שתי הטענות
 * האלה נבדקות ב-`decay.test.ts` בחישוב, ⛔ ולא מוצהרות כאן.
 */
export type DecayLevel = 'none' | 'due' | 'late' | 'stale';

export interface DecayInput {
  readonly nowMs: number;
  readonly nextReviewAtMs: number | null;
  readonly intervalDays: number;
}

export const DECAY_LATE_RATIO = 0.5;
export const DECAY_STALE_RATIO = 1;
export const DECAY_LABEL = 'הגיע זמן לחזור';

export const DECAY_OPACITY: Readonly<Record<DecayLevel, number>> = Object.freeze({
  none: 1,
  due: 0.9,
  late: 0.75,
  stale: 0.6,
});

const DAY_MS = 86_400_000;

export function decayLevel(input: DecayInput): DecayLevel {
  const { nowMs, nextReviewAtMs, intervalDays } = input;
  if (!Number.isFinite(nowMs) || !Number.isFinite(intervalDays)) return 'none';
  // מילה שלא תוזמנה ⛔ אינה «לא בזמן» — היא פשוט לא נלמדה עדיין (התקדים הוא
  // `reviewRank` ב-deck.ts, שממיין null לסוף במקום לטפל בו כמועד באפוק 0).
  if (nextReviewAtMs === null || !Number.isFinite(nextReviewAtMs)) return 'none';
  if (intervalDays <= 0) return 'none';

  const overdueMs = nowMs - nextReviewAtMs;
  if (overdueMs <= 0) return 'none';

  const ratio = overdueMs / (intervalDays * DAY_MS);
  if (ratio >= DECAY_STALE_RATIO) return 'stale';
  if (ratio >= DECAY_LATE_RATIO) return 'late';
  return 'due';
}

export function parseReviewAt(value: string | null): number | null {
  if (typeof value !== 'string' || value === '') return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const HEX = /^#[0-9a-fA-F]{6}$/;

/**
 * מיזוג אלפא בפשטות של sRGB — בדיוק מה שהדפדפן עושה ל-`opacity` על טקסט מעל
 * רקע אטום. ⛔ hex מקוצר נדחה ⛔ ולא «מתפרש»: הוא היה מתפרש שגוי בשקט, וזו
 * אותה הכרעה בדיוק שקיימת ב-`luminance` (palette.ts).
 */
export function blendOver(hexFg: string, hexBg: string, alpha: number): string {
  if (!HEX.test(hexFg) || !HEX.test(hexBg)) {
    throw new RangeError(`expected two 6-digit hex colours, got "${hexFg}" and "${hexBg}"`);
  }
  const mix = (offset: number): string => {
    const fg = parseInt(hexFg.slice(offset, offset + 2), 16);
    const bg = parseInt(hexBg.slice(offset, offset + 2), 16);
    return Math.round(alpha * fg + (1 - alpha) * bg)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${mix(1)}${mix(3)}${mix(5)}`;
}
```

- [ ] **Step 4: Run it and watch it pass**

```bash
npm test -- lib/core/decay.test.ts && npm run check:core
```

Expected: **PASS** בכל הבדיקות, כולל שמונה בדיקות הניגודיות · `/lib/core purity: OK`.

⚠️ אם אחת מבדיקות הניגודיות **נפלה** — ⛔ אל תשנה את הרצפה ל-4.0. ה-`DECAY_OPACITY` הוא שנקבע שגוי; העלה את הערך של הדרגה שנפלה עד שהוא עובר, ורשום בדיווח את המספר שהתקבל ולמה.

- [ ] **Step 5: Mutation check**

1. `if (intervalDays <= 0) return 'none';` → הסר ⇒ חייב להפיל את «interval_days=0».
2. `if (overdueMs <= 0)` → `< 0` ⇒ חייב להפיל את «בדיוק במועד ⇒ none».
3. `DECAY_OPACITY.stale` → `0.35` ⇒ חייבת להפיל בדיקת ניגודיות **בשם**.

רשום מה נפל בכל אחת, ושחזר.

- [ ] **Step 6: Full verification + commit**

```bash
npm run typecheck && npm run check:core && npm test && npm run build
git add lib/core/decay.ts lib/core/decay.test.ts
git commit -m "loop(DEV): T-100a — pure decay derivation, with the contrast floor proved in code"
```

---

## Task 5: T-100ⓑ — השרשרת: שאילתה ← חוט ← כרטיס

**Files:**

- Modify: `app/api/study/queue/route.ts` (‏`PROGRESS_SELECT` · `ProgressJoinRow` · `toQueueRow` · `toNewQueueRow`)
- Modify: `lib/core/deck.ts` (‏`QueueRow` · `QueueCardInput` · `toQueueCardInput`)
- Modify: `components/CardDeck.tsx` (מעביר `review` הלאה) · `components/Flashcard.tsx` (מצייר)
- Modify: `app/dev/deck/page.tsx` · `docs/api-contract.md` · `app/globals.css`
- Test: `lib/core/deck.test.ts` · `app/api/study/queue/route.test.ts` · `components/Flashcard.test.ts` · `scripts/verify-mobile.test.ts`

**Interfaces:**

- Consumes: `decayLevel · parseReviewAt · DECAY_LABEL` ממשימה 4.
- Produces:

```ts
// lib/core/deck.ts — תוספת בלבד. ⛔ אפס שינוי בשדות הקיימים.
export interface QueueCardReview {
  /** ISO-8601, כפי שהעמודה מחזיקה אותו. `null` = מילה שטרם תוזמנה. */
  readonly next_review_at: string | null;
  /** `0` = SM-2 טרם תזמן. ⛔ לעולם לא null — העמודה היא `not null default 0`. */
  readonly interval_days: number;
}

export interface QueueCardInput {
  // …ארבעת השדות הקיימים, ⛔ ללא שינוי…
  readonly review: QueueCardReview;
}

export interface QueueRow {
  // …השדות הקיימים…
  readonly intervalDays: number;
}
```

```tsx
// components/Flashcard.tsx — פרופ חדש, ⛔ לא שינוי ב-`Card`.
readonly review?: QueueCardReview;
```

**למה `review` נוסע כשדה על הכרטיס ו⛔ לא נכנס ל-`buildCard`:** `Card` הוא **שתי הפָּנים של הכרטיס** — טקסט, כיוון, ומה שמוצג. מועד חזרה ⛔ אינו פן של הכרטיס, הוא מצב התזמון של המילה, והכנסתו ל-`buildCard` הייתה מכריחה כל בדיקת `flashcard.test.ts` הקיימת לספק תזמון כדי לבנות טקסט. פרופ נפרד משאיר את שתי השכבות נפרדות.

**למה `review` הוא פרופ **אופציונלי** ב-`Flashcard`:** `/dev/card`, `/dev/card/typed` ו-`/dev/card/swap` בונים `Card` ישירות ⛔ ואינם עוברים דרך התור. פרופ חובה היה מכריח אותם להמציא מועד חזרה — כלומר להמציא נתון. ⛔ חסר ⇒ `'none'`, ⛔ ולא ניחוש.

**⚠️ שים לב — יש כאן המרה כפולה, והיא מכוונת:** ה-DB מחזיר ISO, `QueueRow` מחזיק `nextReviewAtMs` (מספר, כי המיון ב-`sortQueue` משווה מספרים), והחוט מחזיר ל-ISO. ⛔ **אל תוסיף שדה ISO שני ל-`QueueRow`** — שתי הצגות של אותו נתון הן בדיוק הסחיפה של D-034. ההמרה `new Date(ms).toISOString()` נאמנה למילישנייה, וזה נבדק בצעד 1.

- [ ] **Step 1: Write the failing tests (three files)**

ⓐ הוסף ל-`lib/core/deck.test.ts`:

```ts
describe('T-100 · D-043 — התזמון נוסע בחוט, ⛔ ואפס עמודה חדשה', () => {
  const row = {
    wordId: '11111111-2222-3333-4444-555555555555',
    headword: 'budget',
    translationHe: 'תקציב',
    examples: { supportive: 'a', neutral: 'b' },
    needsHumanReview: false,
    cefrProfileBand: 'A1',
    nextReviewAtMs: Date.parse('2026-08-01T09:00:00.000Z'),
    attempts: 3,
    repetition: 2,
    consecutiveCorrectRecognition: 1,
    intervalDays: 7,
  };

  it('מעביר את שני השדות, ⛔ ובלי לגעת בארבעת הקיימים', () => {
    const card = toQueueCardInput(row, 3);
    expect(card.review).toEqual({ next_review_at: '2026-08-01T09:00:00.000Z', interval_days: 7 });
    expect(card.word_id).toBe(row.wordId);
    expect(card.sense.headword).toBe('budget');
    expect(card.is_first_encounter).toBe(false);
  });

  it('המרת ms⇄ISO נאמנה למילישנייה — ⛔ אין כאן איבוד דיוק', () => {
    const odd = { ...row, nextReviewAtMs: Date.parse('2026-08-01T09:00:00.123Z') };
    expect(Date.parse(toQueueCardInput(odd, 3).review.next_review_at ?? '')).toBe(odd.nextReviewAtMs);
  });

  it('מילה שטרם תוזמנה ⇒ null ⛔ ולא אפוק 0', () => {
    const fresh = { ...row, nextReviewAtMs: null, intervalDays: 0, attempts: 0 };
    expect(toQueueCardInput(fresh, 3).review).toEqual({ next_review_at: null, interval_days: 0 });
  });
});
```

ⓑ הוסף ל-`app/api/study/queue/route.test.ts`:

```ts
describe('T-100 — interval_days נשלף, ⛔ ואינו מנוחש', () => {
  const SRC = readFileSync('app/api/study/queue/route.ts', 'utf8');

  it('העמודה בשאילתת ההתקדמות', () => {
    // ⛔ שדה שלא נשלף חוזר undefined ⇒ הדעיכה הייתה `none` לנצח, בשקט.
    expect(SRC).toMatch(/PROGRESS_SELECT[\s\S]{0,400}interval_days/);
  });

  it('מילה חדשה מקבלת 0 ⛔ ולא undefined', () => {
    expect(SRC).toMatch(/intervalDays:\s*0/);
  });
});
```

⚠️ ודא ש-`readFileSync` מיובא בראש הקובץ; אם לא, הוסף `import { readFileSync } from 'node:fs';`.

ⓒ הוסף ל-`components/Flashcard.test.ts`:

```ts
describe('T-100 · D-043 — הדעיכה על הכרטיס', () => {
  it('התווית העברית מגיעה מהמודול הטהור ⛔ ואינה מוקלדת שוב', () => {
    expect(T085_CARD_SRC).toContain('DECAY_LABEL');
    expect(T085_CARD_SRC).not.toContain('הגיע זמן לחזור');
  });

  it('שתי חזיתות הכרטיס — שתיהן נושאות את הדעיכה', () => {
    // הפנים מוטבעות פעמיים במכוון (ראה ההערה של T-085); דעיכה על אחת מהן
    // בלבד הייתה אומרת שהלומד רואה אותה לפני החשיפה ⛔ ולא אחריה, או להפך.
    expect(T085_CARD_SRC.split('data-decay').length - 1).toBeGreaterThanOrEqual(2);
  });

  it('⛔ הדעיכה ⛔ אינה נוגעת בשורה המשנית — היא שוברת 4.5:1 (עובדה ד׳)', () => {
    // ⛔ אין `data-decay` על אף אלמנט שנושא `text-ink-muted`.
    for (const line of T085_CARD_SRC.split('\n')) {
      if (line.includes('data-decay')) {
        expect(line, 'דעיכה על text-ink-muted שוברת רצפת ניגודיות').not.toContain('text-ink-muted');
      }
    }
  });

  it('⛔ אפס שדה חדש: הרכיב קורא next_review_at ו-interval_days ⛔ ותו לא', () => {
    expect(T085_CARD_SRC).toContain('decayLevel');
    for (const invented of ['decayed_at', 'decay_level', 'is_decayed', 'staleness']) {
      expect(T085_CARD_SRC, `${invented} — D-043 אוסרת שדה מתמיד`).not.toContain(invented);
    }
  });
});
```

- [ ] **Step 2: Run all three and watch them fail**

```bash
npm test -- lib/core/deck.test.ts app/api/study/queue/route.test.ts components/Flashcard.test.ts
```

Expected: **FAIL** בשלושתם — `card.review` הוא `undefined`, `interval_days` אינו במקור, `DECAY_LABEL` אינו בקובץ.

- [ ] **Step 3: The wire — `lib/core/deck.ts`**

ⓐ הוסף ל-`QueueRow`, אחרי `nextReviewAtMs`:

```ts
  /** `0` = SM-2 טרם תזמן. העמודה היא `not null default 0` (0005_review_state.sql:29). */
  readonly intervalDays: number;
```

ⓑ הוסף מעל `QueueCardInput`:

```ts
/**
 * T-100 · D-043 — מצב התזמון של המילה, ⛔ ולא פן של הכרטיס.
 * ⛔ אפס עמודה חדשה: שני השדות קיימים מאז 0005_review_state.sql.
 */
export interface QueueCardReview {
  readonly next_review_at: string | null;
  readonly interval_days: number;
}
```

ⓒ הוסף ל-`QueueCardInput`, אחרי `sense`:

```ts
  /** ⛔ תוספת בלבד — ארבעת השדות שמעליה ⛔ לא זזו (התקדים הוא T-102). */
  readonly review: QueueCardReview;
```

ⓓ הוסף ל-`toQueueCardInput`, אחרי בלוק `sense`:

```ts
    review: {
      // ⛔ אין שדה ISO שני ב-QueueRow: שתי הצגות של אותו נתון הן הסחיפה של
      // D-034. ההמרה נאמנה למילישנייה ונבדקת ב-deck.test.ts.
      next_review_at:
        row.nextReviewAtMs === null ? null : new Date(row.nextReviewAtMs).toISOString(),
      interval_days: row.intervalDays,
    },
```

- [ ] **Step 4: The query — `app/api/study/queue/route.ts`**

ⓐ ב-`PROGRESS_SELECT` הוסף `interval_days` אחרי `next_review_at`:

```ts
const PROGRESS_SELECT =
  'word_id, attempts, correct_attempts, repetition, consecutive_correct_recognition, next_review_at, interval_days, ' +
  'words!inner(headword, cefr_profile_band, ' +
  'senses(sense_index, translation_he, needs_human_review, sense_examples(kind, text_en)))';
```

ⓑ ב-`ProgressJoinRow` הוסף אחרי `next_review_at`:

```ts
  interval_days: number | null;
```

ⓒ ב-`toQueueRow` הוסף לאובייקט המוחזר:

```ts
    // ⛔ `?? 0` ⛔ ואינו ניחוש: העמודה `not null default 0`, ולכן null כאן פירושו
    // שהשורה הגיעה משאילתה שלא ביקשה אותה — ואפס הוא בדיוק «טרם תוזמן».
    intervalDays: row.interval_days ?? 0,
```

ⓓ ב-`toNewQueueRow` הוסף:

```ts
    intervalDays: 0,
```

- [ ] **Step 5: The card — `CardDeck.tsx` ו-`Flashcard.tsx`**

ⓐ ב-`components/CardDeck.tsx`, בקריאה ל-`<Flashcard`, הוסף שורה אחת **אחרי** `card={buildCard(…)}`:

```tsx
              // T-100 — מצב התזמון עובר כמו שהוא. ⛔ הדק ⛔ אינו גוזר ממנו דבר:
              // ההכרעה טהורה ויושבת ב-lib/core/decay.ts.
              review={card.review}
```

ⓑ ב-`components/Flashcard.tsx`:

הוסף לייבוא:

```ts
import { DECAY_LABEL, decayLevel, parseReviewAt } from '@/lib/core/decay';
import type { QueueCardReview } from '@/lib/core/deck';
```

הרחב את חתימת הפרופים:

```tsx
  review,
}: {
  readonly card: Card;
  /** ⛔ אופציונלי: פיקסטורות `/dev/card*` בונות `Card` ישירות ⛔ ואין להן תזמון
   *  להמציא. חסר ⇒ `'none'`, ⛔ ולא ניחוש. */
  readonly review?: QueueCardReview;
  readonly onGrade: (grade: CardGrade) => void;
}) {
```

הוסף ליד שאר ה-`useState`:

```tsx
  // ⛔ אפס `Date.now()` ברינדור: השרת והלקוח היו מקבלים שני מספרים שונים,
  // וזו אזהרת hydration שהארנס סופר כשגיאת קונסולה. השעון נכנס **אחרי**
  // ההרכבה, ולכן הרינדור הראשון זהה בשני הצדדים ו⛔ אין אי-התאמה.
  const [nowMs, setNowMs] = useState<number | null>(null);
  useEffect(() => setNowMs(Date.now()), []);
```

והוסף `useEffect` לייבוא מ-`react`.

הוסף ליד `swipeActive`:

```tsx
  const decay =
    nowMs === null || review === undefined
      ? 'none'
      : decayLevel({
          nowMs,
          nextReviewAtMs: parseReviewAt(review.next_review_at),
          intervalDays: review.interval_days,
        });
```

ובכל אחת משתי חזיתות הכרטיס (ענף ה-`<button>` וענף ה-`<div>`), החלף את שורת המילה:

```tsx
          <p className="mt-2 text-4xl font-bold leading-tight" data-card-front>
```

בזה — **בשני המקומות, ⛔ ולא במשתנה משותף** (ההערה הקיימת בקובץ מסבירה למה: בדיקת המקור סורקת את בלוק ה-`<button>` עצמו):

```tsx
          <p
            className="mt-2 text-4xl font-bold leading-tight"
            data-card-front
            data-decay={decay}
          >
```

והוסף **מיד אחרי** כל אחת משתי השורות האלה:

```tsx
          {decay === 'none' ? null : (
            // D-043 · חוקה § 1 — צבע ⛔ אינו הערוץ היחיד. ⛔ אין כאן אסימון חדש
            // ואין צבע חדש: `text-ink-muted` הוא המשלב הדיסקרטי, בדיוק כמו
            // «טרם אומת». ⛔ והשורה הזאת ⛔ אינה דועכת — היא תישבר מ-4.5:1.
            <p className="mt-2 flex items-center gap-2 text-sm text-ink-muted">
              <span aria-hidden="true">◷</span>
              {DECAY_LABEL}
            </p>
          )}
```

- [ ] **Step 6: The CSS — ארבע דרגות, ארבע מחלקות**

הוסף לסוף `app/globals.css`:

```css
/* T-100 · D-043 — ההיחלשות החזותית. ⛔ חלה על מילת הכותרת בלבד (--ink, ~17:1),
   ⛔ ולעולם לא על השורה המשנית (--ink-muted, ~7.5:1) שהייתה נופלת מתחת ל-4.5:1
   באטימות הזאת. הערכים זהים ל-DECAY_OPACITY ב-lib/core/decay.ts, והרצפה נבדקת
   שם בחישוב. ⛔ אין כאן אנימציה: דעיכה היא מצב, ⛔ לא תנועה. */
[data-decay='due'] { opacity: 0.9; }
[data-decay='late'] { opacity: 0.75; }
[data-decay='stale'] { opacity: 0.6; }
```

- [ ] **Step 7: The fixture and the contract**

ⓐ ב-`app/dev/deck/page.tsx` הוסף `review` לכל אחד מחמשת הכרטיסים. **ארבעה** מקבלים מילה שטרם תוזמנה, ו**אחד** — הראשון — פג לחזרה, כדי שהתווית תהיה מדידה:

```tsx
    // T-100 — הכרטיס הראשון **פג לחזרה** במכוון: בלי כרטיס אחד כזה
    // `[data-decay]` ⛔ לעולם אינו `stale` בארנס, ו«הדעיכה נראית» היה נשאר
    // טענה. ⛔ תאריך קבוע ⛔ ולא מחושב: פיקסטורה שמשתנה עם השעון היא בדיקה
    // שנשברת ביום אחר.
    review: { next_review_at: '2026-01-01T00:00:00.000Z', interval_days: 7 },
```

ולארבעה האחרים:

```tsx
    review: { next_review_at: null, interval_days: 0 },
```

ⓑ ב-`docs/api-contract.md`, בבלוק ה-JSON של `GET /api/study/queue`, הוסף לאובייקט הכרטיס אחרי `sense`:

```json
      "review": { "next_review_at": "2026-08-01T09:00:00.000Z", "interval_days": 7 }
```

והוסף מתחת לבלוק:

```markdown
⚠️ **`review` — תוספת בלבד (T-100 · D-043), ⛔ ואפס עמודה חדשה.** שני השדות קיימים ב-
`word_progress` מאז `0005_review_state.sql` והם נוסעים **כפי שהם**: `next_review_at` ב-ISO
(‏`null` = מילה שטרם תוזמנה, ⛔ ולא "לא בזמן"), ו-`interval_days` שהוא `not null default 0`
(‏`0` = SM-2 טרם תזמן). הצרכן היחיד הוא `<Flashcard>`, שגוזר מהם **בזמן הצגה** את דרגת
הדעיכה דרך `lib/core/decay.ts`. ⛔ **השרת ⛔ אינו שולח דרגה** — דרגה על החוט הייתה מקור
אמת שני שנקבע לפי השעון של השרת ומוצג לפי השעון של הלקוח.
```

- [ ] **Step 8: Add the live measurement**

ב-`scripts/verify-mobile.mjs`, בתוך בלוק `if (route === '/dev/deck') {` שנוצר במשימה 3, הוסף **בראשו** (⛔ לפני המחוות, שמסירות את הכרטיס הראשון מה-DOM):

```js
        // T-100 · D-043 — הדעיכה נראית, ⛔ ולא מוצהרת. הכרטיס הראשון בפיקסטורה
        // פג לחזרה, ולכן `stale` חייב להיות על המסך. ⛔ הבדיקה ⛔ אינה על צבע:
        // היא על **התווית העברית**, שהיא הערוץ שאינו-צבע של חוקה § 1.
        const decay = await page.evaluate(() => {
          const el = document.querySelector('[data-card-front][data-decay]');
          return {
            level: el === null ? null : el.getAttribute('data-decay'),
            label: document.body.innerText.includes('הגיע זמן לחזור'),
          };
        });
        check(decay.level === 'stale', `${at} overdue card decays`, `data-decay=${decay.level}`);
        check(decay.label, `${at} decay carries its Hebrew label`, 'label missing');
```

והוסף ל-`scripts/verify-mobile.test.ts`:

```ts
it('T-100 — the harness measures the decay level AND its Hebrew label', () => {
  const SRC = readFileSync('scripts/verify-mobile.mjs', 'utf8');
  expect(SRC).toContain('overdue card decays');
  expect(SRC).toContain('decay carries its Hebrew label');
  // ⛔ הסדר: בדיקת הדעיכה קודמת למחוות, שמסירות את הכרטיס הראשון מה-DOM.
  expect(SRC.indexOf('overdue card decays')).toBeLessThan(SRC.indexOf('swipe right grades the card'));
});
```

- [ ] **Step 9: Run everything**

```bash
npm run typecheck && npm run check:core && npm test && npm run build && npm run check:mobile
```

Expected: `tsc` **0** · `purity: OK` · כל הבדיקות ירוקות · build **0** · `check:mobile` עולה ב-**שש** נוספות (שתי בדיקות × שלושה רוחבים) מעל המספר של משימה 3, ואפס `✗`.

⚠️ **הכשל הצפוי כאן, ואם הוא לא קרה — בדוק למה:** `npm run typecheck` **חייב** ליפול בפעם הראשונה על `lib/core/deck.test.ts` ועל `app/api/study/queue/route.test.ts`, כי `QueueRow` ו-`QueueCardInput` קיבלו שדה חובה חדש וכל אובייקט בדיקה שנבנה ידנית חסר אותו. ⛔ **אל תהפוך את השדה לאופציונלי כדי לעקוף את זה** — זה בדיוק «להחליש בדיקה». הוסף את השדה לכל אובייקט שנפל.

- [ ] **Step 10: Commit**

```bash
git add lib/core/deck.ts lib/core/deck.test.ts app/api/study/queue/route.ts app/api/study/queue/route.test.ts components/CardDeck.tsx components/Flashcard.tsx components/Flashcard.test.ts app/dev/deck/page.tsx app/globals.css docs/api-contract.md scripts/verify-mobile.mjs scripts/verify-mobile.test.ts
git commit -m "loop(DEV): T-100b — review state on the wire, decay derived at display time"
```

---

## Self-review — מה נבדק מול המפרט

| דרישה במקור | היכן היא מיושמת | היכן היא **נמדדת** |
|---|---|---|
| T-127 — ההערה מנמקת את D-042 | משימה 1, צעד 3 | `CardDeck.test.ts` על `SRC` הגולמי, שלושה סייגים בשמותיהם |
| D-042 — ימין=ידעתי · שמאל=לא ידעתי | `resolveSwipe` | `swipeGrade.test.ts`, שתי בדיקות + **F-102** על סתירת ה-RTL |
| D-042 — «בדיוק אותו handler» | `onGrade(resolved)` | `Flashcard.test.ts` — `resolveSwipe` + `onGrade` באותה בדיקה |
| D-042 — שני הכפתורים נשארים | ⛔ לא נגענו בהם | `Flashcard.test.ts` — ארבע מחרוזות `data-grade`/תוויות |
| D-042ⓐ — רצועת 20px | `startX <= SWIPE_EDGE_PX` | יחידה (שני צדי הגבול) **וגם** `check:mobile` חי |
| D-042ⓑ — ≥64px · ≤30° | שני תנאים ב-`resolveSwipe` | יחידה: 63 מול 64 · 26.6° מול 36.9° |
| D-042ⓒ — ⛔ אפס גלילה אופקית · ≤8px · ≤200ms · reduced-motion | `globals.css`, ⛔ אפס `onPointerMove` | `Flashcard.test.ts` + `no horizontal scroll` הקיימת ×3 רוחבים |
| D-043 — ⛔ אפס עמודה/מיגרציה/שדה | `decay.ts` גוזר בזמן הצגה | `Flashcard.test.ts` — ארבעה שמות שדה אסורים |
| D-043 — «צבע ⛔ אינו הערוץ היחיד» | `DECAY_LABEL` + גליף | `check:mobile` מודד את **התווית**, ⛔ לא את הצבע |
| D-043 — ⛔ אינה משנה שדה SM-2 | ⛔ אפס כתיבה בכל התוכנית | `check:core` + היעדר כל `POST` בדיף |
| חוקה § 1 — רצפת 4.5:1 | האטימות על `--ink` בלבד | **שמונה בדיקות חישוב** ב-`decay.test.ts`, שני מצבים |
| `docs/api-contract.md` באותו קומיט | משימה 5, צעד 7ⓑ+10 | הקומיט עצמו |

**שלושה דברים שהתוכנית הזאת ⛔ אינה עושה, ומוצהרים ⛔ ולא מוסתרים:**

1. ⛔ **אינה מכריעה את F-102.** הכיוון ממומש כלשון ההחלטה החתומה, והסתירה עוברת ל-PM.
2. ⛔ **אינה מודדת שהמחווה עובדת באצבע אמיתית ב-iOS Safari.** Playwright נוהג ב-Pointer Events בכרומיום; רצועת הקצה נבדקת כלוגיקה ⛔ ולא מול ניווט אמיתי של הדפדפן. חוב מוצהר.
3. ⛔ **אינה נותנת ללומד דרך לבטל סימון שנעשה בהחלקה.** «אין גלילה אחורה» הוא כלל קיים (`CardDeck` מסיר את הכרטיס), וביטול הוא **מסך חדש** — כלומר הכרעת PM, ⛔ ולא משהו שמבצע ממציא.
