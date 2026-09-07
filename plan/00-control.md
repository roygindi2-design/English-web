<!--
NEXT_AGENT: PM                    # ▶️ C-0485 (CRITIC) — הפעלה יזומה ידנית של רוי. `verify` **אדום** (`build-ingest-sql.test.ts` — רגקס הבדיקה ⛔ אינו תופס סיומת batch לא-מספרית, F-192) ⇒ ⛔ **לא מוזג**. `plan/60-findings.md` שוחזר (CONTENT/C-0483 דרס אותו כולו, F-191) ואז 191/192 נוספו. `general` אומת ⬜=0 חי (`docs/plan-open.md`) ⇒ המוקד הועבר ל-`cards` (6 ⬜ פנויות, החסימה היחידה חלקית — F-143 על T-199ⓐ בלבד). RELEASE_BLOCKERS: F-192.
STATE: BUILD                       # ⛔ ללא שינוי — טיק בנייה, ⛔ לא תכנון.
ACTIVE_MILESTONE: M0              # M0..M6
ACTIVE_TASK_ID: []   # ▶️ C-0485 (CRITIC) — טיק שער, ⛔ לא ליקוט שורה. אין ACTIVE_TASK_ID.
CRITIC_ROUNDS_ON_TASK: 0          # ⛔ התור הישן הועבר ל-`plan/archive/control-log.md` (26/08) — הוא היה מת: QA הופך 🟣⇢✅ בכמות מ-`git log`.
# ⛔ CONSECUTIVE_NO_PROGRESS הוסר 06/09 (F-175 · הכרעת רוי). הנימוק המלא ⇒ `plan/archive/control-log.md` (הוצא C-0478).
LAST_HANDOFF_AT: "2026-09-07T08:47:00Z"
HUMAN_DECISION_REQUIRED: false    # ▶️ ⛔ אינו ממתין. **44 · 45 · 46 נסגרו כולם ב-23/08.** נותר **47** — שורה ב-`RULES § 0.1 ב׳` שהיא הקובץ של רוי, ו⛔ **אינה חוסמת את הקידום של היום**.
BUDGET_NOTE: "כל מקורות התוכן מורשים לשימוש מסחרי בעלות אפס: NGSL (CC BY-SA 4.0) · CEFR-J (מסחרי בציטוט) · Octanove (CC BY-SA 4.0) · Hebrew Wordnet (רישיון פרמיסיבי של אונ׳ חיפה, ללא share-alike — אומת C-0001, H1g) · Kaikki/ויקימילון (CC BY-SA) · word2word (Apache-2.0). ⛔ PanLex ו-MUSE נפסלו ברישיון NC (1.6.3). שני סיכוני תקציב עתידיים תועדו ב-4.3.2: W3 (עלות יצירת תוכן AI) ו-W4 (שכבה חינמית של Supabase)."
# --- נעילה: מונעת שני סוכנים שכותבים לקובץ בו-זמנית ---
LOCK_HELD_BY: "PM"                # 🔒 C-0486 (PM) — נלקחה 2026-09-07T09:09:27Z
LOCK_AT: "2026-09-07T09:09:27Z"
WORKSTREAM_TICKS:                 # ⚠️ בלם 8 שוכתב 23/08 (רוי): סופר **טיקי עבודה בלבד** — טיק שהסתיים בקומיט. ⛔ טיק שקט/נסיגה/שורה-אחת אינו נספר. תקרה **120 לכל פריט** ב-36-video-spec § 13, ⛔ לא לחזון כולו.
#   story:  13 / 120           # § 13-1 · **מוצתה (⬜=0) · הוזזה→`nav` ב-C-0310 (QA).** הפרוסות A/B/C נמסרו (T-185…T-188 · T-202/203 · T-150). שלוש החותמות (36§13.1) — ראה SEALS למטה.
#   nav:     3 / 120           # § 13-2 · **⬜=0 · חתומה · המוקד הוזז→`cards` ב-C-0316 (QA).** פירוט מלא ⇒ `plan/archive/control-log.md` (הוצא C-0418).
#   cards:   9 / 120           # § 13-3 · **מוצתה · הוזזה→`arena` ב-C-0322 · ⛔ אינה חתומה.** נותרו `F-143` (חוסם `T-199`ⓐ) ו-`F-144` (⛔ אינו חוסם). פירוט מלא ⇒ `plan/61-deferred.md` · `plan/archive/control-log.md` (הוצא C-0418).
#   arena:  19 / 120           # § 13-4 · **הוזזה→`studies` ב-C-0367 (QA), חסומה-חיצונית, ⛔ אינה חתומה.** ⬜ אחת (`T-220`) חסומה ב-F-164/PM. פירוט מלא ⇒ `plan/61-deferred.md` · `plan/archive/control-log.md` (הוצא C-0418).
#   studies: 3 / 120           # § 13-5 · לימודים כמכולת מסלולים. ⬜=0 (`T-144` נסגרה ⛔ · `T-246` 🟣 · `T-247` חסומה עד `dev`). פירוט מלא ⇒ `plan/archive/control-log.md` (הוצא C-0418).
#   msgs:    1 / 120           # 39-messages-spec § 9 · הודעות — T-190…T-193 בתור. ⛔ פריטים 2–5 חסומים ב-R-026
MILESTONE_TICKS: 103           # ⛔ מונה M0 הישן — מוקפא, ⛔ ואינו בלם. הבלם החי הוא WORKSTREAM_TICKS
RELEASE_READY: "fbdd61e · 2026-09-06T14:12Z · **נמדד C-0478 ב-`./scripts/g ls-remote --heads origin`: `main`=`fbdd61e` · `dev`=`ddbc851` · `work/current`=`87cf891`. ⚠️ הערך הקודם (`807ae72`) ⛔ לא היה נכון — `main` ⛔ מעולם לא הצביע עליו. `origin/main..origin/dev` = **18 קומיטים** ממתינים לקידום (‏PROMOTER, `RULES § 0.29`, `0 23 * * *`) ו-`origin/dev..origin/main` = 0."
PAUSED_BY_HUMAN: false           # ⚠️ הבלם בודק `== true` בלבד. **נמדד C-0418 ב-`git log` מ-01/09: DEV 55 קומיטים · PM 20 · QA 13** ⇒ שלוש המשימות דלוקות ורצות. רקע ⇒ `plan/archive/control-log.md`
DEPLOYS_THIS_MONTH: 5            # PR #2 built and deployed; smoke test green.
LAST_DEPLOYED_AT: "2026-08-23T11:03:26Z"
LAST_REVIEWED_COMMIT: "807ae72"  # main אחרי הקידום של 06/09. `verify` exit 0 נרץ על אותו SHA לפני הקידום.
# --- כלכלת פריסה: קרדיטים, לא דקות. 15 קרדיטים לפריסה. ראה RULES § 0.1 ---
WORKING_BRANCH: work/current      # ▶️ **שונה 24/08 · RULES § 0.23 · שלב 2.** DEV ו-CONTENT דוחפים לכאן בלבד. ⛔ שם קבוע, ⛔ לעולם לא שם חדש.
MERGE_TARGET: dev                 # רק QA ממזג לכאן, ורק ב-`merge --ff-only`. ⛔ אף סוכן ⛔ אינו דוחף ל-dev ישירות.
ACTIVE_WORKSTREAM: cards           # ▶️ **הוזז C-0485 (CRITIC, § 0.23ז — הרשאת QA בלבד, הפעלה יזומה של רוי).** אומת חי: `docs/plan-open.md` § 🌳 ⇒ `general` **⬜=0** (0 שורות תואמות, `measure:plan` טרי). ⛔ `general ∪ loop ∪ base` נותרו 2 ⬜ שלא נלקחות (כמו ב-C-0478/C-0481). **הבחירה בין 5 המועמדות, נמדדת:** `cards` **6 ⬜** (T-066·T-199·T-233·T-243·T-259·T-268, חסימה חלקית בלבד — F-143 על T-199ⓐ) מול `msgs` 4 ⬜ (שרשרת סדרתית T-190⇢193) · `arena` 3 ⬜ (1 מתוכן, T-220, חסומה ב-F-164) · `story` 5 ⬜ (זרימה **כבר חתומה**, § 13 פריט 1) · `amirnet` 1 ⬜ בלבד. `cards` נבחרה: הכי הרבה עבודה פנויה, החסימה הקיימת נקודתית ⛔ ולא כוללת. `cards` **⛔ אינה חתומה** (הוזזה חסומה-חיצונית ב-C-0367, ראה SEALS למטה) — זו חזרה לזרימה שנעצרה, ⛔ לא איפוס.
PREV_WORKSTREAM: "general"     # 🆕 C-0485 (CRITIC) — הזרימה שממנה זזנו: `general`, אחרי ⬜=0 נמדד. (הערך הקודם, `studies`, נכתב ב-C-0389 כשהמוקד עבר ל-general לראשונה ב-31/08 — היסטוריה מלאה בגיט.)
IMPROVE_TARGET: ""              # 🩺 D-146 · **ריק = המצב כבוי.** ▶️ **C-0412: נוסה ו⛔ לא ניתן להדליק — נמדד.** `story` ⇒ בדיקה 14 FAIL (3 ⬜ מראש, תקרה 2) · `nav` ⇒ ⛔ אין לה דבר ב-`61-deferred` · `cards`/`arena` ⛔ אינן חתומות. פירוט ⇒ `D-184`.
# (SEALS · nav ו-story — הוצאו ל-`plan/archive/control-log.md` ב-C-0318, אותו דפוס בדיוק שבו story הוצא ב-C-0316 כשהמוקד זז. ⛔ לא נמחקו.)
# (SEALS · arena — הוצאו ל-`plan/archive/control-log.md` ב-C-0368, אותו דפוס שבו nav · story · cards הוצאו ב-C-0318 ו-C-0367. **arena ⛔ אינה חתומה** — שלוש החותמות ⛔ לא ניתנות למדידה מהלופ, `03-for-roy` פריט 77. ⛔ לא נמחקו.)
# (SEALS · cards — הוצאו ל-`plan/archive/control-log.md` ב-C-0367, אותו דפוס שבו nav ו-story הוצאו ב-C-0318. **cards ⛔ אינה חתומה** — הוזזה חסומה-חיצונית · F-142/F-143 · ראה `plan/61-deferred.md`.)
RELEASE_BLOCKERS: "F-192"  # ▶️ נכתב C-0485 (CRITIC) — `npm run verify` אדום על `work/current`: `scripts/build-ingest-sql.test.ts` — הרגקס שמחלץ כותרות `batch-*` מה-SQL שנוצר (`[\d-]+`) ⛔ אינו תופס סיומת לא-מספרית (`batch-2026-09-07-connectors.jsonl`), הגנרטור עצמו כן כותב אותה. DEV לוקח את זה לפני כל דבר אחר. F-191 (דריסת 60-findings) כבר תוקן בטיק הזה, ⛔ אינו חוסם עוד.
DEPLOY_BRANCH: main               # Netlify בונה אך ורק את זה. 🆕 06/09: **רק PROMOTER מקדם לכאן** (`RULES § 0.29`, `0 23 * * *` UTC). רוי גובר תמיד.
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

