import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error — a node script with no declaration file, imported for its pure parts
import { CONTROL, LOG, agentOf, heartbeatSubject, lockHolder } from './loop-heartbeat.mjs';

const PRE_PUSH = readFileSync('scripts/hooks/pre-push', 'utf8');
const base = { lock: 'PM', mine: 'PM', cycle: 'C-0792', note: 'T-341 converting', ahead: 0 };

describe('T-404 — the heartbeat a live lock holder can push', () => {
  it('reads the lock exactly like pre-push: -agent dropped, upper-cased', () => {
    expect(lockHolder('LOCK_HELD_BY: "pm-agent"   # x\nLOCK_AT: ""')).toBe('PM');
    expect(lockHolder('LOCK_HELD_BY: "DEV"')).toBe('DEV');
    expect(lockHolder('LOCK_HELD_BY: ""')).toBe('');
    for (const [u, a] of [['dev-agent', 'DEV'], ['pm-agent', 'PM'], ['critic-agent', 'QA'], ['nobody', '']]) {
      expect(agentOf(u)).toBe(a);
    }
  });

  it('the subject carries the holder prefix pre-push greps for', () => {
    const s = heartbeatSubject(base);
    expect(s).toBe('loop(PM): C-0792 heartbeat — T-341 converting');
    expect(s).toMatch(/^loop\(PM\)/); // pre-push: HOLDER_RE="^loop\\($LOCK\\)"
    expect(PRE_PUSH).toContain('HOLDER_RE="^loop\\\\($LOCK\\\\)"');
  });

  it('the file it commits is counted as a holder file, and takes the register fast lane', () => {
    // pre-push drops ONLY plan/00-control.md from HOLDER_FILES — the lock commit itself.
    expect(PRE_PUSH).toContain("grep -v '^plan/00-control.md$'");
    expect(LOG).not.toBe(CONTROL);
    expect(LOG.startsWith('plan/')).toBe(true); // `plan/*` ⇒ REGISTER_ONLY stays 1
  });

  it('⛔ refuses an empty lock, a foreign lock, an unknown user, a bad cycle, an empty note, unpushed work', () => {
    expect(() => heartbeatSubject({ ...base, lock: '' })).toThrow(/empty/);
    expect(() => heartbeatSubject({ ...base, lock: 'DEV' })).toThrow(/forged/);
    expect(() => heartbeatSubject({ ...base, mine: '' })).toThrow(/not a loop agent/);
    expect(() => heartbeatSubject({ ...base, cycle: '0792' })).toThrow(/C-NNNN/);
    expect(() => heartbeatSubject({ ...base, note: '   ' })).toThrow(/note/);
    expect(() => heartbeatSubject({ ...base, ahead: 2 })).toThrow(/push them instead/);
  });

  it('⛔ node builtins only — it must run before `npm install`', () => {
    const src = readFileSync('scripts/loop-heartbeat.mjs', 'utf8');
    const imports = [...src.matchAll(/^import .* from '([^']+)';$/gm)].map((m) => m[1]);
    expect(imports.length).toBeGreaterThan(0);
    for (const i of imports) expect(i, i).toMatch(/^node:/);
    expect(src).not.toMatch(/SKIP_VERIFY=1|--no-verify/);
  });
});
