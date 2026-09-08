import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const SRC = readFileSync(new URL('./ArenaCharacterChoice.tsx', import.meta.url), 'utf8');
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');

describe('ArenaCharacterChoice — `37 § 7` on the geometry of `docs/design/kol-B-01-home.png`', () => {
  it('title, the one description line, and the confirm — Hebrew, from the spec', () => {
    expect(SRC).toContain('בחירת דמות');
    expect(SRC).toContain('CHARACTER_INTRO_HE');
    expect(SRC).toContain("'בחר'");
  });

  it('the three cards come from the rule, ⛔ not from a list in the component', () => {
    expect(SRC).toContain('ARENA_CHARACTERS.map(');
    expect(SRC).toContain('CHARACTER_BIAS_HE[');
    expect(CODE).not.toContain("'קוסם'");
  });

  it('three live idles — the existing keyframe, and `motion-reduce:animate-none` (Layer A)', () => {
    expect((SRC.match(/arena-idle-bob_4\.19s/g) ?? []).length).toBeGreaterThanOrEqual(1);
    expect(SRC).toContain('motion-reduce:animate-none');
    expect(CODE).not.toMatch(/@keyframes/);
  });

  it('selection is ⛔ never colour alone: aria-pressed + the word + the glyph', () => {
    expect(SRC).toContain('aria-pressed');
    expect(SRC).toContain("'נבחר'");
    expect(SRC).toContain('CheckGlyph');
  });

  it('⛔ no exit on first entry, `חזרה למסך הבית` only with a stored character', () => {
    expect(SRC).toContain('onBack !== undefined &&');
    expect(SRC).toContain('חזרה למסך הבית');
  });

  it('a disabled confirm carries a visible written reason (the ArenaHome pattern)', () => {
    expect(SRC).toContain('aria-describedby');
    expect(SRC).toContain('בחר דמות כדי להמשיך');
  });

  it('one endpoint, and it is the PATCH of T-217', () => {
    const paths = [...CODE.matchAll(/'(\/api\/[^']+)'/g)].map((m) => m[1]);
    expect(new Set(paths)).toEqual(new Set(['/api/arcade/character']));
    expect(CODE).toContain('apiPatch');
    expect(CODE).not.toContain('fetch(');
  });

  it('⛔ zero hex · ⛔ zero emoji · ⛔ no h-screen', () => {
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CODE).not.toMatch(/\p{Extended_Pictographic}/u);
    expect(CODE).not.toContain('h-screen');
    expect(SRC).toContain('min-h-[100dvh]');
  });

  /**
   * ⚠️ The plan's string-literal regex counted `'use client'` and every state name
   * (`'idle'` · `'saving'`) as learner-facing text. The repo's proven measure is
   * `ArenaHome.test.ts`: JSX **text nodes**, with code punctuation filtered out.
   */
  it('⛔ RTL, ו⛔ אין מחרוזת אנגלית שהלומד רואה', () => {
    const strings = CODE.match(/(?<!=)>[^<>{}]*[A-Za-z][^<>{}]*</g) ?? [];
    const text = strings.filter((s) => /[=;()?]/.test(s) === false);
    expect(text.filter((s) => /[א-ת]/.test(s) === false && s.trim().length > 3)).toEqual([]);
  });
});
