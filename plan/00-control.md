<!--
NEXT_AGENT: QA                       # ▶️ C-0536 (DEV) — `F-224` 🔴 **נסגר בקוד** (הלשוניות הבנויות מנווטות, נמדד חי). ⬜ פנויות ב-`amirnet`: `T-296` · `T-297` · `T-270`.
STATE: BUILDING                   # ▶️ C-0536 (DEV) — 🔨 טיק בנייה. `F-224` 🔴 נסגר בקוד + שומר רנדר חדש (`AmirnetTabs.dom.test.tsx`).
ACTIVE_MILESTONE: M0              # M0..M6
ACTIVE_TASK_ID: []   # ▶️ C-0529 — ריק.
CRITIC_ROUNDS_ON_TASK: 0          # ⛔ התור הישן הועבר ל-`plan/archive/control-log.md` (26/08) — הוא היה מת: QA הופך 🟣⇢✅ בכמות מ-`git log`.
LAST_HANDOFF_AT: "2026-09-12T09:44:00Z"   # C-0536 (DEV) — `F-224` 🔴 נסגר בקוד.
HUMAN_DECISION_REQUIRED: false    # ▶️ ⛔ אינו ממתין. **44 · 45 · 46 נסגרו כולם ב-23/08.** נותר **47** — שורה ב-`RULES § 0.1 ב׳` שהיא הקובץ של רוי, ו⛔ **אינה חוסמת את הקידום של היום**.
# --- נעילה: מונעת שני סוכנים שכותבים לקובץ בו-זמנית ---
LOCK_HELD_BY: ""                 # 🔒 שוחררה C-0536 (DEV) — בקומיט נפרד ואחרון (`D-210`).
LOCK_AT: ""
WORKSTREAM_TICKS:                 # ⚠️ בלם 8 שוכתב 23/08 (רוי): סופר **טיקי עבודה בלבד** — טיק שהסתיים בקומיט. ⛔ טיק שקט/נסיגה/שורה-אחת אינו נספר. תקרה **120 לכל פריט** ב-36-video-spec § 13, ⛔ לא לחזון כולו.
#   story:  13 / 120           # § 13-1 · **מוצתה (⬜=0) · הוזזה→`nav` ב-C-0310 (QA).** הפרוסות A/B/C נמסרו (T-185…T-188 · T-202/203 · T-150). שלוש החותמות (36§13.1) — ראה SEALS למטה.
#   nav:     3 / 120           # § 13-2 · **⬜=0 · חתומה · המוקד הוזז→`cards` ב-C-0316 (QA).** פירוט מלא ⇒ `plan/archive/control-log.md` (הוצא C-0418).
#   cards:  14 / 120           # § 13-3 · **⬜=0 · מוצתה שנית · הוזזה→`arena` ב-C-0500 (QA), ⛔ אינה חתומה** (ⓑⓒ חסומות ב-env). 5 🟣 הפכו ✅ (T-066·T-199·T-228·T-243·T-259). פירוט מלא ⇒ `plan/61-deferred.md` · `plan/archive/control-log.md` (הוצא C-0418).
#   arena:  24 / 120           # § 13-4 · **מוצתה שנית (⬜=0), הוזזה→`msgs` ב-C-0514 (QA).** `T-217`·`T-220`·`T-234`·`T-281`·`T-282`·`T-283` 🟣→✅ מוזגו ל-`dev` בטיק הזה. ⛔ אינה חתומה — ⓑⓒ חסומות ב-env. פירוט ⇒ `plan/61-deferred.md` (מעבר שני) · `plan/archive/control-log.md`.
#   studies: 3 / 120           # § 13-5 · לימודים כמכולת מסלולים. ⬜=0 (`T-144` נסגרה ⛔ · `T-246` 🟣 · `T-247` חסומה עד `dev`). פירוט מלא ⇒ `plan/archive/control-log.md` (הוצא C-0418).
#   amirnet: 5 / 120           # 41 § 8-1..3 · ▶️ C-0536 (DEV): `F-224` 🔴 נסגר בקוד — שלוש הלשוניות. ⟦C-0535⟧ `F-222` נסגר (`D-212`) ⇒ `T-297` נפתחה; `T-298` (מסך תוצאה, `kol-D-07`) נפתחה ⛔ חסומה ב-`T-296`. ⬜ פנויות ל-DEV: `T-296` · `T-297` · `T-270`.
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
WORKSTREAM_ENDING: msgs · 1 ⬜ נותרה · 2026-09-12T09:05:00Z · C-0535   # 🆕 PM כותב · **QA קורא**. ⛔ אינו היתר להזיז את `ACTIVE_WORKSTREAM` (`§ 0.23 ז׳`). ⚠️ **נמדד מחדש C-0535:** ה-⬜ היחידה ב-`msgs` היא `T-193`, ו**היא של CONTENT** ⇒ ⛔ אין ל-DEV שורה כשירה כאן. ‏`amirnet` (הבאה ברצף) מוזנת: `T-296`·`T-297`·`T-270` ⬜.
# (SEALS · BUDGET_NOTE · הערות הכיווץ — הוצאו 08/09 ל-`plan/archive/control-log.md`.
#  ⛔ אפס צרכנים בכל המאגר: ⛔ אף סקריפט, ⛔ אף כלל ו⛔ אף פרומפט ⛔ אינם קוראים אותם. ⛔ אין להחזירם.)
IMPROVE_TARGET: ""              # 🩺 D-146 · **ריק = המצב כבוי.** ▶️ **C-0412: נוסה ו⛔ לא ניתן להדליק — נמדד.** `story` ⇒ בדיקה 14 FAIL (3 ⬜ מראש, תקרה 2) · `nav` ⇒ ⛔ אין לה דבר ב-`61-deferred` · `cards`/`arena` ⛔ אינן חתומות. פירוט ⇒ `D-184`.
MERGE_BLOCKERS: ""                # ⇐ **QA כותב · DEV קורא ראשון.** רק מה שחוסם **מיזוג** ל-`dev` (`§ 0.23 ז׳`). ⛔ לא חסם קידום. ▶️ C-0534 (QA, מלא): `F-219` נסגר — `ops(loop)` איחד את `dev` ל-`work/current` (`65359cb`) לפני הטיק הזה; `rev-list` בשני הכיוונים נמדד **0** על `0851258` לפני הקומיטים של הטיק הזה.
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
| C-0535 | PM | DEV | 2026-09-12T09:06:00Z | 📐 **תכנון + `STEP 5.5`.** 🔨 `T-295` 🟣 — אריח שקריאתו נכשלה אומר `הנתונים לא נטענו` ⛔ ולא «—», «אין מה לתרגל» ⛔ אינו מוצג על קריאה שלא הגיעה, ופקד `טעינה מחדש` ≥44px קורא מחדש במקום (`D-214`). ⚖️ 4 ממצאים נסגרו: `F-222`→`D-212` (טבלת `amirnet_items` ⇒ `T-297` נפתחה) · `F-223`→`D-213` · `F-220`+`F-226`. 📝 `T-298` (מסך תוצאת סימולציה, `kol-D-07`) · `T-299` (`F-225` — בדיקה 2 סורקת טקסט חופשי). 🚶 שתי הליכות `next start` 375px × 10 מסכים: 0 גלילה · 0 מתחת ל-44px. | `DeckSelector`·`50-tasks`·`60-findings`·`40-decisions`·`05-departments`·`00-control` |

