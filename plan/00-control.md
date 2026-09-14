<!--
NEXT_AGENT: QA                               # ▶️ C-0609 (DEV): `T-348`·`T-349` 🟣, `F-253` נסגר. `general` ⬜=0 — ⛔ אך `base`/`loop` ⛔ אינן ריקות.
STATE: READY                      # ▶️ C-0609 (DEV): `verify` exit 0, `check:mobile` 1963. אין חוסם.
ACTIVE_MILESTONE: M0              # M0..M6
ACTIVE_TASK_ID: []   # ▶️ C-0529 — ריק.
CRITIC_ROUNDS_ON_TASK: 0          # ⛔ התור הישן הועבר ל-`plan/archive/control-log.md` (26/08) — הוא היה מת: QA הופך 🟣⇢✅ בכמות מ-`git log`.
LAST_HANDOFF_AT: "2026-09-14T14:46:30Z"   # C-0609 (DEV, בנייה) — שתי שורות `general` נבנו ונמדדו חי.
HUMAN_DECISION_REQUIRED: false    # ▶️ ⛔ אינו ממתין. **44 · 45 · 46 נסגרו כולם ב-23/08.** נותר **47** — שורה ב-`RULES § 0.1 ב׳` שהיא הקובץ של רוי, ו⛔ **אינה חוסמת את הקידום של היום**.
# --- נעילה: מונעת שני סוכנים שכותבים לקובץ בו-זמנית ---
LOCK_HELD_BY: ""                 # 🔒 שוחררה 2026-09-14T14:50:45Z — C-0609 (DEV, בנייה).
LOCK_AT: ""
WORKSTREAM_TICKS:                 # ⚠️ בלם 8 שוכתב 23/08 (רוי): סופר **טיקי עבודה בלבד** — טיק שהסתיים בקומיט. ⛔ טיק שקט/נסיגה/שורה-אחת אינו נספר. תקרה **120 לכל פריט** ב-36-video-spec § 13, ⛔ לא לחזון כולו.
#   story:  13 / 120           # § 13-1 · **מוצתה (⬜=0) · הוזזה→`nav` ב-C-0310 (QA).** הפרוסות A/B/C נמסרו (T-185…T-188 · T-202/203 · T-150). שלוש החותמות (36§13.1) — ראה SEALS למטה.
#   nav:     3 / 120           # § 13-2 · **⬜=0 · חתומה · המוקד הוזז→`cards` ב-C-0316 (QA).** פירוט מלא ⇒ `plan/archive/control-log.md` (הוצא C-0418).
#   cards:  14 / 120           # § 13-3 · **⬜=0 · מוצתה שנית · הוזזה→`arena` ב-C-0500 (QA), ⛔ אינה חתומה** (ⓑⓒ חסומות ב-env). 5 🟣 הפכו ✅ (T-066·T-199·T-228·T-243·T-259). פירוט מלא ⇒ `plan/61-deferred.md` · `plan/archive/control-log.md` (הוצא C-0418).
#   arena:  24 / 120           # § 13-4 · **מוצתה שנית (⬜=0), הוזזה→`msgs` ב-C-0514 (QA).** `T-217`·`T-220`·`T-234`·`T-281`·`T-282`·`T-283` 🟣→✅ מוזגו ל-`dev` בטיק הזה. ⛔ אינה חתומה — ⓑⓒ חסומות ב-env. פירוט ⇒ `plan/61-deferred.md` (מעבר שני) · `plan/archive/control-log.md`.
#   studies: 3 / 120           # § 13-5 · לימודים כמכולת מסלולים. ⬜=0 (`T-144` נסגרה ⛔ · `T-246` 🟣 · `T-247` חסומה עד `dev`). פירוט מלא ⇒ `plan/archive/control-log.md` (הוצא C-0418).
#   amirnet: 19 / 120          # 41 § 8-1..3 · ▶️ C-0579 (DEV): `T-270`ⓑ 🟣 — `public.amirnet_vocab` נוצרה במסד החי (9 עמודות · 6 `check` · RLS · 0 שורות), ו-`D-232` אכוף בסכמה: `A1`/`C2` ⛔ בלתי-ניתנות לכתיבה, נמדד. ⓒ פוצל ל-`T-323` (פולט SQL) ו-`T-324` (טעינה + מדידה), שתיהן ⬜/⛔ חדשות. ‏`F-235`ⓑ עדיין של CONTENT.
#   general: — / 120          # ⛔ מחוץ לרצף `36 § 13` ⇒ ⛔ אין תקרה. ▶️ C-0609 (DEV): `T-348` 🟣 — הגדר הכפולה ירדה מהמסך השלישי והאחרון בזירה (‏`left=24 · w=327` ב-375, `F-253` נסגר); `T-349` 🟣 — דרך אחת החוצה מכשל חפיסה, מלא כחלקי, ב-`top=515.5` ⇐ `783.5`.
#   loop:    — / 120          # ⛔ מחוץ לרצף `36 § 13`. ▶️ C-0605 (DEV): `T-332` 🟣 — הפיקסטורה מקבלת רגיסטר מבוים דרך `PLAN_TASKS_FILE` ⇒ ⛔ אין עוד שורה שפתיחתה מפילה `verify`; הכיסוי החי נשאר `skipIf`.
#   msgs:    4 / 120           # 39-messages-spec § 9 · **המוקד.** ⬜=1, `T-193` — **של CONTENT בלבד** ⇒ ⛔ אין ל-DEV שורה כשירה כאן. `WORKSTREAM_ENDING` פעיל.
MILESTONE_TICKS: 103           # ⛔ מונה M0 הישן — מוקפא, ⛔ ואינו בלם. הבלם החי הוא WORKSTREAM_TICKS
RELEASE_READY: "42fe1774 · 2026-09-14T13:30:01Z · **C-0607 (PROMOTER).** קודם ל-`main`, `4a402514..42fe1774` ff-only, 96 קומיטים. `verify` ירוק בדחיפה (4477/4477 מלא בקלון + 2819/2819 חוזר ב-hook), `check:mobile` 1927. `loop:health` 22/23 (18=`F-248`, כבר פתוח → CONTENT — ⛔ לא נסגר ע"י הטיק הזה). Netlify: `state:ready · context:production · branch:main · commit_ref:42fe1774` תואם. 🔴 בדיקת עשן `/api/health` **קופצנית — 2/6 `ok:true`, 4/6 `ok:false` — ⛔ ראו `PROMOTION_BLOCKERS`.**"
PAUSED_BY_HUMAN: false           # ⚠️ הבלם בודק `== true` בלבד. **נמדד C-0418 ב-`git log` מ-01/09: DEV 55 קומיטים · PM 20 · QA 13** ⇒ שלוש המשימות דלוקות ורצות. רקע ⇒ `plan/archive/control-log.md`
# (DEPLOYS_THIS_MONTH · LAST_DEPLOYED_AT — הוצאו 08/09, `D-203`ⓔ. קפאו ב-23/08; הבלם נמדד מ-`PROMOTIONS_THIS_MONTH`.)
LAST_REVIEWED_COMMIT: "42fe177"  # main אחרי הקידום של 14/09 (C-0607, PROMOTER). `verify` exit 0 נרץ על אותו SHA לפני הקידום.
# --- כלכלת פריסה: קרדיטים, לא דקות. 15 קרדיטים לפריסה. ראה RULES § 0.1 ---
WORKING_BRANCH: work/current      # ▶️ **שונה 24/08 · RULES § 0.23 · שלב 2.** DEV ו-CONTENT דוחפים לכאן בלבד. ⛔ שם קבוע, ⛔ לעולם לא שם חדש.
MERGE_TARGET: dev                 # רק QA ממזג לכאן, ורק ב-`merge --ff-only`. ⛔ אף סוכן ⛔ אינו דוחף ל-dev ישירות.
ACTIVE_WORKSTREAM: general            # ▶️ **הוזז C-0576 (PM · `D-174`, המהלך היחיד שהוא שלי — ⛔ כיוון אחד, ⛔ לערך הזה בלבד).** ‏`msgs` ⬜=1 והיא `T-193` של CONTENT ⇒ ⛔ אין שורה כשירה ל-DEV, נמדד גם ב-C-0572 (QA) וגם ב-C-0571 (DEV, idle). ⛔ **החזרה למחלקת פיצ׳ר היא של QA (`§ 0.23 ז׳`), ⛔ ולא שלי.**
PREV_WORKSTREAM: "msgs"     # 🆕 C-0576 (PM) — המחלקה שממנה נסוג המוקד. בדיקות 13 ו-14 מודדות ממנה, ו⛔ ריק כאן בזמן `general` הוא 🔴 FAIL.
WORKSTREAM_ENDING: general · 0 ⬜ נותרו · 2026-09-14T14:46:30Z · C-0609   # ▶️ **C-0609 (DEV): שתי השורות של C-0608 נבנו ⇒ ⬜=0 שוב — הפעם השישית ב-38 שעות (`F-252`).** ⛔ **ו⛔ אין זו עצירה:** הסט הכשיר תחת `general` (‏`general` ∪ `loop` ∪ `base`) מחזיק עוד **3 ⬜** — `T-327` (‏`base`, התנעה קרה 5.6ש) · `T-340` (‏`loop`) · `T-341` (‏`base`, 54 קבצים). ⇒ DEV עצר על **קופסת הזמן** של `STEP 4.5`, ⛔ ולא על תור ריק. 🔴 **והחזרה למוקד פיצ׳ר היא של QA בלבד** (`§ 0.23 ז׳`).
# (SEALS · BUDGET_NOTE · הערות הכיווץ — הוצאו 08/09 ל-`plan/archive/control-log.md`.
#  ⛔ אפס צרכנים בכל המאגר: ⛔ אף סקריפט, ⛔ אף כלל ו⛔ אף פרומפט ⛔ אינם קוראים אותם. ⛔ אין להחזירם.)
IMPROVE_TARGET: ""              # 🩺 D-146 · **ריק = המצב כבוי.** ▶️ **C-0412: נוסה ו⛔ לא ניתן להדליק — נמדד.** `story` ⇒ בדיקה 14 FAIL (3 ⬜ מראש, תקרה 2) · `nav` ⇒ ⛔ אין לה דבר ב-`61-deferred` · `cards`/`arena` ⛔ אינן חתומות. פירוט ⇒ `D-184`.
MERGE_BLOCKERS: ""                # ⇐ **QA כותב · DEV קורא ראשון.** רק מה שחוסם **מיזוג** ל-`dev` (`§ 0.23 ז׳`). ⛔ לא חסם קידום. ▶️ C-0534 (QA, מלא): `F-219` נסגר — `ops(loop)` איחד את `dev` ל-`work/current` (`65359cb`) לפני הטיק הזה; `rev-list` בשני הכיוונים נמדד **0** על `0851258` לפני הקומיטים של הטיק הזה.
PROMOTION_BLOCKERS: "🔴 C-0607 (PROMOTER) 2026-09-14T13:32Z — בדיקת עשן /api/health קופצנית אחרי הקידום שכבר בוצע (main=42fe1774, Netlify ready על אותו SHA). 6 קריאות רצופות: ok:false·ok:true·ok:false·ok:false·ok:false·ok:true — כולן HTTP תואם (503/200), אף כשל proxy/connect_rejected. גוף הכשל: {\"ok\":false,\"checks\":[{\"name\":\"supabase_url\",\"ok\":true},{\"name\":\"supabase_anon_key\",\"ok\":true},{\"name\":\"placeholder_content_blocked\",\"ok\":true},{\"name\":\"database_schema\",\"ok\":false,\"detail\":\"database unreachable\"}]}. גוף ההצלחה: אותם 3 checks + database_schema ok:true \"word_progress reachable\". ⇒ לא נמדד network policy (F-200) — התגובה חיה ותקינה, רק database_schema קופצני. פריט 123 ב-03-for-roy.md. ⛔ לא נסגר עד שנמדד יציב." # ⇐ PROMOTER בלבד.
DEPLOY_BRANCH: main               # Netlify בונה אך ורק את זה. 🆕 06/09: **רק PROMOTER מקדם לכאן** (`RULES § 0.29`, `5 0 * * *` UTC — ⚠️ הוזז ב-07/09 בבקשה מפורשת של רוי: `0 23` ⇢ `21 23` ⇢ `5 0`, כי `23:21` השאיר 11 דקות בלבד מטיק DEV של 36 דקות). רוי גובר תמיד.
LAST_PROMOTED_AT: "2026-09-14T13:30:01Z"  # ⚡ קידום אוטומטי של הלופ — C-0607 (PROMOTER), כל 5 תנאי השער ירוקים. `4a402514..42fe1774` ff-only, 96 קומיטים. פירוט ⇒ `plan/archive/control-log.md`.
PROMOTIONS_THIS_MONTH: 18         # 18 this month (➕ 14/09 13:30Z, C-0607 PROMOTER — קידום אוטומטי). ⛔ Credit budget is no longer a reason to delay (D-086).
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

| C-0608 | PM | DEV | 2026-09-14T14:01:09Z | 🚦 **מלא.** הליכה ×שתיים · `T-329` נבנתה (STEP 5.5) · `D-246` · `F-186`+`F-253` ⇢ V · `T-348`·`T-349` ⬜. ‏`check:mobile` 1957 ⇐ 1927. | `plan/50-tasks.md` · `plan/40-decisions.md` · `plan/60-findings.md` · `plan/05-departments.md` · `scripts/verify-mobile.mjs` |
| C-0609 | DEV | QA | 2026-09-14T14:46:30Z | 🔨 **בנייה — שתי שורות `general`, כל אחת בקומיט משלה.** `T-348` הגדר הכפולה ⇐ `left=24 · w=327`; `T-349` דרך יציאה אחת ⇐ `top=515.5`. `verify` exit 0, `check:mobile` 1963 ⇐ 1957. `F-253` 🟣. ⛔ עצירה על קופסת הזמן, ⛔ ולא על תור ריק. | `components/ArenaSummary.tsx` · `components/DeckSelector.tsx`(+בדיקה) · `scripts/verify-mobile.mjs` · הרגיסטרים |
