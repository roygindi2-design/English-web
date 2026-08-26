// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { StoryScreenView, type StoryPayload } from '@/components/StoryScreen';
import {
  FIXTURE_BODY_EN,
  FIXTURE_COUNTS,
  FIXTURE_GLOSSES,
  FIXTURE_KNOWN_LEMMAS,
  FIXTURE_QUESTION,
  FIXTURE_STORY_ID,
  FIXTURE_TITLE_EN,
} from '@/app/dev/story/story-fixture';

afterEach(cleanup);

/**
 * ⛔ **הפיקסטורה הזאת ⛔ אינה «כמו» נתוני המוצר — היא הצורה של החוט.** הלקח של 23/08
 * (`DEV.md`): 2,403 בדיקות היו ירוקות כי הפיקסטורה נבדלה מנתוני הייצור בממד אחד.
 *
 * ⚠️ **ו-F-133 הוכיחה שהמשפט הזה ⛔ לא הספיק:** עד 26/08 ישבה כאן שאלה **אמיתית**
 * מ-`story-questions-2026-08-25.jsonl` — אבל שאלתו של סיפור **אחר**, «The letter in
 * the book», מעל גוף שהוא «The library near the river». הבדיקה **קיבעה** את הזיווג
 * השגוי, ולכן 2,676 בדיקות ירוקות ⛔ לא יכלו לתפוס «שאלה בלי תשובה».
 * ⇒ הפיקסטורה כולה מיובאת עכשיו מ-`@/app/dev/story/story-fixture` — **אותו מקור בדיוק**
 * ששני מסכי `/dev/story` מרנדרים — ו-`story-fixture.test.ts` מודד אותו מול
 * `docs/design/render_video_A.py` ומול העיגון של השאלה בגוף. ⛔ אין כאן עותק שני.
 */
const PAYLOAD: StoryPayload = {
  story: { id: FIXTURE_STORY_ID, titleEn: FIXTURE_TITLE_EN, bodyEn: FIXTURE_BODY_EN },
  index: 3,
  total: 12,
  level: 'A1',
  glosses: FIXTURE_GLOSSES,
  knownLemmas: FIXTURE_KNOWN_LEMMAS,
  counts: FIXTURE_COUNTS,
  question: FIXTURE_QUESTION,
};

/** `Object.keys(FIXTURE_GLOSSES).length` · `FIXTURE_KNOWN_LEMMAS.length` — 7 ו-2. */
const GLOSS_COUNT = Object.keys(FIXTURE_GLOSSES).length;
const KNOWN_COUNT = FIXTURE_KNOWN_LEMMAS.length;

describe('T-202 — the question is a STATE, and the chrome survives the swap', () => {
  it('phase `reading` shows ⛔ no question', () => {
    render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    expect(screen.queryByText('שאלת הבנה')).toBeNull();
    expect(screen.getByText('סיפור 3 מתוך 12')).toBeTruthy();
  });

  it('one press on the primary action swaps the BODY and ⛔ keeps the chrome', () => {
    render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    fireEvent.click(screen.getByRole('button', { name: 'סיימתי לקרוא' }));
    expect(screen.getByText('שאלת הבנה')).toBeTruthy();
    // ⛔ THE POINT OF THE TEST: the chrome must still be there after the swap.
    expect(screen.getByText('סיפור 3 מתוך 12')).toBeTruthy();
    expect(
      screen.getByText(
        `${FIXTURE_COUNTS.newWords} מילים חדשות · ${FIXTURE_COUNTS.alreadyKnown} שכבר ידעת`,
      ),
    ).toBeTruthy();
  });

  it('⛔ the reading paragraph is gone once the question is up — it is a SWAP, ⛔ not an append', () => {
    const { container } = render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    expect(container.querySelector('[data-story-body]')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'סיימתי לקרוא' }));
    expect(container.querySelector('[data-story-body]')).toBeNull();
  });

  it('T-203 — the primary action names what it does, in each phase', () => {
    render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    expect(screen.getByRole('button', { name: 'סיימתי לקרוא' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'סיימתי לקרוא' }));
    expect(screen.getByRole('link', { name: 'חזרה לעולם' })).toBeTruthy();
  });

  it('⛔ leaving without answering is legal — the exit is live in BOTH phases', () => {
    render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} initialPhase="question" />);
    const exit = screen.getByRole('link', { name: 'חזרה לעולם' });
    expect(exit.hasAttribute('aria-disabled')).toBe(false);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('⛔ a story with ⛔ no question has ⛔ no second phase', () => {
    render(<StoryScreenView state={{ kind: 'ready', payload: { ...PAYLOAD, question: null } }} />);
    expect(screen.queryByRole('button', { name: 'סיימתי לקרוא' })).toBeNull();
    expect(screen.getByRole('link', { name: 'חזרה לעולם' })).toBeTruthy();
  });

  it('T-150 — the intro layer states what the learner ALREADY has', () => {
    render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    expect(GLOSS_COUNT).toBe(7);
    expect(KNOWN_COUNT).toBe(2);
    expect(
      screen.getByText(`בסיפור הזה ${GLOSS_COUNT} מילים. ${KNOWN_COUNT} מהן אתה כבר מכיר.`),
    ).toBeTruthy();
  });

  it('⛔ the intro layer belongs to the READING phase only', () => {
    render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} initialPhase="question" />);
    expect(screen.queryByText(new RegExp(`בסיפור הזה ${GLOSS_COUNT} מילים\\.`))).toBeNull();
  });
});
