import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('components/StoryScreen.tsx', 'utf8');
const END = readFileSync('components/StoryEndScreen.tsx', 'utf8');
const DONE_FIXTURE = readFileSync('app/dev/story/done/page.tsx', 'utf8');

describe('T-186 — the screen the render binds', () => {
  it('carries the three header strings verbatim', () => {
    expect(SRC).toContain('העולם · סיפורים');
    expect(SRC).toContain('סיפור ברמה שלך · הקש על מילה לתרגום');
  });

  it('marks the paragraph so `check:mobile` can find it (T-183 contract)', () => {
    expect(SRC).toContain('data-story-body');
  });

  it('⛔ never pre-marks a new word — § 4.2יג-ב ⓑ', () => {
    expect(SRC).not.toMatch(/isNew[^\n]*underline|new-word-underline/);
  });

  it('the legend is written, ⛔ not only coloured', () => {
    expect(SRC).toContain('ידועה');
  });

  it('⛔ h-screen is banned; the page is min-h-[100dvh]', () => {
    expect(SRC).not.toContain('h-screen');
    expect(SRC).toContain('min-h-[100dvh]');
  });

  it('⛔ zero database access from a component', () => {
    expect(SRC).not.toContain('@/lib/supabase');
    expect(SRC).not.toMatch(/\bfetch\s*\(/);
  });
});

describe('T-150 — the intro layer states what the learner ALREADY has', () => {
  it('⛔ never «חסרות לך K מילים» — the encouraging sentence is ⛔ not a debt list (T-150ⓒ)', () => {
    expect(SRC).not.toContain('חסרות');
  });

  it('the numbers are derived at display time, ⛔ not read off a new wire field (T-150ⓐ)', () => {
    expect(SRC).toMatch(/from ['"]@\/lib\/core\/storyIntro['"]/);
    expect(SRC).toContain('בסיפור הזה ${fresh} מילים חדשות');
  });

  /**
   * 🔢 **T-383ⓐ — the split is derived, ⛔ never read off the wire.** `payload.counts`
   * is counted on the story BODY by the API, while the three numbers here are built from
   * `glosses`, which carries the TITLE's words too since `T-240`. ⇒ an intro line fed by
   * `counts.newWords` would contradict the words the same screen paints. `alreadyKnown`
   * is still read — but by `StoryEndScreen`, for a different sentence entirely.
   */
  it('⛔ the intro line ⛔ never reads `counts.newWords` off the wire (T-383ⓐ)', () => {
    expect(SRC).not.toContain('counts.newWords');
  });

  it('⛔ zero half-sentence on zero: «0 מילים חדשות» is ⛔ never a string (T-383ⓒ)', () => {
    expect(SRC).toContain('אין כאן מילה חדשה');
    expect(SRC).toContain('intro.total === 0');
  });

  /**
   * ⚠️ **⟦עודכן C-0634 · `T-240`⟧ הספירה עלתה מ-1 ל-2, ⛔ והכוונה ⛔ לא זזה.** הטענה
   * היא «הענף היחיד שמסמן מילה הוא `isKnown`» — ⛔ ולא «יש משטח אחד». מאז `T-240`
   * **שני** משטחים מציירים פלחים: פסקת הקריאה והכותרת, ⇒ ענף אחד לכל משטח.
   * 🔴 **ומה שמחזיק את הכוונה עצמה הוא המבחן שמעל** («⛔ never pre-marks a new word»)
   * ועוד שתי בדיקות DOM ב-`StoryScreen.dom.test.tsx` שמודדות שבדיוק מילה **ידועה**
   * אחת מסומנת בכותרת. ⛔ מספר בלי הסבר הוא בדיוק מה שהעריכה הבאה תשנה בשקט.
   */
  it('⛔ zero pre-marking: `isKnown` branches EXACTLY once per painted surface (T-150ⓑ · § 4.2יג-ב ⓑ)', () => {
    expect(SRC.match(/isKnown/g)?.length ?? 0).toBe(2);
  });
});

describe('T-203 — a string that promises what the screen does not do', () => {
  it('⛔ zero «the emphasised word»: nothing on the screen is emphasised, so nothing may say it is', () => {
    // ⛔ The scan reads the SOURCE — a comment quoting the retired string defeats it,
    // which is why neither file quotes it, not even in documentation.
    expect(SRC).not.toContain('מודגשת');
    expect(SRC).toContain('סיפור ברמה שלך · הקש על מילה לתרגום');
  });

  it('⛔ zero «the next story» anywhere: `storyPick` is a DAY index (T-151ⓓ)', () => {
    expect(SRC).not.toContain('הסיפור הבא');
    expect(END).not.toContain('הסיפור הבא');
  });

  it('both phase labels exist, and they name what the button does', () => {
    expect(SRC).toContain('סיימתי לקרוא');
    expect(SRC).toContain('חזרה לעולם');
  });
});

describe('T-202 — the end state is a STATE, ⛔ not a screen', () => {
  it('⛔ StoryEndScreen ⛔ never claims a screen: no 100dvh, no section semantics', () => {
    expect(END).not.toContain('min-h-[100dvh]');
    expect(END).not.toContain('h-screen');
    expect(END).not.toContain('<section');
  });

  it('⛔ `onNextStory` is gone — the primary action belongs to StoryScreen', () => {
    expect(END).not.toContain('onNextStory');
  });

  it('the /dev fixture renders the WHOLE screen, ⛔ not the component in isolation', () => {
    expect(DONE_FIXTURE).toContain('StoryScreenView');
    expect(DONE_FIXTURE).not.toMatch(/<StoryEndScreen\b/);
    expect(DONE_FIXTURE).toContain('initialPhase="question"');
  });

  it('⛔ `data-story-body` stays on the READING paragraph only (T-183 contract)', () => {
    // ⚠️ הספירה היא על **המאפיין**, ⛔ ולא על אזכור בתיעוד: `data-story-body=` עם
    // סימן שוויון, או המאפיין העירום ב-JSX. שאר האזכורים בקובץ הם הערות שמסבירות
    // את חוזה T-183, ו⛔ אין להן משמעות בדפדפן.
    expect(SRC.match(/^\s*data-story-body$/gm)?.length ?? 0).toBe(1);
    expect(END).not.toContain('data-story-body');
  });
});

describe('T-374 — the English body is laid out LEFT, exactly as the render draws it', () => {
  it('the reading paragraph carries `text-left`', () => {
    // 🔬 `docs/design/render_video_A.py:951` מתעד את עצמו `"""left-to-right wrap"""`
    // ומצייר כל מילה ב-`anchor="lm"` מ-`ST_X + ST_PAD` ⇒ הפסקה **צמודה לשמאל**.
    // בלי המחלקה ה-`<p>` יורש `text-align: right` מ-`dir="rtl"` של המסך, וכל שורה
    // אנגלית **מתחילה** במקום אחר. ⚠️ הסריקה על ה-`<p>` שנושא `data-story-body`,
    // ⛔ ולא על הקובץ כולו — `text-left` במקום אחר ⛔ אינו הטענה הזאת.
    const body = SRC.match(/<p\s+[^>]*className="[^"]*"[\s\S]{0,200}?inert=/);
    expect(body, 'the reading paragraph must still be found by this scan').not.toBeNull();
    expect(body?.[0]).toContain('text-left');
  });

  it('⛔ the fix is alignment ONLY — ⛔ no hand-written `dir` or `lang` on that paragraph', () => {
    // `T-009` · `components/EnWord.test.ts`: שלושת המאפיינים נוסעים יחד דרך `<EnWord>`
    // בלבד. תיקון יישור שמוסיף `dir`/`lang` בכתב יד הוא בדיוק הפיזור שהשומר אוסר.
    const body = SRC.match(/<p\s+[^>]*className="[^"]*text-left[^"]*"[\s\S]{0,200}?inert=/);
    expect(body?.[0]).not.toMatch(/\slang=/);
    expect(body?.[0]).not.toMatch(/\sdir=/);
  });
});
