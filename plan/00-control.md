<!--
NEXT_AGENT: CRITIC                 # ▶️ C-0505 (DEV) — 🔨 בנייה: `T-234` 🟣 · `T-220` ⓐⓓ 🟣 (כל ארבע האותיות). `arena` ⬜=**1** — `T-281` בלבד, ו⛔ אין לה תוכנית ⇒ הטיק הבא של DEV הוא 📝 תכנון.
STATE: PLANNING                    # ⛔ לא שונה — טיק ביקורת אינו קובע מצב בנייה.
ACTIVE_MILESTONE: M0              # M0..M6
ACTIVE_TASK_ID: []   # ▶️ C-0504 (CRITIC) — ריק, כרגיל בטיק ביקורת.
CRITIC_ROUNDS_ON_TASK: 0          # ⛔ התור הישן הועבר ל-`plan/archive/control-log.md` (26/08) — הוא היה מת: QA הופך 🟣⇢✅ בכמות מ-`git log`.
LAST_HANDOFF_AT: "2026-09-08T12:41:50Z"
HUMAN_DECISION_REQUIRED: false    # ▶️ ⛔ אינו ממתין. **44 · 45 · 46 נסגרו כולם ב-23/08.** נותר **47** — שורה ב-`RULES § 0.1 ב׳` שהיא הקובץ של רוי, ו⛔ **אינה חוסמת את הקידום של היום**.
BUDGET_NOTE: "כל מקורות התוכן מורשים לשימוש מסחרי בעלות אפס: NGSL (CC BY-SA 4.0) · CEFR-J (מסחרי בציטוט) · Octanove (CC BY-SA 4.0) · Hebrew Wordnet (רישיון פרמיסיבי של אונ׳ חיפה, ללא share-alike — אומת C-0001, H1g) · Kaikki/ויקימילון (CC BY-SA) · word2word (Apache-2.0). ⛔ PanLex ו-MUSE נפסלו ברישיון NC (1.6.3). שני סיכוני תקציב עתידיים תועדו ב-4.3.2: W3 (עלות יצירת תוכן AI) ו-W4 (שכבה חינמית של Supabase)."
# --- נעילה: מונעת שני סוכנים שכותבים לקובץ בו-זמנית ---
LOCK_HELD_BY: ""                   # שוחררה — DEV סיים C-0505.
LOCK_AT: "2026-09-08T12:32:49Z"
WORKSTREAM_TICKS:                 # ⚠️ בלם 8 שוכתב 23/08 (רוי): סופר **טיקי עבודה בלבד** — טיק שהסתיים בקומיט. ⛔ טיק שקט/נסיגה/שורה-אחת אינו נספר. תקרה **120 לכל פריט** ב-36-video-spec § 13, ⛔ לא לחזון כולו.
#   story:  13 / 120           # § 13-1 · **מוצתה (⬜=0) · הוזזה→`nav` ב-C-0310 (QA).** הפרוסות A/B/C נמסרו (T-185…T-188 · T-202/203 · T-150). שלוש החותמות (36§13.1) — ראה SEALS למטה.
#   nav:     3 / 120           # § 13-2 · **⬜=0 · חתומה · המוקד הוזז→`cards` ב-C-0316 (QA).** פירוט מלא ⇒ `plan/archive/control-log.md` (הוצא C-0418).
#   cards:  14 / 120           # § 13-3 · **⬜=0 · מוצתה שנית · הוזזה→`arena` ב-C-0500 (QA), ⛔ אינה חתומה** (ⓑⓒ חסומות ב-env). 5 🟣 הפכו ✅ (T-066·T-199·T-228·T-243·T-259). פירוט מלא ⇒ `plan/61-deferred.md` · `plan/archive/control-log.md` (הוצא C-0418).
#   arena:  21 / 120           # § 13-4 · **המוקד. ⬜=1 אחרי C-0505 (‏`T-234` · `T-220` 🟣) — נותרה `T-281` בלבד. הישן: ⬜=3 ו⛔ אף אחת ⛔ אינה חסומה — נמדד C-0503:** `T-220` ⓐⓓ (‏`F-164` נסגרה `D-143` ב-28/08, התא לא עודכן 11 יום ⇒ `D-199`) · `T-234` (‏`D-201` — חריגה מוצהרת ב-§ ב6) · `T-281` (‏`D-200` — ההטיה נעשית מספר). ⛔ אינה חתומה. **T-217 ✅ מוזגה C-0504, לא נספרה ב-⬜ שלוש.** פירוט ⇒ `plan/61-deferred.md` · `plan/archive/control-log.md`.
#   studies: 3 / 120           # § 13-5 · לימודים כמכולת מסלולים. ⬜=0 (`T-144` נסגרה ⛔ · `T-246` 🟣 · `T-247` חסומה עד `dev`). פירוט מלא ⇒ `plan/archive/control-log.md` (הוצא C-0418).
#   msgs:    1 / 120           # 39-messages-spec § 9 · הודעות — T-190…T-193 בתור. ⛔ פריטים 2–5 חסומים ב-R-026
MILESTONE_TICKS: 103           # ⛔ מונה M0 הישן — מוקפא, ⛔ ואינו בלם. הבלם החי הוא WORKSTREAM_TICKS
RELEASE_READY: "ca47234 · 2026-09-08T11:34Z · **C-0504 (CRITIC, מלא).** `main`=`87ca9fd` · `dev`=`ca47234`=`work/current`. `verify` ירוק בדחיפת ה-hook (224 קבצים · 3672/3672 · build · mobile 1519/1519), `loop:health` 16/17 (בדיקה 2 — F-196, PM, לא חדש). `review-animations` — Approve (idle-bob חוזר על עצמו, `transform`+`motion-reduce`). מוזג `--ff-only` (`506c744..ca47234`): **T-217** — `PATCH /api/arcade/character` + מסך בחירת דמות (`37 § 7`, שלוש הטיות/צלליות), `ArenaHome` פותחת «עיצוב דמות» חי; נבדק חי 375×780 מול `next start` — בחירה⇢שמירה⇢«נבחר» עובד קצה־לקצה, שכבה א׳ עומדת (checkmark+מלל+מסגרת). `origin/main..origin/dev`=**45** (PROMOTER חסום ב-F-203), `origin/dev..origin/main`=0 (ff נקי)."
PAUSED_BY_HUMAN: false           # ⚠️ הבלם בודק `== true` בלבד. **נמדד C-0418 ב-`git log` מ-01/09: DEV 55 קומיטים · PM 20 · QA 13** ⇒ שלוש המשימות דלוקות ורצות. רקע ⇒ `plan/archive/control-log.md`
DEPLOYS_THIS_MONTH: 5            # PR #2 built and deployed; smoke test green.
LAST_DEPLOYED_AT: "2026-08-23T11:03:26Z"
LAST_REVIEWED_COMMIT: "807ae72"  # main אחרי הקידום של 06/09. `verify` exit 0 נרץ על אותו SHA לפני הקידום.
# --- כלכלת פריסה: קרדיטים, לא דקות. 15 קרדיטים לפריסה. ראה RULES § 0.1 ---
WORKING_BRANCH: work/current      # ▶️ **שונה 24/08 · RULES § 0.23 · שלב 2.** DEV ו-CONTENT דוחפים לכאן בלבד. ⛔ שם קבוע, ⛔ לעולם לא שם חדש.
MERGE_TARGET: dev                 # רק QA ממזג לכאן, ורק ב-`merge --ff-only`. ⛔ אף סוכן ⛔ אינו דוחף ל-dev ישירות.
ACTIVE_WORKSTREAM: arena           # ▶️ הוזז C-0500 (CRITIC, מלא) — `cards` מוצתה (⬜=0, נמדד `docs/plan-open.md`), `arena` הבאה ברצף עם 3 ⬜ (`T-217`·`T-220`·`T-234`). ⛔ אינה חתומה — ⓑⓒ חסומות ב-env (כמו `cards`, ראה SEALS).
PREV_WORKSTREAM: "cards"     # 🆕 C-0500 (CRITIC) — `cards` נבחרה ב-C-0485 על 6 ⬜, מוצתה שנית עכשיו. שורת `61-deferred` נכתבה. (ההיסטוריה הקודמת בגיט.)
IMPROVE_TARGET: ""              # 🩺 D-146 · **ריק = המצב כבוי.** ▶️ **C-0412: נוסה ו⛔ לא ניתן להדליק — נמדד.** `story` ⇒ בדיקה 14 FAIL (3 ⬜ מראש, תקרה 2) · `nav` ⇒ ⛔ אין לה דבר ב-`61-deferred` · `cards`/`arena` ⛔ אינן חתומות. פירוט ⇒ `D-184`.
# (SEALS · nav ו-story — הוצאו ל-`plan/archive/control-log.md` ב-C-0318, אותו דפוס בדיוק שבו story הוצא ב-C-0316 כשהמוקד זז. ⛔ לא נמחקו.)
# (SEALS · arena — הוצאו ל-`plan/archive/control-log.md` ב-C-0368, אותו דפוס שבו nav · story · cards הוצאו ב-C-0318 ו-C-0367. **arena ⛔ אינה חתומה** — שלוש החותמות ⛔ לא ניתנות למדידה מהלופ, `03-for-roy` פריט 77. ⛔ לא נמחקו.)
# (SEALS · cards — הוזזה שנית C-0500 (CRITIC, מלא). **⛔ עדיין אינה חתומה:** ⓐ נמדדה חיה (בית⇢כרטיסיות בהקשות, `/dev/tabs/cards`) ✅ · ⓑⓒ ⛔ לא ניתנות למדידה מהלופ — אותו חסם env בדיוק כמו `arena`/`03-for-roy` פריט 77 (⛔ אין Supabase env, 403 על `/api/*`). F-142/F-143 עדיין פתוחים. שורה שנייה ב-`plan/61-deferred.md`.)
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
| C-0504 | QA | DEV | 2026-09-08T11:34:54Z | 🚦 **מלא — מוזג.** `verify`/`loop:health` 16/17 (בדיקה 2, F-196, PM). `review-animations` Approve. הליכה חיה מול `next start` — ⚠️ `next dev` ב-CCR מחזיר 403 על chunks לכל `Origin` (F-204, לא פגם מוצר). `T-217`/`F-153` 🟣⇢✅. `arena` ⬜=3 ללא שינוי, ⛔ לא מוצתה. | `60-findings` (F-204) · `50-tasks`/`60-findings` (T-217·F-153 ✅) · `00-control` · `plan-open`·`plan-tables` |
| C-0505 | DEV | CRITIC | 2026-09-08T12:41:50Z | 🔨 **בנייה, 3 קומיטי משימה.** `T-234` 🟣 — החרגה בשם לשני הבזקי ה-hit-stop ב-`check-motion.mjs` (D-201 · `35 § ב6`), קו הבסיס 0 שורות, 9 בדיקות. `T-220` ⓐⓓ 🟣 — `ArcadeOption.kind` (`met`/`unseen`) מ-`buildRound`, `?` על `unseen` ב-`ArenaBattle`, `returnedSpell` — הלחש חוזר **גלוי**; 7 בדיקות, `api-contract` באותו קומיט. `arena` ⬜=1 (`T-281`, בלי תוכנית). סקילים: `animate` (לפי תג) · `[SKILL: none]` ל-`T-234`. ⛔ Supabase לא נגע. | `scripts/check-motion.mjs`·`motion-baseline.md`·`motion-gate.test.ts` · `lib/core/arcadeRound.ts`·`battle.ts` · `components/ArenaBattle.tsx` · `app/dev/arcade/page.tsx` · `docs/api-contract.md` · `50-tasks` · `60-findings` (F-172 ✅) · `30-architecture` · `00-control` · `plan-open`·`plan-tables` · `architecture-map.json` |
---

**החוקים המלאים:** `plan/RULES.md` — פריסה (0.2) · מקביליות (0.3) · סוכני משנה (0.4) · שער טריאז' (0.5)
**מטריצת הקריאה:** `project_plan.md`
