/**
 * 🧹 T-326 — WHERE the licence footer is drawn, as a pure decision.
 *
 * `T-011` put the attribution link in `app/layout.tsx`'s `<footer>`, which means
 * it was drawn on **every** screen — measured on `/dev/deck`, where «מקורות
 * הנתונים והרישיונות» sits directly under the card the learner is supposed to be
 * answering. The obligation attaches to the product (T-011 · `app/sources`), so
 * the link ⛔ cannot be removed; what it must ⛔ not do is sit inside a task.
 *
 * ⇒ the rule, and it is the ONLY one this module encodes:
 *   **a screen that carries a task hides the administrative chrome; everywhere
 *   else keeps it.** Hub screens (the five tabs), the entry screens (`/`,
 *   `/login`, `/signup`, `/onboarding`), `/offline` and `/sources` itself all
 *   keep the link, so the attribution stays reachable for a learner who has not
 *   signed in — which an allowlist would have quietly broken the first time a
 *   screen was added. Hiding is therefore the DECLARED list below, and showing
 *   is the default.
 *
 * ⚠️ The `/dev/*` fixtures are in the list beside the product routes they
 * mirror, deliberately: a learner never reaches `/dev/*`, but the walk
 * (`scripts/verify-mobile.mjs`) measures the fixtures precisely because the real
 * task routes answer 503/307 with no Supabase env. A fixture classified
 * differently from the screen it stands for would make the walk measure
 * something the product does not do.
 *
 * ⛔ Pure (`lib/core/` contract): a string in, a boolean out. The React side is
 * `components/SourcesFooter.tsx` and it holds ⛔ no list of its own.
 */

/**
 * A route pattern: an exact path, every path under it (`'/study'` covers
 * `/study/scan`), or — with the `/*` suffix — the children ONLY, leaving the
 * index itself alone. The one place that distinction matters is an inbox: the
 * list is a destination, the open message is the task.
 */
export type TaskRoutePattern = string;

/**
 * Every screen on which the learner is INSIDE a task: answering, producing, or
 * playing. One entry per screen family, with the reason it is a task and ⛔ not
 * a destination.
 */
export const TASK_ROUTES: readonly TaskRoutePattern[] = [
  // The daily deck and the placement scan — the learner is answering words.
  '/study',
  // The 90-second battle (`37 § 1`). Administrative chrome inside it would also
  // be a second thing to tap while the clock runs.
  '/arcade',
  // Writing chain — the learner is producing a sentence.
  '/world/compose',
  // The story reader: tapping a word for its translation IS the task (`36 § 7`).
  '/world/story',
  // אמיר״ם: practising and the full simulation are answering screens; the
  // dashboard, the level menu and the result screen above them are destinations
  // and keep the link.
  '/world/amirnet/practice',
  '/world/amirnet/simulation',
  // An open message is the task; `/world/messages` itself is the inbox, a
  // destination, and it keeps the link.
  '/world/messages/*',

  // ── the `/dev` fixtures for the same screens (see the header note) ──────────
  '/dev/deck',
  '/dev/card',
  '/dev/lesson',
  '/dev/story',
  '/dev/arcade',
  '/dev/scan',
  '/dev/amirnet/practice',
  '/dev/amirnet/question',
  '/dev/amirnet/simulation',
  '/dev/messages/*',
  '/dev/world/recall',
];

/** `/study/` and `/study` are the same screen; `/` stays `/`. */
function normalise(pathname: string): string {
  const withoutQuery = pathname.split(/[?#]/)[0] ?? '';
  if (withoutQuery.length > 1 && withoutQuery.endsWith('/')) return withoutQuery.slice(0, -1);
  return withoutQuery === '' ? '/' : withoutQuery;
}

function matches(route: string, pattern: TaskRoutePattern): boolean {
  if (pattern.endsWith('/*')) {
    const base = pattern.slice(0, -2);
    return route.startsWith(`${base}/`);
  }
  return route === pattern || route.startsWith(`${pattern}/`);
}

/** `true` when the route is one of the task screens above. */
export function isTaskRoute(pathname: string): boolean {
  const route = normalise(pathname);
  return TASK_ROUTES.some((pattern) => matches(route, pattern));
}

/**
 * The one question `components/SourcesFooter.tsx` asks. Showing is the default,
 * so a screen that nobody classified keeps the attribution rather than losing it
 * silently.
 */
export function showsLicenceFooter(pathname: string): boolean {
  return !isTaskRoute(pathname);
}
