<!--
================================================================================
  plan/00-control.md — מצב בלבד. הקובץ הראשון שכל סוכן קורא, וחייב להישאר זעיר.
  ------------------------------------------------------------------------------
  ⛔ אין לכתוב לכאן חוקים, נימוקים, מסקנות או פרוזה. רק מצב.
     החוקים: plan/RULES.md (ובפרומפט של כל סוכן).
     תקרה קשיחה: 60 שורות. עבר? משהו שאינו מצב נכנס לכאן — הוצא אותו.
================================================================================
-->

# בקרת לופ — מצב

> המדור היחיד שכל שלושת הסוכנים כותבים אליו. חייב להיות תקין תמיד — אם הוא שבור, הלופ עוצר.

```yaml
CYCLE_ID: C-0083                  # מזהה רץ. עולה ב-1 בכל מעבר PM→Dev→Critic→PM
NEXT_AGENT: CRITIC                # **C-0083 (DEV): טיק ביצוע — משימה 4/4 בתוכנית `2026-08-13-institution-and-finish.md`. T-003 הושלמה במלואה → 🟣 לביקורת.** בלוק "המטרה שלך" ב-`/me`: `LearnerGoal` מיוצא, `goal` פרופ **חובה**, הבלוק נפתח ב-`institution || targetScore` (⛔ תאריך לבדו לא), `truncate` לשם המוסד, ו-`maybeSingle()` בקריאת שלוש העמודות. **שני שומרים שהתוכנית עצמה כתבה חלולים, שניהם נמדדו ותוקנו** (המוטציה שצעד 7 מבטיח שתיתפס — עוברת; `toContain(column)` עובר מעל מסך שאינו קורא). **חמש פקודות טרי: typecheck ✅ · check:core `OK` ✅ · 804 בדיקות ✅ · build ✅ · check:mobile ✅ 594.** ⛔ לא נגעתי ב-`main`. 🔴 **איחוי `main`→`dev` עדיין ממתין ל-PM** (‏`4ddf6c4`) — הקידום חסום עד אז.
STATE: BUILDING                   # PLANNING | BUILDING | REVIEWING | BLOCKED | MILESTONE_DONE
ACTIVE_MILESTONE: M0              # M0..M6
ACTIVE_TASK_ID: T-056             # ⬜ הבאה בתור: **משימה 5** בתוכנית `2026-08-13-institution-and-finish.md` (משפט כשל עברי אחיד). אחריה **T-057** (משימה 6, סוגרת את התוכנית). **T-003 🟣 — כל 4 המשימות הושלמו (C-0079 · C-0080 · C-0081 · C-0083).** ⛔ לעולם לא לכתוב ל-`senses.cefr_level`. ⚠️ T-007 (NGSL) עדיין ⛔ חסום ב-T-043. T-059 ⬜ תיעוד בלבד.
CRITIC_ROUNDS_ON_TASK: 0          # תור הסקירה: T-005 · T-006 · T-018 · **T-052 + F-027 (C-0071)** · **T-003 🟣 — כל 4 המשימות (C-0079..C-0083), לסקירה כשלמות** · ✅נסגרו C-0082: T-051 · T-058
CONSECUTIVE_NO_PROGRESS: 0        # תקרה: 2 → מעבר אוטומטי ל-HUMAN. C-0083 התקדם: 796 → 804 בדיקות, T-003 נסגרה במלואה
LAST_HANDOFF_AT: 2026-08-13T07:45:14Z
HUMAN_DECISION_REQUIRED: false    # אין החלטה עסקית תלויה. שלוש פעולות אנושיות ממתינות ואינן עוצרות את הלופ: T-043 (קובצי מקור) · T-046 (טוקן Netlify) · אישור ידני של R-015
BUDGET_NOTE: "כל מקורות התוכן מורשים לשימוש מסחרי בעלות אפס: NGSL (CC BY-SA 4.0) · CEFR-J (מסחרי בציטוט) · Octanove (CC BY-SA 4.0) · Hebrew Wordnet (רישיון פרמיסיבי של אונ׳ חיפה, ללא share-alike — אומת C-0001, H1g) · Kaikki/ויקימילון (CC BY-SA) · word2word (Apache-2.0). ⛔ PanLex ו-MUSE נפסלו ברישיון NC (1.6.3). שני סיכוני תקציב עתידיים תועדו ב-4.3.2: W3 (עלות יצירת תוכן AI) ו-W4 (שכבה חינמית של Supabase)."
# --- נעילה: מונעת שני סוכנים שכותבים לקובץ בו-זמנית ---
LOCK_HELD_BY: "DEV"               # "" | PM | DEV | CRITIC | CONTENT — נתפסה ב-C-0084
LOCK_AT: "2026-08-13T08:38:19Z"
MILESTONE_TICKS: 37
PAUSED_BY_HUMAN: false
DEPLOYS_THIS_MONTH: 1
LAST_DEPLOYED_AT: "2026-08-12T01:15:52Z"
LAST_REVIEWED_COMMIT: "9769c3f"
# --- כלכלת פריסה: קרדיטים, לא דקות. 15 קרדיטים לפריסה. ראה RULES § 0.1.1 ---
WORKING_BRANCH: dev               # כל הסוכנים דוחפים לכאן. Netlify לא בונה ענף זה.
DEPLOY_BRANCH: main               # Netlify בונה אך ורק את זה. רק ה-Critic מקדם לכאן.
LAST_PROMOTED_AT: "2026-08-12T01:15:52Z"  # ISO-8601 של הקידום האחרון ל-main
PROMOTIONS_THIS_MONTH: 6          # תקרה רכה: 30. מעבר לזה — התראה לרוי
```

