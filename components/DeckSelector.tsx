'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import LockIcon from '@/components/LockIcon';
import UnknownMarkIcon from '@/components/UnknownMarkIcon';
import { apiGet } from '@/lib/api/client';
import {
  DECK_ALL_EMPTY_ACTION_HE,
  DECK_ALL_EMPTY_BODY_HE,
  DECK_ALL_EMPTY_HREF,
  DECK_ALL_EMPTY_TITLE_HE,
  allTilesDead,
} from '@/lib/core/deckTiles';

/**
 * The «דרכים לתרגל» block of the כרטיסיות tab — the deck selector, T-065 part ג׳, plan
 * `2026-08-13-study-queue.md` task 7.
 *
 * ⛔ This component is NOT the screen. Since T-081 the screen is `<LevelMapScreen>` (§ 4.2ז),
 * and this block is its fourth row. It therefore carries ⛔ no `<h1>` of its own — the screen
 * owns the single `<h1>` («הרמה שלך») and hands this block an `<h2>`. Two `<h1>` on one screen
 * break the heading hierarchy for a screen reader.
 *
 * It replaces the shared empty state this screen used to render. That state was honest
 * while `/study` had no queue behind it; now that `GET /api/study/queue` answers, «אין
 * כרטיסיות» on this tab would be a claim about the whole product made from no measurement
 * at all — this screen never read a deck. The tab's job in § 4.2ו is to say what there is
 * to study and how much of it, and that is a number per deck.
 *
 * `/dev/tabs/cards` renders THIS component and not a copy of its markup: `/cards` is in
 * `PROTECTED_SCREENS` (proxy.ts) and answers 307 to `/login?expired=1` without Supabase
 * env, so the harness would otherwise measure the login screen while printing "ok /cards"
 * — F-027 cause 1, measured live in C-0075. A fixture that drifts from the screen it stands
 * for is cause 2.
 *
 * Four decisions here are the task's rules, not taste:
 *
 * 1. **`limit=1`, and the number read is `total`.** The contract fixes `total` as the count
 *    BEFORE the slice to `limit` (`docs/api-contract.md`), which is the only reason one row
 *    is enough — ⛔ a whole deck is never pulled for a number. Reading `cards.length`
 *    instead would print "1" for every non-empty deck: always wrong, never obviously wrong.
 *
 * 2. **Three cards, always three.** § 4.2ו: an empty deck is DISABLED WITH ITS NUMBER and
 *    ⛔ never hidden. A selector that grows and shrinks leaves a learner unable to tell
 *    whether the product changed or they did, and «לא ידעתי · 0» is itself information —
 *    it says the drill deck is clear.
 *
 * 3. **The sentences deck OPENS — `T-199ⓐ` · `D-169`.** It goes through `toEntry` like the
 *    other three: an empty band is DISABLED WITH ITS NUMBER (§ 4.2ו), ⛔ never locked.
 *
 * 4. **A failed read SAYS SO — ⛔ once, above the list, ⛔ and ⛔ not on every tile.**
 *    ⟦`T-295` · `D-214` (12/09) replaced «a failed read leaves all three disabled reading
 *    «—» and shows ⛔ no error screen», which a live walk measured wrong (C-0530 · C-0535):
 *    three dead tiles reading «—» next to one live tile look like an intact screen.
 *    ⟦`T-384` (16/09) then measured the overshoot: `C-0647` counted **5 visible failure
 *    strings in 3 wordings** for ONE event on this screen. ⇒ the CHANNEL `T-295` built
 *    stays — `recoveryBlock` above the list, and the `role="status"` region of `T-322` —
 *    and the per-tile sentence goes.⟧ Two states now, in text (layer A — ⛔ never colour):
 *      `ok`        the number was read. **`0` stays `0`** — an empty deck is not a failure.
 *      ⛔ no number the read failed, or ⛔ no read was made here ⇒ «—», ⛔ and the event is
 *                  narrated ⛔ once, above. ⛔ «—» is still ⛔ not `0`.
 *
 * ⛔ No `<ActionBar>` — D-028 forbids two bottom-anchored bars on one screen and this screen
 * carries the tab bar. ⚠️ **But there IS a way out of the failure now** (`T-295`ⓑ ·
 * `ui-ux-pro-max` § Feedback, «Error Recovery — ⛔ error without recovery path»): one
 * `טעינה מחדש` control, ≥44px, that re-runs the three reads in place. It is ⛔ not a fourth
 * deck and ⛔ not an error screen — the tiles stay, with their numbers, exactly as § 4.2ו
 * requires. ⛔ A page refresh is ⛔ not a way out: it is not a control, and a learner who
 * does not know something failed has no reason to perform it.
 */

/** ⛔ Not `0`. A count we do not have is not a count of zero. */
const UNKNOWN_COUNT_HE = '—';
/**
 * `T-392` — ⛔ **the sentence a screen reader hears while the numbers are still in flight.**
 *
 * The same idiom `<CardSkeleton>` already ships: the bar is `aria-hidden` decoration and a
 * live region carries the word. ⛔ `aria-busy` on the list says «this is changing»; it ⛔ does
 * ⛔ not say what is coming, and it is ⛔ not read at all by a learner who can see.
 */
