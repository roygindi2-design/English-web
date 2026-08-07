# data/ — source files that agents cannot fetch

TD-17: every external data domain returns `403 host_not_allowed` from the loop
environment. Measured C-0016, measured again C-0019. **No agent may work around
this** — ⛔ no mirrors, ⛔ no archives (R-004). The files below arrive through the
repo, by Roy. This is T-043.

`npm run measure:coverage` reports `unavailable` for any file that is absent.
It never reports `0%` for a missing file — those mean opposite things.

| file | source | licence | format |
|---|---|---|---|
| `ngsl-1.2.csv` | `newgeneralservicelist.com` **only** — R-004 | CC BY-SA 4.0 | CSV with a column literally named `headword`. **Must contain exactly 2,809 rows** (T-012 · F-005). |
| `h1-hebrew-wordnet.tsv` | Hebrew Wordnet, Univ. of Haifa | permissive, no share-alike (verified C-0001, H1g) | 2 columns, tab separated: `english<TAB>hebrew`. One line per gloss. `GAP` and `!` markers preserved verbatim — the filter is ours (T-017), not the exporter's. |
| `h2-wiktionary-en-he.tsv` | English Wiktionary EN→HE | CC BY-SA | same 2-column TSV as above. |
| `h3-kaikki-en.jsonl` | kaikki.org / wiktextract | CC BY-SA | JSON Lines. One object per line with `word` and `translations: [{ lang_code, word }]`. |
| `h4-word2word-en-he.tsv` | word2word | Apache-2.0 | same 2-column TSV as above. |

## Converting a source to the 2-column TSV

Out of scope for this plan on purpose. H1 and H4 do not ship in this shape, and
**no agent has ever seen the real distribution** — writing a converter blind is
how you get a parser bug that reads as a fact about Hebrew. Whoever converts
records the exact command they ran in this file, next to the row above.

## Runtime requirement

`npm run measure:coverage` imports the TypeScript in `lib/core/` directly, with
no build step and **no new dependency**. That needs **Node ≥ 22.18**, where type
stripping is on by default; the runner registers one small resolve hook
(`node:module` `registerHooks`, Node ≥ 22.15) so that the extensionless imports
inside `lib/core/` resolve to `.ts`. Measured working on Node v22.22.2 (C-0024).
`tsx` was considered and rejected — it would have been a dependency added for a
script that runs a handful of times.

## Licence attribution

Every source here carries an attribution obligation. `T-011` builds
`/docs/data-licenses.md` and the in-product `/sources` page from this table.
