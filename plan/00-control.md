<!--
NEXT_AGENT: CRITIC                 # ▶️ C-0432 (DEV) — `T-245` (`loop`·תשתית) במלואה. 13 שורות `plan/60-findings.md` תוקנו ל-8 תאים (תו `\|` יחיד בהיסט מדויק, ⛔ לא שחזור מתאים מפוענחים) + `measure-plan-tables.mjs` מדפיס `.../findings malformed ids: …`. verify ירוק טרי (test 3359/3359 · check:mobile 1325 · build · exit 0). קוד: `plan/60-findings.md` · `scripts/measure-plan-tables.mjs` · `scripts/measure-plan-tables.test.ts`.
STATE: BUILD                      # ▶️ C-0422 (PM) — נשאר BUILD. **17 ⬜ כשירות ל-`general`** (בדיקה 11), ובהן `T-253` שנפתחה בטיק.
ACTIVE_MILESTONE: M0              # M0..M6
ACTIVE_TASK_ID: T-253             # ⚠️ ▶️ C-0429 (DEV) — **נמדד: מצביע תקוע.** `grep -n '^\| T-253 \|' plan/50-tasks.md` ⇒ תא סטטוס `✅ C-0428 (QA): על dev` — השורה כבר נמסרה ונמזגה **לפני** תחילת הטיק הזה. ⛔ DEV לא כותב לשדה הזה בעצמו (RULES); דווח ב-`03-for-roy` שהמצביע דורש שורה כשירה חדשה מ-PM/QA. ⚠️ ▶️ C-0430 (DEV) — נמדד שוב, אותו מצב בדיוק (`✅ C-0428 (QA): על dev`); ⛔ לא נגעתי בשדה.
CRITIC_ROUNDS_ON_TASK: 0          # ⛔ התור הישן הועבר ל-`plan/archive/control-log.md` (26/08) — הוא היה מת: QA הופך 🟣⇢✅ בכמות מ-`git log`.
CONSECUTIVE_NO_PROGRESS: 0        # תקרה: 2 → מעבר אוטומטי ל-HUMAN
LAST_HANDOFF_AT: 2026-09-05T00:59:35Z
HUMAN_DECISION_REQUIRED: false    # ▶️ ⛔ אינו ממתין. **44 · 45 · 46 נסגרו כולם ב-23/08.** נותר **47** — שורה ב-`RULES § 0.1 ב׳` שהיא הקובץ של רוי, ו⛔ **אינה חוסמת את הקידום של היום**.
BUDGET_NOTE: "כל מקורות התוכן מורשים לשימוש מסחרי בעלות אפס: NGSL (CC BY-SA 4.0) · CEFR-J (מסחרי בציטוט) · Octanove (CC BY-SA 4.0) · Hebrew Wordnet (רישיון פרמיסיבי של אונ׳ חיפה, ללא share-alike — אומת C-0001, H1g) · Kaikki/ויקימילון (CC BY-SA) · word2word (Apache-2.0). ⛔ PanLex ו-MUSE נפסלו ברישיון NC (1.6.3). שני סיכוני תקציב עתידיים תועדו ב-4.3.2: W3 (עלות יצירת תוכן AI) ו-W4 (שכבה חינמית של Supabase)."
# --- נעילה: מונעת שני סוכנים שכותבים לקובץ בו-זמנית ---
LOCK_HELD_BY: ""                    # שוחררה C-0432 (DEV) 00:59:35Z — T-245 נבנתה במלואה, verify ירוק טרי, נדחפה ל-work/current.
LOCK_AT: "2026-09-05T00:37:18Z"
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
ACTIVE_WORKSTREAM: general         # 🔴 ▶️ **C-0389 (PM · `D-179` · הרשאת `D-174`): הוזז `studies` ⇢ `general`.** ‏`studies` **מוצתה** — נמדד בטיק: ⬜=0 (`T-144` נסגרה `⛔` ב-C-0387 · `T-246` 🟣 ממתינה ל-QA · `T-247` חסומה ב-`T-246` עד `dev`), ו-`loop:health` **בדיקה 11 FAIL**. ⇒ תחת `general` כשירות **`general` ∪ `loop` ∪ `base`** (`DEV.md` STEP 2) = **29 ⬜** שאף טיק DEV ⛔ לא יכול היה לגעת בהן, ובהן `T-235`, `T-143` 🔴 («⛔ אין דרך לענות על שאלה בשיעור» — נמדד חי 02/09: `/dev/lesson` ⇒ 591 תווים · `taps=1`) ו-`T-145`. ⚠️ **⛔ זו ⛔ אינה חותמת ו⛔ אינה מעבר לזרימת פיצ׳ר** — החזרה ל-`msgs` (4 ⬜, הדגל ב-`docs/plan-open.md` נוקב בה) היא של QA לבדו (§ 0.23ז).
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
> 🧹 `C-0427` הועבר 04/09/2026 (C-0429) · `C-0428` הועבר 04/09/2026 (C-0430) · `C-0429` הועבר 05/09/2026 (C-0432) — כולן שתי שורות בלבד, פירוט המדידה בארכיון.

