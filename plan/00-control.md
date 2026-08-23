<!--
CYCLE_ID: C-0271                  # Running id. +1 on every PM->Dev->Critic->PM handoff.
NEXT_AGENT: HUMAN                 # ⏸️ **All four schedules are OFF — Roy stopped them deliberately on 23/08 to redesign the loop first.** ✅ **The redesign is done and the four prompts are rewritten (D-098).** ⚠️ **Restarting them is Roy’s call, and he is waiting on a video that will define the visual direction.** ⏳ When it restarts: **T-155** (learner can see all 314 words) is the first slice.
STATE: HUMAN                      # ⏸️ Schedules off by Roy, 23/08. Loop redesigned and ready to restart on his word.
ACTIVE_MILESTONE: M0              # M0..M6
ACTIVE_TASK_ID: ""                # ⏳ Queue order on restart: **T-155** · T-165 · T-152 · T-154 · T-164 · T-166 · T-156 · T-147 · T-157. **20 eligible.**
CRITIC_ROUNDS_ON_TASK: 0          # C-0237 (CRITIC): ✅ **T-085 · T-086 · T-087** (רצף `2026-08-20-flashcard-interaction.md`, קומיט `3f62bf9`). C-0236 (DEV) הוסיף **T-132 🟣** (Task 1 של `2026-08-20-world-featured-and-pin.md`). בתור לסקירה: **T-127 · T-099 · T-100 🟣 (C-0252, מחווה + דעיכה; ⛔ שלושה פגמי תוכנית נסגרו בדרך)** · **T-089 · T-091 🟣 (C-0250)** · **T-134 🟣 (C-0246, ‏T-134ⓐ+ⓑ — מיגרציה 0018 + שער טהור)** · **T-133 🟣 (C-0243, Task 2 של `world-featured-and-pin`)** · **T-139 · T-140 🟣 (C-0242, F-092 סגור בקוד)** · **T-138 (C-0241)** · **T-132 🟣 (C-0236)** · **T-084 · T-102 · T-083 · T-131 (check:mobile 957 ✓ בהרצה CRITIC) 🟣** · **T-109 · T-110 · T-118 🟣 (⚠️ F-092 חלה)** · F-084 🟡 · T-126 · T-130 · T-117 · T-005 · T-006 · T-018 · T-052+F-027 · F-033 · F-008ⓑ · T-073…T-078 · T-095 · F-070+F-071 · F-063/F-064 · T-119…T-121.
CONSECUTIVE_NO_PROGRESS: 0        # תקרה: 2 → מעבר אוטומטי ל-HUMAN. ⚠️ C-0087 לא נספר כ"אין התקדמות" — הוא עצירת בלם מכוונת, לא כישלון להתקדם
LAST_HANDOFF_AT: 2026-08-23T11:03:26Z
HUMAN_DECISION_REQUIRED: false    # ▶️ ⛔ אינו ממתין. **44 · 45 · 46 נסגרו כולם ב-23/08.** נותר **47** — שורה ב-`RULES § 0.1.1 ב׳` שהיא הקובץ של רוי, ו⛔ **אינה חוסמת את הקידום של היום**.
BUDGET_NOTE: "כל מקורות התוכן מורשים לשימוש מסחרי בעלות אפס: NGSL (CC BY-SA 4.0) · CEFR-J (מסחרי בציטוט) · Octanove (CC BY-SA 4.0) · Hebrew Wordnet (רישיון פרמיסיבי של אונ׳ חיפה, ללא share-alike — אומת C-0001, H1g) · Kaikki/ויקימילון (CC BY-SA) · word2word (Apache-2.0). ⛔ PanLex ו-MUSE נפסלו ברישיון NC (1.6.3). שני סיכוני תקציב עתידיים תועדו ב-4.3.2: W3 (עלות יצירת תוכן AI) ו-W4 (שכבה חינמית של Supabase)."
# --- נעילה: מונעת שני סוכנים שכותבים לקובץ בו-זמנית ---
LOCK_HELD_BY: ""                  # C-0271 (PM) released.
LOCK_AT: ""
MILESTONE_TICKS: 101           # C-0271(PM) 100->101. **101/120** — ⚠️ **19 to the brake.** Roy must decide: raise it, or close M0.
PAUSED_BY_HUMAN: true            # ⏸️ Roy stopped the schedules 23/08 to redesign first. ⛔ An agent that starts anyway: exit in one line.
DEPLOYS_THIS_MONTH: 5            # PR #2 built and deployed; smoke test green.
LAST_DEPLOYED_AT: "2026-08-23T11:03:26Z"
LAST_REVIEWED_COMMIT: "fb808a4"  # main after PR #2. ⚠️ **GitHub made a MERGE COMMIT, so the branches diverged** — `main` was 1 ahead of `dev`, which would have rejected the next `dev:main` push as non-fast-forward. **C-0271 merged `main` back into `dev` and verified with a dry-run: `fb808a4..1fa2100 dev -> main`, a clean fast-forward.** ⇒ ⛔ **Every future hand-merge via the GitHub UI needs the same follow-up.**
# --- כלכלת פריסה: קרדיטים, לא דקות. 15 קרדיטים לפריסה. ראה RULES § 0.1.1 ---
WORKING_BRANCH: dev               # כל הסוכנים דוחפים לכאן. Netlify לא בונה ענף זה.
DEPLOY_BRANCH: main               # Netlify בונה אך ורק את זה. רק ה-Critic מקדם לכאן.
LAST_PROMOTED_AT: "2026-08-23T11:03:26Z"  # ⚠️ **Promoted BY ROY, by hand, via GitHub PR #2 — ⛔ not by the Critic.** 143 commits, the first shipment in 3 days. Smoke test **passed**: `/api/health` `ok:true` on all four checks incl. `database_schema: word_progress reachable`. ⛔ The Critic could not push (D-099) — the promotion is real, the loop did not perform it.
PROMOTIONS_THIS_MONTH: 13         # 13 this month. ⛔ Credit budget is no longer a reason to delay (D-086).
```

> 🧑‍⚖️ שתי ביקורות ידניות של רוי — הפירוט ב-`plan/OPERATOR-LOG.md`. **פתוחים:** **F-082 🟡 (ⓐ נסגר C-0214 — `check:mobile` 6→3 · ⓑ = T-131 → DEV · ⛔ לא חוסם)** · **F-081 ⚪ (C-0204 → DEV מצבור · ⛔ לא חוסם)** · F-079 🟠 (C-0201 → PM · נעילה. ✅ **המזהה הכפול אוחד C-0220 (T-128): השני הוא `F-085`**) · **F-080 🟡 (C-0203 → PM)** · F-078 🟡 (C-0201 → PM) · F-073 🟡 (C-0193 → PM) · F-072 🟡 (C-0189 → PM) · F-012 🟠 · F-019 🟠 · F-028 🟠 · F-029 🟡 · F-008 🟡 · R-010. שנסגרו — `plan/archive/control-log.md` (C-0177).
> ✅ **חסימת הקידום שוחררה ב-C-0092** (`main` אוחה ל-`dev`, `db71f27`) — הפירוט ב-`plan/archive/control-log.md` (C-0177). ⛔ **בתוקף: אין לערוך את `main` דרך עורך GitHub** (פריט 17).
> ⚡ סקילים של superpowers פעילים (`RULES.md` § 0.6). החוק הקשה: אין טענת הצלחה בלי ריצה טרייה.
> **תזמון:** Dev כל שעה ב-:30 · PM יומי 08:00 · Critic יומי 20:00. `NEXT_AGENT` הוא איתות
> עדיפות ולא נעילה — סוכן בלי עבודה כשירה מסיים ב"טיק שקט".

### 0.1 יומן העברות מקל — 3 האחרונים בלבד

> 2 שורות לרשומה. ישן יותר → `plan/archive/handoff-log.md`. ההיסטוריה המלאה בגיט.
> ⚠️ **C-0251 העביר את C-0249 ל-`plan/archive/handoff-log.md` ⛔ ולא מחק אותה.** נמדד ⛔ ולא
> שוער: לפני ההעברה 12,007 בתים — כלומר הקובץ כבר **על** התקרה, ושורה רביעית הייתה פורצת
> אותה בוודאות. **התקרה היא המחייבת ומספר המחזורים אמצעי לה** (`RULES § 0.1.2 ב׳`).
> תקדים: C-0254 · C-0253 · C-0250. ⚠️ **C-0255 העביר את C-0254 מאותה סיבה בדיוק ו⛔ לא מחק:**
> נמדד לפני ההעברה **12,232 בתים** — כלומר **56 בתים** מתחת לתקרה, ⛔ ולא מרווח, ושורה
> שלישית הייתה פורצת אותה בוודאות. ⇒ שורה **אחת** ביומן, ⛔ ולא שלוש — **התקרה מחייבת,
> ומספר המחזורים אמצעי לה** (`RULES § 0.1.2 ב׳`). ההיסטוריה המלאה בארכיון ובגיט.
> ⚠️ **C-0256 העביר את C-0255 מאותה סיבה ו⛔ לא מחק:** נמדד **12,153 בתים** — 135 מתחת לתקרה.
> ⚠️ **C-0260 העביר את C-0258 מאותה סיבה בדיוק ו⛔ לא מחק:** נמדד לפני ההעברה **11,456 בתים** —
> כלומר **544** מתחת לתקרה, ⛔ ולא מרווח, ושורה שלישית הייתה פורצת אותה בוודאות.

> ⚠️ **C-0261 העביר את C-0259 מאותה סיבה בדיוק ו⛔ לא מחק:** נמדד לפני ההעברה **11,872 בתים** —
> כלומר **328** מתחת לתקרה, ⛔ ולא מרווח, ושורה שלישית הייתה פורצת אותה בוודאות.

> ⚠️ **ובאותו טיק C-0261 העביר גם את C-0260, ⛔ ולא מחק:** אחרי הוספת השורה נמדד **12,641 בתים** — ⛔ **מעל** התקרה. ⇒ שורה **אחת** ביומן, ⛔ ולא שתיים.
> ⚠️ **C-0265 העביר את C-0264 ו⛔ לא מחק:** נמדד **12,285 בתים** — 3 מתחת לתקרה.

| Cycle | מסוכן | לסוכן | בשעה | סיבת ההעברה (עד 2 שורות) | תוצר |
|---|---|---|---|---|---|
| C-0271 | PM | **HUMAN ⏸️** | 2026-08-23T10:52:04Z | ⚙️ **LOOP REDESIGN — Roy stopped every schedule and asked to plan before restarting.** ‖ **D-098 — the unit of work is a shipped slice, not a completed task.** The measurement that forced it, 7 days: Dev **170** commits · PM 40 · Critic 18 · Content 8 · **0 reached a learner** · **86 tasks ✅** — and a learner still cannot change level or see their 314 words. Roy: *“the PM is not planning tasks that advance the site — we know the DEV does execute.”* ⇒ **The PM must ship a learner-visible slice every tick; the quiet tick is abolished.** ⚠️ This **reverses** the old order “you need not produce value every day” — it optimised for not blocking Dev, and **Dev was never blocked.** | ‖ **The Critic stops being a second CI run** — it re-ran `npm install` + the full suite + `build` on code Dev had already verified, **the largest token cost in the loop, and it never found anything new.** It is now the **ship gate**: promote · smoke-test · sweep (cap 3→8) · findings only for defects that reach the learner. ⛔ Unchanged: the smoke test, `main` exclusivity, 🔴/🟠-defect blocking. ‖ ⚠️ **Tick frequency unchanged — the PM proposed cutting Dev to 4×/day and Roy rejected it:** *“I don’t want to reduce the runs, I want it to simply work and build better.”* The saving comes from removing duplicated work. ‖ 🔴 **D-099 — the root cause of 3 days without shipping:** every Bash call is a **fresh shell** and `export` does not survive it; all four prompts unset the proxy **once**, next to the clone, so every later `git push` hit `access denied by the git proxy`. **Measured: identical command, one second apart, fails without the unset and succeeds with it.** ⇒ all four prompts now carry it on **every** git line. Item 48 (authorized sources) is the deeper fix. ‖ **D-100:** a fixture differing from production in language, script or shape is **a hole, not a test** — the arcade shipped a Hebrew answer among English distractors and **2,403 tests stayed green**. ⇒ every prompt now asks **what the learner must know to answer**. ‖ **All four prompts rewritten in ENGLISH; the product stays Hebrew.** ⛔ The ~7,000 historical Hebrew lines are **not** rewritten — that would burn the tokens this redesign exists to save; **new content is English from here.** **`MILESTONE_TICKS` 100->101/120.** |
---

**החוקים המלאים:** `plan/RULES.md` — פריסה (0.2) · מקביליות (0.3) · סוכני משנה (0.4) · שער טריאז' (0.5)
**מטריצת הקריאה:** `project_plan.md`
