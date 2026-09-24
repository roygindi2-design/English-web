import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SCHEMA_MISSING_HE } from './failure';
import {
  SIGN_IN_AGAIN_HE,
  failureExit,
  isRetryable,
  toFailureCode,
  worstFailure,
  type FailureCode,
} from './failureExit';
import { withoutComments } from '@/lib/testSource';

/**
 * T-124 · D-065 — הכלל הבינארי, כטבלה אחת.
 */
const ALL: readonly FailureCode[] = ['session_expired', 'schema_missing', 'unavailable'];

describe('לכל קוד כשל יש יציאה', () => {
  it('⛔ אין קוד בלי יעד ניווט, ובעברית', () => {
    for (const code of ALL) {
      const exit = failureExit(code);
      expect(exit.href.startsWith('/')).toBe(true);
      expect(exit.labelHe).toMatch(/[֐-׿]/);
    }
  });
});

describe('session_expired', () => {
  it('שולח ל-/login ⇒ תמיד', () => {
    expect(failureExit('session_expired').href).toBe('/login');
  });

  it('⛔ אינו ניתן לניסיון חוזר — טעינה חוזרת עם סשן מת מחזירה 401 שוב', () => {
    expect(isRetryable('session_expired')).toBe(false);
  });
});

describe('schema_missing', () => {
  it('⛔ אינו ניתן לניסיון חוזר — התקלה אינה חולפת מעצמה', () => {
    // זהו ⓒ במשימה: «נסה שוב» שלעולם לא יצליח. מיגרציה שלא רצה
    // לא תרוץ מפני שהלומד לחץ על כפתור.
    expect(isRetryable('schema_missing')).toBe(false);
  });

  it('מנווט ללשונית שכן עובדת ⛔ ולא לאותו מסך', () => {
    expect(failureExit('schema_missing').href).toBe('/studies');
  });
});

describe('unavailable', () => {
  it('ניתן לניסיון חוזר — זו התקלה החולפת היחידה מהשלוש', () => {
    expect(isRetryable('unavailable')).toBe(true);
  });

  it('⛔ ובנוסף יש יציאה: «נסה שוב» לבדו הוא מסך ללא דרך החוצה', () => {
    expect(failureExit('unavailable').href).toBe('/studies');
  });
});

/**
 * T-146ⓐ + ⓒ together. ⓐ says a screen shows **one** error region and **one**
 * action; ⓒ says that action is always an exit. A screen that read two endpoints
 * and got two different failures therefore has to pick ONE code — and «pick» with
 * no rule is «pick the one that answered last», which makes the exit depend on
 * network timing. `worstFailure` is that rule, written once.
 */
describe('worstFailure — one screen ⇒ one code (T-146ⓐ · D-065)', () => {
  it('⛔ אין קודים ⇒ `unavailable` — התקלה החולפת, ⛔ ולא הקשה מכולן', () => {
    expect(worstFailure([])).toBe('unavailable');
  });

  it('`session_expired` גובר על השניים האחרים — סשן מת מסביר גם אותם', () => {
    expect(worstFailure(['unavailable', 'session_expired'])).toBe('session_expired');
    expect(worstFailure(['schema_missing', 'session_expired'])).toBe('session_expired');
  });

  it('`schema_missing` גובר על `unavailable` — ⛔ «נסה שוב» ⛔ אינו מוצע על תקלה שאינה חולפת', () => {
    expect(worstFailure(['unavailable', 'schema_missing'])).toBe('schema_missing');
  });

  it('⛔ הסדר של הקלט ⛔ אינו משנה — אחרת היציאה תלויה בזמני הרשת', () => {
    expect(worstFailure(['session_expired', 'schema_missing'])).toBe(
      worstFailure(['schema_missing', 'session_expired']),
    );
  });
});

describe('toFailureCode — הצרה, ⛔ ולא אמון בשרת (T-146ⓒ)', () => {
  it('שני הקודים הידועים עוברים כמות שהם', () => {
    expect(toFailureCode('session_expired')).toBe('session_expired');
    expect(toFailureCode('schema_missing')).toBe('schema_missing');
  });

  it('⛔ כל דבר אחר נופל ל-`unavailable` ⛔ ולא זולג למסך', () => {
    for (const raw of ['boom', '', null, undefined, 42, {}, 'session_expired ']) {
      expect(toFailureCode(raw)).toBe('unavailable');
    }
  });
});

