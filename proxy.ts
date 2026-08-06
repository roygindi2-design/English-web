import { NextResponse, type NextRequest } from 'next/server';
import { createProxyClient, readSupabaseEnv } from '@/lib/supabase/auth';

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
const PROTECTED_SCREENS = ['/onboarding'];

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // A returning learner never sees the marketing screen or the auth screens again.
    if (isAuthScreen || pathname === '/') {
      return redirectPreservingCookies(request, response, '/onboarding');
    }
    return response;
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
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icons|sw.js|manifest.webmanifest|offline.html).*)'],
};
