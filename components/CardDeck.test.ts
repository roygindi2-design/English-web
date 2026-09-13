import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * `<CardDeck>` — T-065 part א׳, plan `2026-08-13-study-queue.md` task 5.
 *
 * A source guard, not a render test: the vitest environment is `node` and jsdom is
 * deliberately not installed (vitest.config.ts). Geometry — one card per screen, the two
 * grade targets at ≥44×44px, zero horizontal scroll — is `check:mobile`'s job through the
 * `/dev/deck` fixture, and that fixture is task 8 of the same plan.
 *
 * What this file can prove is exactly the set of claims that live in the markup and would
 * otherwise be believed rather than measured:
 *
 *   ✔ scroll-snap is on the container, so a card cannot half-scroll (§ 4.2ו)
 *   ✔ the practice label is reachable ONLY from the `unknown` branch — D-033's promise to
 *     the learner is that today's dose never carries it
 *   ✔ `behavior: 'smooth'` is absent — it ignores prefers-reduced-motion (constitution § 5)
 *   ✔ the dead-band pair is absent (F-011 · F-016)
 *   ✔ the deck asks for no data of its own — no `fetch`, no `apiGet` (the screen streams it)
 *   ✔ a graded card leaves the DOM, which is what makes «no scrolling back» true without a
 *     single line that blocks scrolling
 *   ✔ `Flashcard` is rendered with a `key`, because the reveal state inside it is per-card
 *     and a keyless sibling list hands card n+1 to the learner already revealed
 *   ✔ the completion state is a heading, a link, and (since T-276 · D-198) the round summary
 *     the pure helper produced — ⛔ nothing this component invents on its own
 *
 * ⛔ What it cannot prove, named so nobody mistakes green here for coverage: that the scroll
 * actually lands on the next card in a real engine, and that the two grade buttons clear
 * 44px. Both are `check:mobile`, task 8.
 */
const SRC = readFileSync('components/CardDeck.tsx', 'utf8');

/** C-0032/C-0071/C-0072: a guard a comment can satisfy guards nothing. */
function withoutComments(source: string): string {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}

const CODE = withoutComments(SRC);

/**
 * The balanced-brace region opened by `open`, `open` included.
 *
 * This is the measurement that C-0100 learned to insist on: a character-distance regex
 * ("the label within N characters of the word `unknown`") convicts correct code and
 * acquits incorrect code as soon as an unrelated line moves. Extracting the branch by
 * matching its braces and then asking whether the string is INSIDE it or OUTSIDE it is a
 * containment question, and containment is what the claim actually is.
 */
function braceRegion(source: string, open: string): string {
  const start = source.indexOf(open);
  expect(start, `expected to find ${open} in CardDeck.tsx`).toBeGreaterThan(-1);
  let depth = 0;
  for (let i = start; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`unbalanced braces after ${open} in CardDeck.tsx`);
}

/**
 * Every balanced-brace region opened by `open` — the plural of `braceRegion`.
 *
 * C-0137 measured why the singular is not enough: the finish state (T-055) gates the D-033
 * notice behind its own `deck !== 'due'` gate, so the file legitimately holds two
 * gates. `indexOf` sees only the first, and the containment guard read the second gated copy
 * as a leak. Subtracting ALL gated regions is the same containment question asked of a file
 * that is allowed to grow gates — ⛔ it does not weaken the claim: a copy that sits behind no
 * gate at all still survives the subtraction and still turns the guard red.
 */
