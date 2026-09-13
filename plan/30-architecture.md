<!-- חלק מ-plan/. הבעלות והחוקים מוגדרים ב-plan/00-control.md. אל תערוך קובץ שאינו שלך. -->

## `lib/core/amirnetPractice.ts` — the one place the amirnet practice screens decide anything ⟦C-0529 · T-286⟧

PURE (`scripts/check-core-purity.mjs`). Holds the three question types with their Hebrew and
English names, the four **manually chosen** levels (`41 § 7` — ⛔ there is no adaptivity in
practice), `toTypeCards()`, `weakestType()` and `practiceReady()`.

**Why a module and ⛔ not three components.** The same three facts are needed by the practice
menu (`T-286`), the question header (`T-287`) and the dashboard (`T-291`). Written once, the
three screens can only agree; written in each, they can only drift.

⛔ **And the rule that is easiest to get wrong, so it lives here and ⛔ nowhere else:**
`weakestType()` returns `null` in three separate cases — nothing answered · **some type never
tried** · a tie at the bottom. The middle one is the failure `T-291` writes out: a learner with
three answers seeing `100% · 0% · 0%` and being sent to a type they ⛔ never opened. «Weakest»
is a COMPARISON, and a type with zero answers is ⛔ not a low score — it is an ABSENT one.
⇒ `0%` over zero questions is a **lie**, ⛔ not a datum, and `—` is ⛔ not an answer either:
`successPct` is `null` and `answeredHe` carries a written sentence instead.

`components/AmirnetTabs.tsx` is ⛔ one tabs bar for both the menu and the dashboard (`T-291`ⓐ);
a tab that is not built is present and `aria-disabled` with «טרם», ⛔ never hidden (`D-152` § ב׳).

## `lib/core/amirnetQuestion.ts` — the serving gate and the feedback, ⛔ and ⛔ no clock ⟦C-0531 · T-287⟧

PURE, and **the clock is the point**: `feedbackFor()` takes `elapsedMs` as an argument and the
module reads `Date.now()` ⛔ nowhere. A module that read the clock itself could ⛔ not be tested
for the one thing that matters here — that the number it reports is the learner's own response
time and ⛔ not a deadline.

⛔ **`isServable()` REJECTS; it ⛔ never repairs**, and each of its four refusals is a refusal to
guess: `level` outside 1–4 (the `null` on 1,602 pre-`D-141` rows is a **declared legal state** in
`0021_sense_items_level.sql`, ⛔ not a gap to fill) · ⛔ no Hebrew explanation (`R-010` — and ⛔ not
grounds to write one; a `?? 'אין הסבר'` fallback would BE the invention) · a `correctIndex`
outside the item's own options (a silent fall-back to `0` would mark a learner wrong on a correct
answer) · the wrong number of options.

