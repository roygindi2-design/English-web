import { Suspense } from 'react';
import AuthForm from '@/components/AuthForm';

// T-264 — the suffix comes from `app/layout.tsx`'s `title.template` now, ⛔ not typed here.
export const metadata = { title: 'יצירת חשבון' };

/** /signup — UX plan T-002. Email, password, one primary button. Nothing else. */
export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
