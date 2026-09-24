import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const CODE = readFileSync('components/SimulationMessage.tsx', 'utf8');

describe('SimulationMessage — T-192, render kol-C-14-mail-open.png', () => {
  it('the binding strings', () => {
    expect(CODE).toContain('תיבת הסימולציות');
  });

  it('body through <EnText>, sender through <EnWord>', () => {
    expect(CODE).toMatch(/<EnText/);
    expect(CODE).toMatch(/<EnWord>/);
  });

  it('T-461: the disabled strip became the live block keyboard, and it feeds the chips (ⓔ)', () => {
    expect(CODE).toMatch(/<BlockKeyboard\s+level=\{state\.item\.level\}/);
    expect(CODE).toMatch(/onChosen/);
    expect(CODE).toMatch(/readyState\(s\.item, words/);
    expect(CODE).not.toMatch(/\bhidden\b(?!=)/);
  });

  it('⛔ draws only — the chips come from the pure layer; two writes: the read PATCH and the answer POST', () => {
    expect(CODE).toMatch(/RequiredWordChips/);
    expect(CODE).not.toMatch(/\.filter\(|\.reduce\(|\.sort\(/);
    expect(CODE).toMatch(/apiPatch</);
    expect((CODE.match(/apiPost</g) ?? []).length).toBe(1);
    expect(CODE).toMatch(/\/api\/world\/messages\/\$\{id\}\/answer/);
    expect(CODE).not.toMatch(/fetch\(|word_progress|arcade_/);
  });

  it('T-462ⓒ: after a send «נשלח»; a reload of an answered message says so; a failed send keeps the blocks', () => {
    expect(CODE).toContain("SENT_HE = 'נשלח'");
    expect(CODE).toMatch(/state\.item\.answeredAt !== null \?/);
    expect(CODE).toMatch(/role="alert"/);
  });

  it('⛔ no tab bar import (D-028: the route is outside (tabs))', () => {
    expect(CODE).not.toMatch(/TabBar/);
  });

  it('⛔ no hex, ⛔ no h-screen, ⛔ no bg-brand fill, ⛔ no text under 12px, ⛔ no 100% claim', () => {
    expect(CODE).not.toMatch(/#[0-9a-f]{3,6}\b/i);
    expect(CODE).not.toMatch(/h-screen|100%/);
    expect(CODE).not.toMatch(/\bbg-brand(?![-\w])/);
    expect(CODE).not.toMatch(/text-\[(\d|1[01])(\.\d+)?px\]/);
  });

  it('every failure state carries an exit (D-065) — ⛔ no dead end', () => {
    for (const s of ['not_found', 'schema_missing', 'session_expired']) expect(CODE, s).toContain(s);
    expect(CODE).toMatch(/failureExit/);
  });
});
