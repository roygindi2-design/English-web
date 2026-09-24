import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const CODE = readFileSync('components/BlockKeyboard.tsx', 'utf8');
const CSS = readFileSync('components/block-keyboard-tokens.css', 'utf8');
const PALETTE = readFileSync('lib/core/palette.ts', 'utf8');

describe('BlockKeyboard — T-461, renders kol-C-14 … kol-C-17', () => {
  it('the binding strings from `msgs_ui.py`', () => {
    for (const s of ['מה יכול לבוא עכשיו', 'כל בחירה מחליפה את הסט הבא', 'הרכב משפט מהבלוקים']) {
      expect(CODE, s).toContain(s);
    }
    // T-465ⓑ: the counter shows the set as filtered by the category row.
    expect(CODE).toMatch(/countHe\(shown\.length\)/);
  });

  it('`39 § 3` palette lives in the scoped token file, ⛔ never in palette.ts, and verbs are ⛔ not red', () => {
    for (const hex of ['#f2b544', '#5b9bf5', '#2ec5c5', '#8b95ab', '#d178e8']) {
      expect(CSS, hex).toContain(hex);
      expect(PALETTE.toLowerCase(), hex).not.toContain(hex);
    }
    expect(CSS).toMatch(/--pos-verb: #f2b544/);
    expect(CODE).not.toMatch(/#[0-9a-f]{3,6}\b/i);
    expect(CODE).not.toMatch(/danger/);
  });

  it('every block carries a bar AND a written legend; an uncoloured block has ⛔ no bar', () => {
    expect(CODE).toMatch(/data-pos-bar/);
    expect(CODE).toMatch(/labelOf\(block\.pos\)/);
    expect(CODE).toMatch(/colour !== null \? \(/);
  });

  it('every key is ≥44px — blocks, send and back', () => {
    const buttons = CODE.match(/<button[\s\S]*?className="[^"]*"/g) ?? [];
    expect(buttons.length).toBeGreaterThanOrEqual(4);
    for (const b of buttons) expect(b, b).toMatch(/min-h-touch/);
  });

  it('send is enabled only when `<END>` is among the continuations', () => {
    expect(CODE).toMatch(/disabled=\{!canSend/);
    expect(CODE).toMatch(/canSend=\{view\?\.canSend \?\? false\}/);
  });

  it('back pops a stack — the previous set returns ⛔ without a request', () => {
    expect(CODE).toMatch(/setStack\(\(s\) => s\.slice\(0, -1\)\)/);
  });

  it('words inside <EnWord>; ⛔ no text under 12px; ⛔ no h-screen', () => {
    expect(CODE).toMatch(/<EnWord>\{block\.word\}<\/EnWord>/);
    expect(CODE).not.toMatch(/text-\[(\d|1[01])(\.\d+)?px\]/);
    expect(CODE).not.toMatch(/h-screen/);
  });
});
