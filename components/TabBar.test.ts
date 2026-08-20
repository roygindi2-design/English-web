import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Comments are stripped before the scan — the same guard `ActionBar.test.ts`
 * carries, and here it is not a precaution but a repair. Measured in this tick:
 * over RAW text, the mutation that reduces the active-tab marker to colour
 * alone (`border-t-2 border-brand font-semibold` → `text-brand`) left all seven
 * checks GREEN, because the regex matched the word `aria-current` inside this
 * component's own JSDoc and then found `border-t-2` in a constant 300 characters
 * later. The rule the check exists to enforce — constitution § 1, colour is
 * never the only channel — was being proven by prose. With comments stripped
 * the same mutation fails.
 */
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[^\S\n]*\/\/.*$/gm, '');

const src = stripComments(readFileSync('components/TabBar.tsx', 'utf8'));

describe('the four-tab shell (D-027 · § 4.2ב)', () => {
  it('carries exactly the four locked labels', () => {
    for (const label of ['לימודים', 'כרטיסיות', 'העולם', 'אני']) expect(src).toContain(label);
  });

  it('keeps the RTL order: studies is first, me is last', () => {
    const order = ['לימודים', 'כרטיסיות', 'העולם', 'אני'].map((l) => src.indexOf(l));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(order.every((i) => i > -1)).toBe(true);
  });

  it('has no fifth tab', () => {
    expect(src.match(/labelHe:/g)?.length).toBe(4);
  });

  /**
   * T-078 moved `LockIcon` out of this file into `components/LockIcon.tsx` so
   * `CardsScreen` could show the same mark beside its own «נעול». ⛔ The tab
   * itself is unchanged — it still renders the icon beside the label, from the
   * one place the artwork now lives.
   */
  it('renders the lock from the shared component, ⛔ never a local copy (T-078)', () => {
    expect(src).toMatch(/import LockIcon from '@\/components\/LockIcon'/);
    expect(src).toContain('<LockIcon />');
    expect(src).not.toMatch(/function LockIcon/);
    expect(src).not.toContain('<svg');
  });

  it('marks the active tab by state and shape, never by colour alone (constitution § 1)', () => {
    expect(src).toContain('aria-current');
    expect(src).toMatch(/aria-current[\s\S]{0,400}(border-t-2|h-1|rounded-full)/);
  });

  it('locks the world tab instead of navigating to an empty screen', () => {
    expect(src).toContain('aria-disabled');
    expect(src).toMatch(/href:\s*null/);
  });

  it('keeps every tap target at the 44px floor', () => {
    expect(src).toContain('min-h-touch');
  });

  it('marks itself for the harness and the document padding', () => {
    expect(src).toContain('data-tab-bar');
  });
});

/**
 * Task 7 of `2026-08-14-world-compose.md` — the tab stops being locked by a constant and
 * starts being locked by a server answer.
 *
 * ⚠️ **F-039 applies to every assertion below.** The finding was opened in C-0124 after a
 * measured miss: `expect(CODE).toContain('—')` guarded a counter and a mutation that put an
 * unrelated number under the label SURVIVED it, because the assertion measured the label and
 * ⛔ not the number. So no check here is a bare `toContain(<name>)` on something the
 * component merely mentions: each one first LOCATES the call site (the `apiGet` argument,
 * the sheet-sentence call, the setter) and then measures what is passed AT it. The three
 * mutations run in this tick are named in `plan/30-architecture.md`.
 */
