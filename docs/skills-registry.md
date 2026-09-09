# 🧭 אינדקס הסקילים — מה קיים, מתי משתמשים, ואיפה זה יושב

> **נוצר 31/08/2026 · C-0376 · בהוראת רוי.** ⛔ **הקובץ הזה הוא אינדקס, ⛔ ולא עותק.**
> הוא נועד להיקרא **במלואו** בכל טיק תכנון של PM — ולכן הוא נשאר **קליל במכוון**.
> ⛔ אל תעתיק לכאן תוכן של סקיל. תוכן סקיל נקרא **רק** דרך העמודה «נתיב», **רק** כשהטריגר נדלק.

## למה הוא קיים — ושתי המדידות שהצדיקו אותו

1. **בזבוז טוקנים.** ‏`animate` + `apple-design` + `emil-design-eng` יחד הם **61,528 בתים**
   (נמדד C-0366). טעינה גורפת שלהם בכל טיק DEV — 12 טיקים ביום — היא המחיר של הימנעות
   מאינדקס. ⇒ **האינדקס טעון תמיד; הסקיל עצמו טעון לפי תג.**
2. **סקיל שאיש ⛔ לא יודע שהוא קיים ⛔ אינו קיים.** עד היום רשימת הסקילים חיה מפוזרת
   בין `RULES § 0.7` (superpowers), `RULES § 0.9` (עיצוב), והטריגרים המותנים ב-`DEV.md`
   ו-`QA.md`. ⇒ **ארבעה בתים לאותו מידע.** הקובץ הזה הוא הבית החמישי ו**האינדקסי**;
   שלושת האחרים נשארים המקור המחייב לכללים עצמם.

3. **⛔ התוסף ⛔ אינו מגיע לריצות הענן — נמדד, ⛔ לא שוער.** ⟦NEW 08/09⟧ בריצת ROUTINE
   בסביבת CCR נמדד `~/.claude/plugins/synced/<bucket>/` **ריק**, ו-`superpowers:*` ⛔ לא
   הופיע באף רשימת סקילים (דוח DEV C-0502, 08/09 10:33Z: «⛔ לא הוצעו: `superpowers:*`»).
   הרשומה בשרת נושאת `enabled_plugins: []` בכל חמשת הסוכנים. ⇒ **שנים-עשר הסקילים של
   `superpowers` יושבים מעכשיו בריפו עצמו**, בדיוק כמו שני סקילי העיצוב — ⛔ נקראים לפי
   טריגר, ⛔ לעולם לא בכל טיק. המקור: `obra/superpowers` v6.3.0.
   ⛔ `using-git-worktrees` ⛔ לא הובא — הוא חסום לארבעתם (הרשימה השלילית למטה).

4. 🔴 **ומאותה מדידה נובע דבר רחב יותר, ש⛔ לא נרשם ב-08/09: ⛔ אף «סקיל סשן» ⛔ אינו נגיש.**
   ⟦NEW 09/09⟧ נמדד בתצורת שש המשימות המתוזמנות עצמן (‏`list_triggers`, 09/09 12:00Z):
   `enabled_plugins: []` · `account_plugins: []` · `account_skills: []` · `extra_marketplaces: []`
   — **בכל שש**, ⛔ ולא רק ב-DEV. ⇒ **עשר השורות בטבלה שנשאו «סקיל סשן» ⛔ אינן ניתנות
   לטעינה בשום טיק:** `codebase-investigator` · `apple-design` · `animate` ·
   `emil-design-eng` · `review-animations` · `pick-ui-library` · `ask-sonner` ·
   `dataviz` · `web-artifacts-builder` · `canvas-design`.
   ⛔ **וזו ⛔ אינה סיבה לדלג על מה שהן דרשו.** הטריגר נשאר בתוקף, והתשובה היא **הקריטריון
   שבעמודת הטריגר** — למשל `npm run check:palette` נשאר חובה לפני כל גרף, בין אם `dataviz`
   נטען ובין אם ⛔ לא. ⇒ **דווח `סקילים: ⛔ אף אחד — התוסף אינו בסביבה`, ⛔ ואל תבזבז טיק בחיפוש.**
   ⚠️ **ומה שכן נגיש ו⛔ לא נכתב עד היום:** `ui-ux-pro-max:ui-styling` **קיים בגיט** על
   הענף `skills/superpowers`, ונקרא בפקודה שבשורתו בטבלה. ⛔ הוא ⛔ אינו סקיל סשן.

