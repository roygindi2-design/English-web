<!--
NEXT_AGENT: QA                      # ▶️ C-0522 (DEV, בנייה) — `T-192` 🟣. `msgs` ⬜=1 (‏`T-193`, של CONTENT).
STATE: BUILDING                    # ▶️ C-0522 (DEV) — התוכנית `msgs` הושלמה, 62/62 תיבות.
ACTIVE_MILESTONE: M0              # M0..M6
ACTIVE_TASK_ID: []   # ▶️ C-0514 (CRITIC) — ריק, כרגיל בטיק ביקורת.
CRITIC_ROUNDS_ON_TASK: 0          # ⛔ התור הישן הועבר ל-`plan/archive/control-log.md` (26/08) — הוא היה מת: QA הופך 🟣⇢✅ בכמות מ-`git log`.
LAST_HANDOFF_AT: "2026-09-11T14:13:32Z"   # C-0522 (DEV) — `T-192` נבנה ונדחף, נעילה שוחררה.
HUMAN_DECISION_REQUIRED: false    # ▶️ ⛔ אינו ממתין. **44 · 45 · 46 נסגרו כולם ב-23/08.** נותר **47** — שורה ב-`RULES § 0.1 ב׳` שהיא הקובץ של רוי, ו⛔ **אינה חוסמת את הקידום של היום**.
# --- נעילה: מונעת שני סוכנים שכותבים לקובץ בו-זמנית ---
LOCK_HELD_BY: ""                 # 🔒 שוחררה 2026-09-11T14:13:32Z — C-0522 (DEV) סיים.
LOCK_AT: ""
WORKSTREAM_TICKS:                 # ⚠️ בלם 8 שוכתב 23/08 (רוי): סופר **טיקי עבודה בלבד** — טיק שהסתיים בקומיט. ⛔ טיק שקט/נסיגה/שורה-אחת אינו נספר. תקרה **120 לכל פריט** ב-36-video-spec § 13, ⛔ לא לחזון כולו.
#   story:  13 / 120           # § 13-1 · **מוצתה (⬜=0) · הוזזה→`nav` ב-C-0310 (QA).** הפרוסות A/B/C נמסרו (T-185…T-188 · T-202/203 · T-150). שלוש החותמות (36§13.1) — ראה SEALS למטה.
#   nav:     3 / 120           # § 13-2 · **⬜=0 · חתומה · המוקד הוזז→`cards` ב-C-0316 (QA).** פירוט מלא ⇒ `plan/archive/control-log.md` (הוצא C-0418).
#   cards:  14 / 120           # § 13-3 · **⬜=0 · מוצתה שנית · הוזזה→`arena` ב-C-0500 (QA), ⛔ אינה חתומה** (ⓑⓒ חסומות ב-env). 5 🟣 הפכו ✅ (T-066·T-199·T-228·T-243·T-259). פירוט מלא ⇒ `plan/61-deferred.md` · `plan/archive/control-log.md` (הוצא C-0418).
#   arena:  24 / 120           # § 13-4 · **מוצתה שנית (⬜=0), הוזזה→`msgs` ב-C-0514 (QA).** `T-217`·`T-220`·`T-234`·`T-281`·`T-282`·`T-283` 🟣→✅ מוזגו ל-`dev` בטיק הזה. ⛔ אינה חתומה — ⓑⓒ חסומות ב-env. פירוט ⇒ `plan/61-deferred.md` (מעבר שני) · `plan/archive/control-log.md`.
#   studies: 3 / 120           # § 13-5 · לימודים כמכולת מסלולים. ⬜=0 (`T-144` נסגרה ⛔ · `T-246` 🟣 · `T-247` חסומה עד `dev`). פירוט מלא ⇒ `plan/archive/control-log.md` (הוצא C-0418).
#   msgs:    3 / 120           # 39-messages-spec § 9 · הודעות — **המוקד.** ▶️ C-0522 (DEV) נספר — `T-192` 🟣 (הודעה פתוחה + שבבי חובה + PATCH `read_at`). ⬜=1: `T-193` של CONTENT בלבד ⇒ **ל-DEV ⛔ אין כאן עוד שורה.** ⛔ פריטים 2–5 חסומים ב-R-026
MILESTONE_TICKS: 103           # ⛔ מונה M0 הישן — מוקפא, ⛔ ואינו בלם. הבלם החי הוא WORKSTREAM_TICKS
RELEASE_READY: "9576af9 · 2026-09-08T21:54Z · **C-0514 (CRITIC, מלא).** `verify` ירוק · `loop:health` 15/17. הפירוט ⇒ `plan/archive/control-log.md`."
PAUSED_BY_HUMAN: false           # ⚠️ הבלם בודק `== true` בלבד. **נמדד C-0418 ב-`git log` מ-01/09: DEV 55 קומיטים · PM 20 · QA 13** ⇒ שלוש המשימות דלוקות ורצות. רקע ⇒ `plan/archive/control-log.md`
# (DEPLOYS_THIS_MONTH · LAST_DEPLOYED_AT — הוצאו 08/09, `D-203`ⓔ. קפאו ב-23/08; הבלם נמדד מ-`PROMOTIONS_THIS_MONTH`.)
LAST_REVIEWED_COMMIT: "807ae72"  # main אחרי הקידום של 06/09. `verify` exit 0 נרץ על אותו SHA לפני הקידום.
# --- כלכלת פריסה: קרדיטים, לא דקות. 15 קרדיטים לפריסה. ראה RULES § 0.1 ---
WORKING_BRANCH: work/current      # ▶️ **שונה 24/08 · RULES § 0.23 · שלב 2.** DEV ו-CONTENT דוחפים לכאן בלבד. ⛔ שם קבוע, ⛔ לעולם לא שם חדש.
MERGE_TARGET: dev                 # רק QA ממזג לכאן, ורק ב-`merge --ff-only`. ⛔ אף סוכן ⛔ אינו דוחף ל-dev ישירות.
ACTIVE_WORKSTREAM: msgs            # ▶️ הוזז C-0514 (CRITIC, מלא) — `arena` מוצתה שנית (⬜=0, נמדד `docs/plan-open.md` § flag: «הבא ברצף עם עבודה פנויה הוא msgs (4 ⬜)»). `studies` גם היא מוצתה (⬜=0) ⇒ נדלגת, ⛔ לא נבחרה.
PREV_WORKSTREAM: "arena"     # 🆕 C-0514 (CRITIC) — `arena` (מעבר שני): T-217·T-220·T-234·T-281·T-282·T-283 נבנו ומוזגו בטיק הזה. שורת `61-deferred` נכתבה (מעבר שני). (ההיסטוריה הקודמת בגיט.)
WORKSTREAM_ENDING: msgs · 1 ⬜ נותרה · 2026-09-11T14:13:32Z · C-0522   # 🆕 PM כותב · **QA קורא**. ⛔ אינו היתר להזיז את `ACTIVE_WORKSTREAM` (`§ 0.23 ז׳`). ⚠️ **והשורה היחידה שנותרה, `T-193`, היא של CONTENT** ⇒ ל-DEV הזרימה מוצתה. יעדי `amirnet` ושתי שורותיה (`T-286`·`T-287`) כבר פתוחות.
# (SEALS · BUDGET_NOTE · הערות הכיווץ — הוצאו 08/09 ל-`plan/archive/control-log.md`.
#  ⛔ אפס צרכנים בכל המאגר: ⛔ אף סקריפט, ⛔ אף כלל ו⛔ אף פרומפט ⛔ אינם קוראים אותם. ⛔ אין להחזירם.)
IMPROVE_TARGET: ""              # 🩺 D-146 · **ריק = המצב כבוי.** ▶️ **C-0412: נוסה ו⛔ לא ניתן להדליק — נמדד.** `story` ⇒ בדיקה 14 FAIL (3 ⬜ מראש, תקרה 2) · `nav` ⇒ ⛔ אין לה דבר ב-`61-deferred` · `cards`/`arena` ⛔ אינן חתומות. פירוט ⇒ `D-184`.
MERGE_BLOCKERS: ""                # ⇐ **QA כותב · DEV קורא ראשון.** רק מה שחוסם **מיזוג** ל-`dev` (`§ 0.23 ז׳`). ⛔ לא חסם קידום.
PROMOTION_BLOCKERS: "C-0521 (PROMOTER, 2026-09-11T03:15Z): all five gate conditions were green (verify exit 0 · 3926/3926 tests · check:mobile 1540/1540 · loop:health 22/23 · rev-list origin/main..origin/dev=15 · merge-base --is-ancestor OK · PROMOTIONS_THIS_MONTH=15/30 · LAST_PROMOTED_AT 3 days ago) but the standing-authorised command `git checkout main && git merge --ff-only origin/dev && git push origin main` was refused by the Claude Code auto mode classifier: \"Permission for this action was denied by the Claude Code auto mode classifier. Reason: [Production Deploy].\" Per PROMOTER.md STEP E this refusal is final for this run — no rephrase, no alternate route, no retry. dev remains unpromoted (origin/main=2b8e1b7, origin/dev=5ff2cfb)."  # ⇐ **PROMOTER בלבד. ⛔ DEV לעולם ⛔ אינו קורא.** רק מה שחוסם `dev`⇢`main` (`§ 0.29 ב׳` תנאי 1). ▶️ פוצל 08/09, `D-203`ⓒ.
DEPLOY_BRANCH: main               # Netlify בונה אך ורק את זה. 🆕 06/09: **רק PROMOTER מקדם לכאן** (`RULES § 0.29`, `5 0 * * *` UTC — ⚠️ הוזז ב-07/09 בבקשה מפורשת של רוי: `0 23` ⇢ `21 23` ⇢ `5 0`, כי `23:21` השאיר 11 דקות בלבד מטיק DEV של 36 דקות). רוי גובר תמיד.
LAST_PROMOTED_AT: "2026-09-08T00:10Z"  # ⚠️ **קידום ידני באישור מפורש של רוי, ⛔ לא ביוזמת הלופ** — `fbdd61e..87ca9fd` ff-only, 71 קומיטים. פירוט ⇒ `plan/archive/control-log.md`.
PROMOTIONS_THIS_MONTH: 15         # 15 this month (➕ 08/09 00:10Z, קידום ידני באישור מפורש של רוי). ⛔ Credit budget is no longer a reason to delay (D-086).
```

> 🧑‍⚖️ שתי ביקורות ידניות של רוי — **הפירוט המלא, כולל מצב כל ממצא, ב-`plan/OPERATOR-LOG.md`.**
> ⚡ סקילים של superpowers פעילים (`RULES.md` § 0.7). החוק הקשה: אין טענת הצלחה בלי ריצה טרייה.

### 0.1 יומן העברות מקל — 2 האחרונים בלבד

> ⚠️ **שורה אחת ביומן, ⛔ ולא שתיים** — התקרה נפרצה פעמיים כך (C-0261 · C-0293). שתי המדידות ⇢ `plan/archive/handoff-log.md`.

> 2 שורות לרשומה. ישן יותר → `plan/archive/handoff-log.md`. ההיסטוריה המלאה בגיט.

| Cycle | מסוכן | לסוכן | בשעה | סיבת ההעברה (עד 2 שורות) | תוצר |
|---|---|---|---|---|---|
| C-0519 | QA | DEV | 2026-09-11T01:10:00Z | 🔍 **שער, מלא lane.** `verify` ירוק פעמיים (לפני/אחרי ארכוב) · `loop:health` 22/23 (17 באזהרה — QA/CONTENT/PROMOTER שקטים, לא חוסם עד 13/09) · check 18: ענף `claude/*` יחיד, מוכל ב-`work/current`, ⛔ לא תקוע. **מוזג ל-`dev`** (`90795a5..5ff2cfb` ff-only): `T-190`·`T-191` 🟣⇢✅. הליכה חיה + `diff:render` על `kol-C-13-inbox`: שדות/מחרוזות/סדר תואמים; `/world/messages` מציג מצב `unavailable` בקלון הזה מ**חוסר env** (⛔ לא קוד) — `/dev/messages` הפיקסטורה מלאה ותקינה. אבטחה נבדקה (לא אוטומטית): RLS תקין בשתי הטבלאות, ⛔ אין מפתח שירות בנתיב. `F-210` נותב ל-**PM** (סמנטיקת ניווט, ⛔ אינו חוסם). **`RELEASE_READY` ⛔ לא עודכן** — `F-167` (🟠 defect פתוח, מגיע ללומד) עדיין פתוח. `ACTIVE_WORKSTREAM` נשאר `msgs` (2 ⬜: `T-192` ל-DEV · `T-193` ל-CONTENT) — `WORKSTREAM_ENDING` עדיין תקף. סקילים שנצפו בפועל: `taste-skill` (ריפו) · `ui-styling` (‏`skills/superpowers`, נמשך ב-`git fetch`+`show`). | `50-tasks`·`60-findings`·`00-control`·`plan-open`·`plan-tables`·`dev` (merge) |
| C-0522 | DEV | QA | 2026-09-11T14:13:32Z | 🔨 **בנייה, ⛔ לא תכנון.** `T-192` 🟣 — Tasks 7–8 של `2026-09-08-messages-inbox-slice.md`, התוכנית נסגרה 62/62. `lib/core/requiredWords.ts` (התאמה מדויקת אחרי trim+lower, ⛔ ללא למטייזר — מוצהר) · `RequiredWordChips` (✓ + `success` + טקסט לקורא מסך = שלושה ערוצים, ⛔ אפס אסימון שגיאה) · `PATCH /api/world/messages/state` כותב `read_at` בלבד (⛔ לעולם לא «נענה», R-026), קשיח 503 מול ה-GET הרך, ממופתח על משתמש הסשן · `SimulationMessage` + `/world/messages/[id]` **מחוץ ל-`(tabs)`** (תקדים `/world/compose`) · רצועת ההרכבה נוכחת ומושבתת עם תנאי נקוב. הליכה חיה ב-`next start` ב-320/375/414: ⛔ אפס שגיאות קונסול, ⛔ אפס גלילה אופקית, ⛔ אפס מתחת ל-44px, `1 מתוך 3 מילות חובה`, ⛔ אפס סרגל תחתון, פריסה תואמת `kol-C-14`. **ארבעה פערי תוכנית נמדדו ותוקנו** (`26-plan-feedback`) ו**`F-212` נפתח** — «שלא נענו» מול «נקרא» הן מילה אחת לשני מצבים; ההכרעה של PM. סקילים: `using-superpowers`·`executing-plans`·`taste-skill`·`ui-styling`. | `requiredWords` + `RequiredWordChips` + `state` route + `SimulationMessage` + `[id]` + fixture · `50-tasks` · `60-findings` · `30-architecture` · `00-control` · `26-plan-feedback` · `api-contract` · `architecture-map` · `plan-open`·`plan-tables` |

**החוקים המלאים:** `plan/RULES.md` — פריסה (0.2) · מקביליות (0.3) · סוכני משנה (0.4) · שער טריאז' (0.5)
**מטריצת הקריאה:** `project_plan.md`
