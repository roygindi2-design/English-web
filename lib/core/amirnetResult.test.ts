import { describe, expect, it } from 'vitest';
import { AMIRNET_CHAPTERS } from './amirnetSimulation';
import {
  CHAPTER_BREAKDOWN_HE,
  WEAKNESS_ADVICE_HE,
  chaptersDoneHe,
  chaptersDoneShortHe,
  isShortRun,
  resultRows,
  runCorrectHe,
  runCorrectShortHe,
  runTimeHe,
  runTypeStats,
  runWeakness,
  shortRunNoticeHe,
  type AmirnetChapterOutcome,
} from './amirnetResult';

/** The render's own six-chapter run, transcribed from `render_video_D.py:325-326` `res`. */
const FULL_RUN: readonly AmirnetChapterOutcome[] = [
  { chapterIndex: 0, correct: 4, answered: 4, elapsedSeconds: 186 },
  { chapterIndex: 1, correct: 3, answered: 4, elapsedSeconds: 216 },
  { chapterIndex: 2, correct: 3, answered: 5, elapsedSeconds: 852 },
  { chapterIndex: 3, correct: 2, answered: 3, elapsedSeconds: 324 },
  { chapterIndex: 4, correct: 2, answered: 3, elapsedSeconds: 348 },
  { chapterIndex: 5, correct: 4, answered: 4, elapsedSeconds: 180 },
];

/** `T-298`'s own failure scenario: the run stopped after five chapters. */
const FIVE_CHAPTER_RUN: readonly AmirnetChapterOutcome[] = FULL_RUN.slice(0, 5);

describe('T-298 — a run of five chapters renders FIVE rows and ⛔ never a «—» row', () => {
  it('⛔ does not invent the sixth chapter, and ⛔ does not throw on it', () => {
    expect(() => resultRows(FIVE_CHAPTER_RUN)).not.toThrow();
    expect(resultRows(FIVE_CHAPTER_RUN)).toHaveLength(5);
    expect(JSON.stringify(resultRows(FIVE_CHAPTER_RUN))).not.toContain('—');
  });

  it('and says so in a written Hebrew sentence, ⛔ not with empty rows (ⓓ)', () => {
    expect(isShortRun(FIVE_CHAPTER_RUN)).toBe(true);
    expect(isShortRun(FULL_RUN)).toBe(false);
    const notice = shortRunNoticeHe(FIVE_CHAPTER_RUN);
    expect(notice).toContain('5');
    expect(notice).toContain('6');
    expect(notice).not.toContain('—');
    expect(shortRunNoticeHe(FULL_RUN)).toBe('');
  });

  it('an empty run is a written sentence too — ⛔ never six blank rows', () => {
    expect(resultRows([])).toHaveLength(0);
    expect(isShortRun([])).toBe(true);
    expect(shortRunNoticeHe([])).not.toBe('');
  });
});

