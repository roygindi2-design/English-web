import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * `<DeckSelector>` — the כרטיסיות selector, T-065 part ג׳, plan
 * `2026-08-13-study-queue.md` task 7.
 *
 * A source guard, in the same shape and for the same reason as `CardDeck.test.ts` and
 * `StudyDeckScreen.test.ts`: the vitest environment is `node` and jsdom is deliberately
 * absent (vitest.config.ts), so a render test does not belong here. Geometry — three
 * targets ≥44px with ≥8px between them, no horizontal scroll, no second bottom bar — is
 * `check:mobile`'s job through the `/dev/tabs/cards` fixture.
 *
 * What this file proves is the part of § 4.2ו that is otherwise believed rather than
 * measured:
 *
 *   ✔ the counts come from `total`, at `limit=1` — ⛔ a whole deck is never pulled for a
 *     number, and ⛔ `cards.length` is not the count (it is capped by `limit`)
 *   ✔ **there are always THREE cards.** An empty deck is disabled WITH its number and
 *     ⛔ never hidden: a learner who sees two cards today and three tomorrow cannot tell
 *     whether the product changed or they did
 *   ✔ the locked sentences deck carries `aria-disabled` and ⛔ no `href` (D-035 — T-066 is
 *     blocked on two measurable conditions, and a link that 404s is not "locked")
 *   ✔ a failed fetch leaves all three disabled reading «—», ⛔ not an error screen and
 *     ⛔ not an empty one
 *   ✔ ⛔ no `<ActionBar>` — D-028 forbids two bottom-anchored bars, and this screen carries
 *     the tab bar
 *   ✔ ⛔ the F-011 · F-016 dead band is absent
 *
 * ⛔ What it cannot prove, named so nobody mistakes green here for coverage: that the two
 * requests actually return, that the disabled card is truly unclickable in an engine, or
 * that the numbers on screen match the database.
 */
const SRC = readFileSync('components/DeckSelector.tsx', 'utf8');

/** C-0032/C-0071/C-0072: a guard a comment can satisfy guards nothing. */
function withoutComments(source: string): string {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}

const CODE = withoutComments(SRC);

/**
 * The balanced-brace region opened by `open`, `open` included — the C-0100 lesson, reused
 * from `CardDeck.test.ts`: a character-distance regex convicts correct code and acquits
 * incorrect code the moment an unrelated line moves. Containment is the claim, so
 * containment is what gets measured.
 */
function braceRegion(source: string, open: string): string {
  const start = source.indexOf(open);
  expect(start, `expected to find ${open} in DeckSelector.tsx`).toBeGreaterThan(-1);
  let depth = 0;
  for (let i = start; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`unbalanced braces after ${open} in DeckSelector.tsx`);
}

/** The three entries, by the key each one is built under. */
const SENTENCES_ENTRY = "key: 'sentences'";