> 🧑‍⚖️ **בוצעו שתי ביקורות ידניות של רוי — הפירוט המלא ב-`plan/OPERATOR-LOG.md`.**
> פתוחים כרגע: F-026 🟡 (**שאלת ה-`PSEUDOGAP!` הוכרעה C-0074 — D-029; נותר רק לסמן ✅ ב-T-059**) · F-012 🟠 (חסום בתוכן, P-001) · F-019 🟠 (חפיסה לא נקלטת) · **F-028 🟠 (apkg false-accept, רדום → DEV, C-0067)** · **F-029 🟡 (README תקציב מיושן, C-0067)** · F-008 🟡 · R-010. **נסגרו: F-014/F-016 (C-0013) · F-017 (C-0014) · F-009 (C-0017) · F-015 (C-0019) · F-022/F-023/F-024/F-025 (C-0039) · F-021 (C-0049 — 1.7.1 בתמצית §92 + D-025 חתום) · F-028 (C-0069) · F-027 (C-0071 — שני החצאים).**
> 🚨 **קידום חסום — עדיין פתוח (אומת שוב Critic C-0082, 07:11Z; ל-PM טרם היה תור מאז שהדגל הוסף):** `main` הסתעף מ-`dev` — הקומיט `4ddf6c4` ("Update 02-inbox.md", עריכה ישירה ל-main מ-12/08) אינו ב-`dev`, ולכן `git merge --ff-only dev` נכשל וכ-26 מחזורים כולל תיקון F-027 אינם עולים לאוויר. **⛔ Critic אינו יכול לאחות** (האיחוי מתנגש ב-`02-inbox.md`, קובץ PM). **פעולה נדרשת מ-PM:** `git merge origin/main`→`dev`, פתור את התנגשות `02-inbox.md` (שמור י׳/יא׳), דחוף `dev`. אז ה-Critic יקדם. הרצה נקייה (4 פקודות ✅ · 737 בדיקות) אומתה על `dev@1f88154`. `/api/health` חי=ok על קוד C-0047. ⚠️ ‏PROMOTIONS=6 מול main ב-C-0047 → ייתכן 6 קידומים שנכשלו בשקט, לביקורת PM. פירוט: `03-for-roy` פריט 17.
> ⚡ סקילים של superpowers פעילים (`RULES.md` § 0.6). החוק הקשה: אין טענת הצלחה בלי ריצה טרייה.
> **תזמון:** Dev כל שעה ב-:30 · PM יומי 08:00 · Critic יומי 20:00. `NEXT_AGENT` הוא איתות
> עדיפות ולא נעילה — סוכן בלי עבודה כשירה מסיים ב"טיק שקט" בלי לבזבז מחזור.

### 0.1 יומן העברות מקל — 3 האחרונים בלבד

> 2 שורות לרשומה. ישן יותר → `plan/archive/handoff-log.md`. ההיסטוריה המלאה בגיט.

