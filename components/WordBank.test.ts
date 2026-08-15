import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('components/WordBank.tsx', 'utf8');
const CODE = SRC.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/[^\n]*$/gm, '');

/**
 * The class list that actually reaches a tapped element, with file-level class constants
 * resolved. ⚠️ A plain `toMatch(/<button[^>]*min-h-touch/)` is NOT this measurement: it goes
 * red on correct code that extracts its class list into a `const`, which is the F-041 class
 * of defect — an assertion no correct implementation can satisfy — and it goes green on a
 * file that merely mentions the token somewhere else.
 */
const CLASS_CONSTS = Object.fromEntries(
  [...CODE.matchAll(/const\s+([A-Z][A-Z0-9_]*)\s*=\s*([\s\S]*?);\n/g)].map((m) => [
    m[1] ?? '',
    m[2] ?? '',
  ]),
);

function classesOf(tag: string): string {
  const attribute = tag.match(/className=(?:"([^"]*)"|\{([\s\S]*?)\})/);
  if (attribute === null) return '';
  const literal = attribute[1] ?? '';
  const expression = attribute[2] ?? '';
  const referenced = [...expression.matchAll(/[A-Z][A-Z0-9_]*/g)]
    .map((m) => CLASS_CONSTS[m[0]] ?? '')
    .join(' ');
  return `${literal} ${expression} ${referenced}`;
}

describe('<WordBank>', () => {
  it('labels each group with Hebrew TEXT, ⛔ not colour alone (constitution § 1)', () => {
    // ⚠️ `toContain('labelHe')` alone is blind — the prop name survives in the interface
    // declaration while nothing renders it (the C-0120 / F-039 lesson). Measured at the
    // render site: the label is the child of a heading element.
    expect(CODE).toMatch(/<h2[^>]*>\{[^}]*\.labelHe\}<\/h2>/);
  });

  it('renders one group per entry, from the prop and ⛔ not from a local list', () => {
    expect(CODE).toMatch(/groups\.map\(/);
    expect(CODE).not.toMatch(/const\s+GROUPS\s*(:|=)/);
  });

  it('every bank word is a real button whose OWN class list carries the 44px floor', () => {
    const buttons = [...CODE.matchAll(/<button[\s\S]*?(?<!=)>/g)].map((m) => m[0]);
    expect(buttons.length).toBeGreaterThan(0);
    for (const button of buttons) {
      expect(button).toContain('type="button"');
      expect(classesOf(button), `a tap target without min-h-touch: ${button}`).toContain(
        'min-h-touch',
      );
    }
  });

  /**
   * ⚠️ ADDED C-0142 (F-039). Both assertions below used to locate the call site and ⛔ never
   * read what it carries, and two mutations proved it (recorded in `plan/30-architecture.md`):
   * `onPick(word)` ⇒ `onPick('the')` — every chip publishes the same word — stayed GREEN, and
   * `<EnWord>{word}</EnWord>` ⇒ `<EnWord>{'—'}</EnWord>` — a bank of dashes — stayed GREEN too.
   * The binding is therefore read out of the `.map(` that creates the chip rather than
   * hard-coded here: renaming the loop variable stays green (⛔ not the F-041 class of
   * assertion no correct implementation can satisfy), while a literal in either place is red.
   */
  const WORD_BINDING = CODE.match(/\.words\.map\(\(\s*([A-Za-z_$][\w$]*)\s*\)/)?.[1] ?? '';

  it('maps the group words to chips, so the binding below is a real one', () => {
    expect(WORD_BINDING, 'no `.words.map((x) =>` — the chips are not built from the prop').not.toBe(
      '',
    );
  });

  it('hands the TAPPED token back through onPick — ⛔ not a constant, ⛔ no local mutation', () => {
    expect(CODE).toMatch(new RegExp(`onClick=\\{\\(\\)\\s*=>\\s*onPick\\(\\s*${WORD_BINDING}\\s*\\)\\}`));
    expect(CODE).not.toContain('useState');
  });

  it('wraps every English word in the bidi wrapper — the WORD, ⛔ not a literal', () => {
    expect(CODE).toMatch(new RegExp(`<EnWord>\\{\\s*${WORD_BINDING}\\s*\\}</EnWord>`));
  });

  it('⛔ has no input, no keyboard and no drag', () => {
    expect(CODE).not.toMatch(/<input|<textarea|contentEditable/);
    for (const handler of ['draggable', 'onDragStart', 'onDrop', 'onTouchMove']) {
      expect(CODE, `${handler} is forbidden`).not.toContain(handler);
    }
  });

  it('⛔ uses no radius outside the frozen constitution § 3', () => {
    const radii = [...CODE.matchAll(/rounded-([a-z0-9]+)/g)].map((m) => m[1] ?? '');
    expect([...new Set(radii)].filter((r) => !['md', 'lg', '2xl'].includes(r))).toEqual([]);
  });

  it('⛔ says nothing that grades the learner (R-016)', () => {
    for (const forbidden of ['נכון', 'יפה', 'כל הכבוד', 'שגוי', 'טעות', 'ציון']) {
      expect(CODE, `R-016: "${forbidden}"`).not.toContain(forbidden);
    }
  });
});
