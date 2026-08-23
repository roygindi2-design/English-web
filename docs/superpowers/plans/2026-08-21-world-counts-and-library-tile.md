# World Counts and Library Tile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** לסגור את שתי שורות המשימה שחולקות **בדיוק אותו כלל** — «המספר על המסך מגיע מהשרת, ⛔ ואינו כתוב בלקוח» (D-046): **T-141** (‏`GET /api/world/recall` מחזיר `counts`, ו-`<RecallCard>` מפריד שני מצבים ⛔ ולא אחד — D-075, סוגר את F-080 🟡) ו-**T-137** (האריח הרביעי «הספרייה» ברשת `העולם`, עם תנאי פתיחה מדיד «נדרשים 3 סיפורים ברמה שלך, יש N» — D-074ⓑ · § 4.2יג).

**Architecture:** שתי השורות נבנות באותן שלוש שכבות בדיוק, ⛔ ואין כאן דפוס שלישי:
1. **שכבה טהורה** — `lib/core/worldRecall.ts` מקבל `recallCounts()`, ו-`lib/core/worldApps.ts` מקבל `libraryTile()` + `storiesTooFewNoteHe()`. ⛔ אפס React · DOM · שעון · env · רשת.
2. **נתיב** — `/api/world/recall` פולט `counts` **מאותן שתי הקריאות שכבר יש לו** (⛔ אפס קריאה שלישית), ו-`/api/world/status` מקבל **קריאה רכה** של `profiles.current_level` + ספירת `stories` ברמה ההיא.
3. **רכיב** — `<RecallCard>` מפצל את מצב `empty` לשניים לפי `counts`, ו-`<AppGrid>` מצייר אריח רביעי לפי `stories` מהתשובה.

⛔ **אפס עמודה · אפס מיגרציה · אפס שדה חדש בדאטהבייס.** שני המונים נגזרים בזמן השאילתה — תבנית D-043, ובלשון D-075 במפורש.

**Tech Stack:** TypeScript (ללא `any`, `noUncheckedIndexedAccess` פעיל) · Next.js App Router (‏Route Handlers) · Supabase/PostgREST · React 19 client components · Vitest (סביבת `node`, **⛔ בלי jsdom** ⇒ בדיקות רכיב הן **סריקת מקור**) · Playwright דרך `npm run check:mobile`.

**Spec:** `plan/40-decisions.md` — **D-075** (שורה 2043) · **D-074** (שורה ~2010) · **D-046** (שורה 1127) · **D-071ⓐ** · **D-054** (שורה 1481, שורת «הספרייה») · **§ 4.2יג** (שורה 1953) · **§ 4.2יב** (שורה 1579) · **§ 4.2יא** (שורה 1256) · **D-066** · **R-016** · `plan/50-tasks.md` — שורות **T-141** ו-**T-137** · `plan/60-findings.md` — **F-080 🟡** (‏T-141 סוגרת אותו) · **F-072** (‏D-074 סגרה אותו) · **F-084** · **F-027** · **F-074** · **F-087/F-088** (הלבנת הערות) · **F-105/F-106/F-107** (הלקחים של C-0252).

## Global Constraints

- ⛔ `/lib/core/` **טהור**: אפס `React` · `window` · `document` · `localStorage` · `sessionStorage` · `process.env` · `fetch` · `Date.now()` · `Math.random()` (`npm run check:core` ⇒ `scripts/check-core-purity.mjs`).
- ⛔ **רכיב ממשק ⛔ אינו ניגש לדאטהבייס.** הכל דרך `app/api/*` ו-`lib/api/client.ts` (‏`apiGet`).
- ⛔ **אפס כתיבה בשתי השורות האלה**: אין `apiPost` · `.insert(` · `.update(` · `.upsert(` · `.delete(` בשום קובץ שהתוכנית נוגעת בו. הכרטיס ⛔ אינו חזרה (D-051), והרשת ⛔ אינה כותבת (D-044).
- ⛔ **אפס עמודת מנוע חזרות** — `easiness` · `interval_days` · `repetition` · `next_review_at` · `self_marked_known` ⛔ אינם מופיעים ברכיבים.
- ⛔ **`current_level` ⛔ אינו מופיע ב-`components/AppGrid.tsx`** — שער חי קיים (`components/AppGrid.test.ts`, הבדיקה «⛔ אפס כתיבה»). הרמה חיה **בשרת בלבד**, והלקוח מקבל ממנו מספר או `null`.
- ⛔ **המספר מגיע מהשרת** (D-046): הלקוח ⛔ אינו כותב `3`, ⛔ אינו כותב `1`, ו⛔ אינו משווה ל-`0` במקום ל-`required`.
- ⛔ **`/world` ⛔ אינו `FLOW_ROUTE`** ⇒ ⛔ אפס `data-primary-action` בשני הרכיבים (הגנת F-027 — סימון שאיש אינו מודד הוא טענה ריקה).
- Mobile-First 375px · יעדי מגע 44px (`min-h-touch`) · RTL עם bidi דרך `<EnWord>`/`<EnText>` ⛔ ולא `lang="en"` ביד (T-009) · TypeScript ללא `any`.
- ⛔ **חוקה § 6 · F-011 · F-016**: אפס מרכוז אנכי · אפס גרדיאנט סגול · אפס `backdrop-blur` · `shadow-2xl` · `rotate-` · `perspective` · אפס hex גולמי · אפס `Inter`. ⛔ **אין לערוך את `plan/35-design-constitution.md`.**
- ⛔ **אפס מדד משחק** (D-050 · E4): `xp` · `score` · `points` · `coin` · `streak` · «ניקוד» · «מטבע» · «לוח תוצאות».
- `docs/api-contract.md` מתעדכן **באותו קומיט** של כל שינוי בנקודות קצה.
- כל בדיקת רכיב/נתיב מלבינה הערות **לפני** כל טענה (F-039 · F-065 · F-087), **⛔ אלא כשהטענה היא על ההערה עצמה** (F-088 — שם ההלבנה היא הפגם).
- פקודת האימות המלאה, ⛔ ואין טענת הצלחה בלעדיה:
  `npm run typecheck && npm run check:core && npm test && npm run build`
  ובנוסף `npm run check:mobile` בכל משימה שנוגעת ברכיב.
- ⛔ **בלי `[skip ci]`** (`RULES § 0.7`). ⛔ דוחפים ל-`dev` בלבד.

---

## חמש סטיות מוצהרות, ⛔ ולא השמטות

### סטייה 1 — ספירת הסיפורים יושבת ב-`/api/world/status`, ושני שערים חיים באותו קובץ **חייבים להתחדד** ⛔ ולא להתרכך

שורת T-137 נוקבת ב-`app/api/world/status/route.ts` כמקום הספירה. **נמדד** ב-`app/api/world/status/route.test.ts` ששני שערים חיים שם אוסרים בדיוק את שני המנגנונים שהספירה דורשת:

| השער היום | מה הוא **באמת** טוען | למה הוא חוסם את T-137 |
|---|---|---|
| `expect(CODE).not.toContain('cefr_level')` (שורה 80) | «⛔ `senses.cefr_level` אינו נקרא» (D-034) | ‏`stories.cefr_level` היא **עמודה אחרת לגמרי** — `0018_stories.sql` אומר זאת בהערה שלה עצמה: «⛔ זו ⛔ אינה `senses.cefr_level`». השער חוסם מחרוזת, ⛔ לא את הפגם |
| `expect(CODE).not.toMatch(/head:\s*true/)` + `count: 'exact'` + `.count` (שורות 62–66) | «‏`functionWords`/`activeWords` הם headwords מובחנים, ⛔ ולא שורות» (F-040) | ‏`stories` היא `unique (cefr_level, title_en)` ⇒ **שורה = סיפור**, וספירת שורות שם היא הספירה **הנכונה** |

⇒ שני השערים מוחלפים בגרסה **צרה יותר** בשורה שהם מגנים עליה, ⛔ ולא ברכה יותר: **סריקת שורות**, בדיוק התבנית שכבר חיה באותו קובץ (הבדיקה «⛔ never puts the database message in the response body», שורות 90–96, סורקת שורה-שורה). כל שורה שיש בה `cefr_level` **חייבת** להזכיר `stories`; כל שורה שיש בה `head: true` **חייבת** להזכיר `stories`. ⇒ קריאה של `senses.cefr_level` ⛔ עדיין נופלת, וספירת שורות על `words`/`word_progress` ⛔ עדיין נופלת. **שתי המוטציות האלה נדרשות בצעד המדידה של Task 5 ⛔ ואינן אופציונליות.**

⛔ **החלופה נשקלה ונדחתה במדידה:** נתיב חדש `GET /api/world/library`. שלוש עלויות: ⓐ בקשה חמישית מ-`/world` ורשומת `EXPECTED_CONSOLE` חדשה, בעוד `/api/world/status` **כבר** ברשומה של `/world` (`scripts/verify-mobile.mjs:333`) ⇒ עלות אפס · ⓑ נתיב שמחזיר שדה יחיד הוא בדיוק מה ש-T-133 דחתה בנימוק שנרשם («⛔ אין כאן נקודת קצה חדשה … מגדילה את שטח ה-HTTP בלי ערך») · ⓒ סטייה משורת המשימה. ⇒ הנתיב הקיים, והשערים מתחדדים.

### סטייה 2 — קריאת הספרייה היא **רכה**, ⛔ ולא 503 של כל הנתיב

⚠️ **נמדד ⛔ ולא שוער:** `0018_stories.sql` **טרם הורץ בייצור** (הוא באותה מחלקה של פריטים 40 · 41 ב-`plan/03-for-roy.md` — מיגרציות שממתינות לרוי). ⇒ קריאה קשיחה ל-`stories` הייתה מחזירה `42P01`/`PGRST205`, וה-`schemaAwareFailure` הקיים היה מחזיר **503 לכל הנתיב** — ו-`GET /api/world/status` הוא **הצרכן היחיד של נעילת לשונית «העולם»** (`components/TabBar.tsx:137`, וחוזה `docs/api-contract.md:591`: «כל תשובה שאינה `ok:true` … משאירה את הלשונית **נעולה**»).

⇒ **הוספת אריח הייתה נועלת את הלשונית לכל הלומדים עד שרוי ירוץ מיגרציה.** ⇒ שתי הקריאות החדשות (‏`profiles` · `stories`) **⛔ אינן מחזירות `schemaAwareFailure`**: כישלון של אחת מהן ⇒ `stories: null` בגוף התשובה ⇒ האריח מצייר «—» (‏`kind: 'unknown'`, הכלל הקיים «⛔ «—» ואינו «0»»). שתי הקריאות הישנות ⛔ **לא נגעו**: הן עדיין 503. ⇒ **`return schemaAwareFailure(` נשאר בדיוק פעמיים בקובץ, וזה נמדד בשם.**

### סטייה 3 — `WORLD_APP_HREF.library = '/world/story'` מצביע למסך שטרם קיים, ולכן נולד כאן **רצ׳ט** ⛔ ולא הבטחה

**T-136** (המסך `/world/story`) ⛔ **אינה נלקחת בתוכנית הזאת** — היא חסומה ב-**F-096 🟡** (‏«מה בדיוק נכתב בהקשה על מילה» — הכרעת PM). ⇒ קישור פתוח ל-`/world/story` היום הוא **404**.

**נמדד:** האריח יכול להיות `open` אל `/world/story` **אך ורק** כאשר `atLevel >= required`, כלומר כשיש ≥3 סיפורים ברמת הלומד — וטבלת `stories` **ריקה** (‏`supabase/seed/0004_stories.sql` ⛔ **לא נולד**: `npm run build:stories` עוצר בשם עד שסוכן ה-Content מוסר, C-0247). ⇒ הענף ⛔ **אינו ניתן להגעה בייצור היום**, והענף היחיד שכן פתוח הוא «לומד בלי רמה ⇒ `/study/scan`» (T-137ⓓ), ו-`app/study/scan/page.tsx` **קיים** (T-082, אושר C-0228).

