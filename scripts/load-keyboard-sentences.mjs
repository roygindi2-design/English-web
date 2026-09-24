#!/usr/bin/env node
/**
 * T-475 · D-289 — the closed set of sentences the block keyboard can send, counted in
 * Node and loaded into `keyboard_sentences` by the database itself.
 *
 *   node scripts/load-keyboard-sentences.mjs                 ⇒ count · size estimate
 *   node scripts/load-keyboard-sentences.mjs --load <sha>    ⇒ + the load SQL, pinned to a commit
 *   node scripts/load-keyboard-sentences.mjs --sample 1000   ⇒ + a read-back query over N samples
 *
 * ⛔ Why the database walks the tree and Node only counts: the fingerprint is
 * `hashtextextended(keyboard_norm(s), 0)`, and ⛔ nothing outside Postgres computes it.
 * ⇒ ONE hash, in ONE place. The two walks are then checked against each other by the
 * number: `select count(*) from keyboard_sentences` must equal the count printed here,
 * and every sample must be found.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) {
      try {
        return withTsFormat(nextResolve(`${specifier}.ts`, context));
      } catch {
        // Not a TypeScript sibling — fall through to the default resolver.
      }
    }
    return withTsFormat(nextResolve(specifier, context));
  },
});

function withTsFormat(resolved) {
  if (resolved && typeof resolved.url === 'string' && resolved.url.endsWith('.ts')) {
    return { ...resolved, format: 'module-typescript' };
  }
  return resolved;
}

const { keyboardNorm, sendableSentences } = await import('../lib/core/continuations.ts');

const FILE = join(process.env.CONTINUATIONS_DATA ?? join('data', 'generated'), 'continuations.json');
const REPO = 'roygindi2-design/English-web';

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i === -1 ? undefined : process.argv[i + 1];
};

const index = JSON.parse(readFileSync(FILE, 'utf8'));
const seen = new Set();
for (const words of sendableSentences(index)) seen.add(keyboardNorm(words.join(' ')));

// Heap tuple ≈ 24 header + 8 bigint + 4 line pointer; btree leaf ≈ 16 per key.
const bytes = seen.size * (24 + 8 + 4 + 16);
console.log(`sendable: ${seen.size} (index says ${index.sentences} source sentences)`);
console.log(`estimate: ~${(bytes / 1024 / 1024).toFixed(1)} MB heap + primary key`);

const sha = arg('--load');
if (sha) {
  if (!/^[0-9a-f]{40}$/.test(sha)) throw new Error('--load wants a full 40-char commit sha');
  const url = `https://raw.githubusercontent.com/${REPO}/${sha}/data/generated/continuations.json`;
  console.log(`\n-- load SQL (needs the \`http\` extension for the duration of the load):\n${loadSql(url)}`);
}

const n = Number(arg('--sample') ?? 0);
if (n > 0) {
  const all = [...seen];
  const step = Math.max(1, Math.floor(all.length / n));
  const picks = [];
  for (let i = 0; i < all.length && picks.length < n; i += step) picks.push(all[i]);
  const list = picks.map((s) => `'${s.replaceAll("'", "''")}'`).join(',');
  console.log(`\n-- read-back: expect ${picks.length}\nselect count(*) from public.keyboard_sentences k join unnest(array[${list}]) s on k.h = public.keyboard_sentence_hash(s);`);
}

/**
 * Level by level, ⛔ not `with recursive`: C-0810 measured a recursive walk dying on
 * `No space left on device` in pgsql_tmp — each recursive row carried its whole subtree.
 * Here each level is one table, and a level's subtrees together are ⛔ never bigger than
 * the tree. ⚠️ Not yet run against a database (C-0810: the load was refused, item 144).
 */
function loadSql(url) {
  return `create extension if not exists http with schema extensions;
create schema if not exists private_load;
create table private_load.continuations as
  select content::jsonb as j from extensions.http_get('${url}');
create table private_load.words as
  select (o - 1)::int as id, w from private_load.continuations, jsonb_array_elements_text(j->'words') with ordinality as t(w, o);
do $$
declare n bigint;
begin
  create temp table lvl on commit drop as select ''::text as path, j->'root' as node from private_load.continuations;
  loop
    insert into public.keyboard_sentences (h)
      select public.keyboard_sentence_hash(path) from lvl
      where path <> '' and (
        (jsonb_typeof(node) = 'array' and (node->>0)::int between 0 and 3)
        or (jsonb_typeof(node) = 'number' and (node #>> '{}')::int between 0 and 3))
      on conflict do nothing;
    create temp table nxt on commit drop as
      select ltrim(l.path || ' ' || wd.w) as path, t.child as node
      from lvl l
      cross join lateral (
        select max(v #>> '{}') filter (where (k - 2) % 3 = 0) as wid,
               max(v #>> '{}') filter (where (k - 2) % 3 = 1) as lv,
               (array_agg(v) filter (where (k - 2) % 3 = 2))[1] as child
        from jsonb_array_elements(case when jsonb_typeof(l.node) = 'array' then l.node else '[]'::jsonb end)
             with ordinality as e(v, k)
        where k > 1
        group by (k - 2) / 3
      ) t
      join private_load.words wd on wd.id = t.wid::int
      where t.lv::int <= 3;
    get diagnostics n = row_count;
    drop table lvl;
    alter table nxt rename to lvl;
    exit when n = 0;
  end loop;
end $$;
select count(*) from public.keyboard_sentences;  -- expect the «sendable» count above
drop schema private_load cascade;
drop extension http;`;
}
