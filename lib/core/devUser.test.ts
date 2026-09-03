import { describe, expect, it } from 'vitest';
import { DEV_USER_MIN_PASSWORD, devUserGate } from './devUser';

/**
 * D-057 · T-113 — משתמש בדיקה לפיתוח.
 *
 * ⚠️ **התנגדות ה-PM וה-Critic נרשמה ונדחתה במפורש על ידי הבעלים** (D-057). זו
 * החלטת סיכון של רוי וזו סמכותו. ⇒ מה שהקוד **כן** אחראי עליו הוא שההחלטה תיאכף
 * **בדיוק כפי שנוסחה** ⛔ ולא רחב ממנה בפסיק אחד.
 *
 * **הכלל המחייב, מילה במילה מ-D-057:** «⛔ הפיצ׳ר נכשל **סגור**: משתנה חסר ⇒ אין
 * משתמש, ⛔ ולא ברירת מחדל שמייצרת אותו». ⇒ **`{open:false}` הוא ברירת המחדל,
 * ו-`{open:true}` דורש שלושה תנאים בו-זמנית.** הבדיקה האחרונה כאן היא האינווריאנט
 * הזה על **כל** צירוף, ⛔ ולא על דוגמה שבחרתי.
 *
 * ⛔ **ולמה `production` נבדק ראשון:** הודעת «לא הוגדר» היא **אורקל** — היא
 * מלמדת שהפיצ׳ר קיים ומה חסר כדי להפעיל אותו. בייצור היא ⛔ לעולם לא נפלטת.
 */
const GOOD = { email: 'dev@example.test', password: 'a-long-enough-secret' };

describe('devUserGate (D-057 · T-113)', () => {
  it('⛔ is closed in production, even when both variables are set', () => {
    expect(devUserGate({ nodeEnv: 'production', ...GOOD })).toEqual({ open: false, reason: 'production' });
  });

  it('⛔ answers "production" and ⛔ never "not_configured" in production', () => {
    // האורקל: בייצור, סביבה חסרה וסביבה מוגדרת חייבות להיראות זהות מבחוץ.
    expect(devUserGate({ nodeEnv: 'production', email: undefined, password: undefined }))
      .toEqual({ open: false, reason: 'production' });
  });

  it('⛔ is closed when either variable is missing, empty or whitespace', () => {
    for (const bad of [undefined, '', '   ']) {
      expect(devUserGate({ nodeEnv: 'development', email: bad, password: GOOD.password }).open).toBe(false);
      expect(devUserGate({ nodeEnv: 'development', email: GOOD.email, password: bad }).open).toBe(false);
    }
  });

  it('⛔ is closed for a short password — a dev account is still a real account', () => {
    const short = 'x'.repeat(DEV_USER_MIN_PASSWORD - 1);
    expect(devUserGate({ nodeEnv: 'development', email: GOOD.email, password: short }))
      .toEqual({ open: false, reason: 'unsafe_password' });
  });

  it('⛔ is closed when NODE_ENV is undefined — unknown is ⛔ not "safe"', () => {
    // ⚠️ נמדד ⛔ ולא הונח: `next build` מריץ קוד עם NODE_ENV='production', אבל
    // סקריפט או runner שמאבד את המשתנה מגיע לכאן עם `undefined`. ⛔ «לא ייצור»
    // ⛔ אינו נגזר מהיעדר ראיה — הוא נדרש **מפורשות**.
    expect(devUserGate({ nodeEnv: undefined, ...GOOD })).toEqual({ open: false, reason: 'production' });
  });

  it('opens, and trims the address, only when all three hold', () => {
    expect(devUserGate({ nodeEnv: 'development', email: '  Dev@Example.test ', password: GOOD.password }))
      .toEqual({ open: true, credentials: { email: 'dev@example.test', password: GOOD.password } });
  });

  it('⛔ never returns open:true without two non-empty strings — over every combination', () => {
    const envs = ['production', 'development', 'test', '', undefined];
    const values = [undefined, '', '  ', 'x', 'a-long-enough-secret'];
    for (const nodeEnv of envs) {
      for (const email of values) {
        for (const password of values) {
          const gate = devUserGate({ nodeEnv, email, password });
          if (!gate.open) continue;
          expect(nodeEnv).toBe('development');
          expect(gate.credentials.email.length).toBeGreaterThan(0);
          expect(gate.credentials.password.length).toBeGreaterThanOrEqual(DEV_USER_MIN_PASSWORD);
        }
      }
    }
  });
});
