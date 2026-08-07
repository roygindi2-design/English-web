# Source Registry, Provenance Guard & Telemetry — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One canonical, pure registry of every external data source, and make three separate backlog items — the licence page (T-011), the NGSL provenance guard (T-012) and the telemetry/provenance columns (T-015) — all read from it instead of each re-stating the same facts.

**Architecture:** `lib/core/dataSources.ts` becomes the single source of truth for source id, name, licence, attribution wording, canonical URL and permitted host. `docs/data-licenses.md` and the in-product `/sources` page are both *rendered from* it (and a test fails if the shipped Markdown drifts). The NGSL guard is the same registry read through a provenance check, so "which domain is legal" is written once. The DB gets a `data_sources` table whose ids are asserted, by test, to be exactly the registry's ids — that cross-file assertion is the thing that catches drift a year from now.

**Tech Stack:** TypeScript (strict, `noUncheckedIndexedAccess`), Next.js 16 App Router, Tailwind with semantic tokens only, Vitest, Postgres/Supabase SQL migrations.

## Global Constraints

Copied verbatim from the standing rules — every task below inherits all of them.

- `/lib/core/` is pure: ⛔ no `react` import · ⛔ `window` · ⛔ `document` · ⛔ `localStorage` · ⛔ `sessionStorage` · ⛔ `process.env` · ⛔ `fetch(`. Enforced by `npm run check:core`.
- A UI component never touches the database. Everything goes through `/app/api/` and `lib/api/client.ts`.
- Mobile-First at 375px · tap targets ≥ 44px · RTL with bidi isolation · PWA · TypeScript with no `any`.
- ⛔ No raw `slate-*` Tailwind classes in `app/**` or `components/**` — semantic tokens only (`surface`, `surface-raised`, `ink`, `ink-muted`, `border-subtle`, `border-strong`, `brand`, `brand-surface`, `brand-on`, `success`, `danger`). Scanned by `lib/core/palette.test.ts`.
- ⛔ No vertical centring of a screen's heading. `main h1` must sit ≤ 48px below the header. Measured by `npm run check:mobile`.
- ⛔ Only `components/EnWord.tsx` may write `lang="en"` / `dir="ltr"` / `.ltr-inline`. Every English string in a Hebrew screen renders through `<EnWord>`, **and every new English field needs its own positive assertion** in `components/EnWord.test.ts` — a negative scan cannot see markup that is absent (that is how TD-14 was born).
- ⛔ No new npm dependency in this plan. Everything here is standard library plus what is already installed.
- ⛔ No invented learning content. Nothing in this plan writes a translation, an example sentence or a word pair.
- ⛔ Never commit with `[skip ci]` (RULES § 0.7).
- `tsconfig.json` has `noUncheckedIndexedAccess: true`. `array[0]` is `T | undefined`. In test files, do **not** reach for `!` — index through a named helper that throws, exactly as `lib/core/coverage.test.ts` does. This is the trap that cost C-0023 twenty `TS2532` errors.
- Verification command for every task: `npm run typecheck && npm run check:core && npm test && npm run build`.

## File Structure

| file | responsibility | task |
|---|---|---|
| `lib/core/dataSources.ts` | **new.** The registry: one frozen record per external source, plus the Markdown renderer and the Hebrew page copy. Pure. | 1 |
| `lib/core/dataSources.test.ts` | **new.** Registry invariants + the drift check against the shipped `docs/data-licenses.md`. | 1 |
| `docs/data-licenses.md` | **new.** Generated from the registry, committed, and asserted byte-identical by test. | 1 |
| `scripts/write-data-licenses.mjs` | **new.** The single impure line: writes the rendered Markdown to disk. Run by hand, not by CI. | 1 |
| `app/sources/page.tsx` | **new.** `/sources` — the same table in Hebrew, for the learner. | 2 |
| `app/layout.tsx` | **modify.** Footer with the `/sources` link on every screen. | 2 |
| `scripts/verify-mobile.mjs:25` | **modify.** Add `/sources` to `ROUTES`. | 2 |
| `components/EnWord.test.ts` | **modify.** Positive assertion: the source names on `/sources` render through `<EnWord>`. | 2 |
| `lib/core/provenance.ts` | **new.** `checkProvenance()` + `checkNgslRowCount()`. Pure. | 3 |
| `lib/core/provenance.test.ts` | **new.** The T-012 guard, including the host-suffix attacks. | 3 |
| `scripts/measure-coverage.mjs` | **modify.** Route the existing 2,809 check through `checkNgslRowCount`. | 3 |
| `supabase/migrations/0003_provenance_telemetry.sql` | **new.** `data_sources` table, provenance columns on content rows, `word_progress`. | 4 |
| `lib/supabase/telemetry.test.ts` | **new.** Migration contract: RLS, one-row-per-pair, and the registry↔migration id cross-check. | 4 |

## Backlog mapping

| backlog item | tasks | done when |
|---|---|---|
| T-011 (`/docs/data-licenses.md` + `/sources` page + footer link) | 1, 2 | both files render from the registry and `check:mobile` passes on `/sources` |
| T-012 (NGSL v1.2 / 2,809 / domain guard as a unit test) | 3 | `provenance.test.ts` fails on a wrong count **and** on a wrong host |
| T-015 (`track_id`, `source_id`, `origin` on content rows; `time_to_first_correct` / `attempts_to_mastery` per (user, word)) | 4 | migration ships with one aggregate row per pair, RLS on, ids cross-checked |

---

### Task 1: The registry and the licence document

**Files:**
- Create: `lib/core/dataSources.ts`
- Create: `lib/core/dataSources.test.ts`
- Create: `scripts/write-data-licenses.mjs`
- Create: `docs/data-licenses.md` (written by the script in step 6, then committed)

**Interfaces:**
- Consumes: nothing. This is the root of the plan.
- Produces:
  ```ts
  export type SourceId =
    | 'ngsl' | 'cefrj' | 'octanove'
    | 'hebrew-wordnet' | 'wiktionary-en-he' | 'kaikki' | 'word2word';

  export interface DataSource {
    readonly id: SourceId;
    readonly name: string;          // as the licence requires it to be named — never translated
    readonly licence: string;       // verbatim licence label
    readonly shareAlike: boolean;   // CC BY-SA obliges us to relicense derivatives
    readonly commercialUse: 'allowed' | 'allowed-with-citation';
    readonly url: string;           // canonical https URL
    readonly host: string;          // the ONLY host a file may be fetched from (R-004)
    readonly attributionHe: string; // the Hebrew credit line shown on /sources
    readonly usedFor: string;       // Hebrew, one clause: what this source gives the product
  }

  export const DATA_SOURCES: readonly DataSource[];
  export function dataSource(id: SourceId): DataSource;      // throws on unknown id
  export function licencesMarkdown(): string;                // full docs/data-licenses.md body
  export const SOURCES_PAGE_TITLE: string;
  export const SOURCES_PAGE_INTRO: string;
  ```

