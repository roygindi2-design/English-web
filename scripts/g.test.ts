import { execFileSync } from 'node:child_process';
import { accessSync, constants, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const WRAPPER = join('scripts', 'g');
const source = readFileSync(WRAPPER, 'utf8');

/**
 * ⚠️ WHAT THIS CAN AND CANNOT PROVE.
 *
 * The real proof was run by hand against the live remote and is in the commit
 * message: with `https_proxy=http://127.0.0.1:9`, bare `git ls-remote` exits 128
 * and `./scripts/g ls-remote` exits 0. ⛔ That proof CANNOT live here — a test
 * suite that needs the network is a test suite that goes red for reasons that
 * have nothing to do with the change.
 *
 * So this file proves the two halves that are checkable offline:
 *   ⓐ the wrapper runs, and does not break git;
 *   ⓑ the `env -u` list IT ACTUALLY CONTAINS really clears those variables —
 *      read out of the file, ⛔ not retyped here, so the test measures the
 *      wrapper rather than a copy of it.
 */
describe('scripts/g — the proxy wrapper', () => {
  it('exists and is executable', () => {
    // A wrapper without the executable bit fails at the moment it is needed most.
    expect(() => accessSync(WRAPPER, constants.X_OK)).not.toThrow();
  });

  it('runs a git command and returns its real output', () => {
    const out = execFileSync(`./${WRAPPER}`, ['rev-parse', '--abbrev-ref', 'HEAD'], {
      encoding: 'utf8',
    }).trim();
    expect(out.length).toBeGreaterThan(0);
    const bare = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      encoding: 'utf8',
    }).trim();
    expect(out).toBe(bare);
  });

  it('clears every proxy variable git reads — measured on the list in the file itself', () => {
    const unset = [...source.matchAll(/-u\s+(\w+)/g)].map((m) => m[1] as string);
    // Both cases of all four families. Miss one case and the sandbox still wins:
    // curl reads the lowercase names, and some tooling only sets the uppercase.
    for (const name of ['http_proxy', 'HTTP_PROXY', 'https_proxy', 'HTTPS_PROXY']) {
      expect(unset, `${name} must be unset by the wrapper`).toContain(name);
    }

    // Now run that exact list and confirm it does what it claims. ⛔ No network.
    // ⚠️ Counted by NAME, ⛔ not by grepping for "proxy": measured, this sandbox
    // sets 25 variables whose names contain "proxy" — npm_config_*, YARN_*,
    // DOCKER_*, CLOUDSDK_* — and git reads none of them. A grep-wide assertion
    // fails on variables the wrapper is right not to touch.
    const polluted = Object.fromEntries(unset.map((n) => [n, 'http://127.0.0.1:9']));
    const survived = execFileSync(
      'env',
      [
        ...unset.flatMap((n) => ['-u', n]),
        'node',
        '-e',
        `process.stdout.write(${JSON.stringify(unset)}.filter((n) => process.env[n] !== undefined).join(','))`,
      ],
      { encoding: 'utf8', env: { ...process.env, ...polluted } },
    ).trim();
    expect(survived, 'these survived the unset').toBe('');
  });

  it('execs git rather than wrapping it in a subshell that swallows the exit code', () => {
    // `exec` matters: without it the wrapper is a parent process, and a git
    // failure can come back as a success from the wrapper.
    expect(source).toMatch(/^exec env/m);
    expect(() =>
      execFileSync(`./${WRAPPER}`, ['rev-parse', '--verify', 'refs/heads/does-not-exist'], {
        stdio: 'pipe',
      }),
    ).toThrow();
  });
});
