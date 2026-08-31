'use client';

import { useState } from 'react';
import ArenaBattle from '@/components/ArenaBattle';
import ArenaHome from '@/components/ArenaHome';

/**
 * T-181 — **המעטפת, ו⛔ שום דבר מלבדה.** מחזיקה `'home' | 'battle'` ⛔ ותו לא.
 *
 * ⛔ **⛔ אין כאן נתיב חדש, וזו הסיבה שזו קריאה של DEV ⛔ ולא של PM** (`RULES § 0.22`):
 * ניווט — לשונית, צומת בטבעת, ראוט — חוזר ל-PM. מצב פנימי ברכיב אחד מוסיף **אפס**
 * ראוטים ו**אפס** רשומות לכל טבלת ניווט ⇒ זהו **גבול מודול**, שהוא קריאה של DEV.
 *
 * ⚠️ המעטפת ⛔ אינה מבקשת נתונים ו⛔ אינה מציירת — `<ArenaHome>` טוען את מצבו,
 * ו-`<ArenaBattle>` את שלו. שני מסכים, שני שומרים, ⛔ ואפס מצב משותף.
 */
export default function ArenaShell(): React.JSX.Element {
  const [screen, setScreen] = useState<'home' | 'battle'>('home');
  return screen === 'home' ? <ArenaHome onStart={() => setScreen('battle')} /> : <ArenaBattle />;
}
