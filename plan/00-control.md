<!--
NEXT_AGENT: CRITIC                 # ▶️ C-0497 (DEV) — 📝 טיק תכנון: `2026-09-08-sentences-deck-and-gate.md` (T-066 + T-199ⓐ, `check:plan` 10/10). ⛔ אפס קוד. cards עוד 2 ⬜ עם תוכנית.
STATE: BUILDING                    # ▶️ C-0497 (DEV) — תוכנית ל-`cards` נכתבה; הטיק הבא של DEV = בנייה, משימה A (T-066) ואז B (T-199ⓐ). `RELEASE_BLOCKERS` (🟠, סביבה, לרוי) נשאר כלשונו — ⛔ אינו שורה של DEV.
ACTIVE_MILESTONE: M0              # M0..M6
ACTIVE_TASK_ID: []   # ▶️ C-0489 (CRITIC) — ריק, כרגיל בטיק שער.
CRITIC_ROUNDS_ON_TASK: 0          # ⛔ התור הישן הועבר ל-`plan/archive/control-log.md` (26/08) — הוא היה מת: QA הופך 🟣⇢✅ בכמות מ-`git log`.
LAST_HANDOFF_AT: "2026-09-08T00:44:20Z"
LAST_HANDOFF_AT: "2026-09-07T23:06:46Z"
HUMAN_DECISION_REQUIRED: false    # ▶️ ⛔ אינו ממתין. **44 · 45 · 46 נסגרו כולם ב-23/08.** נותר **47** — שורה ב-`RULES § 0.1 ב׳` שהיא הקובץ של רוי, ו⛔ **אינה חוסמת את הקידום של היום**.
BUDGET_NOTE: "כל מקורות התוכן מורשים לשימוש מסחרי בעלות אפס: NGSL (CC BY-SA 4.0) · CEFR-J (מסחרי בציטוט) · Octanove (CC BY-SA 4.0) · Hebrew Wordnet (רישיון פרמיסיבי של אונ׳ חיפה, ללא share-alike — אומת C-0001, H1g) · Kaikki/ויקימילון (CC BY-SA) · word2word (Apache-2.0). ⛔ PanLex ו-MUSE נפסלו ברישיון NC (1.6.3). שני סיכוני תקציב עתידיים תועדו ב-4.3.2: W3 (עלות יצירת תוכן AI) ו-W4 (שכבה חינמית של Supabase)."
# --- נעילה: מונעת שני סוכנים שכותבים לקובץ בו-זמנית ---
LOCK_HELD_BY: "DEV"                # ▶️ C-0498 (DEV) — ננעל 2026-09-08T02:33:37Z. `cards` · טיק בנייה על `2026-09-08-sentences-deck-and-gate.md`: `T-066` ואז `T-199`ⓐ.
LOCK_AT: "2026-09-08T02:33:37Z"
WORKSTREAM_TICKS:                 # ⚠️ בלם 8 שוכתב 23/08 (רוי): סופר **טיקי עבודה בלבד** — טיק שהסתיים בקומיט. ⛔ טיק שקט/נסיגה/שורה-אחת אינו נספר. תקרה **120 לכל פריט** ב-36-video-spec § 13, ⛔ לא לחזון כולו.
#   story:  13 / 120           # § 13-1 · **מוצתה (⬜=0) · הוזזה→`nav` ב-C-0310 (QA).** הפרוסות A/B/C נמסרו (T-185…T-188 · T-202/203 · T-150). שלוש החותמות (36§13.1) — ראה SEALS למטה.
#   nav:     3 / 120           # § 13-2 · **⬜=0 · חתומה · המוקד הוזז→`cards` ב-C-0316 (QA).** פירוט מלא ⇒ `plan/archive/control-log.md` (הוצא C-0418).
#   cards:  12 / 120           # § 13-3 · **מוצתה · הוזזה→`arena` ב-C-0322 · ⛔ אינה חתומה.** נותרו `F-143` (חוסם `T-199`ⓐ) ו-`F-144` (⛔ אינו חוסם). פירוט מלא ⇒ `plan/61-deferred.md` · `plan/archive/control-log.md` (הוצא C-0418).
#   arena:  19 / 120           # § 13-4 · **הוזזה→`studies` ב-C-0367 (QA), חסומה-חיצונית, ⛔ אינה חתומה.** ⬜ אחת (`T-220`) חסומה ב-F-164/PM. פירוט מלא ⇒ `plan/61-deferred.md` · `plan/archive/control-log.md` (הוצא C-0418).
#   studies: 3 / 120           # § 13-5 · לימודים כמכולת מסלולים. ⬜=0 (`T-144` נסגרה ⛔ · `T-246` 🟣 · `T-247` חסומה עד `dev`). פירוט מלא ⇒ `plan/archive/control-log.md` (הוצא C-0418).
#   msgs:    1 / 120           # 39-messages-spec § 9 · הודעות — T-190…T-193 בתור. ⛔ פריטים 2–5 חסומים ב-R-026
MILESTONE_TICKS: 103           # ⛔ מונה M0 הישן — מוקפא, ⛔ ואינו בלם. הבלם החי הוא WORKSTREAM_TICKS
RELEASE_READY: "87ca9fd · 2026-09-07T21:56Z · **נמדד C-0493 (CRITIC, מסלול: מלא) ב-`./scripts/g ls-remote --heads origin`: `main`=`fbdd61e` · `dev`=`87ca9fd` · `work/current`=`8ffe0d8`. `verify` ירוק טרי בדחיפה עצמה (218/218 · 3571/3571 · build ✅ · check:mobile 1391/1391), `loop:health` 15/17 (16 · 17 באזהרה עד 2026-09-13, נמדדו ותועדו: F-195). השורה הזאת מוזגה ל-`dev` ב-`--ff-only` (`beadc33..87ca9fd`): **T-268** — היציאה הכתובה «חזרה לכרטיסיות» מחליפה את אייקון הסגירה שישב על כותרת החפיסה עצמה (נבדק חי ב-`/dev/deck`, 375×780, אפס חפיפה). `origin/main..origin/dev` = **71 קומיטים** ממתינים לקידום (PROMOTER, `RULES § 0.29`, `21 23 * * *`) ו-`origin/dev..origin/main` = 0 (ff-only נקי, מאומת `merge-base --is-ancestor`)."
PAUSED_BY_HUMAN: false           # ⚠️ הבלם בודק `== true` בלבד. **נמדד C-0418 ב-`git log` מ-01/09: DEV 55 קומיטים · PM 20 · QA 13** ⇒ שלוש המשימות דלוקות ורצות. רקע ⇒ `plan/archive/control-log.md`
DEPLOYS_THIS_MONTH: 5            # PR #2 built and deployed; smoke test green.
LAST_DEPLOYED_AT: "2026-08-23T11:03:26Z"
LAST_REVIEWED_COMMIT: "807ae72"  # main אחרי הקידום של 06/09. `verify` exit 0 נרץ על אותו SHA לפני הקידום.
# --- כלכלת פריסה: קרדיטים, לא דקות. 15 קרדיטים לפריסה. ראה RULES § 0.1 ---
WORKING_BRANCH: work/current      # ▶️ **שונה 24/08 · RULES § 0.23 · שלב 2.** DEV ו-CONTENT דוחפים לכאן בלבד. ⛔ שם קבוע, ⛔ לעולם לא שם חדש.
MERGE_TARGET: dev                 # רק QA ממזג לכאן, ורק ב-`merge --ff-only`. ⛔ אף סוכן ⛔ אינו דוחף ל-dev ישירות.
ACTIVE_WORKSTREAM: cards           # ▶️ הוזז C-0485 (CRITIC, § 0.23ז). `general` אומת ⬜=0 חי; `cards` נבחרה על 6 ⬜ פנויות, חסימה חלקית בלבד (F-143 על T-199ⓐ). **⛔ אינה חתומה.** הנימוק המלא ⇒ `plan/archive/control-log.md` (הוצא C-0486).
PREV_WORKSTREAM: "general"     # 🆕 C-0485 (CRITIC) — הזרימה שממנה זזנו: `general`, אחרי ⬜=0 נמדד. (הערך הקודם, `studies`, נכתב ב-C-0389 כשהמוקד עבר ל-general לראשונה ב-31/08 — היסטוריה מלאה בגיט.)
IMPROVE_TARGET: ""              # 🩺 D-146 · **ריק = המצב כבוי.** ▶️ **C-0412: נוסה ו⛔ לא ניתן להדליק — נמדד.** `story` ⇒ בדיקה 14 FAIL (3 ⬜ מראש, תקרה 2) · `nav` ⇒ ⛔ אין לה דבר ב-`61-deferred` · `cards`/`arena` ⛔ אינן חתומות. פירוט ⇒ `D-184`.
# (SEALS · nav ו-story — הוצאו ל-`plan/archive/control-log.md` ב-C-0318, אותו דפוס בדיוק שבו story הוצא ב-C-0316 כשהמוקד זז. ⛔ לא נמחקו.)
# (SEALS · arena — הוצאו ל-`plan/archive/control-log.md` ב-C-0368, אותו דפוס שבו nav · story · cards הוצאו ב-C-0318 ו-C-0367. **arena ⛔ אינה חתומה** — שלוש החותמות ⛔ לא ניתנות למדידה מהלופ, `03-for-roy` פריט 77. ⛔ לא נמחקו.)
# (SEALS · cards — הוצאו ל-`plan/archive/control-log.md` ב-C-0367, אותו דפוס שבו nav ו-story הוצאו ב-C-0318. **cards ⛔ אינה חתומה** — הוזזה חסומה-חיצונית · F-142/F-143 · ראה `plan/61-deferred.md`.)
RELEASE_BLOCKERS: "🟠 08/09 — הקידום בוצע ידנית, ⛔ אבל הסיבה ⛔ לא נעלמה: מסווג ההרשאות חוסם את פקודת הקידום ב**סשן מתוזמן** (נמדד C-0495). ⛔ חסם סביבה, ⛔ לא `verify` אדום ⇒ ⛔ אינו שורה של DEV. **לרוי:** `.claude/settings.json` מוכן מקומית, ⛔ אך הקומיט שלו נחסם אף הוא ⇒ רוי מקמט או מוסיף בממשק. עד אז PROMOTER ייעצר בכל לילה (כפי שעשה נכון ב-C-0496). פירוט ⇒ `plan/archive/control-log.md`."
DEPLOY_BRANCH: main               # Netlify בונה אך ורק את זה. 🆕 06/09: **רק PROMOTER מקדם לכאן** (`RULES § 0.29`, `5 0 * * *` UTC — ⚠️ הוזז ב-07/09 בבקשה מפורשת של רוי: `0 23` ⇢ `21 23` ⇢ `5 0`, כי `23:21` השאיר 11 דקות בלבד מטיק DEV של 36 דקות). רוי גובר תמיד.
LAST_PROMOTED_AT: "2026-09-08T00:10Z"  # ⚠️ **קידום ידני באישור מפורש של רוי, ⛔ לא ביוזמת הלופ** — `fbdd61e..87ca9fd` ff-only, 71 קומיטים. פירוט ⇒ `plan/archive/control-log.md`.
PROMOTIONS_THIS_MONTH: 15         # 15 this month (➕ 08/09 00:10Z, קידום ידני באישור מפורש של רוי). ⛔ Credit budget is no longer a reason to delay (D-086).
```

> 🧑‍⚖️ שתי ביקורות ידניות של רוי — **הפירוט המלא, כולל מצב כל ממצא, ב-`plan/OPERATOR-LOG.md`.**
> ⚡ סקילים של superpowers פעילים (`RULES.md` § 0.7). החוק הקשה: אין טענת הצלחה בלי ריצה טרייה.

### 0.1 יומן העברות מקל — 2 האחרונים בלבד

> ⚠️ **שורה אחת ביומן, ⛔ ולא שתיים** — התקרה נפרצה פעמיים כך (C-0261 · C-0293). שתי המדידות ⇢ `plan/archive/handoff-log.md`.

> 2 שורות לרשומה. ישן יותר → `plan/archive/handoff-log.md`. ההיסטוריה המלאה בגיט.
> 🧹 **C-0489 (CRITIC):** כווצו 13 שורות `🧹 הועבר…` (‏`C-0460`…`C-0486`, 06–07/09) לשורה זו — כל אחת מהן הייתה עצמה רק מצביע לארכיון, אפס תוכן חדש, וזו הייתה הסיבה שהקובץ עבר את תקרת ה-12KB (בדיקה 9) בטיק הזה. הרשימה המלאה ב-`git log -p` על הקובץ.

| Cycle | מסוכן | לסוכן | בשעה | סיבת ההעברה (עד 2 שורות) | תוצר |
|---|---|---|---|---|---|
| C-0497 | DEV | CRITIC | 2026-09-08T00:44:20Z | 📝 **טיק תכנון — `cards`: `2026-09-08-sentences-deck-and-gate.md` ל-`T-066` + `T-199`ⓐ, ⛔ אפס קוד.** נמדד: `main`=`dev`=`87ca9fd`, `RELEASE_BLOCKERS` הוא חסם סביבה לרוי (644814f, ⛔ לא נגעתי) · שני ממצאי 🔴 (F-194 · F-195) ⛔ אינם עוצרים לומד ⇒ הבחירה נשארה ב-`cards`. התוכנית: הפריט הוא **וריאנט שלישי של `Card`** (`input: 'choice'`) על אותו `<Flashcard>`/`<CardDeck>` (D-169 ⛔ רכיב חדש) · 3 אפשרויות (D-156) · הגב = גזע מושלם + תרגום + דוגמה · דירוג ב-`/api/practice` עם פתיחת שורה כמו D-142 (§ 0.22 שורה 4 — לווטו של PM) · הסרת `parseFlashcardDeckName` + `href` לאריח (T-199ⓐ). `check:plan` **10/10**, 19 צעדים, 2 קומיטים. הנעילה נדחפה אחרי `npm install` (F-195 ⛔ לא חזר: hook מותקן, `verify` ירוק בדחיפה: 219/219 · 3612/3612 · build ✅ · check:mobile 1433). | `docs/superpowers/plans/2026-09-08-sentences-deck-and-gate.md` · `50-tasks` (T-066 · T-199 הפניה לתוכנית) · `00-control` |
---

**החוקים המלאים:** `plan/RULES.md` — פריסה (0.2) · מקביליות (0.3) · סוכני משנה (0.4) · שער טריאז' (0.5)
**מטריצת הקריאה:** `project_plan.md`
