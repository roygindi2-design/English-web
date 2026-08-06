'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ApiUnreachableError, apiPost } from '@/lib/api/client';
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
      setError(
        cause instanceof ApiUnreachableError ? AUTH_MESSAGES_HE.unavailable : AUTH_MESSAGES_HE.unavailable
      );
    } finally {
      setBusy(false);
    }
  }

  const otherMode = mode === 'signup' ? 'login' : 'signup';
  const otherHref = `/${otherMode}${email ? `?email=${encodeURIComponent(email)}` : ''}`;

  return (
    <>
      <div className="flex flex-1 flex-col justify-center gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold leading-tight">{copy.title}</h1>
          <p className="text-lg leading-relaxed text-slate-600">{copy.lead}</p>
        </div>

        {offline && (
          <p role="status" className="rounded-xl bg-amber-50 px-4 py-3 text-base text-amber-900">
            צריך חיבור כדי להיכנס
          </p>
        )}
        {notice && (
          <p role="status" className="rounded-xl bg-sky-50 px-4 py-3 text-base text-sky-900">
            {notice}
          </p>
        )}

        <form id="auth-form" className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
          <label className="flex flex-col gap-1.5">
            <span className="text-base font-medium text-slate-700">אימייל</span>
            {/* Latin content inside a Hebrew UI — dir="ltr" so the caret and the
                @ sign sit where the learner expects them (MF-3, bidi). */}
            <input
              type="email"
              name="email"
              dir="ltr"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(fieldErrors.email)}
              className="min-h-touch rounded-xl border border-slate-300 bg-white px-4 py-3 text-left text-lg text-slate-900 outline-none focus:border-slate-900"
            />
            {fieldErrors.email && <span className="text-base text-red-700">{fieldErrors.email}</span>}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-base font-medium text-slate-700">סיסמה</span>
            <div className="relative">
              <input
                type={passwordInputType(passwordVisible)}
                name="password"
                dir="ltr"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                autoCapitalize="none"
                spellCheck={false}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(fieldErrors.password)}
                className="min-h-touch w-full rounded-xl border border-slate-300 bg-white py-3 pl-4 pr-16 text-left text-lg text-slate-900 outline-none focus:border-slate-900"
              />
              {/* Physical right, not logical end: the field is dir="ltr" inside
                  an RTL page, so the typed characters run towards the right and
                  the button must not sit on top of them. Fixed w-14 rather than
                  auto width — "הסתר" is wider than "הצג" and an auto-width
                  button in the wider state ate into the field's pr-16. */}
              <button
                type="button"
                data-password-toggle
                onClick={() => setPasswordVisible((visible) => !visible)}
                aria-pressed={passwordVisible}
                aria-label={passwordToggleLabel(passwordVisible)}
                className="absolute inset-y-0 right-0 flex min-h-touch w-14 items-center justify-center rounded-xl text-base font-medium text-slate-600 active:text-slate-900"
              >
                {passwordVisible ? 'הסתר' : 'הצג'}
              </button>
            </div>
            {fieldErrors.password ? (
              <span className="text-base text-red-700">{fieldErrors.password}</span>
            ) : (
              mode === 'signup' && (
                <span className="text-base text-slate-500">8 תווים לפחות. בלי כללים נוספים.</span>
              )
            )}
          </label>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-base text-red-800">
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

      {/* Primary action in the lower half of the screen — MF-5, thumb reach. */}
      <div className="flex flex-col gap-4">
        <button
          type="submit"
          form="auth-form"
          disabled={busy}
          className="flex min-h-touch items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-lg font-semibold text-white active:bg-slate-700 disabled:bg-slate-400"
        >
          {busy ? copy.busy : copy.submit}
        </button>

        <p className="text-center text-base text-slate-600">
          {mode === 'signup' ? 'כבר יש לך חשבון? ' : 'אין לך עדיין חשבון? '}
          <Link
            href={otherHref}
            className="inline-flex min-h-touch items-center font-semibold text-slate-900 underline"
          >
            {mode === 'signup' ? 'התחברות' : 'יצירת חשבון'}
          </Link>
        </p>
      </div>
    </>
  );
}
