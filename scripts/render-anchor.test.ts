import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * 🎯 **T-241 — הרנדר מתיישר לפי `36 § 7`, וה⛔ כיוון הוא רנדר⇠מפרט.**
 *
 * `docs/design/` הוא **מחייב** (`36 § 14.4`), ולכן פער בינו לבין המפרט ⛔ אינו נסגר
 * בשקט בקוד המסך — הוא נסגר **ברנדר**, ו-`36 § 1` נותן ל-36 את הניצחון בכל סתירה.
 * ⛔ **וזו הסיבה שהטענות כאן סורקות את המקור, ⛔ ולא את ה-PNG:** ‏`36 § 14.4` אומר
 * במפורש לקחת מיקום, סדר, מחרוזות ומידות **מקובץ הרנדר**, ⛔ ולא מהעין.
 *
 * ⚠️ **הקובץ יושב ב-`scripts/` ⛔ ולא ב-`docs/`** מסיבה אחת: `vitest.config.ts`
 * ⛔ אינו אוסף `docs/**`, וקובץ בדיקה שאינו נאסף הוא בדיקה שלא רצה בזמן שהשער ירוק.
 */
const A = readFileSync('docs/design/render_video_A.py', 'utf8');
const B = readFileSync('docs/design/render_video_B.py', 'utf8');

describe('T-241ⓑ — the render stops promising what the screen does not do', () => {
  it('⛔ zero «the emphasised word»: `36 § 7` names this subtitle word for word', () => {
    // 🔬 `plan/36-video-spec.md:134` — `סיפור ברמה שלך · הקש על מילה לתרגום`.
    // ⛔ The retired wording sent the learner hunting for a marker the screen
    // ⛔ never draws (F-123 · § 4.2יג-ב ⓑ) — the only marking is «ידועה».
    expect(A).toContain('סיפור ברמה שלך · הקש על מילה לתרגום');
    expect(A).not.toContain('מודגשת');
  });

  it('⛔ zero «the next story»: `storyPick` is a DAY index (T-151ⓓ)', () => {
    // ⛔ `components/StoryScreen.test.ts` already holds this line for the screen.
    // The render drew the opposite, and the render is the binding document ⇒ it moves.
    expect(A).not.toContain('הסיפור הבא');
    expect(A).toContain('סיימתי לקרוא');
  });
});

describe('T-241ⓐ — a NEW word is ⛔ not pre-marked, in the render either', () => {
  it('the un-tapped branch draws the word exactly like an untouched one', () => {
    // 🔬 `36 § 7`: «⛔ מילים חדשות אינן מסומנות מראש — שליפה מועילה רק כשהיא מאמץ»,
    // and `components/StoryScreen.tsx` already paints it that way (D-108).
    // ⇒ the `else` of the target branch carries ⛔ no chip and ⛔ no brand underline:
    // same size, same weight, same colour as the plain-word branch below it.
    // ⚠️ הפרוסה נלקחת בין `elif key:` לבין ה-`else:` של ה-if-chain — הוא היחיד
    // שיושב בהזחה של שמונה רווחים, ולכן `else:` הפנימי (`if on:`) ⛔ אינו חותך אותה.
    const start = A.indexOf('        elif key:');
    expect(start, 'the story-word branch must still be found by this scan').toBeGreaterThan(0);
    const end = A.indexOf('\n        else:\n', start);
    expect(end, 'the plain-word branch must still follow it').toBeGreaterThan(start);
    const untapped = A.slice(start, end).split('            else:')[1] ?? '';
    expect(untapped).toContain('INK_MUTED + (238,)');
    expect(untapped).not.toContain('c.rr(');
    expect(untapped).not.toContain('c.line(');
  });

  it('⛔ and the ACTIVE chip stays — it is the tap, ⛔ not a pre-marking', () => {
    // ⚠️ A video has one way to show a press. Removing this too would delete the
    // event itself, which `36 § 7` ⛔ never asked for — it forbids marking a word
    // BEFORE the learner touches it.
    expect(A).toMatch(/if on:\n\s*c\.rr\(x - 5, y - 13, wpx \+ 10, 27, 7, fill=BRAND \+ \(150,\)\)/);
  });
});

describe('T-241ⓓ — the arena label clears the text floor', () => {
  it('⛔ no 9px label in a 375x812 space — א9 is a GATE, ⛔ not taste', () => {
    expect(B).not.toMatch(/c\.txt\(x \+ sw\/2, 582 \+ sw - 13, name, 9,/);
    expect(B).toMatch(/c\.txt\(x \+ sw\/2, 582 \+ sw - 13, name, 12,/);
  });
});

describe('T-241 — the fence: ⛔ zero change to the palette', () => {
  it('`render_video_A.py` still holds EXACTLY the ten `palette.ts` dark tokens', () => {
    // 🔴 The row names this as its fence: an eleventh hex value is a FINDING.
    const hexes = new Set(A.match(/#[0-9a-f]{6}/g) ?? []);
    expect([...hexes].sort()).toEqual(
      [
        '#0f172a',
        '#1e293b',
        '#334155',
        '#3987e5',
        '#4ade80',
        '#7dabf8',
        '#94a3b8',
        '#cbd5e1',
        '#f87171',
        '#f8fafc',
      ].sort(),
    );
  });
});
