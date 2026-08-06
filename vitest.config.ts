import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  // proxy.ts lives at the repo root by Next convention, so its guard test
  // (F-003) has to be picked up from there too.
  test: {
    environment: 'node',
    // scripts/ holds the build-pipeline guards (F-007).
    // components/ holds source-scanning guards only (T-009). The environment is
    // node, so a React render test does not belong here — add jsdom first if that
    // ever changes.
    // The {ts,tsx} brace is not decoration: a `components/*.test.tsx` render
    // test under a `*.test.ts`-only glob is silently NOT COLLECTED, and
    // `npm test` stays green while the test never runs.
    include: [
      'lib/**/*.test.ts',
      'proxy.test.ts',
      'scripts/**/*.test.ts',
      'components/**/*.test.{ts,tsx}',
    ],
  },
});
