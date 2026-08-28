import { describe, expect, it } from 'vitest';
import { mulberry32 } from './shuffle';
import {
  ORTHOGRAPHIC_SLOTS,
  SEMANTIC_SLOTS,
  pickWrongOptions,
  type TaggedHeDistractor,
} from './arcadeDistractors';

const FILLER = ['מילוי-1', 'מילוי-2', 'מילוי-3', 'מילוי-4', 'מילוי-5', 'מילוי-6'];

function tag(he: string, relation: TaggedHeDistractor['relation']): TaggedHeDistractor {
  return { he, relation };
}

const FULL_MIX: TaggedHeDistractor[] = [
  tag('סמנטי-א', 'semantic'),
  tag('סמנטי-ב', 'semantic'),
  tag('סמנטי-ג', 'semantic'),
  tag('צורני-א', 'orthographic'),
  tag('לא-קשור', 'unrelated'),
  tag('נרדף', 'near_synonym'),
];

describe('D-023 — התמהיל, ⛔ ולא הגרלה מהרמה', () => {
  it('תמהיל מלא ⇒ שתי אפשרויות סמנטיות ואחת צורנית, ⛔ ואפס מילוי', () => {
    const out = pickWrongOptions({
      answer: 'התשובה', tagged: FULL_MIX, levelTranslations: FILLER,
      count: 3, rnd: mulberry32(11),
    });
    expect(out).toHaveLength(3);
    const semantic = out.filter((o) => o.startsWith('סמנטי'));
    const ortho = out.filter((o) => o.startsWith('צורני'));
    expect(semantic).toHaveLength(SEMANTIC_SLOTS);
    expect(ortho).toHaveLength(ORTHOGRAPHIC_SLOTS);
    expect(out.some((o) => o.startsWith('מילוי'))).toBe(false);
  });

  it('⛔ `near_synonym` ⛔ לעולם אינו מוגש — D-023 מדד שהוא פוגע ביכולת ההבחנה', () => {
    const onlyNear = [tag('נרדף-א', 'near_synonym'), tag('נרדף-ב', 'near_synonym')];
    const out = pickWrongOptions({
      answer: 'התשובה', tagged: onlyNear, levelTranslations: FILLER,
      count: 3, rnd: mulberry32(3),
    });
    expect(out.some((o) => o.startsWith('נרדף'))).toBe(false);
    expect(out).toHaveLength(3);
  });

  it('⛔ `unrelated` ו-`collocational` ⛔ אינם נבחרים כמתויגים — המילוי כבר לא-קשור', () => {
    const out = pickWrongOptions({
      answer: 'התשובה',
      tagged: [tag('לא-קשור', 'unrelated'), tag('צירוף', 'collocational')],
      levelTranslations: FILLER, count: 3, rnd: mulberry32(4),
    });
    expect(out.every((o) => o.startsWith('מילוי'))).toBe(true);
  });

  it('תמהיל חלקי ⇒ המילוי משלים **לפי משבצת** ⛔ ולא מבטל את המתויג (89.5% מהמשמעויות)', () => {
    const out = pickWrongOptions({
      answer: 'התשובה', tagged: [tag('סמנטי-א', 'semantic')],
      levelTranslations: FILLER, count: 3, rnd: mulberry32(7),
    });
    expect(out).toContain('סמנטי-א');
    expect(out.filter((o) => o.startsWith('מילוי'))).toHaveLength(2);
  });

  it('⛔ המסיח לעולם אינו זהה לתשובה, גם כשהוא מתויג', () => {
    const out = pickWrongOptions({
      answer: 'סמנטי-א',
      tagged: [tag('סמנטי-א', 'semantic'), tag('סמנטי-ב', 'semantic')],
      levelTranslations: FILLER, count: 3, rnd: mulberry32(9),
    });
    expect(out).not.toContain('סמנטי-א');
    expect(out).toHaveLength(3);
  });

  it('⛔ אפס כפילות — מתויג שחוזר גם במילוי נספר פעם אחת', () => {
    const out = pickWrongOptions({
      answer: 'התשובה', tagged: [tag('מילוי-1', 'semantic')],
      levelTranslations: FILLER, count: 3, rnd: mulberry32(13),
    });
    expect(new Set(out).size).toBe(3);
  });

  it('⛔ ריק ורווח לבן ⛔ אינם אפשרות', () => {
    const out = pickWrongOptions({
      answer: 'התשובה', tagged: [tag('  ', 'semantic'), tag('', 'orthographic')],
      levelTranslations: FILLER, count: 3, rnd: mulberry32(17),
    });
    expect(out.every((o) => o.trim().length > 0)).toBe(true);
  });

  it('אין מספיק חומר ⇒ מוחזר פחות מ-count, ⛔ ואין המצאה', () => {
    const out = pickWrongOptions({
      answer: 'התשובה', tagged: [], levelTranslations: ['רק-אחד'],
      count: 3, rnd: mulberry32(19),
    });
    expect(out).toEqual(['רק-אחד']);
  });

  it('אותו seed ⇒ אותה תוצאה בדיוק — ⛔ אין `Math.random` בקובץ', () => {
    const a = pickWrongOptions({ answer: 'התשובה', tagged: FULL_MIX,
      levelTranslations: FILLER, count: 3, rnd: mulberry32(23) });
    const b = pickWrongOptions({ answer: 'התשובה', tagged: FULL_MIX,
      levelTranslations: FILLER, count: 3, rnd: mulberry32(23) });
    expect(a).toEqual(b);
  });
});
