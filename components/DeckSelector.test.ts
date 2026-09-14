import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

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
 *   ✔ the sentences deck OPENS through `toEntry` (T-199ⓐ · D-169) — disabled WITH its number
 *     when the band is empty, ⛔ never locked, ⛔ never hand-built with `enabled: true`
 *   ✔ **a failed fetch SAYS it failed** (`T-295` · `D-214`) — the tile's sentence names the
 *     failure, «—» is left to mean «⛔ no read was made», `0` still means `0`, the way out
 *     is one `טעינה מחדש` control that re-reads in place, and «אין מה לתרגל» is ⛔ never
 *     rendered off a read that never arrived. ⛔ Still ⛔ not an error screen: the tiles stay
 *   ✔ ⛔ no `<ActionBar>` — D-028 forbids two bottom-anchored bars, and this screen carries
 *     the tab bar
 *   ✔ ⛔ the F-011 · F-016 dead band is absent
 *
 * ⛔ What it cannot prove, named so nobody mistakes green here for coverage: that the two
 * requests actually return, that the disabled card is truly unclickable in an engine, or
 * that the numbers on screen match the database.
 */
const SRC = readFileSync('components/DeckSelector.tsx', 'utf8');

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

/**
 * `T-321` — הבלוק של דרך היציאה הוא מאז **קבוע JSX** (`const recoveryBlock = (…)`),
 * ⛔ ולא ביטוי `{readFailed && (…)}` בתוך ה-`return`. ⇒ ‏`braceRegion` ⛔ אינו מתאים לו:
 * הוא סופר סוגריים מסולסלים, והראשון שהוא פוגש כאן הוא `{READ_FAILED_BODY_HE}` —
 * שנסגר מיד ומחזיר פרוסה בת שורה. הפרוסה כאן חתוכה על **הסוגר של הקבוע**.
 */