describe('T-298ⓐ — פירוט לכל פרק: נכונות מתוך סה״כ AND the real time (41 § 7)', () => {
  const rows = resultRows(FULL_RUN);

  it('six rows, in the 41 § 2 chapter order, each named by its own type', () => {
    expect(rows).toHaveLength(6);
    expect(rows.map((r) => r.chapterIndex)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(rows[0]?.positionHe).toBe('1. השלמת משפטים');
    expect(rows[2]?.positionHe).toBe('3. הבנת הנקרא');
    expect(rows[3]?.positionHe).toBe('4. ניסוח מחדש');
  });

  it('every row carries BOTH numbers `41 § 7` names — correctness and time', () => {
    expect(rows[0]?.correctLtr).toBe('4/4');
    expect(rows[0]?.correctHe).toBe('4 נכונות מתוך 4');
    // 186s ⇒ the render draws `3.1 דק׳` for this chapter (`render_video_D.py:325`).
    expect(rows[0]?.timeHe).toBe('3.1 דק׳');
    expect(rows[2]?.timeHe).toBe('14.2 דק׳');
  });

  it('the three standings are WORDS as well as a colour — state is ⛔ never colour alone', () => {
    expect(rows[0]?.standing).toBe('full');
    expect(rows[1]?.standing).toBe('near');
    expect(rows[2]?.standing).toBe('weak');
    for (const row of rows) {
      expect(row.standingHe.length, row.positionHe).toBeGreaterThan(0);
      expect(row.standingHe).not.toContain('—');
    }
    expect(rows[0]?.standingHe).not.toBe(rows[2]?.standingHe);
  });

  it('⛔ an outcome for a chapter that ⛔ does not exist is dropped, ⛔ never drawn', () => {
    const rogue = resultRows([{ chapterIndex: 9, correct: 1, answered: 1, elapsedSeconds: 1 }]);
    expect(rogue).toHaveLength(0);
  });

  it('the run totals are the SUM of what was measured, ⛔ and ⛔ nothing else', () => {
    expect(runCorrectHe(FULL_RUN)).toBe('18 נכונות מתוך 23');
    // 2106 seconds ⇒ 35.1 minutes. The six render chapters sum to 39 minutes of BUDGET;
    // this is the time actually spent, which is ⛔ not the same number.
    expect(runTimeHe(FULL_RUN)).toBe('35.1 דק׳');
    expect(chaptersDoneHe(FIVE_CHAPTER_RUN)).toBe('5 פרקים מתוך 6');
    expect(runCorrectShortHe(FULL_RUN)).toBe('18 מתוך 23');
    expect(chaptersDoneShortHe(FIVE_CHAPTER_RUN)).toBe('5 מתוך 6');
    expect(AMIRNET_CHAPTERS).toHaveLength(6);
  });

  it('⛔ NO score, ⛔ no score estimate and ⛔ no 50–150 anything (ⓒ · 41 § 9.2 is Roy\'s)', () => {
    const everything = JSON.stringify([
      resultRows(FULL_RUN),
      runWeakness(FULL_RUN),
      runCorrectHe(FULL_RUN),
      runTimeHe(FULL_RUN),
      CHAPTER_BREAKDOWN_HE,
    ]);
    for (const banned of ['אומדן', 'ציון', 'נקוד', 'נקודות', 'פטור', '134', '150']) {
      expect(everything, banned).not.toContain(banned);
    }
  });
});

describe('T-298ⓑ — the weakest type, decided in ONE place (constitution § 6)', () => {
  it('the run aggregates into the three type stats the existing chooser reads', () => {
    // sc = chapters 1, 2, 6 ⇒ 4+3+4 correct of 4+4+4; rc = chapter 3; rs = chapters 4, 5.
    expect(runTypeStats(FULL_RUN)).toEqual([
      { type: 'sc', answered: 12, correct: 11 },
      { type: 'rs', answered: 6, correct: 4 },
      { type: 'rc', answered: 5, correct: 3 },
    ]);
  });

  it('the weakness is the LOWEST rate, and it carries the run\'s own two lines', () => {
    // sc 91.7% · rs 66.7% · rc 60% ⇒ `rc` is the weak one in this run.
    const weakness = runWeakness(FULL_RUN);
    expect(weakness?.type).toBe('rc');
    expect(weakness?.titleHe).toBe('החולשה: הבנת הנקרא · 3 מתוך 5');
    expect(weakness?.adviceHe).toBe(WEAKNESS_ADVICE_HE);
  });

  it('⛔ a type the run never reached ⇒ ⛔ NO weakness — the screen ⛔ never guesses one', () => {
    // Two chapters only: `rs` and `rc` were never answered ⇒ there is ⛔ nothing to compare.
    expect(runWeakness(FULL_RUN.slice(0, 2))).toBeNull();
  });

  it('⛔ a tie is ⛔ not a weakness either', () => {
    const tied: readonly AmirnetChapterOutcome[] = [
      { chapterIndex: 0, correct: 2, answered: 4, elapsedSeconds: 60 },
      { chapterIndex: 2, correct: 2, answered: 4, elapsedSeconds: 60 },
      { chapterIndex: 3, correct: 2, answered: 4, elapsedSeconds: 60 },
    ];
    expect(runWeakness(tied)).toBeNull();
  });
});