describe('<DeckSelector> — the deck selector (T-065 · § 4.2ו)', () => {
  it('is a client component', () => {
    expect(CODE).toContain("'use client'");
  });

  it('speaks HTTP only through lib/api/client.ts — ⛔ no bare fetch', () => {
    expect(CODE).toMatch(/from '@\/lib\/api\/client'/);
    expect(CODE).toContain('apiGet');
    expect(CODE).not.toMatch(/[^i]fetch\(/);
  });

  /**
   * `total` is the count BEFORE the slice to `limit` (the contract table in
   * `docs/api-contract.md`), which is the only reason one row is enough. Reading
   * `cards.length` instead would print "1" for every non-empty deck — a number that is
   * always wrong and never obviously wrong.
   */
  it('asks each deck for one row and reads total — ⛔ never cards.length', () => {
    expect(CODE).toContain('deck=due&limit=1');
    expect(CODE).toContain('deck=unknown&limit=1');
    expect(CODE).toContain('.total');
    expect(CODE).not.toContain('cards.length');
  });

  /**
   * ⚠️ **שלושה ⇒ ארבעה, C-0318 (T-210ⓓ · `36 § 5`), ו⛔ הכלל ⛔ לא נחלש.** `36 § 5` נוקב
   * בשתי חפיסות — `סינון מילים` ו-`חזרה`; `מנת היום` נשארת כ**סטייה מוצהרת** (§ 4.2כ ד׳ —
   * היא הכניסה היחידה ל-`/study` במוצר כולו), ו-`משפטים` ⛔ לא נגעו בה. מה שנמדד הוא אותו
   * דבר בדיוק שנמדד קודם: **מספר קבוע של אריחים**, ⛔ ולא רשימה שגדלה ומתכווצת מתחת ללומד.
   */
  it('renders exactly four entries, and the last is the sentences deck', () => {
    expect(CODE).toContain("key: 'level'");
    expect(CODE).toContain("key: 'unknown'");
    expect(CODE).toContain("key: 'due'");
    expect(CODE).toContain(SENTENCES_ENTRY);
    expect(CODE.match(/key: '/g)?.length).toBe(4);
  });

  it('`36 § 5` — «סינון מילים» היא הראשונה, ו«חזרה» מיד אחריה', () => {
    expect(CODE.indexOf("key: 'level'")).toBeLessThan(CODE.indexOf("key: 'unknown'"));
    expect(CODE.indexOf("key: 'unknown'")).toBeLessThan(CODE.indexOf("key: 'due'"));
  });

  /**
   * ⛔ **מוטציה, ונופלת בשם.** מאז T-210 «לא ידעתי» היא **המונה האמצעי** של המסך הזה
   * (`36 § 5`: ידעתי · לא ידעתי · לא סוננו). אותן שתי מילים גם כשם חפיסה הן מושג אחד
   * בשתי צורות — חוקה § 6 — ולכן `36 § 5` קורא לחפיסה `חזרה`.
   */
  it('MUTATION: «לא ידעתי» ⛔ אינה שם של אריח חפיסה', () => {
    expect(CODE).toContain("const PRACTICE_LABEL_HE = 'חזרה'");
    expect(CODE).not.toMatch(/LABEL_HE = 'לא ידעתי'/);
  });

  /**
   * F-140 — האריח נעול בכוונה, ⛔ ולא ריק. `/api/practice` עונה 404 על מילה בלי שורת
   * `word_progress`, וחפיסת הרמה היא בדיוק אוסף המילים האלה ⇒ CTA ראשי שנכשל בהקשה
   * הראשונה. ⛔ אין להחליף את `href: null` לפני ש-F-140 נסגר.
   */
  it('F-140 — «סינון מילים» נעולה עם המספר, ⛔ ולא מנווטת', () => {
    const region = braceRegion(CODE, "{\n      key: 'level'");
    expect(region).toContain('href: null');
    expect(region).toContain('locked: true');
    expect(region).toContain('LEVEL_NOTE_HE');
    expect(region).not.toContain('/study');
  });

  /**
   * D-035, measured as CONTAINMENT and ⛔ not as proximity: the sentences entry must carry
   * `href: null`, because "locked" that navigates is not locked. T-066 is blocked on two
   * conditions that are still open (F-033), and 806 sentences behind a broken gate are
   * exactly what the block exists to keep off a learner's screen.
   */
  it('locks the sentences deck with href: null — ⛔ no navigation (F-142 · F-143)', () => {
    const region = braceRegion(CODE, `{\n      ${SENTENCES_ENTRY}`);
    expect(region).toContain('href: null');
    expect(region).toContain('locked: true');
    expect(region).not.toContain('/study');
    expect(region).not.toContain('/sentences');
  });

  /**
   * **T-199ⓑ ⓒ · C-0321 — המספר שמחליף את המנעול, ונמדד באריח עצמו.**
   *
   * `render_video_A.py:290,296` מצייר את השורה השנייה של כל אריח כ-`<מספר> <צירוף שם>`,
   * ואריח «משפטים» היה היחיד במסך ששורתו השנייה ⛔ אינה מספר. D-096 פסלה את המצב הזה
   * ב-22/08, ו-D-097 מדדה ב-23/08 ששני תנאי D-035 מולאו. ⇒ יש מספר, והוא מוצג.
   */
  it('T-199ⓑ — השורה השנייה של «משפטים» היא המספר, ⛔ ולא «נעול»', () => {
    const region = braceRegion(CODE, `{\n      ${SENTENCES_ENTRY}`);
    expect(region).toContain('SENTENCES_NOTE_HE');
    expect(region).not.toContain('LOCKED_HE');
    expect(CODE).toContain('const SENTENCES_NOTE_HE =');
    // אותה צורה בדיוק כמו שלושת האריחים האחרים: מספר, ואז צירוף שם.
    expect(CODE).toMatch(/SENTENCES_NOTE_HE = \(n: string\) => `\$\{n\} משפטים/);
  });

  it('T-199ⓒ — המונה נקרא בפועל, ובאותה קריאה מקבילה כמו השאר', () => {
    expect(CODE).toContain("const SENTENCES_QUERY = '/api/study/queue?deck=sentences&limit=1'");
    expect(CODE).toMatch(/Promise\.all\(\[[\s\S]{0,200}readTotal\(SENTENCES_QUERY\)/);
    expect(CODE).toMatch(/setCounts\(\{ due, unknown, sentences \}\)/);
  });

  /**
   * ⛔ «—» ⛔ אינו `0`, וזו הבדיקה שמונעת בדיוק את הבלבול הזה: קריאה שנכשלה וחפיסה ריקה
   * נראות זהות על המסך, ורק אחת מהן נכונה. `noteFor` הוא המקום היחיד שמכריע, והאריח
   * החדש עובר דרכו בדיוק כמו שלושת הקודמים.
   */
  it('קריאה שנכשלה ⇒ «—» בתוך המשפט, ⛔ ולא 0', () => {
    const region = braceRegion(CODE, `{\n      ${SENTENCES_ENTRY}`);
    expect(region).toContain('SENTENCES_NOTE_HE(noteFor(counts.sentences))');
    expect(CODE).toMatch(/count === null \? UNKNOWN_COUNT_HE : String\(count\)/);
    expect(CODE).toContain("const UNKNOWN_COUNT_HE = '—'");
  });

  /**
   * § 4.2ו: an empty deck is DISABLED WITH ITS NUMBER. The number therefore has to be
   * rendered by markup both branches share — if each branch had its own copy, one of them
   * could lose it and every test here would stay green.
   */
  it('renders the note from one shared body, so a disabled card keeps its number', () => {
    expect(CODE.match(/const body = \(/g)?.length).toBe(1);
    const link = braceRegion(CODE, '{entry.enabled ? (');
    expect(link).toContain('{body}');
    expect(link.match(/\{body\}/g)?.length).toBe(2);
  });

  it('enables a deck only when its count is a positive number', () => {
    expect(CODE).toMatch(/href !== null && count !== null && count > 0/);
  });

  it('marks a disabled card aria-disabled and ⛔ never renders it as a link', () => {
    expect(CODE).toContain('aria-disabled');
    // The disabled branch is a <button> with no handler: type="button" cannot submit, and
    // an absent onClick cannot navigate. A <Link> with a null href would be a runtime
    // error, and an <a> without href is not focusable.
    expect(CODE).toMatch(/<button\s+type="button"/);
    expect(CODE).not.toMatch(/<a\s+href=\{entry/);
  });

  /**
   * The failure state named by the plan: three disabled cards reading «—». An error screen
   * here would replace the tab's own content with a sentence, and an empty state would tell
   * the learner they have nothing to study when in fact we do not know.
   */
  it('shows «—» when a count is unknown, and ⛔ no error screen', () => {
    expect(CODE).toContain("'—'");
    expect(CODE).not.toContain('FAILURE_HE');
    expect(CODE).not.toContain('StudyEmptyState');
  });

  /** D-028: this screen carries the tab bar, so it never carries an action bar. */
  it('has ⛔ no ActionBar (D-028)', () => {
    expect(CODE).not.toContain('ActionBar');
    expect(CODE).not.toContain('data-action-bar');
  });

  /** F-011 · F-016 — the dead band, measured on every screen since C-0013. */
  it('⛔ has no vertically centred dead band (F-011 · F-016)', () => {
    expect(CODE).not.toMatch(/flex-1[^"]*justify-center/);
    expect(CODE).not.toMatch(/justify-center[^"]*flex-1/);
  });

  /**
   * T-078. «locked» is one concept and it shipped in two forms: the world tab in
   * `TabBar` carries an inline `LockIcon` beside its label, while the sentences deck
   * here carried the bare word «נעול». Constitution § 1 — colour (or here, a lone muted
   * word) is never the only channel — and § 6, one component per role.
   *
   * ⚠️ Asserted as an *import of the shared component* and ⛔ not as `<svg`: pasting a
   * second copy of the path data into this file would satisfy a `toContain('<svg')`
   * assertion while creating exactly the divergence the task exists to remove.
   */
  it('marks the locked deck with the shared lock icon, ⛔ not by word alone (T-078)', () => {
    expect(CODE).toMatch(/import LockIcon from '@\/components\/LockIcon'/);
    expect(CODE).toContain('<LockIcon />');
    // ⛔ No second copy of the artwork.
    expect(CODE).not.toContain('<svg');
    expect(CODE).not.toContain('viewBox');
  });

  /**
   * The icon is decoration for a word that is already there. ⛔ The Hebrew stays
   * `LOCKED_HE`, and the enabling rule is untouched — the icon renders off the same
   * `entry.enabled` flag the row already had, and introduces no second source of truth.
   */
  /**
   * ⚠️ **הופרד C-0318, ו⛔ זה ⛔ אינו ריכוך — זו הפרדה של שתי עובדות שהיו כרוכות.** קודם
   * המנעול נגזר מ**טקסט ההערה** (`entry.note === LOCKED_HE`), ומאז T-210 ההערה היא **משפט
   * עם מספר** ⇒ אריח יכול להיות נעול **ולהציג את המספר שלו** (F-140 · «סינון מילים»),
   * וגזירה מהטקסט הייתה מוחקת את המנעול שלו בשקט. ⛔ `enabled: false` עדיין ⛔ אינו מנעול:
   * חפיסה ריקה מושבתת עם המספר ו⛔ אינה נעולה (§ 4.2ו).
   */
  /**
   * ⚠️ **הועבר C-0321, ו⛔ זה ⛔ אינו ריכוך.** «נעול» כבר ⛔ אינה יכולה לשבת בשורת ההערה:
   * D-096 קובעת שאריח מושבת בלי מספר אינו מצב חוקי, והרנדר מצייר `<מספר> <צירוף שם>` בכל
   * אריח. ⇒ המילה עברה ל-`sr-only` ליד השם. ⛔ **המדידה התחזקה:** קודם נמדד שהמילה קיימת
   * **באריח אחד**; עכשיו נמדד שהיא נוסעת עם **כל** אריח נעול, שהיא ⛔ אינה נראית, ושהיא
   * ⛔ אינה חוזרת להיות ההערה.
   */
  it('«נעול» נוסעת עם כל אריח נעול כ-sr-only, והמנעול הוא עובדה בפני עצמה (T-078)', () => {
    expect(CODE).toContain("const LOCKED_HE = 'נעול'");
    expect(CODE).toMatch(/entry\.locked === true \? <LockIcon \/> : null/);
    expect(CODE).toMatch(
      /entry\.locked === true \? <span className="sr-only">\{LOCKED_HE\}<\/span> : null/,
    );
    // ⛔ המנעול ⛔ אינו נגזר מהטקסט — לא מהערה ולא מהמילה.
    expect(CODE).not.toContain('entry.note === LOCKED_HE');
    // ⛔ **המוטציה של T-199ⓑ, ונופלת בשם:** «נעול» כהערה של אריח היא בדיוק המצב ש-D-096
    // פסלה, ו-`render_video_A.py:290,296` ⛔ אינו מצייר אף שורה שנייה שאינה מספר.
    expect(CODE).not.toContain('note: LOCKED_HE');
  });
});

describe('T-123 · D-064 — מסך שכל האריחים בו מושבתים ⛔ אינו חוקי', () => {
  it('הכלל מואצל ל-lib/core ⛔ ואינו משוכפל כאן', () => {
    expect(CODE).toContain('allTilesDead');
  });

  it('⛔ אין מצב ריק בזמן טעינה — «אין מה לתרגל» לפני שהמספרים נוחתים הוא שקר', () => {
    expect(CODE).toMatch(/!loading\s*&&\s*allTilesDead/);
  });

  it('המצב הריק נושא פעולה אחת שמנווטת ⛔ ולא כפתור מת', () => {
    expect(CODE).toContain('DECK_ALL_EMPTY_HREF');
    expect(CODE).toContain('data-deck-empty');
  });

  it('⛔ שלושת האריחים לא נמחקו — «מושבת עם המספר» הוא מידע (§ 4.2ו)', () => {
    expect(CODE).toContain('data-deck-selector');
    expect(CODE.indexOf('data-deck-empty')).toBeLessThan(CODE.indexOf('data-deck-selector'));
  });

  /**
   * ⚠️ **הכלל נגזר C-0318 במקום להיות מקודד לאריח אחד, ו-`check:mobile` הוא שכפה זאת:**
   * הוא מפיל מסך שנושא משהו אחר מ**סימון אחד בדיוק** (F-027). «`due` כשהוא פעיל» ⛔ אינו
   * יכול לשרוד אריח פעיל **מעליו** — ולכן הראשי הוא **האריח הפעיל הראשון בסדר של `36 § 5`**,
   * והספירה היא אחת מעצם הבנייה.
   */
  it('פעולה ראשית אחת בדיוק, והיא נגזרת ⛔ ולא מקודדת לאריח', () => {
    expect(CODE).toMatch(/const primaryKey = entries\.find\(\(entry\) => entry\.enabled\)\?\.key \?\? null/);
    expect(CODE.match(/data-primary-action=\{entry\.key === primaryKey/g)?.length).toBe(1);
    // ⛔ אריח מושבת ⛔ אינו יכול לשאת סימון בכלל — הענף שלו ⛔ אינו פולט את התכונה.
    const disabled = braceRegion(CODE, '<button');
    expect(disabled).not.toContain('data-primary-action');
  });
});
