import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /logout — an action, not a screen (UX plan T-002). Always ends at `/`.
 *
 * Submitted by a plain <form>, so signing out works with JavaScript disabled and
 * cannot be triggered by a stray <img> tag the way a GET logout can.
 */
export async function POST(request: Request) {
  const env = readSupabaseEnv();
  if (env) {
    const supabase = createRouteClient(env, await cookies());
    // Failure here still ends in a redirect: a learner who pressed "יציאה" must
    // never be left staring at an error screen.
    await supabase.auth.signOut().catch(() => undefined);
  }
  return NextResponse.redirect(new URL('/', request.url), { status: 303 });
}