## 🏷️ תג הסקיל בשורת משימה — `[SKILL: x]`

**PM** מצמיד לכל שורה שהוא גוזר ב-`plan/50-tasks.md` תג בעמודת `סקיל`, בצורה `[SKILL: <שם>]`
או `—` כשאין. **DEV ו-QA** קוראים את התג ומפעילים את הסקיל **לפני** כתיבת או בדיקת הקוד.

🔴 **השער ⛔ אינו נפתח מבפנים (‏C-0366):** את התג כותב **PM או רוי**, ⛔ **לעולם לא DEV**.
סוכן שמסמן לעצמו שורה ואז קורא את הסקיל שהסימון פתח ⛔ אינו עובר שער — הוא כותב לעצמו רשות.

---

## הטבלה

| הסקיל | מתי להשתמש בו — הטריגר | מי | נתיב |
|---|---|---|---|
| `superpowers:using-superpowers` | ⛔ **בפתיחת כל סשן, לפני כל דבר אחר.** הוא מה שמגלה אילו סקילים הסשן באמת מחזיק | ארבעתם | **`skills/superpowers/using-superpowers/SKILL.md`** |
| `superpowers:verification-before-completion` | לפני **כל** טענה של «עובד / עבר / הושלם / תוקן» | ארבעתם | **`skills/superpowers/verification-before-completion/SKILL.md`** |
| `superpowers:test-driven-development` | לפני כתיבת קוד למשימה | DEV | **`skills/superpowers/test-driven-development/SKILL.md`** |
| `superpowers:systematic-debugging` | באג, טסט נופל, התנהגות לא צפויה | DEV | **`skills/superpowers/systematic-debugging/SKILL.md`** |
| `superpowers:writing-plans` | משימה שאינה טריוויאלית — לפני קוד | DEV | **`skills/superpowers/writing-plans/SKILL.md`** |
| `superpowers:executing-plans` | ביצוע תוכנית קיימת מ-`docs/superpowers/plans/` | DEV · CONTENT | **`skills/superpowers/executing-plans/SKILL.md`** |
| `superpowers:subagent-driven-development` | תוכנית עם צעדים עצמאיים — לפני ביצוע | DEV | **`skills/superpowers/subagent-driven-development/SKILL.md`** |
| `superpowers:requesting-code-review` | סיום משימה, לפני העברה ל-QA | DEV | **`skills/superpowers/requesting-code-review/SKILL.md`** |
| `superpowers:receiving-code-review` | קבלת ממצאי QA | DEV | **`skills/superpowers/receiving-code-review/SKILL.md`** |
| `superpowers:brainstorming` | לפני עיצוב פיצ׳ר או שינוי התנהגות | PM | **`skills/superpowers/brainstorming/SKILL.md`** |
| `superpowers:dispatching-parallel-agents` | 2+ משימות עצמאיות במקביל | PM · QA | **`skills/superpowers/dispatching-parallel-agents/SKILL.md`** |
| `superpowers:finishing-a-development-branch` | הקוד מוכן — איך ממזגים | **QA בלבד** | **`skills/superpowers/finishing-a-development-branch/SKILL.md`** |
| `codebase-investigator` | ⛔ לפני פתיחת פרוסה — לחקור מה כבר קיים | PM | ⛔ **⛔ אינו נגיש בלופ** — סקיל תוסף (§ 4) |
| **`taste-skill`** | 🆕 **מיקרו-קופי · הצללות · ריווחים · «האם זה נראה תבניתי».** שורת `נוחות` שנוגעת בטקסט ממשק, במרווחים, בצללים או בהיררכיה ויזואלית | PM (בתכנון) · DEV (לפי תג) | **`skills/taste-skill/SKILL.md`** |
| **`imagegen-frontend-mobile`** | 🆕 **חוקי מובייל-פירסט: אזורים בטוחים · ניווט תחתון · צפיפות · קריאוּת טקסט · «⛔ קופסה בתוך קופסה».** ⚠️ **הסקיל עצמו מייצר תמונות ⛔ ולא קוד** — מה שנלקח ממנו הוא **§ 13 · § 14 · § 15 · § 29 · § 30 · § 31** כעקרונות | PM (בתכנון) · DEV (לפי תג) | **`skills/imagegen-frontend-mobile/SKILL.md`** |
| `apple-design` | ⚠️ **נדיר, והטריגר הוא מונה ⛔ ולא מצב־רוח** — טיק הכרעה, ורק כשאין ולו שורה פתוחה אחת שנושאת `apple-design` בתא `סקיל` | PM (נדיר) · DEV (לפי תג) | ⛔ **⛔ אינו נגיש בלופ** — סקיל תוסף (§ 4) |
| `animate` | שורה שנושאת **גם** `arena` **וגם** `שכבה ב׳` — שניהם, ⛔ לא אחד | DEV (לפי תג) | ⛔ **⛔ אינו נגיש בלופ** — סקיל תוסף (§ 4) |
| `emil-design-eng` | **רק** אם `animate` שלח לשם. ⛔ אינו עצמאי | DEV (לפי תג) | ⛔ **⛔ אינו נגיש בלופ** — סקיל תוסף (§ 4) |
| `review-animations` | הדיף נוגע ב-`app/arcade/**` · `components/Arena*`, או מכיל `animate\|transition\|motion\|glow(` | **QA בלבד** | ⛔ **⛔ אינו נגיש בלופ** — סקיל תוסף (§ 4) |
| `pick-ui-library` | המשימה דורשת תלות UI ש-`package.json` ⛔ **אינו** נושא | DEV | ⛔ **⛔ אינו נגיש בלופ** — סקיל תוסף (§ 4) |
| `ask-sonner` | `sonner` בתלויות · רכיב `*Toast*` · או השורה אומרת «טוסט» | DEV | ⛔ **⛔ אינו נגיש בלופ** — סקיל תוסף (§ 4) |
| `dataviz` | לפני **כל** גרף, טבלת מדדים, סרגל התקדמות או דשבורד — בקוד המוצר ובכל ארטיפקט. חובה `npm run check:palette` | DEV · PM | ⛔ **⛔ אינו נגיש בלופ** — סקיל תוסף (§ 4) · `RULES § 0.9` |
| `web-artifacts-builder` | ארטיפקט HTML **מורכב לרוי** בלבד | PM | ⛔ **⛔ אינו נגיש בלופ** — סקיל תוסף (§ 4) · `RULES § 0.9` |
| `canvas-design` | נכס סטטי: לוגו, אייקון, תמונת שיתוף (`.png` / `.pdf`) | PM | ⛔ **⛔ אינו נגיש בלופ** — סקיל תוסף (§ 4) · `RULES § 0.9` |
| `ui-styling` (‏`ui-ux-pro-max`) | 🆕 **רספונסיביות ב-Tailwind** — נקודות שבירה, `min-h-touch`, אסימוני `tailwind.config.ts`. **זה הבית של «`tailwind-responsive`»** | DEV | ⛔ **⛔ אינו בענף הזה — הוא על הענף הקבוע `skills/superpowers`** (3.3MB, ⛔ נדיר מכדי לשאת בכל שכפול). קרא אותו כך, ⛔ בלי לשכפל: `./scripts/g fetch origin skills/superpowers && ./scripts/g show FETCH_HEAD:skills/ui-ux-pro-max/ui-styling/SKILL.md`. 🔬 **`FETCH_HEAD` ⛔ ולא `origin/skills/superpowers` — נמדד בשכפול אמיתי:** השכפול של הסוכן הוא `--single-branch`, ולכן `fetch` של ענף אחר ⛔ **אינו** יוצר ref עוקב, ו-`show origin/skills/superpowers:…` נכשל ב-`invalid object name`. ⛔ אל «תתקן» חזרה. |

