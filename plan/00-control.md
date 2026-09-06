<!--
NEXT_AGENT: CRITIC                 # ▶️ C-0455..C-0459 (DEV) — 🔨 טיק בנייה, ⛔ לא תכנון: `T-254`/`T-257`/`T-260` (`general∪loop∪base`) נבנו ונמסרו 🟣, לפי `docs/superpowers/plans/2026-09-06-loop-infra-hardening.md`. `npm run verify` ירוק טרי.
STATE: BUILD                      # ▶️ C-0455..C-0459 (DEV) — קוד לופ בלבד נגע (scripts/·docs/agents/·plan/RULES.md·00-control.md), ⛔ אפס קוד מוצר (app/·components/·lib/).
ACTIVE_MILESTONE: M0              # M0..M6
ACTIVE_TASK_ID: []                # ▶️ C-0458 (DEV) — פורמט חדש: רשימה עד 3 מזהים (T-260 · D-190 § 1.2 ⓑ). עדיין ריקה — PM/QA כותבים אליה, DEV לעולם לא (RULES § 0.28).
CRITIC_ROUNDS_ON_TASK: 0          # ⛔ התור הישן הועבר ל-`plan/archive/control-log.md` (26/08) — הוא היה מת: QA הופך 🟣⇢✅ בכמות מ-`git log`.
CONSECUTIVE_NO_PROGRESS: 0        # תקרה: 2 → מעבר אוטומטי ל-HUMAN
LAST_HANDOFF_AT: 2026-09-06T09:02:20Z
HUMAN_DECISION_REQUIRED: false    # ▶️ ⛔ אינו ממתין. **44 · 45 · 46 נסגרו כולם ב-23/08.** נותר **47** — שורה ב-`RULES § 0.1 ב׳` שהיא הקובץ של רוי, ו⛔ **אינה חוסמת את הקידום של היום**.
BUDGET_NOTE: "כל מקורות התוכן מורשים לשימוש מסחרי בעלות אפס: NGSL (CC BY-SA 4.0) · CEFR-J (מסחרי בציטוט) · Octanove (CC BY-SA 4.0) · Hebrew Wordnet (רישיון פרמיסיבי של אונ׳ חיפה, ללא share-alike — אומת C-0001, H1g) · Kaikki/ויקימילון (CC BY-SA) · word2word (Apache-2.0). ⛔ PanLex ו-MUSE נפסלו ברישיון NC (1.6.3). שני סיכוני תקציב עתידיים תועדו ב-4.3.2: W3 (עלות יצירת תוכן AI) ו-W4 (שכבה חינמית של Supabase)."
# --- נעילה: מונעת שני סוכנים שכותבים לקובץ בו-זמנית ---
LOCK_HELD_BY: ""                     # שוחררה C-0459 (DEV) — הטיק נסגר. שלוש המשימות (T-254/T-257/T-260) נבנו, נמסרו 🟣, verify ירוק טרי.
LOCK_AT: "2026-09-06T08:38:27Z"
WORKSTREAM_TICKS:                 # ⚠️ בלם 8 שוכתב 23/08 (רוי): סופר **טיקי עבודה בלבד** — טיק שהסתיים בקומיט. ⛔ טיק שקט/נסיגה/שורה-אחת אינו נספר. תקרה **120 לכל פריט** ב-36-video-spec § 13, ⛔ לא לחזון כולו.
#   story:  13 / 120           # § 13-1 · **מוצתה (⬜=0) · הוזזה→`nav` ב-C-0310 (QA).** הפרוסות A/B/C נמסרו (T-185…T-188 · T-202/203 · T-150). שלוש החותמות (36§13.1) — ראה SEALS למטה.
#   nav:     3 / 120           # § 13-2 · **⬜=0 · חתומה · המוקד הוזז→`cards` ב-C-0316 (QA).** פירוט מלא ⇒ `plan/archive/control-log.md` (הוצא C-0418).
#   cards:   9 / 120           # § 13-3 · **מוצתה · הוזזה→`arena` ב-C-0322 · ⛔ אינה חתומה.** נותרו `F-143` (חוסם `T-199`ⓐ) ו-`F-144` (⛔ אינו חוסם). פירוט מלא ⇒ `plan/61-deferred.md` · `plan/archive/control-log.md` (הוצא C-0418).
#   arena:  19 / 120           # § 13-4 · **הוזזה→`studies` ב-C-0367 (QA), חסומה-חיצונית, ⛔ אינה חתומה.** ⬜ אחת (`T-220`) חסומה ב-F-164/PM. פירוט מלא ⇒ `plan/61-deferred.md` · `plan/archive/control-log.md` (הוצא C-0418).
#   studies: 3 / 120           # § 13-5 · לימודים כמכולת מסלולים. ⬜=0 (`T-144` נסגרה ⛔ · `T-246` 🟣 · `T-247` חסומה עד `dev`). פירוט מלא ⇒ `plan/archive/control-log.md` (הוצא C-0418).
#   msgs:    1 / 120           # 39-messages-spec § 9 · הודעות — T-190…T-193 בתור. ⛔ פריטים 2–5 חסומים ב-R-026
MILESTONE_TICKS: 103           # ⛔ מונה M0 הישן — מוקפא, ⛔ ואינו בלם. הבלם החי הוא WORKSTREAM_TICKS
RELEASE_READY: "e9335ee · 2026-09-04 · 36 commits לפני main (נמדד: ./scripts/g rev-list --count origin/main..origin/dev) · יציאת הזירה חוזרת לטבעת ⛔ לא ל-/cards (T-253/D-186) + הוסף-לכרטיסיות מפסיק להראות וי שקרי כשהכתיבה נכשלת (T-238ⓑ) + הזירה מפסיקה לרנדר 60fps מיותר (T-231)"  # C-0428 (QA) · verify ירוק טרי (3354/3354 · check:mobile 1208, exit 0) · review-animations על T-231 — אושר · הליכה חיה ב-375×780 + Playwright על שלושת המסכים שהשתנו (home/battle/result) + מסך הסיפור (add-to-cards error state) · 03-for-roy #95.
PAUSED_BY_HUMAN: false           # ⚠️ הבלם בודק `== true` בלבד. **נמדד C-0418 ב-`git log` מ-01/09: DEV 55 קומיטים · PM 20 · QA 13** ⇒ שלוש המשימות דלוקות ורצות. רקע ⇒ `plan/archive/control-log.md`
DEPLOYS_THIS_MONTH: 5            # PR #2 built and deployed; smoke test green.
LAST_DEPLOYED_AT: "2026-08-23T11:03:26Z"
LAST_REVIEWED_COMMIT: "fb808a4"  # main אחרי PR #2. ⚠️ מיזוג דרך ה-UI מפצל ענפים — פירוט ⇒ `plan/archive/control-log.md`
# --- כלכלת פריסה: קרדיטים, לא דקות. 15 קרדיטים לפריסה. ראה RULES § 0.1 ---
WORKING_BRANCH: work/current      # ▶️ **שונה 24/08 · RULES § 0.23 · שלב 2.** DEV ו-CONTENT דוחפים לכאן בלבד. ⛔ שם קבוע, ⛔ לעולם לא שם חדש.
MERGE_TARGET: dev                 # רק QA ממזג לכאן, ורק ב-`merge --ff-only`. ⛔ אף סוכן ⛔ אינו דוחף ל-dev ישירות.
ACTIVE_WORKSTREAM: general         # 🔴 C-0389 (PM · `D-179` · הרשאת `D-174`): הוזז `studies` ⇢ `general`. ▶️ **עודכן C-0451 (PM) — נמדד, ⛔ לא שוער:** ההערה הקודמת נקבה ב-`T-235`/`T-143`/`T-145` כפתוחות — **שלושתן ✅ מזמן** (C-0396/C-0409). המצב היום: `general` ⬜=0 בפתיחת הטיק, `general ∪ loop ∪ base` = **6 ⬜**; אחרי `T-264`/`T-265` ⇒ **8 ⬜** (בדיקה 11 ok). ⚠️ **⛔ אינה חותמת ו⛔ אינה מעבר לזרימת פיצ׳ר** — החזרה ל-`msgs` (4 ⬜) היא של QA לבדו (§ 0.23ז), ו-`D-174` היא הרשאה **חד-כיוונית**.
PREV_WORKSTREAM: "studies"     # 🆕 D-174 · נכתב ב-C-0389 באותה עריכה שהזיזה את המוקד ל-`general` — בדיקות 13·14 מודדות ממנו. הזרימה שממנה זזנו: `studies`, אחרי שפרוסה A שלה (`T-246`) נבנתה במלואה ב-C-0381.
IMPROVE_TARGET: ""              # 🩺 D-146 · **ריק = המצב כבוי.** ▶️ **C-0412: נוסה ו⛔ לא ניתן להדליק — נמדד.** `story` ⇒ בדיקה 14 FAIL (3 ⬜ מראש, תקרה 2) · `nav` ⇒ ⛔ אין לה דבר ב-`61-deferred` · `cards`/`arena` ⛔ אינן חתומות. פירוט ⇒ `D-184`.
# (SEALS · nav ו-story — הוצאו ל-`plan/archive/control-log.md` ב-C-0318, אותו דפוס בדיוק שבו story הוצא ב-C-0316 כשהמוקד זז. ⛔ לא נמחקו.)
# (SEALS · arena — הוצאו ל-`plan/archive/control-log.md` ב-C-0368, אותו דפוס שבו nav · story · cards הוצאו ב-C-0318 ו-C-0367. **arena ⛔ אינה חתומה** — שלוש החותמות ⛔ לא ניתנות למדידה מהלופ, `03-for-roy` פריט 77. ⛔ לא נמחקו.)
# (SEALS · cards — הוצאו ל-`plan/archive/control-log.md` ב-C-0367, אותו דפוס שבו nav ו-story הוצאו ב-C-0318. **cards ⛔ אינה חתומה** — הוזזה חסומה-חיצונית · F-142/F-143 · ראה `plan/61-deferred.md`.)
RELEASE_BLOCKERS: ""              # QA כותב כאן כשמיזוג נחסם — **המינימום שנדרש כדי למזג**, ⛔ ולא כל הממצאים. DEV לוקח אותה לפני כל דבר אחר.
DEPLOY_BRANCH: main               # Netlify בונה אך ורק את זה. רק ה-Critic מקדם לכאן.
LAST_PROMOTED_AT: "2026-08-23T11:03:26Z"  # קודם בידי רוי ידנית (PR #2), ⛔ לא בידי ה-Critic. פירוט ⇒ `plan/archive/control-log.md`
PROMOTIONS_THIS_MONTH: 13         # 13 this month. ⛔ Credit budget is no longer a reason to delay (D-086).
```

> 🧑‍⚖️ שתי ביקורות ידניות של רוי — **הפירוט המלא, כולל מצב כל ממצא, ב-`plan/OPERATOR-LOG.md`.**
> ⚡ סקילים של superpowers פעילים (`RULES.md` § 0.7). החוק הקשה: אין טענת הצלחה בלי ריצה טרייה.

### 0.1 יומן העברות מקל — 2 האחרונים בלבד

> ⚠️ **שורה אחת ביומן, ⛔ ולא שתיים** — התקרה נפרצה פעמיים כך (C-0261 · C-0293). שתי המדידות ⇢ `plan/archive/handoff-log.md`.

> 2 שורות לרשומה. ישן יותר → `plan/archive/handoff-log.md`. ההיסטוריה המלאה בגיט.
> 🧹 `C-0453` הועבר 06/09/2026 (C-0459) — שורה אחת בלבד, פירוט המדידה בארכיון (`plan/archive/handoff-log.md`).

| Cycle | מסוכן | לסוכן | בשעה | סיבת ההעברה (עד 2 שורות) | תוצר |
|---|---|---|---|---|---|
| C-0454 | DEV | CRITIC | 2026-09-06T06:57:00Z | 📝 **טיק תכנון — `T-254`/`T-257`/`T-260` (`general∪loop∪base`), קומיט אחד (התוכנית).** `docs/superpowers/plans/2026-09-06-loop-infra-hardening.md` — 3 משימות, בלוק `Interfaces`, קוד בדיקה אמיתי, `check:plan` 8/8 (תוקנו `files`+`extend` לפני קומיט). **נמדד, ⛔ לא הונח:** אף אחת מ-`scripts/loop-health.mjs`/`scripts/agent-prompts.test.ts` לא מכילה כבר לוגיקת ACTIVE_TASK_ID/cycle-id שהשורות הניחו — התוכנית מתעדת את הפער. ⛔ אין קוד מוצר שנגע. | `T-254` · `T-257` · `T-260` · `docs/superpowers/plans/2026-09-06-loop-infra-hardening.md` |
| C-0455..C-0459 | DEV | CRITIC | 2026-09-06T09:02:20Z | 🔨 **טיק בנייה — ביצוע `2026-09-06-loop-infra-hardening.md` במלואה, 3 משימות · 5 קומיטים.** TDD על כל שלוש (RED אז GREEN): `next-cycle-id.mjs` פותר התנגשות `C-0426`; דיווח-רך «טיקי PM מאז פרוסה» — נמדד חי **3**; `check('15', …)` אוכף צורת `ACTIVE_TASK_ID` (עד 3, ⛔ כפילויות) + `RULES § 0.28` + השדה ב-`00-control` עבר ל-`[]`. ⚠️ **שני ממצאים עצמיים הפיכים, תוקנו באותו טיק (RULES § 0.22):** ⓐ `npm run verify` חשף ש-`next-cycle-id.mjs` זקוק ל-`.d.mts` ידני — נוסף + בדיקת-סטייה. ⓑ שתי הנחות `'14'` קשיחות נוספות ב-`loop-health.test.ts` שהתוכנית לא ציינה — עודכנו ל-`'15'`. `verify` ירוק טרי קצה־לקצה: **214/214 · 3476/3476 · build · mobile 1325**. `loop:health` 9+15 `ok`. ⛔ ללא מיגרציה. `T-254`/`T-257`/`T-260` 🟣, `measure:plan` רץ. | `T-254` · `T-257` · `T-260` · `scripts/next-cycle-id.mjs`+`.d.mts`+`.test.ts` · `scripts/loop-health.mjs`+`.test.ts` · `scripts/agent-prompts.test.ts` · `plan/RULES.md` · `docs/agents/DEV.md`+`PM.md`+`CRITIC.md` · `package.json` · `plan/50-tasks.md` |
---

**החוקים המלאים:** `plan/RULES.md` — פריסה (0.2) · מקביליות (0.3) · סוכני משנה (0.4) · שער טריאז' (0.5)
**מטריצת הקריאה:** `project_plan.md`
