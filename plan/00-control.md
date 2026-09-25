<!--
NEXT_AGENT: QA                     # ▶️ C-0845 (DEV): `nav` יעד ① — חמשת המסכים נבנו (`T-503`…`T-507` 🟣). ⬜=0 ⇒ חותמת/מיזוג.
STATE: BUILDING                # ▶️ C-0845 (DEV): 9 🟣 ממתינים למיזוג (`T-499`…`T-501`·`T-503`…`T-507` ב-`nav` · `T-502` ב-`cards`).
ACTIVE_MILESTONE: M0              # M0..M6
ACTIVE_TASK_ID: []   # ▶️ C-0529 — ריק.
CRITIC_ROUNDS_ON_TASK: 0          # ⛔ התור הישן הועבר ל-`plan/archive/control-log.md` (26/08) — הוא היה מת: QA הופך 🟣⇢✅ בכמות מ-`git log`.
LAST_HANDOFF_AT: "2026-09-25T16:08:51Z"   # C-0845 (DEV) ⇒ QA.
HUMAN_DECISION_REQUIRED: false    # ▶️ ⛔ אינו ממתין. **44 · 45 · 46 נסגרו כולם ב-23/08.** נותר **47** — שורה ב-`RULES § 0.1 ב׳` שהיא הקובץ של רוי, ו⛔ **אינה חוסמת את הקידום של היום**.
# --- נעילה: מונעת שני סוכנים שכותבים לקובץ בו-זמנית ---
LOCK_HELD_BY: ""                  # 🔓 C-0845 (DEV) — שוחררה.
LOCK_AT: ""
WORKSTREAM_TICKS:                 # ⚠️ בלם 8 שוכתב 23/08 (רוי): סופר **טיקי עבודה בלבד** — טיק שהסתיים בקומיט. ⛔ טיק שקט/נסיגה/שורה-אחת אינו נספר. תקרה **120 לכל פריט** ב-36-video-spec § 13, ⛔ לא לחזון כולו.
#   story:  21 / 120           # § 13-1 · **המוקד**. ⬜=0 · 🟣=9 · ⛔=2 (נמדד ב-`docs/plan-open.md` אחרי C-0646). הנרטיב ⇒ `plan/archive/control-log.md`
#   nav:     6 / 120           # § 13-2 · **המוקד** (נפתחה מחדש `C-0833` QA). יעד ① `kol-E` ⇒ ⬜=**0** · 🟣=8 (`T-499`…`T-501` · `T-503`…`T-507`, `C-0845` DEV) ⇒ 6/6 רנדרים בנויים, ממתינה לחותמת.
#   cards:  22 / 120           # § 13-3 · **⛔ אינה המוקד.** ⬜=**0** (`T-502` 🟣 `C-0843`, DEV, קריאה-קדימה) — `T-413` 🟣 ב-`C-0705` (חריג ה-🔴 של `F-277`, החצי השני שלו) ⇒ ⛔ **⛔ לא הזזת מוקד**: הריקון קרה בזרימה שאינה המוקד. 🟣=2 · ⛔=1 (`T-237`). חוב ⇒ `plan/61-deferred.md`
#   arena:  40 / 120          # § 13-4 · **המוקד** (←`msgs`, `C-0817` PM). ⬜=3 (`T-487`…`T-489`, ארון הציוד) · 🟣=11 · ⛔=4.
#   studies: 10 / 120         # § 13-5 · **⛔ אינה המוקד** (→`arena`, `C-0698`). ⬜=**0** · 🟣=2 · ✅=5 · ⛔=1 (`C-0701` QA: T-409·T-410·T-414 🟣⇢✅). חוב ⇒ `plan/61-deferred.md`
#   amirnet: 26 / 120          # § 41 § 8-1..3 · **נחתמה `C-0822` (QA) → `msgs`.** ⬜=0 · ✅=3 (`T-490`…`T-492`, מוזגו) · ⛔=2 (`T-312`·`T-324`). SEALS + חוב ⇒ `plan/archive/control-log.md` · `plan/61-deferred.md`
#   general: — / 120          # ⛔ מחוץ לרצף `36 § 13` ⇒ ⛔ אין תקרה. ⬜=1. **⛔ אינה המוקד עוד** (→`nav`, `C-0833` QA). הנרטיב ⇒ `plan/archive/control-log.md`
#   loop:    — / 120          # ⛔ מחוץ לרצף `36 § 13`. ⬜=3. הנרטיב ⇒ `plan/archive/control-log.md`
#   msgs:    8 / 120           # 39 § 9 · **המוקד** (←`amirnet`, `C-0822` QA, גלגול — הרצף הגיע לסופו). ⬜=1 (`T-193` CONTENT) · 🟣=14 · ⛔=3 (`T-475`…`T-477`, `for-roy` 144). ⇒ `plan/61-deferred.md`
MILESTONE_TICKS: 103           # ⛔ מונה M0 הישן — מוקפא, ⛔ ואינו בלם. הבלם החי הוא WORKSTREAM_TICKS
RELEASE_READY: "cbf56539 · 2026-09-24T23:25:00Z · **C-0822 (QA, מלא).** `work/current`==`dev`==`cbf56539` (ff-only, 26 קומיטים מאז `C-0815`). `verify` מלא ירוק (nine-command gate, 5,030 בדיקות `check:mobile`, 3,381 בדיקות יחידה) · `loop:health` 22/23 (11 🔴 צפויה — `amirnet` מוצתה, נחתמה באותו טיק, המוקד גלגל ל-`msgs`). הלומד מקבל: **תפריט התרגול/סיכום/דשבורד/סימולציה של אמירנט** כבר לא גולשים ב-393×852/375×812 (`T-490`…`T-492`) · **ארון הציוד בזירה** נפתח כגיליון עם רמת-פתיחה לכל פריט (`T-487`…`T-489`) · **תיבת הודעות קרה** מציגה שלד טעינה (`T-482`). ⚠️ **ופער נמדד בטיק הזה, לא נסתר:** `F-331` (דשבורד אמירנט: מסך session_expired בלי קישור התחברות) — ⬜ פתוח, ⛔ אינו חוסם. 🧹 **ותיקון רגיסטר:** 32 שורות 🟣 ישנות (מאז `C-0729`) שכבר היו ב-`dev`/`main` תוקנו ל-✅ בטיק הזה."
PAUSED_BY_HUMAN: false           # ⚠️ הבלם בודק `== true` בלבד. **נמדד C-0418 ב-`git log` מ-01/09: DEV 55 קומיטים · PM 20 · QA 13** ⇒ שלוש המשימות דלוקות ורצות. רקע ⇒ `plan/archive/control-log.md`
# (DEPLOYS_THIS_MONTH · LAST_DEPLOYED_AT — הוצאו 08/09, `D-203`ⓔ. קפאו ב-23/08; הבלם נמדד מ-`PROMOTIONS_THIS_MONTH`.)
LAST_REVIEWED_COMMIT: "0441f8f5"  # ⛔ השדה עוקב אחרי מה שקודם. C-0711 (OPS) — `dev` ו-`main` שניהם כאן.
# --- כלכלת פריסה: קרדיטים, לא דקות. 15 קרדיטים לפריסה. ראה RULES § 0.1 ---
WORKING_BRANCH: work/current      # ▶️ **שונה 24/08 · RULES § 0.23 · שלב 2.** DEV ו-CONTENT דוחפים לכאן בלבד. ⛔ שם קבוע, ⛔ לעולם לא שם חדש.
MERGE_TARGET: dev                 # רק QA ממזג לכאן, ורק ב-`merge --ff-only`. ⛔ אף סוכן ⛔ אינו דוחף ל-dev ישירות.
ACTIVE_WORKSTREAM: nav        # ▶️ **נפתחה מחדש `C-0833` (QA · `RULES § 0.23 ז׳` ⓪, `F-261`).** `general` היא חדר המתנה, ⛔ ולא מחלקה, והרצף `36 § 13` החזיק עבודה (`docs/plan-open.md` 🔴 «מועמדים לפי הסדר»: `msgs` 1⬜) ⇒ המוקד חייב לחזור. נספר: `msgs` ⬜=1 שייכת ל-CONTENT בלבד (`T-193`) — ⛔ אין בה שורה ל-PM/DEV, בדיוק כפי ש-PM מדד ב-`C-0828`/`C-0832`. **המנוף האמיתי היחיד** הוא `nav` — חתומה מ-`C-0316`, אך נושאת יעד ① פתוח לגמרי (`kol-E-02`…`07`, 0/6 רנדרים בנויים, הוראת רוי מ-17/09) שרשום כ"פתיחה מחדש של QA בלבד" (`36 § 13.1`) ומחכה 8 ימים. ⇒ פתיחה מחדש עכשיו, ⛔ לא דילוג נוסף. PM: כתוב שורות T- ל-6 המסכים.
PREV_WORKSTREAM: "general"        # `C-0833` (QA) — פתיחה מחדש, ⛔ לא חתימה חדשה על `general` (מעולם ⛔ אינה נחתמת).
WORKSTREAM_ENDING: "nav · 0 ⬜ נותרו · 2026-09-25T16:08:51Z · C-0845"
# (SEALS · BUDGET_NOTE · הערות הכיווץ — הוצאו 08/09 ל-`plan/archive/control-log.md`.
#  ⛔ אפס צרכנים בכל המאגר: ⛔ אף סקריפט, ⛔ אף כלל ו⛔ אף פרומפט ⛔ אינם קוראים אותם. ⛔ אין להחזירם.
#  SEALS · amirnet — נמדדו C-0822 (QA) לפני הזזת המוקד → msgs. ⇒ `plan/archive/control-log.md`.)
IMPROVE_TARGET: ""              # 🩺 D-146 · **ריק = המצב כבוי.** ▶️ **C-0412: נוסה ו⛔ לא ניתן להדליק — נמדד.** `story` ⇒ בדיקה 14 FAIL (3 ⬜ מראש, תקרה 2) · `nav` ⇒ ⛔ אין לה דבר ב-`61-deferred` · `cards`/`arena` ⛔ אינן חתומות. פירוט ⇒ `D-184`.
MERGE_BLOCKERS: "verify אדום — `scripts/measure-continuations.test.ts:87` (סדר 2 = 9.0% < רצפת 10%). ⛔ קוד לא נגע בזה: כשל נמדד זהה לזה שדיווח PM ב-`C-0832` ⇒ `for-roy` 148 (ⓑ עוברת פי 90, ⓐ הרצפה נופלת — סף שרק רוי רשאי להזיז). QA לא ממזג עד תשובה. ⛔ אין F- חדש נפתח."
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
| C-0845 | DEV | QA | 16:08Z | `nav` יעד ①: בניתי את חמשת המסכים מהמסגרות של PM (`3341:3`·`70`·`111`·`152`) — מרכז אפליקציות, טבעת אישית, מיקום, עריכה, גרירה. `verify` מלא ירוק בכל דחיפה. ⬜=0 ⇒ חותמת. | `T-503`…`T-507` 🟣 |
| C-0844 | PM | DEV | 14:55Z | `nav` ⬜=0 עם יעד ① פתוח; DEV ביקש פעמיים מסגרות Figma. ציירתי 4 (`3341:3`·`70`·`111`·`152`) והכרעתי אחסון+500ms (`D-296`). | `T-503`…`T-507` ⬜ |





**החוקים המלאים:** `plan/RULES.md` — פריסה (0.2) · מקביליות (0.3) · סוכני משנה (0.4) · שער טריאז' (0.5)
**מטריצת הקריאה:** `project_plan.md`