### ⛔ הרשימה השלילית — סקילים שישברו את הלופ

| הסקיל | ⛔ למי אסור | מה נשבר |
|---|---|---|
| `superpowers:using-git-worktrees` | 🔴 **ארבעתם, בלי יוצא מן הכלל** | ענף אחד קבוע ונעילה יחידה. פיצול ענף שובר את F-121 ואת בדיקה 10, ו⛔ אף אחד ⛔ לא יראה זאת |
| `superpowers:finishing-a-development-branch` | ⛔ DEV · PM · CONTENT | QA הוא היחיד שממזג, ורק `--ff-only` |
| `animate` · `apple-design` · `emil-design-eng` | ⛔ **QA, בכל שכבה** | סוקר שמריץ סקיל בנייה מפסיק למדוד את הדיף ומתחיל להציע דיף אחר |
| `find-animation-opportunities` · `write-swift` | ⛔ **אף סוכן** | ⛔ אינם הסטאק |

### 🔎 שני שמות שרוי ביקש, ומה נמדד עליהם בפועל — ⛔ ולא הומצא

| השם שנתבקש | מה נמדד ב-C-0376 | ההכרעה |
|---|---|---|
| `tailwind-responsive.md` | ⛔ **⛔ אינו קיים** — ⛔ לא בריפו, ⛔ לא בשום תוסף מסונכרן. הכיסוי הקיים הוא `ui-ux-pro-max:ui-styling` (‏Tailwind + נקודות שבירה) | ⇒ נרשם בטבלה **בשמו האמיתי**. ⛔ **⛔ לא נוצר קובץ ריק בשם שביקשת** — קובץ שממציא תוכן גרוע מקובץ שאינו קיים |
| `shadcn-components.md` | ⛔ **⛔ אינו קיים**, ו-`shadcn/ui` ⛔ **אינו ב-`package.json`** (‏נמדד: אין `shadcn`, אין `@radix-ui`). ⚠️ ובנוסף: `RULES § 0.9` **כבר אוסר** את `web-artifacts-builder` — סקיל ה-shadcn — **על קוד המוצר**, «האתר הוא Next.js אמיתי» | ⇒ 🔴 **⛔ לא נכנס כסקיל של DEV.** הכנסתו הייתה **סותרת כלל קיים** ומכניסה ספריית UI שהמוצר ⛔ אינו מחזיק. ▶️ אם רוי רוצה shadcn במוצר — זו **שורת משימה** (‏תלות חדשה + `pick-ui-library`), ⛔ לא שורת אינדקס |

---

## שלוש גדרות, וכולן מחייבות

1. 🔴 **החוקה גוברת על הסקיל, ⛔ תמיד.** ‏`plan/35-design-constitution.md` כותב בטבלת
   הסתירות שלו «שכבה ב׳ מול סקיל עיצוב ⇐ **שכבה ב׳**». תקציב הזוהר, רצפת 12px, 44px,
   `prefers-reduced-motion` ותזמוני `37 § 6` הם **מספרים**, ⛔ לא טעם. סקיל שמציע אחרת
   הוא **ממצא שנפתח**, ⛔ ולא סטייה שנלקחת.
2. ⛔ **הפניה, ⛔ לא העתקה.** הפרומפטים מפנים לקובץ הזה; ⛔ הם ⛔ אינם מעתיקים ממנו,
   וקובץ זה ⛔ אינו מעתיק מהסקילים.
3. 🔬 **מה שלא נראה ⛔ לא מדווח.** שורת `סקילים:` בדוח של כל סוכן מדווחת מה **הסשן באמת
   טען**, ⛔ ולא מה הטבלה הזאת אומרת שאמור להיטען. `סקילים: ⛔ אף אחד` היא תשובה לגיטימית
   ובעלת ערך.
