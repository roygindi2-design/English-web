import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import ArenaSummary from '@/components/ArenaSummary';
import { summarize } from '@/lib/core/arenaSummary';

/**
 * 🏁 ⟦`C-0879` · זירה — עיצוב חופשי⟧ **סוף הקרב נכנס בגל, ⛔ ולא מופיע בבת אחת.**
 * `animate` § 1–2: המסך מופיע פעם בקרב (שכיחות «מזדמנת»), והמטרה היא ⛔ לגשר על החיתוך
 * מהקרב לסיכום. ⇒ `transform`+`opacity` בלבד · `--arena-ease-out` הקיים · 240ms (מתחת
 * לתקרת 300) · מדרג 50ms (טווח 30–80). ⛔ **הפעולות המעוגנות ⛔ אינן בגל** — «עוד קרב»
 * חייב להיות לחיץ ברגע שהמסך עולה.
 */
const CSS = readFileSync(new URL('./arcade-tokens.css', import.meta.url), 'utf8');
const RULE = CSS.match(/\[data-arena-scope\] \[data-arena-enter\]\s*\{[^}]*\}/)?.[0] ?? '';
const KEYFRAMES = CSS.match(/@keyframes arena-summary-enter\s*\{[^}]*\}/)?.[0] ?? '';

function render(): string {
  const summary = summarize([
    { wordId: 'w1', correct: true, responseMs: 900, critical: false, kind: 'base' },
    { wordId: 'w2', correct: true, responseMs: 4200, critical: false, kind: 'unfiltered' },
  ]);
  return renderToStaticMarkup(
    createElement(ArenaSummary, {
      ending: { kind: 'survived', wordsFromBoss: 3 },
      summary,
      headwords: { w1: 'apple', w2: 'river' },
      onAgain: () => {},
      missed: [{ wordId: 'w2', headword: 'river', answer: 'נהר', chosen: 'הר' }],
    }),
  );
}

describe('זירה — כניסת מסך הסיכום', () => {
  it('הכלל: 240ms · `--arena-ease-out` · מדרג 50ms על `--arena-enter-i`', () => {
    expect(RULE).not.toBe('');
    expect(RULE).toContain('arena-summary-enter 240ms var(--arena-ease-out) both');
    expect(RULE).toContain('calc(var(--arena-enter-i, 0) * 50ms)');
  });

  it('⛔ ה-keyframes נוגעים ב-`transform` וב-`opacity` בלבד, ⛔ ולא ב-`scale(0)`', () => {
    expect(KEYFRAMES).not.toBe('');
    const props = [...KEYFRAMES.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]);
    expect(new Set(props)).toEqual(new Set(['opacity', 'transform']));
    expect(KEYFRAMES).not.toMatch(/scale\(0\)/);
  });

  it('תנועה מופחתת: דהייה בלבד, ⛔ בלי תזוזה ⛔ ובלי מדרג', () => {
    const reduced = CSS.match(
      /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\[data-arena-scope\] \[data-arena-enter\]\s*\{[^}]*\}/,
    )?.[0];
    expect(reduced).toBeDefined();
    expect(reduced).toContain('arena-summary-fade');
    expect(reduced).toContain('animation-delay: 0ms');
    expect(CSS).toMatch(/@keyframes arena-summary-fade\s*\{\s*from\s*\{\s*opacity:\s*0;\s*\}\s*\}/);
  });

  it('הגל עולה בסדר: כותרת 0 ⇒ שורות ⇒ לוחות, מדרג רציף', () => {
    const html = render();
    const order = [...html.matchAll(/data-arena-enter="true" style="--arena-enter-i:(\d+)"/g)].map((m) => Number(m[1]));
    expect(order.length).toBeGreaterThanOrEqual(3);
    expect(order).toEqual(order.map((_, i) => i));
  });

  it('⛔ הפעולות המעוגנות ⛔ אינן בגל', () => {
    const html = render();
    const bar = html.slice(html.indexOf('data-arena-again') - 400);
    expect(bar).not.toContain('data-arena-enter');
  });
});
