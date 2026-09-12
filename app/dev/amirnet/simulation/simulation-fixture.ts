import type { AmirnetServedItem } from '@/lib/core/amirnetQuestion';

/**
 * `T-296` — the walk fixture for `STEP 6.5`, at 320/375/414. Asks the server for ⛔ nothing.
 *
 * 🔴 ⛔ NOTHING HERE IS INVENTED, and the provenance matters more than the content (`R-010`,
 * extended to amirnet by `RULES § 0.1 ז׳`). Every string below is TRANSCRIBED, character for
 * character, from the render this screen targets — `docs/design/render_video_D.py` `SQ` (:249-251):
 * the two stem lines and the four options are the render's own reference item for `screen_sim`.
 * ⇒ same provenance `app/dev/amirnet/question/question-fixture.ts` already declares for `PQ`.
 * ⛔ It is ⛔ NOT one of `41 § 6.3`'s calibration examples — that section says in its own words
 * «⛔ אין להכניס אותם למוצר ואין לייצר וריאציות שלהם» ⇒ ⛔ none appears here and ⛔ no variation of
 * one was written.
 *
 * ⚠️ **ONE item, and that is a MEASUREMENT and ⛔ not laziness.** Chapter 1 of `41 § 2` holds four
 * questions, and the render supplies exactly **one** item. `41 § 6.3` forbids borrowing a second
 * from the spec, and the bank that would hold real ones is blocked — `F-222` on the schema, `T-297`
 * still ⬜ ⇒ there is ⛔ no honest source for items two to four. The screen therefore shows its
 * written «אין פריטים לפרק הזה» state for them, which is also what makes the walk able to reach the
 * chapter boundary and measure the one thing `T-296` exists for: the next chapter's clock starting
 * at its own full value.
 *
 * ⚠️ And it is a DEV route: `/dev/**` is ⛔ not reachable from the product and ⛔ never serves a
 * learner. `simulation` is still «טרם» in `AMIRNET_BUILT_TABS` for exactly that reason.
 *
 * ⚠️ The explanation field is required by `AmirnetServedItem` and `isServable()`, and the
 * simulation shows ⛔ no feedback and therefore ⛔ never renders it — an exam does not grade each
 * answer as it lands. It carries the render's own explanation line so the item still passes the
 * same gate a practice item passes, ⛔ rather than a string written to satisfy a validator.
 */
export const SIMULATION_FIXTURE_ITEMS: readonly AmirnetServedItem[] = [
  {
    id: 'render-sq',
    type: 'sc',
    level: 3,
    stemEn:
      'Although the treaty was signed in 1919, its economic effects ______ for two decades.',
    passageEn: '',
    optionsEn: ['reverberated', 'concluded', 'assembled', 'diminished'],
    correctIndex: 0,
    explanationHe:
      'reverberated = הוסיפו להדהד. הניגוד ש-Although פותח מחייב פועל שממשיך על פני שני עשורים.',
  },
];
