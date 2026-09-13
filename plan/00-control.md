<!--
NEXT_AGENT: DEV                         # ▶️ C-0566 (QA, מלא) — מיזוג + תיקון רגיסטר (4 שורות 🟣 תקועות ל-✅, F-126). `msgs` ⬜=1 של CONTENT ⇒ DEV קורא קדימה ל-`amirnet` (T-270 כשירה).
STATE: READY                      # ▶️ C-0566 (QA): `verify` ✅ (hook, ריצה טרייה) · `loop:health` 21/23 (2=F-237, ⛔ לא חדש) · הליכה חיה נקייה.
ACTIVE_MILESTONE: M0              # M0..M6
ACTIVE_TASK_ID: []   # ▶️ C-0529 — ריק.
CRITIC_ROUNDS_ON_TASK: 0          # ⛔ התור הישן הועבר ל-`plan/archive/control-log.md` (26/08) — הוא היה מת: QA הופך 🟣⇢✅ בכמות מ-`git log`.
LAST_HANDOFF_AT: "2026-09-13T07:50:00Z"   # C-0566 (QA) — מיזוג + תיקון רגיסטר → DEV.
HUMAN_DECISION_REQUIRED: false    # ▶️ ⛔ אינו ממתין. **44 · 45 · 46 נסגרו כולם ב-23/08.** נותר **47** — שורה ב-`RULES § 0.1 ב׳` שהיא הקובץ של רוי, ו⛔ **אינה חוסמת את הקידום של היום**.
# --- נעילה: מונעת שני סוכנים שכותבים לקובץ בו-זמנית ---
LOCK_HELD_BY: "pm-agent"         # 🔒 C-0568 (PM) — נלקחה 2026-09-13T08:40:14Z.
LOCK_AT: "2026-09-13T08:40:14Z"
WORKSTREAM_TICKS:                 # ⚠️ בלם 8 שוכתב 23/08 (רוי): סופר **טיקי עבודה בלבד** — טיק שהסתיים בקומיט. ⛔ טיק שקט/נסיגה/שורה-אחת אינו נספר. תקרה **120 לכל פריט** ב-36-video-spec § 13, ⛔ לא לחזון כולו.
#   story:  13 / 120           # § 13-1 · **מוצתה (⬜=0) · הוזזה→`nav` ב-C-0310 (QA).** הפרוסות A/B/C נמסרו (T-185…T-188 · T-202/203 · T-150). שלוש החותמות (36§13.1) — ראה SEALS למטה.
#   nav:     3 / 120           # § 13-2 · **⬜=0 · חתומה · המוקד הוזז→`cards` ב-C-0316 (QA).** פירוט מלא ⇒ `plan/archive/control-log.md` (הוצא C-0418).
#   cards:  14 / 120           # § 13-3 · **⬜=0 · מוצתה שנית · הוזזה→`arena` ב-C-0500 (QA), ⛔ אינה חתומה** (ⓑⓒ חסומות ב-env). 5 🟣 הפכו ✅ (T-066·T-199·T-228·T-243·T-259). פירוט מלא ⇒ `plan/61-deferred.md` · `plan/archive/control-log.md` (הוצא C-0418).
#   arena:  24 / 120           # § 13-4 · **מוצתה שנית (⬜=0), הוזזה→`msgs` ב-C-0514 (QA).** `T-217`·`T-220`·`T-234`·`T-281`·`T-282`·`T-283` 🟣→✅ מוזגו ל-`dev` בטיק הזה. ⛔ אינה חתומה — ⓑⓒ חסומות ב-env. פירוט ⇒ `plan/61-deferred.md` (מעבר שני) · `plan/archive/control-log.md`.
#   studies: 3 / 120           # § 13-5 · לימודים כמכולת מסלולים. ⬜=0 (`T-144` נסגרה ⛔ · `T-246` 🟣 · `T-247` חסומה עד `dev`). פירוט מלא ⇒ `plan/archive/control-log.md` (הוצא C-0418).
#   amirnet: 18 / 120          # 41 § 8-1..3 · ▶️ C-0564 (DEV): `T-320` 🟣 — השער מסרב בדיוק על מה שהטבלה מסרבת עליו (`vocab_band`, קבוצה סגורה), ו-`F-235`ⓐ נסגר. ⇒ ⬜=1 (`T-270`, חסומה בהכרעת ⓐ). ⛔ `rc`=0 עדיין ⇒ סימולציה מלאה ⛔ ניתנת להרכבה — זו `F-235`ⓑ, של CONTENT.
#   msgs:    4 / 120           # 39-messages-spec § 9 · **המוקד.** ⬜=1, `T-193` — **של CONTENT בלבד** ⇒ ⛔ אין ל-DEV שורה כשירה כאן. `WORKSTREAM_ENDING` פעיל.
MILESTONE_TICKS: 103           # ⛔ מונה M0 הישן — מוקפא, ⛔ ואינו בלם. הבלם החי הוא WORKSTREAM_TICKS
RELEASE_READY: "7f0b0ab · 2026-09-13T07:47Z · **C-0566 (QA, מלא).** `verify`✅(hook) · `loop:health` 21/23 (2=`F-237`, פתוח⇢PM, ⛔ לא חדש) · הליכה חיה 10 מסכים נקייה. smoke: לא נדרש. הלומד מקבל מעבר ל-C-0559: פופאובר סיפור נעמד צמוד למילה (T-290) · שקף מעבר בין פרקי סימולציה, שעון לא מתחיל לפני הקשה (T-316) · רמת סימולציה לפי השלמה אמיתית במסד (T-309) · שער `vocab_band` מזהה 10/26 פריטים פסולים (T-320). תיקון רגיסטר: 4 שורות תקועות 🟣 (כבר על dev) הוזזו ל-✅ — F-126."
PAUSED_BY_HUMAN: false           # ⚠️ הבלם בודק `== true` בלבד. **נמדד C-0418 ב-`git log` מ-01/09: DEV 55 קומיטים · PM 20 · QA 13** ⇒ שלוש המשימות דלוקות ורצות. רקע ⇒ `plan/archive/control-log.md`
# (DEPLOYS_THIS_MONTH · LAST_DEPLOYED_AT — הוצאו 08/09, `D-203`ⓔ. קפאו ב-23/08; הבלם נמדד מ-`PROMOTIONS_THIS_MONTH`.)
LAST_REVIEWED_COMMIT: "75bc311"  # main אחרי הקידום של 12/09 (C-0546, PROMOTER). `verify` exit 0 נרץ על אותו SHA לפני הקידום.
# --- כלכלת פריסה: קרדיטים, לא דקות. 15 קרדיטים לפריסה. ראה RULES § 0.1 ---
WORKING_BRANCH: work/current      # ▶️ **שונה 24/08 · RULES § 0.23 · שלב 2.** DEV ו-CONTENT דוחפים לכאן בלבד. ⛔ שם קבוע, ⛔ לעולם לא שם חדש.
MERGE_TARGET: dev                 # רק QA ממזג לכאן, ורק ב-`merge --ff-only`. ⛔ אף סוכן ⛔ אינו דוחף ל-dev ישירות.
ACTIVE_WORKSTREAM: msgs            # ▶️ הוזז C-0514 (CRITIC, מלא) — `arena` מוצתה שנית (⬜=0, נמדד `docs/plan-open.md` § flag: «הבא ברצף עם עבודה פנויה הוא msgs (4 ⬜)»). `studies` גם היא מוצתה (⬜=0) ⇒ נדלגת, ⛔ לא נבחרה.
PREV_WORKSTREAM: "arena"     # 🆕 C-0514 (CRITIC) — `arena` (מעבר שני): T-217·T-220·T-234·T-281·T-282·T-283 נבנו ומוזגו בטיק הזה. שורת `61-deferred` נכתבה (מעבר שני). (ההיסטוריה הקודמת בגיט.)
WORKSTREAM_ENDING: msgs · 1 ⬜ נותרה · 2026-09-13T03:56:18Z · C-0561   # 🆕 PM כותב · **QA קורא**. ⛔ אינו היתר להזיז את `ACTIVE_WORKSTREAM` (`§ 0.23 ז׳`). ⚠️ **נמדד שוב C-0561, ⛔ ללא שינוי:** ה-⬜ היחידה ב-`msgs` היא `T-193` ו**היא של CONTENT** ⇒ ⛔ אין ל-DEV שורה כשירה כאן. ‏`amirnet` (הבאה ברצף) מוזנת ל-**3 ⬜**: `T-270`·`T-313`·`T-314` (+`T-316` ⛔ חסומה ב-`T-314`).
# (SEALS · BUDGET_NOTE · הערות הכיווץ — הוצאו 08/09 ל-`plan/archive/control-log.md`.
#  ⛔ אפס צרכנים בכל המאגר: ⛔ אף סקריפט, ⛔ אף כלל ו⛔ אף פרומפט ⛔ אינם קוראים אותם. ⛔ אין להחזירם.)
IMPROVE_TARGET: ""              # 🩺 D-146 · **ריק = המצב כבוי.** ▶️ **C-0412: נוסה ו⛔ לא ניתן להדליק — נמדד.** `story` ⇒ בדיקה 14 FAIL (3 ⬜ מראש, תקרה 2) · `nav` ⇒ ⛔ אין לה דבר ב-`61-deferred` · `cards`/`arena` ⛔ אינן חתומות. פירוט ⇒ `D-184`.
MERGE_BLOCKERS: ""                # ⇐ **QA כותב · DEV קורא ראשון.** רק מה שחוסם **מיזוג** ל-`dev` (`§ 0.23 ז׳`). ⛔ לא חסם קידום. ▶️ C-0534 (QA, מלא): `F-219` נסגר — `ops(loop)` איחד את `dev` ל-`work/current` (`65359cb`) לפני הטיק הזה; `rev-list` בשני הכיוונים נמדד **0** על `0851258` לפני הקומיטים של הטיק הזה.
PROMOTION_BLOCKERS: ""            # ✅ **נפתר 2026-09-12T16:29Z — C-0546 (PROMOTER):** הקידום עבר, `main`=`75bc311`, כל 5 תנאי השער ירוקים. היסטוריית C-0521 (הסירוב הלא-דטרמיניסטי, F-229) ⇒ `plan/archive/control-log.md` · פריט 110 ב-`03-for-roy.md`. # ⇐ PROMOTER בלבד.
DEPLOY_BRANCH: main               # Netlify בונה אך ורק את זה. 🆕 06/09: **רק PROMOTER מקדם לכאן** (`RULES § 0.29`, `5 0 * * *` UTC — ⚠️ הוזז ב-07/09 בבקשה מפורשת של רוי: `0 23` ⇢ `21 23` ⇢ `5 0`, כי `23:21` השאיר 11 דקות בלבד מטיק DEV של 36 דקות). רוי גובר תמיד.
LAST_PROMOTED_AT: "2026-09-12T16:29:28Z"  # ⚡ קידום אוטומטי של הלופ — C-0546 (PROMOTER), כל 5 תנאי השער ירוקים. `2b8e1b7..75bc311` ff-only, 124 קומיטים. פירוט ⇒ `plan/archive/control-log.md`.
PROMOTIONS_THIS_MONTH: 16         # 16 this month (➕ 12/09 16:29Z, C-0546 PROMOTER — קידום אוטומטי). ⛔ Credit budget is no longer a reason to delay (D-086).
```

> 🧑‍⚖️ שתי ביקורות ידניות של רוי — **הפירוט המלא, כולל מצב כל ממצא, ב-`plan/OPERATOR-LOG.md`.**
> ⚡ סקילים של superpowers פעילים (`RULES.md` § 0.7). החוק הקשה: אין טענת הצלחה בלי ריצה טרייה.

### 0.1 יומן העברות מקל — 2 האחרונים בלבד

> ⚠️ **שורה אחת ביומן, ⛔ ולא שתיים** — התקרה נפרצה פעמיים כך (C-0261 · C-0293). שתי המדידות ⇢ `plan/archive/handoff-log.md`.

> 2 שורות לרשומה. ישן יותר → `plan/archive/handoff-log.md`. ההיסטוריה המלאה בגיט.

| Cycle | מסוכן | לסוכן | בשעה | סיבת ההעברה (עד 2 שורות) | תוצר |
|---|---|---|---|---|---|





**החוקים המלאים:** `plan/RULES.md` — פריסה (0.2) · מקביליות (0.3) · סוכני משנה (0.4) · שער טריאז' (0.5)
**מטריצת הקריאה:** `project_plan.md`
| C-0566 | QA | DEV | 2026-09-13T07:50:00Z | 🚦 **מסלול: מלא — שער מלא.** `verify`✅(hook, ריצה טרייה) · `loop:health` 21/23 (2=`F-237`, פתוח⇢PM, ⛔ לא חדש) · הליכה חיה 10 מסכי `/dev`/`/world` נקייה (amirnet·messages·lesson·story). מיזוג `--ff-only` `3d2e8b0..7f0b0ab`. **תיקון רגיסטר:** `T-290`·`T-309`·`T-316`·`T-320` נמצאו תקועות 🟣 אף שקודן כבר `dev` מטיקים קודמים (C-0560…C-0564) — הוזזו ל-✅ (F-126, ההעתקה היא ה-`git log`, ⛔ אין שיפוט). `RELEASE_READY` עודכן, שלוש הקשות חדשות ב-`03-for-roy`. | `plan/50-tasks.md` · `plan/archive/tasks-archive.md` · `docs/plan-open.md` · `docs/plan-tables.md` · `plan/00-control.md` · `plan/03-for-roy.md` |
| C-0564 | DEV | QA | 2026-09-13T06:43:33Z | 🔨 **בנייה · קריאה קדימה ל-`amirnet`** (`msgs` ⬜=1, של CONTENT). `T-320` 🟣 — **שורה שפתחתי בעצמי**, הצעד הבא של יעד ① ב-`amirnet`: `vocab_band` נכנס ל-`AmirnetItemRecord` ולנימוקי `amirnetItemGate()` כקבוצה סגורה — **אותה** שב-`amirnet_items_vocab_band_check`. **נמדד לפני ואחרי, אותם שלושה קבצים:** `measure:amirnet-gate` ⇒ `0 rejected` ⇢ `10 rejected`; `build:amirnet-items` ⇒ `16 emitted · 10 refused` בשני הצדדים, והזרע **זהה בית-בבית** ⇒ ההזרמה תמיד צדקה, **הדוח** — זה ש-CONTENT קורא — הוא ששיקר. בנוסף: דחיית פרק נוקבת בשאלה ובסיבה (`rc-q4 — bad_vocab_band`) ⛔ ולא `item_3_failed`. ⛔ **ⓑ ⛔ לא נגעה** (`R-010`), `rc`=0. | `lib/core/amirnetItemGate.ts` (+6) · `amirnetChapterGate.test.ts` (+1) · `scripts/build-amirnet-items.mjs` · `scripts/measure-amirnet-gate.mjs` (+2) · `docs/amirnet-gate-report.md` · `architecture-map.json` · 4 רגיסטרים |
