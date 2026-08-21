import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  encountersHe,
  latestCollected,
  viewCollection,
  type CollectedWord,
} from './arcadeCollection';

const word = (id: string): CollectedWord => ({
  wordId: id, headword: 'ability', translationHe: 'יכולת',
  timesMissed: 3, firstSeenAt: '2026-08-19T00:00:00.000Z',
});

describe('§ 4.2יב — שני מצבים ריקים **שונים**, ⛔ ולא אחד', () => {
  it('אוסף ריק לגמרי ⇒ empty', () => {
    expect(viewCollection({ visible: [], hiddenCount: 0 })).toEqual({ kind: 'empty' });
  });
  it('הלומד הסתיר הכל ⇒ all_hidden, ⛔ ולא empty', () => {
    expect(viewCollection({ visible: [], hiddenCount: 4 })).toEqual({ kind: 'all_hidden' });
  });
  it('יש מה להציג ⇒ list', () => {
    const v = viewCollection({ visible: [word('w1')], hiddenCount: 9 });
    expect(v.kind).toBe('list');
  });
  it('⛔ ו-list נושאת את המילים כפי שהתקבלו, ⛔ בלי מיון מקומי', () => {
    const v = viewCollection({ visible: [word('w1'), word('w2')], hiddenCount: 0 });
    expect(v.kind === 'list' && v.words.map((w) => w.wordId)).toEqual(['w1', 'w2']);
  });
});

describe('«נפגשת N פעמים» — המספר מהשרת', () => {
  it('3 ⇒ המחרוזת נושאת את הספרה', () => {
    expect(encountersHe(3)).toContain('3');
  });
  it('1 ⇒ ⛔ אינה אומרת «1 פעמים»', () => {
    expect(encountersHe(1)).not.toContain('1 פעמים');
  });
});

describe('⛔ מדד ⓐ — ⛔ אפס שדה לימודי בשכבה הזאת', () => {
  // ⛔ סריקה על המקור הגולמי במכוון: כאן גם **הערה** שנוקבת בשדה לימודי היא כשל,
  // כי הבידוד של D-052 נמדד על הקובץ כולו ⛔ ולא רק על מה שרץ.
  const src = readFileSync('lib/core/arcadeCollection.ts', 'utf8');
  it.each(['word_progress', 'next_review_at', 'easiness', 'repetition',
           'self_marked_known', 'current_level', 'cefr'])('⛔ %s ⛔ אינו מופיע', (bad) => {
    expect(src.toLowerCase()).not.toContain(bad);
  });
});

describe('D-071ⓑ · T-133 — «המילה שאספת אתמול» היא הפריט האחרון, ⛔ ולא חלון זמן', () => {
  const at = (id: string, headword: string, firstSeenAt: string): CollectedWord => ({
    wordId: id, headword, translationHe: 'יכולת', timesMissed: 0, firstSeenAt,
  });

  it('יש פריט גלוי ⇒ הראשון ברשימה (`first_seen_at desc`) הוא הפִּין', () => {
    expect(
      latestCollected([
        at('w1', 'cat', '2026-08-20T10:00:00.000Z'),
        at('w2', 'dog', '2026-08-19T10:00:00.000Z'),
      ]),
    ).toEqual({ enText: 'cat', collectedAt: '2026-08-20T10:00:00.000Z' });
  });

  it('⛔ אין ולו פריט גלוי אחד ⇒ ⛔ אין שדה (`undefined`, ⛔ לא null ו⛔ לא מחרוזת ריקה)', () => {
    expect(latestCollected([])).toBeUndefined();
  });

  it('⛔ `headword` ריק ⇒ ⛔ אין פִּין — «אספת אתמול — » הוא משפט קטוע', () => {
    expect(latestCollected([at('w1', '', '2026-08-20T10:00:00.000Z')])).toBeUndefined();
  });

  it('⛔ הפונקציה ⛔ אינה ממיינת מחדש — הסדר הוא חוזה השאילתה', () => {
    // הקלט מוזרק בסדר «שגוי» בכוונה: ⛔ מיון מקומי היה מחזיר את `dog`.
    expect(
      latestCollected([
        at('w1', 'dog', '2026-08-01T00:00:00.000Z'),
        at('w2', 'cat', '2026-08-20T00:00:00.000Z'),
      ])?.enText,
    ).toBe('dog');
  });

  it('⛔ אין תגמול, ⛔ אין מונה ו⛔ אין רצף בשדה (D-071ⓑ)', () => {
    const latest = latestCollected([at('w1', 'cat', '2026-08-20T10:00:00.000Z')]);
    expect(Object.keys(latest ?? {}).sort()).toEqual(['collectedAt', 'enText']);
  });
});
