'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api/client';
import { ENTRY_PENDING_ATTR } from '@/lib/core/entryRoute';

type EntryAnswer = { ok: boolean; target?: string | null };

/**
 * T-525 · D-304 — the signed-in redirect for an entry screen, now that the screen
 * is served from the CDN without `proxy.ts`. Asks `GET /api/auth/entry` (which runs
 * the one `signedInRedirect`) and either moves on or lets go of the held-back
 * action. ⛔ It decides nothing itself.
 *
 * It asks for a guest too: the answer is the only thing that can catch a learner
 * whose session predates the hint cookie, and the same request is what wakes the
 * function the guest's «בואו נתחיל» submit will need a moment later.
 */
export default function EntryCheck({ path }: { path: string }) {
  const router = useRouter();

  useEffect(() => {
    let alive = true;
    const release = () => document.documentElement.removeAttribute(ENTRY_PENDING_ATTR);
    apiGet<EntryAnswer>(`/api/auth/entry?path=${encodeURIComponent(path)}`)
      .then((answer) => {
        if (!alive) return;
        if (answer.ok && typeof answer.target === 'string') {
          router.replace(answer.target);
          return;
        }
        release();
      })
      .catch(() => {
        if (alive) release();
      });
    return () => {
      alive = false;
      release();
    };
  }, [path, router]);

  return null;
}
