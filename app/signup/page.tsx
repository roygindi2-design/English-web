import { Suspense } from 'react';
import AuthForm from '@/components/AuthForm';

export const metadata = { title: 'יצירת חשבון · English Web' };

/** /signup — UX plan T-002. Email, password, one primary button. Nothing else. */
export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
