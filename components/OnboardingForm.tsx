'use client';

import { useState } from 'react';
import ActionBar from '@/components/ActionBar';
import LatinField from '@/components/LatinField';
import { ApiUnreachableError, apiPost } from '@/lib/api/client';
import {
  DAILY_MINUTES_HELP_HE,
  DAILY_MINUTES_LABELS_HE,
  DAILY_MINUTES_OPTIONS,
  DAILY_MINUTES_QUESTION_HE,
  DEFAULT_DAILY_MINUTES,
  EXAM_DATE_HELP_HE,
  EXAM_DATE_QUESTION_HE,
  LEARNER_TIME_ZONE,
  ONBOARDING_SUBMIT_HE,
  TARGET_SCORE_HELP_HE,
  TARGET_SCORE_QUESTION_HE,
  toIsoDateInZone,
  type DailyMinutes,
  type OnboardingFieldErrors,
} from '@/lib/core/onboarding';

type SaveResponse = {
  readonly ok?: boolean;
  readonly next?: string;
  readonly fieldErrors?: OnboardingFieldErrors;
  readonly code?: string;
};

/**
 * T-029 — the first real question of the product.
 *
 * The order on screen is the order of the evidence: minutes per day is the
 * heading-level question (R-012), the exam date follows because 7.1 needs it,
 * and the target score is last, labelled "לא חובה", with no encouragement
 * attached to it. Nothing here shows a projected score or a readiness estimate
 * (40-decisions 4.4.3).
 *
 * Radios, not a slider or a segmented control: a radio is reachable by
 * keyboard, announced as a group by a screen reader, and each option is a real
 * 44px row without any measurement of ours.
 */
export default function OnboardingForm() {
  const [dailyMinutes, setDailyMinutes] = useState<DailyMinutes>(DEFAULT_DAILY_MINUTES);
  const [examDate, setExamDate] = useState('');
  const [targetScore, setTargetScore] = useState('');
  const [fieldErrors, setFieldErrors] = useState<OnboardingFieldErrors>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // The date picker must not offer a day the server will reject. CORRECTED
  // C-0032: with the UTC slice this comment was false for the first hours of
  // every local day — the picker floor sat a day BEHIND the server's floor and
  // offered exactly the day the route rejects. Same helper as the route.
  const todayIso = toIsoDateInZone(new Date(), LEARNER_TIME_ZONE);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setFieldErrors({});
    setFormError('');
    try {
      const result = await apiPost<SaveResponse>('/api/profile', {
        dailyMinutes,
        examDate,
        targetScore,
      });
      if (result.ok && result.next) {
        window.location.assign(result.next);
        return;
      }
      if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      else setFormError('השמירה נכשלה. נסה שוב.');
    } catch (error) {
      setFormError(
        error instanceof ApiUnreachableError
          ? 'אין חיבור לרשת. התשובות לא נשמרו.'
          : 'השמירה נכשלה. נסה שוב.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      id="onboarding-form"
      onSubmit={onSubmit}
      className="flex flex-col gap-6"
      data-onboarding-form
    >
      <fieldset className="flex flex-col gap-2 border-0 p-0" data-daily-minutes>
        <legend className="text-lg font-semibold text-ink">{DAILY_MINUTES_QUESTION_HE}</legend>
        <p className="text-base text-ink-muted">{DAILY_MINUTES_HELP_HE}</p>
        <div className="flex flex-col gap-2">
          {DAILY_MINUTES_OPTIONS.map((option) => (
            <label
              key={option}
              className="flex min-h-touch cursor-pointer items-center gap-3 rounded-xl border border-border-strong bg-surface-raised px-4 py-3 text-lg text-ink"
            >
              <input
                type="radio"
                name="daily_minutes"
                value={option}
                checked={dailyMinutes === option}
                onChange={() => setDailyMinutes(option)}
                className="h-5 w-5 accent-brand"
              />
              <span>{DAILY_MINUTES_LABELS_HE[option]}</span>
            </label>
          ))}
        </div>
        {fieldErrors.dailyMinutes && (
          <p className="text-base text-danger">{fieldErrors.dailyMinutes}</p>
        )}
      </fieldset>

      <label className="flex flex-col gap-1.5">
        <span className="text-lg font-semibold text-ink">{EXAM_DATE_QUESTION_HE}</span>
        <span className="text-base text-ink-muted">{EXAM_DATE_HELP_HE}</span>
        <input
          type="date"
          name="exam_date"
          value={examDate}
          min={todayIso}
          onChange={(event) => setExamDate(event.target.value)}
          className="min-h-touch w-full rounded-xl border border-border-strong bg-surface-raised px-4 py-3 text-lg text-ink outline-none focus:border-brand"
        />
        {fieldErrors.examDate && <span className="text-base text-danger">{fieldErrors.examDate}</span>}
      </label>

      <LatinField
        name="target_score"
        label={TARGET_SCORE_QUESTION_HE}
        type="text"
        value={targetScore}
        onChange={setTargetScore}
        autoComplete="off"
        enterKeyHint="go"
        inputMode="numeric"
        invalid={Boolean(fieldErrors.targetScore)}
        footer={
          <span
            className={fieldErrors.targetScore ? 'text-base text-danger' : 'text-base text-ink-muted'}
          >
            {fieldErrors.targetScore ?? TARGET_SCORE_HELP_HE}
          </span>
        }
      />

      {formError && <p className="text-base text-danger">{formError}</p>}

      {/* F-027: the marker, not document order, is what tells check:mobile which
          control moves the learner forward. Without it the harness falls back to
          the first button in <main> — here the address band's correction link,
          the same substitution that made it measure the password toggle on
          /login. */}
      {/* D-028 · F-027: this is the exact button roy could not find — measured at
          y=852 on a 780px viewport. It leaves the <form> element and gains
          `form="onboarding-form"`, which is how a submit control outside its
          form still submits it (the same wiring AuthForm already used). */}
      <ActionBar>
        <button
          type="submit"
          form="onboarding-form"
          data-primary-action="true"
          disabled={saving}
          className="flex w-full min-h-touch items-center justify-center rounded-xl bg-brand px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90 disabled:opacity-60"
        >
          {saving ? 'שומר…' : ONBOARDING_SUBMIT_HE}
        </button>
      </ActionBar>
    </form>
  );
}
