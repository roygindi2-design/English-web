import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  // proxy.ts lives at the repo root by Next convention, so its guard test
  // (F-003) has to be picked up from there too.
  test: { environment: 'node', include: ['lib/**/*.test.ts', 'proxy.test.ts'] },
});
