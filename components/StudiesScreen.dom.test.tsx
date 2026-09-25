// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StudiesScreen from '@/components/StudiesScreen';
import type { LevelSummary } from '@/lib/core/levelSummary';

/**
 * 🔴 **`T-409` — «המיקום במסלול נשמר ונראה בכניסה הבאה» היא טענה על מה שיש ב-DOM
 * אחרי טעינה, ⛔ ולא על מה שכתוב במקור.**
 *
 * ⚠️ **ולמה קובץ שני לצד `StudiesScreen.test.ts`, ⛔ ולא עוד `describe` בתוכו:** זה
 * בדיוק הלקח של `F-224` ושל `F-282`. שומר-מקור קורא את **המחרוזת** `setActive(...)`
 * ⛔ בלי לדעת אם האפקט בכלל רץ, אם `places` הגיע לפניו, ואם עוגן ב-`hash` גבר עליו.
 * ‏`F-282` מדד בדיוק את המחיר: מצב שנבנה (`level_done`) ⛔ לא היה ניתן לרינדור בשום
 * מקום, ⇒ סגירת הממצא שמעליו נשענה כולה על קריאת קוד.
 *
 * ⛔ **הרשת ⛔ אינה נקראת כאן, ו⛔ אין `fetch` ממוקה**: `apiGet`/`apiPost`
 * (`lib/api/client.ts`) הם הגבול היחיד שהמסך חוצה ⇒ הם הדבר היחיד שמוחלף.
 *
 * ⛔ **ומה שהקובץ הזה ⛔ אינו טוען:** שהבקשה יצאה לרשת, שהטבלה קיימת, ושהגאומטריה
 * תקינה. ‏44px ו⛔ אפס גלילה אופקית הם `check:mobile`, על `/dev/tabs/studies/place`.
 */
const api = vi.hoisted(() => ({
  places: [] as unknown[],
  placesFail: false,
  /** `T-513` · ‏`/api/levels/summary` ⛔ לא חוזרת ⇒ המסך נשאר בחלון הטעינה. */
  summaryPending: false,
  posted: [] as { path: string; body: unknown }[],
}));

vi.mock('@/lib/api/client', () => ({
  apiGet: vi.fn(async (path: string) => {
    if (path === '/api/study/place') {
      if (api.placesFail) throw new Error('503');
      return { ok: true, places: api.places };
    }
    if (api.summaryPending) return new Promise(() => {});
    return { ok: true, level: 'A1', levels: LEVELS };
  }),
  apiPost: vi.fn(async (path: string, body: unknown) => {
    api.posted.push({ path, body });
    return { ok: true };
  }),
}));

const LEVELS: readonly LevelSummary[] = [
  { level: 'A1', totalInLevel: 300, known: 100, inReviewList: 10, unseen: 190 },
  { level: 'A2', totalInLevel: 80, known: 0, inReviewList: 0, unseen: 80 },
  { level: 'B1', totalInLevel: 20, known: 0, inReviewList: 0, unseen: 20 },
];

/** ‏jsdom ⛔ אינו ממש `scrollIntoView`, והרכיב קורא לו על כל החלפת שבב מאז `T-410`. */
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  api.places = [];
  api.placesFail = false;
  api.summaryPending = false;
  api.posted = [];
  vi.clearAllMocks();
});

function activeTabLabel(): string {
  return screen.getByRole('tab', { selected: true }).textContent?.trim() ?? '';
}

