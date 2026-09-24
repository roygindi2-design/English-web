import { NextResponse } from 'next/server';
import {
  CONTINUATION_LEVELS,
  MAX_SENTENCE_WORDS,
  nextBlocks,
  type ContinuationIndex,
  type ContinuationLevel,
} from '@/lib/core/continuations';
import { continuationsTree } from '@/lib/server/continuationsTree';

/**
 * GET /api/world/messages/continuations?level=A1&prefix=i+like — see docs/api-contract.md
 *
 * T-461 · `F-321` ⓐ — the continuation tree is **2.88MB gzip** (measured C-0791), almost
 * twice T-460's 1.5MB budget, so it ⛔ never ships to the phone: the keyboard asks
 * this route once per tap and the tree stays a server file.
 *
 * ⛔ No session and ⛔ no database: the tree is public, generated data (Tatoeba ·
 * CEFR-J) and the answer is a pure function of the query ⇒ cacheable.
 */
const WORD = /^[a-z']+$/i;

export function parseQuery(
  params: URLSearchParams,
): { level: ContinuationLevel; prefix: string[] } | null {
  const level = params.get('level');
  if (level === null || !(CONTINUATION_LEVELS as readonly string[]).includes(level)) return null;
  const raw = (params.get('prefix') ?? '').trim();
  const prefix = raw === '' ? [] : raw.split(/\s+/);
  if (prefix.length > MAX_SENTENCE_WORDS || !prefix.every((w) => WORD.test(w))) return null;
  return { level: level as ContinuationLevel, prefix };
}

export async function GET(request: Request) {
  const query = parseQuery(new URL(request.url).searchParams);
  if (query === null) return NextResponse.json({ ok: false, code: 'bad_request' }, { status: 400 });
  let tree: ContinuationIndex;
  try {
    tree = continuationsTree();
  } catch (error) {
    console.error('[api/world/messages/continuations] tree read failed:', (error as Error).message);
    return NextResponse.json({ ok: false, code: 'unavailable' });
  }
  const next = nextBlocks(tree, query.prefix, query.level);
  return NextResponse.json(
    { ok: true, ...next },
    { headers: { 'Cache-Control': 'public, max-age=86400' } },
  );
}
