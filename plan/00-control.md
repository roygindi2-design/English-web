<!--
NEXT_AGENT: DEV                     # ▶️ C-0677 (QA, מלא): שער ירוק, מוזג ל-`dev`. `amirnet` נמסרה (ⓐ מלאה · ⓑⓒ קוד+בדיקות — `F-275`) והמוקד עבר ⇢ `cards` (⬜=1, גלגול מסביב, `docs/plan-open.md`). 11 🟣→✅.
STATE: BUILD                   # ▶️ C-0677 (QA): `verify` מלא פעמיים ירוק (284/284·4918/4918·build✅·mobile 1997) · `loop:health` 23/23 (11 נפתר). הליכה 375×780 · 8 מסכי `/dev/amirnet/*` — 0 פגם. פירוט ⇒ `control-log`.
ACTIVE_MILESTONE: M0              # M0..M6
ACTIVE_TASK_ID: []   # ▶️ C-0529 — ריק.
CRITIC_ROUNDS_ON_TASK: 0          # ⛔ התור הישן הועבר ל-`plan/archive/control-log.md` (26/08) — הוא היה מת: QA הופך 🟣⇢✅ בכמות מ-`git log`.
LAST_HANDOFF_AT: "2026-09-17T05:00:00Z"   # C-0677 (QA, מלא). הנעילה הייתה פנויה בפתיחה ⇒ ⛔ אפס סבבי Smart Wait.
HUMAN_DECISION_REQUIRED: false    # ▶️ ⛔ אינו ממתין. **44 · 45 · 46 נסגרו כולם ב-23/08.** נותר **47** — שורה ב-`RULES § 0.1 ב׳` שהיא הקובץ של רוי, ו⛔ **אינה חוסמת את הקידום של היום**.
# --- נעילה: מונעת שני סוכנים שכותבים לקובץ בו-זמנית ---
LOCK_HELD_BY: ""               # 🔓 שוחררה — C-0677 (QA) סגור. מוזג ל-dev, amirnet נחתמה, המוקד ⇢ cards.
LOCK_AT: ""
WORKSTREAM_TICKS:                 # ⚠️ בלם 8 שוכתב 23/08 (רוי): סופר **טיקי עבודה בלבד** — טיק שהסתיים בקומיט. ⛔ טיק שקט/נסיגה/שורה-אחת אינו נספר. תקרה **120 לכל פריט** ב-36-video-spec § 13, ⛔ לא לחזון כולו.
#   story:  21 / 120           # § 13-1 · **המוקד**. ⬜=0 · 🟣=9 · ⛔=2 (נמדד ב-`docs/plan-open.md` אחרי C-0646). הנרטיב ⇒ `plan/archive/control-log.md`
#   nav:     3 / 120           # § 13-2 · **⬜=0 · חתומה · המוקד הוזז→`cards` ב-C-0316 (QA).** פירוט מלא ⇒ `plan/archive/control-log.md` (הוצא C-0418).
#   cards:  18 / 120           # § 13-3 · **המוקד מ-`C-0677` (QA · גלגול מסביב).** ⬜=**1** (`T-400`) · ⛔=1 (`T-237`). שורת חוב קודמת ⇒ `plan/61-deferred.md`
#   arena:  31 / 120          # § 13-4 · **⛔ אינה המוקד.** ⬜=**0** · 🟣→✅ **9** ב-`C-0677` · ⛔=3 · ⛔ אינה חתומה, נשארת ברוטציה. שורת חוב ⇒ `plan/61-deferred.md`
#   studies: 3 / 120           # § 13-5 · ⬜=0. פירוט מלא ⇒ `plan/archive/control-log.md` (הוצא C-0418).
#   amirnet: 25 / 120          # § 41 § 8-1..3 · **נמסרה ⇒ המוקד עבר ל-`cards` ב-`C-0677` (QA).** ⬜=0 · 🟣→✅ 2 (T-372·T-376) · ⛔=2. SEALS + חוב ⇒ `plan/archive/control-log.md` · `plan/61-deferred.md`
#   general: — / 120          # ⛔ מחוץ לרצף `36 § 13` ⇒ ⛔ אין תקרה. ⬜=1. הנרטיב ⇒ `plan/archive/control-log.md`
#   loop:    — / 120          # ⛔ מחוץ לרצף `36 § 13`. ⬜=3. הנרטיב ⇒ `plan/archive/control-log.md`
#   msgs:    4 / 120           # 39-messages-spec § 9 · ⛔ **⛔ אינה המוקד** (הוזז→`amirnet` ב-C-0625). ⬜=1, `T-193` — **של CONTENT בלבד** ⇒ ⛔ אין ל-DEV שורה כשירה כאן. `WORKSTREAM_ENDING` פעיל.
MILESTONE_TICKS: 103           # ⛔ מונה M0 הישן — מוקפא, ⛔ ואינו בלם. הבלם החי הוא WORKSTREAM_TICKS
RELEASE_READY: "4b52ada5 · 2026-09-17T05:23:43Z · **C-0677 (QA, מלא).** `dev`==`work/current` (ff-only, 37 קומיטים מ-69bd9d0d). `verify` מלא ×2 ירוק (284/284·4918/4918·build✅·mobile 1997) · `loop:health` 23/23 (11 נפתר — `STEP 5.8`). הליכה חיה 375×780 · 8 מסכי `/dev/amirnet/*` — 0 פגם חוסם. `STEP 5.8`: `amirnet` נמסרה (ⓐ מלאה, ⓑⓒ קוד+בדיקות בלבד — `F-275`), המוקד ⇢ `cards`. 11 🟣→✅. **ללומד:** תפריט אמירנט מוביל בהקשות לשאלת תרגול אמיתית ולא ל-no-op (`F-265` נסגר); לוח «הקרב האחרון» בבית הזירה; 3 כפתורי יכולת פעילים עם עלות מאנה; רצועת רצף מרחפת בקרב; יד-רפאים מלמדת הטלת קלף בפעם הראשונה. קידום ⇐ PROMOTER בלבד."
PAUSED_BY_HUMAN: false           # ⚠️ הבלם בודק `== true` בלבד. **נמדד C-0418 ב-`git log` מ-01/09: DEV 55 קומיטים · PM 20 · QA 13** ⇒ שלוש המשימות דלוקות ורצות. רקע ⇒ `plan/archive/control-log.md`
# (DEPLOYS_THIS_MONTH · LAST_DEPLOYED_AT — הוצאו 08/09, `D-203`ⓔ. קפאו ב-23/08; הבלם נמדד מ-`PROMOTIONS_THIS_MONTH`.)
LAST_REVIEWED_COMMIT: "4b52ada5"  # dev אחרי C-0677 (QA, מלא). ⛔ לא זז ב-DEV ticks — DEV ⛔ אינו ממזג.
# --- כלכלת פריסה: קרדיטים, לא דקות. 15 קרדיטים לפריסה. ראה RULES § 0.1 ---
WORKING_BRANCH: work/current      # ▶️ **שונה 24/08 · RULES § 0.23 · שלב 2.** DEV ו-CONTENT דוחפים לכאן בלבד. ⛔ שם קבוע, ⛔ לעולם לא שם חדש.
MERGE_TARGET: dev                 # רק QA ממזג לכאן, ורק ב-`merge --ff-only`. ⛔ אף סוכן ⛔ אינו דוחף ל-dev ישירות.
ACTIVE_WORKSTREAM: cards           # ▶️ **הוזז `C-0677` (QA · `STEP 5.8` — מחלקת `36 § 13`, ⬜=0 ⇒ החלטה בטיק).** ‏`docs/plan-open.md` 🔴 «מועמדים לפי הסדר»: `amirnet` מוצתה ⇒ הבא עם עבודה פנויה בגלגול הוא `cards` (⬜=1, `T-400`). SEALS · amirnet ⇒ `control-log`.
PREV_WORKSTREAM: "amirnet"     # `C-0677` (QA) — נמסרה (ⓐ מלאה · ⓑⓒ קוד+בדיקות, `F-275`). ⛔=2 פתוחות (`T-312`·`T-324`, שתיהן חסומות-חיצונית).
WORKSTREAM_ENDING: ""   # רוקן `C-0677` (QA) — האזעקה על `amirnet` טופלה (SEALS + הזזה באותו טיק).
# (SEALS · BUDGET_NOTE · הערות הכיווץ — הוצאו 08/09 ל-`plan/archive/control-log.md`.
#  ⛔ אפס צרכנים בכל המאגר: ⛔ אף סקריפט, ⛔ אף כלל ו⛔ אף פרומפט ⛔ אינם קוראים אותם. ⛔ אין להחזירם.
#  SEALS · amirnet — נמדדו C-0677 (QA) לפני הזזת המוקד → cards. ⇒ `plan/archive/control-log.md`.)
IMPROVE_TARGET: ""              # 🩺 D-146 · **ריק = המצב כבוי.** ▶️ **C-0412: נוסה ו⛔ לא ניתן להדליק — נמדד.** `story` ⇒ בדיקה 14 FAIL (3 ⬜ מראש, תקרה 2) · `nav` ⇒ ⛔ אין לה דבר ב-`61-deferred` · `cards`/`arena` ⛔ אינן חתומות. פירוט ⇒ `D-184`.
MERGE_BLOCKERS: ""                # ⇐ **QA כותב · DEV קורא ראשון.** רק מה שחוסם **מיזוג** ל-`dev` (`§ 0.23 ז׳`). ⛔ לא חסם קידום. ▶️ C-0534 (QA, מלא): `F-219` נסגר — `ops(loop)` איחד את `dev` ל-`work/current` (`65359cb`) לפני הטיק הזה; `rev-list` בשני הכיוונים נמדד **0** על `0851258` לפני הקומיטים של הטיק הזה.
PROMOTION_BLOCKERS: ""           # 🟢 רוקן C-0621 באישור רוי. `/api/health` נמדד **4/4 ירוקות** דרך Kernel (335·420·488·944ms, כל ארבעת ה-checks כולל `database_schema`), ועוד 6/6 ב-14/09 ⇒ **10/10 בשתי דגימות נפרדות.** ⇒ ⛔ «קופצנית» כבר ⛔ אינה טענה מדידה. הנוסח המלא: `plan/archive/control-log.md`. ⇐ PROMOTER בלבד כותב.
DEPLOY_BRANCH: main               # Netlify בונה אך ורק את זה. 🆕 06/09: **רק PROMOTER מקדם לכאן** (`RULES § 0.29`, `5 0 * * *` UTC — ⚠️ הוזז ב-07/09 בבקשה מפורשת של רוי: `0 23` ⇢ `21 23` ⇢ `5 0`, כי `23:21` השאיר 11 דקות בלבד מטיק DEV של 36 דקות). רוי גובר תמיד.
LAST_PROMOTED_AT: "2026-09-16T13:24:07Z"  # 🚢 **C-0655 (OPS) — קידום ידני, הוראת רוי.** `42fe177..4a6b60f` ff-only, 174 קומיטים. שער מלא: `verify` exit 0 על `dev` · עשן 4/4. ⛔ אינו יוצר קומיט על `main`.
PROMOTIONS_THIS_MONTH: 19         # 19 this month (➕ 16/09 13:24Z, C-0655 OPS — ידני, הוראת רוי). תקרה 30/חודש · בלם 11ש׳ (נמדד 47.2ש׳ מאז הקודם).
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










