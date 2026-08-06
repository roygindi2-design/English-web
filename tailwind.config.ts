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
    },
  },
  plugins: [],
};
export default config;