⇒ נולד קובץ בדיקה חדש `lib/core/worldAppsRoutes.test.ts` שהוא **רצ׳ט דו-כיווני**: כל `href` שאינו ב-`PENDING_ROUTES` **חייב** קובץ עמוד על הדיסק, וכל `href` שכן ב-`PENDING_ROUTES` **חייב ⛔ לא** להיות קיים. ⇒ ביום ש-T-136 נוחתת, הבדיקה **נופלת בשם** ומחייבת להוציא את `library` מהרשימה. ⛔ זו ⛔ אינה הערה — היא נופלת.

### סטייה 4 — סף הפתיחה מיובא מ-`STORIES_PER_LEVEL`, ⛔ ואינו קבוע שני

`lib/core/storyGate.ts:27` כבר מחזיק `STORIES_PER_LEVEL = 3` (מכסת הייצור של T-135). § 4.2יג נוקבת ב-«**≥3** סיפורים ברמת הלומד» — **אותו מספר, ומאותו טעם**: האריח נפתח כשמכסת הרמה מלאה. ⇒ הנתיב **מייבא** אותו ⛔ ואינו כותב `3`. ⛔ שני קבועים באותו ערך הם בדיוק החצי שלא יזוז ביום שהמכסה תשתנה.

⚠️ **וזו ⛔ אינה הפרה של `route.test.ts:29`** («owns the two thresholds HERE … ⛔ does not import them from /lib/core»): אותו שער ננעל בשמות `MIN_FUNCTION_WORDS`/`MIN_ACTIVE_WORDS`, והנימוק שלו הוא D-031 — שני **ספי מוצר** שנמדדו מ-403 המשפטים שלנו ואין להם מקור פדגוגי. ‏`STORIES_PER_LEVEL` הוא ההפך: **מכסת תוכן** שכבר נאכפת בשער חי (`scripts/build-stories-sql.test.ts` — «11 או 13 מפילים את הסקריפט בשם»). הבדיקה החדשה נועלת את הכיוון: **`3` ⛔ אינו כתוב בקובץ הנתיב.**

### סטייה 5 — נוסח הכפתור במצב `posts ≥ 1`: **פער מפרט צר, ונרשם ⛔ ולא הושתק**

D-075ⓑ נוקב במפורש בשתי המחרוזות של **הפסקה** («עדיין לא הרכבת משפט» · «המשפט שלך יחזור אליך») ובפעולה (`/world/compose`), ⛔ **ואינו נוקב בתווית הכפתור** במצב השני. ‏`FIRST_SENTENCE_HE = 'כתוב את המשפט הראשון שלך'` הקיים הוא **שקר קטן** ללומד שכתב חמישה משפטים — וזה בדיוק הנוסח ש-F-080 פתחה עליו.

⇒ **הכרעת ביצוע, ⛔ ולא המצאת מסך:** הכפתור, היעד והמצבים הוכרעו כולם ב-D-075; מה שנבחר כאן הוא **מחרוזת אחת** — `WRITE_MORE_HE = 'כתוב עוד משפט'`. ⇒ **נפתח `F-108 🟡 → PM`** בטיק הביצוע של Task 3 (⛔ אינו חוסם: שני המצבים חיים, הפעולה זהה, והנוסח ניתן להחלפה בשורה אחת).

---

## File Structure

| קובץ | אחריות | משימה |
|---|---|---|
| `lib/core/worldRecall.ts` (‏**M**) | ‏`recallCounts()` + חילוץ `isComposed`/`retrievableTarget` שגם `buildRecallCard` קורא — **פרדיקט אחד, שני צרכנים** | 1 |
| `lib/core/worldRecall.test.ts` (‏**M**) | שלוש בדיקות אמת של D-075 + **האינווריאנט** `eligible ≥ required ⟺ card !== null` | 1 |
| `app/api/world/recall/route.ts` (‏**M**) | ‏`counts` בגוף התשובה, מאותן **שתי** קריאות. ⛔ אפס קריאה שלישית | 2 |
| `app/api/world/recall/route.test.ts` (‏**M**) | ‏`.from('` בדיוק פעמיים · `recallCounts(` באתר הקריאה · `required` ⛔ אינו כתוב בקוד | 2 |
| `docs/api-contract.md` (‏**M**) | ‏`GET /api/world/recall` → `counts` · `GET /api/world/status` → `stories` | 2 · 5 |
| `components/RecallCard.tsx` (‏**M**) | פיצול `empty` לשני מצבים לפי `counts`, אותה פעולה יחידה בשניהם | 3 |
| `components/RecallCard.test.ts` (‏**M**) | שני `href={COMPOSE_HREF}` · `counts.required` · **ארבע המילים האסורות** | 3 |
| `lib/core/worldApps.ts` (‏**M**) | ‏`'library'` ב-`WorldAppId`/`ORDER`/`LABEL`/`HREF` · `LEARNING_PRIORITY` חדש · `storiesTooFewNoteHe` · `libraryTile` · `LEVEL_SCAN_HREF` | 4 |
| `lib/core/worldApps.test.ts` (‏**M**) | ארבעה אריחים · סדר D-071ⓐ · שלושת ענפי `libraryTile` | 4 |
| `lib/core/worldAppsRoutes.test.ts` (‏**C**) | רצ׳ט דו-כיווני: `href` ⇄ קובץ עמוד, עם `PENDING_ROUTES` נקוב | 6 |
| `app/api/world/status/route.ts` (‏**M**) | קריאה **רכה** של `profiles.current_level` + ספירת `stories` ⇒ `stories: {required, atLevel} \| null` | 5 |
| `app/api/world/status/route.test.ts` (‏**M**) | שני השערים **מתחדדים** לסריקת שורות · `3` ⛔ אינו בקוד · `schemaAwareFailure` בדיוק פעמיים | 5 |
| `components/AppGrid.tsx` (‏**M**) | בקשה שלישית ל-`/api/world/status` ⇒ אריח רביעי דרך `libraryTile` | 6 |
| `components/AppGrid.test.ts` (‏**M**) | הבקשה קיימת · האריח הרביעי · ⛔ `current_level` עדיין אסור | 6 |

**M** = modify · **C** = create. ⛔ **אפס קובץ SQL, אפס מיגרציה, אפס seed בתוכנית הזאת.**

---

## Task 1: `recallCounts` — פרדיקט הכשירות היחיד  *(T-141ⓐ, השכבה הטהורה)*

**Files:**
- Modify: `lib/core/worldRecall.ts` (הוספת `RECALL_REQUIRED_ELIGIBLE`, `RecallCounts`, `isComposed`, `retrievableTarget`, `recallCounts`; ‏`buildRecallCard` מוסב לקרוא לאותם עוזרים)
- Test: `lib/core/worldRecall.test.ts` (הוספה בסוף הקובץ)

**Interfaces:**
- Consumes: `RecallPost`, `LearnerWord`, `RECALL_OPTION_COUNT`, `ageInDays`, `pickRecallTarget`, `normaliseToken` — כולם כבר קיימים בקובץ.
- Produces:
  ```ts
  export const RECALL_REQUIRED_ELIGIBLE = 1;
  export interface RecallCounts {
    readonly posts: number;     // כמה משפטים הלומד הרכיב אי-פעם (גוף לא ריק)
    readonly eligible: number;  // כמה מהם כשירים לשליפה עכשיו
    readonly required: number;  // תמיד RECALL_REQUIRED_ELIGIBLE. ⛔ מהשרת, ⛔ לא מהלקוח
  }
  export function recallCounts(input: {
    readonly posts: readonly RecallPost[];
    readonly words: readonly LearnerWord[];
    readonly nowMs: number;
  }): RecallCounts;
  ```
  ⛔ `buildRecallCard` **⛔ אינה משנה חתימה ו⛔ אינה משנה התנהגות** — היא רק מפסיקה להחזיק עותק שני של הפרדיקט.

- [ ] **Step 1: כתוב את הבדיקות — הן נופלות כי אין `recallCounts`**

הוסף בסוף `lib/core/worldRecall.test.ts`. ⚠️ עדכן את שורת ה-`import` בראש הקובץ כך שתכלול גם `recallCounts` ו-`RECALL_REQUIRED_ELIGIBLE`.

```ts
/**
 * D-075 — «מה שכתבת אתמול»: **שני מצבים ללומד, ⛔ ולא שלושה.** המונים נגזרים בזמן
 * השאילתה (תבנית D-043) ⛔ ואין להם עמודה, מיגרציה או שדה.
 *
 * ⚠️ **המצב השלישי — «אין מילת יעד במשפט שלך» — ⛔ אסור להיאמר ללומד** (R-016):
 * הוא נספר ב-`posts`, ⛔ אינו נספר ב-`eligible`, והמסך זהה. הבדיקה השלישית כאן היא
 * בדיוק המדידה הזאת.
 */
describe('recallCounts (D-075 · F-080)', () => {
  // ⚠️ שמות ייעודיים ⛔ ולא `NOW`/`WORDS`: הקובץ כבר מגדיר את שניהם ברמת המודול,
  // והצללה בתוך `describe` היא בדיוק סוג הטעות שקוראים אותה שגוי בסקירה.
  const D75_NOW = Date.parse('2026-08-21T09:00:00Z');
  const daysBack = (n: number): string => new Date(D75_NOW - n * 86_400_000).toISOString();

  /** ארבע מילות תוכן בדיוק — הרצפה של `RECALL_OPTION_COUNT` — ומילת תפקוד אחת. */
  const D75_WORDS: readonly LearnerWord[] = [
    { headword: 'garden', band: 'A2', ngslRank: 1800, isFunctionWord: false },
    { headword: 'table', band: 'A1', ngslRank: 900, isFunctionWord: false },
    { headword: 'river', band: 'A2', ngslRank: 1500, isFunctionWord: false },
    { headword: 'market', band: 'A2', ngslRank: 1200, isFunctionWord: false },
    { headword: 'the', band: 'A1', ngslRank: 1, isFunctionWord: true },
  ];

  /** ⛔ אין בו ולו מילת תוכן אחת של הלומד ⇒ ⛔ אין מילת יעד ⇒ ⛔ אינו כשיר. */
  const NO_TARGET = { id: 'a', bodyEn: 'the sun is warm.', createdAt: daysBack(3) };
  /** יש בו יעד, אבל הוא **מהיום** ⇒ ⛔ אינו נבחר (§ 4.2יב) ⇒ ⛔ אינו כשיר. */
  const TODAY = { id: 'b', bodyEn: 'the garden is quiet.', createdAt: daysBack(0) };
  /** יש בו יעד והוא בן שלושה ימים ⇒ **כשיר**. */
  const READY = { id: 'c', bodyEn: 'the garden is quiet.', createdAt: daysBack(3) };

  it('⛔ אפס משפטים ⇒ posts=0 · eligible=0 · required מהשרת', () => {
    expect(recallCounts({ posts: [], words: D75_WORDS, nowMs: D75_NOW })).toEqual({
      posts: 0,
      eligible: 0,
      required: RECALL_REQUIRED_ELIGIBLE,
    });
  });

  it('שני משפטים ו⛔ אף אחד כשיר ⇒ posts=2 · eligible=0 — וזה ⛔ אינו «אפס משפטים»', () => {
    const counts = recallCounts({ posts: [NO_TARGET, TODAY], words: D75_WORDS, nowMs: D75_NOW });
    expect(counts.posts).toBe(2);
    expect(counts.eligible).toBe(0);
  });

  it('שני משפטים ואחד כשיר ⇒ posts=2 · eligible=1', () => {
    const counts = recallCounts({ posts: [NO_TARGET, READY], words: D75_WORDS, nowMs: D75_NOW });
    expect(counts.posts).toBe(2);
    expect(counts.eligible).toBe(1);
  });

  it('גוף ריק ⛔ אינו משפט שהלומד הרכיב — `posts` סופר גוף לא-ריק בלבד', () => {
    const blank = { id: 'd', bodyEn: '   ', createdAt: daysBack(2) };
    expect(recallCounts({ posts: [READY, blank], words: D75_WORDS, nowMs: D75_NOW }).posts).toBe(1);
  });

  it('פחות מארבע מילות תוכן ⇒ eligible=0 גם כשיש יעד — ארבע אפשרויות הן הרצפה', () => {
    const three = D75_WORDS.filter((w) => !w.isFunctionWord).slice(0, 3);
    expect(recallCounts({ posts: [READY], words: three, nowMs: D75_NOW }).eligible).toBe(0);
  });

  /**
   * ⚠️ **האינווריאנט, וזו הבדיקה היחידה כאן שאינה יכולה להירקב בשקט:** `eligible`
   * ו-`buildRecallCard` **חייבים** לענות על אותה שאלה. שני עותקים של הפרדיקט הם
   * בדיוק החצי שלא יזוז — ולכן שניהם קוראים ל-`retrievableTarget` היחיד.
   */
  it('`eligible ≥ required` ⟺ יש כרטיס — ⛔ פרדיקט אחד, ⛔ ולא שני עותקים', () => {
    const cases: readonly { readonly posts: readonly RecallPost[]; readonly words: readonly LearnerWord[] }[] = [
      { posts: [], words: D75_WORDS },
      { posts: [NO_TARGET, TODAY], words: D75_WORDS },
      { posts: [NO_TARGET, READY], words: D75_WORDS },
      { posts: [READY], words: D75_D75_WORDS.filter((w) => !w.isFunctionWord).slice(0, 3) },
    ];
    for (const [i, input] of cases.entries()) {
      const counts = recallCounts({ ...input, nowMs: D75_NOW });
      const card = buildRecallCard({ ...input, nowMs: D75_NOW, seed: 7 });
      expect(counts.eligible >= counts.required, `מקרה ${i}`).toBe(card !== null);
    }
  });
});
```

