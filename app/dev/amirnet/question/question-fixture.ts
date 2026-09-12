import type { AmirnetServedItem } from '@/lib/core/amirnetQuestion';

/**
 * T-287 — the walk fixture at 320/375/414. Asks the server for nothing.
 *
 * 🔴 ⛔ NOTHING HERE IS INVENTED, and the provenance matters more than the content (`R-010`,
 * extended to amirnet by `RULES § 0.1 ז׳`). Every string below is TRANSCRIBED, character for
 * character, from the render this screen targets — `docs/design/render_video_D.py`:
 *   · stem and the four options ⇐ `PQ` (:95-97)
 *   · the Hebrew explanation    ⇐ `screen_practice` (:170-174), the two lines it draws
 * ⇒ it is the render's own reference item, exactly as `AmirnetPracticeMenu`'s strings are the
 * render's own strings. ⛔ It is ⛔ NOT one of `41 § 6.3`'s calibration examples — that section
 * says in its own words «⛔ אין להכניס אותם למוצר ואין לייצר וריאציות שלהם», so ⛔ none of them
 * appears here, and ⛔ no variation of one was written.
 *
 * ⚠️ And it is a DEV route: `/dev/**` is ⛔ not reachable from the product and ⛔ never serves a
 * learner. The learner's items come from the content bank once it can hold them — which,
 * measured this tick, it ⛔ cannot: see `F-222`.
 *
 * ⚠️ ONE item on purpose, and it is ⛔ not laziness: the queue must be walkable to its END, and
 * `41 § 6.3` forbids borrowing a second item from the spec. ⇒ pressing `הבא` reaches
 * «אין עוד פריטים ברמה הזאת», which is the second state `T-287`ⓓ asks for.
 */
export const FIXTURE_ITEMS: readonly AmirnetServedItem[] = [
  {
    id: 'render-pq',
    type: 'rs',
    level: 3,
    stemEn:
      "The scientist's findings were so ______ that they overturned decades of accepted theory.",
    passageEn: '',
    optionsEn: ['controversial', 'ordinary', 'delayed', 'affordable'],
    correctIndex: 0,
    explanationHe:
      'controversial = שנוי במחלוקת. מילות ההמשך overturned decades מחייבות ניגוד חזק.',
  },
];
