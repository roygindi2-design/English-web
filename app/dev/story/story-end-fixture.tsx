'use client';

import { StoryScreenView } from '@/components/StoryScreen';
import {
  FIXTURE_BODY_EN,
  FIXTURE_COUNTS,
  FIXTURE_GLOSSES,
  FIXTURE_KNOWN_LEMMAS,
  FIXTURE_QUESTION,
  FIXTURE_STORY_ID,
  FIXTURE_TITLE_EN,
} from './story-fixture';

/**
 * ➡️ T-494ⓓ — מסך הסיום **אחרי** שהקריאה נשמרה: «לסיפור הבא» לצד «חזרה לעולם».
 * המצב השני (הכול נקרא ⇒ ⛔ אין כפתור, ושורה אחת) יושב ב-`/dev/story/end/all`.
 *
 * ⛔ אין כאן בקשת שרת: «הקריאה נשמרה» מגיע כ-`initialReadSaved`, בדיוק כמו ש-
 * `/dev/story/done` מקבל את מצב השאלה כ-`initialPhase` ⇒ ⛔ אין רשומה ב-`EXPECTED_CONSOLE`.
 * ⚠️ `'use client'` ⛔ רק כי `onNextStory` הוא פונקציה, ופונקציה ⛔ אינה עוברת מרכיב שרת.
 */
export function StoryEndFixture({ nextUnread }: { nextUnread: number }) {
  return (
    <main className="mx-auto w-full max-w-md py-6">
      <StoryScreenView
        initialPhase="question"
        initialReadSaved
        onNextStory={() => undefined}
        state={{
          kind: 'ready',
          payload: {
            story: { id: FIXTURE_STORY_ID, titleEn: FIXTURE_TITLE_EN, bodyEn: FIXTURE_BODY_EN },
            index: 3,
            total: 12,
            level: 'A1',
            glosses: FIXTURE_GLOSSES,
            knownLemmas: FIXTURE_KNOWN_LEMMAS,
            counts: FIXTURE_COUNTS,
            question: FIXTURE_QUESTION,
            nextUnread,
          },
        }}
      />
    </main>
  );
}
