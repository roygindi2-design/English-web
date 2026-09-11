import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const CODE = readFileSync('components/SimulationMessage.tsx', 'utf8');

describe('SimulationMessage — T-192, render kol-C-14-mail-open.png', () => {
  it('the binding strings', () => {
    for (const s of ['תיבת הסימולציות', 'ההרכבה תיפתח עם מקלדת הבלוקים']) expect(CODE, s).toContain(s);
  });

  it('body through <EnText>, sender through <EnWord>', () => {
    expect(CODE).toMatch(/<EnText/);
    expect(CODE).toMatch(/<EnWord>/);
  });

  it('the compose strip is present and disabled — ⛔ not hidden (D-046 · D-096 · row ⓓ)', () => {
    expect(CODE).toMatch(/data-compose-strip/);
    expect(CODE).toMatch(/aria-disabled/);
    expect(CODE).not.toMatch(/\bhidden\b(?!=)/);
  });

  it('⛔ draws only — the chips come from the pure layer; one PATCH, no other write', () => {
    expect(CODE).toMatch(/RequiredWordChips/);
    expect(CODE).not.toMatch(/\.filter\(|\.reduce\(|\.sort\(/);
    expect(CODE).toMatch(/apiPatch</);
    expect(CODE).not.toMatch(/apiPost|fetch\(|word_progress|arcade_/);
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