const COUNTS_LOADING_HE = 'טוען את מספרי החפיסות…';
/**
 * `T-384`ⓐ — ⛔ **`READ_FAILED_NOTE_HE` was DELETED here, and the deletion is the row.**
 *
 * 🔬 **Measured `C-0647` in a live walk at 375×780 on `/dev/tabs/cards`, ⛔ not read off
 * the code:** four reads of `/api/study/queue` came back 503 and this ONE event was
 * narrated by **five** visible strings in **three** wordings — `READ_FAILED_BODY_HE`
 * once, `READ_FAILED_NOTE_HE` three times (one per tile), and `FAILURE_HE.load` once in
 * `<UnknownList>`. ⇒ a learner cannot tell whether they met one problem or three, and
 * pressing «טעינה מחדש» tells them nothing about which of the three it applies to.
 *
 * ⛔ **And this is exactly the failure `T-056` already measured and fixed** —
 * `lib/core/failure.ts` collapsed four wordings into one module, and the screen then
 * unfolded them again one layer above it.
 *
 * ⇒ **one wording and one way out, ABOVE the tiles**, where `T-349` already put them. The
 * tiles keep their «—» — «disabled WITH the number» (§ 4.2ו) is ⛔ not «locked» — and
 * ⛔ lose the repeated sentence: **a number that was not read is «—», ⛔ not a message.**
 *
 * ⚠️ **This SUPERSEDES `T-295`ⓐ's ««—» stopped meaning two things», ⛔ and does not
 * contradict its reasoning.** `T-295` was answering «⛔ nothing on screen says anything
 * broke» — and the answer it built is still here, in `recoveryBlock` and in the
 * `role="status"` region of `T-322`. What `C-0647` measured is that the sentence was
 * *additionally* stamped onto every tile, which is where the count of five came from.
 * ⇒ the channel survives; the repetition does not.
 *
 * ⚠️ `taste-skill § 4.5` («NO DUPLICATE CTA INTENT — one label per intent, a Pre-Flight
 * Fail otherwise») is the same rule one level up: **one event, one wording.** ⛔ Its
 * § 14 em-dash ban ⛔ does ⛔ not reach «—» here — that glyph is a measured product token
 * (`D-096` · `render_video_A.py:290,296`), and a gate beats a design skill
 * (`35-design-constitution.md § 5`).
 */
/**
 * `T-295`ⓑ — the way out. ⚠️ **Noun form, ⛔ not an imperative:** the product's own actions
 * are `פתיחת הכרטיסיות` · `שינוי רמה`, and an imperative in Hebrew carries a gender the
 * product does not know.
 */
const RETRY_ACTION_HE = 'טעינה מחדש';
const READ_FAILED_BODY_HE = 'חלק מהנתונים לא הגיעו מהשרת.';
/**
 * ⚠️ **C-0321 — «נעול» עברה משורת ההערה ל-`sr-only` ליד שם האריח, ⛔ והיא ⛔ לא נמחקה.**
 *
 * D-096 קובעת שאריח מושבת **בלי מספר** אינו מצב חוקי, ו-`render_video_A.py:290,296` מצייר
 * כל אריח כ-`<מספר> <צירוף שם>` ⇒ השורה השנייה של «משפטים» חייבת להיות המספר. אבל
 * `LockIcon` הוא `aria-hidden`, ולכן מחיקת המילה הייתה משאירה את **הנעילה** בלי שום ערוץ
 * שקורא מסך שומע — וזו בדיוק חוקה שכבה A. ⇒ המילה נשארת, במקום שאינו נראה ואינו נמדד
 * ברנדר, ו⛔ אינה גורעת פיקסל מהפריסה שהרנדר מחייב.
 *
 * ⛔ אותו טיפול חל על «סינון מילים», שנעילתה (F-140) הייתה חסרת מילה מאז C-0318.
 */
const LOCKED_HE = 'נעול';
const DUE_LABEL_HE = 'מנת היום';
/**
 * T-210 · `36 § 5`. ⚠️ **Renamed from «לא ידעתי», and the rename is the point:** since
 * T-210 the SAME two words are the middle COUNTER on this screen («ידעתי · לא ידעתי ·
 * לא סוננו»), and one phrase naming two different things on one screen is the constitution
 * § 6 failure. `36 § 5` calls the deck `חזרה`, so the deck is `חזרה`.
 */
const PRACTICE_LABEL_HE = 'חזרה';
const LEVEL_LABEL_HE = 'סינון מילים';
const SENTENCES_LABEL_HE = 'משפטים';

/**
 * The second line of each tile — `36 § 5` and `render_video_A.py:288-293` draw a tile as
 * a NAME and a sentence carrying the number, ⛔ not as a bare digit in the corner.
 * ⛔ «—» still travels when the count is unknown, in the sentence's place.
 */
const LEVEL_NOTE_HE = (n: string) => `${n} מילים שעוד לא סוננו`;
/**
 * T-199ⓑ · C-0321 — **המספר שמחליף את המנעול.**
 *
 * ⛔ ⛔ זו ⛔ אינה החלטת עיצוב: `render_video_A.py:290,296` מצייר כל אריח כ-`<מספר> <צירוף
 * שם>`, ואריח «משפטים» היה **האריח היחיד במסך** שהשורה השנייה שלו ⛔ אינה מספר. D-096 כבר
 * מדדה את המצב הזה כמצב לא חוקי ב-22/08, ו-D-097 מדדה ב-23/08 ששני תנאי השחרור של D-035
 * **מולאו**. ⇒ המספר קיים, והוא מוצג.
 *
 * ⛔ «—» עדיין נוסע במקום המספר כשהקריאה נכשלת — ⛔ הוא ⛔ אינו `0`.
 */
const SENTENCES_NOTE_HE = (n: string) => `${n} משפטים ברמה שלך`;
const PRACTICE_NOTE_HE = (n: string) => `${n} מילים שסימנת לא ידעתי`;
const DUE_NOTE_HE = (n: string) => `${n} כרטיסיות להיום`;

/** Written out rather than built from a template so the requests are readable as what
 *  they are: one row each, because only `total` is wanted. */
const DUE_QUERY = '/api/study/queue?deck=due&limit=1';
/**
 * `T-385`ⓐ — ⛔ **`UNKNOWN_QUERY` נמחקה מכאן, ⛔ ולא הוחלפה.**
 *
 * 🔬 **נמדד `C-0647` ברשת חיה:** טעינת `/dev/tabs/cards` ירתה **ארבע** בקשות לאותו
 * endpoint, ו-`deck=unknown` הופיע ב**שתיים** — `limit=1` מכאן ו-`limit=50`
 * מ-`<UnknownList>` — ושני הרכיבים החזיקו כל אחד `failed` משלו על אותו אירוע. ⇒ קריאה
 * אחת יכלה להצליח והשנייה ⛔ לא, והמסך היה אומר על חפיסה אחת שני דברים סותרים באותו רגע.
 *
 * ⇒ המספר מגיע עכשיו כ-prop מ-`<LevelMapScreen>`, **בדיוק כמו `unseen` מאז `T-210`**
 * («המספר שייך למסך, ⛔ לא לבלוק»). ⛔ אופציונלי, ⇒ `/dev/tabs/probe` ממשיך לרנדר
 * ‏`<DeckSelector />` בלי props ומקבל «—».
 */
