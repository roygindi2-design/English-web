import { NextResponse, type NextRequest } from 'next/server';
import {
  ONBOARDING_PATH,
  SIGNED_IN_HINT_COOKIE,
  appOpenRedirect,
  isAppOpen,
  onboardedFromRow,
  signedInRedirect,
} from '@/lib/core/entryRoute';
import { SIGNED_IN_HINT_OPTIONS, createProxyClient, readSupabaseEnv } from '@/lib/supabase/auth';

/**
 * Session refresh + route guarding — T-002.
 *
 * Next 16 renamed this file convention from `middleware` to `proxy`; the old
 * name is deprecated and warns on every build, so we use the new one.
 *
 * Two jobs, and only these two:
 *  1. Refresh the Supabase session cookie. A Server Component cannot write
 *     cookies, so without this an expired access token would silently log the
 *     learner out mid-session.
 *  2. Send each request to the screen the UX plan says it belongs on.
 *
 * Screens stay static; nothing here reads or writes learning data.
 */

const AUTH_SCREENS = ['/signup', '/login'];
/**
 * Every screen that reads the learner's own rows. The three tab routes joined
 * in C-0073 (T-051 · § 4.2ב): `/studies` reads `profiles`, `/me` reads
 * `word_progress`, and `/cards` is the queue's home. ⛔ The `/dev/*` fixtures
 * are deliberately absent — a session-gated fixture answers 307 and
 * `check:mobile` silently measures `/login` instead (the F-027 cause-1 lesson).
 *
 * ⚠️ `/settings` joined in C-0318 (T-211ⓔ) and ⛔ not "later": since that tick it
 * reads `GET /api/levels/summary` and writes `POST /api/levels/current`, i.e. it
 * holds the learner's own level. The comment this file used to carry said the
 * screen would join «the moment it holds something private» — this is that
 * moment, and it is the SAME commit.
 */
const PROTECTED_SCREENS = ['/onboarding', '/studies', '/cards', '/me', '/settings'];

/** Exported for the F-003 unit test and reused by the onboarding screen's own guard. */
export function isProtectedPath(pathname: string) {
  return PROTECTED_SCREENS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });
  const env = readSupabaseEnv();

  const { pathname } = request.nextUrl;
  const isAuthScreen = AUTH_SCREENS.some((p) => pathname === p);
  const isProtected = isProtectedPath(pathname);

  // F-003 — fail closed, not open. A typo in a Netlify env var (or a Deploy
  // Preview that does not inherit them) used to make this guard evaporate and
  // hand every protected screen to an anonymous request. Public screens still
  // render, so the learner meets a Hebrew "we could not connect" on submit
  // rather than a dead site.
  if (!env) {
    if (isProtected) return redirectPreservingCookies(request, response, '/login', { expired: '1' });
    return response;
  }

  const supabase = createProxyClient(env, request, response);
  // T-377ⓑ — `getClaims()`, ⛔ not `getUser()`. The project signs with ES256,
  // so the signature is verified here against a cached JWKS instead of a
  // round-trip to Supabase Auth on every navigation (measured 26/09: signed-in
  // `/cards` 0.33–0.48s warm vs 0.12–0.18s anonymous). It still refreshes an
  // expired session (job 1), and falls back to the network by itself for a
  // symmetric token. No verified claims ⇒ anonymous: this fails closed.
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsError ? undefined : claimsData?.claims?.sub;

  if (userId) {
    // T-525 — the entry screens no longer pass through here, so a learner who
    // signed in before that change carries ⛔ no hint yet. Any signed-in navigation
    // (the next `/studies` open) writes it; ⛔ it is never proof of a session.
    if (!request.cookies.has(SIGNED_IN_HINT_COOKIE)) {
      response.cookies.set(SIGNED_IN_HINT_COOKIE, '1', SIGNED_IN_HINT_OPTIONS);
    }
    // ⚠️ TD-25 · T-122: קודם כאן ישב `/onboarding` ללא תנאי, וכל לומד חוזר
    // נזרק לטופס שמילא לפני שבוע. הקריאה למאגר מתבצעת אך ורק בנתיבים
    // שההחלטה נוגעת בהם — ⛔ לא בכל בקשה. `proxy` רץ על כל ניווט, ושאילתה
    // קבועה בכל בקשה היא מס על מוצר שלם עבור החלטה שנוגעת לארבעה נתיבים.
    // T-524 — and the installed app's open (`APP_START_URL`), ⛔ not `/studies` as
    // such: a learner who never finished onboarding must land where `/` used to
    // send them, and the mark keeps that read to the one navigation that needs it.
    const appOpen = isAppOpen(pathname, request.nextUrl.searchParams);
    const needsOnboardingState =
      isAuthScreen || pathname === '/' || pathname === ONBOARDING_PATH || appOpen;
    if (!needsOnboardingState) return response;

    const { data } = await supabase
      .from('profiles')
      .select('onboarded_at')
      .eq('id', userId)
      .maybeSingle();

    // `data` הוא `unknown` מבחינתנו — `onboardedFromRow` הוא שמחליט, ⛔ לא cast.
    const onboarded = onboardedFromRow(data);
    const target = appOpen ? appOpenRedirect(onboarded) : signedInRedirect(pathname, onboarded);
    if (target === null) return response;
    return redirectPreservingCookies(request, response, target);
  }

  if (isProtected) {
    // Expired or absent session — a soft notice on /login, not an error screen.
    return redirectPreservingCookies(request, response, '/login', { expired: '1' });
  }

  return response;
}

function redirectPreservingCookies(
  request: NextRequest,
  response: NextResponse,
  pathname: string,
  query?: Record<string, string>
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = '';
  for (const [key, value] of Object.entries(query ?? {})) url.searchParams.set(key, value);

  const redirect = NextResponse.redirect(url);
  // Carry over any refreshed session cookies; dropping them here would log the
  // learner out on the very redirect that was meant to keep them in.
  for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
  return redirect;
}

export const config = {
  // Everything except API routes, static assets and the PWA files. The service
  // worker and manifest must be reachable without a session.
  //
  // T-525 · D-304 — and ⛔ not the four public entry screens: `/` · `/login` ·
  // `/signup` · `/sources`. Each is prerendered and sits in the CDN cache, and
  // measured 26/09 in production `/login` still took 4.26s cold — ALL of it this
  // function waking up. `(?:/|$)` keeps the boundary exact (`/login-help` is still
  // matched), and the bare `$` is `/` itself. None of the four is in
  // `PROTECTED_SCREENS` ⇒ ⛔ no lock moved; the signed-in redirect they used to get
  // here comes from `GET /api/auth/entry` with the same `signedInRedirect`.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icons|sw.js|manifest.webmanifest|offline.html|(?:login|signup|sources)(?:/|$)|$).*)',
  ],
};
