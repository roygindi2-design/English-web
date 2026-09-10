# `הודעות` · the simulation inbox — schema, learner state, list screen, open message (`39 § 7` · `39 § 9` item 1 · D-109) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:executing-plans` (or
> `superpowers:subagent-driven-development`). Every step is a `- [ ]` and closes only
> after a fresh run whose output goes into the tick report.

**Written:** C-0515 (DEV, 📝 planning tick) · 2026-09-08T22:41Z (`date -u`)
**Built:** — (⬜ not yet)

**Covers:** **T-190** — the `הודעות` infrastructure: the `message_simulations` table, the
per-learner state table, the soft read `GET /api/world/messages`, the pure layer and the
`/dev/messages` fixture, ⛔ no screen · **T-191** — the inbox list screen at
`/world/messages` (render `docs/design/kol-C-13-inbox.png`), and the ring node `הודעות`
opens onto it · **T-192** — the open message with its three required-word chips at
`/world/messages/[id]` (render `docs/design/kol-C-14-mail-open.png`), outside `(tabs)`.
All three are `M2 · msgs · מבנה`; T-191 is `המשך של: T-190`, T-192 is `המשך של: T-191`
(declared on the rows). **T-193 is CONTENT's** (the production brief and the gate) and is
⛔ not in this plan — its output lands in `supabase/seed/`, never here.
**המשך של: T-190** (the whole plan is that lineage) **and of T-204 / T-252**
(`lib/core/worldRing.ts` — Task 6 flips one node from `locked_infra` to `open`, the move
`worldRing.ts:150` itself says «is a task, ⛔ not a flag»).
⚠️ **Three rows and ⛔ not two-to-four by taste, measured:** `docs/plan-open.md` (balance
table, this clone, C-0514) counts **4 ⬜ in `ACTIVE_WORKSTREAM: msgs`** — T-190 · T-191 ·
T-192 · T-193. T-193 is tagged «⛔ לא ה-PM ו⛔ לא ה-Dev» ⇒ the DEV-eligible set is exactly
these three, and they are one lineage chain.

**Goal:** a learner who opens `העולם` sees `הודעות` as an **open** node, taps it, reads a
mail-style list of three seeded simulations with a context chip, a subject line, a preview
and a blue dot on the ones not yet answered, opens one, reads the English body inside
`<EnText>`, and sees **which three English words the situation calls for** — the visible
learning object of this slice. ⛔ Zero writes to `word_progress`, zero foreign keys to the
arena, zero block keyboard (R-026), zero invented content in production.

**What it buys the learner, in numbers (D-120, from the rows):** `/world/messages` today is
**404** (measured C-0273, still true in this clone: `ls app/(tabs)/world` ⇒ `chain collected
page.tsx story`). After T-191 the ring gains its **fifth open node** (of nine), the list
names **3** simulations with **3** context chips and **2** unanswered dots plus the written
counter. After T-192 the open message names **3** required words per simulation inside
`<EnWord>` and the counter `0 מתוך 3 מילות חובה`.

