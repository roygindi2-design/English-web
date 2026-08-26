import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { storyLemma } from '@/lib/core/storyGate';
import { QUESTION_FUNCTION_WORDS } from '@/lib/core/storyQuestionGate';
import {
  FIXTURE_BODY_EN,
  FIXTURE_COUNTS,
  FIXTURE_KNOWN_LEMMAS,
  FIXTURE_QUESTION,
} from './story-fixture';

/**
 * **F-133ⓐ — השומר שהיה חסר.** ⛔ הבדיקה הזאת ⛔ אינה על רכיב: היא על **הזיווג**.
 * F-133 שרדה 2,676 בדיקות ירוקות כי ⛔ אף בדיקה ⛔ לא שאלה «האם השאלה הזאת שייכת לגוף
 * הזה» — הבדיקה היחידה שנגעה בשתיהן **קיבעה** את הזיווג השגוי.
 *
 * ⇒ כאן נקרא **קובץ הרנדר עצמו**, `docs/design/render_video_A.py`, ונמדד מולו. סטייה
 * של הפיקסטורה מהרנדר — בגוף או בשאלה — **מפילה את הבנייה**, וזה מה ש-`36 § 14.4`
 * («הרנדר מחייב») אומר כשהוא הופך לבדיקה ⛔ ולא לכוונה טובה.
 */
const RENDER_SRC = readFileSync('docs/design/render_video_A.py', 'utf8');

function renderBody(): string {
  const start = RENDER_SRC.indexOf('STORY = [');
  expect(start).toBeGreaterThan(-1);
  const block = RENDER_SRC.slice(start, RENDER_SRC.indexOf(']', start));
  return [...block.matchAll(/\("([^"]+)",/g)].map((m) => m[1]).join(' ');
}

function renderQuestion(): { questionEn: string; answersHe: string[]; correctIndex: number } {
  const start = RENDER_SRC.indexOf('QUESTION = (');
  expect(start).toBeGreaterThan(-1);
  const m = RENDER_SRC.slice(start).match(/^QUESTION = \(\s*"([^"]+)",\s*\[([^\]]+)\],\s*(\d+)\)/);
  expect(m).not.toBeNull();
  return {
    questionEn: m![1]!,
    answersHe: [...m![2]!.matchAll(/"([^"]+)"/g)].map((x) => x[1]!),
    correctIndex: Number(m![3]!),
  };
}

function renderKnown(): string[] {
  const m = RENDER_SRC.match(/^KNOWN = \{([^}]*)\}/m);
  expect(m).not.toBeNull();
  return [...m![1]!.matchAll(/"([^"]+)"/g)].map((x) => x[1]!);
}

describe('F-133ⓐ — הפיקסטורה היא הרנדר, מחרוזת מול מחרוזת', () => {
  it('הגוף הוא `STORY` של `render_video_A.py`', () => {
    expect(FIXTURE_BODY_EN).toBe(renderBody());
  });

  it('השאלה היא `QUESTION` של אותו קובץ — ⛔ ולא שורה ב-jsonl של סיפור אחר', () => {
    const q = renderQuestion();
    expect(FIXTURE_QUESTION.questionEn).toBe(q.questionEn);
    expect([...FIXTURE_QUESTION.answersHe]).toEqual(q.answersHe);
    expect(FIXTURE_QUESTION.correctIndex).toBe(q.correctIndex);
  });

  it('`knownLemmas` הוא `KNOWN` של אותו קובץ', () => {
    expect([...FIXTURE_KNOWN_LEMMAS].sort()).toEqual(renderKnown().sort());
  });

  it('שורת הסיכום היא המחרוזת שהרנדר מצייר', () => {
    const line = `${FIXTURE_COUNTS.newWords} מילים חדשות · ${FIXTURE_COUNTS.alreadyKnown} שכבר ידעת`;
    expect(RENDER_SRC).toContain(`"${line}"`);
  });
});

describe('F-133ⓐ — השאלה מעוגנת בגוף, ⛔ ולא בסיפור אחר', () => {
  /**
   * ⚠️ ⛔ **זה ⛔ אינו «בודק הבנה»** — אין דבר כזה בקוד, ו-`storyQuestionGate` אומר את
   * זה על עצמו במפורש. זה השומר המדיד: **כל** מילת תוכן בשאלה חייבת להיפתר אל אסימון
   * שנמצא בגוף, דרך `storyLemma` — הלמטייזר של המוצר עצמו, ⛔ ולא עותק שלו.
   * ⇒ «What did Maya **find** inside the **book**?» נפתרת: `found` שבגוף → `find`.
   * ⇒ שאלת F-133 «Who **wrote** the **letter**…» ⛔ נכשלת: ⛔ אין בגוף אסימון שנפתר
   *   ל-`letter` ⛔ ולו פעם אחת.
   */
  it('כל מילת תוכן בשאלה נפתרת אל אסימון שבגוף', () => {
    const bodyTokens = FIXTURE_BODY_EN.toLowerCase().match(/[a-z']+/g) ?? [];
    const content = (FIXTURE_QUESTION.questionEn.toLowerCase().match(/[a-z']+/g) ?? []).filter(
      (w) => !QUESTION_FUNCTION_WORDS.has(w),
    );
    expect(content.length).toBeGreaterThan(0);
    const ungrounded = content.filter(
      (w) => !bodyTokens.some((b) => b === w || storyLemma(b, new Set([w])) === w),
    );
    expect(ungrounded).toEqual([]);
  });
});

describe('F-133ⓐ — ⛔ אין עותק שני: שלושת הצרכנים מייבאים את המקור הזה', () => {
  const CONSUMERS = [
    'app/dev/story/page.tsx',
    'app/dev/story/done/page.tsx',
    'components/StoryScreen.dom.test.tsx',
  ];

  for (const file of CONSUMERS) {
    it(`${file} מייבא מ-story-fixture ו⛔ אינו כותב את השאלה בעצמו`, () => {
      const src = readFileSync(file, 'utf8');
      expect(src).toMatch(/story-fixture/);
      // ⛔ המחרוזת של F-133 ⛔ לא תחזור בדלת האחורית.
      expect(src).not.toMatch(/Who wrote the letter/);
      // ⛔ ולא שום שאלה שנכתבה במקום — `questionEn:` נשאר רק בקובץ הפיקסטורה.
      expect(src).not.toMatch(/questionEn:\s*'/);
    });
  }
});
