'use client';

import { StoryEndFixture } from '../story-end-fixture';

/** ➡️ T-494ⓓ — מסך הסיום אחרי שהקריאה נשמרה: «לסיפור הבא» לצד «חזרה לעולם». */
export default function DevStoryEndPage() {
  return <StoryEndFixture nextUnread={9} />;
}
