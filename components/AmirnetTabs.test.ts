import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AMIRNET_BUILT_TABS, AMIRNET_TABS, NOT_YET_HE } from './AmirnetTabs';

/**
 * ⚠️ Comments are stripped first, and that is ⛔ not a loophole: these rules are about what a
 * LEARNER is shown. A doc comment that names the banned word in order to explain the ban is
 * the opposite of the defect — scanning it would make documenting the rule fail the rule.
 */
const CODE = readFileSync('components/AmirnetTabs.tsx', 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

describe('AmirnetTabs — T-286ⓐ, render kol-D-03-practice-menu.png', () => {
  it('carries the three tabs in the render RTL order (render_video_D.py:19)', () => {
    expect(AMIRNET_TABS.map((t) => t.he)).toEqual(['דשבורד', 'תרגול', 'סימולציה']);
  });

  /**
   * ⟦C-0536 · F-224⟧ The DISABLED half of this rule moved to `AmirnetTabs.dom.test.tsx`, and the
   * move is the lesson: this assertion used to read `aria-disabled={!live}` — the literal shape of
   * one expression — and it stayed green for the whole of F-224, because a `<span>` that ⛔ never
   * navigates spells `aria-disabled` exactly as correctly as a link that does. ⇒ what a learner is
   * SHOWN is measured on the rendered element now; what is left here is the half a render cannot
   * see, which is that the tab is ⛔ never removed from the bar.
   */
  it('an unbuilt tab is present, ⛔ never hidden (D-152 § ב׳)', () => {
    expect(NOT_YET_HE).toBe('טרם');
    expect(CODE).toMatch(/\{!live && <span className="text-xs">\{NOT_YET_HE\}<\/span>\}/);
    expect(CODE).not.toMatch(/hidden|display:\s*none/);
  });

  it('⛔ never says «בקרוב» — a promise the product does not make (D-046)', () => {
    expect(CODE).not.toContain('בקרוב');
  });

  it('the 44px floor overrides the render 36px bar (36 § 14.4)', () => {
    expect(CODE).toMatch(/min-h-touch/);
    expect(CODE).not.toMatch(/h-9\b/);
  });

  it('⛔ draws only — no fetch and no database anywhere', () => {
    expect(CODE).not.toMatch(/fetch\(|apiGet|apiPost|supabase/);
  });
});

describe('AMIRNET_BUILT_TABS — ⛔ one list, ⛔ never a literal per screen (T-291 · walk C-0533)', () => {
  it('holds exactly the screens that exist, and `סימולציה` is ⛔ not one of them yet', () => {
    expect([...AMIRNET_BUILT_TABS]).toEqual(['dashboard', 'practice']);
    expect(AMIRNET_BUILT_TABS).not.toContain('simulation');
  });

  it('⛔ no screen writes its own list — a stale «טרם» is a promise of absence that is false', () => {
    // The measured failure: the dashboard shipped and three other call sites kept saying `טרם`.
    for (const f of [
      'components/AmirnetDashboard.tsx',
      'components/AmirnetPracticeMenu.tsx',
      'components/AmirnetQuestion.tsx',
    ]) {
      const code = readFileSync(f, 'utf8');
      expect(code, f).toMatch(/built=\{AMIRNET_BUILT_TABS\}/);
      expect(code, f).not.toMatch(/built=\{\[/);
    }
  });
});