> 🧹 `C-0468` הועבר 06/09/2026 (C-0469) — שורה אחת בלבד, פירוט המדידה בארכיון (`plan/archive/handoff-log.md`).
> 🧹 `C-0469` הועבר 06/09/2026 (C-0471) — שורה אחת בלבד, פירוט המדידה בארכיון (`plan/archive/handoff-log.md`).
> 🧹 `C-0471` הועבר 06/09/2026 (C-0472) — שורה אחת בלבד, פירוט המדידה בארכיון (`plan/archive/handoff-log.md`).
> 🧹 `C-0472` הועבר 06/09/2026 (C-0473) — שורה אחת בלבד, פירוט המדידה בארכיון (`plan/archive/handoff-log.md`).
> 🧹 `C-0473` הועבר 06/09/2026 (C-0476) — שורה אחת בלבד, פירוט המדידה בארכיון (`plan/archive/handoff-log.md`).
> 🧹 `C-0474` הועבר 07/09/2026 (C-0477) — שורה אחת בלבד, פירוט המדידה בארכיון (`plan/archive/handoff-log.md`).
> 🧹 `C-0479` הועבר 07/09/2026 (C-0482) — שורה אחת בלבד, פירוט המדידה בארכיון (`plan/archive/handoff-log.md`).
> 🧹 `C-0481` הועבר 07/09/2026 (C-0485) — שורה אחת בלבד, פירוט המדידה בארכיון (`plan/archive/handoff-log.md`).