**Facts this task encodes.** All seven rows come from `data/README.md` and from `BUDGET_NOTE` in `plan/00-control.md`. Nothing here is researched or guessed; if a fact is not in one of those two places, it does not go in.

| id | name | licence | commercial | host |
|---|---|---|---|---|
| `ngsl` | New General Service List v1.2 | CC BY-SA 4.0 | allowed | `newgeneralservicelist.com` |
| `cefrj` | CEFR-J Vocabulary Profile | CEFR-J (commercial use with citation) | allowed-with-citation | `cefr-j.org` |
| `octanove` | Octanove Vocabulary Profile C1/C2 | CC BY-SA 4.0 | allowed | `github.com` |
| `hebrew-wordnet` | Hebrew Wordnet (University of Haifa) | permissive, no share-alike | allowed | `cl.haifa.ac.il` |
| `wiktionary-en-he` | English Wiktionary (EN→HE) | CC BY-SA 4.0 | allowed | `en.wiktionary.org` |
| `kaikki` | Kaikki.org / wiktextract | CC BY-SA 4.0 | allowed | `kaikki.org` |
| `word2word` | word2word | Apache-2.0 | allowed | `github.com` |

⚠️ PanLex and MUSE are **not** in this table and must never be added: both are NC-licensed and were rejected (10-pedagogy 1.6.3).

- [ ] **Step 1: Write the failing test**

Create `lib/core/dataSources.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  DATA_SOURCES,
  dataSource,
  licencesMarkdown,
  type DataSource,
  type SourceId,
} from './dataSources';

/**
 * noUncheckedIndexedAccess makes `DATA_SOURCES[0]` a `DataSource | undefined`.
 * Named accessor instead of `!`, so a missing row fails with its own message
 * rather than a TS2532 wall (the C-0023 lesson).
 */
function bySourceId(id: SourceId): DataSource {
  const found = DATA_SOURCES.find((s) => s.id === id);
  if (!found) throw new Error(`registry has no source "${id}"`);
  return found;
}

describe('the data source registry', () => {
  it('lists every source the coverage measurement reads, and nothing else', () => {
    // Exactly the seven rows of data/README.md plus the two level-label files.
    // A row added here without a licence row in docs/ is how attribution rots.
    expect([...DATA_SOURCES].map((s) => s.id).sort()).toEqual([
      'cefrj',
      'hebrew-wordnet',
      'kaikki',
      'ngsl',
      'octanove',
      'wiktionary-en-he',
      'word2word',
    ]);
  });

  it('never lists a source that was rejected on its licence (1.6.3)', () => {
    // PanLex and MUSE are NC. A future agent adding them "because they have
    // Hebrew" is the exact failure this line exists to stop.
    const names = DATA_SOURCES.map((s) => `${s.id} ${s.name}`.toLowerCase()).join(' ');
    expect(names).not.toContain('panlex');
    expect(names).not.toContain('muse');
  });

  it('gives every source a licence, a credit line and a canonical https url', () => {
    for (const source of DATA_SOURCES) {
      expect(source.licence.length, `${source.id} has no licence`).toBeGreaterThan(0);
      expect(source.attributionHe.length, `${source.id} has no credit line`).toBeGreaterThan(4);
      expect(source.url.startsWith('https://'), `${source.id} url is not https`).toBe(true);
      expect(new URL(source.url).hostname.endsWith(source.host)).toBe(true);
    }
  });

  it('marks share-alike exactly on the CC BY-SA sources', () => {
    // Getting this wrong is a licence breach, not a typo: a share-alike source
    // obliges us to relicense what we derive from it.
    for (const source of DATA_SOURCES) {
      expect(source.shareAlike, `${source.id}`).toBe(source.licence.includes('BY-SA'));
    }
  });

  it('pins NGSL to its own domain — R-004', () => {
    expect(bySourceId('ngsl').host).toBe('newgeneralservicelist.com');
    expect(bySourceId('ngsl').name).toContain('1.2');
  });

  it('throws by name on an unknown id rather than returning undefined', () => {
    expect(() => dataSource('panlex' as SourceId)).toThrow(/panlex/);
  });

  it('renders a markdown row for every source', () => {
    const md = licencesMarkdown();
    for (const source of DATA_SOURCES) {
      expect(md, `${source.id} missing from the licence document`).toContain(source.name);
      expect(md).toContain(source.licence);
      expect(md).toContain(source.url);
    }
  });

  it('the committed docs/data-licenses.md is what the registry renders', () => {
    // The document on disk is a build artefact that we commit. Without this
    // line it silently becomes a hand-edited copy that disagrees with the code
    // the product actually runs — which is the same class of bug as F-021.
    const onDisk = readFileSync('docs/data-licenses.md', 'utf8');
    expect(onDisk, 'run `node scripts/write-data-licenses.mjs` and commit the result').toBe(
      licencesMarkdown(),
    );
  });
});
```

- [ ] **Step 2: Run it and watch it fail for the right reason**

Run: `npx vitest run lib/core/dataSources.test.ts`
Expected: FAIL — `Failed to resolve import "./dataSources"`. Not a assertion failure: the module does not exist yet.

- [ ] **Step 3: Write the registry**

Create `lib/core/dataSources.ts`:

