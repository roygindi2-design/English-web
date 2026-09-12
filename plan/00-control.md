<!--
NEXT_AGENT: CONTENT                      # ▶️ C-0528 (QA, מלא) — `T-289` ✅. `msgs` ⬜=1 ונותרה **של CONTENT בלבד** (`T-193`) ⇒ DEV אין לו שורה כשירה כאן; קריאה קדימה ל-`amirnet` פתוחה. ⛔ אין קשר ל-`F-219` — עבודה על `work/current` ⛔ אינה חסומה, רק המיזוג ל-`dev`.
STATE: BUILT                       # ▶️ C-0528 (QA) — `T-289` נבדקה: verify מלא ירוק, הליכה על שני מסכי `msgs`, אפס שגיאות. ⛔ המיזוג ל-`dev` חסום — ראה `F-219`.
ACTIVE_MILESTONE: M0              # M0..M6
ACTIVE_TASK_ID: []   # ▶️ C-0528 (QA) — ריק, כרגיל בטיק ביקורת.
CRITIC_ROUNDS_ON_TASK: 0          # ⛔ התור הישן הועבר ל-`plan/archive/control-log.md` (26/08) — הוא היה מת: QA הופך 🟣⇢✅ בכמות מ-`git log`.
LAST_HANDOFF_AT: "2026-09-12T01:37:17Z"   # C-0528 (QA, מלא) — שער חסום: `origin/dev` דחוף ישירות (`5e37cdc`), `merge --ff-only` נכשל. `F-219` 🔴 נפתח → רוי.
HUMAN_DECISION_REQUIRED: false    # ▶️ ⛔ אינו ממתין. **44 · 45 · 46 נסגרו כולם ב-23/08.** נותר **47** — שורה ב-`RULES § 0.1 ב׳` שהיא הקובץ של רוי, ו⛔ **אינה חוסמת את הקידום של היום**.
# --- נעילה: מונעת שני סוכנים שכותבים לקובץ בו-זמנית ---
LOCK_HELD_BY: "DEV"              # 🔒 נלקחה 2026-09-12T02:34:13Z — C-0529 (DEV, בנייה): קריאה קדימה ל-`amirnet`, `T-286` תפריט התרגול.
LOCK_AT: "2026-09-12T02:34:13Z"
WORKSTREAM_TICKS:                 # ⚠️ בלם 8 שוכתב 23/08 (רוי): סופר **טיקי עבודה בלבד** — טיק שהסתיים בקומיט. ⛔ טיק שקט/נסיגה/שורה-אחת אינו נספר. תקרה **120 לכל פריט** ב-36-video-spec § 13, ⛔ לא לחזון כולו.
#   story:  13 / 120           # § 13-1 · **מוצתה (⬜=0) · הוזזה→`nav` ב-C-0310 (QA).** הפרוסות A/B/C נמסרו (T-185…T-188 · T-202/203 · T-150). שלוש החותמות (36§13.1) — ראה SEALS למטה.
#   nav:     3 / 120           # § 13-2 · **⬜=0 · חתומה · המוקד הוזז→`cards` ב-C-0316 (QA).** פירוט מלא ⇒ `plan/archive/control-log.md` (הוצא C-0418).
#   cards:  14 / 120           # § 13-3 · **⬜=0 · מוצתה שנית · הוזזה→`arena` ב-C-0500 (QA), ⛔ אינה חתומה** (ⓑⓒ חסומות ב-env). 5 🟣 הפכו ✅ (T-066·T-199·T-228·T-243·T-259). פירוט מלא ⇒ `plan/61-deferred.md` · `plan/archive/control-log.md` (הוצא C-0418).
#   arena:  24 / 120           # § 13-4 · **מוצתה שנית (⬜=0), הוזזה→`msgs` ב-C-0514 (QA).** `T-217`·`T-220`·`T-234`·`T-281`·`T-282`·`T-283` 🟣→✅ מוזגו ל-`dev` בטיק הזה. ⛔ אינה חתומה — ⓑⓒ חסומות ב-env. פירוט ⇒ `plan/61-deferred.md` (מעבר שני) · `plan/archive/control-log.md`.
#   studies: 3 / 120           # § 13-5 · לימודים כמכולת מסלולים. ⬜=0 (`T-144` נסגרה ⛔ · `T-246` 🟣 · `T-247` חסומה עד `dev`). פירוט מלא ⇒ `plan/archive/control-log.md` (הוצא C-0418).
#   msgs:    4 / 120           # 39-messages-spec § 9 · הודעות — **המוקד.** ▶️ C-0527 (DEV) — `T-289` 🟣: המונה והתווית לקורא-מסך אומרים «נקרא», ⛔ ולא «נענה» (`D-207` · `F-212`). ⬜=1 ונותרה **של CONTENT בלבד**: `T-193`. ⇒ ⛔ אין ל-DEV שורה כשירה כאן. ⛔ פריטים אחרים חסומים ב-R-026
MILESTONE_TICKS: 103           # ⛔ מונה M0 הישן — מוקפא, ⛔ ואינו בלם. הבלם החי הוא WORKSTREAM_TICKS
RELEASE_READY: "38c158c · 2026-09-11T18:10Z · **C-0524 (QA, מלא).** `verify` ירוק (236 קובצי בדיקה · 3974 בדיקות · build✅ · check:mobile 1561/1561) · `loop:health` 23/23. הלומד מקבל: הודעה פתוחה בתיבת הסימולציות עם שבבי מילות חובה (`T-192`), ומרזב אחיד (24px) בכל המוצר (`T-285`)."
PAUSED_BY_HUMAN: false           # ⚠️ הבלם בודק `== true` בלבד. **נמדד C-0418 ב-`git log` מ-01/09: DEV 55 קומיטים · PM 20 · QA 13** ⇒ שלוש המשימות דלוקות ורצות. רקע ⇒ `plan/archive/control-log.md`
# (DEPLOYS_THIS_MONTH · LAST_DEPLOYED_AT — הוצאו 08/09, `D-203`ⓔ. קפאו ב-23/08; הבלם נמדד מ-`PROMOTIONS_THIS_MONTH`.)
LAST_REVIEWED_COMMIT: "807ae72"  # main אחרי הקידום של 06/09. `verify` exit 0 נרץ על אותו SHA לפני הקידום.
# --- כלכלת פריסה: קרדיטים, לא דקות. 15 קרדיטים לפריסה. ראה RULES § 0.1 ---
WORKING_BRANCH: work/current      # ▶️ **שונה 24/08 · RULES § 0.23 · שלב 2.** DEV ו-CONTENT דוחפים לכאן בלבד. ⛔ שם קבוע, ⛔ לעולם לא שם חדש.
MERGE_TARGET: dev                 # רק QA ממזג לכאן, ורק ב-`merge --ff-only`. ⛔ אף סוכן ⛔ אינו דוחף ל-dev ישירות.
ACTIVE_WORKSTREAM: msgs            # ▶️ הוזז C-0514 (CRITIC, מלא) — `arena` מוצתה שנית (⬜=0, נמדד `docs/plan-open.md` § flag: «הבא ברצף עם עבודה פנויה הוא msgs (4 ⬜)»). `studies` גם היא מוצתה (⬜=0) ⇒ נדלגת, ⛔ לא נבחרה.
PREV_WORKSTREAM: "arena"     # 🆕 C-0514 (CRITIC) — `arena` (מעבר שני): T-217·T-220·T-234·T-281·T-282·T-283 נבנו ומוזגו בטיק הזה. שורת `61-deferred` נכתבה (מעבר שני). (ההיסטוריה הקודמת בגיט.)
WORKSTREAM_ENDING: msgs · 2 ⬜ נותרו · 2026-09-11T14:50:50Z · C-0523   # 🆕 PM כותב · **QA קורא**. ⛔ אינו היתר להזיז את `ACTIVE_WORKSTREAM` (`§ 0.23 ז׳`). ⚠️ **עודכן C-0523:** `T-289` (`D-207`) נוספה ⇒ ל-DEV **כן** יש שורה כאן שוב. השנייה, `T-193`, היא של CONTENT. ‏`amirnet` מחזיקה 4 ⬜ (`T-270`·`T-286`·`T-287`·`T-291`) ⇒ קריאה קדימה של DEV פתוחה.
# (SEALS · BUDGET_NOTE · הערות הכיווץ — הוצאו 08/09 ל-`plan/archive/control-log.md`.
#  ⛔ אפס צרכנים בכל המאגר: ⛔ אף סקריפט, ⛔ אף כלל ו⛔ אף פרומפט ⛔ אינם קוראים אותם. ⛔ אין להחזירם.)
IMPROVE_TARGET: ""              # 🩺 D-146 · **ריק = המצב כבוי.** ▶️ **C-0412: נוסה ו⛔ לא ניתן להדליק — נמדד.** `story` ⇒ בדיקה 14 FAIL (3 ⬜ מראש, תקרה 2) · `nav` ⇒ ⛔ אין לה דבר ב-`61-deferred` · `cards`/`arena` ⛔ אינן חתומות. פירוט ⇒ `D-184`.
MERGE_BLOCKERS: "F-219"                # ⇐ **QA כותב · DEV קורא ראשון.** רק מה שחוסם **מיזוג** ל-`dev` (`§ 0.23 ז׳`). ⛔ לא חסם קידום. C-0528: `origin/dev` (`5e37cdc`) ו-`origin/work/current` (`ec84c6f`) נפרדו מ-`109c86e` המשותף; `merge --ff-only` מסרב (exit 128). ⛔ לא לתקן פה — החלטת רוי, `F-219`.
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
| C-0527 | DEV | QA | 2026-09-12T00:41:33Z | 🔨 **טיק בנייה — `T-289` 🟣.** התיבה הפסיקה לומר «שלא נענו» על מצב ש⛔ אין לו כותב: `answered_at` חסום ב-`R-026`, ⇒ הפרדיקט מדד «⛔ טרם נקראה» מאז ומעולם. ⓐ המונה ⇒ `שלא נקראו` · ⓑ **התווית ל-קורא-מסך** (`InboxList.tsx:111`, הערוץ **היחיד** שלו) ⇒ `טרם נקראה`/`נקראה` · ⓒ `unanswered`⇒`unread` ב-`messages.ts` ובכל קוראיו + `data-inbox-unread` · ⓓ שני הרנדרים יושרו. ⛔ **גוף הפרדיקט ⛔ לא נגע** — `answeredAt` נשאר בצירוף, ו«נענה» ייוולד עם המקלדת כחיווי **שני**. ⛔ אפס סכמה, ⛔ `T-192`ⓔ ⛔ לא זזה. **TDD:** 9 בדיקות נצפו **נופלות** לפני הקוד; **2 חדשות** — תרחיש הכשל של `F-212` (נפתחה · ⛔ לא נענתה ⇒ נספרת **ונוסחת** כנקראה) ושומר על ערוץ ה-`sr-only`, ש⛔ לא הייתה לו בדיקה כלל. 🚶 הליכה `next start` 375x780: מונה «3 הודעות · 2 שלא נקראו», `sr-only` «טרם נקראה»×2 · «נקראה»×1, 0 גלילה אופקית · 0 מתחת ל-44px · 0 שגיאות קונסול. 🗺️ `generate-map` הורץ (‏`F-215`). ⏭️ `msgs` ⬜=1 ו**היא של CONTENT** ⇒ קריאה קדימה ל-`amirnet` (4 ⬜) פתוחה; ⛔ לא נלקחה שורה שם — ארבעתן מסכים שלמים, והחלון שנותר היה קצר מהן. סקילים: `superpowers:using-superpowers` · `superpowers:test-driven-development` | `messages`·`InboxList`·`messages.test`·`InboxList.test`·`messages-fixture.test`·`render_video_C`·`render_msgs_screens` · `50-tasks`·`00-control`·`plan-open`·`plan-tables` |
| C-0528 | QA | DEV | 2026-09-12T01:37:17Z | 🚦 **ביקורת מלאה — שער חסום, ⛔ לא מוזג.** `verify` מלא ירוק (typecheck·tests·build·mobile 1561/1561) · `loop:health` 21/23. הליכת מוצר על שני מסכי `msgs` (`/dev/messages`·`/dev/messages/open`) — אפס שגיאות קונסול, אפס גלילה אופקית, אפס מתחת ל-44px. `T-289` 🟣⇢✅ (הקוד כבר על `dev`). **`F-219` 🔴 נפתח** — `origin/dev` נדחף ישירות (קומיט `5e37cdc`, טיק שער קודם) ⇒ `merge --ff-only` נכשל (exit 128); ⬜ פתוח → **רוי**, החלטת היסטוריה. **`F-220`** — הרגיסטר הזה 331 בייט מעל התקרה. **`F-221`** — `kol-C-13-inbox.png` לא חודש אחרי `T-289`. `msgs` ⬜=1 (`T-193`, CONTENT) ⇒ ⛔ לא מוצתה. סקילים: `superpowers:using-superpowers` · `superpowers:verification-before-completion`. | `60-findings`·`50-tasks`·`00-control`·`plan-open`·`plan-tables`·`63-surfaces` |

**החוקים המלאים:** `plan/RULES.md` — פריסה (0.2) · מקביליות (0.3) · סוכני משנה (0.4) · שער טריאז' (0.5)
**מטריצת הקריאה:** `project_plan.md`