/**
 * ⚠️ `limit=1` ⛔ ואינו מקצץ את המונה: `total` נספר **לפני** החיתוך בכל ארבע החפיסות
 * (`docs/api-contract.md`), וזו הסיבה היחידה שאריח יכול לקרוא מספר בשורה אחת.
 */
const SENTENCES_QUERY = '/api/study/queue?deck=sentences&limit=1';

type QueueResponse =
  | { readonly ok: true; readonly total: number }
  | { readonly ok: false; readonly code: string };

/** `T-385` — ⛔ `unknown` ⛔ אינו כאן עוד: הוא נקרא פעם אחת, במסך. */
type DeckCounts = {
  readonly due: number | null;
  readonly sentences: number | null;
};

/**
 * `T-385`ⓐ — מה שהמסך מוסר על חפיסת `unknown`. ‏`failed` נוסע כשדה ⛔ ואינו נגזר
 * מ-`total === null`: בזמן שהקריאה באוויר `total` הוא `null` ו⛔ שום דבר ⛔ עוד לא
 * נכשל — אותה הבחנה בדיוק ש-`readFailed` עושה כאן למטה עבור `due` ו-`sentences`.
 * ⛔ **`undefined` ⛔ אינו «נכשל»** — הוא «⛔ לא נעשתה קריאה», וזה מצבו של
 * `/dev/tabs/probe` ושל כל ענף שאינו `ready`.
 */
type UnknownDeckProp = {
  readonly total: number | null;
  readonly failed: boolean;
  readonly loading: boolean;
};

/**
 * `enabled: true` carries a non-null `href` in the type itself, so the enabled branch of the
 * render cannot be handed a card with nowhere to go — the lock is checked by the compiler
 * and not by a reader.
 */
type DeckEntry = {
  readonly key: string;
  readonly label: string;
  readonly note: string;
  /**
   * ⛔ **`locked` and `enabled: false` are ⛔ NOT the same fact.** An empty deck is disabled
   * WITH its number and is ⛔ not locked (§ 4.2ו); a locked deck is one the product has not
   * opened yet. The lock mark follows THIS flag — ⛔ never the note's text, which was the
   * coupling that made `«נעול»` a magic string.
   */
  readonly locked?: boolean;
  /**
   * `T-388` — ⛔ **נגזר מהחפיסה, ⛔ ולא מהמפתח בתוך ה-JSX.** הרנדר
   * `docs/design/kol-A-02-deck.png` מצייר את «חזרה» בגוון האזהרה ועם ✕ — כי זו
   * החפיסה של מה ש**נכשל**, ⛔ ולא עוד רשימה. ⛔ הגוון שייך ל**ישות**, כך שה-JSX
   * ⛔ אינו מחזיק `entry.key === 'unknown'` בשום מקום.
   */
  readonly tone?: 'danger';
  /**
   * `T-389` — ⛔ **«the number is 0» and «we do ⛔ not have the number» are ⛔ not the
   * same fact, and only the first of them may decide the PRIMARY action.**
   *
   * ⛔ It is ⛔ not `enabled` under another name: since `T-389` a tile whose read FAILED
   * is reachable (‏`enabled: true`) while ⛔ still carrying ⛔ no number ⇒ making it the
   * primary would paint the screen's one marked action onto a deck ⛔ nobody measured.
   */
  readonly measured: boolean;
  /**
   * 🔴 `T-392` · `F-270` — ⛔ **THE READ FOR THIS TILE IS STILL IN THE AIR.**
   *
   * ⛔ It is ⛔ not `!measured`, and the difference is the row: `measured: false` covers
   * ⛔ three different facts — the read failed, ⛔ no read was made here at all
   * (`/dev/tabs/probe`), and the read has ⛔ not come back yet. Only the third one is a
   * tile that ⛔ should ⛔ not be carrying «⛔ we do not have this number».
   *
   * ⛔ **And it is per-TILE, ⛔ not per-component.** `unseen` and `unknown.total` arrive
   * as props from the screen and are ⛔ already known while this component's own two
   * reads are in flight ⇒ a single `loading` flag would have painted a placeholder over
   * numbers that were on screen. (Measured: it did, in this row's first draft.)
   */
  readonly awaiting?: boolean;
} & (
  | { readonly enabled: true; readonly href: string }
  | { readonly enabled: false; readonly href: string | null }
);

/** `null` on every failure — including a server that answered `{ok:false}`. The screen does
 *  not act on WHY the number is missing (it shows «—» either way), so the code is not
 *  carried up where it would only invite an error screen the task forbids. */
async function readTotal(path: string): Promise<number | null> {
  try {
    const body = await apiGet<QueueResponse>(path);
    return body.ok ? body.total : null;
  } catch {
    return null;
  }
}

function noteFor(count: number | null): string {
  return count === null ? UNKNOWN_COUNT_HE : String(count);
}

