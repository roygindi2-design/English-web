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
