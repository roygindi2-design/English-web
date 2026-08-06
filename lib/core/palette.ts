/**
 * PURE. The single source of truth for every colour in the product (T-028, F-014).
 *
 * Why this lives in /lib/core and not only in CSS: a colour is a claim about
 * legibility, and a claim we do not measure is a claim we do not have. The table
 * below is paired with CONTRAST_FLOORS, which the unit test enforces, so a future
 * "let's lighten the brand a bit" cannot silently drop text under 4.5:1.
 *
 * Provenance of the values (recorded 2026-08-06):
 * - --brand light #2a78d6 and dark #3987e5 each pass the dataviz validator
 *   (scripts/validate_palette.js) against this product's own surfaces:
 *   `--mode light --surface #f8fafc` and `--mode dark --surface #0f172a`.
 * - --brand-surface is a SECOND, darker step, and it exists for one measured
 *   reason: white on #2a78d6 is 4.42:1, under the 4.5:1 body-text floor. The
 *   button fill therefore is not the mark colour. White on #1d4ed8 is 6.70:1.
 * - --success / --danger are status colours. As a categorical pair they FAIL the
 *   validator's CVD check (deutan ΔE 4.1), which is not a defect to fix by
 *   re-stepping but the reason status is never encoded by colour alone anywhere
 *   in this product: icon + label always. See Task 3.
 */

export type ThemeMode = 'light' | 'dark';

export interface ColorToken {
  readonly cssVar: string;
  readonly light: string;
  readonly dark: string;
  readonly role: string;
}

export const COLOR_TOKENS: readonly ColorToken[] = Object.freeze([
  { cssVar: '--surface', light: '#f8fafc', dark: '#0f172a', role: 'page background' },
  { cssVar: '--surface-raised', light: '#ffffff', dark: '#1e293b', role: 'card background' },
  { cssVar: '--ink', light: '#0f172a', dark: '#f8fafc', role: 'body text' },
  { cssVar: '--ink-muted', light: '#475569', dark: '#cbd5e1', role: 'secondary text' },
  { cssVar: '--border-subtle', light: '#e2e8f0', dark: '#334155', role: 'decorative separator' },
  {
    cssVar: '--border-strong',
    light: '#64748b',
    dark: '#94a3b8',
    role: 'the only boundary of a control',
  },
  { cssVar: '--brand', light: '#2a78d6', dark: '#3987e5', role: 'accent mark and link' },
  { cssVar: '--brand-surface', light: '#1d4ed8', dark: '#7dabf8', role: 'primary button fill' },
  { cssVar: '--brand-on', light: '#ffffff', dark: '#0f172a', role: 'text on brand-surface' },
  { cssVar: '--success', light: '#047857', dark: '#4ade80', role: 'correct — with icon + label' },
  { cssVar: '--danger', light: '#b91c1c', dark: '#f87171', role: 'incorrect — with icon + label' },
] as const);

export interface ContrastFloor {
  readonly fg: string;
  readonly bg: string;
  readonly min: number;
  readonly why: string;
}

/** WCAG 2.1: 4.5:1 body text, 3:1 large text and non-text UI boundaries. */
export const CONTRAST_FLOORS: readonly ContrastFloor[] = Object.freeze([
  { fg: '--ink', bg: '--surface', min: 4.5, why: 'body text on the page' },
  { fg: '--ink', bg: '--surface-raised', min: 4.5, why: 'body text on a card' },
  { fg: '--ink-muted', bg: '--surface', min: 4.5, why: 'secondary text is still text' },
  { fg: '--ink-muted', bg: '--surface-raised', min: 4.5, why: 'secondary text on a card' },
  { fg: '--brand', bg: '--surface', min: 3, why: 'accent marks are non-text UI' },
  { fg: '--brand', bg: '--surface-raised', min: 3, why: 'accent marks on a card' },
  { fg: '--brand-on', bg: '--brand-surface', min: 4.5, why: 'the label inside the primary button' },
  { fg: '--border-strong', bg: '--surface', min: 3, why: 'an input outline is the control boundary' },
  { fg: '--border-strong', bg: '--surface-raised', min: 3, why: 'an input outline on a card' },
  { fg: '--success', bg: '--surface', min: 4.5, why: 'correct-state text' },
  { fg: '--success', bg: '--surface-raised', min: 4.5, why: 'correct-state text on a card' },
  { fg: '--danger', bg: '--surface', min: 4.5, why: 'incorrect-state text' },
  { fg: '--danger', bg: '--surface-raised', min: 4.5, why: 'incorrect-state text on a card' },
] as const);

const HEX = /^#[0-9a-fA-F]{6}$/;

function channel(hex: string, offset: number): number {
  const v = parseInt(hex.slice(offset, offset + 2), 16) / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

/** WCAG 2.1 relative luminance. Six-digit hex only — a shorthand would parse wrong, not throw. */
function luminance(hex: string): number {
  if (!HEX.test(hex)) throw new RangeError(`expected a 6-digit hex colour, got "${hex}"`);
  return 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
}

export function contrastRatio(hexA: string, hexB: string): number {
  const a = luminance(hexA);
  const b = luminance(hexB);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function tokenValue(cssVar: string, mode: ThemeMode): string {
  const token = COLOR_TOKENS.find((t) => t.cssVar === cssVar);
  if (!token) throw new RangeError(`unknown colour token: ${cssVar}`);
  return mode === 'light' ? token.light : token.dark;
}
