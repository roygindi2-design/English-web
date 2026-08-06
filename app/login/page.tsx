import { Suspense } from 'react';
import AuthForm from '@/components/AuthForm';

export const metadata = { title: 'התחברות · English Web' };

/** /login — the exact same layout as /signup, so moving between them costs the
 *  learner no re-reading (UX plan T-002). */
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
