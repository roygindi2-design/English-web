'use client';

import { useState } from 'react';
import ArenaBattle from '@/components/ArenaBattle';
import ArenaCharacterChoice from '@/components/ArenaCharacterChoice';
import ArenaHome from '@/components/ArenaHome';
import type { ArenaCharacter } from '@/lib/core/arenaCharacter';

/**
 * T-181 · T-217 — **המעטפת, ו⛔ שום דבר מלבדה.** מחזיקה `'home' | 'character' | 'battle'`.
 *
 * ⛔ **⛔ אין כאן נתיב חדש, וזו הסיבה שזו קריאה של DEV ⛔ ולא של PM** (`RULES § 0.22`):
 * ניווט — לשונית, צומת בטבעת, ראוט — חוזר ל-PM. מצב פנימי ברכיב אחד מוסיף **אפס**
 * ראוטים ו**אפס** רשומות לכל טבלת ניווט ⇒ זהו **גבול מודול**, שהוא קריאה של DEV.
 *
 * **`37 § 7` — «מוצג פעם אחת, מסך מלא, לפני הקרב הראשון»:** `התחל קרב` עם `character: null`
 * פותח את הבחירה ⛔ בלי יציאה, ואחרי 200 ממשיך לקרב. `עיצוב דמות` פותח את אותו מסך
 * **עם** יציאה, וחוזר הביתה. ⚠️ החזרה ל-`'home'` ממקמת מחדש את `<ArenaHome>` ⇒ הוא שואל
 * שוב את נקודת הקצה של הבית ⇒ הכן מציג את הדמות מה**שרת**, ⛔ לא מעותק בלקוח — מקור אמת אחד.
 *
 * ⚠️ המעטפת ⛔ אינה מבקשת נתונים ו⛔ אינה מציירת — כל מסך טוען את שלו. הקרב מקבל את
 * הדמות כ-prop, ⛔ ואינו שואל עליה את השרת (נתיב הסיבוב ⛔ לא התרחב).
 */
type Screen = 'home' | 'character' | 'battle';

export default function ArenaShell(): React.JSX.Element {
  const [screen, setScreen] = useState<Screen>('home');
  const [character, setCharacter] = useState<ArenaCharacter | null>(null);
  const [next, setNext] = useState<Screen>('battle');

  if (screen === 'home') {
    return (
      <ArenaHome
        onStart={(s) => {
          setCharacter(s.character);
          setNext('battle');
          setScreen(s.character === null ? 'character' : 'battle');
        }}
        onDesign={(s) => {
          setCharacter(s.character);
          setNext('home');
          setScreen('character');
        }}
      />
    );
  }
  if (screen === 'character') {
    return (
      <ArenaCharacterChoice
        initial={character}
        onSaved={(c) => {
          setCharacter(c);
          setScreen(next);
        }}
        onBack={character === null ? undefined : () => setScreen('home')}
      />
    );
  }
  return <ArenaBattle character={character} />;
}
