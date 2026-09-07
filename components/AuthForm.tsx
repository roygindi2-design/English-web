'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ActionBar from '@/components/ActionBar';
import LatinField from '@/components/LatinField';
import { ApiUnreachableError, apiPost } from '@/lib/api/client';
import { UNREACHABLE_HE } from '@/lib/core/failure';
import {
  type AuthMode,
  AUTH_MESSAGES_HE,
  type FieldErrors,
  checkCredentials,
  confirmationNoticeHe,
  passwordInputType,
  passwordToggleLabel,
} from '@/lib/core/auth';

/**
 * The one form behind /signup and /login — UX plan T-002.
 *
 * Identical layout in both modes on purpose: moving between them must not force
 * the learner to re-read the screen. Every rule about what counts as a valid
 * credential comes from lib/core/auth.ts; this file only renders and submits.
 * It never touches the database (AR-1) — it posts to /api/auth/* and nothing else.
 */

type AuthResponse = {
  ok: boolean;
  next?: string;
  outcome?: 'session_active' | 'awaiting_email_confirmation';
  code?: string;
  message?: string;
  email?: string;
  fieldErrors?: FieldErrors;
};

const COPY: Record<AuthMode, { title: string; lead: string; submit: string; busy: string }> = {
  signup: {
    title: 'יצירת חשבון',
    lead: 'אימייל וסיסמה, וזהו. אפשר להתחיל ללמוד מיד.',
    submit: 'יצירת חשבון',
    busy: 'רגע…',
  },
  login: {
    title: 'התחברות',
    lead: 'טוב לראות אותך שוב.',
    submit: 'התחברות',
    busy: 'רגע…',
  },
};

export default function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const params = useSearchParams();
  const copy = COPY[mode];

  const [email, setEmail] = useState(params.get('email') ?? '');
  const [password, setPassword] = useState('');
  // F-013: hidden by default, because a shoulder-surfer is the likelier threat
  // on a bus than a typo — but one tap away, because the typo has no recovery
  // path while email confirmation is off (Q-001 ⓑ).
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLoginLink, setShowLoginLink] = useState(false);
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  useEffect(() => {
    // A session that ran out is a soft notice, not a failure the learner caused.
    if (params.get('expired') === '1') setNotice('החיבור פג. אפשר להיכנס שוב.');
  }, [params]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setError(null);
    setNotice(null);
    setShowLoginLink(false);

    const check = checkCredentials({ email, password }, mode);
    if (!check.ok) {
      setFieldErrors(check.fieldErrors);
      return;
    }
    setFieldErrors({});

    if (offline) {
      setError('צריך חיבור כדי להיכנס');
      return;
    }

    setBusy(true);
    try {
      const result = await apiPost<AuthResponse>(`/api/auth/${mode}`, {
        email: check.email,
        password: check.password,
      });

      if (result.ok) {
        if (result.outcome === 'awaiting_email_confirmation') {
          // Name the address back (F-013). This screen is the last place the
          // learner can still notice that they typed it wrong.
          setNotice(confirmationNoticeHe(result.email ?? check.email));
          setPassword('');
          setPasswordVisible(false);
          return;
        }
        router.replace(result.next ?? '/onboarding');
        router.refresh();
        return;
      }

      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
        return;
      }
      if (result.code === 'email_taken') setShowLoginLink(true);
      setError(result.message ?? AUTH_MESSAGES_HE.unavailable);
    } catch (cause) {
      // T-274 · D-195: the request never left the device — say so, and say that
      // the submit button is the retry. Anything the server answered is data
      // (above); only a dropped network lands here.
      setError(cause instanceof ApiUnreachableError ? UNREACHABLE_HE : AUTH_MESSAGES_HE.unavailable);
    } finally {
      setBusy(false);
    }
  }

  const otherMode = mode === 'signup' ? 'login' : 'signup';
  const otherHref = `/${otherMode}${email ? `?email=${encodeURIComponent(email)}` : ''}`;

  return (
    <>
      <div className="flex flex-1 flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold leading-tight">{copy.title}</h1>
          <p className="text-lg leading-relaxed text-ink-muted">{copy.lead}</p>
        </div>

        {offline && (
          <p role="status" className="rounded-md bg-amber-50 px-4 py-3 text-base text-amber-900">
            צריך חיבור כדי להיכנס
          </p>
        )}
        {notice && (
          <p role="status" className="rounded-md bg-sky-50 px-4 py-3 text-base text-sky-900">
            {notice}
          </p>
        )}

        <form id="auth-form" className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
          <LatinField
            name="email"
            label="אימייל"
            type="email"
            inputMode="email"
            autoComplete="email"
            enterKeyHint="next"
            value={email}
            onChange={setEmail}
            invalid={Boolean(fieldErrors.email)}
            footer={
              fieldErrors.email ? (
                <span className="text-base text-red-700">{fieldErrors.email}</span>
              ) : null
            }
          />

          <LatinField
            name="password"
            label="סיסמה"
            type={passwordInputType(passwordVisible)}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            enterKeyHint="go"
            value={password}
            onChange={setPassword}
            invalid={Boolean(fieldErrors.password)}
            // Physical right, not logical end: the field is dir="ltr" inside an
            // RTL page, so typed characters run rightwards and the button must
            // not sit on top of them. pr-16 reserves the space; the button is a
            // fixed w-14 because "הסתר" is wider than "הצג" (C-0005, measured).
            inputClassName="pr-16"
            adornment={
              <button
                type="button"
                data-password-toggle
                onClick={() => setPasswordVisible((visible) => !visible)}
                aria-pressed={passwordVisible}
                aria-label={passwordToggleLabel(passwordVisible)}
                className="absolute inset-y-0 right-0 flex min-h-touch w-14 items-center justify-center rounded-lg text-base font-medium text-ink-muted active:text-ink"
              >
                {passwordVisible ? 'הסתר' : 'הצג'}
              </button>
            }
            footer={
              fieldErrors.password ? (
                <span className="text-base text-red-700">{fieldErrors.password}</span>
              ) : (
                mode === 'signup' && (
                  <span className="text-base text-ink-muted">8 תווים לפחות.</span>
                )
              )
            }
          />

          {error && (
            <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-base text-red-800">
              {error}
              {showLoginLink && (
                <>
                  {' '}
                  <Link href={otherHref} className="font-semibold underline">
                    להתחברות
                  </Link>
                </>
              )}
            </p>
          )}
        </form>
      </div>

      {/* D-028 · F-027: the primary action is anchored to the window, not to the
          end of the content. The button already carried `form="auth-form"`, so
          leaving the <form> element costs it nothing — submission is by form id.
          The secondary link stays in normal flow: one action per bar. */}
      <div className="flex flex-col gap-4">
        <ActionBar>
          <button
            type="submit"
            form="auth-form"
            data-primary-action="true"
            disabled={busy}
            className="flex w-full min-h-touch items-center justify-center rounded-full bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90 disabled:opacity-60"
          >
            {busy ? copy.busy : copy.submit}
          </button>
        </ActionBar>

        <p className="text-center text-base text-ink-muted">
          {mode === 'signup' ? 'כבר יש לך חשבון? ' : 'אין לך עדיין חשבון? '}
          <Link
            href={otherHref}
            className="inline-flex min-h-touch items-center font-semibold text-ink underline"
          >
            {mode === 'signup' ? 'התחברות' : 'יצירת חשבון'}
          </Link>
        </p>
      </div>
    </>
  );
}
