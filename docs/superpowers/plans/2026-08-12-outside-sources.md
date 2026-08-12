# Outside Sources — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or superpowers:subagent-driven-development) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the loop two deterministic, tested answers to the same question — *"what does an outside source actually say, and are we allowed to believe it?"* — one for an Anki `.apkg` deck (a source we must **refuse**, in software, for reasons the code can state), and one for the two CEFR profiles already sitting in `data/` (a source we may believe, but only next to the level the Content agent assigned itself).

**Loop tasks covered:** **T-044** (Tasks 1–2, closes the software half of 🟠 **F-019**) · **T-010** (Tasks 3–4, the "write to `words`" half that C-0051 explicitly left open).

**Why these two are one plan, not two:** they are the same shape of bug waiting to happen. Both take a file somebody else authored, both are one careless `as` away from writing an unverified claim into the content bank, and both are decided by *provenance*, not by content quality. T-044's deck is high-quality and must still be refused (wrong direction, no commercial licence — R-010). T-010's profiles are licensed and must still not overwrite what the Content agent wrote. One plan, one convention: **an outside claim lands in its own column, next to ours, never on top of it.**

**Tech Stack:** TypeScript (pure modules under `lib/core/`), Node `.mjs` script for the one impure layer, PostgreSQL emitted as a file and applied by hand, Vitest.

## Global Constraints

- ⛔ **No content is invented, translated, levelled by hand, or repaired.** Every value written is copied from a source file or computed from one. A row a gate rejects is **reported and dropped**.
- ⛔ **`/lib/core/` stays pure** — no `fs`, no `react`, no `window`, no `document`, no `localStorage`, no `process.env`, no `fetch`. `npm run check:core` enforces exactly these seven (`scripts/check-core-purity.mjs:10-18`). All file reading lives in `scripts/`.
- ⛔ **No new dependency.** The `.mjs` + `registerHooks` type-stripping preamble in `scripts/build-ingest-sql.mjs:24-48` is copied verbatim, not replaced. No zip library, no sqlite library, no CSV library.
- ⛔ **No guessing.** An unrecognised POS stays `null` (`cefrLevels.ts` precedent); an ambiguous Anki field is **rejected with a named reason**, never assigned by position.
- ⛔ **No `main`.** Push to `dev` only. No `[skip ci]` in any commit message (RULES § 0.7).
- ⛔ **No UI, no screen, no design skill.** Neither task renders anything. `plan/35-design-constitution.md` is not read and not touched.
- ⛔ **`docs/api-contract.md` is not touched** — neither task adds, removes or changes an endpoint.
- Verification before any completion claim: `npm run typecheck && npm run check:core && npm test && npm run build`.

---

## What is measured, not assumed

Run in this repo on **2026-08-12T13:39Z** (`ls`, `wc -l`, `sed -n`, `grep -n`, `python3 -c`). Anything not in this table is an assumption and is flagged as one where it appears.

| fact | measured value |
|---|---|
| `.apkg` file in the repo | **none.** `find . -iname '*apkg*' -o -iname '*.anki2'` → 0 hits. Roy's deck was described in F-019 but never committed |
| `lib/core/apkg.ts` | does not exist |
| zip / sqlite dependency | **none.** `dependencies` = `@supabase/ssr · @supabase/supabase-js · next · react · react-dom · zod`; `devDependencies` = types, autoprefixer, playwright, postcss, tailwindcss, typescript, vitest |
| F-019 deck, as recorded | "100 Basic Hebrew Phrases · TeachMeHebrew.com", 2012, 101 notes, 4 fields `עברית \| English \| [sound:*.mp3] \| תעתיק`, media map, 10 MB audio |
| F-019 status | 🔓 open. Its "proposed fix" column reads: *⛔ לא נקלטת לתוכן. הערך היחיד שלה הוא כמקרה מבחן אמיתי לפייפליין `.apkg` — ראה T-044* |
| `data/cefrj-vocabulary-profile-1.5.csv` | **7,800 lines** (1 header + 7,799 rows). Header: `headword,pos,CEFR,CoreInventory 1,CoreInventory 2,Threshold` |
| `data/octanove-vocabulary-profile-c1c2-1.0.csv` | **2,137 lines** (1 header + 2,136 rows). Header: `headword,pos,CEFR,notes` |
| `data/ngsl-1.2.csv` | **absent** — T-043 is still ⛔. Nothing in this plan reads it |
| `lib/core/cefrLevels.ts` (C-0051) | exists. Exports `CefrBand · BAND_ORDER · POS_ALIASES · LevelEntry · LevelParseResult · LevelMap · LevelHit · splitCsvLine · parseCefrCsv · buildLevelMap · levelOf` |
| `levelOf` signature | `levelOf(map: LevelMap, lemma: string, pos: Pos): LevelHit`, `LevelHit = { band, route: 'exact_pos' \| 'lemma_only' } \| null` (`cefrLevels.ts:127`) |
| C-0051's own measured output | CEFR-J `rows 7799 · entries 7974 · skipped 0 · unknownPos 31` · Octanove `rows 2136 · entries 2182 · skipped 0 · unknownPos 2` · merged `byLemmaPos 9948 · byLemma 8843` |
| `words` columns (`0002_content_bank.sql:35-56`) | `id · headword · pos · origin · source_note · ngsl_rank · zipf_freq · n_letters · n_syllables · is_function_word · created_at`, `unique (headword, pos)`. **There is no level column on `words`** |
| `senses.cefr_level` (`0002:70`) | `text check (cefr_level in ('A1'..'C2'))`, nullable — the Content agent's own label, per sense |
| content batches | 6 files, **343 rows**, **306 distinct `(headword, pos)`** pairs |
| batch `cefr_level` distribution | **A1 195 · A2 93 · B1 50 · B2 5** — every row carries one; none is C1/C2 |
| profile coverage of those 306 pairs | **287 exact_pos · 18 lemma_only · 1 miss** (`program`/noun) |
| **profile band vs batch `cefr_level`** | **≥ 124 of 342 comparable rows disagree (36%)**: `A2→A1` 62 · `B1→A2` 21 · `B1→A1` 19 · `A1→A2` 13 · `B2→A2` 4 · `A2→B1` 3 · `A1→B1` 1 · `B2→A1` 1 |
| profile POS tags present | `noun 4851 · adjective 2020 · verb 1768 · adverb 820 · pronoun 83 · preposition 80 · determiner 46 · conjunction 38 · number 30 · modal auxiliary 13 · be-verb 10 · interjection 9 · do-verb 5 · have-verb 3 · '' 1` |
| existing migrations | `0001 · 0002 · 0003_low_confidence_is_visible · 0003_provenance_telemetry · 0004 · 0005 · 0006 · 0007`. **Next free number is `0008`** |
| `scripts/migration-hygiene.test.ts` | asserts `^\d{4}_[a-z0-9_]+\.sql$`, no duplicate number outside the one grandfathered `0003` pair, and **no gap in the sequence** |
| existing emitted seed | `supabase/seed/0001_content_batches.sql`, built by `npm run build:ingest` (TD-24: emit a file, do not write the network) |
| suite size at plan time | **614 tests, 43 files** (C-0061) |

> ⚠️ **The two coverage/disagreement rows are a floor, not the final number.** They were re-measured here with lowercase-only normalization and no `/`-variant expansion, because running `levelOf` itself needs `npm install` and this was a planning tick. The real `normalizeEnglish` + slash expansion + `POS_ALIASES` matches **strictly more** pairs (C-0051's 9,948 vs this run's 9,779), so coverage can only go up and the disagreement count can only go up. **Task 3 Step 1 re-measures both with the real module and the plan's numbers are replaced by that output.**

---

## Four consequences, stated before any code is written

**ⓐ The 36% disagreement is not a defect, and treating it as one would corrupt the content bank.** `senses.cefr_level` is a **sense-level** judgement — `mean`/verb tagged B1 is about *"to signify"*, not about the lemma. CEFR-J is a **lemma-level** profile built for Japanese learners. `mean`/verb A1 and `mean`(sense)/B1 can both be true. So T-010 **must not** write into `senses.cefr_level`, must not `update … set cefr_level = profile`, and must not open a finding against the Content agent. It writes a **new, separately named, separately sourced** column on `words`, and the disagreement becomes a *reported number* that a human can act on. Anything else silently replaces 124 human-authored judgements with a Japanese lemma list.