/**
 * `T-388` — 🎨 **שלוש רמות משקל, ⛔ ולא אחת** — נגזר מ-`docs/design/kol-A-02-deck.png`.
 *
 * 🔬 **מה שנמדד בהליכה חיה 16/09 (‏`next start`, 375px) מול הרנדר, ⛔ ולא שוער:** הרנדר
 * מצייר את «סינון מילים» כאריח **מלא** (רקע מותג, טקסט על-מותג) ואת «חזרה» בגוון
 * **אזהרה** עם ✕ — כלומר שתי רמות משקל נפרדות מעל השאר. המוצר החי מצייר את **ארבעת**
 * האריחים באותה מסגרת `border-border-strong` בדיוק ⇒ **מ-0 רמות היררכיה ל-3**.
 *
 * ⛔ **ומי שמקבל את המילוי ⛔ אינו מפתח קשיח.** הוא `primaryKey` — האריח הפעיל הראשון
 * בסדר של `36 § 5` — ⇒ ⛔ בדיוק הצומת ש-`F-027` כבר סופר, והספירה נשארת **אחת**
 * בהגדרה. ⛔ לא נוסף ו⛔ לא הוסר ולו `[data-primary-action]` אחד.
 *
 * ⚠️ **וגוון האזהרה נסוג מפני המילוי, ⛔ ולא מצטבר עליו.** כשהחפיסה של «חזרה» היא גם
 * הראשית (כל השאר ריקות), אריח **מלא ואדום** היה רמה רביעית שהרנדר ⛔ אינו מכיר.
 * ⇒ **המילוי גובר**, והגליף נשאר — הוא מסמן את החפיסה, ⛔ לא את המשקל.
 */
function tileTone(entry: DeckEntry, primaryKey: string | null): string {
  if (entry.key === primaryKey) return 'border-transparent bg-brand-surface font-semibold text-brand-on';
  if (entry.tone === 'danger') return 'border-danger text-danger';
  return 'border-border-strong text-ink';
}

/**
 * `T-295`ⓒ — **a real zero stays `0`**, and that half of the rule is untouched: `count === 0`
 * renders the sentence with `0` in it, because an empty deck is ⛔ not a failure.
 *
 * `T-384`ⓐ — ⛔ **and a count that was not read renders «—», in the sentence's place,
 * whatever the reason.** ⛔ The tile ⛔ no longer distinguishes «the read failed» from «⛔ no
 * read was made»: BOTH are «we do not have this number», the distinction changed ⛔ nothing
 * a learner could act on, and paying for it cost three copies of one sentence on one screen.
 * ⇒ `tileNote` collapsed into `noteFor`, and the event is narrated ⛔ once, above the list.
 *
 * 🔴 **`T-389` — ⛔ AND A TILE WHOSE READ FAILED IS ⛔ NOT DISABLED. IT IS REACHABLE.**
 *
 * 🔬 **נמדד בהליכה חיה 16/09 (‏`next start`, 375×780) על `/dev/tabs/cards`, ⛔ ולא שוער:**
 * ‏`<FilterBar>` צייר את המונה «לא ידעתי» עם **25** — מספר חי, מ-`summary` שכבר נחת —
 * ובמרחק שני אריחים מתחתיו האריח «חזרה» נשא `aria-disabled="true"` ואת המשפט
 * «— מילים שסימנת לא ידעתי», כי הקריאה הנפרדת שלו ל-`deck=unknown` נכשלה (`F-262`).
 * ⇒ **הלומד מקבל מספר, ומיד נאמר לו שהוא ⛔ אינו קיים.**
 *
 * ⛔ **וזה ⛔ אינו «מושבת עם המספר» (§ 4.2ו) — זה בדיוק מה שהסעיף ההוא ⛔ אינו מתיר.**
 * «—» ⛔ אינו מספר (`UNKNOWN_COUNT_HE` · `T-295`ⓒ · `T-384`ⓐ), ⇒ אריח מושבת שנושא «—»
 * הוא אריח מושבת **בלי** מספר, כלומר הצורה היחידה שהחוקה פוסלת. ⛔ קריאה שנכשלה ⛔ לא
 * מדדה «אפס» — היא ⛔ לא מדדה דבר, וזה אותו כלל בדיוק ש-`{dead && !readFailed}` כבר
 * מקיים שורה אחת מעל: ⛔ אין להסיק ריקנות מקריאה ש⛔ לא הגיעה.
 *
 * ⇒ **קריאה שנכשלה ⇒ האריח נשאר בר-הגעה**, ו-`/study?deck=<x>` קורא **בעצמו** ויכול
 * להצליח שם — ⛔ בדיוק כמו שכפתור «טעינה מחדש» יכול להצליח כאן. ⛔ **ומה שזה ⛔ אינו
 * משנה:** חפיסה שנקראה והחזירה `0` ⛔ עדיין מושבתת **עם האפס שלה**, ואריח ש⛔ לא נקרא
 * כאן כלל (‏`/dev/tabs/probe`, ו-`unseen` בכל ענף שאינו `ready`) ⛔ עדיין מושבת — ⛔ שם
 * ⛔ אין מונה חי שסותר אותו, ⛔ ואין קריאה שנכשלה שאפשר לנסות שוב.
 */
function toEntry(input: {
  readonly key: string;
  readonly label: string;
  readonly href: string | null;
  readonly count: number | null;
  readonly note?: string;
  readonly tone?: 'danger';
  /**
   * `T-389` — **the read for THIS deck came back and ⛔ failed.** ⛔ Not «the count is
   * missing»: while a read is in flight, and on `/dev/tabs/probe` where ⛔ no read is
   * made at all, the count is equally `null` and ⛔ nothing has failed.
   */
  readonly unmeasured?: boolean;
  /** `T-392` — the read for THIS tile has ⛔ not come back yet. ⛔ See `DeckEntry.awaiting`. */
  readonly awaiting?: boolean;
}): DeckEntry {
  const { key, label, href, count, tone, awaiting } = input;
  const note = input.note ?? noteFor(count);
  const measured = count !== null;
  return href !== null && (count !== null ? count > 0 : input.unmeasured === true)
    ? { key, label, note, tone, measured, awaiting, enabled: true, href }
    : { key, label, note, tone, measured, awaiting, enabled: false, href };
}

/**
 * T-210 — `unseen` is the level's un-filtered count and it belongs to the SCREEN, not to
 * this block: `<LevelMapScreen>` already holds the level summary, and a second read here
 * would be a second definition of a number § 4.2ז fixes in one place. ⛔ Optional, so
 * `/dev/tabs/probe` still renders `<DeckSelector />` with no props and gets «—».
 */
