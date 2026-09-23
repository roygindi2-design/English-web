'use client';

import ArenaResult, { type ArenaMissed } from '@/components/ArenaResult';
// ⟦T-428⟧ ⛔ פיקסטורה שנבדלת מהייצור היא חור: `/arcade` טוען את הקובץ הזה (`app/arcade/page.tsx:2`),
// ⇒ בלעדיו `data-arena-scope` כאן ⛔ אינו מצייר דבר ו-`check:mobile` היה מודד מסך שאינו קיים.
import '../../../arcade/arcade-tokens.css';

/**
 * Layout fixture for `check:mobile` — T-096, plan `2026-08-19-arcade-screens.md` § 2.
 * noindex (the rule lives in `app/dev/arcade/layout.tsx`), unlinked, and ⛔ NOT a learning
 * screen (בדיקת פריסה — אינו תוכן לימודי).
 *
 * Why it has to exist, measured and not assumed: the end screen is only reachable after
 * `POST /api/arcade/result` answers 200, and `check:mobile` runs `next start` with no
 * Supabase env — so on `/arcade` that endpoint answers 503 by its own contract and this
 * screen has **never once** been rendered at 320/375/414. Same reasoning as `/dev/arcade`
 * (C-0185), `/dev/world` (C-0129) and `/dev/deck/done` (T-055).
 *
 * ⛔ **This page renders the component and NOTHING else** — no heading, no note line
 * (C-0104: one line of chrome the real screen does not have pushes the content down, and
 * the harness then measures the fixture instead of the component).
 *
 * ⛔ **The strings are not learning content** (R-010 · R-013): they are the same non-content
 * `app/dev/arcade/page.tsx` uses, chosen for LENGTH rather than meaning. What is measured
 * here is pixels — that the rows wrap, that both ways out hold 44px, and that nothing
 * scrolls sideways at 320px.
 *
 * Five rows and ⛔ not one: `ARCADE_MISSED_LIMIT` is 5, and a list that is never full cannot
 * fail a wrap check.
 *
 * ⚠️ `'use client'` because `onAgain` is a function prop — and that is exactly why the
 * `metadata` export stays in `app/dev/arcade/layout.tsx`.
 */
function missed(n: number): ArenaMissed {
  return {
    wordId: `w${n}`,
    headword: `Lorem${n}`,
    answer: `אפשרות ${n}`,
    chosen: `מסיח ${n}א`,
  };
}

const FIXTURE: readonly ArenaMissed[] = [missed(1), missed(2), missed(3), missed(4), missed(5)];

export default function DevArcadeResultPage() {
  return (
    <ArenaResult
      enemyDefeated
      unlocked="helmet"
      items={['helmet']}
      missed={FIXTURE}
      onAgain={() => {}}
    />
  );
}