**ⓑ Anki field roles must be resolved from content and names, never from position — and where both fail, the note is rejected.** The F-019 deck's front field is Hebrew and its second field is English: a parser that assumes `flds[0]` is the front produces 101 backwards cards that typecheck perfectly. Worse, **English and transliteration are both Latin script** ("thank you" vs "toda raba"), so script detection alone cannot separate field 2 from field 4. The resolver therefore uses script to find the Hebrew field and the *field name* to break the Latin tie, and returns a named rejection — `ambiguous_latin_fields` — when it cannot. ⛔ There is no "probably the first one" branch.

**ⓒ The deck is refused for provenance, and the refusal lives in code, not in a comment.** F-019 gives two independent reasons: the deck teaches **Hebrew to English speakers** (backwards for אמיר"ם), and TeachMeHebrew.com publishes **no visible commercial licence** (R-010). A comment saying "don't ingest this" is not a control — the next Dev agent reads the parser, not the finding. `apkgIngestDecision()` returns `{ ingest: false, reasons: [...] }` and the reasons are enumerated values a test asserts on. **Licence is an input the caller must supply; the default is "unknown", and unknown refuses.**

**ⓓ There is no `.apkg` file and no live Supabase, so both halves stop one step short of the real artefact — deliberately, and it is written down.** T-044 says the ZIP/SQLite read lives in the API layer, not in `/lib/core`; its file list is `lib/core/apkg.ts` alone. So this plan builds the pure half against synthetic fixtures that reproduce the documented Anki shapes, and adds **an item to `plan/03-for-roy.md` asking for the deck** — the fixtures are honest about being fixtures (see the header comment mandated in Task 1 Step 1). Likewise T-010 emits `supabase/seed/0002_word_cefr_levels.sql` rather than writing the network — same TD-24 trade as `build-ingest-sql.mjs`, same reasons, and the same one-line change the day credentials exist.

---

## File structure

| file | responsibility | pure? |
|---|---|---|
| `lib/core/apkg.ts` | Anki note → `{front, back, audio?, translit?}`; field-role resolution; deck classification; ingest decision. The only place `\x1f` and `[sound:…]` are understood | ✅ |
| `lib/core/apkg.test.ts` | Tasks 1–2 tests, incl. an F-019-shaped fixture | ✅ |
| `lib/core/wordLevel.ts` | `(LevelMap, word rows, sense labels)` → per-word band + route + agreement report. The only place a profile band meets a Content-agent band | ✅ |
| `lib/core/wordLevel.test.ts` | Task 3 tests | ✅ |
| `supabase/migrations/0008_word_cefr_profile.sql` | two columns on `words`: the profile band and where it came from | — |
| `scripts/build-word-levels-sql.mjs` | the one impure layer: reads the two CSVs + the batches, calls the pure modules, writes one SQL file, prints the measured report | ⛔ |
| `scripts/build-word-levels-sql.test.ts` | asserts the emitter's output shape and escaping | — |
| `supabase/seed/0002_word_cefr_levels.sql` | generated. Not hand-edited | — |
| `package.json` | one new script: `build:levels` | — |
| `plan/03-for-roy.md` | one new item: send the `.apkg` deck | — |

---

# Task 1: Anki note parsing — script, field roles, one note

**Loop task:** T-044 (first half).

**Files:**
- Create: `lib/core/apkg.ts`
- Test: `lib/core/apkg.test.ts`

**Interfaces:**
- Consumes: nothing. This module imports **nothing** — not `contentSchema`, not `lexicon`. It is a format reader, and coupling it to our content types would make a deck's shape look like a validated sense.
- Produces, for Task 2 and for the future API layer:

```ts
export type Script = 'latin' | 'hebrew' | 'mixed' | 'other' | 'empty';
export const FIELD_SEPARATOR = '\u001F'; // ⛔ the escape, not a literal control char in source

export interface AnkiNote {
  readonly fieldNames: readonly string[];  // from the note type, in ord order
  readonly flds: string;                   // raw, \x1f-joined
  readonly tags: string;                   // raw, space-padded as Anki stores it
}

export interface ApkgCard {
  readonly front: string;      // English, always — our product direction
  readonly back: string;       // Hebrew
  readonly audio?: string;     // filename from [sound:…], without the markup
  readonly translit?: string;  // Latin-script pronunciation aid, when named as one
  readonly tags: readonly string[];
}

export type NoteReject =
  | 'field_count_mismatch'
  | 'no_hebrew_field'
  | 'no_latin_field'
  | 'ambiguous_latin_fields'
  | 'empty_after_markup';

export type NoteResult =
  | { readonly ok: true; readonly card: ApkgCard }
  | { readonly ok: false; readonly reason: NoteReject };

export function detectScript(value: string): Script;
export function stripSoundMarkup(value: string): { readonly text: string; readonly audio: string | null };
export function splitFields(flds: string): readonly string[];
export function parseTags(tags: string): readonly string[];
export function parseAnkiNote(note: AnkiNote): NoteResult;
```

**Rules this task encodes (each has a test below):**

1. `splitFields` splits on `` and never trims — a field that is legitimately `"  "` is not the same as `""`, and Anki writes both.
2. `detectScript` classifies by codepoint: Hebrew is `֐-׿`, Latin is `A-Za-z`. Both present → `mixed`. Neither → `other`. Nothing but whitespace/punctuation/markup → `empty`.
3. `stripSoundMarkup` removes **every** `[sound:file]` occurrence and returns the **first** filename. Two sounds in one field returns the first and still strips both — a card cannot play two files.
4. Role resolution, in this order:
   - `fieldNames.length !== splitFields(flds).length` → `field_count_mismatch`. (Anki guarantees parity; a mismatch means the caller paired a note with the wrong note type, and every role after this point would be wrong.)
   - Exactly one Hebrew-or-mixed field → back. Zero → `no_hebrew_field`. More than one → the one whose **name** is not transliteration-like wins; if that is still not exactly one → `ambiguous_latin_fields`.
   - Latin fields, after audio-only fields are removed: exactly one → front. Zero → `no_latin_field`. Two or more → the one whose name matches `TRANSLIT_NAME` is `translit` and the remaining single one is front; if that does not leave exactly one → `ambiguous_latin_fields`.
   - Front or back `empty` after markup stripping → `empty_after_markup`.
5. `TRANSLIT_NAME = /translit|transcription|pronun|romani|תעתיק|הגייה/i`. ⛔ Do not extend this list with a guess; add a name only when a real deck uses it.

- [ ] **Step 1: Create the file with its header comment and constants**

The header states what the fixtures are and are not. Write it first so no later step can quietly claim the deck was parsed.

```ts
/**
 * Anki .apkg note parsing (T-044) — the pure half.
 *
 * An .apkg is a ZIP containing collection.anki2 (SQLite). This module never sees
 * either: the caller extracts rows from the `notes` table and hands over `flds`
 * (fields joined by U+001F), `tags`, and the field NAMES from the note type.
 * ⛔ Nothing here touches fs or zip — T-044 puts that in the API layer.
 *
 * ⚠️ FIXTURES ARE NOT THE DECK. Roy's deck (F-019: "100 Basic Hebrew Phrases",
 * 101 notes, fields עברית|English|[sound:*.mp3]|תעתיק) has never been committed —
 * `find . -iname '*apkg*'` returns nothing. The tests reproduce its documented
 * SHAPE from the finding; they do not prove anything about its 101 real rows.
 * plan/03-for-roy.md asks for the file. Until it arrives, no claim in this repo
 * may say the deck "was parsed" — only that a deck of that shape parses.
 *
 * ⛔ This module imports nothing. It is a format reader; wiring it to our content
 * types would make a stranger's deck look like a validated sense.
 */
export const FIELD_SEPARATOR = '\u001F'; // ⛔ the escape, not a literal control char in source

const HEBREW = /[֐-׿]/;
const LATIN = /[A-Za-z]/;
const SOUND = /\[sound:([^\]]+)\]/g;
/** ⛔ Add a name here only when a real deck uses it. No guesses. */
const TRANSLIT_NAME = /translit|transcription|pronun|romani|תעתיק|הגייה/i;
```

- [ ] **Step 2: Write the failing tests for the three primitives**

```ts
// lib/core/apkg.test.ts
import { describe, expect, it } from 'vitest';
import {
  FIELD_SEPARATOR, detectScript, stripSoundMarkup, splitFields, parseTags,
} from './apkg';

describe('splitFields', () => {
  it('splits on U+001F and preserves empty and whitespace-only fields', () => {
    expect(splitFields(`a${FIELD_SEPARATOR}${FIELD_SEPARATOR}  ${FIELD_SEPARATOR}b`))
      .toEqual(['a', '', '  ', 'b']);
  });

  it('returns one field when there is no separator', () => {
    expect(splitFields('only')).toEqual(['only']);
  });
});

describe('detectScript', () => {
  it.each([
    ['thank you', 'latin'],
    ['תודה רבה', 'hebrew'],
    ['תודה (thanks)', 'mixed'],
    ['12 — 34', 'other'],
    ['   ', 'empty'],
    ['[sound:a.mp3]', 'empty'],
  ])('classifies %j as %s', (input, expected) => {
    expect(detectScript(input)).toBe(expected);
  });
});

describe('stripSoundMarkup', () => {
  it('removes the markup and returns the filename', () => {
    expect(stripSoundMarkup('boker tov [sound:001.mp3]'))
      .toEqual({ text: 'boker tov', audio: '001.mp3' });
  });

  it('strips every occurrence but reports only the first file', () => {
    expect(stripSoundMarkup('[sound:a.mp3]x[sound:b.mp3]'))
      .toEqual({ text: 'x', audio: 'a.mp3' });
  });

  it('reports null when there is no markup, and does not alter the text', () => {
    expect(stripSoundMarkup(' hello ')).toEqual({ text: 'hello', audio: null });
  });
});

describe('parseTags', () => {
  it('splits Anki space-padded tags and drops the padding', () => {
    expect(parseTags(' greetings basic ')).toEqual(['greetings', 'basic']);
  });

  it('returns an empty list for an empty tag string', () => {
    expect(parseTags('  ')).toEqual([]);
  });
});
```

- [ ] **Step 3: Run the tests and confirm they fail for the right reason**

Run: `npx vitest run lib/core/apkg.test.ts`
Expected: FAIL — `detectScript is not a function` (or a resolve error on the four missing exports). ⛔ If it fails with anything else, stop and read the error before writing implementation.

- [ ] **Step 4: Implement the four primitives**

```ts
export type Script = 'latin' | 'hebrew' | 'mixed' | 'other' | 'empty';

export function splitFields(flds: string): readonly string[] {
  return flds.split(FIELD_SEPARATOR);
}

export function parseTags(tags: string): readonly string[] {
  return tags.split(/\s+/).filter((t) => t !== '');
}

export function stripSoundMarkup(value: string): { readonly text: string; readonly audio: string | null } {
  let audio: string | null = null;
  const text = value.replace(SOUND, (_m, file: string) => {
    if (audio === null) audio = file.trim();
    return '';
  });
  return { text: text.replace(/\s+/g, ' ').trim(), audio };
}

export function detectScript(value: string): Script {
  const { text } = stripSoundMarkup(value);
  if (text === '') return 'empty';
  const heb = HEBREW.test(text);
  const lat = LATIN.test(text);
  if (heb && lat) return 'mixed';
  if (heb) return 'hebrew';
  if (lat) return 'latin';
  return 'other';
}
```

⚠️ `SOUND` carries the `g` flag, so it is stateful across `.test()` calls. `String.replace` resets `lastIndex` for a global regex; `.test()` does not. **Do not** call `SOUND.test(...)` anywhere in this module.

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `npx vitest run lib/core/apkg.test.ts`
Expected: PASS, 11 tests.

- [ ] **Step 6: Write the failing tests for `parseAnkiNote`**

The first test is the F-019 deck's documented shape. The second is the same deck with the roles the *repo* wants — proof that role resolution, not position, is doing the work.

```ts
import { parseAnkiNote, type AnkiNote } from './apkg';

const f = (...parts: string[]) => parts.join(FIELD_SEPARATOR);

/** F-019's documented shape: Hebrew first, English second, audio third, translit fourth. */
const teachMeHebrew: AnkiNote = {
  fieldNames: ['עברית', 'English', 'Audio', 'תעתיק'],
  flds: f('בוקר טוב', 'good morning', '[sound:001.mp3]', 'boker tov'),
  tags: ' greetings ',
};

describe('parseAnkiNote', () => {
  it('puts English on the front even when the deck authored Hebrew first', () => {
    const r = parseAnkiNote(teachMeHebrew);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.card).toEqual({
      front: 'good morning',
      back: 'בוקר טוב',
      audio: '001.mp3',
      translit: 'boker tov',
      tags: ['greetings'],
    });
  });

  it('reads the same note reordered — position carries no meaning', () => {
    const r = parseAnkiNote({
      fieldNames: ['תעתיק', 'Audio', 'English', 'עברית'],
      flds: f('boker tov', '[sound:001.mp3]', 'good morning', 'בוקר טוב'),
      tags: '  ',
    });
    expect(r).toEqual({
      ok: true,
      card: { front: 'good morning', back: 'בוקר טוב', audio: '001.mp3', translit: 'boker tov', tags: [] },
    });
  });

  it('omits audio and translit when the deck has only two fields', () => {
    const r = parseAnkiNote({ fieldNames: ['Front', 'Back'], flds: f('water', 'מים'), tags: '' });
    expect(r).toEqual({ ok: true, card: { front: 'water', back: 'מים', tags: [] } });
  });

  it('rejects when the field names and the field values disagree in count', () => {
    expect(parseAnkiNote({ fieldNames: ['Front'], flds: f('water', 'מים'), tags: '' }))
      .toEqual({ ok: false, reason: 'field_count_mismatch' });
  });

  it('rejects an English-only deck rather than inventing a back', () => {
    expect(parseAnkiNote({ fieldNames: ['Front', 'Back'], flds: f('water', 'liquid'), tags: '' }))
      .toEqual({ ok: false, reason: 'ambiguous_latin_fields' });
  });

  it('rejects a Hebrew-only deck rather than inventing a front', () => {
    expect(parseAnkiNote({ fieldNames: ['א', 'ב'], flds: f('מים', 'נוזל'), tags: '' }))
      .toEqual({ ok: false, reason: 'ambiguous_latin_fields' });
  });

  it('rejects two unnamed Latin fields — it will not guess which is the word', () => {
    expect(parseAnkiNote({
      fieldNames: ['One', 'Two', 'Three'],
      flds: f('good morning', 'boker tov', 'בוקר טוב'),
      tags: '',
    })).toEqual({ ok: false, reason: 'ambiguous_latin_fields' });
  });

  it('rejects when the English field is nothing but sound markup', () => {
    expect(parseAnkiNote({
      fieldNames: ['English', 'עברית'],
      flds: f('[sound:001.mp3]', 'מים'),
      tags: '',
    })).toEqual({ ok: false, reason: 'no_latin_field' });
  });

  it('treats a mixed-script field as the Hebrew side', () => {
    const r = parseAnkiNote({
      fieldNames: ['English', 'Hebrew'],
      flds: f('order', 'להזמין (food)'),
      tags: '',
    });
    expect(r).toEqual({ ok: true, card: { front: 'order', back: 'להזמין (food)', tags: [] } });
  });
});
```

- [ ] **Step 7: Run and confirm failure**

Run: `npx vitest run lib/core/apkg.test.ts`
Expected: FAIL — `parseAnkiNote is not a function`.

- [ ] **Step 8: Implement `parseAnkiNote`**

```ts
export interface AnkiNote {
  readonly fieldNames: readonly string[];
  readonly flds: string;
  readonly tags: string;
}

export interface ApkgCard {
  readonly front: string;
  readonly back: string;
  readonly audio?: string;
  readonly translit?: string;
  readonly tags: readonly string[];
}

export type NoteReject =
  | 'field_count_mismatch' | 'no_hebrew_field' | 'no_latin_field'
  | 'ambiguous_latin_fields' | 'empty_after_markup';

export type NoteResult =
  | { readonly ok: true; readonly card: ApkgCard }
  | { readonly ok: false; readonly reason: NoteReject };

interface Slot {
  readonly name: string;
  readonly text: string;
  readonly audio: string | null;
  readonly script: Script;
}

export function parseAnkiNote(note: AnkiNote): NoteResult {
  const values = splitFields(note.flds);
  if (values.length !== note.fieldNames.length) return { ok: false, reason: 'field_count_mismatch' };

  const slots: Slot[] = values.map((raw, i) => {
    const { text, audio } = stripSoundMarkup(raw);
    return { name: note.fieldNames[i] ?? '', text, audio, script: detectScript(raw) };
  });

  const audio = slots.find((s) => s.audio !== null)?.audio ?? undefined;

  const hebrew = slots.filter((s) => s.script === 'hebrew' || s.script === 'mixed');
  if (hebrew.length === 0) return { ok: false, reason: 'no_hebrew_field' };
  const back = hebrew.length === 1
    ? hebrew[0]
    : pickSingle(hebrew.filter((s) => !TRANSLIT_NAME.test(s.name)));
  if (back === null) return { ok: false, reason: 'ambiguous_latin_fields' };

  const latin = slots.filter((s) => s.script === 'latin');
  if (latin.length === 0) return { ok: false, reason: 'no_latin_field' };
  const named = latin.filter((s) => TRANSLIT_NAME.test(s.name));
  const front = latin.length === 1 ? latin[0] : pickSingle(latin.filter((s) => !TRANSLIT_NAME.test(s.name)));
  if (front === null) return { ok: false, reason: 'ambiguous_latin_fields' };

  if (front.text === '' || back.text === '') return { ok: false, reason: 'empty_after_markup' };

  const card: ApkgCard = {
    front: front.text,
    back: back.text,
    ...(audio !== undefined ? { audio } : {}),
    ...(named.length === 1 ? { translit: named[0].text } : {}),
    tags: parseTags(note.tags),
  };
  return { ok: true, card };
}

/** Exactly one, or nothing. ⛔ There is no "pick the first" branch. */
function pickSingle(list: readonly Slot[]): Slot | null {
  return list.length === 1 ? list[0] : null;
}
```

- [ ] **Step 9: Run and confirm all pass**

Run: `npx vitest run lib/core/apkg.test.ts`
Expected: PASS, 20 tests.

- [ ] **Step 10: Mutation-check the two rules that carry the task**

Run each mutation, confirm the named test fails, then revert it. A mutation that survives means the test is decorative — strengthen the test, do not skip the mutation.

| # | mutation | test that must fail |
|---|---|---|
| 1 | `const front = latin[0];` (position, not resolution) | *rejects two unnamed Latin fields* |
| 2 | `pickSingle` → `return list[0] ?? null;` | *rejects two unnamed Latin fields* |
| 3 | `hebrew` filter drops `'mixed'` | *treats a mixed-script field as the Hebrew side* |
| 4 | `if (values.length !== …)` removed | *rejects when the field names and the field values disagree in count* |
| 5 | `stripSoundMarkup` returns the **last** filename | *strips every occurrence but reports only the first file* |
| 6 | `detectScript` checks `latin` before `mixed` | *classifies "תודה (thanks)" as mixed* |

- [ ] **Step 11: Run the full gate and commit**

```bash
npm run typecheck && npm run check:core && npm test && npm run build
git add lib/core/apkg.ts lib/core/apkg.test.ts
git commit -m "loop(DEV): C-XXXX T-044 apkg note parsing — roles by script and name, never position"
```

⛔ Do not push yet — Task 2 finishes T-044 and both go to `dev` together, so `dev` never holds a parser with no refusal gate.

---

# Task 2: Deck classification and the refusal that closes F-019

**Loop task:** T-044 (second half) · closes the software half of 🟠 F-019.

**Files:**
- Modify: `lib/core/apkg.ts` (append; do not restructure Task 1)
- Modify: `lib/core/apkg.test.ts` (append)
- Modify: `plan/03-for-roy.md` (one new open item)

**Interfaces:**
- Consumes from Task 1: `parseAnkiNote`, `NoteResult`, `NoteReject`, `AnkiNote`, `ApkgCard`.
- Produces:

```ts
export type DeckDirection = 'en_to_he' | 'he_to_en' | 'unknown';
export type CommercialLicence = 'permitted' | 'forbidden' | 'unknown';

export interface DeckSummary {
  readonly notes: number;
  readonly parsed: number;
  readonly rejected: Readonly<Record<NoteReject, number>>;
  readonly direction: DeckDirection;
  readonly cards: readonly ApkgCard[];
}

export type IngestRefusal =
  | 'wrong_direction'
  | 'licence_unknown'
  | 'licence_forbidden'
  | 'parse_rate_too_low';

export interface IngestDecision {
  readonly ingest: boolean;
  readonly reasons: readonly IngestRefusal[];
}

export const MIN_PARSE_RATE = 0.95;

export function classifyDeck(notes: readonly AnkiNote[]): DeckSummary;
export function apkgIngestDecision(
  summary: DeckSummary,
  licence: CommercialLicence,
): IngestDecision;
```

**Rules this task encodes:**

1. `classifyDeck` reports direction from the **first field of the note type** (`fieldNames[0]` / `values[0]`), because that is Anki's sort field and therefore what the deck's author put on the front: `hebrew`/`mixed` → `he_to_en`, `latin` → `en_to_he`, anything else or a mixed verdict across notes → `unknown`. Direction is a fact about the *source*; `parseAnkiNote` still normalises every card to English-front.
2. `apkgIngestDecision` refuses on **every** applicable ground and returns them all — a caller must not fix one and re-run to discover the next.
3. `licence` has no default. `'unknown'` refuses (R-010).
4. Parse rate below `MIN_PARSE_RATE` refuses: a deck we can only half-read is a deck we do not understand.
5. `reasons` is empty **iff** `ingest` is `true`.

- [ ] **Step 1: Write the failing tests**

```ts
import {
  classifyDeck, apkgIngestDecision, MIN_PARSE_RATE,
  type AnkiNote, type CommercialLicence,
} from './apkg';

/** Three notes shaped like F-019's deck: Hebrew in the sort field. */
const f019: readonly AnkiNote[] = [
  { fieldNames: ['עברית', 'English', 'Audio', 'תעתיק'],
    flds: f('בוקר טוב', 'good morning', '[sound:001.mp3]', 'boker tov'), tags: ' greetings ' },
  { fieldNames: ['עברית', 'English', 'Audio', 'תעתיק'],
    flds: f('על לא דבר', "you're welcome", '[sound:002.mp3]', 'al lo davar'), tags: ' greetings ' },
  { fieldNames: ['עברית', 'English', 'Audio', 'תעתיק'],
    flds: f('תודה רבה', 'thank you very much', '[sound:003.mp3]', 'toda raba'), tags: '' },
];

describe('classifyDeck', () => {
  it('reports he_to_en for a deck that authored Hebrew in the sort field', () => {
    const s = classifyDeck(f019);
    expect(s.direction).toBe('he_to_en');
    expect(s.notes).toBe(3);
    expect(s.parsed).toBe(3);
    expect(s.cards[0].front).toBe('good morning');
  });

  it('reports en_to_he for the mirrored deck', () => {
    const mirrored = f019.map((n) => ({
      ...n,
      fieldNames: ['English', 'עברית', 'Audio', 'תעתיק'],
      flds: (() => { const v = splitFields(n.flds); return f(v[1], v[0], v[2], v[3]); })(),
    }));
    expect(classifyDeck(mirrored).direction).toBe('en_to_he');
  });

  it('reports unknown when the notes disagree', () => {
    const mixed = [f019[0], {
      fieldNames: ['English', 'עברית'], flds: f('water', 'מים'), tags: '',
    }];
    expect(classifyDeck(mixed).direction).toBe('unknown');
  });

  it('counts every rejection by reason and keeps them out of cards', () => {
    const s = classifyDeck([f019[0], { fieldNames: ['A'], flds: f('x', 'y'), tags: '' }]);
    expect(s.notes).toBe(2);
    expect(s.parsed).toBe(1);
    expect(s.rejected.field_count_mismatch).toBe(1);
    expect(s.rejected.no_hebrew_field).toBe(0);
    expect(s.cards).toHaveLength(1);
  });
});

describe('apkgIngestDecision', () => {
  it('refuses F-019 on both of its grounds at once', () => {
    const d = apkgIngestDecision(classifyDeck(f019), 'unknown');
    expect(d.ingest).toBe(false);
    expect([...d.reasons].sort()).toEqual(['licence_unknown', 'wrong_direction']);
  });

  it('still refuses a correctly-directed deck with no known licence', () => {
    const s = { ...classifyDeck(f019), direction: 'en_to_he' as const };
    expect(apkgIngestDecision(s, 'unknown')).toEqual({ ingest: false, reasons: ['licence_unknown'] });
  });

  it('refuses a forbidden licence with its own reason', () => {
    const s = { ...classifyDeck(f019), direction: 'en_to_he' as const };
    expect(apkgIngestDecision(s, 'forbidden')).toEqual({ ingest: false, reasons: ['licence_forbidden'] });
  });

  it('refuses a deck it can only half read', () => {
    const s = { ...classifyDeck(f019), direction: 'en_to_he' as const, notes: 10, parsed: 3 };
    expect(apkgIngestDecision(s, 'permitted').reasons).toContain('parse_rate_too_low');
  });

  it('accepts only when direction, licence and parse rate all hold', () => {
    const s = { ...classifyDeck(f019), direction: 'en_to_he' as const };
    expect(apkgIngestDecision(s, 'permitted')).toEqual({ ingest: true, reasons: [] });
  });

  it('has no default licence — every call states one', () => {
    // @ts-expect-error licence is required; a deck with no stated licence must not compile through
    apkgIngestDecision(classifyDeck(f019));
  });

  it('never reports ingest:true alongside a reason', () => {
    const licences: CommercialLicence[] = ['permitted', 'forbidden', 'unknown'];
    for (const l of licences) {
      for (const dir of ['en_to_he', 'he_to_en', 'unknown'] as const) {
        const d = apkgIngestDecision({ ...classifyDeck(f019), direction: dir }, l);
        expect(d.ingest, `${dir}/${l}`).toBe(d.reasons.length === 0);
      }
    }
  });

  it('pins the parse-rate floor so a silent loosening fails here', () => {
    expect(MIN_PARSE_RATE).toBe(0.95);
  });
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `npx vitest run lib/core/apkg.test.ts`
Expected: FAIL — `classifyDeck is not a function`.

- [ ] **Step 3: Implement**

```ts
export type DeckDirection = 'en_to_he' | 'he_to_en' | 'unknown';
export type CommercialLicence = 'permitted' | 'forbidden' | 'unknown';

const REJECT_REASONS: readonly NoteReject[] = [
  'field_count_mismatch', 'no_hebrew_field', 'no_latin_field',
  'ambiguous_latin_fields', 'empty_after_markup',
];

export interface DeckSummary {
  readonly notes: number;
  readonly parsed: number;
  readonly rejected: Readonly<Record<NoteReject, number>>;
  readonly direction: DeckDirection;
  readonly cards: readonly ApkgCard[];
}

export function classifyDeck(notes: readonly AnkiNote[]): DeckSummary {
  const rejected = Object.fromEntries(REJECT_REASONS.map((r) => [r, 0])) as Record<NoteReject, number>;
  const cards: ApkgCard[] = [];
  const directions = new Set<DeckDirection>();

  for (const note of notes) {
    const first = splitFields(note.flds)[0] ?? '';
    const script = detectScript(first);
    directions.add(
      script === 'hebrew' || script === 'mixed' ? 'he_to_en'
        : script === 'latin' ? 'en_to_he'
          : 'unknown',
    );
    const r = parseAnkiNote(note);
    if (r.ok) cards.push(r.card);
    else rejected[r.reason] += 1;
  }

  const direction = directions.size === 1 ? [...directions][0] : 'unknown';
  return { notes: notes.length, parsed: cards.length, rejected, direction, cards };
}

export type IngestRefusal =
  'wrong_direction' | 'licence_unknown' | 'licence_forbidden' | 'parse_rate_too_low';

export interface IngestDecision {
  readonly ingest: boolean;
  readonly reasons: readonly IngestRefusal[];
}

/** A deck we can only half read is a deck we do not understand. */
export const MIN_PARSE_RATE = 0.95;

export function apkgIngestDecision(
  summary: DeckSummary,
  licence: CommercialLicence,
): IngestDecision {
  const reasons: IngestRefusal[] = [];
  if (summary.direction !== 'en_to_he') reasons.push('wrong_direction');
  if (licence === 'unknown') reasons.push('licence_unknown');
  if (licence === 'forbidden') reasons.push('licence_forbidden');
  if (summary.notes === 0 || summary.parsed / summary.notes < MIN_PARSE_RATE) {
    reasons.push('parse_rate_too_low');
  }
  return { ingest: reasons.length === 0, reasons };
}
```

- [ ] **Step 4: Run and confirm all pass**

Run: `npx vitest run lib/core/apkg.test.ts`
Expected: PASS, 30 tests.

- [ ] **Step 5: Mutation-check the refusal**

| # | mutation | test that must fail |
|---|---|---|
| 1 | `if (licence === 'unknown')` → `if (false)` | *refuses F-019 on both of its grounds at once* |
| 2 | `reasons.push('wrong_direction'); return …` early | *refuses F-019 on both of its grounds at once* |
| 3 | `direction !== 'en_to_he'` → `direction === 'he_to_en'` | *never reports ingest:true alongside a reason* (`unknown` direction) |
| 4 | `MIN_PARSE_RATE = 0` | *pins the parse-rate floor* and *refuses a deck it can only half read* |
| 5 | `directions.size === 1` → `directions.size >= 1` | *reports unknown when the notes disagree* |

- [ ] **Step 6: Confirm the `plan/03-for-roy.md` item is there**

**Item 10 was already added in the planning tick (C-0063)** so Roy — who reads this file every few days — sees the request before the code lands. Confirm it is still present and unchanged; add it only if it is missing. ⛔ Do not touch any other row: an item is closed only by whoever opened it.

```markdown
| 10 | DEV (C-0063) | 2026-08-12 | **לשלוח את קובץ ה-`.apkg` שהעלית (F-019) אל `data/decks/` בריפו.** נמדד: `find . -iname '*apkg*'` מחזיר 0 תוצאות — הקובץ מעולם לא נכנס לגיט. | פייפליין ה-`.apkg` (T-044) נבנה ונבדק מול פיקסצ'רים שמשחזרים את **הצורה** המתועדת ב-F-019, ולא מול 101 השורות האמיתיות. בלי הקובץ אי אפשר לסגור את F-019, ואסור לטעון בשום מקום שהחפיסה "נקראה". ⛔ התוכן שלה לא ייקלט בכל מקרה — `apkgIngestDecision` מסרב לה על שני נימוקים (כיוון הפוך + רישיון לא ידוע, R-010) | לא |
```

- [ ] **Step 7: Update `plan/` and run the full gate**

- `plan/30-architecture.md`: add a numbered subsection for `lib/core/apkg.ts` — the three-step role resolution, why `ambiguous_latin_fields` exists instead of a positional fallback, and that `licence` has no default.
- `plan/50-tasks.md`: T-044 → ✅ with the measured test count, and the explicit sentence *"⛔ לא נקלט תוכן; החפיסה עצמה אינה בריפו"*.
- `plan/60-findings.md`: F-019 stays **🔓 open** — its status cell gains *"החצי התוכנתי נבנה ב-T-044 (C-XXXX): `apkgIngestDecision` מסרב לחפיסה על שני נימוקים. הממצא נשאר פתוח עד שהקובץ עצמו יגיע (פריט 10 ב-03-for-roy)."* ⛔ Do not mark it ✅. The finding is about a deck this repo has never held.

```bash
npm run typecheck && npm run check:core && npm test && npm run build
```

- [ ] **Step 8: Commit and push both tasks together**

```bash
git add lib/core/apkg.ts lib/core/apkg.test.ts plan/
git commit -m "loop(DEV): C-XXXX T-044 apkg deck classification + ingest refusal (F-019 software half)"
git push origin dev
```

⛔ `dev` only. No `[skip ci]`.

---

# Task 3: `wordLevel.ts` — the profile band meets the Content agent's band

**Loop task:** T-010 (the half C-0051 left open), pure part.

**Files:**
- Create: `lib/core/wordLevel.ts`
- Test: `lib/core/wordLevel.test.ts`

**Interfaces:**
- Consumes: `levelOf`, `type LevelMap`, `type CefrBand`, `BAND_ORDER` from `./cefrLevels`; `type Pos` from `./contentSchema`.
- Produces:

```ts
export interface WordKey { readonly headword: string; readonly pos: Pos }

export interface WordLevel {
  readonly headword: string;
  readonly pos: Pos;
  readonly profileBand: CefrBand | null;
  readonly route: 'exact_pos' | 'lemma_only' | null;   // null iff profileBand is null
  readonly ownBand: CefrBand | null;                   // senses.cefr_level, as authored
  readonly agreement: 'agree' | 'profile_lower' | 'profile_higher' | 'no_profile' | 'no_own';
}

export interface LevelReport {
  readonly words: readonly WordLevel[];
  readonly total: number;
  readonly exactPos: number;
  readonly lemmaOnly: number;
  readonly unmatched: number;
  readonly agree: number;
  readonly disagree: number;
}

export function assignWordLevels(
  map: LevelMap,
  words: readonly (WordKey & { readonly ownBand: CefrBand | null })[],
): LevelReport;

export function formatLevelReport(report: LevelReport): string;
```

**Rules this task encodes:**

1. `profileBand` is **only ever** the value `levelOf` returned. ⛔ No fallback to `ownBand`, no default of `'A1'`, no inference from `n_letters`.
2. `agreement` is descriptive, never corrective. `profile_lower` means the profile says the word is easier than the Content agent thought. **Neither wins.** The emitter in Task 4 writes both columns.
3. `unmatched` words are emitted with `null` — a word the profiles do not cover keeps only the Content agent's label, and the `null` is the honest record that no source backs it.
4. `formatLevelReport` returns a one-line summary in the exact shape `build-ingest-sql.mjs` prints, so the two pipelines' logs read alike.

- [ ] **Step 1: Re-measure with the real module before writing anything**

This plan's coverage numbers were taken with crude lowercase normalization. Replace them with the module's own output.

```bash
npm install
node --input-type=module -e "
import { registerHooks } from 'node:module';
registerHooks({ resolve(s, c, n) {
  if (s.startsWith('.') && !/\.[a-z]+\$/i.test(s)) { try { const r = n(s + '.ts', c); return { ...r, format: 'module-typescript' }; } catch {} }
  const r = n(s, c); return r.url?.endsWith('.ts') ? { ...r, format: 'module-typescript' } : r;
} });
const { readFileSync, readdirSync } = await import('node:fs');
const { parseCefrCsv, buildLevelMap, levelOf } = await import('./lib/core/cefrLevels.ts');
const e = [
  ...parseCefrCsv(readFileSync('data/cefrj-vocabulary-profile-1.5.csv','utf8')).entries,
  ...parseCefrCsv(readFileSync('data/octanove-vocabulary-profile-c1c2-1.0.csv','utf8')).entries,
];
const map = buildLevelMap(e);
const rows = readdirSync('data/generated').filter(f=>/^batch-.*\.jsonl\$/.test(f)).sort()
  .flatMap(f => readFileSync('data/generated/'+f,'utf8').split('\n').filter(Boolean).map(JSON.parse));
const seen = new Map();
for (const r of rows) seen.set(r.headword.toLowerCase()+'#'+r.pos, r);
let exact=0, lemma=0, miss=0, dis=0;
for (const r of seen.values()) {
  const h = levelOf(map, r.headword, r.pos);
  if (!h) { miss++; continue; }
  h.route === 'exact_pos' ? exact++ : lemma++;
  if (h.band !== r.cefr_level) dis++;
}
console.log({ pairs: seen.size, exact, lemma, miss, dis });
"
```

Record the printed object in the Task 4 commit message. Expected shape (the plan's floor): `pairs 306 · exact ≥287 · lemma ≤18 · miss ≤1 · dis ≥124`. ⚠️ If `miss > 5` or `dis < 100`, **stop and read `levelOf` before continuing** — the plan's premise is wrong and Task 4's report would be meaningless.

- [ ] **Step 2: Write the failing tests**

```ts
// lib/core/wordLevel.test.ts
import { describe, expect, it } from 'vitest';
import { buildLevelMap, type LevelEntry } from './cefrLevels';
import { assignWordLevels, formatLevelReport } from './wordLevel';

const map = buildLevelMap([
  { lemma: 'mean', pos: 'verb', band: 'A1' },
  { lemma: 'report', pos: 'noun', band: 'A2' },
  { lemma: 'water', pos: 'noun', band: 'A1' },
  { lemma: 'must', pos: null, band: 'A2' },   // lemma-only route
] as LevelEntry[]);

describe('assignWordLevels', () => {
  it('takes the profile band and the route from levelOf, never from ownBand', () => {
    const r = assignWordLevels(map, [{ headword: 'mean', pos: 'verb', ownBand: 'B1' }]);
    expect(r.words[0]).toEqual({
      headword: 'mean', pos: 'verb', profileBand: 'A1', route: 'exact_pos',
      ownBand: 'B1', agreement: 'profile_lower',
    });
  });

  it('routes through the lemma when the profile has no POS', () => {
    const r = assignWordLevels(map, [{ headword: 'must', pos: 'verb', ownBand: 'A2' }]);
    expect(r.words[0].route).toBe('lemma_only');
    expect(r.words[0].agreement).toBe('agree');
  });

  it('emits null — never a guess — for a word no profile covers', () => {
    const r = assignWordLevels(map, [{ headword: 'program', pos: 'noun', ownBand: 'A2' }]);
    expect(r.words[0]).toEqual({
      headword: 'program', pos: 'noun', profileBand: null, route: null,
      ownBand: 'A2', agreement: 'no_profile',
    });
    expect(r.unmatched).toBe(1);
  });

  it('records no_own when the Content agent left the level empty', () => {
    const r = assignWordLevels(map, [{ headword: 'water', pos: 'noun', ownBand: null }]);
    expect(r.words[0].agreement).toBe('no_own');
    expect(r.disagree).toBe(0);
  });

  it('names the direction of a disagreement', () => {
    const r = assignWordLevels(map, [
      { headword: 'mean', pos: 'verb', ownBand: 'B1' },     // profile easier
      { headword: 'water', pos: 'noun', ownBand: 'A1' },    // equal
      { headword: 'report', pos: 'noun', ownBand: 'A1' },   // profile harder
    ]);
    expect(r.words.map((w) => w.agreement))
      .toEqual(['profile_lower', 'agree', 'profile_higher']);
    expect({ agree: r.agree, disagree: r.disagree }).toEqual({ agree: 1, disagree: 2 });
  });

  it('counts routes and totals over the whole list', () => {
    const r = assignWordLevels(map, [
      { headword: 'mean', pos: 'verb', ownBand: 'B1' },
      { headword: 'must', pos: 'verb', ownBand: 'A2' },
      { headword: 'program', pos: 'noun', ownBand: 'A2' },
    ]);
    expect({ total: r.total, exactPos: r.exactPos, lemmaOnly: r.lemmaOnly, unmatched: r.unmatched })
      .toEqual({ total: 3, exactPos: 1, lemmaOnly: 1, unmatched: 1 });
  });

  it('preserves input order — the emitter depends on it for a stable diff', () => {
    const r = assignWordLevels(map, [
      { headword: 'water', pos: 'noun', ownBand: 'A1' },
      { headword: 'mean', pos: 'verb', ownBand: 'B1' },
    ]);
    expect(r.words.map((w) => w.headword)).toEqual(['water', 'mean']);
  });
});

describe('formatLevelReport', () => {
  it('prints one line in the build-ingest-sql shape', () => {
    const r = assignWordLevels(map, [
      { headword: 'mean', pos: 'verb', ownBand: 'B1' },
      { headword: 'program', pos: 'noun', ownBand: 'A2' },
    ]);
    expect(formatLevelReport(r)).toBe(
      '2 words · 1 exact_pos · 0 lemma_only · 1 unmatched · 0 agree · 1 disagree',
    );
  });
});
```

- [ ] **Step 3: Run and confirm failure**

Run: `npx vitest run lib/core/wordLevel.test.ts`
Expected: FAIL — cannot resolve `./wordLevel`.

- [ ] **Step 4: Implement**

```ts
/**
 * T-010, second half: attach a SOURCED CEFR band to a headword.
 *
 * ⛔ This never overwrites senses.cefr_level. Measured 2026-08-12: 124 of 342
 * content rows carry a band that differs from the profile's. That is not a bug —
 * senses.cefr_level is a SENSE judgement ("mean" = to signify, B1) and CEFR-J is a
 * LEMMA profile built for Japanese learners ("mean", A1). Both can be true, so both
 * are stored, side by side, each next to where it came from.
 */
import { levelOf, type CefrBand, type LevelMap } from './cefrLevels';
import { type Pos } from './contentSchema';

export interface WordKey { readonly headword: string; readonly pos: Pos }

export type Agreement = 'agree' | 'profile_lower' | 'profile_higher' | 'no_profile' | 'no_own';

export interface WordLevel {
  readonly headword: string;
  readonly pos: Pos;
  readonly profileBand: CefrBand | null;
  readonly route: 'exact_pos' | 'lemma_only' | null;
  readonly ownBand: CefrBand | null;
  readonly agreement: Agreement;
}

export interface LevelReport {
  readonly words: readonly WordLevel[];
  readonly total: number;
  readonly exactPos: number;
  readonly lemmaOnly: number;
  readonly unmatched: number;
  readonly agree: number;
  readonly disagree: number;
}

const ORDER: readonly CefrBand[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

function compare(profile: CefrBand, own: CefrBand): Agreement {
  const d = ORDER.indexOf(profile) - ORDER.indexOf(own);
  return d === 0 ? 'agree' : d < 0 ? 'profile_lower' : 'profile_higher';
}

export function assignWordLevels(
  map: LevelMap,
  words: readonly (WordKey & { readonly ownBand: CefrBand | null })[],
): LevelReport {
  const out: WordLevel[] = [];
  let exactPos = 0, lemmaOnly = 0, unmatched = 0, agree = 0, disagree = 0;

  for (const w of words) {
    const hit = levelOf(map, w.headword, w.pos);
    if (hit === null) unmatched += 1;
    else if (hit.route === 'exact_pos') exactPos += 1;
    else lemmaOnly += 1;

    const agreement: Agreement =
      hit === null ? 'no_profile'
        : w.ownBand === null ? 'no_own'
          : compare(hit.band, w.ownBand);
    if (agreement === 'agree') agree += 1;
    if (agreement === 'profile_lower' || agreement === 'profile_higher') disagree += 1;

    out.push({
      headword: w.headword,
      pos: w.pos,
      profileBand: hit?.band ?? null,
      route: hit?.route ?? null,
      ownBand: w.ownBand,
      agreement,
    });
  }

  return { words: out, total: words.length, exactPos, lemmaOnly, unmatched, agree, disagree };
}

export function formatLevelReport(r: LevelReport): string {
  return `${r.total} words · ${r.exactPos} exact_pos · ${r.lemmaOnly} lemma_only · `
    + `${r.unmatched} unmatched · ${r.agree} agree · ${r.disagree} disagree`;
}
```

⚠️ **Fix the one line this snippet gets wrong before you run it.** `const ORDER: readonly CefrBand[] = ['A1', …]` duplicates `BAND_ORDER`, which `cefrLevels.ts:16` already exports — and a seventh band added there would silently not exist here. Delete the local `const ORDER` and add `BAND_ORDER as ORDER` to the existing `./cefrLevels` import. The duplicate is written out above because it is the version that comes to hand first.

- [ ] **Step 5: Run and confirm all pass**

Run: `npx vitest run lib/core/wordLevel.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 6: Mutation-check**

| # | mutation | test that must fail |
|---|---|---|
| 1 | `profileBand: hit?.band ?? w.ownBand` | *emits null — never a guess — for a word no profile covers* |
| 2 | `w.ownBand === null` branch removed (falls into `compare`) | *records no_own when the Content agent left the level empty* |
| 3 | `compare` returns `'profile_higher'` for `d < 0` | *names the direction of a disagreement* |
| 4 | `out.push` → `out.unshift` | *preserves input order* |
| 5 | `disagree` counts `no_profile` too | *counts routes and totals over the whole list* / *records no_own* |

- [ ] **Step 7: Run the full gate and commit**

```bash
npm run typecheck && npm run check:core && npm test && npm run build
git add lib/core/wordLevel.ts lib/core/wordLevel.test.ts
git commit -m "loop(DEV): C-XXXX T-010 wordLevel — sourced band beside the authored band, never over it"
```

⛔ Do not push yet — Task 4 gives this module a caller.

---

# Task 4: `words.cefr_profile_band` — migration, emitter, report

**Loop task:** T-010 (closing).

**Files:**
- Create: `supabase/migrations/0008_word_cefr_profile.sql`
- Create: `scripts/build-word-levels-sql.mjs`
- Create: `scripts/build-word-levels-sql.test.ts`
- Generated: `supabase/seed/0002_word_cefr_levels.sql`
- Modify: `package.json` (one script)
- Modify: `plan/03-for-roy.md` (one new item: apply the seed)

**Interfaces:**
- Consumes: `assignWordLevels`, `formatLevelReport` (Task 3); `parseCefrCsv`, `buildLevelMap` (`./cefrLevels`); `parseBatchFile` (`./batchRecord`).
- Produces: `npm run build:levels`; the file `supabase/seed/0002_word_cefr_levels.sql`.

**Column naming, decided here so no later task re-litigates it:** the new columns are `cefr_profile_band` and `cefr_profile_source`. ⛔ Not `cefr_level` — `senses.cefr_level` already means *the Content agent's sense-level judgement*, and two columns with one name across two tables is exactly the `is_function_word` / `lexical_class` collision now sitting as item 8 in `plan/03-for-roy.md`. The name carries its provenance.

- [ ] **Step 1: Write the migration**

```sql
-- T-010 · a SOURCED CEFR band on the headword.
--
-- ⛔ This is not senses.cefr_level and must never be merged with it. That column is the
-- Content agent's judgement about ONE SENSE. This one is a lemma-level label from a
-- published profile. Measured 2026-08-12: they differ on 124 of 342 content rows, and
-- both are legitimate — "mean" the lemma is A1, "mean" = to signify is B1.
--
-- Sources (both already in data/, both cleared for commercial use in docs/data-licenses.md):
--   cefr-j-1.5   — CEFR-J Vocabulary Profile 1.5   (Pre-A1..B2)
--   octanove-1.0 — Octanove Vocabulary Profile     (C1..C2), CC BY-SA 4.0
--
-- Re-runnable: both columns are guarded, and the whole file is one transaction.

begin;

alter table public.words
  add column if not exists cefr_profile_band text
    check (cefr_profile_band in ('A1','A2','B1','B2','C1','C2'));

alter table public.words
  add column if not exists cefr_profile_source text
    check (cefr_profile_source in ('cefr-j-1.5','octanove-1.0'));

-- A band with no stated source is an unattributable claim; a source with no band is noise.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'words_cefr_profile_paired'
  ) then
    alter table public.words add constraint words_cefr_profile_paired
      check ((cefr_profile_band is null) = (cefr_profile_source is null));
  end if;
end $$;

comment on column public.words.cefr_profile_band is
  'CEFR band from a published profile, for the LEMMA. Never overwrites senses.cefr_level, '
  'which is per-sense and authored by us. They disagree on ~36% of rows by design.';

commit;
```

⚠️ The named constraint is created inside `do $$` and not as a bare `add constraint`, because `add constraint` has no `if not exists` and the second run of this file would abort the transaction — the lesson recorded in C-0032.

- [ ] **Step 2: Run the migration-hygiene test**

Run: `npx vitest run scripts/migration-hygiene.test.ts`
Expected: PASS — `0008_word_cefr_profile.sql` matches `^\d{4}_[a-z0-9_]+\.sql$`, is the only `0008`, and leaves the sequence `1..8` gapless.

- [ ] **Step 3: Write the failing emitter test**

```ts
// scripts/build-word-levels-sql.test.ts
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';

const OUT = 'supabase/seed/0002_word_cefr_levels.sql';
let sql = '';

beforeAll(() => {
  execFileSync('node', ['scripts/build-word-levels-sql.mjs'], { stdio: 'pipe' });
  sql = readFileSync(OUT, 'utf8');
}, 120_000);

describe('build-word-levels-sql', () => {
  it('writes one transaction', () => {
    expect(sql.trimStart().startsWith('begin;')).toBe(true);
    expect(sql.trimEnd().endsWith('commit;')).toBe(true);
  });

  it('only ever updates — it never inserts a word', () => {
    expect(sql).not.toMatch(/insert\s+into/i);
    expect(sql).toMatch(/update public\.words/);
  });

  it('never touches senses.cefr_level', () => {
    expect(sql).not.toMatch(/senses/);
    expect(sql).not.toMatch(/\bcefr_level\b/);
  });

  it('keys every update on (headword, pos) — the unique pair, not an id', () => {
    for (const stmt of sql.split('\n').filter((l) => l.startsWith('update public.words'))) {
      expect(stmt, stmt).toMatch(/where headword = '.*' and pos = '.*';$/);
    }
  });

  it('emits no row for an unmatched word', () => {
    // 'program'/noun had no profile hit in the plan's measurement.
    const programs = sql.split('\n').filter((l) => l.includes("headword = 'program'"));
    expect(programs).toEqual([]);
  });

  it('escapes a quote by doubling it and never by a backslash', () => {
    expect(sql).not.toMatch(/\\'/);
  });

  it('states both sources in the header', () => {
    expect(sql).toMatch(/cefr-j-1\.5/);
    expect(sql).toMatch(/octanove-1\.0/);
  });

  it('is byte-identical across two runs', () => {
    const first = sql;
    execFileSync('node', ['scripts/build-word-levels-sql.mjs'], { stdio: 'pipe' });
    expect(readFileSync(OUT, 'utf8')).toBe(first);
  });

  it('prints the measured report to stdout', () => {
    const out = execFileSync('node', ['scripts/build-word-levels-sql.mjs'], { encoding: 'utf8' });
    expect(out).toMatch(/\d+ words · \d+ exact_pos · \d+ lemma_only · \d+ unmatched · \d+ agree · \d+ disagree/);
  });

  it('leaves the output file in the repo', () => {
    expect(existsSync(OUT)).toBe(true);
  });
});
```

- [ ] **Step 4: Run and confirm failure**

Run: `npx vitest run scripts/build-word-levels-sql.test.ts`
Expected: FAIL — `Cannot find module 'scripts/build-word-levels-sql.mjs'`.

- [ ] **Step 5: Write the emitter**

Copy the `registerHooks` preamble from `scripts/build-ingest-sql.mjs:24-48` **verbatim** — same reason, same no-new-dependency constraint — then:

```js
const { parseCefrCsv, buildLevelMap } = await import('../lib/core/cefrLevels.ts');
const { assignWordLevels, formatLevelReport } = await import('../lib/core/wordLevel.ts');
const { parseBatchFile } = await import('../lib/core/batchRecord.ts');

const OUT = join('supabase', 'seed', '0002_word_cefr_levels.sql');
const q = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replaceAll("'", "''")}'`);

const CEFRJ = 'cefrj-vocabulary-profile-1.5.csv';
const OCTANOVE = 'octanove-vocabulary-profile-c1c2-1.0.csv';

const cefrj = parseCefrCsv(readFileSync(join('data', CEFRJ), 'utf8'));
const octanove = parseCefrCsv(readFileSync(join('data', OCTANOVE), 'utf8'));
const map = buildLevelMap([...cefrj.entries, ...octanove.entries]);

// One row per (headword, pos): `words` is unique on that pair, and a headword with three
// senses must not produce three conflicting updates. First sense wins; they agree by
// construction, because the level here comes from the profile and not from the sense.
const byKey = new Map();
for (const file of readdirSync(join('data', 'generated')).filter((f) => /^batch-.*\.jsonl$/.test(f)).sort()) {
  for (const rec of parseBatchFile(readFileSync(join('data', 'generated', file), 'utf8'))) {
    const key = `${rec.headword.toLowerCase()}#${rec.pos}`;
    if (!byKey.has(key)) byKey.set(key, { headword: rec.headword, pos: rec.pos, ownBand: rec.cefrLevel ?? null });
  }
}

const report = assignWordLevels(map, [...byKey.values()]);

// Which file a band came from: C1/C2 exist only in Octanove, everything else in CEFR-J.
const sourceOf = (band) => (band === 'C1' || band === 'C2' ? 'octanove-1.0' : 'cefr-j-1.5');

const lines = [
  '-- GENERATED by scripts/build-word-levels-sql.mjs (T-010). ⛔ Do not hand-edit.',
  `-- Sources: cefr-j-1.5 (${CEFRJ}) · octanove-1.0 (${OCTANOVE})`,
  `-- ${formatLevelReport(report)}`,
  '-- ⛔ UPDATE only. This file never creates a word and never touches the sense-level band.',
  '-- Apply 0008_word_cefr_profile.sql first.',
  '',
  'begin;',
];
for (const w of report.words) {
  if (w.profileBand === null) continue;   // ⛔ no row for a word no profile covers
  lines.push(
    `update public.words set cefr_profile_band = ${q(w.profileBand)}, `
    + `cefr_profile_source = ${q(sourceOf(w.profileBand))} `
    + `where headword = ${q(w.headword)} and pos = ${q(w.pos)};`,
  );
}
lines.push('commit;', '');

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, lines.join('\n'), 'utf8');
console.log(formatLevelReport(report));
```

⚠️ Check `batchRecord.ts` for the real field name before writing `rec.cefrLevel` — `parseBatchRecord` maps snake_case to camelCase and the plan has not verified this one key. If `cefr_level` is not on `BatchRecord`, add it there in this task (one field, one test in `batchRecord.test.ts` asserting it round-trips), rather than reading the raw JSON here and re-introducing the snake_case hole T-042 closed.

- [ ] **Step 6: Add the npm script**

```json
"build:levels": "node scripts/build-word-levels-sql.mjs",
```

- [ ] **Step 7: Run the emitter and read its output**

Run: `npm run build:levels`
Expected: one line, e.g. `306 words · 287 exact_pos · 18 lemma_only · 1 unmatched · 182 agree · 124 disagree`. **Record the real numbers** — they replace the plan's floor everywhere they are quoted.

- [ ] **Step 8: Run the tests and confirm they pass**

Run: `npx vitest run scripts/build-word-levels-sql.test.ts`
Expected: PASS, 10 tests.

- [ ] **Step 9: Mutation-check the emitter**

| # | mutation | test that must fail |
|---|---|---|
| 1 | drop the `if (w.profileBand === null) continue;` guard | *emits no row for an unmatched word* |
| 2 | `update` → `insert into public.words` | *only ever updates* |
| 3 | key the update on `id` instead of `(headword, pos)` | *keys every update on (headword, pos)* |
| 4 | `q` escapes with `\\'` | *escapes a quote by doubling it* |
| 5 | drop `.sort()` on the batch filenames | *is byte-identical across two runs* (only if readdir order varies; if it survives, add a test that reads the first three `headword` values and pins them) |
| 6 | also emit `update public.senses set cefr_level = …` | *never touches senses.cefr_level* |

