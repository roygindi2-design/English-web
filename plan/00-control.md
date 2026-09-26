<!--
NEXT_AGENT: DEV                       # ▶️ C-0878 (PM): המוקד ⇢ `base` (`§ 0.23 ז׳` ⑤) ⇒ `T-377`·`T-327` ⬜ כשירות. QA עדיין חייבת מיזוג `T-520`…`T-522` 🟣.
STATE: BUILDING                # ▶️ C-0867 (QA): 41 קומיטים מוזגו ל-`dev` (ff-only, פעמיים בטיק הזה), כלום 🟣 ממתין למיזוג כרגע. RELEASE_READY + שלוש הקשות טריות נכתבו. arena נמסרה וחתומה.
ACTIVE_MILESTONE: M0              # M0..M6
ACTIVE_TASK_ID: []   # ▶️ C-0529 — ריק.
CRITIC_ROUNDS_ON_TASK: 0          # ⛔ התור הישן הועבר ל-`plan/archive/control-log.md` (26/08) — הוא היה מת: QA הופך 🟣⇢✅ בכמות מ-`git log`.
LAST_HANDOFF_AT: "2026-09-26T11:54:06Z"   # C-0878 (PM) ⇒ DEV.
HUMAN_DECISION_REQUIRED: false    # ▶️ ⛔ אינו ממתין. **44 · 45 · 46 נסגרו כולם ב-23/08.** נותר **47** — שורה ב-`RULES § 0.1 ב׳` שהיא הקובץ של רוי, ו⛔ **אינה חוסמת את הקידום של היום**.
# --- נעילה: מונעת שני סוכנים שכותבים לקובץ בו-זמנית ---
LOCK_HELD_BY: "dev-agent"         # 🔒 C-0879 (DEV).
LOCK_AT: "2026-09-26T12:07:49Z"
WORKSTREAM_TICKS:                 # ⚠️ בלם 8 שוכתב 23/08 (רוי): סופר **טיקי עבודה בלבד** — טיק שהסתיים בקומיט. ⛔ טיק שקט/נסיגה/שורה-אחת אינו נספר. תקרה **120 לכל פריט** ב-36-video-spec § 13, ⛔ לא לחזון כולו.
#   story:  22 / 120           # § 13-1 · **המוקד** (←`msgs`, `C-0849` PM). ⬜=0 · 🟣=4 (`T-508`…`T-511`, יעד ②, `C-0850` DEV) · ⛔=2 (`T-266`·`T-269`). ③ ⇒ `for-roy` 150
#   nav:     7 / 120           # § 13-2 · **⛔ אינה המוקד** (→`msgs`, `C-0847` QA). יעד ① `kol-E` נמסר: ⬜=0 · ✅=8 (`T-499`…`T-501`·`T-503`…`T-507`, מוזגו). חוב+חותמות ⇒ `plan/61-deferred.md`
#   cards:  24 / 120           # § 13-3 · **⛔ אינה המוקד** (→`msgs`, `C-0858` QA). **נמסרה וחתומה** — T-516 (`C-0856` DEV) מוזג, ⬜=0, שלוש חותמות נמדדו מקצה לקצה (SEALS · control-log.md). ⛔=1 (`T-237`). חוב+חותמות ⇒ `plan/61-deferred.md`
#   arena:  42 / 120          # § 13-4 · **⛔ אינה המוקד** (→`msgs`, `C-0867` QA). **נמסרה וחתומה** — T-517·T-518·T-451 מוזגו, ⬜=0, שלוש חותמות מקצה לקצה כולל DB חי (SEALS · control-log.md). ⛔=4. חוב+חותמות ⇒ `plan/61-deferred.md`
#   studies: 10 / 120         # § 13-5 · **⛔ אינה המוקד** (→`arena`, `C-0698`). ⬜=**0** · 🟣=2 · ✅=5 · ⛔=1 (`C-0701` QA: T-409·T-410·T-414 🟣⇢✅). חוב ⇒ `plan/61-deferred.md`
#   amirnet: 26 / 120          # § 41 § 8-1..3 · **נחתמה `C-0822` (QA) → `msgs`.** ⬜=0 · ✅=3 (`T-490`…`T-492`, מוזגו) · ⛔=2 (`T-312`·`T-324`). SEALS + חוב ⇒ `plan/archive/control-log.md` · `plan/61-deferred.md`
#   general: — / 120          # ⛔ מחוץ לרצף `36 § 13` ⇒ ⛔ אין תקרה. ⬜=1. **⛔ אינה המוקד עוד** (→`nav`, `C-0833` QA). הנרטיב ⇒ `plan/archive/control-log.md`
#   loop:    — / 120          # ⛔ מחוץ לרצף `36 § 13`. ⬜=3. הנרטיב ⇒ `plan/archive/control-log.md`
#   msgs:   10 / 120           # 39 § 9 · **⛔ אינה המוקד** (→`base`, `C-0878` PM; ←`arena` `C-0867`). ⬜=1 (`T-193` CONTENT) · ⛔=3 (`for-roy` 144) ⇒ `plan/61-deferred.md`
MILESTONE_TICKS: 103           # ⛔ מונה M0 הישן — מוקפא, ⛔ ואינו בלם. הבלם החי הוא WORKSTREAM_TICKS
RELEASE_READY: "1d809979 · 2026-09-26T06:03:33Z · **C-0867 (QA, מלא).** `work/current`==`dev`==`1d809979` (ff-only, 41 קומיטים מאז `6732a52e`). `verify` מלא ירוק פעמיים (once against `work/current`, once against `dev` — nine-command gate, 5,551 בדיקות `check:mobile`, exit 0 בשתיהן) · `loop:health` 23/23. הלומד מקבל: **קרב זירה שנגמר במסך אחד** — כותרת אחת, שתי פעולות (`עוד קרב`/`חזרה לעולם`) במקום שני מסכים מוערמים (`T-517`) · **המילים שהפילו אותך** גלויות על המסך הראשון בלי גלילה (`T-518`) · **«חזרה מהירה»** — עד שלוש מילים שהוחטאו חוזרות פעם אחת מחוץ לשעון אחרי הקרב (`T-451`) · **פתיחה יומית מהירה יותר** — המסך נצבע מהמטמון תוך 800ms במקום להמתין 2–6 שניות להתעוררות השרת, כשיש עותק שמור (`T-519`). 🔬 **שלוש החותמות של `arena` (`36 § 13.1`) נמדדו מקצה לקצה בטיק הזה על חשבון Supabase אמיתי וחדש** — הגעה בהקשות אמיתיות (signup⇢onboarding⇢עולם⇢זירה), קרב מלא עד תום השעון על נתונים אמיתיים, ושמירה מאומתת גם ישירות מול ה-DB (`arcade_runs`/`arcade_progress`/`arcade_collected_words`, `mcp__Supabase__execute_sql`) — ⛔ בניגוד לשני המעברים הקודמים של `arena` (`C-0367`/`C-0514`) שנחסמו מ-DB חי ונשארו חלקיים. SEALS מלאות ⇒ `plan/archive/control-log.md`. המוקד התקדם `arena`⇢`msgs` (`§ 0.23 ז׳` ④). 🧹 **תיקון רגיסטר:** `F-247` תוקן (הפניה לקובץ מת) · 5 שורות 🟣 ישנות הוחזרו ✅ בכמות מ-`git log` (חלקן כבר היו ב-`dev`, כמו `T-144`). ⛔ אין ממצא חדש חוסם."
PAUSED_BY_HUMAN: false           # ⚠️ הבלם בודק `== true` בלבד. **נמדד C-0418 ב-`git log` מ-01/09: DEV 55 קומיטים · PM 20 · QA 13** ⇒ שלוש המשימות דלוקות ורצות. רקע ⇒ `plan/archive/control-log.md`
# (DEPLOYS_THIS_MONTH · LAST_DEPLOYED_AT — הוצאו 08/09, `D-203`ⓔ. קפאו ב-23/08; הבלם נמדד מ-`PROMOTIONS_THIS_MONTH`.)
LAST_REVIEWED_COMMIT: "0441f8f5"  # ⛔ השדה עוקב אחרי מה שקודם. C-0711 (OPS) — `dev` ו-`main` שניהם כאן.
# --- כלכלת פריסה: קרדיטים, לא דקות. 15 קרדיטים לפריסה. ראה RULES § 0.1 ---
WORKING_BRANCH: work/current      # ▶️ **שונה 24/08 · RULES § 0.23 · שלב 2.** DEV ו-CONTENT דוחפים לכאן בלבד. ⛔ שם קבוע, ⛔ לעולם לא שם חדש.
MERGE_TARGET: dev                 # רק QA ממזג לכאן, ורק ב-`merge --ff-only`. ⛔ אף סוכן ⛔ אינו דוחף ל-dev ישירות.
ACTIVE_WORKSTREAM: base          # ▶️ **הוזזה `C-0878` (PM · `§ 0.23 ז׳` ⑤).** ברצף ⛔ אין עבודה כשירה: `msgs` ⑦ 🟣 + גדר ⛔ `for-roy` 144 · `story` ③ ⛔ 150 · השאר חתומות/ללא יעד. ⓪ נבחן מחדש בכל טיק.
PREV_WORKSTREAM: "msgs"        # `C-0878` (PM). `msgs` נשארת ברוטציה (⛔ לא נחתמה).
WORKSTREAM_ENDING: ""
# (SEALS · BUDGET_NOTE · הערות הכיווץ — הוצאו 08/09 ל-`plan/archive/control-log.md`.
#  ⛔ אפס צרכנים בכל המאגר: ⛔ אף סקריפט, ⛔ אף כלל ו⛔ אף פרומפט ⛔ אינם קוראים אותם. ⛔ אין להחזירם.
#  SEALS · amirnet — נמדדו C-0822 (QA) לפני הזזת המוקד → msgs. ⇒ `plan/archive/control-log.md`.
#  SEALS · cards — נמדדו C-0858 (QA, מלא) לפני הזזת המוקד → msgs, כולל אימות ⓒ ברמת ה-DB. ⇒ `plan/archive/control-log.md`.
#  SEALS · arena — נמדדו C-0867 (QA, מלא) לפני הזזת המוקד → msgs, כולל אימות ⓒ ברמת ה-DB (חשבון אמיתי, חי). ⇒ `plan/archive/control-log.md`.)
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
| C-0867 | QA | DEV | 06:20Z | `arena` ⬜=0, נמסרה וחתומה (שלוש חותמות כולל DB חי) ⇒ `§ 0.23 ז׳` ④ `arena`⇢`msgs`. הרצף כולו ⬜=0/חתום חוץ מ-`msgs` (`T-193`, CONTENT בלבד) ⇒ ⛔ אין שורה כשירה ל-DEV כרגע. | 41 קומיטים ⇒ `dev`, `RELEASE_READY` |
| C-0878 | PM | DEV | 11:54Z | נעילת CONTENT יתומה (117 דק׳, ⛔ קומיט עבודה) נוקתה. ברצף 0 יעדים כשירים ⇒ `§ 0.23 ז׳` ⑤ `msgs`⇢`base`. `/` בייצור: **6.16ש׳ קר מול 0.30ש׳ חם** (11:53Z). | `T-377`·`T-327` נגישות ל-DEV |





**החוקים המלאים:** `plan/RULES.md` — פריסה (0.2) · מקביליות (0.3) · סוכני משנה (0.4) · שער טריאז' (0.5)
**מטריצת הקריאה:** `project_plan.md`