describe('ⓒ המסך נפתח על המקום השמור, ⛔ ולא על ראש הרשימה', () => {
  it('⛔ אין מקום שמור ⇒ `אוצר מילים`, בדיוק כמו לפני השורה', async () => {
    render(<StudiesScreen />);
    await waitFor(() => expect(screen.getAllByRole('tab')).toHaveLength(4));
    expect(activeTabLabel()).toContain('אוצר מילים');
  });

  it('🔴 המקום החדש ביותר מנצח — ⛔ ולא הראשון במערך ו⛔ לא ברירת המחדל', async () => {
    // ⛔ `אוצר מילים` ראשון **ו**הוא `STUDY_TRACKS[0]` ⇒ הבדיקה עוברת רק אם
    // `updatedAt` הוא שהכריע, ⛔ ולא סדר ההחזרה של המסד.
    api.places = [
      { track_id: 'vocabulary', module_id: 'A1', updated_at: '2026-09-16T08:00:00Z' },
      { track_id: 'reading', module_id: null, updated_at: '2026-09-17T08:00:00Z' },
    ];
    render(<StudiesScreen />);
    await waitFor(() => expect(activeTabLabel()).toContain('הבנת הנקרא'));
  });

  it("‏`+00:00` ו-`Z` הם אותו רגע — ההשוואה ⛔ אינה לקסיקוגרפית", async () => {
    api.places = [
      { track_id: 'reading', module_id: null, updated_at: '2026-09-17T08:00:00.000+00:00' },
      { track_id: 'grammar', module_id: null, updated_at: '2026-09-17T08:00:01Z' },
    ];
    render(<StudiesScreen />);
    await waitFor(() => expect(activeTabLabel()).toContain('דקדוק'));
  });

  it('⛔ שורה עם מזהה מסלול שאינו מוכר ⛔ אינה מפילה את המסך ו⛔ אינה נבחרת', async () => {
    api.places = [{ track_id: 'arena', module_id: null, updated_at: '2026-09-18T08:00:00Z' }];
    render(<StudiesScreen />);
    await waitFor(() => expect(screen.getAllByRole('tab')).toHaveLength(4));
    expect(activeTabLabel()).toContain('אוצר מילים');
  });

  it('⛔ קריאת המקום שנכשלה ⛔ אינה מוצגת ללומד — המסך נפתח כרגיל', async () => {
    api.placesFail = true;
    render(<StudiesScreen />);
    await waitFor(() => expect(screen.getAllByRole('tab')).toHaveLength(4));
    expect(activeTabLabel()).toContain('אוצר מילים');
    expect(screen.queryByText(/לא הצלחנו לטעון את ההתקדמות/)).toBeNull();
  });

  it('⛔ פעם אחת בלבד — הקשה מאוחרת על שבב אחר ⛔ אינה נשאבת חזרה', async () => {
    api.places = [{ track_id: 'reading', module_id: null, updated_at: '2026-09-17T08:00:00Z' }];
    render(<StudiesScreen />);
    await waitFor(() => expect(activeTabLabel()).toContain('הבנת הנקרא'));
    fireEvent.click(screen.getByRole('tab', { name: /כתיבה/ }));
    expect(activeTabLabel()).toContain('כתיבה');
    // ⛔ ⛔ ולא חזרה ל-`הבנת הנקרא` בסיבוב הרינדור הבא.
    await waitFor(() => expect(activeTabLabel()).toContain('כתיבה'));
  });

  it('‏`fixturePlaces` עוקף את הרשת — זה מה שמרנדר את המצב ב-`/dev`', async () => {
    render(
      <StudiesScreen
        fixtureLevels={LEVELS}
        fixturePlaces={[{ trackId: 'reading', moduleId: null, updatedAt: '2026-09-17T08:00:00Z' }]}
      />,
    );
    await waitFor(() => expect(activeTabLabel()).toContain('הבנת הנקרא'));
  });
});

describe('ⓐ המקום נכתב כשהפריט מתחיל — ⛔ ולא על כל הקשה', () => {
  it('הקשה על כרטיס מודול כותבת את המסלול **ואת המודול**', async () => {
    render(<StudiesScreen />);
    await waitFor(() => expect(screen.getAllByRole('tab')).toHaveLength(4));
    const card = await screen.findByText('רמה A1');
    fireEvent.click(card);
    expect(api.posted).toEqual([
      { path: '/api/study/place', body: { trackId: 'vocabulary', moduleId: 'A1' } },
    ]);
  });

  it('⛔ הקשה על שבב ⛔ אינה כותבת דבר — ⛔ סימנייה ⛔ אינה טלמטריה', async () => {
    render(<StudiesScreen />);
    await waitFor(() => expect(screen.getAllByRole('tab')).toHaveLength(4));
    fireEvent.click(screen.getByRole('tab', { name: /דקדוק/ }));
    fireEvent.click(screen.getByRole('tab', { name: /כתיבה/ }));
    expect(api.posted).toEqual([]);
  });

  it('⛔ פיקסטורה ⛔ אינה כותבת לרשת — `/dev` ⛔ אינו נוגע במסד', async () => {
    render(<StudiesScreen fixtureLevels={LEVELS} fixturePlaces={[]} />);
    const card = await screen.findByText('רמה A1');
    fireEvent.click(card);
    expect(api.posted).toEqual([]);
  });
});

describe('T-513 — חלון הטעינה ⛔ אינו מצב הכשל, והמודולים ⛔ אינם קופצים פנימה', () => {
  it('בזמן טעינה ⛔ אין `UNREACHABLE_HE` ב-DOM, ויש בדיוק 4 שלדי מודול', async () => {
    api.summaryPending = true;
    const { container } = render(<StudiesScreen />);
    await waitFor(() => expect(screen.getAllByRole('tab')).toHaveLength(4));
    expect(screen.queryByText(/לא הצלחנו לטעון את ההתקדמות/)).toBeNull();
    expect(container.querySelectorAll('[data-skeleton="module"]')).toHaveLength(4);
    expect(container.querySelector('[data-skeleton="metric"]')).not.toBeNull();
  });

  it('הטעינה נגמרה ⇒ השלדים יוצאים והמודולים האמיתיים נכנסים במקומם', async () => {
    const { container } = render(<StudiesScreen />);
    await screen.findByText('רמה A1');
    expect(container.querySelectorAll('[data-skeleton]')).toHaveLength(0);
  });

  it('⛔ השלד שייך ל`אוצר מילים` בלבד — מסלול בלי קריאת רשת ⛔ אינו «נטען»', async () => {
    api.summaryPending = true;
    const { container } = render(<StudiesScreen />);
    await waitFor(() => expect(screen.getAllByRole('tab')).toHaveLength(4));
    fireEvent.click(screen.getByRole('tab', { name: /דקדוק/ }));
    expect(container.querySelectorAll('[data-skeleton]')).toHaveLength(0);
  });
});
