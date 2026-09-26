import { Suspense } from 'react';
import AuthForm from '@/components/AuthForm';
import EntryCheck from '@/components/EntryCheck';

// T-264 — the suffix comes from `app/layout.tsx`'s `title.template` now, ⛔ not typed here.
export const metadata = { title: 'התחברות' };

/** /login — the exact same layout as /signup, so moving between them costs the
 *  learner no re-reading (UX plan T-002). */
export default function LoginPage() {
  return (
    <>
      <div data-entry-hold className="contents">
        <Suspense fallback={<div className="flex-1" />}>
          <AuthForm mode="login" />
        </Suspense>
      </div>
      {/* T-525 — served without the proxy; the signed-in redirect comes from here. */}
      <EntryCheck path="/login" />
    </>
  );
}