| C-0536 | DEV | QA | 2026-09-12T09:44:00Z | 🔨 **טיק בנייה — `F-224` 🔴 נסגר בקוד.** כל לשונית אמירנט **בנויה** היא `<Link href>` אמיתי; היעדים במפה אחת `AMIRNET_TAB_HREF` **צמודה ל-`AMIRNET_BUILT_TABS`** — מפתח שנדלק בלי ראוט ⇒ בדיקה אדומה, ⛔ ולא 404 ללומד. לשונית שטרם נבנתה נשארת `<span aria-disabled>` עם «טרם», ⛔ ולא קישור; הלשונית הפעילה נושאת `aria-current="page"`. 🚶 **הליכה חיה `next start` 375×780:** דשבורד ⇢ «תרגול» ⇒ `/world/amirnet/practice` ✅ · חזרה ⇒ `/world/amirnet` ✅ · «סימולציה» ⇒ ה-URL ⛔ לא זז (נכון). 4 מסכים: 0 גלילה אופקית · 0 מתחת ל-44px · 0 שגיאות קונסול. 🔬 **הלקח:** ארבע בדיקות הסריקה היו **ירוקות לכל אורך `F-224`** — המקור נקרא מושלם, וה-`href` החסר הוא בדיוק מה שגְרֶפּ ⛔ אינו רואה ⇒ השומר הוא **רנדר** (`AmirnetTabs.dom.test.tsx`, 6 בדיקות). | `AmirnetTabs`·`AmirnetTabs.dom.test`·`AmirnetDashboard`·`60-findings`·`30-architecture`·`00-control` |

**החוקים המלאים:** `plan/RULES.md` — פריסה (0.2) · מקביליות (0.3) · סוכני משנה (0.4) · שער טריאז' (0.5)
**מטריצת הקריאה:** `project_plan.md`
