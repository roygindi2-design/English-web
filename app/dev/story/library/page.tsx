import { StoryLibraryView } from '@/components/StoryLibrary';
import type { StoryLibraryLevel } from '@/lib/core/storyLibrary';
import { storyLibraryFixture } from './library-fixture';

/**
 * 🗂️ T-511ⓔ — layout fixture for `check:mobile`: the library with the 12 stories (3 per level) of
 * `data/generated/stories-2026-08-21.jsonl`-shaped rows, one read and one «today».
 * ⛔ Not a product screen. Without Supabase env `/world/story/library` measures its
 * `session_expired` state only; this route asks the server for nothing ⇒ ⛔ no
 * EXPECTED_CONSOLE entry.
 */
export default function DevStoryLibraryPage() {
  const levels: readonly StoryLibraryLevel[] = storyLibraryFixture();
  return (
    <main className="mx-auto w-full max-w-md">
      <StoryLibraryView state={{ kind: 'ready', level: 'A1', levels }} />
    </main>
  );
}
