'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api/client';
import { CLASS_CODE_ALPHABET, CLASS_CODE_LENGTH, isClassCode, normalizeClassCode } from '@/lib/core/classCode';
import { RETRY_HE } from '@/lib/core/failure';
import { failureExit, SIGN_IN_AGAIN_HE } from '@/lib/core/failureExit';

/**
 * The `הקיר` tab before and around the feed (T-469 · `39 § 2` · `39 § 4` · D-287).
 * 🎯 Render: docs/design/kol-C-10-wall-feed.png — the header `הודעות · <שם הכיתה>` over
 * `הקיר של הכיתה`; the posts themselves are T-473, ⛔ not this file.
 *
 * ⓐ no class ⇒ an empty state with exactly two actions: open a class (name ⇒ the code,
 *    big, with `העתקה`) · join by code (six cells; a paste of six characters fills all).
 * ⓑ in a class ⇒ member count + the code to share; the feed is empty until a first post.
 * ⓒ `503 classes_unavailable` ⇒ `הכיתות עוד לא פתוחות`, ⛔ not an error.
 *
 * ⚠️ The six cells are ONE `<input>` laid over six drawn boxes, ⛔ not six inputs: the
 * product gutter is `px-6` (`app/layout.tsx`), so at 320px six separate targets get
 * 42px each, under the 44px floor. One input is one 272×48 target, and paste, autofill
 * and backspace behave as the platform already does.
 */
export const WALL_HEADING_HE = 'הקיר של הכיתה';
export const WALL_KICKER_NO_CLASS_HE = 'הודעות · הקיר';
export const EMPTY_TITLE_HE = 'עוד אין לך כיתה';
export const EMPTY_SUB_HE = 'פותחים כיתה ומשתפים את הקוד, או מצטרפים בקוד שקיבלת.';
export const OPEN_CLASS_HE = 'פתיחת כיתה';
export const JOIN_BY_CODE_HE = 'הצטרפות בקוד';
export const NAME_LABEL_HE = 'שם הכיתה';
export const CREATE_SUBMIT_HE = 'פתיחה';
export const CODE_LABEL_HE = 'הקוד שקיבלת';
export const CODE_HINT_HE = 'שש אותיות וספרות. אפשר גם להדביק.';
export const JOIN_SUBMIT_HE = 'הצטרפות';
export const BACK_HE = 'חזרה';
export const SHARE_LABEL_HE = 'הקוד לשיתוף';
export const COPY_HE = 'העתקה';
export const COPIED_HE = 'הועתק';
export const FEED_EMPTY_HE = 'הקיר מתמלא כשיש פוסט ראשון';
export const CLASSES_CLOSED_HE = 'הכיתות עוד לא פתוחות';
export const NOT_FOUND_HE = 'לא מצאנו כיתה עם הקוד הזה. בדוק אותו והקלד מחדש.';
export const INVALID_NAME_HE = 'שם הכיתה צריך להיות באורך 1 עד 60 תווים.';

export interface ClassInfo {
  readonly code: string;
  readonly name: string;
  readonly members: number | null;
}

export type ClassPanelState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'none' }
  | { readonly kind: 'in_class'; readonly cls: ClassInfo }
  | { readonly kind: 'classes_unavailable' }
  | { readonly kind: 'session_expired' }
  | { readonly kind: 'error' };

type FailCode = 'session_expired' | 'classes_unavailable' | 'class_not_found' | 'invalid_name' | 'unavailable';
type MineBody = { ok: true; class: ClassInfo | null } | { ok: false; code: FailCode };
type ClassBody = { ok: true; code: string; name: string; members?: number | null } | { ok: false; code: FailCode };

/** What the learner typed or pasted ⇒ at most six characters of the code alphabet. */
export function codeInput(raw: string): string {
  return Array.from(normalizeClassCode(raw))
    .filter((ch) => CLASS_CODE_ALPHABET.includes(ch))
    .join('')
    .slice(0, CLASS_CODE_LENGTH);
}

export function membersHe(n: number | null): string {
  if (n === null) return '';
  return n === 1 ? 'חבר אחד' : `${n} חברים`;
}

export function wallKickerHe(state: ClassPanelState): string {
  return state.kind === 'in_class' ? `הודעות · ${state.cls.name}` : WALL_KICKER_NO_CLASS_HE;
}

const PRIMARY = 'flex min-h-touch w-full items-center justify-center rounded-xl bg-brand-surface px-4 text-sm font-bold text-brand-on active:scale-[0.98] disabled:opacity-50';
const SECONDARY = 'flex min-h-touch w-full items-center justify-center rounded-xl border border-brand px-4 text-sm font-bold text-brand-surface active:scale-[0.98]';
const QUIET = 'inline-flex min-h-touch items-center px-2 text-sm font-semibold text-ink-muted';

