import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AMIRNET_TABS, NOT_YET_HE } from './AmirnetTabs';

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

  it('an unbuilt tab is present and disabled, ⛔ never hidden (D-152 § ב׳)', () => {
    expect(NOT_YET_HE).toBe('טרם');
    expect(CODE).toMatch(/aria-disabled=\{!live\}/);
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
