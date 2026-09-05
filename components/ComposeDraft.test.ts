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
    // ⚠️ TIGHTENED C-0142 (F-039). The previous form — `toMatch(/כדי לפרסם[\s\S]{0,200}?target/)`
    // — was blind, and the mutation that proved it is recorded in `plan/30-architecture.md`:
    // deleting `<EnWord>{target}</EnWord>` from the sentence, so the screen reads «הוסף את
    // המילה של היום כדי לפרסם», stayed GREEN. The `target !== null` guard two lines above the
    // sentence is inside the 200-character window, so the assertion was reading the guard and
    // ⛔ not the word on screen. Measured instead: the identifier the publish gate checks is
    // read out of the file, and the guidance sentence itself must render THAT identifier —
    // the label and the thing it names are then one fact, not two.
    const targetId = CODE.match(/draftContainsTarget\(\s*tokens\s*,\s*([A-Za-z_$][\w$]*)\s*\)/)?.[1] ?? '';
    expect(targetId, 'the publish gate does not read a named target').not.toBe('');
    const guidance = CODE.match(/הוסף את[\s\S]{0,160}?כדי לפרסם/)?.[0] ?? '';
    expect(guidance, 'the guidance sentence is not on screen').not.toBe('');
    expect(guidance).toMatch(new RegExp(`<EnWord>\\{\\s*${targetId}\\s*\\}</EnWord>`));
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

  it('⛔ uses no radius outside constitution v2 layer B\'s five-value scale (D-102 · T-168)', () => {
    // ⚠️ UPDATED T-168 half B: the frozen v1 list {md, lg, 2xl} predates Roy's product
    // vision (D-102, 23/08) and rejected `full`, which D-102 explicitly allows for the
    // primary button and the chip. `scripts/radius-hygiene.test.ts` is the single source
    // of truth for the five allowed values; this assertion mirrors it rather than a dead
    // v1 list, so a real sixth value is still caught here.
    const radii = [...CODE.matchAll(/rounded-([a-z0-9]+)/g)].map((m) => m[1] ?? '');
    expect([...new Set(radii)].filter((r) => !['md', 'lg', 'xl', '2xl', 'full'].includes(r))).toEqual([]);
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

/**
 * T-063 task 9 — the `initialBank` escape hatch, and why it is measured here rather than
 * trusted.
 *
 * `check:mobile` runs `next start` with no Supabase env, so `GET /api/world/bank` answers
 * 503 by its own contract and this screen resolves to its ERROR state. A fixture that
 * rendered anything other than this component would measure the fixture (C-0104), so the
 * fixture renders THIS component and hands it the bank directly. That is one prop and one
 * branch, and the branch is the whole point: with the prop present the component must start
 * READY and must ⛔ NOT fetch — otherwise the harness is back to measuring the 503 screen
 * while printing "ok /dev/world".
 *
 * ⚠️ Written as call-site assertions (F-039): a `toContain('initialBank')` on the file is
 * green when the prop is declared and never read.
 */
describe('<ComposeDraft initialBank> — the measured fixture path', () => {
  it('takes the bank as an OPTIONAL prop, so the real route still renders with no props', () => {
    expect(CODE).toMatch(/initialBank\?:/);
  });

  it('starts in the READY state when the bank is handed to it, ⛔ not in loading', () => {
    const initial = CODE.match(/useState<ScreenState>\(([\s\S]*?)\n {2}\);/)?.[1] ?? '';
    expect(initial).toContain('initialBank');
    expect(initial).toContain("'ready'");
  });

  it('⛔ does not call the bank endpoint when the bank was handed to it', () => {
    const effect = CODE.match(/useEffect\(\(\) => \{([\s\S]*?)\n {2}\}, \[/)?.[1] ?? '';
    expect(effect).toContain('load()');
    const guard = effect.search(/if \([^)]*initialBank[^)]*\)[^\n]*return/);
    expect(guard).toBeGreaterThanOrEqual(0);
    // The guard has to come BEFORE the call, not merely exist in the same block.
    expect(guard).toBeLessThan(effect.indexOf('load()'));
  });
});