**Architecture:** the three layers the repo already enforces. **Schema** in
`supabase/migrations/0022_message_simulations.sql`, exactly the `0018_stories.sql` template
(`origin not null` + named `check` on `'generated'`, four levels R-021, RLS `select`
only) plus one per-learner state table on the `0014_arcade.sql` pattern (`auth.uid() =
user_id`, `select/insert/update` own). **Rule** in `lib/core/messages.ts` and
`lib/core/requiredWords.ts` (pure — ⛔ zero React/DOM/network/env/clock; `now` arrives as
an ISO string). **Wire** in `app/api/world/messages/route.ts` (GET, soft) and
`app/api/world/messages/state/route.ts` (PATCH, the learner's own state row). **Screen**
components draw and ⛔ do not compute: `InboxList.tsx` and `SimulationMessage.tsx` receive
already-formatted rows; a source scan bans `.filter(`/`.reduce(` in them (the
`ArenaSummary.test.ts:29-32` pattern). The dev fixtures hand the components their props and
ask the server for nothing, so `check:mobile` measures the screen and ⛔ not the failure
state (the `/dev/story` reasoning, `scripts/verify-mobile.mjs:126-137`).

**Tech Stack:** Next 16 App Router · React 19 client components · TypeScript (⛔ no `any`) ·
`@supabase/ssr` route client (`lib/supabase/auth.ts` `readSupabaseEnv` · `createRouteClient`)
· Tailwind (`tailwind.config.ts` tokens: `surface` · `surface-raised` · `ink` · `ink-muted`
· `brand` · `brand-surface` · `brand-on` · `success` · `danger` · `min-h-touch`) · Vitest
(`environment: node`, source-scanning guards) · Playwright (`npm run check:mobile`) · the
Supabase MCP connector (`mcp__Supabase__apply_migration`) for STEP C.

**Spec:** `plan/39-messages-spec.md` § 1 (the name, ⛔ no «100% safe» claim) · § 7 (the
inbox: sender, subject on its own line, preview, time, blue dot, context chip; the open
message: body, required words lighting one by one, `3 מתוך 3 מילות חובה`) · § 9 (item 1
first, deliberately the reverse of the video) · § 4 (segmented bar `הקיר · סיפור · תיבה`,
RTL) · § 3 (the keyboard is ⛔ not this slice — R-026) · `plan/36-video-spec.md` § 6 (nine
nodes, `הודעות` second) · § 14.4 (how the render binds) · **D-109** (the UX plan; archived
text at `plan/archive/decisions-archive.md:4128-4172`) · **D-054** (the coupling table —
archived at `plan/archive/decisions-archive.md:1850-1856`, the `הודעות` row reads «⛔ טרם
הוכרע») · **D-074** (three conditions for ring membership) · **D-046 / D-096** (disabled
carries a named condition, ⛔ never «בקרוב») · **D-028** (one bar per screen) · **D-065**
(no failure screen without an exit) · **R-021** (four levels) · **R-026** (keyboard blocked).

🎯 **The renders this plan targets:** `docs/design/kol-C-13-inbox.png` (T-191) and
`docs/design/kol-C-14-mail-open.png` (T-192), both drawn by
`docs/design/render_msgs_screens.py` (`screen_inbox` `:50-82`, `screen_mail` `:84-116`)
over `docs/design/msgs_ui.py` (`app_header` `:82`, `msg_tabs` `:86-101`, `avatar` `:49`,
`nav` `:63`) with the data tuple `MAILS` in `docs/design/render_video_C.py:238-245`.
⚠️ **Every layout number below is grepped from those files, ⛔ not eyeballed on the PNG.**
**הרנדר מחייב — layout and finish alike** (`36 § 14.4` · **מחייב גם בגימור**), and
**שכבה A (Layer A — contrast · 44px · the 12px text floor · ⛔ no state in colour alone) is
the ONLY carve-out.** The measured gaps this plan takes, each with its number, are in
**Global Constraints** below.

| What the render draws (`render_msgs_screens.py` / `msgs_ui.py`) | Line | Built by this plan? |
|---|---|---|
| Header: sub-line `הודעות · סימולציות` 12.5 Regular ink-muted α190 at y=100; title `תיבת הסימולציות` 22 Bold ink at y=122 | `msgs_ui.py:82-84` | ✅ T-191 |
| Segmented bar y=140 h=36 r=12 fill (20,28,46) outline border-sub; active segment r=10 fill brand α58 outline brand α200 w1.3; labels 13 Bold brand-surface (active) / Regular ink-muted; order RTL `הקיר · סיפור · תיבה`, pos=2 = `תיבה` | `msgs_ui.py:86-101` · `render_msgs_screens.py:52` | ✅ T-191 — `תיבה` live, `הקיר`/`סיפור` disabled with the named condition (D-109). The sliding pill is motion: ⛔ not built (D-148 — this row carries no `שכבה ב׳`) |
| Counter `3 הודעות · 2 שלא נענו` 12 Regular ink-muted α180 at y=196 | `:53` | ✅ T-191 — computed in `lib/core/messages.ts` from the state rows, ⛔ never a constant |
| Row: y from 216, h=96, step 107 (gap 11), r=17; unread fill (32,44,68)→(25,34,52) outline brand α120 w1.4; read fill (26,35,53)→(21,28,44) outline (40,54,78) w1.1 | `:56-61` | ✅ T-191 — r=16 (`rounded-2xl`, gap 1px, declared) |
| Avatar disc r=19 at (LW-46, y+30), initial letter, per-sender colour | `:62` · `msgs_ui.py:49-55` | ✅ T-191 — the initial is the first letter of the sender, computed in core |
| Sender name 14.5 Bold (unread) / SemiBold at (LW-76, y+22), LTR | `:63-65` | ✅ T-191 — inside `<EnWord>` (row ⓓ) |
| Context chip 9.5 Medium, h=17, r=8, fill sender-colour α55 | `:66-68` | ✅ T-191 — **12px** (`text-xs`), ⛔ not 9.5: Layer A floor (`scripts/check-text-floor.mjs`), gap 2.5px declared |
| Subject 13.5 Bold (unread) / Regular, ink (unread) / (196,208,228), own line at y+46 | `:69-70` | ✅ T-191 — `<EnWord>`, own line |
| Preview 12 Regular (139,154,180) at y+68 | `:71-72` | ✅ T-191 — derived from the body by `previewEn` (declared gap: the render's preview is a hand-shortened string, ⛔ not a column) |
| Time 10.5 Medium at (34, y+22), left-anchored; unread dot r=5 brand-surface at (34, y+52) | `:73-74` | ✅ T-191 — **12px**, ⛔ not 10.5 (Layer A). The dot is one channel; the counter above is the second (row ⓓ) |
| Bottom card y+4 h=54 r=14 fill (22,30,48,190); lock icon; `כל התכתובת מול דמויות` 12.5 SemiBold ink; `אין כאן משתמשים אחרים` 11 Regular (139,154,180) | `:76-80` | ✅ T-191 — **binding text** (row ⓔ, `39 § 1`); sub-line **12px** ⛔ not 11 (Layer A); r=16 (`rounded-2xl`, gap 2px, declared); lock as inline SVG (Layer A: ⛔ no emoji) |
| Tab bar (`nav`) at the bottom of the list | `msgs_ui.py:63-80` | ✅ inherited — `app/(tabs)/` layout, D-028 |
| Open message header: sub `תיבת הסימולציות` / title = subject (`Trip to Israel`); meta line `Tom · תייר · היום 09:20` 12 Regular (150,165,190) at y=148, LTR | `render_msgs_screens.py:86-88` | ✅ T-192 |
| Body bubble y=172 h=138 r=18 fill (30,41,62)→(23,32,50) outline (44,60,88); avatar r=18; `Tom` 14.5 Bold; body lines 14 Regular (225,234,250) at 24px leading, right-anchored LTR | `:89-96` | ✅ T-192 — body inside `<EnText>`; r=16 (`rounded-2xl`, gap 2px, declared) |
| `מילות חובה` 12.5 SemiBold at y=336; three chips h=32 r=16 at y=354, 13 SemiBold; done: fill success α46 outline success w1.5 + ✓ icon; not done: transparent, outline border-strong w1.1, text (176,190,214) | `:98-109` | ✅ T-192 — chips are **not** tap targets (informational) ⇒ 32px is ⛔ not a Layer A gap; ✓ + colour = two channels |
| Compose bar (`compose_bar`, `I recommend` blocks) at top-66, keyboard sheet from y=552 | `:110-113` | ⛔ **R-026** — the compose strip is present and **disabled** with a named condition (row ⓓ); the keyboard sheet ⛔ is not drawn at all (`39 § 9` item 2) |
| No tab bar on the open message | `screen_mail` never calls `nav(c)` | ✅ T-192 — the route lives **outside** `app/(tabs)/` (the `/world/compose` precedent, D-028) |

## Global Constraints

- ⛔ **`36 § 14.4`: הרנדר מחייב גם בגימור.** «The finish comes from the constitution» is
  ⛔ **not** an answer to a gap. **שכבה A — contrast ≥4.5:1 · 44px target · 12px text
  floor (`scripts/check-text-floor.mjs`) · ⛔ no state in colour alone — is the ONLY
  carve-out.** The measured gaps, each with its number, and ⛔ no others:
  1. **Chip 9.5px → 12px · time 10.5px → 12px · bottom-card sub-line 11px → 12px** — Layer A
     floor. Gaps 2.5 · 1.5 · 1.0 px. ⛔ Never `text-[11px]`: it turns `verify` red.
  2. **Radii:** rows r=17 → `rounded-2xl` (16, gap 1) · bottom card r=14 → `rounded-2xl`
     (gap 2) · body bubble r=18 → `rounded-2xl` (gap 2) · active segment r=10 → `rounded-xl`
     (12, gap 2). Bar r=12 = `rounded-xl` ✅ · chips r=8 = `rounded-lg` ✅ · required-word
     chips r=16 = `rounded-2xl` ✅. The scale is five values (`D-102`), ⛔ no sixth.
  3. **The sliding pill** of the segmented bar is motion. This row carries ⛔ no `שכבה ב׳`
     ⇒ `animate` is blocked (D-148) ⇒ the active segment is static. ⛔ Not a Layer A gap —
     a **declared omission**, and ⛔ not a `transition-*` class either.
  4. **Preview text** is `previewEn(bodyEn)` (first ≤40 characters to a word boundary +
     `…`), ⛔ not the render's hand-shortened `"Hi! I am coming this summer..."`. The schema
     has no preview column (row ⓐ names none). Declared; the fixture test pins the render's
     **subject**, **sender**, **tag**, **unread** and **when**, ⛔ not the preview string.
  5. **A disabled-condition line under the segmented bar** (`הקיר וסיפור נפתחים עם
     הכיתות`, 12px ink-muted) that the render ⛔ does not draw. D-046/D-096 require the
     condition to be **visible and named**, and the row says «⛔ לא מוסתרים» — the render
     draws all three tabs as live, which this slice cannot honestly do.
- ⛔ **Zero foreign keys to the arena and zero to `word_progress`** (row ⓑ). Enforced in the
  migration by absence **and** by `lib/supabase/messageSimulations.test.ts` (Task 1).
- ⛔ **`lib/core/` stays pure** — `npm run check:core`. `now` is an ISO string parameter.
  `Intl.DateTimeFormat` is allowed (it is not the clock; `lib/core/onboarding.ts:116` already
  uses it).
- ⛔ **The client reads simulations and writes ⛔ only its own state row** (row ⓒ): RLS
  `select` on `message_simulations` to `authenticated`; `select/insert/update` on
  `message_simulation_state` scoped `auth.uid() = user_id`; `revoke all` first, then exactly
  those verbs; ⛔ anon gets nothing.
- ⛔ **`GET /api/world/messages` is a soft read — ⛔ never a 503** (row ⓓ): env missing,
  table missing (`42P01` / `PGRST205`) and any other read failure answer **200** with
  `ok:false` and a code; the raw PostgREST string goes to the log, ⛔ never to the body.
  `session_expired` stays **401** — the C-0032 guard order (ENV → session → query) is
  unchanged, only the status of the read failures is.
- ⛔ **Components draw and do not compute** — a source scan bans `.filter(` / `.reduce(` /
  `.sort(` in `InboxList.tsx` and `SimulationMessage.tsx`. Counts, Hebrew forms, previews,
  initials, time labels live in `lib/core/messages.ts`.
- ⛔ **`bg-brand` is never a fill** (`lib/core/palette.test.ts:98-116`, F-036 — measured
  failing on the arena plan C-0513). The active segment fills `bg-brand-surface/25`, the
  unread row outline is `border-brand`, the dot is `bg-brand-surface`. ⛔ No raw hex in any
  `.tsx`.
- ⛔ **Zero invented learning content in production.** The fixture is `/dev/` only. Its
  three rows come from the render's `MAILS` tuple (`render_video_C.py:238-245`); Tom's body
  and required words come from `screen_mail` (`render_msgs_screens.py:93-95, 100`). For
  Sarah and Mr. Levi the render carries only a preview ⇒ their fixture body **is** that
  preview string verbatim, and their required words are three words **quoted from their own
  render text** (`book · table · four` from `"Table for four" / "We would like to book a
  table..."`; `send · essay · homework` from `"Your homework" / "Please send me the
  essay..."`). ⛔ Nothing authored. The production bank is T-193's (CONTENT, through the
  gate) and lands in `supabase/seed/`.
- **Every learner-visible string is Hebrew, RTL, `dir="rtl"`; English only inside
  `<EnWord>` / `<EnText>`** (`components/EnWord.tsx:20` · `:66`). `הרנדר` strings are
  copied verbatim: `הודעות · סימולציות` · `תיבת הסימולציות` · `הקיר` · `סיפור` · `תיבה` ·
  `N הודעות · N שלא נענו` · `כל התכתובת מול דמויות` · `אין כאן משתמשים אחרים` · `מילות
  חובה` · `N מתוך 3 מילות חובה` · `תייר` · `מסעדה` · `מורה` · `מלון` · `היום` · `אתמול`.
- ⛔ **`39 § 1`: no «100% safe» claim anywhere** — a source scan bans `100%` and `בטוח
  לחלוטין` in the two components.
- **`docs/api-contract.md` in the SAME commit as each route** (Task 3, Task 8).
- **One commit per task row** (T-190 → T-191 → T-192), then the close commit. ⛔ Never one
  squashed tick. **T-190 goes 🟣 only after the migration is applied and verified** (STEP C,
  Task 4 Step 9) — ⛔ never on the file alone.
- **The `[SKILL]` cells:** T-190 `—` (⛔ nothing to load). T-191 and T-192 carry
  `design-taste-frontend · ui-styling`. `ui-styling` is on the branch `skills/superpowers`
  (`docs/skills-registry.md`: `./scripts/g fetch origin skills/superpowers && ./scripts/g
  show FETCH_HEAD:skills/ui-ux-pro-max/ui-styling/SKILL.md`) — load it **before Task 5 Step
  1**. `design-taste-frontend` is ⛔ not in the registry table and ⛔ not in `skills/` —
  **measured this tick:** `ls skills` ⇒ `imagegen-frontend-mobile superpowers taste-skill`;
  `grep -rn design-taste-frontend docs/skills-registry.md` ⇒ 0 lines. The nearest
  registered skill for «micro-copy · spacing · hierarchy» is **`taste-skill`**
  (`skills/taste-skill/SKILL.md`). ⇒ The build tick loads `taste-skill` for the two screen
  rows, and writes one line in `plan/26-plan-feedback.md`: the cell names a skill that does
  not exist in the registry. ⛔ It does not retag the row.
- **Reversible calls under `RULES § 0.22`, to be logged one line each in the build report:**
  ⓐ `created_at` on `message_simulations` (the 0018 column, ⛔ not in row ⓐ's list) is the
  source of the time label · ⓑ the open screen reuses `GET /api/world/messages` and picks
  by id (⛔ no second GET endpoint) · ⓒ the fixture bodies/required words derivation above ·
  ⓓ the D-054 row is edited **in the archive**, where the table lives · ⓔ the
  disabled-condition line under the bar (gap 5).

## What the three rows name that this plan ⛔ does NOT build, and why

| Not built | Why | Where it lives |
|---|---|---|
| The block keyboard, the compose strip's behaviour, `answered_at` ever being written | `39 § 9` item 2 · **R-026** — no Tier A/B source for the continuation engine | R-026 · a future `T-19x` |
| The «answered» state as distinct from «read» on the screen | Row T-191 ⓓ says the dot marks **unanswered**; row T-192 ⓔ says **opening** turns it off; the render's tuple field is named `unread` and its counter reads `שלא נענו` over the same two rows. Until the keyboard exists nothing can be *answered*, so this slice derives **both channels** (dot and counter) from one predicate `unanswered = readAt === null && answeredAt === null`, and the state table keeps both columns (row ⓑ). ⚠️ **A finding for PM**, opened in the build tick: the two rows and the render use one word for two states | `plan/60-findings.md` (build tick) |
| Production simulations | T-193 — CONTENT's brief and gate; the API returns `no_simulations` (200) until the seed lands | `supabase/seed/` · T-193 |
| The `הקיר` and `סיפור` tabs | `39 § 9` items 3–5 (classes first) | future rows |
| The eight-node → nine-node ring bookkeeping | already ✅ (T-175 C-0428 · T-252) | — |

## File Structure

| File | Task | What changes |
|---|---|---|
| `supabase/migrations/0022_message_simulations.sql` | 1 | **Create.** Two tables, four named constraints, one index, RLS, grants, the down path in the header comment |
| `lib/supabase/messageSimulations.test.ts` | 1 | **Create.** Guard over the shipped SQL text (the `worldSchema.test.ts` pattern): zero FKs to arena/`word_progress`, four levels, `origin='generated'`, three required words, RLS shape |
| `lib/core/messages.ts` | 2 · 5 | **Create.** Types · `toSimulations` · `mergeInbox` · `unanswered` · `inboxCounts` · `inboxCountsHe` (Task 2) · `whenOf` · `whenListHe` · `whenHeaderHe` · `previewEn` · `initialOf` · `toInboxRows` (Task 5) |
| `lib/core/messages.test.ts` | 2 · 5 | **Create.** Unit tests for every export |
| `app/api/world/messages/route.ts` | 3 | **Create.** `GET` — ENV → session → level → simulations + own state rows → `InboxItem[]`; soft |
| `app/api/world/messages/route.test.ts` | 3 | **Create.** Source scan: guard order, ⛔ `503`, ⛔ `Math.random`, ⛔ `word_progress` |
| `docs/api-contract.md` | 3 · 8 | **Modify.** New sections `## GET /api/world/messages` and `## PATCH /api/world/messages/state`, inserted before `## POST /api/review/context` (`:840`) |
| `app/dev/messages/messages-fixture.ts` | 4 | **Create.** `FIXTURE_SIMULATIONS` · `FIXTURE_STATES` · `FIXTURE_NOW` — one source (F-133) |
| `app/dev/messages/messages-fixture.test.ts` | 4 | **Create.** Reads `docs/design/render_video_C.py` `MAILS` and `render_msgs_screens.py` `screen_mail`, pins the fixture to them |
| `app/dev/messages/page.tsx` | 4 · 6 | **Create** (Task 4: the data sheet) · **Modify** (Task 6: renders `<InboxListView>`) |
| `scripts/verify-mobile.mjs` | 4 · 8 | **Modify.** `ROUTES`: add `/dev/messages` (Task 4) · `/world/messages` · `/dev/messages/open` (Task 8) |
| `plan/archive/decisions-archive.md:1856` | 4 | **Modify.** The D-054 row for `הודעות` — «⛔ טרם הוכרע» → «⛔ מנותקת לחלוטין» (row ⓑ 🔗) |
| `components/InboxList.tsx` | 6 | **Create.** `InboxListView({ state })` draws; default `InboxList` fetches |
| `components/InboxList.test.ts` | 6 | **Create.** Source scan + binding strings |
| `app/(tabs)/world/messages/page.tsx` | 6 | **Create.** Server Component, `metadata`, renders `<InboxList />` |
| `lib/core/worldRing.ts` | 6 | **Modify.** `msgs` → `{ kind: 'open', href: '/world/messages' }`; `INFRA_NOTE_HE` loses `msgs` |
| `lib/core/worldRing.test.ts` | 6 | **Modify.** The `locked_infra` set is four |
| `lib/core/requiredWords.ts` | 7 | **Create.** `requiredWordsProgress` · `requiredWordsHe` |
| `lib/core/requiredWords.test.ts` | 7 | **Create.** |
| `components/RequiredWordChips.tsx` | 7 | **Create.** Three chips, ✓ + `success` on used, the counter |
| `components/RequiredWordChips.test.ts` | 7 | **Create.** Source scan: ⛔ `danger`, ✓ present, ⛔ hex |
| `app/api/world/messages/state/route.ts` | 8 | **Create.** `PATCH` — upsert the learner's own `read_at` |
| `app/api/world/messages/state/route.test.ts` | 8 | **Create.** Source scan: guard order, uuid check, ⛔ `answered_at` |
| `components/SimulationMessage.tsx` | 8 | **Create.** `SimulationMessageView({ state, used })` draws; default `SimulationMessage({ id })` fetches + patches |
| `components/SimulationMessage.test.ts` | 8 | **Create.** Source scan |
| `app/world/messages/[id]/page.tsx` | 8 | **Create.** Flow screen outside `(tabs)`, `metadata` |
| `app/dev/messages/open/page.tsx` | 8 | **Create.** Fixture for the open message, `used: ['recommend']` |
| `docs/architecture-map.json` | 9 | **Regenerate** (`npm run generate-map`) |
| `plan/30-architecture.md` · `plan/50-tasks.md` · `plan/60-findings.md` · `plan/26-plan-feedback.md` · `plan/00-control.md` · `docs/plan-open.md` · `docs/plan-tables.md` | 9 | Registers, regenerated in the same commit |

## Interfaces

```ts
// lib/core/messages.ts — Task 2
export const MESSAGE_CONTEXTS = ['tourist', 'restaurant', 'teacher', 'hotel'] as const;
export type MessageContext = (typeof MESSAGE_CONTEXTS)[number];
export const CONTEXT_HE: Readonly<Record<MessageContext, string>>; // תייר · מסעדה · מורה · מלון
export const MESSAGE_LEVELS = ['A1', 'A2', 'B1', 'B2'] as const;    // R-021
export type MessageLevel = (typeof MESSAGE_LEVELS)[number];
export const REQUIRED_WORDS_PER_MESSAGE = 3;
export interface Simulation {
  readonly id: string; readonly senderEn: string; readonly context: MessageContext;
  readonly subjectEn: string; readonly bodyEn: string;
  readonly requiredWords: readonly string[]; // length === 3, enforced by toSimulation
  readonly level: MessageLevel; readonly createdAt: string; // ISO
}
export interface RawSimulationRow {
  readonly id: unknown; readonly sender_en: unknown; readonly context: unknown;
  readonly subject_en: unknown; readonly body_en: unknown; readonly required_words: unknown;
  readonly cefr_level: unknown; readonly created_at: unknown;
}
export function toSimulation(row: RawSimulationRow): Simulation | null;      // damaged ⇒ null
export function toSimulations(rows: readonly RawSimulationRow[]): readonly Simulation[];
export interface RawStateRow { readonly simulation_id: unknown; readonly read_at: unknown; readonly answered_at: unknown }
export interface InboxItem extends Simulation { readonly readAt: string | null; readonly answeredAt: string | null }
export function mergeInbox(sims: readonly Simulation[], states: readonly RawStateRow[]): readonly InboxItem[]; // createdAt desc
export function unanswered(item: InboxItem): boolean;                          // readAt === null && answeredAt === null
export interface InboxCounts { readonly total: number; readonly unanswered: number }
export function inboxCounts(items: readonly InboxItem[]): InboxCounts;
export function inboxCountsHe(c: InboxCounts): string;                          // '3 הודעות · 2 שלא נענו'

// lib/core/messages.ts — Task 5
export type WhenLabel =
  | { readonly kind: 'today'; readonly timeHe: string }      // '09:20'
  | { readonly kind: 'yesterday' }
  | { readonly kind: 'weekday'; readonly dayHe: string }     // 'יום ג׳' — within the last 6 days
  | { readonly kind: 'date'; readonly dateHe: string };      // '12.8'
export function whenOf(createdAtIso: string, nowIso: string, timeZone: string): WhenLabel;
export function whenListHe(w: WhenLabel): string;   // '09:20' · 'אתמול' · 'יום ג׳' · '12.8'
export function whenHeaderHe(w: WhenLabel): string; // 'היום 09:20' · 'אתמול' · 'יום ג׳' · '12.8'
export const PREVIEW_MAX = 40;
export function previewEn(bodyEn: string, max?: number): string;   // ≤max chars to a word boundary + '…'
export function initialOf(senderEn: string): string;                // 'Mr. Levi' → 'L' (last capitalised word), 'Tom' → 'T'
export interface InboxRow {
  readonly id: string; readonly href: string; readonly initial: string;
  readonly senderEn: string; readonly contextHe: string; readonly subjectEn: string;
  readonly previewEn: string; readonly whenHe: string; readonly unanswered: boolean;
}
export function toInboxRows(items: readonly InboxItem[], nowIso: string, timeZone: string): readonly InboxRow[];

// lib/core/requiredWords.ts — Task 7
export interface RequiredWordChip { readonly word: string; readonly used: boolean }
export interface RequiredWordsProgress { readonly chips: readonly RequiredWordChip[]; readonly used: number; readonly total: number }
export function requiredWordsProgress(required: readonly string[], usedTokens: readonly string[]): RequiredWordsProgress; // exact match, case-insensitive, trimmed
export function requiredWordsHe(p: RequiredWordsProgress): string;  // '1 מתוך 3 מילות חובה'

// GET /api/world/messages — Task 3 (docs/api-contract.md)
type MessagesBody =
  | { ok: true; level: MessageLevel; items: readonly InboxItem[]; counts: InboxCounts }
  | { ok: false; code: 'no_level' | 'no_simulations' | 'schema_missing' | 'unavailable' }   // all 200
  | { ok: false; code: 'session_expired' };                                                 // 401

// PATCH /api/world/messages/state — Task 8
type StateRequest = { simulationId: string; read: true };
type StateBody = { ok: true; readAt: string } | { ok: false; code: 'session_expired' | 'unavailable' | 'schema_missing' };

// components/InboxList.tsx — Task 6
export type InboxScreenState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly rows: readonly InboxRow[]; readonly countsHe: string }
  | { readonly kind: 'no_level' } | { readonly kind: 'no_simulations' }
  | { readonly kind: 'schema_missing' } | { readonly kind: 'session_expired' } | { readonly kind: 'error' };
export function InboxListView(props: { readonly state: InboxScreenState }): React.JSX.Element;
export default function InboxList(): React.JSX.Element;   // apiGet('/api/world/messages') → toInboxRows(items, new Date().toISOString(), LEARNER_TIME_ZONE)

// components/RequiredWordChips.tsx — Task 7
export default function RequiredWordChips(props: { readonly progress: RequiredWordsProgress; readonly labelHe: string }): React.JSX.Element;

// components/SimulationMessage.tsx — Task 8
export type MessageScreenState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly item: InboxItem; readonly metaHe: string; readonly progress: RequiredWordsProgress; readonly progressHe: string }
  | { readonly kind: 'not_found' } | { readonly kind: 'schema_missing' } | { readonly kind: 'session_expired' } | { readonly kind: 'error' };
export function SimulationMessageView(props: { readonly state: MessageScreenState }): React.JSX.Element;
export default function SimulationMessage(props: { readonly id: string }): React.JSX.Element; // GET list → find(id) → PATCH read
```

---

### Task 1: The migration — `message_simulations` + `message_simulation_state` (T-190 ⓐ ⓑ ⓒ)

**Files:**
- Create: `supabase/migrations/0022_message_simulations.sql`
- Test: `lib/supabase/messageSimulations.test.ts`

**Interfaces:**
- Consumes: the `0018_stories.sql` template (named constraints inside `do $$`, `revoke all` then `grant select`), the `0014_arcade.sql` per-learner policy pattern (`auth.uid() = user_id`).
- Produces: two tables the route in Task 3 reads (`message_simulations`) and Task 8 writes (`message_simulation_state`).

- [x] **Step 1: Write the failing guard test**

```ts
// lib/supabase/messageSimulations.test.ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Guards 0022 the only way it can be guarded without a live project: the shipped SQL
 * text, comments stripped (C-0032 lesson — a constraint commented out is a constraint
 * that does not exist). Same approach and same limits as worldSchema.test.ts.
 */
const MIGRATION = readFileSync('supabase/migrations/0022_message_simulations.sql', 'utf8');
const SQL = MIGRATION.replace(/--[^\n]*/g, '').toLowerCase();

describe('0022 — הודעות: the simulations and the learner state', () => {
  it('creates exactly the two tables the row names, and no others', () => {
    const created = [...SQL.matchAll(/create table if not exists public\.([a-z_]+)/g)].map((m) => m[1]);
    expect(created.sort()).toEqual(['message_simulation_state', 'message_simulations']);
  });

  it('⛔ zero foreign keys to the arena and zero to word_progress (D-054 · row ⓑ)', () => {
    for (const banned of ['word_progress', 'arcade_', 'public.words', 'senses', 'generation_runs']) {
      expect(SQL, `${banned} must not appear`).not.toContain(banned);
    }
  });

  it('origin is not null with a named check on generated only — the 0018 template', () => {
    expect(SQL).toMatch(/origin\s+text\s+not null/);
    expect(SQL).toMatch(/message_simulations_origin_check[\s\S]*?check \(origin = 'generated'\)/);
    expect(SQL).not.toMatch(/origin\s+text[^,]*default/);
  });

  it('four levels only (R-021), named', () => {
    expect(SQL).toMatch(/message_simulations_level_check[\s\S]*?\('a1', 'a2', 'b1', 'b2'\)/);
  });

  it('context is the closed four-value set, by name (row ⓐ)', () => {
    expect(SQL).toMatch(/message_simulations_context_check[\s\S]*?\('tourist', 'restaurant', 'teacher', 'hotel'\)/);
  });

  it('exactly three required words', () => {
    expect(SQL).toMatch(/required_words\s+text\[\]\s+not null/);
    expect(SQL).toMatch(/message_simulations_required_words_check[\s\S]*?array_length\(required_words, 1\) = 3/);
  });

  it('the client reads simulations only — select, never a write (row ⓒ)', () => {
    expect(SQL).toMatch(/alter table public\.message_simulations enable row level security/);
    expect(SQL).toMatch(/revoke all on public\.message_simulations from authenticated, anon/);
    expect(SQL).toMatch(/grant select on public\.message_simulations to authenticated/);
    expect(SQL).not.toMatch(/grant [^;]*(insert|update|delete)[^;]*on public\.message_simulations/);
  });

  it('the state row is the learner’s own, and only that (row ⓒ)', () => {
    expect(SQL).toMatch(/alter table public\.message_simulation_state enable row level security/);
    const policies = SQL.match(/create policy "message_simulation_state_[\s\S]*?;/g) ?? [];
    expect(policies.length).toBe(3);
    for (const p of policies) expect(p).toMatch(/auth\.uid\(\)\s*=\s*user_id/);
    expect(SQL).toMatch(/grant select, insert, update on public\.message_simulation_state to authenticated/);
    expect(SQL).not.toMatch(/\bto\s+(public|anon)\b/);
  });

  it('every drop policy names a policy this file creates (F-051)', () => {
    const drops = [...SQL.matchAll(/drop policy if exists "([^"]+)"/g)].map((m) => m[1]);
    const creates = [...SQL.matchAll(/create policy "([^"]+)"/g)].map((m) => m[1]);
    expect(drops.sort()).toEqual(creates.sort());
  });

  it('states the down path in the header, and wraps in begin/commit', () => {
    expect(MIGRATION).toMatch(/-- Down[\s\S]*drop table if exists public\.message_simulation_state;[\s\S]*drop table if exists public\.message_simulations;/);
    expect(SQL.trim().startsWith('begin;')).toBe(true);
    expect(SQL.trim().endsWith('commit;')).toBe(true);
  });
});
```

- [x] **Step 2: Run it — red**

Run: `npx vitest run lib/supabase/messageSimulations.test.ts`
Expected: FAIL — `ENOENT … 0022_message_simulations.sql`.

- [x] **Step 3: Write the migration**

```sql
-- 0022_message_simulations.sql — הודעות · תיבת הסימולציות (T-190 · 39 § 7 · D-109).
--
-- Applied through the Supabase MCP connector (`apply_migration`) by the DEV tick that
-- builds T-190, and ⛔ never left for Roy (D-163). Verified after apply by a count query.
--
-- ⛔ **תוכן AI אינו מקור פדגוגי ולעולם מסומן** (§ 7.6): `origin` not null, named check
-- on 'generated' only — exactly the 0018_stories.sql template.
-- ⛔ **ארבע רמות, ⛔ ולא שש** (R-021).
-- ⛔ **אפס מפתח זר לזירה ואפס ל-word_progress** (D-054 · 39 § 3): `הודעות` is declared
-- **מנותקת לחלוטין** in the D-054 table. The boundary is enforced here by absence.
-- ⛔ **הלקוח קורא בלבד את הסימולציות, וכותב אך ורק את שורת המצב שלו** (row ⓒ).
--
-- Down (manual — never re-run automatically; apply by hand if this ever needs reverting):
--   drop table if exists public.message_simulation_state;
--   drop table if exists public.message_simulations;
--
-- Idempotent: `create table if not exists`, every constraint named and separate inside
-- `do $$` (C-0032 — `create table … check` is skipped wholesale when the table exists).

begin;

create table if not exists public.message_simulations (
  id             uuid primary key default gen_random_uuid(),
  sender_en      text not null,
  context        text not null,
  subject_en     text not null,
  body_en        text not null,
  required_words text[] not null,
  cefr_level     text not null,
  origin         text not null,
  created_at     timestamptz not null default now(),
  unique (cefr_level, subject_en)
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'message_simulations_context_check') then
    alter table public.message_simulations
      add constraint message_simulations_context_check
      check (context in ('tourist', 'restaurant', 'teacher', 'hotel'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'message_simulations_level_check') then
    alter table public.message_simulations
      add constraint message_simulations_level_check
      check (cefr_level in ('A1', 'A2', 'B1', 'B2'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'message_simulations_origin_check') then
    alter table public.message_simulations
      add constraint message_simulations_origin_check
      check (origin = 'generated');
  end if;
  -- REQUIRED_WORDS_PER_MESSAGE = 3 (`lib/core/messages.ts`). The number lives in two
  -- places on purpose: the gate rejects before the write, the constraint rejects a row
  -- that bypassed the gate (the 0019 reasoning).
  if not exists (select 1 from pg_constraint where conname = 'message_simulations_required_words_check') then
    alter table public.message_simulations
      add constraint message_simulations_required_words_check
      check (array_length(required_words, 1) = 3);
  end if;
end $$;

comment on table public.message_simulations is
  '39 § 7 · D-109: one seeded simulation — a character writes to the learner. ⛔ No other
   users exist here (39 § 1). ⛔ Not a pedagogical source (§ 7.6) — a context for practice.';
comment on column public.message_simulations.context is
  'The context chip: tourist · restaurant · teacher · hotel — closed set, Hebrew label in
   lib/core/messages.ts CONTEXT_HE. ⛔ Never free text.';
comment on column public.message_simulations.required_words is
  'Exactly three English words the situation calls for (39 § 7 «מילות חובה»). Lit one by
   one while composing; ⛔ this slice never writes answered_at (R-026).';
comment on column public.message_simulations.origin is
  '§ 7.6: generated content is marked ALWAYS. The only allowed value is generated, ⛔ no
   default — a row without a declared origin is not written.';

-- The only read of the list screen: (the learner’s level, newest first).
create index if not exists message_simulations_level_created_idx
  on public.message_simulations (cefr_level, created_at desc);

alter table public.message_simulations enable row level security;

drop policy if exists "message_simulations_select_all" on public.message_simulations;
create policy "message_simulations_select_all" on public.message_simulations
  for select to authenticated using (true);

revoke all on public.message_simulations from authenticated, anon;
grant select on public.message_simulations to authenticated;
-- ⛔ No insert · update · delete: the seed is a file (T-193), ⛔ not a client action.

-- ---------------------------------------------------------------------------
-- message_simulation_state — one row per (learner, simulation): read / answered.
-- ⚠️ Both columns exist (row ⓑ) but this slice writes read_at only — the keyboard that
-- would set answered_at is R-026.
-- ---------------------------------------------------------------------------
create table if not exists public.message_simulation_state (
  user_id       uuid not null references auth.users (id) on delete cascade,
  simulation_id uuid not null references public.message_simulations (id) on delete cascade,
  read_at       timestamptz,
  answered_at   timestamptz,
  primary key (user_id, simulation_id)
);

comment on table public.message_simulation_state is
  'The learner’s own state per simulation. Self-contained auth.uid() = user_id policies —
   the 0007 reasoning: a policy that inherits a parent filter can be voided silently.';

alter table public.message_simulation_state enable row level security;

drop policy if exists "message_simulation_state_select_own" on public.message_simulation_state;
create policy "message_simulation_state_select_own" on public.message_simulation_state
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "message_simulation_state_insert_own" on public.message_simulation_state;
create policy "message_simulation_state_insert_own" on public.message_simulation_state
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "message_simulation_state_update_own" on public.message_simulation_state;
create policy "message_simulation_state_update_own" on public.message_simulation_state
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

revoke all on public.message_simulation_state from authenticated, anon;
grant select, insert, update on public.message_simulation_state to authenticated;
-- ⛔ No delete: a learner un-reading a message is not a product action.

commit;
```

- [x] **Step 4: Run the guard and the migration hygiene suite — green**

Run: `npx vitest run lib/supabase/messageSimulations.test.ts scripts/migration-hygiene.test.ts`
Expected: PASS (hygiene: token `0022` unique, no gap after `0021`, every `drop policy` matches a `create policy`).

- [x] **Step 5: Stage (⛔ no commit yet — T-190 is one commit, Task 4 Step 10)**

Run: `./scripts/g add supabase/migrations/0022_message_simulations.sql lib/supabase/messageSimulations.test.ts`

---

### Task 2: The pure layer — `lib/core/messages.ts` (T-190 · types, mapping, counts)

**Files:**
- Create: `lib/core/messages.ts`
- Test: `lib/core/messages.test.ts`

**Interfaces:** see the `Interfaces` block, Task 2 section. Consumes nothing. Produces `Simulation` · `InboxItem` · `toSimulations` · `mergeInbox` · `unanswered` · `inboxCounts` · `inboxCountsHe` for Tasks 3, 4, 5, 8.

- [x] **Step 1: Write the failing tests**

```ts
// lib/core/messages.test.ts
import { describe, expect, it } from 'vitest';
import {
  CONTEXT_HE, MESSAGE_CONTEXTS, REQUIRED_WORDS_PER_MESSAGE,
  inboxCounts, inboxCountsHe, mergeInbox, toSimulation, toSimulations, unanswered,
  type RawSimulationRow, type Simulation,
} from './messages';

const ROW: RawSimulationRow = {
  id: '11111111-1111-4111-8111-111111111111',
  sender_en: 'Tom',
  context: 'tourist',
  subject_en: 'Trip to Israel',
  body_en: 'Hi! I am coming to Israel this summer with my family. Where should we go? Any tips?',
  required_words: ['summer', 'visit', 'recommend'],
  cefr_level: 'A1',
  created_at: '2026-09-08T06:20:00.000Z',
};

describe('toSimulation — a damaged row is null, ⛔ never a partial simulation', () => {
  it('maps a whole row', () => {
    const s = toSimulation(ROW);
    expect(s).not.toBeNull();
    expect(s!.senderEn).toBe('Tom');
    expect(s!.context).toBe('tourist');
    expect(s!.requiredWords).toEqual(['summer', 'visit', 'recommend']);
    expect(s!.level).toBe('A1');
    expect(s!.createdAt).toBe('2026-09-08T06:20:00.000Z');
  });
  it('rejects an unknown context, a fifth level, and two or four required words', () => {
    expect(toSimulation({ ...ROW, context: 'bank' })).toBeNull();
    expect(toSimulation({ ...ROW, cefr_level: 'C1' })).toBeNull();
    expect(toSimulation({ ...ROW, required_words: ['a', 'b'] })).toBeNull();
    expect(toSimulation({ ...ROW, required_words: ['a', 'b', 'c', 'd'] })).toBeNull();
    expect(toSimulation({ ...ROW, body_en: '' })).toBeNull();
  });
  it('toSimulations drops the damaged rows and keeps the order', () => {
    const out = toSimulations([ROW, { ...ROW, id: 'x', context: 'bank' }, { ...ROW, id: 'y' }]);
    expect(out.map((s) => s.id)).toEqual([ROW.id, 'y']);
  });
  it('the closed sets are the row’s sets, in Hebrew', () => {
    expect(MESSAGE_CONTEXTS).toEqual(['tourist', 'restaurant', 'teacher', 'hotel']);
    expect(CONTEXT_HE).toEqual({ tourist: 'תייר', restaurant: 'מסעדה', teacher: 'מורה', hotel: 'מלון' });
    expect(REQUIRED_WORDS_PER_MESSAGE).toBe(3);
  });
});

function sim(id: string, createdAt: string): Simulation {
  return { ...toSimulation({ ...ROW, id, created_at: createdAt })! };
}

describe('mergeInbox · unanswered · inboxCounts', () => {
  const a = sim('a', '2026-09-08T06:20:00.000Z');
  const b = sim('b', '2026-09-07T15:40:00.000Z');
  const c = sim('c', '2026-09-02T09:00:00.000Z');

  it('a simulation without a state row is unread and unanswered; newest first', () => {
    const items = mergeInbox([c, a, b], []);
    expect(items.map((i) => i.id)).toEqual(['a', 'b', 'c']);
    expect(items.every((i) => i.readAt === null && i.answeredAt === null)).toBe(true);
    expect(items.every(unanswered)).toBe(true);
  });
  it('a state row attaches by simulation_id, and a foreign state row is ignored', () => {
    const items = mergeInbox([a, b], [
      { simulation_id: 'b', read_at: '2026-09-07T16:00:00.000Z', answered_at: null },
      { simulation_id: 'zzz', read_at: '2026-09-07T16:00:00.000Z', answered_at: null },
    ]);
    expect(items[1]!.readAt).toBe('2026-09-07T16:00:00.000Z');
    expect(unanswered(items[1]!)).toBe(false);
    expect(unanswered(items[0]!)).toBe(true);
  });
  it('counts total and unanswered from the items, ⛔ not from a constant', () => {
    const items = mergeInbox([a, b, c], [{ simulation_id: 'c', read_at: '2026-09-02T10:00:00.000Z', answered_at: null }]);
    expect(inboxCounts(items)).toEqual({ total: 3, unanswered: 2 });
  });
  it('the counter string is the render’s, and 1 is הודעה אחת', () => {
    expect(inboxCountsHe({ total: 3, unanswered: 2 })).toBe('3 הודעות · 2 שלא נענו');
    expect(inboxCountsHe({ total: 1, unanswered: 0 })).toBe('הודעה אחת · 0 שלא נענו');
  });
});
```

- [x] **Step 2: Run — red**

Run: `npx vitest run lib/core/messages.test.ts`
Expected: FAIL — cannot resolve `./messages`.

- [x] **Step 3: Implement**

```ts
// lib/core/messages.ts
/**
 * `הודעות` — the pure layer (T-190 · 39 § 7 · D-109).
 *
 * ⛔ Knows nothing about React, DOM, HTTP, env or the clock — `now` is a parameter.
 * ⛔ Zero coupling to word_progress or the arena (D-054: מנותקת לחלוטין).
 */
export const MESSAGE_CONTEXTS = ['tourist', 'restaurant', 'teacher', 'hotel'] as const;
export type MessageContext = (typeof MESSAGE_CONTEXTS)[number];
export const CONTEXT_HE: Readonly<Record<MessageContext, string>> = {
  tourist: 'תייר',
  restaurant: 'מסעדה',
  teacher: 'מורה',
  hotel: 'מלון',
};
export const MESSAGE_LEVELS = ['A1', 'A2', 'B1', 'B2'] as const; // R-021
export type MessageLevel = (typeof MESSAGE_LEVELS)[number];
export const REQUIRED_WORDS_PER_MESSAGE = 3;

export interface Simulation {
  readonly id: string;
  readonly senderEn: string;
  readonly context: MessageContext;
  readonly subjectEn: string;
  readonly bodyEn: string;
  readonly requiredWords: readonly string[];
  readonly level: MessageLevel;
  readonly createdAt: string;
}

export interface RawSimulationRow {
  readonly id: unknown;
  readonly sender_en: unknown;
  readonly context: unknown;
  readonly subject_en: unknown;
  readonly body_en: unknown;
  readonly required_words: unknown;
  readonly cefr_level: unknown;
  readonly created_at: unknown;
}

function text(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v : null;
}
function isContext(v: unknown): v is MessageContext {
  return typeof v === 'string' && (MESSAGE_CONTEXTS as readonly string[]).includes(v);
}
function isLevel(v: unknown): v is MessageLevel {
  return typeof v === 'string' && (MESSAGE_LEVELS as readonly string[]).includes(v);
}

/** A damaged row is `null`, ⛔ not a partial simulation (the `toQuestion` law). */
export function toSimulation(row: RawSimulationRow): Simulation | null {
  const id = text(row.id);
  const senderEn = text(row.sender_en);
  const subjectEn = text(row.subject_en);
  const bodyEn = text(row.body_en);
  const createdAt = text(row.created_at);
  if (id === null || senderEn === null || subjectEn === null || bodyEn === null || createdAt === null) return null;
  if (!isContext(row.context) || !isLevel(row.cefr_level)) return null;
  if (!Array.isArray(row.required_words) || row.required_words.length !== REQUIRED_WORDS_PER_MESSAGE) return null;
  const requiredWords = row.required_words.map((w) => (typeof w === 'string' ? w.trim() : ''));
  if (requiredWords.some((w) => w === '')) return null;
  return { id, senderEn, context: row.context, subjectEn, bodyEn, requiredWords, level: row.cefr_level, createdAt };
}

export function toSimulations(rows: readonly RawSimulationRow[]): readonly Simulation[] {
  const out: Simulation[] = [];
  for (const row of rows) {
    const s = toSimulation(row);
    if (s !== null) out.push(s);
  }
  return out;
}

export interface RawStateRow {
  readonly simulation_id: unknown;
  readonly read_at: unknown;
  readonly answered_at: unknown;
}

export interface InboxItem extends Simulation {
  readonly readAt: string | null;
  readonly answeredAt: string | null;
}

/** Newest first — the index `message_simulations_level_created_idx` order. */
export function mergeInbox(sims: readonly Simulation[], states: readonly RawStateRow[]): readonly InboxItem[] {
  const byId = new Map<string, { readAt: string | null; answeredAt: string | null }>();
  for (const s of states) {
    const id = text(s.simulation_id);
    if (id === null) continue;
    byId.set(id, { readAt: text(s.read_at), answeredAt: text(s.answered_at) });
  }
  return [...sims]
    .sort((x, y) => (x.createdAt < y.createdAt ? 1 : x.createdAt > y.createdAt ? -1 : 0))
    .map((s) => ({ ...s, readAt: byId.get(s.id)?.readAt ?? null, answeredAt: byId.get(s.id)?.answeredAt ?? null }));
}

/**
 * One predicate for both channels — the dot and the counter (T-191 ⓓ). ⚠️ Until the
 * keyboard exists (R-026) nothing can be *answered*, so «opened» ends the pending state
 * (T-192 ⓔ). The finding about the two words lives in 60-findings, ⛔ not here.
 */
export function unanswered(item: InboxItem): boolean {
  return item.readAt === null && item.answeredAt === null;
}

export interface InboxCounts {
  readonly total: number;
  readonly unanswered: number;
}

export function inboxCounts(items: readonly InboxItem[]): InboxCounts {
  let n = 0;
  for (const i of items) if (unanswered(i)) n += 1;
  return { total: items.length, unanswered: n };
}

/** `3 הודעות · 2 שלא נענו` — the render’s line (render_msgs_screens.py:53). */
export function inboxCountsHe(c: InboxCounts): string {
  const total = c.total === 1 ? 'הודעה אחת' : `${c.total} הודעות`;
  return `${total} · ${c.unanswered} שלא נענו`;
}
```

- [x] **Step 4: Run — green, and the purity gate**

Run: `npx vitest run lib/core/messages.test.ts && npm run check:core`
Expected: PASS · `check:core` exit 0 (no react/window/document/localStorage/process.env/fetch).

- [x] **Step 5: Stage**

Run: `./scripts/g add lib/core/messages.ts lib/core/messages.test.ts`

---

### Task 3: `GET /api/world/messages` — the soft read (T-190 ⓓ)

**Files:**
- Create: `app/api/world/messages/route.ts`
- Test: `app/api/world/messages/route.test.ts`
- Modify: `docs/api-contract.md` — insert a new `## GET /api/world/messages` section immediately before `## POST /api/review/context` (currently `:840`)

**Interfaces:**
- Consumes: `readSupabaseEnv` · `createRouteClient` (`lib/supabase/auth.ts:39,56`), `parseLevel` (`lib/core/levelSummary.ts:36`), `toSimulations` · `mergeInbox` · `inboxCounts` (Task 2).
- Produces: `MessagesBody` (see Interfaces) for Tasks 6 and 8.

- [x] **Step 1: Write the failing source-scan test**

```ts
// app/api/world/messages/route.test.ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('app/api/world/messages/route.ts', 'utf8');

describe('T-190ⓓ — GET /api/world/messages is a soft read', () => {
  it('⛔ never answers 503 — every read failure is 200 ok:false', () => {
    expect(SRC).not.toMatch(/status:\s*503/);
    expect(SRC).toMatch(/code:\s*'schema_missing'/);
    expect(SRC).toMatch(/code:\s*'unavailable'/);
    expect(SRC).toMatch(/code:\s*'no_simulations'/);
  });
  it('keeps the C-0032 guard order: env, then session, then query', () => {
    expect(SRC.indexOf('readSupabaseEnv')).toBeLessThan(SRC.indexOf('auth.getUser'));
    expect(SRC.indexOf('auth.getUser')).toBeLessThan(SRC.indexOf("from('message_simulations')"));
    expect(SRC).toMatch(/status:\s*401/);
  });
  it('reads the learner’s own state rows only, by user_id', () => {
    expect(SRC).toMatch(/from\('message_simulation_state'\)[\s\S]*?\.eq\('user_id', user\.id\)/);
  });
  it('⛔ zero coupling: no word_progress, no arcade, no Math.random', () => {
    for (const banned of [/word_progress/, /arcade/, /Math\.random/]) expect(SRC).not.toMatch(banned);
  });
  it('the mapping is the pure layer’s, ⛔ not inline', () => {
    expect(SRC).toMatch(/toSimulations\(/);
    expect(SRC).toMatch(/mergeInbox\(/);
    expect(SRC).toMatch(/inboxCounts\(/);
  });
});
```

- [x] **Step 2: Run — red**

Run: `npx vitest run app/api/world/messages/route.test.ts`
Expected: FAIL — `ENOENT … route.ts`.

- [x] **Step 3: Write the route**

```ts
// app/api/world/messages/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { parseLevel } from '@/lib/core/levelSummary';
import {
  inboxCounts,
  mergeInbox,
  toSimulations,
  type RawSimulationRow,
  type RawStateRow,
} from '@/lib/core/messages';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/** An unbounded read is how a route starts paging a bank to paint one screen. */
const MAX_SIMULATIONS = 200;
const SIMULATION_SELECT = 'id, sender_en, context, subject_en, body_en, required_words, cefr_level, created_at';

/**
 * GET /api/world/messages — see docs/api-contract.md
 *
 * ⛔ **A soft read, ⛔ never a 503 (T-190ⓓ).** `0022_message_simulations.sql` is a new
 * table; the inbox is one node of nine on the ring, and a 503 here would be a failure
 * screen for a learner who came for the arena. ⇒ every read failure is **200** with
 * `ok:false` and a code; the raw PostgREST string goes to the log, never to the body.
 * The C-0032 guard ORDER is unchanged: ENV → session → query. Only the status of the
 * read failures differs from `/api/world/story`.
 */
function soft(where: string, error: { message: string; code?: string }) {
  console.error(`[api/world/messages] ${where} read failed:`, error.message);
  const code = error.code === '42P01' || error.code === 'PGRST205' ? 'schema_missing' : 'unavailable';
  return NextResponse.json({ ok: false, code });
}

export async function GET() {
  const env = readSupabaseEnv();
  if (!env) return NextResponse.json({ ok: false, code: 'unavailable' });

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  const profile = await supabase.from('profiles').select('current_level').eq('id', user.id).maybeSingle();
  if (profile.error) return soft('profile', profile.error);

  // ⛔ No silent fall back to A1 (D-037). «Has not chosen» is a real state.
  const level = parseLevel((profile.data as { current_level?: unknown } | null)?.current_level);
  if (level === null) return NextResponse.json({ ok: false, code: 'no_level' });

  const [rows, states] = await Promise.all([
    supabase
      .from('message_simulations')
      .select(SIMULATION_SELECT)
      .eq('cefr_level', level)
      .order('created_at', { ascending: false })
      .limit(MAX_SIMULATIONS),
    supabase
      .from('message_simulation_state')
      .select('simulation_id, read_at, answered_at')
      .eq('user_id', user.id)
      .limit(MAX_SIMULATIONS),
  ]);
  if (rows.error) return soft('simulations', rows.error);
  if (states.error) return soft('state', states.error);

  const sims = toSimulations((rows.data ?? []) as unknown as readonly RawSimulationRow[]);
  if (sims.length === 0) return NextResponse.json({ ok: false, code: 'no_simulations' });

  const items = mergeInbox(sims, (states.data ?? []) as unknown as readonly RawStateRow[]);
  return NextResponse.json({ ok: true, level, items, counts: inboxCounts(items) });
}
```

- [x] **Step 4: Run — green**

Run: `npx vitest run app/api/world/messages/route.test.ts && npm run typecheck`
Expected: PASS · `tsc` exit 0.

- [x] **Step 5: Write the contract section** — insert before `## POST /api/review/context` in `docs/api-contract.md`

```markdown
## GET /api/world/messages

תיבת הסימולציות של הלומד (T-190 · `39 § 7` · D-109). דורש סשן חי, ובאותו סדר שומרים
קבוע — `readSupabaseEnv()` → `getUser()` → שאילתה (דפוס C-0032).

**פרמטרים: אין.**

**גוף מוצלח:**

```json
{ "ok": true, "level": "A1",
  "items": [ { "id": "…", "senderEn": "Tom", "context": "tourist", "subjectEn": "Trip to Israel",
               "bodyEn": "…", "requiredWords": ["summer", "visit", "recommend"], "level": "A1",
               "createdAt": "2026-09-08T06:20:00.000Z", "readAt": null, "answeredAt": null } ],
  "counts": { "total": 3, "unanswered": 2 } }
```

⚠️ **`items` ממוין מהחדש לישן** (`created_at desc`). `context` הוא סט סגור
(`tourist · restaurant · teacher · hotel`), והתווית העברית היא `CONTEXT_HE` ב-
`lib/core/messages.ts`. `requiredWords` הוא **בדיוק שלוש** מילים. `readAt`/`answeredAt` הם
שורת המצב של הלומד עצמו — `null` כשאין שורה. ⚠️ **בפרוסה הזאת `answeredAt` תמיד `null`** —
המקלדת שכותבת אותו היא R-026.

🔴 **קריאה רכה — ⛔ לעולם לא 503 (T-190ⓓ).** התיבה היא צומת אחד מתשעה בטבעת, ו-503
כאן היה מסך כשל ללומד שבא לזירה. ⇒ כל כישלון קריאה הוא **200** עם `ok:false` וקוד.
המחרוזת הגולמית של PostgREST יורדת ללוג ⛔ ולעולם לא לגוף.

**כישלונות:**

| `code` | HTTP | מתי |
|---|---|---|
| `no_level` | **200** | הלומד טרם בחר רמה (D-037). ⛔ אין נפילה שקטה ל-A1. |
| `no_simulations` | **200** | ⛔ אין ולו סימולציה אחת ברמת הלומד — הזרע של T-193 טרם נחת. |
| `schema_missing` | **200** | `42P01` / `PGRST205` — `0022` טרם הוחלה. |
| `unavailable` | **200** | ⛔ אין ENV, או כישלון קריאה אחר. |
| `session_expired` | 401 | ⛔ אין סשן. |
```

- [x] **Step 6: Stage**

Run: `./scripts/g add app/api/world/messages/route.ts app/api/world/messages/route.test.ts docs/api-contract.md`

---

### Task 4: The fixture, the dev data sheet, the D-054 row, apply the migration, commit T-190 (T-190 ⓔ · ⓑ 🔗)

**Files:**
- Create: `app/dev/messages/messages-fixture.ts`
- Test: `app/dev/messages/messages-fixture.test.ts`
- Create: `app/dev/messages/page.tsx`
- Modify: `scripts/verify-mobile.mjs` — the `ROUTES` list, after `'/dev/story/done'` (`:143`)
- Modify: `plan/archive/decisions-archive.md:1856`

**Interfaces:**
- Consumes: `Simulation` · `RawStateRow` · `mergeInbox` · `inboxCounts` · `inboxCountsHe` · `CONTEXT_HE` (Task 2), `EnWord` (`components/EnWord.tsx`).
- Produces: `FIXTURE_SIMULATIONS: readonly Simulation[]` · `FIXTURE_STATES: readonly RawStateRow[]` · `FIXTURE_NOW = '2026-09-08T09:30:00+03:00'` for Tasks 6 and 8.

- [x] **Step 1: Write the failing fixture test — pinned to the render**

```ts
// app/dev/messages/messages-fixture.test.ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { mergeInbox, inboxCounts, toSimulation } from '@/lib/core/messages';
import { FIXTURE_NOW, FIXTURE_SIMULATIONS, FIXTURE_STATES } from './messages-fixture';

/**
 * F-133ⓐ — the guard that was missing on the story. The render files are read HERE and
 * the fixture is measured against them: a fixture that drifts from the render fails the
 * build (`36 § 14.4` as a test, not a good intention).
 */
const VIDEO = readFileSync('docs/design/render_video_C.py', 'utf8');
const SCREENS = readFileSync('docs/design/render_msgs_screens.py', 'utf8');

function renderMails(): { name: string; letter: string; subject: string; when: string; unread: boolean; tag: string }[] {
  const start = VIDEO.indexOf('MAILS = [');
  expect(start).toBeGreaterThan(-1);
  const block = VIDEO.slice(start, VIDEO.indexOf('\n]', start));
  return [...block.matchAll(/\("([^"]+)", "([^"]+)", \([^)]*\), "([^"]+)", "[^"]*",\s*"([^"]+)", (True|False), "([^"]+)"\)/g)].map((m) => ({
    name: m[1]!, letter: m[2]!, subject: m[3]!, when: m[4]!, unread: m[5] === 'True', tag: m[6]!,
  }));
}

function renderRequiredWords(): string[] {
  const m = SCREENS.match(/for word, done in \(\("(\w+)", \w+\), \("(\w+)", \w+\), \("(\w+)", \w+\)\)/);
  expect(m).not.toBeNull();
  return [m![1]!, m![2]!, m![3]!];
}

function renderTomBody(): string {
  const start = SCREENS.indexOf('enumerate([');
  const block = SCREENS.slice(start, SCREENS.indexOf(']', start));
  return [...block.matchAll(/"([^"]+)"/g)].map((m) => m[1]).join(' ');
}

describe('the messages fixture is the render’s data, ⛔ not a second authoring', () => {
  const mails = renderMails();

  it('three rows, in the render’s order, sender · subject · tag', () => {
    expect(mails.length).toBe(3);
    expect(FIXTURE_SIMULATIONS.length).toBe(3);
    const CONTEXT_OF_TAG: Record<string, string> = { 'תייר': 'tourist', 'מסעדה': 'restaurant', 'מורה': 'teacher', 'מלון': 'hotel' };
    mails.forEach((m, i) => {
      const s = FIXTURE_SIMULATIONS[i]!;
      expect(s.senderEn).toBe(m.name);
      expect(s.subjectEn).toBe(m.subject);
      expect(s.context).toBe(CONTEXT_OF_TAG[m.tag]);
    });
  });

  it('unread rows are the render’s unread rows, and the counter is 3 · 2', () => {
    const items = mergeInbox(FIXTURE_SIMULATIONS, FIXTURE_STATES);
    // mergeInbox sorts newest first; the render lists newest first too.
    items.forEach((it, i) => expect(it.readAt === null && it.answeredAt === null).toBe(mails[i]!.unread));
    expect(inboxCounts(items)).toEqual({ total: 3, unanswered: 2 });
  });

  it('Tom’s body and required words are screen_mail’s, verbatim', () => {
    const tom = FIXTURE_SIMULATIONS.find((s) => s.senderEn === 'Tom')!;
    expect(tom.bodyEn).toBe(renderTomBody());
    expect([...tom.requiredWords].sort()).toEqual([...renderRequiredWords()].sort());
  });

  it('every fixture row survives the same mapping production rows go through', () => {
    for (const s of FIXTURE_SIMULATIONS) {
      expect(toSimulation({
        id: s.id, sender_en: s.senderEn, context: s.context, subject_en: s.subjectEn, body_en: s.bodyEn,
        required_words: s.requiredWords, cefr_level: s.level, created_at: s.createdAt,
      })).not.toBeNull();
    }
    expect(FIXTURE_NOW).toBe('2026-09-08T09:30:00+03:00');
  });
});
```

- [x] **Step 2: Run — red**

Run: `npx vitest run app/dev/messages/messages-fixture.test.ts`
Expected: FAIL — cannot resolve `./messages-fixture`.

- [x] **Step 3: Write the fixture module**

```ts
// app/dev/messages/messages-fixture.ts
import type { RawStateRow, Simulation } from '@/lib/core/messages';

/**
 * ⛔ Not learning content. The three rows are `MAILS` in `docs/design/render_video_C.py:238`;
 * Tom’s body and required words are `screen_mail` in `docs/design/render_msgs_screens.py:93,100`.
 * Sarah and Mr. Levi carry only a preview in the render ⇒ their body IS that string, and
 * their required words are quoted from their own render text (see the plan, Global
 * Constraints). The production bank is T-193’s. `messages-fixture.test.ts` pins this file
 * to the render (F-133).
 *
 * `FIXTURE_NOW` is Monday 2026-09-08 09:30 Asia/Jerusalem ⇒ Tom = today `09:20`,
 * Sarah = `אתמול`, Mr. Levi (Tue 2026-09-02) = `יום ג׳` — the render’s three labels.
 */
export const FIXTURE_NOW = '2026-09-08T09:30:00+03:00';

export const FIXTURE_SIMULATIONS: readonly Simulation[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    senderEn: 'Tom',
    context: 'tourist',
    subjectEn: 'Trip to Israel',
    bodyEn: 'Hi! I am coming to Israel this summer with my family. Where should we go? Any tips?',
    requiredWords: ['summer', 'visit', 'recommend'],
    level: 'A1',
    createdAt: '2026-09-08T09:20:00+03:00',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    senderEn: 'Sarah',
    context: 'restaurant',
    subjectEn: 'Table for four',
    bodyEn: 'We would like to book a table...',
    requiredWords: ['book', 'table', 'four'],
    level: 'A1',
    createdAt: '2026-09-07T18:05:00+03:00',
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    senderEn: 'Mr. Levi',
    context: 'teacher',
    subjectEn: 'Your homework',
    bodyEn: 'Please send me the essay...',
    requiredWords: ['send', 'essay', 'homework'],
    level: 'A1',
    createdAt: '2026-09-02T08:00:00+03:00',
  },
];

/** Mr. Levi’s row is read (the render draws it without the dot); the other two are pending. */
export const FIXTURE_STATES: readonly RawStateRow[] = [
  { simulation_id: '33333333-3333-4333-8333-333333333333', read_at: '2026-09-02T12:00:00+03:00', answered_at: null },
];
```

- [x] **Step 4: Run — green**

Run: `npx vitest run app/dev/messages/messages-fixture.test.ts`
Expected: PASS (4 tests).

- [x] **Step 5: Write the dev data sheet — ⛔ not a screen**

```tsx
// app/dev/messages/page.tsx
import EnWord from '@/components/EnWord';
import { CONTEXT_HE, inboxCounts, inboxCountsHe, mergeInbox, unanswered } from '@/lib/core/messages';
import { FIXTURE_SIMULATIONS, FIXTURE_STATES } from './messages-fixture';

/**
 * T-190ⓔ — a layout-harness data sheet for `check:mobile`, ⛔ not a product screen and
 * ⛔ not linked from anywhere. It proves the fixture parses through the SAME functions the
 * route uses (`mergeInbox` · `inboxCounts`) and renders at 320/375/414 with zero
 * horizontal scroll and a clean console. Task 6 (T-191) replaces the body with
 * `<InboxListView>`; the route and this comment stay.
 *
 * Asks the server for nothing ⇒ ⛔ no entry in `EXPECTED_CONSOLE` (scripts/verify-mobile.mjs).
 */
export default function DevMessagesPage() {
  const items = mergeInbox(FIXTURE_SIMULATIONS, FIXTURE_STATES);
  return (
    <main dir="rtl" className="mx-auto w-full max-w-md px-4 py-6 text-ink">
      <h1 className="text-xl font-bold">הודעות · פיקסטורה</h1>
      <p className="mt-2 text-xs text-ink-muted">{inboxCountsHe(inboxCounts(items))}</p>
      <ul className="mt-4 space-y-3">
        {items.map((it) => (
          <li key={it.id} className="rounded-2xl bg-surface-raised p-4">
            <p className="text-sm font-semibold">
              <EnWord>{it.senderEn}</EnWord> · {CONTEXT_HE[it.context]} · {unanswered(it) ? 'טרם נענתה' : 'נקראה'}
            </p>
            <p className="mt-1 text-sm"><EnWord>{it.subjectEn}</EnWord></p>
            <p className="mt-1 text-xs text-ink-muted">
              מילות חובה: {it.requiredWords.map((w) => <EnWord key={w}>{w}</EnWord>).reduce<React.ReactNode[]>((acc, el, i) => (i === 0 ? [el] : [...acc, ' · ', el]), [])}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

⚠️ If `React.ReactNode` is not in scope, `import type { ReactNode } from 'react'` and use it. `app/dev/**` is excluded from `check:titles` (`scripts/check-page-titles.mjs:7`) ⇒ ⛔ no `metadata` here.

- [x] **Step 6: Register the route for `check:mobile`** — in `scripts/verify-mobile.mjs`, right after the `'/dev/story/done',` line (`:143`):

```js
  // C-XXXX (T-190ⓔ) — the messages fixture data sheet. Without Supabase env
  // `GET /api/world/messages` answers `unavailable` (200) in its own contract, so the
  // product route would measure a failure state. The sheet renders the fixture through the
  // same pure functions the route uses and asks the server for nothing ⇒ ⛔ no entry in
  // EXPECTED_CONSOLE. Task 6 (T-191) turns this route into the inbox list itself.
  '/dev/messages',
```

- [x] **Step 7: The D-054 coupling row (row ⓑ 🔗 — «⛔ צומת בלי שורה שם ⛔ אינו נכנס לטבעת», D-074)** — in `plan/archive/decisions-archive.md`, replace line 1856 exactly:

```
| **הודעות** (תיבת הסימולציות · `39 § 7`) | ⛔ **מנותקת לחלוטין** | `message_simulations` + `message_simulation_state` (`0022`) — ⛔ אפס מפתח זר ל-`word_progress`, ⛔ אפס לטבלאות הזירה; `39 § 3`: המקלדת ⛔ אינה נוגעת ב-`word_progress` | 🔵 T-190 (C-XXXX, DEV) — השורה נכתבה באותו קומיט של המיגרציה |
```

Run: `grep -n 'הודעות · מייל · סימולטורים' plan/archive/decisions-archive.md` — Expected: 0 lines after the edit; `grep -n 'מנותקת לחלוטין\*\* | \`message_simulations\`' plan/archive/decisions-archive.md` ⇒ 1 line.

- [x] **Step 8: Run the fast gates**

Run: `npm run typecheck && npm run check:core && npx vitest run lib/core/messages.test.ts lib/supabase/messageSimulations.test.ts app/api/world/messages/route.test.ts app/dev/messages/messages-fixture.test.ts scripts/migration-hygiene.test.ts`
Expected: all PASS.

- [x] **Step 9: STEP C — apply the migration through the connector, and verify it** — the file is `supabase/migrations/0022_message_simulations.sql`

⛔ Only if the session has `mcp__Supabase__*` tools (check with `ToolSearch("select:mcp__Supabase__apply_migration,mcp__Supabase__execute_sql,mcp__Supabase__list_projects")`). ⛔ No connector ⇒ ⛔ do not improvise a credential, ⛔ do not `supabase login`; skip this step, keep T-190 **⬜** with the note «המיגרציה נכתבה, ⛔ לא הוחלה — הקונקטור חסר בסשן», and say so in the report.

1. `mcp__Supabase__list_projects` ⇒ take the project id.
2. `mcp__Supabase__apply_migration` with `name: "0022_message_simulations"` and `query` = the file’s content **without** the outer `begin;`/`commit;` lines (the connector wraps its own transaction; measured on the arena migrations — if it rejects nested `begin`, that is why).
3. `mcp__Supabase__execute_sql`: `select count(*) from public.message_simulations; select count(*) from public.message_simulation_state;` ⇒ Expected: `0` and `0`, ⛔ no error.
4. `mcp__Supabase__execute_sql`: `select conname from pg_constraint where conname like 'message_simulations_%' order by 1;` ⇒ Expected: the four names.
5. Paste those outputs into the tick report. ⛔ Never paste a key, a URL with a token, or a JWT.

- [x] **Step 10: Commit T-190**

```bash
./scripts/g add app/dev/messages scripts/verify-mobile.mjs plan/archive/decisions-archive.md
./scripts/g commit -m "loop(DEV): C-XXXX T-190 הודעות infrastructure — 0022 message_simulations + learner state, soft GET /api/world/messages, pure layer, /dev/messages fixture, D-054 row"
```

---

### Task 5: The list-row formatting — time labels, preview, initial, `toInboxRows` (T-191, pure)

**Files:**
- Modify: `lib/core/messages.ts` (append)
- Modify: `lib/core/messages.test.ts` (append)

**Interfaces:** see Interfaces, Task 5 section. Consumes `toIsoDateInZone` (`lib/core/onboarding.ts:116`), `LEARNER_TIME_ZONE` (`:113`). Produces `InboxRow[]` for Task 6.

⚠️ **Load before Step 1:** `skills/taste-skill/SKILL.md` (§ 4.9 copy self-audit · § 9.B hierarchy by weight, not scale) and `ui-styling` via `./scripts/g fetch origin skills/superpowers && ./scripts/g show FETCH_HEAD:skills/ui-ux-pro-max/ui-styling/SKILL.md`. Write the `[SKILL]` line in the report **before** this task’s first edit.

- [ ] **Step 1: Write the failing tests** (append to `lib/core/messages.test.ts`)

```ts
import { initialOf, previewEn, toInboxRows, whenHeaderHe, whenListHe, whenOf } from './messages';

const TZ = 'Asia/Jerusalem';
const NOW = '2026-09-08T09:30:00+03:00'; // Monday

describe('whenOf — the render’s three labels, from created_at and now', () => {
  it('same calendar day in the learner’s zone ⇒ today + HH:MM', () => {
    const w = whenOf('2026-09-08T09:20:00+03:00', NOW, TZ);
    expect(w).toEqual({ kind: 'today', timeHe: '09:20' });
    expect(whenListHe(w)).toBe('09:20');
    expect(whenHeaderHe(w)).toBe('היום 09:20');
  });
  it('the previous calendar day ⇒ אתמול, even across midnight in UTC', () => {
    const w = whenOf('2026-09-07T23:30:00+03:00', NOW, TZ);
    expect(whenListHe(w)).toBe('אתמול');
    expect(whenHeaderHe(w)).toBe('אתמול');
  });
  it('2–6 days ago ⇒ the weekday, יום ג׳ for a Tuesday', () => {
    const w = whenOf('2026-09-02T08:00:00+03:00', NOW, TZ);
    expect(whenListHe(w)).toBe('יום ג׳');
  });
  it('7+ days ago ⇒ d.m', () => {
    expect(whenListHe(whenOf('2026-08-12T08:00:00+03:00', NOW, TZ))).toBe('12.8');
  });
});

describe('previewEn · initialOf', () => {
  it('cuts to a word boundary under the max and appends …', () => {
    expect(previewEn('Hi! I am coming to Israel this summer with my family. Where should we go?', 40)).toBe('Hi! I am coming to Israel this summer…');
    expect(previewEn('Short.', 40)).toBe('Short.');
  });
  it('the disc letter is the surname initial for a titled name, else the first letter', () => {
    expect(initialOf('Tom')).toBe('T');
    expect(initialOf('Mr. Levi')).toBe('L');
    expect(initialOf('Sarah')).toBe('S');
  });
});

describe('toInboxRows — everything the component draws, precomputed', () => {
  it('formats the fixture-shaped items with href, contextHe, whenHe, unanswered', () => {
    const items = mergeInbox([sim('a', '2026-09-08T09:20:00+03:00')], []);
    const rows = toInboxRows(items, NOW, TZ);
    expect(rows[0]).toMatchObject({ id: 'a', href: '/world/messages/a', initial: 'T', contextHe: 'תייר', whenHe: '09:20', unanswered: true });
    expect(rows[0]!.previewEn.endsWith('…')).toBe(true);
  });
});
```

- [ ] **Step 2: Run — red**

Run: `npx vitest run lib/core/messages.test.ts`
Expected: FAIL — `whenOf is not a function` (and friends).

- [ ] **Step 3: Implement** (append to `lib/core/messages.ts`)

```ts
import { toIsoDateInZone } from './onboarding';

export type WhenLabel =
  | { readonly kind: 'today'; readonly timeHe: string }
  | { readonly kind: 'yesterday' }
  | { readonly kind: 'weekday'; readonly dayHe: string }
  | { readonly kind: 'date'; readonly dateHe: string };

const WEEKDAY_HE = ['יום א׳', 'יום ב׳', 'יום ג׳', 'יום ד׳', 'יום ה׳', 'יום ו׳', 'שבת'] as const;
const DAY_MS = 86_400_000;

function dayNumber(isoDate: string): number {
  return Math.floor(Date.parse(`${isoDate}T00:00:00Z`) / DAY_MS);
}

/** The render’s three labels (render_video_C.py:238-245): `09:20` · `אתמול` · `יום ג׳`. */
export function whenOf(createdAtIso: string, nowIso: string, timeZone: string): WhenLabel {
  const created = new Date(createdAtIso);
  const createdDay = toIsoDateInZone(created, timeZone);
  const nowDay = toIsoDateInZone(new Date(nowIso), timeZone);
  const diff = dayNumber(nowDay) - dayNumber(createdDay);
  if (diff <= 0) {
    const timeHe = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone }).format(created);
    return { kind: 'today', timeHe };
  }
  if (diff === 1) return { kind: 'yesterday' };
  if (diff < 7) {
    const weekday = new Date(`${createdDay}T00:00:00Z`).getUTCDay();
    return { kind: 'weekday', dayHe: WEEKDAY_HE[weekday] ?? '' };
  }
  const [, m, d] = createdDay.split('-');
  return { kind: 'date', dateHe: `${Number(d)}.${Number(m)}` };
}