- [ ] **Step 10: Add the item to `plan/03-for-roy.md`**

```markdown
| 11 | DEV (C-XXXX) | 2026-08-12 | **להריץ ב-Supabase, בסדר הזה:** `supabase/migrations/0008_word_cefr_profile.sql` ואז `supabase/seed/0002_word_cefr_levels.sql`. | ‏T-010: מוסיף למילה רמת CEFR **ממקור מפורסם** לצד הרמה שסוכן התוכן כתב בעצמו. ⚠️ נמדד: השתיים חלוקות ב-<N> מתוך <M> שורות — זה **לא** באג (רמת מילה מול רמת משמעות), ולכן שתיהן נשמרות בנפרד. הקובץ **update בלבד**: אם פריט 9 טרם הורץ, הוא פשוט לא יעדכן דבר | לא |
```

- [ ] **Step 11: Update `plan/` and run the full gate**

- `plan/30-architecture.md`: new numbered subsection — the two columns, why the name carries the source, the paired-null constraint, and the measured disagreement rate as a **fact about the two sources, not a defect**.
- `plan/50-tasks.md`: T-010 → ✅ with the emitter's real output line and a note that the NGSL half (T-007) is still ⛔ on T-043.
- `plan/00-control.md`: `CYCLE_ID` +1 · `ACTIVE_TASK_ID` cleared · `NEXT_AGENT=CRITIC` · lock released · `MILESTONE_TICKS` +1 · one handoff-log row.