```ts
/**
 * The one place this product names an external data source (T-011).
 *
 * Three consumers read it and none of them re-states a fact:
 *   · docs/data-licenses.md  — rendered by scripts/write-data-licenses.mjs
 *   · /sources               — the learner-facing page, app/sources/page.tsx
 *   · lib/core/provenance.ts — the T-012 host guard
 *
 * `host` is a licence-and-integrity field, not a convenience: R-004 recorded a
 * mirror of NGSL on a domain nobody controls that ships 2,801 rows instead of
 * 2,809. "Which host is legitimate" is therefore data, asserted once.
 *
 * Pure by contract — no fetch, no fs, no env. The impure half lives in
 * scripts/write-data-licenses.mjs.
 */

export type SourceId =
  | 'ngsl'
  | 'cefrj'
  | 'octanove'
  | 'hebrew-wordnet'
  | 'wiktionary-en-he'
  | 'kaikki'
  | 'word2word';

export interface DataSource {
  readonly id: SourceId;
  /** As the licence requires it to be named. Never translated, never abbreviated. */
  readonly name: string;
  readonly licence: string;
  /** CC BY-SA obliges us to relicense derivatives — a flag we have to be able to query. */
  readonly shareAlike: boolean;
  readonly commercialUse: 'allowed' | 'allowed-with-citation';
  readonly url: string;
  /** The only host a file of this source may come from (R-004). */
  readonly host: string;
  /** The Hebrew credit line shown to the learner on /sources. */
  readonly attributionHe: string;
  /** Hebrew, one clause: what this source contributes. */
  readonly usedFor: string;
}

export const DATA_SOURCES: readonly DataSource[] = Object.freeze([
  Object.freeze({
    id: 'ngsl',
    name: 'New General Service List v1.2',
    licence: 'CC BY-SA 4.0',
    shareAlike: true,
    commercialUse: 'allowed',
    url: 'https://www.newgeneralservicelist.com/',
    host: 'newgeneralservicelist.com',
    attributionHe: 'רשימת התדירות New General Service List v1.2, ברישיון CC BY-SA 4.0.',
    usedFor: 'עמוד השדרה של התדירות — אילו מילים נלמדות ובאיזה סדר',
  }),
  Object.freeze({
    id: 'cefrj',
    name: 'CEFR-J Vocabulary Profile',
    licence: 'CEFR-J (שימוש מסחרי מותר בציטוט)',
    shareAlike: false,
    commercialUse: 'allowed-with-citation',
    url: 'https://cefr-j.org/download.html',
    host: 'cefr-j.org',
    attributionHe: 'תוויות רמה מתוך CEFR-J Vocabulary Profile, בשימוש בציטוט כנדרש ברישיון.',
    usedFor: 'תוויות רמה A1–B2 למילים',
  }),
  Object.freeze({
    id: 'octanove',
    name: 'Octanove Vocabulary Profile C1/C2',
    licence: 'CC BY-SA 4.0',
    shareAlike: true,
    commercialUse: 'allowed',
    url: 'https://github.com/openlanguageprofiles/olp-en-cefrj',
    host: 'github.com',
    attributionHe: 'תוויות הרמות C1–C2 מתוך Octanove Vocabulary Profile, ברישיון CC BY-SA 4.0.',
    usedFor: 'תוויות רמה C1–C2, המשלימות את CEFR-J',
  }),
  Object.freeze({
    id: 'hebrew-wordnet',
    name: 'Hebrew Wordnet (University of Haifa)',
    licence: 'רישיון פרמיסיבי של אוניברסיטת חיפה, ללא share-alike',
    shareAlike: false,
    commercialUse: 'allowed',
    url: 'https://cl.haifa.ac.il/projects/mila/',
    host: 'cl.haifa.ac.il',
    attributionHe: 'מאגר Hebrew Wordnet של אוניברסיטת חיפה.',
    usedFor: 'מועמדי תרגום לעברית',
  }),
  Object.freeze({
    id: 'wiktionary-en-he',
    name: 'English Wiktionary (EN→HE)',
    licence: 'CC BY-SA 4.0',
    shareAlike: true,
    commercialUse: 'allowed',
    url: 'https://en.wiktionary.org/',
    host: 'en.wiktionary.org',
    attributionHe: 'תרגומים מתוך ויקימילון האנגלי, ברישיון CC BY-SA 4.0.',
    usedFor: 'מועמדי תרגום לעברית',
  }),
  Object.freeze({
    id: 'kaikki',
    name: 'Kaikki.org / wiktextract',
    licence: 'CC BY-SA 4.0',
    shareAlike: true,
    commercialUse: 'allowed',
    url: 'https://kaikki.org/dictionary/English/',
    host: 'kaikki.org',
    attributionHe: 'חילוץ מובנה של ויקימילון מאת Kaikki.org (wiktextract), ברישיון CC BY-SA 4.0.',
    usedFor: 'מועמדי תרגום לעברית משדה translations',
  }),
  Object.freeze({
    id: 'word2word',
    name: 'word2word',
    licence: 'Apache-2.0',
    shareAlike: false,
    commercialUse: 'allowed',
    url: 'https://github.com/kakaobrain/word2word',
    host: 'github.com',
    attributionHe: 'מילון word2word, ברישיון Apache-2.0.',
    usedFor: 'מועמדי תרגום לעברית',
  }),
]);

export function dataSource(id: SourceId): DataSource {
  const found = DATA_SOURCES.find((s) => s.id === id);
  if (!found) throw new Error(`unknown data source "${id}"`);
  return found;
}

export const SOURCES_PAGE_TITLE = 'מקורות הנתונים';

export const SOURCES_PAGE_INTRO =
  'אוצר המילים והרמות באתר נשענים על מאגרים פתוחים. כל מאגר מופיע כאן בשמו, ברישיונו ובקישור למקור — כפי שהרישיון מחייב.';

/** The body of docs/data-licenses.md. Deterministic: same registry, same bytes. */
export function licencesMarkdown(): string {
  const header = [
    '<!-- GENERATED FILE — do not edit by hand.',
    '     Source of truth: lib/core/dataSources.ts',
    '     Regenerate: node scripts/write-data-licenses.mjs',
    '     lib/core/dataSources.test.ts fails if this file drifts. -->',
    '',
    '# Data licences (T-011)',
    '',
    'Every external source this product reads, the licence it ships under, the',
    'credit we owe it, and the only host a file of it may come from (R-004).',
    '',
    '| source | licence | share-alike | commercial use | host | link |',
    '|---|---|---|---|---|---|',
  ].join('\n');

  const rows = DATA_SOURCES.map(
    (s) =>
      `| ${s.name} | ${s.licence} | ${s.shareAlike ? 'yes' : 'no'} | ${s.commercialUse} | \`${s.host}\` | ${s.url} |`,
  ).join('\n');

  const credits = [
    '',
    '## Required attribution',
    '',
    'These lines are what the learner sees on `/sources`, in Hebrew.',
    '',
    ...DATA_SOURCES.map((s) => `- **${s.name}** — ${s.attributionHe}`),
    '',
    '## Rejected sources',
    '',
    'PanLex and MUSE are NC-licensed and may never be ingested (10-pedagogy 1.6.3).',
    '',
  ].join('\n');

  return `${header}\n${rows}\n${credits}`;
}
```

- [ ] **Step 4: Run the tests — all but the drift check must pass**

Run: `npx vitest run lib/core/dataSources.test.ts`
Expected: one FAIL only — `ENOENT: no such file or directory, open 'docs/data-licenses.md'`. Every other test PASSes.

- [ ] **Step 5: Write the generator script**

Create `scripts/write-data-licenses.mjs`:

```js
#!/usr/bin/env node
/**
 * The impure half of T-011: takes the pure render and puts it on disk.
 * Run by hand after editing the registry, then commit the result. Not wired
 * into CI on purpose — a generator that also runs in CI hides drift instead of
 * failing on it, and lib/core/dataSources.test.ts is the thing that must fail.
 *
 * Runs the TypeScript in lib/core/ directly, with the same resolve hook the
 * coverage runner uses (see data/README.md, "Runtime requirement"): Node >= 22.18
 * strips types, but does not resolve extensionless specifiers.
 */
import { writeFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && !/\.[mc]?[jt]s$/.test(specifier)) {
      try {
        return next(`${specifier}.ts`, context);
      } catch {
        /* fall through to the default resolution below */
      }
    }
    return next(specifier, context);
  },
});

const { licencesMarkdown } = await import(
  pathToFileURL(new URL('../lib/core/dataSources.ts', import.meta.url).pathname).href
);

writeFileSync('docs/data-licenses.md', licencesMarkdown(), 'utf8');
console.log('✓ docs/data-licenses.md written from lib/core/dataSources.ts');
```

- [ ] **Step 6: Generate the document and re-run**

Run: `node scripts/write-data-licenses.mjs && npx vitest run lib/core/dataSources.test.ts`
Expected: the script prints `✓ docs/data-licenses.md written…`, then all 8 tests PASS.

- [ ] **Step 7: Prove the drift check actually measures**

Run:
```bash
printf '\nhand edited\n' >> docs/data-licenses.md
npx vitest run lib/core/dataSources.test.ts
```
Expected: FAIL on `the committed docs/data-licenses.md is what the registry renders`.
Then restore: `node scripts/write-data-licenses.mjs`

- [ ] **Step 8: Full verification**

Run: `npm run typecheck && npm run check:core && npm test && npm run build`
Expected: all four green. `check:core` prints `/lib/core purity: OK`. Note the new test count and compare it against the previous run — it must have gone **up**.

- [ ] **Step 9: Commit**

```bash
git add lib/core/dataSources.ts lib/core/dataSources.test.ts scripts/write-data-licenses.mjs docs/data-licenses.md
git commit -m "loop(DEV): C-XXXX T-011 source registry + generated docs/data-licenses.md"
```

---

### Task 2: The `/sources` page and the footer link

**Files:**
- Create: `app/sources/page.tsx`
- Modify: `app/layout.tsx` (add a footer inside the flex column, below `<main>`)
- Modify: `scripts/verify-mobile.mjs:25` (add `'/sources'` to `ROUTES`)
- Modify: `components/EnWord.test.ts` (positive assertion for the new English fields)

**Interfaces:**
- Consumes: `DATA_SOURCES`, `SOURCES_PAGE_TITLE`, `SOURCES_PAGE_INTRO` from `lib/core/dataSources` (Task 1), and `EnWord` (default export of `components/EnWord.tsx`).
- Produces: the route `/sources`. Nothing imports from it.

**What makes this task non-trivial:** the source names and licence labels are Latin text inside a Hebrew RTL page. `CC BY-SA 4.0` rendered bare next to Hebrew puts the `4.0` on the wrong side of the line — that is the exact class of bug `<EnWord>` exists for, and the negative scan in `EnWord.test.ts` **cannot see it**, because absent markup leaves nothing to scan.

- [ ] **Step 1: Write the failing guard first**

Append to the final `describe` block in `components/EnWord.test.ts`, just before its closing `});`:

```ts
  it('the source names and licences on /sources are wrapped at their call site (TD-14)', () => {
    // Latin runs inside a Hebrew RTL table. `CC BY-SA 4.0` rendered bare puts
    // the version number on the wrong side of the cell, and every negative scan
    // in this file stays green because there is no markup to scan for.
    const src = readFileSync(join('app', 'sources', 'page.tsx'), 'utf8');
    for (const field of ['name', 'licence', 'host']) {
      const re = new RegExp(`<EnWord>\\s*\\{source\\.${field}\\}\\s*</EnWord>`);
      expect(src, `source.${field} is Latin text and must render inside <EnWord>`).toMatch(re);
    }
  });
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run components/EnWord.test.ts`
Expected: FAIL — `ENOENT … app/sources/page.tsx`.

- [ ] **Step 3: Write the page**

Create `app/sources/page.tsx`:

```tsx
import Link from 'next/link';
import EnWord from '@/components/EnWord';
import {
  DATA_SOURCES,
  SOURCES_PAGE_INTRO,
  SOURCES_PAGE_TITLE,
} from '@/lib/core/dataSources';

/**
 * /sources — T-011. The learner-facing half of the attribution obligation.
 *
 * Rendered from lib/core/dataSources.ts, the same record docs/data-licenses.md
 * is generated from, so the page and the document cannot disagree.
 *
 * Anchored to the top, not centred: F-011 and F-016 both came from a heading
 * inside a `flex-1 justify-center` wrapper, and check:mobile measures the gap
 * between the header and `main h1` on every route including this one.
 */
export const metadata = {
  title: 'מקורות הנתונים — אנגלית לאמיר״ם',
};

