import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  // proxy.ts lives at the repo root by Next convention, so its guard test
  // (F-003) has to be picked up from there too.
  test: {
    environment: 'node',
    // The suite runs in the learners' timezone, not the container's.
    // Measured C-0031: with TZ unset the container is UTC, which has no DST, so
    // `lib/core/onboarding.test.ts` > "counts calendar days across a DST boundary"
    // stayed GREEN after `daysUntilExam` was mutated to local-component
    // `new Date(y, m - 1, d)` arithmetic — the exact bug it exists to catch
    // (2.958… days across 2026-03-27 → floor 2). Under Asia/Jerusalem the same
    // mutation fails with `expected 2 to be 3`. Pinning the zone is what turns
    // that assertion from decoration into a measurement.
    env: { TZ: 'Asia/Jerusalem' },
    // scripts/ holds the build-pipeline guards (F-007).
    // components/ holds source-scanning guards only (T-009). The environment is
    // node, so a React render test does not belong here — add jsdom first if that
    // ever changes.
    // The {ts,tsx} brace is not decoration: a `components/*.test.tsx` render
    // test under a `*.test.ts`-only glob is silently NOT COLLECTED, and
    // `npm test` stays green while the test never runs.
    // app/ holds source-scanning guards for a route handler and a screen whose
    // behaviour cannot be reached without Supabase env and a live session
    // (`app/api/profile/route.test.ts`, `app/(tabs)/me/page.test.ts`). Added
    // C-0073: without this line those files are silently NOT COLLECTED and
    // `npm test` stays green while nothing in them ever runs — the same trap
    // the brace above documents, one directory over.
    include: [
      'lib/**/*.test.ts',
      'proxy.test.ts',
      'scripts/**/*.test.ts',
      'components/**/*.test.{ts,tsx}',
      'app/**/*.test.{ts,tsx}',
    ],
  },
});