export function whenListHe(w: WhenLabel): string {
  switch (w.kind) {
    case 'today': return w.timeHe;
    case 'yesterday': return 'אתמול';
    case 'weekday': return w.dayHe;
    case 'date': return w.dateHe;
  }
}

/** The open message’s meta line says `היום 09:20` (render_msgs_screens.py:87). */
export function whenHeaderHe(w: WhenLabel): string {
  return w.kind === 'today' ? `היום ${w.timeHe}` : whenListHe(w);
}

export const PREVIEW_MAX = 40;

/** ≤ max characters, cut at a word boundary, `…` appended only when something was cut. */
export function previewEn(bodyEn: string, max: number = PREVIEW_MAX): string {
  const clean = bodyEn.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max + 1);
  const boundary = cut.lastIndexOf(' ');
  return `${(boundary > 0 ? cut.slice(0, boundary) : cut.slice(0, max)).replace(/[\s.,;:!?]+$/, '')}…`;
}

/** The avatar disc letter (render_video_C.py:238-245: `T` · `S` · `L` for `Mr. Levi`). */
export function initialOf(senderEn: string): string {
  const words = senderEn.trim().split(/\s+/).filter((w) => !/^(mr|mrs|ms|dr)\.?$/i.test(w));
  const pick = words.at(-1) ?? senderEn.trim();
  return (pick[0] ?? '?').toUpperCase();
}