```bash
npm run typecheck && npm run check:core && npm test && npm run build
```

- [ ] **Step 12: Commit and push**

```bash
git add lib/core/wordLevel.ts lib/core/wordLevel.test.ts \
        supabase/migrations/0008_word_cefr_profile.sql \
        supabase/seed/0002_word_cefr_levels.sql \
        scripts/build-word-levels-sql.mjs scripts/build-word-levels-sql.test.ts \
        package.json plan/
git commit -m "loop(DEV): C-XXXX T-010 words.cefr_profile_band — sourced level beside the authored one"
git push origin dev
```

⛔ `dev` only. No `[skip ci]`.

---

## Self-review

**Spec coverage.** T-044's spec — pure parser in `/lib/core/apkg.ts`, input is raw rows, output `{front, back, audio?, translit?}`, no FS and no ZIP, content not ingested — Tasks 1–2, with the refusal in code rather than in a comment. T-010's spec — the two profiles attached to `words`, `origin='unleveled'` untouched, same schema as T-008 would have used — Tasks 3–4; the "run only if Roy chose route B" precondition is satisfied (D-009 chose B, and `T-010` is already marked **משוחררת**). F-019's remaining half is explicitly *not* closed and says why.

**Placeholder scan.** No "TBD", no "add error handling", no "tests as in Task N". Every rejection reason is an enumerated value with a test. Two places deliberately defer to a measurement rather than assert a number — Task 3 Step 1 and Task 4 Step 7 — and both name the command that produces it and the threshold that means *stop*.

**Type consistency.** `NoteReject` is the union in Task 1 and the key type of `DeckSummary.rejected` in Task 2, and `REJECT_REASONS` is the same five values in the same order. `LevelHit.route` (`'exact_pos' | 'lemma_only'`) is reused verbatim as `WordLevel.route`, widened by `| null` only where `profileBand` is also null. `CefrBand` is imported, never re-declared — the one place Task 3 Step 4 shows it re-declared is flagged in the step itself as the wrong version.

**Known gap, deliberate.** Nothing here reads `data/ngsl-1.2.csv`; T-007 stays ⛔ on T-043. And `sense_examples` / `sense_items` / `sense_distractors` (~2,400 rows) remain unwritten — that is T-050, which the PM has not opened yet.
