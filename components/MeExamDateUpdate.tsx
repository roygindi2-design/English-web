'use client';

/**
 * T-352 · the one way to replace an exam date that has already passed.
 *
 * 🔬 Measured in C-0614: `<MeScreen>` said «תאריך המבחן שרשום כאן כבר עבר.» and
 * offered ⛔ nothing — `/onboarding` redirects a learner who already finished it
 * (`app/onboarding/page.tsx`), so the product had 0 update paths for a value it
 * itself refuses to accept (`examDatePast` in `checkOnboarding`).
 *
 * ⛔ No new route and ⛔ no schema change: this posts to the SAME `POST /api/profile`
 * the onboarding form uses. That route validates all three answers together, so the
 * two this control does ⛔ not edit travel back exactly as `GET /api/profile` returned
 * them — `dailyMinutes` and `targetScore` — and are rewritten with their own values.
 *
 * ⛔ A failed write is never silent: the route's own Hebrew field error when it has
 * one, a generic Hebrew sentence otherwise, and the button stays live for a retry.
 */
import { useState } from 'react';

import { ApiUnreachableError, apiPost } from '@/lib/api/client';
import type { DailyMinutes } from '@/lib/core/onboarding';

const NEW_DATE_LABEL_HE = 'תאריך מבחן חדש';
const SAVE_HE = 'עדכון התאריך';
const SAVING_HE = 'שומר…';
const SAVE_FAILED_HE = 'לא הצלחנו לשמור את התאריך. אפשר לנסות שוב.';
const OFFLINE_HE = 'אין חיבור כרגע. אפשר לנסות שוב.';

type SaveResponse =
  | { readonly ok: true; readonly next: string }
  | { readonly ok: false; readonly code?: string; readonly fieldErrors?: { readonly examDate?: string } };

export default function MeExamDateUpdate({
  dailyMinutes,
  targetScore,
  today,
  onSaved,
}: {
  readonly dailyMinutes: DailyMinutes;
  readonly targetScore: number | null;
  /** The learner's calendar day (`LEARNER_TIME_ZONE`), read by the caller — the input's `min`. */
  readonly today: string;
  readonly onSaved: (examDate: string) => void;
}): React.JSX.Element {
  const [examDate, setExamDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (examDate === '' || saving) return;
    setSaving(true);
    setError(null);
    try {
      const result = await apiPost<SaveResponse>('/api/profile', {
        dailyMinutes,
        examDate,
        targetScore: targetScore === null ? '' : String(targetScore),
      });
      if (result.ok) {
        onSaved(examDate);
        return;
      }
      setError(result.fieldErrors?.examDate ?? SAVE_FAILED_HE);
    } catch (caught) {
      setError(caught instanceof ApiUnreachableError ? OFFLINE_HE : SAVE_FAILED_HE);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form data-exam-update onSubmit={save} className="flex flex-col gap-2 pt-2">
      <label className="flex flex-col gap-1.5">
        <span className="text-base font-semibold text-ink">{NEW_DATE_LABEL_HE}</span>
        <input
          type="date"
          name="exam_date"
          value={examDate}
          min={today}
          required
          onChange={(event) => setExamDate(event.target.value)}
          className="min-h-touch w-full rounded-md border border-border-strong bg-surface-raised px-4 py-3 text-lg text-ink outline-none focus:border-brand"
        />
      </label>
      {error !== null && (
        <p role="alert" className="text-base text-danger">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={examDate === '' || saving}
        className="flex w-full min-h-touch items-center justify-center rounded-lg border border-border-strong bg-surface-raised px-5 py-3 text-lg font-semibold text-ink active:opacity-90 disabled:opacity-60"
      >
        {saving ? SAVING_HE : SAVE_HE}
      </button>
    </form>
  );
}
