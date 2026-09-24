import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ContinuationIndex } from '@/lib/core/continuations';

/**
 * T-461 · T-462 — the one reader of `data/generated/continuations.json`, shared by the
 * keyboard's route and the answer route so both judge a reply against the SAME tree.
 * Server-only (fs). Read once per server instance; `next.config.mjs` traces the file.
 */
let cached: ContinuationIndex | null = null;

export function continuationsTree(): ContinuationIndex {
  cached ??= JSON.parse(
    readFileSync(join(process.cwd(), 'data', 'generated', 'continuations.json'), 'utf8'),
  ) as ContinuationIndex;
  return cached;
}