function CodeCells({ value, onChange }: { readonly value: string; readonly onChange: (v: string) => void }) {
  const cells = Array.from({ length: CLASS_CODE_LENGTH }, (_, i) => value[i] ?? '');
  return (
    <div dir="ltr" className="relative mt-2">
      <div aria-hidden className="grid grid-cols-6 gap-1">
        {cells.map((ch, i) => (
          <span
            key={i}
            data-code-cell
            className={`flex h-12 items-center justify-center rounded-xl border text-xl font-bold text-ink ${i === value.length ? 'border-brand' : 'border-ink-muted/40'} bg-surface-raised`}
          >
            {ch}
          </span>
        ))}
      </div>
      <input
        id="class-code"
        aria-describedby="class-code-hint"
        value={value}
        onChange={(e) => onChange(codeInput(e.target.value))}
        autoComplete="one-time-code"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        inputMode="text"
        maxLength={CLASS_CODE_LENGTH * 2}
        className="absolute inset-0 h-12 w-full cursor-text bg-transparent text-transparent caret-transparent opacity-0"
      />
    </div>
  );
}

export interface ClassJoinViewProps {
  readonly state: ClassPanelState;
  readonly busy?: boolean;
  readonly formError?: string | null;
  readonly onCreate?: (name: string) => void;
  readonly onJoin?: (code: string) => void;
  readonly onRetry?: () => void;
  /** The starting mode, for the dev fixture; the live screen always starts on `choose`. */
  readonly initialMode?: 'choose' | 'create' | 'join';
}

export function ClassJoinView({ state, busy = false, formError = null, onCreate = () => {}, onJoin = () => {}, onRetry = () => {}, initialMode = 'choose' }: ClassJoinViewProps) {
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (copiedTimer.current) clearTimeout(copiedTimer.current); }, []);

  if (state.kind === 'loading') {
    return (
      <div data-class-skeleton aria-busy className="mt-4 space-y-3">
        <div className="h-24 rounded-2xl bg-surface-raised" />
        <div className="h-11 rounded-xl bg-surface-raised" />
      </div>
    );
  }
  if (state.kind === 'classes_unavailable') {
    return <p data-classes-closed className="mt-4 rounded-2xl bg-surface-raised p-4 text-sm text-ink-muted">{CLASSES_CLOSED_HE}</p>;
  }
  if (state.kind === 'session_expired') {
    const exit = failureExit('session_expired');
    return <Link href={exit.href} className="mt-4 inline-flex min-h-touch items-center rounded-xl bg-brand-surface px-4 font-semibold text-brand-on">{SIGN_IN_AGAIN_HE}</Link>;
  }
  if (state.kind === 'error') {
    return <button type="button" onClick={onRetry} className="mt-4 min-h-touch rounded-xl bg-brand-surface px-4 font-semibold text-brand-on">{RETRY_HE}</button>;
  }

  if (state.kind === 'in_class') {
    const { cls } = state;
    const copy = () => {
      void navigator.clipboard?.writeText(cls.code).then(() => {
        setCopied(true);
        if (copiedTimer.current) clearTimeout(copiedTimer.current);
        copiedTimer.current = setTimeout(() => setCopied(false), 1800);
      }, () => {});
    };
    return (
      <div data-class-in className="mt-4">
        <section className="rounded-2xl bg-surface-raised p-4">
          <p className="text-sm text-ink-muted">{membersHe(cls.members)}</p>
          <p className="mt-3 text-xs text-ink-muted">{SHARE_LABEL_HE}</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <span dir="ltr" data-class-code className="font-mono text-3xl font-bold tracking-[0.2em] text-ink">{cls.code}</span>
            <button type="button" onClick={copy} className="inline-flex min-h-touch min-w-touch items-center gap-1.5 rounded-xl border border-brand px-3 text-sm font-bold text-brand-surface active:scale-[0.98]">
              <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {copied ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>}
              </svg>
              <span aria-live="polite">{copied ? COPIED_HE : COPY_HE}</span>
            </button>
          </div>
        </section>
        <p data-wall-empty className="mt-6 text-center text-sm text-ink-muted">{FEED_EMPTY_HE}</p>
      </div>
    );
  }

  // state.kind === 'none'
  if (mode === 'create') {
    return (
      <form className="mt-4 rounded-2xl bg-surface-raised p-4" onSubmit={(e) => { e.preventDefault(); onCreate(name); }}>
        <label htmlFor="class-name" className="block text-sm font-semibold text-ink">{NAME_LABEL_HE}</label>
        <input
          id="class-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          autoComplete="off"
          className="mt-2 min-h-touch w-full rounded-xl border border-ink-muted/40 bg-surface px-3 text-base text-ink"
        />
        {formError ? <p role="alert" className="mt-2 text-sm text-danger">{formError}</p> : null}
        <button type="submit" disabled={busy || name.trim().length === 0} className={`mt-4 ${PRIMARY}`}>{CREATE_SUBMIT_HE}</button>
        <button type="button" onClick={() => setMode('choose')} className={`mt-1 ${QUIET}`}>{BACK_HE}</button>
      </form>
    );
  }
  if (mode === 'join') {
    return (
      <form className="mt-4 rounded-2xl bg-surface-raised p-4" onSubmit={(e) => { e.preventDefault(); if (isClassCode(code)) onJoin(code); }}>
        <label htmlFor="class-code" className="block text-sm font-semibold text-ink">{CODE_LABEL_HE}</label>
        <CodeCells value={code} onChange={setCode} />
        <p id="class-code-hint" className="mt-2 text-xs text-ink-muted">{CODE_HINT_HE}</p>
        {formError ? <p role="alert" className="mt-2 text-sm text-danger">{formError}</p> : null}
        <button type="submit" disabled={busy || !isClassCode(code)} className={`mt-4 ${PRIMARY}`}>{JOIN_SUBMIT_HE}</button>
        <button type="button" onClick={() => setMode('choose')} className={`mt-1 ${QUIET}`}>{BACK_HE}</button>
      </form>
    );
  }
  return (
    <section data-class-none className="mt-4 rounded-2xl bg-surface-raised p-4">
      <h2 className="text-base font-bold text-ink">{EMPTY_TITLE_HE}</h2>
      <p className="mt-1 text-sm text-ink-muted">{EMPTY_SUB_HE}</p>
      <div className="mt-4 space-y-2">
        <button type="button" onClick={() => setMode('join')} className={PRIMARY}>{JOIN_BY_CODE_HE}</button>
        <button type="button" onClick={() => setMode('create')} className={SECONDARY}>{OPEN_CLASS_HE}</button>
      </div>
    </section>
  );
}