- [ ] **Step 2: הרץ ואמת שהן נופלות — ⛔ ובסיבה הנכונה**

```bash
npx vitest run lib/core/worldRecall.test.ts
```
צפוי: כישלון **הידור/ייבוא** — `recallCounts is not exported` / `RECALL_REQUIRED_ELIGIBLE is not defined`. ⛔ אם הכישלון הוא משהו אחר — עצור ואבחן לפני שאתה כותב שורת מימוש (`superpowers:systematic-debugging`).

- [ ] **Step 3: כתוב את המימוש**

ב-`lib/core/worldRecall.ts`, **מיד אחרי** `segmentsAround` (סוף שורה ~198) ולפני `buildRecallCard`:

```ts
/** ⛔ מהשרת, ⛔ ולא קבוע בלקוח (D-046 · D-075ⓐ). כרטיס אחד ליום ⇒ הרצפה היא 1. */
export const RECALL_REQUIRED_ELIGIBLE = 1;

/**
 * שלושת המונים של D-075ⓐ. ⛔ **אפס עמודה · אפס מיגרציה · אפס שדה** — הכל נגזר
 * בזמן השאילתה מאותן שורות שהנתיב כבר קרא (תבנית D-043).
 */
export interface RecallCounts {
  /** כמה משפטים הלומד הרכיב אי-פעם. גוף ריק ⛔ אינו משפט שהורכב. */
  readonly posts: number;
  /** כמה מהם כשירים לשליפה **עכשיו**. ⛔ המצב «אין מילת יעד» נספר ב-`posts` ⛔ ולא כאן. */
  readonly eligible: number;
  /** `RECALL_REQUIRED_ELIGIBLE`. עובר על החוט כדי שהמסך ⛔ לא יחזיק עותק (D-046). */
  readonly required: number;
}

/** משפט שהלומד באמת הרכיב. ⛔ גוף ריק ⛔ אינו הפקה. */
function isComposed(post: RecallPost): boolean {
  return typeof post?.bodyEn === 'string' && post.bodyEn.trim() !== '';
}

/**
 * ⛔ **הפרדיקט היחיד של «כשיר לשליפה», ולכן הוא ⛔ אינו מוכפל.** `recallCounts`
 * ו-`buildRecallCard` קוראות **לו**, וכל היום שבו הכלל ישתנה הוא יזוז פעם אחת.
 * הוא ⛔ אינו בודק את מאגר האפשרויות — זו טענה על **הלומד** ⛔ ולא על המשפט,
 * ולכן היא נבדקת פעם אחת אצל הקורא.
 */
function retrievableTarget(
  post: RecallPost,
  words: readonly LearnerWord[],
  nowMs: number,
): { readonly answer: string; readonly segments: readonly RecallSegment[] } | null {
  if (!isComposed(post)) return null;
  // משפט מהיום ⛔ אינו נבחר — הוא עדיין בזיכרון (§ 4.2יב).
  if (ageInDays(post.createdAt, nowMs) <= 0) return null;
  const target = pickRecallTarget(post.bodyEn, words);
  if (target === null) return null;
  const answer = normaliseToken(target.headword);
  const segments = segmentsAround(post.bodyEn, answer);
  if (segments === null) return null;
  return { answer, segments };
}

/**
 * D-075ⓐ. ⚠️ **`eligible` ⛔ אינו «כמה משפטים יש» פחות משהו** — הוא ספירה של אותו
 * פרדיקט שבונה את הכרטיס, ולכן `eligible ≥ required` ⟺ יש כרטיס. האינווריאנט הזה
 * נמדד בבדיקה בשם ⛔ ואינו הבטחה.
 */
export function recallCounts(input: {
  readonly posts: readonly RecallPost[];
  readonly words: readonly LearnerWord[];
  readonly nowMs: number;
}): RecallCounts {
  const composed = input.posts.filter(isComposed);
  // פחות מארבע מילות תוכן ⇒ ⛔ אין כרטיס בכלל, ולכן ⛔ אין משפט כשיר — טענה על
  // הלומד, ⛔ ולא על המשפט, ולכן היא כאן ⛔ ולא בתוך הפרדיקט.
  const pool = contentWords(input.words).size;
  const eligible =
    pool < RECALL_OPTION_COUNT
      ? 0
      : composed.filter((post) => retrievableTarget(post, input.words, input.nowMs) !== null).length;
  return { posts: composed.length, eligible, required: RECALL_REQUIRED_ELIGIBLE };
}
```

**ובאותו צעד — `buildRecallCard` מפסיקה להחזיק את העותק השני.** החלף את גוף הלולאה (שורות ~218–249 היום) בזה, ⛔ בלי לשנות את החתימה ובלי לשנות התנהגות:

```ts
export function buildRecallCard(input: {
  readonly posts: readonly RecallPost[];
  readonly words: readonly LearnerWord[];
  readonly nowMs: number;
  readonly seed: number;
}): RecallCard | null {
  const pool = [...contentWords(input.words).keys()];
  if (pool.length < RECALL_OPTION_COUNT) return null;

  const dated = input.posts
    .filter(isComposed)
    .map((post) => ({ post, daysAgo: ageInDays(post.createdAt, input.nowMs) }))
    .filter((entry) => entry.daysAgo > 0)
    .sort((a, b) => {
      const byAge = compareKeys(agePreferenceKey(a.daysAgo), agePreferenceKey(b.daysAgo));
      return byAge !== 0 ? byAge : a.post.id.localeCompare(b.post.id);
    });

  for (const entry of dated) {
    // ⛔ אותו פרדיקט בדיוק ש-`recallCounts` סופר. ⛔ אין כאן עותק שני.
    const hit = retrievableTarget(entry.post, input.words, input.nowMs);
    if (hit === null) continue;

    const rnd = mulberry32(input.seed);
    const wrong = shuffle(
      pool.filter((headword) => headword !== hit.answer),
      rnd,
    ).slice(0, RECALL_OPTION_COUNT - 1);
    if (wrong.length < RECALL_OPTION_COUNT - 1) continue;

    return {
      postId: entry.post.id,
      bodyEn: entry.post.bodyEn,
      daysAgo: entry.daysAgo,
      answer: hit.answer,
      options: shuffle([hit.answer, ...wrong], rnd),
      segments: hit.segments,
    };
  }
  return null;
}
```

⚠️ `contentWords` מחזירה `Map` ⇒ ב-`recallCounts` נעשה שימוש ב-`.size` וב-`buildRecallCard` ב-`[...keys()]`. שתיהן קוראות לאותה פונקציה — ⛔ אין הגדרה שנייה.

- [ ] **Step 4: הרץ את הבדיקות ואת שער הטוהר**

```bash
npx vitest run lib/core/worldRecall.test.ts && npm run check:core
```
צפוי: כל הבדיקות בקובץ עוברות (**הישנות והחדשות** — הרגרסיה על `buildRecallCard` היא מחצית הצעד), ו-`/lib/core purity: OK`.

- [ ] **Step 5: שלוש מוטציות, וכל אחת חייבת להפיל בדיקה **בשם** (F-088 · F-105)**

הרץ אחת-אחת, רשום את שם הבדיקה שנפלה, והחזר:

| # | המוטציה | הבדיקה שחייבת ליפול |
|---|---|---|
| 1 | ‏`posts: composed.length` ⇒ `posts: input.posts.length` | «גוף ריק ⛔ אינו משפט שהלומד הרכיב» |
| 2 | הסר את `pool < RECALL_OPTION_COUNT ? 0 :` מ-`recallCounts` | «פחות מארבע מילות תוכן ⇒ eligible=0» **וגם** האינווריאנט |
| 3 | ב-`retrievableTarget`: `ageInDays(...) <= 0` ⇒ `< 0` | «שני משפטים ו⛔ אף אחד כשיר» |

⛔ **מוטציה שלא הפילה דבר היא ממצא ⛔ ולא הערה** — פתח שורה ב-`plan/60-findings.md` ותקן את הבדיקה, ⛔ לא את הקוד.

- [ ] **Step 6: קומיט**

```bash
git add lib/core/worldRecall.ts lib/core/worldRecall.test.ts
git commit -m "loop(DEV): C-XXXX T-141a — recallCounts: פרדיקט כשירות אחד לשני צרכנים"
```

---

## Task 2: `GET /api/world/recall` מוסר `counts`  *(T-141ⓐ הנתיב · T-141ⓓ החוזה)*

**Files:**
- Modify: `app/api/world/recall/route.ts` (שורות 108–119)
- Modify: `app/api/world/recall/route.test.ts`
- Modify: `docs/api-contract.md` (‏§ `GET /api/world/recall`, שורה 738 ואילך)

**Interfaces:**
- Consumes: `recallCounts` מ-Task 1.
- Produces: גוף התשובה `{ ok: true, card: RecallCard | null, counts: RecallCounts }` — Task 3 קורא בדיוק את זה.

- [ ] **Step 1: כתוב את הבדיקות — הן נופלות**

הוסף ל-`app/api/world/recall/route.test.ts` בתוך ה-`describe` הקיים:

