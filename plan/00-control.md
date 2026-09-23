<!--
NEXT_AGENT: DEV                  # ▶️ C-0771 (QA, מסלול: מלא): הגייט נסגר, הנעילה שוחררה.
STATE: BUILD                   # ▶️ C-0771 (QA): מיזוג ל-dev הושלם — 94334b38..0791118e. `arena` נשארת המוקד, 10 ⬜.
ACTIVE_MILESTONE: M0              # M0..M6
ACTIVE_TASK_ID: []   # ▶️ C-0529 — ריק.
CRITIC_ROUNDS_ON_TASK: 0          # ⛔ התור הישן הועבר ל-`plan/archive/control-log.md` (26/08) — הוא היה מת: QA הופך 🟣⇢✅ בכמות מ-`git log`.
LAST_HANDOFF_AT: "2026-09-23T13:29:00Z"   # C-0771 (QA) — גייט מלא, ראה יומן.
HUMAN_DECISION_REQUIRED: false    # ▶️ ⛔ אינו ממתין. **44 · 45 · 46 נסגרו כולם ב-23/08.** נותר **47** — שורה ב-`RULES § 0.1 ב׳` שהיא הקובץ של רוי, ו⛔ **אינה חוסמת את הקידום של היום**.
# --- נעילה: מונעת שני סוכנים שכותבים לקובץ בו-זמנית ---
LOCK_HELD_BY: "DEV"                 # 🔒 C-0773 (DEV) — נעילה נלקחה 2026-09-23T14:10Z. מוקד `arena`, ⬜=10.
LOCK_AT: "2026-09-23T14:10:00Z"
WORKSTREAM_TICKS:                 # ⚠️ בלם 8 שוכתב 23/08 (רוי): סופר **טיקי עבודה בלבד** — טיק שהסתיים בקומיט. ⛔ טיק שקט/נסיגה/שורה-אחת אינו נספר. תקרה **120 לכל פריט** ב-36-video-spec § 13, ⛔ לא לחזון כולו.
#   story:  21 / 120           # § 13-1 · **המוקד**. ⬜=0 · 🟣=9 · ⛔=2 (נמדד ב-`docs/plan-open.md` אחרי C-0646). הנרטיב ⇒ `plan/archive/control-log.md`
#   nav:     3 / 120           # § 13-2 · **⬜=0 · חתומה · המוקד הוזז→`cards` ב-C-0316 (QA).** פירוט מלא ⇒ `plan/archive/control-log.md` (הוצא C-0418).
#   cards:  21 / 120           # § 13-3 · **⛔ אינה המוקד.** ⬜=**0** — `T-413` 🟣 ב-`C-0705` (חריג ה-🔴 של `F-277`, החצי השני שלו) ⇒ ⛔ **⛔ לא הזזת מוקד**: הריקון קרה בזרימה שאינה המוקד. 🟣=2 · ⛔=1 (`T-237`). חוב ⇒ `plan/61-deferred.md`
#   arena:  36 / 120          # § 13-4 · **המוקד**. ⬜=**8** (`T-423` 🟣 ב-`C-0709`) · 🟣=5 · ⛔=3 · ⛔ אינה חתומה. יעד ① — `T-420`ⓓ ו-`T-430` (`F-284`, 932/852 ב-`result`) — ⛔ **אינו נסגר** ב-`C-0709`: המקור הוא `<ActionBar>`, ⛔ ולא הכרום. יעד ④ — `T-423` **נחתה** ⇒ `T-424`..`T-427` פתוחות עכשיו על רצועות בגובה **מוצהר**.
#   studies: 10 / 120         # § 13-5 · **⛔ אינה המוקד** (→`arena`, `C-0698`). ⬜=**0** · 🟣=2 · ✅=5 · ⛔=1 (`C-0701` QA: T-409·T-410·T-414 🟣⇢✅). חוב ⇒ `plan/61-deferred.md`
#   amirnet: 25 / 120          # § 41 § 8-1..3 · **נמסרה ⇒ המוקד עבר ל-`cards` ב-`C-0677` (QA).** ⬜=0 · 🟣→✅ 2 (T-372·T-376) · ⛔=2. SEALS + חוב ⇒ `plan/archive/control-log.md` · `plan/61-deferred.md`
#   general: — / 120          # ⛔ מחוץ לרצף `36 § 13` ⇒ ⛔ אין תקרה. ⬜=1. הנרטיב ⇒ `plan/archive/control-log.md`
#   loop:    — / 120          # ⛔ מחוץ לרצף `36 § 13`. ⬜=3. הנרטיב ⇒ `plan/archive/control-log.md`
#   msgs:    4 / 120           # 39-messages-spec § 9 · ⛔ **⛔ אינה המוקד** (הוזז→`amirnet` ב-C-0625). ⬜=1, `T-193` — **של CONTENT בלבד** ⇒ ⛔ אין ל-DEV שורה כשירה כאן. `WORKSTREAM_ENDING` פעיל.
MILESTONE_TICKS: 103           # ⛔ מונה M0 הישן — מוקפא, ⛔ ואינו בלם. הבלם החי הוא WORKSTREAM_TICKS
RELEASE_READY: "0441f8f5 · 2026-09-18T13:19:30Z · **C-0711 (OPS, ידני).** `dev`==`main`==`0441f8f5` (ff-only, 90 קומיטים ל-main · 28 ל-dev). `verify` exit 0 בריפו החי: 288 קבצים · 5,111 עוברות. ⛔ **ו-`work/current` ⛔ אינו כאן** — 4 קומיטים אחריו נושאים את `F-286` ו⛔ אינם ניתנים לדחיפה."
PAUSED_BY_HUMAN: false           # ⚠️ הבלם בודק `== true` בלבד. **נמדד C-0418 ב-`git log` מ-01/09: DEV 55 קומיטים · PM 20 · QA 13** ⇒ שלוש המשימות דלוקות ורצות. רקע ⇒ `plan/archive/control-log.md`
# (DEPLOYS_THIS_MONTH · LAST_DEPLOYED_AT — הוצאו 08/09, `D-203`ⓔ. קפאו ב-23/08; הבלם נמדד מ-`PROMOTIONS_THIS_MONTH`.)
LAST_REVIEWED_COMMIT: "0441f8f5"  # ⛔ השדה עוקב אחרי מה שקודם. C-0711 (OPS) — `dev` ו-`main` שניהם כאן.
# --- כלכלת פריסה: קרדיטים, לא דקות. 15 קרדיטים לפריסה. ראה RULES § 0.1 ---
WORKING_BRANCH: work/current      # ▶️ **שונה 24/08 · RULES § 0.23 · שלב 2.** DEV ו-CONTENT דוחפים לכאן בלבד. ⛔ שם קבוע, ⛔ לעולם לא שם חדש.
MERGE_TARGET: dev                 # רק QA ממזג לכאן, ורק ב-`merge --ff-only`. ⛔ אף סוכן ⛔ אינו דוחף ל-dev ישירות.
ACTIVE_WORKSTREAM: arena         # ▶️ **קודם `C-0698` (PM · `§ 0.23 ז׳` ①→④).** הספירה, ⛔ ולא תחושה: `studies` יעד פתוח **0** ⇒ התקדמות. ברצף: `msgs` כשיר-לי 0 (‏`R-026`) · `amirnet` 0 · `story` כשיר-לי 0 (‏`F-268`, מיגרציה נדחית) · `nav` **חתומה** ⇒ דילוג · `cards` 0 ⇒ `arena`, **4 יעדים פתוחים**. שש שורות חוב ⇒ `plan/61-deferred.md`. ⛔ **⛔ אינה חתימה.**
PREV_WORKSTREAM: "studies"     # `C-0698` (PM) — שלושת יעדיה הושגו; ⬜=0 · 🟣=5 · ⛔=1. ⛔ **⛔ אינה חתומה**, נשארת ברוטציה.
WORKSTREAM_ENDING: ""   # ⛔ רוקן `C-0698` עם הזזת המוקד (`STEP 5.7`). `arena` נפתחה עם 3 ⬜.
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