export interface InboxRow {
  readonly id: string;
  readonly href: string;
  readonly initial: string;
  readonly senderEn: string;
  readonly contextHe: string;
  readonly subjectEn: string;
  readonly previewEn: string;
  readonly whenHe: string;
  readonly unanswered: boolean;
}

export function toInboxRows(items: readonly InboxItem[], nowIso: string, timeZone: string): readonly InboxRow[] {
  return items.map((it) => ({
    id: it.id,
    href: `/world/messages/${it.id}`,
    initial: initialOf(it.senderEn),
    senderEn: it.senderEn,
    contextHe: CONTEXT_HE[it.context],
    subjectEn: it.subjectEn,
    previewEn: previewEn(it.bodyEn),
    whenHe: whenListHe(whenOf(it.createdAt, nowIso, timeZone)),
    unanswered: unanswered(it),
  }));
}
```

⚠️ The `import` line goes to the top of the file with the others (there are no others yet — it becomes the first line). `lib/core/onboarding.ts` is already pure; `check:core` stays green.

- [ ] **Step 4: Extend the fixture test with the render’s `when` labels** (append to `app/dev/messages/messages-fixture.test.ts`, inside the `describe`)

```ts
  it('the time labels computed from created_at at FIXTURE_NOW are the render’s labels', () => {
    const items = mergeInbox(FIXTURE_SIMULATIONS, FIXTURE_STATES);
    const rows = toInboxRows(items, FIXTURE_NOW, 'Asia/Jerusalem');
    rows.forEach((r, i) => expect(r.whenHe).toBe(mails[i]!.when));
  });