```ts
  it('מוסר `counts` מהשכבה הטהורה ⛔ ואינו סופר בעצמו (D-075ⓐ)', () => {
    expect(CODE).toMatch(/recallCounts\(/);
    expect(CODE).toMatch(/counts/);
  });

  it('⛔ אפס קריאה שלישית — המונים נגזרים מאותן שתי קריאות (תבנית D-043)', () => {
    // ⚠️ נמדד באתר הקריאה ⛔ ולא בשם: `.from('` הוא כל שאילתה בקובץ. שלוש ⇒ עמודה
    // או טבלה חדשה נכנסו מהדלת האחורית, וזה בדיוק מה ש-D-075 אוסר.
    expect(CODE.match(/\.from\('/g) ?? []).toHaveLength(2);
  });

  it('⛔ `required` אינו כתוב בקוד הנתיב — הוא מגיע מהשכבה הטהורה (D-046)', () => {
    expect(CODE).not.toMatch(/required\s*:\s*\d/);
  });
```

⚠️ ודא ש-`CODE` בקובץ הזה הוא הגרסה **המולבנת מהערות** (הוא כזה היום). אם לא — אל תמשיך; זה F-087.

- [ ] **Step 2: הרץ ואמת שהן נופלות**

```bash
npx vitest run app/api/world/recall/route.test.ts
```
צפוי: שתי נפילות — «מוסר `counts`» (‏`recallCounts(` לא נמצא). ⚠️ «⛔ אפס קריאה שלישית» ו-«`required` אינו כתוב» **ירוקות כבר עכשיו** — הן **רצ׳ט**, ⛔ לא TDD, וזה נאמר כאן כדי שירוק לא ייקרא כיסוי.

- [ ] **Step 3: כתוב את המימוש**

ב-`app/api/world/recall/route.ts`, שנה את שורת ה-`import` בראש הקובץ:

```ts
import {
  buildRecallCard,
  recallCounts,
  type LearnerWord,
  type RecallPost,
} from '@/lib/core/worldRecall';
```

והחלף את הבלוק בשורות 108–119 בזה:

```ts
  // ⛔ אין `Math.random` בשכבה הטהורה — ה-seed נגזר כאן, בדיוק כמו `arcade/round`.
  const seed = Date.now() >>> 0;
  const nowMs = Date.now();
  const card = buildRecallCard({ posts: recallPosts, words: learnerWords, nowMs, seed });

  // D-075ⓐ — ⛔ **אפס קריאה שלישית ואפס עמודה**: שלושת המונים נגזרים מאותן שתי
  // התוצאות שכבר בזיכרון (תבנית D-043). ⛔ `required` מגיע מהשכבה הטהורה ⛔ ואינו
  // נכתב כאן, כדי שהמסך יקבל מספר ⛔ ולא יחזיק עותק (D-046).
  const counts = recallCounts({ posts: recallPosts, words: learnerWords, nowMs });

  // ⛔ `card: null` ⛔ ואינו 404: «אין מה להיזכר בו היום» אינו שגיאה, ומסך שמקבל 404
  // מצייר כשל (§ 4.2יב). ⚠️ ומאז D-075 הוא ⛔ אינו לבד: `counts` הוא מה שמבדיל בין
  // «עדיין לא הרכבת משפט» לבין «המשפט שלך יחזור אליך».
  return NextResponse.json({ ok: true, card, counts });
```

⚠️ שתי הקריאות ל-`Date.now()` הפכו לאחת בשם `nowMs` **בכוונה**: קריאה נפרדת לכל צרכן יכולה ליפול משני צדי חצות ולהחזיר `card !== null` עם `eligible = 0`. ⛔ ה-`seed` נשאר קריאה משלו — הוא **אינו** שעון, הוא זרע.

- [ ] **Step 4: עדכן את `docs/api-contract.md` — באותו קומיט**

ב-§ `GET /api/world/recall`, אחרי בלוק ה-JSON של «200 — יש כרטיס», הוסף:

```markdown
⚠️ **`counts` — שלושה מונים, ⛔ ואפס עמודה (D-075ⓐ · פותר F-080 🟡).** כל תשובת `ok:true`
נושאת `counts: { posts, eligible, required }`, **נגזרים בזמן השאילתה מאותן שתי הקריאות**
(תבנית D-043) — ⛔ אין עמודה חדשה, ⛔ אין מיגרציה ו⛔ אין קריאה שלישית.

* `posts` — כמה משפטים הלומד הרכיב אי-פעם (גוף לא ריק). ⛔ גוף ריק אינו הפקה.
* `eligible` — כמה מהם כשירים לשליפה **עכשיו**: הורכב · ⛔ אינו מהיום · יש בו מילת יעד ·
  ולומד עם פחות מ-`RECALL_OPTION_COUNT` מילות תוכן ⇒ `0`. **אותו פרדיקט בדיוק** שבונה את
  הכרטיס ⇒ `eligible >= required` ⟺ `card !== null`, ונמדד בבדיקה בשם.
* `required` — `1`, **מהשרת** ⛔ ולא קבוע בלקוח (D-046).

⚠️ **המצב «במשפט שלך אין מילת יעד» ⛔ אינו שדה ו⛔ אינו קוד — ולעולם לא יהיה** (‏D-075ⓑ ·
**R-016**): הוא משוב על ההפקה של הלומד, ואין לנו מקור מורשה לכזה. הוא **נספר ב-`posts`,
⛔ אינו נספר ב-`eligible`**, והמסך שהלומד רואה זהה למצב «יש משפטים וכולם נחו».

```json
{ "ok": true, "card": null, "counts": { "posts": 2, "eligible": 0, "required": 1 } }
```
```

⚠️ עדכן גם את שני בלוקי ה-JSON הקיימים בסעיף (`יש כרטיס` ו-`אין כרטיס היום`) כך שיכללו `counts` — חוזה שמראה גוף ישן הוא חוזה שקרי.

- [ ] **Step 5: הרץ את הבדיקות**

```bash
npx vitest run app/api/world/recall/route.test.ts && npx vitest run lib/core/worldRecall.test.ts
```
צפוי: הכל ירוק.

- [ ] **Step 6: מוטציה אחת, רשומה**

הוסף קריאה שלישית פיקטיבית (`await supabase.from('profiles').select('id')`) ⇒ הבדיקה «⛔ אפס קריאה שלישית» חייבת ליפול עם `expected 3 to have length 2`. החזר.

- [ ] **Step 7: קומיט**

```bash
git add app/api/world/recall/route.ts app/api/world/recall/route.test.ts docs/api-contract.md
git commit -m "loop(DEV): C-XXXX T-141a — /api/world/recall מוסר counts + חוזה"
```

---

## Task 3: `<RecallCard>` — שני מצבים, ⛔ ולא אחד  *(T-141ⓑ · ⓒ · ⓔ)*

**Files:**
- Modify: `components/RecallCard.tsx`
- Modify: `components/RecallCard.test.ts`

**Interfaces:**
- Consumes: `{ ok: true, card, counts: { posts, eligible, required } }` מ-Task 2.
- Produces: ⛔ כלום לצרכן אחר. זהו עלה.

- [ ] **Step 1: כתוב את הבדיקות — שלוש נופלות**

הוסף ל-`components/RecallCard.test.ts` בתוך ה-`describe` הקיים:

```ts
  it('⛔ שני מצבים ⛔ ולא אחד, ושניהם מובילים לאותה פעולה יחידה (D-075ⓑ · D-066)', () => {
    expect(CODE).toContain('עדיין לא הרכבת משפט');
    expect(CODE).toContain('המשפט שלך יחזור אליך');
    // ⚠️ נמדד באתר השימוש ⛔ ולא בשם הקבוע: שתי פעולות, ⛔ ולא אחת ו⛔ ולא שלוש.
    // ⛔ «מסך מת שממתין למחר» הוא בדיוק מה ש-D-066 אוסר.
    expect(CODE.match(/href=\{COMPOSE_HREF\}/g) ?? []).toHaveLength(2);
  });

  it('הסף מגיע מהשרת ⛔ ואינו כתוב בלקוח (D-046 · D-075ⓐ)', () => {
    expect(CODE).toContain('counts.required');
    // ⛔ השוואה ל-0 היא הסף שהלקוח המציא — בדיוק מה ש-D-046 בא למנוע.
    expect(CODE).not.toMatch(/eligible\s*[<>=!]==?\s*0/);
  });

  it('⛔ ארבע המילים האסורות — משוב על ההפקה ⛔ אינו נאמר לעולם (R-016 · D-075ⓑ)', () => {
    // ⚠️ נמדד על המקור **המולבן**: הערה ⛔ אינה מוצגת ללומד, ושער שהערה מפילה אותו
    // הוא רעש (F-065). מה שנמדד כאן הוא **הנוסח על המסך**.
    for (const banned of [/מילת\s+ה?יעד/, /לא הכיל/, /לא מתאים/, /נכון/]) {
      expect(CODE, `⛔ ${banned} — משוב על ההפקה (R-016)`).not.toMatch(banned);
    }
  });

  it('⛔ אפס `data-primary-action` — `/world` אינו FLOW_ROUTE (הגנת F-027)', () => {
    expect(CODE).not.toContain('data-primary-action');
  });
```

- [ ] **Step 2: הרץ ואמת שהן נופלות — ⛔ ובסיבה הנכונה**

```bash
npx vitest run components/RecallCard.test.ts
```
צפוי:
* «⛔ שני מצבים» — נופלת: `'עדיין לא הרכבת משפט'` לא נמצא, ו-`href={COMPOSE_HREF}` מופיע **פעם אחת**.
* «הסף מגיע מהשרת» — נופלת: `counts.required` לא נמצא.
* «⛔ ארבע המילים האסורות» ו-«⛔ אפס `data-primary-action`» — ⚠️ **ירוקות כבר עכשיו** (אומת במדידה על המקור המולבן). הן **רצ׳ט**, והמוטציה בצעד 5 היא מה שמוכיח שהן יכולות ליפול.

- [ ] **Step 3: כתוב את המימוש**

ב-`components/RecallCard.tsx`:

**ⓐ** החלף את הקבועים `EMPTY_HE` ו-`FIRST_SENTENCE_HE` (שורות 51–52) בארבעה:

```ts
/** D-075ⓑ — `posts = 0`. ⛔ הנוסח נקוב בהכרעה ⛔ ואינו נבחר כאן. */
const NO_POSTS_HE = 'עדיין לא הרכבת משפט';
/** D-075ⓑ — `posts ≥ 1 && eligible < required`. ⛔ ולא «אין מילה מתאימה» (R-016). */
const WILL_RETURN_HE = 'המשפט שלך יחזור אליך';
const FIRST_SENTENCE_HE = 'כתוב את המשפט הראשון שלך';
/** ⚠️ D-075 נוקבת ביעד ⛔ ולא בתווית. ⛔ «הראשון» ללומד שכתב חמישה הוא בדיוק
 *  השקר הקטן ש-F-080 פתחה עליו ⇒ **F-108 🟡 → PM**. הפעולה זהה בשני המצבים. */
const WRITE_MORE_HE = 'כתוב עוד משפט';
```

**ⓑ** החלף את `RecallBody` ו-`ScreenState` (שורות 58–69):

```ts
/** בדיוק מה ש-`GET /api/world/recall` עונה (`docs/api-contract.md`), ⛔ ולא יותר. */
type RecallCounts = {
  readonly posts: number;
  readonly eligible: number;
  /** ⛔ **מהשרת** (D-046). המסך ⛔ אינו מחזיק עותק של הסף. */
  readonly required: number;
};

type RecallBody =
  | { readonly ok: true; readonly card: RecallCardData | null; readonly counts: RecallCounts }
  | { readonly ok: false; readonly code: string; readonly message?: string };

type ScreenState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'card'; readonly card: RecallCardData }
  /**
   * ⛔ **שני מצבים ללומד ⛔ ולא שלושה** (D-075ⓑ). `posts` הוא כל ההבדל, ו-
   * ⛔ **המצב «אין מילת יעד» ⛔ אינו קיים כאן ולעולם לא יהיה** — הוא משוב על ההפקה
   * של הלומד, ו-R-016 קובעת שאין לנו מקור מורשה לכזה. הוא נספר ב-`posts` ⛔ ואינו
   * נספר ב-`eligible`, והלומד רואה בדיוק את אותו מסך — **כי הפעולה שלו זהה**.
   */
  | { readonly kind: 'empty'; readonly posts: number }
  | { readonly kind: 'session_expired' }
  | { readonly kind: 'schema_missing' }
  | { readonly kind: 'error' };
```

**ⓒ** ב-`load`, החלף את שורת ההכרעה (שורה 195 היום — `setState(body.card === null ? …)`) **בבלוק הזה ובו בלבד**:

```ts
      if (body.card !== null) {
        setState({ kind: 'card', card: body.card });
        return;
      }
      // ⛔ **הסף מגיע מהשרת** (D-046): `counts.required` ⛔ ולא «0» שהלקוח המציא —
      // הלקוח ⛔ אינו יודע ש-«1», ו⛔ אינו רשאי לדעת. ⛔ תשובה בלי `counts` (חוזה
      // ישן) ⇒ `0` ⇒ המצב המזמין, שהוא ⛔ אינו טוען דבר על מה שהלומד עשה.
      const counts = body.counts;
      const dryPosts =
        counts !== undefined && counts.eligible < counts.required ? counts.posts : 0;
      setState({ kind: 'empty', posts: dryPosts });
```

⚠️ ‏`counts.required` **נקרא במסלול** ⛔ ואינו רק מוכרז בטיפוס — זו בדיוק ההבחנה של F-039: שם שקיים בקובץ ⛔ אינו קריאה שקרתה.

**ⓓ** החלף את בלוק `state.kind === 'empty'` (שורות 226–235) בשני הענפים:

```tsx
      {state.kind === 'empty' && (
        // ⛔ לא מסך ריק ו⛔ לא «בקרוב» (D-046), ו⛔ לא מסך מת שממתין למחר (D-066):
        // בשני המצבים הפעולה של הלומד **זהה** — להרכיב עוד משפט — ולכן הכפתור אחד
        // והיעד אחד. מה שמשתנה הוא המשפט, ⛔ ולא הדרך קדימה.
        <div className="flex flex-col items-start gap-3">
          <p className="text-lg leading-relaxed text-ink">
            {state.posts === 0 ? NO_POSTS_HE : WILL_RETURN_HE}
          </p>
          {state.posts === 0 ? (
            <Link href={COMPOSE_HREF} className={PRIMARY_ACTION_CLASS}>
              {FIRST_SENTENCE_HE}
            </Link>
          ) : (
            <Link href={COMPOSE_HREF} className={PRIMARY_ACTION_CLASS}>
              {WRITE_MORE_HE}
            </Link>
          )}
        </div>
      )}
```

**ⓔ** עדכן את הערת ראש הקובץ: מחק את פסקת «⚠️ **`card: null` ⇒ … וזה F-080**» (שורות 40–43) והחלף ב:

```
 * ⚠️ **שני מצבים ⛔ ולא אחד — D-075, וזה סוגר את F-080 🟡.** `GET /api/world/recall`
 * מוסר `counts: {posts, eligible, required}`, ולכן «עדיין לא הרכבת משפט» ו«המשפט שלך
 * יחזור אליך» חדלו להיראות זהים. ⛔ **המצב השלישי — «במשפט שלך אין מילה מתאימה» —
 * ⛔ אינו נאמר ולעולם לא ייאמר**: הוא משוב על ההפקה של הלומד, ו-R-016 קובעת שאין לנו
 * מקור מורשה לכזה. הוא נספר ב-`posts`, ⛔ אינו נספר ב-`eligible`, והמסך זהה — **כי
 * הפעולה זהה.** ⛔ הפרדה שאין אחריה פעולה שונה ⛔ אינה מידע, היא שיפוט.
```

- [ ] **Step 4: הרץ את הבדיקות ואת `tsc`**

```bash
npx vitest run components/RecallCard.test.ts && npm run typecheck
```
צפוי: כל הבדיקות בקובץ עוברות, ‏`tsc --noEmit` יוצא **0**.

- [ ] **Step 5: שלוש מוטציות, רשומות**

| # | המוטציה | הבדיקה שחייבת ליפול |
|---|---|---|
| 1 | אחד משני הענפים ב-ⓓ נמחק (מצב אחד חוזר) | «⛔ שני מצבים» — `expected 1 to have length 2` |
| 2 | ‏`counts.eligible < counts.required` ⇒ `counts.eligible < 1` | «הסף מגיע מהשרת» — `counts.required` לא נמצא |
| 3 | הוסף ענף שלישי עם הנוסח `'המשפט שכתבת לא הכיל מילת יעד'` | «⛔ ארבע המילים האסורות» — ‏`/מילת\s+ה?יעד/` **וגם** `/לא הכיל/` |

- [ ] **Step 6: `check:mobile` — כאן הטענה על 375px נסגרת**

```bash
npm run build && npm run check:mobile
```
⚠️ **חובה `npm run build` לפניו** — ההרנס מריץ `next start` על ה-build הקיים ו⛔ אינו בונה (`30-architecture` § 3.1.67, הלקח של C-0220). רשום את מספר הבדיקות שעבר. ⛔ **ירידה במספר היא רגרסיה** ⛔ ולא רעש.

- [ ] **Step 7: פתח את F-108 וקומיט**

הוסף שורה ל-`plan/60-findings.md` (8 תאים בדיוק — F-094):

```
| F-108 | 🟡 MEDIUM · **פער מפרט צר (תווית כפתור שלא הוכרעה) · נפתח על ידי DEV (C-XXXX, טיק ביצוע)** | `plan/40-decisions.md` D-075ⓑ · `components/RecallCard.tsx` (`WRITE_MORE_HE`) | **D-075ⓑ נוקבת בשתי מחרוזות הפסקה ובפעולה (`/world/compose`), ⛔ ואינה נוקבת בתווית הכפתור במצב `posts ≥ 1`** | הלומד שכתב חמישה משפטים מקבל כפתור בנוסח «כתוב את המשפט **הראשון** שלך» — ⛔ שקר קטן, ובדיוק הנוסח ש-F-080 פתחה עליו. ⇒ ה-Dev בחר `'כתוב עוד משפט'` כדי ⛔ לא לשכפל את הפגם | ה-PM נוקב בתווית, או מאשר את הקיימת. ⛔ שינוי של שורה אחת | 🔓 פתוח → **PM**. ⛔ **אינו חוסם:** שני המצבים חיים, הפעולה זהה בשניהם, והנוסח בר-החלפה בשורה אחת | 0 |
```

```bash
git add components/RecallCard.tsx components/RecallCard.test.ts plan/60-findings.md
git commit -m "loop(DEV): C-XXXX T-141b+c — RecallCard: שני מצבים לפי counts (F-080 נסגר)"
```

---

## Task 4: `lib/core/worldApps.ts` מקבל את «הספרייה»  *(T-137ⓐ · ⓑ · ⓓ, השכבה הטהורה)*

**Files:**
- Modify: `lib/core/worldApps.ts`
- Modify: `lib/core/worldApps.test.ts`

**Interfaces:**
- Consumes: `AppState` הקיים (`open` · `locked` · `unknown`).
- Produces:
  ```ts
  export type WorldAppId = 'compose' | 'arcade' | 'collected' | 'library';
  export const LEVEL_SCAN_HREF = '/study/scan';
  export function storiesTooFewNoteHe(required: number, atLevel: number): string;
  export interface StoriesStatus {
    readonly required: number;
    readonly atLevel: number | null; // null ⇒ ללומד אין `current_level` עדיין
  }
  export function libraryTile(status: StoriesStatus | null): {
    readonly state: AppState;
    readonly href: string;
  };
  ```

- [ ] **Step 1: כתוב את הבדיקות — הן נופלות**

**ⓐ** עדכן את שתי הבדיקות הקיימות ב-`lib/core/worldApps.test.ts` (שורות 26–31 ו-106–110). ⚠️ **הנוסח «⛔ ואין רביעי» בטל בהוראת D-074ⓑ** — «§ 4.2יג גוברת עליו»:

```ts
  // ⚠️ **שלושה ⇒ ארבעה, D-074ⓑ.** «אריח נכנס לרשת אם ורק אם יש לו משימה, שורה
  // בטבלת הצימוד של D-054, ותנאי פתיחה מדיד ונקוב במספר» — והספרייה עומדת
  // בשלושתם מ-C-0239 (‏T-134…T-137 · שורת D-054 · «נדרשים 3 סיפורים ברמה שלך, יש N»).
  // ⛔ הנוסח «⛔ אין רביעי» ב-§ 4.2יא **בטל** — § 4.2יג גוברת עליו.
  it('⛔ בדיוק ארבעה אריחים, וסדר הרשת = סדר הפתיחה (D-074ⓑ · § 4.2יג)', () => {
    expect([...WORLD_APP_ORDER]).toEqual(['compose', 'arcade', 'collected', 'library']);
    expect(Object.keys(WORLD_APP_HREF).sort()).toEqual([
      'arcade',
      'collected',
      'compose',
      'library',
    ]);
    expect(WORLD_APP_HREF.compose).toBe('/world/compose');
    expect(WORLD_APP_HREF.arcade).toBe('/arcade');
    expect(WORLD_APP_HREF.collected).toBe('/world/collected');
    expect(WORLD_APP_HREF.library).toBe('/world/story');
  });
```

```ts
  it('`LEARNING_PRIORITY` — קריאה בהקשר היא **תרגול** ⛔ ולא צפייה (T-137ⓑ · D-071ⓐ)', () => {
    expect([...LEARNING_PRIORITY]).toEqual(['arcade', 'library', 'compose', 'collected']);
    expect(new Set(LEARNING_PRIORITY).size).toBe(LEARNING_PRIORITY.length);
    expect(LEARNING_PRIORITY.length).toBe(WORLD_APP_ORDER.length);
    for (const id of LEARNING_PRIORITY) expect(WORLD_APP_ORDER).toContain(id);
  });
```

**ⓑ** הוסף `describe` חדש בסוף הקובץ. ⚠️ עדכן את שורת ה-`import` שתכלול `libraryTile`, `storiesTooFewNoteHe`, `LEVEL_SCAN_HREF`:

```ts
/**
 * אריח «הספרייה» — § 4.2יג · D-074ⓑ · D-046. שלושה ענפים בדיוק, ⛔ ואין רביעי.
 */
describe('libraryTile (T-137ⓒ · ⓓ)', () => {
  it('⛔ פחות מהנדרש ⇒ מושבת **עם שני המספרים**, ⛔ ולא «בקרוב» (D-046)', () => {
    const tile = libraryTile({ required: 3, atLevel: 1 });
    expect(tile.state.kind).toBe('locked');
    const note = tile.state.kind === 'locked' ? tile.state.noteHe : '';
    expect(note).toContain('3');
    expect(note).toContain('1');
    expect(note).toMatch(/\d/);
    expect(tile.href).toBe(WORLD_APP_HREF.library);
  });

  it('הנוסח נבנה משני מספרים ⛔ ואינו כותב אף אחד מהם בקוד', () => {
    // ⚠️ נמדד בשני ערכים שונים ⛔ ולא באחד: פונקציה שמחזירה מחרוזת קבועה עוברת
    // בדיקה של ערך יחיד (F-105 — קלט שנבנה מהקבוע הנמדד ⛔ אינו מדידה).
    expect(storiesTooFewNoteHe(3, 1)).not.toBe(storiesTooFewNoteHe(5, 2));
    expect(storiesTooFewNoteHe(5, 2)).toContain('5');
    expect(storiesTooFewNoteHe(5, 2)).toContain('2');
  });

  it('הגיע לסף ⇒ פתוח אל המסך (§ 4.2יג — «מגיעים מאריח»)', () => {
    const tile = libraryTile({ required: 3, atLevel: 3 });
    expect(tile.state.kind).toBe('open');
    expect(tile.href).toBe(WORLD_APP_HREF.library);
  });

  it('⛔ לומד בלי רמה ⛔ אינו נחסם — הוא נשלח לסריקת הרמה (T-137ⓓ · T-082)', () => {
    const tile = libraryTile({ required: 3, atLevel: null });
    expect(tile.state.kind).toBe('open');
    expect(tile.href).toBe(LEVEL_SCAN_HREF);
    expect(tile.href).not.toBe(WORLD_APP_HREF.library);
  });

  it('קריאה שנכשלה ⇒ «—» ⛔ ולא «0» — מספר שאין לנו אינו אפס', () => {
    expect(libraryTile(null).state.kind).toBe('unknown');
  });

  it('⛔ הספרייה ⛔ אינה נוגעת בזירה — D-054: 🔗 מצומדת לצד הלימודי', () => {
    // סריקת מקור: הגבול נאכף **בהיעדר**, בדיוק כמו ב-`0018_stories.sql`.
    const src = readFileSync('lib/core/worldApps.ts', 'utf8');
    expect(src).not.toContain('arcade_collected_words');
  });
});
```

⚠️ ‏`import { readFileSync } from 'node:fs';` **כבר קיים** בראש `lib/core/worldApps.test.ts` (נמדד C-0253) — ⛔ אל תוסיף אותו שוב.

- [ ] **Step 2: הרץ ואמת שהן נופלות**

```bash
npx vitest run lib/core/worldApps.test.ts
```
צפוי: כישלון ייבוא (`libraryTile is not exported`) + נפילת שתי הבדיקות שעודכנו (‏`['compose','arcade','collected']` ≠ ארבעה).

- [ ] **Step 3: כתוב את המימוש**

ב-`lib/core/worldApps.ts`:

```ts
export type WorldAppId = 'compose' | 'arcade' | 'collected' | 'library';
```

```ts
/** סדר הרשת = סדר הפתיחה, ו⛔ לא «הכי בשימוש» (ספירת שימוש היא עמודה חדשה — נדחתה).
 *  ⚠️ «הספרייה» **בסוף** (T-137ⓐ): היא האחרונה שנפתחה, ⛔ ולא האחרונה בחשיבות. */
export const WORLD_APP_ORDER: readonly WorldAppId[] = [
  'compose',
  'arcade',
  'collected',
  'library',
];

/** בחירת האריח הגדול (⛔ ⛔ סדר הרשת) — «תרגול > הפקה > השתקפות» (D-071ⓐ).
 *  ⚠️ «הספרייה» **שנייה** (T-137ⓑ): קריאה בהקשר היא **תרגול** ⛔ ולא צפייה — היא
 *  הפער היחיד שכרטיסייה ⛔ אינה מכסה (§ 4.2יג), ולכן היא מקדימה הפקה והשתקפות. */
export const LEARNING_PRIORITY: readonly WorldAppId[] = [
  'arcade',
  'library',
  'compose',
  'collected',
];

export const WORLD_APP_LABEL_HE: Readonly<Record<WorldAppId, string>> = {
  compose: 'הרכבה',
  arcade: 'זירה',
  collected: 'המילים שאספתי',
  library: 'הספרייה',
};

export const WORLD_APP_HREF: Readonly<Record<WorldAppId, string>> = {
  compose: '/world/compose',
  arcade: '/arcade',
  collected: '/world/collected',
  library: '/world/story',
};

/**
 * T-137ⓓ · § 4.2יג — «⛔ **ולומד בלי `current_level` ⛔ אינו נחסם** — הוא נשלח
 * לסריקת הרמה (T-082), ⛔ לא למסך ריק». המסך נחת ב-T-082 (אושר C-0228).
 */
export const LEVEL_SCAN_HREF = '/study/scan';

/** «נדרשים 3 סיפורים ברמה שלך, יש 1». שני המספרים מהשרת ⛔ ואינם כתובים בקוד. */
export function storiesTooFewNoteHe(required: number, atLevel: number): string {
  return `נדרשים ${required} סיפורים ברמה שלך, יש ${atLevel}`;
}

/**
 * מצב הספרייה כפי שהשרת מוסר אותו. ⛔ `null` ⇒ הקריאה נכשלה, ⛔ ולא «אפס סיפורים»:
 * ‏`0018_stories.sql` ⛔ טרם הורץ בייצור, ולומד ⛔ אינו רשאי לראות «יש 0» כשהמאגר
 * פשוט אינו שם.
 */
export interface StoriesStatus {
  readonly required: number;
  /** ⛔ `null` ⇒ ללומד אין `current_level` — הוא ⛔ אינו נחסם (T-137ⓓ). */
  readonly atLevel: number | null;
}

/**
 * שלושת ענפי האריח, ⛔ ואין רביעי:
 *
 * ⛔ **תנאי הפתיחה הוא על המאגר, ⛔ ולא על הלומד** (§ 4.2יג): «⛔ אין מה להסתיר
 * מלומד שעשה הכל נכון». ⇒ המספר נאמר לו במלואו, ⛔ ולא «בקרוב».
 */
export function libraryTile(status: StoriesStatus | null): {
  readonly state: AppState;
  readonly href: string;
} {
  if (status === null) return { state: { kind: 'unknown' }, href: WORLD_APP_HREF.library };
  // ⛔ ⛔ חסימה: הלומד ⛔ לא עשה דבר רע, פשוט עוד אין לו רמה. הדרך קדימה היא הסריקה.
  if (status.atLevel === null) return { state: { kind: 'open' }, href: LEVEL_SCAN_HREF };
  if (status.atLevel >= status.required) {
    return { state: { kind: 'open' }, href: WORLD_APP_HREF.library };
  }
  return {
    state: { kind: 'locked', noteHe: storiesTooFewNoteHe(status.required, status.atLevel) },
    href: WORLD_APP_HREF.library,
  };
}
```

⚠️ עדכן גם את הערת ראש הקובץ: הפסקה «**בדיוק שלושה אריחים**» מוחלפת ב-«**בדיוק ארבעה** (D-074ⓑ — הנוסח «⛔ אין רביעי» ב-§ 4.2יא בטל, § 4.2יג גוברת)», והפסקה על F-072 מוחלפת ב-«F-072 **נסגר** ב-D-074: חברות ברשת היא שלושת התנאים ⓘ משימה · ⓘ שורה ב-D-054 · ⓘ תנאי מדיד — והספרייה עומדת בשלושתם».

- [ ] **Step 4: הרץ את הבדיקות ואת שער הטוהר**

```bash
npx vitest run lib/core/worldApps.test.ts && npm run check:core && npm run typecheck
```
צפוי: ירוק, `/lib/core purity: OK`, ‏`tsc` יוצא **0**.

⚠️ `npm run typecheck` יאיר עכשיו את `components/AppGrid.tsx`: `buildApps` ממפה על `WORLD_APP_ORDER` ⇒ המזהה `'library'` נכנס אוטומטית והקוד עדיין מהדר (הביטוי `id === 'arcade' ? … : {kind:'open'}` מקבל אותו כ«פתוח»). **⛔ זה מצב שגוי שעובר `tsc`**, והוא מתוקן ב-Task 6. ⛔ **אל תדחוף בין Task 4 ל-Task 6 בלי להריץ את שתיהן** — ⛔ הקומיט של Task 4 הוא ירוק בעץ, ⛔ אך המסך אינו נכון עד Task 6.

- [ ] **Step 5: שלוש מוטציות, רשומות**

| # | המוטציה | הבדיקה שחייבת ליפול |
|---|---|---|
| 1 | ‏`LEARNING_PRIORITY` ⇒ `['arcade','compose','library','collected']` | «`LEARNING_PRIORITY` — קריאה בהקשר היא תרגול» |
| 2 | ‏`if (status === null)` מחזיר `locked` במקום `unknown` | «קריאה שנכשלה ⇒ «—» ⛔ ולא «0»» |
| 3 | מחק את ענף `status.atLevel === null` | «⛔ לומד בלי רמה ⛔ אינו נחסם» |

- [ ] **Step 6: קומיט**

```bash
git add lib/core/worldApps.ts lib/core/worldApps.test.ts
git commit -m "loop(DEV): C-XXXX T-137a+b+d — worldApps: אריח «הספרייה» בשכבה הטהורה"
```

---

## Task 5: `GET /api/world/status` סופר סיפורים — **בקריאה רכה**  *(T-137ⓒ, השרת)*

**Files:**
- Modify: `app/api/world/status/route.ts`
- Modify: `app/api/world/status/route.test.ts` (חידוד שני שערים + ארבע בדיקות חדשות)
- Modify: `docs/api-contract.md` (‏§ `GET /api/world/status`, שורה 585 ואילך)

**Interfaces:**
- Consumes: `STORIES_PER_LEVEL` מ-`@/lib/core/storyGate` · `parseLevel` מ-`@/lib/core/levelSummary`.
- Produces: `stories: { required: number; atLevel: number | null } | null` בגוף ה-200. Task 6 ממפה אותו דרך `libraryTile`.

- [ ] **Step 1: חדד את שני השערים וכתוב את הבדיקות החדשות**

ב-`app/api/world/status/route.test.ts`, **החלף** את הבדיקה בשורות 62–66 ואת זו בשורות 79–81:

```ts
  it('⛔ never counts ROWS where rows are not the unit — the ban is scoped to the two headword reads', () => {
    // ⚠️ **חודד ⛔ ולא רוכך.** הטענה האמיתית של השער היא F-040: `words` ו-
    // `word_progress` נמדדות ב-**headwords**, ולכן ספירת שורות שם מנפחת ופותחת את
    // השער מוקדם. ‏`stories` היא `unique (cefr_level, title_en)` ⇒ שם **שורה = סיפור**,
    // וספירת שורות היא הספירה הנכונה. ⇒ כל שורה שסופרת חייבת לנקוב ב-`stories`.
    for (const line of CODE.split('\n')) {
      if (/head:\s*true|count:\s*'exact'|\.count\b/.test(line)) {
        expect(line, `row count outside stories: ${line.trim()}`).toContain('stories');
      }
    }
    // והכיוון החיובי, ⛔ כדי שהסריקה לא תהפוך לשער שאינו יכול ליפול (F-088):
    expect(CODE).toMatch(/functionWords:\s*uniqueHeadwords\(/);
    expect(CODE).toMatch(/activeWords:\s*uniqueHeadwords\(/);
  });
```

```ts
  it('⛔ never reads senses.cefr_level (D-034) — and stories.cefr_level is a DIFFERENT column', () => {
    // ⚠️ **חודד ⛔ ולא רוכך.** `not.toContain('cefr_level')` חוסם **מחרוזת**, ⛔ ולא את
    // הפגם. ‏`0018_stories.sql` אומר זאת בהערת העמודה שלו עצמו: «⛔ זו ⛔ אינה
    // `senses.cefr_level` ו⛔ אינה `words.cefr_profile_band`». ⇒ כל שורה שנוקבת
    // בעמודה חייבת לנקוב גם ב-`stories`, וקריאה מ-`senses` אסורה מפורשות.
    expect(CODE).not.toContain("from('senses')");
    for (const line of CODE.split('\n')) {
      if (line.includes('cefr_level')) {
        expect(line, `cefr_level outside stories: ${line.trim()}`).toContain('stories');
      }
    }
  });
```

והוסף ארבע בדיקות חדשות:

```ts
  it('הספרייה נספרת ברמת הלומד ⛔ ולא גלובלית (T-137ⓒ · § 4.2יג)', () => {
    expect(CODE).toMatch(/\.from\('stories'\)/);
    expect(CODE).toMatch(/\.from\('profiles'\)/);
    expect(CODE).toMatch(/stories:/);
  });

  it('⛔ 3 אינו כתוב בקובץ — הסף הוא מכסת התוכן שכבר קיימת (סטייה 4)', () => {
    expect(CODE).toContain('STORIES_PER_LEVEL');
    expect(CODE).not.toMatch(/required\s*:\s*\d/);
  });

  it('⛔ קריאת הספרייה **רכה** — היא ⛔ אינה נועלת את לשונית «העולם»', () => {
    // ⚠️ נמדד ⛔ ולא שוער: `0018_stories.sql` טרם הורץ בייצור, ו-`<TabBar>` נועל את
    // הלשונית על **כל** תשובה שאינה ok:true (`docs/api-contract.md`). ⇒ קריאה שלישית
    // קשיחה הייתה נועלת את הלשונית לכל הלומדים עד שרוי ירוץ מיגרציה.
    // בדיוק שתי יציאות 503 בקובץ — הבנק והלומד — ⛔ ואין שלישית.
    expect(CODE.match(/return schemaAwareFailure\(/g) ?? []).toHaveLength(2);
    expect(CODE).toMatch(/stories:\s*null/);
  });

  it('⛔ הספרייה ⛔ אינה נוגעת בזירה (D-054 — 🔗 מצומדת לצד הלימודי)', () => {
    expect(CODE).not.toContain('arcade_collected_words');
  });
```

- [ ] **Step 2: הרץ ואמת שהן נופלות**

```bash
npx vitest run app/api/world/status/route.test.ts
```
צפוי: ארבע הבדיקות החדשות נופלות (‏`stories` לא נמצא · `STORIES_PER_LEVEL` לא נמצא · `stories: null` לא נמצא). ⚠️ שתי הבדיקות **המחודדות** ירוקות כבר עכשיו — הן רצ׳ט, והמוטציות בצעד 5 הן מה שמוכיח שהן נופלות.

- [ ] **Step 3: כתוב את המימוש**

ב-`app/api/world/status/route.ts`, הוסף לייבוא:

```ts
import { parseLevel } from '@/lib/core/levelSummary';
import { STORIES_PER_LEVEL } from '@/lib/core/storyGate';
```

הוסף אחרי `MAX_BANK_ROWS` (שורה 37):

```ts
/**
 * ⛔ **הסף ⛔ אינו קבוע שני.** § 4.2יג נוקבת ב-«≥3 סיפורים ברמת הלומד», וזה **אותו
 * מספר** של מכסת הייצור (`STORIES_PER_LEVEL`, `lib/core/storyGate.ts`) **ומאותו טעם**:
 * האריח נפתח כשמכסת הרמה מלאה. שני קבועים באותו ערך הם החצי שלא יזוז ביום שהמכסה
 * תשתנה. ⚠️ ⛔ זה ⛔ אינו סותר את D-031: `MIN_*` הם ספי מוצר בלי מקור, וזו **מכסת
 * תוכן** שכבר נאכפת בשער חי (`scripts/build-stories-sql.test.ts`).
 */
const STORIES_REQUIRED = STORIES_PER_LEVEL;

/**
 * ⛔ **קריאה רכה, ⛔ ולא 503 — וזו הכרעה שנמדדה.** `0018_stories.sql` טרם הורץ בייצור,
 * ו-`<TabBar>` נועל את לשונית «העולם» על כל תשובה שאינה `ok:true` (`docs/api-contract.md`).
 * ⇒ כישלון כאן היה **נועל את הלשונית לכל הלומדים** עד שרוי ירוץ מיגרציה. ⇒ הפונקציה
 * מחזירה `null`, האריח מצייר «—», והלשונית ⛔ אינה נוגעת. ⛔ הכישלון יורד ללוג בלבד.
 */
async function readStories(
  supabase: ReturnType<typeof createRouteClient>,
  userId: string,
): Promise<{ required: number; atLevel: number | null } | null> {
  const profile = await supabase
    .from('profiles')
    .select('current_level')
    .eq('id', userId)
    .maybeSingle();
  if (profile.error) {
    console.error('[api/world/status] profile read failed:', profile.error.message);
    return null;
  }

  // ⛔ אין נפילה שקטה ל-A1 (D-037). «טרם בחר» הוא מצב אמיתי, ולומד כזה ⛔ אינו נחסם —
  // הוא נשלח לסריקת הרמה (T-137ⓓ), וההחלטה הזאת נעשית בשכבה הטהורה ⛔ ולא כאן.
  const level = parseLevel((profile.data as { current_level?: unknown } | null)?.current_level);
  if (level === null) return { required: STORIES_REQUIRED, atLevel: null };

  // ⚠️ ‏`stories` היא `unique (cefr_level, title_en)` ⇒ **שורה = סיפור**, ולכן ספירת
  // שורות כאן היא הספירה הנכונה — ⛔ בניגוד ל-`words`/`word_progress` שנמדדות
  // ב-headwords (F-040). ⛔ אפס שורות על החוט.
  const counted = await supabase
    .from('stories')
    .select('id', { count: 'exact', head: true })
    .eq('cefr_level', level);
  if (counted.error) {
    console.error('[api/world/status] stories read failed:', counted.error.message);
    return null;
  }
  return { required: STORIES_REQUIRED, atLevel: counted.count ?? 0 };
}
```

ולבסוף, בגוף `GET`, אחרי בלוק `thresholds` (שורה 100) ולפני ה-`return`:

```ts
  // ⛔ אחרונה בכוונה: היא ⛔ אינה רשאית להשפיע על `unlocked` ו⛔ אינה רשאית להחזיר 503.
  const stories = await readStories(supabase, user.id);
```

והחלף את גוף התשובה:

```ts
  return NextResponse.json({
    ok: true,
    unlocked: isWorldUnlocked(counts, thresholds),
    ...counts,
    ...thresholds,
    // ⛔ `null` ⇒ «—» באריח (⛔ ולא «0»), ו⛔ הלשונית ⛔ אינה נוגעת.
    stories,
  });
```

⚠️ אם `createRouteClient` אינו מייצא טיפוס נוח ל-`ReturnType`, החלף את הפרמטר הראשון של `readStories` ב-`supabase: Awaited<ReturnType<typeof createRouteClient>>` או בטיפוס המפורש שהקובץ כבר משתמש בו. ⛔ **`any` אסור** — אם `tsc` נופל, אבחן (`superpowers:systematic-debugging`) ⛔ ואל תשתיק.

- [ ] **Step 4: עדכן את `docs/api-contract.md` — באותו קומיט**

ב-§ `GET /api/world/status`, אחרי הפסקה על `activeWords`, הוסף:

```markdown
⚠️ **`stories` — האריח «הספרייה», וקריאה **רכה** (T-137ⓒ · § 4.2יג · D-074ⓑ).** כל תשובת
`ok:true` נושאת `stories: { required, atLevel } | null`:

* `required` — `STORIES_PER_LEVEL` (‏`lib/core/storyGate.ts`), ⛔ **ולא קבוע שני**: § 4.2יג
  נוקבת ב«≥3 סיפורים ברמת הלומד», וזה אותו מספר של מכסת הייצור ומאותו טעם.
* `atLevel` — כמה סיפורים יש **ברמת הלומד** (`profiles.current_level`). ⛔ `null` ⇒ ללומד
  עוד אין רמה, והוא ⛔ **אינו נחסם**: האריח פתוח ומוביל לסריקת הרמה (T-082).
* `stories: null` — הקריאה **נכשלה**. ⛔ זה ⛔ אינו «אפס סיפורים»: האריח מצייר «—».

⚠️ **הכישלון כאן ⛔ אינו 503, וזו הכרעה שנמדדה ⛔ ולא נוחות.** `0018_stories.sql` טרם הורץ
בייצור, ו-`<TabBar>` נועל את הלשונית על **כל** תשובה שאינה `ok:true` — כלומר קריאה קשיחה
הייתה נועלת את «העולם» לכל הלומדים עד שהמיגרציה תרוץ. ⇒ שתי הקריאות הישנות (הבנק והלומד)
⛔ **לא נגעו** והן עדיין 503; הקריאה של הספרייה מחזירה `null` ויורדת ללוג. **`stories`
⛔ אינו קלט ל-`unlocked`.**

⛔ **`stories.cefr_level` ⛔ אינה `senses.cefr_level`** (D-034) ו⛔ אינה `words.cefr_profile_band` —
היא העמודה של `0018_stories.sql`, שהערת העמודה שלה אומרת זאת במפורש.

```json
{ "ok": true, "unlocked": false, "functionWords": 121, "activeWords": 7,
  "minFunctionWords": 100, "minActiveWords": 12,
  "stories": { "required": 3, "atLevel": 0 } }
```
```

⚠️ עדכן גם את בלוק ה-JSON הקיים של «200 — הצלחה» כך שיכלול `stories`.

- [ ] **Step 5: שלוש מוטציות, רשומות**

| # | המוטציה | הבדיקה שחייבת ליפול |
|---|---|---|
| 1 | ‏`return null` בכישלון `counted.error` ⇒ `return schemaAwareFailure('stories', counted.error)` (והתאמת הטיפוס) | «⛔ קריאת הספרייה **רכה**» — `expected 3 to have length 2` |
| 2 | ‏`const STORIES_REQUIRED = 3;` (במקום הייבוא) | «⛔ 3 אינו כתוב בקובץ» |
| 3 | הוסף `.from('senses').select('cefr_level')` | «⛔ never reads senses.cefr_level» — השורה נוקבת ב-`cefr_level` ⛔ ואינה נוקבת ב-`stories` |

⚠️ **מוטציה 3 היא ההוכחה שהחידוד ⛔ לא ריכך.** אם היא ⛔ אינה מפילה — החידוד שגוי, וזה **ממצא** ⛔ ולא הערה.

- [ ] **Step 6: אימות**

```bash
npm run typecheck && npm run check:core && npx vitest run app/api/world/status/route.test.ts app/api/world/lexicalClassOnly.test.ts
```
⚠️ `app/api/world/lexicalClassOnly.test.ts` מוזכר **במפורש** כי הוא מחזיק שער נוסף על הקובץ הזה (`.eq('lexical_class','function')` חייב לשרוד).

- [ ] **Step 7: קומיט**

```bash
git add app/api/world/status/route.ts app/api/world/status/route.test.ts docs/api-contract.md
git commit -m "loop(DEV): C-XXXX T-137c — /api/world/status סופר סיפורים בקריאה רכה + חוזה"
```

---

## Task 6: `<AppGrid>` מצייר את האריח הרביעי  *(T-137ⓒ · ⓓ, הלקוח) + רצ׳ט המסלולים*

**Files:**
- Modify: `components/AppGrid.tsx`
- Modify: `components/AppGrid.test.ts`
- Create: `lib/core/worldAppsRoutes.test.ts`

**Interfaces:**
- Consumes: `libraryTile`, `StoriesStatus`, `WORLD_APP_ORDER`, `WORLD_APP_HREF` מ-Task 4 · `stories` מגוף `/api/world/status` (Task 5).
- Produces: ⛔ כלום. זהו עלה.

- [ ] **Step 1: כתוב את הבדיקות — הן נופלות**

**ⓐ** צור `lib/core/worldAppsRoutes.test.ts`:

```ts
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { WORLD_APP_HREF, WORLD_APP_ORDER, LEVEL_SCAN_HREF } from '@/lib/core/worldApps';

/**
 * **רצ׳ט דו-כיווני, ⛔ ולא הערה.** כל `href` ברשת חייב מסך על הדיסק — ⛔ קישור
 * ל-404 הוא בדיוק מחלקת קוד המת של F-074. ובכיוון ההפוך: כל `href` שרשום כממתין
 * חייב ⛔ **לא** להיות קיים, כדי שהיום שבו הוא ייבנה **יפיל** את הבדיקה ויחייב
 * להוציא אותו מהרשימה. רשימה שאיש ⛔ אינו מנקה היא רשימה שאיש ⛔ אינו קורא.
 */

/** ⛔ **T-136 חסומה ב-F-096 🟡** (הכרעת PM: מה בדיוק נכתב בהקשה על מילה בסיפור).
 *  ⇒ `/world/story` ⛔ אינו קיים, והאריח שלו ⛔ אינו ניתן להגעה כ-`open` בייצור:
 *  `stories` ריקה עד ש-`0004_stories.sql` ייוולד ורוי יריץ אותו. */
const PENDING_ROUTES: readonly string[] = ['/world/story'];

/** Next מאפשר גם `app/<href>` וגם `app/(tabs)/<href>` — שניהם מסלולים חוקיים. */
function pageExists(href: string): boolean {
  return existsSync(`app${href}/page.tsx`) || existsSync(`app/(tabs)${href}/page.tsx`);
}

describe('WORLD_APP_HREF ⇄ מסכים על הדיסק', () => {
  it('⛔ כל אריח שאינו ממתין מוביל למסך קיים — ⛔ אפס קישור ל-404 (F-074)', () => {
    for (const id of WORLD_APP_ORDER) {
      const href = WORLD_APP_HREF[id] ?? '';
      if (PENDING_ROUTES.includes(href)) continue;
      expect(pageExists(href), `⛔ ${id} ⇒ ${href} — אין קובץ עמוד`).toBe(true);
    }
  });

  it('⛔ מסלול ממתין שנבנה ⇒ הבדיקה נופלת ומחייבת לנקות את הרשימה', () => {
    for (const href of PENDING_ROUTES) {
      expect(pageExists(href), `✅ ${href} נבנה — הוצא אותו מ-PENDING_ROUTES`).toBe(false);
    }
  });

  it('יעד הבריחה של לומד בלי רמה קיים — ⛔ ולא הבטחה (T-137ⓓ · T-082)', () => {
    expect(pageExists(LEVEL_SCAN_HREF)).toBe(true);
  });
});
```

**ⓑ** הוסף ל-`components/AppGrid.test.ts`:

```ts
  it('הרשת שואלת את השרת על הספרייה ⛔ ואינה סופרת בעצמה (T-137ⓒ · D-046)', () => {
    expect(CODE).toMatch(/apiGet<[^>]*>\('\/api\/world\/status'\)/);
    expect(CODE).toContain('libraryTile');
    // ⛔ הסף ⛔ אינו כתוב כאן: הוא מגיע כשדה בתשובה.
    expect(CODE, '⛔ 3 אינו מספר בקוד').not.toMatch(/required\s*[:=]\s*\d/);
  });

  it('⛔ ארבעה אריחים — הרשת נבנית מהסדר ⛔ ואינה מונה אותם ביד (D-074ⓑ)', () => {
    expect(CODE).toContain('WORLD_APP_ORDER');
    expect(CODE).not.toMatch(/\[\s*'compose'\s*,/);
  });
```

⚠️ הבדיקה הקיימת «⛔ אפס כתיבה … `/current_level/`» ⛔ **אינה משתנה** — הרמה חיה בשרת, והלקוח ⛔ אינו יודע עליה.

- [ ] **Step 2: הרץ ואמת שהן נופלות**

```bash
npx vitest run lib/core/worldAppsRoutes.test.ts components/AppGrid.test.ts
```
צפוי: «הרשת שואלת את השרת» נופלת (`/api/world/status` לא נמצא · `libraryTile` לא נמצא). ⚠️ שלוש בדיקות הרצ׳ט **ירוקות כבר עכשיו** — זו המדידה שמאשרת את סטייה 3: `/world/story` ⛔ אינו קיים, ו-`/study/scan` כן.

- [ ] **Step 3: כתוב את המימוש**

ב-`components/AppGrid.tsx`:

**ⓐ** הוסף לייבוא מ-`@/lib/core/worldApps`: `libraryTile`, `type StoriesStatus`.

**ⓑ** הוסף אחרי `CollectedResponse` (שורה 108):

```ts
/**
 * ⛔ בדיוק מה ש-`GET /api/world/status` עונה בשדה `stories` (`docs/api-contract.md`),
 * ⛔ ולא יותר. ⚠️ **הרמה עצמה ⛔ אינה על החוט ו⛔ אינה כאן** — היא חיה בשרת, והלקוח
 * מקבל מספר או `null`. ⛔ `current_level` ⛔ אסור בקובץ הזה, ושער חי מודד זאת.
 */
type StatusResponse =
  | { readonly ok: true; readonly stories: StoriesStatus | null }
  | { readonly ok: false; readonly code: string };
```

**ⓒ** החלף את `buildApps` (שורות 129–140):

```ts
/** «הרכבה» ו«המילים שאספתי» פתוחות תמיד: מצב ריק בעל פעולה אחת ⛔ אינו תנאי פתיחה,
 *  ו-D-046 חל על אריח **נעול** ⛔ ולא על אריח פתוח עם אוסף ריק (§ 4.2יב).
 *  ⚠️ «הספרייה» היא היחידה שה-`href` שלה **מותנה**: לומד בלי רמה ⛔ אינו נחסם והוא
 *  נשלח לסריקת הרמה (T-137ⓓ). ההכרעה כולה ב-`libraryTile` — ⛔ אין כאן ענף שני. */
function buildApps(arcade: ArcadeTile, stories: StoriesStatus | null): readonly WorldApp[] {
  const library = libraryTile(stories);
  return WORLD_APP_ORDER.map((id) => {
    if (id === 'arcade') {
      return {
        id,
        labelHe: WORLD_APP_LABEL_HE[id],
        href: WORLD_APP_HREF[id],
        state: arcade.state,
        hasActiveTask: arcade.hasActiveTask,
      };
    }
    if (id === 'library') {
      return {
        id,
        labelHe: WORLD_APP_LABEL_HE[id],
        href: library.href,
        state: library.state,
        hasActiveTask: false,
      };
    }
    return {
      id,
      labelHe: WORLD_APP_LABEL_HE[id],
      href: WORLD_APP_HREF[id],
      state: { kind: 'open' } as const,
      hasActiveTask: false,
    };
  });
}
```

**ⓓ** בגוף הרכיב, הוסף מצב ואפקט **שלישי** (לצד שני האפקטים הקיימים):

```ts
  // ⛔ `null` ⇒ «—» באריח, ⛔ ולא «0». מספר שאין לנו אינו אפס.
  const [stories, setStories] = useState<StoriesStatus | null>(null);
```

```ts
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      let next: StoriesStatus | null;
      try {
        const body = await apiGet<StatusResponse>('/api/world/status');
        next = body.ok ? body.stories : null;
      } catch {
        next = null;
      }
      if (cancelled) return;
      setStories(next);
    })();
    return () => {
      cancelled = true;
    };
  }, []);
```

**ⓔ** שנה את שורת הבנייה (שורה 197):

```ts
  const apps = buildApps(arcade, stories);
```

**ⓕ** עדכן את הערת ראש הקובץ: «**בדיוק שלושה אריחים**» ⇒ «**בדיוק ארבעה** (D-074ⓑ · § 4.2יג)», והפסקה על F-072 מוחלפת בציון ש-**D-074 סגרה אותו** ובשלושת התנאים. ⛔ **אל תשאיר טקסט שאומר «אין רביעי»** — הערה שקרית היא בדיוק F-093.

- [ ] **Step 4: הרץ את כל הבדיקות ואת `tsc`**

```bash
npm run typecheck && npx vitest run components/AppGrid.test.ts lib/core/worldAppsRoutes.test.ts lib/core/worldApps.test.ts
```

- [ ] **Step 5: אימות מלא, ⛔ ואין טענת הצלחה בלעדיו**

```bash
npm run typecheck && npm run check:core && npm test && npm run build
```
רשום את **ארבע** התוצאות המדויקות: מספר שגיאות `tsc` · שורת `purity` · `Tests N passed (N)` ומספר הקבצים · יציאת `next build`.

⛔ **נפל? תקן באותו טיק** (`superpowers:systematic-debugging` **לפני** שאתה מציע תיקון). עדיין נופל ⇒ `git revert` + חוב טכני ב-`plan/30-architecture.md`. ⛔ אל תדחוף קוד שבור.

- [ ] **Step 6: `check:mobile` — כאן הטענה על 375px נסגרת**

```bash
npm run check:mobile
```
⚠️ **ה-`npm run build` של צעד 5 חייב להיות אחרי השינוי האחרון** — ההרנס ⛔ אינו בונה (C-0220).

בדוק שלושה דברים ורשום כל אחד:
1. **מספר הבדיקות שעבר.** ⛔ ירידה = רגרסיה, ⛔ ולא רעש.
2. **`clean console` על `/world`** — ⛔ אין לצפות לרשומת `EXPECTED_CONSOLE` חדשה: `/api/world/status` **כבר** ברשומה של `/world` (`scripts/verify-mobile.mjs:333`), כי `<TabBar>` מבקש אותה. ⛔ **אם בכל זאת נדרשת רשומה חדשה — זו מדידה, והיא נרשמת בדיווח** ⛔ ולא מוסתרת.
3. **אפס גלילה אופקית ב-320/375/414** — הרשת היא `grid-cols-2`, וארבעה אריחים הם **שתי שורות** ⛔ ולא שורה רחבה יותר. ⛔ אם יש גלילה — זה BLOCKER, ⛔ ולא היתר לשנות את החוקה.

- [ ] **Step 7: קומיט**

```bash
git add components/AppGrid.tsx components/AppGrid.test.ts lib/core/worldAppsRoutes.test.ts
git commit -m "loop(DEV): C-XXXX T-137c+d — AppGrid: האריח הרביעי «הספרייה» + רצ׳ט מסלולים"
```

---

## סגירה — ⛔ חובה בכל טיק שנכתב בו קוד

- [ ] **`plan/30-architecture.md`** — פסקה על שלוש ההכרעות שנמדדו: ⓐ הפרדיקט היחיד של «כשיר לשליפה» (Task 1) · ⓑ הקריאה הרכה ב-`/api/world/status` והנימוק (`<TabBar>` נועל על כל תשובה שאינה `ok:true`) · ⓒ הרצ׳ט של `PENDING_ROUTES` ומתי הוא נופל.
- [ ] **`plan/50-tasks.md`** — `T-141` ו-`T-137` ⇒ `🟣` עם הראיות (קומיטים · מספרי בדיקות · המוטציות שהופלו בשם). ⛔ **שמונה תאים בשורה** (F-094), ⛔ ואפס `|` גולמי בתא (F-063).
- [ ] **`plan/60-findings.md`** — **F-080 🟡 ⇒ ✅ טופל** (T-141 סוגר אותו) · **F-108 🟡** נפתח (Task 3) · כל מוטציה שלא הפילה דבר ⇒ שורה חדשה.
- [ ] **`plan/00-control.md`** — `CYCLE_ID` (‏`git pull` ואז מקסימום+1) · `ACTIVE_TASK_ID` · `NEXT_AGENT=CRITIC` · שחרור `LOCK_HELD_BY`/`LOCK_AT` · שורה ביומן 0.1 (עד 2 שורות) · **`MILESTONE_TICKS` +1**.
- [ ] `npm run measure:plan` באותו קומיט, ורישום `tasks: N rows, M malformed` בדיווח. ⛔ **`M` ⛔ אינו עולה** (רצ׳ט).
- [ ] `git push origin dev`. ⛔ **בלי `[skip ci]`** · ⛔ **אין רשות ל-`main`** — הקידום הוא סמכות ה-Critic.

---

## Self-Review — נבדק מול המפרט

| דרישת מפרט | היכן היא מסופקת |
|---|---|
| D-075ⓐ — `counts:{posts,eligible,required}` נגזרות בזמן שאילתה, אפס עמודה | Task 1 (טהור) · Task 2 (נתיב, `.from('` = 2) |
| D-075ⓐ — `required` **מהשרת** | Task 1 (`RECALL_REQUIRED_ELIGIBLE`) · Task 3 (`counts.required`, בדיקה בשם) |
| D-075ⓑ — שני מצבים, אותה פעולה יחידה ל-`/world/compose` | Task 3 (‏`href={COMPOSE_HREF}` ×2, נמדד) |
| D-075ⓑ / R-016 — המצב השלישי ⛔ אינו נאמר | Task 3 (ארבע המילים האסורות + מוטציה 3) |
| T-141ⓓ — החוזה באותו קומיט | Task 2 צעד 4 |
| T-141ⓔ — ⛔ אפס `data-primary-action` | Task 3 (בדיקה בשם) |
| T-137ⓐ — `'library'` בסוף `WORLD_APP_ORDER` | Task 4 |
| T-137ⓑ — `LEARNING_PRIORITY` = `['arcade','library','compose','collected']` | Task 4 (+ מוטציה 1) |
| T-137ⓒ — «נדרשים 3 סיפורים ברמה שלך, יש N», המספר מהשרת | Task 4 (`storiesTooFewNoteHe`) · Task 5 (`stories.atLevel`) · Task 6 (⛔ אין מספר בלקוח) |
| T-137ⓓ — לומד בלי `current_level` ⛔ אינו נחסם | Task 4 (`LEVEL_SCAN_HREF` + מוטציה 3) · Task 6 (רצ׳ט שהמסך קיים) |
| T-137ⓔ — שורה בטבלת הצימוד של D-054 | ✅ **כבר קיימת** — `plan/40-decisions.md:1497`, נכתבה ב-C-0239. ⛔ **אין לערוך את `40-decisions.md`** (קובץ ה-PM) |
| § 4.2יג — «מגיעים מאריח» | Task 6 (‏`WORLD_APP_HREF.library`) + סטייה 3 (הרצ׳ט שמחייב את T-136) |
| D-054 — ⛔ אפס `arcade_collected_words` בקבצי הספרייה | Task 4 · Task 5 (סריקת מקור בשתיהן) |
| D-046 — «מושבת נושא מספר» | Task 4 (הנוסח מכיל ספרה, נמדד בשני ערכים שונים) |

**⛔ מה שהתוכנית הזאת ⛔ אינה עושה, ונאמר כדי שירוק לא ייקרא כיסוי:**
* ⛔ **T-136 (המסך `/world/story`) ⛔ אינה נלקחת** — חסומה ב-F-096 🟡 (הכרעת PM).
* ⛔ **⛔ אין כאן ולו סיפור אחד** — התוכן נולד בטיק ה-Content מול `docs/content-stories-brief.md`.
* ⛔ **⛔ אין מיגרציה ואין seed** — `0018` ממתין לרוי, ו-`0004_stories.sql` ⛔ טרם נולד.
* ⛔ **⛔ אין בדיקת רינדור** — סביבת vitest היא `node` בלי jsdom, ולכן בדיקות הרכיבים הן סריקת מקור. הגיאומטריה נמדדת ב-`check:mobile` בלבד.