| C-0771 | QA | DEV | 2026-09-23T13:29:00Z | 🚦 **מלא — גייט על 19 קומיטים, `arena` (`T-429`·`T-443`·`T-444` 🟣⇢✅).** `verify` ירוק (290/290 · 5282/1 · build · 4284 mobile) · `loop:health` 21/23 (23 חסום ע"י מסווג ⇒ `F-314`; 17 n/m — צפוי, הלופ עלה היום) · smoke 5/5 · הליכה 375×780 נקייה · מיזוג `--ff-only` ל-`dev` (`94334b38`) · `diff:render` ⇒ `F-316`. `arena` נשארת המוקד, 10 ⬜. | `C-0771` · `plan/60-findings.md` (F-314·F-315·F-316) |
| C-0769 | OPS | QA | 2026-09-23T12:20:00Z | 🔄 **אישורי רוי 23/09 בוצעו; הנעילה משוחררת ב-`C-0770`.** ⓐ בדיקה 21 מזהה סשן ידני כחי (`F-310` נסגר) · ⓑ המונה מתאפס בכל חודש (`D-275`) · ⓒ **pre-push חותם `verify(3w)`** ⇒ `verify:attested` מחזיר «הרץ» ⇒ **QA מריצה `npm run verify` המלא לפני כל מיזוג** · ⓓ `data/ngsl-1.2.csv` בריפו ⇒ `T-007` ⬜ · `T-037` ⬜ (CONTENT). | `C-0765`…`C-0769` |
| C-0709 | DEV | QA | 2026-09-17T21:47:00Z | 🔨 **בנייה — `T-423` ⓑ/ⓒ 🟣: הקרב הפסיק להיות כרטיס כהה בתוך דף בהיר.** הכרום יורד **פעם אחת** ב-CSS ⇒ השורש נושא-הסקופ הוא `h-[100dvh]` מלא, ושמונת המספרים של `36 § 8.0` ② נמשכו מ-Figma כ**קואורדינטות** ⇒ `gap-0` ושבע רצועות בגובה מוצהר. … ⟨הנוסח המלא בקומיט `a35ade33`⟩ | `arcade-tokens.css` · `ArenaBattle.tsx` · `verify-mobile.mjs` · רגיסטרים |
