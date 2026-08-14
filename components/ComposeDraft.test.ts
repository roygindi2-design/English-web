import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('components/ComposeDraft.tsx', 'utf8');
const CODE = SRC.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/[^\n]*$/gm, '');

/**
 * The class list that actually reaches a tapped element, with file-level class constants
 * resolved — same resolver as `WordBank.test.ts`, same reason: a raw
 * `toMatch(/<button[^>]*min-h-touch/)` is red on correct code that extracts its classes into
 * a `const` (the F-041 class of defect) and green on a file that merely mentions the token.
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

describe('<ComposeDraft>', () => {
  it('is a client component', () => {
    expect(SRC.startsWith("'use client'")).toBe(true);
  });

  it('⛔ has NO text input and NO keyboard anywhere — the bank is closed (§ 4.2ה)', () => {
    expect(CODE).not.toMatch(/<input|<textarea|contentEditable/);
  });

  it('⛔ has no drag handlers — a drag on the scroll axis breaks scrolling and 44px targets', () => {
    for (const handler of ['onDragStart', 'onDrop', 'draggable', 'onTouchMove']) {
      expect(CODE, `${handler} is forbidden`).not.toContain(handler);
    }
  });

  it('offers exactly the two punctuation buttons, mapped from the pure layer', () => {
    // ⚠️ Measured at the render site and ⛔ not on the import line: a component that
    // imports the constant and then hard-codes «.» and «?» would pass `toContain`.
    expect(CODE).toMatch(/PUNCTUATION_TOKENS\.map\(/);
    expect(CODE).not.toContain("'!'");
    expect(CODE).not.toContain("','");
  });

  it('renders the draft through the pure renderer, ⛔ not an ad-hoc join', () => {
    expect(CODE).toMatch(/renderDraft\(tokens\)/);
    expect(CODE).not.toMatch(/tokens\.join\(/);
  });

  it('disables publish on the pure predicate, ⛔ not on a token count', () => {
    // The gate itself, at its call site …
    expect(CODE).toMatch(/canPublish\s*=[^;]*draftContainsTarget\(\s*tokens\s*,/);
    // … and the button that is actually wired to it. Either half alone is blind:
    // a file may compute `canPublish` and still disable on `tokens.length`.
    expect(CODE).toMatch(/disabled=\{[^}]*canPublish[^}]*\}/);
    expect(CODE).not.toMatch(/disabled=\{[^}]*tokens\.length[^}]*\}/);
  });

  it('states the block as guidance and ⛔ never as a grade (R-016)', () => {
    expect(CODE).toContain('כדי לפרסם');
    for (const forbidden of ['נכון', 'יפה', 'שגוי', 'טעות', 'ציון', 'כל הכבוד']) {
      expect(CODE, `R-016: "${forbidden}"`).not.toContain(forbidden);
    }
  });

  it('names the target word inside the guidance, from the bank and ⛔ not a placeholder', () => {
    expect(CODE).toMatch(/כדי לפרסם[\s\S]{0,200}?target|target[\s\S]{0,200}?כדי לפרסם/);
  });

  it('labels the result factually, from the word the SERVER reported', () => {
    expect(CODE).toContain('השתמשת ב');
    expect(CODE).toMatch(/<EnWord>\{[^}]*usedWord[^}]*\}<\/EnWord>/);
  });

  it('sends the tokens and the target as the contract states, through apiPost', () => {
    expect(CODE).toMatch(/apiPost<[^>]*>\(\s*'\/api\/world\/posts'\s*,\s*\{\s*target[\s\S]{0,80}?tokens/);
  });

  it('reads the bank from its endpoint and ⛔ never invents one', () => {
    expect(CODE).toMatch(/apiGet<[^>]*>\(\s*'\/api\/world\/bank'\s*\)/);
  });

  it('carries the ActionBar (flow screen, D-028) and ⛔ never a TabBar', () => {
    expect(CODE).toContain('ActionBar');
    expect(CODE).not.toContain('TabBar');
  });

  it('reaches the server only through lib/api/client', () => {
    expect(CODE).toContain("from '@/lib/api/client'");
    expect(CODE).not.toContain('@supabase');
  });

  it('has a skeleton in the shape of the content, ⛔ not a spinner (constitution § 5)', () => {
    expect(CODE).toMatch(/animate-pulse|data-skeleton/);
    expect(CODE).not.toMatch(/spinner|animate-spin/);
  });

  it('⛔ uses no radius outside the frozen constitution § 3', () => {
    const radii = [...CODE.matchAll(/rounded-([a-z0-9]+)/g)].map((m) => m[1] ?? '');
    expect([...new Set(radii)].filter((r) => !['md', 'lg', '2xl'].includes(r))).toEqual([]);
  });

  it('⛔ shows no draft-length counter — § 4.2ה forbids an artificial ceiling', () => {
    expect(CODE).not.toContain('MAX_DRAFT_TOKENS');
  });

  it('⛔ has no vertical centring — F-011 came back once as F-016', () => {
    expect(CODE).not.toMatch(/justify-center[^"']*flex-1|flex-1[^"']*justify-center/);
  });

  it('every tap target on the screen carries the 44px floor', () => {
    const buttons = [...CODE.matchAll(/<button[\s\S]*?(?<!=)>/g)].map((m) => m[0]);
    expect(buttons.length).toBeGreaterThan(0);
    for (const button of buttons) {
      expect(classesOf(button), `a tap target without min-h-touch: ${button}`).toContain(
        'min-h-touch',
      );
    }
  });
});
