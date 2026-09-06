<!--
NEXT_AGENT: DEV                    # ▶️ C-0467 (Cowork, טיק אופרטור) — שער verify בדחיפה, בדיקות 16·17, סוף הנסיגה השקטה. המשך בנייה רגיל.
STATE: BUILD                       # ⛔ ללא שינוי — טיק בנייה, ⛔ לא תכנון.
ACTIVE_MILESTONE: M0              # M0..M6
ACTIVE_TASK_ID: []                # ▶️ C-0458 (DEV) — פורמט חדש: רשימה עד 3 מזהים (T-260 · D-190 § 1.2 ⓑ). עדיין ריקה — PM/QA כותבים אליה, DEV לעולם לא (RULES § 0.28).
CRITIC_ROUNDS_ON_TASK: 0          # ⛔ התור הישן הועבר ל-`plan/archive/control-log.md` (26/08) — הוא היה מת: QA הופך 🟣⇢✅ בכמות מ-`git log`.
CONSECUTIVE_NO_PROGRESS: 0        # תקרה: 2 → מעבר אוטומטי ל-HUMAN
LAST_HANDOFF_AT: 2026-09-06T15:04:54Z
HUMAN_DECISION_REQUIRED: false    # ▶️ ⛔ אינו ממתין. **44 · 45 · 46 נסגרו כולם ב-23/08.** נותר **47** — שורה ב-`RULES § 0.1 ב׳` שהיא הקובץ של רוי, ו⛔ **אינה חוסמת את הקידום של היום**.
BUDGET_NOTE: "כל מקורות התוכן מורשים לשימוש מסחרי בעלות אפס: NGSL (CC BY-SA 4.0) · CEFR-J (מסחרי בציטוט) · Octanove (CC BY-SA 4.0) · Hebrew Wordnet (רישיון פרמיסיבי של אונ׳ חיפה, ללא share-alike — אומת C-0001, H1g) · Kaikki/ויקימילון (CC BY-SA) · word2word (Apache-2.0). ⛔ PanLex ו-MUSE נפסלו ברישיון NC (1.6.3). שני סיכוני תקציב עתידיים תועדו ב-4.3.2: W3 (עלות יצירת תוכן AI) ו-W4 (שכבה חינמית של Supabase)."
# --- נעילה: מונעת שני סוכנים שכותבים לקובץ בו-זמנית ---
LOCK_HELD_BY: ""                     # שוחררה 2026-09-06T15:29:12Z — C-0467 טיק אופרטור (Cowork): הכרעות 100 · 101 · 23 · 22
LOCK_AT: "2026-09-06T15:29:12Z"
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
| C-0466 | DEV (Cowork) | CRITIC | 2026-09-06T14:58:44Z | 🔨 **טיק בנייה — `T-224` (`base`), קומיט אחד, לפי `docs/superpowers/plans/2026-09-06-sense-items-level-tagging.md`.** TDD על כל שלב (RED אז GREEN). מיגרציה `0021_sense_items_level.sql` (nullable, ⛔ אין ברירת מחדל) הורצה על הפרויקט החי דרך מחבר ה-MCP של Supabase — ⚠️ **`supabase` CLI חסום ברשת הסביבה הזאת**: `migration list`/`db push` מנסים חיבור פוסטגרס ישיר ל-pooler ונתקעים ב-timeout (רשת הסנדבוקס מרשה רק דומיינים ברשימה לבנה); ה-MCP מחובר לאותו פרויקט (`zsnqeaajnbrnnahdunof`, אומת לפי שם+טבלאות) ואומת אחרי הריצה: שתי העמודות nullable ללא ברירת מחדל, שני האילוצים קיימים, 1,602/1,602 שורות עדיין `level` null. סוגר את `F-168`. **ממצא עצמי, תוקן באותו קומיט (RULES § 0.22):** התוכנית פספסה `lib/core/mixReport.test.ts`+`lib/core/previewSelection.test.ts` (בונים fixture ביד) — `tsc --noEmit` תפס, תוקנו. `verify` ירוק טרי — **exit 0 · 3499/3499 · mobile 1325/1325**. `generate-map` רץ — 399 מודולים, ⛔ ללא שינוי. | `T-224` ✅ · `supabase/migrations/0021_sense_items_level.sql` · `lib/core/contentSchema.ts`+`batchRecord.ts`+`scoringSeed.ts` · `scripts/build-ingest-sql.mjs`+`measure-continuations.mjs` · `docs/agents/CONTENT.md` · `F-168` |
| C-0467 | CRITIC (Cowork) | DEV | 2026-09-06T15:04:54Z | ⚙️ **טיק אופרטור — ארבע הכרעות של רוי (100 · 101 · 23 · 22), באישור מפורש.** **100:** `scripts/hooks/pre-push` מריץ `verify` בדחיפה וחוסם אדום, ורושם `git-note`; מותקן מ-npm `prepare`; **בדיקה 16** מודדת התקנה + הערה. **101:** `DEV`/`PM`/`CONTENT` ⛔ אינם «exit silently» עוד — שורת נסיגה מחייבת (מחזיק · גיל נעילה · מספר קומיטים); **בדיקה 17** מודדת שקט >24ש׳ מול `docs/agents/roster.json`; cron CONTENT 01:15⇒03:15. **23:** שני מסלולי QA מ-2 ל-4 ליום (`45 1,7,13,19` · `15 5,11,15,21`). **22:** הצהרות המודל הותאמו למדוד ב-`list_triggers`. `loop:health` **17**, 16·17 רכות עד 13/09. פירוט ⇒ `claude/LOOP-ARCHITECTURE.md` § 0.14. | `scripts/hooks/pre-push` · `scripts/install-hooks.mjs` · `docs/agents/roster.json` · 4 פרומפטים · `loop-health.mjs` |
---

**החוקים המלאים:** `plan/RULES.md` — פריסה (0.2) · מקביליות (0.3) · סוכני משנה (0.4) · שער טריאז' (0.5)
**מטריצת הקריאה:** `project_plan.md`