🔴 **THE CLOCK COUNTS UP, and that is a GATE decision, ⛔ not taste** (`F-223`). The render draws a
**countdown** with a `DANGER` threshold — `render_video_D.py:143-144`, `secs` falling — while
`plan/20-alerts.md` **R-020** forbids time pressure outside the arena and **`D-049`** narrows a
clock to material the learner already knows (Nation 2007: *"If the activity involves unknown
vocabulary, it is not a fluency activity"*). An amirnet practice item is by construction material
the learner is tested on. ⇒ elapsed stopwatch: ⛔ no deadline, ⛔ no danger tint, ⛔ no failure
state. `41 § 7` says «שעון» **and** «זמן התגובה» in one sentence, and an elapsed clock satisfies
both. ⚠️ ⛔ **Says nothing about `T-296`**, where a per-chapter countdown IS the product simulated.

✅ **TD-27 — CLOSED C-0547 (`T-297`).** It read: `app/api/amirnet/practice/route.ts` does ⛔ not
exist and ⛔ cannot yet (`F-222`, measured C-0531) — `public.sense_items` carries **nine** columns
and ⛔ not one of them is the amirnet question type, the four options, `correct_index`, the Hebrew
explanation or the `rc` passage. `D-212` settled it: a **new table**, ⛔ not a tenth extension.


## `public.amirnet_items` + `app/api/amirnet/practice/route.ts` — the bank and its one reader ⟦C-0547 · T-297⟧

**`supabase/migrations/0024_amirnet_items.sql` was APPLIED LIVE** through the Supabase MCP
connector (`apply_migration` ⇒ `success: true`) and verified in the same tick with `list_tables`:
`public.amirnet_items` exists, `rls_enabled: true`, **0 rows**. The `down` path is written into the
file itself (`RULES § 0.22` — `db push` is ⛔ not reversible by a commit).

**Columns are `41 § 6.5` word for word, plus exactly two, and both are declared:**
`passage_en` — the `rc` passage `AmirnetItemRecord.passageEn` already carried, with the § 6.2 word
range; and `explanation_he` — ⛔ without it `T-297`ⓓ is unimplementable, because `41 § 7` requires
«משוב מיידי עם הסבר בעברית» with ⛔ no condition and the serving gate refuses an item that lacks one.
⇒ the column is the thing the gate refuses ON; a schema without it would have forced the fallback
(`?? 'אין הסבר'`) that `T-287` already banned.

**Nine named constraints, each added separately inside `do $$`** (the C-0032 reasoning: `create
table … check` is skipped wholesale when the table exists) — closed `type` set, `level` 1-4
`not null` (⛔ unlike `sense_items.level`, which is nullable only because 1,602 rows predate
`D-141`; this table has ⛔ no such history), four options, four reasons, `correct_index` 0-3,
`vocab_band` ∈ {1000,2000,3000}, `source = 'original'`, the `rc`⇔passage pairing, and a
non-blank Hebrew explanation. RLS: `select` to `authenticated` and ⛔ nothing else — the bank is
written by the content commission `K-006`, ⛔ never by a client.

**`toServedItems()` lives in `lib/core/amirnetItemGate.ts` and it MAPS; it ⛔ never repairs.** Every
column is `not null`, so in a healthy bank no null can arrive — but PostgREST returns what the table
holds, and the honest answer to a missing field is an EMPTY one that `isServable()`
(`amirnetQuestion.ts`) then refuses. ⇒ a null explanation becomes `''` and the item is **dropped**;
a null `correct_index` becomes **`-1`** and ⛔ not `0`, because a fall-back to 0 marks a learner
wrong on a correct answer.

**The route is the slice's one impure edge.** `?type=&level=`, ⛔ **no default on either half** —
`41 § 7` says «הרמה נבחרת ידנית», and a route that filled in the missing half would be adaptivity
wearing a default's clothes. Guard order C-0032 (env → session → query), `.limit(40)`, and a
**soft** read in the `T-190`ⓓ pattern: ⛔ never 503, because אמירנט is one node of nine on the ring.
`no_items` is a declared legal state («אין עוד פריטים ברמה הזאת»), ⛔ not a fault — the bank is
empty until `K-006` delivers. ⛔ Zero reference to the learner's progress table or the arena
(`R-020` · `37 § 13.1`), measured by name in `route.test.ts`.

⇒ `AmirnetQuestion` still takes its queue as a **prop** and validates nothing — what changed is that
the queue can now come from a real bank instead of a fixture.


## 3. עמידה בארכיטקטורת App-Ready · PWA · Mobile-First  ⟦OWNER: Dev מעדכן · Critic מאמת⟧

> Critic מריץ את הרשימה הזו **בכל טיק**. סטייה = ממצא בחומרה `HIGH` לכל הפחות.

### 3.1 הפרדת כוחות (API-First)

| # | הכלל | סטטוס | אימות אחרון |
|---|---|---|---|
| AR-1 | אפס גישה ישירה לדאטהבייס מרכיבי ממשק. הכל דרך `/api/*` או שכבת שירות מוגדרת | ✅ | C-0005 · `AuthForm` מדבר רק דרך `apiPost` → `/api/auth/*`. `@supabase/*` מיובא אך ורק ב-`lib/supabase/auth.ts`, ב-route handlers וב-`proxy.ts`. **`lib/supabase/server.ts` נמחק (T-024/F-010)** — לא נותר בעץ אף לקוח שעוקף RLS, ו-`lib/supabase/serviceRole.test.ts` נכשל אם `SUPABASE_SERVICE_ROLE_KEY` נקרא מ-`app/`, `components/`, `lib/` או `proxy.ts` |
| AR-2 | כל לוגיקה עסקית (ריווח חזרות, ניקוד, בחירת מסיחים) חיה ב-`/lib/core/` — **טהורה, ללא React, ללא DOM** | ✅ | C-0005 · כללי האימות ומיפוי השגיאות ב-`lib/core/auth.ts`; **קופי מסך הפתיחה וחוזה כרטיסיית הטעימה ב-`lib/core/landing.ts`** — כתוב שם ולא inline ב-`app/page.tsx` כדי שאיסור ה-"AI/אדפטיבי" (R-011) ומחסום התוכן המומצא (R-010) ייאכפו בבדיקה ולא בזיכרון של סוכן. 62 בדיקות עוברות בלי דפדפן. **C-0005 · `lib/core/queue.ts` — `planDailyQueue` מחליטה כמה חזרות וכמה כרטיסיות חדשות להציג היום (T-031). מקבלת מונים ויעד יומי כארגומנטים, לא קוראת שעון/DB/סביבה — `lib/core/scheduler.ts` (7.1) יקרא לה במקום לשכפל את הלוגיקה** · **C-0021 · `lib/core/lexicon.ts` (T-017) — נרמול אנגלית/עברית ומסנן הרשומות הפגומות של R-007. טהור לחלוטין: אפס I/O ואפס `process.env`; קריאת קבצים תחיה ב-`scripts/` בלבד. `RawGloss` הוא טיפוס ממותג, ולכן רכיב ממשק שיקבל גלוסה גולמית אינו מתקמפל — המסלול היחיד למחרוזת הוא `displayableGloss()`, שמחזיר `null` ל-`GAP` ולרשומת `!`. זה מחליף את "בדיקת יחידה שנכשלת אם רשומה פגומה הגיעה לתצוגה" בכשל קומפילציה, באותה צורת מחסום כמו `enterKeyHint` החובה מ-C-0019** · **C-0022 · `lib/core/coverage.ts` (T-013+T-016) — `measureCoverage()` היא פונקציה אחת שמשרתת את שתי המשימות: הן דורשות פלט זהה ונבדלות רק במערך `LexicalSource[]` שמועבר לה, ולכן שתי פונקציות היו שני עותקים של אותו חשבון. **מדיניות הרשומה הפגומה (F-021) היא ארגומנט ולא ענף בקוד:** `CoveragePolicy` נכנס מבחוץ, `STRICT_POLICY` ו-`LENIENT_POLICY` מיוצאים כקבועים, והרץ ידפיס את שתי הקריאות — כלומר הכרעת ה-PM ב-F-021 לא תדרוש שינוי קוד ולא מדידה חוזרת. טהור: קלט הוא מערכים בזיכרון, כל קריאת הקבצים תחיה ב-`scripts/measure-coverage.mjs` (משימה 3 בתוכנית)** |
| AR-3 | חוזה ה-API מתועד ב-`/docs/api-contract.md` ומעודכן בכל שינוי | ✅ | C-0004 · תגובת 400 לגוף שאינו אובייקט (F-004) והבהרת `httpOnly`/fail-closed (F-002/F-003) נכתבו באותו קומיט |
| AR-4 | אין `window`/`document`/`localStorage` בתוך `/lib/core/` — קוד זה חייב לרוץ כמות שהוא ב-React Native | ✅ | C-0004 · נאכף אוטומטית; ה-session חי ב-cookies שהם httpOnly **בפועל** מ-C-0004 (`SESSION_COOKIE_OPTIONS`, F-002) ולא ב-`localStorage` | **C-0017 · `passwordByteLength` משתמש ב-`TextEncoder`** — גלובל של WHATWG שקיים גם ב-Node וגם בכל דפדפן, ואינו ברשימת `FORBIDDEN` של `scripts/check-core-purity.mjs`. כלל האורך של bcrypt (72 **בתים**, לא תווים) חי ב-`lib/core/auth.ts` ולכן ירוץ כמות שהוא ב-React Native

### 3.1.1 שכבת המדידה (T-013 · T-016 · R-005) — C-0024

⟨מואַרך⟩ שלוש שכבות, כולן טהור, ועליהן הרץ היחיד שנוגע בדיסק: קובץ אחריות טהור?… · ציטוטים: `lib/core/lexicon.ts` · `lib/core/coverage.ts` · `lib/core/sources.ts` · `scripts/measure-coverage.mjs` · `docs/coverage-report.md` · `lib/core/senseInventory.ts` · `lib/core/cefrLevels.ts` · `lib/core/senseGold.ts` · `lib/core/senseSelection.ts` · `lib/core/senseAccuracy.ts` · `scripts/measure-sense-accuracy.mjs` · `docs/sense-accuracy-report.md` · `supabase/migrations/0002_content_bank.sql` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.2 רישום מקורות הנתונים (T-011) — C-0027

⟨מואַרך⟩ עובדה אחת על מקור חיצוני — שמו, רישיונו, וההוסט היחיד שמותר למשוך ממנו — נכתבת… · ציטוטים: `lib/core/dataSources.ts` · `scripts/write-data-licenses.mjs` · `docs/data-licenses.md` · `app/sources/page.tsx` · `components/EnWord.test.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.3 שומר הייחוס — גרסה והוסט (T-012) — C-0028

⟨מואַרך⟩ הצרכן הרביעי של הרישום הוא (טהור). שני דברים בלתי-תלויים יכולים להיות שגויים… · ציטוטים: `lib/core/provenance.ts` · `scripts/measure-coverage.mjs` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.4 עמודות ייחוס וטבלת הטלמטריה (T-015) — C-0029

⟨מואַרך⟩ . שני דברים זולים היום ובלתי אפשריים רטרואקטיבית: מאיפה הגיעה שורת תוכן, וכמה… · ציטוטים: `supabase/migrations/0003_provenance_telemetry.sql` · `lib/core/dataSources.ts` · `docs/SETUP.md` · `lib/supabase/telemetry.test.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.5 מודל תשובות ה-Onboarding (T-029) — C-0031

⟨מואַרך⟩ (טהור). כל מה שהמסך, ה-API והמיגרציה יצטרכו לדעת על התשובות יושב בקובץ אחד:… · ציטוטים: `lib/core/onboarding.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.6 מנוע התזמון — SM-2 דחוס-מבחן (T-005, מנוע 7.1) — C-0036

⟨מואַרך⟩ (טהור). מחזיר ואינו מכיר שעון, DB או — ו- נכנסים כמחרוזות ISO ונבדקים ב- הקיים,… · ציטוטים: `lib/core/scheduler.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.7 צבירת ההתקדמות וטלמטריית D-010 (T-005, משימה 2) — C-0037

⟨מואַרך⟩ (טהור). הוא שורה אחת לכל (משתמש, מילה) ולא שורה לכל אירוע חזרה — ‏ מתעד את W4… · ציטוטים: `lib/core/progress.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.8 סגירת חוזה TS↔SQL של ההתמדה (F-022 · F-023 · F-024) — C-0039

⟨מואַרך⟩ שלושת הפערים הרדומים ש-C-0038 פתח נסגרו לפני משימה 4 של T-005, כפי שהיא דרשה.… · ציטוטים: `scripts/plan-hygiene.test.ts` · `docs/api-contract.md` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.9 שער עליית הרמה מבוסס-מנות (T-006 · מנוע 7.7, משימה 3) — C-0040

⟨מואַרך⟩ (טהור). אינו מייבא את — הוא מקבל את כנתון בוליאני לכל מילה, כדי שקורא יוכל לחשב… · ציטוטים: `lib/core/levelGate.ts` · `docs/api-contract.md` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.10 חיווט ההתמדה — `POST /api/review` (T-005 · T-006, משימה 4) — C-0041

⟨מואַרך⟩ התיאור המלא של הנתיב הוא ; כאן רק ההחלטות המבניות. המצב של המתזמן יושב על… · ציטוטים: `docs/api-contract.md` · `lib/core/flashcard.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.11 מלאי המשמעויות ומפתח (lemma, POS) — § 1.7.1 כלל 1 (T-018, משימה 1) — C-0050

⟨מואַרך⟩ המפתח הוא , ולא כותרת NGSL לבדה. ‏ הוא — אותה נרמול בדיוק שמשמש את , כדי ש- ו-… · ציטוטים: `docs/superpowers/plans/2026-08-12-sense-accuracy.md` · `docs/api-contract.md` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.12 מפת רמות CEFR — החצי הטהור של T-010 (T-018, משימה 2) — C-0051

⟨מואַרך⟩ שתי מפות ולא אחת, כי הן עונות על שתי שאלות שונות. ‏ (‏) הוא התשובה המדויקת; הוא… · ציטוטים: `scripts/measure-coverage.mjs` · `docs/api-contract.md` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.13 ה-gold set מ-Hebrew Wordnet — § 1.7.1 (T-018, משימה 3) — C-0052

⟨מואַרך⟩ ‏ הופך את לתשובה הידועה של R-006. הצד העברי עובר דרך ודרכו בלבד — D-025 חי… · ציטוטים: `lib/core/senseGold.ts` · `data/h1-hebrew-wordnet.tsv` · `docs/api-contract.md` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.14 כלל בחירת המשמעות — § 1.7.1 כללים 2/3/4/7 (T-018, משימה 4) — C-0054

⟨מואַרך⟩ ‏ הוא המימוש היחיד של כלל הקליטה. כל ענף בו מצטט את מספר הכלל שהוא מממש, והכול… · ציטוטים: `lib/core/senseSelection.ts` · `docs/api-contract.md` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.15 דוח הדיוק וההרץ — R-006 (T-018, משימה 5, האחרונה) — C-0055

⟨מואַרך⟩ ‏ הוא החשבון בלבד, טהור: מקבל פריטים + שלושת המבנים של משימות 1–3 ומחזיר , ו-… · ציטוטים: `lib/core/senseAccuracy.ts` · `scripts/measure-sense-accuracy.mjs` · `docs/sense-accuracy-report.md` · `docs/api-contract.md` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.16 שכבה 2 — עמודות המסלול ובנק ההרכבה (T-047 · T-048) — C-0057

⟨מואַרך⟩ ‏ הוא סכמה בלבד, ואין בו ולו אחד. שש עמודות ( · על · · ), הדגל השבועי על השורה… · ציטוטים: `supabase/migrations/0006_layer2_track_and_bank.sql` · `plan/03-for-roy.md` · `lib/supabase/layer2.test.ts` · `docs/api-contract.md` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.17 שכבה 2 ג׳ — סכמת העולם, וההיגיינה של ספריית המיגרציות (T-049 + שומר) — C-0058

⟨מואַרך⟩ ‏ יוצר ארבע טבלאות ריקות ו⛔אינו טוען ולו שורה אחת. · · · . כל אחת מהארבע נושאת… · ציטוטים: `supabase/migrations/0007_world_schema.sql` · `scripts/migration-hygiene.test.ts` · `docs/api-contract.md` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.18 קליטת האצוות — 343 משמעויות עוברות את השער פעם שנייה ויוצאות כ-SQL (T-042) — C-0060

⟨מואַרך⟩ ‏343 שורות תוכן ישבו בשישה קובצי ובדאטהבייס היו 0. הטיק הזה בונה את המסלול,… · ציטוטים: `lib/core/batchRecord.ts` · `lib/core/spotCheck.ts` · `scripts/build-ingest-sql.mjs` · `supabase/seed/0001_content_batches.sql` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.19 הסימן "טרם אומת" — דגל על הפָּנים ולא בקומפוננטה (T-045) — C-0061

⟨מואַרך⟩ מחצית המשימה כבר הייתה בסכמה מאז (העמודה, המילוי, ה-RLS שפותח ללומד, והחסימה של… · ציטוטים: `app/dev/card/typed/page.tsx` · `lib/core/palette.ts` · `plan/35-design-constitution.md` · `lib/core/flashcard.test.ts` · `components/Flashcard.test.ts` · `scripts/verify-mobile.mjs` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.20 שער הכניסה שנראה סגור — קישוריות נמדדת, ולא מוצהרת (T-050 · F-027) — C-0064

⟨מואַרך⟩ רוי נרשם באתר החי, נחת ב-onboarding, ולא ראה לא כפתור המשך ולא דרך לצאת. המסך… · ציטוטים: `app/onboarding/page.tsx` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.21 חפיסה זרה — התפקיד נקבע מכתב ומשם, והסירוב יושב בקוד (T-044 · F-019) — C-0065

⟨מואַרך⟩ ‏ הוא קורא פורמט, ולכן הוא לא מייבא כלום. לא , לא , לא zip, לא sqlite. הקישור… · ציטוטים: `lib/core/apkg.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.22 רמת מילה מול רמת משמעות — שתי טענות, שתי עמודות (T-010 · C-0066)

⟨מואַרך⟩ ‏ + (מיגרציה ) — לצד , לעולם לא מעליה. שני המספרים נכונים בו-זמנית: היא טענה על… · ציטוטים: `scripts/build-word-levels-sql.mjs` · `supabase/seed/0002_word_cefr_levels.sql` · `lib/core/wordLevel.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.23 סגירת F-028 — סינון התעתיק חל תמיד, בשני הכתבים (C-0069)

⟨מואַרך⟩ שורש הפגם היה קיצור ולא כלל. דילג על הסינון בדיוק במקרה שבו הוא הכרחי: חפיסה… · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.24 סרגל הפעולה הדביק — F-027 נסגר בצד ה-Dev, ועל מכולת הגלילה ולא על `<main>` (T-052) — C-0071

⟨מואַרך⟩ הבדיקה נכתבה ראשונה ונפלה על המספר של רוי. לפני שנכתבה שורת קוד אחת של הרכיב,… · ציטוטים: `scripts/verify-mobile.mjs` · `app/layout.tsx` · `docs/api-contract.md` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.25 מעטפת ארבע הלשוניות — קבוצת מסלולים ולא תנאי, וסורק שהוכח מול מוטציה (T-051, משימה 2) — C-0072

⟨מואַרך⟩ קבוצת המסלולים היא ההכרעה, והיא מבנית ולא התנהגותית. ‏ מרנדר ואז , ולכן "הסרגל… · ציטוטים: `docs/api-contract.md` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.26 הלשונית `אני`, שער הסשן על שלושת המסלולים, והמחרוזת היחידה שמחליטה לאן נוחתים (T-051, משימה 3) — C-0073

⟨מואַרך⟩ ‏ הוא ההחלטה כולה, ולכן הוא ננעל בשני קבצים בו-זמנית. ‏ מנווט למה שמגיע מ-… · ציטוטים: `components/OnboardingForm.tsx` · `app/api/profile/route.test.ts` · `docs/api-contract.md` · `app/onboarding/page.tsx` · `lib/core/progress.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.27 ההארנס רואה את מעטפת הלשוניות — שלוש פיקסטורות ולא שני מסלולים, ושרת רפאים שכמעט שיקר (T-051, משימה 4) — C-0075

⟨מואַרך⟩ ‏D-028 נטען עכשיו משני הכיוונים, כי שתי תכונות נפרדות יכולות לשבור אותו. מסך… · ציטוטים: `app/layout.tsx` · `components/StudiesScreen.tsx` · `components/CardsScreen.tsx` · `components/MeScreen.tsx` · `components/MeScreen.test.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.28 עיגון עליון — והשומר ששפט קובץ על הערה ולא על מה שהוא מרנדר (T-058) — C-0076

⟨מואַרך⟩ התיקון עצמו קטן ומדיד: הוסר משתי מכולות העמוד האחרונות — ו-, שתיהן → . זה… · ציטוטים: `app/loading.tsx` · `app/error.tsx` · `app/page.tsx` · `app/sources/page.tsx` · `docs/superpowers/plans/2026-08-12-navigation-shell.md` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.29 עמודת המוסד והכלל הטהור — ומדוע שדה `unknown` נכתב אופציונלי (T-003, משימה 1) — C-0079

⟨מואַרך⟩ הפיסה עצמה: — עמודת nullable על + מגבלת בשם (≤120). ⛔ לא enum, ⛔ לא מפתח זר… · ציטוטים: `supabase/migrations/0009_onboarding_institution.sql` · `lib/core/onboarding.ts` · `app/api/profile/route.ts` · `docs/api-contract.md` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.30 שומר הקליטה שנשבר מאצוות תוכן — ומדוע כותרת בשם `low` הרשיעה שורה תקינה (F-030) — C-0079

⟨מואַרך⟩ הרקע: היה אדום על לפני השינוי של הטיק הזה — נמדד בהרצה על עץ נקי (stash): ב-.… · ציטוטים: `scripts/build-ingest-sql.test.ts` · `data/generated/batch-2026-08-13.jsonl` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.31 המוסד עובר את הגבול — ומדוע בדיקת מקור שרצה על טקסט גולמי אינה בדיקה (T-003, משימה 2) — C-0080

⟨מואַרך⟩ הפיסה עצמה: שתי שורות ב- — פנימה ל-, ו- החוצה אל ה-. אף מפתח אינו נקרא פעמיים… · ציטוטים: `app/api/profile/route.ts` · `docs/api-contract.md` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.32 השדה על המסך — ושני שומרים שהתוכנית עצמה כתבה חלולים (T-003, משימה 3) — C-0081

⟨מואַרך⟩ הפיסה עצמה: שדה טקסט עברי אחד ב-, מעל של ציון היעד ובאותה קבוצה איתו, עם · · ·… · ציטוטים: `components/OnboardingForm.tsx` · `lib/core/onboarding.test.ts` · `scripts/verify-mobile.test.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.2 PWA

| # | הכלל | סטטוס |
|---|---|---|
| PW-1 | `manifest.json` תקין: icons 192/512, `display: standalone`, `theme_color` | ✅ C-0002 |
| PW-2 | Service Worker פעיל, האתר נטען גם ללא רשת (מסך offline לכל הפחות) | ✅ C-0003 · `english-web-v3`: `/signup`, `/login`, `/logout`, `/onboarding` **אינם ממוטמנים כלל** (תוכנית UX של T-002) |
| PW-3 | ניתן להתקנה בפועל — נבדק ב-iOS Safari ("הוסף למסך הבית") וב-Android Chrome | 🟡 חלקי · כל תנאי ההתקנה אומתו ב-Chromium אוטומטי; **בדיקה במכשיר אמיתי טרם בוצעה** → TD-1 |
| PW-4 | ציון Lighthouse PWA ≥ 90 | ⛔ בלתי מדיד · Lighthouse 13 הסיר את קטגוריית PWA ואת audit ה-tap-targets. הוחלף ב-`npm run check:mobile` (144 בדיקות, רץ בתוך `verify` מ-C-0005) שמודד ישירות את PW-1..PW-3 ו-MF-1..MF-5 → TD-2 |

### 3.3 Mobile-First

| # | הכלל | סטטוס |
|---|---|---|
| MF-1 | כל מסך נבנה ונבדק תחילה ברוחב 375px | ✅ C-0003 · `/signup` ו-`/login` נוספו למסלולי `check:mobile` |
| MF-2 | כל אזור לחיץ ≥ 44×44px | ✅ C-0005 · נמדד ב-6 מסלולים × 3 רוחבים (144 בדיקות) · כפתור הצגת הסיסמה נכנס לאותה מדידה |
| MF-3 | תמיכת RTL מלאה לעברית + טיפול נכון בטקסט אנגלי משובץ (bidi) | 🟡 חלקי · **C-0014 (T-009): `<EnWord>` קיים ו-TD-5 נסגר חלקית.** שלושת המאפיינים (`lang`/`dir`/`unicode-bidi: isolate`) נוסעים יחד בקובץ אחד, ומחסום סורק־מקור נכשל אם מישהו כותב אותם ביד. `.ltr-inline` עבר מ-`display: inline-block` ל-`inline` — **נמדד ב-Chromium**: פסקה שבה עברית חולקת שורה עם משפט אנגלי נכרך היא 104px כ-inline-block מול 52px כ-inline, שתי שורות מבוזבזות. מילה בודדת נראית זהה, ולכן הפגם היה בלתי נראה עד ש-`EnText` התחיל לשאת משפטים שלמים. **הושלם C-0019 (TD-5):** שדות האימייל/הסיסמה עוברים דרך `<LatinField>` — `<input>` אינו טקסט משובץ ולכן אינו עובר דרך `<EnWord>`, ו-`dir="ltr"` נכתב עכשיו במקום אחד שסורק־מקור מצמיד אליו · C-0003 · שדות האימייל והסיסמה קיבלו `dir="ltr"` נקודתית בתוך פריסת RTL (הוראת תוכנית UX של T-002). זהו החוב ש-T-009 (`<EnWord>`) מחליף — ראה TD-5. **C-0005:** כפתור הצגת הסיסמה ממוקם ב-`right-0` **פיזי** ולא ב-`end-0` לוגי — השדה הוא `dir="ltr"` בתוך עמוד RTL, ולכן הטקסט המוקלד רץ ימינה והכפתור חייב להיות בצד הפיזי שאליו הוא רץ |
| MF-4 | אפס גלילה אופקית בכל רוחב מסך | ✅ C-0003 · 320/375/414px, כולל מסכי האימות |
| MF-5 | פעולות ליבה בהישג אגודל (חצי מסך תחתון) | ✅ C-0005 · ההארנס מאתר את הפעולה הראשית לפי `data-primary-action` ולא לפי הקישור הראשון ב-`main`, כדי שתוכן לחיץ מעל הכפתור (כרטיסיית הטעימה) לא ירוקן את הבדיקה |


### 3.4 חוב טכני ידוע
| # | מה | למה נדחה | דד-ליין |
|---|---|---|---|
| TD-1 | התקנת PWA לא נבדקה במכשיר פיזי (iOS Safari / Android Chrome) | אין מכשיר אמיתי בסביבת הלופ; הבדיקה האוטומטית מכסה את כל התנאים הטכניים אך לא את חוויית ההתקנה בפועל | לפני קידום ראשון ל-main עם משתמשים אמיתיים |
| TD-2 | מדד ההצלחה של T-001 דורש "Lighthouse PWA installable + Performance ≥ 90", אך קטגוריית ה-PWA הוסרה מ-Lighthouse 13 | המדד נכתב מול גרסה ישנה של הכלי. הוחלף בהארנס ישיר (`check:mobile`). **דרושה הכרעת PM: לעדכן את נוסח מדד ההצלחה ב-4.2** | PM הבא |
| TD-3 | ~~`check:mobile` דורש שרת ו-`CHROME_PATH`, ולכן אינו חלק מ-`verify`~~ | ✅ **נסגר C-0005 (T-021, F-007).** ההארנס מאתר בעצמו את ה-Chromium שקיים בדיסק (`resolveChromiumPath` — ה-pin של playwright ל-build 1234 לא תואם ל-1194 שבסביבה) ומרים בעצמו `next start` כשלא הועבר לו baseUrl. `check:mobile` הוא כעת השלב האחרון של `verify` | — |
| TD-4 | **RLS נבדק סטטית בלבד.** `lib/supabase/rls.test.ts` מוודא שהמיגרציה מפעילה RLS ושכל מדיניות מוגבלת ל-`auth.uid() = id` — אך אינו יכול לדעת אם המיגרציה הורצה בפרויקט Supabase בפועל | אין credentials של פרויקט חי בסביבת הלופ, ואסור שיהיו | ידנית לפני הקידום הראשון ל-main עם משתמשים אמיתיים — `docs/SETUP.md` נספח ב-1 |
| TD-5 | שדות האימייל והסיסמה נושאים `dir="ltr"` נקודתי במקום לעבור דרך `<EnWord>` | ✅ **נסגר C-0019 (F-015 + TD-5).** `components/LatinField.tsx` הוא רכיב השדה המשותף שהשורה הזו חיכתה לו מאז C-0003, ושני שדות ההרשמה עוברים דרכו. הסגירה אינה העברת קוד: `enterKeyHint` הוא prop **חובה**, ולכן שדה לטיני עתידי שישכח מקש פעולה נופל בקומפילציה ולא בביקורת; וסורק־מקור (`LatinField.test.ts`) נכשל אם `dir="ltr"` יופיע על `<input>` בקובץ אחר. חוק שנאכף באתר הקריאה הוא חוק שאתר הקריאה הבא שוכח — זו בדיוק הסיבה שהחוב נשאר פתוח 16 מחזורים. `Flashcard.tsx` מוחרג במפורש: תיבת ההקלדה של הכרטיס היא פקד לימודי ולא שדה הזדהות, ו-`EnWord.test.ts` כבר מחזיק אותה בכללים שלה. **C-0033 הרחיב את `LatinFieldProps` בשני איברי union** (`name: 'target_score'` · `inputMode: 'numeric'`) כדי ששדה ציון היעד יעבור דרך אותו רכיב במקום סביבו — הרחבת טיפוס ולא שדה שני; ו-`EnWord.test.ts` קיבל טענה **חיובית** על `OnboardingForm.tsx` (TD-14: סריקה שלילית אינה רואה תגית שאינה שם). מוטציה שהחליפה את `<LatinField>` ב-`<input dir="ltr">` הפילה בדיוק אותה | ✅ סגור — `components/LatinField.tsx` · `components/LatinField.test.ts` |
| TD-7 | `maxAge` של עוגיית ה-session נשאר ברירת המחדל של `@supabase/ssr` — **400 יום**. F-002 סגר את הקריאה מ-JavaScript, לא את אורך החיים | קיצור חלון הרפרש משנה את התנהגות ההתחברות ללומדים ואינו חלק מהממצא; דורש הכרעת UX ("כמה זמן נשארים מחוברים") | לפני הקידום הראשון ל-main עם משתמשים אמיתיים |
| TD-6 | מחזור מלא בטלפון (הרשמה → יציאה → התחברות → רענון) לא נבדק מקצה לקצה מול Supabase חי | אותה סיבה כמו TD-4 — אין פרויקט חי בסביבת הלופ. הפייפליין נבדק עד גבול הרשת: ולידציה, מיפוי שגיאות, ניתוב, מיטמון ו-RLS | הקידום הראשון ל-main |
| TD-9 | **התאמת השער למיגרציה חלקית.** `gateSense` מכסה `pos` ו-`relation_type` (בפרט מול קובץ ה-SQL עצמו), אך `senses.cefr_level`, `senses.translation_confidence` ו-`words.origin` אינם שדות של `GeneratedSense` — שלוש מגבלות CHECK שעדיין נאכפות רק ב-Postgres ועלולות להפיל אצווה באמצע ההכנסה | הן מתארות את **הריצה והמקור**, לא את פריט התוכן היחיד שהשער בודק. הוספתן עכשיו הייתה מקבעת מבנה לפני שקיים טוען אצווה | T-042 |
| TD-10 | **צורות פועל חריגות נדחות.** `inflections()` מייצר נטיות רגילות בלבד, ולכן `gave up` או `went` יידחו כ-`headword missing` למרות שהם תקינים | דחיית שווא עולה מחזור ייצור אחד; קבלת שווא עולה תוכן שגוי אצל הלומד. לקסיקון צורות חריגות הוא משימה בפני עצמה | כשתימדד תדירות הדחיות באצווה הראשונה |
| TD-11 | ~~הכרטיסייה אינה מסמנת את מילת המטרה בתוך משפט הדוגמה~~ | ✅ **נסגר C-0015 (T-041, צעד 3a).** `locateTarget` ב-`lib/core/contentSchema.ts` מחזיר את טווח התווים של מילת המטרה, ו-`CardFace.exampleSegments` מגיע מוכן מ-`buildCard` — שכבת React אינה נוגעת בשאלה איזו מילה היא המטרה. חוזה השרשור נאכף בבדיקה: `segments.map(s=>s.text).join('') === example`, ומוטציה שעושה `trim` מפילה שתי בדיקות. | — |
| TD-12 | **גזע בן פחות מ-3 אותיות מאבד את נטיותיו.** אחרי תיקון F-020, ענף השמטת ה-`e` ב-`inflections()` מותנה ב-`MIN_INFLECTION_STEM = 3`, ולכן כותרת קצרה שמסתיימת ב-`e` (`use`, `age`) מאבדת את `used`/`using`/`user` ותידחה כ-`headword missing` | בלי הסף, `be` → `b`+`est` = **best** ו-`see` → `se`+`ed` = **seed** — בדיוק קבלת השווא של F-020, שמעבירה מילה מחוץ-לרמה ללומד. דחיית שווא עולה מחזור ייצור אחד. הפתרון האמיתי הוא אימות כל צורה מיוצרת מול רשימת NGSL, שאינה זמינה ב-`/lib/core` הטהור היום | T-042 — יחד עם טוען האצווה, שכן קורא את NGSL |
| TD-8 | **`0002_content_bank.sql` טרם הורץ בפרויקט Supabase כלשהו.** הוא אומת מול Postgres 16 חי בסביבת הלופ, כולל הדמיית `default privileges` של Supabase ותפקידי `anon`/`authenticated` — אך `auth.uid()` וההגדרות האמיתיות של הפרויקט לא נבדקו | אותה סיבה כמו TD-4. **הבדל מ-TD-4 לטובה:** כאן ההתנהגות (RLS, CHECK, CASCADE, TRUNCATE) נמדדה בפועל על מנוע אמיתי ולא רק נקראה מהקובץ | לפני הריצה הראשונה של סוכן התוכן |
| TD-14 | ~~המחסום של T-009 מוכיח היעדר סימנים, לא נוכחות עטיפה~~ | ✅ **נסגר C-0015 עבור מסך הכרטיסייה.** שלושת השדות האנגליים החדשים (`primary` של כל פנים · `exampleSegments` · התשובה שהלומד הקליד) נאכפים חיובית ב-`EnWord.test.ts`. סקירת סוכן משנה **הוכיחה את המחיר**: החלפת העטיפה ב-`<span>` עירום השאירה 222 בדיקות, את הבנייה ו-219 בדיקות מובייל ירוקות עם הכותרת מרונדרת בלי `lang`/`dir`/`bidi`. ⚠️ הכלל עצמו נשאר בתוקף — כל שדה אנגלי חדש חייב שורה משלו. | — |
| TD-13 | ~~`/onboarding` אינו נמדד ב-`check:mobile`~~ | ✅ **נסגר C-0034 (T-029, משימה 4).** `/dev/onboarding` נוסף ל-`ROUTES` ומודד את טופס T-029 בשלושה רוחבים ובשני מצבי צבע: קיום קבוצת הרדיו · **ברירת המחדל 5 נמדדת בפיקסלים** · שלוש שורות ≥44px · שדה הציון כקלט לטיני מספרי. מוטציה של ברירת המחדל ל-20 הפילה **גם** את בדיקת היחידה (`expected 20 to be 5`) **וגם** את `check:mobile` (`preselected value was "20"` ×3) — שני מחסומים עצמאיים על אותה החלטת מוצר. **351 → 390 בדיקות.** ⚠️ **מה שעדיין אינו נמדד:** המעטפת מוגנת-הסשן של `/onboarding` עצמו — ההארנס עדיין רץ בלי משתני סביבה של Supabase, ו-`GET /onboarding` מחזיר `307 → /login?expired=1` (אומת חי C-0013), כלומר כל שורה שמדווחת `ok /onboarding …` מודדת את מסך ההתחברות. רצועת הכתובת מכוסה ב-`/dev/identity`. **הפיקסטורה מודדת את הטופס, לא את השומר** — זהו השארית המפורשת של השורה הזו, ולכן היא נסגרת עם שארית ולא נמחקת | הפער שנותר הוא בשומר הסשן ולא בתוכן המסך: הפניה שגויה (או היעדר הפניה) עדיין תעבור את ההארנס | T-003 — יחד עם המסך המלא, במשתני סביבה של פרויקט בדיקה |
| TD-15 | **`locateTarget` ו-`containsHeadword` מתפצלים על שתי נקודות קוד.** `tokens()` מקטלג את U+0130 (`İ`) ו-U+212A (`K`) כי הוא מוריד לאותיות קטנות תחילה; `tokensWithSpans` אינו, כי `'İ'.toLowerCase()` הוא **שתי** נקודות קוד וכל היסט אחריו היה זז — הטווח היה מצביע על תווים אחרים. השער מקבל, הכרטיסייה לא מסמנת | סריקת BMP מלאה מצאה בדיוק שתי חריגות; פאזינג של 20,000 מקרים מול `gateSense` מצא 12 אי-התאמות, **כולן** מכילות `İ`. אף אחת מהן אינה שורדת את בדיקת סחיפת הרמה מול רשימת NGSL, ולכן אינה מגיעה ללומד | תועד ב-docblock של `tokensWithSpans` במקום לתקן. אם אי פעם ייקלט מקור שאינו NGSL — למדוד מחדש |
| TD-16 | **`MAX_TARGET_SPAN_EXTRA_TOKENS = 3` הוא מספר שלא נמדד.** `containsHeadword` לא מאפס בכוונה על אי-התאמה (פעלים מורכבים נפרדים), ולכן בלי גבול הטווח נמתח מהטוקן הראשון לאחרון — סקירה מדדה 27 תווים מודגשים כ"מילת המטרה" ב-`"Please give the book to the man up there."` | הגבול הוא **תצוגתי ולא פדגוגי**, והנפילה היא לכרטיס מנוון (בלי סימון) ולא לסימון שגוי. 3 נבחר מהתנהגות פעלים מורכבים בפועל, בלי מקור שקובע אותו | כשיהיה מאגר תוכן אמיתי (T-037) — למדוד את התפלגות המרחק בפועל ולכייל, או להסיר את הגבול אם הוא לא נדרש |
| TD-18 | **שלושה מספרים שאין להם מקור, וכולם יושבים ב-`app/api/review/route.ts`.** ‏`TRIAGE_MIN_USABLE_DAYS = 3` (מתי המבחן "קרוב מדי") · `MASTERY_CONSECUTIVE_CORRECT = 3` (כמה תשובות נכונות רצופות הן שליטה) · ובנוסף `promoteAfterConsecutiveCorrect` שיידרש בנתיב התור. אף אחד משלושתם אינו נגזר ממקור שאנחנו מחזיקים | הם **פרמטרי מוצר** ולכן הוגדרו ב-route ולא ב-`/lib/core`: קבוע שמיוצא מהשכבה הטהורה מצוטט אחר כך כאילו השכבה גזרה אותו. `SchedulingPolicy` ו-`MasteryPolicy` דורשים אותם כארגומנט **בלי ברירת מחדל** בדיוק כדי שהקורא ייאלץ לבחור. הזזתם אינה נוגעת בשורת קוד ב-`lib/core` | כשיהיו נתונים נמדדים מלומדים אמיתיים — לכייל מול שיעור השימור בפועל |
| TD-19 | **`0005_review_state.sql` טרם הורץ בפרויקט Supabase חי** — אותו מעמד בדיוק כמו TD-8 ו-TD-4. הבדיקות ב-`lib/supabase/reviewState.test.ts` מוכיחות מה אנחנו **שולחים**, לא מה קיים בפרויקט. עד שיורץ, כל קריאה ל-`POST /api/review` תיפול ב-503 על עמודה חסרה | אין credentials של פרויקט חי בסביבת הלופ, ואסור שיהיו | ידנית לפני הקידום הראשון ל-main עם משתמשים אמיתיים — יחד עם 0003, `docs/SETUP.md` |
| TD-20 | **‏`0006_layer2_track_and_bank.sql` טרם הורץ בפרויקט Supabase חי** — אותו מעמד בדיוק כמו TD-8 · TD-19 · TD-4. `lib/supabase/layer2.test.ts` מוכיח מה אנחנו **שולחים**, לא מה קיים בפרויקט. ⚠️ בשונה מ-TD-19, המיגרציה הזו **אינה** חוסמת נקודת קצה כלשהי: אין צרכן לשש העמודות ולשני השדות, ולכן אי-הרצתה אינה מפילה דבר היום | אין credentials של פרויקט חי בסביבת הלופ, ואסור שיהיו | ידנית, יחד עם 0003 ו-0005, לפני הקידום הראשון ל-main עם משתמשים אמיתיים |
| TD-21 | **‏`public.word_progress` חסרה בלוק `revoke`/`grant` מפורש.** ‏`0002_content_bank.sql` שולל הרשאות ברירת מחדל במפורש (RLS **אינו** חוסם `TRUNCATE`), ו-`0003_provenance_telemetry.sql` אינו עושה זאת לטבלה שהוא יוצר. `0006` הוסיף לה עמודה ולכן קרא את הקובץ ומדד את הפער — ⛔ אך לא תיקן אותו | תיקון טבלה של מיגרציה אחרת בתוך מיגרציה שנושאה שכבה 2 הוא דליפת היקף, וכל סקירה עתידית תחפש את השינוי במקום הלא נכון | המיגרציה הבאה שנושאה הרשאות, או `0007` אם ה-Critic מאשר לצרף |
| TD-22 | **‏`0007_world_schema.sql` טרם הורצה בפרויקט Supabase חי** — אותו מעמד כמו TD-4 · TD-8 · TD-19 · TD-20. `lib/supabase/worldSchema.test.ts` מוכיח מה אנחנו **שולחים**, לא מה קיים בפרויקט. כמו TD-20 ובשונה מ-TD-19, היא **אינה** חוסמת נקודת קצה: אין צרכן לארבע הטבלאות, ואין להן להיות אחד עד סגירת שער R-014 | אין credentials של פרויקט חי בסביבת הלופ, ואסור שיהיו | ידנית, יחד עם 0003 · 0005 · 0006, לפני הקידום הראשון עם משתמשים אמיתיים |
| TD-23 | **שתי מיגרציות חולקות את המספר `0003`** (`0003_low_confidence_is_visible.sql` · `0003_provenance_telemetry.sql`), ולכן סדר ההחלה ביניהן אינו מוגדר. רדום היום: שתיהן רק `alter` על `senses` ובעמודות שונות | שינוי שם של מיגרציה שכבר הוחלה מסוכן יותר מזוג מתועד — `supabase db push` רושם את השם בטבלה משלו. הזוג מוחרג **בשמו** ב-`scripts/migration-hygiene.test.ts`, וכל מספר כפול **חדש** נכשל | ✅ **נסגר C-0202 (DEV) בהוראה חיה של רוי (19/08).** ⇒ `0003a_` · `0003b_`. ⚠️ **הנימוק לאי-הביצוע נמדד ונמצא שאינו חל על הפרויקט הזה:** ⛔ אין `supabase/config.toml`, אין פרויקט CLI מקושר, ו-`docs/SETUP.md` מתעד הדבקה ידנית בעורך ה-SQL ⇒ אין טבלת bookkeeping ואין גיבוב לפסול. מספור מחדש נשלל כי `0004`+ תפוסים ומספור מחדש היה **מזיז את הסכמה**; אות שומרת על הסדר במקום. השומר הוקשח מ«מספר ייחודי חוץ מזוג מוחרג» ל«**אסימון סדר ייחודי, בלי החרגות**», ונצפה נופל על `0003×2` לפני השינוי. |
| TD-24 | **מסלול הקליטה הוא קובץ SQL שנוצר, ולא כותב service-role** — `supabase/seed/0001_content_batches.sql` (T-042). ובנוסף, כמו TD-20 · TD-22: **הקובץ טרם הורץ בפרויקט חי.** ⛔ 343 המשמעויות עדיין אינן בדאטהבייס עד שרוי מחיל אותו | אין Supabase חי בסביבת הלופ (T-019) ואין credentials, ולכן כותב רשת אינו ניתן להרצה, אינו ניתן לבדיקה, ומוסיף מסלול החלה שני לצד `supabase/migrations/` שרוי מחיל ביד ממילא. הלוגיקה כולה כבר טהורה ובדוקה (`batchRecord` · `spotCheck` · `gateSense`) — ביום שיהיו credentials, **רק הפולט מתחלף** | ידנית, יחד עם 0003 · 0005 · 0006 · 0007, לפני הקידום הראשון עם משתמשים אמיתיים |
| TD-26 | ✅ **נסגר 11/09 — `npm run preview:stop`** (‏`scripts/stop-preview.mjs`): מתאים על `next-server` **ו⛔ מחריג את שרשרת ה-PPID של הקורא**, ⇒ שני חצאי הפגם. הנוסח המקורי: **`pkill -f "next start"` אינו הורג את שרת הבדיקות** (Next משנה את שם התהליך ל-`next-server (vX.Y.Z)` מיד אחרי העלייה, ולכן התהליך שורד את ה-pkill וממשיך להחזיק את הפורט). ⚠️ **חלקית נסגר C-0400 (DEV · T-251).** `startServer`/`isUp` ב-`scripts/verify-mobile.mjs` כבר ⛔ **אינם** מאמצים בשקט שרת שההארנס לא הקים בעצמו: כשאין `--base-url` והפורט כבר תפוס — בין אם ב-`next-server` שרד `pkill`, ובין אם ב-`next dev` שהושאר חי (T-251, המקרה שנמדד בפועל: STEP 2.5 של `docs/agents/PM.md` מרים `next dev -p 3000` ולא אומר לכבות אותו) — ההארנס יוצא **לפני שהוא מריץ בדיקה אחת**, בשם `port … already busy`, במקום להריץ את כל 1205 הבדיקות מול שרת זר ולדווח כשל שקרי (בדיוק המחלקה שהולידה את T-250/F-180). נמדד חי C-0400: `PORT=<תפוס> npm run check:mobile` ⇒ `exit 1` עם ההודעה הנכונה, ו-`npm run verify` מלא עם הפורט פנוי ⇒ `exit 0` (`test` 3236/3236, `check:mobile` 1205/1205). | זו מלכודת סביבה ולא באג בקוד המוצר. נמדד C-0075: שלוש הרצות `check:mobile` רצופות דיווחו על בנייה ישנה. ⚠️ **מה עדיין פתוח:** ההארנס עדיין ⛔ אינו מעלה שרת טרי בעצמו כשהפורט תפוס — הוא רק מסרב ויוצא; הכלל המבצעי (`pkill -f next-server` + אימות ב-`pgrep -af next-server` לפני כל מדידה ידנית) עדיין נכון למי שרוצה שההרצה תצליח בפועל | כשמישהו יריץ שרת ביד שוב — או כשההארנס יקבל דגל `--fresh` שמעלה שרת טרי על פורט פנוי אוטומטית |
| TD-25 | ✅ **נסגר C-0210 (DEV · T-122).** ההכרעה שהשורה הזאת המתינה לה נפלה לטובת **שני** המקומות: `proxy.ts` **וגם** `app/onboarding/page.tsx`, ושניהם קוראים לאותה פונקציה טהורה `lib/core/entryRoute.ts`. ⛔ **והקריאה אינה «בכל בקשה»** — היא מותנית ב-`needsOnboardingState` וחלה על ארבעה נתיבים בלבד (`/` · `/login` · `/signup` · `/onboarding`), ולכן איסור התוכנית על מס קבוע בנתיב החם נשמר. הנוסח המקורי: **לומד שכבר סיים onboarding מוחזר אליו בכל כניסה דרך `/`.** `proxy.ts` שולח כל בעל סשן מ-`/` · `/signup` · `/login` אל `/onboarding` בלי לבדוק `onboarded_at`, ולכן החזרה ל-`/studies` עוברת דרך מסך שכבר מולא. נמדד C-0073 ⛔ ולא תוקן | התיקון דורש קריאת `profiles.onboarded_at` **בכל בקשה** בתוך ה-proxy — קריאת דאטהבייס בנתיב החם של כל ניווט, וזו החלטה בסדר גודל של PM ולא של Dev. התוכנית (משימה 3, צעד 3.4) אוסרת זאת במפורש | ה-PM — יחד עם ההכרעה אם היעד נקבע ב-proxy או בעמוד `/onboarding` עצמו |
| TD-27 | **רשימת ה"כבר נפגשו" נקראת עד `MAX_SEEN_ROWS = 1000`, ולכן היא עלולה להיות חלקית.** המילים החדשות ב-`GET /api/study/queue` נבחרות בהחסרה: מושכים מועמדים מ-`words` ומסננים ב-`excludeSeen` את מה שכבר יש ללומד ב-`word_progress`. הסינון נכון רק אם הרשימה **שלמה** — מעל התקרה המסלול מדלג על הצגת מילים חדשות באותה קריאה (עם `console.error`) במקום להציג מילה ידועה כחדשה. החזרות ממשיכות לזרום | הפתרון הכן הוא anti-join בצד השרת (`words LEFT JOIN word_progress ... WHERE wp.word_id IS NULL`), ו-PostgREST אינו יכול לבטא אותו מהמסלול. ⛔ החלופה שנפסלה במפורש היא `not.in` מרשימת מזהים: אורך ה-URL גדל עם ההיסטוריה של הלומד ונשבר בשקט. הסף אינו נגיש היום — מאגר התוכן כולו הוא 343 משמעויות | כשמאגר התוכן יעבור אלף מילים, או ביום שיהיה Supabase חי שמאפשר `rpc` — לפי מה שיקרה קודם |
| TD-28 | **`elapsed_ms` נמדד מהסימון הקודם ולא מרגע שהכרטיס נכנס למסך.** `<StudyDeckScreen>` מחזיק חותמת אחת שמתאפסת בכל סימון (ובטעינת התור, לכרטיס הראשון), ומגיש את ההפרש ל-`POST /api/review`. עם כרטיס אחד למסך וגלילה מיידית אחרי כל סימון ההפרש בין השניים הוא זמן הגלילה, אבל הוא **אינו אפס**, וזה השדה היחיד שכל שכבת הטלמטריה של D-010 (`time_to_first_correct`) נשענת עליו | הפתרון הכן הוא שה-`<CardDeck>` ידווח מתי כרטיס נכנס לתצוגה (`IntersectionObserver` על מכולת ה-snap), וזו הרחבה ל-props של רכיב שמשימה 5 סגרה על שלושה props בדיוק — ⛔ תוספת שאף בדיקה במשימה 6 אינה מבקשת. הערך הנוכחי חסום ב-`MAX_ELAPSED_MS` ולכן ⛔ אינו יכול להרעיל את השדה בערך שהמסלול דוחה | ביום ש-D-010 ייקרא בפועל — או ב-T-032, שהוא הקורא הראשון של הטלמטריה הזו |
| TD-29 | **`EXPECTED_CONSOLE` ב-`scripts/verify-mobile.mjs` מרשה שורות קונסולה לשני מסכים** — `/study` (C-0102) ו-`/dev/tabs/cards` (C-0103, שתי הכתובות `?deck=due&limit=1` ו-`?deck=unknown&limit=1`).** ההארנס מריץ `next start` בלי ENV של Supabase, ולכן `GET /api/study/queue` עונה 503 **לפי החוזה שלו**, ו-Chromium רושם כל משאב שאינו 2xx כשגיאת קונסולה. מצב הכשל שנוצר הוא בדיוק מה שההארנס מודד על המסך הזה, ⛔ אבל הפטור הוא בכל זאת חור בשומר | הפטור נכתב צר ככל האפשר — **כתובת אחת וסטטוס אחד** (`/api/study/queue` + 503); 401, 500 או כל חריגה אחרת על אותו מסך עדיין מפילים. ⛔ החלופה שנפסלה: פטור לכל המסלול, שהיה מסתיר גם `TypeError` אמיתי. ⛔ החלופה השנייה שנפסלה: הגנה על `/study` ב-`proxy.ts` כדי שיפנה ל-`/login` — זה היה גורם להארנס למדוד את מסך ההתחברות במקום את מסך הלימוד, שהוא F-027 סיבה 1 | ביום שיהיה Supabase חי בסביבת הבדיקה (T-019), הפטור נמחק ו-`/study` נמדד מול תור אמיתי |
| TD-30 | **`components/CardDeck.tsx` מצהיר על `h-[calc(100dvh-10rem)]` — מספר שמתאר את ה-chrome של `app/layout.tsx`.** עמודת השורש היא `min-h-dvh`, כלומר גובה בלתי-מוגדר, ולכן חפיסת `scroll-snap` אינה יכולה להימתח לחלל שנותר לה ומוכרחה להצהיר על גובה. 10rem = כותרת 52px + `pb-8` של `main` 32px + תחתית 76px | הפתרון הכן הוא תבנית app-shell: `h-dvh` על עמודת השורש ו-`overflow-y-auto` על `main`. ⛔ נפסל בטיק הזה: הוא משנה כל מסך במוצר ומבטל את `window.scrollTo` שעליו נשענות בדיקות ההישג של ההארנס — החלטת ארכיטקטורה שאף משימה לא ביקשה. ⚠️ החוב **אינו שקט**: `/dev/deck` מודד את התוצאה בשלושת הרוחבים, ושינוי ב-chrome מפיל את `the deck fits on screen` | ביום שתיכתב משימת app-shell, או ברגע ש-`check:mobile` יאדים על המסלול הזה |
| TD-17 | 🔴 **סביבת הלופ חסומה מכל מקור נתונים חיצוני — כל מסלול הקליטה של M1 אינו ניתן להרצה בה.** נמדד C-0016 מתוך הסנדבוקס: `newgeneralservicelist.com`, `kaikki.org` ו-`cefr-j.org` מחזירים `HTTP 403` עם הכותרת `x-deny-reason: host_not_allowed`; `raw.githubusercontent.com` ו-`registry.npmjs.org` מחזירים תקין. כלומר T-007 · T-010 · T-013 · T-016 · T-018 **אינן ניתנות לביצוע** בלופ, ולא בגלל התמצית החסרה (T-020) אלא בגלל רשת היציאה **נמדד שוב C-0019 (02:44Z), אחרי איפוס משתני ה-proxy של הסביבה: `kaikki.org` ו-`newgeneralservicelist.com` עדיין `403 x-deny-reason: host_not_allowed`, בעוד `raw.githubusercontent.com` מגיע ליעד. כלומר החסימה אינה תצורת proxy זמנית שתיפתר מעצמה — המתנה למחזור הבא לא תעזור, ורק פעולת רוי (דחיפת המקורות תחת `data/`) פותחת את המסלול.** | זו מגבלת סביבה ולא החלטת ארכיטקטורה, ואין לסוכן דרך לעקוף אותה — ⛔ אין להוריד את המקורות ממראה, מארכיון או מדומיין חלופי (R-004 נועל את NGSL לדומיין אחד בדיוק). **הערוץ היחיד שכן פתוח הוא הריפו:** רוי מוסיף את קובצי המקור תחת `data/` ודוחף, ואז הקליטה היא עבודה מקומית טהורה | **פעולה של רוי.** כל עוד היא פתוחה, המסלול הקריטי של M1 חסום פעמיים — פעם ב-T-020 ופעם כאן |
| TD-31 | **`supabase/migrations/0011_content_read_policies.sql` טרם הורצה על פרויקט חי** (`03-for-roy`, C-0145). ⚠️ **נרשם במקור כ-TD-28 ומוספר מחדש ל-TD-31 ב-C-0150** — המספר 28 כבר היה תפוס בידי חוב ה-`elapsed_ms` של C-0102, ושני חובות תחת מזהה אחד הופכים כל «TD-28 נסגר» לדו-משמעי. עד שתורץ, כל טבלת תוכן ממשיכה לשאת שתי מדיניות SELECT — בדיוק כמו אתמול | ⛔ **זהו החוב הבטוח ביותר בטבלה: אי-ההרצה אינה שוברת דבר ואינה חוסמת דבר.** Postgres מבצע OR על מדיניות מתירה, והשקילות הוכחה טבלה-טבלה (C-0145) ⇒ נראוּת השורות זהה לפני ואחרי. ⛔ אינה חוסמת את T-072, שפולטת SQL ואינה נוגעת בדאטהבייס. ⚠️ מה שכן נשאר פתוח עד ההרצה: הקובץ אומר חוק אחד והדאטהבייס אוכף שניים, ⇒ מי שיבטל מדיניות בהנחה שהיא היחידה ⛔ לא יקבל את מה שהוא מצפה לו | יחד עם כל דבר אחר שממתין בתור אצל רוי. ⛔ אינה דחופה |
| TD-32 | **מגביל הקצב של האימות נכשל *פתוח*.** `lib/supabase/authRateLimit.ts` מחזיר `{allowed:true}` ורושם `console.error` כאשר ה-RPC `consume_auth_attempt` מחזיר שגיאה או זורק — כלומר בזמן תקלה במונה, ההרשמה וההתחברות עובדות בלי מכסה | ⚠️ **החלטה מוצהרת, ⛔ לא פספוס.** כישלון *סגור* היה מוריד את ההרשמה ואת ההתחברות לכל לומד ברגע שטבלת המונה מגמגמת. הלקח של F-003 על fail-open חותך לכיוון ההפוך רק עבור שומר שמגן על **נתונים**; זה מגן על **נפח**. ⚠️ עד שתורץ `0012` (TD-33) זהו **המצב הרגיל ולא חריג** — כל בקשה נופלת לענף הזה, ולכן F-008ⓑ אינו מוגן בפועל בפרודקשן עד ההרצה | ברגע ש-`0012` הורצה ו-`/api/health` מדווח על הטבלה, הענף הופך fail-closed. הבדיקה שתתפוס את המעבר קיימת כבר: «allows and logs when the RPC errors» ב-`lib/supabase/authRateLimit.test.ts` |
| TD-33 | **`supabase/migrations/0012_auth_attempts.sql` טרם הורצה על פרויקט חי** (`03-for-roy`, C-0160). הקובץ נכתב ונשמר בבדיקת מקור (`lib/supabase/authAttemptsSchema.test.ts`, 8 אסרציות), ⛔ אך אף בדיקה בריפו אינה יכולה להוכיח שהוא הוחל — אין Postgres ב-CI | ⛔ **בניגוד ל-TD-31, החוב הזה כן משבית תכולה:** בלי הטבלה, ה-RPC מחזיר `relation does not exist`, TD-32 נכנס לפעולה, וכל הגבלת הקצב היא no-op שמדפיס לוג. ⚠️ **אין רגרסיה** — זהו בדיוק המצב שהיה לפני C-0160 (אפס הגבלת קצב, F-008 M1) — אבל F-008ⓑ אינו נסגר עד ההרצה | הרצה ידנית בקונסולת Supabase, בדיוק כמו `0011`. אחריה: TD-32 מתהפך ו-F-008ⓑ ניתן לסגירה |
| TD-34 | ~~**`supabase/migrations/0013_learner_level.sql` טרם הורצה על פרויקט חי**~~ — ⛔ הטענה נעשתה שקרית. הנוסח המקורי: החוב נפתח C-0172 כי הקובץ נכתב ונשמר ב-14 אסרציות מקור ב-`lib/supabase/learnerLevel.test.ts` ⛔ ואף בדיקה בריפו לא יכלה להוכיח שהוא הוחל — אין Postgres ב-CI | ⛔ **אין עוד השבתת תכולה.** כל עוד `0013` לא רצה, `profiles.current_level` ו-`word_progress.self_marked_known` לא היו קיימים ⇒ נתיבי מפת הרמה החזירו 503 מוסבר בעברית, ו-T-081/T-082 לא היו ניתנות להדגמה על פרויקט חי | ✅ **נסגר C-0185 (DEV), בהוראת ה-PM ב-C-0184.** רוי הריץ את `0013` ואת `0014` ב-19/08 (הוראה חיה, «הרצתי את שניהם»), וה-PM אימת בריפו לפני הסגירה ש-`0013_learner_level.sql` ו-`0014_arcade.sql` שניהם קיימים (`ls` טרי על `dev@72e88eb`). ⇒ פריטים 28 ו-33 ב-`03-for-roy` נסגרו, ושורת החוב הזאת מדדה מצב שחדל להתקיים. ⚠️ **מה ⛔ נסגר איתה, וזה ⛔ אינו החוב הזה:** `0011` (TD-31) ו-`0012` (TD-33) — רוי ⛔ לא אמר שהריץ אותן, ולא את הזרעים (פריטים 9 ו-12) |
| TD-35 | **תוצאת קרב שממתינה לשליחה אינה שורדת רענון דף.** `components/ArenaBoard.tsx` שומר את גוף ה-`POST /api/arcade/result` שנכשל ב-`pendingResult` שהוא **state של React**, ומנסה שוב על אירוע `online`. רענון, סגירת לשונית או קריסה מוחקים אותו | הלומד סיים קרב במעלית בלי רשת, רענן, והקרב לא נספר: `arcade_progress.wins` ⛔ לא עלה ופריט ⛔ לא נפתח. ⚠️ **⛔ אין כאן אובדן של מנוע החזרות** — הזירה ⛔ אינה כותבת ל-`word_progress` (D-044), ולכן מה שאבד הוא **התקדמות הזירה בלבד** | ⛔ **⛔ אינה החלטת Dev.** שמירה מתמידה מחייבת שלוש הכרעות מוצר שאינן כתובות באף מקום: **איפה** (‏`localStorage` מול IndexedDB מול תור בשרת) · **לכמה זמן** תוצאה ממתינה עדיין תקפה · ומה קורה כששני קרבות ממתינים בו-זמנית. תוכנית `2026-08-19-arcade-screens.md` § 1 צעד 13 מוציאה את זה מהתחולה במפורש ⇒ **פריט ל-PM**, ⛔ לא שורת קוד לטיק הבא |
| TD-36 | **`profiles.institution` — עמודה נטושה בכוונה (D-056 · T-111).** אף קוד ⛔ אינו כותב אליה מ-C-0261; `components/MeScreen.tsx` ו-`app/(tabs)/me/page.tsx` מוסיפים לקרוא אותה עבור לומדים שענו לפני ההסרה, ולכן הענף ⛔ אינו מת | ⛔ **אינה נמחקת** — `drop column` הרסני ואינו סמכות סוכן, ו-D-056 נוקבת בכך במפורש («⛔ העמודה `profiles.institution` ⛔ אינה נמחקת»). ⚠️ **המחיר, ⛔ ולא מוסתר:** ללומד **חדש** העמודה תישאר `NULL` לנצח ⇒ שורת המוסד ב-`/me` ⛔ לעולם לא תוצג לו, והבלוק יציג ציון יעד בלבד (`MeScreen.tsx:86` כבר מסתיר את הבלוק כששניהם ריקים — ענף קיים ונבדק, `MeScreen.test.ts:120`) | הסגירה: החלטת בעלים לנקות שורות היסטוריות, ⛔ ולא טיק סוכן |
| TD-37 | **משתמש בדיקה לפיתוח (D-057 · T-113) — החלטת סיכון מפורשת של הבעלים.** ‏`GET /api/dev/session` מתחבר (⛔ ולא יוצר) למשתמש שנוצר **ביד** ב-Supabase; ההתנגדות של ה-PM וה-Critic נרשמה ונדחתה. ⚠️ **הרצה חיה מול Supabase לא בוצעה** — נבדק בסריקת מקור בלבד (`lib/core/devUser.test.ts` · `lib/supabase/devUser.test.ts` · `app/api/dev/session/route.test.ts`) ואומת ש-`npm run build` מקמפל את הנתיב תחת `NODE_ENV=production` | ⛔ **אינו נסגר על ידי סוכן** — הסגירה היא `plan/03-for-roy.md` פריט 36 (מחיקת שורת המשתמש מ-Supabase לפני ההשקה), ומחייבת בדיקה ידנית מול פרויקט חי שאין לסוכן גישה אליו | לפני ההשקה — פריט 36 |
| TD-38 | 🔴 **T-238 · `app/api/review/context/route.ts` כתב `onConflict: 'user_id,word_id,track_id'` על `word_progress`, ששקנוי (`0003b_provenance_telemetry.sql`, לא שונה מאז אף מיגרציה — נמדד בגריפ על 12 קובצי המיגרציה) `primary key (user_id, word_id)` בלבד; `track_id` שם היא עמודה רגילה `not null default 'amiram'`, ⛔ ולא חלק מאילוץ.** PostgREST דוחה `onConflict` שאינו מפנה לאילוץ קיים (`42P10`) ⇒ **כל קריאה ל-`upsert` בנתיב הזה נכשלה, בפרודקשן, מאז שנכתב.** התבנית באותו קובץ עצמו (`app/api/auth/signup` → `onConflict:'id'` = ה-PK של `profiles`; `app/api/arcade/result` → `'user_id'` / `'user_id,word_id'` = ה-PK של `arcade_progress` / `arcade_collected_words`) מאששת: בכל מקום אחר בריפו `onConflict` הוא בדיוק עמודות המפתח הראשי, ורק כאן הן נסטו | **זו הסיבה המדודה ל-T-238** («מילה שסומנה בסיפור לא מגיעה לאוצר המילים»): `components/StoryScreen.tsx` שולח `POST /api/review/context` דרך `void apiPost(...).catch(() => {})` — ה-`.catch` תופס רק כשל *fetch*, ולא גוף `{ ok:false }` תקין שה-503 מחזיר, כך שהכישלון האמיתי מעולם לא הגיע ללוג לקוח וגם `console.error` בשרת לא נצפה בלי ניטור. ⛔ **אינו רגרסיה טרייה** — `CONFLICT_KEY` נכתב כך מלכתחילה (T-187ⓕ), כלומר הנתיב הזה ⛔ מעולם לא עבד כפי שתועד | ✅ **נסגר C-0405 (DEV).** `CONFLICT_KEY` שונה ל-`'user_id,word_id'`; `route.test.ts` מוסיף שני שערים — הצלבת המחרוזת מול `primary key` שבמיגרציה בפועל (כדי שלא תסטה שוב משינוי סכימה עתידי), ותפיסת ה-`onConflict` בפועל שמגיע ל-`upsert` מ-`handleContextTap`. תיעוד ה-`primary key (user_id, word_id, track_id)` השקרי תוקן גם בתגובת הקוד וגם ב-`docs/api-contract.md`. `npm run verify` ירוק טרי (`test` 3269/3269 · `check:mobile` 1208 checks) |

---

### 3.1.33 בלוק "המטרה שלך" — ומדוע שתי בדיקות שהתוכנית כתבה עברו על המוטציה שהיא עצמה חזתה (T-003, משימה 4/4) — C-0083

⟨מואַרך⟩ הפיסה עצמה: (‏ · · , כולם ) מיוצא מ-, ו- הוא פרופ חובה ולא רשות — פרופ רשות הוא… · ציטוטים: `components/MeScreen.tsx` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.34 משפט כשל עברי אחד — ומדוע הסריקה שהתוכנית כתבה ראתה קובץ אחד מתוך שלושה (T-056) — C-0084

⟨מואַרך⟩ הפיסה עצמה: — מודול קבועים טהור, אפס ייבואים: () · (‏ · · · ) · (‏ · ). ארבעת… · ציטוטים: `lib/core/failure.ts` · `app/error.tsx` · `app/global-error.tsx` · `components/MeScreen.tsx` · `components/OnboardingForm.tsx` · `lib/core/auth.ts` · `scripts/verify-mobile.test.ts` · `components/MeScreen.test.ts` · `lib/core/failure.test.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.35 מרווח נמדד בין יעדי מגע — ומדוע כל 13 הכשלים שהסריקה דיווחה היו פגם במכשיר ולא במסך (T-057) — C-0085

⟨מואַרך⟩ הפיסה עצמה: ב- לצד , וסריקה בתוך בלוק שמודדת את המרווח האנכי בין כל שני יעדי… · ציטוטים: `scripts/verify-mobile.mjs` · `app/page.tsx` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.36 הבריאות נוגעת בטבלה — ומדוע ארבע מחרוזות קבועות שוות יותר מ-`error.message` (T-053) — C-0093

⟨מואַרך⟩ בדק שלושה דגלי ENV והחזיר כשבדאטהבייס לא הורצה אף מיגרציה. בדיקת העשן של נשענת… · ציטוטים: `lib/core/health.ts` · `docs/api-contract.md` · הנוסח המלא: `plan/archive/architecture-archive.md`

## שכבת החפיסה — `lib/core/deck.ts` (C-0096, T-064 משימה 1)

⟨מואַרך⟩ למה קיימת שכבה טהורה בין השאילתה לכרטיס. לפני הקומיט הזה לא הייתה שום דרך להביא… · ציטוטים: `lib/core/deck.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

## תור הכרטיסיות בשרת — `GET /api/study/queue` (C-0097, T-064 משימה 2)

⟨מואַרך⟩ מה נסגר כאן. החוליה שחסרה קיימת: שורה ב- הופכת לכרטיס שהלקוח יכול לבנות. ⛔… · ציטוטים: `lib/core/deck.ts` · `app/api/review/route.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

## מילים חדשות במנת היום, וסדר שהיה חסר בשאילתה (C-0099, T-064 משימה 3 · F-034 · F-035 · F-036)

⟨מואַרך⟩ מה נסגר כאן. הפסיק להיות ריק לנצח ללומד חדש. עד הטיק הזה התור נקרא מ- בלבד —… · ציטוטים: `lib/core/queue.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

## תרגול בלי לזוז — `POST /api/practice` (C-0100, T-064 משימה 4)

⟨מואַרך⟩ המסלול הרביעי והאחרון בשרשרת T-064, והוא היחיד שמוגדר בעיקר במה שהוא לא עושה.… · ציטוטים: `app/api/practice/route.test.ts` · `app/api/study/queue/route.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

## חפיסת הגלילה — `components/CardDeck.tsx` (C-0101, T-065 משימה 5)

⟨מואַרך⟩ מה נסגר כאן. התור בשרת קיים מ-C-0097 והכרטיס הבודד קיים מ-T-045, אבל לא היה… · ציטוטים: `components/CardDeck.tsx` · הנוסח המלא: `plan/archive/architecture-archive.md`

## הבורר בלשונית `כרטיסיות` — `<CardsScreen>` (T-065 חלק ג׳ · C-0103)

⟨מואַרך⟩ הלשונית הפסיקה להיות מצב ריק והפכה לבורר חפיסות: שלושה כרטיסי כניסה, תמיד… · ציטוטים: `docs/api-contract.md` · הנוסח המלא: `plan/archive/architecture-archive.md`

## הגובה שהחפיסה חייבת להצהיר עליו — ומדוע `/dev/deck` הפיל אותה פעמיים ברצף (T-065 משימה 8) — C-0104

⟨מואַרך⟩ נכתב במשימה 5 עם , ובדיקות המקור שלו דרשו את המחרוזת הזו. אף בדיקה לא יכלה… · ציטוטים: `components/CardDeck.tsx` · הנוסח המלא: `plan/archive/architecture-archive.md`

### C-0117 — `0010_world_author_kind.sql` (T-061 משימה 1 בתוכנית `2026-08-14-world-compose.md`)

⟨מואַרך⟩ הפיסה: עמודה אחת על — , טרנזקציונית ואידמפוטנטית כמו ··, ⛔ וללא ולו אחד. למה… · ציטוטים: `2026-08-14-world-compose.md` · `lib/supabase/worldAuthorKind.test.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

### C-0118 — `lib/core/world.ts` (T-061 משימה 2/4 בתוכנית `2026-08-14-world-compose.md`)

⟨מואַרך⟩ הפיסה: מודול טהור־עלה — ⛔ אפס ייבוא ממודול אחר, אפס React/DOM/שעון//I/O. שמונה… · ציטוטים: `lib/core/world.ts` · `2026-08-14-world-compose.md` · הנוסח המלא: `plan/archive/architecture-archive.md`

### C-0120 — `GET /api/world/status` (T-061 משימה 3/4 בתוכנית `2026-08-14-world-compose.md`)

⟨מואַרך⟩ הפיסה: נקודת הקצה הראשונה תחת . סדר השומרים הקבוע (C-0032) — → → שאילתה — נאכף… · ציטוטים: `2026-08-14-world-compose.md` · `docs/api-contract.md` · הנוסח המלא: `plan/archive/architecture-archive.md`

### C-0122 — `GET /api/world/bank` (T-061 משימה 4 בתוכנית `2026-08-14-world-compose.md`)

⟨מואַרך⟩ הפיסה: נקודת הקצה השנייה תחת , והיא זו שמזינה את מסך ההרכבה: . אותו סדר שומרים… · ציטוטים: `2026-08-14-world-compose.md` · `app/api/study/queue/route.ts` · `docs/api-contract.md` · הנוסח המלא: `plan/archive/architecture-archive.md`

### C-0123 — `GET`/`POST /api/world/posts` (T-061 משימה 5 — **הסוגרת**, בתוכנית `2026-08-14-world-compose.md`)

⟨מואַרך⟩ הפיסה: נקודת הקצה השלישית והאחרונה של שכבת השרת של , והיא היחידה מהשלוש שכותבת.… · ציטוטים: `2026-08-14-world-compose.md` · `docs/api-contract.md` · הנוסח המלא: `plan/archive/architecture-archive.md`

### C-0126 — יחידת הספירה של השער (F-040), ומפרידה אחת משותפת ל-PostgREST

⟨מואַרך⟩ הפגם: ספר שורות דרך , בעוד היא טבלה פר-סנס ו- מנוסח ב-headwords. לומד שמחזיק את… · ציטוטים: `app/api/world/status/route.ts` · `app/api/world/bank/route.ts` · `lib/supabase/postgrest.ts` · `bank/route.ts` · `docs/api-contract.md` · הנוסח המלא: `plan/archive/architecture-archive.md`

### C-0124 — `/world` והפיד הפרטי (T-062 משימה 6, בתוכנית `2026-08-14-world-compose.md`)

⟨מואַרך⟩ הפיסה: המסך הראשון של . הוא Server Component ריק מגישה לנתונים — הוא מרנדר ותו… · ציטוטים: `2026-08-14-world-compose.md` · `components/WorldFeed.tsx` · `lib/api/client.ts` · `lib/core/world.ts` · `docs/api-contract.md` · `lib/core/palette.test.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

### C-0127 (DEV · טיק ביצוע · משימה 7 מתוך 9 בתוכנית `2026-08-14-world-compose.md`) — הלשונית נפתחת מהשרת

⟨מואַרך⟩ T-062 נסגרת כאן. שואל את דרך , מחזיק , ומסתעף. ⛔ לא זזה: הערך בכניסת «העולם»… · ציטוטים: `2026-08-14-world-compose.md` · `components/TabBar.tsx` · `scripts/verify-mobile.test.ts` · `docs/api-contract.md` · הנוסח המלא: `plan/archive/architecture-archive.md`

### C-0128 (DEV · טיק ביצוע · משימה 8 מתוך 9 בתוכנית `2026-08-14-world-compose.md`) — הבנק הסגור והטיוטה

⟨מואַרך⟩ חי. שלושה קבצים חדשים: (Server Component, ⛔ אפס גישה לנתונים) · (פרזנטציוני — ⛔… · ציטוטים: `2026-08-14-world-compose.md` · `app/world/compose/page.tsx` · `components/WordBank.tsx` · `components/ComposeDraft.tsx` · `docs/api-contract.md` · הנוסח המלא: `plan/archive/architecture-archive.md`

## `/dev/world` — הפיקסצ'ר שסוגר את T-063, והמדידה שמוכיחה שהוא לא היה קישוט (משימה 9) — C-0129

⟨מואַרך⟩ מריץ בלי ENV של Supabase, ולכן ו- עונים 503 לפי החוזה שלהם עצמם. המסקנה אינה… · ציטוטים: `app/dev/deck/page.tsx` · `docs/api-contract.md` · הנוסח המלא: `plan/archive/architecture-archive.md`

### C-0131 (DEV · טיק ביצוע · משימה 1 מתוך 3 בתוכנית `2026-08-14-arrival-and-constitution.md`) — טבעת המיקוד הגלובלית (T-069)

⟨מואַרך⟩ מה נוסף. הצהרה אחת ב-, מיד אחרי : שלוש הכרעות, ולמה כל אחת נבחרה כך: 1. גלובלית… · ציטוטים: `2026-08-14-arrival-and-constitution.md` · `app/globals.css` · `lib/core/palette.ts` · `app/globals.test.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

### C-0133 (DEV · טיק ביצוע · משימה 2 מתוך 3 בתוכנית `2026-08-14-arrival-and-constitution.md`) — כל רדיוס נגזר מ-D-036, ועימו השומר (T-068)

⟨מואַרך⟩ מה השתנה. 40 מופעי רדיוס ב-18 קבצים תחת ו- נגזרו אל שלושת הערכים שחוקה § 3… · ציטוטים: `2026-08-14-arrival-and-constitution.md` · `app/page.tsx` · `app/loading.tsx` · `components/TabBar.tsx` · `scripts/radius-hygiene.test.ts` · `app/error.tsx` · `components/CardDeck.tsx` · `app/not-found.tsx` · `plan/50-tasks.md` · הנוסח המלא: `plan/archive/architecture-archive.md`

### C-0134 (DEV · טיק ביצוע · משימה 3 מתוך 3 בתוכנית `2026-08-14-arrival-and-constitution.md`) — ההארנס מודד הגעה, לא רק הקשה (T-067)

⟨מואַרך⟩ מה השתנה. קיבל טבלה שנייה לצד — — ובלוק אסרציות שרץ אחרון בגוש המסלול, ולפני… · ציטוטים: `2026-08-14-arrival-and-constitution.md` · `scripts/verify-mobile.mjs` · `app/page.tsx` · `components/StudyDeckScreen.tsx` · `scripts/verify-mobile.test.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

## מצב הסיום של החפיסה, ולמה פיקסצ׳ר ולא סימון-עד-הסוף (T-055) — C-0137

⟨מואַרך⟩ הוא הפיקסצ׳ר השני של החפיסה, לצד , והוא קיים בגלל מדידה: נושא שני כרטיסים לא… · הנוסח המלא: `plan/archive/architecture-archive.md`

## C-0138 · `SEED_OUT_DIR` — קובץ מחולל אינו נכתב מתוך בדיקה (F-048)

⟨מואַרך⟩ הפגם, ושני הנזקים שלו. שתי חבילות הבדיקה של הגנרטורים הריצו את ו- דרך בלי… · הנוסח המלא: `plan/archive/architecture-archive.md`

## C-0139 · `<CardSkeleton>` חולץ לקובץ, ופיקסצ׳ר `/dev/deck/skeleton` נולד (T-054)

⟨מואַרך⟩ החילוץ הוא תנאי למדידה, ⛔ לא סידור. הסימון של מצב הטעינה חי בענף של מאז C-0102,… · ציטוטים: `components/CardSkeleton.tsx` · `app/dev/deck/skeleton/page.tsx` · הנוסח המלא: `plan/archive/architecture-archive.md`

## C-0141 · ביקורת M0 — 18 שורות מול 18 פקודות, ומה שהכלי החמיץ

⟨מואַרך⟩ הביקורת (משימה 3 מתוך 3 בתוכנית ) ⛔ לא כתבה שורת קוד מוצר. התוצר הוא ראיה, ו⛔… · ציטוטים: `2026-08-15-m0-study-closeout.md` · `plan/50-tasks.md` · `lib/core/failure.ts` · `app/error.tsx` · הנוסח המלא: `plan/archive/architecture-archive.md`

## C-0142 · F-039 נסגר על משימות 8–9 — שלוש אסרציות אותרו כעיוורות במוטציה, ⛔ לא בקריאה

⟨מואַרך⟩ F-039 נשאר פתוח אחרי C-0129 בדיוק מפני שאיש לא מדד את משימות 8–9: הן נכתבו… · ציטוטים: `components/ComposeDraft.test.ts` · `components/WordBank.test.ts` · `components/WordBank.tsx` · הנוסח המלא: `plan/archive/architecture-archive.md`

### C-0144 (DEV) — D-035 ⓑ: השער החוזר נמדד, והתוצאה היא אפס דחיות

⟨מואַרך⟩ (חדש) מריץ את המתוקן (אחרי F-020, C-0012) על כל שורה בכל , וכותב דוח מחויב ל-.… · ציטוטים: `docs/gate-recheck.md` · `lib/core/gateReport.ts` · `scripts/measure-gate.mjs` · `scripts/measure-gate.test.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

### C-0145 — `0011_content_read_policies.sql` (T-071, משימה 2 בתוכנית `2026-08-15-scoring-material.md`) — סוגר את F-051

⟨מואַרך⟩ הפגם, שנמדד לפני שנכתבה שורה אחת של תיקון. ‏ נכתבה כדי להחליף את ארבע מדיניות… · ציטוטים: `2026-08-15-scoring-material.md` · הנוסח המלא: `plan/archive/architecture-archive.md`

### C-0146 · חומר הניקוד נטען — הפער שבין אומדן למדידה

⟨מואַרך⟩ נשא מאז T-042 (C-0060) הערה שהצדיקה השמטה בשתי סיבות, ובאומדן אחד: «~2,400… · ציטוטים: `scripts/build-ingest-sql.mjs` · `docs/gate-recheck.md` · `lib/core/scoringSeed.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

### C-0150 (DEV · טיק ביצוע) — מרשם החוב נבדק במכונה, אחרי שהתנגשות מזהים כבר קרתה בו

⟨מואַרך⟩ ⚠️ הכשל של F-025 חזר במרשם שכן היה מוגן. ‏ נועל מאז F-025 את מזהי ה-T ב- (ייחוד… · ציטוטים: `scripts/plan-hygiene.test.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

### C-0151 (DEV · ⛔ טיק תכנון) — הרגיסטרים אינם נקראים לפי עמודה, וזה נמדד לפני שנכתבה שורת קוד

⟨מואַרך⟩ C-0150 התחיל לקרוא את ואת במכונה (מזהים ייחודיים, רצף בלי חורים), ו-F-056 מבקש… · ציטוטים: `plan/50-tasks.md` · `plan/30-architecture.md` · `plan/60-findings.md` · `docs/superpowers/plans/2026-08-15-plan-table-machine-read.md` · הנוסח המלא: `plan/archive/architecture-archive.md`

### C-0152 (DEV · טיק ביצוע) — שלוש משימות התוכנית נסגרו, והרגיסטרים נקראים בפקודה אחת

⟨מואַרך⟩ שלוש המשימות של בוצעו ברצף בטיק אחד: (טהור — מודע ל- · · · · · ), ⇒ ⇒ , ובדיקת… · ציטוטים: `2026-08-15-plan-table-machine-read.md` · `lib/core/planTable.ts` · `scripts/measure-plan-tables.mjs` · `docs/plan-tables.md` · `scripts/measure-plan-tables.test.ts` · `plan/50-tasks.md` · `plan/60-findings.md` · הנוסח המלא: `plan/archive/architecture-archive.md`

## מנוע 7.4 — הימורי ביטחון ככיול, ⛔ לא כציון מוצג (T-033, C-0155)

⟨מואַרך⟩ (טהור — ). ארבעה חלקים, כולם מדידה או תזמון: ⓐ מטריצת CBM של Gardner-Medwin,… · ציטוטים: `lib/core/confidence.ts` · `lib/core/confidence.test.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

## C-0156 (DEV) — הרגיסטר של ה-Dev נקרא לפי עמודה, ו-F-059 יוחס חצי-שגוי

⟨מואַרך⟩ ⛔ אפס קוד מוצר. אפס UI. אפס נקודות קצה. אפס תוכן לימודי. הטיק נגע בשלושה קבצים:… · ציטוטים: `plan/50-tasks.md` · `scripts/measure-plan-tables.test.ts` · `plan/60-findings.md` · `docs/plan-tables.md` · הנוסח המלא: `plan/archive/architecture-archive.md`

### C-0157 (DEV · טיק ביצוע) — החסם של T-066 הורם עשרה מחזורים לפני שהרגיסטר אמר זאת

⟨מואַרך⟩ דיווח מאז C-0152, ו-F-059 ציטט אותו כהוכחה שהמחיר אינו תיאורטי. הטיק הזה הכריע… · ציטוטים: `lib/core/contentSchema.ts` · `docs/gate-recheck.md` · `supabase/seed/0003_scoring_material.sql` · הנוסח המלא: `plan/archive/architecture-archive.md`

### C-0158 (DEV · טיק ביצוע) — התור שאמר «שמונה משימות פנויות» היה ריק, ועכשיו הוא אומר זאת

⟨מואַרך⟩ מה נמדד, ⛔ ולא הונח. בתחילת הטיק דיווח — שמונה שורות שהכלי מציג כפנויות ל-Dev.… · ציטוטים: `plan/40-decisions.md` · `data/ngsl-1.2.csv` · `lib/core/planTable.ts` · `scripts/measure-plan-tables.test.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

## C-0160 (DEV) — למגביל הקצב שהחוזה הבטיח מזה חודש נבנה סוף-סוף מייצר (F-008ⓑ)

⟨מואַרך⟩ פרסם 429 ל-login, ו- החזיר שש תוצאות שכולן ממפות 429 של הספק ואף אחת אינה… · ציטוטים: `docs/api-contract.md` · `docs/superpowers/plans/2026-08-15-auth-rate-limit.md` · `lib/core/rateLimit.ts` · `supabase/migrations/0012_auth_attempts.test.ts` · `lib/supabase/authAttemptsSchema.test.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

## C-0163 (DEV · טיק ביצוע) — שש משימות ליטוש, ושתי בדיקות שהיו ירוקות מעל הדבר הלא נכון

⟨מואַרך⟩ שש משימות (T-073…T-078) בקומיט אחד. כולן ליטוש ברמת מחלקה אחת או אלמנט אחד,… · ציטוטים: `scripts/radius-hygiene.test.ts` · `app/loading.tsx` · `app/loading.test.ts` · `components/LockIcon.tsx` · הנוסח המלא: `plan/archive/architecture-archive.md`

## נגזרות `data/generated/` — מי מצהיר על אצווה (C-0167, F-062)

⟨מואַרך⟩ הוא מצביע «האצווה האחרונה», ⛔ ולא ארכיון. כל טיק CONTENT דורס אותו. עד 16/08… · ציטוטים: `data/generated/manifest.json` · `scripts/build-ingest-sql.test.ts` · `docs/gate-recheck.md` · `docs/plan-tables.md` · הנוסח המלא: `plan/archive/architecture-archive.md`

### C-0174 — `lib/core/levelSummary.ts` + `GET /api/levels/summary` (T-080, Tasks 2+3 בתוכנית `2026-08-17-level-map.md`)

⟨מואַרך⟩ שלוש הספירות של § 4.2ז חיות בקובץ אחד, ובו בלבד. בודק «ידוע» לפני «ברשימת… · ציטוטים: `lib/core/levelSummary.ts` · `2026-08-17-level-map.md` · `app/api/levels/summary/route.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

### C-0230 — `summarizeAllLevels` + `levels[]` בסיכום (T-102, משימה 5 בתוכנית `2026-08-20-level-map-completion.md`)

⟨מואַרך⟩ תוספת, ⛔ ולא החלפה. נשארת בדיוק כפי שהיא; לצידה נוספה שמחזירה תמיד שש רשומות… · ציטוטים: `2026-08-20-level-map-completion.md` · `lib/core/deck.ts` · `docs/api-contract.md` · הנוסח המלא: `plan/archive/architecture-archive.md`

### C-0176 — `POST /api/levels/current` + `<LevelMapScreen>` (T-081, Tasks 4+5 בתוכנית `2026-08-17-level-map.md`)

⟨מואַרך⟩ הבחירה היא נתיב משלה ⛔ ולא הרחבה של . הוולידטור שם הוא , ששייך לטופס ההצטרפות;… · ציטוטים: `2026-08-17-level-map.md` · `app/dev/tabs/probe/page.tsx` · `lib/core/failure.test.ts` · `lib/core/failure.ts` · `lib/core/palette.test.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.40 הבידוד נכתב בסכמה, ולא בהערה — ואיך המוטציה הרגה ארבע בדיקות בבת אחת (T-092) — C-0179

⟨מואַרך⟩ היא המיגרציה הראשונה שנכתבת כדי שלא תוכל לעשות משהו. D-044 דורש שהזירה לא תיגע… · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.41 הגרפ העיוור של § 4 — למה כל שמונה המדידות החזירו «HIT» על קוד תקין (T-093) — C-0180

⟨מואַרך⟩ נכתב, ושבע השאלות של § 4 בתוכנית הורצו כלשונן. חמש מהן החזירו פגיעות — על מימוש… · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.42 הזירה, במלואה: שתי טבלאות · שני נתיבים · גבול אחד שנאכף בשלושה מקומות (T-094) — C-0182

⟨מואַרך⟩ סוגר את הצד השרתי. הזירה כולה היא שתי טבלאות ( · ) ושני נתיבים ( קורא · כותב),… · ציטוטים: `lib/core/arcadeResult.test.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.43 מסך הקרב: מצב יורד לשכבה טהורה, והחשיפה ממתינה לאצבע ⛔ ולא לשעון (T-095) — C-0185

⟨מואַרך⟩ הפיסה עצמה: (טהור · 68 שורות) + + + + פיקסטורת + שתי שורות ב-. 31 בדיקות חדשות… · ציטוטים: `lib/core/arcadeBattle.ts` · `components/CloseIcon.tsx` · `components/ArenaBoard.tsx` · `app/arcade/page.tsx` · `scripts/verify-mobile.mjs` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.44 · C-0187 (DEV · T-096) — הדמות ומסך הסיום

⟨מואַרך⟩ ⛔ נכס מיוצר אפס, וזו החלטת ארכיטקטורה ולא טעם. הוא ארבע שכבות בתוך אחד, כל שכבה… · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.45 · C-0188 (DEV · T-097) — הכניסה לזירה, ו-T-088 נסגרת כ«הוחלפה»

⟨מואַרך⟩ שורה בתוך מסך, ⛔ ולא מסך — וזו ההכרעה שקובעת את כל השאר. יושב בבלוק «דרכים… · ציטוטים: `lib/core/arcadeRound.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.65 — T-126 · T-130 · T-117: הסף הוא **נגזרת**, ⛔ ולא קבוע שמייצג נגזרת (C-0216)

⟨מואַרך⟩ המחלקה, והיא אחת לשלוש המשימות: קבוע שמייצג יחס נכון רק בנקודה שבה נמדד, ושקר… · ציטוטים: `docs/api-contract.md` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.66 — «המילים שאספתי»: שורה נוצרת על **טעות**, ולכן «ידועה» היא התאוששות (C-0218 · T-109 · T-110 · T-118)

⟨מואַרך⟩ שלושת השלבים חולקים הכרעה אחת שכל השאר נגזר ממנה, והיא נלקחה בטיק התכנון מתוך… · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.64 — F-082ⓐ: הסרגל מצהיר על צורתו, כי ההזמנה קבועה והגובה אינו (C-0214)

⟨מואַרך⟩ ⚠️ ההשערה שבממצא הופרכה במדידה. F-082 קרא את הרגרסיה כ«העמוד התקצר». הוא ⛔ לא… · ציטוטים: `app/globals.css` · `docs/api-contract.md` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.63 — T-125: הספים עלו על החוט, כי הלשונית נעולה על שניים והמשפט סיפר על אחד (C-0212)

⟨מואַרך⟩ מחזיק את המשפט שהלומד קורא כשלשונית «העולם» נעולה. הפגם שנמדד C-0207 ⛔ אינו סף… · ציטוטים: `lib/core/worldGate.ts` · `app/api/world/status/route.ts` · `docs/api-contract.md` · `lib/core/world.ts` · `lib/core/worldGate.test.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.62 — T-124: «לאן אפשר ללכת מכאן» היא טבלה אחת, ⛔ לא ארבעה `if` בארבעה קבצים (C-0211)

⟨מואַרך⟩ עונה על שאלה אחרת מזו של : זה הנוסח, וזה היעד. שלושה קודים, שלוש שורות, ושתי… · ציטוטים: `lib/core/failureExit.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.61 — T-123: מצב «כל האריחים מושבתים» מוצג גם כשהסיבה היא כשל קריאה (C-0210)

⟨מואַרך⟩ תיעוד סעיף 4 קובע שכשל משאיר שלושה אריחים מושבתים ⛔ ואינו מציג מסך שגיאה. D-064… · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.60 — `0015_arcade_decoupling.sql`: הטבלה השלישית של הזירה (C-0194 · T-107)

⟨מואַרך⟩ היא רשימה, ⛔ לא מנוע — שורה אחת ל(לומד, מילה), מפתח ראשי מורכב , שני מונים ( ·… · ציטוטים: `app/api/arcade/round/route.ts` · `app/api/arcade/result/route.ts` · `docs/api-contract.md` · הנוסח המלא: `plan/archive/architecture-archive.md`

### הסולם והקבועים — `lib/core/arcadeLadder.ts` (C-0195 · T-115)

⟨מואַרך⟩ ההכרעה: טבלה ⛔ ולא נוסחה. «רמות 1–4 הן A1» אינו חוק מתמטי אלא הכרעה פדגוגית… · ציטוטים: `lib/core/arcadeLadder.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

### `GET /api/arcade/round` — הרמה נגזרת מהסולם (C-0196 · T-108)

⟨מואַרך⟩ מה ירד: הנתיב ⛔ אינו קורא עוד את . הבלוק נמחק, ואיתו המצב — «הלומד טרם בחר רמה»… · ציטוטים: `app/dev/arcade/page.tsx` · `lib/core/arcadeBattle.ts` · `components/ArenaBoard.tsx` · `components/ArcadeEntry.tsx` · הנוסח המלא: `plan/archive/architecture-archive.md`

### תנאי הסיום של הקרב — שני מוצאים, ⛔ ואין שלישי (C-0197 · T-116)

⟨מואַרך⟩ הוא הפונקציה היחידה שקובעת שקרב נגמר, והיא מחזירה , או . ⛔ אין ערך רביעי, ⛔… · ציטוטים: `components/ArenaBoard.tsx` · `components/ArenaResult.tsx` · הנוסח המלא: `plan/archive/architecture-archive.md`

### רשת האפליקציות של `העולם` — שכבה מעל הפיד, ⛔ ולא במקומו (C-0200 · T-098)

⟨מואַרך⟩ הוא השכבה היחידה שמכריעה מי האריח הגדול. הרכיב מצייר מצב ⛔ ואינו מחשב אותו:… · ציטוטים: `lib/core/worldApps.ts` · `app/page.tsx` · `scripts/verify-mobile.test.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

## `GET /api/world/recall` — הכרטיס «מה שכתבת אתמול»  *(C-0201 · T-104 · Task 2 מתוך 4)*

⟨מואַרך⟩ אותה הפרדה של הזירה, ⛔ ובלי חריג. ההחלטה כולה יורדת ל- שאינו יודע דבר על React,… · ציטוטים: `lib/core/worldRecall.ts` · `lib/core/world.ts` · `lib/core/flashcard.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

### C-0203 (DEV) — `<RecallCard>`: שלוש סטיות מוצהרות, וכולן מדידה ⛔ ולא טעם (T-105)

⟨מואַרך⟩ ⓐ המשפט נעטף ב- אחד, ובתוכו שני והמסגרת — ⛔ ולא אחד. התוכנית מורה «המשפט ב-… · ציטוטים: `app/dev/world/layout.tsx` · הנוסח המלא: `plan/archive/architecture-archive.md`

### C-0205 (DEV) — «שרשרת הכתיבה»: שדה תוספתי אחד, ושתי סטיות מוצהרות (T-106)

⟨מואַרך⟩ ⛔ המספר הוא ⛔ ולא , וזו ההכרעה כולה. חוסם את הקריאה ב- ⇒ הוא גודל התשובה,… · ציטוטים: `docs/api-contract.md` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.67 — שער שמדווח מספר שאינו מודד את מה ששמו מבטיח (C-0220 · T-101 · T-129 · T-128 · T-131)

⟨מואַרך⟩ מפצל מודע-code-span סוגר את מחלקת F-059 / F-062ⓒ / F-063. שלוש הנפילות האלה… · ציטוטים: `scripts/plan-hygiene.test.ts` · `scripts/verify-mobile.mjs` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.68 — `0016_lexical_class_backfill.sql`: העברת ידע לפני החלפת מקור אמת (C-0223 · T-120ⓐ · F-086)

⟨מואַרך⟩ המיגרציה הזאת קיימת מפני שהעמודה החדשה ריקה, וזה נמדד ⛔ ולא שוער. ‏ הוסיף את כ-… · ציטוטים: `scripts/build-ingest-sql.mjs` · `lib/core/batchRecord.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.69 — שלושת קוראי `העולם` עוברים ל-`lexical_class` (C-0224 · T-120ⓑ · F-088)

⟨מואַרך⟩ מה השתנה, בשלושה אתרים ובשורה אחת כל אחד. ‏ ו- מחליפים ב-; מחליף את השדה בתוך… · ציטוטים: `lib/core/worldRecall.ts` · `lib/core/flashcard.ts` · `lib/core/batchRecord.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.70 — צינור הקליטה כותב `lexical_class`, והתוצר הנגזר נוצר מחדש באותו קומיט (C-0225 · T-120ⓒ)

⟨מואַרך⟩ זו השכבה השלישית והאחרונה שקראה את העמודה הפורשת, ואיתה נסגר התנאי המקדים של… · ציטוטים: `scripts/build-ingest-sql.mjs` · `lib/core/batchRecord.ts` · `supabase/seed/0001_content_batches.sql` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.70 — סריקת רמה: הצהרה שיושבת בעמודה משלה, ⛔ ולא חשיפה שנענתה (T-082, C-0227)

⟨מואַרך⟩ שלוש שכבות, וכל אחת חיה במקום אחד. טהור ונושא את כל ההכרעות המספריות (12 בעמוד… · ציטוטים: `lib/core/levelScan.ts` · `app/api/levels/scan/route.ts` · `components/LevelScan.tsx` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.71 — שורה 5: רשימה שנקראת מן הנתיב הקיים, ⛔ ולא הגדרה שנייה לחפיסה (T-083, C-0229)

⟨מואַרך⟩ ⛔ לא נבנה נתיב, וזו מדידה ⛔ ולא חיסכון. כבר מחזיר בדיוק את הרשימה שרוי ביקש (… · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.72 — פני הכרטיס הם הכפתור, ⛔ ולא כפתור נפרד שיושב בתחתיתו (T-085 · T-086 · T-087, C-0234)

⟨מואַרך⟩ טבעי, ⛔ ולא . לפני C-0234 חזית הכרטיס הייתה עם -ים בפנים, וההיפוך יושב על כפתור… · ציטוטים: `app/layout.tsx` · `components/ArenaBoard.test.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.73 — «אתמול» הוא הפריט האחרון, ⛔ ולא חלון זמן; והפִּין נגזר מהרשימה ⛔ ולא משאילתה שנייה (T-133, C-0243)

⟨מואַרך⟩ ההכרעה הראשונה — «אתמול» = הפריט האחרון שנאסף (D-071ⓑ). חלון של 24 שעות היה… · ציטוטים: `docs/superpowers/plans/2026-08-20-world-featured-and-pin.md` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.74 — שער הסיפור מפחית טוקן ללמה, ⛔ ואינו מרחיב למה לטוקנים (T-134, C-0246)

⟨מואַרך⟩ ההכרעה הראשונה — כיוון ההתאמה הוא כל ההבדל מ-F-020. הרחיבה למה לצורות, ובדרך… · ציטוטים: `lib/supabase/stories.test.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.75 — הבנק נבנה מאותם שני מקורות, והשער רץ **פעם שנייה** בקליטה (T-135, C-0247)

⟨מואַרך⟩ ההכרעה הראשונה — ⛔ אין מקור אמת שני לרמת מילה. בונה את קבוצת הלמות המורשות… · ציטוטים: `scripts/build-stories-sql.mjs` · `supabase/seed/0004_stories.sql` · `scripts/content-brief.test.ts` · `docs/content-stories-brief.md` · `lib/core/storyGate.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.76 — `phase` הוא פרופ ⛔ ולא מצב, והבלוק שנחתך ⛔ ולא רוכך (T-089 · T-091, C-0250)

⟨מואַרך⟩ ⓐ מסך השיעור מפוצל לרכיב חסר-מצב ולשתי פיקסטורות, ⛔ ולא למסך שמכיר את התוכן… · ציטוטים: `components/LessonScreen.tsx` · הנוסח המלא: `plan/archive/architecture-archive.md`

### C-0252 — המחווה, הדעיכה, וארבעה פגמים שהתוכנית עצמה נשאה

⟨מואַרך⟩ ⓐ שני המספרים של המחווה טהורים, והרכיב ⛔ אינו מכיר אף אחד מהם. מקבל ארבע… · ציטוטים: `lib/core/swipeGrade.ts` · `lib/core/decay.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.77 — פרדיקט אחד לשני צרכנים, והסף על החוט ⛔ ולא בלקוח (T-141, C-0254)

⟨מואַרך⟩ ⓐ «כמה כשירים» ו«האם יש כרטיס» חייבים להיות אותה שאלה, ולכן הן קוראות לאותה… · ציטוטים: `lib/core/worldRecall.ts` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.78 — האריח הרביעי: קריאה **רכה**, רצ׳ט מסלולים, ושער שלא ניתן לספק (T-137, C-0255)

⟨מואַרך⟩ ⓐ תנאי הפתיחה הוא על המאגר, ⛔ ולא על הלומד. ב- מחזיק את שלושת הענפים ⛔ ואין… · ציטוטים: `lib/core/worldApps.ts` · `docs/api-contract.md` · `lib/core/worldAppsRoutes.test.ts` · `lib/core/storyGate.ts` · `scripts/measure-level-headroom.mjs` · `2026-08-21-content-headroom-and-cross-validation.md` · הנוסח המלא: `plan/archive/architecture-archive.md`

### 3.1.79 — האימות הצולב הוא **חיתוך גלוסות**, ⛔ ולא היכרות עם הלמה (T-112, C-0259)

⟨מואַרך⟩ D-055 מבטלת את «כל רשומת היא low» ומחליפה אותה בשני אותות בלתי תלויים. הקריאה… · ציטוטים: `lib/core/confidence.ts` · `data/h3-kaikki-en.jsonl` · `data/h4-word2word-en-he.tsv` · הנוסח המלא: `plan/archive/architecture-archive.md`

## החריג היחיד מרצפת 44px — `36 § 3` (T-183 · C-0274)

⟨מואַרך⟩ אכף על כל פקד בכל נתיב. מתקן את ומחריג יעד inline בתוך פסקת קריאה רציפה — אחרת… · ציטוטים: `scripts/verify-mobile.mjs` · `scripts/story-tap-audit.mjs` · הנוסח המלא: `plan/archive/architecture-archive.md`

### ⚠️ רמז נמדד ל-T-187, ⛔ ולא הוראה
ב-probe בכרומיום אמיתי, `display:inline-block` על המילה סיפק את התנאים אבל **מונע
שבירת שורה בתוך המילה** ומגדיל את הגובה ל-50px. המימוש צריך להישאר `inline` עם
`padding-inline` שמוחזר כ-`margin-inline` שלילי — זה מה שהתנאי `layout-shifted` מודד:
**הריפוד באזור ההקשה בלבד, המראה אינו משתנה.**

### חוב שנרשם ⛔ ולא נסגר
היום הבדיקה מודדת **אפס** פסקאות סיפור, כי `/world/story` מחזיר 404 (נמדד C-0273)
ו-`app/dev/story` נולד ב-T-186. הכלל כתוב, נבדק, מחובר ומופעל בכל נתיב — **המסך הוא
שחסר**, ומרגע ש-T-186 נוחתת הבדיקה מתחילה לספור בלי שינוי נוסף.

---

## פרוסה A — `/world/story`: ארבע השכבות, כפי שנבנו  ⟦C-0299 (DEV) · T-185…T-188 · T-149⟧

⟨מואַרך⟩ ⚠️ החוב שנרשם מעל נסגר באותו טיק, והמספר הוא הראיה: מדד עד 25/08 אפס פסקאות… · ציטוטים: `lib/core/storyPick.ts` · `lib/core/storyTapTargets.ts` · `lib/core/storyQuestion.ts` · `lib/supabase/stories.ts` · `app/api/world/story/route.ts` · `app/api/review/context/route.ts` · `components/StoryScreen.tsx` · הנוסח המלא: `plan/archive/architecture-archive.md`

### ⛔ למה `/api/review/context` הוא נתיב ⛔ ולא דגל — הכרעה הפיכה, ורשומה
`checkReviewPayload` (`lib/core/reviewRequest.ts:24-34`) דורש `grade ∈ {again,good}`,
והנתיב מריץ אחריו `applyGrade` + `scheduleReview`. הפיכת `grade` לאופציונלי הייתה
הופכת את כתיבת ה-SM-2 ל**תנאי בתוך פונקציה אחת** — וכתיבה מותנית היא בדיוק המחלקה
ש**סריקת מקור ⛔ אינה יכולה להוכיח שאיננה שם**. קובץ נפרד נסרק בשם ונופל בשם.
⚠️ ולכן ההגנה היא **שתיים ⛔ ולא אחת**: סריקת המקור על שש המחרוזות, **ובנוסף** בדיקת
אמת מול לקוח מדומה שמוודאת שהשורה הנכתבת נושאת שלושה מפתחות בדיוק —
`user_id` · `word_id` · `attempts`. ⛔ סריקת מקור לבדה היא טענה על **טקסט**.

### ⚠️ הרמז מ-T-183 נבדק בפועל, והתברר כנכון
`display:inline` עם `px-2 -mx-2 py-2 -my-2` מקיים את ארבעת התנאים; `inline-block`
היה מנפח את הגובה ל-50px ומונע שבירת שורה. ⇒ הרמז שנרשם כאן ב-T-183 ⛔ לא היה ניחוש.

### ⛔ חוב שנרשם ⛔ ולא נסגר — ושניהם הכרעת PM
1. **F-123** — `§ 4.2יג-ב ⓑ` אוסר לסמן מילה חדשה, הרנדר מסמן אותה בשבב מותג,
   והכותרת המשנית מבטיחה ללומד «מילה מודגשת». הקוד מממש את ⓑ (⛔ אין סימון),
   ו**ההכרעה משנה שורת CSS אחת**.
2. **F-124** — `StoryEndScreen` נבנה, נמדד וירוק, ו⛔ אין מסלול מוצר שמרנדר אותו:
   לתוכנית ⛔ אין צעד חיבור, ולפי הרנדר זהו **מצב** של מסך הסיפור ⛔ ולא מסך שני.
   ⇒ פרוסה A ⛔ **אינה שלמה מקצה לקצה** למרות שכל חמש השורות נסגרו וכל שער ירוק.

### ⚠️ המיגרציה הורצה, ⛔ ולא הושארה לרוי
`0019_story_questions.sql` הוחלה על הפרויקט המחובר ואומתה בשאילתה חיה: הטבלה קיימת ·
**3** אילוצים בשם · RLS דלוקה · מדיניות `select` אחת · `0` שורות (הזריעה היא
`supabase/seed/0005_story_questions.sql`, שנבנה מ-12 השאלות של C-0295).
⚠️ **ונמדד תוך כדי, ורלוונטי לכל טיק עתידי:** `supabase db push` **תלה בלי פלט**
בסביבה הזאת — חיבור Postgres ישיר ⛔ אינו נגיש מהארגז — ורשימת המיגרציות של הפרויקט
**ריקה**, כלומר הסכמה הקיימת הוחלה בעורך ה-SQL ⛔ ולא דרך ה-CLI. ⇒ ההחלה נעשתה
דרך הכלי המחובר, על **המיגרציה החדשה בלבד**, ⛔ ולא בהרצה חוזרת של 0001…0018.

## בדיקה שמפרשת רגיסטר חייבת לייבא את הפרסר, ⛔ ולא לכתוב לעצמה רגקס  ⟦C-0303 (DEV) · F-130⟧

`scripts/measure-plan-tables.mjs:367` קורא «שורת משוב פתוחה» כ־«הגליף `⬜`/`🔵` מופיע
**איפשהו בתא האחרון**», דרך `splitRow` של `lib/core/planTable.ts`, וההערה שם קובעת
שזו המוסכמה של **כל** רגיסטר. הבדיקה שמאמתת את אותו מדור כתבה לעצמה רגקס **מעוגן** —
`/[⬜🔵]\s*\|\s*$/`, שדורש שהגליף יהיה הדבר האחרון בשורה.

**שני הקוראים הסכימו עד שתא סטטוס נפתח בגליף וננעל בפרוזה.** ⇒ המחולל אמר «1 פתוחה»,
הבדיקה אמרה «0», והעץ האדים על **עריכת markdown בלבד** — בדיוק התרחיש ש-`RULES § 0.1 ח׳`
מזהיר מפניו, והפעם ⛔ לא בגלל קובץ נגזר שלא חודש.

⛔ **התיקון ⛔ אינו לעצב מחדש את שורת הרגיסטר.** שורה שעומדת במוסכמה המתועדת היא שורה
תקינה; לשנות אותה כדי לרצות רגקס פרטי הוא ללמד את הכותבים לרצות שער. ⇒ הבדיקה מייבאת
את **אותו `splitRow`** ⇒ **קורא אחד, ⛔ לא שניים.**

⚠️ **הכלל הכללי, ⛔ ולא המקרה:** כל בדיקה שמפרשת שורת רגיסטר — משימות, ממצאים, משוב —
מייבאת את `lib/core/planTable.ts`. רגקס שנכתב בתוך בדיקה הוא **הגדרה שנייה** לאותה
עובדה, והיא תסטה. ⛔ זו הפעם השנייה שהמחלקה הזאת עולה (‏F-059 · F-078 הן אותה משפחה).

## סריקת מקור שומרת על **קובץ**, ולכן הערה שמצטטת את המחרוזת הפסולה מפילה אותה  ⟦C-0305 (DEV) · T-203⟧

שלוש פעמים בטיק אחד קרה אותו דבר: כתבתי הערה שמסבירה **למה** מחרוזת נפסלה, ההערה
ציטטה אותה, והסריקה — `expect(SRC).not.toContain(…)` — נפלה. שלוש הפעמים היו הניסוח
של T-150ⓒ, הכותרת המשנית של T-203ⓐ, וסמנטיקת המסך של T-202ⓑ.

⛔ **הפיתוי הוא להחליש את הסריקה** — לחפש רק בתוך מחרוזות, לדלג על הערות, להוסיף
`// eslint-ignore` תרבותי. ⛔ זו בדיוק הדרך שבה שער נהיה קישוט: סריקה שיודעת להתעלם
מהקשר אחד תלמד להתעלם מהבא.

⇒ **הכלל: קובץ שנסרק ⛔ אינו מצטט את המחרוזת שנפסלה, ⛔ גם לא בתיעוד.** מתארים את
המחרוזת («התווית שהבטיחה מעבר לפריט הבא ברצף»), מפנים לשורת הרגיסטר, ומשאירים את
המחרוזת עצמה **רק בבדיקה** — שם היא נחוצה, ושם היא היחידה.

⚠️ **והמדידה שמצדיקה את הנוקשות:** הסריקות האלה הן מה שסוגר את F-123. מחרוזת שנשארת
בקובץ כ«הערה» היא מחרוזת שסוכן הבא ימצא בחיפוש טקסט ויחזיר לשימוש.

## פיקסטורת `/dev/*` שמרנדרת **רכיב בבידוד** ⛔ אינה בדיקה של מסך  ⟦C-0305 (DEV) · T-202ⓔ · F-124⟧

`app/dev/story/done/page.tsx` רינדרה את `StoryEndScreen` לבדו. `check:mobile` מדד אותו,
מצא 221 תווים, יעדים תקינים ואפס גלילה — **ירוק, ונכון לגבי הרכיב**. ורק בגלל שהרכיב
נמדד לבדו הוא יכול היה להעמיד פנים שהוא מסך: מכולה בגובה מסך, פעולה ראשית משלו, ו⛔ בלי
שורת המצב שהרנדר מצייר **בשני** הפריימים. ⇒ 1,119 בדיקות ירוקות, ו⛔ אף לומד ⛔ לא יכול
היה להגיע למסך.

⇒ **פיקסטורה מודדת את היחידה שהלומד רואה — המסך — ⛔ ולא את הרכיב.** כשמצב פנימי חוסם
הגעה, הדרך היא **דלת פיקסטורה מוצהרת** (`initialPhase`), ⛔ ולא רינדור של החלק. הדלת
מתועדת בטיפוס כ«פיקסטורות בלבד», ומסלול המוצר ⛔ אינו מעביר אותה.

⚠️ **וזה מכליל:** `/dev/deck/done` ו-`/dev/lesson/done` נבנו באותה תבנית. אם אחד מהם
מרנדר רכיב ⛔ ולא מסך, אותו חור פתוח שם — ⛔ ולא נמדד בטיק הזה.

## פיקסטורה בלי **מפתח** היא זיווג שאיש ⛔ אינו שומר עליו  ⟦C-0307 (DEV) · F-133⟧

הסעיף שמעל אמר «פיקסטורה מודדת את המסך, ⛔ לא את הרכיב». F-133 היא הצלע השנייה של
אותו כשל, ו⛔ היא ⛔ לא נסגרה בו: `/dev/story` ו-`/dev/story/done` רינדרו את **המסך
המלא** — ובכל זאת מה שנמדד היה מסך הבנה ש⛔ אין ממנו דרך לגזור תשובה.

**המדידה:** הגוף היה `STORY` של `render_video_A.py` — «The library near the river».
השאלה הייתה **שורה 2** של `story-questions-2026-08-25.jsonl` — שאלתו של «The letter
in the book». שני מקורות אמיתיים, שניהם מצוטטים בהערה, ו⛔ אין ביניהם קשר: אחד נבחר
לפי **הרנדר**, השני לפי **מספר שורה**. הגוף ⛔ אינו נוקב במכתב ⛔ ולא בכותב.

⇒ **הכלל: פיקסטורה מזווגת לפי אותו מפתח שהייצור מזווג לפיו.** `app/api/world/story`
שואל `story_questions` ב-`.eq('story_id', …)` — הזיווג שם הוא **מפתח זר**, ולכן ⛔ אינו
יכול לסטות. פיקסטורה שמעתיקה שני צדדים משני מקומות ⛔ אין לה מפתח, ולכן ⛔ אין לה מה
שיחזיק אותה. ⇒ מקור אחד (`app/dev/story/story-fixture.ts`), ובדיקה שמודדת אותו
**מול הקובץ שממנו הועתק** — `docs/design/render_video_A.py`, מחרוזת מול מחרוזת.

⚠️ **ומה שהופך את זה משער לכוונה טובה: הסריקה של הצרכנים.** שלושה קבצים החזיקו את
אותה פיקסטורה **ביד**, והשלישי היה **הבדיקה עצמה** — ולכן 2,676 בדיקות ירוקות ⛔ לא
יכלו לתפוס «שאלה בלי תשובה»: הבדיקה **קיבעה** את הזיווג השגוי. `story-fixture.test.ts`
סורק את שלושת הצרכנים ומפיל את הבנייה על עותק שני.

⚠️ **והשומר המדיד לעיגון, ⛔ ולא ל«הבנה»:** כל מילת תוכן בשאלה חייבת להיפתר אל אסימון
שבגוף, דרך `storyLemma` של המוצר — ⛔ לא עותק שלו. ⛔ זה ⛔ אינו בודק הבנה, ו-
`storyQuestionGate` אומר את המגבלה על עצמו במפורש. אבל זה **כן** תופס בדיוק את F-133:
`letter` ⛔ אינו בגוף ⛔ ולו פעם אחת. הוכח בהרצה, בשני הכיוונים.

⚠️ **ומחיר שנרשם ⛔ ולא נבלע:** התשובות של הרנדר ⛔ אינן פריט שעבר שער — התשובה הנכונה
היא גם הארוכה, ו-`storyQuestionGate` היה פוסל אותה ב-`correct_is_longest`. זה **מכוון**:
שלוש התשובות שם נבחרו כדי להעמיד גלישה עברית ארוכה מול קצרה ב-320px, וזה מה שפיקסטורת
**פריסה** אמורה למדוד. ⛔ מוק פריסה ⛔ אינו מתיימר להיות פריט תוכן, ו⛔ אינו נכנס לבנק.

⚠️ **ובדרך נמדדה סטייה שקטה שנייה:** `done/page.tsx` נשא `alreadyKnown: 4` על אותו
סיפור שהרנדר מצייר לו `5 מילים חדשות · 2 שכבר ידעת` (`render_video_A.py:999`). היא
ישבה שם מאז C-0305 ו⛔ איש לא מדד אותה, כי ⛔ אף בדיקה ⛔ לא השוותה מספר לרנדר. עכשיו
`FIXTURE_COUNTS` מוצמד למחרוזת ההיא בבדיקה.

---

## `unknown` שיכול לצאת מהמודל על **צומת** הוא «—» שנולד במקום אחר  ⟦C-0314 (DEV) · T-204 · T-148ⓑ⟧

`ringScreen` של התוכנית העביר את ארבעת הקלטים כמות שהם וחסם על `anyOpen` בלבד. שני
דברים נמדדו על הקוד עצמו, ⛔ ולא שוערו:

1. קלט `unknown` **שורד אל צומת** ברגע שצומת אחר פתוח. מסך שקיבל צומת כזה **חייב**
   לצייר לו משהו — ו«משהו» הוא «—», המחרוזת ש-T-148ⓑ אוסרת **בשם**. זו גם «שגיאה
   **וגם** תוכן» ש-T-146ⓑ אוסרת. ⇒ המסך היה נדחף להפר שתי שורות פתוחות **כדי
   לרנדר בכלל**.
2. `כתיבה חופשית` ו`אוצר מילים` הם `open` **קבוע** (‏`worldApps.ts`, § 4.2יב) ⇒
   `anyOpen` **אמת תמיד** ⇒ ענף `!anyOpen` ⛔ אינו נגיש. **המצב הריק שהתוכנית
   מתיימרת לספק היה קוד מת ביום שנולד** — מחלקת F-074.

⇒ **הכלל: טיפוס שהמסמך מכריז «⛔ אינו מצב של צומת» חייב להיות ⛔ לא-נגיש על צומת,
⛔ ולא «לא-מצויר בכוונה טובה».** ‏`ringScreen` חוסם `unknown` **בשער**: ולו קלט חי
אחד `unknown` ⇒ המסך כולו ריק. הבדיקה עוברת על ארבעת הקלטים אחד-אחד ומודדת את
התוצאה, ולכן היא ⛔ אינה תלויה בסדר.

⚠️ **והחלק שאי אפשר להסיק מהטיפוסים לבדם:** ⛔ `tsc` היה ירוק על שתי הגרסאות.
מה שהבדיל ביניהן הוא **תרחיש הכשל של השורה שהתוכנית טוענת שהיא סוגרת** — ולכן זה
מה שנרשם כבקשה ל-PM ב-`26-plan-feedback` (מופע שני של אותו דפוס אחרי C-0299).

---

## סרגל שאין בו קריאת שרת הוא ההבדל בין חותמת שהלופ מודד לחותמת שממתינה לאדם  ⟦C-0314 (DEV) · T-174 · D-117 · D-119⟧

עד 26/08 `TabBar` קרא את `GET /api/world/status` כדי להחליט אם הלשונית מנווטת. בארגז
החול ⛔ אין env ⇒ הנתיב עונה 503 ⇒ הלשונית **נעולה בכל מסך** — ולכן חותמת ⓐ («הלשונית
מופיעה בכל מסך ומובילה לטבעת») ⛔ **לא הייתה ניתנת למדידה בלופ בשום מצב**, ולא מפני
שהיא קשה אלא מפני שהיא הייתה תלויה בסשן.

⇒ **הכלל: כשחותמת נמדדת על מסלול, כל קריאת שרת על המסלול הזה מעבירה את החותמת לאדם.**
אחרי D-117 יש **אפס** תעבורת שרת על «כל מסך → לשונית → טבעת», ולכן ⓐ נמדדת בהרצה
רגילה. ⓑ (מצב הצמתים) נשארת של רוי, ⛔ ובכוונה — היא **כן** תלויה בנתון.

⚠️ **ומה שהבדיקות לימדו כאן:** שבע הבדיקות של הסרגל היו **ירוקות** בזמן שהוא הדפיס
נעילה על שלושה מסכים. ⇒ הן ⛔ לא הוחלשו אלא **הופכו**: כל בנייה שמחזירה `href: null`,
גיליון, `useState`, `useEffect` או `apiGet` לקובץ הזה נופלת **בשם**.

⚠️ **ומלכודת שנמדדה בדרך, ⛔ ואינה קשורה לטבעת:** `components/ArenaStage.test.ts` לוקח
את בלוק הבמה כ-`CSS.slice(indexOf('/* arena-stage'))` — כלומר **עד סוף `globals.css`**.
כלל שנוסף בסוף הקובץ נמדד כאילו הוא חלק מכללי הבמה, והלולאה הפועמת של הלשונית הפילה
שם שתי בדיקות שאין להן דבר עם הזירה. ⇒ **כל בלוק חדש ב-`globals.css` נכנס לפני הסמן
הזה**, וההערה יושבת שם בקובץ עצמו.

---

## «נסה שוב» ⛔ אינו פעולה — הוא **אחת משלוש**, והמסך חייב לדעת איזו  ⟦C-0315 (DEV) · T-146ⓒ · D-065 · F-137⟧

הטבעת נמסרה ב-C-0314 עם אזור שגיאה **אחד** ופעולה **אחת** (T-146ⓐ+ⓑ), והפעולה האחת
הייתה **תמיד** «נסה שוב» → `/world`. שני הקודים שהנתיבים באמת מחזירים הופכים את זה
למבוי סתום: `session_expired` יחזיר 401 שוב, ו-`schema_missing` ⛔ אינו חולף מפני
שלחצו על כפתור.

⇒ **הכלל: פעולה אחת ⛔ אינה אומרת פעולה קבועה.** מסך שמכריז «יש לי דרך אחת החוצה»
חייב להכריע **איזו**, אחרת «אחת» היא ניסוח יפה ל«אין».

⚠️ **ומה שנמדד כאן ומגיע לכל מסך הבא:** הפער נראה כמו «מחלקה חדשה שדורשת הכרעה»,
והוא היה **הצרכן החמישי** של טבלה בת שלוש שורות שכבר קיימת — `lib/core/failureExit.ts`
(T-124). ‏`LevelMapScreen` · `StudyDeckScreen` · `LevelScan` · `app/error.tsx` צורכים
אותה מאז C-0207. ⇒ **לפני שפער כשל מוגדר כהכרעה, מחפשים את הטבלה שכבר מכריעה אותו.**

**שלוש הכרעות שנשמרות:**

1. **הקוד ⛔ אינו נכנס לצומת.** D-118 נשארת: `unknown` הוא מצב של **מסך**. הקוד נוסע
   כארגומנט שלישי ל-`ringScreen` ⛔ ולא בתוך `RingNodeState`, ובדיקה מודדת ששתי
   קריאות עם קודים שונים מחזירות טבעת **זהה**.
2. **שלושת ענפי המצב הריק דרך `emptyScreen()` אחד.** ⛔ המוטציה שזה הורג היא לחווט
   את הקוד לענף `inputs === null` בלבד ולהשאיר שניים על ההתנהגות הישנה — הענף
   שנשאר מאחור ⛔ אינו נראה בסקירת דיף.
3. **שני מקורות שנכשלו ⇒ קוד אחד, לפי כלל.** `worstFailure` ב-`failureExit.ts`:
   ⛔ בלי כלל, ההכרעה היא «מי שענה אחרון», והיציאה שהלומד מקבל תלויה **בזמני רשת**.

⚠️ **ומה שנמדד ⛔ ולא תוקן (F-138):** `'המאגר עדיין לא הוקם'` חי ב**עשרה** עותקים
מקומיים ו-`'ההתחברות פגה. היכנס שוב.'` בשניים, בעוד `lib/core/failure.ts` הוא המקום
שהמינתה T-056. `failure.test.ts` אוכף «⛔ אף מסך ⛔ אינו חוזר על משפט כשל» **רק על
המשפטים שכבר ב-`FAILURE_HE`** ⇒ השומר ירוק והכפילות מתחתיו. לכן המצב הריק של הטבעת
נותן לשלושת הקודים את **אותו** משפט — ה**פעולה** מבדילה, ⛔ והמשפט לא: העברת שני
המשפטים פנימה מאדימה מיד עשרה קבצים, וזו שורת משימה ⛔ ולא תיקון אגב.

---

## C-0318 (DEV) — פרוסת `cards` A: «סינון מילים», הפס שזז, והרמה שעברה ל`הגדרות`

**ארבע משימות, ארבעה קומיטים, ו-`npm run verify` = exit 0** (typecheck · core · **2,803**
בדיקות · build · **1,158** בדיקות `check:mobile` ב-320/375/414).

### מה נוסף לארכיטקטורה

- **‏`lib/core/filterProgress.ts`** — מודול טהור חדש. ⛔ **הוא ⛔ אינו סופר**: שלוש הספירות
  מוגדרות ב-`levelSummary.ts` ו⛔ אין להן הגדרה שנייה (§ 4.2ז). מה שכאן הוא **הצגה** —
  אחוזי שלושת המקטעים, התווית `N / M סוננו`, ושלושת התאים כולל הכלל `null ≠ 0`.
  ⛔ **וסדר התאים מוצהר במודול ⛔ ולא בסדר האלמנטים ב-JSX**: `36 § 5` קובע «ידעתי בימין»,
  וסדר שמוטבע ב-JSX ⛔ אינו נבדק בלי דפדפן.
- **‏`components/LevelCard.tsx` · `components/FilterBar.tsx`** — שתי שורות של `36 § 5`.
- **‏`deck=level`** — ענף שלישי ב-`GET /api/study/queue`, שואל את `words` ⛔ ולא את
  `word_progress`. החוזה ב-`docs/api-contract.md` באותו קומיט.

### שלוש הכרעות שהן מדידה ⛔ ולא טעם

1. **החיתוך של `deck=level` הוא `slice` ⛔ ולא `selectDeck`.** ל-`sortQueue` ⛔ אין דירוג
   למיין לפיו — כל שורה בחפיסה הזאת לא-מתוזמנת — ולכן שובר-השוויון שלה היה מחליף
   **תדירות** ב**אלפבית**. «anchor לפני apple» הוא מילון, ⛔ ולא סדר לימוד. אותו נימוק
   מדוד שבגללו `loadNewWords` ⛔ אינו ממיין מחדש.
2. **הפעולה הראשית ב-`<DeckSelector>` נגזרת ⛔ ואינה מקודדת לאריח.** ‏`check:mobile` מפיל
   מסך שנושא משהו אחר מ**סימון אחד בדיוק** (F-027), והכלל הישן («`due` כשהוא פעיל»)
   ⛔ אינו יכול לשרוד אריח פעיל **מעליו**. עכשיו: האריח הפעיל **הראשון** בסדר של `36 § 5`,
   ⇒ הספירה היא אחת מעצם הבנייה.
3. **`locked` הופרד מ-`enabled` ומטקסט ההערה.** קודם המנעול נגזר מ-`entry.note === 'נעול'`;
   מאז T-210 ההערה היא **משפט עם מספר**, ואריח יכול להיות **נעול ולהציג את המספר**.
   ⛔ `enabled: false` עדיין ⛔ אינו מנעול: חפיסה ריקה מושבתת **עם המספר** (§ 4.2ו).

### חוב מוצהר, ⛔ ולא שקט

- 🔴 **F-140 — ל«סינון מילים» ⛔ אין נתיב כתיבה קביל.** `/api/practice:59` = 404 על מילה
  בלי שורת `word_progress` (בכוונה מוצהרת), וחפיסת הרמה היא בדיוק אוסף המילים האלה.
  ‏T-155ⓒ אוסרת את `/api/review`. ⇒ **האריח נמסר נעול עם המספר**, וההכרעה היא שורת PM.
  ⚠️ **וההשלכה השנייה חמורה מהראשונה:** גם כשהכתיבה תיפתח, `classifyProgress` מסווגת
  `attempts=1, repetition=0` כ-`in_review` ⇒ «ידעתי» על מילה חדשה היה נספר תחת «לא ידעתי»
  בפס שנבנה בטיק הזה. ⇒ **הסינון היה סופר הפוך.**
- 🟠 **F-141 — `withoutComments` בשומרי-המקור בולע קוד חי.** נמדד: `LevelMapScreen.tsx`
  **11,032 ⇒ 4,397** בתים, ו-`'/api/levels/current'` נעלם מ-`CODE` ⇒ **כל `not.toContain`
  בקובץ עבר ריק**. תוקן בשלושה קבצים; העותקים הנותרים הם שורת ריכוז.
- ⚠️ **`/settings` נכנס ל-`PROTECTED_SCREENS` ו⛔ אין לו פיקסטורת `/dev`.** ⇒ הוא ⛔ אינו
  נמדד ב-`check:mobile` (הוא עונה 307 בלי env), בדיוק כמו `/cards` לפני שנבנתה לו
  פיקסטורה. **חוב מוצהר**, ⛔ ולא השמטה: הטיק אימת אותו בהליכה ידנית בלבד.

### ולקח על הארגז עצמו, ⛔ ולא על המוצר

‏`check:mobile` נכשל שלוש פעמים ברצף ב-`ChunkLoadError` ובנתיב `/dev/card` — **⛔ ולא
בגלל הקוד**: `next start` שנשאר חי מטיק ההליכה על פורט 3000 המשיך להגיש **בנייה ישנה**,
והארנס התחבר אליו במקום להקים משלו. ⛔ **הוא ⛔ אינו מדווח על כך** — הוא מדפיס
«started next start» גם כשהפורט תפוס. ⇒ **להרוג כל `next start` לפני `check:mobile`**,
ולחשוד ב-`ChunkLoadError` כבשרת ישן ⛔ ולא כרגרסיה.

## C-0321 (DEV) — פרוסת `cards` B: צד הקריאה של «משפטים», והמספר שהחליף את המנעול

**המשימות:** `T-165` (צד הקריאה) · `T-199ⓑ ⓒ` (המספר על האריח). התוכנית:
`docs/superpowers/plans/2026-08-26-sentences-read-side.md`, ‏11/11 צעדים.

### מה נוסף לארכיטקטורה

- `lib/core/shuffle.ts` — טהור. `mulberry32` + `shuffle`, **מילה במילה** מ-
  `arcadeRound.ts:71-90`. `shuffle.test.ts` מחזיק את התמורות שנמדדו **לפני** ההעברה כזהב,
  ו-`arcadeRound.test.ts` נשאר ירוק ⛔ בלי שינוי ולו בציפייה אחת.
- `lib/core/sentenceCard.ts` — טהור (C-0498 · T-066 · D-156 · D-169). `SentenceItem` ⇒ `Card` בווריאנט השלישי `input: 'choice'`: `splitStem` · `completeStem` · `buildSentenceCard` · `gradeChoice` (התאמה מדויקת, ⛔ נרמול). ⛔ אין רכיב חדש — `<Flashcard>` מצייר את הענף, `<CardDeck>` גולל לפי `deckCardKey` (`wordId#itemIndex` — שני גזעים של מילה אחת הם שני כרטיסים).
- `lib/core/sentenceItem.ts` — טהור. מועמד ⇒ פריט: גזע, התשובה האנגלית, ושלוש אפשרויות (D-156 · C-0498, היה ארבע)
  **אנגליות** (D-023). ⛔ אפס React, DOM, שעון, רשת.
- ענף `deck=sentences` ב-`app/api/study/queue/route.ts`, באותה צורה בדיוק ש-`deck=level`
  כבר משתמש בה — ⛔ אפס מסלול חדש, ⛔ אפס קוד שגיאה חדש.

### חמש הכרעות הפיכות, ⛔ ולא שקטות — `RULES § 0.22`

⛔ **כל אחת מהן: קומיט אחד מבטל.** רשומות כאן ⛔ ולא בהערה בקוד בלבד.

1. **`DeckName` פוצל ל-`DeckName` + `FlashcardDeckName`** (גבול מודול · שמות פונקציות).
   ⛔ **⛔ לא טעם:** `app/study/page.tsx:34` מסר עד היום כל שם חפיסה ל-`buildCard`, שבונה
   כרטיס דו-כפתורי. פריט השלמה ⛔ אינו כזה ⇒ `/study?deck=sentences` היה מסך שבור מ-URL,
   מחלקת F-027. `Exclude` הופך את זה ל**שגיאת הידור**.
2. **`translation_confidence` ⛔ אינו נשלף ו⛔ אינו מסונן במסלול**, בסטייה מ-
   `SENTENCES_SELECT` שהתוכנית ציטטה. D-013 נאכפת ב-RLS
   (`0003a_low_confidence_is_visible.sql:38-49`) — **שליפת עמודה שאיש ⛔ אינו קורא נקראת
   כמסנן שנשכח**, ועותק שני של הכלל הוא כלל שני שיכול לסטות.
3. **תשובת `deck=sentences` היא `items` + `seed`, ⛔ ולא `cards`.** פריט השלמה ⛔ אינו
   כרטיס, ולחיצתו לצורת `QueueCardInput` הייתה שדה ריק בכל כרטיס. ה-`seed` נגזר מהשעון
   ונוסע בתשובה — בדיוק הדפוס של `app/api/arcade/round/route.ts:97`.
4. **הזוגות (מועמד, גזע) משוטחים לפני ההגרלה** ⛔ ולא אחריה: מועמד נושא עד שלושה גזעים,
   והגרלה ברמת המועמד הייתה נותנת ללומד שלוש שאלות רצופות על אותה מילה.
5. **«נעול» עברה משורת ההערה ל-`sr-only`** (ניסוח מחרוזת ממשק שאינה תוכן לימוד).
   D-096 פוסלת אריח מושבת בלי מספר, ו-`render_video_A.py:290,296` ⛔ אינו מצייר שורה
   שנייה שאינה מספר ⇒ המילה ⛔ לא יכלה להישאר שם. אבל `LockIcon` הוא `aria-hidden`
   בכוונה, ולכן **מחיקה** הייתה משאירה את הנעילה בלי ערוץ שקורא מסך שומע — שכבה A.
   נמדד בדפדפן: `1×1`, `position:absolute` ⇒ ⛔ אפס פיקסל של סטייה מהרנדר.
   ⚠️ **ורווח נלווה:** «סינון מילים» היה נעול **בלי מילה** מאז C-0318, ועכשיו יש לו אחת.

### חוב מוצהר, ⛔ ולא שקט

- ⛔ **T-165ⓒ (הדירוג) ⛔ לא חובר.** חפיסת משפטים היא מילות הרמה ⇒ לרובן ⛔ אין שורת
  `word_progress`, ו-`app/api/practice/route.ts:59` עונה **404** בדיוק עליהן. זה **F-140**
  בחפיסה שנייה, והוא הכרעת מכניקה של ה-PM. חיווט כתיבה לפניה היה **מטביע** את המכניקה
  ש-F-140 נפתח כדי להגן עליה. בדיקות סורקות שהענף ⛔ אינו מכיל `insert/update/upsert`
  ושהקובץ ⛔ אינו מכיל `/api/review` **בשם**.
- ⛔ **המסך ⛔ לא נבנה — F-143.** ⛔ אין `kol-A-*` לחפיסת משפטים, ו-`§ 4.2ו` ⛔ אינה קובעת
  מה כתוב על הכרטיס (F-052). ההוראה הקבועה של DEV מפורשת: משימת ממשק בלי רנדר ובלי מדור
  במסמך עוגן ⇒ ⛔ אין להמציא.
- ⛔ **T-199ⓐ (האריח מנווט) ⛔ לא נעשה — F-142.** `36 § 5` מונה שתי חפיסות והרנדר מצייר
  שתיים; האריח השלישי חי רק כי `§ 4.2כ ד׳` **הצהירה** על הסטייה, ולרביעי ⛔ אין הצהרה.
  ובמקביל `36 § 6` והטבעת שנמסרה נושאות את `sentences` כצומת `locked_infra`
  (`worldRing.ts:78,138`). ⇒ שני בתים לפיצ׳ר אחד, וההכרעה היא של ה-PM.

### ולקח על הרנדר, ⛔ ולא על המוצר — F-144

**הליכה במסך ⛔ אינה רק ספירת יעדי מגע.** ‏C-0320 מדד את `/dev/tabs/cards` והכריז אותו
נאמן לרנדר — על מחרוזות, מונים ויעדי מגע. הטיק הזה מדד את **הקופסה** באותו מסך ומצא
`x=20 · w=335 · h=78 · r=16` מול `x=24 · w=327 · h=62 · r=18` ברנדר. ⇒ **פער בן 16px
בגובה, שלושה טיקים בלי שאיש ימדוד אותו.** ⚠️ ו-`r=18` שהרנדר מצייר ⛔ אינו בסולם חמשת
הרדיוסים של שכבה ב׳ ⇒ ⛔ **אי-אפשר** לבנות «כמו שצויר» ולהישאר בסולם, וזו סתירה בין שני
מסמכים מחייבים. ⛔ **⛔ לא נסגר כאן** (§ 0.22 — סתירה למסמך עוגן היא של ה-PM), ⛔ ולא
נסגר במשפט «הגימור בא מהחוקה» — בדיוק המשפט ש-D-114 ביטלה.

---

## פיקסצ׳ר שמדבר בשפת הלומד בזמן שהייצור מדבר בשפה אחרת ⛔ אינו בדיקה  ⟦C-0323 (DEV) · T-152 · D-087⟧

`arcadeRound.test.ts:19` הזין למועמד `distractorsHe: ['מסיח-א', 'מסיח-ב', 'מסיח-ג']`.
בייצור אותו שדה נטען מ-`sense_distractors`, שהוא **אנגלית**: `translation_he:"עבודה"`
מול `[rest, play, word, window]` (`batch-2026-08-07.jsonl` שורה 1). ⇒ כל בדיקות הזירה
היו ירוקות בזמן שהמסך הגיש ללומד **מחרוזת עברית אחת מול שלוש לטיניות**, כלומר תשובה
נכונה בבחירה לפי א"ב, ⛔ בלי לדעת ולו מילה. **זו אותה משפחת כשל בדיוק** שנמדדה ב-23/08
על `/arcade` — ⛔ ולא הישנות שלה: זהו **אותו חור** שהתגלה שוב בשכבה שמתחתיו.

**מה שנבנה:** שלושת המסיחים הם `levelTranslations(pool)` — התרגומים העבריים של
**מועמדים אחרים באותה רמה**, ייחודיים, בסדר הקלט. ⛔ אפס מיגרציה · אפס תוכן חדש ·
אפס מקור חדש: המאגר כבר היה בסקופ, שורה אחת מעל.

**שלוש הכרעות ששווה לזכור:**

1. **המסיחים נמשכים מ`pool` ⛔ ולא מ`window`.** החלון הוא פרוסת התדירות של הקרב;
   צמצום המסיחים אליו היה מקטין את המאגר ל-15 מחרוזות בלי ולו סיבה לימודית אחת.
2. **הכשירות עברה מהמילה אל הרמה.** `isEligible` חדל לדרוש שלושה מסיחים למילה — הדרישה
   הזאת נמדדה על נתון שאיש ⛔ אינו רואה. מה שנשאר הוא מה שהשאלה באמת צריכה: band + תרגום
   לא ריק. המחסור נמדד **ברמה**: אין ארבעה תרגומים שונים ⇒ השאלה **יורדת מהסיבוב**.
3. **⛔ אין נפילה חזרה לאנגלית, ⛔ ואין «שלוש אפשרויות».** סיבוב שירד מתחת ל-`ARCADE_AMMO`
   מדווח `level_too_small` — בדיוק המסלול שהמסך כבר יודע לצייר (D-046). ⛔ מסלול שלישי
   היה מחזיר את החור בערוץ אחר.

**והשם:** `distractorsHe` ⇒ `distractorsEn`. השדה נשאר בטיפוס **בלי קורא**, ו-
`arcadeRound.test.ts` סורק את גוף `buildRound` ונופל **בשם** אם מישהו יחזיר אותו
ל-`options`. ⚠️ שם ששיקר הוא מה שאִפשר לחור לשרוד ביקורת: «מסיחים בעברית» נקרא נכון
בכל דיאגרמה, בזמן שהנתון היה אנגלי.

⛔ **מה ⛔ לא נעשה, במכוון:** `sense_distractors!inner` נשאר ב-`ROUND_SELECT`. הוא כבר
⛔ אינו מספק אפשרויות, אך הסרתו **מרחיבה את הבריכה ומשחררת נעילות רמה שהלומד רואה** —
שינוי מכניקה ⇒ טבלת § 0.22 שולחת אותו ל-PM. **F-146**, והבדיקה בנתיב מחזיקה את המצב
הנוכחי **בשם** כדי שהיא תאדים ביום שההכרעה תגיע.

---

## C-0325 · הזירה מקבלת שעון — ו-`arcadeBattle` נפרש באותו קומיט

**מה היה.** ‏`/dev/arcade` נמדד 26/08: **134 תווים · ⛔ אין כותרת · ⛔ אין שעון**, ומדידה
שנייה על **המקור** —
`grep -rn 'setTimeout\|setInterval\|deadline\|Date.now' lib/core/arcade*.ts components/Arena*.tsx`
— החזירה **אפס מופעים בקוד ריצה**: ארבעת המופעים היו **איסורים** (שתי בדיקות שומר ושתי
הערות). ⇒ הזמן שהלומד רשאי לשהות על מילה בזירה היה **בלתי חסום**, ומילה שנפתרה ב-1.2
שניות ומילה שנפתרה ב-60 שניות טופלו **זהה לחלוטין** בכל שורה בקוד.

⚠️ **ולמה זה היה חשוב יותר מכל פער חזותי:** `37 § 1` היא טבלה של שתי עמודות — כרטיסיות
מאמנות **רכישה** (אחזור מאומץ, SM-2, ולחץ זמן **מזיק** שם), והזירה מאמנת **אוטומטיות**,
שבה לחץ הזמן **הוא המנגנון** ⛔ ולא קישוט. ⇒ **בלי שעון, הזירה ⛔ אינה זירה — היא עותק
שני וגרוע של הכרטיסיות.**

**ההכרעה המרכזית: השעון הוא פרמטר, ⛔ ולא טיימר.** ‏`lib/core/battle.ts` ⛔ אינו מכיל
`setTimeout` · `setInterval` · `Date.now` · `requestAnimationFrame`. הוא מקבל `elapsedMs`
כ**קלט** בכל קריאה, ולולאת ה-`requestAnimationFrame` **היחידה** חיה ב-
`components/ArenaBattle.tsx`. שלוש סיבות, וכולן מדידות:

1. **בדיקת השומר שורדת במקום להימחק.** האיסור בקובץ **משנה משמעות** — «⛔ אין שעון
   נסתר» במקום «⛔ אין זמן» — ⛔ ולא נמחק. מחיקת שומר בלי שהוא מוחלף היא מה שהפיל את T-164.
2. **90 שניות נבדקות ב-0 שניות.** קצב היריב, `זמן זעם` ותקרת המאנה נבדקים בלי להמתין
   ולו שנייה ב-CI. טיימר אמיתי היה מוסיף 90 שניות לכל `npm run verify`.
3. **`prefers-reduced-motion` נשאר עניין של המסך בלבד** (שכבה א׳ · א7) ⇒ לומד שכיבה
   תנועה מקבל **אותו קרב בדיוק**, ⛔ ולא גרסה קלה או קשה יותר.

**⛔ והפרישה ⛔ לא נדחתה.** ‏`lib/core/arcadeBattle.ts` · `arcadeBattle.test.ts` ·
`components/ArenaBoard.tsx` · `ArenaBoard.test.ts` נמחקו **באותו קומיט** שבו הבמה החדשה
נולדה. הנימוק כתוב בלשון הקובץ הנמחק עצמו (`arcadeBattle.ts:19-20`): «שני מקומות למספר
אחד הם עותק שני של החוק, **והשני תמיד סוטה**». ⇒ ⛔ אסור ששני חוקי קרב יחיו על `dev`
ולו קומיט אחד.

**גבול מודול שנקבע כאן (`RULES § 0.22` — קריאה של DEV):** הבמה החדשה היא **קובץ חדש**,
`components/ArenaBattle.tsx`, ⛔ ו-`ArenaStage.tsx` ⛔ לא הורחב. ⛔ זו ⛔ אינה העדפה:
`components/ArenaStage.test.ts` אוסר במפורש `useState` · `useEffect` ·
`requestAnimationFrame` בתוך `ArenaStage`, ⇒ לולאת הזמן ⛔ אינה יכולה לחיות שם.
`<ArenaStage>` נשאר **ציור טהור של שתי הדמויות**, כפי שהוא נכתב.

**שלוש הכרעות קטנות ששווה לזכור:**

1. **`BattleOutcome` נושא ארבעה ערכים ⛔ ולא שלושה** (D-126 § ד׳). ההערה הישנה
   («⛔ שני מוצאים … «הפסד» אינו מצב») **בוטלה**: `37 § 3` קובע «בתום השעון מנצח אחוז
   החיים הגבוה» ⇒ הפסד **הוא** מצב. ⛔ **והמילה «הפסדת» ⛔ אינה מופיעה על המסך אף פעם** —
   השומר ב-`app/api/arcade/result/route.test.ts` הועבר לשמות הקבצים החדשים ⛔ ולא רוכך.
2. **פס היריב מציג אחוז, ⛔ ולא HP גולמי.** הרנדר מצייר `100/100`, ו-
   `render_video_B.py:475` מראה מה זה באמת: `f"{int(st['hp']*100)}/100"`. הסולם הפנימי
   נבחר כך שהקרב יהיה **מרוץ** (11 מכות יריב מול 12 חיי לומד), ⛔ ולא 11% נזק בקרב שלם.
3. **`mixArenaWords` קיבלה צרכן ביום שנולדה** (⛔ ולא קוד מת — F-074). מה שנמסר לה היום
   הוא **שורה 1 בטבלה של `37 § 2`**: קריאת מחסן ה«ידעתי» ⛔ אינה בפרוסה, ⇒ כל מילה היא
   מילת בסיס — כלומר בדיוק ענף «מחסן ריק ⇒ 100% מילות בסיס», ⛔ ולא עקיפה.

⛔ **חוב שנרשם, ⛔ ולא נסגר:** **F-147** — ארבעה אזורים ברנדר שאינם על המסך. שלושה מהם
הוצאו **בתחולת התוכנית** (§ 7) ומכוסים ב-T-178…T-182 · T-153; הרביעי (כפתור השהיה)
הוא **מכניקת קרב** ⇒ PM.

⚠️ **ולקח תשתית שיחזור:** ‏`next dev` בארגז החול מחזיר **403 על נתחי הלקוח** ו-HMR נופל
⇒ הדף ⛔ אינו מתאחה, השעון קפוא והקשה ⛔ אינה עושה דבר. **הליכת ראייה על `next dev`
מודדת מסך מת ומדווחת «לא נבנה» על קוד תקין.** ⇒ ההליכה רצה על `next start`.

### C-0329 · פרוסה B של הזירה — מודול טהור **שלישי**, וההפרדה שהוא נושא

**המודול החדש: `lib/core/arenaGesture.ts`.** הוא עונה על שאלה **אחת** — *איזו מחווה זו
הייתה* — ו⛔ לעולם לא על *מה היא עושה*. ההשלכה נשארת ב-`lib/core/battle.ts`, במקום שבו
השעון כבר חי.

⛔ **וזה גבול מודול, ⛔ ולא סגנון קבצים.** תרחיש הכשל שהשורה של `T-178` מנסחת —
«גרירה אלכסונית מזיזה את הדמות **וגם** משגרת לחש» — הוא מה שקורה כששני מטפלי אירועים
מכריעים בנפרד. ⇒ `resolveGesture` מקבל `source: 'card' | 'stage'` ומחזיר **ענף אחד**:
מחווה שהתחילה על קלף ⛔ אינה יכולה להזיז דמות, ומחווה שהתחילה על הזירה ⛔ אינה יכולה
להטיל. **נמדד בהליכה חיה:** גרירה של 200px לצד על קלף ⇒ חיי היריב `100 → 100`.

**שלושת המספרים ⛔ אינם מועתקים.** ‏`SWIPE_EDGE_PX` ו-`SWIPE_MAX_ANGLE_DEG` מיובאים
מ-`lib/core/swipeGrade.ts`, שכותב במפורש שהם **נמדדו** (רצועת ה-back-swipe של iOS ·
הסף שמפריד מחווה מגלילה מעט אלכסונית) ⛔ ולא נבחרו. עותק שני שלהם הוא מספר שיסטה.

**הטלגרף — העגנה שהיא חשבון, ⛔ ולא המצאה.** ‏`37 § 6` קובע טלגרף של **6.0 שניות
שנגמר במכה**, ו-`§ 3` קובע מכות **8.0 שניות זו מזו**. שתיהן מתקיימות בסידור **אחד**:
הטעינה של מכה `n` מתחילה ב-`n·8000 − 6000`. ⛔ `tick` לא השתנה בקצב — המכות עדיין
נוחתות ב-`n·8000`. **נמדד פר-פריים בדפדפן:** `charging` ⇒ `window` ב-6,142ms ⇒
`committed` ב-6,542ms ⇒ שקט ב-6,842ms, מחזור 8,000ms. ⇒ ארבע שורות הטבלה של `§ 6`.

**החסינות שייכת למכה, ⛔ ולא ל«נזק».** ‏`BattleState.dodgedSwing` נושא **מספר מכה אחד**,
ו-`tick` מבטל את המכה הזאת בלבד. ⛔ אם שתי מכות התאחדו בפריים (חלון שנרדם, מכשיר איטי)
— השנייה עדיין פוגעת. «התגלגלתי פעם אחת ולא נפגעתי שלוש» הוא בדיוק סוג החור ש-2,867
בדיקות ירוקות ⛔ אינן תופסות אם אף אחת מהן ⛔ אינה מנוסחת עליו.

**⚠️ חוב פתוח שנמדד ⛔ ולא הוכרע — F-148.** המחווה מוכרעת ב-`pointerup`, ⇒ החלון
האפקטיבי הוא `400ms − משך ההחלקה`. החלקה של **38ms** נחתה ✅; החלקה של **~300ms**
שנפתחה באותו חלון ⇒ ⛔ כלום. `§ 6` ⛔ אינו אומר אם החלון נמדד בהתחלה או בשחרור ⇒
**מכניקת למידה** ⇒ PM.

⚠️ **ולקח תשתית שני, שנמדד ב-C-0329 ועלה שתי קריאות שווא:** ‏`next start` שרץ על
תיקיית `.next` שנבנתה **מחדש תחתיו** מגיש נתחי CSS בהאשים ישנים ⇒ **404/500 על כל
מסך**, הדף מוגש בלי סגנון, `check:mobile` מדווח «console errors» על קוד תקין, וההליכה
החיה מודדת מסך שבור. **נמדד:** `בלוק הקלף = <span>אפשרות 1</span>` (מבנה של פרוסה A)
מול הקוד החדש שכבר היה בדיסק. ⇒ **`rm -rf .next` ובנייה נקייה לפני כל הליכה חיה**,
ו⛔ אף פעם ⛔ אין `next start` חי בזמן `npm run build`. ⛔ אחי F-147ⓔ, באותה משפחה.

### C-0331 · פרוסה C של הזירה — מודול טהור **רביעי**, והלולאה האינסופית היחידה במוצר

**המודול החדש: `lib/core/arenaSummary.ts`.** הוא עונה על שאלה **אחת** — *מה קרה
ב-90 השניות* — ו⛔ לעולם לא על *מה צריך לקרות עכשיו*. קלטו היחיד הוא `BattleState.casts`,
שכבר מלא, ⇒ הפרוסה כולה ⛔ אינה כותבת ולו שורה אחת (אינווריאנט `37 § 13.1`).

⛔ **מסך התוצאות הוא רכיב, ⛔ ולא מסלול — וזו הכרעת גבול מודול ⛔ ולא נוחות.** שורת
`T-180` נוקבת ב-`app/arcade/results/*`, אבל הקלט היחיד של הסיכום חי ב-`useState` בתוך
`components/ArenaBattle.tsx:197`, ומעבר מסלול **הורס אותו**. שתי הדרכים חזרה הן סיבוב
`sessionStorage` או כתיבת שרת שנייה — ⛔ ושתיהן אסורות בפרוסה הזאת. ⇒ רכיב, ועוד
פיקסצ׳ר `/dev/arcade/summary` שנכנס ל-`check:mobile` (‏1,158 → **1,176** בדיקות).

**⛔ שני ערכים ⛔ לא הועתקו מהרנדר, וכל אחד עם המספר שנמדד:** רדיוס שורת הסטטיסטיקה
הוא **13** (`render_video_B.py:618-620`) ⛔ ואינו אחד מחמשת ערכי הסולם ⇒ `rounded-xl`
**12**, סטייה **1px** (אותה צורה כמו F-144); משרעת ה-idle היא **2.2** (`:124`) מול גדר
ה-**≤2px** של שורת `T-119` ⇒ **0.2px**. ⛔ נמדדו בגְרֶפּ על מקור הרנדר, ⛔ לא נצפו על PNG.

**🔴 F-154 — הרנדר סותר את עצמו, ונמדד ⛔ ולא שוער.** ‏`:612-614` מצייר `14 / 16`
ו«רצף מרבי **4**» באותו לוח. ‏14 נכונות מתוך 16 משאירות **2** שגויות, ששוברות את
הנכונות ל-**3** רצפים לכל היותר ⇒ הרצף המרבי הוא לפחות `ceil(14/3) = 5`. ⇒ הפיקסצ׳ר
שולח **5**. ⛔ **וזה בדיוק הלקח של 23/08 בכיוון ההפוך:** «להתאים» את `summarize()`
לרנדר היה מחייב הגדרה שנייה ל«רצף» — ופיקסצ׳ר שנבדל מהמציאות בממד כלשהו הוא חור.

**הלולאה האינסופית — למה היא על העוטף ⛔ ולא על הדמות.** ל-`[data-arena-figure]` כבר
יש `transition: transform`, ו-`hit`/`dodge` מזיזים אותה ב-`translateX`. אנימציה על אותו
`transform` הייתה **דורסת** את שתי התנוחות בכל פריים. ⇒ `<span data-arena-idle>` עוטף
את הגיבור, ושני מאפיינים על שני אלמנטים מפרידים ביניהם ⛔ בלי ולו `if` אחד.
**נמדד בדפדפן ב-375×780:** משרעת **2.000px** (‏133 דגימות `rAF`), ותחת
`prefers-reduced-motion: reduce` ⇒ **0.000px**, `animation` מחושב `none`.

⚠️ **ותקרת 300ms של הבמה ⛔ לא נמחקה — היא צומצמה בשמה.** הדרך הזולה הייתה למחוק את
הבדיקה; במקומה בלוק `arena-idle` **בלבד** מוסר לפני המדידה, וכל שאר כללי הבמה עדיין
נמדדים מול 300ms. **שומר שנמחק כדי לקנות שורה אחת הוא שומר שאיש לא יחזיר.**
⛔ **וההערה המתה נמחקה באותו קומיט:** «⛔ מעבר, ⛔ ולא לולאה» ו«⛔ אין כאן כלל ל-`idle`»
ישבו בראש בלוק הבמה וחדלו להתקיים — הוראה מתה בקובץ חי היא הוראה שמישהו עוד יציית לה.

### C-0332 · לזירה יש פלטת משטחים ו⛔ אין לה שכבת טקסט — הקלף היה המדגם, ⛔ לא הפגם

**מה שנפתח כ-F-149ⓐ («הרנדר ממלא `#182138`, הרכיב ממלא `#34323f`») ⛔ לא היה יכול
להיסגר כהחלפת ערך אחד**, וזו ההכרעה המבנית של הטיק. ‏`--ink` ו-`--ink-muted` נקבעים
ב-`app/globals.css` לפי `prefers-color-scheme`, ו-`[data-arena-scope]` ⛔ אינו דורס
אותם. ⇒ בסכימה **בהירה** — ברירת המחדל של `:root`, ⛔ לא קצה — תווית קלף הלחש נמדדה
**1.42:1** על המילוי הישן, והחלפת המילוי בלבד הייתה מורידה אותה ל-**1.12:1**.
⛔ **כלומר סגירת הפער מול הרנדר, כפשוטה, הייתה מעמיקה הפרת שכבה א׳.**

**⇒ הדיו נלקח מהרנדר, ⛔ ולא נבחר.** אותו דפוס בדיוק שבו T-179 לקחה את `--arena-cast`:
`--arena-card` = `:265` · `--arena-ink` = `:277` · `--arena-ink-dim` = `:248`
(`ELEM_COL['unknown']`). **נמדד חי ב-`next start` · 375×780 · בשתי הסכימות:** מילוי
`rgb(24, 33, 56)` בדיוק, תווית **15.61:1** ב-**light וגם ב-dark**, ⛔ אפס מתחת ל-44px,
⛔ אפס גלילה אופקית, ⛔ אפס שגיאות קונסולה.

⚠️ **והשומר הוא זה שהופך את זה לגדר ⛔ ולא להצהרה:** `app/arcade/page.test.ts` טוען
שקבוצת ה-hex בקובץ הטוקנים **שווה** ל-`ARENA_HEXES` — ⛔ לא «מכילה». ⇒ ערך רביעי
⛔ אינו יכול להיכנס בלי שורה בבדיקה, ופסקת ההסבר של הבדיקה נושאת את מקור כל ערך.
⛔ **וזה גם מה שהפיל אותי פעם אחת בטיק הזה:** ה-hex שכתבתי בתוך **הערה** ב-CSS נספר
כטוקן זירה — הבדיקה סורקת גולמי. הערך ⛔ הוסר מההערה ⛔ ולא מהבדיקה.

**⛔ ומה ⛔ לא נסגר, כל אחד עם המספר שנמדד ⛔ ולא הוערך:**
- **F-155 🟠** — הפגם הרחב: ל-`<section data-arena-scope>` ⛔ אין רקע כלל
  (`getComputedStyle` ⇒ `rgba(0, 0, 0, 0)`) ⇒ המסך יורש `--surface`, כלומר **לבן**
  בסכימה בהירה, בעוד הרנדר צובע את הבמה כולה כחול־ליל. התיקון הישיר סותר משפט כתוב
  בראש `arcade-tokens.css` ⇒ **הכרעת PM**, ⛔ ולא בחירת מימוש.
- **F-156 ⚪** — מסגרת הקלף `--arena-stone` על המילוי החדש = **1.8:1**, מתחת לרצפת
  ה-3:1 של רכיב לא-טקסטואלי. הטוקן **מוזג וחי** מ-T-177 ⇒ ⛔ לא נגעתי בו.
- **F-157 🟠 · וזה החשוב שבשלושה:** `grep` מחזיר **אפס** שורות משימה שמצטטות את
  `38-character-base.md`. **למסמך עוגן ⛔ אין בעלים.** ‏`38 § 4` מונה **אחת־עשרה**
  שכבות; `ArenaAvatar.tsx` מצייר **ארבע** ⇒ ⛔ אין שיער ו⛔ אין נשק. ⇒ **T-182 ⛔ אינה
  בת-בנייה** (א4 הוא בדיוק שלוש השכבות האלה), ו-`38 § 5` אוסר להעתיק את הספרייטים.
  ⚠️ **הפער נמדד פעמיים** — `2026-08-27-arena-slice-b-gestures.md:89` כתב אותו ב-C-0327
  ⛔ ומעולם לא הגיע לפנקס. **פער שחי בתוך תוכנית ⛔ ולא בפנקס הוא פער שאיש ⛔ אינו רואה.**

### C-0334 · לזירה יש עכשיו **משטח משלה**, ולכן היא חדלה לרשת את `prefers-color-scheme`

**T-214 · D-130 מסלול ⓘ · D-134.** ‏C-0332 סגר את הדיו של הקלף; C-0333 מדד את המסך כולו
ומצא ש-`<section data-arena-scope>` מחזיר `rgba(0, 0, 0, 0)` — ⇒ **הזירה ציירה טקסט על
רקע ה*עמוד***, שמתחלף לפי הסכימה של הטלפון.

**המבנה אחרי הטיק, בשורה אחת:** `[data-arena-scope]` מצהיר `background: var(--arena-night)`
ו-`color: var(--arena-ink)`, ו**כל** צומת טקסט בזירה קורא שם של טוקן זירה. ⛔ הסקופ
⛔ אינו דורס את `--ink`/`--ink-muted` — דריסה הייתה מכניסה hex של `globals` לקובץ הזה,
ו-`app/arcade/page.test.ts` סורק אותו **גולמי** ונופל על כל hex שאינו של הזירה.

**המשפט שתוקן, ⛔ ולא נשבר בשקט:** `arcade-tokens.css:10-11` קבע «כל טוקן סמנטי אחר
(רקע, מסגרת, `--brand`) ממשיך להגיע מ-`globals.css`». הוא **הוחלף באותו קומיט** ב-«הזירה
מספקת רקע משלה ודיו משלה, ולוקחת את השאר». ⚠️ אינווריאנט `37 § 13.5` ⛔ לא נחלש.

**מה שהמדידה גילתה ו⛔ התוכנית ⛔ לא צפתה:** `render_video_B.py` מצייר את הבמה בערכי
הסכימה ה**כהה** של `globals` ⇒ ברגע שהרקע נהיה כחול־ליל בשתי הסכימות, **כל** אלמנט
שעדיין קרא טוקן של `globals` נפל ב**בהירה** — `מאנה` 1.97:1 · `0 / 10` 2.23:1 · הרמז
והערת הבידוד 1.97:1 · מילוי מד המאנה **1.90:1** מול המסילה שלו · והאיקס של «סגור»
**1.27:1**. ⇒ הפער נסגר לרוחב המסך, ⛔ ולא לשלושת הצמתים ששמם היה בשורה.

**חוב מוצהר, ⛔ ולא מוסתר:** `--danger` ו-`--brand-surface` יצאו מהזירה, ובמקומם
`--arena-hp` (ערך הרנדר `:474`, מוגה כלפי מעלה בשכבה א׳ עד **5.02:1** מול דיו הזירה) ·
`--arena-hp-track` (`:471`) · `--arena-mana` (`:299`). שלושתם **נמדדו מהרנדר**, ⛔ ולא
נבחרו, והם scoped לזירה כמו קודמיהם.

**השער — בלוק 2c ב-`scripts/verify-mobile.mjs`, per-SCREEN ⛔ ולא per-component (D-134).**
ל-`/dev/arcade`, ב-375×780, ב**שתי** הסכימות: כל צומת טקסט מצויר · כל אייקון של **פקד** ·
ומסגרת הקלף הלא-נבחר, מול המילוי ומול הבמה. **הרקע האפקטיבי נלקח מ-`elementsFromPoint`
⛔ ולא מטיפוס אבות** — מספר חיי היריב מצויר **מעל** אח ממוקם אבסולוטית, וטיפוס אבות היה
מדווח את צבע המסילה ומאשר מספר שאיש אינו יכול לקרוא.

⚠️ **שתי בדיקות מוטציה, ⛔ ולא אחת:** הסרת ה-`background` בלבד ⇒ נופל בשם על
`זמן קרב` **2.1:1** · `הקוסם` **1.35:1** · `1:30` **1.02:1**; הסרת כלל ה-«סגור» בלבד ⇒
נופל בשם על `close` **1.19:1**. ⛔ שער שמעולם לא נפל הוא שער שאיש לא מדד.

**גבול השער, מוצהר:** הוא מודד **אייקוני פקדים** ⛔ ולא ציור SVG — פותר הרקע קורא
`background-color` ו⛔ אינו רואה `fill` של `<rect>` בתוך SVG (`F-159`). דמויות הבמה עצמן —
`F-158`, ותיקונן שייך ל-T-215 שממילא משכתבת את `ArenaAvatar`.

---

## C-0335 (DEV) — שפת האנימציה של הזירה, ובסיס הדמות · T-182 · T-215

**א1 + א2, ⛔ ולא עשר (`37 § 11` · D-133 § א׳).** המפרט מונה עשר טכניקות ומכריע
שא1 · א2 · א4 נותנות את השינוי הגדול ביותר; א4 יצאה ל-`T-216` כי היא נוקבת בגלימה,
בשיער ובחרב, ו-F-157 ⓑ מדד ש⛔ אין לרכיב שתיים מהשלוש. א1 ו-א2 ⛔ אינם דורשים
ולו שכבה אחת — הם **תזמון ופילטר**, ולכן הם נבנו קודם.

**⛔ הקיפאון ⛔ אינו טיימר, וזה מבנה ⛔ ולא סגנון.** `[data-arena-stage-area]` נושא
`data-arena-impact` שמתחלף `a`⇄`b` בכל פגיעה — **החלפת שם האנימציה היא מה שמאתחל
אותה בדפדפן**, וערך חוזר ⛔ אינו מאתחל, ⇒ שתי פגיעות בתוך 120ms מקבלות שני קיפאונים.
האנימציה הנושאת ⛔ אינה מקשטת דבר: היא ה**שעון**, ו-`onAnimationEnd` הוא מה שמשחרר.
⇒ המשך חי ב-`--arena-hitstop-ms` ו⛔ אין ולו `setTimeout` אחד בנתיב (`36 § 14` · T-041).

**שני המספרים נגזרו מ-`FPS = 30` (`render_video_A.py:16`), ⛔ ולא נבחרו:** פריים =
33.3ms ⇒ `--arena-hitstop-ms: 120ms` (3.6 פריימים, בתוך 100-130 של א1) ·
`--arena-impact-ms: 66ms` (2 פריימים בדיוק, בתוך 1-2 של א2). שניהם **טוקנים** בקובץ
הזירה, ⛔ ולא ליטרלים ברכיב — והבדיקה קוראת אותם משם ⛔ ואינה נוקבת בהם בעצמה.

**א2 משתמש בדיו של T-214, וזה הצימוד שהכניס את שתי השורות לתוכנית אחת:** בלי דיו
משלה, לזירה ⛔ לא היה צבע צללית שאינו מתחלף עם `prefers-color-scheme`.

**⛔ תחת `prefers-reduced-motion` — שני מחסומים, ⛔ ולא אחד.** הרכיב ⛔ אינו מציב את
התכונה כלל, ובלוק `@media` מנטרל את ההשפעה גם אם הוצבה. ⚠️ **והנושאת ⛔ אינה מכובה
שם** — `animation: none` עליה היה מונע את `animationend` והבמה הייתה קופאת **לנצח**;
הבלוק הגלובלי (`app/globals.css:103`) מוריד אותה ל-`0.01ms`, וזה מספיק. ⛔ מוטציה
שכיבתה אותה **דרך הסלקטור** עברה את הניסוח הראשון של הבדיקה בשקט — הבדיקה שוכתבה
למדוד **מה מכובה**, ⛔ ולא אם המחרוזת `arena-hitstop` מופיעה.

### בסיס הדמות — `38 § 3` · `§ 4` (T-215)

**הגיאומטריה יצאה מהרכיב.** `lib/core/characterBase.ts` טהור (`check:core` OK) ונושא
את שבע נקודות העיגון מילה במילה ואת סדר אחת־עשרה השכבות. ⛔ **שלושה צרכנים לאותו
שלד** — הבמה, מסך הסיום, ו-`T-216` שתזיז שלוש שכבות בפיגור — ⇒ קבועים ברכיב היו
שלושה עותקים שסוטים. `ArenaAvatar` עבר מ-**4** שכבות ל-`LAYER_ORDER.map`, וסדר הרנדור
⛔ אינו נשמר עוד בזכות סדר הכתיבה בקובץ.

**⛔ «פריט פסול» הוא ענף בקוד, ⛔ ולא משפט במסמך.** `38 § 3` קובע שפריט שאינו מתיישב
על נקודת עיגון קיימת הוא פסול; `anchorFor` **זורק**. ⚠️ והבדיקה תפסה חור אמיתי:
`ANCHORS['toString']` מחזיר את הפונקציה של `Object.prototype` — כלומר ערך אמיתי ⇒
בדיקת `=== undefined` ⛔ לא הייתה יורה, והשלד היה נפרץ דרך שם ירושה. ⇒ `hasOwnProperty`.

**F-158 נסגר במחיקה, ⛔ ולא בצביעה.** הלוח האטום שהיה שכבה 1 ⛔ אינו אחת מאחת־עשרה
השכבות של `38 § 4`, ולכן הוא ירד. **נמדד בדפדפן חי** (375×780, שתי הסכימות): הגיבור
**10.56:1** והיריב **6.88:1** על כחול־הליל, **זהה בשתיהן**. ובאותה מחיקה נסגר ערוץ
שני שלא היה בשורה — צללית האימפקט הייתה **מלבן** בגודל ה-`viewBox`, ועכשיו היא דמות.

**⛔ הרכיב ⛔ אינו יודע באיזה מסך הוא, וזה מכוון.** הוא מצויר גם ב-`ArenaResult`, שאינו
נושא `data-arena-scope`; שם ברירת המחדל של `globals` נכונה (**4.22:1**), וכאן היא
⛔ אינה — `--ink-muted` הבהיר נותן **1.97:1** על כחול־הליל. ⇒ ברירת מחדל ברכיב,
דריסה scoped בקובץ הזירה. ⛔ אפס `if` על מסך.

**פער מוצהר, ⛔ ולא נבלע — F-160:** `38 § 4` מונה אחת־עשרה שכבות ואחריהן דורש שהגלימה
תרונדר **פעמיים**. שתים־עשרה ⛔ אינה ברשימה, ובלוק ה-`Interfaces` שהוקפא ב-C-0333 נושא
את אותה סתירה. ⇒ מומשה הרשימה כלשונה, והחצי הקדמי ⛔ אינו מצויר. **הכרעה של PM** —
שינוי מספר השכבות סותר מסמך עוגן, ו⛔ אין ל-DEV רשות לכך (`RULES § 0.22`).

## C-0336 (DEV) — א4, תנועת המשך · T-216

### הפיגור הוא **מעבר**, ⛔ ולא מצב — ולכן הוא אנימציה ⛔ ולא `transition-delay`

`37 § 11` א4 דורש ש**הגלימה, השיער והחרב יפגרו 2 פריימים אחרי הגוף**. הגוף זז דרך
`transform` על ה-`<svg data-arena-figure>`, ושלוש השכבות יושבות **בתוכו** ⇒ הן יורשות
את התזוזה **מיד**, ⛔ ואין דרך «לעכב» ירושה.

⛔ **ו-`transition-delay` על השכבה ⛔ אינו פותר את זה, וזה נמדד ⛔ ולא שוער:** מצב
המנוחה של התיקון הוא **אפס** (השכבה יושבת על הגוף) ומצב התנוחה שלו הוא **אפס** גם הוא
(השכבה **מדביקה** את הגוף) — ומעבר בין שני ערכים זהים ⛔ לעולם ⛔ אינו נורה. ⇒ הפיגור
הוא **תיקון חולף**: אנימציה שמתחילה `--arena-follow-x` מאחור ומתאפסת על עקומת הגוף.

⛔ **ואין כאן תעלול `a`/`b` כמו ב-א1, וזו ⛔ אינה השמטה:** התנוחה נגזרת מה-`cast`
האחרון (`lib/core/battle.ts` · `stagePhase`), ⇒ `hit`⇢`hit` ⛔ אינו מזיז את הגוף כלל,
ולכן שכבה שאינה זזה בו היא התנהגות **נכונה** ⛔ ולא אנימציה שאבדה.

### שלושת המספרים — ⛔ כולם נגזרים, ⛔ ואף אחד ⛔ לא נבחר

| טוקן | ערך | מאיפה |
|---|---|---|
| `--arena-follow-ms` | `66ms` | 2 פריימים ב-`FPS = 30` (`render_video_A.py:16`) — אותה גזירה של T-182 |
| `--arena-follow-settle-ms` | `200ms` | משך המעבר של הגוף עצמו, `app/globals.css` בלוק `arena-stage` (T-117) |
| `--arena-follow-x` | `8.33px` | `0.75rem` מתוך `w-24` (6rem) על `viewBox` ברוחב 200 = **25 יחידות**; 200ms = **6** פריימים ⇒ פיגור של **2** הוא **שליש** = `25 / 3` |

⛔ **וזה `px` ⛔ ולא `rem`:** בתוך `<svg>` יחידת ה-CSS **היא** יחידת ה-`viewBox`.
‏`components/ArenaBattle.test.ts` **קורא את ארבעת הפרימיטיבים מהמקור בזמן ריצה**
(`globals.css` · `ArenaStage.tsx` · `ArenaAvatar.tsx`) ומחשב את הגזירה מחדש ⇒ שינוי
ב-`FIGURE_CLASS`, ב-`viewBox`, בתזוזה או במשך **מפיל שורה בשם** ⛔ ולא משאיר מספר יתום.
⚠️ **הקירוב ליניארי, והוא מוצהר:** העקומה היא `ease-out`, ולכן שליש ה**מרחק** ⛔ אינו
שליש ה**זמן** במדויק.

### א1 קופאת עכשיו על **שלושה** ערוצים, ⛔ ולא על שניים

עד T-216 עצר hit-stop את לולאת ההמתנה ואת מעבר התנוחה. ⛔ ערוץ שלישי שממשיך לזוז בתוך
הקיפאון הוא בדיוק הפגם ש-א1 קיים כדי למנוע. ⛔ **וכלל העצירה נושא חמישה סלקטורים
⛔ ולא שלושה, וזה מכוון:** קיצור `animation` בכלל התנוחה **מאפס** את
`animation-play-state`, ⇒ כלל חלש יותר היה נדרס בשקט.

**נמדד חי** (`next start` · 375×780): פגיעה ⇒ גוף היריב `+12px`, השיער **מוחזק** על
`-8.33` למשך **120ms** — כלומר `--arena-hitstop-ms` בדיוק — ואז מדביק.

### ⛔ הגיאומטריה ⛔ לא הועתקה מהרנדר, וזה הוצהר

`render_video_B.py` **כן** מיישם את א4 (`hero_sprite`, פרמטר `lag` על הגלימה, על השיער
ועל יד הנשק), ⛔ אבל `38 § 5` פוסל את שלושת הספרייטים ההם כפלייסהולדרים. ⇒ ה**זמן**
נלקח מהמפרט (2 פריימים) וה**מרחק** נגזר מהשלד שלנו (`38 § 3`), ⛔ ולא מגוף זר.

⚠️ **F-083 בתוקף ו⛔ לא נסגר כאן:** `<ArenaStage … items={[]} />` ⇒ בקרב הגלימה והנשק
⛔ אינם מצוירים כלל, והשכבה היחידה שזזה היא השיער (נמדד: `parts drawn = hair,hair`).
הכלל נכתב לשלושתן ⇒ ⛔ אינו זקוק לשינוי כשהפריטים יגיעו לבמה.

---

## T-181 · `37 § 12` — מסך הבית של הזירה, ו⛔ **הראוט ⛔ לא גדל** (C-0341)

עד הטיק הזה `/arcade` **נפתח בתוך קרב**: `app/arcade/page.tsx` הרכיב `<ArenaBattle>`
ישירות, ⇒ ללומד ⛔ לא היה מסך שבו הוא רואה מה הרוויח לפני שהוא נכנס. `37 § 12` מתאר
מסך בית, ⛔ והוא מעולם לא נבנה.

### שלוש שכבות, ⛔ ולא רכיב אחד שיודע הכול

| שכבה | הקובץ | מה היא אחראית עליו |
|---|---|---|
| **חוק** | `lib/core/arenaHome.ts` | מסלול הבוס מ-`wins` (`37 § 9`) · ארבע המשבצות (`38 § 2` · D-135). ⛔ טהורה — `check:core` ירוק |
| **תוכנית קריאה** | `app/api/arcade/home/route.ts` | ‏`GET`, שלוש עמודות של `arcade_progress`. ⛔ **אפס כתיבה** (`37 § 13.1`), נאכף בסריקת מקור |
| **ציור** | `components/ArenaHome.tsx` | מצייר את מה שהחוק החזיר. ⛔ אין בו חשבון שארית, ⛔ אין `BOSS_EVERY` ו⛔ אין המספר חמש |
| **מעטפת** | `components/ArenaShell.tsx` | `'home' \| 'battle'`, ⛔ ותו לא. ⛔ אינה מבקשת נתונים ו⛔ אינה מציירת |

### ⛔ למה זו קריאה של DEV ו⛔ לא של PM

‏`RULES § 0.22` שולח **ניווט — לשונית, צומת בטבעת, ראוט** ל-PM. מצב `'home' | 'battle'`
בתוך רכיב לקוח אחד מוסיף **אפס** ראוטים ו**אפס** רשומות בכל טבלת ניווט ⇒ זהו **גבול
מודול**, שהוא במפורש בעמודה של DEV. ⛔ הראוט היחיד שנוסף בטיק הוא `/dev/arcade/home`,
שהוא **פיקסצ׳ר פריסה** — `noindex`, לא מקושר, ⛔ ואינו מסך לימודי — בדיוק החריגה
הקבועה ש-`/dev/arcade` כבר מהווה.

### D-134 — שער הניגודיות הוא **פר-מסך**, ועכשיו הוא באמת כזה

בלוק 2c ב-`scripts/verify-mobile.mjs` היה מקודד קשיח על `/dev/arcade`. הוא עובר עכשיו
בלולאה על `ARENA_SCREENS` — ⛔ **ואף שורה בתוך ה-`page.evaluate` ⛔ לא השתנתה**.
⛔ **וקלף הלחש ⛔ אינו נדרש עוד בכל מסך:** למסך הבית ⛔ אין יד, ו-`cardEdge === null`
שם הוא המצב ה**נכון** — לדרוש אותו היה כופה קלף על מסך שהרנדר ⛔ אינו מצייר בו אחד.

⚠️ **והשער הוכח שהוא מסוגל ליפול, ⛔ ולא רק שהוא ירוק:** צביעת הכיתוב `ציוד` ב-
`--arena-stone-dark` הפילה את `check:mobile` **בשם ובמספר** — «`ציוד` is 1.19:1
(rgb(52, 50, 63) on rgb(28, 38, 66))» — בשתי הסכימות. שער שמעולם לא נפל הוא שער
שאיש ⛔ לא מדד.

### ⛔ שלושת הצמתים שהרנדר מצייר ו⛔ אינם על המסך

שבב הצבירה ומד ההתקדמות — **D-131**, `0014_arcade.sql:24-30` ⛔ אין בו עמודה לשניהם.
שמות הפריטים של `GEAR` — **D-132**, המשבצות מתויגות בשם ה**משבצת**. ⛔ **והמחיר מוצהר:**
רוב המשבצות נראות **ריקות**, וזו **עובדה נכונה** על הלומד — החלופה הייתה להמציא פריטים.
⚠️ **וכרטיס הרמה שומר `h=66` ואת שני קווי הבסיס של הרנדר** אף ששני הצמתים שביניהם ירדו:
סגירת הרווח הייתה שינוי פריסה שהרנדר ⛔ אינו נושא, שנעשה כדי **להסתיר** הכרעה.

---

## T-219 · T-220 ⓑⓒ · `37 § 2` — התמהיל מחובר, והמילה הלא-מסוננת עולה כסף (C-0346)

**מה היה, נמדד:** `lib/core/arenaWords.ts` נמסר ירוק ב-T-173 עם טבלת `§ 2` **כולה**,
ו-`components/ArenaBattle.tsx:189` העביר לו `{ known: [], unfiltered: [], base }` ⇒
**15 מתוך 15 מילות הקרב `base`**, והטבלה ⛔ מעולם לא רצה. פונקציה נכונה שאיש
⛔ אינו קורא לה בערכים אמיתיים היא בדיוק מכניקה שלא נבנתה.

### ההחלטה נשארת במקום אחד — וזה מה שהתיק הזה שומר

הנתיב **קורא ומוסר לא-מעורבב** · `arenaWords.ts` **מחליט תמהיל** (⛔ לא נגעתי בו) ·
`battle.ts` **מחליט תוצאה** · `ArenaBattle.tsx` **מצייר ו⛔ אינו מחשב**.
`ArcadeQuestion` גדל בשדה **אחד** — `kind` — ו-`buildRound` בשני קלטים אופציונליים.
⛔ **חוסר ידיעה ⛔ אינו `unfiltered`:** קורא שלא מסר את הקבוצות מקבל `base` לכל שאלה
(‏`kindOf` מחזיר `'base'` על `undefined`), ⇒ **מחסן ריק = ההתנהגות של היום בדיוק.**

### ⛔ השומר נכתב מחדש ו⛔ לא נמחק — זה הלב של התיק

`route.test.ts:11-16` אסר על `word_progress` ועל `self_marked_known` להופיע בנתיב
**גם בקריאה**, ו-`37 § 13.3` מתיר קריאה **במפורש**. ⛔ מחיקת השומר הייתה הדרך הקלה,
והיא בדיוק מה שהפיל את `T-164`. במקומה השומר **צומצם ל«קריאה מותרת · כתיבה אסורה»**
ובאותה נשימה **התחדד**: `word_progress` חייב להופיע **רק** אחרי `.from(` ולפני
`.select(` (רגקס על 120 התווים שאחרי הקריאה) · שמות שדות SM-2 (`repetition` ·
`next_review_at` · `easiness` · `interval_days` · `current_level`) אסורים **לחלוטין** ·
רשימת הטבלאות הנקראות היא **בדיוק** `arcade_progress` · `word_progress` · `words`.
⇒ השומר עכשיו אוסר **יותר** ממה שאסר קודם על מה שחשוב, ⛔ ופחות על מה שהמפרט מתיר.

**D-052 ⛔ אינו נפגע**, וזה נבדק ⛔ ולא הוצהר: ה-`band` עדיין נגזר מ-`arcade_level`
בלבד. מה שהשורות האלה קובעות הוא **אילו מילים בתוך ה-band** נבחרות.

### ⛔ הבאג שהחיבור חשף — חיפוש לפי אינדקס

`mixArenaWords` **משנה סדר** (‏`interleave`), ו-`cast` **מוסיף מילה חוזרת לזנב**.
⇒ `questions[battle.index]` היה מגיש את ארבע האפשרויות של מילה **אחרת**, ו-`answer`
בדיווח ל-`POST /api/arcade/result` היה של המילה הלא נכונה. שתי הקריאות עברו למפת
`byWordId`. ⚠️ **הבאג היה מגיע עם החיבור, ⛔ ולא עם התמהיל** — כל עוד כל המילים היו
`base` הסדר לא זז, ולכן ⛔ אף בדיקה מ-2,983 לא ראתה אותו.

### `UNFILTERED_BONUS_DAMAGE` — למה **תוספת** ו⛔ לא מכפיל

`§ 2` אומר «צדקת — נזק מוגבר» ⛔ ואינו נוקב מספר. מכפיל היה הופך קריטי על מילה לא
מסוננת ל-**4**, כלומר **40% מחיי היריב בהטלה אחת**; תוספת של 1 שומרת על סולם
1 → 2 → 3 שהקרב כבר בנוי עליו.

### «הלחש חוזר אליך» — **פעם אחת בלבד**, והאינווריאנט שנשמר

המילה החוזרת נכנסת מחדש כ-`base` ⇒ שגיאה שנייה עליה ⛔ אינה מחזירה אותה שוב, ⛔ ואין
תור שמתארך לנצח בקרב של 90 שניות. ⛔ **ואין עונש נוסף** — `pendingPenalty` זהה לכל
שגיאה אחרת (נמדד מול `base`). האינווריאנט `casts[i] ↔ words[i]` שורד כי `cast` תמיד
קורא `words[index]` ותמיד מקדם ב-1 ⇒ הוספה **בזנב** ⛔ אינה יכולה להזיז משבצת שכבר נוצקה.

### ⛔ מה במפורש ⛔ לא נבנה, ומי חוסם

`T-220` ⓐ (איזה קלף נושא `?`) ו-ⓓ (הקלף חוזר **גלוי**) — **F-164**, הכרעת PM בין
מודל הרנדר (יד קבועה של ארבעה קלפי־מילה) לבין המודל הבנוי (ארבע אפשרויות לשאלה).
⛔ הענף `unknown={option === '?'}` נשאר **קוד מת** ו⛔ אינו נמחק.

---

## T-153 · C-0347 — **המסיחים מתויגים: התמהיל הוא צירוף, ⛔ ולא עמודה**

### למה מודול נפרד ו⛔ לא שורה ב-`arcadeRound.ts`

`arcadeRound.test.ts` מחזיק שומר-מקור שסורק את **גוף `buildRound`** ונופל בשם אם
`distractorsEn` יחזור לאפשרויות (D-087). מודול נפרד — `lib/core/arcadeDistractors.ts` —
משאיר לאותה סריקה בדיוק את המשמעות שהיא נכתבה בה: היא עדיין רואה גוף שאינו נוגע
במסיחים האנגליים, והערך העברי מגיע בשדה **נפרד ומפורש** `taggedHe`. ⇒ השומר נשאר ירוק
**⛔ בלי שינוי**.

### `taggedHe` הוא שדה **חובה**, ⛔ ולא אופציונלי — וזה תפס באג

השדה נוסף ל-`ArcadeCandidate` כ-`readonly taggedHe: readonly TaggedHeDistractor[]`
⛔ בלי `?`. ‏`tsc --noEmit` נפל מיד על `app/api/arcade/round/route.ts:108` — הנתיב היחיד
שבונה מועמדים ולא מילא אותו. שדה אופציונלי היה נותן ⛔ **בדיוק אפס** התראות והנתיב היה
מגיש מילוי אקראי לנצח בשקט. ⇒ **חובה מלמעלה היא הבדיקה שאף אחד לא צריך לכתוב.**

### המילוי הוא **משבצת**, ⛔ ולא נסיגה — וזה ההבדל בין 27.4% ל-89.5%

נמדד בטיק על `data/generated/batch-*.jsonl`: `full mix 216 / 787 · at least one 704 / 787`.
כלל «תמהיל מלא או כלום» היה מזיז **27.4%** מהסבבים; מילוי **לפי משבצת** מזיז **89.5%**
מהם ביום הראשון, ⛔ בלי מילה חדשה אחת. ⇒ `pickWrongOptions` ממלא סמנטי → צורני → מילוי,
בסדר הזה, ⛔ ולעולם לא הפוך: משבצת סמנטית שנתפסה במילוי מחזירה בדיוק את D-087.

### הפתירה שנכשלה ⛔ אינה 503

השאילתה השנייה על `words` היא **העשרה**. ‏`resolveError` ⇒ `console.error` + `break`,
והסיבוב יוצא עם מילוי מהרמה — סיבוב תקין לגמרי (ⓗ). ⛔ לומד ⛔ אינו רואה מסך שגיאה
מפני שהעשרה לא נטענה. תקרה `MAX_RESOLVE_HEADWORDS=600` ואצוות `RESOLVE_CHUNK=150`:
‏`in()` בלי גבול הוא URL שהשרת חותך בשקט, ⛔ וחיתוך שקט על קבוצה לא-ממוינת הוא סיבוב
שאי-אפשר לשחזר ⇒ `wanted` **ממוין** לפני `slice`.

### ⛔ מה במפורש ⛔ לא נבנה

`T-218` (מסך התוצאות נוקב **באיזו** טעות) — הנתון קיים מהיום, אבל הוא צריך לנסוע דרך
`lib/core/battle.ts` ו-`BattleCast` עד המסך, וזה בעלים אחר ותוכנית אחרת. ⛔ הוא נשאר ⛔
עד ש-T-153 **נוחתת על `dev`**, ⛔ ולא כשהיא 🟣.

## C-0372 — **שער התנועה: מה שהסקיל תופס פעם, השער תופס כל טיק**

`npm run verify` מריץ מעכשיו גם `check:motion` (‏`scripts/check-motion.mjs`).

### למה שער ו⛔ לא סקיל
הריצה הידנית של ה-PM ב-30/08 (22:22Z–22:35Z) מצאה ארבעה ליקויי ביצועים אמיתיים
(`T-230`…`T-233`) — אבל **רק מפני שאותו טיק במקרה טען את `apple-design` ובמקרה קרא את
הקבצים הנכונים**. סקיל תופס הפרה כשמודל טרח; שער תופס אותה בכל טיק, לנצח, בעלות אפס
טוקנים. ⛔ **ו-`grep` על `plan/35-design-constitution.md` אחרי
`transform|opacity|compositor|box-shadow` החזיר 0 תוצאות בטיק הזה** — כלומר החוקה ⛔ מעולם
לא כיסתה את החריץ: `ב6` מסדירה **משך**, ⛔ לא **מאפיין**.

### שני כללים, ו⛔ לא כלל שלישי
* **ⓐ** בלוק `@keyframes` או הצהרת `transition:` שנוגעים במאפיין שאינו `transform`/`opacity`.
* **ⓑ** רוחב אחוזי מוטבע בתוך רכיב שמריץ לולאת `requestAnimationFrame`.

### המפתח ⛔ אינו מספר שורה
קו הבסיס (`scripts/motion-baseline.md`) נעוץ ב**שם ה-`@keyframes`** או ב**ביטוי** שבתוך
הרוחב. מספר שורה זז עם כל עריכה מעליו, וקו בסיס שנעוץ במספרי שורות מרקיב בתוך שבוע.
מספר השורה עדיין **מודפס** בהודעת השגיאה — הוא מידע, ⛔ לא מפתח.

### 🔴 השער ⛔ אינו נפתח מבפנים (C-0366, כלל ⓐ)
שלוש אכיפות נפרדות: ⓐ הסקריפט ⛔ מסרב לרוץ בלי משפט הכותרת של קו הבסיס, מילה במילה;
ⓑ `scripts/motion-gate.test.ts` מאמת שכל שורת בסיס מצטטת ממצא **קיים** ומשימה **קיימת**;
ⓒ תקרת מספר השורות **נעוצה בטסט** (`MAX_BASELINE`). ⇒ הרחבת קו הבסיס דורשת שלוש עריכות
נפרדות בשלושה קבצים, וכולן נראות בדיף ש-QA קורא.
⚠️ **והגבול נאמר במפורש ⛔ ולא מוסתר:** ל-DEV יש הרשאת כתיבה לשלושתם. מה שהמבנה נותן הוא
**נראוּת ודאית**, ⛔ לא מניעה טכנית — מניעה אמיתית דורשת CODEOWNERS או שער CI מחוץ לריפו.

### שורה מתה בקו הבסיס **מפילה** את הבנייה
שורת בסיס שאינה מתאימה עוד לשום הפרה = ההפרה תוקנה ⇒ השורה חייבת לרדת. ⛔ אחרת קו הבסיס
הופך לרשימת משאלות, והתקרה מפסיקה למדוד דבר.

---

## T-225 — «סינון מילים» מקבלת נתיב כתיבה: ה-404 מצטמצם, ⛔ ואינו נמחק (C-0378, D-142 · D-150)

`app/api/practice/route.ts` נשא כלל אחד עד הטיק הזה: שורת `word_progress` חסרה ⇒ **404**,
בלי יוצא מן הכלל, כי «מילה שמעולם לא נענתה אינה יכולה להיות בחפיסת תרגול». `deck=level`
מפריך את ההנחה הזאת **בהגדרתה** — היא כל מילות הרמה שהלומד עוד לא סימן, ולכן שורה חסרה
היא המקרה הרגיל שלה ⛔ ולא POST תועה. ⇒ הענף מתפצל **בתוך** ה-`row === null` הקיים, ⛔
ולא מוחלף: כל חפיסה אחרת (`due` · `unknown`) נשארת על ה-404 המקורי, ורק `payload.deck ===
'level'` פותח שורה — `insert` (⛔ `upsert` ⛔ מעולם, אותו נימוק כמו `scan/route.ts:92-94`),
`next_review_at: null` מפורש (⛔ «מועד עכשיו» — `deck=due` מסנן `<= now`), ⛔ אפס SM-2.

### הדיסקרימיננטור נוסע בגוף הבקשה, ⛔ לא בכתובת
`PracticePayload` קיבל שדה `deck: FlashcardDeckName`; היעדרו ⇒ ברירת מחדל `'due'` (תאימות
לאחור — לקוח ישן ⛔ לא רוכש בשקט את נתיב ה-insert). `checkPracticePayload` דוחה שם לא מוכר
במפורש, ⛔ ואינו נופל לברירת מחדל שבולעת קלט פסול (F-004 באותו גבול).

### `lib/core/levelSummary.ts` נשאר טהור, ולא במקרה
`classifyProgress` (`:45-49`) כבר בדקה `selfMarkedKnown` **ראשונה** — ⇒ ⓐ/ⓑ נכונות מעצמן
תחת T-210's המונים, בלי ענף רביעי ובלי לגעת בקובץ. זו הסיבה ש-Global Constraints בתוכנית
סימנו את הקובץ **⛔ untouched**, ⛔ ולא כזהירות: תיקון «ידני» של ⛔ הסדר היה כפילות סיכון.

### האריח עובר דרך `toEntry`, ⛔ ואינו נבנה ביד
`components/DeckSelector.tsx` — «סינון מילים» עברה מאובייקט `{href: null, locked: true}`
קבוע ל-`toEntry({href: '/study?deck=level', count: unseen, ...})`. `toEntry` כבר מחזירה
`enabled: false` עם המספר כש-`count` הוא `null`/`0` (§ 4.2ו) — «מושבת עם המספר» ⛔ ואינו
«נעול», בלי כלל שני. **תופעת לוואי שנמדדה בהליכה, ⛔ לא שוערה:** בפיקסצ׳ר `check:mobile`
(`unseen: 314` — לא-ריק, לא-אפס) האריח הוא כעת **היחיד** שנרשם `enabled: true` מהרגע
הראשון (‏`due`/`unknown`/`sentences` תלויים בקריאת רשת שנכשלת 503 בלי env), ⇒ הוא הופך
ל-`primaryKey`, ו-`scripts/verify-mobile.mjs` עודכן באותו קומיט (`PRIMARY_ACTION_ROUTES`
· `EXPECTED_CONSOLE` — ה-503 שההקשה גוררת עבר מ-`deck=due` ל-`deck=level`).

**נמדד, ⛔ לא הוצהר:** `npm run verify` exit 0 — typecheck · check:core · check:motion ·
check:rules (317/40/0) · test (**3125/3125**, מ-3116) · build · check:mobile (**1214**
בדיקות, 320/375/414px). הליכה חיה על `next dev`: `/dev/deck` — «ידעתי» ✓ מימין תחת RTL
(D-150), «לא ידעתי» ✕ משמאל; `/dev/tabs/cards` — «סינון מילים» ראשונה בלי מנעול, `href`
תקין, המספר מוצג, אפס גלילה אופקית, אפס יעד מגע מתחת ל-44px.

⛔ **חוב שנשאר פתוח, במפורש:** T-165ⓒ (הדירוג בחפיסת `sentences`) ⛔ עדיין לא חובר —
`route.ts` עדיין עונה 404 על שורה חסרה בכל חפיסה **חוץ** מ-`level`, כלומר F-140 בחפיסה
שנייה, כמתועד למעלה. T-225 ⛔ לא נגעה בכך.

## T-246 — `לימודים` הופכת לבורר ארבעת המסלולים (C-0381)

`components/StudiesScreen.tsx` עבר שכתוב מלא: מ-«כותרת ספירת-ימים + כפתור יחיד ל-`/cards`»
(D-077/D-083, שנסוגו מפני D-176) ל-`'use client'` component עם ארבעה שבבי `role="tab"`
וכרטיס-סטטוס אחד למסלול הפעיל — בדיוק תבנית ה-tab שהרנדר מצייר (`render_video_A.py:1149-
1264`, `screen_hub`/`TRACKS`), פאנל אחד גלוי בכל רגע ⛔ ולא רשימה.

### `lib/core/studyTracks.ts` — רישום מונחה-נתונים, ⛔ לא מסך חדש לכל מסלול
קובץ טהור חדש (T-246ⓐ): `STUDY_TRACKS` הוא **tuple** בן ארבעה, ⛔ לא `Meta[]` גרידא —
`noUncheckedIndexedAccess` (tsconfig) הופך אינדוקס מערך רגיל ל-`| undefined`, ו-
`StudiesScreen` צריך `STUDY_TRACKS[0]` בלי בדיקה כדי לקבוע את השבב הפעיל בטעינה.
`vocabularyMetric` **מצרפת** בלבד — `known`/`totalInLevel` כבר מגיעים מסוכמים מ-
`classifyProgress` (`levelSummary.ts`, § 4.2ז), ⛔ אין כאן הגדרה שנייה. `emptyTrackMetric`
מחזירה טיפוס מצומצם (`Extract<TrackMetricState, {kind:'empty'}>`), ⛔ לא האיחוד המלא —
כך `.summaryHe` נשאר בטוח-טיפוסים בלי בדיקת `kind` בצד הקורא.

### הפרדה מ-«—»: `'unreachable'` מול `'empty'`
`D-046`/`D-082` אוסרים «—» כמדד — ולכן `UNREACHABLE_HE` (`StudiesScreen.tsx`, קריאת רשת
שנכשלה) הוא היחיד שנושא מקף ארוך. `emptyTrackMetric`'s (דקדוק/כתיבה/הבנת הנקרא) **ננטש
מהמקף** מכוונה: הטיוטה המקורית בתוכנית כתבה `"... — 0 מתוך 0"`, אבל הבדיקה שבאותה
תוכנית עצמה אוסרת «—» באותו מחרוזת — סתירה פנימית בתוכנית (D-110 latitude, נרשם). הפתרון:
סוגריים במקום מקף — `"אין עדיין פריטים בדקדוק (0 מתוך 0)"`.

### `GET /api/levels/summary` — `levels[]` יוצא גם כש-`level: null`
`route.ts` שינה סדר: קריאת `word_progress` והספירות `head:true` רצות **תמיד** כעת (לא
מותנות ב-`level !== null`) — לומד יכול לצבור התקדמות בסימון עצמי לפני שבחר «רמה נוכחית»,
והבורר צריך את שש הרמות בכל מקרה. ⛔ שני השדות הקיימים (`ok`, `level`) יוצאים בענף
`level: null` בדיוק כפי שיצאו קודם — `levels` הוא **תוספת בלבד**, ⛔ שובר כלום.

### `bg-brand` נתפס בשער הפלטה — `bg-brand-surface/20` הוא התבנית הקיימת
`lib/core/palette.test.ts` (F-036) אוסר `bg-brand` כמילוי (4.42:1, לא מספיק לטקסט/שבב).
השבב הפעיל השתמש תחילה ב-`bg-brand/10`; תוקן ל-`bg-brand-surface/20` — התבנית שכבר קיימת
ב-`StoryScreen.tsx:225` לאותו מצב בדיוק (שבב פעיל עם `border-brand`).

### `scripts/verify-mobile.mjs` — `PRIMARY_ACTION_ROUTES`/`FLOW_ARRIVAL` מאבדים את הבורר
המסך הישן נשא יעד `data-primary-action` יחיד (`<Link href="/cards">`); הבורר החדש הוא
state מקומי בין ארבעה שבבים, ⛔ לא ניווט — `/dev/tabs/studies` הוסר משתי הרשימות (חוזר
כש-T-247 נותן למסלול הנבחר יעד לחיצה אמיתי). `scripts/verify-mobile.test.ts` — שתי בדיקות
מטא שנעלו את המבנה הישן עודכנו לשקף את זה (⛔ לא נמחקו).

### ⛔ הפער שנמדד ⛔ ולא תוקן: ≥400 תווים (`F-178`)
בדיקת התוכן (≥4 `role="tab"` · ⛔ אפס «—») שהתוכנית ביקשה נוספה ללולאת ה-route הראשית,
אבל ה-≥400-תווים שאותה שורה דרשה **נמדד 155** ב-`check:mobile` חי (`main`'s `innerText`,
build אמיתי) — פאנל-יחיד-גלוי (תבנית tab) בלי תחזית קצב (חסום ב-`F-177`) ובלי נתיב
מודולים (`T-247`, חסום ב-`T-246` עצמה) פשוט אינו מגיע ל-400 תווים בלי להמציא תוכן. הבדיקה
הושמטה מהקוד עם הפניה ל-`F-178`, ⛔ ולא הוצמדה בשקט למספר נמוך יותר.

### ⛔ `npm run generate-map` לא רץ — הסקריפט ⛔ אינו קיים (`F-179`)
`DEV.md`/`LOOP-ARCHITECTURE.md` מציגים אותו כקיים (`D-165`/`T-235`), אבל בקלון חי אין
`madge`, אין סקריפט `generate-map` ב-`package.json`, ואין `docs/architecture-map.json` —
`T-235` (שהייתה בונה את שלושתם) עדיין ⬜. תיעוד, ⛔ לא עקיפה: Dev אינו מוסיף תלות חדשה
(`madge`) על דעת עצמו באמצע טיק שלא תכנן זאת.

**נמדד, ⛔ לא הוצהר:** `npm run verify` exit 0 — typecheck · check:core · check:motion ·
check:rules (**310/40/0**) · test (**3137/3137**) · build · check:mobile (**1196** בדיקות,
320/375/414px, `next start`). `npm run build:surfaces` — `/studies` מסומן ✅ בעמודת «מצב
ריק».


## T-235 — `docs/architecture-map.json`, מפת הארכיטקטורה הנגזרת (`madge`) — C-0390

סוגר את `F-179` שתועד למעלה. שלושת החלקים כפי שהמשימה דרשה, ⛔ ולא יותר:

`madge` נוסף כ-`devDependency` **מוצמד** (`"madge": "8.0.0"`, ⛔ לא `^`). `scripts/generate-
map.mjs` עוטף את ה-CLI (`madge --extensions ts,tsx --json app components lib`) — ⛔ לא
`./src`: נמדד 31/08 שלריפו הזה אין תיקיית `src/`, והקוד יושב ב-`app/` · `components/` ·
`lib/`. השער: `MIN_MODULES=20` — אם הגרף שחזר קטן מ-20 מודולים, הסקריפט **יוצא בקוד שאינו
אפס ולא כותב קובץ**, כדי שנתיב שגוי (למשל `./src`) ייכשל בקול במקום להפיק מפה ריקה ששקטה
לנצח. `ROOT`/`OUT`/`MIN_MODULES` ניתנים לדריסה ב-`GENERATE_MAP_ROOT`/`GENERATE_MAP_OUT`/
`GENERATE_MAP_MIN_MODULES` — כך `scripts/generate-map.test.ts` בודק את שני הענפים (מספיק
מודולים / מתחת לרצפה) נגד עץ-פיקסצ'ר זמני, ⛔ ולא נגד `app/` האמיתי.

הרצה ראשונה נדחפה **באותו קומיט**: `docs/architecture-map.json` — גרף `{ "<קובץ>":
["<קבצים שהוא מייבא>"] }`, **372 מודולים** (נמדד חי 02/09). הקובץ נכנס לרשימת הקבצים
הנגזרים ב-`DEV.md` HARD INVARIANTS (כבר נכתב שם) — ⛔ עריכה ידנית אסורה, לתקן את הסקריפט
ולהריץ מחדש.

**נמדד, ⛔ לא הוצהר:** `npx vitest run scripts/generate-map.test.ts` ⇒ **2/2**. `npm run
verify` מלא (7 פקודות, אחרי `npm run generate-map`) ⇒ **exit 0**, כולל `check:mobile`
(1196 בדיקות). ⛔ טיק זה לא נגע ב-`app/` · `components/` · `lib/` (רק `scripts/` ·
`package.json` · הפלט עצמו) — אין תוכן UI לבדוק מול רנדר.

### `lib/core/lesson.ts` — מצב הבחירה של מסך השיעור, כפונקציה טהורה (T-143)
קובץ טהור חדש: `LessonSelection` היא מפה `itemId → choiceId` (⛔ לא מזהה יחיד — § 4.2ט
נותנת 1–3 פריטים במסך אחד). `chooseInLesson` מחזיר אובייקט חדש (הקורא הוא `useState`
ב-`LessonScreen`, מוטציה לא הייתה מרנדרת מחדש). `whyForChoice` מחזירה `null` על «טרם
נבחר» ⛔ ולא מחרוזת ריקה — «טרם בחר» ו«בחר ואין הסבר» אינם אותו מצב. ⛔ **אין `isCorrect`**
— T-143ⓒ אוסר תווית ערך; המנגנון היחיד הוא «מה שנבחר מסביר את עצמו» (D-050).

`LessonScreen.tsx` עבר מרכיב סטטי ל-`'use client'` (D-078, שורת מפרט חתומה — ⛔ לא
החלטת מסך): כל אפשרות היא `<button data-lesson-choice min-h-touch>` ⛔ ולא `<li>`, וה-
`why` נחשף רק לאחר בחירה (`data-lesson-why`). ⛔ `phase` נשאר פרופ — F-099 (המצאת «done»
עצמאית) עדיין פתוח, ולא נגענו בו. שער חדש ב-`scripts/verify-mobile.mjs` (`/dev/lesson`):
≥3 יעדי מגע, כולם ≥44px, ⛔ אפס הסבר לפני בחירה — נמדד בדפדפן חי (Playwright, `next
start`) שההסבר אכן נחשף אחרי הקשה, ⛔ לא רק בסריקת מקור.

**נמדד, ⛔ לא הוצהר (C-0392):** `npx vitest run lib/core/lesson.test.ts
components/LessonScreen.test.ts` ⇒ 23/23. `npm run verify` מלא (7 פקודות) ⇒ **exit 0**,
`check:mobile` 1205/1205 (9 בדיקות חדשות, 3 × 3 רוחבים). `npm run generate-map` ⇒ 374
מודולים. הליכה ידנית ב-Playwright מול `next start` (375×780): לחיצה על אפשרות ראשונה
בפריט הראשון חושפת את ה-`why` שלה בלבד — פריט שני נשאר ללא הסבר. ⚠️ **תחת `next dev`**
(⛔ לא `next start`) ה-hydration נכשל בשקט (403 על `/_next/static`, WS handshake נכשל) —
זו בדיוק F-132 (Next 16 חוסם גישה חוצת-מקור למשאבי פיתוח מ-`127.0.0.1`), ⛔ ולא רגרסיה
של המשימה הזאת; ההליכה החוזרת נעשתה מול `next start` ועברה.

### `lib/core/previewCards.generated.ts` — הכרטיסיות שלפני הרשמה, כקובץ נגזר (T-034 · F-012)
הדפוס: `lib/core/previewSelection.ts` (טהור — `BatchRecord[] → PreviewCard[]`, שמונה
כללי סינון/מיון) → `scripts/build-preview-cards.mjs` (הכתובת האחת הבלתי-טהורה — קורא
`data/generated/batch-*.jsonl`, קורא ל-`parseBatchFile` + `selectPreviewCards`, כותב את
הקובץ הנגזר) → `lib/core/previewCards.generated.ts` (מערך `PreviewCard[]` מילולי, ⛔
עריכה ידנית אסורה) → `lib/core/landing.ts` מייצא אותו כ-`PREVIEW_CARDS`.
`scripts/build-preview-cards.test.ts` הוא **מנעול סנכרון**: משווה את הקובץ הנגזר
המחויב מול מה שהסקריפט מפיק *עכשיו* — סוכן Content שדוחף אצווה בלי `npm run
build:preview` יאדים את הבדיקה, ⛔ לא בשקט.

⚠️ **סטייה מהתוכנית, נמדדת חיה 02/09:** `docs/superpowers/plans/2026-08-16-preview-before-signup.md`
כתב את הרג׳קס `/^batch-\d{4}-\d{2}-\d{2}\.jsonl$/`, שהתאים ל-9 קבצי האצווה שהיו קיימים
ב-16/08. הקלון הזה מחזיק היום **23** קבצים תואמי `batch-*.jsonl`, כולל ימים מרובי-חלקים
(`batch-2026-08-29-2.jsonl` … `-8.jsonl`) שהרג׳קס הישן היה מדלג עליהם בשקט. הוחלף ב-
`/^batch-.*\.jsonl$/` — הדפוס הקיים כבר ב-`build-ingest-sql.mjs` · `measure-gate.mjs` ·
`build-word-levels-sql.mjs` · `build-stories-sql.mjs`, ואומת בבדיקה ידנית שכל קובצי
`batch-*` חולקים את אותה סכמת-חוש (⛔ ולא `messages-*`/`stories-*`/`story-questions-*`,
שהם סוג תוכן אחר). התוצאה: **1,187 חושים מ-23 קבצים**, תואם למספר שכבר נמדד ב-`npm run
measure:gate`.

**נמדד, ⛔ לא הוצהר (C-0397):** `npx vitest run lib/core/previewSelection.test.ts` ⇒
16/16 (15 מהתוכנית + בדיקת סדר אחת שנוספה — ראה הקומיט). שש בדיקות-מוטציה על הבורר,
כל השש נכשלות בשם הבדיקה הנכון (שתיים מהן — #3 ו-#6 — לא נכשלו עם הפיקסצ׳ר המקורי של
התוכנית ותוקנו, ראה יומן הקומיט). `npx vitest run scripts/build-preview-cards.test.ts`
⇒ 6/6, ארבע בדיקות-מוטציה על המחולל, כולן נכשלות כראוי. `npx vitest run
lib/core/landing.test.ts` ⇒ 15/15 (כולל הבדיקה הישנה `PREVIEW_CARDS.toHaveLength(0)`
שהוחלפה — כבר לא נכונה). `npm run verify` מלא ⇒ **exit 0** (`test` 3235/3235 · `build`
ירוק · `check:mobile` 1205/1205, `/` @320/375/414 ללא גלילה אופקית, כל יעדי המגע ≥44px).
שש הכרטיסיות נקראו בקול לפני הקומיט — אין אף אפשרות שהיא תשובה שנייה סבירה.

### `scripts/measure-mix.mjs` — הבדיקה השנייה של K-004, כפקודה (T-221 · F-163 · D-138 § ג׳)
עד 03/09 `docs/content-distractors-brief.md` הפנה לתנאי הקבלה השני של K-004 — "המשמעויות
עם תמהיל D-023 מלא עולות מ-127 לכיוון 445" — כ**משפט בלבד**; אין פקודה בריפו שמחשבת
את המספר, ושחזורו דרש `python3` אד-הוק (C-0342). הדפוס זהה ל-`scripts/measure-gate.mjs`:
הסקריפט קורא כל `data/generated/batch-*.jsonl` דרך `parseBatchFile` (`lib/core/batchRecord.ts`)
ומעביר את החושים לפונקציה **טהורה** ב-`lib/core/mixReport.ts` (`measureMix`).

**"נפתר לתרגום שכבר במאגר"** = אותו חיבור ש-`arcadeRound.ts` מבצע מול Postgres בשביל
`taggedHe` (D-138 § ב׳ — `distractor.word → words.headword → senses.translation_he`),
מחושב כאן טהור מתוך קובצי ה-batch עצמם: `buildTranslationBank` אוספת כל `headword` עם
`translation_he` לא-ריק, ו-`measureMix` בודקת לכל מסיח מתויג (`semantic`/`orthographic`
בלבד — D-023; `collocational`/`near_synonym` ⛔ אינם נספרים) אם המילה שלו נמצאת בבנק.
תמהיל מלא = ≥2 `semantic` + ≥1 `orthographic` **נפתרים**; לפחות-מסיח-מתויג-אחד = ≥1
מכל אחד מהשניים, נפתר. ⛔ **אינה שער** (ⓑ בשורת המשימה) — לא נכנסה ל-`verify`, בדיוק
כמו `measure:coverage`.

**נמדד, ⛔ לא הוצהר (C-0410):** `lib/core/mixReport.test.ts` — 7 בדיקות יחידה, פיקסטורות
כתובות ביד (הדפוס של `gateReport.test.ts`). `scripts/measure-mix.test.ts` — 4 בדיקות
אינטגרציה על הדאטה החי, עם רצפות ממדידת T-221 עצמה (787 שורות · 216 מלא · 704
לפחות-אחד, אחרי `batch-2026-08-28`). `npm run measure:mix` נמדד חי ב-03/09 12:42Z:
`1187 senses read from 23 batch files · 341/1187 = 28.7% full D-023 mix · 1078/1187 =
90.8% at least one resolved tagged distractor` — עלייה מ-127/737=17.2% (D-138), בכיוון
היעד המוצהר 445/737=60.4% (K-004 מלא).

### `lib/core/planTable.ts` — `releaseCondition` / `fulfilledReleaseConditions` (T-166 · D-097)
`plan/50-tasks.md`/`60-findings.md` register rows can now declare a countable release
condition inline — `תנאי שחרור: <have>/<need>`, the same "cell carries a hidden field"
idiom as `BLOCKER_MARKER`/`CONTINUATION_MARKER`. `releaseCondition(cell)` parses one
`have/need` pair right after the marker (`null` on no marker, malformed text, or
`need === 0`). `fulfilledReleaseConditions(rows, statusIndex, targetState)` filters rows
sitting in `targetState` (tasks: `'blocked'`; findings: `'open'`, since 🔓 maps there —
findings have no separate blocked state) whose declared condition is already met
(`have >= need`) and returns `{ id, have, need }` for each. Pure, no I/O — same file,
same pattern as `staleTaskBlocks` beside it.

`scripts/measure-plan-tables.mjs` wires both into the report it already writes every
tick: a new `## תנאי שחרור שהתמלא — והשורה עדיין נעולה` section in `docs/plan-tables.md`,
plus `fulfilled release conditions (tasks|findings): ...` stdout lines. Report-only — it
never flips a status cell; the decision stays human, per the task row's own text.
`TASKS_FILE` is now overridable via `PLAN_TASKS_FILE` (needed so the new fixture test can
point the generator at a temp copy of the register instead of mutating the live one — same
pattern `PLAN_TABLES_OUT`/`PLAN_OPEN_OUT` already use).

**Measured (C-0424):** `npm run measure:plan` against the live registers — `fulfilled
release conditions (tasks): none` / `(findings): none` (no row in the wild currently
declares the marker; T-166 was the first, and it closed on delivery). `npm run verify`
exit 0 — `test` 3345/3345 · `check:mobile` 1208 checks. 17 new tests (13 in
`lib/core/planTable.test.ts`, 2 CLI-level + fixture-based in
`scripts/measure-plan-tables.test.ts`, all passing, no regressions in either file's
pre-existing suite).

## `--glow-brand` — one token, and a per-screen budget that can actually fail ⟦C-0430 (DEV) · T-169 · 35-design-constitution ב3⟧

Before this tick, constitution layer ב3's "two glows, on `--brand`/`--brand-surface`
only" was true by inspection of two call sites (`[data-ring-focus]` in `WorldRing.tsx`,
`[data-tab-world]`/`[data-tab-world-glow]` in `TabBar.tsx`) and nothing else — the
budget existed in prose, and a third glow added anywhere in the product would have
shipped silently. The failure scenario the task row names is specific: glow without a
budget leaks onto every card within a few ticks, and the screen loses its focal point —
exactly how the old blanket ban was born (D-102).

**What changed:**
- `app/globals.css` gains one `:root` custom property, `--glow-brand` — the two-layer
  `color-mix(in srgb, var(--brand) …%, transparent)` box-shadow stack, unchanged in
  value from what `[data-ring-focus]` already painted. `[data-ring-focus]` now reads
  `box-shadow: var(--glow-brand)` instead of repeating the recipe inline.
- The tab-bar glow (`--brand-surface`, its own T-230 compositor-only animation split)
  is left exactly as it was — same color channel the constitution already names, same
  performance-motivated structure. It is not forced onto `--glow-brand`: the token is
  the *recipe* for a brand-colour glow, not a claim that every glow in the product is
  visually identical.
- `data-glow="true"` is added to `[data-ring-focus]` and to `[data-tab-world]` (⛔ not
  to the `data-tab-world-glow` animated sibling — that span is the same conceptual
  glow's moving half, and counting it separately would double-count one glow as two).
  This is what turns "two glows" from a claim into something `document.querySelectorAll`
  can check.
- `scripts/verify-mobile.mjs` adds one `check()` per route×width, right beside the
  existing RTL/lang checks: `page.locator('[data-glow]').count() <= 2`. It runs across
  all `ROUTES` at 320/375/414px, the same harness every other mobile guarantee in this
  file goes through — not a bespoke one-off script.

**Measured (C-0430), fresh in this clone:** `npm run verify` — `typecheck` clean ·
`check:core` OK · `check:motion` OK (2 known baseline violations, 0 new) ·
`check:text-floor` OK (3 known baseline, 0 new) · `check:rules` OK (334 citations, 0
broken) · `test` **3356/3356** · `build` succeeded · `check:mobile` **1325/1325 checks**
across 320/375/414px, including a `≤2 glowing elements` line for every route×width pair
in `ROUTES`, zero failures. `npm run generate-map` ran (391 modules, 0 delta — no file
added or removed, only edited).

⛔ **Out of scope, and deliberately not touched:** T-168 half B (`tailwind.config.ts`
radius tokens, `rounded-full` on the primary "סינון מילים" action) is a separate open
row — this tick did not decide it, and `components/DeckSelector.tsx` /
`components/LevelPath.tsx` / `components/LevelCard.tsx` carry no changes here.

## Every screen names itself — `title.template` + one guard, ⛔ not 18 hand-typed strings ⟦C-0453 (DEV) · T-264 · D-193⟧

Before this tick, `document.title` was one string across the whole product: 18
`page.tsx` routes existed, only 3 exported `metadata`, and a live Playwright walk
measured `distinct document.title: 1` across 12 screens. The failure scenario was
specific and PWA-shaped: after "add to home screen," an app-switcher or a long browser
"back" history shows every screen under the same name, with no way to tell them apart —
exactly what the task row's ⓐⓑⓒ conditions exist to close.

**What changed:**
- `app/layout.tsx`'s `metadata.title` becomes `{ default, template: '%s · English Web' }`
  instead of a bare string. A route sets `metadata.title` (or `generateMetadata`) to a
  plain string — its own `<h1>`, unchanged — and Next wraps it; a route with none falls
  back to `default`, the one string every screen showed before this task.
- **The suffix used to be typed by hand, twice, disagreeing:** `app/login/page.tsx` and
  `app/signup/page.tsx` had `'… · English Web'`, `app/sources/page.tsx` had
  `'… — אנגלית לאמיר״ם'`. All three now emit a bare string (`'התחברות'` ·
  `'יצירת חשבון'` · `SOURCES_PAGE_TITLE`) and let the template own the suffix.
- **`app/(tabs)/settings/` gets a new `layout.tsx`, ⛔ not a `metadata` export on
  `page.tsx`** — that page opens with `'use client'` (`useState`/`useEffect`), and
  Next.js refuses `metadata`/`generateMetadata` on a Client Component page. A sibling
  Server Component `layout.tsx` in the same route folder carries the title instead; it
  renders `children` and nothing else, so zero pixels move.
- **`app/study/page.tsx` gets `generateMetadata`, ⛔ not `metadata`** — the screen's
  `<h1>` depends on `?deck=`, and the page already parses that query param into `deck`
  for `<StudyDeckScreen>`. `generateMetadata` re-parses the same `searchParams` the same
  way and returns the matching one of the three literal strings the component already
  renders (`'מנת היום'` / `'סינון מילים'` / `'לא ידעתי'`) — not a fourth copy of the
  parsing rule.
- **Two reversible calls under `RULES § 0.22`, both logged in the file itself:**
  `/world/story`'s real `<h1>` is the story's English title, fetched client-side inside
  `<StoryScreen>` — unknown when the static `metadata` export runs — so the title is
  `KICKER_HE` (`'העולם · סיפורים'`), the nearest already-written static text in the same
  header block. `/arcade` renders `<ArenaShell>`, a Client Component holding
  `'home' | 'battle'` state that a static title cannot follow, so the title is
  `<ArenaHome>`'s own `<h1>` — the screen the route always opens on (T-181).
- **`app/page.tsx` (the root landing page) hand-builds its own `· English Web` suffix**
  — measured live: `title.template` set on the root layout does not apply to a `title`
  defined in a `page.js` of the *same* route segment (confirmed against this repo's own
  `node_modules/next/dist/docs/.../generate-metadata.md`, since this Next.js version can
  differ from training data). Every other route sits in a child segment and gets the
  template automatically; this one is the one documented exception.
- **`scripts/check-page-titles.mjs`** (guard ⓒ) walks `app/**/page.tsx`, excludes
  `app/dev/**` (fixtures, not product), and passes a route when its own `page.tsx` or a
  sibling `layout.tsx` exports `metadata`/`generateMetadata`. Wired into `package.json`
  as `check:titles`, inside `npm run verify` (now **nine** commands — `plan/RULES.md`,
  `docs/agents/QA.md`, `docs/agents/CONTENT.md` and
  `scripts/rules-citations.test.ts`'s own word maps updated in the same commit, the
  exact staleness class that test exists to catch).

**Measured (C-0453), fresh in this clone:** `npm run verify` — `typecheck` clean ·
`check:core` OK · `check:motion` OK (2 known baseline, 0 new) · `check:text-floor` OK (3
known baseline, 0 new) · `check:rules` OK · `check:titles` OK (18 routes checked, 0
missing) · `test` **3459/3459** · `build` succeeded · `check:mobile` **1325/1325
checks**. A live Playwright walk against `next dev` on all 15 non-session-gated routes
(the other 3 — `/cards` · `/me` · `/studies` · `/settings` · `/onboarding` — redirect to
`/login` without a session, unchanged) measured **15/15 distinct `document.title`
values**, including all three `/study?deck=` branches. `npm run generate-map` ran — 398
modules (+1, `app/(tabs)/settings/layout.tsx`).

⛔ **Out of scope, and deliberately not touched:** `meta description` (not measured by
this task), `lang`/`dir` (already 12/12 correct, per C-0451's walk), and the 5
session-gated `app/dev/**` fixtures (excluded from the guard on purpose — they are the
harness, never shipped).

## One wording, one exit label, one place — `SCHEMA_MISSING_HE` · `SIGN_IN_AGAIN_HE` ⟦C-0477 (DEV) · T-273 · F-138 ⓐ · D-065⟧

**Measured before the change (C-0477, live clone):** `const SIGN_IN_AGAIN_HE` declared **10×** under `app/` + `components/` (9 × `'התחברות מחדש'`, 1 × `'להתחברות מחדש'` in `ArenaHome.tsx`), `const SCHEMA_MISSING_HE` declared **11×**, and 8 of the 12 carriers never imported `failureExit` at all. The arena therefore gave the same exit a different name than the table `D-065` wrote — the exact failure class `T-056` was written against, one layer up.

**Where each now lives, and why there and not one file:** `failureExit.ts`'s own header routes «the failure wording» to `failure.ts` and keeps only «where can I go from here». So `SCHEMA_MISSING_HE` (a sentence) is `export const` in `lib/core/failure.ts`, beside `RETRY_HE`; `SIGN_IN_AGAIN_HE` (an exit label) is the already-existing constant in `lib/core/failureExit.ts`, now exported. ⛔ Not inside `FAILURE_HE`: that map is «the product failed, not you» with a full stop, and `failure.test.ts` enforces the full stop — the canonical set-up sentence has none, and inventing one was forbidden by the row.

**The guard counts, ⛔ it does not trust:** `lib/core/failureExit.test.ts` walks `app/` + `components/` (non-test `.ts`/`.tsx`, comments stripped) and asserts **0** local declarations of either name, exactly **one** `SIGN_IN_AGAIN_HE = '…'` in the whole tree (`lib/core/failureExit.ts`), and no `.tsx` printing either string as a literal. `.tsx` only for the sentence: the API routes send the same words in their JSON `message`, and that is the contract, not a screen.

**Side effect measured and fixed in the same commit:** `scripts/link-naming.test.ts`'s coverage gate dropped 18/57 ⇢ 17/57, because `linkLabelScan.ts` resolved a `{IDENT}` label only against `^const` in the same concatenated text — an *imported* constant is invisible. ⇒ `CONST_DECL` accepts `export const`, and the test prepends the two shared copy modules before the tree, so an import resolves like a local constant and a screen's own later declaration still wins (nearest-earlier). Back to **18/57**, unit-tested in `linkLabelScan.test.ts`. ⛔ Not all of `lib/` — only the modules that hold learner-facing copy.

**Left open, on purpose (F-138 ⓑ):** `EXPIRED_HE` (`'ההתחברות פגה. היכנס שוב.'`) still lives in 3 files, and the other 8 screens print `FAILURE_HE.load` on `session_expired` — measured live on `/arcade` under a stubbed 401. Same class, ⛔ outside the row that named two constants ⇒ a task row for PM, not a side-fix.

## The unreachable branch gets its own sentence — `UNREACHABLE_HE` ⟦C-0479 (DEV) · T-274 · D-195⟧

**Measured before the change (C-0478 PM, re-measured C-0479 on a live clone):** `components/AuthForm.tsx:134-137` was `cause instanceof ApiUnreachableError ? AUTH_MESSAGES_HE.unavailable : AUTH_MESSAGES_HE.unavailable` — a branch someone wrote for «the request never left the device» and never gave a sentence. `AUTH_MESSAGES_HE` is the *field-error* map («what did I type wrong», `lib/core/auth.ts:47`), so a dropped network read like a wrong password.

**Where it lives, and why:** `UNREACHABLE_HE` is an `export const` in `lib/core/failure.ts`, beside `SCHEMA_MISSING_HE` — the module whose header already says «the product failed, not you». ⛔ Not a new key in `FAILURE_HE`: that map's `offline` says «הנתונים לא נשמרו», which is false for a login where nothing was going to be saved, and every screen picks a `FAILURE_HE` key by `code` — this is not a code, it is a thrown `ApiUnreachableError` (`lib/api/client.ts:39`). ⛔ Not in `AUTH_MESSAGES_HE`: that map is keyed by `AuthErrorCode` and is the server's vocabulary. `AuthForm` imports it; it still declares no sentence of its own (guarded).

**No second CTA:** the naive reading of D-195 ⓐ («17 files import `RETRY_HE`, `AuthForm` does not — add a button») would have put `נסה שוב` next to `התחברות` — the same intent twice on one screen (`taste-skill § 4.5`). The submit button *is* the retry, and the sentence says so. `components/AuthForm.test.ts` counts `data-primary-action` (exactly 1) and `RETRY_HE` (0) so the button cannot come back quietly.

**Left open, filed as `F-190`:** the same `<form>` carries no `method`, so a pre-hydration submit is a native `GET` with `email` and `password` in the query string — observed in the `next dev` log during this tick's first walk, when a dev-origin 403 kept the page from hydrating. One line to fix, ⛔ outside this row.

## The auth form declares `method="post"` — the pre-hydration guard ⟦C-0482 (DEV) · F-190⟧

**Measured before the change (C-0479 on the `next dev` log; reproduced C-0482 on this clone with JavaScript disabled):** `<form id="auth-form">` in `components/AuthForm.tsx` had `onSubmit` and `noValidate` but no `method`, and both inputs carry `name`. `onSubmit` exists only after hydration; before it, a tap on the button is a native submit, HTML's default method is GET, and the browser navigated to `GET /login?email=…&password=…` — history, server/CDN logs, and the next page's `Referer`.

**The fix is one attribute, ⛔ not a second submit path:** `method="post"`. With JS the handler still calls `preventDefault()` and `POST /api/auth/{mode}` exactly as before (measured: `POST /api/auth/login`, `POST /api/auth/signup`); without JS the native fallback is now `POST /login` / `POST /signup` with the credentials in the body and an empty URL (measured: 0 log lines carry `password=`). The inputs keep their `name` — dropping them would have hidden the hole (nothing sent) instead of closing it, and `components/AuthForm.test.ts` guards both halves.

**Deliberately ⛔ not done here:** `action="/api/auth/{mode}"` plus form-urlencoded parsing in the route, which would make the form work with no JS at all. It changes the API contract (`docs/api-contract.md`) and the route's response shape (redirect vs JSON) — a PM row, as `F-190` itself routes it.


## The deck finish screen counts its own round — `lib/core/roundSummary.ts` ⟦C-0487 (DEV) · T-276 · D-198⟧

**Measured before the change (this clone, `next dev`, 375×780, `[data-deck-done]` text only):** `/dev/deck/done` painted **48** visible characters and **0** sentences about the round (the 127 in `D-198` counts the page chrome too; same screen, different denominator). `CardDeck` already received every grade through `onGraded(wordId, grade)` (`CardGrade = 'again' | 'good'`) and stored only *which* cards left (`graded`), never *what* was marked.

**The shape, and why it is split in two:** the counting and the Hebrew live in `lib/core/roundSummary.ts` (pure: `tallyGrades`, `describeRound(deck, tally)`), the component only holds a second state array `grades` and renders whatever the helper returns inside `[data-round-summary]`. The split is what makes the three fences *unit-testable* instead of source-guarded: `D-033` (a practice deck gets exactly one line and ⛔ no word from {מועד, חזרה, יחזרו, נדחו, בקרוב}), `§ 4.2יג-ב ⓒ` (⛔ never «יודע» — the copy quotes the two button labels, «ידעתי»/«לא ידעתי», i.e. what was *marked*), `D-198 ⓓ` (zero grades ⇒ `[]` ⇒ the screen is byte-for-byte what it was). `components/CardDeck.test.ts` then proves only the wiring: the count sits after the `catch` (a rejected grade is ⛔ not counted), the helper is called with `deck`, and the component mints no sentence of its own.

**The due-deck sentence is phrased on what `scheduleReview` guarantees, ⛔ not on what it usually does:** «נקבע מחדש» (always true — `next_review_at` is rewritten on every grade) and «יחזור/יחזרו אליך בקרוב» for `again` (true at `FIRST_INTERVAL_DAYS`=1 *and* under triage=today). «נדחו» was deliberately ⛔ not written: under triage a `good` card also returns today, and a sentence true only outside triage is the arena's 23/08 class.

**Fixture seam, ⛔ not a product input:** `initialGrades?: readonly CardGrade[]` (default `[]`) exists so `/dev/deck/done/due` can render the branch with a seeded finished round; `check:mobile` now asserts 2 summary lines on that route, all inside the viewport, and **0** on `/dev/deck/done`. Measured after: `/dev/deck/done/due` **163** characters, 2 lines (bottoms 194/270px at 320, 170/246 at 375/414), `taps=1`, `under44=0`, `hscroll=false` at all three widths; `/dev/deck/done` unchanged at **48**.

## The card drag writes to the node, and the pointer is captured — `components/Flashcard.tsx` ⟦C-0488 (DEV) · T-233 · `apple-design` § 1 · § 2⟧

**Measured before the change (this clone, `next dev`, Chromium, 375×780, `/dev/deck`):** a swipe that started 12px inside the section and lifted 24px above it (over the deck header, +120px horizontal, well inside `SWIPE_MAX_ANGLE_DEG`) left `remaining 5 → 5` — the section never heard the `pointerup`, and the card hung mid-gesture with nobody grading it. And every `pointermove` went through `setDragX` ⇒ a re-render of the whole card subtree to move one `translateX` (C-0371; ProMotion sends up to 120/s).

**ⓐ The offset is a DOM write, ⛔ not state.** `sectionRef` + `pendingX` + one `requestAnimationFrame` per frame (`queueDrag` → `writeDrag`): the node gets `style.transform` and `data-dragging` directly, so `globals.css:279` (`transition: none` while dragging) keeps working unchanged. `resetDrag` cancels the pending frame first — without that a stale offset lands *after* the reset on a card that was already graded. `dragOffset` in `lib/core/swipeGrade.ts` is untouched: the *rule* (1:1, `reducedMotion ⇒ 0`, non-finite ⇒ 0) still lives in the pure layer; only the *write* moved. `useEffect(…, [card])` resets the node when the card swaps mid-gesture, because render may not touch the DOM.

**ⓑ `setPointerCapture` on `pointerdown`, released explicitly on `up`/`cancel`** (`hasPointerCapture` first — releasing an uncaptured pointer throws). Precedent `SpellCard.tsx:79`. **Measured in Chromium before writing it, ⛔ not assumed:** capture on the parent `<section>` retargets the following `click` to the section, and a child `<button>`'s handler never runs. The section holds the reveal button and both grade buttons (D-042's canonical channel) ⇒ an unconditional capture would have killed all three. The capture is therefore taken only when `swipeActive` **and** `e.target.closest('button, input, a') === null` — a gesture that starts on a control is that control's, not a swipe. `Flashcard.test.ts` guards the shape (`setPointerCapture(` inside `onPointerDown`, the `closest(…button…)` guard, `releasePointerCapture(`, no `setDragX`, no `style={`, `requestAnimationFrame(`/`cancelAnimationFrame(`); `verify-mobile.mjs` ⓓ measures the behaviour on `/dev/deck` (finger leaves the section ⇒ still grades), and `/dev/card/swap` already clicks `[data-grade="good"]` after a reveal — the live guard against the click-steal.

**⛔ Not in this change (fence in the row):** velocity (`apple-design` § 5 · § 6) waits on `D-158 § ב׳`; `transition: transform 200ms ease-out` in `globals.css` untouched; `prefers-reduced-motion` still returns `x: 0` in the pure layer.

**Measured after (same clone, same route):** reveal click ⇒ back count 1; grade button click ⇒ `remaining −1`; mid-gesture node `style="transform: translateX(120px)"` + `data-dragging="true"`; leave-section swipe ⇒ `remaining 4 → 3`; after release `style`/`data-dragging` both gone; sub-threshold drag ⇒ not graded, no leftover transform; drag starting on a button and ending off it ⇒ not graded; console errors **0**.

## The release is a spring, rendered by the browser — `lib/core/spring.ts` · `components/Flashcard.tsx` · `components/SpellCard.tsx` ⟦C-0494 (DEV) · T-243 · T-259 · `apple-design` § 3 · § 4 · § 5⟧

**07/09 · C-0494 · T-243/T-259 — `lib/core/spring.ts` והחוזה של שני המאפיינים.** הקפיץ (ζ=1, response 0.3) הוא פונקציה סגורה ב-`/lib/core`; הרכיב ⛔ אינו מריץ שעון. `releaseCurve` דוגם את הפתרון ל-`linear(0, …, 1)` + משך השתקעות, והרכיב כותב אותם כ-`--kol-release-ms` / `--kol-release-ease` על הצומת; `globals.css` צורך אותם ב-`[data-flashcard][data-release]` וב-`[data-arena-card]`, עם ברירת מחדל 200ms ease-out למנועים בלי `linear()`. ⛔ `var()` עם פסיק בתוך `transition:` שובר את `check-motion.mjs:115` ⇒ ברירות המחדל על הסלקטור. תפיסה באמצע טיסה: `getComputedStyle().transform` ⇒ `baseX` ל-`dragOffset`. ציון שלא נלקח (הצרכן פתר את ה-promise והכרטיס עדיין מורכב) ⇒ הכרטיס חוזר — `CardDeck` מחזיר עכשיו את ה-promise של `grade`. **ההחלקה היא ערוץ הסימון הראשי** (T-259ⓕ); שני הכפתורים נשארו ב-DOM `sr-only` עד פוקוס — הערוץ הנגיש (שכבה א׳), אותו `onGrade`. **reduced-motion:** `dragOffset` ⇒ 0, `releaseCurve` ⇒ `ms 0`, ו-`release()` ⛔ אינו כותב תנוחת יעד — הכרטיס ⛔ קופץ, המשוב הוא התג וההעמעום.

**Measured (this clone, `next start`, Chromium, 375×780, `/dev/card`):** drag 100px ⇒ `translateX(100px) translateY(6px) rotate(-3.03deg)` + `data-swipe-preview="good"` · release from 20px ⇒ `[data-release]`, `--kol-release-ms: 289ms`, `transition-timing-function: linear(0, 0.595, 0.975, 1.205, …)` · full swipe on the no-op fixture ⇒ off and back to `transform: none` within 1.2s, `data-swipe` cleared · focused grade button 161.5×52 · console clean · `check:mobile` 1418 (+27 lines).

## The deck's way out is a written row inside its own column — `components/CardDeck.tsx` · `components/StudyDeckScreen.tsx` ⟦C-0490 (DEV) · T-268 · `ui-styling`⟧

**Measured before the change (this clone, `next dev`, Chromium, 375×780, `/study?deck=level` with `/api/study/queue` mocked to three fixture cards):** the T-087 close — `<Link absolute start-2 top-2>` carrying `<CloseIcon>` alone, `aria-label="סגור"` — occupied x=303..347 · y=60..104. `<CardDeck>`'s own `<header>` row occupied y=52..89 with the practice notice at x=140..355 · y=60..80 and «נותרו 3» at x=20..64. The icon box sat on the notice text and its glyph crossed the header border at y=89, four pixels above the first card (y=105). That is the «broken card view» Roy reported on 06/09 (T-268 ⓑ). Zero console errors, zero horizontal scroll — nothing in `check:mobile` could have caught it, because `/dev/deck` renders `<CardDeck>` without the close: a fixture that differs from production in one dimension is a hole, ⛔ not a test.

**Root cause, ⛔ not a symptom:** T-087 assumed the top-start corner of the section was empty chrome. It is the first row of the component underneath. Any overlay anchored there returns to the same overlap regardless of what it holds, and a written label («חזרה לכרטיסיות», 126px) would have covered more of the notice, not less.

**The shape:** `<CardDeck>` takes an optional `exit?: { href; labelHe }` and renders it as the FIRST row of its header (`<Link data-deck-exit>`, `min-h-touch min-w-touch`, underline — ⛔ colour never the only channel, ⛔ no `aria-label` because the visible text is the accessible name, ⛔ no `data-primary-action` — `/study` is a FLOW_ROUTE and the harness counts exactly one). Inside `h-[calc(100dvh-10rem)]` the extra row is absorbed by the `min-h-0 flex-1` scroller, so TD-30's calc on the outer chrome is untouched by construction; a sibling row in `<StudyDeckScreen>`'s `<section>` would have pushed the grade buttons under the fold (T-086). `<StudyDeckScreen>` passes `{ href: '/cards', labelHe: BACK_TO_CARDS_HE }` — the constant it already printed on the empty practice deck, D-187 §ג׳.1's `חזרה ל<יעד>` — and drops the overlay, the `CloseIcon` import and the `relative` on the section. `/dev/deck` passes the same slot, so the harness now measures what production renders. **§ 0.22 call, logged:** the row's wording prescribed «absolute on the section, exactly like the existing close»; the slot inside the component is the deviation, and one commit reverts it.

**Measured after (same clone, same route, same mock):** exit 126×44 at y=60..104 · notice y=108..128 · «נותרו» y=108..128 (⛔ zero overlap) · header 85px · snap viewport y=137..672 (535px) · card 519px inside it · deck 52..672 inside `main` 52..704 · `scrollWidth` 375 · zero console errors. `scripts/verify-mobile.mjs` gained five checks on `/dev/deck` at 320/375/414 (exit exists · reads «חזרה לכרטיסיות» · ≥44×44 · intersects neither `[data-practice-notice]` nor `[data-remaining]` · ends at or above `[data-deck-scroll]`'s top) plus a `T-268:` report line with the geometry. The T-087 source guards in `StudyDeckScreen.test.ts` (icon, `aria-label="סגור"`, `absolute`) were rewritten for T-268, ⛔ not softened: they enforced the decision this task reverses, and a guard that now forbids `data-close`/`absolute` in the cards branch replaces them.

## The deck tile box carries the render's three values, and the 4px lives on the list — `components/DeckSelector.tsx` · `docs/design/render_video_A.py` ⟦C-0499 (DEV) · T-228 · D-155⟧

The render draws each deck as `rr(24, y, LW-48, 62, 16)` (radius corrected 18→16 in this tick — the five-value scale is the constitution's, D-155). `<main>` pads every column to x=20 · w=335 (`app/layout.tsx:57`), so the delta is `mx-1` on `<ul data-deck-selector>` alone — ⛔ the global padding is not one row's to move (the screen-wide gap is `F-198`, PM's call). Height 62 is the sum of what is already there: 1+6 (border + `py-1.5`) + 28 (`text-lg` name) + 20 (`text-sm` note) + 6+1, ⛔ no inner gap, ⛔ no fixed `h-[62px]` — `min-h-touch` stays under it, so a note that wraps grows the box instead of clipping (the failure scenario the task row names). Measured live at 320/375/414: x=24, w=272/327/366, h=62 on all four tiles, name centre 21 and note centre 45 against the render's 22/45.

## The character is a jsonb key, a pure rule, and a third shell state — `lib/core/arenaCharacter.ts` · `app/api/arcade/character/route.ts` · `components/ArenaCharacterChoice.tsx` · `components/ArenaShell.tsx` ⟦C-0502 (DEV) · T-217 · `37 § 7` · D-133 · D-152⟧

**The three layers, as the repo already enforces them.** The **rule** is `lib/core/arenaCharacter.ts` (pure, `check:core` green): `ARENA_CHARACTERS` (`wizard` · `warrior` · `armorer`, frozen, in the order of the `§ 7` table), `CHARACTER_LABELS_HE` · `CHARACTER_BIAS_HE` · `CHARACTER_INTRO_HE` (every string a substring of `plan/37-arena-spec.md` after stripping markdown `**` — the test proves nothing was invented, and ⛔ no digit is allowed in any of them: «בלי טבלאות מספרים»), `characterFromParts` (⛔ never throws on the `jsonb default '{}'` blob) and `withCharacter` (spread + one key). The **route** `PATCH /api/arcade/character` applies a write plan and ⛔ does not decide: `readSupabaseEnv ⇒ auth.getUser ⇒ select('avatar_parts').maybeSingle ⇒ upsert({ user_id, avatar_parts }, { onConflict: 'user_id' })`. `arcade_level` · `wins` · `unlocked_items` are ⛔ absent from the statement, so `§ 7`'s «בלי לאבד רמה, גביעים, ציוד או שברים» holds **by construction**, and `route.test.ts` asserts it on the source. **D-152 — ⛔ no migration**: `0014_arcade.sql` already holds `avatar_parts jsonb`; a key inside it is a write. `GET /api/arcade/home` selects the fourth column and returns `character: ArenaCharacter | null`; it stays read-only (test).

**The avatar draws three silhouettes on one skeleton (`38 § 6`).** `ArenaAvatar` takes `character?: ArenaCharacter | null`; `CHARACTER_LAYERS` maps each character to signature shapes on `LAYER_ORDER` layers, every coordinate from `characterBase.ts` anchors (`MAIN_HAND` · `OFF_HAND` · `BODY` · `HEAD` · `SHOULDER_R` + `mirror`) — wizard: staff on `mainHand` + robe hem on `legs` · warrior: round shield on `offHand` + chest plate on `chest` · armorer: visor on `headgear`, two shoulder pads on `shoulders`, barrel on `mainHand`. They render as `<g data-arena-character>` between `base` and `equipped` (`38 § 4`, base under equipment), ⛔ zero sprite copied from `render_video_B.py` (test). The accessible name says `הדמות שלך · קוסם` — shape is ⛔ not the only channel. `ArenaStage` and `ArenaBattle` pass `character` through as a prop; `GET /api/arcade/round` ⛔ did not widen.

**The screen and the shell.** `ArenaCharacterChoice` takes its geometry from `screen_home` (`render_video_B.py:113-191`): title 24px bold, intro 12px (D-137 floor), each character a `<button aria-pressed>` in `CARD_CLASS` with a live idle (`arena-idle-bob_4.19s` + `motion-reduce:animate-none`, ⛔ no new keyframe), name 15px bold, bias lines 12px, `בחר` in `START_CLASS` (58px) disabled until a card is chosen and carrying the visible reason `בחר דמות כדי להמשיך` (`aria-describedby`), `חזרה למסך הבית` (44px) only when `onBack` is present. Selected state in four channels: `aria-pressed` · the word `נבחר` · `CheckGlyph` · the gold border. `ArenaShell` holds `'home' | 'character' | 'battle'` — a module boundary, ⛔ not a route (`RULES § 0.22`): `התחל קרב` with `character === null` opens the choice with ⛔ no exit, then the battle; `עיצוב דמות` opens it with an exit and returns home, where `ArenaHome` remounts and re-reads the server — one source of truth. `ArenaHome`'s `עיצוב דמות` is live (`DESIGN_SOON_HE` deleted, the disabled-with-reason test flipped).

**Measured (this clone, `next dev`, Chromium, 780px high, `/dev/arcade/character` first entry):** 375 ⇒ heading `בחירת דמות` · 231 chars · 5 tappables · **0 under 44px** · scrollWidth 375 = viewport (⛔ no horizontal scroll) · `dir=rtl` · 3 idle avatars (7 signature groups) · `בחר` disabled · 3 × `aria-pressed=false` · **0 console errors**. 320 ⇒ identical, scrollWidth 320. 414 ⇒ identical, scrollWidth 414. `/dev/arcade/home` 375 ⇒ 5 tappables (was 4 in C-0499 — `עיצוב דמות` now counts), 0 under 44, no horizontal scroll, the pedestal draws `warrior`. ⚠️ On the 320/414 runs and on home the console carried `403` resource errors and an HMR websocket failure — the CCR egress proxy (F-200's class), present on the untouched home fixture too, ⛔ not the screen.

**Layer A over the render — three numbers, all measured by `check:mobile` on the first push attempt (refused by the hook), ⛔ not estimated:** ⓐ `בחר` disabled through `opacity-70` ⇒ its text measured **1.07:1** ⇒ the disabled state is now tokens (`--arena-card` · `--arena-card-edge` · `--arena-ink-dim`, the pair `SECONDARY_CLASS` already measures green), ⛔ not opacity; ⓑ the avatar's signature shapes as `text-ink` outlines (night blue in the arena) measured **1.12:1** against the card — inside a `<button>` the gate measures every SVG shape against the card, since an SVG fill is not a `background-color` ⇒ the signature layer is a **filled silhouette in the role colour** (the same fill the base passes with), and every shape extends past the body outline so it stays visible (a gold plate on a gold body is no plate); ⓒ the render's stone pedestal (`--arena-stone`) inside the pressable card measured **1.8:1** ⇒ one ellipse in `--arena-ink-dim`. `/dev/arcade/home` keeps the render's pedestal — there it is not inside a pressable.

**⛔ Not built, by measurement (F-202, PM):** a character **name** (`§ 7` names no closed list) and the biases as **battle numbers** (`battle.ts` holds no per-character constant). Both stay rows, ⛔ not guesses.

**The bias is a row of state, the enemy is a constant — `lib/core/battle.ts` ⟦C-0509 (DEV) · T-281 · `37 § 7` · D-200⟧.** `CharacterBattleStats` carries exactly the four `§ 7` columns (`learnerHp` · `hitDamage` · `criticalDamage` · `swingPenalty`); `BASE_STATS` is the «בסיס» row and `CHARACTER_STATS` the three rows under it (`armorer` **is** `BASE_STATS`, same reference); `statsFor(unknown)` ⛔ never throws — `null`, `'Wizard'`, `7` ⇒ base (fence 4). `startBattle(words, character = null)` puts the row on `BattleState.stats`, and `cast` reads damage and penalty **from the state it was given**, ⛔ never from a module constant — so a battle carries its own law and a test cannot start one at `3/20`. `ENEMY_HP = 20` moved out of `ArenaBattle.tsx` as **one** exported constant, ⛔ not a per-character field: fence 1 says the enemy is the same enemy for all three, as are `BATTLE_MS` · `MANA_MS` · `MANA_CAP` · `CRITICAL_MS` · `ENEMY_SWING_MS` · `SWING_DAMAGE` and the `§ 2` mix. `ArenaBattle.tsx` lost `LEARNER_HP`/`ENEMY_HP` and passes its existing `character` prop (T-217) into the three `startBattle` calls; the HP bar still draws a percent (`render_video_B.py:475`), so the screen is pixel-identical and the bias changes only how fast the bar moves. The test parses the `§ 7` markdown table out of `plan/37-arena-spec.md` — the numbers have one owner, the spec. **Still words, by spec:** «מאנה מהירה יותר» · «חיים נמוכים» · «יכולות מתקררות מהר» · «ירי מטווח» — `§ 4` abilities that are ⛔ not built, and `battle.test.ts` bans `cooldown|shield|heal|freeze|ranged` from the engine so nothing is invented for them. `lib/core/arenaCharacter.ts` stays the **words** file, untouched (`RULES § 0.22` ⓐ).



## C-0505 (DEV) — `T-234` · `T-220` ⓐⓓ — the motion gate learns one declared exception; `?` becomes a property of the option's source

**`scripts/check-motion.mjs` — `DECLARED_KEYFRAME_EXCEPTIONS` (T-234 · D-201 · 35 § ב6).** Rule ⓐ stays: any `@keyframes` on a paint property is a violation. The one exception is a frozen list of **file + name + property** — `app/arcade/arcade-tokens.css` · `arena-impact-a`/`-b` · `color` — and it holds only while every `animation:` naming the block is `steps(1, end) 1`; a fence that breaks is reported under the same key, so the baseline cannot absorb it. Adding an entry is a PM/Roy action, the same rule as the baseline. `scripts/motion-baseline.md` is now **0 rows**, `MAX_BASELINE` in `motion-gate.test.ts` is **0** — raising either is outside DEV.

**`lib/core/arcadeRound.ts` — `ArcadeOption = { he, kind }` (T-220 ⓐ · D-143 § ד׳).** `options` is an array of objects on the wire (`docs/api-contract.md` updated in the same commit). `kind` is resolved in `buildRound` from a `translation ⇒ wordIds` map over **all** candidates against `touchedWordIds`: `unseen` iff every source word is untouched; unresolvable ⇒ `met`; no groups ⇒ `met` (the same «ignorance is not a category» default as `kindOf`). The answer is `met` by construction. `ArenaBattle.tsx` renders `unknown={option.kind === 'unseen'}` and the dead `option === '?'` branch is gone.

**`lib/core/battle.ts` — `returnedSpell(state)` (T-220 ⓓ · D-139).** Derived, ⛔ not stored: `casts.at(-1)` wrong **and** `words[index-1].kind === 'unfiltered'`. The tail copy `cast` requeues is `base`, so the reveal happens once. `ArenaBattle` shows it as a `role="status"` line above the hand and the next cast clears it.

⚠️ **Not measured live this tick:** `next dev` under CCR returns 403 on chunks (F-204); the 375×780 walk of `/dev/arcade` is QA's on `next start`.

## C-0513 (DEV) — `T-282` · `T-283` — the cast carries its kind; the ending is three states computed in core

**`BattleCast.kind` is stamped at cast time — `lib/core/battle.ts` ⟦T-282 · `37 § 2` · `37 § 10`⟧.** `cast` copies `word.kind` onto the cast literal, and because the requeued copy of a missed `unfiltered` spell is `base`, «met for the first time» is exactly `kind === 'unfiltered'`, once per word — no second flag, no lookup back into `words`. `summarize` (`lib/core/arenaSummary.ts`) returns it as `firstMet` (first cast per `wordId`, right or wrong, a `Set` as the guard) next to `slow`; `firstMetHe(n)` builds the render's title. `<ArenaSummary>` draws `[data-arena-first-met]` only when `N > 0`, names each word inside `<EnWord>` at **12px** (Layer A floor; the render's 11.5 is a declared 0.5px gap) and fills with `bg-brand-surface/15` — the F-036 guard (`lib/core/palette.test.ts`) bans the bare brand token as a fill in every `.tsx`, so the render's α38 brand tint is a declared, measured deviation. **Read-only by scan:** ⛔ no `fetch`, `apiPost`, column name, `.filter(` or `.reduce(` in the component. The field never reaches the wire — `ArenaBattle.tsx` still builds `ArcadeAnswer` by named field. The `○` selection control and `הוסף לכרטיסיות` stay blocked in `03-for-roy` item 105.

**The ending is a value, ⛔ not a boolean — `lib/core/arenaSummary.ts` ⟦T-283 · `37 § 9` ח4 · D-202 § ה׳⟧.** `wordsFromBoss(state) = ceil(enemyHp / max(1, hitDamage))` in `battle.ts` — `hitDamage`, ⛔ not `criticalDamage`, so «היית N מילים מהבוס» is true without a condition on speed (`RULES § 0.22`, logged). `endingOf(state, elapsedMs)` wraps `outcomeAt`: `null` while `running`, else `{ kind: 'victory' \| 'survived' \| 'outlasted', wordsFromBoss }`. `<ArenaSummary>` takes `ending` instead of `enemyDefeated`: victory keeps `היריב נוצח`; otherwise the `h1` names the number and a 12.5px `[data-arena-ending]` line states one fact — `outlasted` ⇒ «החזקת מעמד עד סוף השעון», `survived` ⇒ «היריב החזיק מעמד» (each true in every state of its kind, R-016). `ArenaBattle.tsx` computes `ending` at the one place it computed the outcome and keeps `if (finished)` as the guard — `finished` is a `const` alias of `ending !== null`, which TypeScript narrows through, and the T-253 scan anchors on that literal. The D-126 guard in `app/arcade/page.test.ts` now lists `endingOf` where it listed `outcomeAt` — the screen still imports the law, through the wrapper (`RULES § 0.22`). `<ArenaResult enemyDefeated>` is untouched (its duplicate heading is D-202 § ו׳, CRITIC's). Source scans now ban «הפסדת» and «הקרב נגמר» in the component.

⚠️ **Measured live this tick (375×780, `next dev`, `/dev/arcade/summary`):** 253 chars (was 203) · 2 tappable (unchanged) · 0 < 44px · 0 h-scroll · blue board with 4 `<EnWord>` · red board 3 · `[data-arena-ending]` absent (fixture is `victory`, as the render). The 403s on `_next` chunks are F-204 (CCR `next dev`), the page still rendered and was measured.

### C-0518 · `הודעות` — the simulation inbox (T-190 · T-191)

`supabase/migrations/0023_message_simulations.sql` adds `message_simulations` and
`message_simulation_state`. **⛔ Zero foreign key to the arena and zero to `word_progress`**
— the D-054 row for `הודעות` reads «⛔ מנותקת לחלוטין», and the boundary is enforced by
absence, ⛔ not by a comment.

The three layers are the repo's usual ones: `lib/core/messages.ts` is pure (mapping,
merge, counts, the list formatting — `now` arrives as a parameter, ⛔ never read here),
`app/api/world/messages/route.ts` is the only reader of the two tables, and
`components/InboxList.tsx` draws rows that arrive already formatted (`toInboxRows`).
⚠️ **The route is a SOFT read — every read failure is `200 ok:false`, ⛔ never 503** —
because the inbox is one node of nine on the ring and a 503 there is a failure screen for
a learner who came for something else.

`lib/core/worldRing.ts`: `msgs` is now `open` onto `/world/messages`. ⚠️ The empty-ring
branch is scoped to `LIVE_IDS` — a permanently-open node would otherwise have made
`D-064`'s empty screen unreachable. See `F-210`: whether that scoping is the right
semantics is PM/QA's call, ⛔ not DEV's.

### C-0522 · `הודעות` — the open message (T-192)

`lib/core/requiredWords.ts` is the second pure module of the department: `requiredWordsProgress`
matches a required word against the learner's tokens **exactly**, after `trim` + `toLowerCase`.
⛔ **No lemmatiser, and that is DECLARED rather than missing** — the block keyboard (`39 § 3`,
blocked by `R-026`) emits whole blocks, so the only tokens this rule will ever see are words
picked from a closed set. `visited` ≠ `visit`; when the keyboard lands, PM decides whether that
stays true, because it is a pedagogical call.

`app/api/world/messages/state/route.ts` (PATCH) is the department's **only writer**, and it
writes exactly one column — the learner's own `read_at`. ⛔ The «answered» column is ⛔ never
written anywhere: the keyboard that would earn it is `R-026`, and a state the learner cannot
reach is a state ⛔ nothing may set. The row is keyed on the **session** user, ⛔ never on a
body field. ⚠️ **It is a HARD call (503), unlike the soft GET beside it** — a failed read still
leaves the ring usable, while a write that silently reports success would leave the blue dot
lit on the next visit with ⛔ nothing saying why.

**Route ownership:** the list lives at `app/(tabs)/world/messages` (the tab bar is the group
layout's) and the open message at `app/world/messages/[id]` — **outside** `(tabs)`, the
`/world/compose` precedent. That is structural: render `kol-C-14-mail-open.png` draws ⛔ no tab
bar, `D-028` allows one bar per screen, and here that one bar is the **disabled compose strip**
— present with its condition named (`D-046` · `D-096`), ⛔ never removed.
`components/SimulationMessage.tsx` draws and ⛔ does not compute; its one write is the PATCH
above, fire-and-forget, so a failed dot ⛔ can never turn a readable message into a failure
screen.

⚠️ **One reversible call logged under `RULES § 0.22`, and it is a SCANNER fix, ⛔ not a product
one:** `scripts/build-surfaces.mjs` counted an entrance only from a **quoted literal** of the
route. ⛔ Nothing writes `'/world/messages/[id]'` — a dynamic href can only be built as a
template (`` `/world/messages/${it.id}` ``, `lib/core/messages.ts`) ⇒ the scanner reported a
screen with three live rows linking to it as «⛔ אינו נגיש בהקשות», and the phantom-flag gate
(`D-191` · `T-272`, ceiling 6) went red on a flag that was ⛔ never real. ⇒ for a route carrying
a `[param]` segment, its static prefix followed by a template substitution now counts too.
⛔ **Narrow on purpose, and pinned by two tests:** a `[param]` route ⛔ nobody names is still
flagged. Measured: `7 → 6`, the same six «⛔ אין מצב ריק כתוב» rows as before.

## C-0533 (DEV) — `T-291` — the dashboard reads what the practice engine writes, and the tab list stops being a literal

**The screen decides nothing.** `components/AmirnetDashboard.tsx` receives `cards`, `weakness`
and `hasAnswers` already computed and renders them; `lib/core/amirnetPractice.ts` gained
`weakestCard()` · `hasAnyAnswers()` · `zeroStats()` and a second Hebrew line on the card
(`answeredShortHe`). The reason is the one the module's own header already gave: the practice
menu (`T-286`), the question header (`T-287`) and now the dashboard need the SAME three facts,
and a statistic computed in three components can only drift. `weakestCard` delegates the
decision itself to `weakestType`, so the three refusals to guess — nothing answered · some type
never tried · a tie at the bottom — stay in exactly one function.

**Two `(tabs)` routes, and both ship the written empty state on purpose.**
`/world/amirnet` and `/world/amirnet/practice` exist and touch ⛔ no database:
`public.sense_items` carries ⛔ no question type, options, `correct_index` or explanation
(`F-222`, measured C-0531), so ⛔ nothing writes a practice result yet and `T-297` is blocked on
that schema decision. `zeroStats()` says exactly that, and the screen prints a sentence instead
of `—` or `0%` (`T-291ⓓ`). ⚠️ The ring node `אמירנט` stays `locked_infra`
(`lib/core/worldRing.ts:252`) — flipping it is a NAVIGATION decision and PM's alone.

**`AMIRNET_BUILT_TABS` — the walk's own finding, fixed in the same tick.** «which tabs exist»
was a literal at **four** call sites across three files, and the moment the dashboard shipped,
the practice menu and both question states kept telling a learner `דשבורד · טרם` — about a
screen that was already there. `D-152 § ב׳` permits «טרם» because it is a STATEMENT OF FACT; a
stale one stops being one. The list now lives in `components/AmirnetTabs.tsx`, and `T-296`
(simulation) flips ⛔ one line.

**The bar tints moved to `components/amirnetTypeBar.ts`, which now owns the measurement.** The
render colours the three type bars by RANK — `BRAND_SURFACE · DANGER · AMBER`
(`docs/design/render_video_D.py:41-43`) — and ⛔ neither half is buildable: `--danger` is this
product's INCORRECT-state token, and `AMBER #f2b544` measures **1.75:1** on `--surface` and
**1.83:1** on `--surface-raised` against a 4.5:1 body-text floor, since the render draws the
percentage ITSELF in that colour (`:75`). That is the accessibility-gate carve-out `36 § 14.4`
names. The weakness strip keeps `--danger` because there the colour marks a genuine STATUS, and
it ships the way `lib/core/palette.ts` says status always ships: icon **and** label.

## C-0536 (DEV) — `F-224` — a tab that a learner is told is BUILT now goes somewhere

**The defect was an absent attribute, and that is why nothing caught it.** Every tab was a
`<span role="tab">` with ⛔ no `onClick`, ⛔ no `href` and ⛔ no router call — in the component
itself, and at all four call sites. A learner on the dashboard who pressed `תרגול` — a tab the
product itself declared built, `aria-disabled="false"`, ⛔ no «טרם» — got ⛔ nothing: no
navigation, no error, no feedback. The only route between the two built screens was out through
`world/ring` and back in. `RULES § 0.31`, «פעולה שלא עושה כלום».

**`AMIRNET_TAB_HREF` sits next to `AMIRNET_BUILT_TABS`, and the adjacency is the design.** The
built list is what turns a tab into a link, so a key flipped there without a route here is a
learner sent to a 404. `AmirnetTabs.dom.test.tsx` measures exactly that coupling — every BUILT
key must resolve to a `page.tsx` **that exists on disk** — which is why `T-296` cannot flip
`simulation` before `/world/amirnet/simulation` lands. ⛔ The map holds the PRODUCT routes and
⛔ never the `/dev/amirnet/*` fixtures: those are `STEP 6.5` walk harnesses, ⛔ not a surface a
learner reaches, and a bar that navigated inside them would be measuring a product that does not
exist. `PRACTICE_HREF` in `AmirnetDashboard.tsx` is now that map's entry rather than a second
copy of the same string — the weakness strip and the `תרגול` tab are one destination.

**An unbuilt tab stays a `<span aria-disabled>` and is ⛔ never a link** — present, disabled,
«טרם», exactly as `D-152 § ב׳` requires. A built tab also carries `aria-current="page"` when it
is the one the learner is on: `aria-selected` says which tab is active, `aria-current` says they
are already there, and a link needs the second.

🔬 **THE LESSON, and it is the reusable half.** `AmirnetTabs.test.ts` held four assertions and
all four were green for the whole life of `F-224` — right strings, right RTL order, right 44px
floor, ⛔ no fetch. They read the SOURCE, and the source read perfectly; what was missing was an
attribute ⛔ nobody thought to assert. ⇒ the guard is a RENDER now. One assertion in it
(`aria-disabled={!live}`, the literal text of one expression) was pinning an implementation shape
rather than a behaviour, and it is the one that went red on the fix — a source scan failing
*because the code improved* is the signature of a test measuring the wrong thing.

⚠️ **What was ⛔ NOT widened.** `role="tab"` on an anchor is kept: with real page navigation the
ARIA tabs pattern is arguably the wrong one, but the bar's structure comes from `41 § 7` and the
render `kol-D-03`, and changing it is a screen-structure decision, ⛔ not this finding's.
Recorded here rather than acted on.

## C-0538 (DEV) — `T-296` — the chapter owns the clock, so leftover time has nowhere to go

**Where the rule lives.** `41 § 2` carries two binding time rules — «שעון נפרד לכל פרק» and
«אי אפשר להעביר זמן שנותר לפרק הבא» — and the naive shape (a total budget, minus what has been
spent) satisfies the first and ⛔ silently breaks the second. ⇒ the state carries
`chapterStartedAtMs`, **the stamp the CURRENT chapter began at**, and the clock is always
`chapter.seconds - (now - chapterStartedAtMs)`. A chapter that ends with 90 seconds left therefore
⛔ has no leftover to hand anywhere: the next chapter is re-stamped from `nowMs` and reads its own
budget. The rule is **structural**, ⛔ not a subtraction anyone has to remember.
🔬 Measured live in the walk (`next start`, 375×780): chapter 1 read `3:59`, and pressing through to
chapter 2 read `4:00` — its own full budget, ⛔ not `4:00 + 3:59`.

**TWO transitions, and `advance()` alone could ⛔ not express the second.** A chapter that expires on
question 2 of 4 must move to the NEXT CHAPTER (`T-296`ⓑ: «בסיום הפרק הוא מעביר לפרק הבא»), ⛔ not to
question 3 of a chapter the learner can no longer answer in — which is exactly what `advance()`
would have done. ⇒ `advanceChapter()` abandons the question index; the component picks the path by
asking `isChapterExpired()` at press time, so the choice is ⛔ not a second copy of the rule.

**⛔ The interval computes ⛔ nothing** (`T-296`ⓒ). `setInterval` moves one display timestamp
(`tickMs`); every question about that timestamp — how much is left, whether the chapter is over — is
asked of `lib/core/`. ⇒ a throttled or backgrounded tab ⛔ cannot under-count its way into a chapter
that never expires, and `AmirnetSimulation.test.ts` asserts the interval touches ⛔ neither
`setState` nor `advance`.

**⛔ `advance()` takes ⛔ no answer, and that is the adaptivity fence.** `41 § 8` item 4 owns chapter
selection and `41 § 9.2` puts the score formula with **Roy** ⇒ the signature is `(state, nowMs)` and
a test asserts its arity, so a later tick ⛔ cannot quietly thread correctness through it. `41 § 3` is
explicit that adapting after each question is structurally wrong, ⛔ not a tuning choice.

**🔴 The countdown is the PRODUCT here, and it ⛔ does not contradict the practice screen.**
`lib/core/amirnetQuestion.ts` counts UP, because `R-020` forbids time pressure outside the arena and
`D-049` narrows a clock to known material — and both that file and `components/AmirnetQuestion.tsx`
already said, before this tick existed, that the reasoning ⛔ does not reach the simulation. `41 § 2`
makes a per-chapter countdown a rule **of the exam being simulated**. ⇒ `F-222`'s declared gap on the
practice clock is ⛔ untouched, and this is ⛔ not a second deviation.

**One `bg-brand` in a COMMENT reddened the palette gate.** `lib/core/palette.test.ts` (`F-036`) reads
the raw source, ⛔ not a comment-stripped copy — so the sentence explaining why the token is
unavailable was itself the violation. ⚠️ Worth knowing before the next component: `AmirnetDashboard.test.ts`
strips comments and `palette.test.ts` ⛔ does not, and the two disagree on purpose.

**Debt, declared:** the product route is ⛔ not open and `simulation` stays «טרם» in
`AMIRNET_BUILT_TABS`. `F-222` blocks the item schema and `T-297` is still ⬜ ⇒ there is ⛔ no honest
source of items, and a tab navigating to «אין פריטים» is `RULES § 0.31`. The flip is one line in
`components/AmirnetTabs.tsx`, and it belongs to the tick that lands `T-297`. ⚠️ For the same reason
the walk fixture holds **one** item (the render's own `SQ`, :249-251): `41 § 6.3` forbids borrowing a
second from the spec, so questions 2–4 of chapter 1 show the written «אין פריטים לפרק הזה» state.

## C-0544 (DEV) — `T-298` — the result screen reads the run, and ⛔ invents the one number it is not allowed to

**⛔ The rows are the run's, ⛔ never the chapter table's.** `resultRows()` maps the outcomes the
run produced — one row per chapter it **finished** — and a run stopped after five chapters therefore
draws **five** rows. `T-298`'s own failure scenario is the other shape: six rows with a `—` in one of
them, i.e. a measurement that never happened, printed as if it had. ⇒ the short run says so in a
**sentence** (`shortRunNoticeHe`), the same way `amirnetPractice.ts` answers «0 answers» with words
instead of `0%`. 🔬 Measured in the walk (`next start`, 375×780): `/dev/amirnet/result` ⇒ 6 rows,
`/dev/amirnet/result/short` ⇒ 5 rows, and ⛔ no `—` on either.

**🔴 The render draws a score, and `41 § 9.2` says it is ⛔ not ours to draw.** `scene_result` gives
the screen a 50–150 dial (:315) and «מתקדמים ב׳ · עלית 6 נקודות» (:317) as its hero. That formula is
declared **unpublished and Roy's**, and `41 § 8` puts score estimation in **item 4** — this row is
item 3. ⇒ the 200px card keeps its position and holds **what was measured**: correctness, real time,
chapters completed. ⚠️ **And the hero had to move, ⛔ not disappear:** the render's title is small and
muted *because the dial dominated it* (13px, `:313`), so with the dial gone the title carries the
screen at 20px bold. ⛔ «ההפרש מהסימולציה הקודמת» (`41 § 7`) goes with the dial — a difference between
two numbers that ⛔ do not exist is the same feature, ⛔ not a smaller one. Same fence `T-291` stood at.

**⛔ ONE place decides who is weak.** `weakestType()` already answered that question for the practice
menu (`T-286`) and the dashboard (`T-291`); `runWeakness()` folds the run onto the three type stats
and hands it over, then words the answer in the **result** render's two lines (:343-344) — which are
⛔ not the dashboard's two lines, exactly as `answeredHe`/`answeredShortHe` are two strings for one
fact. ⇒ two screens ⛔ cannot disagree about a learner's weak spot. And `runTypeStats()` returns all
three types **including the ones at zero**, because that is precisely what makes the chooser refuse to
name a weakness on a partial run: dropping them would let it compare two types and crown one.

**The colour is a summary, ⛔ never the channel.** The render separates «perfect · one short · worse»
by hue alone (`:333`), so every row prints its fraction (`3/5`, `dir="ltr"`) and carries the standing
in words for a screen reader (`4 נכונות מתוך 4, כל התשובות נכונות`). ⚠️ `near` is deliberately ⛔ not
amber: `#f2b544` has ⛔ no token in `palette.ts`, and `components/amirnetTypeBar.ts` measured it at
**1.75:1** on `--surface` — under the body-text floor, and the render draws the number ITSELF in it.

**One literal moved rather than being copied.** `BACK_TO_DASHBOARD_HE` lived in
`components/AmirnetSimulation.tsx`; the result screen offers the same way out ⇒ it now lives in
`lib/core/amirnetResult.ts` and the simulation re-exports it, so ⛔ nothing that imported it from the
component had to change and the words ⛔ cannot drift apart.

**Worth knowing before the next screen, and it cost a red gate here:** `app/layout.test.ts` forbids a
**second** gutter — the column is padded once, in the root layout — so `px-4` on a new `app/dev/**`
page reddens `verify` by name. And a source-shape guard that bans `xp` as a substring matches
«e**xp**ort» in its own file: the ban has to carry word boundaries.

**Debt, declared, and inherited ⛔ unchanged from `T-296`:** the product route stays shut and
`simulation` stays «טרם» in `AMIRNET_BUILT_TABS`. `F-222` blocks the item schema and `T-297` is still
⬜ ⇒ ⛔ no honest run can produce these outcomes yet, and the screen's only home is the two fixtures.
⛔ **Nothing accumulates the outcomes yet either** — the engine returns state, ⛔ not a graded history;
the producer belongs to the tick that lands the bank, and `AmirnetChapterOutcome` is the shape it has
to fill. A tab navigating to «אין פריטים» is `RULES § 0.31`, ⛔ not delivery.

## C-0550 (DEV) — `T-307` — the four levels arrive as a PROP, which is what makes the unlock replaceable

**The component is ⛔ not allowed to know how a level gets unlocked.** `AmirnetLevels` takes
`unlockedThrough` and compares `row.level <= unlockedThrough`; it has ⛔ no query, ⛔ no storage and
⛔ no rule. That is the whole reason `T-309` is a rewire and ⛔ not a rewrite: when the completion
records land, the pure function derives the number and the screen ⛔ does not change a line. A first
draft that read the state inside the component would have made the migration a component rewrite —
and the second place for that rule to be wrong.

**A locked level is ⛔ not a disabled button — it is ⛔ not a button.** `ui-ux-pro-max` ux ›
Interaction › Disabled States («Don't: Confuse disabled with normal state») asks for opacity and a
cursor; the product's own floor asks for more, because state is ⛔ never colour alone. ⇒ the locked
card renders as a `div` with `aria-disabled`, reduced opacity, the **word** `נעול`, and the way out
in words — `עבור רמה 3 כדי לפתוח`. A disabled `<button>` would have been a target a finger can find
and a screen reader can reach, promising something that ⛔ cannot happen.

**The render draws three numbers this screen ⛔ may not print.** `screen_levels` puts `הושלם · 71`,
`הושלם · 104` and `הכי גבוה · 112` on the open cards, plus a progress bar under each — all of them
derived from the score estimate, and `41 § 9.2` puts that formula with **Roy**. ⇒ they are ⛔ not
built and ⛔ nothing replaces them: a bar whose fill comes from a number we ⛔ do not compute is an
invented statistic, which is worse than an absent one. **Declared deviation, ⛔ not an omission.**

**Measured, and worth knowing before the next `docs/design/` screen:** `screen_levels` has ⛔ **no
exported still**. `docs/design/kol-D-*` is seven files (`01-world` … `07-result`) and this screen is
drawn only inside the video. ⇒ the binding source was the **function**, line by line — which is what
`36 § 14.4` asks for anyway («grep them, ⛔ do not eyeball the PNG»), but an agent that goes looking
for `kol-D-08-levels.png` will ⛔ not find it.

**Debt, declared:** `simulation` still reads «טרם» in `AMIRNET_BUILT_TABS`, so this screen's only
home is `/dev/amirnet/levels`. `AmirnetTabs.dom.test.tsx` measures that every BUILT key resolves to a
`page.tsx` on disk ⇒ the flip and the product route ⛔ cannot separate, and both belong to `T-308`.

## C-0553 (DEV) — `T-308` — the run is assembled by a PURE function, so the screen cannot get the chapters wrong

**המשך של: T-307 · T-296.** The tab `סימולציה` stopped saying «טרם» and the learner walks in.
Three files carry the change, and the shape of them is the point.

**ⓐ The queue is `41 § 2`'s table, laid end to end, in `lib/core/` — ⛔ not in the screen and
⛔ not in the route.** `AmirnetSimulation` reads `items[questionIndex]` straight through against
`AMIRNET_CHAPTERS`, so a bank read in `created_at` order would have served an `rs` item under an
`sc` chapter heading. `simulationQueue()` takes the gated items and returns the 23 in chapter
order — 4 `sc` · 4 `sc` · 5 `rc` · 3 `rs` · 3 `rs` · 4 `sc` — or **`null`**.

**ⓑ `null`, ⛔ and never a short run.** A bank that cannot fill every chapter serves ⛔ no run at
all. A four-chapter «סימולציה מלאה» is the `41 § 2` failure the engine exists against: the exam's
shape is the product, ⛔ not a target to approximate. The route turns that `null` into `no_items`
and the screen turns it into a sentence.

**ⓒ Why `no_items` ⛔ is not folded in with `unavailable`.** «The bank cannot fill a run yet» and
«something is broken» are different facts. `failureHe()` keeps them apart, and a test asserts the
two strings differ — a learner told the second about the first has been told something false.

**ⓓ `GET /api/amirnet/simulation` ⛔ does not filter by `type`, and the practice route does.**
That is the whole difference between them, and it follows from ⓐ: practice is one type at a time
by the learner's own tap (`41 § 7`), a run is all three by the chapter table. ⛔ Not a duplicate
route — the same bank read for a different shape.

**ⓔ The flip and the route are ⛔ one commit.** `AmirnetTabs.dom.test.tsx` measures that every
BUILT key resolves to a `page.tsx` on disk, so `'simulation'` entering `AMIRNET_BUILT_TABS`
⛔ cannot separate from `app/(tabs)/world/amirnet/simulation/page.tsx` existing. **And the unbuilt
behaviour outlived the last unbuilt tab:** that test now renders an explicit
`built={['dashboard','practice']}` instead of «whatever is currently missing», which would have
quietly stopped measuring anything the day the list filled up.

**ⓕ Measured, ⛔ and it is the honest state of the screen today:** the DB bank is EMPTY. `K-006`'s
26 items sit in `data/generated/*.jsonl` and there is ⛔ no `build:amirnet-items` ingest —
opened as `T-310` this tick. ⇒ pressing רמה 1 in production reaches a sentence, ⛔ not a run. That
is `D-152 § ב׳` (a statement of fact) and ⛔ not `RULES § 0.31` (an action that does nothing): the
press does something, and what it does is tell the truth. ⚠️ 26 items are ⛔ not enough for one
run in any case — 23 are needed at a **single** level — which is a content commission, ⛔ not code.

## C-0558 (DEV) — `T-311` — the press answers, and it ⛔ cannot start a second run under the first

**⛔ Not a polish row.** Measured live in C-0554's walk (`next start`, 375×844,
`/world/amirnet/simulation`, the answer delayed 1200ms): `isDisabled()` on `רמה 1` returned
`false` for the whole loading window and three taps produced **three** `GET
/api/amirnet/simulation` calls. The answer that lands **last** is the one that enters
`setPhase({kind:'run'})` ⇒ a **39-minute** run could start from a tap the learner ⛔ did not mean.
Re-measured in this tick, same instrument: **three taps ⇒ 1 call**, `isDisabled()` ⇒ `true`,
`aria-busy` ⇒ `"true"`.

**The shape, and it is deliberately ⛔ not state the card owns.** `AmirnetLevels` takes an
optional `busy` prop; `AmirnetSimulationEntry` — the only thing that knows whether a fetch is in
flight — passes `phase.kind === 'loading'` down. A component that answered «is something being
fetched» itself would be a **second place** for that answer to live, exactly as `unlockedThrough`
is `T-309`'s question and ⛔ not this component's. `start()` also returns early while `loading`:
the `disabled` attribute is the learner-visible half, the guard is what makes «one run at a time»
true even before React has re-rendered.

**State is ⛔ never the opacity alone:** the blocked card carries `disabled` **and** `aria-busy`,
and `טוען את הסימולציה…` sits beside it in a `role="status"`. The card still reads `פתוח` —
`busy` means «a run is being fetched», ⛔ not «this level is shut», and saying the second would be
saying something false.

**And the convention was missing across the whole feature, ⛔ not on one card.** `active:opacity-90`
appears **86** times in `components/`+`app/` and appeared **0** times in the nine `Amirnet*`
components against 10 tap cells (`ui-ux-pro-max` ux › Interaction › Active States — «Don't: No
feedback during interaction»). All ten now carry it — ⛔ with one exclusion that is the same
skill's Disabled States row: an option that is already `revealed` (`AmirnetQuestion`) or whose
chapter clock has `expired` (`AmirnetSimulation`) presses nothing, and a pressed look on it would
«confuse disabled with normal state».

**The guard is a RENDER, ⛔ not a source scan** (`components/AmirnetLevels.dom.test.tsx`, the
`F-224` lesson): the source of a card that presses twice reads exactly like one that presses once,
so the test clicks.

**⛔ Zero touch:** `app/api/**` · `lib/core/**` · every learner-facing string. `41 § 9.2` untouched.

## C-0558 (DEV) — `T-310` — the amirnet bank stops being a file nobody reads, and the ingest refuses what the table cannot take

**The measurement that opened it, re-measured here before a line was written:**
`select count(*) from public.amirnet_items` ⇒ **0**, while `data/generated/amirnet-items-*.jsonl`
carried 26 gate-passing items from `K-006`. ⇒ `GET /api/amirnet/practice` and
`GET /api/amirnet/simulation` were reading an empty table, and the learner C-0553's walk
measured met «עוד אין מספיק פריטים» with a valid bank sitting in the repo.

`scripts/build-amirnet-items.mjs` → `supabase/seed/0006_amirnet_items.sql`, registered as
`npm run build:amirnet-items`. It is the `build-ingest-sql.mjs` shape, for the same reasons:
the impure layer reads files and writes one, the gate is the **real** one
(`amirnetItemGate` · `amirnetChapterGate` — an `rc` chapter is gated as a chapter, because
five questions sharing one passage is a property no per-item check can see), and a refused
item is **excluded and reported**, ⛔ never repaired. `SEED_OUT_DIR` retargets the output so
`npm test` cannot dirty the git-managed seed (`F-048ⓑ`), and the committed file is asserted
byte-identical to a fresh build ⇒ **staleness is a red test**.

**Re-runnable, ⛔ and proved on the live database, ⛔ not argued:** the insert ends
`on conflict (type, level, stem_en) do nothing` against the unique key `0024` declares. Applied
through the Supabase MCP connector in this tick: **0 rows → 16 rows** (sc 2/2/2/2 · rs 2/2/2/2
across levels 1-4), and a second apply of the same rows returned **reinserted 0, total 16**.

🔴 **AND THE INGEST MEASURED SOMETHING THE GATE ⛔ CANNOT — `F-235`.** `AmirnetItemRecord`
carries ⛔ no `vocab_band` field at all, so `amirnetItemGate()` cannot see one, while
`0024_amirnet_items.sql` declares `vocab_band smallint not null` inside a closed set. ⇒ an item
can pass 26/26 and still be **unwritable**. Measured: the 10 `rc` questions carry no
`vocab_band`; the 16 `sc`/`rs` items do. This script therefore checks every column the TABLE
requires on top of the gate, refuses by name, and exits non-zero — ⛔ it does ⛔ not invent the
band, because a band chosen by DEV is a statistic about a learner's vocabulary that ⛔ nobody
measured (`R-010`).

**Debt, declared, and it is `F-235`ⓑ's:** `rc` is **0** rows in the database. `41 § 2` puts 5
`rc` questions inside the 23 of a full simulation ⇒ **a full run is ⛔ not assemblable at any
level** until those ten questions are re-delivered with their band — ⛔ and no further `sc`/`rs`
content changes that. Practice (`GET /api/amirnet/practice`), which serves one type at one
level, works today for `sc` and `rs` at all four levels.