| C-0675 | DEV | QA | 2026-09-17T03:20:00Z | 🔨 **בנייה — הדלת של אמירנט, ועמה קידום המוקד** `arena` ⇢ `amirnet` (`§ 0.23 ז׳` ④; הספירות ב-`ACTIVE_WORKSTREAM`). `T-376` — `AmirnetPracticeFlow` מחבר תפריט ⇒ `GET /api/amirnet/practice` ⇒ `AmirnetQuestion` ⇒ `POST …/result`, וסוגר את `F-265`. סטייה מוצהרת: התפריט הפסיק להיזון מ-`zeroStats()`. `verify` מלא exit 0. | `components/AmirnetPracticeFlow.tsx` · `app/(tabs)/world/amirnet/practice/page.tsx` · `lib/core/amirnetPractice.ts` |
| C-0677 | QA | DEV | 2026-09-17T05:23:43Z | ⭐ **שער מלא — מיזוג ל-`dev` (ff-only, 37 קומיטים), 11 🟣→✅, `RELEASE_READY`.** `verify` מלא ×2 ירוק · `loop:health` 23/23 (11 נפתר). `STEP 5.8`: `amirnet` מוצתה (⬜=0, מחלקת `36 § 13`) ⇒ SEALS (ⓐ מלאה · ⓑⓒ קוד+בדיקות בלבד — `F-275` ל-PM) ⇒ המוקד ⇢ `cards` (⬜=1, גלגול מסביב). | `plan/00-control.md` · `plan/50-tasks.md` · `plan/60-findings.md` · `plan/61-deferred.md` · `docs/plan-open.md` · `docs/plan-tables.md` |
