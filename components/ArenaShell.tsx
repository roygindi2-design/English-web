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
  /**
   * 🎒 **⟦20/09 · `C-0743` · `F-287`⟧ הציוד שהלומד זכה בו — ונזרק כאן.**
   *
   * 🔬 **נמדד, ⛔ ולא שוער.** המאגר בנוי **מקצה לקצה**: עמודת `unlocked_items`
   * ⇒ `app/api/arcade/home/route.ts` ⇒ `ArenaHomeState.unlockedItems` ⇒ ומסך
   * הבית **כבר לובש אותו** (`ArenaHome.tsx`). ‏`onStart(s)` מוסר לכאן את
   * **כל** האובייקט — ⛔ והרכיב הזה קרא ממנו **רק** את `s.character`.
   * ⇒ הפריט שהלומד הרוויח ⛔ **מעולם ⛔ לא נלבש בקרב**.
   *
   * 🔴 **ומה שזה פותח ⛔ אינו קוסמטי:** `[data-arena-part='cape']` ו-`[='weapon']`
   * קיימים **רק בתוך פריטי הציוד**, ⇒ `arena-sway` על הגלימה ותנועת ההמשך על
   * הנשק — שתי אנימציות שנבנו ב-`T-216`/`T-366` — ⛔ **מעולם ⛔ לא היה להן על
   * מה לחול בקרב**. הריג הנפיש אמנות שאינה שם.
   *
   * ⛔ **וההכרעה שהממצא חיכה לה היא «הגיבור לובש את המצטבר, היריב נשאר עירום»**
   * (`C-0742`, PM): הציוד הוא **פרס** (`37 § 9`), וליריב ⛔ אין מלאי.
   */
  const [items, setItems] = useState<readonly string[]>([]);

  if (screen === 'home') {
    return (
      <ArenaHome
        onStart={(s) => {
          setCharacter(s.character);
          setItems(s.unlockedItems);
          setNext('battle');
          setScreen(s.character === null ? 'character' : 'battle');
        }}
        onDesign={(s) => {
          setCharacter(s.character);
          // ⛔ **גם כאן, ⛔ ולא רק ב-`onStart`:** הלומד יכול לעבור לעיצוב ומשם
          //    לקרב, ⇒ מסלול שמדלג על השמירה היה משאיר אותו עירום **בדיוק
          //    במסלול שבו הוא הלך לבחור איך הוא נראה**.
          setItems(s.unlockedItems);
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
  return <ArenaBattle character={character} items={items} />;
}