function failHe(code: FailCode): string | null {
  if (code === 'class_not_found') return NOT_FOUND_HE;
  if (code === 'invalid_name') return INVALID_NAME_HE;
  return null;
}

/** Live: reads `GET /api/world/classes/mine`, writes through the two class routes (T-468). */
export default function ClassJoin({ onState }: { readonly onState?: (s: ClassPanelState) => void }): React.JSX.Element {
  const [state, setStateRaw] = useState<ClassPanelState>({ kind: 'loading' });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const setState = useCallback((s: ClassPanelState) => { setStateRaw(s); onState?.(s); }, [onState]);

  const fromFailure = useCallback((code: FailCode): boolean => {
    if (code === 'session_expired') { setState({ kind: 'session_expired' }); return true; }
    if (code === 'classes_unavailable') { setState({ kind: 'classes_unavailable' }); return true; }
    return false;
  }, [setState]);

  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      const body = await apiGet<MineBody>('/api/world/classes/mine');
      if (!body.ok) { if (!fromFailure(body.code)) setState({ kind: 'error' }); return; }
      setState(body.class ? { kind: 'in_class', cls: body.class } : { kind: 'none' });
    } catch {
      setState({ kind: 'error' });
    }
  }, [setState, fromFailure]);
  useEffect(() => { void load(); }, [load]);

  const submit = useCallback(async (path: string, payload: unknown, fallbackMembers: number | null) => {
    setBusy(true);
    setFormError(null);
    try {
      const body = await apiPost<ClassBody>(path, payload);
      if (!body.ok) {
        if (!fromFailure(body.code)) setFormError(failHe(body.code) ?? RETRY_HE);
        return;
      }
      setState({ kind: 'in_class', cls: { code: body.code, name: body.name, members: body.members ?? fallbackMembers } });
    } catch {
      setFormError(RETRY_HE);
    } finally {
      setBusy(false);
    }
  }, [fromFailure, setState]);

  return (
    <ClassJoinView
      state={state}
      busy={busy}
      formError={formError}
      onCreate={(name) => { void submit('/api/world/classes', { name }, 1); }}
      onJoin={(code) => { void submit('/api/world/classes/join', { code }, null); }}
      onRetry={() => { void load(); }}
    />
  );
}
