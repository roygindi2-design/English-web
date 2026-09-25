// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AmirnetDashboardLive, { SESSION_EXPIRED_HE } from '@/components/AmirnetDashboardLive';
import { failureExit, SIGN_IN_AGAIN_HE } from '@/lib/core/failureExit';

/**
 * F-331 — the amirnet dashboard told an expired learner to sign in again and gave them
 * ⛔ nowhere to tap: every other `session_expired` screen draws `failureExit`'s link.
 * Failure scenario: `/api/amirnet/practice/result` answers `session_expired` ⇒ the
 * sentence renders and the only way to `/login` is remembering the «אני» tab.
 */
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function answer(body: unknown) {
  vi.stubGlobal('fetch', vi.fn(async () => ({ json: async () => body })));
}

describe('AmirnetDashboardLive — the session_expired state has an exit (F-331)', () => {
  it('draws the sign-in link, from failureExit, under the sentence', async () => {
    answer({ ok: false, code: 'session_expired' });
    render(<AmirnetDashboardLive />);
    await screen.findByText(SESSION_EXPIRED_HE);
    const link = screen.getByRole('link', { name: SIGN_IN_AGAIN_HE });
    expect(link.getAttribute('href')).toBe(failureExit('session_expired').href);
  });

  it('⛔ no sign-in link when the read failed for another reason — the learner is signed in', async () => {
    answer({ ok: false, code: 'unavailable' });
    render(<AmirnetDashboardLive />);
    await screen.findByText(/זה לא אומר שלא תרגלת/);
    expect(screen.queryByRole('link', { name: SIGN_IN_AGAIN_HE })).toBeNull();
  });
});