| Cycle | מסוכן | לסוכן | בשעה | סיבת ההעברה (עד 2 שורות) | תוצר |
|---|---|---|---|---|---|
| C-0430 | DEV | CRITIC | 2026-09-04T22:50:51Z | 🔨 **`T-169` (`base`·נוחות) — `ACTIVE_TASK_ID` (`T-253`) נמדד תקוע שוב, אותו מצב בדיוק ⇒ נלקחה הבאה בסדר ב-`general`∪`loop`∪`base`.** `--glow-brand` (טוקן יחיד, `color-mix` על `var(--brand)`) ב-`app/globals.css`; `[data-ring-focus]` (`WorldRing.tsx`) קורא ממנו. `data-glow="true"` על שני מקורות הזוהר (`WorldRing.tsx`·`TabBar.tsx`, אחד לכל זוהר מושגי). תקציב אכיף: `scripts/verify-mobile.mjs` סופר `[data-glow]` בכל מסך/רוחב, נופל מעל שניים. `verify` ירוק טרי (`test` **3356/3356**·`check:mobile` **1325**·`build` עבר, exit 0). `measure:plan`+`generate-map` רצו (391 מודולים, 0 דלתא). | `T-169` · `app/globals.css` · `verify-mobile.mjs` |
| C-0432 | DEV | CRITIC | 2026-09-05T00:59:35Z | 🔨 **`T-245` (`loop`·תשתית) — `ACTIVE_TASK_ID` (`T-253`) עדיין תקוע (`✅ C-0428 (QA): על dev`, קדם לטיק) ⇒ נלקחה הבאה בסדר ב-`general`∪`loop`∪`base`.** 13 שורות מוגדמות ב-`plan/60-findings.md` תוקנו ל-8 תאים — תו `\|` יחיד בהיסט התו המדויק של הצינור הלא-מוברח (מחושב מכללי הבריחה של `splitRow` עצמו, ⛔ לא שחזור מתאים מפוענחים, שהיה מוחק בשקט את ה-`\|` שכבר ישב בתוך `F-048`). `measure-plan-tables.mjs` מדפיס עכשיו `tasks/findings malformed ids: …` (שורה נפרדת, ⛔ לא שוברת את רגקסי הריצ׳ט). `verify` ירוק טרי (`test` **3359/3359**·`check:mobile` **1325**·`build` עבר, exit 0). לא נגעתי ב-`app/`/`components/`/`lib/` ⇒ `generate-map` לא רץ (T-235 חל רק שם). | `T-245` · `plan/60-findings.md` · `measure-plan-tables.mjs` |
---

**החוקים המלאים:** `plan/RULES.md` — פריסה (0.2) · מקביליות (0.3) · סוכני משנה (0.4) · שער טריאז' (0.5)
**מטריצת הקריאה:** `project_plan.md`
