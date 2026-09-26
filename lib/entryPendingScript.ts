/**
 * T-525 · D-304 — the inline script an entry screen paints with.
 *
 * ⛔ Not in `lib/core/`: it is a string of browser code (`document`), and
 * `check:core` is right to refuse that there. The DECISION it mirrors —
 * `hasSignedInHint` — stays pure in `lib/core/entryRoute.ts`, and the unit test
 * runs this script against that function.
 */
import { ENTRY_PENDING_ATTR, SIGNED_IN_HINT_COOKIE } from '@/lib/core/entryRoute';

/**
 * How long the held-back action may stay hidden if the answer never comes (a dead
 * network, a script that failed to load). Past this the landing is shown as it is
 * for a guest — a learner stranded without an action is the one outcome ⛔ never allowed.
 * 8s: longer than the slowest cold start measured (6.16s, `C-0878`).
 */
export const ENTRY_PENDING_MAX_MS = 8000;

/**
 * The inline script an entry screen paints with, BEFORE React hydrates: if the hint
 * is there, mark `<html>` pending so the held-back action (`[data-entry-hold]`) is
 * never drawn and then taken away. The same test as `hasSignedInHint`, written for a
 * `<script>` that cannot import — and run against that function in the unit test.
 */
export function entryPendingScript(): string {
  return (
    '(function(){try{var d=document.documentElement;' +
    `if(document.cookie.split(';').some(function(p){return p.trim()===${JSON.stringify(`${SIGNED_IN_HINT_COOKIE}=1`)}})){` +
    `d.setAttribute(${JSON.stringify(ENTRY_PENDING_ATTR)},'');` +
    `setTimeout(function(){d.removeAttribute(${JSON.stringify(ENTRY_PENDING_ATTR)})},${ENTRY_PENDING_MAX_MS})` +
    '}}catch(e){}})()'
  );
}