export default function DeckSelector({
  unseen = null,
  unknown,
  onRetry,
}: {
  readonly unseen?: number | null;
  /** `T-385`ⓐ — ⛔ אופציונלי, בדיוק כמו `unseen`. ⛔ חסר ⇒ «—», ⛔ ולא «נכשל». */
  readonly unknown?: UnknownDeckProp;
  /**
   * `T-385`ⓐ — «טעינה מחדש» חייבת לקרוא גם למה ש**המסך** קורא. בלי זה הכפתור
   * מתקן את `due` ואת `sentences` ומשאיר את «חזרה» על הכשל שלו, וזה בדיוק המצב
   * הסותר שהשורה הזאת נכתבה נגדו.
   */
  readonly onRetry?: () => void;
} = {}): React.JSX.Element {
  const [counts, setCounts] = useState<DeckCounts>({ due: null, sentences: null });
  const [loading, setLoading] = useState(true);
  /**
   * `T-295`ⓑ — the retry is a **re-read in place**, ⛔ not a navigation and ⛔ not a page
   * refresh: bumping `attempt` re-runs the effect below with the tiles already on screen,
   * so nothing unmounts and nothing shifts.
   */
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      // The two counted decks in parallel: neither depends on the other, so serialising
      // them would multiply the wait for no gain. ⛔ `level` is ⛔ not among them — its
      // number is `unseen`, which the SCREEN already holds (§ 4.2ז), and a read here would
      // be a second definition of it. ⛔ **`T-385`: ⛔ nor is `unknown`, for exactly the
      // same reason** — `<LevelMapScreen>` reads that deck once, at `limit=50`, for both
      // this tile and `<UnknownList>`.
      const [due, sentences] = await Promise.all([
        readTotal(DUE_QUERY),
        readTotal(SENTENCES_QUERY),
      ]);
      if (cancelled) return;
      setCounts({ due, sentences });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  /**
   * ⛔ One failed deck out of three is already a screen that lies — ⛔ not «all three».
   * ⛔ **`T-385`: and the third deck's verdict now arrives from the screen** — ⛔ never
   * re-derived here from a second read of the same deck.
   */
  const readFailed =
    (!loading && (counts.due === null || counts.sentences === null)) || unknown?.failed === true;

  // ⛔ **The order is `36 § 5`'s order**, ⛔ not a preference: «סינון מילים» first, `חזרה`
  // second. `מנת היום` follows as the DECLARED deviation recorded in the UX plan (§ 4.2כ ד׳)
  // — it is the only entry to `/study` in the whole product — and `משפטים` stays last and
  // untouched.
  const entries: readonly DeckEntry[] = [
    // ⛔ **`F-140` נסגר ב-`D-142` (C-0348) ו-`T-225` בנה את נתיב הכתיבה.**
    // `/api/practice` פותח שורה — ורק — עבור `deck=level`: «ידעתי» ⇒
    // `self_marked_known: true`, «לא ידעתי» ⇒ `attempts: 1` ו-`next_review_at: null`.
    // ⛔ אפס SM-2 (`T-155ⓒ` · D-032). ⇒ האריח הוא CTA ראשי אמיתי.
    // ⚠️ `toEntry` עדיין מחזיר `enabled: false` **עם המספר** כשהרמה ריקה או כשהקריאה
    // נכשלה — «מושבת עם המספר» (§ 4.2ו) ⛔ אינו «נעול».
    toEntry({
      key: 'level',
      label: LEVEL_LABEL_HE,
      href: '/study?deck=level',
      count: unseen ?? null,
      // `T-384`ⓐ — «—» when the screen did not hand this number down. ⛔ The tile ⛔ does
      // not narrate WHY; `recoveryBlock` above narrates the event, once.
      note: LEVEL_NOTE_HE(noteFor(unseen)),
    }),
    // `T-385`ⓐ — ⛔ **the number is the SCREEN's**, read once at `limit=50` together with
    // the list below it. ⛔ `undefined` is ⛔ not `'failed'`: it means no read was made at
    // all here — `/dev/tabs/probe`, and every branch of the screen that is not `ready`.
    toEntry({
      key: 'unknown',
      label: PRACTICE_LABEL_HE,
      href: '/study?deck=unknown',
      count: unknown?.total ?? null,
      note: PRACTICE_NOTE_HE(noteFor(unknown?.total ?? null)),
      // `T-389` — ⛔ **הפסק דין של המסך, ⛔ ולא `total === null`.** ‏`undefined` הוא
      // «⛔ לא נעשתה קריאה» ⇒ ⛔ אינו «נכשל», בדיוק כמו ב-`readFailed` למעלה.
      unmeasured: unknown?.failed === true,
      // `T-392` — ⛔ the SCREEN reads this one, and it already says when it is in flight.
      awaiting: unknown?.loading === true,
      tone: 'danger',
    }),
    toEntry({
      key: 'due',
      label: DUE_LABEL_HE,
      href: '/study',
      count: counts.due,
      note: DUE_NOTE_HE(noteFor(counts.due)),
      // `T-389` — ⛔ ורק אחרי ש-`loading` נפל: בזמן שהקריאה באוויר המספר הוא `null`
      // ו⛔ שום דבר ⛔ עוד לא נכשל (אותה הבחנה בדיוק שעושה `readFailed`).
      unmeasured: !loading && counts.due === null,
      awaiting: loading,
    }),
    // T-199ⓐ · D-169 — the tile OPENS: `/study?deck=sentences` draws the item on the existing
    // card (T-066). Through `toEntry` like the other three ⇒ an empty band or a failed read is
    // «disabled WITH the number» (§ 4.2ו), ⛔ not locked. The ring node stays `nav`'s (D-149 § ד׳).
    toEntry({
      key: 'sentences',
      label: SENTENCES_LABEL_HE,
      href: '/study?deck=sentences',
      count: counts.sentences,
      note: SENTENCES_NOTE_HE(noteFor(counts.sentences)),
      unmeasured: !loading && counts.sentences === null,
      awaiting: loading,
    }),
  ];

  /**
   * ⛔ **ONE marker, and it is derived ⛔ rather than hard-coded to a key.** `check:mobile`
   * fails a screen carrying anything other than exactly one `[data-primary-action]`
   * (F-027), and the old rule — «`due` when enabled» — could not survive a second enabled
   * tile above it. The primary is the FIRST enabled tile in `36 § 5`'s own order, so the
   * count is one by construction whichever tiles happen to be live.
   *
   * 🔴 **`T-389` — ⛔ AND «enabled» ⛔ IS NO LONGER ENOUGH: it must also be MEASURED.**
   * Since `T-389` a deck whose read failed is reachable ⛔ while carrying ⛔ no number,
   * ⇒ without this clause the screen's one marked action would land on a tile nobody
   * measured, and `טעינה מחדש` — the ⛔ only control that can repair the failure —
   * would stop being the primary in exactly the state it exists for (`T-295`ⓑ ·
   * `T-329`ⓑ · `T-349`ⓑ, all three measured at ≤736px). ⛔ The count stays **one** by
   * construction either way: `recoveryBlock` carries the marker ⛔ only when this is
   * `null`.
   */
  const primaryKey = entries.find((entry) => entry.enabled && entry.measured)?.key ?? null;

  // T-123 · D-064: ⛔ בזמן טעינה אין מצב ריק. שלושת האריחים מציגים «—» וזה
  // נכון; «אין מה לתרגל» חצי שנייה לפני שהמספרים נוחתים הוא שקר קצר.
  const dead = !loading && allTilesDead(entries);

  /* `T-349` — ⛔ **one block, ONE place, and the place is ⛔ above the list.**
     `T-295`ⓑ put the way out AFTER the list on a structural argument — the control sits
     under the thing that failed, and the tiles keep their numbers (`§ 4.2ו`) — held
     «⛔ only while some tile is still live and pressable». `T-321` then measured a TOTAL
     failure at `top=816 · bottom=870` on 375×780 (tab bar at `top=707`) and split the
     block in two: before the list when `primaryKey === null`, after it otherwise.
     🔬 **C-0608 measured the other half of the same failure, ⛔ and it did not survive:**
     a PARTIAL failure — «סינון מילים» live at `unseen = 314` ⇒ `primaryKey !== null` —
     put the only retry control at `top=783.5 · bottom=869.5` on the same 780 screen.
     ⇒ **`T-295`ⓑ's premise is false, ⛔ not its reasoning:** a live tile is a DIFFERENT
     deck, ⛔ not a retry. It cannot re-fetch what failed, so it is ⛔ not «an action the
     list carries» for this failure at all — and the learner refreshes the page, the one
     way out `T-295` itself wrote down as ⛔ not a way out.
     ⇒ **`readFailed` alone renders it, before the list.** `primaryKey` still decides
     whether it is the PRIMARY action (`F-027` — exactly one per screen), ⛔ and that is
     now the only thing `primaryKey` decides here. */
  /**
   * 🎯 **`T-391` — ⛔ **`[data-primary-action]` נושא שפה חזותית אחת, ⛔ ולא אחת לכל מצב
   * שבו נפל.** **המשך של: `T-388`**, שהביא את המילוי מהרנדר אל האריח הראשי ובכך חשף
   * שהסימון עצמו ⛔ אינו עקבי.
   *
   * 🔬 **נמדד בקוד אחרי `T-388`, ⛔ ולא שוער — שלושה מצבים, שלוש הגשות:** ⓐ `ready` ⇒
   * האריח הראשי **מלא** (`bg-brand-surface text-brand-on`) · ⓑ כשל מלא
   * (`primaryKey === null`) ⇒ הסימון יושב על «טעינה מחדש», שהוגש כ**מסגרת**
   * (`border border-border-strong`) · ⓒ מצב ריק ⇒ `DECK_ALL_EMPTY_ACTION_HE` **מלא**.
   * ⇒ **2 מתוך 3 מלאים ו-1 ⛔ לא** — ולומד שנתקל בכשל רואה פעולה ראשית שנראית משנית
   * בדיוק כשהיא הדבר היחיד שנשאר לו לעשות.
   *
   * ⇒ **המילוי הולך אחרי הסימון, ⛔ ולא אחרי סוג האלמנט.** נושא `data-primary-action`
   * ⇒ מלא; ⛔ אינו נושא ⇒ מסגרת, כלומר פעולה משנית — וזה בדיוק מה שהוא כשאריח נמדד
   * וחי כבר לקח את התפקיד (`T-389`).
   *
   * ⛔ **והצורה ⛔ לא זזה:** האריח נשאר `rounded-2xl` והפקד נשאר `rounded-full` —
   * ‏`render_video_A.py:301,558` מצייר אריח ופקד כשתי צורות, ו«שפה אחת» כאן היא
   * ה**משקל** (`§ 4.2ט` · `taste-skill § 4.5` — «פעולה ראשית חייבת לקרוא כראשית»),
   * ⛔ ולא רדיוס אחד לכל דבר שאפשר ללחוץ עליו.
   *
   * ⛔ **והספירה נשארת 1** (`F-027`): `primaryKey === null` הוא בדיוק התנאי שבו ⛔ אף
   * אריח ⛔ אינו נושא את התכונה.
   */
  const retryIsPrimary = primaryKey === null;
  const recoveryBlock = (
    <div data-deck-failed className="flex flex-col items-start gap-2">
      <p className="text-base text-ink-muted">{READ_FAILED_BODY_HE}</p>
      <button
        type="button"
        onClick={() => {
          setLoading(true);
          setAttempt((previous) => previous + 1);
          // `T-385`ⓐ — ⛔ and the deck the SCREEN owns is re-read too. A way out that
          // fixes two tiles of three is ⛔ not a way out of THIS failure.
          onRetry?.();
        }}
        data-primary-action={retryIsPrimary ? 'true' : undefined}
        className={`flex min-h-touch items-center justify-center rounded-full px-5 py-3 text-lg font-semibold active:opacity-90 ${
          retryIsPrimary ? 'bg-brand-surface text-brand-on' : 'border border-border-strong text-ink'
        }`}
      >
        {RETRY_ACTION_HE}
      </button>
    </div>
  );

  return (
    <section className="flex flex-col gap-4">
      {/* `T-322` — ⛔ **one status region, mounted ALWAYS, ⛔ and that is the whole row.**
          Until now the failure reached exactly one channel: the eye. `READ_FAILED_NOTE_HE`
          replaces each tile's sentence and `READ_FAILED_BODY_HE` sits inside
          `recoveryBlock` — both plain static text swapped into a subtree that re-renders
          AFTER the first paint, so ⛔ nothing is announced. A learner on VoiceOver taps
          «כרטיסיות», hears the tiles and their numbers, three reads fail inside a second,
          and the screen they were read ⛔ no longer exists.
          ⛔ **`role="status"` and ⛔ not `role="alert"`:** the learner ⛔ did not cause this,
          and `alert` is assertive — it interrupts whatever is being spoken.
          ⛔ **And the region is ⛔ never conditionally mounted.** A live region injected in
          the same commit as its text is ⛔ not reliably announced; it must already be in
          the accessibility tree when the text arrives. ⇒ it is always here, and ⛔ only its
          CONTENT changes.
          ⛔ **ⓑ — ⛔ three failed tiles are ⛔ not three announcements.** `readFailed` is
          already «one failed read out of three», the region is ONE node, and
          `aria-atomic` makes it speak as a single sentence
          (‏`ui-ux-pro-max` § Accessibility, «Contextual Live Badge Updates» — ⛔ Don't:
          «make every badge a competing live region», severity High).
          ⚠️ **Layer A:** `sr-only` ⇒ ⛔ the visible text ⛔ does not move and ⛔ no second
          copy of the sentence is painted. The sighted learner keeps exactly the screen
          `T-295` and `T-321` built. */}
      {/* 🔴 `T-392` — ⛔ **THE LOADING SENTENCE GOES IN HERE, ⛔ NOT IN A SECOND REGION.**
          🔬 A second `role="status"` was written first, and `T-322`'s own gate refused it
          («אזור `status` אחד בדיוק»: `role="status"` × 1) — ⛔ correctly. One live region per
          screen is the rule, ⛔ not «one per event», and a screen reader that has to track
          two regions is the failure that rule exists against.
          ⇒ ⛔ **and the two messages ⛔ cannot collide:** `awaiting` is true ⛔ only while a
          read is in flight, and `readFailed` is gated on `!loading` ⇒ ⛔ no state carries
          both. The region says «טוען» while they fly, then the failure, then ⛔ nothing. */}
      <div role="status" aria-atomic="true" className="sr-only" data-deck-status>
        {readFailed
          ? READ_FAILED_BODY_HE
          : entries.some((entry) => entry.awaiting === true)
            ? COUNTS_LOADING_HE
            : ''}
      </div>
      {/* `T-349` — ⛔ **any failed read** ⇒ the way out goes above the fold, ⛔ before the
          tiles. ⛔ It is ⛔ not a new error screen (‏`T-295` forbade one) and ⛔ not a
          fourth tile — it is the same block, in the one place that is reachable without
          scrolling at 320 · 375 · 414. ⛔ And the tiles keep their numbers below it: the
          block is an ADDITION, ⛔ never a replacement (`§ 4.2ו`). */}
      {readFailed && recoveryBlock}
      {/* `T-295`ⓐ — ⛔ **`&& !readFailed` is the whole point of the row.** «אין מה לתרגל»
          is a claim about the BANK, and a read that never arrived measured nothing about
          the bank. Until today a total outage rendered exactly this block, and a learner
          was told their decks were empty on the strength of three 503s. */}
      {dead && !readFailed && (
        // ⛔ אינו מחליף את שלושת האריחים: «מושבת עם המספר» הוא מידע (§ 4.2ו),
        // ומחיקתו הופכת מסך שנראה זהה בשני מצבים שונים. זו פעולה נוספת,
        // ⛔ לא החלפה.
        <div data-deck-empty className="flex flex-col gap-2">
          <h3 className="text-xl font-semibold">{DECK_ALL_EMPTY_TITLE_HE}</h3>
          <p className="text-base text-ink-muted">{DECK_ALL_EMPTY_BODY_HE}</p>
          <Link
            href={DECK_ALL_EMPTY_HREF}
            data-primary-action="true"
            className="flex min-h-touch items-center justify-center rounded-full bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
          >
            {DECK_ALL_EMPTY_ACTION_HE}
          </Link>
        </div>
      )}

      {/* `aria-busy` and ⛔ not a spinner or a skeleton: the three cards are already in the
          DOM at their final size, so nothing shifts when the numbers land. */}
      {/* T-228 · D-155: the tile box carries the RENDER's three values, ⛔ not the screen's.
          `render_video_A.py` draws each deck as `rr(24, y, LW-48, 62, 16)` ⇒ x=24 · w=327 ·
          h=62. ⚠️ T-285 · D-206 moved the global gutter to 24px, so `<main>` now pads the
          column to exactly x=24 · w=327 (`app/layout.tsx`) — the render's own numbers. ⇒ the
          `mx-1` that used to fake 24 out of 20 was DELETED: there is nothing left to
          compensate for, and keeping it would push this list to x=28.
          h=62 = 1+6 (border+`py-1.5`) + 28 (`text-lg` name) + 20 (`text-sm` note) + 6+1,
          with ⛔ no inner gap: name centre at 21 and note centre at 45 against the render's
          22/45 (`c.txt(…, 508/531, …)` on a box at 486). `min-h-touch` (44) still holds
          under it, so a wrapping note grows the box instead of clipping. Measured live
          before: x=20 · w=335 · h=78 (C-0321, unchanged at C-0499). */}
      <ul aria-busy={loading} data-deck-selector className="flex list-none flex-col gap-3 p-0">
        {entries.map((entry) => {
          // ONE body, shared by both branches. If each branch carried its own copy, the
          // disabled one could quietly lose its number — and «disabled WITH the number» is
          // the whole rule (§ 4.2ו).
          // ONE body, shared by both branches — `36 § 5` and the render draw a tile as a
          // NAME above a sentence that carries the number. If each branch carried its own
          // copy, the disabled one could quietly lose the number, and «disabled WITH the
          // number» is the whole rule (§ 4.2ו).
          /* `T-388` — ⛔ **והמשפט מתחת לשם חייב לרדת מהמילוי יחד עם השם.**
             🔬 נמדד בהליכה חיה אחרי החצי הראשון של השורה: `text-ink-muted` הוא אפור
             מעומעם, ועל רקע `--brand-surface` (‏`#1d4ed8`) הוא כמעט בלתי-קריא — ⇒
             האריח הראשי היה קונה היררכיה במחיר **המספר שהוא נושא**. ⛔ הגוף משותף
             לשני הענפים בכוונה (§ 4.2ו — «מושבת **עם** המספר»), ⇒ הגוון נמסר לו
             כפרמטר, ⛔ ו⛔ לא נכתב ענף שני שבו המספר יכול ללכת לאיבוד. */
          const onFill = entry.enabled && entry.key === primaryKey;
          const body = (
            <>
              <span className="inline-flex items-center gap-2 text-lg font-semibold">
                {/* T-078: the lock gets the same mark the locked world tab wears, from the
                    same component. The word alone was the only signal here, and one
                    concept in two forms is constitution § 6 — and § 1, since a muted grey
                    word is a single channel. ⚠️ **Keyed to `entry.locked` since C-0318**,
                    ⛔ no longer to the note's TEXT: the note is a sentence now, and a tile
                    can be locked while still showing its number (F-140 · «סינון מילים»). */}
                {/* `T-388` — ⛔ **הגליף לפני המילה**, בדיוק כמו סימן הנעילה, ⛔ ולא
                    במקומה. ברנדר הוא יושב בקצה האריח של «חזרה» ומסמן **איזו** חפיסה
                    זו לפני שקוראים אותה. */}
                {entry.tone === 'danger' ? <UnknownMarkIcon /> : null}
                {entry.locked === true ? <LockIcon /> : null}
                {/* ⛔ הנעילה ⛔ אינה נשענת על האייקון בלבד: `LockIcon` הוא `aria-hidden`
                    (⛔ בכוונה — הוא קישוט), ולכן בלי המילה הזאת לומד שמשתמש בקורא מסך
                    שומע «מושבת» ⛔ ולא «נעול». ⛔ ואינה נראית ⇒ ⛔ אפס סטייה מהרנדר. */}
                {entry.locked === true ? <span className="sr-only">{LOCKED_HE}</span> : null}
                {entry.label}
              </span>
              {/* 🔴 `T-392` · `F-270` — ⛔ **WAITING AND FAILING ⛔ MAY ⛔ NOT WEAR THE SAME
                  GLYPH.** 🔬 Measured live this tick (`next start`, 375×780, `domcontentloaded`):
                  `[data-deck-selector]` carried **3** «—» with **0** recovery blocks on screen —
                  ⛔ nothing had failed, ⛔ nothing had even been asked. At `networkidle`, after
                  three 503s, it carried **the same 3** «—». ⇒ one glyph, two states, and the
                  file itself defines that glyph as «the read failed, or ⛔ no read was made»
                  (`UNKNOWN_COUNT_HE`) — so for the whole flight it was a claim that was ⛔ not
                  true yet.
                  ⇒ **while the reads are in flight the note's place carries a SHAPE**, the same
                  `bg-surface-raised` bar `<CardSkeleton>` uses (§ 4.2ו «טעינה — שלד בצורת
                  הכרטיס, ⛔ לא ספינר»). ⛔ «—» keeps its ⛔ one meaning: we asked, and we ⛔ do
                  ⛔ not have the number.
                  ⚠️ **And ⛔ no layout moves.** The bar is `inline-block` inside the unchanged
                  `text-sm` span, whose strut (20px) already sets the line box ⇒ the 62px tile
                  geometry the render fixes (`rr(24, y, LW-48, 62, 16)`) is untouched when the
                  numbers land. ⛔ No animation: § 5 honours `prefers-reduced-motion`, and having
                  ⛔ none honours it by construction — exactly `<CardSkeleton>`'s own argument. */}
              <span className={`text-sm ${onFill ? 'text-brand-on opacity-90' : 'text-ink-muted'}`}>
                {entry.awaiting === true ? (
                  <span
                    aria-hidden
                    className="inline-block h-3 w-28 rounded-lg bg-surface-raised align-middle"
                    data-note-skeleton
                  />
                ) : (
                  entry.note
                )}
              </span>
            </>
          );

          return (
            <li key={entry.key}>
              {entry.enabled ? (
                <Link
                  href={entry.href}
                  data-primary-action={entry.key === primaryKey ? 'true' : undefined}
                  className={`flex min-h-touch flex-col items-start justify-center rounded-2xl border px-5 py-1.5 active:opacity-90 ${tileTone(entry, primaryKey)}`}
                >
                  {body}
                </Link>
              ) : (
                // A <button> with `type="button"` and NO handler: it cannot submit and it
                // cannot navigate, so "does nothing" is structural. It stays focusable
                // (⛔ not the `disabled` attribute) so a screen-reader learner can still
                // find the deck and hear that it is unavailable — `aria-disabled` is what
                // says so.
                <button
                  type="button"
                  aria-disabled="true"
                  className="flex w-full min-h-touch flex-col items-start justify-center rounded-2xl border border-border-subtle px-5 py-1.5 text-ink-muted"
                >
                  {body}
                </button>
              )}
            </li>
          );
        })}
      </ul>

    </section>
  );
}