function braceRegions(source: string, open: string): string[] {
  const regions: string[] = [];
  for (let from = 0; ; ) {
    const start = source.indexOf(open, from);
    if (start === -1) return regions;
    let depth = 0;
    let end = -1;
    for (let i = start; i < source.length; i += 1) {
      if (source[i] === '{') depth += 1;
      else if (source[i] === '}') {
        depth -= 1;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end === -1) throw new Error(`unbalanced braces after ${open} in CardDeck.tsx`);
    regions.push(source.slice(start, end + 1));
    from = end + 1;
  }
}

const PRACTICE_LABEL = 'לא משנה את מועד החזרה';
/** The gate the label is allowed to live behind, and the only one. */
/**
 * ⚠️ **הורחב C-0318 (T-155), ⛔ והטענה ⛔ לא נחלשה.** ‏`level` כותב את אותן שתי עמודות
 * בדיוק כמו `unknown` (D-032 · D-033 · T-155ⓒ), ולכן ההבטחה «⛔ אינו משנה את מועד החזרה»
 * נכונה בשתיהן — ומה שנמדד כאן הוא **הכלה**: כל עותק של התווית יושב בתוך שער, ⛔ ואף עותק
 * ⛔ אינו שורד את החיסור. השער הוא «כל חפיסה שאינה `due`» כי `due` היא היחידה שמתזמנת,
 * ⛔ והוא ⛔ אינו «כל חפיסה»: עותק לא-משוער עדיין מפיל.
 */
const UNKNOWN_GATE = "{deck !== 'due' &&";

describe('<CardDeck> — the scrolling deck (T-065 · § 4.2ו)', () => {
  it('is a client component — it holds which cards were already graded', () => {
    expect(CODE).toContain("'use client'");
  });

  /**
   * 🔴 **⟦INVERTED 13/09 · `T-294` · הכרעת רוי על פריט 111⟧** עד היום הטענה כאן דרשה
   * `snap-y` · `snap-mandatory` · `snap-start` — כלומר היא **נעלה את הגלילה האנכית
   * במקום**. רוי הכריע שהיא ⛔ לא תהיה, ולכן הטענה ⛔ אינה נמחקת אלא **מתהפכת**:
   * אותה שורה שהגנה על המנגנון מגנה עכשיו על היעדרו.
   * 🔬 הסיבה שזו טענת-מקור ו⛔ לא טענת-DOM: `snap-y` על מכולה ריקה ⛔ אינו נראה
   * ברינדור סטטי, ו-`/dev/deck` מודד את **התוצאה** — ⛔ אין כאן כפילות.
   */
  it('⛔ carries no vertical scrolling of any kind — one card, ⛔ not a scroller', () => {
    for (const dead of ['snap-y', 'snap-mandatory', 'snap-start', 'overflow-y-auto']) {
      expect(CODE, `⛔ ${dead} הוא הגלילה האנכית שרוי ביטל`).not.toContain(dead);
    }
    expect(CODE, 'ו⛔ אין קריאה שגוללת').not.toContain('scrollIntoView');
  });

  /** ⛔ ורק כרטיס אחד מרונדר — אחרת «אין גלילה» היה נשען על CSS בלבד. */
  it('renders exactly one card, so there is nothing to scroll to', () => {
    expect(CODE).toContain('remaining.slice(0, 1)');
  });

  /**
   * ⚠️ This test used to demand `h-dvh`, and `/dev/deck` falsified it the first time the deck
   * was ever rendered by the harness (C-0104, T-065 task 8). Both obvious heights were
   * measured wrong at 320/375/414:
   *
   *   `h-dvh`  ⇒ card 1 occupied y=105..832 of a 780px viewport. The deck does not own the
   *             viewport — the root layout gives it a header above and the licence footer
   *             below — so 52px of the card, and both grade buttons with it, sat below the
   *             fold. Answer buttons off screen are the F-027 dead end by another route.
   *   `flex-1` ⇒ card 1 collapsed to 215px of content and card 2 sat visible under it. The
   *             root column is `min-h-dvh`: its height is INDEFINITE, so nothing in this
   *             subtree stretches and no `h-full` below it resolves.
   *
   * So the deck states a definite height — the viewport minus the 10rem of chrome the root
   * layout renders around it. That number is about another file, and it is not trusted here:
   * `/dev/deck` measures the RESULT at all three widths, which is what makes changing the
   * chrome a red run instead of a silent 16px.
   *
   * `min-h-0` on the scroll container is not decoration either — without it a flex child
   * refuses to shrink below its content and the `overflow-y-auto` never scrolls.
   */
  it('states a definite height, ⛔ neither the full viewport nor a stretch', () => {
    expect(CODE).not.toContain('h-dvh');
    expect(CODE).toMatch(/h-\[calc\(100dvh-10rem\)\]/);
    expect(CODE).toContain('min-h-0');
  });

  /**
   * החלון של הכרטיס מסומן, מפני ש-`/dev/deck` מודד את הדק **מולו** ו⛔ לא מול החלון.
   * ⚠️ **⟦RENAMED 13/09 · `T-294`⟧** העוגן נקרא `data-deck-scroll` עד היום, והשם ⛔ כבר
   * ⛔ לא היה נכון: ⛔ אין שם גלילה. שם שמשקר הוא שם שסוכן מאוחר יסיק ממנו מנגנון
   * שאינו קיים ⇒ `data-deck-viewport`.
   */
  it('marks the card viewport for the harness', () => {
    expect(CODE).toContain('data-deck-viewport');
    expect(CODE, '⛔ והשם הישן ⛔ אינו נשאר מאחור').not.toContain('data-deck-scroll');
  });

  it('⛔ never centres a flex column — the F-011 · F-016 dead band', () => {
    expect(CODE).not.toMatch(/flex-1[^"'`]*justify-center/);
  });

  /**
   * ⚠️ **⟦NARROWED 13/09 · `T-294`⟧** הטענה דרשה גם `behavior: 'auto'` **וגם** ⛔ אפס
   * `'smooth'`. החצי הראשון הגן על הקריאה `scrollIntoView`, ו**הקריאה ⛔ אינה קיימת**
   * ⇒ הוא היה נכשל על היעדר מנגנון, ⛔ לא על ליקוי. החצי השני **נשאר ומתחזק**: גלילה
   * חלקה היא תנועה ש-`prefers-reduced-motion` ⛔ אינו יכול לכבות מ-CSS, וכניסתה חזרה
   * לקובץ הזה — בכל צורה — היא בדיוק מה שצריך להאדים.
   */
  it("⛔ carries no behavior: 'smooth' — it overrides prefers-reduced-motion", () => {
    expect(CODE).not.toMatch(/behavior:\s*'smooth'/);
    expect(CODE).not.toMatch(/behavior:\s*"smooth"/);
  });

  it('⛔ fetches nothing itself — the screen above it owns the network (task 6)', () => {
    expect(CODE).not.toContain('fetch(');
    expect(CODE).not.toContain('apiGet');
    expect(CODE).not.toContain('apiPost');
    expect(CODE).not.toContain('/api/');
  });

  /**
   * D-033 in the markup. The label is a promise to the learner about what the button they
   * are about to press does NOT do; a copy of it on today's dose would be a lie, and its
   * absence from the practice deck would be a silent schedule change.
   */
  it('shows the practice label behind non-due gates and ⛔ nowhere else', () => {
    // C-0137: the file carries TWO gates since T-055 — the scrolling header and the finish
    // state — and each holds one copy. «exactly one copy in the file» was a proxy for the
    // claim while there was one gate; the claim itself is containment, so it is asked of
    // every gate. ⛔ Not a relaxation: an ungated copy still survives the subtraction below.
    const gates = braceRegions(CODE, UNKNOWN_GATE);
    expect(gates.length, 'at least one non-due gate').toBeGreaterThan(0);

    const gated = gates.filter((gate) => gate.includes(PRACTICE_LABEL));
    expect(gated.length, 'the label must be inside a non-due gate').toBeGreaterThan(0);

    let outside = CODE;
    for (const gate of gates) outside = outside.split(gate).join('');
    expect(outside, 'the label leaked outside the non-due gates').not.toContain(PRACTICE_LABEL);

    // Every copy is accounted for by a gate — no copy hides in a region the subtraction
    // happened to remove for another reason.
    expect(
      CODE.match(new RegExp(PRACTICE_LABEL, 'g'))?.length,
      'every copy of the label sits behind a gate',
    ).toBe(gated.length);
  });

  it('renders the remaining cards only — a graded card leaves the DOM', () => {
    // «no going back to a card you graded» is implemented by removal, so there is nothing
    // here that fights the browser and nothing to get out of sync with the queue.
    expect(CODE).toMatch(/\.filter\(/);
    expect(CODE).toContain('graded');
    expect(CODE).not.toContain('preventDefault');
    // ⚠️ **⟦13/09 · `T-294`⟧ ⛔ `overflow-hidden` ⛔ אינו אסור יותר — הוא נדרש.**
    // האיסור הישן כאן היה על **מלכודת גלילה**: לחסום גלילה שיש לה תוכן לגלול אליו.
    // אחרי `T-294` ⛔ אין תוכן כזה — כרטיס אחד מרונדר — ולכן `overflow-hidden` ⛔ אינו
    // לוכד דבר; הוא **נושא ההכרעה** של רוי על שני הצירים. ⇒ הטענה מתהפכת, ו⛔ לא נמחקת.
    expect(CODE, 'ההכרעה של רוי נישאת כאן, ⛔ ולא ב-CSS חיצוני').toContain('overflow-hidden');
  });

  it('keys each Flashcard by deckCardKey — reveal state is per card, and two stems of one word are two cards (T-066)', () => {
    // ⚠️ **⟦13/09 · `T-333`⟧ המפתח נגזר לקבוע מקומי לפני ה-JSX** (‏`const key =
    // deckCardKey(card)`), כי אותו ערך נדרש שלוש פעמים בשורה — `key`, המסנן, והמטפל.
    // ⇒ הטענה מודדת את **הקשר** ‏(המפתח הוא `deckCardKey`, והוא זה שנמסר ל-`key=`),
    // ⛔ ולא את האיות של הביטוי — איות מדויק נשבר בכל חילוץ קבוע ומלמד לעדכן.
    expect(CODE, 'המפתח נגזר מ-deckCardKey').toMatch(/const key = deckCardKey\(card\);/);
    expect(CODE, 'והוא זה שנמסר ל-key=').toMatch(/key=\{key\}/);
    expect(CODE).not.toMatch(/key=\{[^}]*word_id[^}]*\}/);
    // Both builders by name: a word card is `buildCard`, a sentence item `buildSentenceCard`
    // (D-169 — the SAME `<Flashcard>`, ⛔ no second deck component).
    expect(CODE).toContain('buildCard');
    expect(CODE).toContain('buildSentenceCard');
    expect(CODE).toMatch(/isSentenceCard\(card\)\s*\?\s*buildSentenceCard\(card\)/);
    // The removal list is keyed the same way — a key that collides is a card that vanishes.
    expect(CODE).toContain('graded.includes(deckCardKey(card))');
  });

  it('⛔ does not reimplement the grade controls — Flashcard already carries them', () => {
    expect(CODE).toContain('<Flashcard');
    for (const label of ['ידעתי', 'לא ידעתי', 'הצג תשובה']) {
      expect(CODE, `${label} belongs to Flashcard.tsx, not to the deck`).not.toContain(label);
    }
  });

  it('IS the finish state now — deck identity, one way out to the בורר (T-055 · § 4.2ו)', () => {
    // F-032 was opened 2026-08-13T15:49:54Z and the PM's § 4.2ו landed 15:53:21Z — three
    // minutes later. The finish state is decided: «בסוף המחזור מסך סיום», «יוצאים — מסך
    // הסיום, ומשם חזרה לבורר», «המילה האחרונה — מסך סיום ולא מסך לבן».
    const done = braceRegion(CODE, 'if (remaining.length === 0) {');

    // ⓐ Distinguishable from `empty` in the DOM — that is literally F-032's question.
    expect(done).toContain('data-deck-done');
    expect(done).toContain('סיימת');

    // ⓑ Deck identity, built from the two strings this file ALREADY renders in its header.
    //    A learner who finished תרגול and one who finished מנת היום must not read the same
    //    screen, and D-033's promise has to hold on the screen the learner is looking at.
    expect(done).toContain(PRACTICE_LABEL);
    expect(done).toContain('מנת היום');

    // ⓒ Exactly one way out, and it goes to the בורר (§ 4.2ו q6).
    expect(done).toContain('href="/cards"');
    expect(done.match(/data-primary-action/g)?.length, 'exactly one primary action').toBe(1);

    // ⓓ ⛔ Still nothing the PM did not decide. T-055: «אין מספרים חדשים ואין הבטחה».
    for (const invented of ['רצף', 'ניקוד', 'מוכנות', 'כל הכבוד', '%']) {
      expect(done, `"${invented}" is a claim no decision makes`).not.toContain(invented);
    }
    // ⛔ No count either: `data-remaining` belongs to the scrolling header, and a "0 נותרו"
    //    on the finish state would be a new number on a screen that forbids new numbers.
    expect(done).not.toContain('data-remaining');
  });

  it('shows a live remaining counter beside the deck label', () => {
    expect(CODE).toContain('data-remaining');
  });

  it('uses semantic colour tokens only (the palette ratchet, per file)', () => {
    expect(CODE).not.toMatch(/\b(?:bg|text|border)-slate-\d{2,3}\b/);
    expect(CODE).not.toMatch(/\bbg-brand(?![-\w])/);
  });

  /**
   * T-276 · D-198 — the finish state says what moved in the round. The WORDING is measured
   * in `lib/core/roundSummary.test.ts` (one test per fence: D-033 · § 4.2יג-ב ⓒ · D-198 ⓓ);
   * what this file can prove is the WIRING — that the deck counts the grades it already
   * passes, hands them to the pure helper with the deck's own name, and renders the result
   * inside the finish state and nowhere else.
   */
  describe('the round summary (T-276 · D-198)', () => {
    it('counts each grade that reached the server — beside `graded`, from the same `value`', () => {
      const gradeFn = braceRegion(CODE, 'const grade = useCallback(');
      expect(gradeFn).toContain('setGrades((previous) => [...previous, value])');
    });

    it('⛔ never counts a grade the server rejected — the count sits after the catch, with setGraded', () => {
      const gradeFn = braceRegion(CODE, 'const grade = useCallback(');
      const rejected = gradeFn.indexOf('catch {');
      const counted = gradeFn.indexOf('setGrades(');
      expect(rejected).toBeGreaterThan(-1);
      expect(counted).toBeGreaterThan(rejected);
    });

    it('asks the pure helper with the deck name — D-033 is decided by `deck`, ⛔ not re-derived here', () => {
      expect(CODE).toContain("from '@/lib/core/roundSummary'");
      const done = braceRegion(CODE, 'if (remaining.length === 0) {');
      expect(done).toContain('describeRound(deck, tallyGrades(grades))');
    });

    it('renders the lines inside the finish state, marked for the harness', () => {
      const done = braceRegion(CODE, 'if (remaining.length === 0) {');
      expect(done).toContain('data-round-summary');
      expect(CODE.match(/data-round-summary/g)?.length, 'only the finish state carries it').toBe(1);
    });

    it('⛔ mints no sentence of its own — every visible string about the round comes from the helper', () => {
      const done = braceRegion(CODE, 'if (remaining.length === 0) {');
      for (const minted of ['יחזרו', 'נקבע מחדש', 'דירגת', 'ידעתי']) {
        expect(done, `«${minted}» belongs to lib/core/roundSummary.ts`).not.toContain(minted);
      }
    });

    it('the fixture seam is optional and defaults to an empty round', () => {
      expect(CODE).toMatch(/initialGrades\?: readonly CardGrade\[\]/);
      expect(CODE).toContain('initialGrades = []');
    });
  });

  /**
   * T-268 — the written way out lives INSIDE the deck's own flex column, ⛔ not above it.
   *
   * Measured live 2026-09-07 (C-0490) on `/study?deck=level` at 375×780 with the queue
   * mocked: the T-087 close was `absolute start-2 top-2` on the section around this deck,
   * and that corner is ⛔ not empty — it is this file's own `<header>` row (37px tall,
   * y=52..89) holding «תרגול — לא משנה את מועד החזרה» (x=140..355). The 44×44 icon box
   * (x=303..347 · y=60..104) sat ON the notice text and its glyph straddled the header
   * border. That is the «broken card view» Roy reported (T-268 ⓑ). `/dev/deck` never
   * rendered the close at all, so the harness never saw it — a fixture that differs from
   * production is a hole, ⛔ not a test.
   *
   * ⇒ The exit is a slot this component renders as the first header row. Inside the
   * `h-[calc(100dvh-10rem)]` column it is absorbed by the `min-h-0 flex-1` scroller, so
   * the calc on the outer chrome (T-086) is untouched by construction. A row added by the
   * screen ABOVE this component would push the deck under the fold instead.
   */
  describe('the written exit slot (T-268 · D-187 §ג׳.1)', () => {
    it('accepts an optional `exit` — href and the Hebrew label, ⛔ no icon-only path', () => {
      expect(CODE).toMatch(/exit\?: \{\s*readonly href: string;\s*readonly labelHe: string;?\s*\}/);
    });

    it('renders the exit in the deck header, above the card viewport', () => {
      const headerAt = CODE.indexOf('<header');
      const exitAt = CODE.indexOf('data-deck-exit');
      const scrollAt = CODE.indexOf('data-deck-viewport');
      expect(exitAt, 'no `data-deck-exit` in the scrolling deck').toBeGreaterThan(-1);
      expect(exitAt, 'the exit sits inside the `<header>` row').toBeGreaterThan(headerAt);
      expect(exitAt, 'the exit must come BEFORE the card viewport in the DOM').toBeLessThan(scrollAt);
    });

    it('the exit is a written link — 44px, `<Link>`, ⛔ no `data-primary-action`', () => {
      const at = CODE.indexOf('data-deck-exit');
      const near = CODE.slice(Math.max(0, at - 400), at + 400);
      expect(near).toMatch(/<Link/);
      expect(near).toContain('min-h-touch');
      expect(near).toContain('{exit.labelHe}');
      expect(near).not.toContain('data-primary-action');
      expect(near).not.toContain('aria-label');
    });

    it('⛔ the exit slot never reaches the finish state — that screen has its own way out', () => {
      const done = braceRegion(CODE, 'if (remaining.length === 0) {');
      expect(done).not.toContain('data-deck-exit');
      expect((CODE.match(/data-deck-exit/g) ?? []).length).toBe(1);
    });
  });
});

describe('the brace extractor itself is measured, so the guard above is not vacuous', () => {
  it('returns the balanced region and not the rest of the file', () => {
    const src = "a {deck !== 'due' && (<p>{x}</p>)} b";
    expect(braceRegion(src, UNKNOWN_GATE)).toBe("{deck !== 'due' && (<p>{x}</p>)}");
  });

  it('would catch a label planted outside the branch', () => {
    const src = `<p>${PRACTICE_LABEL}</p> {deck !== 'due' && (<p>${PRACTICE_LABEL}</p>)}`;
    const branch = braceRegion(src, UNKNOWN_GATE);
    expect(src.split(branch).join('')).toContain(PRACTICE_LABEL);
  });

  /**
   * C-0137. `braceRegion` takes the FIRST match and only it, so a file with two gates had
   * its second gate counted as "outside" — measured: `CardDeck.tsx` carries gates at two
   * offsets, one label inside each, and the single-region guard called that a leak. The
   * containment claim never changed; the "there is exactly one gate" proxy expired.
   */
  it('extracts EVERY gate and not only the first (the two-gate file)', () => {
    const src = `{deck !== 'due' && (<p>a</p>)} x {deck !== 'due' && (<p>b</p>)}`;
    const regions = braceRegions(src, UNKNOWN_GATE);
    expect(regions.length, 'both gates').toBe(2);
    expect(regions[0]).toBe("{deck !== 'due' && (<p>a</p>)}");
    expect(regions[1]).toBe("{deck !== 'due' && (<p>b</p>)}");
  });

  it('would still catch a label planted outside EVERY gate', () => {
    const src = `<p>${PRACTICE_LABEL}</p> {deck !== 'due' && (<p>${PRACTICE_LABEL}</p>)}`;
    let outside = src;
    for (const region of braceRegions(src, UNKNOWN_GATE)) outside = outside.split(region).join('');
    expect(outside, 'the ungated copy survives the subtraction').toContain(PRACTICE_LABEL);
  });
});

/**
 * T-127 · D-042 — ההערה מנמקת את הכלל שבתוקף, ⛔ לא את זה שבוטל.
 *
 * ⚠️ הבדיקה היחידה בקובץ הזה שרצה על **המקור הגולמי**: כל שאר השומרים מודדים
 * את `CODE` שממנו ההערות הוסרו, ולכן שומר על נוסח הערה **חייב** לקרוא את `SRC`.
 * ⛔ בלי זה הבדיקה עוברת ריק גם אם ההערה נמחקה כולה.
 */
describe('the deck comment cites D-042 and ⛔ never the repealed ban (T-127)', () => {
  it('⛔ no longer justifies «never swipe-to-grade» — D-042 overturned it', () => {
    expect(SRC, 'D-042 החליפה את האיסור בקיצור — נוסח בטל מטעה את הסוכן הבא').not.toContain(
      'never swipe-to-grade',
    );
  });

  it('names D-042 and the two measured caveats, with their numbers', () => {
    // המספרים הם התוכן: הערה שאומרת «יש סייגים» ⛔ אינה מונעת מימוש שמפר אותם.
    // ⚠️ **`200ms` ירד מהרשימה 26/08 (D-090ⓑ · T-157), ו⛔ הדרישה ⛔ לא נזנחה — היא עברה
    // לקובץ שבו המספר חי.** הסייג השלישי של D-042 היה «⛔ אין גרירה, המשוב הוא ≤8px
    // ב-≤200ms»; D-090ⓑ **הפכה** אותו, והכרטיס עוקב עכשיו אחרי האצבע 1:1. ⇒ ציטוט של
    // «200ms» כסייג **כאן** היה נוסח בטל — בדיוק מה שהבדיקה שמעליה נכתבה נגדו. המשך
    // ההשתקעות נמדד עכשיו כמספר, ⛔ ולא כמחרוזת בהערה: `SWIPE_FEEDBACK_MAX_MS` בטווח
    // 150–300ms ב-`lib/core/swipeGrade.test.ts`, ושם גם המעבר של `globals.css`.
    for (const required of ['D-042', '20px', '64px', '30°']) {
      expect(SRC, `${required} — סייג של D-042 שההערה חייבת לשאת`).toContain(required);
    }
  });

  /** ⛔ מוטציה: ההערה ⛔ אינה רשאית להמשיך לצטט את הסייג ש-D-090ⓑ הפכה. */
  it('MUTATION: ⛔ the comment must not still claim the card is never dragged', () => {
    expect(SRC).not.toContain('never dragged with the finger —');
    expect(SRC).toContain('D-090ⓑ');
  });

  it('⛔ adds no control of its own — the deck delegates the gesture to Flashcard', () => {
    // ⚠️ **⟦REFRAMED 13/09 · `T-294`⟧** השם הישן היה «⛔ changes no code at all», והוא
    // תיאר את `T-127` — משימה שכל תוכנה היה הערה. הקנרית שלה הייתה `snap-y`: «אם הוא
    // עדיין כאן, הקוד ⛔ לא זז». ⛔ **הקוד כן זז, ובכוונה** — `T-294` הסיר את הגלילה
    // בהכרעת רוי ⇒ הקנרית מודדת עכשיו את **היעדר המנגנון שהוסר**, ⛔ ולא את יציבות
    // הקובץ. ⇒ היא יורדת, ו⛔ הטענות שמתחתיה ⛔ אינן — הן ⛔ מעולם לא היו על `T-127`:
    // הן על הגבול שהקובץ הזה שומר עד היום, שהמחווה שייכת ל-`Flashcard` ו⛔ לא לדק.
    // 📎 ו«הקוד ⛔ לא זז» עדיין נמדד — בשורה `⛔ carries no vertical scrolling` למעלה,
    // שהיא הפוכה לקנרית הזאת ולכן שומרת בדיוק על הכיוון החדש.
    expect(CODE).not.toContain('preventDefault');
    expect(CODE).not.toContain('onPointerDown');
  });

  it('T-259 — the deck hands Flashcard the grade promise, so a not-taken grade can spring back', () => {
    // T-066 widened the call to (key, wordId, value) — still an expression arrow, ⛔ never a
    // block that drops the promise, and ⛔ never `void`.
    expect(SRC).toMatch(/onGrade=\{\(value\) =>\s*grade\(deckCardKey\(card\), .*card\.word_id, value\)\s*\}/);
    expect(SRC).not.toContain('void grade(');
  });
});
