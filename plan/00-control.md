<!--
NEXT_AGENT: DEV                      # ▶️ C-0861 (PM): `arena` ⑦ נפרס — `T-517`·`T-518` ⬜ (מסך סיום אחד).
STATE: BUILDING                # ▶️ C-0858 (QA): 38 קומיטים מוזגו ל-`dev` (ff-only), כלום 🟣 ממתין למיזוג כרגע. RELEASE_READY + שלוש הקשות טריות נכתבו.
ACTIVE_MILESTONE: M0              # M0..M6
ACTIVE_TASK_ID: []   # ▶️ C-0529 — ריק.
CRITIC_ROUNDS_ON_TASK: 0          # ⛔ התור הישן הועבר ל-`plan/archive/control-log.md` (26/08) — הוא היה מת: QA הופך 🟣⇢✅ בכמות מ-`git log`.
LAST_HANDOFF_AT: "2026-09-26T00:57:09Z"   # C-0861 (PM) ⇒ DEV.
HUMAN_DECISION_REQUIRED: false    # ▶️ ⛔ אינו ממתין. **44 · 45 · 46 נסגרו כולם ב-23/08.** נותר **47** — שורה ב-`RULES § 0.1 ב׳` שהיא הקובץ של רוי, ו⛔ **אינה חוסמת את הקידום של היום**.
# --- נעילה: מונעת שני סוכנים שכותבים לקובץ בו-זמנית ---
LOCK_HELD_BY: ""                  # 🔓 C-0861 (PM) שוחררה — `arena` ⑦ ⇒ T-517·T-518 ⬜, NEXT_AGENT=DEV.
LOCK_AT: ""
WORKSTREAM_TICKS:                 # ⚠️ בלם 8 שוכתב 23/08 (רוי): סופר **טיקי עבודה בלבד** — טיק שהסתיים בקומיט. ⛔ טיק שקט/נסיגה/שורה-אחת אינו נספר. תקרה **120 לכל פריט** ב-36-video-spec § 13, ⛔ לא לחזון כולו.
#   story:  22 / 120           # § 13-1 · **המוקד** (←`msgs`, `C-0849` PM). ⬜=0 · 🟣=4 (`T-508`…`T-511`, יעד ②, `C-0850` DEV) · ⛔=2 (`T-266`·`T-269`). ③ ⇒ `for-roy` 150
#   nav:     7 / 120           # § 13-2 · **⛔ אינה המוקד** (→`msgs`, `C-0847` QA). יעד ① `kol-E` נמסר: ⬜=0 · ✅=8 (`T-499`…`T-501`·`T-503`…`T-507`, מוזגו). חוב+חותמות ⇒ `plan/61-deferred.md`
#   cards:  24 / 120           # § 13-3 · **⛔ אינה המוקד** (→`msgs`, `C-0858` QA). **נמסרה וחתומה** — T-516 (`C-0856` DEV) מוזג, ⬜=0, שלוש חותמות נמדדו מקצה לקצה (SEALS · control-log.md). ⛔=1 (`T-237`). חוב+חותמות ⇒ `plan/61-deferred.md`
#   arena:  40 / 120          # § 13-4 · **המוקד** (←`msgs`, `C-0861` PM). ⬜=2 (`T-517`·`T-518`, ⑦ מסך סיום אחד) · 🟣=1 · ⛔=4.
#   studies: 10 / 120         # § 13-5 · **⛔ אינה המוקד** (→`arena`, `C-0698`). ⬜=**0** · 🟣=2 · ✅=5 · ⛔=1 (`C-0701` QA: T-409·T-410·T-414 🟣⇢✅). חוב ⇒ `plan/61-deferred.md`
#   amirnet: 26 / 120          # § 41 § 8-1..3 · **נחתמה `C-0822` (QA) → `msgs`.** ⬜=0 · ✅=3 (`T-490`…`T-492`, מוזגו) · ⛔=2 (`T-312`·`T-324`). SEALS + חוב ⇒ `plan/archive/control-log.md` · `plan/61-deferred.md`
#   general: — / 120          # ⛔ מחוץ לרצף `36 § 13` ⇒ ⛔ אין תקרה. ⬜=1. **⛔ אינה המוקד עוד** (→`nav`, `C-0833` QA). הנרטיב ⇒ `plan/archive/control-log.md`
#   loop:    — / 120          # ⛔ מחוץ לרצף `36 § 13`. ⬜=3. הנרטיב ⇒ `plan/archive/control-log.md`
#   msgs:    9 / 120           # 39 § 9 · **⛔ אינה המוקד** (→`arena`, `C-0861` PM). ⬜=1 (`T-193` CONTENT) · ⛔=3 (`for-roy` 144) ⇒ `plan/61-deferred.md`
MILESTONE_TICKS: 103           # ⛔ מונה M0 הישן — מוקפא, ⛔ ואינו בלם. הבלם החי הוא WORKSTREAM_TICKS
RELEASE_READY: "6732a52e · 2026-09-25T23:50:50Z · **C-0858 (QA, מלא).** `work/current`==`dev`==`6732a52e` (ff-only, 38 קומיטים מאז `e1e25727`). `verify` מלא ירוק (nine-command gate, 5,570 בדיקות `check:mobile`, exit 0) · `loop:health` 22/23 (18 🔴 חוזרת — ענף `claude/blissful-tesla-0q2hup` עדיין נושא פאץ' PM תקוע; `F-334` נסגר בלי לתקן, `F-335` נפתח היום עם טקסט השחזור המלא, ⬜→PM). הלומד מקבל: **סיפור בשלוש פסקאות** + **גודל טקסט נזכר** (`T-508`·`T-509`) · **ספריית הסיפורים** — בוחר סיפור לפי רמה, רואה מה כבר קרא (`T-510`·`T-511`) · **מרכז האפליקציות** עם אייקון+תג קטגוריה אמיתיים במקום checkbox, סוגר `F-332` (`T-512`) · **«לימודים» בזמן טעינה מראה שלד, ⛔ לא מסך כשל** (`T-513`) · **«סינון מילים» ממשיך לסבב הבא בהקשה אחת**, וגודל הסבב (20/35/50) נזכר (`T-514`·`T-515`) · **מסך הכרטיס קורא כמו הרנדר** — כותרת «כרטיסיות»+שבב רמה, יציאה משנית (`T-516`). 🔬 **שלוש החותמות של `cards` (`36 § 13.1`) נמדדו מקצה לקצה בטיק הזה על חשבון Supabase אמיתי וחדש** — הגעה בהקשות, דירוג 5 כרטיסים אמיתיים מקצה לקצה, ושמירה מאומתת גם ישירות מול ה-DB (`word_progress`, `mcp__Supabase__execute_sql`) — ⛔ לא רק ברמת המסך; SEALS מלאות ⇒ `plan/archive/control-log.md`. המוקד התקדם `cards`⇢`msgs` (`§ 0.23 ז׳` ④; `msgs` מחזיקה רק שורת CONTENT). ⚠️ **ממצא לא-חוסם, חדש היום:** `F-336` — `DeckSelector` מציג הודעת כשל גנרית על מצב `no_level` תקין (חשבון בלי רמה נבחרת), ⬜→DEV."
PAUSED_BY_HUMAN: false           # ⚠️ הבלם בודק `== true` בלבד. **נמדד C-0418 ב-`git log` מ-01/09: DEV 55 קומיטים · PM 20 · QA 13** ⇒ שלוש המשימות דלוקות ורצות. רקע ⇒ `plan/archive/control-log.md`
# (DEPLOYS_THIS_MONTH · LAST_DEPLOYED_AT — הוצאו 08/09, `D-203`ⓔ. קפאו ב-23/08; הבלם נמדד מ-`PROMOTIONS_THIS_MONTH`.)
LAST_REVIEWED_COMMIT: "0441f8f5"  # ⛔ השדה עוקב אחרי מה שקודם. C-0711 (OPS) — `dev` ו-`main` שניהם כאן.
# --- כלכלת פריסה: קרדיטים, לא דקות. 15 קרדיטים לפריסה. ראה RULES § 0.1 ---
WORKING_BRANCH: work/current      # ▶️ **שונה 24/08 · RULES § 0.23 · שלב 2.** DEV ו-CONTENT דוחפים לכאן בלבד. ⛔ שם קבוע, ⛔ לעולם לא שם חדש.
MERGE_TARGET: dev                 # רק QA ממזג לכאן, ורק ב-`merge --ff-only`. ⛔ אף סוכן ⛔ אינו דוחף ל-dev ישירות.
ACTIVE_WORKSTREAM: arena          # ▶️ **הוזזה `C-0861` (PM · `§ 0.23 ז׳` ④).** `msgs`: 0 יעדים כשירים ל-PM (⑥ ✅ · הגדר ⛔ `for-roy` 144 · `T-193` CONTENT) ⇒ קדימה: `amirnet` חתומה · `story` ③ ⛔ `for-roy` 150 · `nav`/`cards` חתומות ⇒ `arena` (⛔ לא חתומה) — יעד ⑦ `D-302`.
PREV_WORKSTREAM: "msgs"        # `C-0861` (PM). `msgs` נשארת ברוטציה.
WORKSTREAM_ENDING: "arena · 2 ⬜ נותרו · 2026-09-26T00:57:09Z · C-0861"
# (SEALS · BUDGET_NOTE · הערות הכיווץ — הוצאו 08/09 ל-`plan/archive/control-log.md`.
#  ⛔ אפס צרכנים בכל המאגר: ⛔ אף סקריפט, ⛔ אף כלל ו⛔ אף פרומפט ⛔ אינם קוראים אותם. ⛔ אין להחזירם.
#  SEALS · amirnet — נמדדו C-0822 (QA) לפני הזזת המוקד → msgs. ⇒ `plan/archive/control-log.md`.
#  SEALS · cards — נמדדו C-0858 (QA, מלא) לפני הזזת המוקד → msgs, כולל אימות ⓒ ברמת ה-DB. ⇒ `plan/archive/control-log.md`.)
IMPROVE_TARGET: ""              # 🩺 D-146 · **ריק = המצב כבוי.** ▶️ **C-0412: נוסה ו⛔ לא ניתן להדליק — נמדד.** `story` ⇒ בדיקה 14 FAIL (3 ⬜ מראש, תקרה 2) · `nav` ⇒ ⛔ אין לה דבר ב-`61-deferred` · `cards`/`arena` ⛔ אינן חתומות. פירוט ⇒ `D-184`.
MERGE_BLOCKERS: ""   # 🔬 C-0847 (QA): `scripts/measure-continuations.test.ts` נבדק שוב בבידוד (9/9 ירוק) וכחלק מ-`npm run verify` המלא הטרי (3,466/3,466 + 5,324 בדיקות `check:mobile`, exit 0) — ⛔ אדום. השדה הישן (מ-`C-0841`) היה תיאור של רגע חולף בסדר-ריצה; `for-roy` 148 כבר סומן סגור ע"י `D-294` (`C-0839` OPS). נמחק, ⛔ לא F- חדש.
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
| C-0860 | DEV | QA | 00:18Z | `msgs` ⬜=0 ל-DEV (`T-193` CONTENT) · הרצף כולו ⬜=0/חתום ⇒ ⑤ ⇒ ממצאים ל-DEV: `F-336` (`no_level` ⛔ אינו כשל) · `F-337` (פעימת שלד `infinite`). | 2× 🟣 |
| C-0861 | PM | DEV | 00:57Z | הרצף ⬜=0 ⇒ `§ 0.23 ז׳` ④ `msgs`⇢`arena` (הראשונה ⛔ חתומה עם עבודה ל-PM). ⑦: סוף קרב = 2 מסכים מוערמים (`ArenaBattle.tsx:1300`) ⇒ `D-302`. | 2× ⬜ · D-301 · D-302 |





**החוקים המלאים:** `plan/RULES.md` — פריסה (0.2) · מקביליות (0.3) · סוכני משנה (0.4) · שער טריאז' (0.5)
**מטריצת הקריאה:** `project_plan.md`










