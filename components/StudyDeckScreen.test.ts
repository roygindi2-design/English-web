import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

/**
 * `<StudyDeckScreen>` — T-065 part ב׳, plan `2026-08-13-study-queue.md` task 6.
 *
 * A source guard, in the same shape and for the same reason as `CardDeck.test.ts`: the
 * vitest environment is `node` and jsdom is deliberately absent (vitest.config.ts), so a
 * render test does not belong here. Geometry is `check:mobile`'s job through `/dev/deck`
 * (task 8).
 *
 * What this file proves is the wiring that would otherwise be believed rather than
 * measured — and one of those claims is the whole of D-033:
 *
 *   ✔ the network lives HERE and only here (`apiGet`/`apiPost`, ⛔ no bare `fetch`)
 *   ✔ **the route is chosen by the deck**: `unknown` ⇒ `/api/practice`, `due` ⇒
 *     `/api/review`. Crossing those two wires is not a typo, it is a schedule change the
 *     learner was promised would not happen
 *   ✔ all five states named by the plan exist in the code, not only in the plan
 *   ✔ `schema_missing` says the bank is not set up, ⛔ never "no cards" — one is a fault
 *     and the other is a normal end of session, and only one of them is the learner's cue
 *     to stop trying
 *   ✔ `elapsed_ms` is clamped to `MAX_ELAPSED_MS`, imported and ⛔ not re-typed as 600000
 *   ✔ a grade that did not reach the server RE-THROWS, because `<CardDeck>` keeps the card
 *     exactly when `onGraded` rejects — swallowing it here is a lost answer there
 *   ✔ ⛔ the F-011 · F-016 dead band is absent
 *
 * ⛔ What it cannot prove, named so nobody mistakes green here for coverage: that the fetch
 * actually returns, that the states render in the right order, or that the offline copy is
 * reachable in a real engine.
 */
const SRC = readFileSync('components/StudyDeckScreen.tsx', 'utf8');

const CODE = withoutComments(SRC);

/**
 * The balanced-brace region opened by `open`, `open` included — the C-0100 lesson, reused
 * verbatim from `CardDeck.test.ts`: a character-distance regex convicts correct code and
 * acquits incorrect code the moment an unrelated line moves. Containment is the claim, so
 * containment is what gets measured.
 */
function braceRegion(source: string, open: string): string {
  const start = source.indexOf(open);
  expect(start, `expected to find ${open} in StudyDeckScreen.tsx`).toBeGreaterThan(-1);
  let depth = 0;
  for (let i = start; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`unbalanced braces after ${open} in StudyDeckScreen.tsx`);
}

/**
 * The gate the practice route is allowed to live behind, and the only one.
 *
 * ⚠️ **Widened C-0318 (T-155), ⛔ and the claim was ⛔ not weakened.** `level` grades write
 * the same two counters as `unknown` (D-032 · D-033 · T-155ⓒ), so the practice route now
 * serves two decks — but it still serves them from ⛔ ONE branch, and `/api/review` is still
 * unreachable from inside it. The string is written out in full rather than matched loosely
 * for the same reason it always was: `deck !== 'due'` would let a fourth deck inherit the
 * practice wire silently, and this test would ⛔ not notice.
 */
const UNKNOWN_GATE = "if (deck === 'unknown' || deck === 'level' || deck === 'sentences') {";

