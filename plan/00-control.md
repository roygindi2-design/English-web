<!--
NEXT_AGENT: QA                     # ▶️ C-0820 (DEV): `amirnet` — `T-490`·`T-491`·`T-492` 🟣 (ארבעת המסכים נכנסים במסך אחד ב-393×852 וב-375×812, טענות ב-`check:mobile`). `amirnet` ⬜ ל-DEV=0; יעד ② של `05-departments` הושג על נתיבי ה-`/dev`.
STATE: BUILDING                # ▶️ C-0820 (DEV): 3 🟣 חדשות ב-`amirnet`, ממתינות למיזוג.
ACTIVE_MILESTONE: M0              # M0..M6
ACTIVE_TASK_ID: []   # ▶️ C-0529 — ריק.
CRITIC_ROUNDS_ON_TASK: 0          # ⛔ התור הישן הועבר ל-`plan/archive/control-log.md` (26/08) — הוא היה מת: QA הופך 🟣⇢✅ בכמות מ-`git log`.
LAST_HANDOFF_AT: "2026-09-24T21:18:49Z"   # C-0820 (DEV) ⇒ QA.
HUMAN_DECISION_REQUIRED: false    # ▶️ ⛔ אינו ממתין. **44 · 45 · 46 נסגרו כולם ב-23/08.** נותר **47** — שורה ב-`RULES § 0.1 ב׳` שהיא הקובץ של רוי, ו⛔ **אינה חוסמת את הקידום של היום**.
# --- נעילה: מונעת שני סוכנים שכותבים לקובץ בו-זמנית ---
LOCK_HELD_BY: "CONTENT"                    # 🔒 C-0821 (CONTENT) — amirnet-vocab Tier 1/2 batch.
LOCK_AT: "2026-09-24T21:47:08Z"
WORKSTREAM_TICKS:                 # ⚠️ בלם 8 שוכתב 23/08 (רוי): סופר **טיקי עבודה בלבד** — טיק שהסתיים בקומיט. ⛔ טיק שקט/נסיגה/שורה-אחת אינו נספר. תקרה **120 לכל פריט** ב-36-video-spec § 13, ⛔ לא לחזון כולו.
#   story:  21 / 120           # § 13-1 · **המוקד**. ⬜=0 · 🟣=9 · ⛔=2 (נמדד ב-`docs/plan-open.md` אחרי C-0646). הנרטיב ⇒ `plan/archive/control-log.md`
#   nav:     3 / 120           # § 13-2 · **⬜=0 · חתומה · המוקד הוזז→`cards` ב-C-0316 (QA).** פירוט מלא ⇒ `plan/archive/control-log.md` (הוצא C-0418).
#   cards:  21 / 120           # § 13-3 · **⛔ אינה המוקד.** ⬜=**0** — `T-413` 🟣 ב-`C-0705` (חריג ה-🔴 של `F-277`, החצי השני שלו) ⇒ ⛔ **⛔ לא הזזת מוקד**: הריקון קרה בזרימה שאינה המוקד. 🟣=2 · ⛔=1 (`T-237`). חוב ⇒ `plan/61-deferred.md`
#   arena:  40 / 120          # § 13-4 · **המוקד** (←`msgs`, `C-0817` PM). ⬜=3 (`T-487`…`T-489`, ארון הציוד) · 🟣=11 · ⛔=4.
#   studies: 10 / 120         # § 13-5 · **⛔ אינה המוקד** (→`arena`, `C-0698`). ⬜=**0** · 🟣=2 · ✅=5 · ⛔=1 (`C-0701` QA: T-409·T-410·T-414 🟣⇢✅). חוב ⇒ `plan/61-deferred.md`
#   amirnet: 26 / 120          # § 41 § 8-1..3 · **המוקד** (←`arena`, `C-0819` PM). ⬜=0 · 🟣=3 (`T-490`…`T-492`, `C-0820`) · ⛔=2 (`T-312`·`T-324`). SEALS + חוב ⇒ `plan/archive/control-log.md` · `plan/61-deferred.md`
#   general: — / 120          # ⛔ מחוץ לרצף `36 § 13` ⇒ ⛔ אין תקרה. ⬜=1. הנרטיב ⇒ `plan/archive/control-log.md`
#   loop:    — / 120          # ⛔ מחוץ לרצף `36 § 13`. ⬜=3. הנרטיב ⇒ `plan/archive/control-log.md`
#   msgs:    8 / 120           # 39 § 9 · ⛔ **אינה המוקד** (→`arena`, `C-0817` PM). ⬜=1 (`T-193` CONTENT) · 🟣=14 · ⛔=3 (`T-475`…`T-477`, `for-roy` 144). ⇒ `plan/61-deferred.md`
MILESTONE_TICKS: 103           # ⛔ מונה M0 הישן — מוקפא, ⛔ ואינו בלם. הבלם החי הוא WORKSTREAM_TICKS
RELEASE_READY: "9d6406f4 · 2026-09-24T17:31:44Z · **C-0812 (QA, מלא).** `work/current`==`dev`==`9d6406f4` (ff-only, 43 קומיטים מאז `C-0800`). `verify` מלא ירוק (שער השישה-רוחבים על הדחיפה, 4,940 בדיקות `check:mobile`, 3,364 בדיקות יחידה) · `loop:health` 23/23. הלומד מקבל: **קיר הכיתה** — פתיחה/הצטרפות בקוד, פיד פוסטים עם תגובות ולייקים, תגובה מהמקלדת (`T-469`…`T-474`) · **סיפור בהמשכים** — שרשור לכל כיתה, תור אחד לכל תלמיד (`T-478`/`T-479`) · סמן לשוניות מחליק בין הקיר/סיפור/תיבה, וצבע קבוע לכל הקשר בתיבה (`T-480`/`T-481`). ⛔ **אינו כאן** — עדיין ⛔ אין תשתית לבדוק את `main`/Netlify (PROMOTER בלבד). ⚠️ **ופער נמדד בטיק הזה, לא נסתר:** `F-328` (תמונה אופציונלית ב-39§5 לא נבנתה) · `F-329` (`ClassJoin.tsx` בלי `motion-reduce`) · `F-330` (גיליון התגובה מרנדר 2,281 כפתורים ב-DOM) — שלושתם ⬜ פתוחים, ⛔ אף אחד אינו חוסם."
PAUSED_BY_HUMAN: false           # ⚠️ הבלם בודק `== true` בלבד. **נמדד C-0418 ב-`git log` מ-01/09: DEV 55 קומיטים · PM 20 · QA 13** ⇒ שלוש המשימות דלוקות ורצות. רקע ⇒ `plan/archive/control-log.md`
# (DEPLOYS_THIS_MONTH · LAST_DEPLOYED_AT — הוצאו 08/09, `D-203`ⓔ. קפאו ב-23/08; הבלם נמדד מ-`PROMOTIONS_THIS_MONTH`.)
LAST_REVIEWED_COMMIT: "0441f8f5"  # ⛔ השדה עוקב אחרי מה שקודם. C-0711 (OPS) — `dev` ו-`main` שניהם כאן.
# --- כלכלת פריסה: קרדיטים, לא דקות. 15 קרדיטים לפריסה. ראה RULES § 0.1 ---
WORKING_BRANCH: work/current      # ▶️ **שונה 24/08 · RULES § 0.23 · שלב 2.** DEV ו-CONTENT דוחפים לכאן בלבד. ⛔ שם קבוע, ⛔ לעולם לא שם חדש.
MERGE_TARGET: dev                 # רק QA ממזג לכאן, ורק ב-`merge --ff-only`. ⛔ אף סוכן ⛔ אינו דוחף ל-dev ישירות.
ACTIVE_WORKSTREAM: amirnet         # ▶️ **הוזז `C-0819` (PM · `§ 0.23 ז׳` ④).** `arena`: 0 יעדים פתוחים ב-`05` (①–⑥ הושגו, ⬜=0, 🟣=14). גלגול: `studies` ⛔ יעד · `msgs` 0 כשירות (`for-roy` 144) ⇒ `amirnet`: 3 מסכים גולשים ב-393×852 (+98·+126·+22px) ⇒ `T-490`…`T-492`. ⛔ אינה חתימה ⇒ `61-deferred`.
PREV_WORKSTREAM: "arena"     # `C-0819` (PM) — 0 יעדים פתוחים. ⛔ אינה חתומה — נשארת ברוטציה.
WORKSTREAM_ENDING: amirnet · 0 ⬜ נותרו · 2026-09-24T21:18:49Z · C-0820
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
| C-0819 | PM | DEV | 20:53Z | `arena` 0 יעדים פתוחים ⇒ `§ 0.23 ז׳` ④: `studies` ⛔ יעד · `msgs` 0 כשירות ⇒ `amirnet`. נמדד `next start`: practice +98 · result +126 · dashboard +22px @393×852. | `T-490`…`T-492` ⬜ · `for-roy` 146 |





**החוקים המלאים:** `plan/RULES.md` — פריסה (0.2) · מקביליות (0.3) · סוכני משנה (0.4) · שער טריאז' (0.5)
**מטריצת הקריאה:** `project_plan.md`










| C-0814 | PM | DEV | 2026-09-24T17:54:53Z | 🖼️ **`F-328`⇒`D-291`:** תמונה לשאלת קיר מגלריה סגורה (⛔ העלאה) ⇒ `T-484` ציור · `T-485` עמודה · `T-486` בחירה. `T-483` 🟣 (PM, `STEP 5.5`, מקור `F-330`/`F-329`): 2,281⇒73 כפתורים. שמות ⇒ `for-roy` 145. | 3 ⬜ · 1 🟣 |
| C-0817 | PM | DEV | 2026-09-24T19:55:09Z | 🗄️ **המוקד `msgs`⇢`arena` (`§ 0.23 ז׳` ④, 0 כשירות ב-`msgs`).** `kol-B-02` ארון הציוד (`D-292`): `T-487` גזירת «רמת זירה N» · `T-488` גיליון מעל הדמות (4 משבצות כפולות⇒0) · `T-489` תנועה וסגירה. | 3 ⬜ |
