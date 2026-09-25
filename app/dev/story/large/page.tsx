import { StoryScreenView } from '@/components/StoryScreen';
import {
  FIXTURE_BODY_EN,
  FIXTURE_COUNTS,
  FIXTURE_GLOSSES,
  FIXTURE_KNOWN_LEMMAS,
  FIXTURE_QUESTION,
  FIXTURE_STORY_ID,
  FIXTURE_TITLE_EN,
} from '../story-fixture';

/**
 * 🔠 T-509ⓓ — the reading screen at the LARGEST text size («גדול», 20/42px).
 *
 * `check:mobile` measures it at 320/390/430: ⛔ horizontal scroll, and the four
 * conditions of `36 § 3` on every tap target at the size where a long word is most
 * likely to push the card wider than the screen. `initialTextSize` is a fixture-only prop
 * and beats `localStorage`, so this route writes nothing and asks the server for nothing
 * ⇒ ⛔ no EXPECTED_CONSOLE entry.
 */
export default function DevStoryLargePage() {
  return (
    <main className="mx-auto w-full max-w-md py-6">
      <StoryScreenView
        initialTextSize="lg"
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
            // השאלה נוסעת כדי שהמצב השני יהיה בר-הגעה מהפיקסטורה.
            question: FIXTURE_QUESTION,
          },
        }}
      />
    </main>
  );
}
