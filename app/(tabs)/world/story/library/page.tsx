import StoryLibrary from '@/components/StoryLibrary';

export const metadata = { title: 'ספריית הסיפורים' };

/**
 * `/world/story/library` — T-511 · `D-297`ⓒ · Figma `3342:2`. ⛔ Zero data access here,
 * the same call as `/world/story`: `<StoryLibrary>` reads `GET /api/world/story/library`,
 * which already runs the C-0032 guard order and answers `session_expired` as data.
 */
export default function WorldStoryLibraryPage() {
  return <StoryLibrary />;
}