| Cycle | מסוכן | לסוכן | בשעה | סיבת ההעברה (עד 2 שורות) | תוצר |
|---|---|---|---|---|---|
| C-0482 | DEV | CRITIC | 2026-09-07T06:46:57Z | 🔨 **טיק בנייה · `general` ⬜=0 נמדד ⇒ `F-190` (🟠 defect שמגיע ללומד · `AuthForm`) לפי סדר הבחירה של STEP 2, ⛔ ולא שורת משימה.** שורש: `<form id="auth-form">` בלי `method` ⇒ שליחה טרום-הידרציה היא `GET` עם הסיסמה ב-query. התיקון: `method="post"` (‏§ 0.22 — תכונה אחת, קומיט אחד מחזיר). **נמדד לפני/אחרי על אותו רתם (Playwright, JS כבוי, 375×780):** לפני `GET /login?email=…&password=…`; אחרי `POST /login`, 0 שורות `password=` ביומן. עם JS: `POST /api/auth/login`/`signup` כמו קודם. 0 מתחת ל-44px, 0 גלילה אופקית, כותרות `התחברות` · `יצירת חשבון`. TDD: 2 שומרי-מקור RED⇢GREEN. `npm run verify` exit 0 (217/217 · 3542/3542 · mobile 1325). המסלול ה«עדיף» (form-urlencoded בנתיב) נשאר ל-PM — משנה חוזה API. `origin/dev..work/current` = 2 לפני הדחיפה. | `components/AuthForm.tsx` · `components/AuthForm.test.ts` · `plan/60-findings.md` (F-190 ✅) · `plan/30-architecture.md` · `plan/00-control.md` · `docs/plan-open.md` · `docs/plan-tables.md` |
| C-0485 | CRITIC | PM | 2026-09-07T08:47:00Z | 🚦 **מסלול: מלא — הפעלה יזומה ידנית של רוי (לא לפי התזמון), 08:26Z.** 🔴 `plan/60-findings.md` נמצא **דרוס** (CONTENT/C-0483 — 237⇢26 שורות, כל הרישום נעלם) ⇒ שוחזר מ-`dd9beff`, F-191 נפתח (הפרת בעלות + הרס רגיסטר, `CONTENT.md:290`). **`npm run verify` אדום גם בלעדיו** — `build-ingest-sql.test.ts` (F-192: הרגקס של הבדיקה ⛔ אינו תופס שם batch לא-מספרי) ⇒ **⛔ לא מוזג הטיק הזה**, `RELEASE_BLOCKERS: F-192`. `loop:health` 15/17 (בדיקה 9 עדיין FAIL — F-182 עודכן ל-13929B; בדיקה 16 warn — אין הערת verify על נעילה, צפוי). הליכה קלה 375×780 על `/login`·`/signup`·`/dev/tabs/studies`·`/dev/lesson`: 0 מתחת ל-44px, 0 גלילה אופקית, אפס שגיאת קונסולה חדשה. `build:surfaces` 6/6 דגלים (כולם «אין מצב ריק», זול, ⛔ לא 🔴). **`general` אומת ⬜=0 חי** ⇒ המוקד הוזז ל-**`cards`** (6 ⬜ פנויות, החסימה היחידה חלקית). `NEXT_AGENT: PM`. | `plan/60-findings.md` (F-191·F-192·F-182) · `docs/plan-tables.md` · `docs/plan-open.md` · `plan/63-surfaces.md` · `plan/00-control.md` |
---

**החוקים המלאים:** `plan/RULES.md` — פריסה (0.2) · מקביליות (0.3) · סוכני משנה (0.4) · שער טריאז' (0.5)
**מטריצת הקריאה:** `project_plan.md`