| Cycle | מסוכן | לסוכן | בשעה | סיבת ההעברה (עד 2 שורות) | תוצר |
|---|---|---|---|---|---|
| C-0083 | DEV | CRITIC | 07:45Z | **טיק ביצוע (◰) — משימה 4 מתוך 4 בתוכנית `2026-08-13-institution-and-finish.md`: בלוק "המטרה שלך" ב-`/me` (T-003). המשימה הושלמה במלואה → 🟣.** `LearnerGoal` (‏`institution` · `targetScore` · `examDate`) מיוצא מ-`components/MeScreen.tsx`, ו-`goal` הוא פרופ **חובה** ולא רשות — פרופ רשות הוא פרופ שקורא שוכח, וזו סיבה 2 של F-027. הבלוק נפתח ב-`goal.institution !== null || goal.targetScore !== null`; ⛔ **תאריך המבחן לבדו אינו פותח אותו** — הכלל ככתבו ב-§ 4.2ד, ולספירה לאחור כבר יש בית ב-`<StudiesScreen>` (סתירה נמדדת, ⛔ לא הורחב בסמכות Dev). שם המוסד `truncate` בשורה אחת עם `title`, כדי שגובה הבלוק לא ייגזר מאורך מה שהלומד הקליד. `app/(tabs)/me/page.tsx` קורא `institution, target_score, exam_date` ב-**`maybeSingle()`** ולא `single()` — קריאה שנכשלה מניבה מטרה ריקה שנראית כאין-בלוק, אותה שתיקה כנה ש-`wordsLearned === null` כבר משתמש בה. ⛔ אפס חישוב על שלושת הערכים (4.4.3): אין סף, אין הערכת מוכנות, אין ציון חזוי. ⚠️ **שני שומרים שהתוכנית עצמה כתבה חלולים, ושניהם נמדדו ולא שוערו:** ⓐ **המוטציה שצעד 7 בתוכנית מבטיח במפורש שתיתפס — אינה נתפסת.** התוכנית מחליפה `||` ב-`&&` ומצהירה "the regex requires the `||` composition"; נמדד שגם `goal\.institution[\s\S]{0,40}goal\.targetScore` וגם `toContain('!== null')` **עוברים על המוטנט**, פשוט כי `` !== null && `` הוא אותם 13 תווים כמו `` !== null || ``. כלומר הבדיקה היחידה שהוקצתה להתנהגות הליבה לא הבחינה בין "מוצג כשיש מוסד **או** ציון" לבין "מוצג רק כששניהם קיימים" — שני מסכים שונים לחלוטין ללומד שמילא שדה אחד. ⓑ **`page.toContain(column)` אינו טענה על קריאה** — נמדד: עם כל בלוק ה-`.from('profiles')` מחוק ורק אובייקט ה-`goal` נותר, שלושת השמות עדיין בקובץ דרך `profile?.institution ?? null`, ולכן שלוש הטענות עוברות **מעל מסך שאינו קורא כלום**. העמודות נטענות עכשיו בתוך ארגומנט ה-`select()` שנלכד אחרי `from('profiles')`. **ארבע מוטציות ריצות, כל אחת הרגה בדיקה בשמה:** `||`→`&&` → `hides itself only when institution and score are BOTH empty` (**מול נוסח התוכנית: 15 עוברות**) · מחיקת קריאת `profiles` → `selects the three goal columns from profiles` (**מול נוסח התוכנית: עוברת**) · `goal?:` → `takes the goal as a required prop…` · הסרת `truncate` → `shows a long institution on one line…`. **חמש פקודות טרי:** typecheck ✅ · check:core `/lib/core purity: OK` ✅ · **804 בדיקות ✅ (מ-796, 53 קבצים)** · build ✅ · **check:mobile ✅ 594 בדיקות, 0 חדשות** — הפיקסטורה קיבלה `SAMPLE_GOAL` עם שם מוסד עברי ארוך (`המכללה האקדמית להנדסה אורט בראודה`) כדי שההרכבה הרחבה ביותר תימדד, ו-`/dev/tabs/me @320px no horizontal scroll` ✅ הוא ההוכחה ש-`truncate` מחזיק. TD-26 קוים: `pkill` → `pgrep` ריק → `rm -rf .next` → build. ⛔ TD-19/TD-24 בעינם — `0009` טרם הורצה על פרויקט חי, ולכן הקריאה תיכשל, `profile` יהיה `null` והבלוק לא יוצג (כשל שקט ומכוון). ⛔ לא נטען סקיל עיצוב (שורת T-003 היא `—`) · ⛔ `10-pedagogy.md` לא נפתח · ⛔ אפס סוכני משנה · ⛔ לא נגעתי ב-`main`. | `components/MeScreen.tsx` · `components/MeScreen.test.ts` · `app/(tabs)/me/page.tsx` · `app/dev/tabs/me/page.tsx` · `docs/superpowers/plans/2026-08-13-institution-and-finish.md` (משימה 4 ✅) · `plan/30-architecture.md` (3.1.33) · `plan/50-tasks.md` (T-003 🟣) · `plan/00-control.md` |
| C-0082 | CRITIC | PM | 07:11Z | **סקירה מהירה נקייה** — 4 פקודות ירוקות (typecheck · check:core `OK` · **796 בדיקות** · build). סומנו ✅: **T-051** · **T-058**; T-003 נשאר 🔵 (משימה 4/4). **⛔ לא קידמתי:** `ff-only` נכשל על דיברגנס `4ddf6c4` (`02-inbox.md` ישירות ל-main, עריכת רוי 12/08). איחוי `main`→`dev` מתנגש ב-`02-inbox.md` (קובץ PM) — **מועבר ל-PM לאיחוי, ואז Critic יקדם.** | `plan/50-tasks.md` (T-051·T-058 ✅) · `plan/00-control.md` |
| C-0081 | DEV | CRITIC | 06:46Z | **טיק ביצוע (◰) — משימה 3 מתוך 4 בתוכנית `2026-08-13-institution-and-finish.md`: השדה על המסך (T-003).** שדה טקסט עברי אחד ב-`components/OnboardingForm.tsx`, **מעל** `<LatinField>` של ציון היעד ובאותה קבוצה איתו: `maxLength={INSTITUTION_MAX_LENGTH}` · `autoComplete="off"` · `enterKeyHint="next"` · `min-h-touch`, ו-`institution` נוסף לגוף ה-`apiPost`. ⛔ לא `<LatinField>` ו⛔לא `dir="ltr"` (TD-5 חל על קלט **לטיני**) · ⛔ אין `<datalist>` ואין `autoComplete="organization"` · ⛔ אין ענף `fieldErrors`, והיעדרו מכוון: הכלל של משימה 1 **חותך** ב-120 במקום לדחות, ולכן אין מפתח `institution` ב-`OnboardingFieldErrors` להציג. המיקום הוא הכרעת סתירה 1 בתוכנית — לציון יש `enterKeyHint="go"`, טענה מוטיפסת (F-015 · TD-5) שהוא האחרון. ⚠️ **שלוש סתירות בתוך התוכנית עצמה, כולן נמדדו ולא שוערו, ושלושתן היו משאירות שומר חלול:** ⓐ חלון ה-±600 תווים סביב הסמן **מגיע אל ה-`<LatinField>` שמתחתיו**, ולכן `not.toContain('LatinField')` נופל על המימוש **הנכון** — הוחלף ברכיב ה-`<label>` של השדה (`lastIndexOf('<label')`→`indexOf('</label>')`). ⓑ התוכנית דורשת בבדיקה `maxLength={120}` ליטרלי ובמימוש `maxLength={INSTITUTION_MAX_LENGTH}` — נמדד `1 failed | 6 passed` על המימוש שהיא עצמה מכתיבה; הוכרע לצד הקבוע, כי `120` ברכיב הוא עותק שני של תקרת השרת שיכול לסחוף ממנה בשקט, וההסכמה עם המיגרציה ממילא נשמרת ב-`lib/core/onboarding.test.ts`. ⓒ **והחמור מהשלושה:** הביטוי הרגולרי לגוף הבקשה משתמש ב-`[\s\S]*?`, **יוצא מהאובייקט** ומוצא את המילה `institution` ב-markup שישים שורות מתחת — מוטציה שמוחקת את `institution,` מגוף ה-`apiPost`, כלומר **מה שהלומד הקליד ⛔אינו נשלח לעולם, קיבלה `7 passed`.** הגוף נלכד עכשיו ב-`[^}]*`, שאינו יכול לעזוב את הסוגריים שפתח. **ארבע מוטציות ריצות, כל אחת הרגה בדיקה בשמה:** העברת ה-`<label>` מתחת לציון → `sits above the target-score field…` · הנמכת הסמן להערה → **3 נופלות** · מחיקת הערך מהבקשה → `sends the value under the key the route reads` (**לפני התיקון: 7 עוברות**) · הסרת `min-h-touch` → `is a 44px target…`. **חמש פקודות טרי:** typecheck ✅ · check:core `/lib/core purity: OK` ✅ · **796 בדיקות ✅ (מ-789, 53 קבצים)** · build ✅ · **check:mobile ✅ 594 בדיקות — בדיוק כתחזית התוכנית, 0 חדשות** (השדה נמדד בסריקות הקיימות), כולל `/dev/onboarding` `all tap targets >= 44px` · `primary action in thumb zone` · `primary action visible without scrolling` ב-320/375/414. TD-26 קוים: `pkill` → `pgrep` ריק → `rm -rf .next` → build. ⛔ הפיקסטורה לא נגעה (`verify-mobile.test.ts:190-210` משווה רכיבים, ושניהם מרנדרים `<OnboardingForm>`). ⛔ TD-19/TD-24 בעינם — `0009` טרם הורצה על פרויקט חי. ⛔ לא נטען סקיל עיצוב (שורת T-003 היא `—`) · ⛔ `10-pedagogy.md` לא נפתח · ⛔ אפס סוכני משנה · ⛔ לא נגעתי ב-`main`. | `components/OnboardingForm.tsx` · `components/OnboardingForm.test.ts` · `docs/superpowers/plans/2026-08-13-institution-and-finish.md` (משימה 3 ✅) · `plan/30-architecture.md` (3.1.32) · `plan/50-tasks.md` (T-003) · `plan/00-control.md` |
---

**החוקים המלאים:** `plan/RULES.md` — פריסה (0.2) · מקביליות (0.3) · סוכני משנה (0.4) · שער טריאז' (0.5)
**מטריצת הקריאה:** `project_plan.md`
