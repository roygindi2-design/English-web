<!--
NEXT_AGENT: CRITIC                    # ▶️ C-0468 (DEV, Cowork Recovery, טיק מכוון) — F-175 הוכרע, Smart Wait בארבעת הפרומפטים, gc:memory הורץ.
STATE: BUILD                       # ⛔ ללא שינוי — טיק בנייה, ⛔ לא תכנון.
ACTIVE_MILESTONE: M0              # M0..M6
ACTIVE_TASK_ID: []                # ▶️ C-0458 (DEV) — פורמט חדש: רשימה עד 3 מזהים (T-260 · D-190 § 1.2 ⓑ). עדיין ריקה — PM/QA כותבים אליה, DEV לעולם לא (RULES § 0.28).
CRITIC_ROUNDS_ON_TASK: 0          # ⛔ התור הישן הועבר ל-`plan/archive/control-log.md` (26/08) — הוא היה מת: QA הופך 🟣⇢✅ בכמות מ-`git log`.
# ⛔ CONSECUTIVE_NO_PROGRESS הוסר 06/09 (F-175, הכרעת רוי — "להסיר", 03-for-roy פריט 87 נסגר).
# היה בלם מת (מוצהר, ⛔ אף קוד לא העלה אותו) — שדה שמצהיר על בלם שאינו קיים גרוע משדה שאינו קיים.
# מפסק איש-המת (36 שעות) ובדיקות 11·13·17 מכסות "הלופ מסתובב ריק" בלעדיו. ⛔ ⛔ לא נשמר במקום אחר בחוזה חי.
LAST_HANDOFF_AT: 2026-09-06T16:34:17Z
HUMAN_DECISION_REQUIRED: false    # ▶️ ⛔ אינו ממתין. **44 · 45 · 46 נסגרו כולם ב-23/08.** נותר **47** — שורה ב-`RULES § 0.1 ב׳` שהיא הקובץ של רוי, ו⛔ **אינה חוסמת את הקידום של היום**.
BUDGET_NOTE: "כל מקורות התוכן מורשים לשימוש מסחרי בעלות אפס: NGSL (CC BY-SA 4.0) · CEFR-J (מסחרי בציטוט) · Octanove (CC BY-SA 4.0) · Hebrew Wordnet (רישיון פרמיסיבי של אונ׳ חיפה, ללא share-alike — אומת C-0001, H1g) · Kaikki/ויקימילון (CC BY-SA) · word2word (Apache-2.0). ⛔ PanLex ו-MUSE נפסלו ברישיון NC (1.6.3). שני סיכוני תקציב עתידיים תועדו ב-4.3.2: W3 (עלות יצירת תוכן AI) ו-W4 (שכבה חינמית של Supabase)."
# --- נעילה: מונעת שני סוכנים שכותבים לקובץ בו-זמנית ---
LOCK_HELD_BY: ""                     # שוחררה 2026-09-06T16:34:17Z — C-0468 (DEV, Cowork Recovery) טיק מכוון: F-175 · Smart Wait · gc:memory
LOCK_AT: "2026-09-06T16:34:17Z"
WORKSTREAM_TICKS:                 # ⚠️ בלם 8 שוכתב 23/08 (רוי): סופר **טיקי עבודה בלבד** — טיק שהסתיים בקומיט. ⛔ טיק שקט/נסיגה/שורה-אחת אינו נספר. תקרה **120 לכל פריט** ב-36-video-spec § 13, ⛔ לא לחזון כולו.
#   story:  13 / 120           # § 13-1 · **מוצתה (⬜=0) · הוזזה→`nav` ב-C-0310 (QA).** הפרוסות A/B/C נמסרו (T-185…T-188 · T-202/203 · T-150). שלוש החותמות (36§13.1) — ראה SEALS למטה.
#   nav:     3 / 120           # § 13-2 · **⬜=0 · חתומה · המוקד הוזז→`cards` ב-C-0316 (QA).** פירוט מלא ⇒ `plan/archive/control-log.md` (הוצא C-0418).
#   cards:   9 / 120           # § 13-3 · **מוצתה · הוזזה→`arena` ב-C-0322 · ⛔ אינה חתומה.** נותרו `F-143` (חוסם `T-199`ⓐ) ו-`F-144` (⛔ אינו חוסם). פירוט מלא ⇒ `plan/61-deferred.md` · `plan/archive/control-log.md` (הוצא C-0418).
#   arena:  19 / 120           # § 13-4 · **הוזזה→`studies` ב-C-0367 (QA), חסומה-חיצונית, ⛔ אינה חתומה.** ⬜ אחת (`T-220`) חסומה ב-F-164/PM. פירוט מלא ⇒ `plan/61-deferred.md` · `plan/archive/control-log.md` (הוצא C-0418).
#   studies: 3 / 120           # § 13-5 · לימודים כמכולת מסלולים. ⬜=0 (`T-144` נסגרה ⛔ · `T-246` 🟣 · `T-247` חסומה עד `dev`). פירוט מלא ⇒ `plan/archive/control-log.md` (הוצא C-0418).
#   msgs:    1 / 120           # 39-messages-spec § 9 · הודעות — T-190…T-193 בתור. ⛔ פריטים 2–5 חסומים ב-R-026
MILESTONE_TICKS: 103           # ⛔ מונה M0 הישן — מוקפא, ⛔ ואינו בלם. הבלם החי הוא WORKSTREAM_TICKS
RELEASE_READY: "807ae72 · 2026-09-06 · **נשלח — `main` = `dev` = `work/current` = `807ae72`, 0 פער** (נמדד: `./scripts/g ls-remote --heads origin`)"  # C-0465 · `verify` exit 0 טרי (215 קבצים · 3484 בדיקות · `check:mobile` 1325) · `loop:health` 15/15 · הקידום ל-`main` באישור מפורש של רוי. ⚠️ שלוש ההקשות ⛔ לא נכתבו מחדש — השער המלא של C-0462 הוא הראיה.
PAUSED_BY_HUMAN: false           # ⚠️ הבלם בודק `== true` בלבד. **נמדד C-0418 ב-`git log` מ-01/09: DEV 55 קומיטים · PM 20 · QA 13** ⇒ שלוש המשימות דלוקות ורצות. רקע ⇒ `plan/archive/control-log.md`
DEPLOYS_THIS_MONTH: 5            # PR #2 built and deployed; smoke test green.
LAST_DEPLOYED_AT: "2026-08-23T11:03:26Z"
LAST_REVIEWED_COMMIT: "807ae72"  # main אחרי הקידום של 06/09. `verify` exit 0 נרץ על אותו SHA לפני הקידום.
# --- כלכלת פריסה: קרדיטים, לא דקות. 15 קרדיטים לפריסה. ראה RULES § 0.1 ---
WORKING_BRANCH: work/current      # ▶️ **שונה 24/08 · RULES § 0.23 · שלב 2.** DEV ו-CONTENT דוחפים לכאן בלבד. ⛔ שם קבוע, ⛔ לעולם לא שם חדש.
MERGE_TARGET: dev                 # רק QA ממזג לכאן, ורק ב-`merge --ff-only`. ⛔ אף סוכן ⛔ אינו דוחף ל-dev ישירות.
ACTIVE_WORKSTREAM: general         # 🔴 C-0389 (PM · `D-179` · הרשאת `D-174`): הוזז `studies` ⇢ `general`. ▶️ **עודכן C-0451 (PM) — נמדד, ⛔ לא שוער:** ההערה הקודמת נקבה ב-`T-235`/`T-143`/`T-145` כפתוחות — **שלושתן ✅ מזמן** (C-0396/C-0409). המצב היום: `general` ⬜=0 בפתיחת הטיק, `general ∪ loop ∪ base` = **6 ⬜**; אחרי `T-264`/`T-265` ⇒ **8 ⬜** (בדיקה 11 ok). ⚠️ **⛔ אינה חותמת ו⛔ אינה מעבר לזרימת פיצ׳ר** — החזרה ל-`msgs` (4 ⬜) היא של QA לבדו (§ 0.23ז), ו-`D-174` היא הרשאה **חד-כיוונית**.
PREV_WORKSTREAM: "studies"     # 🆕 D-174 · נכתב ב-C-0389 באותה עריכה שהזיזה את המוקד ל-`general` — בדיקות 13·14 מודדות ממנו. הזרימה שממנה זזנו: `studies`, אחרי שפרוסה A שלה (`T-246`) נבנתה במלואה ב-C-0381.
IMPROVE_TARGET: ""              # 🩺 D-146 · **ריק = המצב כבוי.** ▶️ **C-0412: נוסה ו⛔ לא ניתן להדליק — נמדד.** `story` ⇒ בדיקה 14 FAIL (3 ⬜ מראש, תקרה 2) · `nav` ⇒ ⛔ אין לה דבר ב-`61-deferred` · `cards`/`arena` ⛔ אינן חתומות. פירוט ⇒ `D-184`.
# (SEALS · nav ו-story — הוצאו ל-`plan/archive/control-log.md` ב-C-0318, אותו דפוס בדיוק שבו story הוצא ב-C-0316 כשהמוקד זז. ⛔ לא נמחקו.)
# (SEALS · arena — הוצאו ל-`plan/archive/control-log.md` ב-C-0368, אותו דפוס שבו nav · story · cards הוצאו ב-C-0318 ו-C-0367. **arena ⛔ אינה חתומה** — שלוש החותמות ⛔ לא ניתנות למדידה מהלופ, `03-for-roy` פריט 77. ⛔ לא נמחקו.)
# (SEALS · cards — הוצאו ל-`plan/archive/control-log.md` ב-C-0367, אותו דפוס שבו nav ו-story הוצאו ב-C-0318. **cards ⛔ אינה חתומה** — הוזזה חסומה-חיצונית · F-142/F-143 · ראה `plan/61-deferred.md`.)
RELEASE_BLOCKERS: ""  # ✅ רוקן 06/09 (C-0465) — F-185 נסגר: הסיבה הייתה `GIT_ASKPASS=` ריק שהסביבה מייצאת, ⛔ לא מסווג הרשאות. QA כותב כאן כשמיזוג נחסם — **המינימום שנדרש כדי למזג**, ⛔ ולא כל הממצאים. DEV לוקח אותה לפני כל דבר אחר.
DEPLOY_BRANCH: main               # Netlify בונה אך ורק את זה. רק ה-Critic מקדם לכאן.
LAST_PROMOTED_AT: "2026-09-06T14:10Z"  # ⚠️ **באישור מפורש של רוי בצ'אט, ⛔ לא ביוזמת הלופ.** `7a5f61b..807ae72` ff-only. קודם לכן 23/08 בידי רוי (PR #2).
PROMOTIONS_THIS_MONTH: 14         # 14 this month (➕ 06/09, באישור מפורש). ⛔ Credit budget is no longer a reason to delay (D-086).
```

> 🧑‍⚖️ שתי ביקורות ידניות של רוי — **הפירוט המלא, כולל מצב כל ממצא, ב-`plan/OPERATOR-LOG.md`.**
> ⚡ סקילים של superpowers פעילים (`RULES.md` § 0.7). החוק הקשה: אין טענת הצלחה בלי ריצה טרייה.

### 0.1 יומן העברות מקל — 2 האחרונים בלבד

> ⚠️ **שורה אחת ביומן, ⛔ ולא שתיים** — התקרה נפרצה פעמיים כך (C-0261 · C-0293). שתי המדידות ⇢ `plan/archive/handoff-log.md`.

> 2 שורות לרשומה. ישן יותר → `plan/archive/handoff-log.md`. ההיסטוריה המלאה בגיט.
> 🧹 `C-0460` הועבר 06/09/2026 (C-0463) — שורה אחת בלבד, פירוט המדידה בארכיון (`plan/archive/handoff-log.md`).
> 🧹 `C-0463` הועבר 06/09/2026 (C-0466) — שורה אחת בלבד, פירוט המדידה בארכיון (`plan/archive/handoff-log.md`).

> 🧹 `C-0465` הועבר 06/09/2026 (C-0467) — שורה אחת בלבד, פירוט המדידה בארכיון (`plan/archive/handoff-log.md`).

| Cycle | מסוכן | לסוכן | בשעה | סיבת ההעברה (עד 2 שורות) | תוצר |
|---|---|---|---|---|---|
| C-0468 | DEV (Cowork Recovery) | CRITIC | 2026-09-06T16:34:17Z | 🔨 **טיק מכוון (הוראת רוי 06/09 16:05Z) — F-175 הוכרע ("להסיר"), Smart Wait בארבעת הפרומפטים, `gc:memory` הורץ.** `CONSECUTIVE_NO_PROGRESS` הוצא מ-`00-control` (שורות AGENT_BLUEPRINT/mermaid סומנו היסטוריות, `03-for-roy` 87 נסגר). Smart Wait: `sleep 180` + קריאה חוזרת לפני נסיגה מנעילה זרה, בארבעתם (בדיקה חדשה ב-`agent-prompts.test.ts`, 54/54). `gc:memory`: `00-control` 12,590⇐11,024 בתים (תקרה 12,288). `roster.json` אושש מול `list_triggers` חי (DEV=claude-sonnet-5, ⛔ ללא שינוי). ⛔ **5ב (הצהרת מודל בטקסט הפרומפט של DEV, דרך `update_trigger`) נדחה במכוון** — סיכון שגיאת-תו על שלושת סודות Supabase שהפרומפט נושא, ⛔ ולא הוצע לרוי לוותר עליו. `verify` **exit 0** (216 קבצים · 3515 בדיקות · `check:mobile` 1325) · `loop:health` **16/17** (בדיקה 16 באזהרה — קומיט הנעילה נדחף לפני `npm install`, רך עד 13/09). | `plan/00-control.md` · `docs/AGENT_BLUEPRINT.md` · `docs/handoff_flow.mermaid` · `docs/agents/{DEV,PM,CONTENT,CRITIC}.md` · `scripts/agent-prompts.test.ts` · `docs/agents/roster.json` · `plan/60-findings.md` (F-175) · `plan/03-for-roy.md` (87) |
---

**החוקים המלאים:** `plan/RULES.md` — פריסה (0.2) · מקביליות (0.3) · סוכני משנה (0.4) · שער טריאז' (0.5)
**מטריצת הקריאה:** `project_plan.md`
