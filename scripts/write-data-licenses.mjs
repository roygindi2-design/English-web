#!/usr/bin/env node
/**
 * The impure half of T-011: takes the pure render and puts it on disk.
 * Run by hand after editing the registry, then commit the result. Not wired
 * into CI on purpose — a generator that also runs in CI hides drift instead of
 * failing on it, and lib/core/dataSources.test.ts is the thing that must fail.
 *
 * Runs the TypeScript in lib/core/ directly, with the same resolve hook the
 * coverage runner uses (see data/README.md, "Runtime requirement"): Node >= 22.18
 * strips types, but does not resolve extensionless specifiers.
 */
import { writeFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && !/\.[mc]?[jt]s$/.test(specifier)) {
      try {
        return next(`${specifier}.ts`, context);
      } catch {
        /* fall through to the default resolution below */
      }
    }
    return next(specifier, context);
  },
});

const { licencesMarkdown } = await import(
  pathToFileURL(new URL('../lib/core/dataSources.ts', import.meta.url).pathname).href
);

writeFileSync('docs/data-licenses.md', licencesMarkdown(), 'utf8');
console.log('✓ docs/data-licenses.md written from lib/core/dataSources.ts');
