<!--
NEXT_AGENT: DEV                    # ▶️ C-0800 (QA, מלא): מוזג ל-`dev` (47 קומיטים, ff-only), 39 שורות 🟣⇢✅, `msgs` נשארה המוקד (⬜=2: `T-469`·`T-193`). 2 ממצאים נפתחו (`F-325`·`F-326`, → DEV, קלים).
STATE: BUILDING                # ▶️ C-0800 (QA): שער מלא ירוק, מוזג, אין חוסם.
ACTIVE_MILESTONE: M0              # M0..M6
ACTIVE_TASK_ID: []   # ▶️ C-0529 — ריק.
CRITIC_ROUNDS_ON_TASK: 0          # ⛔ התור הישן הועבר ל-`plan/archive/control-log.md` (26/08) — הוא היה מת: QA הופך 🟣⇢✅ בכמות מ-`git log`.
LAST_HANDOFF_AT: "2026-09-24T11:42:03Z"   # C-0800 (QA). מיזוג + 39 שורות ✅ + 2 ממצאים.
HUMAN_DECISION_REQUIRED: false    # ▶️ ⛔ אינו ממתין. **44 · 45 · 46 נסגרו כולם ב-23/08.** נותר **47** — שורה ב-`RULES § 0.1 ב׳` שהיא הקובץ של רוי, ו⛔ **אינה חוסמת את הקידום של היום**.
# --- נעילה: מונעת שני סוכנים שכותבים לקובץ בו-זמנית ---
LOCK_HELD_BY: ""                    # 🔓 שוחררה — C-0800 (QA) סגור. מיזוג 47 קומיטים ל-dev, verify ירוק, loop:health 23/23.
LOCK_AT: ""
WORKSTREAM_TICKS:                 # ⚠️ בלם 8 שוכתב 23/08 (רוי): סופר **טיקי עבודה בלבד** — טיק שהסתיים בקומיט. ⛔ טיק שקט/נסיגה/שורה-אחת אינו נספר. תקרה **120 לכל פריט** ב-36-video-spec § 13, ⛔ לא לחזון כולו.
#   story:  21 / 120           # § 13-1 · **המוקד**. ⬜=0 · 🟣=9 · ⛔=2 (נמדד ב-`docs/plan-open.md` אחרי C-0646). הנרטיב ⇒ `plan/archive/control-log.md`
#   nav:     3 / 120           # § 13-2 · **⬜=0 · חתומה · המוקד הוזז→`cards` ב-C-0316 (QA).** פירוט מלא ⇒ `plan/archive/control-log.md` (הוצא C-0418).
#   cards:  21 / 120           # § 13-3 · **⛔ אינה המוקד.** ⬜=**0** — `T-413` 🟣 ב-`C-0705` (חריג ה-🔴 של `F-277`, החצי השני שלו) ⇒ ⛔ **⛔ לא הזזת מוקד**: הריקון קרה בזרימה שאינה המוקד. 🟣=2 · ⛔=1 (`T-237`). חוב ⇒ `plan/61-deferred.md`
#   arena:  40 / 120          # § 13-4 · **⛔ אינה המוקד** (הוזז→`msgs`, `C-0788`). ⬜=**0** · 🟣=0 (25 מוזגו) · ⛔=4 (T-088·T-103·T-218·T-447) · ⛔ אינה חתומה (חוסם סביבתי). חוב ⇒ `plan/61-deferred.md`
#   studies: 10 / 120         # § 13-5 · **⛔ אינה המוקד** (→`arena`, `C-0698`). ⬜=**0** · 🟣=2 · ✅=5 · ⛔=1 (`C-0701` QA: T-409·T-410·T-414 🟣⇢✅). חוב ⇒ `plan/61-deferred.md`
#   amirnet: 25 / 120          # § 41 § 8-1..3 · **נמסרה ⇒ המוקד עבר ל-`cards` ב-`C-0677` (QA).** ⬜=0 · 🟣→✅ 2 (T-372·T-376) · ⛔=2. SEALS + חוב ⇒ `plan/archive/control-log.md` · `plan/61-deferred.md`
#   general: — / 120          # ⛔ מחוץ לרצף `36 § 13` ⇒ ⛔ אין תקרה. ⬜=1. הנרטיב ⇒ `plan/archive/control-log.md`
#   loop:    — / 120          # ⛔ מחוץ לרצף `36 § 13`. ⬜=3. הנרטיב ⇒ `plan/archive/control-log.md`
#   msgs:    5 / 120           # 39-messages-spec § 9 · **המוקד** (←`arena`, `C-0788`). ⬜=2: `T-469` (DEV) · `T-193` (CONTENT). `T-460`…`T-462` · `T-464`…`T-468` 🟣 (`C-0796`).
MILESTONE_TICKS: 103           # ⛔ מונה M0 הישן — מוקפא, ⛔ ואינו בלם. הבלם החי הוא WORKSTREAM_TICKS
RELEASE_READY: "f7072205 · 2026-09-24T11:42:03Z · **C-0800 (QA, מלא).** `work/current`==`dev`==`f7072205` (ff-only, 47 קומיטים מאז `C-0788`). `verify` מלא ירוק (שער השישה-רוחבים על הדחיפה, 4,778 בדיקות `check:mobile`) · `loop:health` 23/23. הלומד מקבל: מקלדת ההודעות מסודרת לפי שכיחות עם קטגוריות וניגודיות (`T-464`…`T-466`) · כיתות סגורות להצטרפות בקוד, `0032`/`0033` הוחלו על הפרויקט החי (`T-467`/`T-468`) · מנוע המשכים לתשובות במקלדת (`T-460`…`T-462`) · תיקון תאריך מבחן שעבר (`T-352`) · זירה: קלף ראשי מובחן, שלוש התקפות שונות, רצף מתאפס בפגיעה, ניצחון לפי חיים (`T-426`·`T-435`·`T-455`·`T-450`). ⛔ **אינו כאן** — עדיין ⛔ אין תשתית לבדוק את `main`/Netlify (PROMOTER בלבד)."
PAUSED_BY_HUMAN: false           # ⚠️ הבלם בודק `== true` בלבד. **נמדד C-0418 ב-`git log` מ-01/09: DEV 55 קומיטים · PM 20 · QA 13** ⇒ שלוש המשימות דלוקות ורצות. רקע ⇒ `plan/archive/control-log.md`
# (DEPLOYS_THIS_MONTH · LAST_DEPLOYED_AT — הוצאו 08/09, `D-203`ⓔ. קפאו ב-23/08; הבלם נמדד מ-`PROMOTIONS_THIS_MONTH`.)
LAST_REVIEWED_COMMIT: "0441f8f5"  # ⛔ השדה עוקב אחרי מה שקודם. C-0711 (OPS) — `dev` ו-`main` שניהם כאן.
# --- כלכלת פריסה: קרדיטים, לא דקות. 15 קרדיטים לפריסה. ראה RULES § 0.1 ---
WORKING_BRANCH: work/current      # ▶️ **שונה 24/08 · RULES § 0.23 · שלב 2.** DEV ו-CONTENT דוחפים לכאן בלבד. ⛔ שם קבוע, ⛔ לעולם לא שם חדש.
MERGE_TARGET: dev                 # רק QA ממזג לכאן, ורק ב-`merge --ff-only`. ⛔ אף סוכן ⛔ אינו דוחף ל-dev ישירות.
ACTIVE_WORKSTREAM: msgs         # ▶️ **הוזז `C-0788` (QA · STEP 5.8).** `arena` ⬜=0 (`docs/plan-open.md` 🔴 «מועמדים לפי הסדר» · `loop:health` 11) ⇒ הבא ברצף עם עבודה פנויה הוא `msgs` (1 ⬜ — `T-193`, CONTENT בלבד). ⛔ **⛔ אינה חתימה** — שלוש החותמות `36 § 13.1` ⛔ נמדדו (חוסם סביבתי, `F-275`/פריט 77, ⛔ לא פער מוצר). מה שנמדד: הליכת `/dev/arcade/*` (6/6 מסכים 200, 0 שגיאות, 0 גלילה, 0 מתחת ל-44px) · `verify` מלא ירוק · סקירת אנימציה נקייה. חוב ⇒ `plan/61-deferred.md` («arena (מעבר רביעי)»).
PREV_WORKSTREAM: "arena"     # `C-0788` (QA) — ⬜=0, 25 🟣 מוזגו ל-`dev` בטיק הזה. ⛔ **⛔ אינה חתומה** (שלוש החותמות חסומות סביבתית, ⛔ לא פער מוצר) — נשארת ברוטציה.
WORKSTREAM_ENDING: ""   # STEP 5.7 — נוקה `C-0795`: `msgs` ⬜=7 (>5).
# (SEALS · BUDGET_NOTE · הערות הכיווץ — הוצאו 08/09 ל-`plan/archive/control-log.md`.
#  ⛔ אפס צרכנים בכל המאגר: ⛔ אף סקריפט, ⛔ אף כלל ו⛔ אף פרומפט ⛔ אינם קוראים אותם. ⛔ אין להחזירם.
#  SEALS · amirnet — נמדדו C-0677 (QA) לפני הזזת המוקד → cards. ⇒ `plan/archive/control-log.md`.)
IMPROVE_TARGET: ""              # 🩺 D-146 · **ריק = המצב כבוי.** ▶️ **C-0412: נוסה ו⛔ לא ניתן להדליק — נמדד.** `story` ⇒ בדיקה 14 FAIL (3 ⬜ מראש, תקרה 2) · `nav` ⇒ ⛔ אין לה דבר ב-`61-deferred` · `cards`/`arena` ⛔ אינן חתומות. פירוט ⇒ `D-184`.
MERGE_BLOCKERS: ""                # 🟢 רוקן `C-0714` — `F-286` נסגר באישור רוי (טענת יחס). `verify` exit 0, 288/288.
PROMOTION_BLOCKERS: "C-0772 (PROMOTER, 13:45 tick): `git merge --ff-only origin/dev` on `main` refused by the Claude Code auto mode classifier — exact text: «Permission for this action was denied by the Claude Code auto mode classifier. Reason: [Production Deploy].» ⛔ Not a red `verify` (verify was green, exit 0, 5282/5282). ⛔ Not worked around, not rephrased, not retried — per `docs/agents/PROMOTER.md` STEP E, a refusal is final. `auto_mode_allow: []` on the scheduled Routine (item 135, `plan/03-for-roy.md`) is the same root cause already blocking Supabase migrations — it now also blocks the promoter's own merge. Gate was otherwise all-green: `verify` 9/9 · `loop:health` 21/23 (2 known non-blocking) · 21 commits `main..dev`, real ff. ⇐ PROMOTER בלבד כותב."
DEPLOY_BRANCH: main               # Netlify בונה אך ורק את זה. 🆕 06/09: **רק PROMOTER מקדם לכאן** (`RULES § 0.29`, `5 0 * * *` UTC — ⚠️ הוזז ב-07/09 בבקשה מפורשת של רוי: `0 23` ⇢ `21 23` ⇢ `5 0`, כי `23:21` השאיר 11 דקות בלבד מטיק DEV של 36 דקות). רוי גובר תמיד.
LAST_PROMOTED_AT: "2026-09-18T13:19:30Z"  # 🚢 **C-0711 (OPS) — ידני, הוראת רוי, הלופ כבוי.** `3b401b2e..0441f8f5` · **90 קומיטים** · ff-only. עשן מלא עבר: נתיב חדש-בלבד 200 · בקרה שלילית 404 · `/api/health` 3/3 `ok:true`.
PROMOTIONS_THIS_MONTH: 21         # 21 (➕ 18/09, C-0711). 🔄 מתאפס בכל חודש קלנדרי — PROMOTER, `§ 0.29 ד׳` (C-0766).
```

> 🧑‍⚖️ שתי ביקורות ידניות של רוי — **הפירוט המלא, כולל מצב כל ממצא, ב-`plan/OPERATOR-LOG.md`.**
> ⚡ סקילים של superpowers פעילים (`RULES.md` § 0.7). החוק הקשה: אין טענת הצלחה בלי ריצה טרייה.

### 0.1 יומן העברות מקל — 2 האחרונים בלבד

> ⚠️ **שורה אחת ביומן, ⛔ ולא שתיים** — התקרה נפרצה פעמיים כך (C-0261 · C-0293). שתי המדידות ⇢ `plan/archive/handoff-log.md`.

> 2 שורות לרשומה. ישן יותר → `plan/archive/handoff-log.md`. ההיסטוריה המלאה בגיט.

| Cycle | מסוכן | לסוכן | בשעה | סיבת ההעברה (עד 2 שורות) | תוצר |
|---|---|---|---|---|---|





**החוקים המלאים:** `plan/RULES.md` — פריסה (0.2) · מקביליות (0.3) · סוכני משנה (0.4) · שער טריאז' (0.5)
**מטריצת הקריאה:** `project_plan.md`










| C-0797 | OPS | QA | 2026-09-24T09:38:09Z | 🔎 **בדיקת תפעול אחרי הדלקת הלופ (הוראת רוי 24/09).** ⓐ **22 שורות 🟣 שקוד המסירה שלהן כבר ב-`dev`** (נמדד `git merge-base --is-ancestor` לכל קומיט מסירה): `T-232`·`T-240`·`T-374`·`T-387`·`T-400`·`T-405`·`T-406`·`T-413`·`T-416`·`T-417`·`T-418`·`T-421`·`T-422`·`T-423`·`T-426`·`T-435`·`T-450`·`T-452`·`T-453`·`T-454`·`T-455`·`T-456` ⇒ **QA: הפיכה ל-✅ או ממצא בשורה עצמה** — `C-0788` מיזג 18 קומיטים והפך 5. ⓑ **pre-push: דחיפה ל-`dev`/`main` מריצה `verify` מלא בשישה רוחבים** — `RELEASE_READY` של `C-0788` רשם `verify(3w)` כ«מלא». | `scripts/hooks/pre-push` |
| C-0790 | PM | DEV | 2026-09-24T05:54:01Z | 🔬 **`R-026` נסגרה במדידה (`D-283`):** Tatoeba 2.04M משפטים ⇒ 545,864 ב-A1–A2 (CEFR-J); עץ-קידומות נצפה — חציון 6 המשכים, 0 מבויות; backoff נדחה (87.5% אנגלית שלא נצפתה). ⇒ `T-460` מנוע · `T-461` מקלדת (`kol-C-14..17`) · `T-462` שליחה. `F-320` ⇒ `D-284` (ⓐ). | `C-0790` · `D-283` · `D-284` |
| C-0795 | PM | DEV | 2026-09-24T08:53:36Z | 🔬 **פער `diff:render` נמדד (`kol-C-15`):** המקלדת נפתחת על 1,149 בלוקים בסדר מזהה — `We` בבלוק 168 ⇒ `T-464` סדר שכיחות · `T-465` קטגוריות · `T-466` בהיר (`F-323`⇒`D-286`). `39 § 9`-3 ⇒ `T-467`→`T-469` כיתה (`D-287`, for-roy 141). `F-321`⇒`D-285`. | `C-0795` · `D-285`…`D-287` |
