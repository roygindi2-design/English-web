/**
 * The screen-level failure copy — pure. No React, no DOM, no network, no env.
 *
 * T-056: one Hebrew sentence and one "נסה שוב", everywhere. At plan time the
 * product had four wordings for the same event across four files, and a learner
 * who hits two of them cannot tell whether they met one problem or two.
 *
 * ⛔ This is NOT the field-error map. `AUTH_MESSAGES_HE` (lib/core/auth.ts)
 * answers "what did I type wrong", which is information the learner needs in
 * order to fix it; collapsing that into "משהו נתקע" would delete it. This module
 * answers "the product failed, not you" — a different sentence for a different
 * event.
 *
 * ⛔ No error code, no digest, no English: constitution § 2, and RULES' rule
 * that an Israeli learner never faces a raw error string.
 */
export const RETRY_HE = 'נסה שוב';

export const FAILURE_HE = Object.freeze({
  /** A write the learner initiated did not land. */
  save: 'השמירה נכשלה. נסה שוב.',
  /** A read the screen needed did not arrive. */
  load: 'לא הצלחנו לטעון את הנתונים כרגע.',
  /** The request never left the device — say so, because it is fixable. */
  offline: 'אין חיבור לרשת. הנתונים לא נשמרו.',
  /** A crash. The learner's work is safe, and saying so is the whole point. */
  crash: 'התקלה אצלנו, לא אצלך. ההתקדמות שלך לא נפגעה.',
});

export const FAILURE_TITLE_HE = Object.freeze({
  route: 'משהו נתקע',
  app: 'האפליקציה לא נטענה',
});
