import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BlockKeyboardView } from '@/components/BlockKeyboard';
import { POS_LABEL_HE, colourOf, labelOf } from '@/lib/core/blockKeyboard';
import type { Block } from '@/lib/core/continuations';
import { POS_VALUES, type Pos } from '@/lib/core/contentSchema';

/**
 * T-201 · D-112 · `39 § 3` — a block is ⛔ never shown without its written legend.
 *
 * The `39 § 3` colours are exempt from `CONTRAST_FLOORS` and are ⛔ not told apart by
 * colour-blind learners (`#5b9bf5`↔`#d178e8` protan ΔE 5.9 · `#2ec5c5`↔`#8b95ab` deutan
 * ΔE 9.3, F-118 · F-323). That exemption holds EXACTLY while this file is green: the
 * colour is decoration, the words are the information.
 *
 * Measured by RENDERING, ⛔ not by grepping for a call: every element the token file can
 * tint (`[data-block-keyboard] [data-pos]`) — the sheet's blocks AND the compose bar's
 * chosen chips — must print its category text. And ⛔ no class may hide that text at any
 * width or in any compact state: there is ⛔ no «narrow screen» exemption.
 */

const ALL: readonly (Pos | null)[] = [...POS_VALUES, null];
const blocks: readonly Block[] = ALL.map((pos, i) => ({ word: `w${i}`, pos }));

function render(): string {
  return renderToStaticMarkup(
    <BlockKeyboardView
      chosen={blocks}
      view={{ blocks, count: blocks.length, canSend: true, hintHe: null }}
      status="ready"
      onSend={() => {}}
    />,
  );
}

/** Every element carrying `data-pos="…"`, with its full inner markup. */
function tinted(html: string): { pos: string; inner: string }[] {
  const out: { pos: string; inner: string }[] = [];
  const open = /<(button|span)\b[^>]*\bdata-pos="([^"]+)"[^>]*>/g;
  for (let m = open.exec(html); m; m = open.exec(html)) {
    const tag = m[1];
    let depth = 1;
    const i = open.lastIndex;
    const tagRe = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'g');
    tagRe.lastIndex = i;
    for (let t = tagRe.exec(html); t; t = tagRe.exec(html)) {
      depth += t[1] ? -1 : 1;
      if (depth === 0) {
        out.push({ pos: m[2] ?? '', inner: html.slice(i, t.index) });
        break;
      }
    }
  }
  return out;
}

const HIDING = /(^|\s)([a-z0-9-]+:)*(hidden|sr-only|invisible|truncate|opacity-0|text-transparent|w-0|h-0|max-h-0)(\s|$)/;

describe('T-201 — every block prints its category in words', () => {
  it('every pos (and «several») has a distinct, non-empty Hebrew legend', () => {
    const labels = ALL.map(labelOf);
    for (const l of labels) expect(l.trim().length).toBeGreaterThan(0);
    expect(new Set(labels).size).toBe(labels.length);
    expect(Object.keys(POS_LABEL_HE).length).toBe(ALL.length);
  });

  it('the render has a tinted element per block in the sheet AND per chosen chip', () => {
    const els = tinted(render());
    // the sheet's blocks + the compose bar's chips, one each per pos
    expect(els.length).toBe(blocks.length * 2);
  });

  it('every tinted element prints its legend inside itself — sheet and compose bar alike', () => {
    const els = tinted(render());
    for (const [n, el] of els.entries()) {
      const b = blocks[n % blocks.length]!;
      expect(el.pos, b.word).toBe(colourOf(b.pos) ?? 'none');
      const legend = /<span[^>]*data-pos-legend[^>]*>([^<]*)<\/span>/.exec(el.inner);
      expect(legend, `${b.word} (${b.pos ?? 'several'}) has no legend`).not.toBeNull();
      expect(legend![1]).toBe(labelOf(b.pos));
    }
  });

  it('⛔ no class hides the legend at any width or in a compact state', () => {
    const html = render();
    const legends = [...html.matchAll(/<span([^>]*data-pos-legend[^>]*)>/g)];
    expect(legends.length).toBe(blocks.length * 2);
    for (const [, attrs = ''] of legends) {
      const cls = /class="([^"]*)"/.exec(attrs)?.[1] ?? '';
      expect(cls, cls).not.toMatch(HIDING);
      expect(attrs).not.toMatch(/aria-hidden|style=/);
    }
  });

  it('⛔ the scoped token file never hides, shrinks away or colours out a legend', () => {
    const css = readFileSync('components/block-keyboard-tokens.css', 'utf8');
    expect(css).not.toMatch(/data-pos-legend/);
    expect(css).not.toMatch(/@media|@container|display:\s*none|visibility:\s*hidden/);
  });
});