```
(add `toInboxRows` to the import from `@/lib/core/messages`).

- [ ] **Step 5: Run — green**

Run: `npx vitest run lib/core/messages.test.ts app/dev/messages/messages-fixture.test.ts && npm run check:core`
Expected: PASS · exit 0.

- [ ] **Step 6: Stage**

Run: `./scripts/g add lib/core/messages.ts lib/core/messages.test.ts app/dev/messages/messages-fixture.test.ts`

---

### Task 6: The inbox list screen, the tab page, the ring node opens (T-191 ⓐ–ⓕ)

**Files:**
- Create: `components/InboxList.tsx`
- Test: `components/InboxList.test.ts`
- Create: `app/(tabs)/world/messages/page.tsx`
- Modify: `app/dev/messages/page.tsx` (renders `<InboxListView>`)
- Modify: `lib/core/worldRing.ts:150-165` (`INFRA_NOTE_HE` drops `msgs`) · `:239` (`msgs` becomes `open`)
- Modify: `lib/core/worldRing.test.ts` (the `locked_infra` set is four; a new assertion that `msgs` is open with `/world/messages`)

**Interfaces:**
- Consumes: `InboxRow` · `toInboxRows` · `inboxCountsHe` · `mergeInbox` · `inboxCounts` (Tasks 2, 5), `apiGet` (`lib/api/client.ts`), `LEARNER_TIME_ZONE`, `failureExit` · `SIGN_IN_AGAIN_HE` (`lib/core/failureExit.ts`), `EnWord`.
- Produces: `InboxScreenState` · `InboxListView` · `InboxList` (see Interfaces).

- [ ] **Step 1: Write the failing source-scan test**

```ts
// components/InboxList.test.ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const CODE = readFileSync('components/InboxList.tsx', 'utf8');

