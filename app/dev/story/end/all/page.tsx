'use client';

import { StoryEndFixture } from '../../story-end-fixture';

/** ➡️ T-494ⓒⓓ — כל הסיפורים ברמה נקראו ⇒ ⛔ אין «לסיפור הבא», ושורה אחת שאומרת זאת. */
export default function DevStoryEndAllPage() {
  return <StoryEndFixture nextUnread={0} />;
}
