# 🧭 אינדקס הסקילים — `superpowers`  ⟦הופרד 09/09/2026 · שלב 3 של סבב התשתית⟧

> ⛔ **הקובץ הזה הוא **המשך** של `docs/skills-registry.md`, ⛔ ולא אינדקס שני.**
> כל הכללים שם חלים כאן מילה במילה: הוא **אינדקס ולא עותק**, תוכן סקיל נקרא **רק**
> דרך עמודת «נתיב», ותג `[SKILL: x]` נכתב בידי PM או רוי ⛔ ולעולם לא בידי DEV.
>
> 🔬 **⛔ למה הופרד, ו⛔ זו ⛔ אינה אסתטיקה:** האינדקס הראשי עמד על **13,535 תווים** מול
> תקרת בדיקה של **14,000** — **465 תווים של אוויר**, ⇒ השורה הבאה שמישהו היה מוסיף
> הייתה מפילה את `npm run verify`. התקרה עצמה קיימת מסיבה טובה (PM קורא את האינדקס
> **במלואו** בכל טיק תכנון), ⇒ הפתרון ⛔ אינו להעלות אותה, אלא להוציא את הבלוק שהוא
> **הומוגני, יציב, וכולו נתיבי ריפו**.
>
> ✅ **ושנים-עשר אלה הם היחידים שנגישותם ⛔ אינה שאלה:** הם **קבצים בשכפול**, ⛔ לא
> תוספים. ⇒ ⛔ אין להם «נפילה-לאחור», כי ⛔ אין להם דרך להיעדר.

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

### ⛔ הרשימה השלילית של הבלוק הזה

| הסקיל | ⛔ למי אסור | מה נשבר |
|---|---|---|
| `superpowers:using-git-worktrees` | 🔴 **ארבעתם, בלי יוצא מן הכלל** | ענף אחד קבוע ונעילה יחידה. פיצול ענף שובר את `F-121` ואת בדיקה 10, ו⛔ אף אחד ⛔ לא יראה זאת |
| `superpowers:finishing-a-development-branch` | ⛔ DEV · PM · CONTENT | QA הוא היחיד שממזג, ורק `--ff-only` |

## § הארכיון — סטטוס סקילי התוסף כפי שנמדד 09/09  ⟦הועבר לכאן 14/09⟧

⛔ **המסקנה המעשית חיה עכשיו ב-`docs/skills-registry.md § «🧩 סקילים»`** — כאן נשמר
הנוסח המלא, כי הוא נושא את הראיות ואת נימוקי הנפילה-לאחור.

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
   ⚠️ **ומה שכן נגיש, ו⟦11/09⟧ עבר לכאן:** `ui-ux-pro-max` — **שני תתי-סקילים**, בשכפול
   עצמו תחת `skills/ui-ux-pro-max/`. ⛔ **⛔ אינם סקילי סשן ו⛔ אינם דורשים `fetch`.**

5. 🔴 **ו⛔ זה ⛔ אינו «עוד לא הודלק» — ⛔ אין דרך להדליק.** ⟦נמדד ואומת בידי רוי
   בממשק, 09/09⟧ ‏ה-API **מקבל** `enabled_plugins` ו**משליך אותו בשקט**, והמדור
   ⛔ אינו קיים במסך ה-Routines כלל. ⇒ **⛔ אין פעולה שרוי יכול לעשות** כדי להנגיש
   סקיל תוסף לטיק מתוזמן. ⛔ **סקיל שאינו בריפו ⛔ אינו זמינות — הוא תקווה.**
   ⇒ **לכל שורה כזאת בטבלה יש עמודת «נפילה-לאחור» כתובה**, והיא ⛔ לא «דלג»:
   היא **הקריטריון שבעמודת הטריגר, מבוצע ביד**. `dataviz` ⛔ אינו נטען ⇒
   `npm run check:palette` נשאר חובה. `review-animations` ⛔ אינו נטען ⇒ חמש
   הבדיקות הבינאריות של `§ 0.1 ז׳` נשארות חובה. ⛔ **הטריגר ⛔ לא בוטל, הכלי בוטל.**