describe('<StudyDeckScreen> — the screen that owns the network (T-065 · § 4.2ו)', () => {
  it('is a client component', () => {
    expect(CODE).toContain("'use client'");
  });

  it('speaks HTTP only through lib/api/client.ts — ⛔ no bare fetch', () => {
    expect(CODE).toMatch(/from '@\/lib\/api\/client'/);
    expect(CODE).toContain('apiGet');
    expect(CODE).toContain('apiPost');
    expect(CODE).not.toMatch(/[^i]fetch\(/);
  });

  /**
   * D-033, measured as CONTAINMENT and ⛔ not as character distance. `/api/practice` must
   * be inside the `unknown` branch and `/api/review` must be outside it: a learner drilling
   * a word they did not know is told, in a label the deck keeps on screen the whole time,
   * that this does not move the review date. Sending those grades to `/api/review` would
   * make that label a lie written by the product itself.
   */
  it('routes by deck: unknown ⇒ /api/practice, due ⇒ /api/review', () => {
    const branch = braceRegion(CODE, UNKNOWN_GATE);
    expect(branch, 'the practice route must be inside the unknown branch').toContain(
      '/api/practice',
    );
    expect(branch, 'the review route must NOT be inside the unknown branch').not.toContain(
      '/api/review',
    );

    const outside = CODE.split(branch).join('');
    expect(outside, 'the review route belongs to the due deck').toContain('/api/review');
    expect(outside, 'the practice route leaked outside the unknown branch').not.toContain(
      '/api/practice',
    );
  });

  /** The extractor itself, so the containment test above cannot pass on an empty string. */
  it('the brace extractor really extracts the branch', () => {
    const branch = braceRegion(CODE, UNKNOWN_GATE);
    expect(branch.length).toBeGreaterThan(40);
    expect(branch.startsWith(UNKNOWN_GATE)).toBe(true);
    expect(branch.endsWith('}')).toBe(true);
  });

  /**
   * T-225 — הראוט ⛔ אינו יכול לדעת מאיזו חפיסה הגיע הדירוג אלא אם המסך אומר. בלי
   * השדה הזה, `deck=level` מקבל 404 על כל מילה חדשה — כלומר על **רוב** החפיסה.
   */
  it('T-225 — גוף הבקשה ל-/api/practice נושא את שם החפיסה', () => {
    const branch = braceRegion(CODE, UNKNOWN_GATE);
    expect(branch).toContain('/api/practice');
    expect(branch, 'שם החפיסה ⛔ אינו נשלח').toMatch(/deck,|deck:\s*deck/);
    // ⛔ ⛔ לא מחרוזת קבועה: המסך משרת שתי חפיסות דרך אותו קריאה.
    expect(branch).not.toMatch(/deck:\s*'(level|unknown)'/);
  });

  it('asks the queue endpoint for the deck it was given', () => {
    expect(CODE).toMatch(/\/api\/study\/queue\?deck=/);
  });

  it('clamps elapsed_ms with the imported ceiling — ⛔ not a re-typed 600000', () => {
    expect(CODE).toMatch(/from '@\/lib\/core\/reviewRequest'/);
    expect(CODE).toContain('MAX_ELAPSED_MS');
    expect(CODE).toContain('Math.min');
    expect(CODE, 'the route rejects a fractional elapsed_ms with 400').toContain('Math.round');
    expect(CODE).not.toContain('600000');
  });

  /**
   * `<CardDeck>` keeps a card exactly when `onGraded` rejects. So the failure path here has
   * to end in a `throw`: a caught-and-swallowed error would drop the card off the screen as
   * if the grade had been saved, and the learner would never see that word again today.
   */
  it('re-throws a grade that did not reach the server — ⛔ the card must stay', () => {
    // The catch that handles a failed grade, and ⛔ not `sendGrade`: that function throws
    // by construction, so measuring IT would stay green while the component quietly
    // swallowed the rejection — measured, C-0102, by deleting the re-throw.
    const recovery = braceRegion(CODE, 'catch (error) {');
    expect(recovery, 'the message is set before the rejection travels on').toContain(
      'setGradeError',
    );
    expect(recovery, 'the rejection is what keeps the card in the deck').toContain('throw error');
  });

  it('treats an {ok:false} answer as a failed grade too — ⛔ not as saved', () => {
    // A 404 from /api/practice or a 503 from /api/review is a grade that did not land. It
    // arrives as DATA (that is this product's HTTP contract), so nothing rejects unless
    // the route function looks at the flag and throws.
    const sender = braceRegion(CODE, 'async function sendGrade');
    expect(sender.match(/if \(!\w+\.ok\) throw/g)?.length, 'both routes checked').toBe(2);
  });

  it('names the offline failure as offline and ⛔ not as a save failure', () => {
    expect(CODE).toContain('ApiUnreachableError');
    expect(CODE).toMatch(/FAILURE_HE\.offline/);
  });

  /** All five states the plan names, each one reachable in the code. */
  it('delegates loading to <CardSkeleton> — ⛔ never a spinner (T-054 · חוקה § 5)', () => {
    // The shape itself is guarded in components/CardSkeleton.test.ts. What this file owns is
    // the wiring: that the `loading` state renders that component and ⛔ nothing else, so a
    // spinner cannot creep back in beside it.
    expect(CODE).toContain("import CardSkeleton from '@/components/CardSkeleton'");
    const loading = braceRegion(CODE, "{state.kind === 'loading' &&");
    expect(loading).toContain('<CardSkeleton />');
    expect(loading).not.toContain('animate-spin');
    // ⛔ Nothing else in the branch: no second element, no sentence, no retry.
    expect(loading.match(/</g)?.length, 'exactly one element in the loading branch').toBe(1);
  });

  it('tells the truth about schema_missing — ⛔ never "no cards"', () => {
    expect(CODE).toContain('schema_missing');
    // T-273: the sentence itself is ⛔ no longer a literal here — it is imported from the
    // one place it lives (`lib/core/failure.ts`) and printed as the constant.
    expect(CODE).toContain('SCHEMA_MISSING_HE');
    expect(CODE).not.toContain('המאגר עדיין לא הוקם');
  });

  it('sends an expired session to /login and offers a retry otherwise', () => {
    // ⚠️ **האסרציה תוקנה ב-T-124 ⛔ ולא נמחקה.** היעד `/login` כבר אינו מחרוזת
    // קשיחה בקובץ הזה — הוא שורה אחת בטבלה `lib/core/failureExit.ts`, שנועלת
    // אותו בבדיקת יחידה אמיתית (`failureExit('session_expired').href`). בדיקה
    // שממשיכה לדרוש `'/login'` **כאן** הייתה מחזירה את הכפילות שהמשימה מחקה.
    expect(CODE).toContain('session_expired');
    expect(CODE).toContain("failureExit('session_expired')");
    expect(CODE).toContain('RETRY_HE');
  });

  it('reuses the shared empty state — ⛔ does not re-word an empty queue', () => {
    expect(CODE).toContain('StudyEmptyState');
    expect(CODE).not.toContain('אין כרטיסיות כרגע');
  });

  it('hands the cards to <CardDeck> and ⛔ does not re-render a card itself', () => {
    expect(CODE).toContain('<CardDeck');
    expect(CODE).not.toContain('<Flashcard');
    expect(CODE).not.toContain('buildCard');
  });

  it('⛔ never centres a flex column — the F-011 · F-016 dead band', () => {
    expect(CODE).not.toMatch(/flex-1[^"'`]*justify-center/);
  });
});

/**
 * T-124 · D-065 — «⛔ אין מסך כשל בלי יציאה», ובמסך הזה: ⛔ אין «נסה שוב» על
 * תקלה שלעולם אינה חולפת. `schema_missing` נפל קודם לענף ברירת המחדל, וקיבל
 * כפתור ניסיון חוזר שלא היה יכול להצליח לעולם — מיגרציה שלא רצה ⛔ לא תרוץ
 * מפני שהלומד לחץ.
 */
describe('T-124 · D-065 — schema_missing ⛔ אינו מציע «נסה שוב»', () => {
  it('יש ענף schema_missing נפרד ב-ActionBar', () => {
    expect(CODE).toMatch(/state\.kind === 'schema_missing' \?/);
  });

  it('הטבלה מיובאת ⛔ והיעדים אינם קשיחים כאן', () => {
    expect(CODE).toContain('failureExit');
    expect(CODE).not.toMatch(/href="\/login"/);
    expect(CODE).not.toMatch(/href="\/studies"/);
  });

  it('⛔ «נסה שוב» אינו ענף ברירת המחדל שתופס גם את schema_missing', () => {
    // זה היה הבאג: `: (` תפס schema_missing והציע כפתור שלעולם לא יצליח.
    const retry = CODE.indexOf('RETRY_HE}');
    const schema = CODE.indexOf("state.kind === 'schema_missing' ?");
    expect(schema).toBeGreaterThan(-1);
    expect(schema).toBeLessThan(retry);
  });

  /**
   * ⚠️ FIXED C-0214 (F-082) ו⛔ לא הוחלש. `"state.kind === 'error' ?"` הפך
   * ל**דו-משמעי** ברגע ש-`layout={state.kind === 'error' ? 'stacked' : 'single'}`
   * נכנס לתג הפתיחה, והמופע הראשון הוא עכשיו התכונה ⛔ ולא ענף ה-JSX. שתי
   * האסרציות שהשתמשו בו נעלו מאותו רגע על קטע קוד אחר משמן — האחת המשיכה לעבור
   * במקרה, והשנייה נפלה. המאתר להלן דורש את `? (` שרק ענף ה-JSX נושא.
   */
  const ERROR_BRANCH = /state\.kind === 'error' \?\s*\(/;

  it('ענף התקלה החולפת נושא גם יציאה — «נסה שוב» לבדו הוא מסך ללא דרך החוצה', () => {
    const start = CODE.search(ERROR_BRANCH);
    expect(start).toBeGreaterThan(-1);
    expect(CODE.slice(start, start + 700)).toMatch(/<a\s/);
  });

  it('⛔ סימון פעולה ראשית אחד בדיוק לכל ענף (F-027 · check:mobile)', () => {
    // `/study` הוא FLOW_ROUTE, והארנס סופר `main [data-primary-action]` ודורש
    // **בדיוק 1**. ⇒ ב-`<ActionBar>` יש ארבע חלופות זרות (session_expired ·
    // schema_missing · empty · ניסיון חוזר), וארבעה סימונים בסך הכל — אחד לכל
    // חלופה. היציאה שנוספה לענף התקלה החולפת היא משנית **במכוון**, ולכן ⛔ אינה
    // מסומנת: סימון חמישי היה מפיל את הארנס על `found 2 elements`.
    // ⚠️ FIXED C-0214 (F-082) ו⛔ לא הוחלש: הביטוי היה `'<ActionBar>'` מילולי,
    // והחזיר -1 ברגע שהסרגל קיבל את התכונה `layout` שהממצא חייב. מה שהאסרציה
    // שומרת — ארבעה סימונים, אחד לכל חלופה — ⛔ לא זז; רק תג הפתיחה רשאי כעת
    // לשאת מאפיינים.
    const open = CODE.search(/<ActionBar[\s>]/);
    expect(open).toBeGreaterThan(-1);
    const bar = CODE.slice(open, CODE.indexOf('</ActionBar>'));
    expect((bar.match(/data-primary-action/g) ?? []).length).toBe(4);

    const errorBranch = bar.slice(bar.search(ERROR_BRANCH));
    expect(errorBranch).toMatch(/<a\s/);
    expect(errorBranch).not.toContain('data-primary-action');
  });
});

/**
 * T-087 · § 4.2ח ⓒ — פעולת סגירה על מסך מנת היום.
 *
 * סורק מקור, ⛔ ⛔ DOM. הענף `state.kind === 'cards'` דורש טעינה מוצלחת של
 * `/api/study/queue`, וההארנס של Vitest רץ בסביבת `node` בלי fetch — היה
 * מרנדר את ה-`loading` state ומגיע לאסרציה של ⛔ ⛔ נכון. הקריאה על המקור
 * מודדת את מה שהקומפיילר יעביר ל-DOM, בלי לדרוש רינדור.
 */
const T087_SRC = readFileSync('components/StudyDeckScreen.tsx', 'utf8')
  .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/[^\n]*$/gm, '');

/** הבלוק של ענף `state.kind === 'cards'` — סוגריים נספרים, ⛔ regex עצל. */
function cardsBranch(src: string): string {
  const at = src.indexOf("state.kind === 'cards'");
  if (at === -1) return '';
  const returnAt = src.indexOf('return (', at);
  if (returnAt === -1) return '';
  let depth = 0;
  for (let i = returnAt + 'return '.length; i < src.length; i += 1) {
    const c = src[i];
    if (c === '(') depth += 1;
    else if (c === ')') {
      depth -= 1;
      if (depth === 0) return src.slice(returnAt, i + 1);
    }
  }
  return '';
}

describe('the study screen carries a WRITTEN way out (T-087 · § 4.2ח ⓒ → T-268)', () => {
  // T-268 (Roy, live product, 06/09) supersedes T-087's icon-only close. Measured C-0490
  // at 375×780: the `absolute start-2 top-2` icon sat ON `<CardDeck>`'s own header row
  // (notice x=140..355 · y=60..80 vs icon x=303..347 · y=60..104) — the «broken card
  // view». The exit is now the deck's `exit` slot: written «חזרה לכרטיסיות» (D-187 §ג׳.1),
  // rendered by `<CardDeck>` inside its own height calc, so nothing is added to the
  // section around it (T-086 stays whole).
  it('קורא מקור עם ענף `cards` תקין', () => {
    expect(T087_SRC.length).toBeGreaterThan(1000);
    const branch = cardsBranch(T087_SRC);
    expect(branch, 'ענף `cards` לא נמצא').toContain('<CardDeck');
  });

  it('הענף `cards` מוסר ל-`<CardDeck>` יציאה כתובה — `exit` עם `href="/cards"` ו-`BACK_TO_CARDS_HE`', () => {
    const branch = cardsBranch(T087_SRC);
    expect(branch, 'חסרה יציאה — `exit=` לא נמסר ל-`<CardDeck>`').toMatch(/<CardDeck[\s\S]*?exit=\{\{/);
    expect(branch, 'היציאה חייבת לחזור לבורר `/cards` (§ 4.2ח ⓒ)').toMatch(/href: '\/cards'/);
    expect(branch, 'הנוסח הוא `חזרה ל<יעד>` (D-187 §ג׳.1) — הקבוע הקיים, ⛔ מחרוזת חדשה').toMatch(
      /labelHe: BACK_TO_CARDS_HE/,
    );
  });

  it('⛔ אין יותר סגירה-אייקון `absolute` על ה-`<section>` — היא ישבה על כותרת החפיסה (T-268 ⓑ)', () => {
    const branch = cardsBranch(T087_SRC);
    expect(branch).not.toContain('data-close');
    expect(branch).not.toContain('<CloseIcon');
    expect(branch).not.toMatch(/aria-label="סגור"/);
    expect(branch).not.toMatch(/\babsolute\b/);
    expect(T087_SRC).not.toMatch(/from ['"]@\/components\/CloseIcon['"]/);
  });

  it('⛔ שום שורה נוספת בתוך ה-`<section>` לפני `<CardDeck>` — חישוב הגובה של T-086', () => {
    // Only the grade-error status line may precede the deck, and it is conditional.
    const branch = cardsBranch(T087_SRC);
    const inner = branch.slice(branch.indexOf('<section'), branch.indexOf('<CardDeck'));
    const rows = inner.match(/<(p|div|nav|header|a|Link|button)\b/g) ?? [];
    expect(rows, `לפני <CardDeck> מותרת רק שורת השגיאה המותנית, נמצא: ${rows.join(' ')}`).toEqual(['<p']);
  });

  it('⛔ ⛔ `data-primary-action` על היציאה — עלול לשבור F-027 של `/study`', () => {
    const branch = cardsBranch(T087_SRC);
    expect(branch, '⛔ ⛔ `data-primary-action` בענף `cards`').not.toMatch(/data-primary-action/);
  });

  it('⛔ ⛔ SVG מוטבע נוסף בכל הקובץ (חוקה § 6)', () => {
    expect(T087_SRC.match(/<svg\b/g) ?? [], 'SVG מוטבע חדש ⛔ ⛔ בקובץ הזה').toHaveLength(0);
  });
});

/**
 * T-066 · D-156 · D-169 — the fourth deck on the same screen. Three facts a reader would
 * otherwise take on trust: the screen READS `items` (the sentences wire) beside `cards`, the
 * heading is a record over every `DeckName` (so «משפטים» exists by construction), and a
 * sentence item grades through the practice wire — never `/api/review`.
 */
describe('T-066 — «משפטים» on the same screen (D-169)', () => {
  it('reads `items` beside `cards` inside load()', () => {
    const load = braceRegion(CODE, 'const load = useCallback(async () => {');
    expect(load).toContain('body.items');
    expect(load).toContain('body.cards');
  });

  it('the heading is a Record<DeckName, string> that carries «משפטים»', () => {
    expect(CODE).toMatch(/const HEADINGS: Record<DeckName, string> = \{/);
    expect(CODE).toContain("const SENTENCES_HEADING_HE = 'משפטים'");
    expect(CODE).toContain('{HEADINGS[deck]}');
  });

  it('a sentence item can never reach /api/review — the guard sits before the call', () => {
    const guard = CODE.indexOf('if (isSentenceCard(card)) throw');
    const review = CODE.indexOf("apiPost<GradeResponse>('/api/review'");
    expect(guard).toBeGreaterThan(-1);
    expect(review).toBeGreaterThan(guard);
  });
});

/**
 * 📍 **`T-400` · `F-272` · `D-260` — החוט: המספר יורד עם התור, ⛔ ולא בבקשה שנייה.**
 *
 * 🔬 **נמדד `C-0663`, ⛔ ולא שוער:** `grep -n 'summary|unseen|levels/summary'` על הקובץ
 * הזה החזיר **0** ⇒ המסך ⛔ לא החזיק את המספר, ושתי הדרכים הישירות אליו חסומות —
 * קריאה שנייה ל-`/api/levels/summary` סותרת את `§ 4.2ז`, והרמת מצב ל-`<LevelMapScreen>`
 * חוצה למסך אחר. ⇒ מה שנשאר הוא בדיוק מה שהבדיקות כאן סוגרות.
 */
describe('T-400 — `unseen` נוסע מהתשובה אל הדק, ⛔ בלי קריאה שנייה', () => {
  it('⛔ אפס בקשה ל-/api/levels/summary מהמסך הזה', () => {
    expect(CODE).not.toContain('/api/levels/summary');
    // בקשת ה-GET היחידה של המסך היא התור, בדיוק כפי שהייתה.
    const gets = CODE.match(/apiGet</g) ?? [];
    expect(gets).toHaveLength(1);
  });

  it('`unseen` נקרא מגוף התשובה בתוך load()', () => {
    const load = braceRegion(CODE, 'const load = useCallback(async () => {');
    expect(load).toContain('body.unseen');
    // ⛔ `typeof` ⛔ ולא נפילה לאמת: `unseen: 0` הוא תשובה אמיתית, ו-`??`/`||`
    // היו מוחקים בדיוק את המספר היחיד שהלומד הרוויח.
    expect(load).toContain("typeof body.unseen === 'number'");
  });

  it('הוא מועבר ל-<CardDeck> כ-`unseenInLevel`, ⛔ ואינו נגזר שם מחדש', () => {
    expect(CODE).toContain('unseenInLevel={state.unseenInLevel}');
  });
});
