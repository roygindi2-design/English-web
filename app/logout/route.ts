import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { LOGOUT_DESTINATION_FIELD, logoutRedirectPath } from '@/lib/core/auth';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /logout — an action, not a screen (UX plan T-002).
 *
 * Submitted by a plain <form>, so signing out works with JavaScript disabled and
 * cannot be triggered by a stray <img> tag the way a GET logout can.
 *
 * T-026 added one optional field, `destination`. It is an enum and not a path:
 * the body arrives on an unauthenticated request, so anything else would make
 * this route an open redirect. See `logoutRedirectPath`.
 */
export async function POST(request: Request) {
  // Read the token before anything else: after signOut() there is no session and
  // the address the learner is disowning becomes unknowable (T-026).
  let destination: string | null = null;
  try {
    const form = await request.formData();
    const raw = form.get(LOGOUT_DESTINATION_FIELD);
    destination = typeof raw === 'string' ? raw : null;
  } catch {
    destination = null;
  }

  let email: string | null = null;
  const env = readSupabaseEnv();
  if (env) {
    const supabase = createRouteClient(env, await cookies());
    if (destination === 'fix_address') {
      const { data } = await supabase.auth.getUser();
      email = data.user?.email ?? null;
    }
    // Failure here still ends in a redirect: a learner who pressed "יציאה" must
    // never be left staring at an error screen.
    await supabase.auth.signOut().catch(() => undefined);
  }

  return NextResponse.redirect(new URL(logoutRedirectPath(destination, email), request.url), {
    status: 303,
  });
}
