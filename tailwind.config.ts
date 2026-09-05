import type { Config } from 'tailwindcss';

/**
 * Semantic names only. There are deliberately no `dark:` variants in this
 * product: the custom properties swap under prefers-color-scheme, so a screen
 * written once is correct in both modes and cannot be half-converted.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: 'var(--surface)',
        'surface-raised': 'var(--surface-raised)',
        ink: 'var(--ink)',
        'ink-muted': 'var(--ink-muted)',
        'border-subtle': 'var(--border-subtle)',
        'border-strong': 'var(--border-strong)',
        brand: 'var(--brand)',
        'brand-surface': 'var(--brand-surface)',
        'brand-on': 'var(--brand-on)',
        success: 'var(--success)',
        danger: 'var(--danger)',
      },
      fontFamily: { sans: ['system-ui', 'Segoe UI', 'Arial', 'sans-serif'] },
      minHeight: { touch: '44px' },
      minWidth: { touch: '44px' },
      /**
       * Constitution v2 layer B § ב2 (D-102) — the FIVE-value radius scale, and the only
       * five names `scripts/radius-hygiene.test.ts` (T-068 · T-168) allows anywhere in
       * `components/` or `app/`. These values are identical to Tailwind's own defaults
       * (md 6px · lg 8px · xl 12px · 2xl 16px · full 9999px) — declaring them here is
       * deliberate: the scale is now a named, versioned fact of this codebase rather than
       * an implicit default that could silently drift if Tailwind's own scale ever changes.
       * ⛔ Do not add a sixth value — that is a finding against the constitution, not a fix
       * here (D-036 ⇒ D-102).
       */
      borderRadius: {
        md: '6px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
        full: '9999px',
      },
    },
  },
  plugins: [],
};
export default config;