describe('InboxList — T-191, render kol-C-13-inbox.png', () => {
  it('the binding strings, verbatim (39 § 1 · row ⓔ · D-109)', () => {
    for (const s of ['הודעות · סימולציות', 'תיבת הסימולציות', 'הקיר', 'סיפור', 'תיבה', 'כל התכתובת מול דמויות', 'אין כאן משתמשים אחרים', 'נפתחים עם הכיתות']) {
      expect(CODE, s).toContain(s);
    }
  });
  it('⛔ never claims a 100% safe space (39 § 1), ⛔ never «בקרוב» (D-046)', () => {
    expect(CODE).not.toMatch(/100%/);
    expect(CODE).not.toMatch(/בטוח לחלוטין|בקרוב/);
  });
  it('⛔ draws only — no filter/reduce/sort, no fetch, no write', () => {
    expect(CODE).not.toMatch(/\.filter\(|\.reduce\(|\.sort\(/);
    expect(CODE).not.toMatch(/fetch\(|apiPost|apiPatch|word_progress|arcade_/);
    expect(CODE).toMatch(/apiGet</);
  });
  it('the dot is not the only channel: the counter string is rendered from the state', () => {
    expect(CODE).toMatch(/countsHe/);
    expect(CODE).toMatch(/data-inbox-unanswered/);
  });
  it('English only inside <EnWord>; sender and subject go through it', () => {
    expect((CODE.match(/<EnWord>/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });
  it('⛔ no hex, ⛔ no h-screen, ⛔ no bg-brand fill, ⛔ no text under 12px, ⛔ no radius off the scale', () => {
    expect(CODE).not.toMatch(/#[0-9a-f]{3,6}\b/i);
    expect(CODE).not.toMatch(/h-screen/);
    expect(CODE).not.toMatch(/\bbg-brand(?![-\w])/);
    expect(CODE).not.toMatch(/text-\[(\d|1[01])(\.\d+)?px\]/);
    expect(CODE).not.toMatch(/rounded-(sm|3xl|\[)/);
  });
  it('the disabled tabs carry the condition, not just a colour (D-046 · D-096)', () => {
    expect(CODE).toMatch(/aria-disabled/);
  });
  it('a failure screen has an exit (D-065)', () => {
    expect(CODE).toMatch(/failureExit\(/);
  });
});
```

- [ ] **Step 2: Run — red**

Run: `npx vitest run components/InboxList.test.ts`
Expected: FAIL — `ENOENT … InboxList.tsx`.

- [ ] **Step 3: Write the component**

```tsx
// components/InboxList.tsx
'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import EnWord from '@/components/EnWord';
import { apiGet } from '@/lib/api/client';
import { failureExit, SIGN_IN_AGAIN_HE } from '@/lib/core/failureExit';
import { inboxCountsHe, toInboxRows, type InboxCounts, type InboxItem, type InboxRow } from '@/lib/core/messages';
import { LEARNER_TIME_ZONE } from '@/lib/core/onboarding';

/**
 * תיבת הסימולציות — the list (T-191 · 39 § 7 · D-109). 🎯 Render: docs/design/kol-C-13-inbox.png,
 * drawn by render_msgs_screens.py `screen_inbox` (:50-82). Layout values are grepped there.
 *
 * ⛔ Draws only: rows arrive precomputed from lib/core/messages.ts (`toInboxRows`). ⛔ No
 * filter/reduce/sort here. ⛔ No write anywhere: apiGet alone.
 * Layer A gaps, declared: chip 9.5→12px · time 10.5→12px · card sub-line 11→12px; radii
 * 17→16 (rows) · 14→16 (card) · 10→12 (active segment). The sliding pill is motion and is
 * ⛔ not built (D-148: no שכבה ב׳ on this row).
 */
export const KICKER_HE = 'הודעות · סימולציות';
export const HEADING_HE = 'תיבת הסימולציות';
const TABS_HE = ['הקיר', 'סיפור', 'תיבה'] as const;
const TABS_CONDITION_HE = 'הקיר וסיפור נפתחים עם הכיתות';
const CARD_TITLE_HE = 'כל התכתובת מול דמויות';
const CARD_SUB_HE = 'אין כאן משתמשים אחרים';
const NO_LEVEL_HE = 'כדי לקרוא הודעות ברמה שלך, בחר קודם רמה.';
const NO_LEVEL_HREF = '/study/scan';
const NO_SIMS_HE = 'עדיין אין כאן הודעות ברמה שלך.';
const RETRY_HE = 'נסה שוב';

export type InboxScreenState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly rows: readonly InboxRow[]; readonly countsHe: string }
  | { readonly kind: 'no_level' }
  | { readonly kind: 'no_simulations' }
  | { readonly kind: 'schema_missing' }
  | { readonly kind: 'session_expired' }
  | { readonly kind: 'error' };

type MessagesBody =
  | { ok: true; items: readonly InboxItem[]; counts: InboxCounts }
  | { ok: false; code: 'no_level' | 'no_simulations' | 'schema_missing' | 'unavailable' | 'session_expired' };

function Header() {
  return (
    <header className="pt-2">
      <p className="text-xs text-ink-muted">{KICKER_HE}</p>
      <h1 className="mt-1 text-2xl font-bold text-ink">{HEADING_HE}</h1>
      <div role="tablist" aria-label="הודעות" className="mt-3 grid h-11 grid-cols-3 rounded-xl border border-surface-raised bg-surface-raised p-0.5">
        {TABS_HE.map((t) => {
          const live = t === 'תיבה';
          return (
            <span
              key={t}
              role="tab"
              aria-selected={live}
              aria-disabled={!live}
              className={live
                ? 'flex items-center justify-center rounded-xl border border-brand bg-brand-surface/25 text-sm font-bold text-brand-surface'
                : 'flex items-center justify-center text-sm text-ink-muted'}
            >
              {t}
            </span>
          );
        })}
      </div>
      <p className="mt-1 text-xs text-ink-muted">{TABS_CONDITION_HE}</p>
    </header>
  );
}

function Row({ row }: { readonly row: InboxRow }) {
  return (
    <li>
      <Link
        href={row.href}
        className={`flex min-h-touch gap-3 rounded-2xl border p-3 ${row.unanswered ? 'border-brand bg-surface-raised' : 'border-surface-raised bg-surface'}`}
      >
        <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-surface text-base font-bold text-brand-on">
          {row.initial}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className={`text-sm ${row.unanswered ? 'font-bold' : 'font-semibold'} text-ink`}><EnWord>{row.senderEn}</EnWord></span>
            <span className="rounded-lg bg-surface-raised px-2 text-xs font-medium text-ink-muted">{row.contextHe}</span>
          </span>
          <span className={`mt-1 block text-sm ${row.unanswered ? 'font-bold text-ink' : 'text-ink-muted'}`}><EnWord>{row.subjectEn}</EnWord></span>
          <span className="mt-1 block text-xs text-ink-muted"><EnWord>{row.previewEn}</EnWord></span>
        </span>
        <span className="flex shrink-0 flex-col items-center gap-2">
          <span className="text-xs font-medium text-ink-muted">{row.whenHe}</span>
          {row.unanswered ? <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-brand-surface" /> : null}
          <span className="sr-only">{row.unanswered ? 'טרם נענתה' : 'נענתה'}</span>
        </span>
      </Link>
    </li>
  );
}

function IsolationCard() {
  return (
    <aside className="mt-4 flex items-start gap-3 rounded-2xl bg-surface-raised p-4">
      <svg aria-hidden viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 text-ink-muted" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0" />
      </svg>
      <span>
        <span className="block text-sm font-semibold text-ink">{CARD_TITLE_HE}</span>
        <span className="block text-xs text-ink-muted">{CARD_SUB_HE}</span>
      </span>
    </aside>
  );
}

function Exit({ code, onRetry }: { readonly code: 'session_expired' | 'schema_missing' | 'unavailable'; readonly onRetry: () => void }) {
  if (code === 'unavailable') {
    return <button type="button" onClick={onRetry} className="mt-4 min-h-touch rounded-xl bg-brand-surface px-4 font-semibold text-brand-on">{RETRY_HE}</button>;
  }
  const exit = failureExit(code);
  return <Link href={exit.href} className="mt-4 inline-flex min-h-touch items-center rounded-xl bg-brand-surface px-4 font-semibold text-brand-on">{code === 'session_expired' ? SIGN_IN_AGAIN_HE : exit.labelHe}</Link>;
}

export function InboxListView({ state, onRetry = () => {} }: { readonly state: InboxScreenState; readonly onRetry?: () => void }) {
  return (
    <section dir="rtl" className="mx-auto w-full max-w-md px-4 pb-6 text-ink">
      <Header />
      {state.kind === 'loading' ? <p className="mt-4 text-xs text-ink-muted">טוען…</p> : null}
      {state.kind === 'ready' ? (
        <>
          <p data-inbox-unanswered className="mt-3 text-xs text-ink-muted">{state.countsHe}</p>
          <ul className="mt-2 space-y-3">{state.rows.map((r) => <Row key={r.id} row={r} />)}</ul>
        </>
      ) : null}
      {state.kind === 'no_level' ? <p className="mt-4 text-sm">{NO_LEVEL_HE} <Link href={NO_LEVEL_HREF} className="inline-flex min-h-touch items-center font-semibold text-brand-surface underline">לבחירת רמה</Link></p> : null}
      {state.kind === 'no_simulations' ? <p className="mt-4 text-sm text-ink-muted">{NO_SIMS_HE}</p> : null}
      {state.kind === 'schema_missing' ? <Exit code="schema_missing" onRetry={onRetry} /> : null}
      {state.kind === 'session_expired' ? <Exit code="session_expired" onRetry={onRetry} /> : null}
      {state.kind === 'error' ? <Exit code="unavailable" onRetry={onRetry} /> : null}
      <IsolationCard />
    </section>
  );
}

export default function InboxList(): React.JSX.Element {
  const [state, setState] = useState<InboxScreenState>({ kind: 'loading' });
  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      const body = await apiGet<MessagesBody>('/api/world/messages');
      if (!body.ok) {
        if (body.code === 'session_expired') setState({ kind: 'session_expired' });
        else if (body.code === 'schema_missing') setState({ kind: 'schema_missing' });
        else if (body.code === 'no_level') setState({ kind: 'no_level' });
        else if (body.code === 'no_simulations') setState({ kind: 'no_simulations' });
        else setState({ kind: 'error' });
        return;
      }
      // ⛔ No computing here beyond formatting: `readAt`/`answeredAt` already travel on
      // `items`, and `counts` is the server’s — the component never re-derives either.
      setState({
        kind: 'ready',
        rows: toInboxRows(body.items, new Date().toISOString(), LEARNER_TIME_ZONE),
        countsHe: inboxCountsHe(body.counts),
      });
    } catch {
      setState({ kind: 'error' });
    }
  }, []);
  useEffect(() => { void load(); }, [load]);
  return <InboxListView state={state} onRetry={() => { void load(); }} />;
}
```

⚠️ `Exit` on `schema_missing`: `failureExit('schema_missing')` yields the «navigate to a tab that works» exit (`lib/core/failureExit.ts:32`) — D-065.
⚠️ The kicker `p` is 12px (`text-xs`) — the render’s 12.5 rounds down to the floor, ⛔ not a gap.

- [ ] **Step 4: Replace the dev page body** — `app/dev/messages/page.tsx` becomes:

```tsx
import { InboxListView } from '@/components/InboxList';
import { inboxCounts, inboxCountsHe, mergeInbox, toInboxRows } from '@/lib/core/messages';
import { FIXTURE_NOW, FIXTURE_SIMULATIONS, FIXTURE_STATES } from './messages-fixture';

/** T-190ⓔ / T-191 — the inbox fixture at 320/375/414. Asks the server for nothing (⛔ no EXPECTED_CONSOLE entry). */
export default function DevMessagesPage() {
  const items = mergeInbox(FIXTURE_SIMULATIONS, FIXTURE_STATES);
  return (
    <main className="mx-auto w-full max-w-md py-6">
      <InboxListView state={{ kind: 'ready', rows: toInboxRows(items, FIXTURE_NOW, 'Asia/Jerusalem'), countsHe: inboxCountsHe(inboxCounts(items)) }} />
    </main>
  );
}
```

- [ ] **Step 5: The product route**

```tsx
// app/(tabs)/world/messages/page.tsx
import InboxList from '@/components/InboxList';

// T-264 — the exact kicker `<InboxList>` renders (`components/InboxList.tsx` `KICKER_HE`);
// the `<h1>` `תיבת הסימולציות` is the open message’s title (T-192), so the two routes differ.
export const metadata = { title: 'הודעות · סימולציות' };

/**
 * `/world/messages` — T-191 · 39 § 7 · D-109. Closes the 404 measured C-0273.
 * ⛔ Zero data access here (the `/world/story` reasoning): `<InboxList>` reads
 * `GET /api/world/messages`, which already performs the C-0032 guard order and answers
 * `session_expired` as data. Inside `(tabs)` ⇒ the tab bar is the layout’s (render
 * kol-C-13 draws it); ⛔ no `<ActionBar>` below (D-028).
 */
export default function WorldMessagesPage() {
  return <InboxList />;
}
```

- [ ] **Step 6: The ring node opens (D-109 «Arrival» · D-074 three conditions now met: T-190 row · D-054 row · the screen exists)** — in `lib/core/worldRing.ts`:
  - `INFRA_NOTE_HE`’s record type and object: remove `msgs` (`:154-160`); update the doc comment «חמשת צמתי `locked_infra`» → «ארבעת» and add a line: `⟦עודכן C-XXXX · T-191⟧ msgs → open (/world/messages)`.
  - `:239`: `msgs: { kind: 'open', href: MESSAGES_HREF },` with `export const MESSAGES_HREF = '/world/messages';` above `RING_ORDER`.
  - `lib/core/worldRing.test.ts`: where the test enumerates the `locked_infra` ids (`:157-172`), drop `'msgs'`; add:

```ts
  it('הודעות is open onto /world/messages once the inbox exists (T-191 · D-109 arrival)', () => {
    const screen = ringScreen(ALL_OPEN_INPUTS, '/world', 'unavailable');
    if (screen.kind !== 'ring') throw new Error('unreachable');
    const msgs = screen.nodes.find((n) => n.id === 'msgs')!;
    expect(msgs.state).toEqual({ kind: 'open', href: '/world/messages' });
  });
```
  (`ALL_OPEN_INPUTS` — reuse the fixture the file already builds for its ring tests; `grep -n 'open' lib/core/worldRing.test.ts | head` to find its name.)

- [ ] **Step 7: Run — green**

Run: `npx vitest run components/InboxList.test.ts lib/core/worldRing.test.ts components/WorldRing.test.tsx app/dev/messages && npm run typecheck && npm run check:core && npm run check:titles && npm run check:text-floor`
Expected: all PASS / exit 0. If `components/WorldRing.test.tsx` pins «five locked_infra», change it to four in the same commit (measure first: `grep -n 'locked_infra\|5\b' components/WorldRing.test.tsx`).

- [ ] **Step 8: STEP 6.5 — look at the screen**

Run: `(npx next dev -p 3000 &) && sleep 25` then drive `http://127.0.0.1:3000/dev/messages` at 375×780 with Playwright (`/opt/pw-browsers/chromium`). Record in the report: heading · text length · tappable count (expected **3** rows + 1 `לבחירת רמה`-free) · under-44px (**0**) · horizontal scroll (**0**) · console errors (**0**). Compare LAYOUT to `docs/design/kol-C-13-inbox.png`: header → bar → counter → 3 rows → card.

- [ ] **Step 9: Commit T-191**

```bash
./scripts/g add components/InboxList.tsx components/InboxList.test.ts "app/(tabs)/world/messages/page.tsx" app/dev/messages/page.tsx lib/core/worldRing.ts lib/core/worldRing.test.ts components/WorldRing.test.tsx lib/core/messages.ts lib/core/messages.test.ts app/dev/messages/messages-fixture.test.ts
./scripts/g commit -m "loop(DEV): C-XXXX T-191 תיבת הסימולציות — the inbox list at /world/messages (kol-C-13), ring node הודעות opens"
```

---

### Task 7: Required words — the pure rule and the chips (T-192 ⓒ)

**Files:**
- Create: `lib/core/requiredWords.ts` · `lib/core/requiredWords.test.ts`
- Create: `components/RequiredWordChips.tsx` · `components/RequiredWordChips.test.ts`

**Interfaces:** see Interfaces, Task 7. Consumes nothing. Produces `requiredWordsProgress` · `requiredWordsHe` · `<RequiredWordChips>` for Task 8.

- [ ] **Step 1: Write the failing tests**

```ts
// lib/core/requiredWords.test.ts
import { describe, expect, it } from 'vitest';
import { requiredWordsHe, requiredWordsProgress } from './requiredWords';

describe('requiredWordsProgress — exact match, case-insensitive, trimmed', () => {
  it('nothing used ⇒ three unlit chips, 0 מתוך 3', () => {
    const p = requiredWordsProgress(['summer', 'visit', 'recommend'], []);
    expect(p.chips).toEqual([{ word: 'summer', used: false }, { word: 'visit', used: false }, { word: 'recommend', used: false }]);
    expect(p.used).toBe(0);
    expect(p.total).toBe(3);
    expect(requiredWordsHe(p)).toBe('0 מתוך 3 מילות חובה');
  });
  it('the render’s state: recommend used ⇒ 1 מתוך 3', () => {
    const p = requiredWordsProgress(['summer', 'visit', 'recommend'], ['I', 'Recommend']);
    expect(p.chips[2]).toEqual({ word: 'recommend', used: true });
    expect(requiredWordsHe(p)).toBe('1 מתוך 3 מילות חובה');
  });
  it('⛔ no lemmatiser: visited ≠ visit (declared — the keyboard emits exact blocks)', () => {
    expect(requiredWordsProgress(['visit'], ['visited']).used).toBe(0);
  });
  it('all three ⇒ 3 מתוך 3 מילות חובה (39 § 7)', () => {
    expect(requiredWordsHe(requiredWordsProgress(['a', 'b', 'c'], ['a', 'b', 'c']))).toBe('3 מתוך 3 מילות חובה');
  });
});
```

```ts
// components/RequiredWordChips.test.ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const CODE = readFileSync('components/RequiredWordChips.tsx', 'utf8');

describe('RequiredWordChips — T-192ⓒ', () => {
  it('a used chip is success + ✓ (two channels); an unused chip is ⛔ never danger', () => {
    expect(CODE).toMatch(/success/);
    expect(CODE).not.toMatch(/danger/);
    expect(CODE).toMatch(/<svg/);
  });
  it('the heading and the counter are rendered from props, ⛔ not computed here', () => {
    expect(CODE).toContain('מילות חובה');
    expect(CODE).toMatch(/labelHe/);
    expect(CODE).not.toMatch(/\.filter\(|\.reduce\(/);
  });
  it('words inside <EnWord>; ⛔ no hex; ⛔ no text under 12px', () => {
    expect(CODE).toMatch(/<EnWord>/);
    expect(CODE).not.toMatch(/#[0-9a-f]{3,6}\b/i);
    expect(CODE).not.toMatch(/text-\[(\d|1[01])(\.\d+)?px\]/);
  });
});
```

- [ ] **Step 2: Run — red**

Run: `npx vitest run lib/core/requiredWords.test.ts components/RequiredWordChips.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

```ts
// lib/core/requiredWords.ts
/**
 * מילות חובה — 39 § 7 (T-192ⓒ). Pure. ⛔ No lemmatiser: the block keyboard (39 § 3, R-026)
 * emits whole blocks, so a match is exact after trim + lower-case. `visited` ≠ `visit` —
 * declared, ⛔ not an oversight; PM refines when the keyboard lands.
 */
export interface RequiredWordChip {
  readonly word: string;
  readonly used: boolean;
}
export interface RequiredWordsProgress {
  readonly chips: readonly RequiredWordChip[];
  readonly used: number;
  readonly total: number;
}

const norm = (s: string): string => s.trim().toLowerCase();

export function requiredWordsProgress(required: readonly string[], usedTokens: readonly string[]): RequiredWordsProgress {
  const used = new Set(usedTokens.map(norm));
  const chips = required.map((word) => ({ word, used: used.has(norm(word)) }));
  let n = 0;
  for (const c of chips) if (c.used) n += 1;
  return { chips, used: n, total: chips.length };
}

/** `3 מתוך 3 מילות חובה` — the spec’s closing line (39 § 7). */
export function requiredWordsHe(p: RequiredWordsProgress): string {
  return `${p.used} מתוך ${p.total} מילות חובה`;
}
```

```tsx
// components/RequiredWordChips.tsx
import EnWord from '@/components/EnWord';
import type { RequiredWordsProgress } from '@/lib/core/requiredWords';

/**
 * Three chips (render_msgs_screens.py:98-109): h=32 r=16 13 SemiBold; used ⇒ success fill
 * α46 + success outline + ✓; unused ⇒ transparent, strong outline. ⛔ Not tap targets, so
 * 32px is not a Layer A gap. ⛔ An unused chip is ⛔ not an error and ⛔ never `danger`.
 */
const HEADING_HE = 'מילות חובה';

export default function RequiredWordChips({ progress, labelHe }: { readonly progress: RequiredWordsProgress; readonly labelHe: string }) {
  return (
    <section aria-label={HEADING_HE} className="mt-4">
      <h2 className="text-xs font-semibold text-ink">{HEADING_HE}</h2>
      <ul className="mt-2 flex flex-wrap gap-2">
        {progress.chips.map((c) => (
          <li
            key={c.word}
            className={c.used
              ? 'inline-flex h-8 items-center gap-1 rounded-2xl border border-success bg-success/20 px-3 text-sm font-semibold text-success'
              : 'inline-flex h-8 items-center rounded-2xl border border-ink-muted px-3 text-sm font-semibold text-ink-muted'}
          >
            {c.used ? (
              <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
            ) : null}
            <EnWord>{c.word}</EnWord>
            <span className="sr-only">{c.used ? ' — נעשה בה שימוש' : ' — טרם'}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-ink-muted">{labelHe}</p>
    </section>
  );
}
```

- [ ] **Step 4: Run — green**

Run: `npx vitest run lib/core/requiredWords.test.ts components/RequiredWordChips.test.ts && npm run check:core && npm run typecheck`
Expected: PASS · exit 0.

- [ ] **Step 5: Stage**

Run: `./scripts/g add lib/core/requiredWords.ts lib/core/requiredWords.test.ts components/RequiredWordChips.tsx components/RequiredWordChips.test.ts`

---

### Task 8: The open message — the PATCH state route, the screen, the flow route, the fixture, commit T-192 (T-192 ⓐ ⓑ ⓓ ⓔ)

**Files:**
- Create: `app/api/world/messages/state/route.ts` · `app/api/world/messages/state/route.test.ts`
- Modify: `docs/api-contract.md` — `## PATCH /api/world/messages/state` right after the GET section from Task 3
- Create: `components/SimulationMessage.tsx` · `components/SimulationMessage.test.ts`
- Create: `app/world/messages/[id]/page.tsx`
- Create: `app/dev/messages/open/page.tsx`
- Modify: `scripts/verify-mobile.mjs` — `ROUTES`: add `'/world/messages'` (the product list, measures the failure state) and `'/dev/messages/open'` after `'/dev/messages'`

**Interfaces:**
- Consumes: `InboxItem` · `whenOf` · `whenHeaderHe` · `CONTEXT_HE` (Tasks 2, 5), `requiredWordsProgress` · `requiredWordsHe` · `<RequiredWordChips>` (Task 7), `apiGet` · `apiPatch` (`lib/api/client.ts`), `EnWord` · `EnText` (`components/EnWord.tsx:20,66`).
- Produces: `StateBody` (see Interfaces) · `SimulationMessageView` · `SimulationMessage`.

- [ ] **Step 1: Write the failing route test**

```ts
// app/api/world/messages/state/route.test.ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('app/api/world/messages/state/route.ts', 'utf8');

describe('T-192ⓔ — PATCH /api/world/messages/state writes the learner’s own read_at only', () => {
  it('guard order: env, then session, then body, then the upsert', () => {
    expect(SRC.indexOf('readSupabaseEnv')).toBeLessThan(SRC.indexOf('auth.getUser'));
    expect(SRC.indexOf('auth.getUser')).toBeLessThan(SRC.indexOf('.upsert('));
  });
  it('rejects a non-uuid simulationId with 400', () => {
    expect(SRC).toMatch(/status:\s*400/);
    expect(SRC).toMatch(/\[0-9a-f\]\{8\}/i);
  });
  it('⛔ never writes answered_at (R-026) and ⛔ never touches word_progress', () => {
    expect(SRC).not.toMatch(/answered_at/);
    expect(SRC).not.toMatch(/word_progress|arcade_/);
  });
  it('the row is keyed on the session user, ⛔ never on a body field', () => {
    expect(SRC).toMatch(/user_id:\s*user\.id/);
    expect(SRC).not.toMatch(/body\.userId|body\.user_id/);
  });
});
```

- [ ] **Step 2: Run — red**

Run: `npx vitest run app/api/world/messages/state/route.test.ts`
Expected: FAIL — `ENOENT`.

- [ ] **Step 3: Write the route**

```ts
// app/api/world/messages/state/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * PATCH /api/world/messages/state — see docs/api-contract.md
 *
 * Opening a message turns the blue dot off (T-192ⓔ): the learner’s own
 * `message_simulation_state` row gets `read_at` if it has none. ⛔ `answered_at` is never
 * written here — the keyboard that would earn it is R-026. A write is a hard call:
 * ENV missing ⇒ 503, unlike the soft GET.
 */
export async function PATCH(request: Request) {
  const env = readSupabaseEnv();
  if (!env) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { simulationId?: unknown; read?: unknown } | null;
  const simulationId = typeof body?.simulationId === 'string' ? body.simulationId : '';
  if (!UUID.test(simulationId) || body?.read !== true) {
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 400 });
  }

  const readAt = new Date().toISOString();
  const existing = await supabase
    .from('message_simulation_state')
    .select('read_at')
    .eq('user_id', user.id)
    .eq('simulation_id', simulationId)
    .maybeSingle();
  if (existing.error) return failure('read', existing.error);
  const already = (existing.data as { read_at?: string | null } | null)?.read_at ?? null;
  if (already !== null) return NextResponse.json({ ok: true, readAt: already });

  const written = await supabase
    .from('message_simulation_state')
    .upsert({ user_id: user.id, simulation_id: simulationId, read_at: readAt }, { onConflict: 'user_id,simulation_id' });
  if (written.error) return failure('upsert', written.error);
  return NextResponse.json({ ok: true, readAt });
}

function failure(where: string, error: { message: string; code?: string }) {
  console.error(`[api/world/messages/state] ${where} failed:`, error.message);
  if (error.code === '42P01' || error.code === 'PGRST205') {
    return NextResponse.json({ ok: false, code: 'schema_missing' }, { status: 503 });
  }
  return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
}
```

- [ ] **Step 4: Contract section** — append to `docs/api-contract.md` right after the GET section from Task 3

```markdown
## PATCH /api/world/messages/state

פתיחת הודעה מכבה את הנקודה הכחולה (T-192ⓔ). דורש סשן חי — ENV → סשן → גוף → כתיבה.

**גוף הבקשה:** `{ "simulationId": "<uuid>", "read": true }`. ⛔ ערך שאינו uuid, או `read` שאינו
`true` ⇒ 400 `unavailable`. ⛔ אין כאן `answered` — המקלדת שמרוויחה אותו היא R-026.

**גוף מוצלח:** `{ "ok": true, "readAt": "2026-09-08T06:20:00.000Z" }` — הזמן שנכתב, או הזמן
שכבר היה שם (הקריאה הראשונה קובעת; פתיחה שנייה ⛔ אינה מזיזה אותו).

| `code` | HTTP | מתי |
|---|---|---|
| `session_expired` | 401 | ⛔ אין סשן. |
| `unavailable` | 400 | גוף פגום. |
| `schema_missing` | 503 | `0022` טרם הוחלה. |
| `unavailable` | 503 | ⛔ אין ENV, או כישלון כתיבה. כתיבה היא קריאה קשיחה — ⛔ בניגוד ל-`GET`. |
```

- [ ] **Step 5: Write the failing component test**

```ts
// components/SimulationMessage.test.ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const CODE = readFileSync('components/SimulationMessage.tsx', 'utf8');

describe('SimulationMessage — T-192, render kol-C-14-mail-open.png', () => {
  it('the binding strings', () => {
    for (const s of ['תיבת הסימולציות', 'ההרכבה תיפתח עם מקלדת הבלוקים']) expect(CODE, s).toContain(s);
  });
  it('body through <EnText>, sender through <EnWord>', () => {
    expect(CODE).toMatch(/<EnText/);
    expect(CODE).toMatch(/<EnWord>/);
  });
  it('the compose strip is present and disabled — ⛔ not hidden (D-046 · D-096 · row ⓓ)', () => {
    expect(CODE).toMatch(/data-compose-strip/);
    expect(CODE).toMatch(/aria-disabled/);
    expect(CODE).not.toMatch(/\bhidden\b(?!=)/);
  });
  it('⛔ draws only — the chips come from the pure layer; one PATCH, no other write', () => {
    expect(CODE).toMatch(/RequiredWordChips/);
    expect(CODE).not.toMatch(/\.filter\(|\.reduce\(|\.sort\(/);
    expect(CODE).toMatch(/apiPatch</);
    expect(CODE).not.toMatch(/apiPost|fetch\(|word_progress|arcade_/);
  });
  it('⛔ no tab bar import (D-028: the route is outside (tabs))', () => {
    expect(CODE).not.toMatch(/TabBar/);
  });
  it('⛔ no hex, ⛔ no h-screen, ⛔ no bg-brand fill, ⛔ no text under 12px, ⛔ no 100%', () => {
    expect(CODE).not.toMatch(/#[0-9a-f]{3,6}\b/i);
    expect(CODE).not.toMatch(/h-screen|100%/);
    expect(CODE).not.toMatch(/\bbg-brand(?![-\w])/);
    expect(CODE).not.toMatch(/text-\[(\d|1[01])(\.\d+)?px\]/);
  });
});
```

- [ ] **Step 6: Run — red**

Run: `npx vitest run components/SimulationMessage.test.ts`
Expected: FAIL — `ENOENT`.

- [ ] **Step 7: Write the component**

```tsx
// components/SimulationMessage.tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import EnWord, { EnText } from '@/components/EnWord';
import RequiredWordChips from '@/components/RequiredWordChips';
import { apiGet, apiPatch } from '@/lib/api/client';
import { failureExit, SIGN_IN_AGAIN_HE } from '@/lib/core/failureExit';
import { CONTEXT_HE, initialOf, whenHeaderHe, whenOf, type InboxItem } from '@/lib/core/messages';
import { LEARNER_TIME_ZONE } from '@/lib/core/onboarding';
import { requiredWordsHe, requiredWordsProgress, type RequiredWordsProgress } from '@/lib/core/requiredWords';

/**
 * הודעה פתוחה — T-192 · 39 § 7 · D-109. 🎯 Render: docs/design/kol-C-14-mail-open.png,
 * `screen_mail` (render_msgs_screens.py:84-116). Header sub `תיבת הסימולציות` / subject;
 * meta `Tom · תייר · היום 09:20`; body bubble (r 18→16 declared); `מילות חובה` chips; the
 * compose strip PRESENT and DISABLED with a named condition (row ⓓ · R-026); ⛔ no keyboard
 * sheet; ⛔ no tab bar (route outside (tabs), D-028).
 * ⛔ Draws only. One write: PATCH read on open (row ⓔ).
 */
export const KICKER_HE = 'תיבת הסימולציות';
const COMPOSE_CONDITION_HE = 'ההרכבה תיפתח עם מקלדת הבלוקים';
const BACK_HE = 'חזרה לתיבה';
const BACK_HREF = '/world/messages';
const NOT_FOUND_HE = 'ההודעה הזאת לא נמצאה.';
const RETRY_HE = 'נסה שוב';

export type MessageScreenState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly item: InboxItem; readonly metaHe: string; readonly progress: RequiredWordsProgress; readonly progressHe: string }
  | { readonly kind: 'not_found' }
  | { readonly kind: 'schema_missing' }
  | { readonly kind: 'session_expired' }
  | { readonly kind: 'error' };

type MessagesBody =
  | { ok: true; items: readonly InboxItem[] }
  | { ok: false; code: 'no_level' | 'no_simulations' | 'schema_missing' | 'unavailable' | 'session_expired' };

export function readyState(item: InboxItem, usedTokens: readonly string[], nowIso: string): MessageScreenState {
  const meta = `${item.senderEn} · ${CONTEXT_HE[item.context]} · ${whenHeaderHe(whenOf(item.createdAt, nowIso, LEARNER_TIME_ZONE))}`;
  const progress = requiredWordsProgress(item.requiredWords, usedTokens);
  return { kind: 'ready', item, metaHe: meta, progress, progressHe: requiredWordsHe(progress) };
}

export function SimulationMessageView({ state, onRetry = () => {} }: { readonly state: MessageScreenState; readonly onRetry?: () => void }) {
  return (
    <section dir="rtl" className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-4 pb-4 text-ink">
      <header className="pt-2">
        <p className="text-xs text-ink-muted">{KICKER_HE}</p>
        <h1 className="mt-1 text-2xl font-bold">{state.kind === 'ready' ? <EnWord>{state.item.subjectEn}</EnWord> : KICKER_HE}</h1>
        {state.kind === 'ready' ? <p className="mt-1 text-xs text-ink-muted"><EnWord>{state.item.senderEn}</EnWord> · {state.metaHe.split(' · ').slice(1).join(' · ')}</p> : null}
      </header>
      {state.kind === 'ready' ? (
        <>
          <article className="mt-4 rounded-2xl border border-surface-raised bg-surface-raised p-4">
            <p className="flex items-center gap-2">
              <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-surface text-sm font-bold text-brand-on">{initialOf(state.item.senderEn)}</span>
              <span className="text-sm font-bold"><EnWord>{state.item.senderEn}</EnWord></span>
            </p>
            <EnText className="mt-3 block text-sm leading-6 text-ink" text={state.item.bodyEn} />
          </article>
          <RequiredWordChips progress={state.progress} labelHe={state.progressHe} />
        </>
      ) : null}
      {state.kind === 'loading' ? <p className="mt-4 text-xs text-ink-muted">טוען…</p> : null}
      {state.kind === 'not_found' ? <p className="mt-4 text-sm">{NOT_FOUND_HE}</p> : null}
      {state.kind === 'error' ? <button type="button" onClick={onRetry} className="mt-4 min-h-touch rounded-xl bg-brand-surface px-4 font-semibold text-brand-on">{RETRY_HE}</button> : null}
      {state.kind === 'session_expired' ? <Link href={failureExit('session_expired').href} className="mt-4 inline-flex min-h-touch items-center rounded-xl bg-brand-surface px-4 font-semibold text-brand-on">{SIGN_IN_AGAIN_HE}</Link> : null}
      {state.kind === 'schema_missing' ? <Link href={failureExit('schema_missing').href} className="mt-4 inline-flex min-h-touch items-center rounded-xl bg-brand-surface px-4 font-semibold text-brand-on">{failureExit('schema_missing').labelHe}</Link> : null}
      <div className="mt-auto pt-6">
        <div data-compose-strip aria-disabled="true" className="flex min-h-touch items-center rounded-xl border border-surface-raised bg-surface px-3 text-xs text-ink-muted">
          {COMPOSE_CONDITION_HE}
        </div>
        <Link href={BACK_HREF} className="mt-3 inline-flex min-h-touch items-center font-semibold text-brand-surface underline">{BACK_HE}</Link>
      </div>
    </section>
  );
}

export default function SimulationMessage({ id }: { readonly id: string }): React.JSX.Element {
  const [state, setState] = useState<MessageScreenState>({ kind: 'loading' });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const body = await apiGet<MessagesBody>('/api/world/messages');
        if (!alive) return;
        if (!body.ok) {
          setState(body.code === 'session_expired' ? { kind: 'session_expired' } : body.code === 'schema_missing' ? { kind: 'schema_missing' } : { kind: 'error' });
          return;
        }
        const item = body.items.find((i) => i.id === id);
        if (item === undefined) { setState({ kind: 'not_found' }); return; }
        setState(readyState(item, [], new Date().toISOString()));
        if (item.readAt === null) void apiPatch<{ ok: boolean }>('/api/world/messages/state', { simulationId: id, read: true }).catch(() => undefined);
      } catch {
        if (alive) setState({ kind: 'error' });
      }
    })();
    return () => { alive = false; };
  }, [id, tick]);
  return <SimulationMessageView state={state} onRetry={() => setTick((t) => t + 1)} />;
}
```

⚠️ `EnText`’s real prop names: read `components/EnWord.tsx:28-80` first (`EnTextSegment` suggests `segments`); adapt the one call. ⚠️ `.find(` is allowed by the scan (only `filter/reduce/sort` are banned) — it is a lookup, ⛔ not a computation. ⚠️ The meta line composes Hebrew + English: sender inside `<EnWord>`, then `תייר · היום 09:20`.

- [ ] **Step 8: The flow route and the fixture**

```tsx
// app/world/messages/[id]/page.tsx
import SimulationMessage from '@/components/SimulationMessage';

// T-264 — the exact kicker `<SimulationMessage>` renders (`KICKER_HE`); the `<h1>` is the
// English subject, fetched client-side, so it cannot be the static title (the /world/story precedent).
export const metadata = { title: 'תיבת הסימולציות' };

/**
 * `/world/messages/[id]` — T-192 · D-109. OUTSIDE `(tabs)`, structurally (the `/world/compose`
 * precedent): render kol-C-14 draws no tab bar, and D-028 allows one bar per screen — here
 * the disabled compose strip. ⛔ Zero data access in this Server Component.
 */
export default async function WorldMessagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SimulationMessage id={id} />;
}
```

```tsx
// app/dev/messages/open/page.tsx
import { SimulationMessageView, readyState } from '@/components/SimulationMessage';
import { mergeInbox } from '@/lib/core/messages';
import { FIXTURE_NOW, FIXTURE_SIMULATIONS, FIXTURE_STATES } from '../messages-fixture';

/** T-192 fixture — Tom’s message with `recommend` used, exactly the render’s state. Asks the server for nothing. */
export default function DevMessageOpenPage() {
  const tom = mergeInbox(FIXTURE_SIMULATIONS, FIXTURE_STATES).find((i) => i.senderEn === 'Tom')!;
  return <SimulationMessageView state={readyState(tom, ['I', 'recommend'], FIXTURE_NOW)} />;
}
```

- [ ] **Step 9: Register in `scripts/verify-mobile.mjs`** — after `'/dev/messages',`:

```js
  // C-XXXX (T-191) — the product list. Without env `GET /api/world/messages` answers
  // `unavailable` (200) ⇒ this line measures the failure state and its exit (D-065), and
  // needs ⛔ no EXPECTED_CONSOLE entry: a 200 is not a console error.
  '/world/messages',
  // C-XXXX (T-192) — the open message fixture: body, chips, disabled strip, no tab bar.
  '/dev/messages/open',
```

- [ ] **Step 10: Run — green**

Run: `npx vitest run app/api/world/messages components/SimulationMessage.test.ts components/RequiredWordChips.test.ts lib/core/requiredWords.test.ts && npm run typecheck && npm run check:core && npm run check:titles && npm run check:text-floor`
Expected: all PASS / exit 0.

- [ ] **Step 11: STEP 6.5 — look at the screen**

Drive `http://127.0.0.1:3000/dev/messages/open` at 375×780. Record: heading (`Trip to Israel`) · text length · tappable count (**1** back link; the strip is `aria-disabled`) · under-44px (**0**) · horizontal scroll (**0**) · console errors (**0**) · `1 מתוך 3 מילות חובה` visible · no tab bar. Compare LAYOUT to `docs/design/kol-C-14-mail-open.png`.

- [ ] **Step 12: Commit T-192**

```bash
./scripts/g add app/api/world/messages/state docs/api-contract.md components/SimulationMessage.tsx components/SimulationMessage.test.ts "app/world/messages/[id]/page.tsx" app/dev/messages/open scripts/verify-mobile.mjs lib/core/requiredWords.ts lib/core/requiredWords.test.ts components/RequiredWordChips.tsx components/RequiredWordChips.test.ts
./scripts/g commit -m "loop(DEV): C-XXXX T-192 הודעה פתוחה — /world/messages/[id] (kol-C-14), required-word chips, PATCH read state, compose strip disabled (R-026)"
```

---

### Task 9: Close — the full gate, the map, the registers

**Files:**
- Regenerate: `docs/architecture-map.json`
- Modify: `plan/30-architecture.md` (one `הודעות` section: file ownership · the three layers · D-054 «מנותקת») · `plan/50-tasks.md` (T-190 · T-191 · T-192 → 🟣 with the cycle id; ⛔ the milestone cell untouched) · `plan/60-findings.md` (one 🟡 finding: «unread vs unanswered — T-191ⓓ · T-192ⓔ · the render use one word for two states; the slice derives both channels from `unanswered`», owner PM) · `plan/26-plan-feedback.md` (the `design-taste-frontend` cell names a skill absent from the registry; any measured gap from execution) · `plan/00-control.md` (`NEXT_AGENT=CRITIC`, `CYCLE`, `LAST_HANDOFF_AT`, release the lock, the `msgs` tick counter) · `docs/plan-open.md` + `docs/plan-tables.md` (regenerated)

- [ ] **Step 1: The map** — `grep -q '"generate-map"' package.json && npm run generate-map` (exists since T-235).

- [ ] **Step 2: The full gate — ⛔ the only line that may claim green**

Run: `npm run verify`
Expected: `typecheck` · `check:core` · `check:motion` · `check:text-floor` · `check:rules` · `check:titles` · `test` · `build` · `check:mobile` — all exit 0. Paste the summary numbers (test files · tests · mobile checks) into the report.

- [ ] **Step 3: Registers** — edit the three rows’ status cells to `🟣 C-XXXX` (T-190 only if Task 4 Step 9 verified the migration live), tick every `- [x]` above, then `npm run measure:plan`.

- [ ] **Step 4: Close commit and push** — `plan/00-control.md` releases the lock in this commit; the push runs `npm run verify` again inside the hook

```bash
./scripts/g add -A
./scripts/g commit -m "loop(DEV): C-XXXX close — T-190 · T-191 · T-192 🟣, registers, map, plan 9/9, lock released"
./scripts/g push origin work/current
```

## Self-check (done at planning time, C-0515)

1. **Spec coverage.** `39 § 7` list: sender ✅ (Task 6) · subject on its own line ✅ · preview ✅ (derived, declared) · time ✅ (Task 5) · blue dot ✅ · context chip ✅. Open message: body ✅ (Task 8) · required words lighting one by one — the **rule** ✅ (Task 7), the **lighting** waits for the keyboard (R-026, declared) · `3 מתוך 3` ✅. `39 § 1` no-100% ✅ (source scans). `39 § 4` segmented bar ✅ with two disabled. `39 § 9` item 1 only ✅. D-109 arrival (ring node opens) ✅ (Task 6 Step 6). D-054 row ✅ (Task 4 Step 7). Row T-190 ⓐ–ⓔ ✅ (Tasks 1–4). Row T-191 ⓐ–ⓕ ✅ (Task 6). Row T-192 ⓐ–ⓔ ✅ (Tasks 7–8). **Gap:** none found; the unread/unanswered ambiguity is a finding, ⛔ not a gap.
2. **Placeholder scan.** No TBD/TODO. `C-XXXX` in commit messages and comments is the build tick’s cycle id (`node scripts/next-cycle-id.mjs`), by convention of every plan in this folder.
3. **Type consistency.** `InboxItem` (Task 2) is what the route returns (Task 3), the fixture merges (Task 4), `toInboxRows` consumes (Task 5), and `readyState` consumes (Task 8). `RequiredWordsProgress` (Task 7) is the chips’ prop (Task 8). `MessagesBody` in Tasks 6 and 8 mirrors the contract (Task 3). `whenHeaderHe` is used by Task 8, `whenListHe` by Task 5’s `toInboxRows`.