describe('<TabBar> — the world tab unlocks from the server (D-031 · task 7)', () => {
  it('still renders the four tabs in the locked RTL order', () => {
    const order = ["id: 'studies'", "id: 'cards'", "id: 'world'", "id: 'me'"].map((id) =>
      src.indexOf(id),
    );
    expect(order.every((i) => i > -1)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('reads the unlock state from /api/world/status, ⛔ not from a constant', () => {
    // The path has to be the ARGUMENT of the read, ⛔ not a string that appears somewhere in
    // the file: a component that names the endpoint in a comment and hard-codes the answer
    // would pass a `toContain('/api/world/status')`.
    expect(src).toMatch(/apiGet\s*<[^>]*>\s*\(\s*'\/api\/world\/status'\s*\)/);
    expect(src).not.toMatch(/unlocked\s*=\s*(true|false)\s*[;,]/);
  });

  it('keeps aria-disabled + the sheet while locked (§ 4.2ב) and ⛔ adds no "coming soon" screen', () => {
    expect(src).toContain('aria-disabled');
    // ⚠️ **Deviation from the plan's literal text, and the reason is that its version cannot
    // pass.** Task 7 step 1 writes `expect(CODE).not.toContain('disabled=')` — but the very
    // attribute the line above REQUIRES, `aria-disabled=`, contains that substring, so the
    // assertion is red for correct code and green for no code at all. What § 4.2ב actually
    // forbids is the BARE `disabled` attribute (it would swallow the tap that opens the
    // sheet), so that is what is measured. Logged against the plan as F-041.
    expect(src).not.toMatch(/(?<!aria-)disabled=/);
    expect(src).toMatch(/setWorldSheetOpen\(true\)/);
  });

  /**
   * ⚠️ **Repaired in T-125, ⛔ not deleted.** Until T-125 this assertion located the Hebrew
   * sentence INSIDE this component and read the identifier interpolated into it. D-066 moved
   * the sentence to `lib/core/worldGate.ts`, so the string is no longer here to find — but
   * what the assertion actually protects (F-039: measure the CALL SITE, ⛔ never a name the
   * file merely mentions) survives unchanged. What is measured now is that the counts handed
   * to the pure sentence are the ones the status read wrote, and the sentence's own wording
   * is measured as behaviour in `lib/core/worldGate.test.ts`.
   */
  it('hands the sheet sentence the fetched counts, ⛔ not a literal and ⛔ not a length', () => {
    // Locate the CALL SITE and read what is actually passed AT it. `TABS.length`, a literal,
    // or an unrelated counter would all satisfy a `toContain('worldGateSentenceHe')`.
    const callSite = src.match(
      new RegExp(
        String.raw`worldGateSentenceHe\(\s*\{\s*functionWords: ([\w$]+)\.functionWords,\s*activeWords: \1\.activeWords,?\s*\}`,
      ),
    );
    expect(callSite).not.toBeNull();

    // …and the variable at that call site is the one the status read writes, written once.
    const stateVar = callSite![1];
    const decl = src.match(
      new RegExp(String.raw`const \[${stateVar}, (set[\w$]+)\] = useState`),
    );
    expect(decl).not.toBeNull();
    const setter = decl![1];
    expect(src.match(new RegExp(String.raw`${setter}\(`, 'g'))?.length).toBe(1);
    expect(src).toMatch(
      new RegExp(String.raw`${setter}\(\{[\s\S]{0,300}activeWords: body\.activeWords`),
    );
    expect(src).toMatch(
      new RegExp(String.raw`${setter}\(\{[\s\S]{0,300}functionWords: body\.functionWords`),
    );
  });

  it('⛔ shows no date and no bare "בקרוב" as the sheet sentence', () => {
    expect(src).not.toMatch(/בקרוב\.|תאריך/);
  });

  it('navigates to /world once unlocked, and the href is gated on the fetched flag', () => {
    const gate = src.match(/([\w$]+)\?\.unlocked === true \? WORLD_HREF : null/);
    expect(gate).not.toBeNull();
    expect(src).toMatch(/const WORLD_HREF = '\/world'/);
    // `=== true` and ⛔ not a truthiness test: a read that failed leaves the state `null`,
    // and an unlock we could not confirm is not an unlock.
    expect(src).not.toMatch(/\?\.unlocked \?\?/);
  });

  /**
   * ⚠️ **Repaired in T-125, ⛔ not deleted.** The rule it guards — 0 and «not yet known» are
   * different facts — is unchanged; what moved is where each half of it is enforced. The
   * `number | null` contract and the dropped «יש לך» clause are now measured as behaviour in
   * `lib/core/worldGate.test.ts`. What is left for THIS file is the half only this file can
   * break: manufacturing a zero on the way in.
   */
  it('⛔ never manufactures a 0 for a count or a threshold it did not receive', () => {
    expect(src).not.toMatch(/[aA]ctiveWords\s*\?\?\s*0/);
    expect(src).not.toMatch(/[fF]unctionWords\s*\?\?\s*0/);
    // The whole-status branch, ⛔ not a per-field default: with no answer there is no
    // threshold either, so «כשיהיו לך 0 מילים פעילות» is a number this file would have
    // invented. Both halves are required — the constant alone could sit unused.
    expect(src).toContain('WORLD_SHEET_UNKNOWN_HE');
    expect(src).toMatch(/worldStatus === null\s*\n?\s*\?\s*WORLD_SHEET_UNKNOWN_HE/);
  });
});

/**
 * T-125 · D-066 — the sheet stops telling the learner about one of the two conditions.
 *
 * ⚠️ Every assertion here is a SOURCE guard on `TabBar.tsx` and measures wiring only; the
 * sentence's wording is measured as behaviour in `lib/core/worldGate.test.ts`. F-039 applies:
 * each check locates a call site or a field, ⛔ never a bare mention.
 */
describe('<TabBar> — the sheet speaks about BOTH gate conditions (T-125 · D-066)', () => {
  it('⛔ carries no copy of the threshold inside a Hebrew string in this file', () => {
    // This was the silent copy: «כשיהיו לך 12 מילים פעילות» written out here while the
    // number that decides lived in the route. ⛔ Any literal, ⛔ not just 12.
    expect(src).not.toMatch(/כשיהיו לך \d/);
  });

  it('delegates the sentence to /lib/core ⛔ and does not rebuild it here', () => {
    expect(src).toMatch(/import \{ worldGateSentenceHe \} from '@\/lib\/core\/worldGate'/);
    expect(src).not.toContain('worldSheetTextHe');
  });

  it('reads functionWords — the condition that was blocking and invisible', () => {
    // Read off the CALL SITE: the field has to reach the sentence, ⛔ not merely be typed.
    expect(src).toMatch(/worldGateSentenceHe\(\s*\{\s*functionWords:/);
  });

  it('takes BOTH thresholds from the server ⛔ and hard-codes neither', () => {
    expect(src).toMatch(/minFunctionWords: [\w$]+\.minFunctionWords/);
    expect(src).toMatch(/minActiveWords: [\w$]+\.minActiveWords/);
    expect(src).not.toMatch(/min(Function|Active)Words[:=]\s*\d/);
  });

  it('validates the four numbers where they arrive — apiGet casts, ⛔ it does not check', () => {
    // A body that is `ok:true` and short a threshold would otherwise print
    // «כשיהיו לך undefined מילים פעילות». The guard has to sit BEFORE the setter.
    const guard = src.indexOf('Number.isFinite');
    const setter = src.indexOf('setWorldStatus({');
    expect(guard).toBeGreaterThan(-1);
    expect(setter).toBeGreaterThan(guard);
    for (const field of ['functionWords', 'activeWords', 'minFunctionWords', 'minActiveWords'])
      expect(src).toContain(`'${field}'`);
  });

  it('keeps the id the sheet is labelled by — aria-labelledby points at it', () => {
    expect(src).toMatch(/aria-labelledby="world-sheet-text"/);
    expect(src).toMatch(/id="world-sheet-text"/);
  });
});
