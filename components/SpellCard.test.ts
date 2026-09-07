import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const withoutComments = (src: string): string =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');
const SRC = readFileSync('components/SpellCard.tsx', 'utf8');
const CODE = withoutComments(SRC);

describe('T-178 · 37 § 5 — הקלף מצייר ו⛔ אינו מחשב', () => {
  it('⛔ אין כאן חוק: הקלף ⛔ אינו יודע מהי תשובה נכונה', () => {
    for (const token of ['translationHe', 'correct', 'cast(', 'battle']) {
      expect(CODE).not.toContain(token);
    }
  });

  it('ההכרעה מגיעה מ-`arenaGesture`, ⛔ ולא מספר בתוך מטפל אירועים', () => {
    expect(CODE).toContain("from '@/lib/core/arenaGesture'");
    expect(CODE).toMatch(/resolveGesture|cardLift/);
    // ⛔ 60 ⛔ אינו נכתב כאן: קבוע שקבור ב-`onPointerUp` נבדק רק בדפדפן.
    expect(CODE).not.toMatch(/\b60\b/);
  });

  it('⛔ אין שעון ברכיב — ההשתקעות היא CSS, ⛔ ולא JS', () => {
    for (const token of ['setTimeout', 'setInterval', 'requestAnimationFrame', 'Date.now']) {
      expect(CODE).not.toContain(token);
    }
  });

  it('T-243 · 35 § ב6 — the release is a spring from lib/core/spring, ⛔ still no clock here', () => {
    expect(CODE).toContain("from '@/lib/core/spring'");
    expect(CODE).toContain('releaseCurve(');
    expect(CODE).toContain('releaseVelocity(');
    expect(CODE).toContain('pushSample(');
    expect(CODE).toContain('e.timeStamp');
    expect(CODE).toContain('--kol-release-ms');
    expect(CODE).toContain('--kol-release-ease');
    for (const token of ['setTimeout', 'setInterval', 'requestAnimationFrame', 'Date.now']) {
      expect(CODE).not.toContain(token);
    }
  });
});

describe('שכבה א׳ — הבחירה ⛔ אינה מקודדת בצבע בלבד', () => {
  it('`aria-pressed` נושא את מצב הבחירה', () => {
    expect(CODE).toContain('aria-pressed');
  });

  it('יעד המגע הוא לפחות 44px, בטוקן ⛔ ולא במספר', () => {
    expect(CODE).toContain('min-h-touch');
  });

  it('⛔ קלף `?` נושא את התווית העברית **וגם** את הסימן (א2)', () => {
    expect(SRC).toContain('לחש לא מזוהה');
  });
});

describe('אינווריאנט 37 § 13.5 — ⛔ אין hex בתוך הרכיב', () => {
  it('⛔ אף צבע ⛔ אינו כתוב כאן — הכול טוקן', () => {
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});

describe('פני הקלף עבריים — ⛔ ולא אנגלית', () => {
  it('⛔ `<EnWord>` ⛔ אינו מופיע: התווית היא תרגום, וה-headword יושב בבאנר', () => {
    expect(CODE).not.toContain('EnWord');
  });
});

describe('36 § 14.4 — גימור הרנדר מחייב, ⛔ ולא רק המבנה', () => {
  it('קו־השיער הפנימי קיים (`render_video_B.py:267`), ברדיוס מהסולם', () => {
    expect(CODE).toContain('inset-[3px]');
    // ⛔ הרנדר נוקב ב-9; שכבה ב׳ מתירה חמישה ⇒ `lg` = 8. הסטייה מוצהרת בהערה.
    expect(CODE).toMatch(/inset-\[3px\][^"]*rounded-lg/);
  });

  it('המעוין בראש הקלף הוא SVG, ⛔ ולא אמוג׳י (שכבה א׳)', () => {
    expect(CODE).toContain('<polygon points="5,0 10,5 5,10 0,5"');
    expect(CODE).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it('⛔ צבע המסגרת וצבע הסימן ⛔ אינם נפרדים — `currentColor` ממקום אחד', () => {
    expect(CODE).toContain('currentColor');
    expect(CODE).toMatch(/border-\[color:var\(--arena-gold\)\] text-\[color:var\(--arena-gold\)\]/);
  });
});

/**
 * F-149ⓐ · `36 § 14.4` — **מילוי הקלף נלקח מהרנדר, והדיו ⛔ אינו יכול להילקח משם.**
 *
 * ⓐ **הרנדר:** `docs/design/render_video_B.py:265` ממלא `(24, 33, 56)` = `#182138`,
 *   והרכיב מילא `--arena-stone-dark` = `#34323f` — ⛔ אפור־אבן מול כחול־ליל.
 *
 * ⚠️ **ו⛔ אי אפשר להחליף רק את המילוי:** `--ink` נקבע ב-`app/globals.css` לפי
 *   `prefers-color-scheme`, ו-`[data-arena-scope]` ⛔ אינו דורס אותו. בסכימה **בהירה**
 *   — שהיא ברירת המחדל של `:root` — `--ink` הוא `#0f172a`, ולכן תווית הקלף נמדדה
 *   **1.42:1** על `#34323f` ו-**1.12:1** על מילוי הרנדר. ⇒ **שכבה א׳ גוברת** ו⛔ אינה
 *   מרשה לסגור את הפער בלי דיו משלה. הדיו החדש נלקח **גם הוא מהרנדר**, ⛔ ולא נבחר:
 *   `--arena-ink` = `render_video_B.py:277` `(255, 252, 246)` ⇒ **15.61:1**.
 *   `--arena-ink-dim` = `:248` `ELEM_COL['unknown']` `(168, 176, 196)` ⇒ **7.36:1**.
 */
describe('F-149ⓐ · שכבה א׳ — המילוי מהרנדר, הדיו scoped לזירה', () => {
  it('המילוי הוא `--arena-card`, ⛔ ולא `--arena-stone-dark`', () => {
    expect(CODE).toContain('bg-[color:var(--arena-card)]');
    expect(CODE).not.toContain('bg-[color:var(--arena-stone-dark)]');
  });

  it('⛔ הדיו המשותף ⛔ אינו יושב על משטח כהה של הזירה', () => {
    expect(CODE).not.toMatch(/\btext-ink\b/);
    expect(CODE).not.toMatch(/\btext-ink-muted\b/);
  });

  it('הדיו של הקלף הוא טוקן זירה — שני הערכים, ⛔ ולא אחד', () => {
    expect(CODE).toContain('text-[color:var(--arena-ink)]');
    expect(CODE).toContain('text-[color:var(--arena-ink-dim)]');
  });
});
