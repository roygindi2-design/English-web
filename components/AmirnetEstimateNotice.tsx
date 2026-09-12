/**
 * `T-304` — the sentence both amirnet number screens must carry, and it is a REQUIREMENT
 * (`41 § 6.1` items 4-5), ⛔ not a wording preference.
 *
 * 🔬 What was measured in the live walk of `C-0549` (`next start`, 375×780), ⛔ not supposed:
 * `/dev/amirnet/result` prints «תשובות נכונות: 18 מתוך 23» plus a per-chapter breakdown under the
 * real exam's own question-type names, and `/dev/amirnet/dashboard` prints `78% · 54% · 67%` beside
 * `Sentence Completion`/`Restatement`/`Reading`. ⇒ **both screens read like an exam report**, and
 * `grep -rn "אומדן פנימי\|אינו ציון" app/ components/ lib/` returned **zero**.
 * 🔴 The failure scenario: a learner reads «18 מתוך 23», takes it for a calibrated readiness
 * estimate, and walks into the real exam on a number ⛔ nobody calibrated.
 *
 * ⛔ THE WORDING IS `D-218`'S, WORD FOR WORD, and it is ⛔ not re-written here. It carries BOTH
 * halves of `41 § 6.1` on purpose: item 4 («an internal practice estimate, said explicitly») and
 * item 5 («⛔ never imply affiliation, endorsement or a connection to מאל״ו»). One of the two is
 * ⛔ not enough.
 *
 * ── ONE constant, ONE component, TWO screens (constitution § 6). The measured precedent for a
 *    presentation module shared by both amirnet screens is `components/amirnetTypeBar.ts`, and
 *    the same argument applies: the same sentence written twice can only drift.
 * ── ⛔ NOT `lib/core/**`: a string and a Tailwind class are presentation. (It is also ⓓ of
 *    `STEP 5.5` — the blast-radius line.)
 * ── **ABOVE the numbers, ⛔ never below them** (`D-218` item 1). A disclaimer a learner reaches
 *    after they have already read «18 מתוך 23» arrives after the inference it exists to prevent.
 * ── `text-sm` (14px), ⛔ not a footnote. `check:text-floor`'s floor is 12px; this is deliberately
 *    a step above it, because `D-218` item 1 says in so many words that it is ⛔ not fine print.
 * ── ⛔ No em-dash in the copy (`taste-skill`, the em-dash chapter — banned in labels and in body
 *    text alike). Two sentences and a full stop, ⛔ not a graphic separator.
 * ── ⛔ No `title=`, ⛔ no tooltip, ⛔ no disclosure: a hover-only affordance ⛔ does not exist on a
 *    phone, and this sentence has to be readable without any interaction at all.
 * ── `role="note"` so a screen reader announces it as an aside on the same screen, ⛔ not as a
 *    live region: it is standing context, ⛔ not something that just happened.
 * ── ⛔ Draws only. ⛔ No arithmetic, ⛔ no fetch, ⛔ no state. It ⛔ does not touch the number, the
 *    query or the calculation, and it ⛔ does not build the estimate dial (`41 § 9.2` is Roy's
 *    formula, `03-for-roy` item 73).
 */

/** `D-218`, verbatim. ⛔ Never re-phrased at a call site, and ⛔ never split in two. */
export const ESTIMATE_NOTICE_HE =
  'אומדן פנימי לתרגול בלבד. אינו ציון של מאל״ו, ואין לנו זיקה אליו.';

export default function AmirnetEstimateNotice() {
  return (
    <p role="note" className="mt-4 text-sm text-ink-muted">
      {ESTIMATE_NOTICE_HE}
    </p>
  );
}