export default function SourcesPage() {
  return (
    <section className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold leading-tight">{SOURCES_PAGE_TITLE}</h1>
      <p className="text-base leading-relaxed text-ink-muted">{SOURCES_PAGE_INTRO}</p>

      <ul className="flex flex-col gap-4">
        {DATA_SOURCES.map((source) => (
          <li
            key={source.id}
            className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-surface-raised p-4"
          >
            <h2 className="text-base font-semibold text-ink">
              <EnWord>{source.name}</EnWord>
            </h2>
            <p className="text-sm leading-relaxed text-ink-muted">{source.usedFor}</p>
            <p className="text-sm leading-relaxed text-ink">{source.attributionHe}</p>
            <dl className="flex flex-col gap-1 text-sm text-ink-muted">
              <div className="flex gap-2">
                <dt className="font-medium text-ink">רישיון:</dt>
                <dd>
                  <EnWord>{source.licence}</EnWord>
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium text-ink">מקור מורשה:</dt>
                <dd>
                  <EnWord>{source.host}</EnWord>
                </dd>
              </div>
            </dl>
            <a
              href={source.url}
              rel="noreferrer"
              target="_blank"
              className="inline-flex min-h-touch items-center text-sm font-semibold text-brand underline"
            >
              לעמוד המקור
            </a>
          </li>
        ))}
      </ul>

      <Link
        href="/"
        className="inline-flex min-h-touch items-center text-sm font-semibold text-ink-muted underline"
      >
        חזרה למסך הבית
      </Link>
    </section>
  );
}
```

- [ ] **Step 4: Add the footer link**

In `app/layout.tsx`, replace the single line

```tsx
          <main className="flex flex-1 flex-col gap-6 px-5 pb-8">{children}</main>
```

with

```tsx
          <main className="flex flex-1 flex-col gap-6 px-5 pb-8">{children}</main>
          {/*
            T-011: the attribution link has to be reachable from every screen,
            because the obligation attaches to the product and not to one page.
            min-h-touch keeps it at the 44px floor check:mobile enforces.
          */}
          <footer className="px-5 pb-6 pt-2">
            <Link
              href="/sources"
              className="inline-flex min-h-touch items-center text-sm text-ink-muted underline"
            >
              מקורות הנתונים והרישיונות
            </Link>
          </footer>
```

and add `import Link from 'next/link';` as the first import of the file.

- [ ] **Step 5: Add the route to the mobile sweep**

In `scripts/verify-mobile.mjs`, add `'/sources',` to the `ROUTES` array (line 25), directly after `'/offline',`.

- [ ] **Step 6: Run the unit tests**

Run: `npx vitest run components/EnWord.test.ts lib/core/palette.test.ts`
Expected: PASS. The palette scan now walks `app/sources/page.tsx` too — if it reports raw `slate-*`, a semantic token was missed above.

- [ ] **Step 7: Run the mobile sweep**

Run: `npm run build && npm run check:mobile`
Expected: `✓ all mobile/PWA guarantees hold`. Specifically `/sources @375px heading anchored to top`, `all tap targets >= 44px` and `no horizontal scroll` must appear green. If a tap target is reported too small, it is the `לעמוד המקור` link — `min-h-touch` on it is not optional.

- [ ] **Step 8: Prove the new guard measures**

Run:
```bash
# temporarily unwrap one field
sed -i 's|<EnWord>{source.licence}</EnWord>|{source.licence}|' app/sources/page.tsx
npx vitest run components/EnWord.test.ts
```
Expected: FAIL on `source.licence is Latin text and must render inside <EnWord>`.
Then: `git checkout app/sources/page.tsx` — no, the file is untracked at this point, so restore the wrapper by hand (re-add `<EnWord>` around `{source.licence}`) and re-run to green.

- [ ] **Step 9: Full verification**

Run: `npm run typecheck && npm run check:core && npm test && npm run build`
Expected: all four green.

- [ ] **Step 10: Commit**

```bash
git add app/sources/page.tsx app/layout.tsx scripts/verify-mobile.mjs components/EnWord.test.ts
git commit -m "loop(DEV): C-XXXX T-011 /sources page + footer attribution link"
```

---

### Task 3: The NGSL provenance guard (T-012)

**Files:**
- Create: `lib/core/provenance.ts`
- Create: `lib/core/provenance.test.ts`
- Modify: `scripts/measure-coverage.mjs` (route the existing 2,809 check through the new function)

**Interfaces:**
- Consumes: `dataSource`, `type SourceId` from `lib/core/dataSources` (Task 1).
- Produces:
  ```ts
  export const NGSL_VERSION: '1.2';
  export const NGSL_EXPECTED_ROWS: 2809;

  export type ProvenanceVerdict =
    | { readonly ok: true }
    | { readonly ok: false; readonly reason: string };

  export function checkSourceUrl(id: SourceId, url: string): ProvenanceVerdict;
  export function checkNgslRowCount(rows: number): ProvenanceVerdict;
  ```

**Why a verdict object and not a thrown error:** the coverage runner already turns problems into a non-zero exit with a named reason. A verdict keeps the reason string in one place (`lib/core`, pure and testable) and lets the caller decide whether to exit or to collect. `checkNgslRowCount` returning `{ok:false, reason}` is directly printable.

- [ ] **Step 1: Write the failing test**

Create `lib/core/provenance.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  NGSL_EXPECTED_ROWS,
  NGSL_VERSION,
  checkNgslRowCount,
  checkSourceUrl,
} from './provenance';

describe('NGSL row count — T-012', () => {
  it('accepts exactly 2,809 rows', () => {
    expect(NGSL_EXPECTED_ROWS).toBe(2809);
    expect(NGSL_VERSION).toBe('1.2');
    expect(checkNgslRowCount(2809)).toEqual({ ok: true });
  });

  it('rejects 2,801 by name — that is the mirrored early version, not a rounding error', () => {
    // F-005: the 2,801-row file exists, parses cleanly, and is wrong. A guard
    // that only said "unexpected count" would read as a parser bug to whoever
    // hits it; naming the number is what makes the message actionable.
    const verdict = checkNgslRowCount(2801);
    expect(verdict.ok).toBe(false);
    expect(verdict.ok === false && verdict.reason).toContain('2801');
    expect(verdict.ok === false && verdict.reason).toContain('2809');
  });

  it('rejects a count that is off by one in either direction', () => {
    expect(checkNgslRowCount(2808).ok).toBe(false);
    expect(checkNgslRowCount(2810).ok).toBe(false);
  });

  it('rejects an empty file instead of reporting 0% coverage later', () => {
    expect(checkNgslRowCount(0).ok).toBe(false);
  });
});

