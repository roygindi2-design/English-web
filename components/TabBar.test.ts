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

  it('states the measurable sentence, and the count in it is the fetched activeWords', () => {
    // Locate the sentence itself, then the identifier interpolated into it.
    const sentence = src.match(
      /העולם ייפתח כשיהיו לך 12 מילים פעילות\.[^`]*יש לך \$\{([\w$]+)\}/,
    );
    expect(sentence).not.toBeNull();
    const param = sentence![1];

    // Locate the CALL SITE and read what is actually handed to that parameter. This is the
    // assertion F-039 says was missing: `posts.length`, `TABS.length` or a literal would all
    // satisfy a `toContain('יש לך')` and all fail here.
    const callSite = src.match(
      new RegExp(String.raw`worldSheetTextHe\(\s*([\w$]+)\?\.activeWords\s*\?\?\s*null\s*\)`),
    );
    expect(callSite).not.toBeNull();
    expect(param).toBe('activeWords');

    // …and the variable at that call site is the one the status read writes, written once.
    const stateVar = callSite![1];
    const decl = src.match(
      new RegExp(String.raw`const \[${stateVar}, (set[\w$]+)\] = useState`),
    );
    expect(decl).not.toBeNull();
    const setter = decl![1];
    expect(src.match(new RegExp(String.raw`${setter}\(`, 'g'))?.length).toBe(1);
    expect(src).toMatch(
      new RegExp(String.raw`${setter}\(\{[\s\S]{0,200}activeWords: body\.activeWords`),
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

  it('⛔ never shows «יש לך 0» before the count is known', () => {
    // 0 and "not yet known" are different facts. The renderer must take `number | null` and
    // drop the whole clause on `null` — ⛔ not default it to 0.
    expect(src).toMatch(/worldSheetTextHe\s*=\s*\(\s*activeWords: number \| null\s*\)/);
    expect(src).toMatch(/activeWords === null/);
    expect(src).not.toMatch(/activeWords\s*\?\?\s*0/);
  });
});
