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

/**
 * T-273 · the set-up failure — migration 0013 has not run, and Roy has to run it.
 * ⛔ Not in `FAILURE_HE`: that map is "the product failed, not you" with a full
 * stop, and every screen chooses between the two by `code`. Until 06/09 eleven
 * files under `app/` + `components/` each declared this sentence for themselves
 * (measured, C-0477) — one sentence, one place, exactly as `RETRY_HE` above.
 * The API routes send the same words in their JSON `message` (the contract),
 * and the screens print THIS constant, ⛔ never the response body.
 */
export const SCHEMA_MISSING_HE = 'המאגר עדיין לא הוקם';

/**
 * `T-384`ⓑ · closes `F-138`ⓑ — the session ran out, and the learner has to sign in again.
 *
 * ⛔ Not in `FAILURE_HE`: that map is «the product failed, not you», and an expired session
 * is neither a failure of the product nor of the learner — it is a state with one exit.
 * ⇒ its own constant, in the one place the screens read it from, exactly as
 * `SCHEMA_MISSING_HE` was collapsed here in `C-0477`.
 *
 * 🔬 **Measured `C-0647`, and the number had grown since `F-138`ⓑ was filed:** this exact
 * sentence was declared locally in THREE files — `app/(tabs)/settings/page.tsx:60`,
 * `components/LevelScan.tsx:41`, `components/LevelMapScreen.tsx:60`. Three declarations of
 * one sentence is three places for it to drift, and `T-056` exists because that is what
 * happened last time.
 *
 * ⛔ **And the two Amirnet wordings are ⛔ deliberately NOT collapsed into this**
 * (`AmirnetSimulationEntry.tsx` · `AmirnetDashboardLive.tsx`): they name what the learner
 * was about to do («כדי להתחיל סימולציה» · «כדי לראות את הביצועים שלך»), which is
 * information this sentence does not carry. A different sentence for a different screen is
 * `T-056`'s own rule, ⛔ not a violation of it.
 */
export const SESSION_EXPIRED_HE = 'ההתחברות פגה. היכנס שוב.';

/**
 * T-274 · D-195 — the request never left the device on a login / signup attempt
 * (`ApiUnreachableError`, lib/api/client.ts). Until 07/09 that branch in
 * `AuthForm` printed `AUTH_MESSAGES_HE.unavailable` — a sentence that sounds
 * like "what you typed is wrong" — so a learner whose network dropped guessed
 * the fault was theirs. This one names the cause and says what a retry does.
 * ⛔ Not `FAILURE_HE.offline`: its «הנתונים לא נשמרו» is false for a login,
 * where nothing was ever going to be saved. ⛔ And no second button: the submit
 * button IS the retry (taste-skill § 4.5 — one CTA per intent), so the sentence
 * says so instead.
 */
export const UNREACHABLE_HE =
  'הבקשה לא הגיעה אלינו בגלל בעיה ברשת. הפרטים שהקלדת נשארו כאן — כשהחיבור יחזור, לחץ שוב על הכפתור.';

export const FAILURE_TITLE_HE = Object.freeze({
  route: 'משהו נתקע',
  app: 'האפליקציה לא נטענה',
});