function recoveryRegion(source: string): string {
  const start = source.indexOf('const recoveryBlock = (');
  expect(start, 'expected to find const recoveryBlock = ( in DeckSelector.tsx').toBeGreaterThan(
    -1,
  );
  const end = source.indexOf('\n  );', start);
  expect(end, 'expected the recoveryBlock constant to be closed').toBeGreaterThan(start);
  return source.slice(start, end);
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
   * T-225ⓒ · D-142 — F-140 נסגר: `/api/practice` פותח שורה עבור `deck=level`
   * (`app/api/practice/route.ts`, ענף `payload.deck !== 'level'`), ולכן האריח
   * ⛔ אינו CTA שנכשל בהקשה הראשונה יותר. ⛔ המנעול יורד, ⛔ והמספר נשאר.
   */
  it('T-225ⓒ — «סינון מילים» מנווטת אל `/study?deck=level`, ⛔ ואינה נעולה', () => {
    const region = braceRegion(CODE, "{\n      key: 'level'");
    expect(region).toContain("href: '/study?deck=level'");
    expect(region).not.toContain('locked: true');
    expect(region).toContain('LEVEL_NOTE_HE');
  });

  /**
   * ⛔ **מוטציה, ונופלת בשם.** רמה ריקה או קריאה שנכשלה ⇒ `unseen` הוא `0`/`null`,
   * ו-`toEntry` מחזיר `enabled: false` **עם המספר** (§ 4.2ו). אריח שנכתב ידנית עם
   * `enabled: true` היה עוקף בדיוק את הכלל הזה.
   */
  it('MUTATION: אריח הרמה עובר דרך `toEntry`, ⛔ ולא נבנה ביד', () => {
    const region = braceRegion(CODE, "{\n      key: 'level'");
    expect(region).not.toContain('enabled: true');
    expect(CODE).toMatch(/toEntry\(\{\s*\n\s*key: 'level'/);
  });

  /**
   * T-199ⓐ · D-169 — the INVERSE of the D-035 lock this test used to measure, and inverted
   * by name: the entry carries the URL, ⛔ no `href: null`, ⛔ no `locked: true`, and it is
   * built by `toEntry` so an empty band is disabled WITH its number (§ 4.2ו) rather than
   * hand-enabled.
   */
  it('T-199ⓐ — the sentences tile opens to /study?deck=sentences through toEntry (D-169)', () => {
    const region = braceRegion(CODE, `{\n      ${SENTENCES_ENTRY}`);
    expect(region).toContain("href: '/study?deck=sentences'");
    expect(region).not.toContain('href: null');
    expect(region).not.toContain('locked: true');
    expect(region).not.toContain('enabled: true');
    expect(CODE).toMatch(/toEntry\(\{\s*\n\s*key: 'sentences'/);
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
   * ⛔ «—» ⛔ אינו `0` — ⛔ ומאז `T-295` הוא גם ⛔ אינו «נכשל». שלושת המצבים נפרדים
   * **בטקסט**, ⛔ ולא בצבע, וכולם עוברים דרך `tileNote` — נקודת הכרעה אחת, בדיוק כמו
   * ש-`noteFor` היה הנקודה היחידה קודם.
   */
  it('T-295ⓐ — קריאה שנכשלה נוקבת בכך במשפט, ⛔ ולא «—» ו⛔ לא 0', () => {
    const region = braceRegion(CODE, `{\n      ${SENTENCES_ENTRY}`);
    expect(region).toContain(
      'tileNote(deckState(counts.sentences), counts.sentences, SENTENCES_NOTE_HE)',
    );
    // ⛔ `noteFor` ⛔ לא רוכך: «—» עדיין נוסע כשאין מספר, והוא עדיין ⛔ אינו `0`.
    expect(CODE).toMatch(/count === null \? UNKNOWN_COUNT_HE : String\(count\)/);
    expect(CODE).toContain("const UNKNOWN_COUNT_HE = '—'");
    // ⛔ והמשפט של הכשל ⛔ אינו «—» ו⛔ אינו מספר.
    expect(CODE).toContain("const READ_FAILED_NOTE_HE = 'הנתונים לא נטענו'");
    expect(CODE).toMatch(/state === 'failed' \? READ_FAILED_NOTE_HE : sentence\(noteFor\(count\)\)/);
  });

  /**
   * ⛔ **הבדיקה שמונעת את השקר הקצר** (D-064, אותו כלל): בזמן שהקריאות בדרך כל מונה הוא
   * `null` ו⛔ שום דבר ⛔ לא נכשל. `'failed'` נגזר ⛔ אך ורק אחרי ש-`loading` נפל.
   */
  it('T-295ⓐ — «נכשל» ⛔ אינו נגזר מ-`null` לבדו, אלא רק אחרי שהטעינה הסתיימה', () => {
    expect(CODE).toMatch(/loading \? 'unknown' : count === null \? 'failed' : 'ok'/);
    expect(CODE).toMatch(/readFailed =\s*\n?\s*!loading &&/);
  });

  /**
   * ⓒ — אריח `סינון מילים` ⛔ אינו יכול לדווח «נכשל»: הרכיב הזה ⛔ אינו קורא את המספר
   * שלו כלל (`unseen` מגיע מהמסך, § 4.2ז), ולכן היעדרו הוא «⛔ לא ידוע» ⛔ ולא כשל.
   */
  it('T-295ⓐ — אריח שלא נקרא כאן מדווח «—», ⛔ ולא «נכשל»', () => {
    const region = braceRegion(CODE, `{\n      key: 'level'`);
    expect(region).toContain("tileNote(unseen === null ? 'unknown' : 'ok', unseen, LEVEL_NOTE_HE)");
    expect(region).not.toContain('deckState');
  });

  /**
   * ⓑ — ‏`ui-ux-pro-max` § Feedback, «Error Recovery»: `Don't: Error without recovery
   * path`. ⛔ ריענון עמוד ⛔ אינו מסלול יציאה — הוא ⛔ אינו פקד, ולומד שלא יודע שמשהו
   * נשבר ⛔ אין לו סיבה לבצע אותו.
   */
  it('T-295ⓑ — לכשל יש דרך החוצה: פקד ≥44px שקורא מחדש **במקום**', () => {
    expect(CODE).toContain('data-deck-failed');
    expect(CODE).toContain("const RETRY_ACTION_HE = 'טעינה מחדש'");
    // ⚠️ `T-321` הוציא את הבלוק לקבוע `recoveryBlock` כדי שיתרנדר בשני מקומות.
    // **העוגן זז; מה שנבדק כאן ⛔ לא.**
    const retry = recoveryRegion(CODE);
    expect(retry).toContain('min-h-touch');
    expect(retry).toContain('setAttempt((previous) => previous + 1)');
    expect(retry).toContain('setLoading(true)');
    // ⛔ ⛔ לא ניווט ו⛔ לא ריענון — קריאה חוזרת של אותו אפקט.
    expect(retry).not.toContain('window.location');
    expect(retry).not.toContain('<Link');
    expect(CODE).toMatch(/\}, \[attempt\]\)/);
  });

  /**
   * 🔴 **תרחיש הכישלון שהשורה נפתחה עליו, ונמדד חי ב-C-0535:** `/api/study/queue` החזיר
   * `503 {"ok":false}` שלוש פעמים, `סינון מילים` הציג `314`, ושלושת האחרים הציגו «—».
   * ⇒ מסך שנראה שלם עם שלושה אריחים מתים. ⛔ ובמצב שכולם מתים, «אין מה לתרגל» הוא
   * טענה על המאגר שנאמרה מתוך קריאה ש⛔ לא הגיעה.
   */
  it('T-295ⓐ — «אין מה לתרגל» ⛔ אינו מוצג כשהקריאה נכשלה', () => {
    expect(CODE).toMatch(/\{dead && !readFailed && \(/);
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
   * ⚠️ **מה ש-`T-295` ⛔ לא שינה, ולכן הוא נמדד בנפרד.** הכשל נוקב בשמו — ⛔ אבל ⛔ לא
   * במסך שגיאה שמחליף את תוכן הלשונית במשפט. ארבעת האריחים נשארים, עם המספרים שלהם
   * (§ 4.2ו), והמשפט של הכשל יושב **בתוך** האריח שנכשל.
   */
  it('shows «—» when a count is unknown, and ⛔ still no error SCREEN', () => {
    expect(CODE).toContain("'—'");
    expect(CODE).not.toContain('StudyEmptyState');
    // ⛔ האריחים ⛔ אינם מוחלפים — הרשימה מרונדרת בלי תנאי.
    expect(CODE).toMatch(/<ul aria-busy=\{loading\} data-deck-selector/);
  });

  /**
   * ⛔ **פעולה ראשית אחת בדיוק, גם במצב הכשל** — `check:mobile` מפיל מסך שנושא אחרת
   * (F-027). הפקד נעשה ראשי **רק** כשאין ולו אריח פעיל אחד, כלומר כשהוא הדבר היחיד
   * שאפשר ללחוץ עליו.
   */
  it('T-295ⓑ — פקד הטעינה מחדש ראשי ⛔ רק כשאין אריח פעיל', () => {
    const retry = recoveryRegion(CODE);
    expect(retry).toContain("data-primary-action={primaryKey === null ? 'true' : undefined}");
  });

  /**
   * 🔴 **תרחיש הכישלון של `T-321`, נמדד חי ב-C-0576 ב-375×780:** שלוש הקריאות חזרו
   * `503`, שלושת האריחים הציגו «הנתונים לא נטענו», ו-`טעינה מחדש` — **הפקד היחיד
   * שאפשר ללחוץ עליו על המסך כולו** — מדד `top=816 · bottom=870` בעוד סרגל הלשוניות
   * מתחיל ב-`top=707`. ⇒ **109px מתחת לקיפול ב-780, ו-222px ב-667.**
   *
   * 🔴 **ו-`T-349` מדד את אותו כשל בדיוק בכשל ה<שלם>חלקי</שלם>, C-0608, אותו מסך:**
   * `top=783.5 · bottom=869.5` על מסך 780, סרגל הלשוניות ב-`top=707`. הפעם אריח
   * «סינון מילים» כן היה חי (‏`unseen = 314`) ⇒ `primaryKey !== null` ⇒ הבלוק ירד אל
   * מתחת לרשימה. ⛔ **והנימוק של `T-295`ⓑ ⛔ לא נסתר — הוא נמדד:** הוא החזיק «כל עוד
   * יש אריח חי ללחוץ עליו», ואריח חי הוא **חפיסה אחרת**, ⛔ ולא ניסיון חוזר. לומד
   * שקריאותיו נכשלו ⛔ אינו רוצה חפיסה אחרת; הוא רוצה את המידע שלא הגיע.
   * ⇒ **אתר רינדור אחד, לפני הרשימה, בכל `readFailed`** — מלא כחלקי.
   *
   * ⛔ **והבדיקה היא על הסדר, ⛔ ולא על מחלקות CSS.**
   */
  it('T-349 — דרך היציאה מרונדרת ⛔ לפני הרשימה בכל כשל, מלא כחלקי', () => {
    const site = '{readFailed && recoveryBlock}';
    const listOpen = CODE.indexOf('<ul aria-busy={loading}');
    const listClose = CODE.indexOf('</ul>');

    // ⛔ אתר אחד, ⛔ ולא שניים — ⛔ אין עוד «לפני» ו«אחרי».
    expect(CODE.match(/\{readFailed && recoveryBlock\}/g)).toHaveLength(1);
    expect(CODE).not.toContain('primaryKey === null && recoveryBlock');
    expect(CODE).not.toContain('primaryKey !== null && recoveryBlock');

    // והוא לפני הרשימה, ⛔ ולא אחריה.
    const before = CODE.indexOf(site);
    expect(before).toBeGreaterThan(-1);
    expect(listOpen).toBeGreaterThan(-1);
    expect(before).toBeLessThan(listOpen);
    expect(before).toBeLessThan(listClose);

    // ⛔ ⛔ ולא מסך שגיאה ו⛔ לא אריח רביעי — אותו בלוק, מקום אחד.
    expect(CODE.match(/data-deck-failed/g)).toHaveLength(1);
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

/**
 * `T-322` — **הכישלון מגיע לערוץ שני, ⛔ ולא רק לעין.**
 *
 * ⛔ מה שנמדד לפני השורה הזאת, בגְרֶפּ על הקוד עצמו: `role=` ו-`aria-live` ⇒ **אפס**.
 * שלושת האריחים מחליפים משפט, `recoveryBlock` מצייר הסבר — ו⛔ שום קורא-מסך ⛔ אינו
 * שומע דבר, כי שני אלה הם טקסט סטטי בתוך תת-עץ שמתעדכן **אחרי** הצביעה הראשונה.
 *
 * ⛔ **והבדיקה מודדת שלושה דברים, ⛔ ולא «שהתכונה קיימת»:**
 *   ✔ האזור קיים, הוא `status` (⛔ ולא `alert` — הלומד ⛔ לא גרם לכישלון), והוא אטומי
 *   ✔ הוא **אחד בדיוק** — שלושה אריחים כושלים ⛔ אינם שלוש הכרזות (ⓑ)
 *   ✔ הוא ⛔ **אינו** מותנה ברינדור, והמשפט נכנס אליו ⛔ רק ב-`readFailed`
 *
 * ⛔ מה שהיא ⛔ אינה מוכיחה, ונאמר כאן כדי שאיש ⛔ לא יטעה: שקורא-מסך אמיתי הקריא
 * את זה. הסביבה היא `node` ו-jsdom ⛔ נעדר בכוונה — זו גדר מקור, כמו כל הקובץ.
 */
describe('T-322 — הכישלון מוכרז פעם אחת, בערוץ שאינו העין', () => {
  it('אזור `status` אחד בדיוק, אטומי, ⛔ ולא `alert`', () => {
    expect(CODE).toContain('data-deck-status');
    expect(CODE).toMatch(/role="status" aria-atomic="true"/);
    // ⛔ `alert` הוא assertive — הוא קוטע. הלומד ⛔ לא גרם לכישלון הזה.
    expect(CODE).not.toContain('role="alert"');
    // ⛔ ⓑ — אזור חי אחד, ⛔ ולא אחד לכל אריח.
    expect(CODE.match(/role="status"/g)?.length).toBe(1);
    expect(CODE.match(/data-deck-status/g)?.length).toBe(1);
  });

  it('האזור מותקן תמיד — ⛔ רק התוכן שלו מתחלף', () => {
    // ⛔ **המוטציה שנופלת בשם:** `{readFailed && <div role="status" …>}` מרכיב את האזור
    // באותו רגע שבו נכנס אליו הטקסט, ו⛔ אז הוא ⛔ אינו מוכרז. הצורה המחייבת היא
    // אזור קבוע שהתוכן שלו מותנה.
    expect(CODE).toMatch(
      /<div role="status" aria-atomic="true" className="sr-only" data-deck-status>\s*\{readFailed \? READ_FAILED_BODY_HE : ''\}/,
    );
    expect(CODE).not.toMatch(/readFailed && <div role="status"/);
  });

  it('שכבה A — האזור ⛔ אינו נראה, והטקסט הנראה ⛔ לא זז', () => {
    expect(CODE).toMatch(/className="sr-only" data-deck-status/);
    // ⛔ הטקסט הנראה של `recoveryBlock` נשאר במקומו — ⛔ אין עותק שני מצויר.
    expect(CODE).toContain('<p className="text-base text-ink-muted">{READ_FAILED_BODY_HE}</p>');
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