/**
 * T-273 — the two sentences the shared module was built for are exactly the two
 * that never entered it. Measured 06/09 before this test existed: 10 local
 * declarations of `SIGN_IN_AGAIN_HE` across `app/` + `components/` (9 ×
 * 'התחברות מחדש', 1 × 'להתחברות מחדש' in `ArenaHome`), 11 files declaring their
 * own `SCHEMA_MISSING_HE`, and 8 of the 12 carriers never importing `failureExit`
 * at all. The arena therefore contradicted the table `D-065` wrote, ⛔ not only
 * its neighbours. ⇒ the wording lives in `failure.ts`, the exit label lives in
 * `failureExit.ts`, and every screen imports them. This test COUNTS.
 */
function walkSources(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walkSources(full, out);
    else if (/\.tsx?$/.test(full) && !/\.test\.tsx?$/.test(full)) out.push(full);
  }
  return out;
}

/** Comments are prose, ⛔ not a second wording — same stripping as `failure.test.ts`. */
function markupOnly(src: string): string {
  return withoutComments(src);
}

const SCREEN_SOURCES = [...walkSources('app'), ...walkSources('components')];
const WHOLE_TREE = [...SCREEN_SOURCES, ...walkSources('lib')];
const LOCAL_DECLARATION = /\bconst\s+(SCHEMA_MISSING_HE|SIGN_IN_AGAIN_HE)\s*=/g;
const EXIT_LABEL_DECLARATION = /\bSIGN_IN_AGAIN_HE\s*=\s*'([^']*)'/g;

describe('T-273 — נוסח `schema_missing` ותווית `session_expired` חיים במקום אחד בלבד', () => {
  it('הנוסח הקנוני ⛔ לא הומצא מחדש — הוא זה שכבר הודפס ללומד', () => {
    expect(SCHEMA_MISSING_HE).toBe('המאגר עדיין לא הוקם');
    expect(SIGN_IN_AGAIN_HE).toBe('התחברות מחדש');
    expect(failureExit('session_expired').labelHe).toBe(SIGN_IN_AGAIN_HE);
  });

  it('⛔ אפס הכרזות מקומיות של שני הקבועים ב-`app/` + `components/`', () => {
    const offenders: string[] = [];
    for (const file of SCREEN_SOURCES) {
      const src = markupOnly(readFileSync(file, 'utf8'));
      for (const match of src.matchAll(LOCAL_DECLARATION)) offenders.push(`${file} — ${match[1]}`);
    }
    expect(offenders, 'local declarations that must be imports').toEqual([]);
  });

  it('⛔ ליציאה של `session_expired` יש שם אחד בכל העץ — ⛔ לא שניים', () => {
    const names = new Map<string, string[]>();
    for (const file of WHOLE_TREE) {
      const src = markupOnly(readFileSync(file, 'utf8'));
      for (const match of src.matchAll(EXIT_LABEL_DECLARATION)) {
        const label = match[1] ?? '';
        const list = names.get(label) ?? [];
        list.push(file);
        names.set(label, list);
      }
    }
    expect([...names.keys()], 'distinct exit labels declared in the tree').toEqual([SIGN_IN_AGAIN_HE]);
    expect(names.get(SIGN_IN_AGAIN_HE)).toEqual(['lib/core/failureExit.ts']);
  });

  it('⛔ אף מסך ⛔ אינו מדפיס את תווית היציאה כמחרוזת — רק דרך הקבוע המיובא', () => {
    const offenders = SCREEN_SOURCES.filter((file) =>
      /ל?התחברות מחדש/.test(markupOnly(readFileSync(file, 'utf8'))),
    );
    expect(offenders, 'screens restating the exit label as a literal').toEqual([]);
  });

  it('⛔ אף מסך ⛔ אינו מדפיס את נוסח `schema_missing` כמחרוזת — רק דרך הקבוע המיובא', () => {
    // `.tsx` only: the API routes send the same sentence in their JSON `message`
    // field, and that is the contract (`docs/api-contract.md`), ⛔ not a screen.
    const offenders = SCREEN_SOURCES.filter(
      (file) => file.endsWith('.tsx') && markupOnly(readFileSync(file, 'utf8')).includes(SCHEMA_MISSING_HE),
    );
    expect(offenders, 'screens restating the schema_missing wording as a literal').toEqual([]);
  });
});