describe('source host — R-004', () => {
  it('accepts the canonical host', () => {
    expect(checkSourceUrl('ngsl', 'https://www.newgeneralservicelist.com/ngsl-1-2.csv')).toEqual({
      ok: true,
    });
    expect(checkSourceUrl('ngsl', 'https://newgeneralservicelist.com/x.csv')).toEqual({ ok: true });
  });

  it('rejects a host that merely ENDS with the domain', () => {
    // `newgeneralservicelist.com.example.net` ends with nothing useful, but
    // naive `endsWith(host)` accepts `evil-newgeneralservicelist.com`, and
    // naive `includes(host)` accepts both. Both were tried; both are wrong.
    const bad = checkSourceUrl('ngsl', 'https://evil-newgeneralservicelist.com/ngsl.csv');
    expect(bad.ok).toBe(false);
  });

  it('rejects a host that merely STARTS with the domain', () => {
    const bad = checkSourceUrl('ngsl', 'https://newgeneralservicelist.com.example.net/ngsl.csv');
    expect(bad.ok).toBe(false);
  });

  it('accepts a real subdomain of the canonical host', () => {
    expect(checkSourceUrl('ngsl', 'https://files.newgeneralservicelist.com/a.csv').ok).toBe(true);
  });

  it('rejects plain http — an unauthenticated mirror is the R-004 failure mode', () => {
    expect(checkSourceUrl('ngsl', 'http://www.newgeneralservicelist.com/x.csv').ok).toBe(false);
  });

  it('rejects a string that is not a url at all, without throwing', () => {
    const verdict = checkSourceUrl('ngsl', 'newgeneralservicelist.com/x.csv');
    expect(verdict.ok).toBe(false);
    expect(verdict.ok === false && verdict.reason).toMatch(/url/i);
  });

  it('guards every other source by its own host, not only NGSL', () => {
    expect(checkSourceUrl('kaikki', 'https://kaikki.org/dictionary/English/x.jsonl').ok).toBe(true);
    expect(checkSourceUrl('kaikki', 'https://newgeneralservicelist.com/x.jsonl').ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run lib/core/provenance.test.ts`
Expected: FAIL — `Failed to resolve import "./provenance"`.

- [ ] **Step 3: Write the implementation**

Create `lib/core/provenance.ts`:

```ts
/**
 * T-012 — the guard that keeps a wrong NGSL file from becoming a wrong fact.
 *
 * Two independent things can be wrong about a source file and only one of them
 * is visible in the data: the row count (measurable) and where the bytes came
 * from (not measurable after the fact — it has to be checked at fetch time and
 * recorded). R-004 is the case that made this real: a mirror on a domain nobody
 * controls ships 2,801 rows, parses perfectly, and silently shifts every
 * frequency rank in the product.
 *
 * Pure: no fetch, no fs. The caller does the I/O and hands the result here.
 */
import { dataSource, type SourceId } from './dataSources';

export const NGSL_VERSION = '1.2' as const;
export const NGSL_EXPECTED_ROWS = 2809 as const;

export type ProvenanceVerdict =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: string };

const OK: ProvenanceVerdict = Object.freeze({ ok: true });

function fail(reason: string): ProvenanceVerdict {
  return Object.freeze({ ok: false, reason });
}

/**
 * True when `hostname` is the domain itself or a subdomain of it.
 *
 * `endsWith(domain)` alone accepts `evil-newgeneralservicelist.com`; requiring
 * the dot is what makes it a label boundary rather than a substring.
 */
function isHostOf(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

export function checkSourceUrl(id: SourceId, url: string): ProvenanceVerdict {
  const source = dataSource(id);
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return fail(`"${url}" is not an absolute url — ${id} must be fetched from https://${source.host}`);
  }
  if (parsed.protocol !== 'https:') {
    return fail(`${id} was fetched over ${parsed.protocol} — only https is accepted (R-004)`);
  }
  if (!isHostOf(parsed.hostname, source.host)) {
    return fail(
      `${id} was fetched from "${parsed.hostname}" — the only permitted host is "${source.host}" (R-004)`,
    );
  }
  return OK;
}

export function checkNgslRowCount(rows: number): ProvenanceVerdict {
  if (rows === NGSL_EXPECTED_ROWS) return OK;
  return fail(
    `NGSL has ${rows} rows, expected exactly ${NGSL_EXPECTED_ROWS} (v${NGSL_VERSION}). ` +
      `${rows} rows is a different list — 2801 in particular is the early mirrored version (F-005 · R-004).`,
  );
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run lib/core/provenance.test.ts`
Expected: all 11 PASS.

- [ ] **Step 5: Mutate the host check to prove the test measures it**

Run:
```bash
sed -i 's|return hostname === domain \|\| hostname.endsWith(`.${domain}`);|return hostname.endsWith(domain);|' lib/core/provenance.ts
npx vitest run lib/core/provenance.test.ts
```
Expected: FAIL on `rejects a host that merely ENDS with the domain`. Restore the line exactly as written in Step 3 and re-run to green.

- [ ] **Step 6: Route the existing runner check through it**

In `scripts/measure-coverage.mjs`, find the block that currently enforces the 2,809-row count (it prints `expected exactly 2809`). Replace its inline comparison with the imported guard so there is one definition of the number:

```js
import { checkNgslRowCount } from '../lib/core/provenance.ts';

// … where the count was compared inline:
const verdict = checkNgslRowCount(ngsl.headwords.length);
if (!verdict.ok) {
  console.error(`✗ ${verdict.reason}`);
  process.exit(1);
}
```

Keep the existing `T-043` message for the *missing file* case untouched — a missing file and a wrong file are different failures and must stay distinguishable.

- [ ] **Step 7: Re-run the runner's own tests**

Run: `npx vitest run scripts/measure-coverage.test.ts`
Expected: PASS. If a test asserted the exact old wording of the row-count error, update that assertion to the new message — the message improved, the behaviour did not change.

- [ ] **Step 8: Full verification**

Run: `npm run typecheck && npm run check:core && npm test && npm run build`
Expected: all four green, `check:core` prints `/lib/core purity: OK` (the new file imports only from `lib/core`, and `new URL()` is a language built-in, not I/O).

- [ ] **Step 9: Commit**

```bash
git add lib/core/provenance.ts lib/core/provenance.test.ts scripts/measure-coverage.mjs scripts/measure-coverage.test.ts
git commit -m "loop(DEV): C-XXXX T-012 NGSL version + host provenance guard"
```

---

### Task 4: Provenance columns and the telemetry table (T-015)

**Files:**
- Create: `supabase/migrations/0003_provenance_telemetry.sql`
- Create: `lib/supabase/telemetry.test.ts`

**Interfaces:**
- Consumes: `DATA_SOURCES` from `lib/core/dataSources` (Task 1) — read by the test, not by the SQL.
- Produces: the tables `public.data_sources` and `public.word_progress`, and the columns `track_id` / `source_id` / `origin` on `public.words` and `public.senses`. No TypeScript surface yet: nothing reads these until T-005.

**The one design decision, stated once.** `word_progress` is **one aggregate row per (user, word)** and never a row per review event. W4 is the reason: the free Supabase tier is a stated budget risk, and an event table on a review app grows without bound. `time_to_first_correct` and `attempts_to_mastery` are exactly the two fields D-010 names, written verbatim; both are nullable because both are unknown until the learner first answers correctly, and "0" would be a measurement, not a null.

`track_id` defaults to `'amiram'` — the same default `0001_profiles.sql` already puts on `profiles`, so the two never disagree.

- [ ] **Step 1: Write the failing test**

Create `lib/supabase/telemetry.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DATA_SOURCES } from '../core/dataSources';

/**
 * Guards T-015 where it can be guarded without a live project: the migration.
 * Same approach and same limits as lib/supabase/rls.test.ts — this proves what
 * we ship, not what was applied. Applying it is a step in docs/SETUP.md.
 */
const MIGRATION = readFileSync('supabase/migrations/0003_provenance_telemetry.sql', 'utf8');
const SQL = MIGRATION.toLowerCase();

describe('provenance columns', () => {
  it('puts track_id, source_id and origin on both content tables', () => {
    for (const table of ['words', 'senses']) {
      for (const column of ['track_id', 'source_id', 'origin']) {
        expect(SQL, `${table}.${column} is missing`).toMatch(
          new RegExp(`alter table public\\.${table}[\\s\\S]{0,120}${column}`),
        );
      }
    }
  });

  it('defaults track_id to amiram, exactly as profiles does', () => {
    // 0001_profiles.sql already writes `track_id text not null default 'amiram'`.
    // Two different defaults for the same key is a join that silently returns
    // nothing, and it would not surface until the first multi-track query.
    const defaults = MIGRATION.match(/track_id[\s\S]{0,60}default\s+'([a-z]+)'/gi) ?? [];
    expect(defaults.length).toBeGreaterThanOrEqual(2);
    for (const d of defaults) expect(d).toMatch(/'amiram'/);
  });

  it('constrains origin to the three documented values', () => {
    expect(SQL).toContain("origin in ('seed','ngsl','generated')");
  });

  it('makes source_id a real foreign key, not free text', () => {
    expect(SQL).toMatch(/source_id\s+text\s+references\s+public\.data_sources\s*\(\s*id\s*\)/);
  });
});

describe('the data_sources table mirrors the code registry exactly', () => {
  // The registry is the source of truth; the table exists so a row can point at
  // one. If they drift, `source_id = 'ngsl'` in the DB and `'ngsl'` in the code
  // stop meaning the same thing — and nothing would ever tell us.
  const seeded = [...MIGRATION.matchAll(/\(\s*'([a-z0-9-]+)'\s*,\s*'/g)].map((m) => m[1]);

  it('seeds a row for every id, and no extra ids', () => {
    const inCode = DATA_SOURCES.map((s) => s.id).sort();
    expect([...new Set(seeded)].sort()).toEqual(inCode);
  });
});

describe('word_progress — D-010 telemetry', () => {
  it('carries both D-010 fields under their exact names', () => {
    expect(SQL).toContain('time_to_first_correct');
    expect(SQL).toContain('attempts_to_mastery');
  });

  it('is one aggregate row per (user, word), not a row per review event (W4)', () => {
    // The whole point of the shape. A `create table … reviews (id uuid primary
    // key …)` growing per answer is the free-tier risk W4 names by number.
    expect(SQL).toMatch(/primary key\s*\(\s*user_id\s*,\s*word_id\s*\)/);
    expect(SQL, 'no per-event table may be introduced here').not.toMatch(
      /create table[\s\S]{0,80}(review_events|answer_events|attempts_log)/,
    );
  });

  it('leaves both D-010 fields nullable — unknown is not zero', () => {
    expect(SQL).not.toMatch(/time_to_first_correct[^,]*not null/);
    expect(SQL).not.toMatch(/attempts_to_mastery[^,]*not null/);
  });

  it('enables row level security', () => {
    expect(SQL).toMatch(/alter\s+table\s+public\.word_progress\s+enable\s+row\s+level\s+security/);
  });

  it('scopes every word_progress policy to the row owner', () => {
    const policies = MIGRATION.match(/create policy[\s\S]*?;/gi) ?? [];
    const onProgress = policies.filter((p) => /word_progress/i.test(p));
    expect(onProgress.length).toBeGreaterThanOrEqual(3);
    for (const policy of onProgress) {
      expect(policy).toMatch(/auth\.uid\(\)\s*=\s*user_id/i);
    }
  });

  it('never opens word_progress to everyone', () => {
    expect(SQL).not.toMatch(/using\s*\(\s*true\s*\)/);
    expect(SQL).not.toMatch(/\bto\s+(public|anon)\b/);
  });

  it('covers select, insert and update', () => {
    for (const verb of ['select', 'insert', 'update']) {
      expect(SQL).toContain(`for ${verb}`);
    }
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run lib/supabase/telemetry.test.ts`
Expected: FAIL — `ENOENT … supabase/migrations/0003_provenance_telemetry.sql`.

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/0003_provenance_telemetry.sql`:

```sql
-- 0003_provenance_telemetry.sql — T-015
--
-- Two things that are cheap today and impossible retroactively:
--   ⓐ provenance on every content row (which track, which source, which origin);
--   ⓑ the two D-010 fields per (learner, word).
--
-- `word_progress` is deliberately ONE ROW PER PAIR and not one row per review
-- event. W4 records the free Supabase tier as a budget risk, and an event log on
-- a spaced-repetition app grows without a ceiling. Everything the level gate
-- (7.7) needs is derivable from the aggregate.
--
-- Idempotent: `if not exists` throughout, so re-applying is safe.

begin;

-- ── the source registry, mirrored from lib/core/dataSources.ts ───────────────
-- Mirrored, not authoritative: the code registry is the source of truth, and
-- lib/supabase/telemetry.test.ts fails if the two id sets ever diverge.
create table if not exists public.data_sources (
  id      text primary key,
  name    text not null,
  licence text not null,
  url     text not null
);

insert into public.data_sources (id, name, licence, url) values
  ('ngsl',             'New General Service List v1.2',        'CC BY-SA 4.0', 'https://www.newgeneralservicelist.com/'),
  ('cefrj',            'CEFR-J Vocabulary Profile',            'CEFR-J',       'https://cefr-j.org/download.html'),
  ('octanove',         'Octanove Vocabulary Profile C1/C2',    'CC BY-SA 4.0', 'https://github.com/openlanguageprofiles/olp-en-cefrj'),
  ('hebrew-wordnet',   'Hebrew Wordnet (University of Haifa)', 'permissive',   'https://cl.haifa.ac.il/projects/mila/'),
  ('wiktionary-en-he', 'English Wiktionary (EN→HE)',           'CC BY-SA 4.0', 'https://en.wiktionary.org/'),
  ('kaikki',           'Kaikki.org / wiktextract',             'CC BY-SA 4.0', 'https://kaikki.org/dictionary/English/'),
  ('word2word',        'word2word',                            'Apache-2.0',   'https://github.com/kakaobrain/word2word')
on conflict (id) do nothing;

-- ── provenance on the content rows ──────────────────────────────────────────
-- `words.origin` already exists from 0002; `words` gains the other two, and
-- `senses` gains all three. Same 'amiram' default as profiles.track_id (0001),
-- because two defaults for one key is a join that quietly returns nothing.
alter table public.words
  add column if not exists track_id  text not null default 'amiram',
  add column if not exists source_id text references public.data_sources (id);

alter table public.senses
  add column if not exists track_id  text not null default 'amiram',
  add column if not exists source_id text references public.data_sources (id),
  add column if not exists origin    text not null default 'generated'
    check (origin in ('seed','ngsl','generated'));

create index if not exists words_track_idx  on public.words  (track_id);
create index if not exists senses_track_idx on public.senses (track_id);

-- ── D-010 telemetry, one aggregate row per (learner, word) ──────────────────
create table if not exists public.word_progress (
  user_id  uuid not null references auth.users (id) on delete cascade,
  word_id  uuid not null references public.words (id) on delete cascade,
  track_id text not null default 'amiram',

  first_seen_at    timestamptz not null default now(),
  attempts         int not null default 0,
  correct_attempts int not null default 0,

  -- D-010, both names verbatim. Nullable on purpose: until the learner answers
  -- correctly once, the value is UNKNOWN, and 0 would be a measurement.
  time_to_first_correct int,  -- milliseconds from first exposure to first correct answer
  attempts_to_mastery   int,  -- attempts counted at the moment mastery was reached

  mastered_at timestamptz,
  updated_at  timestamptz not null default now(),

  primary key (user_id, word_id)
);

create index if not exists word_progress_user_idx on public.word_progress (user_id);

alter table public.word_progress enable row level security;

create policy "word_progress_select_own" on public.word_progress
  for select using (auth.uid() = user_id);

create policy "word_progress_insert_own" on public.word_progress
  for insert with check (auth.uid() = user_id);

create policy "word_progress_update_own" on public.word_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

commit;
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run lib/supabase/telemetry.test.ts`
Expected: all 12 PASS. If `seeds a row for every id, and no extra ids` fails, read the diff — it means the `insert` list and `DATA_SOURCES` disagree, which is the exact drift this test exists to catch.

- [ ] **Step 5: Mutate the cross-check to prove it measures**

Run:
```bash
sed -i "s|('word2word',|('word2word-typo',|" supabase/migrations/0003_provenance_telemetry.sql
npx vitest run lib/supabase/telemetry.test.ts
```
Expected: FAIL on `seeds a row for every id, and no extra ids`. Restore with `sed -i "s|('word2word-typo',|('word2word',|" …` and re-run to green.

- [ ] **Step 6: Mutate the primary key to prove W4 is enforced**

Run:
```bash
sed -i 's|primary key (user_id, word_id)|id uuid primary key default gen_random_uuid()|' supabase/migrations/0003_provenance_telemetry.sql
npx vitest run lib/supabase/telemetry.test.ts
```
Expected: FAIL on `is one aggregate row per (user, word), not a row per review event (W4)`. Restore and re-run to green.

- [ ] **Step 7: Record the manual apply step**

Append to the "required manual steps" list in `docs/SETUP.md` (find the existing list — `0001` and `0002` are already there):

```markdown
- Apply `supabase/migrations/0003_provenance_telemetry.sql` in the Supabase SQL
  editor. It seeds `data_sources`, adds provenance columns to `words`/`senses`,
  and creates `word_progress` with RLS. Re-applying it is safe.
```

- [ ] **Step 8: Full verification**

Run: `npm run typecheck && npm run check:core && npm test && npm run build`
Expected: all four green.

- [ ] **Step 9: Commit**

```bash
git add supabase/migrations/0003_provenance_telemetry.sql lib/supabase/telemetry.test.ts docs/SETUP.md
git commit -m "loop(DEV): C-XXXX T-015 provenance columns + word_progress telemetry"
```

---

## Self-review

Run this checklist yourself after the last task, before handing to the Critic.

**1. Backlog coverage.** Point at the task that closes each item:

- T-011 wants `/docs/data-licenses.md` (one row per source: name, licence, required attribution wording, link) → Task 1, generated and drift-checked. Plus `/sources` in Hebrew with a footer link on every screen → Task 2.
- T-012 wants a unit test that fails when the NGSL file is not v1.2 / 2,809 **and** when the URL is off `newgeneralservicelist.com` → Task 3, both halves, plus the two host-substring attacks that a naive check accepts.
- T-015 wants `track_id`, `source_id`, `origin` on every content row and `time_to_first_correct` / `attempts_to_mastery` per (user, word), one aggregate row per pair → Task 4.

**2. Placeholder scan.** Search the plan for `TBD`, `TODO`, `implement later`, `appropriate error handling`, `handle edge cases`, `similar to Task`. There must be zero hits.

**3. Type consistency.** `SourceId` and `DataSource` are declared once in Task 1 and used unchanged in Tasks 2, 3 and 4. `ProvenanceVerdict` is declared in Task 3 and used nowhere else. `dataSource()` (singular) is the accessor; `DATA_SOURCES` (plural) is the array — do not swap them.

**4. Rules that are measured, not tasted.** `npm run check:mobile` must be green on `/sources` for the heading anchor and the 44px targets; `lib/core/palette.test.ts` must be green for the semantic tokens; `components/EnWord.test.ts` must contain a positive assertion naming each of the three English fields on `/sources`.

**5. What this plan deliberately does not do.** It does not ingest NGSL (T-007 — the file is not in the repo, T-043). It does not write a single translation, example or word pair. It does not add an API endpoint, so `docs/api-contract.md` is untouched. It does not touch `plan/10-pedagogy.md`.
